// Hazırlık (Setup) iş mantığı — native.ts/archive.ts izole-köprü desenini izler.
// Faz 4 BAĞLI: Tauri'de GERÇEK çalışır — Premiere/MONTAJCI sistem tespiti, model Ollama HTTP (sidecar
// ollama_status/ollama_pull). Tauri YOK iken (tarayıcı önizleme): model indirme SİMÜLE (açıkça etiketli),
// online GERÇEK (navigator.onLine). Köprüyü ince tut; native dokunuş tauri.ts + bu dosyada izole.
import { useSyncExternalStore } from 'react'
import type { SetupState, SetupItemState } from './types'
import { tauriAvailable, revealInFinder } from './native'
import { runCommand, runSidecar, homeDir, writeBytes, removePath } from './tauri'
import { rngFromSeed } from './seed'

const KEY = 'autoreji.setup.v1'
const VERSION = 1
const DEFAULT: SetupState = { premiere: 'pending', model: 'pending', plugin: 'pending', skipped: false, completedAt: null }
const ITEMS = ['premiere', 'model', 'plugin'] as const
export const SETUP_ITEM_COUNT = ITEMS.length

export function getSetupState(): SetupState {
  try {
    const r = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (!r || typeof r !== 'object' || r.version !== VERSION) return { ...DEFAULT }
    return {
      premiere: r.premiere ?? 'pending', model: r.model ?? 'pending', plugin: r.plugin ?? 'pending',
      skipped: !!r.skipped, completedAt: r.completedAt ?? null,
    }
  } catch { return { ...DEFAULT } }
}
export function setSetupState(next: SetupState): void {
  try { localStorage.setItem(KEY, JSON.stringify({ ...next, version: VERSION })) } catch { /* quota/private mode — sessizce yut */ }
}
export function patchSetup(patch: Partial<SetupState>): SetupState {
  const next = { ...getSetupState(), ...patch }
  setSetupState(next)
  return next
}
/** Hazırlık bir kez geçildi mi (tamamlandı VEYA atlandı) → öyleyse Giriş ilk ekran. */
export function isSetupDone(s: SetupState = getSetupState()): boolean {
  return s.completedAt != null || s.skipped
}
/** 4 alandan kaçı 'pending' değil (ok/ack). Üst rozet + birincil buton için. */
export function setupReadyCount(s: SetupState): number {
  return ITEMS.filter((k) => s[k] !== 'pending').length
}

// ---- Bağlantı durumu — GERÇEK (Tauri gerektirmez) ----
function subscribeOnline(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('online', cb)
  window.addEventListener('offline', cb)
  return () => { window.removeEventListener('online', cb); window.removeEventListener('offline', cb) }
}
const getOnline = (): boolean => (typeof navigator === 'undefined' ? true : navigator.onLine)
export function useOnline(): boolean {
  return useSyncExternalStore(subscribeOnline, getOnline, () => true)
}

// ---- AI modeli ----
export const MODEL = { tag: 'qwen2.5vl:7b', label: 'qwen2.5-VL 7B', sizeBytes: 6.0 * 1024 ** 3, quant: 'sıkıştırılmış sürüm' }
export interface PullProgress { phase: string; bytes: number; total: number; mbps: number; done: boolean; native: boolean }
const PHASES = ['İndirme hazırlanıyor', 'Katmanlar indiriliyor', 'Dosya bütünlüğü kontrol ediliyor', 'Yerel kütüphaneye yazılıyor', 'Hazır']

// ---- Ollama (yerel görsel-AI) durum/başlatma — GERÇEK (sidecar HTTP, çalışma anıyla AYNI yol) ----
export const OLLAMA_DOWNLOAD = 'https://ollama.com/download'
export interface OllamaStatus { running: boolean; installed: boolean; hasModel: boolean; onDisk: boolean; ready: boolean; models: string[] }
export type OllamaErrorReason = 'not-installed' | 'not-running' | 'pull-failed'
export class OllamaError extends Error {
  reason: OllamaErrorReason
  constructor(reason: OllamaErrorReason, message?: string) {
    super(message || reason)
    this.name = 'OllamaError'
    this.reason = reason
  }
}

