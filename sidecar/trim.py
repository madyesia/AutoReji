#!/usr/bin/env python3
"""AutoReji — kırpma (§8 + §9.5 #1/#2).

Her klip için kaynak in/out noktası:
- düzensiz ~1s baş + ~1s son (asla tam 1.000),
- **geçiş tutamağı (handle):** komşu geçişin her iki yanında ≥ T/2 + marj malzeme,
- **rejim/ölçek modülasyonu:** iç/uyku + kuruluş/drone uzun tut; dış + yakın/aksiyon kısa.
"""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from decide import seeded, clamp  # noqa: E402


FPS = 24
MOTION_CALM = 1.5    # analyze_video "motion" bunun altı = sakin
MOTION_BUSY = 4.0    # bunun üstü = hareketli


def _avoid_exact_one(x: float) -> float:
    # "asla tam 1.000 sn" (§8)
    return x + 0.03 if abs(x - 1.0) < 0.004 else x


def _frame_align(t: float) -> float:
    # in/out tam kare sınırına otur → klip uzunlukları tam sayı kare → boşluksuz dizim
    return round(round(t * FPS) / FPS, 5)


def compute_trim(i: int, merged, decisions, cfg, n: int, analysis=None):
    """→ (in_pt, out_pt, source_dur). decisions[i] = bu klibe GELEN geçiş; decisions[i+1] = GİDEN."""
    s = merged[i]["prompt"]
    c = merged[i]["chosen"] or {}
    dur = (c.get("_probe") or {}).get("dur") or cfg.source_dur
    sc = s.scene

    # ── HEDEF TUTULAN SÜRE modeli (KULLANICI: hiçbir klip < KEEP_MIN; bazıları ~KEEP_MAX ≈ 7s) ──
    # AI-üretim artefaktı: baş ~HEAD_MIN + son ~TAIL_MIN (baştan BÜYÜK) HER ZAMAN kesilir; tutulmayan/çevik
    # klipler kuyruktan daha çok kırpılır ama ASLA KEEP_MIN altına inmez. Çok kısaltma yok — aralık ~4.30–6.8s.
    KEEP_MIN = 4.30                                       # KULLANICI kuralı: hiçbir klip bunun altında olmasın
    HEAD_MIN = 0.5                                        # AI-üretim bozuk ilk ~0.5s her zaman kesilir
    TAIL_MIN = getattr(cfg, "tail_min", 0.7)             # AI-üretim kuyruk artefaktı; baştan BÜYÜK
    KEEP_MAX = max(KEEP_MIN, dur - HEAD_MIN - TAIL_MIN)  # en uzun klip ≈ 6.8s (bazıları ~7s)

    av = (analysis or {}).get(sc) or {}
    energy, role, linger, motion = av.get("energy"), av.get("role"), av.get("linger"), av.get("motion")

    def _mot5(m):  # motion (≈0-8) → 1-5 ölçeği (motion_calm→~1, motion_busy→~5)
        span = max(0.5, MOTION_BUSY - MOTION_CALM)
        return clamp(1.0 + 4.0 * (m - MOTION_CALM) / span, 1.0, 5.0)

    intensity = None  # energy (VLM 1-5) + motion (ölçülen) TEK "yoğunluk" sinyali (çift sayma yok)
    if energy is not None and motion is not None:
        intensity = 0.6 * float(energy) + 0.4 * _mot5(motion)
    elif energy is not None:
        intensity = float(energy)
    elif motion is not None:
        intensity = _mot5(motion)

    # "hold" skoru: +1 = uzun tut (linger/sakin/manzara/iç) · -1 = kısa/çevik (aksiyon/yakın/dış/hareketli)
    hold = 0.0
    if linger:
        hold += 0.6                                       # modelin EN değerli yargısı (BİRİNCİL kaldıraç)
    if s.regime in ("interior", "sleeping"):
        hold += 0.20
    elif s.regime == "exterior":
        hold -= 0.20
    if s.establishing or s.scale in ("drone", "wide", "top_down"):
        hold += 0.20
    elif s.scale in ("close_up", "extreme_close_up"):
        hold -= 0.25
    if role in ("establishing", "scenery"):
        hold += 0.15
    elif role in ("detail", "action"):
        hold -= 0.15
    if intensity is not None:
        hold += -((intensity - 3.0) / 2.0) * 0.5          # sakin(1)→+0.5 (uzun), hareketli(5)→−0.5 (kısa)
    hold += (seeded(f"{cfg.seed}:hold:{sc}") - 0.5) * 0.15  # küsüratlı "elle" his (asla tek-düze)
    hold = clamp(hold, -1.0, 1.0)

    # hold → hedef tutulan süre [KEEP_MIN, KEEP_MAX]
    kept = (KEEP_MIN + KEEP_MAX) / 2.0 + hold * (KEEP_MAX - KEEP_MIN) / 2.0
    kept = clamp(kept, KEEP_MIN, KEEP_MAX)

    # kırpmayı dağıt: kuyruğa biraz daha (artefakt) — tail %55 / head %45; her biri ≥ taban
    total_trim = max(0.0, dur - kept)
    tail = max(TAIL_MIN, total_trim * 0.55)
    head = max(HEAD_MIN, total_trim - tail)

    # fade/black tutamağı: geçişin yarısı + bol marj (≥ T/2 + extra) → asla single-sided / siyahtan başlama
    t_in = decisions[i]["dur"] if (decisions[i] and decisions[i].get("type")) else 0.0
    t_out = decisions[i + 1]["dur"] if (i + 1 < n and decisions[i + 1] and decisions[i + 1].get("type")) else 0.0
    head = max(head, (t_in or 0.0) / 2 + cfg.transition_edge_extra)
    tail = max(tail, (t_out or 0.0) / 2 + cfg.transition_edge_extra)

    head = _avoid_exact_one(head)
    tail = _avoid_exact_one(tail)

    in_pt = _frame_align(head)
    out_pt = _frame_align(dur - tail)
    # KULLANICI tabanı: hiçbir klip < KEEP_MIN (4.30s). Kısa kalırsa kuyruğu kıs — ama dur−TAIL_MIN'i AŞMA
    # (absürt kuyruğa girme). 8s kaynakta bu hemen her zaman 4.30s'i karşılar; çok kısa kaynakta en iyi çaba.
    if out_pt - in_pt < KEEP_MIN - 1e-6:
        out_pt = min(_frame_align(dur - TAIL_MIN), _frame_align(in_pt + KEEP_MIN))
    return in_pt, out_pt, dur
