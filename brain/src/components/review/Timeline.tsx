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

  // ENERJİ EĞRİSİ (TUR 4): AI'ın enerji sinyali (1-5) süre kararının kaldıracı — artık görünür.
  // Her etkin klibin ortası bir nokta; alan grafiği olarak barın üstünde. Veri yoksa çizilmez.
  const energyPath = useMemo(() => {
    const pts = segs.filter((s) => s.dur > 0 && s.c.analysis?.energy != null)
      .map((s) => ({ x: ((s.start + s.dur / 2) / total) * 100, e: s.c.analysis!.energy as number }))
    if (pts.length < 2) return null
    const y = (e: number) => 100 - ((Math.max(1, Math.min(5, e)) - 1) / 4) * 100  // 1→taban, 5→tavan (0-100 viewBox)
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${y(p.e).toFixed(1)}`).join(' ')
    const area = `${line} L${pts[pts.length - 1].x.toFixed(2)},100 L${pts[0].x.toFixed(2)},100 Z`
    return { line, area }
  }, [segs, total])

  return (
    <div className="shrink-0 glass hairline-t px-4 py-2.5">
      <div className="mb-1.5 flex items-center justify-between text-caption text-fg-subtle">
        <span className="uppercase tracking-[0.14em]">Genel bakış · zaman çizelgesi</span>
        <div className="flex items-center gap-3">
          {/* rejim lejantı — Dış/İç/Uyku tonlarını ezberlemeye gerek kalmaz (Z6) */}
          <div className="flex items-center gap-2 tabular">
            {(['exterior', 'interior', 'sleeping'] as const).map((k) => (
              <span key={k} className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ background: REGIME[k].color }} />{REGIME[k].label}</span>
            ))}
          </div>
          <span className="tabular">{fmtClock(total)} · {clips.filter((c) => c.enabled).length} klip</span>
        </div>
      </div>

      {/* ENERJİ EĞRİSİ — barın hemen üstünde ince şerit; "neden bu klip uzun/kısa?" sorusunun görsel cevabı */}
      {energyPath && (
        <div className="relative mb-1 h-6 w-full">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id="tl-energy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--color-amber-400)" stopOpacity="0.32" />
                <stop offset="1" stopColor="var(--color-amber-400)" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <path d={energyPath.area} fill="url(#tl-energy)" />
            <path d={energyPath.line} fill="none" stroke="var(--color-amber-400)" strokeWidth="1" strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity="0.75" />
          </svg>
          <span className="pointer-events-none absolute left-0 top-0 text-micro leading-none text-fg-faint">enerji</span>
        </div>
      )}
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
