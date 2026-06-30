import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CircleCheck, Check, Loader2, Circle, Sparkles, ChevronDown } from 'lucide-react'
import { useOnline } from '../lib/setup'
import { useCountUp } from './ui'
import { cn } from '../lib/utils'

const EXPO = [0.16, 1, 0.3, 1] as const

/* ============================================================================
   ScanBeam — bir cam yüzeyin üstünden geçen fosforlu ışık huzmesi (tarama hissi).
   Parent relative + overflow-hidden olmalı. reduced-motion → statik üst-amber hairline.
   ============================================================================ */
export function ScanBeam({ active = true, className }: { active?: boolean; className?: string }) {
  const reduce = useReducedMotion()
  if (!active) return null
  if (reduce) return <span aria-hidden className={cn('pointer-events-none absolute inset-x-0 top-0 h-px bg-amber-400/25', className)} />
  return (
    <motion.span
      aria-hidden
      className={cn('pointer-events-none absolute inset-y-0 w-[120px]', className)}
      style={{ background: 'linear-gradient(90deg, transparent, var(--glow-amber) 50%, transparent)', boxShadow: '0 0 24px 2px var(--glow-amber)' }}
      initial={{ x: '-130%' }}
      animate={{ x: '130%' }}
      transition={{ duration: 2.2, ease: 'linear', repeat: Infinity }}
    />
  )
}

/* ============================================================================
   ProgressRing — determinate / indeterminate / pulse. Fosforlu uç noktası + arka glow.
   ============================================================================ */
let ringSeq = 0
export function ProgressRing({
  value = 0, variant = 'determinate', size = 132, stroke = 6, children,
}: { value?: number; variant?: 'determinate' | 'indeterminate' | 'pulse'; size?: number; stroke?: number; children?: ReactNode }) {
  const reduce = useReducedMotion()
  const [gid] = useState(() => `ar-ring-${++ringSeq}`)
  const R = (size - stroke) / 2 - 2
  const C = 2 * Math.PI * R
  const p = Math.max(0, Math.min(1, value))
  const cx = size / 2
  // fosforlu uç noktası (determinate, 0<p<1)
  const tipAngle = -Math.PI / 2 + p * 2 * Math.PI
  const tip = { x: cx + R * Math.cos(tipAngle), y: cx + R * Math.sin(tipAngle) }

  const ring = (
    <svg className="h-full w-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cx} r={R} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={stroke} />
      {variant === 'determinate' ? (
        <circle cx={cx} cy={cx} r={R} fill="none" stroke={`url(#${gid})`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - p)} />
      ) : variant === 'indeterminate' ? (
        <circle cx={cx} cy={cx} r={R} fill="none" stroke={`url(#${gid})`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${C * 0.28} ${C}`} />
      ) : (
        <circle cx={cx} cy={cx} r={R} fill="none" stroke="var(--color-amber-400)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${C * 0.12} ${C}`} opacity={0.6} />
      )}
      {variant === 'determinate' && p > 0.001 && p < 0.999 && (
        <>
          <circle cx={tip.x} cy={tip.y} r={stroke * 0.9} fill="var(--color-amber-400)" opacity={0.4} />
          <circle cx={tip.x} cy={tip.y} r={stroke * 0.5} fill="#fce4b3" />
        </>
      )}
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f6d293" /><stop offset="1" stopColor="#dc9f4a" /></linearGradient>
      </defs>
    </svg>
  )

  return (
    <div className="relative" style={{ height: size, width: size }}>
      <div aria-hidden className="pointer-events-none absolute inset-0 rounded-full" style={{ boxShadow: '0 0 30px -6px var(--glow-amber)' }} />
      {variant === 'indeterminate' && !reduce ? (
        <motion.div className="h-full w-full" animate={{ rotate: 360 }} transition={{ duration: 1.1, ease: 'linear', repeat: Infinity }}>{ring}</motion.div>
      ) : ring}
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}

