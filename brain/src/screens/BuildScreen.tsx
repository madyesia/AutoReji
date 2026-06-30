import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Hammer, Check, Film, Volume2, Layers, Ban, Sparkles, FolderOpen, Download, Copy, Library, Info, PlugZap } from 'lucide-react'
import { useApp } from '../lib/store'
import { computeStats, thumbUrl, type Stats } from '../lib/data'
import { fmtMin, fmtDur, TRANSITION, scaleColor } from '../lib/utils'
import { saveTextFile } from '../lib/native'
import { buildArchiveEntry, writeArchiveEntry, readArchive, markArchiveSaved } from '../lib/archive'
import { Button, Dot, SectionLabel, Tip } from '../components/ui'
import { ApprovedSeal, ProgressRing, StageTimeline, BirthStat, RevealPanel } from '../components/motifs'
import { prettyEpisode } from '../components/AppShell'
import type { Clip } from '../lib/types'

const STEPS = ['Klipler import ediliyor (native stereo)', 'Sequence kuruluyor', 'Boşluklar kapatılıyor (tick-tam)', 'Geçişler ekleniyor (ortalı)', 'Crop · intro/outro']

function sampleEvenly<T>(arr: T[], n: number): T[] {
  if (n <= 1) return arr.slice(0, Math.max(0, n))
  if (arr.length <= n) return arr
  const out: T[] = []
  for (let i = 0; i < n; i++) out.push(arr[Math.round((i / (n - 1)) * (arr.length - 1))])
  return out
}

