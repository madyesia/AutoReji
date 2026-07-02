"use strict";
/*
 * AutoReji — Bölüm Kur paneli (Faz 1) — BOŞLUK KAPATMA sürümü
 * Klipleri Premiere kendi yöntemiyle dizer (boşluklu olabilir), sonra
 * KESİN aşama: her klibin gerçek süresini oku → hepsini uç-uca kaydır (createMoveAction).
 * Read-back yarışı yok: bir kez oku, hesapla, tek transaction'da kapat.
 *
 * NOT: Bu dosyadaki TÜM Premiere (ppro) çağrıları, transaction'lar, lockedAccess,
 * TickTime, getTrackItems vb. AYNEN korunur. Yalnızca sunum/log katmanı (log/ok/err/
 * info/warn + runStep) hafif bir EVENT EMITTER'a (PANEL.emit) çevrildi; ui.js bu
 * olayları dinleyip premium UI çizer. Ham #log da aynen yazmaya devam eder.
 */
const ppro = require("premierepro");
const uxp = require("uxp");

// ── Hafif olay yayıncı (premium UI katmanı ui.js bunu dinler) ───────────────
const PANEL = {
  _subs: {},
  on(ev, fn) { (this._subs[ev] || (this._subs[ev] = [])).push(fn); },
  emit(ev, ...a) { (this._subs[ev] || []).forEach((f) => { try { f(...a); } catch (_) {} }); },
};
if (typeof window !== "undefined") window.PANEL = PANEL;

// Faz 0'da kilitlenen matchName'ler (regex fallback'li)
const CROSS_PRIMARY = "AE.ADBE Cross Dissolve New";
const DIP_PRIMARY = "AE.ADBE Dip To Black";
function resolveTransitionNames(names) {
  const cross = names.find((n) => n === CROSS_PRIMARY) || names.find((n) => /cross.?dissolve/i.test(n)) || names.find((n) => /dissolve/i.test(n));
  const dip = names.find((n) => n === DIP_PRIMARY) || names.find((n) => /dip.?to.?black/i.test(n)) || names.find((n) => /dip.*black/i.test(n));
  return { cross, dip };
}

// Aktif adım takibi: info() çağrıları ilgili adımın alt-detayına (substep) akar.
let CURRENT_STEP = null;

function log(msg, color, level) {
  const el = document.querySelector("#log");
  if (el) {
    const line = document.createElement("div");
    if (color) line.style.color = color;
    line.textContent = msg;
    el.appendChild(line);
    el.scrollTop = el.scrollHeight;
  }
  PANEL.emit("log", msg, level || "info");
}
const ok = (m) => log("✓ " + m, "#7ddc8f", "ok");
// Adım DIŞINDAKİ hata/uyarılar ("Açık proje yok", "Pano boş"…) yalnız günlüğe düşüyordu →
// kullanıcı butona basıp hiçbir şey olmadığını sanıyordu. Adım içindekiler step-error ile
// zaten görünür; o yüzden toast yalnız CURRENT_STEP == null iken (çifte bildirim olmasın).
const err = (m) => {
  log("✗ " + m, "#ff8f8f", "err");
  if (CURRENT_STEP == null) PANEL.emit("toast", "err", m);
};
const info = (m) => {
  log(m, "#cfd6e6", "info");
  if (CURRENT_STEP != null) PANEL.emit("step-substep", CURRENT_STEP, m);
};
const warn = (m) => {
  log("⚠ " + m, "#ffd9a0", "warn");
  if (CURRENT_STEP == null) PANEL.emit("toast", "err", "⚠ " + m);
};
const clearLog = () => {
  const el = document.querySelector("#log");
  if (el) el.innerHTML = "";
  PANEL.emit("reset");
};
const basename = (p) => (p || "").split("/").pop();

async function runStep(id, label, fn) {
  CURRENT_STEP = id;
  PANEL.emit("step-start", id, label);
  info("▶ " + label + " …");
  const t0 = Date.now();
  try {
    const r = await fn();
    PANEL.emit("step-done", id, { ms: Date.now() - t0 });
    ok(label);
    return r;
  } catch (e) {
    PANEL.emit("step-error", id, e && e.message ? e.message : String(e));
    err("HATA [" + label + "]: " + (e && e.message ? e.message : e));
    throw new Error(label);
  } finally {
    CURRENT_STEP = null;
  }
}

