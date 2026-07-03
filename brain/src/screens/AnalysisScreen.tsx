import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { FileSearch, GitCompareArrows, Spline, ImageDown, Wand2, ScanEye, Check, X, RotateCcw, ArrowLeft, CloudRainWind, Clapperboard } from 'lucide-react'
import { RainCanvas } from '../components/RainCanvas'
import { useApp } from '../lib/store'
import { loadEpisode } from '../lib/data'
import { tauriAvailable } from '../lib/native'
import { runPipeline } from '../lib/engine'
import { Button } from '../components/ui'
import { ProgressRing } from '../components/motifs'
import { cn } from '../lib/utils'
import type { Manifest } from '../lib/types'
import { EASE, SPRING } from '../lib/motion'
import { AmbientLayer } from '../components/AmbientLayer'

// 6 aşama — her biri 0→100 dolar, biter, yeşil tik, sıradakine geçer.
const STAGES: { label: string; sub: string; icon: ReactNode }[] = [
  { label: 'Promptlar ayrıştırılıyor', sub: 'ölçek · özne · rejim · renk', icon: <FileSearch size={15} /> },
  { label: 'Sahne ↔ video eşleştiriliyor', sub: 'yedek çekim seçimi · dosya kontrolü', icon: <GitCompareArrows size={15} /> },
  { label: 'Prompt benzerliği', sub: 'sahne-içi konum değişimi', icon: <Spline size={15} /> },
  { label: 'Video analizi + kareler', sub: 'hareket · kalite kontrol · orta kare', icon: <ImageDown size={15} /> },
  { label: 'Görsel-AI sahne sinyali', sub: 'enerji · rol · ritim (yerel)', icon: <ScanEye size={15} /> },
  { label: 'Geçiş kararları', sub: 'kurgu kuralları + ritim', icon: <Wand2 size={15} /> },
]
const EXPO = EASE.outExpo