export function BuildScreen() {
  const setScreen = useApp((s) => s.setScreen)
  const clips = useApp((s) => s.clips)
  const manifest = useApp((s) => s.manifest)
  const pushToast = useApp((s) => s.pushToast)
  const setup = useApp((s) => s.setup)
  const stats = useMemo(() => computeStats(clips), [clips])
  const [phase, setPhase] = useState<'ready' | 'building' | 'done'>('ready')
  const [prog, setProg] = useState(0)
  const [saved, setSaved] = useState<{ name: string; path: string | null } | null>(null)
  const wroteRef = useRef(false)

  const name = manifest?.episode.name ?? 'bolum'

  useEffect(() => {
    if (phase !== 'building') return
    const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) { setProg(1); const t = setTimeout(() => setPhase('done'), 300); return () => clearTimeout(t) }
    // sürekli ilerleme (kayan %) — adım-bazlı sıçrama YOK; StageTimeline adımları prog'tan türetilir
    let raf = 0
    let doneTimer: ReturnType<typeof setTimeout> | undefined
    const t0 = performance.now()
    const DUR = 3600
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / DUR)
      setProg(p)
      if (p < 1) raf = requestAnimationFrame(tick)
      else doneTimer = setTimeout(() => setPhase('done'), 350)
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); if (doneTimer) clearTimeout(doneTimer) }
  }, [phase])

  // kurulduğunda arşive yaz (bir kez) + bildirim — StrictMode'a karşı ref guard, seed tekilleştirir
  useEffect(() => {
    if (phase !== 'done' || !manifest || wroteRef.current) return
    wroteRef.current = true
    writeArchiveEntry(buildArchiveEntry(manifest, clips))
    pushToast('Bölüm arşive eklendi', { kind: 'ok', icon: 'check' })
  }, [phase, manifest, clips, pushToast])

  // done'a girince arşivden kaydetme durumunu oku → "kaydedildi" KALICI (ekranı terk edip dönünce de görünür, geri dönmez)
  useEffect(() => {
    if (phase !== 'done' || !manifest) return
    const e = readArchive().find((x) => x.seed === manifest.build.seed)
    if (e?.savedAt && e.savedName) setSaved({ name: e.savedName, path: e.savedPath ?? null })
  }, [phase, manifest])

  // Manifest'i GERÇEK dosya olarak kaydet — kullanıcı YERİ seçer (Tauri mutlak yol / tarayıcı showSaveFilePicker).
  // {...manifest, clips} = düzenlenmiş hâl. Başarınca arşiv kaydını da işaretle (savedAt + ad/yol). Panel bunu okur.
  const saveManifest = async () => {
    if (!manifest) return
    const json = JSON.stringify({ ...manifest, clips }, null, 2)
    const r = await saveTextFile(`${name}_manifest.json`, json)
    if (r.ok) {
      markArchiveSaved(manifest.build.seed, { savedAt: new Date().toISOString(), savedName: r.name, savedPath: r.path })
      setSaved({ name: r.name, path: r.path })
      pushToast(r.native ? 'Manifest kaydedildi ✓' : 'Manifest indirildi ✓', { kind: 'ok', icon: 'check' })
    } else pushToast('Kaydetme iptal edildi', { kind: 'amber', icon: 'alert' })
  }

  return (
    <div className="relative h-full overflow-y-auto">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-amber-500/[0.05] to-transparent" />
      <div className="relative mx-auto max-w-2xl px-8 py-12">
        <button onClick={() => setScreen('review')} className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-fg-muted hover:text-fg"><ArrowLeft size={15} /> İncelemeye dön</button>

        {phase === 'ready' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
            <h1 className="text-[30px] font-semibold">Kuruluma hazır</h1>
            <p className="mt-1.5 text-[15px] text-fg-muted">{manifest && prettyEpisode(manifest.episode.name)}</p>

            <div key={stats.enabled} className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Card i={0}><BirthStat label="Klip" value={stats.enabled} delay={0} /></Card>
              <Card i={1}><BirthStat label="Süre" value={stats.total} format={(n) => `~${fmtMin(n)}`} sub={`ort ${fmtDur(stats.avg)}`} delay={0.06} /></Card>
              <Card i={2}><BirthStat label="Geçiş" value={stats.fades + stats.blacks} sub={`${stats.fades} fade · ${stats.blacks} black`} accent="var(--color-fade)" delay={0.12} /></Card>
              <Card i={3}><BirthStat label="Cut" value={stats.cuts} delay={0.18} /></Card>
            </div>

            <div className="mt-3 flex items-center gap-3 rounded-xl glass px-4 py-2.5 text-[12.5px] text-fg-muted">
              {([['cut', TRANSITION.cut.color], ['fade', TRANSITION.fade.color], ['black', TRANSITION.black.color]] as const).map(([lbl, c], i) => (
                <motion.span key={lbl} className="flex items-center gap-1.5"
                  initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 18, delay: 0.25 + i * 0.09 }}>
                  <Dot color={c} /> {lbl}
                </motion.span>
              ))}
              <div className="h-4 w-px bg-white/10" />
              <span>seed: {manifest?.build.seed?.slice(0, 18)}…</span>
            </div>

            <div className="mt-7">
              <RevealPanel title="Premiere'de ne kurulacak" defaultOpen={false}>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <Feature icon={<Volume2 size={16} />} title="Native stereo" desc="tek katman, L≠R — ASMR kesintisiz" />
                  <Feature icon={<Layers size={16} />} title="Düzenlenebilir klipler + geçişler" desc="her şey elle ince ayarlanabilir" />
                  <Feature icon={<Ban size={16} />} title="Render YOK" desc="anında, kayıpsız timeline" />
                  <Feature icon={<Film size={16} />} title="Kare-tam, ortalı fade" desc="mikro boşluk yok, siyahtan başlamaz" />
                </div>
              </RevealPanel>
            </div>

            <div className="mt-8 flex justify-end">
              <Button variant="primary" size="lg" onClick={() => { setProg(0); setPhase('building') }}><Hammer size={18} /> Premiere'de Kur</Button>
            </div>
          </motion.div>
        )}

        {phase === 'building' && (
          <div className="pt-6">
            <div className="flex items-center gap-5">
              <ProgressRing value={prog} size={92} stroke={5}>
                <span className="text-[19px] font-semibold tabular leading-none text-gold">{Math.round(prog * 100)}<span className="text-[11px]">%</span></span>
              </ProgressRing>
              <div>
                <h1 className="text-[24px] font-semibold">Kuruluyor…</h1>
                <p className="mt-1 text-[13px] text-fg-subtle">UXP paneli timeline'ı kuruyor · <b className="text-fg-muted">render yok</b></p>
              </div>
            </div>
            <div className="mt-7"><StageTimeline stages={STEPS.map((s) => ({ label: s }))} activeIndex={Math.min(STEPS.length - 1, Math.floor(prog * STEPS.length))} /></div>
          </div>
        )}

        {phase === 'done' && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }} className="pt-4">
            <div className="relative flex flex-col items-center text-center">
              <ApprovedSeal kind="real" size={72} />
              <h1 className="mt-5 text-[26px] font-semibold">Bölüm kuruldu 🌧️</h1>
              <p className="mt-1.5 max-w-md text-[14px] text-fg-muted">Premiere'de native stereo, düzenlenebilir, render'sız timeline hazır. İnce ayarı orada yapabilirsin.</p>
            </div>

            <div className="mt-7 space-y-4 rounded-2xl glass p-5">
              {setup.plugin === 'pending' && (
                <button onClick={() => setScreen('setup')} className="flex w-full items-center gap-2.5 rounded-xl bg-amber-500/[0.08] px-3.5 py-2.5 text-left ring-1 ring-amber-400/25 transition-colors hover:bg-amber-500/[0.12]">
                  <PlugZap size={15} className="shrink-0 text-amber-400" />
                  <span className="flex-1 text-[12.5px] leading-snug text-fg-muted">MONTAJCI panelini henüz bağlamadın — bu olmadan bölüm Premiere'de açılmaz. <b className="text-amber-300">Hazırlığı aç →</b></span>
                </button>
              )}
              <Recap stats={stats} downgraded={manifest?.build.fades_downgraded_to_cut ?? 0} />

              <div className="hairline-t pt-4"><MiniStrip clips={clips} /></div>

              <div className="hairline-t pt-4">
                <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-fg-subtle">
                  <Download size={12} className="text-amber-400" /> Manifest dosyası
                </div>
                {!saved ? (
                  <>
                    <p className="mb-3 text-[12.5px] leading-snug text-fg-muted">Panelin okuyacağı <code className="rounded bg-ink-900/70 px-1.5 py-0.5 font-mono text-[11.5px] text-amber-200/85 ring-hair">{name}_manifest.json</code> dosyasını kaydet — <b className="text-fg-muted">nereye kaydedeceğini sen seçersin</b>.</p>
                    <Button variant="primary" className="w-full" onClick={saveManifest}><Download size={16} /> Manifest'i Kaydet</Button>
                  </>
                ) : (
                  <div className="rounded-xl bg-ok/[0.06] p-3.5 ring-1 ring-ok/20">
                    <div className="flex items-center gap-2 text-[13px] font-medium text-ok"><Check size={15} /> Manifest kaydedildi</div>
                    <SavedPathRow name={saved.name} path={saved.path} />
                    <button onClick={saveManifest} className="mt-2.5 inline-flex items-center gap-1.5 text-[12px] text-fg-subtle transition-colors hover:text-fg"><Download size={12} /> Tekrar kaydet (başka yere)</button>
                  </div>
                )}
              </div>

              <div className="hairline-t pt-3.5">
                <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-fg-subtle">
                  <Sparkles size={12} className="text-amber-400" /> Premiere'de son adım (elle)
                </div>
                <ol className="space-y-2">
                  {[
                    'Premiere Pro 2026\'yı aç.',
                    'Üst menü: Window → UXP Plugins → AutoReji panelini aç.',
                    'AutoReji panelinde "Yükle" → "Manifest Dosyası Seç" → kaydettiğin manifest.json\'u seç (otomatik Kur sekmesine geçer).',
                  ].map((t, i) => (
                    <li key={i} className="flex gap-2.5 text-[12.5px] leading-snug text-fg-muted">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-400/15 text-[11px] font-bold tabular text-amber-300">{i + 1}</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap justify-center gap-2.5">
              <Button variant="subtle" onClick={() => setScreen('review')}><ArrowLeft size={15} /> İncelemeye dön</Button>
              <Button variant="subtle" onClick={() => setScreen('archive')}><Library size={16} /> Arşiv'i aç</Button>
              <Button variant="primary" onClick={() => setScreen('intake')}><FolderOpen size={16} /> Yeni bölüm</Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

const Card = ({ children, i = 0 }: { children: ReactNode; i?: number }) => {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 24, delay: reduce ? 0 : i * 0.07 }}
      className="relative overflow-hidden rounded-xl glass px-4 py-3">
      {!reduce && (
        <motion.span aria-hidden className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(120% 80% at 50% 0%, var(--glow-amber), transparent 70%)' }}
          initial={{ opacity: 0 }} animate={{ opacity: [0, 0.6, 0] }} transition={{ duration: 0.9, delay: i * 0.07 }} />
      )}
      <div className="relative">{children}</div>
    </motion.div>
  )
}

