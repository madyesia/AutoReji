import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, AlertTriangle, Undo2, Copy } from 'lucide-react'
import { useApp } from '../lib/store'
import type { Toast } from '../lib/types'
import { ChangeSummaryToast } from './ChangeSummaryToast'

const KIND_COLOR: Record<Toast['kind'], string> = {
  ok: 'var(--color-ok)',
  warn: 'var(--color-warn)',
  danger: 'var(--color-danger)',
  amber: 'var(--color-amber-400)',
}
const ICON = { check: Check, alert: AlertTriangle, undo: Undo2, copy: Copy }

export function ToastViewport() {
  const toasts = useApp((s) => s.toasts)
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-2 px-4">
      <AnimatePresence initial={false}>
        {toasts.map((t) => <ToastItem key={t.id} t={t} />)}
      </AnimatePresence>
    </div>
  )
}

function ToastItem({ t }: { t: Toast }) {
  const dismiss = useApp((s) => s.dismissToast)
  const reduce = useReducedMotion()
  const color = KIND_COLOR[t.kind]
  const Icon = t.icon ? ICON[t.icon] : t.kind === 'danger' || t.kind === 'warn' ? AlertTriangle : Check
  const [prog, setProg] = useState(1)
  const pausedRef = useRef(false)
  const remainRef = useRef(t.ttl)
  const lastRef = useRef(0)

  // hover-pause edilebilir, kalan-süre tabanlı timer + tükenen ışık çubuğu (rAF, performance.now)
  useEffect(() => {
    if (t.ttl <= 0) return
    let raf = 0
    lastRef.current = performance.now()
    const tick = (now: number) => {
      const dt = now - lastRef.current
      lastRef.current = now
      if (!pausedRef.current) {
        remainRef.current -= dt
        setProg(Math.max(0, remainRef.current / t.ttl))
        if (remainRef.current <= 0) { dismiss(t.id); return }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [t.id, t.ttl, dismiss])

  const runAction = () => { t.action?.run(); dismiss(t.id) }

  return (
    <motion.div
      layout
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.96 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
      transition={reduce ? { duration: 0.12 } : { type: 'spring', stiffness: 420, damping: 30 }}
      onMouseEnter={() => { pausedRef.current = true }}
      onMouseLeave={() => { pausedRef.current = false }}
      className="glass pointer-events-auto relative w-[340px] overflow-hidden rounded-xl shadow-[var(--shadow-pop)] ring-hair"
      role="status"
    >
      {/* fosforlu sol-şerit (semantik renk + glow) */}
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: color, boxShadow: `0 0 10px -1px ${color}` }} />
      <div className="flex items-start gap-2.5 py-2.5 pl-4 pr-3">
        <Icon size={15} className="mt-0.5 shrink-0" style={{ color }} />
        <div className="min-w-0 flex-1">
          {t.change ? (
            <ChangeSummaryToast p={t.change} />
          ) : (
            <>
              <div className="text-[13px] leading-snug text-fg">{t.msg}</div>
              {t.sub && <div className="mt-0.5 text-[11px] text-fg-subtle">{t.sub}</div>}
            </>
          )}
        </div>
        {t.action && (
          <button
            onClick={runAction}
            className="-mr-1 mt-0.5 flex h-7 shrink-0 items-center gap-1 rounded-lg px-2 text-[12px] font-medium text-fg-muted transition-colors hover:bg-white/8 hover:text-fg"
          >
            <Undo2 size={13} /> {t.action.label}
          </button>
        )}
      </div>
      {/* tükenen ışık çubuğu — kalan süreyi gösterir */}
      {t.ttl > 0 && (
        <span className="absolute bottom-0 left-0 h-[2px]" style={{ width: `${prog * 100}%`, background: color, boxShadow: `0 0 8px -1px ${color}` }} />
      )}
    </motion.div>
  )
}
