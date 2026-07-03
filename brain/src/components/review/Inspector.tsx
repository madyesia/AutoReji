import { useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Eye, RotateCcw, Trash2, Undo, Scissors, Sparkle, ShieldCheck, ShieldAlert } from 'lucide-react'
import { useApp } from '../../lib/store'
import { riskColor } from '../../lib/data'
import { REGIME, TRANSITION, getTransition, fmtDur, scaleLabel, confColor, basename } from '../../lib/utils'
import type { Clip, TransitionType } from '../../lib/types'
import { Segmented, Slider, Badge, Button, SectionLabel, Tip } from '../ui'
import { PreviewModal } from './PreviewModal'
import { InspectorPreview } from './InspectorPreview'
import { EASE } from '../../lib/motion'

const ROLE_TR: Record<string, string> = {
  establishing: 'kuruluş', scenery: 'manzara', detail: 'detay',
  character: 'karakter', action: 'aksiyon', transition: 'geçiş',
}
const MOOD_TR: Record<string, string> = {
  cozy: 'huzurlu', calm: 'sakin', melancholic: 'hüzünlü',
  tense: 'gergin', dramatic: 'dramatik', peaceful: 'dingin',
}

export function Inspector() {
  const clips = useApp((s) => s.clips)
  const selected = useApp((s) => s.selected)
  const hovered = useApp((s) => s.hovered)
  const playScene = useApp((s) => s.playScene)
  const manifest = useApp((s) => s.manifest)
  // Üst önizlemeyle SENKRON: oynatımda playScene; değilse film şeridinde üzerine gelinen (hover)
  // klip tıklamadan önizlenir, hover yoksa seçili (kilitli) klip gösterilir → preview-on-hover, commit-on-click.
  const isPreview = playScene == null && hovered != null && hovered !== selected
  const c = clips.find((x) => x.scene === (playScene ?? hovered ?? selected))
  const [preview, setPreview] = useState(false)

  if (!c) return (
    <aside className="flex w-[360px] shrink-0 items-center justify-center glass hairline-l">
      <p className="text-body leading-snug text-fg-subtle">Henüz klip seçilmedi. Film şeridinden bir klibe tıkla — kararı, geçişi ve kırpması burada açılır.</p>
    </aside>
  )

  const idx = clips.findIndex((x) => x.scene === c.scene)
  const isFirst = idx === 0
  const r = REGIME[c.meta.regime]

  return (
    <aside className="flex w-[360px] shrink-0 flex-col glass hairline-l">
      {/* başlık + önizleme */}
      <div className="shrink-0 p-4 hairline-b">
        <div className="flex gap-3">
          <InspectorPreview key={c.scene} clip={c} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-lead font-semibold">Sahne {c.scene}</span>
              <Badge color={r.color}>{r.label}</Badge>
              {isPreview && <Badge color="var(--color-amber-400)"><Eye size={10} /> önizleme</Badge>}
              {!c.enabled && <Badge color="var(--color-danger)">çıkarıldı</Badge>}
            </div>
            <div className="mt-0.5 truncate text-caption text-fg-subtle" title={basename(c.file)}>{basename(c.file)}</div>
            <div className="mt-1.5 flex gap-1.5">
              <Tip label="Geçişi uygulamada önizle (stereo)"><Button size="sm" variant="subtle" onClick={() => setPreview(true)}><Eye size={13} /> Önizle</Button></Tip>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
        {/* KALİTE KONTROL (QC) */}
        {c.qc && (c.qc.risk > 0 ? (
          <div className="rounded-xl p-3 ring-1" style={{ background: `color-mix(in srgb, ${riskColor(c.qc.level)} 10%, transparent)`, borderColor: `color-mix(in srgb, ${riskColor(c.qc.level)} 35%, transparent)` }}>
            <div className="flex items-center gap-1.5" style={{ color: riskColor(c.qc.level) }}>
              <ShieldAlert size={14} /><span className="text-caption font-semibold uppercase tracking-wider">Kalite riski · {c.qc.risk}/100</span>
            </div>
            <ul className="mt-1.5 space-y-1">
              {c.qc.issues.map((x, k) => <li key={k} className="flex gap-1.5 text-body text-fg"><span style={{ color: riskColor(c.qc!.level) }}>•</span>{x.d}</li>)}
            </ul>
            <p className="mt-2 text-caption text-fg-subtle">İncele; sorunluysa aşağıdan <b className="text-fg">Klibi çıkar</b> ile atla.</p>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-label text-ok"><ShieldCheck size={14} /> Kalite kontrol: kare-kare tarandı, sorun yok</div>
        ))}

        {/* GEÇİŞ */}
        <Section icon={<Sparkle size={13} />} title={isFirst ? 'Açılış' : 'Geçiş — bu klibe giriş'}>
          {isFirst ? (
            (manifest?.intro?.fade_in_from_black ?? 0) > 0 ? (
              <p className="text-body text-fg-muted">Bölüm açılışı: <span className="text-fg">siyahtan fade-in {fmtDur(manifest?.intro?.fade_in_from_black ?? 0)}</span> — kanal imzası.</p>
            ) : (
              <p className="text-body text-fg-muted">Bölüm açılışı: <span className="text-fg">düz başlangıç</span> — siyah fade kapalı (kanal tercihi).</p>
            )
          ) : (
            <TransitionEditor clip={c} />
          )}
        </Section>

        {/* KIRPMA */}
        <Section icon={<Scissors size={13} />} title="Kırpma & tutamak">
          <TrimEditor clip={c} />
        </Section>

        {/* KARAR */}
        <Section title="Karar — neden böyle?">
          <p className="text-body leading-snug text-fg">{c.decision.reason}</p>
          <div className="mt-2.5">
            <div className="mb-1 flex items-center justify-between text-caption text-fg-subtle">
              <span>Güven</span><span className="tabular" style={{ color: confColor(c.decision.confidence) }}>{Math.round(c.decision.confidence * 100)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
              <div className="h-full rounded-full" style={{ width: `${c.decision.confidence * 100}%`, background: confColor(c.decision.confidence) }} />
            </div>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {c.decision.signals.regime_change && <Badge color="var(--color-info)">{c.decision.signals.regime_change}</Badge>}
            {c.decision.signals.prompt_sim_prev != null && <Badge>benzerlik %{Math.round(c.decision.signals.prompt_sim_prev * 100)}</Badge>}
            {c.decision.signals.action && <Badge color="var(--color-ext)">hareket sahnesi</Badge>}
            {c.decision.signals.environment && <Badge color="var(--color-int)">ortam sahnesi</Badge>}
            {c.decision.signals.motion != null && <Badge color="var(--color-ext)">hareket {c.decision.signals.motion}</Badge>}
            {!!c.decision.signals.visual_contrast && <Badge color="var(--color-amber-400)">görsel sıçrama {c.decision.signals.visual_contrast}</Badge>}
          </div>
        </Section>

        {/* GÖRSEL-AI + DERİN ANALİZ */}
        {c.analysis && (
          <Section icon={<Sparkle size={13} />} title="Sahne analizi · görsel-AI">
            {c.analysis.energy != null && <Row label="Enerji" value={`${c.analysis.energy}/5 · ${c.analysis.energy <= 2 ? 'sakin' : c.analysis.energy >= 4 ? 'hareketli' : 'orta'}`} />}
            {c.analysis.role && <Row label="Tür" value={ROLE_TR[c.analysis.role] ?? c.analysis.role} />}
            {/* TUR 4: mood eskiden HİÇBİR yerde görünmüyordu — sapmalar (huzurlu dışı) tam bakılması gereken klipler */}
            {c.analysis.mood && <Row label="Hava" value={MOOD_TR[c.analysis.mood] ?? c.analysis.mood} />}
            {c.analysis.linger && <Row label="Ritim" value="oyalanma anı → uzun tutuş" />}
            <Row label="Hareket" value={c.analysis.motion ?? '—'} />
            <Row label="Parlaklık" value={c.analysis.brightness ?? '—'} />
            <p className="mt-1 text-caption text-fg-subtle">Yerel görsel-AI sahneyi gördü → süre + geçiş buna göre ayarlandı.</p>
          </Section>
        )}

        {/* SES — ASMR ürününde tamamen görünmezdi; native stereo hard-constraint'ini UI'da kanıtlar (TUR 4) */}
        {c.audio && (
          <Section title="Ses">
            <Row label="Mikro-geçiş" value={c.audio.micro_crossfade > 0 ? `${Math.round(c.audio.micro_crossfade * 1000)}ms yumuşatma` : 'yok'} />
            <Row label="Stereo" value={c.audio.mask_stereo_shift ? 'düzeltme uygulandı' : 'native (sol-sağ korunur)'} />
          </Section>
        )}

        {/* PROMPT META */}
        <Section title="Prompt referansı">
          <Row label="Ölçek" value={scaleLabel(c.meta.scale)} />
          <Row label="Rejim" value={<span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: r.color }} />{r.label} · {c.meta.state}</span>} />
          <Row label="Özneler" value={c.meta.subjects.length ? c.meta.subjects.join(', ') : 'karaktersiz'} />
          {c.meta.color && <Row label="Renk" value={c.meta.color} />}
        </Section>

        {/* VARYANT */}
        <Section title="Çekim seçimi">
          <Row label="Seçilen" value={c.variant.chosen ? basename(c.variant.chosen) : '—'} />
          <Row label="Aday" value={`${c.variant.candidates.length} çekim`} />
          <p className="mt-1 text-label text-fg-subtle">{c.variant.reason}</p>
        </Section>
      </div>

      {/* alt eylemler */}
      <div className="flex shrink-0 items-center gap-2 p-3 hairline-t">
        <ResetButton scene={c.scene} overridden={c.decision.user_overridden} />
        <div className="flex-1" />
        <EnableButton clip={c} />
      </div>

      {preview && <PreviewModal clip={c} prev={idx > 0 ? clips[idx - 1] : null} onClose={() => setPreview(false)} />}
    </aside>
  )
}