function Feature({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl glass p-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-400/12 text-amber-300">{icon}</span>
      <div><div className="text-[13.5px] font-medium">{title}</div><div className="text-[12px] text-fg-subtle">{desc}</div></div>
    </div>
  )
}

// Kuruluş recap'i — somut "ne yapıldı" (jenerik değil); satırlar stagger ile akar
function Recap({ stats, downgraded }: { stats: Stats; downgraded: number }) {
  const lines: { txt: ReactNode; warn?: boolean }[] = [
    { txt: <><b className="text-fg">Native stereo</b> · {stats.enabled} klip tek katmanda (L≠R)</> },
    { txt: <><span className="text-gold tabular">{stats.fades}</span> fade + <span className="text-gold tabular">{stats.blacks}</span> black geçiş · hepsi kare-tam ortalı</> },
    { txt: <>Boşluklar kapatıldı · <b className="text-fg">render yok</b>, kayıpsız timeline</> },
    ...(downgraded > 0 ? [{ txt: <><span className="tabular">{downgraded}</span> fade güvenli cut'a indirildi</>, warn: true }] : []),
    { txt: <>~{fmtMin(stats.total)} toplam · ort {fmtDur(stats.avg)}/klip</> },
  ]
  return (
    <div className="space-y-1.5">
      {lines.map((l, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: 0.15 + i * 0.06 }}
          className="flex items-center gap-2.5 text-[13px] text-fg-muted">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
            style={{ background: l.warn ? 'color-mix(in srgb, var(--color-warn) 16%, transparent)' : 'color-mix(in srgb, var(--color-ok) 14%, transparent)' }}>
            {l.warn ? <Info size={13} className="text-warn" /> : <Check size={13} className="text-ok" />}
          </span>
          <span>{l.txt}</span>
        </motion.div>
      ))}
    </div>
  )
}

// Kurulan sıranın sinematik görsel mührü — eşit aralıklı ~28 kare (hafif, salt-okunur)
function MiniStrip({ clips }: { clips: Clip[] }) {
  const enabled = useMemo(() => clips.filter((c) => c.enabled), [clips])
  const shown = useMemo(() => sampleEvenly(enabled, 28), [enabled])
  if (!shown.length) return null
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <SectionLabel>Kurulan sıra</SectionLabel>
        <span className="text-[11px] tabular text-fg-subtle">{enabled.length} klip</span>
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex gap-px overflow-hidden rounded-xl ring-hair">
        {shown.map((c) => (
          <div key={c.scene} className="relative aspect-video min-w-0 flex-1 bg-ink-900">
            <img src={thumbUrl(c.scene)} loading="lazy" decoding="async" alt="" className="absolute inset-0 h-full w-full object-cover" onError={(e) => (e.currentTarget.style.opacity = '0')} />
            <span className="absolute inset-x-0 bottom-0 h-[2px]" style={{ background: scaleColor(c.meta.scale) }} />
          </div>
        ))}
      </motion.div>
    </div>
  )
}