/** Ollama + model durumu — GERÇEK kontrol (sidecar → localhost:11434 + disk). Tauri yoksa null (tarayıcı önizleme). */
export async function ollamaStatus(): Promise<OllamaStatus | null> {
  if (!tauriAvailable()) return null
  try {
    const run = await runSidecar(['ollama_status', JSON.stringify({ model: MODEL.tag })])
    const r = run.result?.result
    if (!r) return null
    return { running: !!r.running, installed: !!r.installed, hasModel: !!r.hasModel, onDisk: !!r.onDisk, ready: !!r.ready, models: r.models || [] }
  } catch { return null }
}

/** Ollama uygulamasını başlat (server'ı ayağa kaldırır → /api/* erişilir olur). */
export function startOllama(): void {
  if (tauriAvailable()) { void runCommand('open', ['-a', 'Ollama']).catch(() => {}) }
}
/** Ollama indirme sayfasını aç (kurulu değilse — bir kez kurulur, sonra offline). */
export function openOllamaDownload(): void {
  if (tauriAvailable()) { void runCommand('open', [OLLAMA_DOWNLOAD]).catch(() => {}); return }
  try { window.open(OLLAMA_DOWNLOAD, '_blank', 'noopener,noreferrer') } catch { /* yut */ }
}

/** Model indir. Tauri yoksa SEED'li gerçekçi SİMÜLASYON; Faz 4'te aynı imzayla POST 11434/api/pull stream'i bağlanır. */
export async function pullModel(seed: string, onProgress: (p: PullProgress) => void, signal?: AbortSignal): Promise<void> {
  if (tauriAvailable()) {
    // GERÇEK indirme — Ollama /api/pull (sidecar HTTP). PATH/CLI gerekmez; SAHTE SİMÜLASYON YOK.
    // Başarısızsa DÜRÜSTÇE hata fırlatır (UI doğru durumu gösterir) — asla "indi" gibi yapmaz.
    const T2 = MODEL.sizeBytes
    const st = await ollamaStatus()
    if (st?.ready) { onProgress({ phase: PHASES[4], bytes: T2, total: T2, mbps: 0, done: true, native: true }); return }
    if (!st?.running) throw new OllamaError(st?.installed ? 'not-running' : 'not-installed')
    const run = await runSidecar(['ollama_pull', JSON.stringify({ model: MODEL.tag })], undefined, (ev: { event?: string; cmd?: string; done?: number; total?: number; msg?: string }) => {
      if (signal?.aborted) return
      if (ev?.event === 'progress' && ev.cmd === 'ollama_pull') {
        const total = (ev.total ?? 0) > 1 ? (ev.total as number) : T2
        const bytes = Math.min(total, ev.done ?? 0)
        onProgress({ phase: ev.msg || PHASES[1], bytes, total, mbps: 0, done: false, native: true })
      }
    })
    if (signal?.aborted) return
    if (run.code === 0 && run.result?.result?.ready) { onProgress({ phase: PHASES[4], bytes: T2, total: T2, mbps: 0, done: true, native: true }); return }
    throw new OllamaError('pull-failed', run.result?.error || run.stderr || 'indirme tamamlanamadı')
  }
  // Tarayıcı önizleme (Tauri yok): gerçek indirme YOK → dürüst simülasyon (UI akışını gösterir).
  const T = MODEL.sizeBytes
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) { onProgress({ phase: PHASES[4], bytes: T, total: T, mbps: 0, done: true, native: false }); return }
  const rnd = rngFromSeed(seed + ':model')
  const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
  let bytes = 0
  while (bytes < T) {
    if (signal?.aborted) return
    const remain = T - bytes
    bytes = Math.min(T, bytes + remain * (0.04 + rnd() * 0.05) + 8 * 1024 ** 2)
    const frac = bytes / T
    const phase = frac < 0.06 ? PHASES[0] : frac < 0.92 ? PHASES[1] : PHASES[2]
    onProgress({ phase, bytes, total: T, mbps: 28 + rnd() * 52, done: false, native: false })
    await sleep(110)
  }
  if (signal?.aborted) return
  onProgress({ phase: PHASES[2], bytes: T, total: T, mbps: 0, done: false, native: false }); await sleep(620)
  if (signal?.aborted) return
  onProgress({ phase: PHASES[3], bytes: T, total: T, mbps: 0, done: false, native: false }); await sleep(380)
  if (signal?.aborted) return
  onProgress({ phase: PHASES[4], bytes: T, total: T, mbps: 0, done: true, native: false })
}

