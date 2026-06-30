#!/usr/bin/env bash
# AutoReji — yerel görsel-AI modelini indir (ollama pull). İlk kurulum indirmesi.
#
# Model: qwen2.5vl:7b (~6 GB, Q4) — sidecar/vlm_scene.py kurgu sinyali (energy/role/
#   mood/linger) için. .app'e GÖMÜLMEZ (şişmesin) → ilk açılışta/bu script ile çekilir.
#   Çalışma anında ücretli/harici AI YOK; bu tamamen yerel (ollama) kalır.
#
# İdempotent: model zaten varsa atlar. ollama daemon kapalıysa geçici başlatır.
# Kullanım:  bash scripts/fetch_models.sh  [--model qwen2.5vl:7b] [--also-3b]
set -euo pipefail

MODEL="qwen2.5vl:7b"   # setup.ts MODEL.tag ile senkron; vlm_scene.py MODEL varsayılanı
ALSO_3B=0
while [ $# -gt 0 ]; do
  case "$1" in
    --model) MODEL="${2:-$MODEL}"; shift 2;;
    --also-3b) ALSO_3B=1; shift;;
    *) shift;;
  esac
done
OLLAMA_HOST_URL="${OLLAMA_URL:-http://127.0.0.1:11434}"

say()  { printf '\033[1;36m▸ %s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m✓ %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m! %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }
have() { command -v "$1" >/dev/null 2>&1; }

have ollama || die "ollama yok. Kur:  brew install ollama   (veya: bash scripts/setup.sh)"

# ── ollama daemon canlı mı? Değilse geçici başlat ───────────────────────────
SERVER_PID=""
cleanup() { [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null || true; }
trap cleanup EXIT

if curl -fsS --max-time 3 "$OLLAMA_HOST_URL/api/version" >/dev/null 2>&1; then
  ok "ollama çalışıyor ($OLLAMA_HOST_URL)"
else
  say "ollama daemon kapalı — geçici başlatılıyor (ollama serve)…"
  ollama serve >/dev/null 2>&1 &
  SERVER_PID=$!
  # hazır olana dek bekle (≤30 sn)
  for _ in $(seq 1 30); do
    if curl -fsS --max-time 2 "$OLLAMA_HOST_URL/api/version" >/dev/null 2>&1; then break; fi
    sleep 1
  done
  curl -fsS --max-time 2 "$OLLAMA_HOST_URL/api/version" >/dev/null 2>&1 \
    && ok "ollama başlatıldı (pid $SERVER_PID)" \
    || die "ollama başlatılamadı. Elle:  brew services start ollama"
fi

# ── Model zaten var mı? ─────────────────────────────────────────────────────
pull_one() {
  local m="$1"
  if ollama list 2>/dev/null | awk '{print $1}' | grep -qx "$m"; then
    ok "model zaten var: $m (atlandı)"
    return 0
  fi
  say "model indiriliyor: $m  (büyük — sürebilir)…"
  ollama pull "$m" || die "model indirilemedi: $m"
  ollama list 2>/dev/null | awk '{print $1}' | grep -qx "$m" \
    && ok "model hazır: $m" \
    || die "indirme sonrası model görünmüyor: $m"
}

pull_one "$MODEL"
[ "$ALSO_3B" = "1" ] && pull_one "qwen2.5vl:3b"

echo
ok "Modeller hazır."
ollama list 2>/dev/null | sed 's/^/    /'
warn "Not: ollama'yı kalıcı çalıştırmak için:  brew services start ollama"
