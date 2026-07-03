import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Clapperboard, DownloadCloud, PlugZap, Check, Circle, ArrowRight, TriangleAlert,
  RotateCcw, CloudRainWind, X, Sparkles, ShieldCheck, ExternalLink, Power, Loader,
} from 'lucide-react'
import { RainCanvas } from '../components/RainCanvas'
import { Button, Badge, Tip, SectionLabel } from '../components/ui'
import { ProgressRing, ApprovedSeal, ConnPulse, ScanBeam, useScanChoreography } from '../components/motifs'
import { useApp } from '../lib/store'
import {
  pullModel, MODEL, openPluginManager, installPlugin, verifyPlugin, CCX_FILE,
  useOnline, setupReadyCount, SETUP_ITEM_COUNT, type PullProgress, type InstallProgress,
  detectAndPatch, ollamaStatus, startOllama, openOllamaDownload, OllamaError,
} from '../lib/setup'
import { tauriAvailable } from '../lib/native'
import type { SetupItemState } from '../lib/types'
import { cn } from '../lib/utils'
import { AmbientLayer } from '../components/AmbientLayer'
import { EASE } from '../lib/motion'

const EXPO = EASE.outExpo
const fmtGB = (b: number) => `${(b / 1024 ** 3).toFixed(1)} GB`

export function SetupScreen() {
  const setup = useApp((s) => s.setup)
  const setSetup = useApp((s) => s.setSetup)
  const completeSetup = useApp((s) => s.completeSetup)
  const skipSetup = useApp((s) => s.skipSetup)
  const ready = setupReadyCount(setup)
  const allReady = ready === SETUP_ITEM_COUNT

  // .app içinde (Tauri): sistemden GERÇEK tespit → kurulu olanları 'ok'a YÜKSELT (yeşil "doğrulandı").
  // Tarayıcıda no-op (elle-onay kalır). Asla düşürmez; yalnız 'ok' ekler.
  useEffect(() => {
    if (!tauriAvailable()) return
    let alive = true
    // .app: sistemden OTORİTER tespit (yoksa 'pending' → yanlış "doğrulandı" yok). MONTAJCI hariç
    // (CC konumu opak; kullanıcı ack/Kur ile yönetir). detectAndPatch içinde mantık.
    void detectAndPatch().then((next) => { if (alive) setSetup(next) })
    return () => { alive = false }
  }, [setSetup])

  // Sıralı %-tarama koreografisi: aktif satır sırayla gezer (dolan halka); önceden onaylı satırlar hızlı taranır
  const scanFast = SUM_ITEMS.map((it) => setup[it.key] !== 'pending')
  const { scanIdx, ringValue } = useScanChoreography(SETUP_ITEM_COUNT, scanFast)

  return (
    <div className="relative h-full overflow-y-auto">
      <AmbientLayer />
      <RainCanvas intensity={0.5} className="opacity-50" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-amber-500/[0.04] to-transparent" />

      <div className="relative mx-auto max-w-3xl px-8 py-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EXPO }}>
          <div className="flex items-center gap-2 text-body text-fg-subtle">
            <Sparkles size={14} className="text-amber-400" /> Stüdyo Hazırlığı · ilk kurulum
            <span className="mx-1 h-3 w-px bg-white/10" />
            <ConnPulse showLabel />
          </div>
          <h1 className="mt-2 text-display font-semibold leading-tight">Hazırlık</h1>
          <p className="mt-1.5 max-w-xl text-lead text-fg-muted">
            AutoReji'yi Premiere'e bağlamak için bir kez kuralım: AI modeli ve MONTAJCI paneli. Bittiğinde her gün doğrudan kurguya geçersin.
          </p>
        </motion.div>

        {/* Üst durum özeti — alanlar sırayla taranır (görsel şölen) */}
        <ScanSummary setup={setup} scanIdx={scanIdx} ringValue={ringValue} ready={ready} />

        {/* Bağlantı Hattı — dikey spine üzerinde bölümler */}
        <div className="relative mt-7 pl-1">
          <span aria-hidden className="absolute bottom-6 left-[15px] top-6 w-px"
            style={{ background: 'linear-gradient(180deg, rgba(33,42,61,.2), var(--glow-amber), rgba(33,42,61,.2))' }} />
          <div className="flex flex-col gap-3.5">
            <PremiereSection idx={0} revealed={scanIdx >= 0} />
            <ModelSection idx={1} revealed={scanIdx >= 1} />
            <PluginSection idx={2} revealed={scanIdx >= 2} />
          </div>
        </div>

        {/* ÖNEM uyarısı */}
        <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-amber-500/[0.08] px-4 py-3 ring-1 ring-amber-400/25">
          <TriangleAlert size={16} className="mt-0.5 shrink-0 text-amber-400" />
          <p className="text-body leading-snug text-fg-muted">
            Bu adımlar tamamlanmadan kurulan bölüm Premiere'de açılmaz. Şimdilik atlayabilirsin ama sonra tamamlaman gerekir — durum üst barda hatırlatılır.
          </p>
        </div>

        {/* Alt aksiyonlar */}
        <div className="mt-7 flex items-center justify-between gap-3">
          <button onClick={skipSetup} className="text-body text-fg-subtle transition-colors hover:text-fg">Şimdilik atla →</button>
          <Tip label={allReady ? 'Her şey hazır — kurguya başla' : 'Eksikler var; yine de Giriş\'e geçebilirsin'}>
            <Button variant={allReady ? 'primary' : 'outline'} size="lg" onClick={completeSetup}>
              {allReady ? 'Hazır — Giriş\'e geç' : 'Giriş\'e geç'} <ArrowRight size={18} />
            </Button>
          </Tip>
        </div>
      </div>
    </div>
  )
}

