import { type ReactNode, type ButtonHTMLAttributes, forwardRef, useEffect, useState } from 'react'
import * as RTooltip from '@radix-ui/react-tooltip'
import * as RSlider from '@radix-ui/react-slider'
import * as RSwitch from '@radix-ui/react-switch'
import { motion, animate, useMotionValue, useReducedMotion } from 'framer-motion'
import { cn } from '../lib/utils'
import { EASE, SPRING } from '../lib/motion'

/* ---------------- Button ---------------- */
type Variant = 'primary' | 'ghost' | 'subtle' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg'
const V: Record<Variant, string> = {
  primary:
    'text-ink-950 font-semibold bg-gradient-to-b from-amber-300 to-amber-500 hover:from-amber-200 hover:to-amber-400 shadow-glow-sm active:translate-y-px',
  ghost: 'text-fg-muted hover:text-fg hover:bg-white/5',
  subtle: 'text-fg bg-white/[0.06] hover:bg-white/[0.1] border border-white/8 bevel',
  outline: 'text-fg border border-white/12 hover:border-white/20 hover:bg-white/5',
  danger: 'text-danger bg-danger/10 hover:bg-danger/15 border border-danger/20',
}
const S: Record<Size, string> = {
  sm: 'h-8 px-3 text-body gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-ui gap-2 rounded-lg',
  lg: 'h-12 px-6 text-lead gap-2.5 rounded-xl',
}
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant; size?: Size
}
export const Button = forwardRef<HTMLButtonElement, BtnProps>(
  ({ variant = 'subtle', size = 'md', className, children, ...p }, ref) => (
    <button
      ref={ref}
      className={cn('inline-flex items-center justify-center select-none transition-all duration-[var(--dur-fast)] ease-[var(--ease-out-quart)] active:scale-[0.97] disabled:opacity-60 disabled:pointer-events-none', V[variant], S[size], className)}
      {...p}
    >
      {children}
    </button>
  ),
)
Button.displayName = 'Button'

export function IconButton({ className, active, children, ...p }: BtnProps & { active?: boolean }) {
  return (
    <button
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg text-fg-muted transition-all duration-[var(--dur-fast)] active:scale-[0.94] hover:text-fg hover:bg-white/8',
        active && 'bg-white/10 text-fg',
        className,
      )}
      {...p}
    >
      {children}
    </button>
  )
}

/* ---------------- Segmented ---------------- */
export function Segmented<T extends string>({
  options, value, onChange, className,
}: {
  options: { value: T; label: ReactNode; icon?: ReactNode }[]
  value: T; onChange: (v: T) => void; className?: string
}) {
  return (
    <div className={cn('relative inline-flex items-center gap-0.5 rounded-xl bg-ink-900/70 p-1 ring-hair', className)}>
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn('relative z-10 inline-flex items-center gap-1.5 rounded-lg px-3 h-8 text-body font-medium transition-colors duration-200',
              on ? 'text-ink-950' : 'text-fg-muted hover:text-fg')}
          >
            {on && (
              <motion.span layoutId="seg" transition={SPRING.pill}
                className="absolute inset-0 -z-10 rounded-lg bg-gradient-to-b from-amber-300 to-amber-500 shadow-glow-sm" />
            )}
            {o.icon}{o.label}
          </button>
        )
      })}
    </div>
  )
}

/* ---------------- Badge / Dot / Kbd ---------------- */
export function Badge({ children, color = 'var(--color-fg-muted)', soft = true, className }: { children: ReactNode; color?: string; soft?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 h-5 text-caption font-medium tabular leading-none', className)}
      style={soft ? { color, background: `color-mix(in srgb, ${color} 14%, transparent)` } : { color }}>
      {children}
    </span>
  )
}
export const Dot = ({ color, size = 7 }: { color: string; size?: number }) => (
  <span className="inline-block rounded-full shrink-0" style={{ width: size, height: size, background: color, boxShadow: `0 0 8px -1px ${color}` }} />
)
export const Kbd = ({ children }: { children: ReactNode }) => (
  <kbd className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-md bg-ink-900 text-fg-subtle text-caption font-medium ring-hair tabular">{children}</kbd>
)

