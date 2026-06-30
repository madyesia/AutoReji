// Tauri 2 köprü yardımcıları — TEK yerde izole (Blueprint: köprü ince/değiştirilebilir).
// Hepsi tauriAvailable() ARKASINDA çağrılır; tarayıcıda çağıran guard eder.
//
// ⚠️ KRİTİK: paketler STATİK-STRING dinamik import ile yüklenir (`import('@tauri-apps/plugin-x')`).
//   @vite-ignore + DEĞİŞKEN isimli import KULLANMA — Vite onu bundle'lamaz, paketlenmiş .app'te
//   bare-module çözülmez → tüm plugin çağrıları sessizce başarısız olur (kullanıcı bunu yaşadı).
//   Statik literal ile Vite her birini lazy CHUNK olarak bundle'lar → .app'te çözülür, tarayıcıda
//   yalnız çağrılınca (yani hiç) yüklenir.
import { tauriAvailable } from './native'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any

export interface ShellResult { code: number | null; stdout: string; stderr: string }

/** Scoped bir komut çalıştır (capabilities'te izinli: ollama/which/ls). Tek seferlik, çıktıyı toplar. */
export async function runCommand(name: string, args: string[]): Promise<ShellResult> {
  const { Command } = await import('@tauri-apps/plugin-shell')
  const out = await Command.create(name, args).execute()
  return { code: out.code, stdout: out.stdout ?? '', stderr: out.stderr ?? '' }
}

/** Komut PATH'te var mı? (which <bin> → exit 0). */
export async function which(bin: string): Promise<boolean> {
  try { const r = await runCommand('which', [bin]); return r.code === 0 && r.stdout.trim().length > 0 } catch { return false }
}

export interface SidecarRun { code: number | null; result: Any; stdout: string; stderr: string }

/**
 * Sidecar'ı (autoreji-sidecar) çalıştır. cli.py sözleşmesi:
 *  stdout = SONUÇ JSON (son satır)   stderr = ilerleme JSON satırları + log.
 * onEvent: stderr'den ayrıştırılan her JSON olay (örn {event:"progress",done,total,msg}).
 */
export async function runSidecar(
  args: string[],
  stdin?: string,
  onEvent?: (ev: Any) => void,
): Promise<SidecarRun> {
  const { Command } = await import('@tauri-apps/plugin-shell')
  const command = Command.sidecar('binaries/autoreji-sidecar', args)
  let stdout = ''
  let stderr = ''
  // Dinleyiciler spawn'dan ÖNCE bağlanır (anında biten süreçte 'close' kaçmasın).
  const done = new Promise<number | null>((resolve) => {
    command.stdout.on('data', (line: string) => { stdout += line })
    command.stderr.on('data', (line: string) => {
      stderr += line
      if (!onEvent) return
      for (const raw of String(line).split('\n')) {
        const s = raw.trim()
        if (!s) continue
        try { onEvent(JSON.parse(s)) } catch { onEvent({ event: 'log', msg: s }) }
      }
    })
    command.on('close', (d: { code: number | null }) => resolve(d?.code ?? null))
    command.on('error', () => resolve(-1))
  })
  const child = await command.spawn()
  if (stdin) { try { await child.write(stdin + '\n') } catch { /* yut */ } }
  const code = await done
  // stdout'un SON JSON satırı = sonuç (cli.py result satırı)
  let result: Any = null
  const lines = stdout.split('\n').map((l) => l.trim()).filter(Boolean)
  for (let i = lines.length - 1; i >= 0; i--) {
    try { result = JSON.parse(lines[i]); break } catch { /* devam */ }
  }
  return { code, result, stdout, stderr }
}

/** Dosya seç (tek). filters: [{name, extensions}]. İptal → null. */
export async function pickFile(filters?: { name: string; extensions: string[] }[]): Promise<string | null> {
  const { open } = await import('@tauri-apps/plugin-dialog')
  const sel = await open({ multiple: false, directory: false, filters })
  return typeof sel === 'string' ? sel : null
}

/** Klasör seç. İptal → null. */
export async function pickFolder(): Promise<string | null> {
  const { open } = await import('@tauri-apps/plugin-dialog')
  const sel = await open({ multiple: false, directory: true })
  return typeof sel === 'string' ? sel : null
}

/** fs: yol var mı? (capabilities $HOME/** kapsamında). */
export async function pathExists(path: string): Promise<boolean> {
  try { const { exists } = await import('@tauri-apps/plugin-fs'); return await exists(path) } catch { return false }
}

/** Geçerli home dizini ($HOME). */
export async function homeDir(): Promise<string | null> {
  try { const { homeDir: hd } = await import('@tauri-apps/api/path'); return await hd() } catch { return null }
}

/** Komutu spawn et + satır satır canlı akıt (ilerleme için). Dönüş = exit kodu. */
export async function streamCommand(
  name: string,
  args: string[],
  onLine: (line: string, stream: 'stdout' | 'stderr') => void,
): Promise<number | null> {
  const { Command } = await import('@tauri-apps/plugin-shell')
  const command = Command.create(name, args)
  const done = new Promise<number | null>((resolve) => {
    command.stdout.on('data', (l: string) => onLine(l, 'stdout'))
    command.stderr.on('data', (l: string) => onLine(l, 'stderr'))
    command.on('close', (d: { code: number | null }) => resolve(d?.code ?? null))
    command.on('error', () => resolve(-1))
  })
  await command.spawn()
  return done
}

/** Bayt dizisini dosyaya yaz (capabilities fs:allow-write-file $HOME/** kapsamında). */
export async function writeBytes(path: string, bytes: Uint8Array): Promise<boolean> {
  try { const { writeFile } = await import('@tauri-apps/plugin-fs'); await writeFile(path, bytes); return true } catch { return false }
}

/** Metni dosyaya yaz. */
export async function writeText(path: string, text: string): Promise<boolean> {
  try { const { writeTextFile } = await import('@tauri-apps/plugin-fs'); await writeTextFile(path, text); return true } catch { return false }
}

/** Metin dosyasını oku (capabilities $HOME/** kapsamında). Yoksa null. */
export async function readText(path: string): Promise<string | null> {
  try { const { readTextFile } = await import('@tauri-apps/plugin-fs'); return await readTextFile(path) } catch { return null }
}

/** Dosya/klasörü sistemin varsayılan uygulamasıyla aç (örn. .ccx → Creative Cloud). */
export async function openPathNative(path: string): Promise<boolean> {
  try { const { openPath } = await import('@tauri-apps/plugin-opener'); await openPath(path); return true } catch { return false }
}

/** Klasör/dosyayı sil (recursive). capabilities fs:allow-remove $HOME/** kapsamında. */
export async function removePath(path: string): Promise<boolean> {
  try { const { remove } = await import('@tauri-apps/plugin-fs'); await remove(path, { recursive: true }); return true } catch { return false }
}

export { tauriAvailable }
