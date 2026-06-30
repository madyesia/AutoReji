import { useEffect, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { FileText, FolderOpen, Film, Check, ArrowRight, CircleCheck, TriangleAlert, Circle, Sparkles, Upload, SlidersHorizontal, Hammer } from 'lucide-react'
import { RainCanvas } from '../components/RainCanvas'
import { Button, Badge, Tip } from '../components/ui'
import { SweepReveal } from '../components/motifs'
import { useApp } from '../lib/store'
import { tauriAvailable } from '../lib/native'
import { pickFile, pickFolder } from '../lib/tauri'
import { cn } from '../lib/utils'

interface Slot { key: string; title: string; hint: string; icon: ReactNode; required: boolean; sample: string }
const SLOTS: Slot[] = [
  { key: 'img', title: 'Görsel Prompt Belgesi', hint: 'Kararın omurgası · her sahne için bir prompt', icon: <FileText size={20} />, required: true, sample: '(2.Bölüm) Glass Dome Treehouse in Heavy Rain Image Prompt.txt' },
  { key: 'vid', title: 'Video Klasörü', hint: '8 sn klipler · stereo · numaralı', icon: <FolderOpen size={20} />, required: true, sample: '2. bölüm video — 160 klip' },
  { key: 'vprompt', title: 'Video Prompt Belgesi', hint: 'Opsiyonel · kamera / hareket sinyali', icon: <Film size={20} />, required: false, sample: '55-rainyboat_video.md' },
]

const ONBOARD = [
  { n: 1, icon: <Upload size={16} />, title: 'Ver', desc: 'Görsel prompt belgesi + video klasörünü seç. Video prompt belgesi opsiyonel.' },
  { n: 2, icon: <SlidersHorizontal size={16} />, title: 'İncele', desc: 'AutoReji ~160 klibi analiz eder; geçiş ve kırpmaları kurar. Film şeridinde gözden geçir, dilediğini değiştir.' },
  { n: 3, icon: <Hammer size={16} />, title: 'Kur', desc: "Premiere'de tek tık: native stereo, düzenlenebilir klipler — render YOK." },
]

const VAL_ROWS = [
  { warn: false, label: '160 görsel prompt ↔ 160 sahne eşleşti', detail: 'kayma yok · sıralı' },
  { warn: false, label: 'Çift çekim varyantları çözüldü', detail: 'çoklu çekimde 1080p tercih edildi' },
  { warn: true, label: 'Çözünürlük: 159 × 1080p · 1 × 720p', detail: 'sahne 115 işaretlendi (ffprobe)' },
  { warn: false, label: 'Eksik / fazla sahne yok', detail: 'numara bütünlüğü tam' },
]

export function IntakeScreen() {
  const setScreen = useApp((s) => s.setScreen)
  const setIntake = useApp((s) => s.setIntake)
  const [filled, setFilled] = useState<Record<string, boolean>>({})
  const [paths, setPaths] = useState<Record<string, string>>({})       // .app'te seçilen GERÇEK yollar
  const [name, setName] = useState(() => (tauriAvailable() ? '' : 'Bölüm 2 · Glass Dome Treehouse in Heavy Rain'))
  const ready = filled.img && filled.vid
  const realPicked = tauriAvailable() && !!paths.img && !!paths.vid  // .app'te gerçek dosya seçildi mi (sahte doğrulama gösterme)
  const reduce = useReducedMotion()
  const [frontier, setFrontier] = useState(reduce ? 1 : 0)
  useEffect(() => { if (ready && !reduce) setFrontier(0) }, [ready, reduce])

  const fill = (k: string) => setFilled((f) => ({ ...f, [k]: !f[k] }))
  const fillAll = () => setFilled({ img: true, vid: true, vprompt: true })
  const baseName = (p: string) => p.split('/').pop() || p

  // .app içinde (Tauri): GERÇEK dosya/klasör seçici. Tarayıcıda: örnek toggle (mock).
  const onSlot = async (k: string) => {
    if (!tauriAvailable()) { fill(k); return }
    const picked = k === 'vid'
      ? await pickFolder()
      : await pickFile(k === 'img' ? [{ name: 'Görsel Prompt', extensions: ['txt'] }] : [{ name: 'Video Prompt', extensions: ['md', 'txt'] }])
    if (!picked) return
    setPaths((p) => ({ ...p, [k]: picked }))
    setFilled((f) => ({ ...f, [k]: true }))
    if (k === 'img') { const b = baseName(picked).replace(/\.txt$/i, '').trim(); if (b) setName(b) }
  }
  const startAnalysis = () => {
    if (tauriAvailable() && paths.img && paths.vid) setIntake({ promptPath: paths.img, videoFolder: paths.vid, videoPrompt: paths.vprompt ?? null, name })
    else setIntake(null) // örnek/mock akışı
    setScreen('analysis')
  }

  return (
    <div className="relative h-full overflow-y-auto">
      <RainCanvas intensity={0.7} className="opacity-60" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-amber-500/[0.04] to-transparent" />

      <div className="relative mx-auto flex min-h-full max-w-5xl flex-col px-8 py-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          <div className="flex items-center gap-2 text-[13px] text-fg-subtle">
            <Sparkles size={14} className="text-amber-400" /> Yeni bölüm · cozy yağmur ASMR
          </div>
          <h1 className="mt-2 text-[34px] font-semibold leading-tight">Bir bölüm kuralım</h1>
          <p className="mt-1.5 max-w-xl text-[15px] text-fg-muted">
            Görsel promptları ve video klasörünü ver; AutoReji kurguyu native stereo, düzenlenebilir ve render'sız hazırlasın.
          </p>
        </motion.div>

        {/* Giriş alanları */}
        <div className="mt-9 grid grid-cols-1 gap-3.5 md:grid-cols-3">
          {SLOTS.map((s, i) => {
            const on = !!filled[s.key]
            return (
              <motion.button
                key={s.key}
                onClick={() => onSlot(s.key)}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  'group relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl p-5 text-left transition-all duration-200',
                  on ? 'bg-ink-800 ring-1 ring-amber-400/40 shadow-[var(--shadow-raised)]' : 'glass hover:bg-white/[0.05]',
                  !on && 'hover:dropring',
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <span className={cn('flex h-11 w-11 items-center justify-center rounded-xl transition-colors', on ? 'bg-amber-400/15 text-amber-300' : 'bg-white/5 text-fg-muted group-hover:text-fg')}>
                    {on ? <Check size={20} /> : s.icon}
                  </span>
                  {s.required ? <Badge color="var(--color-amber-400)">zorunlu</Badge> : <Badge>opsiyonel</Badge>}
                </div>
                <div>
                  <div className="text-[15px] font-medium">{s.title}</div>
                  <div className="mt-0.5 text-[12.5px] leading-snug text-fg-subtle">{s.hint}</div>
                </div>
                <div className={cn('mt-1 w-full truncate rounded-lg px-2.5 py-1.5 text-[12px] tabular transition-colors',
                  on ? 'bg-ink-900/80 text-amber-200/90' : 'bg-white/[0.03] text-fg-faint')}>
                  {on ? (paths[s.key] ? baseName(paths[s.key]) : s.sample) : (tauriAvailable() ? 'Seçmek için tıkla' : 'Sürükle-bırak veya tıkla')}
                </div>
              </motion.button>
            )
          })}
        </div>

        {ready ? (
          /* Girdiler hazır — anında doğrulama + bölüm adı */
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="relative mt-9 overflow-hidden rounded-2xl glass p-5">
            <SweepReveal active onProgress={setFrontier} />
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-fg-subtle">{realPicked ? 'Girdiler hazır' : 'Anında doğrulama'}</span>
              <Badge color="var(--color-ok)"><CircleCheck size={12} /> {realPicked ? 'seçildi' : 'hazır'}</Badge>
            </div>
            {realPicked ? (
              <div className="mt-4 flex items-start gap-2.5 text-[13px] text-fg-muted">
                <CircleCheck size={15} className="mt-0.5 shrink-0 text-ok" />
                <span>Gerçek girdiler seçildi. <b className="text-fg">Eşleşme, çözünürlük ve varyantlar</b> analiz adımında her klipten çıkarılır (ffprobe + prompt eşleştirme) — sonuç İnceleme'de görünür.</span>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                {VAL_ROWS.map((r, i) => <ValRow key={i} warn={r.warn} label={r.label} detail={r.detail} passed={frontier >= (i + 0.5) / VAL_ROWS.length} />)}
              </div>
            )}
            <div className="mt-5 flex flex-col gap-1.5 hairline-t pt-4">
              <label className="text-[11px] font-medium uppercase tracking-[0.14em] text-fg-subtle">Bölüm adı</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="w-full max-w-md rounded-lg bg-ink-900/70 px-3 py-2 text-[14px] text-fg ring-hair outline-none focus:ring-1 focus:ring-amber-400/50 select-text" />
              <span className="text-[11px] text-fg-faint">Prompt belgesinin adından türetildi · çıktı ve arşiv bu adı kullanır</span>
            </div>
          </motion.div>
        ) : (
          /* Boş durum — "nasıl çalışır" 3 adım + örnek dene */
          <div className="mt-9">
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-fg-subtle">Nasıl çalışır</span>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              {ONBOARD.map((st, i) => (
                <motion.div key={st.n}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col gap-2.5 rounded-2xl glass p-5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/15 text-[13px] font-bold tabular text-amber-300">{st.n}</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-fg-muted">{st.icon}</span>
                  </div>
                  <div className="text-[15px] font-medium">{st.title}</div>
                  <div className="text-[12.5px] leading-snug text-fg-subtle">{st.desc}</div>
                </motion.div>
              ))}
            </div>
            {!tauriAvailable() && (
              <p className="mt-5 text-[13px] text-fg-subtle">
                Hemen denemek için <button onClick={fillAll} className="font-medium text-amber-400 hover:text-amber-300 transition-colors">örnek bölümü yükle</button> → gerçek Bölüm 2 verisiyle tüm akışı gör.
              </p>
            )}
          </div>
        )}

        <div className="flex-1" />
        <div className="mt-8 flex items-center justify-between">
          <span className="text-[12px] text-fg-subtle">{ready ? 'Her şey hazır görünüyor.' : 'Zorunlu girdileri bekliyorum…'}</span>
          <Tip label={ready ? 'Analiz + karar motorunu çalıştır' : 'Önce zorunlu girdiler'}>
            <span>
              <Button variant={ready ? 'primary' : 'outline'} size="lg" disabled={!ready} onClick={startAnalysis}>
                Analizi Başlat <ArrowRight size={18} />
              </Button>
            </span>
          </Tip>
        </div>
      </div>
    </div>
  )
}

function ValRow({ warn, label, detail, passed }: { warn?: boolean; label: string; detail: string; passed: boolean }) {
  const color = warn ? 'var(--color-warn)' : 'var(--color-ok)'
  return (
    <div className="flex items-start gap-2.5" style={{ opacity: passed ? 1 : 0.4, filter: passed ? 'none' : 'blur(1.3px)', transition: 'opacity .3s ease, filter .3s ease' }}>
      <span className="mt-0.5 shrink-0" style={{ color: passed ? color : 'var(--color-fg-faint)' }}>
        {!passed ? <Circle size={15} /> : warn ? <TriangleAlert size={15} /> : <CircleCheck size={15} />}
      </span>
      <div className="min-w-0">
        <div className="text-[13.5px] leading-snug text-fg">{label}</div>
        <div className="text-[12px] text-fg-subtle">{detail}</div>
      </div>
    </div>
  )
}