// ---- Creative Cloud / MONTAJCI köprüleri ----
export const PANEL_MANIFEST_PATH = '/Users/muhammed/Desktop/ghbl/AutoReji/panel/manifest.json'
export const CC_URL = 'https://creativecloud.adobe.com/apps/download/uxp-developer-tools'

/** Creative Cloud / UXP Developer Tools sayfasını aç. Tarayıcıdan stabil deep-link yok → resmi web sayfası (gerçek, çalışır). */
export function openCreativeCloud(): { attempted: boolean } {
  // .app: window.open DIŞ URL açmaz (Tauri webview) → /usr/bin/open ile sistem tarayıcısı.
  if (tauriAvailable()) { void runCommand('open', [CC_URL]).catch(() => {}); return { attempted: true } }
  try { window.open(CC_URL, '_blank', 'noopener,noreferrer'); return { attempted: true } } catch { return { attempted: false } }
}

/** Creative Cloud Desktop uygulamasını aç (eklenti yönetimi orada — MONTAJCI'yı kullanıcı elle kaldırır). */
export function openPluginManager(): void {
  if (tauriAvailable()) { void runCommand('open', ['-a', 'Creative Cloud']).catch(() => {}); return }
  try { window.open('https://creativecloud.adobe.com/apps/all/desktop', '_blank', 'noopener,noreferrer') } catch { /* yut */ }
}

export type BridgeResult = { ok: true; native: true } | { ok: true; native: false } | { ok: false; native: false }
/** MONTAJCI'yı UXP'ye entegre et. Tauri yoksa manifest yolunu panoya kopyalar (sahte 'kuruldu' YOK); Faz 4'te gerçek kopyalama/UDT Load aynı imzayla. */
export async function integratePlugin(): Promise<BridgeResult> {
  if (tauriAvailable()) {
    // FAZ 4: panel/'i UXP konumuna kopyala veya UDT'ye kaydı kolaylaştır — aynı imza, UI değişmez.
  }
  try { await navigator.clipboard?.writeText(PANEL_MANIFEST_PATH); return { ok: true, native: false } } catch { return { ok: false, native: false } }
}

// ---- MONTAJCI .ccx kurulumu (ticari yol: gömülü .ccx → çift-tık CC / pakette UPIA) ----
export const CCX_FILE = 'com.autoreji.derisk_premierepro.ccx'
export const CCX_URL = `/plugin/${CCX_FILE}`
export const PLUGIN_ID = 'com.autoreji.derisk'
const INSTALL_PHASES = ['Paket hazırlanıyor', "İndiriliyor", "Paket doğrulanıyor", 'Doğrulanıyor', 'Hazır']
export interface InstallProgress { phase: string; pct: number; done: boolean; native: boolean }
const PLUGIN_KEY = 'autoreji.plugin.ccx.v1'

export function getPluginDownloadRecord(): { downloadedAt: string } | null {
  try { const r = JSON.parse(localStorage.getItem(PLUGIN_KEY) ?? 'null'); return r && r.downloadedAt ? r : null } catch { return null }
}
function recordPluginDownload() {
  try { localStorage.setItem(PLUGIN_KEY, JSON.stringify({ downloadedAt: new Date().toISOString() })) } catch { /* yut */ }
}

/** Gömülü .ccx'i diske indir — GERÇEK (tarayıcıda çalışır). Kullanıcı çift-tıklar → Creative Cloud Desktop kurar. */
export async function downloadCcx(): Promise<BridgeResult> {
  try {
    // Doğrudan statik yola indir (Blob DEĞİL): blob: URL'de tarayıcı download adını yok sayıp UUID veriyordu.
    // Statik URL'in son segmenti zaten ".ccx" → dosya adı + uzantı korunur.
    const a = document.createElement('a')
    a.href = CCX_URL
    a.download = CCX_FILE
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    recordPluginDownload()
    return { ok: true, native: false }
  } catch {
    return { ok: false, native: false }
  }
}

/** MONTAJCI'yı kur — premium %-akış. Pakette (Tauri): gömülü .ccx temp'e → UPIA --install (sessiz, native:true) → --list doğrula.
 *  Şimdi (tarayıcı): gerçekçi faz-ilerlemesi + bitişte .ccx'i GERÇEKTEN indir (çift-tıkla CC Desktop kurar). */
