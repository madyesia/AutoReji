import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Clip, Regime, Scale, TransitionType } from './types'

export const cn = (...a: ClassValue[]) => twMerge(clsx(a))

export const APP_VERSION = 'beta v1.0'

export const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x))

/** saniye → "4.92s" */
export const fmtDur = (s: number) => `${s.toFixed(2)}s`
/** saniye → "M:SS" (toplam süre) */
export const fmtClock = (s: number) => {
  const m = Math.floor(s / 60)
  const sec = Math.round(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}
/** saniye → "13.5 dk" */
export const fmtMin = (s: number) => `${(s / 60).toFixed(1)} dk`

export const getTransition = (c: Clip): TransitionType => c.transition_in?.type ?? 'cut'

export interface Meta { key: string; label: string; color: string; deep?: string }

export const REGIME: Record<Regime, Meta> = {
  exterior: { key: 'exterior', label: 'Dış', color: 'var(--color-ext)', deep: 'var(--color-ext-deep)' },
  interior: { key: 'interior', label: 'İç', color: 'var(--color-int)', deep: 'var(--color-int-deep)' },
  sleeping: { key: 'sleeping', label: 'Uyku', color: 'var(--color-sleep)', deep: 'var(--color-sleep-deep)' },
  unknown: { key: 'unknown', label: '—', color: 'var(--color-fg-subtle)' },
}

export const TRANSITION: Record<TransitionType, Meta & { glyph: string }> = {
  cut: { key: 'cut', label: 'Cut', color: 'var(--color-cut)', glyph: '╱' },
  fade: { key: 'fade', label: 'Fade', color: 'var(--color-fade)', glyph: '◑' },
  black: { key: 'black', label: 'Black', color: 'var(--color-dip)', glyph: '●' },
}

/** Çekim ölçeği → etiket + kimlik rengi (film şeridi alt-glow + timeline'da kullanılır) */
export const SCALE_META: Record<Scale, { label: string; color: string }> = {
  drone:            { label: 'Drone',     color: '#7fb6e6' },  // gök mavisi
  wide:             { label: 'Geniş',     color: '#5ec9a6' },  // teal-yeşil
  medium:           { label: 'Orta',      color: '#e7b667' },  // amber
  close_up:         { label: 'Yakın',     color: '#e98c5a' },  // turuncu
  extreme_close_up: { label: 'Çok yakın', color: '#e36d8d' },  // pembe-kırmızı
  pov:              { label: 'POV',       color: '#ab8ce2' },  // mor
  top_down:         { label: 'Tepeden',   color: '#6f8ce2' },  // indigo
  other:            { label: 'Genel',     color: '#8a93a8' },  // nötr gri
}
export const scaleLabel = (s: Scale) => SCALE_META[s]?.label ?? 'Genel'
export const scaleColor = (s: Scale) => SCALE_META[s]?.color ?? '#8a93a8'

/** güven skoru → renk (yeşil→amber→kırmızı) */
export const confColor = (c: number) =>
  c >= 0.85 ? 'var(--color-ok)' : c >= 0.7 ? 'var(--color-amber-400)' : 'var(--color-danger)'

/** dosya adı (yoldan) */
export const basename = (p: string) => p.split('/').pop() ?? p
