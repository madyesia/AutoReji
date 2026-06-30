// Native köprü — Tauri varsa gerçek Finder/aç; yoksa zarif fallback (panoya kopya + bildirim).
// Faz 4 BAĞLI: Tauri pluginleri GERÇEK çalışıyor. ⚠️ Pluginler STATİK-string dinamik import edilir
// (`import('@tauri-apps/plugin-opener')`) — asla @vite-ignore/değişken (paketli .app'te çözülmez, sessizce ölür).
// Köprüyü ince/değiştirilebilir tut (Blueprint mandatı) — tüm native dokunuş bu tek dosyada izole.

export type RevealResult =
  | { ok: true; native: true }    // gerçek Finder reveal / aç yapıldı
  | { ok: true; native: false }   // fallback: yol panoya kopyalandı
  | { ok: false; native: false }  // pano da başarısız (nadir)

export function tauriAvailable(): boolean {
  if (typeof window === 'undefined') return false
  const w = window as unknown as Record<string, unknown>
  return !!w.__TAURI__ || !!w.__TAURI_INTERNALS__
}

async function copyFallback(path: string): Promise<RevealResult> {
  try {
    await navigator.clipboard?.writeText(path)
    return { ok: true, native: false }
  } catch {
    return { ok: false, native: false }
  }
}

async function loadOpener(): Promise<Record<string, (p: string) => Promise<void>> | null> {
  try {
    // STATİK literal → Vite lazy chunk olarak bundle'lar (paketlenmiş .app'te çözülür).
    // @vite-ignore + DEĞİŞKEN isimli import KULLANMA: .app'te bare-module çözülmez, sessizce kırılır.
    return (await import('@tauri-apps/plugin-opener')) as unknown as Record<string, (p: string) => Promise<void>>
  } catch {
    return null
  }
}

/** Dosyayı Finder'da göster (klasörü açıp dosyayı seçer). Tauri yoksa yolu panoya kopyalar. */
export async function revealInFinder(path: string): Promise<RevealResult> {
  if (!path) return { ok: false, native: false }
  if (tauriAvailable()) {
    const o = await loadOpener()
    if (o?.revealItemInDir) {
      try { await o.revealItemInDir(path); return { ok: true, native: true } } catch { /* fallback'e düş */ }
    }
  }
  return copyFallback(path)
}

/** Dosya/klasörü aç. Tauri yoksa yolu panoya kopyalar. */
export async function openPath(path: string): Promise<RevealResult> {
  if (!path) return { ok: false, native: false }
  if (tauriAvailable()) {
    const o = await loadOpener()
    if (o?.openPath) {
      try { await o.openPath(path); return { ok: true, native: true } } catch { /* fallback'e düş */ }
    }
  }
  return copyFallback(path)
}

export type SaveResult =
  | { ok: true; native: boolean; name: string; path: string | null } // native:true → Tauri, path mutlak; native:false → tarayıcı (path null)
  | { ok: false; native: false }                                       // iptal / başarısız

/**
 * Metni dosya olarak KAYDET — kaydedilen ad (+ mümkünse mutlak yol) döner.
 *  • Tauri (Faz 4): `plugin-dialog` save() → MUTLAK yol + `plugin-fs` writeTextFile → { path } gerçek.
 *  • Chromium tarayıcı: `showSaveFilePicker` → kullanıcı yeri seçer AMA güvenlik gereği mutlak yol JS'e
 *    İFŞA EDİLMEZ → yalnız dosya adı (path:null).
 *  • Diğer: Blob indirme (Downloads), yalnız ad.
 * Köprü ince/değiştirilebilir (Blueprint) — Tauri gelince AYNI imzayla gerçek yol döner.
 */
export async function saveTextFile(filename: string, text: string): Promise<SaveResult> {
  if (tauriAvailable()) {
    try {
      // STATİK literal import (paketlenmiş .app'te çözülür). save() MUTLAK yol döndürür.
      const { save } = await import('@tauri-apps/plugin-dialog')
      const { writeTextFile } = await import('@tauri-apps/plugin-fs')
      const path = await save({ defaultPath: filename, filters: [{ name: 'AutoReji manifest', extensions: ['json'] }] })
      if (!path) return { ok: false, native: false } // kullanıcı iptal
      await writeTextFile(path, text)
      return { ok: true, native: true, name: path.split('/').pop() || filename, path }
    } catch { /* tarayıcı fallback'ine düş */ }
  }
  const w = window as unknown as {
    showSaveFilePicker?: (o: unknown) => Promise<{ name?: string; createWritable: () => Promise<{ write: (t: string) => Promise<void>; close: () => Promise<void> }> }>
  }
  if (typeof w.showSaveFilePicker === 'function') {
    try {
      const handle = await w.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: 'AutoReji manifest', accept: { 'application/json': ['.json'] } }],
      })
      const ws = await handle.createWritable()
      await ws.write(text)
      await ws.close()
      return { ok: true, native: false, name: handle.name || filename, path: null }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return { ok: false, native: false } // kullanıcı iptal etti
      // diğer hata → indirme fallback'ine düş
    }
  }
  try {
    const blob = new Blob([text], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 4000)
    return { ok: true, native: false, name: filename, path: null }
  } catch {
    return { ok: false, native: false }
  }
}