function TransitionEditor({ clip: c }: { clip: Clip }) {
  const setType = useApp((s) => s.setTransitionType)
  const setDur = useApp((s) => s.setTransitionDur)
  const t = getTransition(c)
  const opts: { value: TransitionType; label: ReactNode }[] = [
    { value: 'cut', label: 'Cut' }, { value: 'fade', label: 'Fade' }, { value: 'black', label: 'Black' },
  ]
  // TUR 4: algo_default hayalet çipi — AI'ın ÖNERDİĞİ geçiş. Elle değiştirilince neye kıyasla
  // değiştiğin görünür + tek tıkla geri dön. (algo_default: cut ise Transition null olabilir.)
  const algo = c.decision.algo_default
  const algoType: TransitionType = algo?.type ?? 'cut'
  const differs = c.decision.user_overridden && algoType !== t
  return (
    <div className="space-y-3">
      <Segmented options={opts} value={t} onChange={(v) => setType(c.scene, v)} className="w-full [&>button]:flex-1" />
      {differs && (
        <button onClick={() => setType(c.scene, algoType)}
          className="flex w-full items-center gap-1.5 rounded-lg bg-white/[0.03] px-2.5 py-1.5 text-caption text-fg-subtle ring-hair transition-colors hover:text-fg-muted">
          <Sparkle size={11} className="text-amber-400/70" />
          AutoReji önerisi: <b className="font-medium" style={{ color: TRANSITION[algoType].color }}>{TRANSITION[algoType].label}{algoType !== 'cut' && algo ? ` ${fmtDur(algo.dur)}` : ''}</b>
          <span className="ml-auto text-fg-faint">← dön</span>
        </button>
      )}
      {t !== 'cut' && c.transition_in && (
        <div>
          <div className="mb-1.5 flex items-center justify-between text-label">
            <span className="text-fg-muted">Süre</span>
            <span className="tabular font-medium" style={{ color: TRANSITION[t].color }}>{fmtDur(c.transition_in.dur)}</span>
          </div>
          <Slider value={c.transition_in.dur} min={0.25} max={2.5} step={1 / 24} accent={TRANSITION[t].color} onValueChange={(v) => setDur(c.scene, v)} />
          <div className="mt-1.5 flex justify-between text-caption text-fg-subtle tabular">
            <span>0.25s</span>
            {c.transition_in.handle != null && <span>tutamak payı {fmtDur(c.transition_in.handle)} ✓</span>}
            <span>2.5s</span>
          </div>
        </div>
      )}
    </div>
  )
}

