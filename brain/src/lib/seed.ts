// Seed'li deterministik RNG — CLAUDE.md mandatı: Date.now()/Math.random() yerine seed'li üretim
// (tekrarlanabilirlik). Model-indirme jitter'ı gibi "rastgele görünen ama tekrarlanabilir" akışlar için.

export function hashString(s: string): number {
  let h = 1779033703 ^ s.length
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}

export function mulberry32(a: number): () => number {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** İsimden seed'li 0..1 üreteç. */
export const rngFromSeed = (seed: string): (() => number) => mulberry32(hashString(seed))