/* ---------------- üst sıralı-tarama özeti ---------------- */
const SUM_ITEMS: { key: keyof Pick<import('../lib/types').SetupState, 'premiere' | 'model' | 'plugin'>; label: string }[] = [
  { key: 'premiere', label: 'Premiere' }, { key: 'model', label: 'AI modeli' }, { key: 'plugin', label: 'MONTAJCI' },
]
function ScanSummary({ setup, scanIdx, ringValue, ready }: { setup: import('../lib/types').SetupState; scanIdx: number; ringValue: number; ready: number }) {
  const scanning = scanIdx < SUM_ITEMS.length
  const active = scanning && scanIdx >= 0 ? SUM_ITEMS[scanIdx].label : ''
  return (
    <div className="mt-7 overflow-hidden rounded-2xl glass p-4">
      <div className="flex items-center justify-between">
        <SectionLabel>{scanning ? `Stüdyo taranıyor…${active ? ' · ' + active : ''}` : `Stüdyo durumu · ${ready}/${SUM_ITEMS.length} hazır`}</SectionLabel>
        <span className="flex items-center gap-3 text-caption text-fg-subtle">
          <Lg color="var(--color-ok)" t="doğrulandı" /><Lg color="var(--color-amber-400)" t="onaylı" /><Lg color="var(--color-fg-faint)" t="bekliyor" />
        </span>
      </div>
      <div className="relative mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {scanning && <ScanBeam className="rounded-xl" />}
        {SUM_ITEMS.map((it, i) => {
          const revealed = scanIdx >= i
          return (
            <div key={it.key} className={cn('relative flex items-center gap-2 rounded-xl px-3 py-2 ring-hair transition-opacity duration-300',
              revealed ? 'opacity-100' : 'opacity-30')}
              style={{ background: 'rgba(11,14,20,.5)' }}>
              {scanIdx === i ? <ProgressRing value={ringValue} size={20} stroke={3} /> : <StateDot st={setup[it.key]} />}
              <span className="truncate text-label text-fg-muted">{it.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
const Lg = ({ color, t }: { color: string; t: string }) => (
  <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />{t}</span>
)

/* ---------------- durum noktası ---------------- */
function StateDot({ st }: { st: SetupItemState }) {
  const color = st === 'ok' ? 'var(--color-ok)' : st === 'ack' ? 'var(--color-amber-400)' : 'var(--color-fg-faint)'
  if (st === 'pending') return <Circle size={14} className="shrink-0 text-fg-faint" />
  return <Check size={14} className="shrink-0" style={{ color }} />
}

/* ---------------- spine bölüm kabı ---------------- */
function SpineCard({ idx, revealed, icon, color, title, badge, children }: {
  idx: number; revealed: boolean; icon: ReactNode; color: string; title: string; badge: ReactNode; children: ReactNode
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0.25, y: 6 }}
      transition={{ duration: 0.4, ease: EXPO, delay: reduce ? 0 : idx * 0.04 }}
      className="relative pl-10"
    >
      {/* spine düğümü */}
      <span className="absolute left-[9px] top-5 h-3 w-3 rounded-full ring-2 ring-ink-900" style={{ background: color, boxShadow: `0 0 10px -1px ${color}` }} />
      <div className="relative overflow-hidden rounded-2xl glass p-4">
        <span aria-hidden className="absolute inset-y-0 left-0 w-[3px]" style={{ background: color }} />
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}>{icon}</span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-lead font-medium">{title}</span>
              {badge}
            </div>
            <div className="mt-2">{children}</div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const ackColor = (st: SetupItemState) => (st === 'ok' ? 'var(--color-ok)' : st === 'ack' ? 'var(--color-amber-400)' : 'var(--color-ink-600)')
function AckBadge({ st }: { st: SetupItemState }) {
  if (st === 'ok') return <Badge color="var(--color-ok)"><Check size={11} /> doğrulandı</Badge>
  if (st === 'ack') return <Badge color="var(--color-amber-400)"><Check size={11} /> onayladın · sistem göremiyor</Badge>
  return <Badge>bekliyor</Badge>
}
function AckButton({ st, onAck, onUndo, label = 'Yaptım ✓' }: { st: SetupItemState; onAck: () => void; onUndo: () => void; label?: string }) {
  return st === 'pending'
    ? <Button size="sm" variant="subtle" onClick={onAck}><Check size={13} /> {label}</Button>
    : <Button size="sm" variant="ghost" onClick={onUndo}><RotateCcw size={12} /> geri al</Button>
}

/* ---------------- numaralı talimat ---------------- */
function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="mt-1 space-y-1.5">
      {items.map((t, i) => (
        <li key={i} className="flex gap-2.5 text-body leading-snug text-fg-muted">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-400/15 text-caption font-bold tabular text-amber-300">{i + 1}</span>
          <span>{t}</span>
        </li>
      ))}
    </ol>
  )
}

/* ---------------- 1) Premiere ---------------- */
function PremiereSection({ idx, revealed }: { idx: number; revealed: boolean }) {
  const setup = useApp((s) => s.setup)
  const setSetup = useApp((s) => s.setSetup)
  const st = setup.premiere
  return (
    <SpineCard idx={idx} revealed={revealed} color={ackColor(st)} icon={<Clapperboard size={20} />} title="Premiere Pro 2026" badge={<AckBadge st={st} />}>
      {/* .ccx çift-tıkla kurulduğu için geliştirici modu GEREKMEZ (v1.14.3 araştırması — UDT kaldırıldı); MONTAJCI kartıyla tek hikâye */}
      <p className="text-body leading-snug text-fg-subtle">MONTAJCI paneli için <b className="text-fg-muted">Premiere Pro 25.6 veya üstü</b> yeterli — ek ayar gerekmez.</p>
      <Steps items={['Premiere Pro\'yu bir kez aç (sürümün uygun olduğunu görmek için).', 'Sürümün 25.6 veya üstüyse "Premiere hazır"ı işaretle.']} />
      <div className="mt-3"><AckButton st={st} onAck={() => setSetup({ premiere: 'ack' })} onUndo={() => setSetup({ premiere: 'pending' })} label="Premiere hazır ✓" /></div>
    </SpineCard>
  )
}

/* ---------------- 2) AI Model — GERÇEK Ollama tespit + indirme ---------------- */
// Çalışma anıyla AYNI yol (sidecar → Ollama localhost:11434). "hazır" = VLM gerçekten çalışır.
// Durumlar: checking → ready | need-install (Ollama yok) | need-start (kapalı) | need-model (model yok) | downloading.
// HER AÇILIŞTA gerçek kontrol (mount'ta refresh). Sahte simülasyon YALNIZ tarayıcı önizlemede.
type DlPhase = 'checking' | 'ready' | 'need-install' | 'need-start' | 'need-model' | 'downloading' | 'offline'
function ModelSection({ idx, revealed }: { idx: number; revealed: boolean }) {
  const setup = useApp((s) => s.setup)
  const setSetup = useApp((s) => s.setSetup)
  const pushToast = useApp((s) => s.pushToast)
  const online = useOnline()
  const reduce = useReducedMotion()
  const native = tauriAvailable()
  const [phase, setPhase] = useState<DlPhase>(native ? 'checking' : (setup.model !== 'pending' ? 'ready' : 'need-model'))
  const [prog, setProg] = useState<PullProgress | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const aliveRef = useRef(true)
  useEffect(() => () => { aliveRef.current = false; abortRef.current?.abort() }, [])

  // GERÇEK durum kontrolü — Ollama ayakta mı + model sunulabiliyor mu (her açılışta + manuel).
  const refresh = async () => {
    if (!native) return
    setPhase('checking')
    const stt = await ollamaStatus()
    if (!aliveRef.current) return
    if (stt?.ready) { setPhase('ready'); setSetup({ model: 'ok' }) }
    else if (stt?.running) { setPhase('need-model'); setSetup({ model: 'pending' }) }
    else if (stt?.installed) { setPhase('need-start'); setSetup({ model: 'pending' }) }
    else { setPhase('need-install'); setSetup({ model: 'pending' }) }
  }
  useEffect(() => { void refresh() }, []) // mount = her açılış → gerçek kontrol

  const download = async () => {
    if (!online) { setPhase('offline'); return }
    setPhase('downloading'); setProg(null)
    const ac = new AbortController(); abortRef.current = ac
    try {
      await pullModel(MODEL.tag, (p) => { if (aliveRef.current) setProg(p) }, ac.signal)
      if (!aliveRef.current || ac.signal.aborted) return
      if (native) { await refresh(); pushToast('AI modeli hazır · qwen2.5-VL 7B', { kind: 'ok', icon: 'check' }) }
      else { setPhase('ready'); setSetup({ model: 'ack' }); pushToast('AI modeli hazır (önizleme)', { kind: 'ok', icon: 'check' }) }
    } catch (e) {
      if (!aliveRef.current) return
      if (e instanceof OllamaError) {
        setPhase(e.reason === 'not-installed' ? 'need-install' : e.reason === 'not-running' ? 'need-start' : 'need-model')
        pushToast(e.reason === 'not-installed' ? 'Ollama kurulu değil — önce kur' : e.reason === 'not-running' ? 'Ollama çalışmıyor — başlat' : 'İndirilemedi — tekrar dene', { kind: 'amber', icon: 'alert', ttl: 5000 })
      } else { setPhase('need-model'); pushToast('Model indirilemedi', { kind: 'danger', icon: 'alert', ttl: 6000, sub: "Bağlantı kopmuş ya da Ollama yanıt vermemiş olabilir. İnternetini kontrol edip tekrar dene — indirme kaldığı yerden sürer." }) }
    }
  }
  const cancel = () => { abortRef.current?.abort(); void refresh() }
  const startServer = () => {
    startOllama()
    pushToast('Ollama başlatılıyor — birkaç saniye sonra otomatik kontrol', { kind: 'amber', icon: 'check', ttl: 4500 })
    setTimeout(() => { if (aliveRef.current) void refresh() }, 3500)
  }
  const installOllama = () => { openOllamaDownload(); pushToast('Ollama indirme sayfası açıldı — kur, sonra "Tekrar kontrol et"', { kind: 'amber', icon: 'check', ttl: 5000 }) }

  const pct = prog && prog.total > 0 ? prog.bytes / prog.total : 0
  const st = setup.model
  const Recheck = <button onClick={refresh} className="text-caption text-fg-subtle transition-colors hover:text-fg-muted">tekrar kontrol et</button>
  return (
    <SpineCard idx={idx} revealed={revealed} color={ackColor(st)} icon={<DownloadCloud size={20} />} title="AI Modeli — yerel görsel-AI" badge={<AckBadge st={st} />}>
      <p className="text-body leading-snug text-fg-subtle">{MODEL.label} · {fmtGB(MODEL.sizeBytes)} · {MODEL.quant} — <b className="text-fg-muted">Ollama</b> ile yerel çalışır; bir kez indirilir, sonra <b className="text-fg-muted">tamamen çevrimdışı</b>.</p>

      {phase === 'checking' ? (
        <div className="mt-3 flex items-center gap-2.5 text-body text-fg-subtle">
          <Loader size={15} className="animate-spin text-amber-300" /> Ollama ve model kontrol ediliyor…
        </div>
      ) : phase === 'ready' ? (
        <div className="mt-3 flex items-center gap-3">
          <ApprovedSeal kind={native ? 'real' : 'manual'} size={44} />
          <div className="min-w-0">
            <div className="text-body font-medium text-fg">Model hazır{native ? ' · doğrulandı' : ''}</div>
            <div className="text-caption text-fg-subtle">{MODEL.label} · {fmtGB(MODEL.sizeBytes)} · Ollama çalışıyor ✓</div>
          </div>
          <div className="ml-auto">{Recheck}</div>
        </div>
      ) : phase === 'downloading' ? (
        <div className="mt-3 flex items-center gap-4">
          <ProgressRing value={pct} size={104} stroke={5}>
            <span className="text-headline font-semibold tabular leading-none text-gold">{Math.round(pct * 100)}<span className="text-label">%</span></span>
            <span className="mt-0.5 text-micro tabular text-fg-subtle">{fmtGB(prog?.bytes ?? 0)} / {fmtGB(MODEL.sizeBytes)}</span>
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <div className="text-body text-fg">{prog?.phase ?? 'Bağlanıyor…'}</div>
            <div className="mt-0.5 text-caption tabular text-fg-subtle">Ollama üzerinden indiriliyor</div>
            <button onClick={cancel} className="mt-2 inline-flex items-center gap-1 text-caption text-fg-subtle hover:text-fg-muted"><X size={12} /> İptal</button>
          </div>
        </div>
      ) : phase === 'need-install' ? (
        <div className="mt-3 space-y-2.5 rounded-xl bg-amber-500/[0.07] p-3 ring-1 ring-amber-400/20">
          <div className="text-body leading-snug text-fg"><b className="text-fg-muted">Ollama gerekli</b> — görsel-AI'yı yerel/çevrimdışı çalıştıran ücretsiz uygulama. Bir kez kurulur.</div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="primary" onClick={installOllama}><ExternalLink size={14} /> Ollama'yı indir</Button>
            <Button size="sm" variant="subtle" onClick={refresh}><RotateCcw size={12} /> Tekrar kontrol et</Button>
          </div>
        </div>
      ) : phase === 'need-start' ? (
        <div className="mt-3 space-y-2.5 rounded-xl bg-amber-500/[0.07] p-3 ring-1 ring-amber-400/20">
          <div className="text-body leading-snug text-fg">Ollama kurulu ama <b className="text-fg-muted">çalışmıyor</b>. Görsel-AI için başlatılması gerekir.</div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="primary" onClick={startServer}><Power size={14} /> Ollama'yı başlat</Button>
            <Button size="sm" variant="subtle" onClick={refresh}><RotateCcw size={12} /> Tekrar kontrol et</Button>
          </div>
        </div>
      ) : phase === 'offline' ? (
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-danger/[0.07] px-3 py-2.5 ring-1 ring-danger/20">
          <CloudRainWind size={20} className="shrink-0 text-danger" />
          <div className="min-w-0 flex-1">
            <div className="text-body text-fg">Bağlantı yok</div>
            <div className="text-caption text-fg-subtle">İlk indirme için internet gerekir; sonra çevrimdışı.</div>
          </div>
          <Button size="sm" variant="subtle" onClick={download} disabled={!online}><RotateCcw size={12} /> Tekrar dene</Button>
        </div>
      ) : ( // need-model — Ollama çalışıyor, model eksik → GERÇEK indir
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="primary" onClick={download}><DownloadCloud size={14} /> Modeli indir</Button>
          {native && <Badge color="var(--color-ok)">Ollama çalışıyor ✓</Badge>}
          {!online && <span className="text-caption text-warn">çevrimdışı</span>}
        </div>
      )}

      <div className="mt-2 flex items-center gap-1.5 text-caption text-fg-faint">
        <Badge color={native ? 'var(--color-ok)' : 'var(--color-info)'}>{native ? 'yerel · Ollama · çevrimdışı çalışır' : 'önizleme · gerçek indirme .app\'te'}</Badge>
        {reduce && <span>· hareket azaltıldı</span>}
      </div>
    </SpineCard>
  )
}

/* ---------------- 3) MONTAJCI plugin entegrasyonu ---------------- */
// İndirme (Kur) ile DOĞRULAMA (Test et) ayrı: indirmek "kuruldu" demek değil. Kullanıcı çift-tıkla
// kurar, sonra "Test et"e basar → sistem GERÇEKTEN kurulu mu bakar (verifyPlugin) → dürüst ok/fail.
type InstStatus = 'idle' | 'installing' | 'downloaded' | 'testing' | 'fail'
function PluginSection({ idx, revealed }: { idx: number; revealed: boolean }) {
  const setup = useApp((s) => s.setup)
  const setSetup = useApp((s) => s.setSetup)
  const pushToast = useApp((s) => s.pushToast)
  const [status, setStatus] = useState<InstStatus>('idle')
  const [prog, setProg] = useState<InstallProgress | null>(null)
  const [test, setTest] = useState<InstallProgress | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const testAbortRef = useRef<AbortController | null>(null)
  const aliveRef = useRef(true)
  useEffect(() => () => { aliveRef.current = false; abortRef.current?.abort(); testAbortRef.current?.abort() }, [])
  const st = setup.plugin

  // KUR = yalnız indir (asla otomatik "kuruldu/doğrulandı" deme). Bitince 'ack' (indirildi · test bekliyor).
  const install = async () => {
    setStatus('installing'); setProg(null)
    const ac = new AbortController(); abortRef.current = ac
    const r = await installPlugin('autoreji-panel', (p) => { if (aliveRef.current) setProg(p) }, ac.signal)
    if (!aliveRef.current || ac.signal.aborted) return
    if (r.ok) { setStatus('downloaded'); setSetup({ plugin: 'ack' }); pushToast('MONTAJCI paketi indirildi · çift-tıkla kur, sonra "Test et"', { kind: 'amber', icon: 'check', ttl: 4800 }) }
    else { setStatus('idle'); pushToast('Model indirilemedi', { kind: 'danger', icon: 'alert', ttl: 6000, sub: "Bağlantı kopmuş ya da Ollama yanıt vermemiş olabilir. İnternetini kontrol edip tekrar dene — indirme kaldığı yerden sürer." }) }
  }

  // TEST ET = doğrulama animasyonu + GERÇEK tespit → dürüst sonuç.
  const runTest = async () => {
    setStatus('testing'); setTest(null)
    const ac = new AbortController(); testAbortRef.current = ac
    const found = await verifyPlugin((p) => { if (aliveRef.current) setTest(p) }, ac.signal)
    if (!aliveRef.current || ac.signal.aborted) return
    if (found) { setStatus('idle'); setSetup({ plugin: 'ok' }); pushToast('MONTAJCI doğrulandı · kurulu ✓', { kind: 'ok', icon: 'check' }) }
    else { setStatus('fail'); setSetup({ plugin: 'ack' }); pushToast("MONTAJCI bulunamadı — kur + Premiere'i yeniden başlat, sonra tekrar test et", { kind: 'amber', icon: 'alert', ttl: 5500 }) }
  }

  const remove = () => {
    openPluginManager() // Creative Cloud Desktop'ı aç (eklenti yönetimi) → kullanıcı AutoReji'yi elle kaldırır
    // State'i ERKEN SIFIRLAMA: kullanıcı CC'de kaldırmazsa yanlış "Kur" çıkıyordu. Gerçek durum
    // "tekrar test et" veya bir sonraki açılışta oto-tespitle güncellenir (homeDir izni → güvenilir).
    pushToast("Creative Cloud açıldı — eklentiler → AutoReji → Kaldır. Sonra 'tekrar test et' (ya da uygulamayı yeniden aç).", { kind: 'amber', icon: 'alert', ttl: 6500 })
  }

  const pluginBadge = st === 'ok'
    ? <Badge color="var(--color-ok)"><Check size={11} /> doğrulandı · test edildi</Badge>
    : st === 'ack'
      ? <Badge color="var(--color-amber-400)"><DownloadCloud size={11} /> indirildi · test bekliyor</Badge>
      : <Badge>bekliyor</Badge>

  // İndirildi/onaylı durumda: kurulum adımları + "Test et" (birincil).
  const InstallSteps = (
    <div className="space-y-2.5 rounded-xl bg-ink-900/50 p-3 ring-hair">
      <div className="flex items-center gap-2 text-body text-fg"><DownloadCloud size={14} className="text-amber-300" /> Paket indirildi — kur, sonra <b className="text-fg">Test et</b>:</div>
      <Steps items={[
        <>İndirilen <b className="text-fg-muted">{CCX_FILE}</b> dosyasına <b className="text-fg">çift-tıkla</b>.</>,
        'Creative Cloud Desktop açılır → "Install" (Marketplace dışı uyarısında da Install\'a bas).',
        <>Premiere → <b className="text-fg-muted">Window → UXP Plugins → AutoReji</b>'de görünür (Premiere açıksa yeniden başlat).</>,
        <>Aşağıdaki <b className="text-fg-muted">Test et</b>'e bas — sistem kurulu olduğunu doğrular.</>,
      ]} />
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button size="sm" variant="primary" onClick={runTest}><ShieldCheck size={14} /> Test et</Button>
        <Button size="sm" variant="subtle" onClick={install}><RotateCcw size={12} /> Tekrar indir</Button>
        <button onClick={remove} className="ml-auto text-caption text-fg-subtle transition-colors hover:text-danger">Kaldır</button>
      </div>
    </div>
  )

  return (
    <SpineCard idx={idx} revealed={revealed} color={ackColor(st)} icon={<PlugZap size={20} />} title="MONTAJCI panelini Premiere'e kur" badge={pluginBadge}>
      <p className="text-body leading-snug text-fg-subtle">Kurgu yapan paneli Premiere'e kur. <Badge color="var(--color-info)">tek dosya · çift tıkla kurulur · internet gerekmez</Badge></p>

      {status === 'installing' ? (
        <div className="mt-3 flex items-center gap-4">
          <ProgressRing value={prog?.pct ?? 0} size={84} stroke={5}>
            <span className="text-title font-semibold tabular leading-none text-gold">{Math.round((prog?.pct ?? 0) * 100)}<span className="text-micro">%</span></span>
          </ProgressRing>
          <div className="text-body text-fg">{prog?.phase ?? 'Hazırlanıyor…'}</div>
        </div>
      ) : status === 'testing' ? (
        <div className="mt-3 flex items-center gap-4">
          <ProgressRing value={test?.pct ?? 0} size={84} stroke={5}>
            <ShieldCheck size={22} className="text-gold" />
          </ProgressRing>
          <div className="min-w-0">
            <div className="text-body font-medium text-fg">Kurulum doğrulanıyor…</div>
            <div className="mt-0.5 text-label text-fg-subtle">{test?.phase ?? 'Taranıyor…'}</div>
          </div>
        </div>
      ) : status === 'fail' ? (
        <div className="mt-3 space-y-2.5">
          <div className="flex items-center gap-3 rounded-xl bg-danger/[0.07] px-3 py-2.5 ring-1 ring-danger/20">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger/15 text-danger"><X size={20} /></span>
            <div className="min-w-0 flex-1">
              <div className="text-body font-medium text-fg">MONTAJCI bulunamadı</div>
              <div className="text-label leading-snug text-fg-subtle">Paketi çift-tıkla kur, Premiere açıksa <b className="text-fg-muted">yeniden başlat</b>, sonra tekrar test et.</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="primary" onClick={runTest}><ShieldCheck size={14} /> Tekrar test et</Button>
            <Button size="sm" variant="subtle" onClick={install}><RotateCcw size={12} /> Yeniden indir</Button>
            <button onClick={remove} className="ml-auto text-caption text-fg-subtle transition-colors hover:text-danger">Kaldır</button>
          </div>
        </div>
      ) : st === 'ok' ? (
        <div className="mt-3 space-y-2.5">
          <div className="flex items-center gap-3">
            <ApprovedSeal kind="real" size={40} />
            <div className="text-body font-medium text-fg">MONTAJCI kurulu · test edildi ✓</div>
            <div className="ml-auto flex items-center gap-2 text-caption">
              <button onClick={runTest} className="text-fg-subtle transition-colors hover:text-fg-muted">tekrar test et</button>
              <span className="text-fg-faint/40">·</span>
              <button onClick={remove} className="text-fg-subtle transition-colors hover:text-danger">Kaldır</button>
            </div>
          </div>
          <p className="rounded-lg bg-ink-900/50 p-2.5 text-caption leading-snug text-fg-subtle ring-hair">
            <b className="text-fg-muted">Doğrulandı:</b> Premiere → <b className="text-fg-muted">Window → UXP Plugins → AutoReji</b>'de görünür. · <b className="text-fg-muted">Kaldır:</b> Creative Cloud Desktop → eklentiler → AutoReji → Kaldır.
          </p>
        </div>
      ) : st === 'ack' || status === 'downloaded' ? (
        <div className="mt-3">{InstallSteps}</div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="primary" onClick={install}><DownloadCloud size={14} /> MONTAJCI'yı İndir</Button>
          <Badge color="var(--color-info)">indir · çift-tıkla kur · test et</Badge>
        </div>
      )}
    </SpineCard>
  )
}