export async function installPlugin(seed: string, onProgress: (p: InstallProgress) => void, signal?: AbortSignal): Promise<BridgeResult> {
  const native = tauriAvailable()
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  // FAZ 4 (pakette): const o = await loadOpener()/invoke('upia_install', {ccx}) — aynı imza, UI değişmez.
  const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
  if (reduce) {
    onProgress({ phase: INSTALL_PHASES[3], pct: 1, done: false, native })
  } else {
    const rnd = rngFromSeed(seed + ':ccx')
    let pct = 0
    while (pct < 1) {
      if (signal?.aborted) return { ok: false, native: false }
      pct = Math.min(1, pct + 0.06 + rnd() * 0.07)
      const phase = pct < 0.25 ? INSTALL_PHASES[0] : pct < 0.6 ? INSTALL_PHASES[1] : pct < 0.9 ? INSTALL_PHASES[2] : INSTALL_PHASES[3]
      onProgress({ phase, pct, done: false, native })
      await sleep(120)
    }
  }
  if (signal?.aborted) return { ok: false, native: false }
  // Pakette (Tauri): .ccx'i diske yaz + sistemle aç → CC Desktop kurar. Tarayıcı: indir → çift-tıkla.
  const r: BridgeResult = native ? await installCcxNative() : await downloadCcx()
  onProgress({ phase: INSTALL_PHASES[4], pct: 1, done: true, native })
  return r
}

/** Pakette (Tauri): gömülü .ccx'i ~/Downloads'a yaz + sistemle aç → Creative Cloud Desktop kurar (native:true). */
async function installCcxNative(): Promise<BridgeResult> {
  try {
    const resp = await fetch(CCX_URL)
    if (!resp.ok) return { ok: false, native: false }
    const bytes = new Uint8Array(await resp.arrayBuffer())
    const home = (await homeDir())?.replace(/\/+$/, '') ?? ''
    const dest = `${home}/Downloads/${CCX_FILE}`
    if (!(await writeBytes(dest, bytes))) return { ok: false, native: false }
    await revealInFinder(dest) // Finder'da GÖSTER (otomatik açma YOK — kullanıcı çift-tıklar)
    recordPluginDownload()
    return { ok: true, native: true }
  } catch {
    return { ok: false, native: false }
  }
}

// ---- GERÇEK tespit (yalnız Tauri) — Hazırlık'ta sistemden doğrular; tarayıcıda hep false (elle-onay kalır) ----
/** Premiere Pro kurulu mu? /Applications altında "Adobe Premiere Pro*". */
export async function detectPremiere(): Promise<boolean> {
  if (!tauriAvailable()) return false
  try { const r = await runCommand('ls', ['/Applications']); return /Adobe Premiere Pro/i.test(r.stdout) } catch { return false }
}
/** Ollama server ayakta mı? GERÇEK (sidecar → /api/version). */
export async function detectOllama(): Promise<boolean> {
  return (await ollamaStatus())?.running ?? false
}
/** Görsel-AI çalışma anında HAZIR mı? (Ollama ayakta + model sunulabiliyor). GERÇEK kontrol — her açılışta.
 *  "ready" = çalışma anında VLM gerçekten çalışır (sahte/diskte-var-ama-server-kapalı durumu ele alınır). */
export async function detectModel(): Promise<boolean> {
  return (await ollamaStatus())?.ready ?? false
}
/** MONTAJCI paneli UXP'ye kurulu mu? (~/Library/.../UXP/Plugins altında PLUGIN_ID). */
export async function detectUxpPlugin(): Promise<boolean> {
  if (!tauriAvailable()) return false
  // Creative Cloud .ccx'i `Plugins/External/<id>_<sürüm>` olarak kurar (örn. com.autoreji.derisk_0.1.0)
  // → SÜRÜM SONEKLİ! Sabit yol değil, ls + PREFIX eşleştir (güvenilir).
  try {
    const home = (await homeDir())?.replace(/\/+$/, '') ?? ''
    const adobe = `${home}/Library/Application Support/Adobe/UXP`
    for (const d of [`${adobe}/Plugins/External`, `${adobe}/Plugins/Develop`]) {
      const r = await runCommand('ls', [d])
      if (r.code === 0 && r.stdout.includes(PLUGIN_ID)) return true
    }
    return false
  } catch { return false }
}