async function getProject() {
  const p = await ppro.Project.getActiveProject();
  if (!p) { err("Açık proje yok. File > New > Project."); return null; }
  return p;
}

async function listTransitions() {
  try {
    const names = await ppro.TransitionFactory.getVideoTransitionMatchNames();
    info("Toplam " + names.length + " geçiş:");
    names.forEach((n, i) => info("  [" + i + "] " + n));
  } catch (e) { err("Geçiş adları alınamadı: " + e); }
}

// Oturum-içi saklı doğrulanmış manifest (loadAndPreview yazar, runBuild okur).
let LOADED_MANIFEST = null;
// "Bölümü Kur" yeniden-giriş kilidi: kurulum sürerken ikinci tık iç içe ikinci
// pipeline başlatıyordu (çifte import/sequence). Bayrak wire()'daki sarmalayıcıda yönetilir.
let BUILD_RUNNING = false;

// Dosya seçici (file) veya yapıştırılan metin (paste) → ham obje.
// source='file' → getFileForOpening akışı (sağlamlaştırıldı); source='paste' → textarea JSON.parse.
//
// PİCKER SAĞLAMLAŞTIRMA (Premiere UXP, developer.adobe.com filesystem-operations recipe):
//  • Önerilen çağrı `{ initialDomain: domains.userDesktop, types: fileTypes.text }`.
//  • `types: ["json"]` gibi HAM uzantı dizisi bazı Premiere build'lerinde picker'ı boş/
//    sessiz no-op yapabilir → bunun yerine fileTypes.all (varsa) ile HER dosyayı göster,
//    yoksa argümansız çağır (yine her dosya). .json zaten listelenir.
//  • storage/localFileSystem alt-modülleri sürüme göre uxp.storage altında VEYA
//    require('uxp').storage.localFileSystem ile gelir; ikisini de güvenli çöz.
//  • getFileForOpening'i try/catch'siz BIRAKMA — hata yukarı (loadAndPreview) taşınır,
//    kullanıcı "hiçbir şey olmadı" değil net mesaj görür.
async function loadManifest(source) {
  if (source === "paste") {
    const ta = document.querySelector("#paste-json");
    const txt = ta ? String(ta.value || "").trim() : "";
    if (!txt) throw new Error("Yapıştırılan metin boş — manifest JSON'unu textarea'ya yapıştır.");
    return JSON.parse(txt);   // throw → loadAndPreview yakalar
  }
  // source === "file" (varsayılan)
  const storage = (uxp && uxp.storage) ? uxp.storage : (require("uxp").storage);
  if (!storage || !storage.localFileSystem) {
    throw new Error("Dosya sistemi erişilemiyor (UXP storage yok) — JSON'u yapıştırma yolunu kullan.");
  }
  const lfs = storage.localFileSystem;
  const fileTypes = storage.fileTypes;
  const domains = storage.domains;

  // En geniş/standart seçenek kümesini kur (boş picker'ı önler).
  const opts = {};
  if (domains && domains.userDesktop) opts.initialDomain = domains.userDesktop;
  if (fileTypes && fileTypes.all) opts.types = fileTypes.all;          // her dosya (.json dahil)
  else if (fileTypes && fileTypes.text) opts.types = fileTypes.text;  // metin (json metin sayılır)
  // fileTypes hiç yoksa opts.types verme → argümansız picker (yine her dosya)

  let file;
  try {
    file = await lfs.getFileForOpening(opts);
  } catch (e) {
    // Bazı sürümler bilinmeyen opsiyona takılabilir → argümansız son bir deneme.
    try {
      file = await lfs.getFileForOpening();
    } catch (e2) {
      throw new Error("Dosya seçici açılamadı: " + ((e2 && e2.message) || e2) + " — JSON'u yapıştırma yolunu kullan.");
    }
  }
  if (!file) return null;     // kullanıcı iptal etti (loadAndPreview "İptal." gösterir)
  let text;
  try {
    text = await file.read();
  } catch (e) {
    throw new Error("Seçilen dosya okunamadı: " + ((e && e.message) || e));
  }
  return JSON.parse(text);    // bozuk JSON → throw, loadAndPreview yakalar
}

