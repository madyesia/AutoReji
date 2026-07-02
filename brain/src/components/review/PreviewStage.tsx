import { useEffect, useMemo, useRef, useState } from 'react'
import { Play, Pause, Square, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'
import { useApp } from '../../lib/store'
import { videoUrl, clipThumb } from '../../lib/data'
import { REGIME, TRANSITION, getTransition, fmtDur, scaleLabel, clamp, cn } from '../../lib/utils'
import type { Clip } from '../../lib/types'

export function PreviewStage() {
  const clips = useApp((s) => s.clips)
  const selected = useApp((s) => s.selected)
  const hovered = useApp((s) => s.hovered)
  const playScene = useApp((s) => s.playScene)
  const setPlayScene = useApp((s) => s.setPlayScene)
  const motionPreview = useApp((s) => s.motionPreview)
  const muted = useApp((s) => s.muted)
  const toggleMuted = useApp((s) => s.toggleMuted)
  const select = useApp((s) => s.select)
  const [paused, setPaused] = useState(false)
  const [dip, setDip] = useState(0)
  const [prog, setProg] = useState(0)        // aktif klip içi ilerleme 0–1
  const [vidState, setVidState] = useState<'loading' | 'ready' | 'error'>('ready')  // A5: eksik/bozuk dosyada sessiz siyah ekran kalmasın
  const videoRef = useRef<HTMLVideoElement>(null)
  const dipTimer = useRef<number>(0)

  const byScene = (sc: number | null) => (sc == null ? undefined : clips.find((c) => c.scene === sc))
  const playing = playScene != null
  // aktif klip: oynatımda playScene; değilse hover; değilse seçili
  const active: Clip | undefined = useMemo(
    () => byScene(playing ? playScene : hovered) ?? byScene(selected) ?? clips[0],
    [clips, selected, hovered, playScene, playing],
  )

  const stateRef = useRef({ inP: 0, outP: 0, playing: false, paused: false })
  stateRef.current = { inP: active?.in ?? 0, outP: active?.out ?? 0, playing, paused }

  // aktif klip değişince videoyu yükle (kaynak değişimi)
  useEffect(() => {
    const v = videoRef.current
    if (!v || !active) return
    if (v.dataset.scene !== String(active.scene)) {
      v.dataset.scene = String(active.scene)
      setVidState('loading')
      v.src = videoUrl(active.file)
      v.load()
    }
  }, [active?.scene, active?.file])

  // KAYAN ilerleme çubuğu: video oynarken her kare prog güncelle (timeupdate'ten çok daha akıcı)
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const v = videoRef.current, st = stateRef.current
      if (v && !v.paused) {
        const span = st.outP - st.inP
        if (span > 0) setProg(clamp((v.currentTime - st.inP) / span, 0, 1))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const flashTransition = (type: 'fade' | 'black', dur = 0.5) => {
    window.clearTimeout(dipTimer.current)
    setDip(type === 'black' ? 1 : 0.62)
    // dip süresi geçişin SÜRESİNE bağlı → fade/black canlı/belirgin görünür (sabit kısa flash değil)
    dipTimer.current = window.setTimeout(() => setDip(0), clamp(dur * 1000 * 0.6, 240, 1400))
  }

  const seekAndPlay = () => {
    const v = videoRef.current; if (!v) return
    try { v.currentTime = stateRef.current.inP } catch { /* metadata bekliyor */ }
    setProg(0)
    if (active?.transition_in) flashTransition(active.transition_in.type, active.transition_in.dur)  // geçiş fade/black ise önizlemede fadeli aç
    if (!stateRef.current.paused && (playing || motionPreview)) v.play().catch(() => {})
    else v.pause()
  }

  const advance = () => {
    const idx = clips.findIndex((c) => c.scene === playScene)
    let next = -1
    for (let i = idx + 1; i < clips.length; i++) if (clips[i].enabled) { next = i; break }
    if (next === -1) { setPlayScene(null); return }  // bitti
    const nx = clips[next], nt = getTransition(nx)
    if (nt !== 'cut') flashTransition(nt, nx.transition_in?.dur)  // geçiş fade/black ise CANLI görünsün
    setPlayScene(nx.scene)
    select(nx.scene)   // tüm kurgu: film şeridi kaysın+seçili olsun + Inspector oynayan klibi takip etsin
  }

  const onTime = () => {
    const v = videoRef.current; const st = stateRef.current; if (!v) return
    if (v.currentTime >= st.outP - 0.04) {
      if (st.playing && !st.paused) advance()
      else {  // tek klip önizleme: başa sar (döngü) + geçişi varsa fadeli aç
        try { v.currentTime = st.inP } catch { /* */ }
        setProg(0)
        if (active?.transition_in) flashTransition(active.transition_in.type, active.transition_in.dur)
      }
    }
  }

  const startPlay = () => { setPaused(false); setPlayScene(selected ?? clips.find((c) => c.enabled)?.scene ?? null) }
  const togglePause = () => {
    const v = videoRef.current; if (!v) return
    if (v.paused) { setPaused(false); v.play().catch(() => {}) } else { setPaused(true); v.pause() }
  }
  const stop = () => { setPaused(false); setPlayScene(null) }
  const seek = (ratio: number) => {
    const v = videoRef.current, st = stateRef.current; if (!v) return
    const rr = clamp(ratio, 0, 1)
    v.currentTime = st.inP + rr * (st.outP - st.inP)
    setProg(rr)
  }
  // önceki/sonraki etkin klibe geç (her durumda film şeridi + Inspector takip eder; tüm kurguda oynatım sürer)
  const goToClip = (dir: number) => {
    const idx = clips.findIndex((c) => c.scene === active?.scene)
    for (let i = idx + dir; i >= 0 && i < clips.length; i += dir) {
      if (clips[i].enabled) {
        if (playing) setPlayScene(clips[i].scene)
        select(clips[i].scene)
        return
      }
    }
  }
  const skipBack = () => goToClip(-1)
  const skipFwd = () => goToClip(1)

  if (!active) return <div className="flex-1 bg-ink-950" />
  const r = REGIME[active.meta.regime]
  const t = getTransition(active)
  const clipDur = active.out - active.in

  // premium gömülü kontrol butonu (cam + gradient dolgu + iç-üst vurgu)
  const ctrlBtn = 'flex items-center justify-center rounded-xl bg-gradient-to-b from-white/20 to-white/[0.06] text-white ring-1 ring-white/15 shadow-[0_2px_8px_-2px_rgba(0,0,0,.6),inset_0_1px_0_rgba(255,255,255,.18)] backdrop-blur-md transition-all duration-[var(--dur-fast)] hover:from-white/30 hover:to-white/12 active:translate-y-px'

  return (
    <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-3"
      style={{ background: 'radial-gradient(125% 120% at 50% 0%, #11151f 0%, #0b0e16 45%, #070910 100%)' }}>
      {/* premium altın çerçeveli video — TÜM kontroller bunun İÇİNE gömülü (taşmaz) */}
      <div className="group relative h-full aspect-video max-w-full overflow-hidden rounded-2xl ring-2 ring-amber-400/60"
        style={{ boxShadow: '0 0 0 1px rgba(234,184,102,0.6), 0 0 30px -2px rgba(234,184,102,0.42), 0 28px 72px -18px rgba(0,0,0,0.88), 0 6px 20px -6px rgba(0,0,0,0.7), inset 0 0 60px rgba(0,0,0,0.4)' }}>
        <video
          ref={videoRef}
          className="h-full w-full object-cover bg-black"
          style={{ filter: 'brightness(1.08) saturate(1.04)' }}
          poster={clipThumb(active)}
          muted={muted} playsInline preload="auto"
          onLoadedMetadata={seekAndPlay}
          onLoadedData={() => setVidState('ready')}
          onError={() => setVidState('error')}
          onTimeUpdate={onTime}
        />
        <div className="pointer-events-none absolute inset-0 bg-black transition-opacity duration-200" style={{ opacity: dip }} />

        {/* A5: yükleme çipi + okunamayan dosya rozeti (eskiden sahne sessizce siyah kalıyordu) */}
        {vidState === 'loading' && (
          <span className="pointer-events-none absolute bottom-3 right-3 flex h-7 items-center gap-1.5 rounded-md bg-black/55 px-2.5 text-[11.5px] text-white/80 backdrop-blur-sm">
            <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-white/30 border-t-white/90" /> yükleniyor…
          </span>
        )}
        {vidState === 'error' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="max-w-[80%] rounded-xl bg-ink-900/90 px-4 py-3 text-center ring-1 ring-danger/40">
              <div className="text-[13px] font-semibold text-danger">Klip okunamadı</div>
              <div className="mt-1 truncate text-[11.5px] text-fg-muted" title={active.file}>{active.file.split('/').pop()}</div>
              <div className="mt-1 text-[11px] text-fg-subtle">Dosya taşınmış ya da bozuk olabilir — video klasörünü kontrol et.</div>
            </div>
          </div>
        )}

        {/* üst bilgi (frame içi) */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-black/60 to-transparent p-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 items-center rounded-md bg-black/55 px-2 text-[12px] font-semibold tabular text-white backdrop-blur-sm">Sahne {active.scene}</span>
            <span className="flex h-6 items-center gap-1.5 rounded-md bg-black/45 px-2 text-[11.5px] text-white/85 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full" style={{ background: r.color }} /> {r.label} · {scaleLabel(active.meta.scale)}
            </span>
            {t !== 'cut' && (
              <span className="flex h-6 items-center rounded-md px-2 text-[11.5px] font-medium backdrop-blur-sm"
                style={{ background: `color-mix(in srgb, ${TRANSITION[t].color} 30%, rgba(0,0,0,.45))`, color: '#fff' }}>
                {TRANSITION[t].label} {fmtDur(active.transition_in!.dur)}
              </span>
            )}
          </div>
          {playing && <span className="flex h-6 items-center gap-1.5 rounded-md bg-amber-400/90 px-2 text-[11px] font-semibold text-ink-950 backdrop-blur-sm">● TÜM KURGU</span>}
        </div>

        {/* alt: GÖMÜLÜ premium kontroller (frame içinde, kenara taşmaz) */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2.5 bg-gradient-to-t from-black/85 via-black/35 to-transparent px-4 pb-3.5 pt-14">
          {/* kayan ilerleme çubuğu — tıkla → o ana sar */}
          <div className="group/bar relative h-3 w-full cursor-pointer"
            onClick={(e) => { const b = e.currentTarget.getBoundingClientRect(); seek((e.clientX - b.left) / b.width) }}>
            <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/15 ring-1 ring-white/10 transition-[height] duration-150 group-hover/bar:h-2.5">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-200"
                style={{ width: `${prog * 100}%`, boxShadow: '0 0 12px -1px rgba(234,184,102,.75)' }} />
            </div>
            <div className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-100 ring-2 ring-amber-400/50 shadow-[0_1px_7px_rgba(0,0,0,.75)] transition-transform duration-150 group-hover/bar:scale-125"
              style={{ left: `${prog * 100}%` }} />
          </div>
          {/* kontrol satırı: sol = tüm kurgu · orta = oynatım · sağ = ses + süre */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center">
              {!playing ? (
                <button onClick={startPlay} className="flex h-8 items-center gap-1.5 rounded-lg bg-gradient-to-b from-amber-300 to-amber-500 px-3 text-[12px] font-semibold text-ink-950 shadow-[0_2px_10px_-2px_rgba(234,184,102,.6),inset_0_1px_0_rgba(255,255,255,.4)] transition-all duration-[var(--dur-fast)] hover:from-amber-200 hover:to-amber-400 active:translate-y-px">
                  <Play size={14} /> Tüm kurguyu oynat
                </button>
              ) : (
                <button onClick={() => { stop(); if (active) select(active.scene) }} className={cn(ctrlBtn, 'h-8 gap-1.5 px-3 text-[12px] font-medium')}>
                  <Square size={13} /> Durdur
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={skipBack} aria-label="Önceki klip" title="Önceki klip" className={cn(ctrlBtn, 'h-9 w-9')}><SkipBack size={15} /></button>
              <button onClick={togglePause} aria-label="Durdur / Devam" title="Durdur / Devam" className={cn(ctrlBtn, 'h-11 w-11')}>{paused ? <Play size={18} /> : <Pause size={18} />}</button>
              <button onClick={skipFwd} aria-label="Sonraki klip" title="Sonraki klip" className={cn(ctrlBtn, 'h-9 w-9')}><SkipForward size={15} /></button>
            </div>
            <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
              <button onClick={toggleMuted} aria-label={muted ? 'Sesi aç' : 'Sesi kapat'} title={muted ? 'Sesi aç' : 'Sesi kapat'}
                className={cn(ctrlBtn, 'h-8 w-8', !muted && '!from-amber-300/35 !to-amber-500/15 !text-amber-100 ring-amber-400/50')}>
                {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
              <span className="rounded-md bg-black/50 px-2 py-1 text-[11px] tabular text-white/85 backdrop-blur-sm">{fmtDur(clipDur * prog)} / {fmtDur(clipDur)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