/* ============================================================================
   ApprovedSeal — "mühür basıldı" onayı. kind: real (yeşil) / manual (amber/elle) / sim (mavi/önizleme).
   ============================================================================ */
const SEAL = {
  real: { color: 'var(--color-ok)', glow: 'var(--glow-ok)', Icon: CircleCheck },
  manual: { color: 'var(--color-amber-400)', glow: 'var(--glow-amber)', Icon: Check },
  sim: { color: 'var(--color-info)', glow: 'var(--glow-info)', Icon: Sparkles },
} as const
export function ApprovedSeal({ kind = 'real', size = 64 }: { kind?: 'real' | 'manual' | 'sim'; size?: number }) {
  const reduce = useReducedMotion()
  const { color, glow, Icon } = SEAL[kind]
  return (
    <div className="relative flex items-center justify-center" style={{ height: size, width: size }}>
      {!reduce && (
        <>
          <motion.span aria-hidden className="absolute rounded-full" style={{ height: size, width: size, border: `1.5px solid ${color}` }}
            initial={{ scale: 0.55, opacity: 0.55 }} animate={{ scale: 1.9, opacity: 0 }} transition={{ duration: 1.1, ease: 'easeOut' }} />
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.span key={i} aria-hidden className="absolute h-1 w-1 rounded-full" style={{ background: color, transform: `rotate(${i * 60}deg) translateY(-${size / 2 + 5}px)` }}
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.8 }} transition={{ delay: 0.15 + i * 0.04, duration: 0.3 }} />
          ))}
        </>
      )}
      <motion.div
        className="flex items-center justify-center rounded-2xl"
        style={{ height: size, width: size, background: `color-mix(in srgb, ${color} 16%, transparent)`, color, boxShadow: `0 0 26px -6px ${glow}` }}
        initial={reduce ? { opacity: 0 } : { scale: 0, rotate: -12 }}
        animate={reduce ? { opacity: 1 } : { scale: 1, rotate: 0 }}
        transition={reduce ? { duration: 0.2 } : { type: 'spring', stiffness: 300, damping: 16, delay: 0.05 }}
      >
        <Icon size={size * 0.52} />
      </motion.div>
    </div>
  )
}

/* ============================================================================
   ConnPulse — bağlantı durumu nabzı (navigator.onLine GERÇEK). Sakin ASMR temposu.
   ============================================================================ */
export function ConnPulse({ showLabel = false }: { showLabel?: boolean }) {
  const online = useOnline()
  const reduce = useReducedMotion()
  const color = online ? 'var(--color-ok)' : 'var(--color-warn)'
  return (
    <span className="inline-flex items-center gap-1.5" aria-label={online ? 'çevrimiçi' : 'çevrimdışı'}>
      <span className="relative inline-flex h-2 w-2 items-center justify-center">
        {online && !reduce && (
          <motion.span aria-hidden className="absolute inset-0 rounded-full" style={{ border: `1px solid ${color}` }}
            initial={{ scale: 1, opacity: 0.5 }} animate={{ scale: 2.4, opacity: 0 }} transition={{ duration: 2.4, ease: 'easeOut', repeat: Infinity }} />
        )}
        <span className="h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 8px -1px ${color}` }} />
      </span>
      {showLabel && <span className="text-[11px] text-fg-muted">{online ? 'Çevrimiçi' : 'Çevrimdışı'}</span>}
    </span>
  )
}

/* ============================================================================
   StageTimeline — dikey raylı aşamalı-rapor (Analiz/Build/Hazırlık ortak deseni).
   ============================================================================ */