// Hafif doğrulama: clips dizi + en az 1 etkin klip; episode.name / sequence.fps düşse de devam.
function validateManifest(obj) {
  if (!obj || typeof obj !== "object") throw new Error("Manifest bir JSON nesnesi değil.");
  if (!Array.isArray(obj.clips)) throw new Error("Manifest 'clips' dizisi yok.");
  const enabled = obj.clips.filter((c) => c && c.enabled !== false);
  if (!enabled.length) throw new Error("Etkin klip yok.");
  for (const c of enabled) {
    const sc = c.scene != null ? c.scene : c.index;
    if (typeof c.file !== "string" || !c.file) throw new Error("Klip #" + sc + ": dosya yolu (file) eksik.");
    if (!isFinite(c.in) || !isFinite(c.out) || c.in >= c.out) throw new Error("Klip #" + sc + ": geçersiz in/out (" + c.in + " → " + c.out + ").");
  }
  return { enabledCount: enabled.length };
}

// Geriye dönük uyumluluk: eski isimle çağrılan yerler için ince sarmalayıcı.
async function pickManifest() {
  return loadManifest("file");
}

async function findImportedClips(project, paths) {
  const root = await project.getRootItem();
  const all = await root.getItems();
  const byKey = {};
  for (const it of all) {
    const cl = ppro.ClipProjectItem.cast(it);
    if (!cl) continue;
    let mp = null;
    try { mp = await cl.getMediaFilePath(); } catch (_) {}
    const entry = { item: it, clip: cl };
    if (mp) byKey[basename(mp)] = entry;
    if (!(it.name in byKey)) byKey[it.name] = entry;
  }
  const out = [], missing = [];
  for (const p of paths) {
    const base = basename(p);
    const e = byKey[base] || byKey[base.replace(/\.mp4$/i, "")];
    if (!e) missing.push(base); else out.push(e);
  }
  return { out, missing };
}

async function waitForMedia(items) {
  for (let attempt = 1; attempt <= 25; attempt++) {
    let notReady = 0;
    for (const it of items) {
      let secs = 0;
      try { const m = await it.clip.getMedia(); if (m) { const d = await m.duration; secs = d ? d.seconds : 0; } } catch (_) {}
      if (secs < 1) notReady++;
    }
    if (notReady === 0) { info("   tüm medya hazır (" + attempt + ". kontrol)"); return true; }
    info("   medya yükleniyor… " + notReady + " bekliyor (" + attempt + ")");
    await new Promise((r) => setTimeout(r, 1500));
  }
  return false;
}

// Boşlukları TICK hassasiyetiyle ölç — 1 tick'lik mikro boşluğu bile yakalar (kare-altı dahil).
async function measureGaps(seq) {
  const TPF = Math.round(254016000000 / 24);
  const vt = await seq.getVideoTrack(0);
  const ti = await vt.getTrackItems(ppro.Constants.TrackItemType.CLIP, false);
  let gaps = 0, maxTicks = 0;
  const first = [];
  let prevEnd = null;
  for (let i = 0; i < ti.length; i++) {
    const start = Math.round(Number((await ti[i].getStartTime()).ticksNumber));
    const end = Math.round(Number((await ti[i].getEndTime()).ticksNumber));
    if (prevEnd !== null) {
      const g = start - prevEnd;                       // >0 boşluk, <0 bindirme
      if (g > 0) { gaps++; if (g > maxTicks) maxTicks = g; if (first.length < 10) first.push("#" + (i + 1) + ":" + g + "tick"); }
    }
    prevEnd = end;
  }
  return { count: ti.length, gaps, maxTicks, maxFrames: (maxTicks / TPF).toFixed(3), first };
}

const TICKS_PER_SEC = 254016000000;            // Premiere sabiti: tick/saniye

