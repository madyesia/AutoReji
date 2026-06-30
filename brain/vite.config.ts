import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { rmSync } from 'node:fs'
import { resolve } from 'node:path'

// AutoReji BEYİN — web UI, Tauri 2 ile sarılır. Tamamen offline çalışır.
const host = process.env.TAURI_DEV_HOST

// Geliştirme-içi mock fixture'ları (örnek Bölüm 2: episode.json + 160 thumbnail + 160 sprite ≈ 18 MB)
// SADECE tarayıcı önizlemesi içindir → paketlenmiş .app'e GİRMEMELİ (sabit/yanlış örnek veri + şişkinlik).
// public/'te kalır (dev server servis eder), yalnız prod build çıktısından (dist/) silinir.
// Gerçek .app kendi bölümünü sidecar pipeline'dan üretir; önizlemeler gerçek video karelerinden gelir.
function stripDevFixtures(): Plugin {
  return {
    name: 'autoreji-strip-dev-fixtures',
    apply: 'build',
    closeBundle() {
      for (const p of ['episode.json', 'thumbs', 'sprites']) {
        rmSync(resolve(import.meta.dirname, 'dist', p), { recursive: true, force: true })
      }
    },
  }
}

// https://vite.dev/config/  +  https://v2.tauri.app/start/frontend/vite/
export default defineConfig({
  plugins: [react(), tailwindcss(), stripDevFixtures()],
  // Tauri: Rust derleme loglarını ezme; ortam değişkeni öneki
  clearScreen: false,
  envPrefix: ['VITE_', 'TAURI_ENV_'],
  server: {
    // Tauri devUrl ile birebir eşleşmesi için SABİT port
    port: 5173,
    strictPort: true,
    host: host || true,
    hmr: host ? { protocol: 'ws', host, port: 5174 } : undefined,
    // gerçek video önizlemesi: REF/ klipleri /@fs ile servis et (proje kökü = AutoReji)
    fs: { allow: ['..'] },
  },
  // NOT: Vite 8 (Oxc/Rolldown) varsayılan minify'ı kullanır — `minify:'esbuild'`/`target` ZORLAMA
  // (ayrı esbuild paketi ister, build'i kırar). Varsayılan build modern WebKit için uygundur.
  build: {
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
})