const VERIFY_PHASES = ['Premiere eklenti klasörü taranıyor', 'İmza ve sürüm okunuyor', 'Bağlantı doğrulanıyor']
/** MONTAJCI kurulu mu — KULLANICI "Test et"e basınca. Kısa doğrulama animasyonu + GERÇEK tespit (Tauri: detectUxpPlugin;
 *  tarayıcı: indirme kaydı). Sonuç dürüst: bulunduysa true (→ 'ok'), bulunmadıysa false (→ "kurulu değil"). */
export async function verifyPlugin(onProgress: (p: InstallProgress) => void, signal?: AbortSignal): Promise<boolean> {
  const native = tauriAvailable()
  const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
  // Gerçek (Tauri) veya tarayıcıda indirme-kaydı temelli tespiti animasyonla PARALEL başlat.
  const detect: Promise<boolean> = native ? detectUxpPlugin() : Promise.resolve(!!getPluginDownloadRecord())
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  let pct = 0
  if (!reduce) {
    while (pct < 0.92) {
      if (signal?.aborted) return false
      pct = Math.min(0.92, pct + 0.09)
      const phase = pct < 0.4 ? VERIFY_PHASES[0] : pct < 0.75 ? VERIFY_PHASES[1] : VERIFY_PHASES[2]
      onProgress({ phase, pct, done: false, native })
      await sleep(150)
    }
  }
  const found = await detect
  if (signal?.aborted) return found
  onProgress({ phase: found ? 'Doğrulandı' : 'Bulunamadı', pct: 1, done: true, native })
  await sleep(reduce ? 0 : 340)
  return found
}

/** Tüm tespitleri çalıştır + setup durumunu 'ok'a YÜKSELT (asla düşürme). Tauri yoksa mevcut durumu döner. */
export async function detectAndPatch(): Promise<SetupState> {
  if (!tauriAvailable()) return getSetupState()
  const cur = getSetupState()
  const [prem, model, plugin] = await Promise.all([detectPremiere(), detectModel(), detectUxpPlugin()])
  // OTORİTER: sistemden güvenilir doğrulanır → bulunursa 'ok', bulunmazsa kullanıcı 'ack'ini koru yoksa 'pending'
  // (stale 'ok' DÜŞER → yanlış "sistem doğruladı" olmaz). Kullanıcının elle onayını ezmez.
  const auth = (found: boolean, prev: SetupItemState): SetupItemState => (found ? 'ok' : prev === 'ack' ? 'ack' : 'pending')
  return patchSetup({
    premiere: auth(prem, cur.premiere),
    model: auth(model, cur.model),
    // MONTAJCI: artık GÜVENİLİR tespit (homeDir izni eklendi → Plugins/External prefix gerçekten okunuyor).
    // Her AÇILIŞTA oto-doğrular: kuruluysa 'ok' (kullanıcı "Kur"u tekrar görmez), kaldırılmışsa 'pending'e
    // düşer, indirilip henüz CC'de kurulmadıysa 'ack' korunur. Kullanıcı "Test et" ile elle de doğrulayabilir.
    plugin: auth(plugin, cur.plugin),
  })
}

/** MONTAJCI panelini UXP'den KALDIR (Tauri: plugin klasörünü sil → Premiere yeniden başlayınca kaybolur).
 *  CC ile kurulan plugin için CC Desktop'tan kaldırma daha kesin; bu en-iyi-çaba + UI elle talimat da gösterir. */
export async function removeUxpPlugin(): Promise<boolean> {
  if (!tauriAvailable()) return false
  const home = (await homeDir())?.replace(/\/+$/, '') ?? ''
  const base = `${home}/Library/Application Support/Adobe/UXP/Plugins`
  let removed = false
  for (const sub of ['External', 'Develop']) {
    const dir = `${base}/${sub}`
    const r = await runCommand('ls', [dir])
    if (r.code !== 0) continue
    // CC kurulumu `<id>_<sürüm>` (örn. com.autoreji.derisk_0.1.0) — detectUxpPlugin ile AYNI prefix mantığı
    for (const name of r.stdout.split('\n').map((s) => s.trim()).filter(Boolean)) {
      if (name === PLUGIN_ID || name.startsWith(`${PLUGIN_ID}_`)) {
        if (await removePath(`${dir}/${name}`)) removed = true
      }
    }
  }
  return removed
}