// Bir track'teki tüm klipleri uç-uca taşır — TAM SAYI TICK ile (kare-tam, ALT-KARE BOŞLUK YOK).
// Saniye (ondalık) ile taşımak kareye birebir oturmaz → görünmez "mikro boşluk" kalır ve
// Premiere o kesime İKİ TARAFLI (ortalı) geçiş koyamaz, tek tarafa atar. Tick ile bu imkânsız.
// Video ve ses için AYRI çağrılır (link taşımayı takip etmiyor). Aynı süreler → sync korunur.
async function closeGapsOnTrack(project, track, FPS) {
  const TPF = Math.round(TICKS_PER_SEC / FPS);  // tick/kare (24fps → 10584000000, tam bölünür)
  const tis = await track.getTrackItems(ppro.Constants.TrackItemType.CLIP, false);
  const arr = [];
  for (const t of tis) {
    const startTicks = Math.round(Number((await t.getStartTime()).ticksNumber));
    const durTicks = Math.round(Number((await t.getDuration()).ticksNumber) / TPF) * TPF;  // süreyi tam kareye sabitle
    arr.push({ t, startTicks, durTicks });
  }
  arr.sort((a, b) => a.startTicks - b.startTicks);
  project.lockedAccess(() => {
    project.executeTransaction((ca) => {
      let posTicks = 0;
      for (const x of arr) {
        const offTicks = posTicks - x.startTicks;   // tam tamsayı tick farkı (≤0: sola)
        if (offTicks !== 0) ca.addAction(x.t.createMoveAction(ppro.TickTime.createWithTicks(String(offTicks))));
        posTicks += x.durTicks;                       // sonraki klip TAM buraya değer (0 boşluk)
      }
    }, "AutoReji: boşluk kapat (tick-tam)");
  });
  return arr.length;
}

// Bir klibin Motion > Scale değerini factor ile çarpar (siyah bar gidermek için büyütme).
// Mevcut değeri okuyup çarpar (birim 100/1.0 fark etmez). Okunamazsa atlar (güvenli).
async function setClipScale(project, trackItem, factor, debug) {
  let chain;
  try { chain = await trackItem.getComponentChain(); } catch (e) { return { ok: false, reason: "chain yok" }; }
  const count = chain.getComponentCount();
  let motion = null, motionName = "";
  const compNames = [];
  for (let i = 0; i < count; i++) {
    const comp = chain.getComponentAtIndex(i);
    let mn = ""; try { mn = (await comp.getMatchName()) || ""; } catch (_) {}
    let dn = ""; try { dn = (await comp.getDisplayName()) || ""; } catch (_) {}
    compNames.push(i + ":" + (mn || dn));
    const s = (mn + " " + dn).toLowerCase();
    if (!motion && s.indexOf("motion") >= 0) { motion = comp; motionName = mn || dn; }
  }
  if (debug) info("   bileşenler: " + compNames.join(" | "));
  if (!motion) return { ok: false, reason: "Motion yok" };
  let sp = null;
  const paramNames = [];
  const pc = motion.getParamCount ? motion.getParamCount() : 12;
  for (let j = 0; j < pc; j++) {
    let p; try { p = motion.getParam(j); } catch (_) { continue; }
    if (!p) continue;
    let pn = ""; try { pn = p.displayName || ""; } catch (_) {}
    if (!pn && p.getDisplayName) { try { pn = (await p.getDisplayName()) || ""; } catch (_) {} }
    paramNames.push(j + ":" + pn);
    const low = pn.toLowerCase();
    if (!sp && (low === "scale" || low === "ölçek" || (low.indexOf("scale") >= 0 && low.indexOf("width") < 0 && low.indexOf("height") < 0))) sp = p;
  }
  if (debug) info("   Motion(" + motionName + ") param: " + paramNames.join(" | "));
  if (!sp) return { ok: false, reason: "Scale param yok" };
  try { project.lockedAccess(() => { project.executeTransaction((ca) => { ca.addAction(sp.createSetTimeVaryingAction(false)); }, "scale sabit"); }); } catch (_) {}
  // Mevcut değeri oku (şekil değişken olabilir); okunamazsa Scale = yüzde, varsayılan 100
  let curNum = null;
  try {
    const sv = await sp.getStartValue();
    curNum = (typeof sv === "number") ? sv
      : (sv && typeof sv.value === "number") ? sv.value
      : (sv && sv.value && typeof sv.value.value === "number") ? sv.value.value
      : null;
  } catch (_) {}
  const base = (typeof curNum === "number" && curNum > 0.5) ? curNum : 100;  // %100 varsay
  const target = base * factor;
  const kf = sp.createKeyframe(target);
  project.lockedAccess(() => { project.executeTransaction((ca) => { ca.addAction(sp.createSetValueAction(kf, true)); }, "AutoReji: scale"); });
  return { ok: true, param: (sp.displayName || "scale"), from: Math.round(base * 100) / 100, to: Math.round(target * 100) / 100 };
}