function TrimEditor({ clip: c }: { clip: Clip }) {
  const setTrim = useApp((s) => s.setTrim)
  const dur = c.out - c.in
  const headH = c.in, tailH = c.source_dur - c.out
  const pct = (v: number) => `${(v / c.source_dur) * 100}%`
  return (
    <div>
      {/* görsel tutamak şeridi */}
      <div className="relative mb-3 h-8 overflow-hidden rounded-lg bg-ink-900/70 ring-hair">
        <div className="absolute inset-y-0 left-0 bg-white/[0.03]" style={{ width: pct(c.in) }} />
        <div className="absolute inset-y-0 right-0 bg-white/[0.03]" style={{ width: pct(c.source_dur - c.out) }} />
        <div className="absolute inset-y-0 bg-gradient-to-r from-amber-400/30 to-amber-500/30 ring-1 ring-amber-400/40"
          style={{ left: pct(c.in), width: pct(dur) }}>
          <span className="absolute inset-0 flex items-center justify-center text-micro font-medium tabular text-amber-200">{fmtDur(dur)}</span>
        </div>
      </div>
      <div className="space-y-2.5">
        <SliderRow label="Baş" value={c.in} min={0} max={c.out - 0.5} onChange={(v) => setTrim(c.scene, v, c.out)} suffix={fmtDur(c.in)} />
        <SliderRow label="Son" value={c.out} min={c.in + 0.5} max={c.source_dur} onChange={(v) => setTrim(c.scene, c.in, v)} suffix={fmtDur(c.out)} />
      </div>
      <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
        <Mini label="Süre" value={fmtDur(dur)} />
        <Mini label="Baş pay" value={fmtDur(headH)} ok={headH >= 1} />
        <Mini label="Son pay" value={fmtDur(tailH)} ok={tailH >= 1} />
      </div>
    </div>
  )
}

