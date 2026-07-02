import { useMemo } from 'react'
import { useApp } from '../../lib/store'
import { REGIME, TRANSITION, getTransition, fmtClock, scaleColor } from '../../lib/utils'

export function Timeline() {
  const clips = useApp((s) => s.clips)
  const selected = useApp((s) => s.selected)
  const playScene = useApp((s) => s.playScene)
  const select = useApp((s) => s.select)
  const setHovered = useApp((s) => s.setHovered)
  const setPlayScene = useApp((s) => s.setPlayScene)
  const playing = playScene != null

  const { segs, total } = useMemo(() => {
    let acc = 0
    const segs = clips.map((c) => {
      const dur = c.enabled ? c.out - c.in : 0
      const start = acc; acc += dur
      return { c, start, dur }
    })
    return { segs, total: acc || 1 }
  }, [clips])

  const playIdx = clips.findIndex((c) => c.scene === playScene)
  const playSeg = playIdx >= 0 ? segs[playIdx] : null
  // playhead, oynayan klibin SONUNA, klip süresi kadar lineer kayar (kliplerarası sürekli akış)
  const playLeft = playSeg ? ((playSeg.start + playSeg.dur) / total) * 100 : 0

  return (
    <div className="shrink-0 glass hairline-t px-4 py-2.5">
      <div className="mb-1.5 flex items-center justify-between text-caption text-fg-subtle">
        <span className="uppercase tracking-[0.14em]">Genel bakış · zaman çizelgesi</span>
        <span className="tabular">{fmtClock(total)} · {clips.filter((c) => c.enabled).length} klip</span>
      </div>
      <div className="relative h-9 w-full overflow-hidden rounded-lg bg-ink-900/60 ring-hair">
        {segs.map(({ c, start, dur }) => {
          if (dur === 0) return null
          const r = REGIME[c.meta.regime]
          const t = getTransition(c)
          const sel = c.scene === selected
          // dikkat-noktası bayrağı: risk/720p kırmızı · düşük güven sarı
          const flag = ((c.qc?.risk ?? 0) > 0 || (c.resolution ?? 1080) < 1080)
            ? 'var(--color-danger)'
            : c.decision.confidence < 0.72 ? 'var(--color-warn)' : null
          return (
            <button
              key={c.scene}
              onClick={() => { select(c.scene); if (playing) setPlayScene(c.scene) }}
              onMouseEnter={() => !playing && setHovered(c.scene)}
              onMouseLeave={() => !playing && setHovered(null)}
              title={`#${c.scene} · ${TRANSITION[t].label}`}
              className="absolute top-0 h-full transition-[filter] hover:brightness-150"
              style={{ left: `${(start / total) * 100}%`, width: `${(dur / total) * 100}%`,
                background: `color-mix(in srgb, ${r.color} 32%, transparent)` }}
            >
              {/* alt: ÖLÇEK rengi şeridi (film şeridiyle aynı kimlik renkleri) */}
              <span className="absolute inset-x-0 bottom-0 h-[3px]" style={{ background: scaleColor(c.meta.scale) }} />
              {/* fade/black: fosforlu dikey çizgi (klip başında, glow ile belirgin) */}
              {t !== 'cut' && <span className="absolute left-0 top-0 h-full w-[3px]" style={{ background: TRANSITION[t].color, boxShadow: `0 0 7px ${TRANSITION[t].color}, 0 0 3px ${TRANSITION[t].color}` }} />}
              {flag && <span className="pointer-events-none absolute left-1/2 top-0.5 h-1.5 w-1.5 -translate-x-1/2 rounded-full" style={{ background: flag, boxShadow: `0 0 5px ${flag}` }} />}
              {sel && <span className="pointer-events-none absolute inset-0 ring-2 ring-inset ring-amber-300/90" />}
            </button>
          )
        })}
        {/* playhead */}
        {playSeg && (
          <span className="pointer-events-none absolute top-0 z-10 h-full w-0.5 bg-white playhead-glow"
            style={{ left: `${playLeft}%`, transition: `left ${playSeg.dur}s linear` }} />
        )}
      </div>
    </div>
  )
}
