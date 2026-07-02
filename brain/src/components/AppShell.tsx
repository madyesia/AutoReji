import { Fragment, useState, type ReactNode } from 'react'
import { Clapperboard, SlidersHorizontal, Zap, Settings2, ChevronRight, Search, Keyboard, Library } from 'lucide-react'
import { Logo } from './Logo'
import { Segmented, IconButton, Tip, Kbd, Dot } from './ui'
import { ConnPulse } from './motifs'
import { setupReadyCount, SETUP_ITEM_COUNT } from '../lib/setup'
import { AboutDialog } from './AboutDialog'
import { useApp } from '../lib/store'
import { APP_VERSION, cn } from '../lib/utils'
import type { Mode, Screen } from '../lib/types'

const STEPS: { k: Screen; label: string }[] = [
  { k: 'setup', label: 'Hazırlık' },
  { k: 'intake', label: 'Giriş' },
  { k: 'review', label: 'İnceleme' },
  { k: 'build', label: 'Kur' },
]

function Stepper({ screen, go, ready }: { screen: Screen; go: (s: Screen) => void; ready: boolean }) {
  return (
    <div className="flex items-center gap-1 rounded-xl bg-ink-900/60 p-1 ring-hair">
      {STEPS.map((s, i) => {
        const active = screen === s.k || (screen === 'analysis' && s.k === 'review')
        const locked = !ready && s.k !== 'intake' && s.k !== 'setup'   // Hazırlık + Giriş hep açık; diğerleri bölüm yüklenene dek kilitli
        return (
          <Fragment key={s.k}>
            {i > 0 && <ChevronRight size={13} className="text-fg-faint" />}
            <Tip label={locked ? 'Önce bir bölüm yükle' : s.label}>
              <button onClick={() => !locked && go(s.k)} disabled={locked}
                className={cn('rounded-lg px-3 h-7 text-[12.5px] font-medium transition-colors',
                  active ? 'bg-white/10 text-fg'
                    : locked ? 'text-fg-faint cursor-not-allowed'
                    : 'text-fg-subtle hover:text-fg hover:bg-white/5')}>
                {s.label}
              </button>
            </Tip>
          </Fragment>
        )
      })}
    </div>
  )
}

const MODES: { value: Mode; label: string; icon: ReactNode }[] = [
  { value: 'fast', label: 'Hızlı', icon: <Zap size={14} /> },
  { value: 'controlled', label: 'Kontrollü', icon: <SlidersHorizontal size={14} /> },
  { value: 'director', label: 'Yönetmen', icon: <Clapperboard size={14} /> },
]

export function prettyEpisode(name: string) {
  if (!name) return 'Bölüm'
  const [num, ...rest] = name.split('_')
  const title = rest.join(' ')
  return /^\d+$/.test(num) ? `Bölüm ${num} · ${title}` : name.replace(/_/g, ' ')
}

export function AppShell({ children }: { children: ReactNode }) {
  const mode = useApp((s) => s.mode)
  const setMode = useApp((s) => s.setMode)
  const manifest = useApp((s) => s.manifest)
  const screen = useApp((s) => s.screen)
  const setScreen = useApp((s) => s.setScreen)
  const setup = useApp((s) => s.setup)
  const setupReady = setupReadyCount(setup)
  const setupAllOk = setupReady === SETUP_ITEM_COUNT && !setup.skipped
  const showModes = screen === 'review'   // yalnız İnceleme: BuildScreen modu okumuyor — orada göstermek ölü kontrol olur
  const [about, setAbout] = useState(false)

  return (
    <div className="flex h-full flex-col">
      <header className="relative z-30 flex h-14 shrink-0 items-center gap-3 px-4 glass hairline-b">
        <button onClick={() => setScreen('intake')} title="Başa dön" className="flex items-center gap-2 rounded-lg transition-opacity hover:opacity-80">
          <Logo />
          <span className="flex items-baseline gap-1.5">
            <span className="text-[15px] font-semibold tracking-tight text-gold">AutoReji</span>
            <span className="text-[11px] text-fg-subtle tabular">{APP_VERSION}</span>
          </span>
        </button>
        {manifest && (
          <>
            <div className="mx-1 h-5 w-px bg-white/10" />
            <span className="truncate max-w-[200px] text-[12px] text-fg-subtle">{prettyEpisode(manifest.episode.name)}</span>
          </>
        )}
        <div className="flex flex-1 justify-center"><Stepper screen={screen} go={setScreen} ready={!!manifest} /></div>
        {showModes && <Segmented options={MODES} value={mode} onChange={setMode} />}
        {manifest && (
          <Tip label="Komut paleti — her şeyi ara">
            <button aria-label="Komut paletini aç" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              className="hidden h-8 items-center gap-1.5 rounded-lg px-2.5 text-fg-muted transition-colors hover:bg-white/8 hover:text-fg md:flex">
              <Search size={14} /> <Kbd>⌘K</Kbd>
            </button>
          </Tip>
        )}
        <ConnPulse />
        <Tip label={setupAllOk ? 'Hazırlık tamam' : `Hazırlık ${setupReady}/${SETUP_ITEM_COUNT} · eksik — aç`}>
          <button aria-label="Hazırlık durumu" onClick={() => setScreen('setup')}
            className={cn('flex h-8 items-center gap-1.5 rounded-lg px-2 text-[11.5px] font-medium tabular transition-colors', screen === 'setup' ? 'bg-white/10 text-fg' : 'text-fg-muted hover:bg-white/8 hover:text-fg')}>
            <Dot color={setupAllOk ? 'var(--color-ok)' : 'var(--color-amber-400)'} size={7} /> {setupReady}/{SETUP_ITEM_COUNT}
          </button>
        </Tip>
        <Tip label="Arşiv — kurulan bölümler"><IconButton aria-label="Arşiv" active={screen === 'archive'} onClick={() => setScreen('archive')}><Library size={18} /></IconButton></Tip>
        <Tip label="Klavye kısayolları (?)"><IconButton aria-label="Klavye kısayolları" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }))}><Keyboard size={17} /></IconButton></Tip>
        <Tip label="Hakkında & ilkeler"><IconButton aria-label="Hakkında" active={about} onClick={() => setAbout(true)}><Settings2 size={18} /></IconButton></Tip>
      </header>
      <main className="relative flex-1 overflow-hidden">{children}</main>
      <AboutDialog open={about} onClose={() => setAbout(false)} />
    </div>
  )
}
