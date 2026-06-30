#!/usr/bin/env bash
# AutoReji — geliştirme modunda çalıştır (Tauri 2 dev: Rust backend + Vite HMR).
#
# `tauri dev` Vite dev sunucusunu (5173) açar, Rust kabuğunu derler ve native
#   pencerede yükler. Sidecar dev'de target-triple SONEKLİ adla aranır
#   (autoreji-sidecar-aarch64-apple-darwin) → build_sidecar.sh çıktısı zaten doğru ad.
#
# İdempotent/toleranslı: src-tauri yoksa net talimat; sidecar yoksa otomatik üretir.
# Kullanım:  bash scripts/dev.sh  [--web]     (--web → yalnız Vite, Tauri'siz tarayıcı)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BRAIN="$ROOT/brain"
SRC_TAURI="$BRAIN/src-tauri"
TRIPLE="aarch64-apple-darwin"
SIDECAR_BIN="$SRC_TAURI/binaries/autoreji-sidecar-${TRIPLE}"

say()  { printf '\033[1;36m▸ %s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m✓ %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m! %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

[ -d "$BRAIN/node_modules" ] || die "brain bağımlılıkları yok — önce: bash scripts/setup.sh"

# --web: Tauri olmadan saf web (tarayıcı) — native köprü fallback'lerini test etmek için
if [ "${1:-}" = "--web" ]; then
  say "Web (Tauri'siz) dev sunucusu → http://localhost:5173"
  exec sh -c "cd '$BRAIN' && npm run dev"
fi

# src-tauri scaffold var mı?
if [ ! -f "$SRC_TAURI/tauri.conf.json" ]; then
  die "src-tauri/ scaffold yok ($SRC_TAURI/tauri.conf.json).
    Tauri 2 kabuğu henüz kurulmadı. Scaffold sonrası bu script çalışır.
    Şimdilik web UI için:  bash scripts/dev.sh --web"
fi

# Sidecar binary dev için hazır mı? (Tauri externalBin dev'de bu adı arar)
if [ ! -x "$SIDECAR_BIN" ]; then
  warn "Sidecar binary yok ($SIDECAR_BIN) — şimdi üretiliyor…"
  bash "$ROOT/scripts/build_sidecar.sh" || die "sidecar üretilemedi"
else
  ok "Sidecar binary: hazır"
fi

say "Tauri 2 dev başlıyor (Rust derlenir → native pencere + Vite HMR)…"
say "İlk derleme uzun sürebilir; sonraki çalıştırmalar hızlıdır."
exec sh -c "cd '$BRAIN' && npm run tauri dev"
