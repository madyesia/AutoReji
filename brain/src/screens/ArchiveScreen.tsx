import { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Library, RotateCcw, FolderSearch, Clapperboard, Film, Check, Trash2 } from 'lucide-react'
import { RainCanvas } from '../components/RainCanvas'
import { useApp } from '../lib/store'
import { readArchive, removeArchiveEntry, writeArchiveEntry } from '../lib/archive'
import { revealInFinder } from '../lib/native'
import { thumbUrl, spriteUrl, SPRITE_FRAMES } from '../lib/data'
import { REGIME, TRANSITION, fmtClock, cn } from '../lib/utils'
import type { ArchiveEntry, Regime } from '../lib/types'
import { Segmented, Button, Tip, SectionLabel } from '../components/ui'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { prettyEpisode } from '../components/AppShell'

type Density = 'gallery' | 'list'
type Group = 'today' | 'week' | 'older'
const GROUP_LABEL: Record<Group, string> = { today: 'Bugün', week: 'Bu hafta', older: 'Daha eski' }

function groupOf(iso: string): Group {
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return 'older'
  const startToday = new Date(); startToday.setHours(0, 0, 0, 0)
  if (t >= startToday.getTime()) return 'today'
  if (Date.now() - t < 7 * 24 * 3600 * 1000) return 'week'
  return 'older'
}
const fmtWhen = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function ArchiveScreen() {
  const setScreen = useApp((s) => s.setScreen)
  const reopen = useApp((s) => s.reopenArchived)
  const pushToast = useApp((s) => s.pushToast)
  const activeManifest = useApp((s) => s.manifest)
  const hasEdits = useApp((s) => s.past.length > 0)
  const [density, setDensity] = useState<Density>('gallery')
  const [entries, setEntries] = useState<ArchiveEntry[]>(() => readArchive())
  const [confirmDel, setConfirmDel] = useState<ArchiveEntry | null>(null)      // A4: silme onayı
  const [confirmOpen, setConfirmOpen] = useState<ArchiveEntry | null>(null)    // A3: üzerine-açma onayı

  // A3: aktif bölümde elle düzenleme varken arşivden açmak onları kaybettirir → sor
  const handleReopen = (e: ArchiveEntry) => {
    if (activeManifest && hasEdits) setConfirmOpen(e)
    else void reopen(e)
  }

  // Faz 4: kaydedilen manifest klasörünü Finder'da aç (Tauri). Tarayıcıda yol yoksa pano fallback.
  const handleReveal = async (e: ArchiveEntry) => {
    if (!e.savedPath) return
    const r = await revealInFinder(e.savedPath)
    if (r.ok && !r.native) pushToast("Yol panoya kopyalandı — Finder'da yapıştır", { kind: 'ok', icon: 'copy' })
  }
  // Arşivden sil + "geri al" toast (yanlışlıkla silmeye karşı).
  const handleDelete = (e: ArchiveEntry) => {
    removeArchiveEntry(e.seed)
    setEntries((list) => list.filter((x) => x.seed !== e.seed))
    pushToast('Arşivden silindi', {
      kind: 'danger', icon: 'undo', ttl: 6000,
      action: { label: 'Geri al', run: () => { writeArchiveEntry(e); setEntries(readArchive()) } },
    })
  }

  const groups = useMemo(() => {
    const g: Record<Group, ArchiveEntry[]> = { today: [], week: [], older: [] }
    for (const e of entries) g[groupOf(e.createdAt)].push(e)
    return (['today', 'week', 'older'] as Group[]).filter((k) => g[k].length).map((k) => ({ k, items: g[k] }))
  }, [entries])

  return (
    <div className="relative h-full overflow-y-auto">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-amber-500/[0.05] to-transparent" />
      <div className="relative mx-auto max-w-5xl px-8 py-10">
        <button onClick={() => setScreen('intake')} className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-fg-muted transition-colors hover:text-fg">
          <Clapperboard size={15} /> Giriş'e dön
        </button>

        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2.5 text-[30px] font-semibold"><Library size={26} className="text-amber-400" /> Arşiv</h1>
            <p className="mt-1 text-[14px] text-fg-muted">{entries.length ? `${entries.length} kurulan bölüm` : 'Kurulan bölümler burada birikir'}</p>
          </div>
          {entries.length > 0 && (
            <Segmented<Density>
              options={[{ value: 'gallery', label: 'Galeri' }, { value: 'list', label: 'Liste' }]}
              value={density} onChange={setDensity}
            />
          )}
        </div>

        {entries.length === 0 ? (
          <EmptyState onStart={() => setScreen('intake')} />
        ) : (
          <div className="mt-8 space-y-9">
            {groups.map(({ k, items }) => (
              <section key={k}>
                <SectionLabel>{GROUP_LABEL[k]}</SectionLabel>
                <div className={cn('mt-3', density === 'gallery' ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-2.5')}>
                  {items.map((e, i) => (
                    <ArchiveCard key={e.seed + e.createdAt} e={e} i={i} density={density} onReopen={() => handleReopen(e)} onReveal={() => handleReveal(e)} onDelete={() => setConfirmDel(e)} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* A4: arşiv silme onayı (silme sonrası undo toast'ı da duruyor) */}
      <ConfirmDialog open={confirmDel != null} onOpenChange={(o) => !o && setConfirmDel(null)} danger
        title="Arşiv kaydını sil?"
        desc={confirmDel ? `"${prettyEpisode(confirmDel.name)}" arşiv listesinden kaldırılır. Diskteki manifest/videolara dokunulmaz; yine de kısa süre "Geri al" ile dönebilirsin.` : ''}
        confirmLabel="Sil"
        onConfirm={() => { if (confirmDel) handleDelete(confirmDel) }} />

      {/* A3: aktif düzenlemenin üstüne açma onayı */}
      <ConfirmDialog open={confirmOpen != null} onOpenChange={(o) => !o && setConfirmOpen(null)}
        title="Mevcut düzenlemenin üzerine açılsın mı?"
        desc={confirmOpen ? `Şu an açık bölümde elle değişikliklerin var. "${prettyEpisode(confirmOpen.name)}" açılırsa bu değişiklikler kaybolur.` : ''}
        confirmLabel="Yine de aç"
        onConfirm={() => { if (confirmOpen) void reopen(confirmOpen) }} />
    </div>
  )
}

function RegimeStrip({ regimes }: { regimes: ArchiveEntry['regimes'] }) {
  const order: Regime[] = ['exterior', 'interior', 'sleeping']
  const total = order.reduce((a, k) => a + regimes[k], 0) || 1
  return (
    <div className="flex h-1.5 overflow-hidden rounded-full ring-hair">
      {order.map((k) => regimes[k] > 0 && (
        <span key={k} title={`${REGIME[k].label} · ${regimes[k]}`} style={{ width: `${(regimes[k] / total) * 100}%`, background: REGIME[k].color }} />
      ))}
    </div>
  )
}

function TxDots({ e }: { e: ArchiveEntry }) {
  const rows: [string, number, string][] = [
    ['cut', e.cuts, TRANSITION.cut.color],
    ['fade', e.fades, TRANSITION.fade.color],
    ['black', e.blacks, TRANSITION.black.color],
  ]
  return (
    <div className="flex items-center gap-2.5 text-[11px] tabular text-fg-subtle">
      {rows.map(([k, n, c]) => (
        <span key={k} className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: c, boxShadow: `0 0 6px -1px ${c}` }} /> {n}
        </span>
      ))}
    </div>
  )
}

function ArchiveCard({ e, i, density, onReopen, onReveal, onDelete }: { e: ArchiveEntry; i: number; density: Density; onReopen: () => void; onReveal: () => void; onDelete: () => void }) {
  const motionPreview = useApp((s) => s.motionPreview)
  const reduce = useReducedMotion()
  const [frame, setFrame] = useState(-1)
  const r = REGIME[e.dominantRegime]
  const cover = e.coverScene != null ? thumbUrl(e.coverScene) : null

  const Cover = (
    <div
      className={cn('group/cover relative shrink-0 overflow-hidden bg-ink-900', density === 'gallery' ? 'aspect-video w-full rounded-t-2xl' : 'aspect-video w-36 rounded-l-2xl')}
      style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${r.color} 24%, #0b0e14), #0b0e14)` }}
      onMouseMove={(ev) => {
        if (!motionPreview || e.coverScene == null) return
        const rect = ev.currentTarget.getBoundingClientRect()
        const f = Math.max(0, Math.min(SPRITE_FRAMES - 1, Math.floor(((ev.clientX - rect.left) / rect.width) * SPRITE_FRAMES)))
        setFrame((p) => (p === f ? p : f))
      }}
      onMouseLeave={() => setFrame(-1)}
    >
      {cover && <img src={cover} loading="lazy" decoding="async" alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover/cover:scale-105" onError={(ev) => (ev.currentTarget.style.opacity = '0')} />}
      {frame >= 0 && e.coverScene != null && (
        <div aria-hidden className="absolute inset-0" style={{ backgroundImage: `url(${spriteUrl(e.coverScene)})`, backgroundSize: `${SPRITE_FRAMES * 100}% 100%`, backgroundPosition: `${(frame / (SPRITE_FRAMES - 1)) * 100}% 50%` }} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/0 to-black/20" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
        style={{ background: `linear-gradient(to top, color-mix(in srgb, ${r.color} 40%, transparent), transparent)` }} />
      <span className="absolute left-2 top-2 flex h-5 items-center rounded-md bg-black/55 px-1.5 text-[10.5px] tabular text-white/90 backdrop-blur-sm">{fmtWhen(e.createdAt)}</span>
      {e.savedAt && (
        <span className="absolute right-2 top-2 flex h-5 items-center gap-1 rounded-md bg-ok/85 px-1.5 text-[10px] font-semibold text-black/85 backdrop-blur-sm" title={`Manifest kaydedildi${e.savedName ? ` · ${e.savedName}` : ''}`}><Check size={11} /> kaydedildi</span>
      )}
      <span className="absolute bottom-2 left-2 flex h-5 items-center rounded-md bg-black/55 px-1.5 text-[10.5px] font-medium tabular text-white/90 backdrop-blur-sm">{e.clips} klip · {fmtClock(e.durationSec)}</span>
    </div>
  )

  const Info = (
    <div className="flex min-w-0 flex-1 flex-col gap-2 p-3.5">
      <div className="min-w-0">
        <div className="truncate text-[14px] font-semibold" title={prettyEpisode(e.name)}>{prettyEpisode(e.name)}</div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-fg-subtle">
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ background: r.color }} />{r.label}</span>
          <span className="truncate">seed {e.seed.slice(0, 14)}…</span>
        </div>
      </div>
      <RegimeStrip regimes={e.regimes} />
      <div className={cn('mt-auto pt-1', density === 'gallery' ? 'flex flex-col items-stretch gap-2' : 'flex items-center justify-between gap-2')}>
        <TxDots e={e} />
        <div className={cn('flex items-center gap-1.5', density === 'gallery' && 'justify-end')}>
          <Tip label={e.savedPath ? "Manifest konumunu Finder'da aç" : 'Önce Kur ekranında manifesti kaydet'}>
            <span><Button size="sm" variant="outline" disabled={!e.savedPath} onClick={e.savedPath ? onReveal : undefined}><FolderSearch size={13} /></Button></span>
          </Tip>
          <Tip label="Arşivden sil">
            <span><Button size="sm" variant="outline" className="hover:text-danger hover:ring-danger/40" onClick={onDelete}><Trash2 size={13} /></Button></span>
          </Tip>
          <Button size="sm" variant="primary" className="whitespace-nowrap" onClick={onReopen}><RotateCcw size={13} /> Yeniden aç</Button>
        </div>
      </div>
    </div>
  )

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1], delay: reduce ? 0 : Math.min(i * 0.045, 0.4) }}
      className={cn('group glass overflow-hidden rounded-2xl ring-1 ring-white/10 transition-all duration-[var(--dur-base)] ease-[var(--ease-out-quart)] hover:-translate-y-1.5 hover:shadow-[var(--shadow-pop)] hover:ring-white/20',
        density === 'list' && 'flex items-stretch')}
    >
      {Cover}
      {Info}
    </motion.div>
  )
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="relative mt-6 flex min-h-[52vh] flex-col items-center justify-center overflow-hidden rounded-3xl glass">
      <RainCanvas intensity={0.7} />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/[0.06] blur-3xl" />
      <div className="relative flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/12 text-amber-300 animate-[breathe_4.5s_var(--ease-out-quart)_infinite]">
          <Film size={30} />
        </div>
        <h2 className="mt-5 text-[20px] font-semibold">Henüz arşiv yok</h2>
        <p className="mt-1.5 max-w-sm text-[13.5px] text-fg-muted">Bir bölümü Premiere'de kurduğunda burada sinematik bir kart olarak birikir — tek tıkla yeniden açarsın.</p>
        <Button variant="primary" size="lg" className="mt-6" onClick={onStart}><Clapperboard size={17} /> İlk bölümünü kur</Button>
      </div>
    </div>
  )
}