// (a) Manifest oku + doğrula + UI'a önizleme ver. Build BURADA BAŞLAMAZ.
//     Başarılı → LOADED_MANIFEST'e sakla + 'manifest-loaded' emit (UI 'Kur' sekmesine geçer).
//     Hata → 'manifest-error' emit (UI 'Yükle' sekmesinde kırmızı satır gösterir, geçiş YOK).
async function loadAndPreview(source) {
  let manifest;
  try {
    manifest = await loadManifest(source || "file");
  } catch (e) {
    const m = (e && e.message) ? e.message : String(e);
    log("✗ Manifest okunamadı: " + m, "#ff8f8f", "err");   // salt günlük — toast'ı aşağıda kendisi atıyor (çifte bildirim olmasın)
    // GÖRÜNÜR geri bildirim: Yükle sekmesindeki kırmızı satır + üstte toast (kullanıcı
    // "hiçbir şey olmadı" görmesin). Dosya seçici hatası da bu yola düşer.
    PANEL.emit("manifest-error", m);
    PANEL.emit("toast", "err", "Açılamadı: " + m);
    return;
  }
  // Dosya seçici iptali (null) → sekme değişmez, AMA görünür kısa bilgi ver.
  if (!manifest) {
    info("İptal — dosya seçilmedi.");
    PANEL.emit("toast", "info", "Dosya seçilmedi. İstersen JSON'u yapıştırabilirsin.");
    return;
  }

  let v;
  try {
    v = validateManifest(manifest);
  } catch (e) {
    const m = (e && e.message) ? e.message : String(e);
    log("✗ Manifest geçersiz: " + m, "#ff8f8f", "err");   // salt günlük — manifest-error satırı görünür bildirimi veriyor
    PANEL.emit("manifest-error", m);
    return;
  }

  LOADED_MANIFEST = manifest;
  const name = (manifest.episode && manifest.episode.name) || "AutoReji";
  const FPS = (manifest.sequence && manifest.sequence.fps) || 24;
  // Yaklaşık süre (manifest in/out tabanlı) — önizleme çipi için.
  let totalSec = 0;
  for (const c of manifest.clips.filter((c) => c && c.enabled !== false)) {
    const dur = (typeof c.out === "number" && typeof c.in === "number") ? (c.out - c.in) : 0;
    if (dur > 0) totalSec += dur;
  }
  info("Manifest yüklendi: " + name + " — " + v.enabledCount + " klip");
  PANEL.emit("manifest-loaded", { name: name, clips: v.enabledCount, fps: FPS, duration: totalSec });
}

