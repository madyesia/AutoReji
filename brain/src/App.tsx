import * as RTooltip from '@radix-ui/react-tooltip'
import { AnimatePresence, motion } from 'framer-motion'
import { useApp } from './lib/store'
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
  return (
    <RTooltip.Provider delayDuration={260} skipDelayDuration={400}>
      <AppShell>
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
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
  )
}
