// AutoReji MOTORU — manifest üretimi köprüsü (Blueprint: BEYİN → manifest).
// Tauri'de GERÇEK Python sidecar pipeline (crop → analyze → vlm → build_manifest);
// tarayıcıda mock (örnek bölüm) kullanılır (çağıran tarafça). Köprü TEK yerde izole.
import { tauriAvailable } from './native'
import { runSidecar, readText } from './tauri'
import type { Manifest } from './types'

export interface EngineProgress { step: number; total: number; label: string; pct: number }
export type EngineResult = { ok: true; manifest: Manifest } | { ok: false; error: string }

// 4 adım; build_manifest yan-artefaktları (crop/analyze/vlm JSON) okuyup zenginleştirir.
const STEPS: { cmd: string; label: string; needsPrompt?: boolean }[] = [
  { cmd: 'detect_crop', label: 'Siyah bar / crop tespiti' },
  { cmd: 'analyze_video', label: 'Video analizi (her kare)' },
  { cmd: 'vlm_scene', label: 'Görsel-AI sahne sinyali (ollama)' },
  { cmd: 'build_manifest', label: 'Manifest kuruluyor', needsPrompt: true },
]

/**
 * GERÇEK pipeline (yalnız Tauri). Sırayla 4 sidecar komutu; canlı ilerleme onProgress'e.
 * VLM adımı kritik DEĞİL (ollama yoksa atlanır, kurgu sürer). Son adım manifesti diske yazar;
 * tam manifesti dosyadan okuyup döneriz (cli.py build_manifest yalnız ÖZET döndürür).
 */
export async function runPipeline(
  promptPath: string,
  videoFolder: string,
  workDir: string,
  onProgress: (p: EngineProgress) => void,
  opts?: { probe?: boolean; noVlm?: boolean },
): Promise<EngineResult> {
  if (!tauriAvailable()) return { ok: false, error: 'Motor yalnız paketli uygulamada çalışır (tarayıcıda örnek bölüm kullanılır).' }
  const steps = opts?.noVlm ? STEPS.filter((s) => s.cmd !== 'vlm_scene') : STEPS
  const total = steps.length
  let manifestPath: string | null = null
  try {
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i]
      onProgress({ step: i, total, label: s.label, pct: 0 })
      const input = JSON.stringify(
        s.needsPrompt
          ? { prompt: promptPath, video: videoFolder, work_dir: workDir, probe: !!opts?.probe }
          : { video: videoFolder, work_dir: workDir },
      )
      // Girdiyi STDIN yerine argv[2] ile geçiriyoruz → shell:allow-stdin-write iznine gerek yok (daha sağlam).
      // cli.py _read_input argv[2]'yi '{' ile başlıyorsa JSON olarak okur.
      const run = await runSidecar([s.cmd, input], undefined, (ev) => {
        if (ev?.event === 'progress' && ev.total) onProgress({ step: i, total, label: s.label, pct: Math.min(1, ev.done / ev.total) })
      })
      const okResult = run.result && run.result.ok
      if (run.code !== 0 || !okResult) {
        if (s.cmd === 'vlm_scene') continue // ollama yok/hata → VLM'siz devam (kurgu bozulmaz)
        const err = (run.result && run.result.error) || run.stderr.slice(-400) || `sidecar '${s.cmd}' exit ${run.code}`
        return { ok: false, error: err }
      }
      if (s.cmd === 'build_manifest') manifestPath = run.result?.result?.manifest_path ?? null
      onProgress({ step: i + 1, total, label: s.label, pct: 1 })
    }
    if (!manifestPath) return { ok: false, error: 'Manifest yolu alınamadı (build_manifest).' }
    const raw = await readText(manifestPath)
    if (!raw) return { ok: false, error: `Manifest okunamadı: ${manifestPath}` }
    return { ok: true, manifest: JSON.parse(raw) as Manifest }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/** Sidecar sağlık kontrolü (ping). Hazırlık/teşhis için. */
export async function sidecarPing(): Promise<{ ok: boolean; version?: string }> {
  if (!tauriAvailable()) return { ok: false }
  try {
    const run = await runSidecar(['ping'])
    return { ok: !!run.result?.ok, version: run.result?.result?.version }
  } catch {
    return { ok: false }
  }
}