// Kaydedilen manifest'in konumu. Tauri'de MUTLAK yol (kopyalanabilir); tarayıcıda yalnız dosya adı —
// tarayıcı güvenlik gereği tam yolu JS'e VERMEZ (araştırma+adversarial doğrulandı), Faz 4 paketli .app'te tam yol gelir.
function SavedPathRow({ name, path }: { name: string; path: string | null }) {
  const pushToast = useApp((s) => s.pushToast)
  const [copied, setCopied] = useState(false)
  const value = path ?? name
  const copy = () => {
    navigator.clipboard?.writeText(value)
    setCopied(true); setTimeout(() => setCopied(false), 1500)
    pushToast(path ? 'Yol kopyalandı' : 'Dosya adı kopyalandı', { kind: 'ok', icon: 'copy' })
  }
  return (
    <div className="mt-2.5">
      <div className="flex items-center gap-1.5">
        <code className="min-w-0 flex-1 truncate rounded-md bg-ink-900/70 px-2 py-1.5 font-mono text-[11.5px] text-amber-200/85 ring-hair select-text">{value}</code>
        <Tip label={copied ? 'Kopyalandı ✓' : path ? 'Yolu kopyala' : 'Adı kopyala'}>
          <button onClick={copy} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-fg-subtle ring-hair transition-colors hover:bg-white/8 hover:text-fg">
            {copied ? <Check size={14} className="text-ok" /> : <Copy size={14} />}
          </button>
        </Tip>
      </div>
      {!path && (
        <p className="mt-1.5 text-[11px] leading-snug text-fg-subtle">Yeri sen seçtin. Tarayıcı güvenlik gereği tam klasör yolunu gösteremez — kurulu uygulamada (.app) burada tam yol görünür.</p>
      )}
    </div>
  )
}

