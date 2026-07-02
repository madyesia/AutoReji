import type { Clip, Manifest } from './types'
import { getTransition } from './utils'
import { tauriAvailable } from './native'
import { convertFileSrc } from '@tauri-apps/api/core'

export async function loadEpisode(): Promise<Manifest> {
  const r = await fetch('/episode.json')
  if (!r.ok) throw new Error('Örnek bölüm yüklenemedi — sayfayı yenileyip tekrar dene.')
  return r.json()
}

export const thumbUrl = (scene: number) => `/thumbs/${scene}.jpg`
// Klip önizleme karesi: .app'te pipeline'ın ürettiği GERÇEK kare (clip.thumb → asset://);
// tarayıcı önizlemede veya thumb yoksa mock /thumbs'a düşer (UI onError ile karoya da düşebilir).
export function clipThumb(c: Clip): string {
  if (tauriAvailable() && c.thumb) {
    try { return convertFileSrc(c.thumb) } catch { /* mock'a düş */ }
  }
  return thumbUrl(c.scene)
}
// hover-scrub: her klip için yatay sprite şeridi (SPRITE_FRAMES kare tek görselde, ağ çağrısı yok)
export const SPRITE_FRAMES = 8
export const spriteUrl = (scene: number) => `/sprites/${scene}.jpg`
// Sprite şeritleri yalnız dev önizlemenin mock verisinde var; pipeline .app için üretmiyor.
// .app'te scrub arayüzü (kare değişimi + ilerleme çizgisi + kopya) bu kapıyla tamamen kapanır —
// aksi hâlde kare değişmezken ilerleme çizgisi oynuyor gibi görünür (sahte geri bildirim).
export const hasSprite = (_c: Clip) => !tauriAvailable()
// Gerçek video önizleme: paketlenmiş .app'te asset protokolü (convertFileSrc → asset://); dev tarayıcıda Vite /@fs.
export function videoUrl(file: string): string {
  if (tauriAvailable()) {
    try { return convertFileSrc(file) } catch { /* /@fs'e düş */ }
  }
  return `/@fs${file.split('/').map(encodeURIComponent).join('/')}`
}

export interface Stats {
  count: number; enabled: number
  cuts: number; fades: number; blacks: number
  total: number; avg: number; min: number; max: number
  lowConf: number
  regimes: { exterior: number; interior: number; sleeping: number; unknown: number }
}

export function computeStats(clips: Clip[]): Stats {
  const on = clips.filter((c) => c.enabled)
  const durs = on.map((c) => c.out - c.in)
  let cuts = 0, fades = 0, blacks = 0
  for (const c of on) {
    const t = getTransition(c)
    if (t === 'fade') fades++
    else if (t === 'black') blacks++
    else cuts++
  }
  const regimes = { exterior: 0, interior: 0, sleeping: 0, unknown: 0 }
  for (const c of on) regimes[c.meta.regime]++
  return {
    count: clips.length,
    enabled: on.length,
    cuts: Math.max(0, cuts - 1), // ilk klibin "cut"ı geçiş sayılmaz
    fades, blacks,
    total: durs.reduce((a, b) => a + b, 0),
    avg: durs.length ? durs.reduce((a, b) => a + b, 0) / durs.length : 0,
    min: durs.length ? Math.min(...durs) : 0,
    max: durs.length ? Math.max(...durs) : 0,
    lowConf: on.filter((c) => c.decision.confidence < 0.7).length,
    regimes,
  }
}

/** odak inceleme: yalnızca dikkat gerektiren klipler (düşük güven, geçiş noktası, çift çekim, risk) */
export function needsAttention(c: Clip): boolean {
  return (
    c.decision.confidence < 0.72 ||
    getTransition(c) !== 'cut' ||
    (c.variant.candidates?.length ?? 0) > 1 ||
    c.scale > 1.0 ||
    (c.qc?.risk ?? 0) > 0
  )
}

export const riskColor = (level?: string) =>
  level === 'high' ? 'var(--color-danger)' : level === 'med' ? 'var(--color-warn)' : 'var(--color-amber-400)'
export const countRisky = (clips: Clip[]) => clips.filter((c) => (c.qc?.risk ?? 0) > 0).length
