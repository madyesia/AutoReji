#!/usr/bin/env bash
# AutoReji — MONTAJCI (UXP paneli) .ccx paketleyici.
#
# NOT: Adobe'nin GARANTİLİ paketleyicisi UXP Developer Tool (UDT) GUI'sidir
#   (plugin satırı → ••• → Package). CLI/otomatik pack güvenilmez (topluluk doğruladı).
# Bu script .ccx'i panel/ içeriğinden ZIP olarak üretir (.ccx imzasız bir zip'tir),
#   brain/public/plugin/ altına gömer ve sha256/boyut meta'sını yazar.
# Üretim (satış) sürümünü İDEAL olarak UDT ile üret (aynı dosya adı) → bu çıktının yerine koy.
# Şimdilik bu zip; çift-tıkla Creative Cloud Desktop kurulumu + uygulama içi indirme akışı için yeterli.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PANEL="$ROOT/panel"
OUT_DIR="$ROOT/brain/public/plugin"
CCX="$OUT_DIR/com.autoreji.derisk_premierepro.ccx"
mkdir -p "$OUT_DIR"

# manifest doğrula (production .ccx kuralları)
node -e "const m=require('$PANEL/manifest.json'); if(m.id!=='com.autoreji.derisk') throw new Error('id beklenmiyor'); if(Array.isArray(m.host)) throw new Error('host tek obje olmalı'); if(m.manifestVersion!==5) throw new Error('manifestVersion 5 olmalı'); console.log('manifest OK:', m.id, 'v'+m.version)"

rm -f "$CCX"
( cd "$PANEL" && zip -rqX "$CCX" . -x '*.DS_Store' '.*' )

SIZE=$(stat -f%z "$CCX" 2>/dev/null || stat -c%s "$CCX")
SHA=$(shasum -a 256 "$CCX" | cut -d' ' -f1)
VER=$(node -e "console.log(require('$PANEL/manifest.json').version)")
BUILT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
cat > "$OUT_DIR/manifest.meta.json" <<EOF
{
  "ccxFile": "com.autoreji.derisk_premierepro.ccx",
  "pluginId": "com.autoreji.derisk",
  "version": "$VER",
  "sizeBytes": $SIZE,
  "sha256": "$SHA",
  "builtAt": "$BUILT"
}
EOF
echo "✓ .ccx üretildi: $CCX ($SIZE bayt) · sha256 ${SHA:0:16}…"
echo "  İDEAL: üretim sürümünü UDT GUI ile üret (aynı ad) → bunun yerine koy."
