// Arşiv/Geçmiş kalıcılık katmanı — şimdilik localStorage (izole, Tauri'ye taşınabilir).
// Faz 4'te gerçek _archive/ klasörü kaynak olacak; bu dosya köprü olduğu için taşınabilir.
import type { ArchiveEntry, Clip, Manifest, Regime } from './types'
import { computeStats } from './data'

const KEY = 'autoreji.archive.v1'
const CAP = 50

export function readArchive(): ArchiveEntry[] {
  try {
    const r = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(r) ? (r as ArchiveEntry[]) : []
  } catch {
    return []
  }
}

export function writeArchiveEntry(e: ArchiveEntry) {
  try {
    const list = readArchive()
    const prev = list.find((x) => x.seed === e.seed) // aynı bölüm tekrar kurulursa: kaydetme bilgisini KORU (yoksa "kaydedildi" kaybolur)
    const merged: ArchiveEntry = prev?.savedAt ? { ...e, savedAt: prev.savedAt, savedName: prev.savedName, savedPath: prev.savedPath } : e
    localStorage.setItem(KEY, JSON.stringify([merged, ...list.filter((x) => x.seed !== e.seed)].slice(0, CAP)))
  } catch {
    /* quota / private mode / SSR — sessizce yut, build akışı kesilmesin */
  }
}

/** Var olan arşiv kaydını manifest kaydetme bilgisiyle güncelle (kaydetme anı + yol/ad). */
export function markArchiveSaved(seed: string, info: { savedAt: string; savedName: string; savedPath?: string | null }): ArchiveEntry | null {
  try {
    const list = readArchive()
    const i = list.findIndex((x) => x.seed === seed)
    if (i < 0) return null
    list[i] = { ...list[i], ...info }
    localStorage.setItem(KEY, JSON.stringify(list))
    return list[i]
  } catch {
    return null
  }
}

export function removeArchiveEntry(seed: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify(readArchive().filter((x) => x.seed !== seed)))
  } catch {
    /* yut */
  }
}

export function buildArchiveEntry(m: Manifest, clips: Clip[]): ArchiveEntry {
  const st = computeStats(clips)
  const dominant = (Object.entries(st.regimes).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'unknown') as Regime
  const first = clips.find((c) => c.enabled) ?? clips[0]
  return {
    name: m.episode.name,
    sourceDoc: m.episode.source_doc,
    seed: m.build.seed,
    createdAt: new Date().toISOString(), // kuruluş anı — gerçek zaman (üretim kararı değil), seed kuralı kapsamı dışında
    configHash: m.build.config_hash,
    coverScene: first?.scene ?? null,
    clips: st.enabled,
    durationSec: st.total,
    cuts: st.cuts,
    fades: st.fades,
    blacks: st.blacks,
    regimes: st.regimes,
    dominantRegime: dominant,
  }
}