export function AnalysisScreen() {
  const setManifest = useApp((s) => s.setManifest)
  const setScreen = useApp((s) => s.setScreen)
  const intake = useApp((s) => s.intake)
  const reduce = useReducedMotion()
  const [prog, setProg] = useState(0)            // 0..1 GENEL ilerleme — akışkan (rAF ile daima hareket)
  const [phase, setPhase] = useState<'running' | 'done' | 'error'>('running')
  const [errMsg, setErrMsg] = useState<string | null>(null)
  const [runKey, setRunKey] = useState(0)
  const targetRef = useRef(0)                    // gerçek/mock ilerleme hedefi
  const doneRef = useRef(false)                  // iş gerçekten bitti mi (manifest hazır)
  const resultRef = useRef<Manifest | null>(null)
  const aliveRef = useRef(true)

  // ── İş yürütücü: GERÇEK sidecar (Tauri+girdi) veya MOCK (zamanlı). target + result besler. ──
  useEffect(() => {
    aliveRef.current = true
    setPhase('running'); setProg(0); setErrMsg(null)
    targetRef.current = 0; doneRef.current = false; resultRef.current = null

    if (tauriAvailable() && intake?.promptPath && intake?.videoFolder) {
      const { promptPath, videoFolder } = intake
      void (async () => {
        const res = await runPipeline(promptPath, videoFolder, videoFolder, (pr) => {
          if (aliveRef.current) targetRef.current = Math.min(0.97, (pr.step + (pr.pct || 0)) / Math.max(1, pr.total))
        })
        if (!aliveRef.current) return
        if (res.ok) { resultRef.current = res.manifest; doneRef.current = true }
        else { setErrMsg(res.error); setPhase('error') }
      })()
      return () => { aliveRef.current = false }
    }

    // MOCK (tarayıcı / örnek): target'ı ~6.5s'de 0→0.97 rampala + örnek manifesti yükle
    const simErr = import.meta.env.DEV && typeof location !== 'undefined' && new URLSearchParams(location.search).has('simErr')
    if (simErr) { const t = setTimeout(() => { if (aliveRef.current) { setErrMsg('Örnek hata (geliştirme modu): girdi okunamadı'); setPhase('error') } }, 1400); return () => { aliveRef.current = false; clearTimeout(t) } }
    // ÖNEMLİ: örnek manifest anında yüklenir; animasyon erken bitmesin diye doneRef'i SADECE ramp
    // (~6.5s, tüm aşamalar görünür) bittikten + manifest hazır olduktan SONRA aç.
    const start = performance.now(); const DUR = 6500
    let raf = 0; let rampDone = false
    const ramp = (now: number) => {
      if (!aliveRef.current) return
      const t = (now - start) / DUR
      targetRef.current = Math.min(0.97, t)
      if (t < 1) { raf = requestAnimationFrame(ramp) }
      else { rampDone = true; if (resultRef.current) doneRef.current = true }
    }
    raf = requestAnimationFrame(ramp)
    loadEpisode()
      .then((m) => { if (aliveRef.current) { resultRef.current = m; if (rampDone) doneRef.current = true } })
      .catch((e: unknown) => { if (aliveRef.current) { setErrMsg(e instanceof Error ? e.message : 'Beklenmedik bir sorun oldu — tekrar denemek çoğu zaman çözer'); setPhase('error') } })
    return () => { aliveRef.current = false; cancelAnimationFrame(raf) }
  }, [intake, runKey])

  // ── AKIŞKAN sürücü: prog → target (ease) + DAİMA hareket (creep). done → 1. ──
  useEffect(() => {
    if (phase !== 'running') return
    let raf = 0
    const tick = () => {
      setProg((p) => {
        // GERÇEK ilerlemeyi izle — OVERRUN YOK (eski creep gerçeği aşıp %79'da takılıyordu).
        // "Donma" hissini alttaki SÜREKLİ kayan ışık önler; uzun adımda (vlm) % gerçek hızda ilerler.
        const tgt = doneRef.current ? 1 : Math.min(0.985, targetRef.current)
        let next = p + (tgt - p) * (reduce ? 0.6 : 0.05)
        if (next > 0.999) next = 1
        return next
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase, reduce])

  // prog ~1 + iş bitti → 'done' (SADECE faz değiştir). Geçişi AYRI effect yapar — yoksa setPhase'in
  // re-render'ı bu effect'i yeniden kurup setTimeout'u clearTimeout'luyordu → reji'ye HİÇ geçmiyordu (hang).
  useEffect(() => {
    if (phase === 'running' && doneRef.current && prog >= 0.999) setPhase('done')
  }, [phase, prog])
  // 'done' olunca kısa süre kal → reji'ye geç (bu effect yalnız 'done'a girince 1 kez kurulur, iptal edilmez)
  useEffect(() => {
    if (phase !== 'done') return
    const t = setTimeout(() => { if (aliveRef.current && resultRef.current) { setManifest(resultRef.current); setScreen('review') } }, 1900)
    return () => clearTimeout(t)
  }, [phase, setManifest, setScreen])

  const onCancel = () => { aliveRef.current = false; setScreen('intake') }
  const onRetry = () => setRunKey((k) => k + 1)

  const N = STAGES.length
  const stageF = prog * N
  const stageIdx = Math.min(N - 1, Math.floor(stageF))
  const stageFill = phase === 'done' ? 1 : Math.max(0, Math.min(1, stageF - stageIdx))
  const stagePct = Math.round(stageFill * 100)
  const cur = STAGES[stageIdx]

  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden">
      <AmbientLayer />
      <RainCanvas intensity={phase === 'done' ? 0.7 : 1.15} />
      <div className={cn('pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-colors duration-700',
        phase === 'error' ? 'bg-danger/[0.07]' : phase === 'done' ? 'bg-ok/[0.08]' : 'bg-amber-500/[0.06]')} />

      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: EXPO }}
        className="relative w-[520px] max-w-[92vw] overflow-hidden rounded-2xl glass p-8 shadow-pop">

        <AnimatePresence mode="wait">
          {phase === 'error' ? (
            <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="flex flex-col items-center text-center">
              <motion.div initial={reduce ? false : { scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={SPRING.gentle}
                className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-danger/12 ring-1 ring-danger/25 text-danger"><CloudRainWind size={44} /></motion.div>
              <h2 className="mt-5 text-title font-semibold">Analiz tamamlanamadı</h2>
              <p className="mt-1.5 max-w-xs text-body text-fg-muted">Bir şeyler eksik kalmış görünüyor — birlikte düzeltelim.</p>
              {errMsg && <div className="mt-3 max-h-28 w-full overflow-y-auto break-words rounded-lg bg-ink-900/70 px-3 py-2 text-left text-label text-fg-subtle ring-hair">{errMsg}</div>}
              {/* A6: "Tekrar dene" aynı girdilerle döner — girdiler bozuksa kısır döngü olmasın diye yol göster */}
              <ul className="mt-3 w-full space-y-1 text-left text-label leading-snug text-fg-subtle">
                <li>· Video klasörü ile prompt belgesi <b className="text-fg-muted">aynı bölüme</b> ait mi?</li>
                <li>· Dosyalar taşındı/silindiyse Giriş'ten <b className="text-fg-muted">yeniden seç</b>.</li>
                <li>· Sorun sürerse üstteki hata detayını not al — hangi dosyada takıldığını söyler.</li>
              </ul>
              <div className="mt-5 flex gap-2.5">
                <Button variant="ghost" onClick={() => setScreen('intake')}><ArrowLeft size={15} /> Girişe dön</Button>
                <Button variant="primary" onClick={onRetry}><RotateCcw size={15} /> Tekrar dene</Button>
              </div>
            </motion.div>
          ) : phase === 'done' ? (
            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="flex flex-col items-center text-center">
              <motion.div initial={reduce ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={SPRING.pop}
                className="relative flex h-[128px] w-[128px] items-center justify-center rounded-full bg-ok/12 ring-1 ring-ok/30 text-ok">
                <Clapperboard size={50} />
                {!reduce && <motion.span aria-hidden className="absolute inset-0 rounded-full ring-2 ring-ok/40"
                  initial={{ scale: 0.8, opacity: 0.8 }} animate={{ scale: 1.5, opacity: 0 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }} />}
              </motion.div>
              <motion.h2 initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-5 text-title font-semibold">Bölüm analizi tamamlandı</motion.h2>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-1 flex items-center gap-1.5 text-body text-fg-muted">
                İnceleme'ye geçiliyor
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.1, repeat: Infinity }}>…</motion.span>
              </motion.p>
            </motion.div>
          ) : (
            <motion.div key="run" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}>
              {/* Üst: AKTİF aşamanın %'si (her aşamada 0→100 yeniden dolar) + dönen ışık */}
              <div className="flex flex-col items-center">
                <ProgressRing value={stageFill} size={132} stroke={6}>
                  <span className="text-display font-semibold tabular leading-none text-gold">{stagePct}<span className="text-lead">%</span></span>
                  <span className="mt-1 text-micro tabular text-fg-subtle">aşama {stageIdx + 1} / {N}</span>
                </ProgressRing>
                <h2 className="mt-5 text-lead font-semibold">{cur.label}</h2>
                <p className="text-label text-fg-subtle">{cur.sub} · tamamen yerel, çevrimdışı</p>
              </div>

              {/* Aşama listesi: biten=yeşil tik, aktif=dolan+kayan ışık, bekleyen=sönük */}
              <div className="mt-7 space-y-2.5">
                {STAGES.map((s, i) => {
                  const status = i < stageIdx ? 'done' : i === stageIdx ? 'active' : 'pending'
                  const fill = status === 'done' ? 1 : status === 'active' ? stageFill : 0
                  return (
                    <div key={i} className="flex items-center gap-3" style={{ opacity: status === 'pending' ? 0.4 : 1, transition: 'opacity .35s ease' }}>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: status === 'done' ? 'color-mix(in srgb, var(--color-ok) 16%, transparent)' : status === 'active' ? 'color-mix(in srgb, var(--color-amber-400) 16%, transparent)' : 'rgba(255,255,255,0.04)', color: status === 'done' ? 'var(--color-ok)' : status === 'active' ? 'var(--color-amber-400)' : 'var(--color-fg-faint)' }}>
                        {status === 'done'
                          ? <motion.span initial={reduce ? false : { scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={SPRING.pop}><Check size={15} /></motion.span>
                          : s.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-body text-fg-muted">{s.label}</span>
                          <span className="shrink-0 text-caption tabular text-fg-subtle">{status === 'active' ? `${stagePct}%` : ''}</span>
                        </div>
                        <div className="relative mt-1 h-1 overflow-hidden rounded-full bg-ink-900/80">
                          <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${fill * 100}%`, background: status === 'done' ? 'var(--color-ok)' : 'linear-gradient(90deg, var(--color-amber-500), var(--color-amber-400))', transition: 'width 90ms linear' }} />
                          {status === 'active' && !reduce && (
                            <motion.span aria-hidden className="absolute inset-y-0 w-2/5 rounded-full"
                              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)' }}
                              initial={{ left: '-40%' }} animate={{ left: ['-40%', '100%'] }}
                              transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }} />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 flex justify-end hairline-t pt-4">
                <Button variant="ghost" size="sm" onClick={onCancel}><X size={14} /> İptal</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