/* ---- küçük yardımcılar ---- */
function Section({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: EASE.outExpo }}>
      <div className="mb-2 flex items-center gap-1.5 text-amber-400/80">{icon}<SectionLabel>{title}</SectionLabel></div>
      {children}
    </motion.div>
  )
}
function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5 text-body">
      <span className="shrink-0 text-fg-subtle">{label}</span>
      <span className="min-w-0 truncate text-right text-fg">{value}</span>
    </div>
  )
}
function SliderRow({ label, value, min, max, onChange, suffix }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; suffix: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-caption"><span className="text-fg-subtle">{label}</span><span className="tabular text-fg-muted">{suffix}</span></div>
      <Slider value={value} min={min} max={max} step={1 / 24} onValueChange={onChange} />
    </div>
  )
}
function Mini({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="rounded-lg bg-white/[0.03] py-1.5">
      <div className="text-micro text-fg-subtle">{label}</div>
      <div className="text-label font-medium tabular" style={ok === false ? { color: 'var(--color-warn)' } : undefined}>{value}</div>
    </div>
  )
}
function ResetButton({ scene, overridden }: { scene: number; overridden: boolean }) {
  const reset = useApp((s) => s.resetClip)
  return (
    <Tip label={overridden ? "AutoReji'nin kararına döndür" : 'Değişiklik yok'}>
      <span><Button size="sm" variant="ghost" disabled={!overridden} onClick={() => reset(scene)}><RotateCcw size={13} /> Sıfırla</Button></span>
    </Tip>
  )
}
function EnableButton({ clip: c }: { clip: Clip }) {
  const toggle = useApp((s) => s.toggleEnabled)
  return c.enabled ? (
    <Button size="sm" variant="danger" onClick={() => toggle(c.scene)}><Trash2 size={13} /> Klibi çıkar</Button>
  ) : (
    <Button size="sm" variant="subtle" onClick={() => toggle(c.scene)}><Undo size={13} /> Geri al</Button>
  )
}
