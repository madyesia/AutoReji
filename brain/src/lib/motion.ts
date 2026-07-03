import type { Transition } from 'framer-motion'
import type { Screen } from './types'

/* ============================================================================
   Hareket Sistemi 2.0 — TEK kaynak (docs/tasarim/spec-motion.md)
   PERFORMANS KURALLARI (§5):
   1) Ekran başına ≤3 sonsuz composited döngü + ≤1 canvas rAF (RainCanvas).
   2) Döngülerde YALNIZ transform+opacity (filter/box-shadow/width döngüde yasak;
      tek-seferlik girişlerde ≤500ms blur serbest). Glow nabzı = hazır katmanın opacity'si.
   3) will-change yalnız döngü elemanlarında; 160'lık liste kartlarında yasak.
   4) Stagger tek-atımlık (ilk mount); cap sonrası delay 0.
   5) AnimatePresence mode="wait" ekran/faz değişimlerinde standart.
   ========================================================================== */

/** Süre ölçeği (saniye — framer). CSS tarafı: --dur-fast/base/slow (ms). */
export const DUR = { fast: 0.13, base: 0.22, slow: 0.36, scene: 0.46 } as const

/** FX rafı — döngü/özel efekt süreleri (tabloya karışmaz, adıyla çağrılır). */
export const FX = {
  count: 0.7,      // BirthStat/CountUp sayaç
  bloom: 0.9,      // tek-sefer altın parlama
  glowPulse: 0.6,  // %100 halka nabzı (tek sefer)
  sealWave: 1.1,   // ApprovedSeal şok halkası
  ringSpin: 1.4,   // ProgressRing indeterminate devri
  connPulse: 2.4,  // ConnPulse nabız
  scanBeam: 2.6,   // ScanBeam süpürme (linear 2.2 → sine 2.6 + repeatDelay)
  softSweep: 3.8,  // SoftSweep gidiş-dönüş
} as const

export const EASE = {
  outExpo:   [0.16, 1, 0.3, 1] as const,    // BİRİNCİL giriş
  outQuart:  [0.25, 1, 0.5, 1] as const,    // hover / küçük hareket
  inQuart:   [0.5, 0, 0.75, 0] as const,    // çıkışlar (hızlanan son)
  inOutSine: [0.37, 0, 0.63, 1] as const,   // döngüler / ping-pong (linear'ın yerine)
  sweep:     [0.5, 0, 0.5, 1] as const,     // SweepReveal frontier'ı
}

/** 9 el-yazması spring → 4 adlandırılmış preset (spec §1.3 eşleme tablosu). */
export const SPRING = {
  snappy: { type: 'spring', stiffness: 420, damping: 30 },  // hızlı, taşmasız — toast, küçük UI
  gentle: { type: 'spring', stiffness: 260, damping: 24 },  // yumuşak — kart/panel girişleri
  pop:    { type: 'spring', stiffness: 420, damping: 16 },  // ~%10 taşma — kutlama: tik, mühür, sayı
  pill:   { type: 'spring', stiffness: 520, damping: 38 },  // kritik sönümlü — layoutId kaydırıcılar
} as const satisfies Record<string, Transition>

/* ---- Yönlü ekran geçişi (B4) ---- */
export const SCREEN_ORDER: Record<Screen, number> =
  { setup: 0, intake: 1, analysis: 2, review: 3, build: 4, archive: 5 }

export const screenDir = (from: Screen | null, to: Screen): 1 | -1 =>
  !from || SCREEN_ORDER[to] >= SCREEN_ORDER[from] ? 1 : -1

/** İleri = içerik sağdan gelir sola çıkar; geri = tersi. reduced: x'siz salt opacity.
 *  AnimatePresence `custom={dir}` ile kullan — çıkan ekranın yönü de güncel kalır. */
export const screenVariants = (reduced: boolean) =>
  reduced
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.15 } },
        exit: { opacity: 0, transition: { duration: 0.1 } },
      }
    : {
        initial: (dir: 1 | -1) => ({ opacity: 0, x: 16 * dir }),
        animate: { opacity: 1, x: 0, transition: { duration: DUR.scene, ease: EASE.outExpo } },
        exit: (dir: 1 | -1) => ({ opacity: 0, x: -16 * dir, transition: { duration: DUR.base, ease: EASE.inQuart } }),
      }

/* ---- Kademeli liste girişi (B1) — yalnız İLK mount'ta kullan (ref-gate çağıranda) ---- */
export const staggerList = (i: number, o?: { cap?: number; step?: number; y?: number }) => {
  const { cap = 12, step = 0.05, y = 8 } = o ?? {}
  return {
    initial: { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: { duration: DUR.base, ease: EASE.outExpo, delay: i < cap ? i * step : 0 },
  }
}

/* ---- Basma geri bildirimi (B5) — motion olmayan butonların CSS eşdeğeri:
       'active:scale-[0.97] transition-transform duration-[var(--dur-fast)]'
       reduced'ta KORUNUR (kullanıcı-tetikli %3 mikro ölçek WCAG 2.3.3 kapsam dışı). ---- */
export const pressable = { whileTap: { scale: 0.97 }, transition: { duration: DUR.fast, ease: EASE.outQuart } }

/* ---- İçerik değişimi (AnimatePresence mode="wait" ile) ---- */
export const fadeSwap = (reduced: boolean) =>
  reduced
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.15 } },
        exit: { opacity: 0, transition: { duration: 0.1 } },
      }
    : {
        initial: { opacity: 0, y: 4 },
        animate: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE.outExpo } },
        exit: { opacity: 0, y: -4, transition: { duration: DUR.fast, ease: EASE.inQuart } },
      }

/* ---- Aşama-tamamlama mikro-kutlaması (B3) ---- */
export const celebrate = (reduced: boolean) =>
  reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.15 } } }
    : { initial: { scale: 0.4, opacity: 0 }, animate: { scale: 1, opacity: 1, transition: SPRING.pop } }
