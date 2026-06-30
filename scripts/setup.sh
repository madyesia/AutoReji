#!/usr/bin/env bash
# AutoReji — geliştirme/derleme ortamını kur (idempotent, hata-toleranslı).
#
# Kapsam (hepsi varsa atlar; eksikse kurar):
#   • Homebrew araçları: ffmpeg/ffprobe (sidecar runtime), ollama (yerel görsel-AI).
#   • Rust/cargo + Node/npm: KONTROL eder (yoksa net talimat verir; bu makinede kurulu).
#   • brain/ Node bağımlılıkları: npm ci/install (Tauri CLI + pluginler burada dev-dep).
#   • Python sidecar venv (.venv-sidecar) + PyInstaller: yoksa kurar.
#       ⚠ Sistem python3 = 3.14 (çok yeni). venv kanonik olarak 3.13 kullanır
#         (PyInstaller 3.14'te henüz tam oturmamış olabilir). Mevcut .venv-sidecar
#         3.13 ise korunur; yoksa python3.13 → python3 sırasıyla denenir.
#   • ollama modeli: scripts/fetch_models.sh'e devreder (ayrı, büyük indirme).
#
# Kullanım:  bash scripts/setup.sh  [--with-models]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENV="$ROOT/.venv-sidecar"
BRAIN="$ROOT/brain"
WITH_MODELS=0
[ "${1:-}" = "--with-models" ] && WITH_MODELS=1

say()  { printf '\033[1;36m▸ %s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m✓ %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m! %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }
have() { command -v "$1" >/dev/null 2>&1; }

# ── 0) Temel kontroller ─────────────────────────────────────────────────────
[ "$(uname -s)" = "Darwin" ] || warn "macOS dışı sistem — bazı adımlar (codesign/.app) atlanır"
[ "$(uname -m)" = "arm64" ]  || warn "Apple Silicon (arm64) bekleniyor — target triple aarch64-apple-darwin"

# ── 1) Homebrew ─────────────────────────────────────────────────────────────
if ! have brew; then
  die "Homebrew yok. Kur:  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
fi
ok "Homebrew: $(brew --prefix)"

# ── 2) ffmpeg/ffprobe (sidecar runtime'da çağırır) ──────────────────────────
if have ffmpeg && have ffprobe; then
  ok "ffmpeg/ffprobe: kurulu ($(ffmpeg -version 2>/dev/null | head -1 | awk '{print $3}'))"
else
  say "ffmpeg kuruluyor (brew)…"
  brew install ffmpeg || die "ffmpeg kurulamadı"
  ok "ffmpeg kuruldu"
fi

# ── 3) ollama (yerel görsel-AI; model fetch_models.sh'te) ───────────────────
if have ollama; then
  ok "ollama: kurulu ($(ollama --version 2>/dev/null | head -1))"
else
  say "ollama kuruluyor (brew)…"
  brew install ollama || warn "ollama kurulamadı — görsel-AI olmadan da kurgu çalışır (opsiyonel sinyal)"
fi

# ── 4) Rust / cargo (Tauri backend derler) — KONTROL ───────────────────────
if have cargo && have rustc; then
  ok "Rust: $(rustc --version 2>/dev/null)"
else
  die "Rust yok. Kur:  brew install rust   (veya rustup: https://rustup.rs)"
fi

# ── 5) Node / npm (web UI + Tauri CLI) — KONTROL ────────────────────────────
if have node && have npm; then
  ok "Node: $(node --version)  npm: $(npm --version)"
else
  die "Node/npm yok. Kur:  brew install node"
fi

# ── 6) brain/ Node bağımlılıkları (Tauri CLI + pluginler dev-dep) ───────────
if [ -d "$BRAIN/node_modules" ] && [ -f "$BRAIN/node_modules/.bin/tauri" ]; then
  ok "brain bağımlılıkları: kurulu (Tauri CLI mevcut)"
else
  say "brain/ npm bağımlılıkları kuruluyor…"
  if [ -f "$BRAIN/package-lock.json" ]; then
    ( cd "$BRAIN" && npm ci ) || ( cd "$BRAIN" && npm install ) || die "npm install başarısız"
  else
    ( cd "$BRAIN" && npm install ) || die "npm install başarısız"
  fi
  ok "brain bağımlılıkları kuruldu"
fi
# Tauri CLI sürümünü göster (v2 doğrula)
TAURI_VER="$( ( cd "$BRAIN" && npx --no-install tauri --version 2>/dev/null ) || echo '?')"
case "$TAURI_VER" in
  *2.*) ok "Tauri CLI: $TAURI_VER (v2 ✓)";;
  *)    warn "Tauri CLI sürümü belirsiz/v2 değil: $TAURI_VER — package.json @tauri-apps/cli ^2 olmalı";;
esac

# ── 7) Python sidecar venv (.venv-sidecar) + PyInstaller ────────────────────
pick_python() {
  for c in python3.13 python3.12 python3.11 python3; do
    if have "$c"; then echo "$c"; return 0; fi
  done
  return 1
}
if [ -x "$VENV/bin/python" ]; then
  PYV="$("$VENV/bin/python" --version 2>&1 | awk '{print $2}')"
  ok "sidecar venv: var (Python $PYV)"
else
  PYBIN="$(pick_python)" || die "python3 bulunamadı"
  say "sidecar venv kuruluyor ($PYBIN → $VENV)…"
  "$PYBIN" -m venv "$VENV" || die "venv oluşturulamadı"
  ok "venv oluşturuldu ($("$VENV/bin/python" --version 2>&1))"
fi
# PyInstaller venv'de mi?
if "$VENV/bin/python" -c "import PyInstaller" 2>/dev/null; then
  ok "PyInstaller: kurulu ($("$VENV/bin/python" -c 'import PyInstaller as p;print(p.__version__)'))"
else
  say "PyInstaller venv'e kuruluyor…"
  "$VENV/bin/python" -m pip install --quiet --upgrade pip || warn "pip güncellenemedi (devam)"
  "$VENV/bin/python" -m pip install --quiet pyinstaller || die "PyInstaller kurulamadı"
  ok "PyInstaller kuruldu ($("$VENV/bin/python" -c 'import PyInstaller as p;print(p.__version__)'))"
fi
# sidecar SAF stdlib → ek pip paketi YOK. tomllib (config.toml) Py 3.11+ stdlib'inde.
"$VENV/bin/python" -c "import tomllib" 2>/dev/null \
  && ok "tomllib (config.toml okuyucu): mevcut" \
  || warn "tomllib yok — venv Python < 3.11? config.toml okunamaz, kod-varsayılanları kullanılır"

# ── 8) Modeller (opsiyonel, büyük) ──────────────────────────────────────────
if [ "$WITH_MODELS" = "1" ]; then
  say "Modeller indiriliyor (fetch_models.sh)…"
  bash "$ROOT/scripts/fetch_models.sh" || warn "model indirme başarısız (sonra: scripts/fetch_models.sh)"
else
  warn "Model indirme atlandı. Görsel-AI için:  bash scripts/fetch_models.sh   (~6 GB)"
fi

echo
ok "Kurulum TAMAM. Sıradaki:"
echo "    • Geliştirme:  bash scripts/dev.sh"
echo "    • Sidecar:     bash scripts/build_sidecar.sh"
echo "    • Paket .app:  bash scripts/build.sh"