/* ---------------- Tooltip ---------------- */
export function Tip({ children, label, side = 'top' }: { children: ReactNode; label: ReactNode; side?: 'top' | 'bottom' | 'left' | 'right' }) {
  return (
    <RTooltip.Root>
      <RTooltip.Trigger asChild>{children}</RTooltip.Trigger>
      <RTooltip.Portal>
        <RTooltip.Content side={side} sideOffset={8}
          className="z-50 rounded-lg bg-ink-700 px-2.5 py-1.5 text-label text-fg shadow-pop ring-hair data-[state=delayed-open]:animate-[float-up_.18s_ease-out]">
          {label}
          <RTooltip.Arrow className="fill-ink-700" />
        </RTooltip.Content>
      </RTooltip.Portal>
    </RTooltip.Root>
  )
}

/* ---------------- Slider ---------------- */
export function Slider({ value, min, max, step = 0.01, onValueChange, accent = 'var(--color-amber-400)' }: {
  value: number; min: number; max: number; step?: number; onValueChange: (v: number) => void; accent?: string
}) {
  return (
    <RSlider.Root className="relative flex h-5 w-full touch-none items-center" value={[value]} min={min} max={max} step={step}
      onValueChange={([v]) => onValueChange(v)}>
      <RSlider.Track className="relative h-1.5 grow rounded-full bg-white/8">
        <RSlider.Range className="absolute h-full rounded-full" style={{ background: accent }} />
      </RSlider.Track>
      <RSlider.Thumb className="block h-4 w-4 rounded-full bg-white shadow-soft ring-2 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-amber-400"
        style={{ ['--tw-ring-color' as string]: accent }} />
    </RSlider.Root>
  )
}

/* ---------------- Switch ---------------- */
export function Switch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (b: boolean) => void }) {
  return (
    <RSwitch.Root checked={checked} onCheckedChange={onCheckedChange}
      className={cn('relative h-5 w-9 rounded-full transition-colors duration-200', checked ? 'bg-amber-500' : 'bg-white/12')}>
      <RSwitch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-white shadow transition-transform duration-200 data-[state=checked]:translate-x-[18px]" />
    </RSwitch.Root>
  )
}

/* ---------------- Misc ---------------- */
/* ---------------- CountUp (mikro-etkileşim) — 0'dan hedefe yumuşak sayar, reduced-motion'da anında ---------------- */
export function useCountUp(target: number, format?: (n: number) => string, duration = 0.55) {
  const reduce = useReducedMotion()
  const mv = useMotionValue(0)
  const fmt = (n: number) => (format ? format(n) : String(Math.round(n)))
  const [text, setText] = useState(() => fmt(reduce ? target : 0))
  useEffect(() => {
    if (reduce) { mv.set(target); setText(fmt(target)); return }
    const controls = animate(mv, target, { duration, ease: EASE.outExpo })
    const unsub = mv.on('change', (v) => setText(fmt(v)))
    return () => { controls.stop(); unsub() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])
  return text
}
export function CountUp({ value, format }: { value: number; format?: (n: number) => string }) {
  return <>{useCountUp(value, format)}</>
}

export function Stat({ label, value, sub, accent, countValue, format }: { label: string; value?: ReactNode; sub?: ReactNode; accent?: string; countValue?: number; format?: (n: number) => string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-caption uppercase tracking-wider text-fg-subtle">{label}</span>
      <span className="text-title font-semibold tabular" style={accent ? { color: accent } : undefined}>
        {countValue != null ? <CountUp value={countValue} format={format} /> : value}
      </span>
      {sub && <span className="text-caption text-fg-subtle tabular">{sub}</span>}
    </div>
  )
}
export const SectionLabel = ({ children }: { children: ReactNode }) => (
  <div className="text-caption font-medium uppercase tracking-[0.14em] text-fg-subtle">{children}</div>
)
