import * as Dialog from '@radix-ui/react-dialog'
import { X, Volume2, Ban, WifiOff, FileText } from 'lucide-react'
import { Logo } from './Logo'
import { APP_VERSION } from '../lib/utils'

const PRINCIPLES = [
  { icon: <Volume2 size={15} />, title: 'Native stereo', desc: 'tek ses katmanı, sol-sağ gerçek stereo — ASMR önceliği' },
  { icon: <Ban size={15} />, title: 'Render YOK', desc: 'düzenlenebilir klip + geçiş' },
  { icon: <WifiOff size={15} />, title: 'Yerel / çevrimdışı', desc: 'çalışma anında ücretli AI yok' },
  { icon: <FileText size={15} />, title: 'Prompt-odaklı', desc: 'karar görsel promptlardan' },
]

export function AboutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink-950/85 data-[state=open]:animate-[float-up_.2s_ease-out]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[420px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-2xl glass p-6 shadow-pop focus:outline-none">
          <Dialog.Close className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-fg-muted hover:bg-white/8 hover:text-fg"><X size={16} /></Dialog.Close>
          <div className="flex items-center gap-3">
            <Logo size={44} />
            <div>
              <Dialog.Title className="text-title font-semibold text-gold leading-none">AutoReji</Dialog.Title>
              <div className="mt-1 text-label text-fg-subtle tabular">{APP_VERSION} · Ghibli Mood ON</div>
            </div>
          </div>
          <Dialog.Description className="mt-3 text-body leading-relaxed text-fg-muted">
            Her gün ~160 klipten oluşan bir bölümü Premiere Pro 2026'da render almadan, düzenlenebilir ve native stereo kuran yerel kurgu sistemi.
          </Dialog.Description>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="flex items-start gap-2.5 rounded-xl bg-white/[0.03] p-3 ring-hair">
                <span className="mt-0.5 text-amber-300">{p.icon}</span>
                <div><div className="text-body font-medium leading-tight">{p.title}</div><div className="text-caption text-fg-subtle">{p.desc}</div></div>
              </div>
            ))}
          </div>

          <div className="mt-4 hairline-t pt-3 text-caption text-fg-faint">
            AutoReji beta v1.2 · Developed by Madyes © 2026
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
