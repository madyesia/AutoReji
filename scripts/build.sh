#!/usr/bin/env bash
# AutoReji — üretim .app paketle (sidecar → web → Tauri bundle) + ad-hoc imza doğrula.
#
# Akış:
#   1) Sidecar binary'yi üret + ad-hoc imzala (build_sidecar.sh).
#   2) web UI prod build (npm run build → brain/dist) — temiz olmalı.
#   3) Tauri 2 bundle (npm run tauri build --target aarch64-apple-darwin) →
#        .app (içinde sidecar gömülü, target-triple soneki SOYULMUŞ) + ad-hoc imza
#        (tauri.conf.json bundle.macOS.signingIdentity = "-").
#   4) Çıktı .app'i bul → codesign --verify ile imzayı DOĞRULA + sidecar imzasını DOĞRULA.
#   5) spctl + Gatekeeper notu (ad-hoc → kullanıcı ilk açılışta "yine de aç").
#
# İdempotent/toleranslı. Kullanım:  bash scripts/build.sh  [--skip-sidecar]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BRAIN="$ROOT/brain"
SRC_TAURI="$BRAIN/src-tauri"
TRIPLE="aarch64-apple-darwin"
SIDECAR_BIN="$SRC_TAURI/binaries/autoreji-sidecar-${TRIPLE}"
SKIP_SIDECAR=0
[ "${1:-}" = "--skip-sidecar" ] && SKIP_SIDECAR=1

say()  { printf '\033[1;36m▸ %s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m✓ %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m! %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

[ -d "$BRAIN/node_modules" ] || die "brain bağımlılıkları yok — önce: bash scripts/setup.sh"

# ── 1) Sidecar ──────────────────────────────────────────────────────────────
if [ "$SKIP_SIDECAR" = "1" ] && [ -x "$SIDECAR_BIN" ]; then
  ok "Sidecar üretimi atlandı (mevcut: $SIDECAR_BIN)"
else
  say "1/5 — Sidecar üretiliyor + imzalanıyor…"
  bash "$ROOT/scripts/build_sidecar.sh" || die "sidecar üretimi başarısız"
fi
[ -x "$SIDECAR_BIN" ] || die "sidecar binary yok: $SIDECAR_BIN"

# ── 2) Web UI prod build (temiz olmalı) ─────────────────────────────────────
say "2/5 — web UI prod build (tsc + vite)…"
( cd "$BRAIN" && npm run build ) || die "web build başarısız — TypeScript/Vite hatası düzelt"
[ -d "$BRAIN/dist" ] || die "brain/dist üretilmedi"
ok "web build temiz → brain/dist"

# ── 3) src-tauri scaffold kontrolü ──────────────────────────────────────────
if [ ! -f "$SRC_TAURI/tauri.conf.json" ]; then
  die "src-tauri/ scaffold yok ($SRC_TAURI/tauri.conf.json).
    Tauri 2 kabuğu henüz kurulmadı → .app paketlenemez.
    (Sidecar + web build hazır; scaffold sonrası bu script .app üretir.)"
fi

# ── 4) Tauri 2 bundle (.app) — ad-hoc imza tauri.conf.json'da ───────────────
say "3/5 — Tauri 2 bundle (.app) derleniyor [--target $TRIPLE]…"
say "İlk Rust derlemesi uzun sürer."
( cd "$BRAIN" && npm run tauri build -- --target "$TRIPLE" ) || die "tauri build başarısız"

# ── 5) Çıktı .app'i bul ─────────────────────────────────────────────────────
BUNDLE_DIR="$SRC_TAURI/target/${TRIPLE}/release/bundle/macos"
[ -d "$BUNDLE_DIR" ] || BUNDLE_DIR="$SRC_TAURI/target/release/bundle/macos"  # target'sız fallback
APP="$(/bin/ls -dt "$BUNDLE_DIR"/*.app 2>/dev/null | head -1 || true)"
[ -n "$APP" ] && [ -d "$APP" ] || die "üretilen .app bulunamadı ($BUNDLE_DIR)"
ok "Paket: $APP"

# ── 6) İmza DOĞRULAMA (.app + gömülü sidecar) ───────────────────────────────
say "4/5 — imza doğrulanıyor (.app + gömülü sidecar)…"
codesign --verify --deep --strict --verbose=2 "$APP" 2>&1 | sed 's/^/    /' \
  || die ".app imza doğrulaması BAŞARISIZ"
ok ".app imzası geçerli (ad-hoc)"

# Gömülü sidecar (soneki SOYULMUŞ ad: autoreji-sidecar) imzalı mı?
EMB_SIDECAR="$(find "$APP/Contents" -type f -name 'autoreji-sidecar*' 2>/dev/null | head -1 || true)"
if [ -n "$EMB_SIDECAR" ]; then
  codesign --verify --verbose=2 "$EMB_SIDECAR" 2>&1 | sed 's/^/    /' \
    && ok "gömülü sidecar imzalı: $(basename "$EMB_SIDECAR")" \
    || warn "gömülü sidecar imza doğrulaması zayıf — Tauri yeniden imzalamış olabilir"
else
  warn "gömülü sidecar .app içinde bulunamadı (externalBin tauri.conf.json'da mı?)"
fi

# ── 7) Gatekeeper / spctl notu ──────────────────────────────────────────────
say "5/5 — Gatekeeper durumu (ad-hoc imza notu)…"
spctl --assess --type execute --verbose=2 "$APP" 2>&1 | sed 's/^/    /' || true
echo
ok "BUILD TAMAM → $APP"
warn "Ad-hoc imza: ilk açılışta macOS uyarır. Kullanıcı: Sağ tık → Aç → 'Aç'."
warn "Veya: xattr -dr com.apple.quarantine \"$APP\"  (karantinayı kaldır)."
