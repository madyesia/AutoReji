import { useEffect, useMemo } from 'react'
import { Undo2, Redo2, Hammer, Focus, AlertTriangle, ShieldCheck, Trash2, RotateCcw } from 'lucide-react'
import { useApp } from '../lib/store'
import { computeStats, countRisky } from '../lib/data'
import { fmtMin, fmtDur, TRANSITION, cn } from '../lib/utils'
import { Button, IconButton, Switch, Tip, Dot } from '../components/ui'
import { PreviewStage } from '../components/review/PreviewStage'
import { Timeline } from '../components/review/Timeline'
import { Filmstrip } from '../components/review/Filmstrip'
import { Inspector } from '../components/review/Inspector'
import { DirectorPanel } from '../components/review/DirectorPanel'

export function ReviewScreen() {
  const { mode, clips, selected, select, setScreen, marked, clearMarks, bulkTransition, bulkSetEnabled, resetAll } = useApp()
  const setTransitionType = useApp((s) => s.setTransitionType)
  const toggleEnabled = useApp((s) => s.toggleEnabled)
  const undo = useApp((s) => s.undo)
  const redo = useApp((s) => s.redo)
  const focusOnly = useApp((s) => s.focusOnly)
  const setFocusOnly = useApp((s) => s.setFocusOnly)
  const riskyOnly = useApp((s) => s.riskyOnly)
  const setRiskyOnly = useApp((s) => s.setRiskyOnly)
  const canUndo = useApp((s) => s.past.length > 0)
  const canRedo = useApp((s) => s.future.length > 0)
  const stats = useMemo(() => computeStats(clips), [clips])
  const riskN = useMemo(() => countRisky(clips), [clips])
  const overridden = useMemo(() => clips.filter((c) => c.decision.user_overridden).length, [clips])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      const idx = clips.findIndex((c) => c.scene === selected)
      if (e.key === 'ArrowRight') { e.preventDefault(); select(clips[Math.min(clips.length - 1, idx + 1)]?.scene ?? selected) }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); select(clips[Math.max(0, idx - 1)]?.scene ?? selected) }
      else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo() }
      else if (selected != null && idx > 0) {
        if (e.key === 'c' || e.key === 'C') setTransitionType(selected, 'cut')
        else if (e.key === 'f' || e.key === 'F') setTransitionType(selected, 'fade')
        else if (e.key === 'b' || e.key === 'B') setTransitionType(selected, 'black')
        else if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); toggleEnabled(selected) }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [clips, selected, select, setTransitionType, toggleEnabled, undo, redo])

  return (
    <div className="flex h-full flex-col bg-ink-950/40">
      <div className="flex min-h-0 flex-1">
        {mode === 'director' && <DirectorPanel />}
        <div className="flex min-w-0 flex-1 flex-col">
          <PreviewStage />
          <Timeline />
          <Filmstrip />
        </div>
        {mode !== 'fast' && <Inspector />}
      </div>

      <div className="flex h-14 shrink-0 items-center gap-4 px-4 glass hairline-t">
        {marked.length > 0 ? (
          <div className="flex items-center gap-1.5 text-[12.5px]">
            <span className="font-semibold tabular text-amber-300">{marked.length} klip seçili</span>
            <span className="ml-1 text-fg-subtle">→ hepsine:</span>
            <button onClick={() => bulkTransition('cut')} className="h-7 rounded-md px-2 font-medium text-fg-muted transition-colors hover:bg-white/8 hover:text-fg">Cut</button>
            <button onClick={() => bulkTransition('fade')} className="h-7 rounded-md px-2 font-medium transition-colors hover:bg-white/8" style={{ color: TRANSITION.fade.color }}>Fade</button>
            <button onClick={() => bulkTransition('black')} className="h-7 rounded-md px-2 font-medium transition-colors hover:bg-white/8" style={{ color: TRANSITION.black.color }}>Black</button>
            <div className="mx-0.5 h-4 w-px bg-white/10" />
            <button onClick={() => bulkSetEnabled(false)} className="flex h-7 items-center gap-1 rounded-md px-2 font-medium text-danger transition-colors hover:bg-danger/10"><Trash2 size={13} /> Sil</button>
            <button onClick={clearMarks} className="h-7 rounded-md px-2 text-fg-subtle transition-colors hover:text-fg">Temizle</button>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-[12.5px] text-fg-muted tabular">
            <span className="flex items-center gap-1.5"><Dot color={TRANSITION.cut.color} /> {stats.cuts} cut</span>
            <span className="flex items-center gap-1.5"><Dot color={TRANSITION.fade.color} /> {stats.fades} fade</span>
            <span className="flex items-center gap-1.5"><Dot color={TRANSITION.black.color} /> {stats.blacks} black</span>
            <div className="mx-1 h-4 w-px bg-white/10" />
            <span>{stats.enabled} klip</span><span className="text-fg-subtle">·</span>
            <span>~{fmtMin(stats.total)}</span><span className="text-fg-subtle">·</span>
            <span className="text-fg-subtle">ort {fmtDur(stats.avg)}</span>
          </div>
        )}
        <div className="flex-1" />
        {riskN > 0 ? (
          <Tip label="QC: riskli klipleri göster — incele ve gerekirse çıkar">
            <button onClick={() => setRiskyOnly(!riskyOnly)}
              className={cn('flex items-center gap-1.5 rounded-lg px-2.5 h-8 text-[12.5px] transition-colors', riskyOnly ? 'text-danger' : 'text-fg-muted hover:text-fg')}>
              <AlertTriangle size={15} /> Riskli {riskN}
            </button>
          </Tip>
        ) : (
          <Tip label="Kalite kontrol: kare-kare tarandı, sorun bulunamadı"><span className="flex items-center gap-1.5 px-2 h-8 text-[12.5px] text-ok"><ShieldCheck size={15} /> Tümü temiz</span></Tip>
        )}
        <Tip label="Yalnızca dikkat gerektiren klipleri göster (odak inceleme)">
          <div className={cn('flex items-center gap-2 rounded-lg px-2.5 h-8 text-[12.5px] transition-colors', focusOnly ? 'text-amber-300' : 'text-fg-muted')}>
            <button onClick={() => setFocusOnly(!focusOnly)} className="flex items-center gap-1.5 hover:text-fg"><Focus size={15} /> Odak</button>
            <Switch checked={focusOnly} onCheckedChange={setFocusOnly} />
          </div>
        </Tip>
        {overridden > 0 && (
          <Tip label="Tüm elle değişiklikleri geri al — algoritmanın orijinaline dön">
            <button onClick={resetAll} className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12px] text-fg-muted transition-colors hover:bg-white/8 hover:text-fg">
              <RotateCcw size={14} /> {overridden} elle değişiklik
            </button>
          </Tip>
        )}
        <div className="flex items-center gap-0.5">
          <Tip label="Geri al ⌘Z"><span><IconButton aria-label="Geri al" onClick={undo} disabled={!canUndo} className="disabled:opacity-30"><Undo2 size={17} /></IconButton></span></Tip>
          <Tip label="İleri al ⇧⌘Z"><span><IconButton aria-label="İleri al" onClick={redo} disabled={!canRedo} className="disabled:opacity-30"><Redo2 size={17} /></IconButton></span></Tip>
        </div>
        <Button variant="primary" onClick={() => setScreen('build')}><Hammer size={16} /> Premiere'de Kur</Button>
      </div>
    </div>
  )
}
