import { useEffect, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Play, Pause, RotateCcw, X, Volume2 } from 'lucide-react'
import { clipThumb } from '../../lib/data'
import { getTransition, TRANSITION, fmtDur, clamp } from '../../lib/utils'
import type { Clip } from '../../lib/types'

export function PreviewModal({ clip, prev, onClose }: { clip: Clip; prev: Clip | null; onClose: () => void }) {
  const t = getTransition(clip)
  const dur = clip.transition_in?.dur ?? 0
  const [playing, setPlaying] = useState(true)
  const prevRef = useRef<HTMLImageElement>(null)
  const curRef = useRef<HTMLImageElement>(null)
  const blackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!prev) return
    const HOLD = 0.9, total = HOLD + Math.max(dur, 0.3) + HOLD
    const pe = HOLD / total, te = (HOLD + Math.max(dur, 0.3)) / total
    let raf = 0, start = performance.now(), paused = false
    const loop = (now: number) => {
      if (!paused) {
        const p = (((now - start) / 1000) % total) / total
        let a = 1, b = 0, blk = 0
        if (p < pe) { a = 1; b = 0 }
        else if (p < te) {
          const x = (p - pe) / (te - pe)
          if (t === 'cut') { a = x < 0.5 ? 1 : 0; b = x < 0.5 ? 0 : 1 }
          else if (t === 'black') { a = 1 - clamp(x * 2, 0, 1); b = clamp(x * 2 - 1, 0, 1); blk = 1 - Math.abs(x * 2 - 1) }
          else { a = 1 - x; b = x }
        } else { a = 0; b = 1 }
        if (prevRef.current) prevRef.current.style.opacity = String(a)
        if (curRef.current) curRef.current.style.opacity = String(b)
        if (blackRef.current) blackRef.current.style.opacity = String(blk)
      }
      raf = requestAnimationFrame(loop)
    }
    if (playing) raf = requestAnimationFrame(loop)
    else paused = true
    return () => cancelAnimationFrame(raf)
  }, [playing, t, dur, prev, clip.scene])

  const restart = () => { setPlaying(false); requestAnimationFrame(() => setPlaying(true)) }

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink-950/85 data-[state=open]:animate-[float-up_.2s_ease-out]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[640px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-2xl glass p-5 shadow-pop focus:outline-none">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dialog.Title className="text-lead font-semibold">Geçiş önizlemesi</Dialog.Title>
              <span className="rounded-md px-1.5 py-0.5 text-caption font-medium" style={{ background: `color-mix(in srgb, ${TRANSITION[t].color} 18%, transparent)`, color: TRANSITION[t].color }}>
                {prev ? `${prev.scene} → ${clip.scene}` : `Sahne ${clip.scene}`} · {TRANSITION[t].label}{t !== 'cut' && ` ${fmtDur(dur)}`}
              </span>
            </div>
            <Dialog.Close className="flex h-8 w-8 items-center justify-center rounded-lg text-fg-muted hover:bg-white/8 hover:text-fg"><X size={16} /></Dialog.Close>
          </div>

          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black ring-hair">
            {prev ? (
              <>
                <img ref={prevRef} src={clipThumb(prev)} alt={`Sahne ${prev.scene} karesi`} className="absolute inset-0 h-full w-full object-cover" />
                <img ref={curRef} src={clipThumb(clip)} alt={`Sahne ${clip.scene} karesi`} className="absolute inset-0 h-full w-full object-cover" style={{ opacity: 0 }} />
                <div ref={blackRef} className="absolute inset-0 bg-black" style={{ opacity: 0 }} />
              </>
            ) : (
              <img src={clipThumb(clip)} alt={`Sahne ${clip.scene} karesi`} className="absolute inset-0 h-full w-full object-cover" />
            )}
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Duraklat' : 'Oynat'} className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/8 text-fg hover:bg-white/12">{playing ? <Pause size={16} /> : <Play size={16} />}</button>
              <button onClick={restart} aria-label="Baştan oynat" className="flex h-9 w-9 items-center justify-center rounded-lg text-fg-muted hover:bg-white/8 hover:text-fg"><RotateCcw size={15} /></button>
            </div>
            <div className="flex items-center gap-1.5 text-label text-fg-subtle"><Volume2 size={14} /> Bu önizleme sessizdir — gerçek stereo sesi Premiere'de duyarsın.</div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
