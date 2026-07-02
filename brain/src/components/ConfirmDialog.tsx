import * as Dialog from '@radix-ui/react-dialog'
import { AlertTriangle, HelpCircle } from 'lucide-react'
import { Button } from './ui'

// Yıkıcı/geri-dönüşü zor eylemler için onay kapısı (TUR 1 — denetim A3/A4).
// Radix Dialog: odak tuzağı + Esc + scroll kilidi hazır gelir.
export function ConfirmDialog({ open, onOpenChange, title, desc, confirmLabel, cancelLabel = 'Vazgeç', danger = false, onConfirm }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  desc: string
  confirmLabel: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink-950/85 data-[state=open]:animate-[float-up_.2s_ease-out]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[420px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-2xl glass p-5 shadow-pop focus:outline-none">
          <div className="flex items-start gap-3">
            <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${danger ? 'bg-danger/15 text-danger' : 'bg-amber-400/15 text-amber-300'}`}>
              {danger ? <AlertTriangle size={17} /> : <HelpCircle size={17} />}
            </span>
            <div className="min-w-0">
              <Dialog.Title className="text-lead font-semibold">{title}</Dialog.Title>
              <Dialog.Description className="mt-1 text-body leading-snug text-fg-muted">{desc}</Dialog.Description>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Dialog.Close asChild><Button variant="subtle">{cancelLabel}</Button></Dialog.Close>
            <Button variant={danger ? 'danger' : 'primary'} onClick={() => { onOpenChange(false); onConfirm() }}>{confirmLabel}</Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