export interface Stage { label: string; sub?: string; icon?: ReactNode }
export function StageTimeline({ stages, activeIndex }: { stages: Stage[]; activeIndex: number }) {
  return (
    <div className="relative flex flex-col gap-1">
      <span aria-hidden className="absolute bottom-3 left-[18px] top-3 w-px bg-white/8" />
      {stages.map((s, i) => {
        const state = i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'idle'
        return (
          <div key={i} aria-current={state === 'active' || undefined}
            className={cn('relative flex items-center gap-3 rounded-xl px-3 py-2', state === 'active' && 'bg-white/[0.05]')}>
            {state === 'active' && <span aria-hidden className="absolute inset-y-1.5 left-0 w-[2px] rounded-full bg-amber-400" style={{ boxShadow: '0 0 8px var(--glow-amber)' }} />}
            <span className={cn('z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
              state === 'done' ? 'bg-ok/15 text-ok' : state === 'active' ? 'bg-amber-400/15 text-amber-300' : 'bg-white/[0.04] text-fg-faint')}>
              {state === 'done' ? <Check size={15} /> : state === 'active' ? <Loader2 size={15} className="animate-spin" /> : s.icon ?? <Circle size={11} />}
            </span>
            <div className="min-w-0 flex-1">
              <div className={cn('text-[13px] leading-tight', state === 'idle' ? 'text-fg-faint' : 'text-fg')}>{s.label}</div>
              {state === 'active' && s.sub && <div className="text-[11px] text-fg-subtle">{s.sub}</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ============================================================================
   BirthStat — sayı "doğuyor" gibi: blur-in + scale-overshoot + count-up
   ============================================================================ */
export function BirthStat({ label, value, format, accent, sub, delay = 0 }: {
  label: string; value: number; format?: (n: number) => string; accent?: string; sub?: ReactNode; delay?: number
}) {
  const reduce = useReducedMotion()
  const text = useCountUp(value, format, reduce ? 0 : 0.7)
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wider text-fg-subtle">{label}</span>
      <motion.span
        className="text-xl font-semibold tabular"
        style={{ color: accent, willChange: 'transform, filter' }}
        initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.92, filter: 'blur(7px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={reduce ? { duration: 0 } : { scale: { type: 'spring', stiffness: 420, damping: 17, delay }, opacity: { duration: 0.3, delay }, filter: { duration: 0.45, ease: EXPO, delay } }}
      >
        {text}
      </motion.span>
      {sub && <span className="text-[11px] text-fg-subtle tabular">{sub}</span>}
    </div>
  )
}

/* ============================================================================
   RippleField — alttan yayılan, METNİ KAPATMAYAN ince halkalar (CSS keyframe; ek rAF yok)
   ============================================================================ */
export function RippleField({ tint = 'var(--glow-amber)', count = 3 }: { tint?: string; count?: number }) {
  const reduce = useReducedMotion()
  const rings = reduce ? 1 : count
  return (
    <div className="ripple-field" aria-hidden style={{ ['--ripple-tint' as string]: tint }}>
      {Array.from({ length: rings }).map((_, i) => (
        <span key={i} className="ripple-ring" style={{
          ['--ripple-dur' as string]: `${9 + i * 1.5}s`,
          ['--ripple-peak' as string]: String(Math.max(0.18, 0.42 - i * 0.06)),
          animationDelay: `${i * 1.1}s`,
          ...(reduce ? { animation: 'none', opacity: 0.18 } : {}),
        }} />
      ))}
    </div>
  )
}

/* ============================================================================
   SweepReveal — premium ışık süpürme; onProgress 0..1 "frontier" yayar (satır onayı senkronu)
   ============================================================================ */
export function SweepReveal({ active = true, durationMs = 1400, onProgress, className }: {
  active?: boolean; durationMs?: number; onProgress?: (f: number) => void; className?: string
}) {
  const reduce = useReducedMotion()
  if (!active || reduce) return null
  return (
    <motion.span
      aria-hidden
      className={cn('pointer-events-none absolute inset-y-0 left-0 w-[42%]', className)}
      style={{ background: 'linear-gradient(90deg, transparent, var(--glow-amber) 60%, rgb(252 228 179 / 0.9) 92%, transparent)', filter: 'blur(2px)', mixBlendMode: 'screen' }}
      initial={{ x: '-110%' }}
      animate={{ x: '230%' }}
      transition={{ duration: durationMs / 1000, ease: [0.5, 0, 0.5, 1] }}
      onUpdate={(latest) => {
        const xs = (latest as { x?: string | number }).x
        const xv = typeof xs === 'number' ? xs : parseFloat(String(xs ?? '0'))
        onProgress?.(Math.max(0, Math.min(1, (xv + 110) / 340)))
      }}
    />
  )
}

/* ============================================================================
   RevealPanel — alttan açılan accordion (height:auto) + staggerli iç içerik
   ============================================================================ */
export function RevealPanel({ title, defaultOpen = false, children }: { title: ReactNode; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  const reduce = useReducedMotion()
  return (
    <div>
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-2 text-left">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-fg-subtle">{title}</span>
        <ChevronDown size={15} className="shrink-0 text-fg-subtle transition-transform duration-[var(--dur-base)]" style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduce ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ height: { duration: 0.34, ease: EXPO }, opacity: { duration: 0.22, delay: 0.06 } }}
            className="overflow-hidden"
          >
            <div className="pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ============================================================================
   useScanChoreography — sıralı %-tarama: aktif satır sırayla gezer, ringValue 0→1 dolar.
   fast[i]=true (önceden onaylı) → o satır hızlı taranır. Tek zamanlayıcı (ek sürekli rAF yok).
   ============================================================================ */
export function useScanChoreography(count: number, fast: boolean[] = []) {
  const reduce = useReducedMotion()
  const [scanIdx, setScanIdx] = useState(reduce ? count : -1)
  const [ringValue, setRingValue] = useState(reduce ? 1 : 0)
  useEffect(() => {
    if (reduce) { setScanIdx(count); setRingValue(1); return }
    let raf = 0
    let cancelled = false
    let stepTimer: ReturnType<typeof setTimeout> | undefined
    let idx = -1
    const advance = () => {
      idx++
      if (idx >= count) { setScanIdx(count); return }
      setScanIdx(idx); setRingValue(0)
      const dur = fast[idx] ? 320 : 820
      const t0 = performance.now()
      const tick = (now: number) => {
        if (cancelled) return
        const v = Math.min(1, (now - t0) / dur)
        setRingValue(v)
        if (v < 1) raf = requestAnimationFrame(tick)
        else stepTimer = setTimeout(advance, 150)
      }
      raf = requestAnimationFrame(tick)
    }
    stepTimer = setTimeout(advance, 220)
    return () => { cancelled = true; cancelAnimationFrame(raf); if (stepTimer) clearTimeout(stepTimer) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, reduce])
  return { scanIdx, ringValue }
}

/* ============================================================================
   SoftSweep — çok saydam, dengeli (simetrik), diffuse ışık; soldan sağa GİDİP GELİR.
   Yazıları KAPATMAZ (düşük opacity + blur). Analiz gibi okunması gereken ekranlar için.
   ============================================================================ */
export function SoftSweep({ active = true, className }: { active?: boolean; className?: string }) {
  const reduce = useReducedMotion()
  if (!active || reduce) return null
  return (
    <motion.span
      aria-hidden
      className={cn('pointer-events-none absolute inset-y-0 left-0 w-1/2', className)}
      style={{
        // simetrik + yumuşak: her iki kenar eşit söner, ortada çok hafif amber; blur ile dağınık
        background: 'linear-gradient(90deg, transparent 0%, rgba(234,184,102,0.05) 35%, rgba(234,184,102,0.09) 50%, rgba(234,184,102,0.05) 65%, transparent 100%)',
        filter: 'blur(12px)',
      }}
      initial={{ x: '-60%' }}
      animate={{ x: ['-60%', '170%', '-60%'] }}
      transition={{ duration: 3.8, ease: 'easeInOut', repeat: Infinity }}
    />
  )
}

export { EXPO }
