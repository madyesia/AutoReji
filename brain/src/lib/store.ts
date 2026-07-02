import { create } from 'zustand'
import type { ArchiveEntry, Clip, Manifest, Mode, Screen, SetupState, Toast, Transition, TransitionType } from './types'
import { clamp, TRANSITION } from './utils'
import { clipsSnapshot, diffSnapshots, STYLE_LABEL, type ChangeSummaryPayload } from './diff'
import { loadEpisode } from './data'
import { tauriAvailable } from './native'
import { readText } from './tauri'
import { getSetupState, setSetupState } from './setup'

const DEFAULT_DUR: Record<TransitionType, number> = { cut: 0, fade: 1.5, black: 2.0 }
const HISTORY_CAP = 60
export type EditStyle = 'base' | 'calm' | 'tempo' | 'cine'

interface AppState {
  screen: Screen
  setup: SetupState
  mode: Mode
  manifest: Manifest | null
  clips: Clip[]
  intake: { promptPath: string; videoFolder: string; videoPrompt: string | null; name: string } | null  // Tauri'de seçilen GERÇEK girdiler (tarayıcıda null → örnek/mock)
  selected: number | null
  marked: number[]             // toplu işaretli klipler (⌘/Shift+tık) — toplu işlem hedefi
  hovered: number | null
  style: EditStyle
  playScene: number | null     // tüm-kurgu oynatımında aktif sahne (null = oynamıyor)
  focusOnly: boolean
  riskyOnly: boolean
  motionPreview: boolean       // hover-scrub + hover'da video oynatma açık mı (kullanıcı toggle'lar)
  muted: boolean               // önizleme sesi — KALICI (klipten klibe korunur)
  toasts: Toast[]              // alt-orta bildirimler (sil/sıfırla/toplu işlem/stil değişimi)
  past: Clip[][]
  future: Clip[][]

  setScreen: (s: Screen) => void
  setMode: (m: Mode) => void
  setManifest: (m: Manifest) => void
  setIntake: (i: AppState['intake']) => void
  select: (scene: number | null) => void
  toggleMark: (scene: number) => void
  markRange: (toScene: number) => void
  clearMarks: () => void
  setMarked: (scenes: number[]) => void   // işaret setini geri yükle (yanlış tıkla temizlenince "Geri al")
  bulkTransition: (t: TransitionType) => void
  bulkSetEnabled: (enabled: boolean) => void
  setHovered: (scene: number | null) => void
  setFocusOnly: (b: boolean) => void
  setRiskyOnly: (b: boolean) => void
  toggleMotionPreview: () => void
  toggleMuted: () => void
  setPlayScene: (scene: number | null) => void
  applyStyle: (style: EditStyle) => void

  setTransitionType: (scene: number, t: TransitionType) => void
  setTransitionDur: (scene: number, dur: number) => void
  setTrim: (scene: number, inP: number, outP: number) => void
  toggleEnabled: (scene: number) => void
  resetClip: (scene: number) => void
  resetAll: () => void
  undo: () => void
  redo: () => void

  pushToast: (msg: string, opts?: Partial<Omit<Toast, 'id' | 'msg'>>) => void
  dismissToast: (id: number) => void
  pushChangeSummary: (p: ChangeSummaryPayload) => void
  reopenArchived: (entry: ArchiveEntry) => Promise<void>
  setSetup: (patch: Partial<SetupState>) => void
  completeSetup: () => void
  skipSetup: () => void
}

