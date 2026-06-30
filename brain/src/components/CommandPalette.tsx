import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, CornerDownLeft } from 'lucide-react'
import { useApp } from '../lib/store'
import { cn } from '../lib/utils'
import { Kbd } from './ui'

interface Cmd { id: string; label: string; group: string; run: () => void; kw?: string }

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const s = useApp()

  // ⌘K / Ctrl+K aç-kapa · Esc kapat
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); setQ(''); setActive(0); setOpen((o) => !o)
      } else if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 20) }, [open])

  const cmds = useMemo<Cmd[]>(() => {
    const close = () => setOpen(false)
    const has = !!s.manifest
    const sel = s.selected
    const L: Cmd[] = []
    L.push({ id: 'go-intake', group: 'Git', label: 'Giriş ekranı', kw: 'başla yeni', run: () => { s.setScreen('intake'); close() } })
    L.push({ id: 'go-archive', group: 'Git', label: 'Arşiv — kurulan bölümler', kw: 'geçmiş history', run: () => { s.setScreen('archive'); close() } })
    if (has) {
      L.push({ id: 'go-review', group: 'Git', label: 'İnceleme çalışma alanı', kw: 'film şeridi', run: () => { s.setScreen('review'); close() } })
      L.push({ id: 'go-build', group: 'Git', label: "Kur ekranı — Premiere'e gönder", kw: 'export çıktı', run: () => { s.setScreen('build'); close() } })
      L.push({ id: 'mode-fast', group: 'Mod', label: 'Hızlı mod', run: () => { s.setMode('fast'); close() } })
      L.push({ id: 'mode-ctrl', group: 'Mod', label: 'Kontrollü mod', run: () => { s.setMode('controlled'); close() } })
      L.push({ id: 'mode-dir', group: 'Mod', label: 'Yönetmen modu', kw: 'gelişmiş', run: () => { s.setMode('director'); close() } })
      if (sel != null) {
        L.push({ id: 't-cut', group: `Sahne ${sel}`, label: `Sahne ${sel} → Cut`, run: () => { s.setTransitionType(sel, 'cut'); close() } })
        L.push({ id: 't-fade', group: `Sahne ${sel}`, label: `Sahne ${sel} → Fade`, run: () => { s.setTransitionType(sel, 'fade'); close() } })
        L.push({ id: 't-black', group: `Sahne ${sel}`, label: `Sahne ${sel} → Black`, run: () => { s.setTransitionType(sel, 'black'); close() } })
      }
      L.push({ id: 'st-calm', group: 'Kurgu stili', label: 'Daha sakin (fade artır)', kw: 'çok fade', run: () => { s.applyStyle('calm'); close() } })
      L.push({ id: 'st-tempo', group: 'Kurgu stili', label: 'Daha tempolu (cut artır)', kw: 'hızlı', run: () => { s.applyStyle('tempo'); close() } })
      L.push({ id: 'st-cine', group: 'Kurgu stili', label: 'Sinematik', run: () => { s.applyStyle('cine'); close() } })
      L.push({ id: 'st-base', group: 'Kurgu stili', label: 'Orijinale döndür (algoritma)', kw: 'sıfırla reset', run: () => { s.applyStyle('base'); close() } })
      L.push({ id: 'v-focus', group: 'Görünüm', label: s.focusOnly ? 'Odak modunu kapat' : 'Odak: sadece dikkat gerekenler', run: () => { s.setFocusOnly(!s.focusOnly); close() } })
      L.push({ id: 'v-risky', group: 'Görünüm', label: s.riskyOnly ? 'Riskli filtresini kapat' : 'Sadece riskli klipler', run: () => { s.setRiskyOnly(!s.riskyOnly); close() } })
      L.push({ id: 'v-motion', group: 'Görünüm', label: s.motionPreview ? 'Hareketli önizlemeyi kapat' : 'Hareketli önizlemeyi aç', run: () => { s.toggleMotionPreview(); close() } })
      L.push({ id: 'e-undo', group: 'Düzenle', label: 'Geri al', kw: 'undo', run: () => { s.undo(); close() } })
      L.push({ id: 'e-redo', group: 'Düzenle', label: 'İleri al', kw: 'redo', run: () => { s.redo(); close() } })
    }
    return L
  }, [s])

  const num = parseInt(q.trim(), 10)
  const sceneCmd: Cmd[] = (s.manifest && !Number.isNaN(num) && num >= 1 && num <= s.clips.length)
    ? [{ id: 'go-scene', group: 'Git', label: `Sahne ${num}'e git`, run: () => { s.setScreen('review'); s.select(num); setOpen(false) } }]
    : []

  const ql = q.trim().toLowerCase()
  const filtered = useMemo(() => {
    const base = ql ? cmds.filter((c) => `${c.label} ${c.kw ?? ''} ${c.group}`.toLowerCase().includes(ql)) : cmds
    return [...sceneCmd, ...base]
  }, [cmds, ql, sceneCmd.length])

  useEffect(() => { setActive((a) => Math.min(a, Math.max(0, filtered.length - 1))) }, [filtered.length])

  const run = (i: number) => filtered[i]?.run()
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(filtered.length - 1, a + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)) }
    else if (e.key === 'Enter') { e.preventDefault(); run(active) }
  }

  useEffect(() => {
    listRef.current?.querySelector(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/55 px-4 pt-[12vh] backdrop-blur-[2px]" onClick={() => setOpen(false)}>
      <div className="w-full max-w-xl overflow-hidden rounded-2xl glass shadow-[var(--shadow-pop)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2.5 border-b border-white/8 px-4">
          <Search size={16} className="shrink-0 text-fg-subtle" />
          <input ref={inputRef} value={q} onChange={(e) => { setQ(e.target.value); setActive(0) }} onKeyDown={onKeyDown}
            placeholder="Komut ara ya da sahne numarası yaz…"
            className="h-12 flex-1 bg-transparent text-[14px] text-fg outline-none placeholder:text-fg-faint select-text" />
          <Kbd>esc</Kbd>
        </div>
        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="px-3 py-8 text-center text-[13px] text-fg-subtle">Sonuç yok</div>
          ) : filtered.map((c, i) => (
            <button key={c.id} data-i={i} onClick={() => run(i)} onMouseMove={() => setActive(i)}
              className={cn('flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-[13px] transition-colors',
                i === active ? 'bg-amber-400/15 text-fg' : 'text-fg-muted')}>
              <span className="truncate">{c.label}</span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="text-[11px] text-fg-subtle">{c.group}</span>
                {i === active && <CornerDownLeft size={13} className="text-amber-300" />}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