// (b) Saklı manifeste 11-step pipeline'ı AYNEN çalıştır (kod gövdesi değişmedi).
async function runBuild() {
  if (!LOADED_MANIFEST) { err("Önce manifest yükle (Yükle sekmesi)."); return; }
  const manifest = LOADED_MANIFEST;

  PANEL.emit("reset");
  const project = await getProject();
  if (!project) return;

  try {
    const clips = (manifest.clips || []).filter((c) => c.enabled !== false);
    if (!clips.length) { err("Etkin klip yok."); return; }
    const name = (manifest.episode && manifest.episode.name) || "AutoReji";
    const FPS = (manifest.sequence && manifest.sequence.fps) || 24;
    info("Bölüm: " + name + " — " + clips.length + " klip");
    PANEL.emit("episode", { name: name, clips: clips.length, fps: FPS });

    // Yaklaşık toplam süre (manifest in/out tabanlı) → rapor çipi
    let totalSec = 0;
    for (const c of clips) {
      const dur = (typeof c.out === "number" && typeof c.in === "number") ? (c.out - c.in) : 0;
      if (dur > 0) totalSec += dur;
    }
    if (totalSec > 0) PANEL.emit("report", { duration: totalSec });

    await runStep("import", "1) Import (" + clips.length + ")", async () => {
      if (!(await project.importFiles(clips.map((c) => c.file), true))) throw new Error("importFiles false");
    });

    const items = await runStep("map", "2) Proje öğelerini eşle", async () => {
      const { out, missing } = await findImportedClips(project, clips.map((c) => c.file));
      if (missing.length) throw new Error(missing.length + " bulunamadı: " + missing.slice(0, 4).join(", "));
      return out;
    });

    await runStep("media", "2.5) Medya hazır bekleniyor", async () => {
      if (!(await waitForMedia(items))) warn("Bazı medya yüklenmedi; devam.");
    });

    await runStep("trim", "3) Kırpma (in/out, kare-hizalı, " + items.length + ")", async () => {
      const inS = (c) => Math.round(c.in * FPS) / FPS;
      const outS = (c) => Math.round(c.out * FPS) / FPS;
      project.lockedAccess(() => {
        project.executeTransaction((ca) => {
          for (let i = 0; i < items.length; i++) {
            ca.addAction(items[i].clip.createSetInOutPointsAction(
              ppro.TickTime.createWithSeconds(inS(clips[i])),
              ppro.TickTime.createWithSeconds(outS(clips[i]))));
          }
        }, "AutoReji: kırpma");
      });
    });

    // 4) Premiere kendi yöntemiyle tüm klipleri dizsin (konum nasıl olursa olsun)
    const seq = await runStep("sequence", "4) Sequence + ham dizim (" + items.length + ")", async () => {
      const s = await project.createSequenceFromMedia(name, items.map((x) => x.clip));
      if (!s) throw new Error("sequence null");
      await project.setActiveSequence(s);
      return s;
    });

    // 5) KESİN AŞAMA — boşlukları kapat: VİDEO + SES katmanlarını ayrı ayrı uç-uca taşı
    await runStep("closegaps", "5) Boşlukları kapat (video + ses)", async () => {
      const vTrack = await seq.getVideoTrack(0);
      const nv = await closeGapsOnTrack(project, vTrack, FPS);
      let na = 0;
      try {
        const aTrack = await seq.getAudioTrack(0);
        if (aTrack) na = await closeGapsOnTrack(project, aTrack, FPS);
      } catch (e) { warn("ses katmanı taşınamadı: " + (e && e.message ? e.message : e)); }
      info("   video " + nv + " + ses " + na + " klip uç-uca taşındı");
    });

    // 6) ÖLÇÜM
    await runStep("measure", "6) Boşluk ölçümü", async () => {
      const vt = await seq.getVideoTrack(0);
      const ti = await vt.getTrackItems(ppro.Constants.TrackItemType.CLIP, false);
      info("   timeline " + ti.length + " klip");
      for (let i = 0; i < Math.min(4, ti.length); i++) {
        const s = (await ti[i].getStartTime()).seconds, e = (await ti[i].getEndTime()).seconds;
        info("   #" + (i + 1) + " start=" + s.toFixed(2) + " end=" + e.toFixed(2) + " len=" + (e - s).toFixed(2));
      }
      const g = await measureGaps(seq);
      PANEL.emit("report", { gaps: g.gaps, maxTicks: g.maxTicks });
      info("   MİKRO BOŞLUK: " + g.gaps + (g.gaps ? " (en büyük " + g.maxTicks + " tick = " + g.maxFrames + " kare)" : ""));
      if (g.gaps) warn(g.first.join(" "));
      else ok("Tam kare hizası — alt-kare boşluk bile YOK 🎉");
    });

    // 7) Geçişler (manifest transition_in) — tek transaction
    await runStep("transitions", "7) Geçişler", async () => {
      const names = await ppro.TransitionFactory.getVideoTransitionMatchNames();
      const { cross, dip } = resolveTransitionNames(names);
      info("   Cross=" + cross + "  Dip=" + dip);
      const vt = await seq.getVideoTrack(0);
      const trackItems = await vt.getTrackItems(ppro.Constants.TrackItemType.CLIP, false); // zaman sırasında
      const adds = [];
      let cut = 0, fade = 0, black = 0;
      const n = Math.min(clips.length, trackItems.length);
      for (let i = 0; i < n; i++) {
        const t = clips[i].transition_in;
        if (!t || !t.type) continue;
        const nm = t.type === "black" ? dip : cross;
        if (!nm) continue;
        // rapor sayımı: black=Dip To Black, fade=tek-taraflı dissolve, geri kalan cut (cross)
        if (t.type === "black") black++;
        else if (t.type === "fade" || t.single === true) fade++;
        else cut++;
        const vtr = await ppro.TransitionFactory.createVideoTransition(nm);
        const opts = ppro.AddTransitionOptions();
        opts.setApplyToStart(true);                 // bu klibin BAŞ kenarına = önceki ile arasındaki kesime
        try { opts.setForceSingleSided(false); } catch (_) {}  // İKİ TARAFLI = kesimde ORTALI (asla siyahtan)
        if (t.dur) {
          const durF = Math.max(1, Math.round(t.dur * FPS));   // tam kareye hizala (manifest yuvarlamasını sıfırla)
          opts.setDuration(ppro.TickTime.createWithSeconds(durF / FPS));
        }
        adds.push({ ti: trackItems[i], vt: vtr, opts });
      }
      project.lockedAccess(() => {
        project.executeTransaction((ca) => {
          for (const a of adds) ca.addAction(a.ti.createAddVideoTransitionAction(a.vt, a.opts));
        }, "AutoReji: geçişler");
      });
      PANEL.emit("report", { transitions: { cut: cut, fade: fade, black: black } });
      info("   " + adds.length + " geçiş eklendi");
    });

    // 8) Intro/Outro fade (opsiyonel — hata build'i bozmaz)
    PANEL.emit("step-start", "introoutro", "8) Intro/Outro fade");
    try {
      const names = await ppro.TransitionFactory.getVideoTransitionMatchNames();
      const { dip } = resolveTransitionNames(names);
      const vt = await seq.getVideoTrack(0);
      const ti = await vt.getTrackItems(ppro.Constants.TrackItemType.CLIP, false);
      if (dip && ti.length) {
        // Süre 0 / yok = KAPALI (kanal sahibi tercihi; config.toml intro_fade/outro_fade = 0).
        // ⚠️ `|| 1.0` KULLANMA: 0 falsy olduğundan, kullanıcı kapattığı hâlde zorla siyah fade eklerdi.
        const introDur = (manifest.intro && typeof manifest.intro.fade_in_from_black === "number") ? manifest.intro.fade_in_from_black : 1.0;
        const outroDur = (manifest.outro && typeof manifest.outro.fade_out_to_black === "number") ? manifest.outro.fade_out_to_black : 1.5;
        const vIn = introDur > 0 ? await ppro.TransitionFactory.createVideoTransition(dip) : null;
        const vOut = outroDur > 0 ? await ppro.TransitionFactory.createVideoTransition(dip) : null;
        let oIn = null, oOut = null;
        if (vIn) { oIn = ppro.AddTransitionOptions(); oIn.setApplyToStart(true); oIn.setDuration(ppro.TickTime.createWithSeconds(introDur)); try { oIn.setForceSingleSided(true); } catch (_) {} }
        if (vOut) { oOut = ppro.AddTransitionOptions(); oOut.setApplyToStart(false); oOut.setDuration(ppro.TickTime.createWithSeconds(outroDur)); try { oOut.setForceSingleSided(true); } catch (_) {} }
        if (vIn || vOut) {
          project.lockedAccess(() => {
            project.executeTransaction((ca) => {
              if (vIn) ca.addAction(ti[0].createAddVideoTransitionAction(vIn, oIn));
              if (vOut) ca.addAction(ti[ti.length - 1].createAddVideoTransitionAction(vOut, oOut));
            }, "AutoReji: intro/outro");
          });
          ok("8) Intro/Outro fade eklendi (" + introDur + "/" + outroDur + "s)");
        } else {
          ok("8) Intro/Outro kapalı (manifest: 0) — atlandı");
        }
      }
      PANEL.emit("step-done", "introoutro", {});
    } catch (e) {
      warn("Intro/Outro atlandı: " + (e && e.message ? e.message : e));
      PANEL.emit("step-done", "introoutro", { skipped: true });
    }

    // 8.5) Crop siyah bar gider — scale>1.0 olan kliplere Motion>Scale uygula (non-fatal)
    PANEL.emit("step-start", "crop", "8.5) Crop (siyah bar)");
    try {
      const vt = await seq.getVideoTrack(0);
      const ti = await vt.getTrackItems(ppro.Constants.TrackItemType.CLIP, false);
      const targets = [];
      for (let i = 0; i < clips.length && i < ti.length; i++) {
        const sc = clips[i].scale || 1.0;
        if (sc > 1.0) targets.push({ ti: ti[i], factor: sc });
      }
      if (targets.length) {
        info("▶ Crop: " + targets.length + " klip büyütülecek (siyah bar) …");
        let done = 0, firstMsg = "";
        for (let k = 0; k < targets.length; k++) {
          const r = await setClipScale(project, targets[k].ti, targets[k].factor, k === 0);
          if (r.ok) { done++; if (!firstMsg) firstMsg = r.param + " " + r.from + "→" + r.to; }
          else if (!firstMsg) firstMsg = "atlandı (" + r.reason + ")";
        }
        if (done) ok("Crop: " + done + "/" + targets.length + " klip büyütüldü | ilk: " + firstMsg);
        else warn("Crop uygulanamadı: " + firstMsg);
        PANEL.emit("report", { crop: done });
      }
      PANEL.emit("step-done", "crop", {});
    } catch (e) {
      warn("Crop atlandı: " + (e && e.message ? e.message : e));
      PANEL.emit("step-done", "crop", { skipped: true });
    }

    // 9) Geçişler boşluk yaptı mı? son kontrol
    await runStep("verify", "9) Son boşluk kontrolü", async () => {
      const g = await measureGaps(seq);
      PANEL.emit("report", { gaps: g.gaps, maxTicks: g.maxTicks });
      info("   MİKRO BOŞLUK (geçişlerden sonra): " + g.gaps + (g.gaps ? " — " + g.first.join(" ") : " 🎉"));
    });

    log("———————————————", "#5a6880");
    ok("BİTTİ — RENDER YOK. Klipler + geçişler + intro/outro, native stereo, boşluksuz.");
    PANEL.emit("done", { name: name, clips: clips.length, duration: totalSec });
  } catch (e) {
    err("Durduruldu — HATA satırına bak.");
    PANEL.emit("failed", { step: (e && e.message) ? e.message : String(e) });
    // eslint-disable-next-line no-console
    console.error(e);
  }
}

