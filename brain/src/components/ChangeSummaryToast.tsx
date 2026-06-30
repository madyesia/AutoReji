import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUp, ArrowDown, Wand2 } from 'lucide-react'
import { fmtDelta, type ChangeSummaryPayload } from '../lib/diff'

// Toast içinde "ne değişti" özeti — stil değişiminde delta-chip galerisi (amber ↑ / nötr ↓).
export function ChangeSummaryToast({ p }: { p: ChangeSummaryPayload }) {
  const reduce = useReducedMotion()
  const shown = p.summary.deltas.slice(0, 3)
  const extra = p.summary.deltas.length - shown.length
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5">
        <Wand2 size={13} className="shrink-0 text-amber-300" />
        <span className="text-gold text-[13px] font-semibold">{p.label}</span>
        <span className="text-[12px] text-fg-subtle">kurgu stili</span>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {shown.map((d, i) => (
          <motion.span
            key={d.key}
            initial={reduce ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : i * 0.045, duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex h-[22px] items-center gap-1 rounded-md px-1.5 text-[11.5px] font-medium tabular"
            style={{
              color: d.accent === 'amber' ? 'var(--color-amber-300)' : 'var(--color-fg-muted)',
              background: d.accent === 'amber'
                ? 'color-mix(in srgb, var(--color-amber-400) 14%, transparent)'
                : 'rgba(255,255,255,.05)',
              boxShadow: d.accent === 'amber' ? '0 0 12px -4px var(--color-amber-400)' : undefined,
            }}
          >
            {d.dir === 'up' ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
            {fmtDelta(d)}
          </motion.span>
        ))}
        {extra > 0 && <span className="text-[11px] text-fg-subtle">+{extra} daha</span>}
      </div>
    </div>
  )
}
