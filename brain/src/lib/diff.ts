// Saf, yan etkisiz diff — kurgu stili değişiminde "ne değişti" özeti için.
// (Mod değişimi şu an klip kararını DEĞİŞTİRMİYOR → yalnız stil değişimine bağlanır; mod hazır ama no-op.)
import { computeStats } from './data'
import { fmtDur } from './utils'
import type { Clip } from './types'

export const MODE_LABEL = { fast: 'Hızlı', controlled: 'Kontrollü', director: 'Yönetmen' } as const
export const STYLE_LABEL = { base: 'Doğal', calm: 'Sakin', tempo: 'Tempolu', cine: 'Sinematik' } as const

export interface Snap { enabled: number; cuts: number; fades: number; blacks: number; avg: number }

export const clipsSnapshot = (clips: Clip[]): Snap => {
  const s = computeStats(clips)
  return { enabled: s.enabled, cuts: s.cuts, fades: s.fades, blacks: s.blacks, avg: s.avg }
}

export interface Delta {
  key: string; label: string; from: number; to: number; delta: number
  dir: 'up' | 'down'; kind: 'count' | 'dur'; accent: 'amber' | 'neutral'
}
export interface DeltaSummary { deltas: Delta[]; anyChange: boolean }
export interface ChangeSummaryPayload { kind: 'mode' | 'style'; label: string; summary: DeltaSummary }

export function diffSnapshots(b: Snap, a: Snap): DeltaSummary {
  const mk = (key: string, label: string, from: number, to: number, kind: 'count' | 'dur'): Delta | null => {
    const delta = +(to - from).toFixed(kind === 'dur' ? 2 : 0)
    if (delta === 0) return null
    const dir: 'up' | 'down' = delta > 0 ? 'up' : 'down'
    return { key, label, from, to, delta, dir, kind, accent: dir === 'up' ? 'amber' : 'neutral' }
  }
  // not: cut otomatik türetilir (her fade bir cut yutar) → hem +fade hem -cut göstermek gürültü; cut listelenmez
  const deltas = [
    mk('fades', 'fade', b.fades, a.fades, 'count'),
    mk('blacks', 'black', b.blacks, a.blacks, 'count'),
    mk('avg', 'ort süre', b.avg, a.avg, 'dur'),
    mk('enabled', 'etkin klip', b.enabled, a.enabled, 'count'),
  ].filter((x): x is Delta => x !== null)
  deltas.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta)) // en büyük etki önce
  return { deltas, anyChange: deltas.length > 0 }
}

export const fmtDelta = (d: Delta): string =>
  d.kind === 'dur' ? `${fmtDur(d.from)}→${fmtDur(d.to)}` : `${d.delta > 0 ? '+' : ''}${d.delta} ${d.label}`
