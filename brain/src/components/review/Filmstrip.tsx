import { Fragment, useEffect, useRef, useState, type MouseEvent } from 'react'
import { Minus, Plus, Layers, Pencil, AlertTriangle, Film, ImageOff, Trash2, Undo } from 'lucide-react'
import { useApp } from '../../lib/store'
import { clipThumb, spriteUrl, SPRITE_FRAMES, hasSprite, needsAttention, riskColor } from '../../lib/data'
import { REGIME, TRANSITION, getTransition, fmtDur, scaleLabel, scaleColor, cn } from '../../lib/utils'
import type { Clip } from '../../lib/types'
import { Tip } from '../ui'

const ZOOM = [180, 232, 288, 356]

export function Filmstrip() {
  const clips = useApp((s) => s.clips)
  const selected = useApp((s) => s.selected)
  const select = useApp((s) => s.select)
  const setHovered = useApp((s) => s.setHovered)
  const focusOnly = useApp((s) => s.focusOnly)
  const riskyOnly = useApp((s) => s.riskyOnly)
  const motionPreview = useApp((s) => s.motionPreview)
  const toggleMotion = useApp((s) => s.toggleMotionPreview)
  const playScene = useApp((s) => s.playScene)
  const setPlayScene = useApp((s) => s.setPlayScene)
  const marked = useApp((s) => s.marked)
  const toggleMark = useApp((s) => s.toggleMark)
  const markRange = useApp((s) => s.markRange)
  const clearMarks = useApp((s) => s.clearMarks)
  const setMarked = useApp((s) => s.setMarked)
  const pushToast = useApp((s) => s.pushToast)
  const [z, setZ] = useState(1)
  const scrollRef = useRef<HTMLDivElement>(null)
  const w = ZOOM[z]

  useEffect(() => {
    if (selected == null) return
    const el = scrollRef.current?.querySelector(`[data-scene="${selected}"]`)
    el?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [selected])

  return (
    <div className="flex shrink-0 flex-col"
      style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.012)), var(--color-ink-900)' }}>
      <div className="flex h-9 shrink-0 items-center justify-between px-4 hairline-t">
        <span className="text-label text-fg-subtle tabular">{clips.length} klip · film şeridi{motionPreview && clips.some(hasSprite) ? ' · üstüne gel → içinde gezin' : ''}</span>
        <div className="flex items-center gap-1.5">
          <Tip label={motionPreview ? 'Hareketli önizleme AÇIK — kapat (statik kareler)' : 'Hareketli önizleme KAPALI — aç (üstüne gelince video oynar)'}>
            <button onClick={toggleMotion} className={cn('flex h-7 items-center gap-1.5 rounded-md px-2 text-label font-medium transition-colors duration-[var(--dur-fast)]', motionPreview ? 'bg-amber-400/15 text-amber-300' : 'text-fg-muted hover:bg-white/8 hover:text-fg')}>
              {motionPreview ? <Film size={13} /> : <ImageOff size={13} />} Hareketli
            </button>
          </Tip>
          <div className="mx-0.5 h-4 w-px bg-white/10" />
          <Tip label="Küçült"><button aria-label="Film şeridini küçült" onClick={() => setZ((v) => Math.max(0, v - 1))} className="flex h-7 w-7 items-center justify-center rounded-md text-fg-muted hover:bg-white/8 hover:text-fg"><Minus size={14} /></button></Tip>
          <Tip label="Büyüt"><button aria-label="Film şeridini büyüt" onClick={() => setZ((v) => Math.min(ZOOM.length - 1, v + 1))} className="flex h-7 w-7 items-center justify-center rounded-md text-fg-muted hover:bg-white/8 hover:text-fg"><Plus size={14} /></button></Tip>
        </div>
      </div>

      <div ref={scrollRef} onMouseLeave={() => setHovered(null)} className="overflow-x-auto overflow-y-hidden">
        <div className="flex min-w-max items-center gap-0 px-6 py-5">
          {clips.map((c, i) => (
            <Fragment key={c.scene}>
              {i > 0 && <TransitionBubble clip={c} selected={c.scene === selected} onClick={() => select(c.scene)} />}
              <ClipCard clip={c} index={i} width={w} selected={c.scene === selected} marked={marked.includes(c.scene)}
                dim={(focusOnly && !needsAttention(c)) || (riskyOnly && (c.qc?.risk ?? 0) === 0)}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey) { toggleMark(c.scene); select(c.scene) }       // ⌘/Ctrl: tekil işaretle/kaldır
                  else if (e.shiftKey) { markRange(c.scene) }                                  // Shift: seçiliden buraya aralık
                  else {                                                                       // normal: tek seç
                    // F2 koruması: tek yanlış tık büyük işaret setini sessizce uçurmasın — geri alınabilir yap
                    if (marked.length >= 3) {
                      const prev = [...marked]
                      pushToast(`${prev.length} işaret temizlendi`, { kind: 'amber', icon: 'undo', ttl: 5000, action: { label: 'Geri al', run: () => setMarked(prev) } })
                    }
                    clearMarks(); select(c.scene); if (playScene != null) setPlayScene(c.scene)
                  }
                }}
                onHover={() => setHovered(c.scene)} />
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}

