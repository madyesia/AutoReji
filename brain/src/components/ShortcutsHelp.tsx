import { useEffect, useState } from 'react'
import { Keyboard } from 'lucide-react'
import { Kbd } from './ui'

const GROUPS: { title: string; rows: { keys: string[]; desc: string }[] }[] = [
  {
    title: 'Genel',
    rows: [
      { keys: ['⌘', 'K'], desc: 'Komut paleti (ara, sahneye atla, her şey)' },
      { keys: ['?'], desc: 'Bu kısayol kartı' },
      { keys: ['Esc'], desc: 'Paneli / kartı kapat' },
    ],
  },
  {
    title: 'İnceleme — düzenleme',
    rows: [
      { keys: ['←', '→'], desc: 'Önceki / sonraki klip' },
      { keys: ['C'], desc: 'Seçili klibi Cut yap' },
      { keys: ['F'], desc: 'Seçili klibi Fade yap' },
      { keys: ['B'], desc: 'Seçili klibi Black yap' },
      { keys: ['Delete'], desc: 'Seçili klibi sil (kurgudan çıkar)' },
      { keys: ['⌘', 'Z'], desc: 'Geri al' },
      { keys: ['⇧', '⌘', 'Z'], desc: 'İleri al' },
    ],
  },
  {
    title: 'Film şeridi',
    rows: [
      { keys: ['Tık'], desc: 'Klibi seç + önizle' },
      { keys: ['⌘', 'Tık'], desc: 'Çoklu işaretle (toplu işlem)' },
      { keys: ['⇧', 'Tık'], desc: 'Seçiliden buraya aralık işaretle' },
      { keys: ['Hover'], desc: 'Üzerine gel → canlı önizleme' },
    ],
  },
]

export function ShortcutsHelp() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === '?') { e.preventDefault(); setOpen((o) => !o) }
      else if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 px-4 backdrop-blur-[2px]" onClick={() => setOpen(false)}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl glass shadow-[var(--shadow-pop)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-white/8 px-5 py-3.5">
          <Keyboard size={16} className="text-amber-400" />
          <span className="text-[14px] font-semibold">Klavye kısayolları</span>
          <span className="ml-auto"><Kbd>esc</Kbd></span>
        </div>
        <div className="max-h-[64vh] space-y-5 overflow-y-auto p-5">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-fg-subtle">{g.title}</div>
              <div className="space-y-1.5">
                {g.rows.map((r, i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                    <span className="text-[13px] text-fg-muted">{r.desc}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      {r.keys.map((k, j) => <Kbd key={j}>{k}</Kbd>)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
