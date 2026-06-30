"use strict";
/*
 * AutoReji — premium sunum/render katmanı (ui.js)
 * main.js'in window.PANEL emitter olaylarına abone olur ve premium UI çizer:
 *   step-start / step-substep / step-done / step-error / report / log /
 *   episode / reset / done / failed
 *
 * UXP KISITLARI: CSS transition/@keyframes/animation YOK → TÜM hareket setTimeout ile.
 * requestAnimationFrame'e güvenilmez → step-loop'lar setTimeout(fn,16) tabanlı.
 * matchMedia reduced-motion → anlık göster (hareket atla).
 * Bu dosya yalnız HAREKET + İÇERİK; renk/cam/token CSS'te (index.html <style>).
 */
(function () {
  // ── Adım listesi: main.js'teki 11 runStep/emit id'siyle BİREBİR ──
  var STEPS = [
    { id: "import",     label: "1) Import" },
    { id: "map",        label: "2) Proje öğelerini eşle" },
    { id: "media",      label: "2.5) Medya hazır bekleniyor" },
    { id: "trim",       label: "3) Kırpma (in/out, kare-hizalı)" },
    { id: "sequence",   label: "4) Sequence + ham dizim" },
    { id: "closegaps",  label: "5) Boşlukları kapat (video + ses)" },
    { id: "measure",    label: "6) Boşluk ölçümü" },
    { id: "transitions",label: "7) Geçişler" },
    { id: "introoutro", label: "8) Intro/Outro fade" },
    { id: "crop",       label: "8.5) Crop (siyah bar)" },
    { id: "verify",     label: "9) Son boşluk kontrolü" },
  ];

  var LS_KEY = "autoreji.panel.v1";

  // ── Sekme yönetimi ──
  var TABS = ["load", "build", "report"];
  var activeTab = "load";
  var tabState = { loaded: false };      // manifest doğrulandı mı? (oturum-içi)
  var lockToastShown = false;            // "Önce manifest yükle" mikro-toast bir kez

  // ── güvenli zamanlayıcı ──
  var raf = (typeof requestAnimationFrame === "function")
    ? requestAnimationFrame
    : function (fn) { return setTimeout(fn, 16); };

  function prefersReducedMotion() {
    try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
    catch (_) { return false; }
  }

  function $(sel) { return document.querySelector(sel); }
  function el(tag, cls) { var d = document.createElement(tag); if (cls) d.className = cls; return d; }

  // ── kalıcı tercih (localStorage) ──
  function loadPrefs() { try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (_) { return {}; } }
  function savePrefs(p) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(Object.assign({}, loadPrefs(), p))); } catch (_) {}
  }

  // ── modül durumu ──
  var stepNodes = {};        // id -> { wrap, label, sub, mark, badge, errRow, retry, spinnerTimer, pulseTimer }
  var report = {};           // birikmiş rapor değerleri
  var chipNodes = {};        // key -> { wrap, valEl }
  var elapsedTimer = null;
  var elapsedStart = 0;
  var building = false;
  var doneStepCount = 0;

  // ───────────────────────────────────────────── ANİMASYON YARDIMCILARI

  // 12-segment spinner: her ~90ms bir segment "parlar" (transition YOK).
  function startSpinner(markEl) {
    var ring = el("div", "mark-ring");
    markEl.appendChild(ring);
    var N = 12;
    var segs = [];
    for (var i = 0; i < N; i++) {
      var s = el("div", "seg");
      // 12 yöne döndür: transform yok → trigonometriyle konumla (left/top)
      var ang = (i / N) * Math.PI * 2;
      var cx = 7, cy = 7, r = 5.2;
      s.style.left = (cx + Math.sin(ang) * r - 0.75) + "px";
      s.style.top = (cy - Math.cos(ang) * r - 2) + "px";
      markEl.appendChild(s);
      segs.push(s);
    }
    if (prefersReducedMotion()) {
      // statik altın nokta his: orta segmentleri sabit yak
      for (var k = 0; k < N; k++) segs[k].style.opacity = "0.5";
      return null;
    }
    var head = 0;
    var timer = setInterval(function () {
      for (var j = 0; j < N; j++) {
        var dist = (j - head + N) % N;        // baştan uzaklık
        var op = dist < 5 ? (1 - dist * 0.18) : 0.18;
        segs[j].style.opacity = String(op);
      }
      head = (head + 1) % N;
    }, 90);
    return timer;
  }

  // nabız atan nokta (active): opacity .4↔1 ~600ms
  function startPulse(dotEl) {
    if (prefersReducedMotion()) { dotEl.style.opacity = "1"; return null; }
    var up = false;
    return setInterval(function () {
      dotEl.style.opacity = up ? "1" : "0.45";
      up = !up;
    }, 600);
  }

  // yeşil tik çizme: iki çizgi sırayla 110ms arayla (width + opacity, JS step)
  function greenCheck(markEl) {
    markEl.innerHTML = "";
    var ring = el("div", "mark-ring");
    ring.style.borderColor = "var(--ok)";
    markEl.appendChild(ring);
    var sShort = el("div", "check-short");
    var sLong = el("div", "check-long");
    markEl.appendChild(sShort);
    markEl.appendChild(sLong);
    if (prefersReducedMotion()) { sShort.style.opacity = "1"; sLong.style.opacity = "1"; return; }
    var shortW = 5, longW = 9;
    sShort.style.width = "0px";
    sLong.style.width = "0px";
    growWidth(sShort, shortW, 7);
    setTimeout(function () { growWidth(sLong, longW, 7); }, 110);
  }

  function growWidth(node, target, steps) {
    node.style.opacity = "1";
    var i = 0;
    var t = setInterval(function () {
      i++;
      node.style.width = (target * (i / steps)) + "px";
      if (i >= steps) { node.style.width = target + "px"; clearInterval(t); }
    }, 18);
  }

  function redCross(markEl) {
    markEl.innerHTML = "";
    var ring = el("div", "mark-ring");
    ring.style.borderColor = "var(--err)";
    markEl.appendChild(ring);
    var a = el("div", "cross-a");
    var b = el("div", "cross-b");
    // çapraz görünüm: transform yok → ince çizgileri eğik konum taklidi
    a.style.top = "7px"; a.style.width = "13px"; a.style.left = "2px";
    b.style.top = "7px"; b.style.width = "13px"; b.style.left = "2px"; b.style.height = "2px";
    a.style.background = "var(--err)";
    b.style.background = "rgba(255,143,143,0.55)";
    markEl.appendChild(a);
    markEl.appendChild(b);
  }

  // stagger reveal: opacity 0→1 + küçük yukarı kayma (JS, transition YOK)
  function revealStagger(node, delay) {
    if (prefersReducedMotion()) { node.style.opacity = "1"; return; }
    setTimeout(function () { fadeIn(node, 8); }, delay);
  }

  function fadeIn(node, steps) {
    var i = 0;
    node.style.opacity = "0";
    var t = setInterval(function () {
      i++;
      node.style.opacity = String(i / steps);
      if (i >= steps) { node.style.opacity = "1"; clearInterval(t); }
    }, 22);
  }

  function fadeOut(node, steps, done) {
    if (prefersReducedMotion()) { node.style.opacity = "0"; if (done) done(); return; }
    var i = steps;
    var t = setInterval(function () {
      i--;
      node.style.opacity = String(i / steps);
      if (i <= 0) { node.style.opacity = "0"; clearInterval(t); if (done) done(); }
    }, 22);
  }

  // CountUp taklidi: ease-out cubic (1-(1-t)^3), 12 adım × 30ms
  function countUp(node, target, fmt) {
    target = Number(target) || 0;
    if (prefersReducedMotion() || target <= 0) { node.textContent = fmt ? fmt(target) : String(target); return; }
    var N = 12, i = 0;
    var t = setInterval(function () {
      i++;
      var p = i / N;
      var eased = 1 - Math.pow(1 - p, 3);
      var v = Math.round(target * eased);
      node.textContent = fmt ? fmt(v) : String(v);
      if (i >= N) { node.textContent = fmt ? fmt(target) : String(target); clearInterval(t); }
    }, 30);
  }

  function fmtDur(sec) {
    sec = Math.round(sec);
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  // ───────────────────────────────────────────── PIPELINE KARTLARI

  function buildStepCards() {
    var host = $("#steps");
    if (!host) return;
    host.innerHTML = "";
    stepNodes = {};
    doneStepCount = 0;
    for (var i = 0; i < STEPS.length; i++) {
      (function (def, idx) {
        var wrap = el("div", "step");
        var dot = el("div", "step-dot");
        var body = el("div", "step-body");
        var label = el("div", "step-label");
        label.textContent = def.label;
        var sub = el("div", "step-sub");
        var errRow = el("div", "step-err-row");
        errRow.style.display = "none";
        body.appendChild(label);
        body.appendChild(sub);
        body.appendChild(errRow);
        var mark = el("div", "step-mark");
        var ring = el("div", "mark-ring");
        mark.appendChild(ring);
        var badge = el("div", "step-badge");
        wrap.appendChild(dot);
        wrap.appendChild(body);
        var markCol = el("div");
        markCol.style.display = "flex";
        markCol.style.flexDirection = "column";
        markCol.style.alignItems = "center";
        markCol.appendChild(mark);
        markCol.appendChild(badge);
        wrap.appendChild(markCol);
        host.appendChild(wrap);
        stepNodes[def.id] = {
          wrap: wrap, dot: dot, label: label, sub: sub, mark: mark,
          badge: badge, errRow: errRow, spinnerTimer: null, pulseTimer: null,
        };
        revealStagger(wrap, idx * 70);
      })(STEPS[i], i);
    }
  }

  function clearStepTimers(n) {
    if (n.spinnerTimer) { clearInterval(n.spinnerTimer); n.spinnerTimer = null; }
    if (n.pulseTimer) { clearInterval(n.pulseTimer); n.pulseTimer = null; }
  }

  function onStepStart(id, label) {
    var n = stepNodes[id];
    if (!n) return;
    clearStepTimers(n);
    n.wrap.className = "step active";
    n.wrap.style.opacity = "1";
    n.errRow.style.display = "none";
    n.sub.textContent = "";
    n.mark.innerHTML = "";
    n.spinnerTimer = startSpinner(n.mark);
    n.pulseTimer = startPulse(n.dot);
    setStatus("running", "Kuruluyor: " + (label || "") );
    updateBuildBtnProgress();
  }

  function onStepSub(id, msg) {
    var n = stepNodes[id];
    if (!n) return;
    // sade tut: baştaki "▶" ve fazla boşluğu kırp
    n.sub.textContent = String(msg || "").replace(/^▶\s*/, "").trim();
  }

  function onStepDone(id, info) {
    var n = stepNodes[id];
    if (!n) return;
    clearStepTimers(n);
    n.dot.style.opacity = "1";
    var skipped = info && info.skipped;
    n.wrap.className = "step done";
    greenCheck(n.mark);
    if (info && typeof info.ms === "number" && info.ms > 0) {
      n.badge.textContent = (info.ms / 1000).toFixed(1) + "s";
    } else if (skipped) {
      n.badge.textContent = "—";
    }
    doneStepCount++;
    setBuildProgress(doneStepCount, STEPS.length);
  }

  function onStepError(id, msg) {
    var n = stepNodes[id];
    if (!n) return;
    clearStepTimers(n);
    n.wrap.className = "step error";
    n.dot.style.opacity = "1";
    redCross(n.mark);
    n.errRow.style.display = "block";
    n.errRow.textContent = String(msg || "Hata");
    if (!n.retry) {
      var b = el("div", "step-retry");      // div-buton (native <button> değil)
      b.setAttribute("role", "button");
      b.setAttribute("tabindex", "0");
      b.textContent = "Yeniden dene (tam sıfırla)";
      b.addEventListener("click", function () {
        var bb = $("#btn-build");
        if (bb && !building) bb.click();
      });
      n.errRow.parentNode.appendChild(b);
      bindKeyboard(n.errRow.parentNode);    // Enter/Space etkinleştirme
      n.retry = b;
    }
    setStatus("error", "Durdu: " + (n.label ? n.label.textContent : id));
  }

  function updateBuildBtnProgress() {
    var b = $("#btn-build");
    if (!b || !building) return;
    var total = STEPS.length;
    var cur = Math.min(doneStepCount + 1, total);
    b.firstChild && (b.firstChild.nodeValue = "Kuruluyor… (" + cur + "/" + total + ")");
    setBuildProgress(doneStepCount, total);
  }

  // ───────────────────────────────────────────── RAPOR ÇİPLERİ

  // anahtar -> { cls, label fonksiyonu }
  function ensureChip(key, cls, label) {
    if (chipNodes[key]) return chipNodes[key];
    var host = $("#report-chips");
    if (!host) return null;
    var chip = el("div", "report-chip " + cls);
    var txt = document.createTextNode("");
    chip.appendChild(txt);
    host.appendChild(chip);
    var node = { wrap: chip, txt: txt, label: label, value: 0 };
    chipNodes[key] = node;
    fadeIn(chip, 8);
    return node;
  }

  function setChipText(node, text) { node.txt.nodeValue = text; }

  function applyReport(r) {
    if (!r) return;
    if (typeof r.duration === "number") {
      report.duration = r.duration;
      var c = ensureChip("dur", "c-dur");
      if (c) setChipText(c, "Süre: ~" + fmtDur(r.duration));
    }
    if (r.transitions) {
      var t = r.transitions;
      report.cut = t.cut; report.fade = t.fade; report.black = t.black;
      var cc = ensureChip("cut", "c-cut");
      if (cc) animChip(cc, t.cut, "Cut: ");
      var cf = ensureChip("fade", "c-fade");
      if (cf) animChip(cf, t.fade, "Fade: ");
      var cb = ensureChip("black", "c-black");
      if (cb) animChip(cb, t.black, "Black: ");
    }
    if (typeof r.gaps === "number") {
      report.gaps = r.gaps;
      var cg = ensureChip("gap", "c-gap");
      if (cg) {
        if (r.gaps === 0) {
          setChipText(cg, "Boşluk: 0 ✓");
          cg.wrap.className = "report-chip c-gap gap-clear";
        } else {
          setChipText(cg, "Boşluk: " + r.gaps + (r.maxTicks ? " (" + r.maxTicks + "t)" : ""));
          cg.wrap.className = "report-chip c-gap";
        }
      }
    }
    if (typeof r.crop === "number") {
      report.crop = r.crop;
      var ck = ensureChip("crop", "c-crop");
      if (ck) animChip(ck, r.crop, "Crop: ");
    }
  }

  // count-up'lı çip: prefix + sayı
  function animChip(node, target, prefix) {
    target = Number(target) || 0;
    if (prefersReducedMotion()) { setChipText(node, prefix + target); return; }
    var N = 12, i = 0;
    var t = setInterval(function () {
      i++;
      var p = i / N, eased = 1 - Math.pow(1 - p, 3);
      setChipText(node, prefix + Math.round(target * eased));
      if (i >= N) { setChipText(node, prefix + target); clearInterval(t); }
    }, 30);
  }

  function onEpisode(e) {
    report = {};
    var nameEl = $("#episode-name");
    var subEl = $("#episode-sub");
    var rightEl = $("#header-right");
    if (nameEl) nameEl.textContent = e.name || "";
    if (subEl) subEl.textContent = (e.clips || 0) + " klip · " + (e.fps || 24) + " fps";
    if (rightEl) fadeIn(rightEl, 8);
    // klip çipi
    var c = ensureChip("clip", "c-clip");
    if (c) animChip(c, e.clips || 0, "");
    if (c) {
      // "N klip" özel: count-up'tan sonra " klip" ekle
      var target = e.clips || 0;
      if (prefersReducedMotion()) setChipText(c, target + " klip");
      else {
        var N = 12, i = 0;
        var t = setInterval(function () {
          i++;
          var p = i / N, eased = 1 - Math.pow(1 - p, 3);
          setChipText(c, Math.round(target * eased) + " klip");
          if (i >= N) { setChipText(c, target + " klip"); clearInterval(t); }
        }, 30);
      }
    }
    savePrefs({ lastEpisode: e.name, lastClips: e.clips });
  }

  // ───────────────────────────────────────────── DURUM ÇUBUĞU + ELAPSED

  function setStatus(kind, text) {
    var dot = $("#status-dot");
    var txt = $("#status-text");
    if (dot) dot.className = (kind && kind !== "idle") ? kind : "";
    if (txt && text != null) txt.textContent = text;
  }

  function startElapsed() {
    stopElapsed();
    elapsedStart = Date.now();
    var elp = $("#elapsed");
    elapsedTimer = setInterval(function () {
      if (!elp) return;
      var s = (Date.now() - elapsedStart) / 1000;
      var m = Math.floor(s / 60);
      var rem = (s - m * 60).toFixed(1);
      elp.textContent = m + ":" + (Number(rem) < 10 ? "0" : "") + rem;
    }, 250);
  }
  function stopElapsed() {
    if (elapsedTimer) { clearInterval(elapsedTimer); elapsedTimer = null; }
  }

  // ───────────────────────────────────────────── TOAST

  function showToast(kind, msg) {
    var root = $("#toast-root");
    if (!root) return;
    var toast = el("div", "toast" + (kind === "err" ? " err" : ""));
    var m = el("div", "toast-msg");
    m.textContent = msg;
    var bar = el("div", "toast-bar");
    toast.appendChild(m);
    toast.appendChild(bar);
    root.appendChild(toast);

    if (prefersReducedMotion()) {
      toast.style.opacity = "1";
      setTimeout(function () { fadeOut(toast, 6, function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }); }, 4000);
      return;
    }
    // yaylı giriş: opacity fade + alttan hafif yukarı (margin-top spring)
    fadeIn(toast, 8);
    // tükenen ışık çubuğu: width %100 → %0 (~4s, 50ms adım)
    var pct = 100;
    var bt = setInterval(function () {
      pct -= 1.25;                       // 80 adım × 50ms ≈ 4s
      if (pct < 0) pct = 0;
      bar.style.width = pct + "%";
      if (pct <= 0) {
        clearInterval(bt);
        fadeOut(toast, 6, function () { if (toast.parentNode) toast.parentNode.removeChild(toast); });
      }
    }, 50);
  }

  // ───────────────────────────────────────────── RECAP

  function showRecap(r) {
    var box = $("#recap");
    var rows = $("#recap-rows");
    if (!box || !rows) return;
    rows.innerHTML = "";
    var lines = [];
    lines.push("Native stereo · " + (r.clips || report.clips || "?") + " klip");
    if (typeof report.gaps === "number") {
      lines.push(report.gaps === 0 ? "Boşluk: 0 tick (tam kare hizası)" : "Boşluk: " + report.gaps + " tick");
    }
    var tr = [];
    if (report.cut) tr.push(report.cut + " cut");
    if (report.fade) tr.push(report.fade + " fade");
    if (report.black) tr.push(report.black + " black");
    if (tr.length) lines.push("Geçiş: " + tr.join(" · "));
    if (report.crop) lines.push("Crop: " + report.crop + " klip büyütüldü");
    var dur = (typeof report.duration === "number") ? report.duration : r.duration;
    if (typeof dur === "number" && dur > 0) lines.push("Süre: ~" + fmtDur(dur));
    lines.push("Render YOK — düzenlenebilir klip + geçiş");

    box.style.display = "block";
    var empty = $("#report-empty");
    if (empty) empty.style.display = "none";
    for (var i = 0; i < lines.length; i++) {
      (function (text, idx) {
        var row = el("div", "recap-row");
        var tick = el("span", "recap-tick");
        tick.textContent = "✓";
        var t = document.createTextNode(text);
        row.appendChild(tick);
        row.appendChild(t);
        rows.appendChild(row);
        revealStagger(row, idx * 90);
      })(lines[i], i);
    }
  }

  // ───────────────────────────────────────────── BUILD DURUMU

  function startBuilding() {
    building = true;
    var b = $("#btn-build");
    if (b) {
      b.classList.add("is-building");
      // sağ spinner
      var sp = el("div", "build-spinner");
      b.appendChild(sp);
      startSpinner(sp);
      b._spinner = sp;
    }
    var box = $("#recap");
    if (box) box.style.display = "none";
    setBuildProgress(0, STEPS.length);
    startElapsed();
    setStatus("running", "Kuruluyor…");
  }

  function stopBuilding() {
    building = false;
    var b = $("#btn-build");
    if (b) {
      b.classList.remove("is-building");
      if (b._spinner && b._spinner.parentNode) b._spinner.parentNode.removeChild(b._spinner);
      b._spinner = null;
      if (b.firstChild) b.firstChild.nodeValue = "▶  Bölümü Kur";
    }
    var bp = $("#build-progress");
    if (bp) { bp.style.opacity = "0"; var f = bp.querySelector(".bp-fill"); if (f) f.style.width = "0"; }
    stopElapsed();
  }

  // ───────────────────────────────────────────── RESET

  function resetAll() {
    stopBuilding();
    report = {};
    chipNodes = {};
    var chipHost = $("#report-chips");
    if (chipHost) chipHost.innerHTML = "";
    var box = $("#recap");
    if (box) box.style.display = "none";
    var empty = $("#report-empty");
    if (empty) empty.style.display = "block";
    var sum = $("#load-summary");
    if (sum) sum.style.display = "none";
    var loadErr = $("#load-error");
    if (loadErr) loadErr.style.display = "none";
    var toastRoot = $("#toast-root");
    if (toastRoot) toastRoot.innerHTML = "";
    buildStepCards();
    setStatus("idle", "Hazır");
    var elp = $("#elapsed");
    if (elp) elp.textContent = "0:00.0";
  }

  // ───────────────────────────────────────────── SON KURULUM ROZETİ

  function showLastBadge() {
    var p = loadPrefs();
    var badge = $("#last-badge");
    if (!badge || !p.lastEpisode) return;
    var when = "";
    if (p.lastDoneAt) {
      try {
        var d = new Date(p.lastDoneAt);
        when = " · " + d.toLocaleDateString();
      } catch (_) {}
    }
    badge.innerHTML = "";
    var dot = el("span", "lb-dot");
    badge.appendChild(dot);
    badge.appendChild(document.createTextNode(
      "Son kurulum: " + p.lastEpisode + " · " + (p.lastClips || "?") + " klip" + when
    ));
    fadeIn(badge, 8);
  }

  // ───────────────────────────────────────────── SEKME RAYI + GATING

  function tabBtn(id) {
    var list = document.querySelectorAll(".tab");
    for (var i = 0; i < list.length; i++) {
      if (list[i].getAttribute("data-tab") === id) return list[i];
    }
    return null;
  }

  function isLocked(id) {
    // 'build' ve 'report' manifest yüklenene dek kilitli; 'load' her zaman açık.
    return !tabState.loaded && (id === "build" || id === "report");
  }

  function renderGating() {
    for (var i = 0; i < TABS.length; i++) {
      var b = tabBtn(TABS[i]);
      if (!b) continue;
      if (isLocked(TABS[i])) b.classList.add("locked");
      else b.classList.remove("locked");
    }
  }

  // Aktif gösterge şeridini hedef sekmenin altına yerleştir (yön-duyarlı kaydırma).
  function moveIndicator(toId, fromId) {
    var ind = $("#tab-ind");
    var target = tabBtn(toId);
    if (!ind || !target) return;
    var destLeft = target.offsetLeft;
    var destW = target.offsetWidth;
    ind.style.opacity = "1";

    if (prefersReducedMotion() || !fromId || fromId === toId) {
      ind.style.left = destLeft + "px";
      ind.style.width = destW + "px";
      return;
    }
    // yön: yeni index > eski index ise sağa süzül
    var fromEl = tabBtn(fromId);
    var startLeft = fromEl ? fromEl.offsetLeft : destLeft;
    var startW = fromEl ? fromEl.offsetWidth : destW;
    var N = 6, i = 0;
    var t = setInterval(function () {
      i++;
      var p = i / N, eased = 1 - Math.pow(1 - p, 3);
      ind.style.left = (startLeft + (destLeft - startLeft) * eased) + "px";
      ind.style.width = (startW + (destW - startW) * eased) + "px";
      if (i >= N) { ind.style.left = destLeft + "px"; ind.style.width = destW + "px"; clearInterval(t); }
    }, 16);
  }

  function showTab(id, fromUserClick) {
    if (TABS.indexOf(id) < 0) return;
    if (fromUserClick && isLocked(id)) {
      if (!lockToastShown) { showToast("err", "Önce manifest yükle (Yükle sekmesi)."); lockToastShown = true; }
      return;
    }
    var prev = activeTab;
    activeTab = id;
    // sayfa görünürlüğü (display:none toggle) — iki-arg toggle yerine add/remove (UXP güvenli)
    var pages = document.querySelectorAll(".page");
    for (var i = 0; i < pages.length; i++) {
      var pid = pages[i].id.replace(/^page-/, "");
      if (pid === id) pages[i].classList.add("active"); else pages[i].classList.remove("active");
    }
    // sekme butonu aktif sınıfı
    var tabs = document.querySelectorAll(".tab");
    for (var j = 0; j < tabs.length; j++) {
      if (tabs[j].getAttribute("data-tab") === id) tabs[j].classList.add("active");
      else tabs[j].classList.remove("active");
    }
    moveIndicator(id, prev);
    savePrefs({ activeTab: id });
  }

  function wireTabs() {
    var tabs = document.querySelectorAll(".tab");
    for (var i = 0; i < tabs.length; i++) {
      (function (b) {
        b.addEventListener("click", function () { showTab(b.getAttribute("data-tab"), true); });
      })(tabs[i]);
    }
  }

  // ── ERİŞİLEBİLİRLİK: div-buton klavye etkinleştirme ──
  // Tüm aksiyonlar artık <div role="button"/role="tab" tabindex="0"> (native <button>
  // UXP'de host-gri stilini ezdiği için). <div>'lerde click ÇALIŞIR ama Enter/Space
  // KENDİLİĞİNDEN çalışmaz → her [role] öğesine keydown(Enter/Space)→click bağla.
  // main.js + ui.js'teki addEventListener("click") wiring'i AYNEN korunur; bu yalnız
  // klavye köprüsü ekler. Geç eklenen düğümler (.step-retry) için ayrıca redCross'ta da
  // doğrudan bağlanır; bu global tarama açılıştaki tüm statik div-butonları kapsar.
  function bindKeyboard(root) {
    var nodes = (root || document).querySelectorAll('[role="button"], [role="tab"]');
    for (var i = 0; i < nodes.length; i++) {
      (function (n) {
        if (n._kbBound) return;
        n._kbBound = true;
        n.addEventListener("keydown", function (ev) {
          var k = ev.key || ev.code;
          if (k === "Enter" || k === " " || k === "Spacebar" || k === "Space") {
            ev.preventDefault();
            if (typeof n.click === "function") n.click();
          }
        });
      })(nodes[i]);
    }
  }

  // ───────────────────────────────────────────── YÜKLE SEKMESİ (manifest önizleme)

  function onManifestError(msg) {
    var box = $("#load-error");
    if (box) {
      box.style.display = "block";
      box.textContent = String(msg || "Geçersiz manifest");
    }
    var sum = $("#load-summary");
    if (sum) sum.style.display = "none";
    // alt-kenar kırmızı vurgu
    var ta = $("#paste-json");
    if (ta) ta.style.borderColor = "var(--err)";
    // tabState.loaded değişmez → sekme geçişi YOK
  }

  function onManifestLoaded(meta) {
    meta = meta || {};
    tabState.loaded = true;
    renderGating();
    // hata kutusunu kapat, textarea kenarını sıfırla
    var box = $("#load-error");
    if (box) box.style.display = "none";
    var ta = $("#paste-json");
    if (ta) ta.style.borderColor = "var(--line)";

    // yeşil özet kartını doldur
    var sum = $("#load-summary");
    var nameEl = $("#ls-name");
    var countEl = $("#ls-count");
    var chips = $("#ls-chips");
    if (nameEl) nameEl.textContent = meta.name || "AutoReji";
    if (chips) {
      chips.innerHTML = "";
      var c1 = el("span", "ls-chip"); c1.textContent = (meta.fps || 24) + " fps"; chips.appendChild(c1);
      if (typeof meta.duration === "number" && meta.duration > 0) {
        var c2 = el("span", "ls-chip"); c2.textContent = "~" + fmtDur(meta.duration); chips.appendChild(c2);
      }
    }
    if (sum) {
      sum.style.display = "block";
      fadeIn(sum, 8);
    }
    if (countEl) countUp(countEl, meta.clips || 0);

    // 600ms sonra otomatik 'Kur' sekmesine kay
    setTimeout(function () { showTab("build"); }, 600);
  }

  function wireLoad() {
    // textarea focus glow
    var ta = $("#paste-json");
    var wrap = $("#paste-wrap");
    if (ta && wrap) {
      ta.addEventListener("focus", function () { wrap.classList.add("focused"); });
      ta.addEventListener("blur", function () { wrap.classList.remove("focused"); });
    }
    // #btn-new → resetAll + Yükle sekmesine dön
    var bNew = $("#btn-new");
    if (bNew) bNew.addEventListener("click", function () {
      tabState.loaded = false;
      resetAll();
      renderGating();
      showTab("load");
    });
    // ham günlük aç/kapa
    var lt = $("#log-toggle");
    var logEl = $("#log");
    if (lt && logEl) lt.addEventListener("click", function () {
      var open = logEl.classList.toggle("open");
      lt.firstChild && (lt.firstChild.nodeValue = (open ? "▾ " : "▸ ") + "Ham günlük (geliştirici)");
    });
  }

  // footer dolan altın ilerleme çizgisi
  function setBuildProgress(done, total) {
    var bp = $("#build-progress");
    var fill = bp ? bp.querySelector(".bp-fill") : null;
    if (!bp || !fill) return;
    if (!building) { bp.style.opacity = "0"; fill.style.width = "0"; return; }
    bp.style.opacity = "1";
    var pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
    fill.style.width = pct + "%";
  }

  // ───────────────────────────────────────────── EMITTER ABONELİĞİ

  function subscribe() {
    var P = window.PANEL;
    if (!P) return false;

    P.on("reset", function () { resetAll(); });

    // Manifest doğrulandı → kilitleri aç + yeşil özet + otomatik 'Kur' sekmesi
    P.on("manifest-loaded", function (meta) { onManifestLoaded(meta || {}); });
    // Manifest geçersiz → 'Yükle' sekmesinde kırmızı satır, geçiş YOK
    P.on("manifest-error", function (msg) { onManifestError(msg); });

    // Görünür toast (dosya seçici iptal/hata gibi durumlar için — sessiz kalma).
    P.on("toast", function (kind, msg) { showToast(kind === "err" ? "err" : "ok", msg); });

    P.on("episode", function (e) {
      // gerçek build başlıyor (reset zaten geldi)
      if (!building) startBuilding();
      onEpisode(e || {});
      report.clips = e && e.clips;
    });

    P.on("step-start", function (id, label) { onStepStart(id, label); });
    P.on("step-substep", function (id, msg) { onStepSub(id, msg); });
    P.on("step-done", function (id, info) { onStepDone(id, info || {}); });
    P.on("step-error", function (id, msg) { onStepError(id, msg); });

    P.on("report", function (r) { applyReport(r || {}); });

    P.on("done", function (r) {
      stopBuilding();
      setStatus("done", "Bitti — render yok");
      showRecap(r || {});
      showToast("ok", "Bitti — " + ((r && r.clips) || report.clips || "") + " klip kuruldu, boşluk " + (typeof report.gaps === "number" ? report.gaps : "0"));
      savePrefs({ lastDoneAt: Date.now(), lastRecap: r });
      // SADECE done → 'Rapor' sekmesine kay (failed/step-error 'Kur'da kalır)
      showTab("report");
    });

    P.on("failed", function (f) {
      stopBuilding();
      setStatus("error", "Durdu — detaya bak");
      showToast("err", "Durdu: " + ((f && f.step) || "hata") + " — detaya bak");
      // 'Kur' sekmesinde kal — hata + retry orada görünür
    });

    return true;
  }

  function init() {
    buildStepCards();
    setStatus("idle", "Hazır");
    showLastBadge();
    wireTabs();
    wireLoad();
    bindKeyboard(document);   // div-butonlara Enter/Space erişilebilirliği
    renderGating();
    // Manifest oturum-içi → init'te DAİMA 'Yükle' sekmesine zorla (sahte 'yüklü' gösterme).
    // Gösterge başlangıç konumu için fromUserClick yok.
    showTab("load");
    // main.js önce yüklendiği için PANEL hazır olmalı; değilse kısa bekle
    if (!subscribe()) {
      var tries = 0;
      var t = setInterval(function () {
        tries++;
        if (subscribe() || tries > 20) clearInterval(t);
      }, 50);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
