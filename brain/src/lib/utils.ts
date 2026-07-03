import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'
import type { Clip, Regime, Scale, TransitionType } from './types'

// DS2 tip ölçeği (--text-micro…display) tailwind-merge'e FONT-BOYUTU olarak tanıtılır.
// Aksi hâlde twMerge 'text-body' gibi özel token'ları RENK sanıp 'text-ink-950' ile çakıştırır
// ve koyu rengi siler → amber butonlarda yazı kalıtılan beyaza düşerdi (v1.2 regresyonu).
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['micro', 'caption', 'label', 'body', 'ui', 'lead', 'title', 'headline', 'display'] }],
    },
  },
})
export const cn = (...a: ClassValue[]) => twMerge(clsx(a))

export const APP_VERSION = 'beta v1.5'

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

export const TRANSITION: Record<TransitionType, Meta & { glyph: string; dative: string }> = {
  cut: { key: 'cut', label: 'Cut', color: 'var(--color-cut)', glyph: '╱', dative: "Cut'a" },
  fade: { key: 'fade', label: 'Fade', color: 'var(--color-fade)', glyph: '◑', dative: "Fade'e" },
  black: { key: 'black', label: 'Black', color: 'var(--color-dip)', glyph: '●', dative: "Black'e" },
}

/** Çekim ölçeği → etiket + kimlik rengi. Renklerin TEK kaynağı index.css @theme
 *  (--color-scale-*); tüm tüketiciler CSS bağlamı (color-mix/gradient/background) → var() güvenli. */
export const SCALE_META: Record<Scale, { label: string; color: string }> = {
  drone:            { label: 'Drone',     color: 'var(--color-scale-drone)' },
  wide:             { label: 'Geniş',     color: 'var(--color-scale-wide)' },
  medium:           { label: 'Orta',      color: 'var(--color-scale-medium)' },
  close_up:         { label: 'Yakın',     color: 'var(--color-scale-close)' },
  extreme_close_up: { label: 'Çok yakın', color: 'var(--color-scale-xclose)' },
  pov:              { label: 'POV',       color: 'var(--color-scale-pov)' },
  top_down:         { label: 'Tepeden',   color: 'var(--color-scale-top)' },
  other:            { label: 'Genel',     color: 'var(--color-scale-other)' },
}
export const scaleLabel = (s: Scale) => SCALE_META[s]?.label ?? 'Genel'
export const scaleColor = (s: Scale) => SCALE_META[s]?.color ?? 'var(--color-scale-other)'

/** İkon boyut standardı (DS2 C5) — lucide `size` prop'u bunlardan alınmalı (dekoratif ≥22 muaf).
 *  NOT: mevcut kullanımların migrasyonu ayrı tur (görsel mikro-farklar ekran ekran onayla). */
export const ICON = { xs: 12, sm: 14, md: 16, lg: 18 } as const

/** güven skoru → renk (yeşil→amber→kırmızı) */
export const confColor = (c: number) =>
  c >= 0.85 ? 'var(--color-ok)' : c >= 0.7 ? 'var(--color-amber-400)' : 'var(--color-danger)'

/** dosya adı (yoldan) */
export const basename = (p: string) => p.split('/').pop() ?? p
