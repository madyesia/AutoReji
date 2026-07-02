import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Film, Play } from 'lucide-react'
import { useApp } from '../../lib/store'
import { videoUrl, clipThumb, spriteUrl, SPRITE_FRAMES, hasSprite } from '../../lib/data'
import { scaleColor, clamp } from '../../lib/utils'
import type { Clip } from '../../lib/types'

// Inspector başlığındaki canlı mini-önizleme: ölçek-kimlik + altın çerçeve, hover-scrub veya autoplay,
// tıkla → büyük PreviewStage'te o klibi oynat. Büyük sahneye EK hızlı bakış (çift decode'u önlemek için
// tüm-kurgu oynarken mini poster'a düşer).
export function InspectorPreview({ clip: c }: { clip: Clip }) {
  const motionPreview = useApp((s) => s.motionPreview)
  const muted = useApp((s) => s.muted)
  const playScene = useApp((s) => s.playScene)
  const setPlayScene = useApp((s) => s.setPlayScene)
  const select = useApp((s) => s.select)
  const reduce = useReducedMotion()
  const sc = scaleColor(c.meta.scale)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [frame, setFrame] = useState(-1)
  const [hover, setHover] = useState(false)
  const [prog, setProg] = useState(0)
  const inP = c.in, outP = c.out
  const autoplay = motionPreview && hover && playScene == null

  useEffect(() => {
    const v = videoRef.current; if (!v) return
    if (autoplay) {
      if (v.dataset.scene !== String(c.scene)) { v.dataset.scene = String(c.scene); v.src = videoUrl(c.file); v.load() }
      try { v.currentTime = inP } catch { /* metadata bekliyor */ }
      v.play().catch(() => {})
    } else {
      v.pause()
    }
  }, [autoplay, c.scene, c.file, inP])

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const v = videoRef.current
      if (v && !v.paused) {
        const span = outP - inP
        if (span > 0) {
          if (v.currentTime >= outP - 0.04) { try { v.currentTime = inP } catch { /* */ } }
          setProg(clamp((v.currentTime - inP) / span, 0, 1))
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inP, outP])

  return (
    <motion.button
      onClick={() => { select(c.scene); setPlayScene(c.scene) }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setFrame(-1) }}
      onMouseMove={(e) => {
        if (!motionPreview || autoplay || !hasSprite(c)) return   // sprite yoksa (.app) kare gezinme kapalı — autoplay gerçek videoyla zaten çalışıyor
        const r = e.currentTarget.getBoundingClientRect()
        const f = Math.max(0, Math.min(SPRITE_FRAMES - 1, Math.floor(((e.clientX - r.left) / r.width) * SPRITE_FRAMES)))
        setFrame((p) => (p === f ? p : f))
      }}
      initial={reduce ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      title="Büyük önizlemede oynat" aria-label={`Sahne ${c.scene} — büyük önizlemede oynat`}
      className="group relative h-16 w-[114px] shrink-0 overflow-hidden rounded-xl transition-transform duration-[var(--dur-fast)] hover:scale-[1.03]"
      style={{
        background: `color-mix(in srgb, ${sc} 20%, #0b0e14)`,
        boxShadow: `0 0 0 1.5px color-mix(in srgb, ${sc} 60%, var(--color-amber-400)), 0 0 18px -4px color-mix(in srgb, ${sc} 55%, transparent), inset 0 0 22px rgba(0,0,0,.45)`,
      }}
    >
      <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" style={{ filter: 'brightness(1.08) saturate(1.04)' }}
        poster={clipThumb(c)} muted={muted} playsInline preload="none" />
      <img src={clipThumb(c)} alt="" aria-hidden draggable={false}
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-200"
        style={{ opacity: autoplay ? 0 : 1 }} onError={(e) => (e.currentTarget.style.opacity = '0')} />
      {frame >= 0 && !autoplay && (
        <div aria-hidden className="absolute inset-0"
          style={{ backgroundImage: `url(${spriteUrl(c.scene)})`, backgroundSize: `${SPRITE_FRAMES * 100}% 100%`, backgroundPosition: `${(frame / (SPRITE_FRAMES - 1)) * 100}% 50%` }} />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
      <span className="absolute left-1.5 top-1.5 flex h-5 items-center rounded-md bg-black/55 px-1.5 text-[11px] font-semibold tabular text-white backdrop-blur-sm">{c.scene}</span>
      <span className="absolute right-1.5 top-1.5 text-amber-300 opacity-0 transition-opacity duration-[var(--dur-fast)] group-hover:opacity-100">
        {autoplay ? <Film size={12} /> : <Play size={12} />}
      </span>
      {autoplay && prog > 0 && (
        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-white/15">
          <span className="block h-full bg-gradient-to-r from-amber-500 to-amber-200" style={{ width: `${prog * 100}%`, boxShadow: '0 0 6px -1px var(--color-amber-400)' }} />
        </span>
      )}
    </motion.button>
  )
}
