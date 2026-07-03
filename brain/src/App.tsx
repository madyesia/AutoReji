import { useEffect, useRef } from 'react'
import * as RTooltip from '@radix-ui/react-tooltip'
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from 'framer-motion'
import { useApp } from './lib/store'
import { screenDir, screenVariants } from './lib/motion'
import type { Screen } from './lib/types'
import { AppShell } from './components/AppShell'
import { IntakeScreen } from './screens/IntakeScreen'
import { AnalysisScreen } from './screens/AnalysisScreen'
import { ReviewScreen } from './screens/ReviewScreen'
import { BuildScreen } from './screens/BuildScreen'
import { CommandPalette } from './components/CommandPalette'
import { ShortcutsHelp } from './components/ShortcutsHelp'
import { ArchiveScreen } from './screens/ArchiveScreen'
import { SetupScreen } from './screens/SetupScreen'
import { ToastViewport } from './components/Toast'

export default function App() {
  const screen = useApp((s) => s.screen)
  const reduce = useReducedMotion() ?? false
  // Yönlü ekran geçişi (Hareket 2.0 B4): ileri = sağdan gelir sola çıkar; geri = tersi.
  const prevRef = useRef<Screen | null>(null)
  const dir = screenDir(prevRef.current, screen)
  useEffect(() => { prevRef.current = screen }, [screen])

  // Ambient katman durdurma: pencere arka plana düşünce blob animasyonları durur (GPU/pil sıfır).
  useEffect(() => {
    const sync = () => {
      if (document.hidden) document.documentElement.setAttribute('data-app-idle', '')
      else document.documentElement.removeAttribute('data-app-idle')
    }
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])

  const variants = screenVariants(reduce)
  return (
    <MotionConfig reducedMotion="user">
      <RTooltip.Provider delayDuration={260} skipDelayDuration={400}>
        <AppShell>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={screen}
              custom={dir}
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute inset-0"
            >
              {screen === 'setup' && <SetupScreen />}
              {screen === 'intake' && <IntakeScreen />}
              {screen === 'analysis' && <AnalysisScreen />}
              {screen === 'review' && <ReviewScreen />}
              {screen === 'build' && <BuildScreen />}
              {screen === 'archive' && <ArchiveScreen />}
            </motion.div>
          </AnimatePresence>
        </AppShell>
        <CommandPalette />
        <ShortcutsHelp />
        <ToastViewport />
      </RTooltip.Provider>
    </MotionConfig>
  )
}