// "Panodan Yapıştır": navigator.clipboard.read → metni textarea'ya yaz, sonra doğrula.
// İzin yoksa/boş panoysa nazik mesaj; elle paste her zaman çalışır (fallback).
async function pasteFromClipboard() {
  const ta = document.querySelector("#paste-json");
  if (!ta) return;
  try {
    let txt = "";
    if (navigator.clipboard && typeof navigator.clipboard.read === "function") {
      const items = await navigator.clipboard.read();
      for (const it of items) {
        const type = (it.types || []).find((t) => t === "text/plain") || (it.types || [])[0];
        if (!type) continue;
        const blob = await it.getType(type);
        txt = (typeof blob === "string") ? blob : (blob && blob.text ? await blob.text() : "");
        if (txt) break;
      }
    } else if (navigator.clipboard && typeof navigator.clipboard.readText === "function") {
      txt = await navigator.clipboard.readText();
    }
    if (!txt) { warn("Pano boş — manifest JSON'unu elle yapıştır (Cmd+V)."); return; }
    ta.value = txt;
    await loadAndPreview("paste");
  } catch (e) {
    warn("Panoya erişilemedi — manifest JSON'unu elle yapıştır (Cmd+V).");
  }
}

function wire() {
  // Yükle sekmesi: dosya seç / doğrula (paste) / panodan yapıştır
  const bPick = document.querySelector("#btn-pick");
  if (bPick) bPick.addEventListener("click", () => loadAndPreview("file"));
  const bValidate = document.querySelector("#btn-validate");
  if (bValidate) bValidate.addEventListener("click", () => loadAndPreview("paste"));
  const bPasteClip = document.querySelector("#btn-paste-clip");
  if (bPasteClip) bPasteClip.addEventListener("click", pasteFromClipboard);

  // Kur sekmesi: bölümü kur (manifest zaten yüklü) + yardımcılar
  const bBuild = document.querySelector("#btn-build") || document.querySelector("#btn-manifest");
  if (bBuild) bBuild.addEventListener("click", () => {
    if (BUILD_RUNNING) { PANEL.emit("toast", "err", "Kurulum zaten sürüyor — bitmesini bekle."); return; }   // adım içinde de görünsün → doğrudan toast
    BUILD_RUNNING = true;
    // runBuild içindeki TÜM çıkış yolları (erken return / hata) bayrağı burada temizler.
    Promise.resolve(runBuild()).finally(() => { BUILD_RUNNING = false; });
  });
  const bList = document.querySelector("#btn-list");
  if (bList) bList.addEventListener("click", listTransitions);
  const bClear = document.querySelector("#btn-clear");
  if (bClear) bClear.addEventListener("click", clearLog);

  info("Panel hazır. Yükle sekmesinden manifest seç / yapıştır.");
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
else wire();
