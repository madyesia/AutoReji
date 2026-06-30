import { useEffect, useRef } from 'react'

/** Sakin, premium ambians yağmuru — ince, soğuk mavi çizgiler, hafif çapraz, parallax. */
export function RainCanvas({ intensity = 1, className }: { intensity?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    const parent = canvas?.parentElement
    const ctx = canvas?.getContext('2d')
    if (!canvas || !parent || !ctx) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0, h = 0, raf = 0, last = performance.now()
    type Drop = { x: number; y: number; len: number; sp: number; a: number; wd: number }
    let drops: Drop[] = []

    const mk = (): Drop => {
      const layer = Math.random()
      return {
        x: Math.random() * w, y: Math.random() * h,
        len: 9 + layer * 22, sp: 80 + layer * 230,
        a: 0.03 + layer * 0.085, wd: 0.5 + layer * 0.7,
      }
    }
    const resize = () => {
      const r = parent.getBoundingClientRect()
      w = r.width; h = r.height
      canvas.width = w * dpr; canvas.height = h * dpr
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      drops = Array.from({ length: Math.floor((w * h) / 13000 * intensity) }, mk)
    }
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05); last = now
      ctx.clearRect(0, 0, w, h)
      for (const d of drops) {
        d.y += d.sp * dt
        if (d.y > h + d.len) { d.y = -d.len; d.x = Math.random() * w }
        ctx.strokeStyle = `rgba(176,202,234,${d.a})`
        ctx.lineWidth = d.wd
        ctx.beginPath()
        ctx.moveTo(d.x, d.y)
        ctx.lineTo(d.x + d.sp * 0.016, d.y + d.len)
        ctx.stroke()
      }
      raf = requestAnimationFrame(frame)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(parent)
    if (!reduce) raf = requestAnimationFrame(frame)
    else { // tek kare statik
      for (const d of drops) { ctx.strokeStyle = `rgba(176,202,234,${d.a})`; ctx.lineWidth = d.wd; ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + 2, d.y + d.len); ctx.stroke() }
    }
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [intensity])

  return <canvas ref={ref} className={className} aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
}
