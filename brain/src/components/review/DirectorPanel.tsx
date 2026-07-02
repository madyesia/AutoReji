import { Wind, Gauge, Clapperboard, RotateCcw } from 'lucide-react'
import { SectionLabel, Badge, Tip } from '../ui'
import { cn } from '../../lib/utils'
import { useApp, type EditStyle } from '../../lib/store'

const STYLES: { key: EditStyle; label: string; desc: string; icon: React.ReactNode }[] = [
  { key: 'calm', label: 'Daha sakin', desc: 'daha çok + daha uzun fade', icon: <Wind size={14} /> },
  { key: 'tempo', label: 'Daha tempolu', desc: 'daha az + kısa fade, çok cut', icon: <Gauge size={14} /> },
  { key: 'cine', label: 'Daha sinematik', desc: 'fade biraz daha uzun', icon: <Clapperboard size={14} /> },
]

export function DirectorPanel() {
  const style = useApp((s) => s.style)
  const applyStyle = useApp((s) => s.applyStyle)

  return (
    <aside className="flex w-[280px] shrink-0 flex-col glass hairline-r">
      <div className="flex shrink-0 items-center gap-2 p-4 hairline-b">
        <Clapperboard size={16} className="text-amber-400" />
        <span className="text-ui font-semibold">Yönetmen Stüdyosu</span>
      </div>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
        {/* Stiller — gerçekten çalışan tek kontrol: tüm bölümün geçişlerini yeniden düzenler */}
        <div>
          <div className="flex items-center justify-between">
            <SectionLabel>Kurgu stili</SectionLabel>
            <Tip label="Varsayılana dön"><button onClick={() => applyStyle('base')} className={cn('flex items-center gap-1 text-caption transition-colors', style === 'base' ? 'text-amber-300' : 'text-fg-subtle hover:text-fg')}><RotateCcw size={11} /> varsayılan</button></Tip>
          </div>
          <div className="mt-2 grid grid-cols-1 gap-1.5">
            {STYLES.map((s) => (
              <button key={s.key} onClick={() => applyStyle(s.key)}
                className={cn('flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all',
                  style === s.key ? 'bg-amber-400/12 ring-1 ring-amber-400/40' : 'hover:bg-white/5 ring-hair')}>
                <span className={cn('mt-0.5', style === s.key ? 'text-amber-300' : 'text-fg-subtle')}>{s.icon}</span>
                <span className="min-w-0">
                  <span className={cn('block text-body', style === s.key ? 'text-amber-200' : 'text-fg')}>{s.label}</span>
                  <span className="block text-caption text-fg-subtle">{s.desc}</span>
                </span>
                {style === s.key && <span className="ml-auto mt-0.5 text-micro text-amber-300/70">aktif</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-amber-400/[0.06] p-3 text-label leading-snug text-amber-200/70 ring-1 ring-amber-400/15">
          Stil seçimi tüm bölümün geçişlerini anında yeniden düzenler (cut ↔ fade dengesi ve süreler). Tek tek sahnelerin ince ayarını sağdaki bilgi panelinden ve film şeridinden yaparsın.
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between p-3 hairline-t">
        <Badge color="var(--color-amber-400)">stil: {STYLES.find((s) => s.key === style)?.label ?? 'varsayılan'}</Badge>
      </div>
    </aside>
  )
}
