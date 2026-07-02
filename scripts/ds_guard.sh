#!/usr/bin/env bash
# Tasarım Sistemi 2.0 koruma kontrolleri (docs/tasarim/spec-tokenlar.md §8)
# Kullanım: bash scripts/ds_guard.sh  → ihlal varsa listeler, çıkış kodu 1.
set -u
SRC="$(cd "$(dirname "$0")/.." && pwd)/brain/src"
fail=0
chk() { # $1 açıklama, $2 aranan desen, $3 muaf-tutma deseni (boş olabilir)
  local out
  out=$(grep -rnE "$2" --include='*.ts' --include='*.tsx' "$SRC" 2>/dev/null)
  if [ -n "${3:-}" ] && [ -n "$out" ]; then out=$(printf '%s\n' "$out" | grep -vE "$3"); fi
  if [ -n "$out" ]; then printf '✗ %s\n%s\n' "$1" "$out"; fail=1; else printf '✓ %s\n' "$1"; fi
}
chk "text-[Npx] yok (9 adlı adım kullan)"            'text-\[[0-9]'                              ''
chk "shadow-[ yok (soft/raised/pop/glow-sm/glow-lg)" 'shadow-\['                                 'var\(--color-danger\)'
chk "ham hex yok (yalnız @theme)"                    "#[0-9a-fA-F]{6}"                           'RainCanvas.tsx|// '
chk "disabled yalnız opacity-60"                     'disabled:opacity-(10|20|25|30|40|50)'      ''
exit $fail