function ClipCard({ clip: c, index, width, selected, marked, dim, onClick, onHover }: {
  clip: Clip; index: number; width: number; selected: boolean; marked: boolean; dim: boolean; onClick: (e: MouseEvent) => void; onHover: () => void
}) {
  const r = REGIME[c.meta.regime]
  const dur = c.out - c.in
  const low = c.decision.confidence < 0.72
  const variants = (c.variant.candidates?.length ?? 0) > 1
  const lowRes = (c.resolution ?? 1080) < 1080   // 1080p değil → yoğun kırmızı uyarı
  const motionPreview = useApp((s) => s.motionPreview)
  const toggleEnabled = useApp((s) => s.toggleEnabled)
  const [frame, setFrame] = useState(-1)   // hover-scrub: fare X'ine göre sprite karesi (-1 = scrub yok)
  return (
    <div
      role="button" tabIndex={0}
      aria-label={`Sahne ${c.scene}`}
      data-scene={c.scene}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e as unknown as MouseEvent) } }}
      onMouseEnter={onHover}
      onMouseMove={(e) => {
        if (!motionPreview || !hasSprite(c)) return   // kapalıysa veya sprite yoksa (.app) kare gezinme yok — sahte ilerleme gösterme
        const rect = e.currentTarget.getBoundingClientRect()
        const f = Math.max(0, Math.min(SPRITE_FRAMES - 1, Math.floor(((e.clientX - rect.left) / rect.width) * SPRITE_FRAMES)))
        setFrame((p) => (p === f ? p : f))
      }}
      onMouseLeave={() => setFrame(-1)}
      className={cn('group relative shrink-0 overflow-hidden rounded-xl text-left transition-all duration-200 ease-[var(--ease-out-quart)]',
        selected
          ? 'z-10 -translate-y-2 scale-[1.04] ring-2 ring-amber-300 shadow-glow-lg'
          : 'ring-1 ring-white/10 hover:z-10 hover:-translate-y-2 hover:scale-[1.06] hover:ring-white/30 hover:shadow-pop',
        marked && !selected && 'z-10 -translate-y-1 ring-2 ring-amber-400/70 shadow-glow-lg',
        lowRes && !selected && !marked && 'ring-2 ring-danger shadow-[0_0_24px_-3px_var(--color-danger)]',
        dim && 'opacity-25 saturate-50',
        !c.enabled && 'opacity-40 grayscale')}
      style={{
        width, aspectRatio: '16 / 9', contentVisibility: 'auto', containIntrinsicSize: `${width}px ${Math.round((width * 9) / 16)}px`,
        background: `linear-gradient(135deg, color-mix(in srgb, ${r.color} 22%, var(--color-ink-900)), var(--color-ink-900))`,
        // B1 kademeli giriş — CSS animasyonu eleman ömründe BİR kez oynar (ref-gate bedava):
        // ilk ~12 kart 45ms adımla dalgalanır, gerisi aynı karede. reduced-motion global kuralı anında bitirir.
        animation: 'float-up .36s var(--ease-out-expo) both',
        animationDelay: `${index < 12 ? index * 0.045 : 0}s`,
      }}
    >
      <img src={clipThumb(c)} loading="lazy" decoding="async" alt=""
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" draggable={false}
        onError={(e) => (e.currentTarget.style.opacity = '0')} />
      {/* HOVER-SCRUB: fare yatay konumuna göre klibin içinden kare (sprite şeridi — ağ/decode çağrısı yok) */}
      {frame >= 0 && (
        <div aria-hidden className="absolute inset-0"
          style={{
            backgroundImage: `url(${spriteUrl(c.scene)})`,
            backgroundSize: `${SPRITE_FRAMES * 100}% 100%`,
            backgroundPosition: `${(frame / (SPRITE_FRAMES - 1)) * 100}% 50%`,
          }} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/0 to-black/25" />
      {/* alttan ÖLÇEK rengine göre sıcaklık — her çekim ölçeği kendi kimlik rengiyle (yakın/geniş/orta…) */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
        style={{ background: `linear-gradient(to top, color-mix(in srgb, ${scaleColor(c.meta.scale)} 42%, transparent), color-mix(in srgb, ${scaleColor(c.meta.scale)} 10%, transparent) 45%, transparent)` }} />

      <span className="absolute left-2 top-2 flex h-6 items-center rounded-md bg-black/55 px-2 text-label font-semibold tabular text-white backdrop-blur-sm">{c.scene}</span>
      <div className="absolute right-2 top-2 flex gap-1">
        {lowRes && <Tip label={`Düşük çözünürlük: ${c.resolution}p — 1080p değil`}><span className="flex h-6 items-center rounded-md bg-danger px-1.5 text-micro font-bold text-white shadow-[0_0_10px_var(--color-danger)]">{c.resolution}p</span></Tip>}
        {!!c.qc?.risk &&<Tip label={<span>Risk · {c.qc.issues.map((x) => x.d).join(', ')}</span>}><span className="flex h-6 items-center justify-center rounded-md px-1 text-ink-950" style={{ background: riskColor(c.qc.level) }}><AlertTriangle size={12} /></span></Tip>}
        {c.decision.user_overridden && <Tip label="Elle değiştirildi"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-400/90 text-ink-950"><Pencil size={12} /></span></Tip>}
        {low && <Tip label={`Düşük güven · ${Math.round(c.decision.confidence * 100)}%`}><span className="flex h-6 w-6 items-center justify-center rounded-md bg-warn/90 text-label font-bold text-ink-950">!</span></Tip>}
      </div>

      <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
        <span className="flex items-center gap-1.5 rounded-md bg-black/50 px-2 py-1 text-label tabular text-white/90 backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full" style={{ background: r.color }} /> {fmtDur(dur)}
        </span>
        {variants && <Tip label={`${c.variant.candidates.length} aday çekim`}><span className="flex h-6 items-center gap-0.5 rounded-md bg-black/50 px-1.5 text-caption text-white/85 backdrop-blur-sm"><Layers size={11} />{c.variant.candidates.length}</span></Tip>}
      </div>
      {/* klibi sil / geri al — alt-sağ köşe kırmızı yuvarlak (hover'da belirir, tek tık) */}
      <button
        onClick={(e) => { e.stopPropagation(); toggleEnabled(c.scene) }}
        aria-label={c.enabled ? `Sahne ${c.scene} klibini çıkar` : `Sahne ${c.scene} klibini geri al`}
        title={c.enabled ? 'Klibi çıkar — kurguya girmez (geri alınabilir)' : 'Geri al — klibi kurguya döndür'}
        className={cn('absolute bottom-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full opacity-0 shadow-soft backdrop-blur-sm transition-all duration-150 group-hover:opacity-100',
          c.enabled ? 'bg-danger text-white ring-2 ring-danger/45 hover:scale-110' : 'bg-white/25 text-white hover:bg-white/40')}>
        {c.enabled ? <Trash2 size={13} /> : <Undo size={13} />}
      </button>
      {width >= 232 && <span className="absolute left-2 top-9 flex items-center gap-1 rounded bg-black/45 px-1.5 py-0.5 text-caption text-white/85 backdrop-blur-sm"><span className="h-1.5 w-1.5 rounded-full" style={{ background: scaleColor(c.meta.scale) }} />{scaleLabel(c.meta.scale)}</span>}
      {selected && <span className="absolute inset-x-0 bottom-0 h-1 bg-amber-300" />}
      {frame >= 0 && !selected && (
        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-white/20"><span className="block h-full bg-amber-300/90" style={{ width: `${((frame + 1) / SPRITE_FRAMES) * 100}%` }} /></span>
      )}
    </div>
  )
}

const NEXT_TYPE: Record<string, 'cut' | 'fade' | 'black'> = { cut: 'fade', fade: 'black', black: 'cut' }

function TransitionBubble({ clip: c, selected, onClick }: { clip: Clip; selected: boolean; onClick: () => void }) {
  const setType = useApp((s) => s.setTransitionType)
  const t = getTransition(c)
  const meta = TRANSITION[t]
  const isCut = t === 'cut'
  const nextDative = TRANSITION[NEXT_TYPE[t]].dative
  // tıkla → seç + döngü: cut → fade → black → cut
  const cycle = () => { onClick(); setType(c.scene, NEXT_TYPE[t]) }
  return (
    <Tip label={<span>{meta.label}{!isCut && ` · ${fmtDur(c.transition_in!.dur)}`} — tıkla: <b>{nextDative}</b> çevir</span>}>
      <button onClick={cycle} className={cn('group relative flex shrink-0 items-center justify-center self-center', isCut ? 'w-9' : 'w-16')}>
        <span className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-white/12" />
        {isCut ? (
          <span className={cn('relative z-10 flex h-7 w-7 items-center justify-center rounded-full transition-transform group-hover:scale-110', selected && 'ring-2')}
            style={{ background: `color-mix(in srgb, ${meta.color} 30%, var(--color-ink-900))`, boxShadow: `0 0 0 1.5px color-mix(in srgb, ${meta.color} 60%, transparent)`, ['--tw-ring-color' as string]: meta.color }}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: meta.color }} />
          </span>
        ) : (
          <span className={cn('relative z-10 flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 transition-transform group-hover:scale-110', selected && 'ring-2')}
            style={{ background: `color-mix(in srgb, ${meta.color} 26%, var(--color-ink-900))`,
              boxShadow: `0 0 0 1.5px color-mix(in srgb, ${meta.color} 55%, transparent), 0 0 14px -3px ${meta.color}`,
              ['--tw-ring-color' as string]: meta.color }}>
            <span className="h-3 w-3 rounded-full" style={{ background: meta.color, boxShadow: `0 0 7px ${meta.color}` }} />
            <span className="text-micro font-semibold tabular leading-none" style={{ color: meta.color }}>{c.transition_in!.dur.toFixed(1)}</span>
          </span>
        )}
      </button>
    </Tip>
  )
}
