// AutoReji manifest şeması (Blueprint §10) — BEYİN üretir, UI okur/düzenler.

export type Regime = 'exterior' | 'interior' | 'sleeping' | 'unknown'
export type TransitionType = 'cut' | 'fade' | 'black'
export type Scale =
  | 'drone' | 'wide' | 'medium' | 'close_up' | 'extreme_close_up'
  | 'pov' | 'top_down' | 'other'

export interface Transition {
  type: 'fade' | 'black'
  dur: number
  align: 'center'
  handle?: number
}

export interface ClipDecision {
  reason: string
  confidence: number
  signals: {
    regime_change: string | null
    prompt_sim_prev: number | null
    action?: boolean
    environment?: boolean
    color_shift?: number | null
    jarring_cut?: boolean
    motion?: number | null
    visual_contrast?: number | null
  }
  user_overridden: boolean
  algo_default: Transition | null
}

export interface ClipVariant {
  chosen: string | null
  candidates: string[]
  reason: string
}

export interface Clip {
  index: number
  scene: number
  file: string
  in: number
  out: number
  source_dur: number
  scale: number
  resolution?: number | null   // gerçek video yüksekliği (ffprobe); <1080 = düşük çözünürlük uyarısı
  enabled: boolean
  meta: {
    scale: Scale
    subjects: string[]
    regime: Regime
    state: string
    color: string | null
  }
  transition_in: Transition | null
  analysis?: {
    motion: number | null; brightness: number | null; saturation: number | null
    energy?: number | null; role?: string | null; linger?: boolean | null; mood?: string | null
  } | null
  qc?: { issues: { k: string; sev: number; d: string }[]; risk: number; level: 'ok' | 'low' | 'med' | 'high' } | null
  audio: { micro_crossfade: number; mask_stereo_shift: boolean }
  decision: ClipDecision
  variant: ClipVariant
  thumb: string | null
}

export interface Manifest {
  schema_version: string
  episode: { name: string; source_doc: string }
  sequence: {
    fps: number; width: number; height: number; par: string
    audio_rate: number; audio_channels: number
  }
  build: {
    generated_at: string; seed: string; engine_version: string
    config_hash: string; fades_downgraded_to_cut?: number
  }
  intro: { fade_in_from_black: number }
  outro: { fade_out_to_black: number }
  clips: Clip[]
}

export type Screen = 'setup' | 'intake' | 'analysis' | 'review' | 'build' | 'archive'
export type Mode = 'fast' | 'controlled' | 'director'

// ---- Hazırlık (Setup) — ilk-ekran kapısı (Giriş'in önünde) ----
// 'ok' = sistem gerçek-doğruladı (Faz 4 native) · 'ack' = kullanıcı elle onayladı / simüle (amber, dürüst) · 'pending' = bekliyor
export type SetupItemState = 'ok' | 'ack' | 'pending'
export interface SetupState {
  premiere: SetupItemState   // Premiere Pro + developer mode
  model: SetupItemState      // AI modeli (qwen2.5-VL) indirildi
  plugin: SetupItemState     // MONTAJCI paneli UXP'ye entegre (kullanıcı "Test et" ile doğrular)
  skipped: boolean
  completedAt: string | null
}

// ---- Toast / bildirim ----
import type { ChangeSummaryPayload } from './diff'
export type ToastKind = 'ok' | 'warn' | 'danger' | 'amber'
export interface Toast {
  id: number
  msg: string
  sub?: string
  kind: ToastKind
  icon?: 'check' | 'alert' | 'undo' | 'copy'
  ttl: number                                   // ms; 0 = otomatik sönme yok
  action?: { label: string; run: () => void }   // örn. { label: 'Geri al', run: undo }
  change?: ChangeSummaryPayload                  // varsa ToastItem özel "ne değişti" içeriği render eder
}

// ---- Arşiv / Geçmiş (localStorage; Faz 4'te gerçek _archive/) ----
export interface ArchiveEntry {
  name: string
  sourceDoc: string
  seed: string
  createdAt: string                              // ISO
  configHash: string
  coverScene: number | null
  clips: number
  durationSec: number
  cuts: number
  fades: number
  blacks: number
  regimes: { exterior: number; interior: number; sleeping: number; unknown: number }
  dominantRegime: Regime
  // manifest kaydedildiğinde işaretlenir (Kur ekranı "Manifest'i Kaydet")
  savedAt?: string                               // ISO — kaydetme anı
  savedPath?: string | null                      // mutlak klasör/dosya yolu (Tauri) · tarayıcıda güvenlik gereği yok
  savedName?: string                             // dosya adı (her zaman bilinir)
}
