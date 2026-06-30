#!/usr/bin/env bash
# AutoReji — Python sidecar'ı tek-dosya binary'ye derle (PyInstaller) + ad-hoc imzala.
#
# ÇIKTI: brain/src-tauri/binaries/autoreji-sidecar-aarch64-apple-darwin
#   Tauri 2 `externalBin` bu adı (target-triple sonekli) bekler; üretim .app'inde
#   soneki SOYULUR → Command.sidecar('binaries/autoreji-sidecar') ile çağrılır.
#
# Tasarım:
#   • TEK GİRİŞ: sidecar/cli.py (dispatcher). Kardeş modüller hidden-import + pathex ile gelir.
#   • config.toml gömülür (_MEIPASS/config/) + runtime-hook decide.CONFIG_PATH'i düzeltir.
#   • SAF stdlib (torch/numpy/cv2 YOK) → küçük binary; ffmpeg/ffprobe RUNTIME'da sistemden
#     bulunur (gömülmez) — sidecar yalnız subprocess ile çağırır.
#   • Ad-hoc imza (codesign -s -): ücretsiz, Apple Silicon'da çalıştırma için yeterli.
#   • İdempotent + hata-toleranslı: tekrar çalıştırılınca temiz yeniden üretir.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENV="$ROOT/.venv-sidecar"
SIDECAR="$ROOT/sidecar"
CONFIG_TOML="$ROOT/config/config.toml"
RTHOOK="$ROOT/scripts/pyi_rthook_config.py"
TARGET_TRIPLE="aarch64-apple-darwin"
BIN_NAME="autoreji-sidecar"
OUT_DIR="$ROOT/brain/src-tauri/binaries"
WORK="$ROOT/.venv-sidecar/.pyi-build"   # PyInstaller ara çıktıları (gitignore'da .venv altında)
FINAL="$OUT_DIR/${BIN_NAME}-${TARGET_TRIPLE}"

say()  { printf '\033[1;36m▸ %s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m✓ %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m! %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

# ── Ön koşullar ─────────────────────────────────────────────────────────────
[ -d "$VENV" ] || die "venv yok: $VENV  (önce: scripts/setup.sh)"
PY="$VENV/bin/python"
[ -x "$PY" ]   || die "venv python yok: $PY  (önce: scripts/setup.sh)"
[ -f "$SIDECAR/cli.py" ] || die "sidecar girişi yok: $SIDECAR/cli.py"
"$PY" -c "import PyInstaller" 2>/dev/null || die "PyInstaller venv'de yok  (önce: scripts/setup.sh)"
[ -f "$CONFIG_TOML" ] || warn "config.toml yok ($CONFIG_TOML) — sidecar kod-varsayılanlarına düşer"

say "Sidecar derleniyor → ${BIN_NAME}-${TARGET_TRIPLE}"
say "Python: $("$PY" --version 2>&1)   PyInstaller: $("$PY" -c 'import PyInstaller as p; print(p.__version__)')"

mkdir -p "$OUT_DIR" "$WORK"

# ── Önceki çıktıyı temizle (idempotent) ─────────────────────────────────────
rm -f "$FINAL"
rm -rf "$WORK/build" "$WORK/dist"

# ── Kardeş modüller → hidden-import (cli.py bunları ada-göre import eder) ────
HIDDEN=()
for m in parser match decide trim build_manifest analyze_video vlm_scene detect_crop; do
  [ -f "$SIDECAR/$m.py" ] && HIDDEN+=( --hidden-import "$m" )
done
# tomllib (Py 3.11+ stdlib; decide.from_toml kullanır) garanti gelsin
HIDDEN+=( --hidden-import tomllib )

# ── config.toml'u _MEIPASS/config/ altına göm (macOS ayraç ':') ─────────────
DATA_ARGS=()
[ -f "$CONFIG_TOML" ] && DATA_ARGS+=( --add-data "$CONFIG_TOML:config" )

# ── runtime-hook (config.toml yol düzeltmesi) ───────────────────────────────
HOOK_ARGS=()
[ -f "$RTHOOK" ] && HOOK_ARGS+=( --runtime-hook "$RTHOOK" )

# ── PyInstaller (onefile, konsol, UPX yok → imza güvenli) ───────────────────
say "PyInstaller çalışıyor…"
"$PY" -m PyInstaller \
  --onefile \
  --name "$BIN_NAME" \
  --console \
  --noconfirm \
  --clean \
  --noupx \
  --distpath "$WORK/dist" \
  --workpath "$WORK/build" \
  --specpath "$WORK" \
  --paths "$SIDECAR" \
  "${HIDDEN[@]}" \
  "${DATA_ARGS[@]}" \
  "${HOOK_ARGS[@]}" \
  "$SIDECAR/cli.py"

BUILT="$WORK/dist/$BIN_NAME"
[ -f "$BUILT" ] || die "PyInstaller çıktı vermedi: $BUILT"

# ── Target-triple sonekli ada taşı (Tauri externalBin sözleşmesi) ──────────
mv -f "$BUILT" "$FINAL"
chmod +x "$FINAL"
ok "Binary: $FINAL  ($(du -h "$FINAL" | cut -f1))"

# ── Ad-hoc imza (ücretsiz) — Apple Silicon'da çalıştırmak için ──────────────
say "Ad-hoc imzalanıyor (codesign -s -)…"
codesign --force --sign - --timestamp=none "$FINAL" \
  || die "codesign başarısız"
codesign --verify --verbose=2 "$FINAL" 2>&1 | sed 's/^/    /'
ok "İmza doğrulandı (ad-hoc)"

# ── Duman testi: frozen binary gerçekten koşuyor mu? (ping) ─────────────────
say "Duman testi: ping…"
PING_OUT="$("$FINAL" ping 2>/dev/null || true)"
echo "    $PING_OUT"
echo "$PING_OUT" | grep -q '"ok": true' || die "ping başarısız — binary çalışmıyor"
echo "$PING_OUT" | grep -q '"frozen": true' || warn "frozen:true beklenirdi (binary frozen değil?)"
ok "Sidecar binary canlı ve frozen."

# ── config.toml gömme kanıtı: içerik binary'de mi? ──────────────────────────
# (Davranışsal kanıt: AUTOREJI_CONFIG override'lı çalıştırma config_hash'i değiştirir —
#  bu manuel olarak doğrulandı. Burada hızlı duman: config dizesi binary'de gömülü mü.)
if [ -f "$CONFIG_TOML" ]; then
  say "config.toml gömme kanıtı…"
  if strings "$FINAL" 2>/dev/null | grep -q "sim_block_thresh"; then
    ok "config.toml binary'de gömülü; runtime-hook frozen'da decide.CONFIG_PATH'i düzeltir."
  else
    warn "config dizesi binary'de görünmedi (onefile sıkıştırması olabilir) — davranışsal test asıldır."
  fi
fi

ok "build_sidecar TAMAM → $FINAL"