export const useApp = create<AppState>((set, get) => {
  const edit = (scene: number, fn: (c: Clip) => Clip) =>
    set((s) => ({
      clips: s.clips.map((c) => (c.scene === scene ? fn(structuredClone(c)) : c)),
      past: [...s.past, s.clips].slice(-HISTORY_CAP),
      future: [],
    }))
  let toastSeq = 0
  const _setup = getSetupState()

  return {
    screen: 'setup',          // Hazırlık HER açılışta görünür (tamamlanmışsa hızlı tarar → kullanıcı Giriş'e geçer)
    setup: _setup,
    mode: 'controlled',
    manifest: null,
    clips: [],
    intake: null,
    selected: null,
    marked: [],
    hovered: null,
    style: 'base',
    playScene: null,
    focusOnly: false,
    riskyOnly: false,
    motionPreview: true,
    muted: true,
    toasts: [],
    past: [],
    future: [],

    setScreen: (screen) => set({ screen }),
    setMode: (mode) => set({ mode }),
    setManifest: (manifest) =>
      set({ manifest, clips: structuredClone(manifest.clips), past: [], future: [], style: 'base', marked: [], selected: manifest.clips[0]?.scene ?? null }),
    setIntake: (intake) => set({ intake }),
    select: (selected) => set({ selected }),
    toggleMark: (scene) => set((s) => ({ marked: s.marked.includes(scene) ? s.marked.filter((x) => x !== scene) : [...s.marked, scene] })),
    markRange: (toScene) =>
      set((s) => {
        const a = s.clips.findIndex((c) => c.scene === s.selected)
        const b = s.clips.findIndex((c) => c.scene === toScene)
        if (a < 0 || b < 0) return s
        const [lo, hi] = a <= b ? [a, b] : [b, a]
        const range = s.clips.slice(lo, hi + 1).map((c) => c.scene)
        return { marked: [...new Set([...s.marked, ...range])] }
      }),
    clearMarks: () => set({ marked: [] }),
    setMarked: (scenes) => set({ marked: scenes }),
    // toplu geçiş: işaretli kliplere uygula (ilk klibe geçiş yok); tek undo adımı
    bulkTransition: (t) => {
      const n = get().marked.length
      set((s) => {
        if (!s.marked.length) return s
        const mk = new Set(s.marked)
        const clips = s.clips.map((c, i) => {
          if (i === 0 || !mk.has(c.scene)) return c
          const c2 = structuredClone(c)
          if (t === 'cut') c2.transition_in = null
          else c2.transition_in = { type: t, dur: c2.transition_in?.dur ?? DEFAULT_DUR[t], align: 'center' } as Transition
          c2.decision.user_overridden = true
          return c2
        })
        return { clips, past: [...s.past, s.clips].slice(-HISTORY_CAP), future: [] }
      })
      if (n) get().pushToast(`${n} klip ${TRANSITION[t].label} yapıldı`, { kind: 'amber', ttl: 6000, action: { label: 'Geri al', run: () => get().undo() } })
    },
    bulkSetEnabled: (enabled) => {
      const n = get().marked.length
      set((s) => {
        if (!s.marked.length) return s
        const mk = new Set(s.marked)
        const clips = s.clips.map((c) => (mk.has(c.scene) ? { ...structuredClone(c), enabled } : c))
        return { clips, past: [...s.past, s.clips].slice(-HISTORY_CAP), future: [] }
      })
      if (n) get().pushToast(`${n} klip ${enabled ? 'geri alındı' : 'çıkarıldı'}`, { kind: enabled ? 'ok' : 'danger', icon: enabled ? 'undo' : 'alert', ttl: 6000, action: { label: 'Geri al', run: () => get().undo() } })
    },
    setHovered: (hovered) => set({ hovered }),
    setFocusOnly: (focusOnly) => set({ focusOnly }),
    setRiskyOnly: (riskyOnly) => set({ riskyOnly }),
    toggleMotionPreview: () => set((s) => ({ motionPreview: !s.motionPreview })),
    toggleMuted: () => set((s) => ({ muted: !s.muted })),
    setPlayScene: (playScene) => set({ playScene }),

    // toast: en fazla 3 görünür (en eskiyi düşür). pushToast set'ten SONRA çağrılır (yan etki, render içi değil).
    pushToast: (msg, opts = {}) =>
      set((s) => ({ toasts: [...s.toasts, { id: ++toastSeq, msg, kind: opts.kind ?? 'ok', ttl: opts.ttl ?? 2600, ...opts }].slice(-3) })),
    dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    pushChangeSummary: (p) => get().pushToast('', { kind: 'amber', ttl: 5200, change: p }),
    reopenArchived: async (entry) => {
      // .app: arşivde kayıtlı GERÇEK manifesti diskten oku (savedPath). Tarayıcı önizleme: örnek manifest.
      let m: Manifest | null = null
      if (tauriAvailable()) {
        if (!entry.savedPath) { get().pushToast('Bu bölümün manifest dosyası kaydedilmemiş', { kind: 'amber', icon: 'alert', ttl: 6000, sub: 'Bölümü yeniden aç → Kur ekranında "Manifest\'i Kaydet"e bas.' }); return }
        const raw = await readText(entry.savedPath)
        try { if (raw) m = JSON.parse(raw) as Manifest } catch { /* bozuk JSON → aşağıda yakalanır */ }
        if (!m) { get().pushToast('Kayıtlı manifest okunamadı', { kind: 'danger', icon: 'alert' }); return }
      } else {
        m = await loadEpisode()
      }
      set({ manifest: m, clips: structuredClone(m.clips), past: [], future: [], style: 'base', marked: [], selected: m.clips[0]?.scene ?? null, screen: 'review' })
    },
    setSetup: (patch) => set((s) => { const next = { ...s.setup, ...patch }; setSetupState(next); return { setup: next } }),
    completeSetup: () => set((s) => { const next = { ...s.setup, completedAt: new Date().toISOString() }; setSetupState(next); return { setup: next, screen: 'intake' as Screen } }),
    skipSetup: () => set((s) => { const next = { ...s.setup, skipped: true }; setSetupState(next); return { setup: next, screen: 'intake' as Screen } }),

    // CANLI kurgu stili: manifest tabanından türet (elle değiştirilen klipleri korur).
    // calm = daha çok + daha uzun fade (≈2× , art arda değil) · tempo = daha az + kısa · cine = biraz uzun.
    applyStyle: (style) => {
      const before = clipsSnapshot(get().clips)
      set((s) => {
        const base = s.manifest?.clips
        if (!base) return s
        const N = base.length
        const fa = (d: number) => Math.round(clamp(d, 0.5, 2.5) * 24) / 24
        const result: Clip[] = base.map((c) => structuredClone(c))

        if (style === 'calm') {
          result.forEach((c) => { if (c.transition_in?.type === 'fade') c.transition_in.dur = fa(c.transition_in.dur + 0.4) })
          // en FARKLI sahne sınırlarındaki cut'ları fade yap — taban fade kadar ekle, art arda olmasın
          const baseFades = base.filter((c) => c.transition_in).length
          const cands = base
            .map((c, i) => ({ i, sim: c.decision.signals.prompt_sim_prev }))
            .filter((x) => x.i > 0 && !base[x.i].transition_in && x.sim != null)
            .sort((a, b) => a.sim! - b.sim!)
          let added = 0
          for (const { i } of cands) {
            if (added >= baseFades) break
            if (result[i - 1].transition_in || (i + 1 < N && result[i + 1].transition_in)) continue
            result[i].transition_in = { type: 'fade', dur: fa(1.7), align: 'center' }
            added++
          }
        } else if (style === 'tempo') {
          result.forEach((c, i) => {
            if (i === 0 || !c.transition_in || c.transition_in.type !== 'fade') return
            const major = (base[i].decision.reason || '').includes('eşik')
            if (!major) c.transition_in = null
            else c.transition_in.dur = fa(c.transition_in.dur - 0.3)
          })
        } else if (style === 'cine') {
          result.forEach((c) => { if (c.transition_in?.type === 'fade') c.transition_in.dur = fa(c.transition_in.dur + 0.2) })
        }
        // elle değiştirilen klipleri ve enabled durumunu koru
        const clips = result.map((c, i) => {
          const cur = s.clips[i]
          if (cur?.decision.user_overridden) return cur
          c.enabled = cur?.enabled ?? c.enabled
          return c
        })
        return { clips, style, past: [...s.past, s.clips].slice(-HISTORY_CAP), future: [] }
      })
      const after = clipsSnapshot(get().clips)
      const d = diffSnapshots(before, after)
      if (d.anyChange) get().pushChangeSummary({ kind: 'style', label: STYLE_LABEL[style], summary: d })
    },

    setTransitionType: (scene, t) =>
      edit(scene, (c) => {
        if (t === 'cut') c.transition_in = null
        else {
          const dur = c.transition_in?.dur ?? DEFAULT_DUR[t]
          c.transition_in = { type: t, dur, align: 'center' } as Transition
        }
        c.decision.user_overridden = true
        return c
      }),

    setTransitionDur: (scene, dur) =>
      edit(scene, (c) => {
        if (c.transition_in) { c.transition_in.dur = clamp(dur, 0.25, 2.5); c.decision.user_overridden = true }
        return c
      }),

    setTrim: (scene, inP, outP) =>
      edit(scene, (c) => {
        c.in = clamp(inP, 0, c.out - 0.5)
        c.out = clamp(outP, c.in + 0.5, c.source_dur)
        c.decision.user_overridden = true
        return c
      }),

    toggleEnabled: (scene) => {
      edit(scene, (c) => { c.enabled = !c.enabled; return c })
      const c = get().clips.find((x) => x.scene === scene)
      if (c && !c.enabled) get().pushToast('1 klip çıkarıldı', { kind: 'danger', icon: 'alert', ttl: 6000, action: { label: 'Geri al', run: () => get().undo() } })
    },

    resetClip: (scene) => {
      const orig = get().manifest?.clips.find((c) => c.scene === scene)
      if (orig) edit(scene, () => structuredClone(orig))
    },
    // tüm elle değişiklikleri geri al → algoritmanın orijinal kararlarına dön (tek undo adımı)
    resetAll: () => {
      if (!get().manifest) return
      set((s) => ({ clips: structuredClone(s.manifest!.clips), marked: [], style: 'base', past: [...s.past, s.clips].slice(-HISTORY_CAP), future: [] }))
      get().pushToast('Tüm değişiklikler geri alındı', { kind: 'amber', icon: 'undo', ttl: 6000, action: { label: 'Geri al', run: () => get().undo() } })
    },

    undo: () =>
      set((s) => {
        if (!s.past.length) return s
        const past = [...s.past]; const prev = past.pop()!
        return { clips: prev, past, future: [s.clips, ...s.future].slice(0, HISTORY_CAP) }
      }),
    redo: () =>
      set((s) => {
        if (!s.future.length) return s
        const [next, ...rest] = s.future
        return { clips: next, past: [...s.past, s.clips].slice(-HISTORY_CAP), future: rest }
      }),
  }
})
