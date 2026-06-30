#!/usr/bin/env python3
"""AutoReji — geçiş karar motoru (Faz 1, §5/§6/§7/§9.5).

Ham sinyalleri (rejim + ACTION/ENV etiketi + prompt-metin benzerliği) alır,
durum makinesi + histerezis ile rejimi pürüzsüzleştirir ve her birleşim için
cut / fade / black + süre + gerekçe üretir.

Eşikler Faz 2'de gerçek bölümlerde KALİBRE edilip dondurulacak (Blueprint §15).

Kullanım:
  python3 sidecar/decide.py "<image_prompt.txt>" "<video_klasoru>" [--probe]
"""
from __future__ import annotations

import hashlib
import os
import sys
from collections import Counter
from dataclasses import dataclass, field, fields

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from match import match_episode  # noqa: E402

# Faz 2 DONMUŞ değerlerin kanonik kaynağı (Blueprint §15). decide/build_manifest bunu okur.
CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "config", "config.toml")


@dataclass
class Config:
    seed: str = "episode"
    hysteresis: int = 3          # rejim değişimini komite etmek için ardışık sahne
    sim_block_thresh: float = 0.18   # bunun altı = sahne bloğu sınırı → fade (Jaccard; kalibre edilecek)
    fade_min: float = 1.0
    fade_max: float = 2.0
    black_min: float = 1.5
    black_max: float = 2.5
    round_to: float = 0.05
    min_cuts_between_fades: int = 2
    no_back_to_back_black: bool = True
    fps: int = 24                   # geçiş + kırpma kare hizalama (Premiere yuvarlama belirsizliğini kaldırır)
    # kırpma (§8) — HER klip iki yandan ≥1s kırpılır = garanti geçiş tutamağı (handle) + ritim çeşitliliği.
    # Kullanıcı isteği: "her video en garanti 1 saniye öncesi ve sonrası kesilsin, küsüratla."
    trim_base: float = 1.5
    trim_jit: float = 1.5           # ± rastgele aralık (seeded)
    trim_min: float = 1.0           # GARANTİ BAŞ kesimi: her klip baştan ≥1s (AI-üretim ilk ~0.5-1s bozuk) → fade ortalanabilir
    tail_min: float = 0.7           # min SON kesimi (AI-üretim kuyruk artefaktı; baştan büyük). En uzun klip ≈ source−head_min−tail_min ≈ 6.8s (~7s)
    trim_max: float = 2.5
    transition_edge_extra: float = 0.5    # fade tutamağı marjı (≥ T/2 + bu) — bol pay, asla single-sided
    source_dur: float = 8.0
    # --- DERİN VİDEO ANALİZİ sinyalleri (analyze_video.py) ---
    jarring_contrast: float = 45.0   # sınır görsel sıçraması bu üstündeyse sarsıcı cut → kısa fade (§9.5 #4)
    motion_calm: float = 1.5         # bunun altı = sakin (fade'e yatkın, uzun klip)
    motion_busy: float = 4.0         # bunun üstü = hareketli (cut'a yatkın, kısa klip)
    motion_trim_k: float = 0.07      # hareketin kırpmaya etkisi (yüksek hareket → daha çok kırp)
    soft_fade_min: float = 0.5       # sarsıcı-cut yumuşatma fade'i (kısa)
    soft_fade_max: float = 0.9
    # §9.5 rafineleri
    audio_micro_crossfade: float = 0.06
    mask_stereo_shift: bool = True
    intro_fade: float = 0.0   # açılış/kapanış imzası VARSAYILAN KAPALI (kanal sahibi tercihi); istenirse config.toml ile aç
    outro_fade: float = 0.0

    @classmethod
    def from_toml(cls, path: str | None = None):
        """config.toml'u oku → Config (Faz 2 DONMUŞ değerler, Blueprint §15).

        config.toml davranışın TEK kaynağıdır. Dosya yoksa veya bir alan eksikse
        o alan KOD VARSAYILANINDA kalır (güvenli; davranış asla bozulmaz). Tüm
        [tablo]'lar düz taranır; Config alan adıyla eşleşen anahtarlar uygulanır.
        """
        cfg = cls()
        if not path or not os.path.exists(path):
            return cfg
        try:
            import tomllib
            with open(path, "rb") as f:
                data = tomllib.load(f)
        except Exception:
            return cfg  # bozuk/okunamaz config → güvenli varsayılanlar
        names = {fld.name for fld in fields(cls)}
        for section in data.values():
            if isinstance(section, dict):
                for k, v in section.items():
                    if k in names and not isinstance(v, dict):
                        setattr(cfg, k, v)
        return cfg


# --------------------------------------------------------------------------- #
def jaccard(a, b) -> float:
    sa, sb = set(a), set(b)
    if not (sa or sb):
        return 1.0
    return len(sa & sb) / len(sa | sb)


def vcontrast(a, b) -> float:
    """İki kare imzası (y/u/v) arası görsel sıçrama (parlaklık + renk). Sarsıcı-cut göstergesi."""
    if not a or not b:
        return 0.0
    return abs(a["y"] - b["y"]) + 0.5 * (abs(a["u"] - b["u"]) + abs(a["v"] - b["v"]))


def seeded(seed_str: str) -> float:
    h = hashlib.md5(seed_str.encode()).hexdigest()
    return int(h[:8], 16) / 0xFFFFFFFF  # [0,1] deterministik


def clamp(x, lo, hi):
    return max(lo, min(hi, x))


def round_to(x, step):
    return round(round(x / step) * step, 3)


def frame_align(t: float, fps: int = 24) -> float:
    # süreyi tam kare sınırına otur → Premiere belirsiz yuvarlama yapmaz (geçiş hep handle'a sığar)
    return round(round(t * fps) / fps, 5)


# --- rejim çözümü: bilinmeyenleri taşı + histerezis ile pürüzsüzleştir ------ #
def resolve_regimes(scenes, hysteresis: int):
    # 1) bilinmeyen (karaktersiz insert) sahnelere bir önceki bilinen rejimi taşı
    raw, last = [], "exterior"   # bölümler genelde dışarıda başlar
    for s in scenes:
        if s.regime != "unknown":
            last = s.regime
        raw.append(last)
    # 2) histerezis: yeni rejime ancak `hysteresis` ardışık sahne sürerse geç
    committed, cur = [], raw[0]
    for i, r in enumerate(raw):
        if r != cur:
            window = raw[i:i + hysteresis]
            if len(window) == hysteresis and all(w == r for w in window):
                cur = r
        committed.append(cur)
    return raw, committed


# --- karar kuralları (öncelik sırasıyla, §7) ------------------------------- #
def decide_transitions(merged, cfg: Config, analysis=None):
    analysis = analysis or {}
    scenes = [m["prompt"] for m in merged]
    chosen = [m["chosen"] or {} for m in merged]
    raw, committed = resolve_regimes(scenes, cfg.hysteresis)

    decisions = [None] * len(scenes)
    seen_interior = committed[0] == "interior"

    for i in range(1, len(scenes)):
        s, p, c = scenes[i], scenes[i - 1], chosen[i]
        action = bool(c.get("action"))
        environment = bool(c.get("environment"))
        reg_prev, reg_cur = committed[i - 1], committed[i]
        sim = jaccard(p.tokens, s.tokens)
        # DERİN ANALİZ sinyalleri (her-kare): hareket + sınır görsel sıçraması
        av_cur, av_prev = analysis.get(s.scene) or {}, analysis.get(p.scene) or {}
        motion = av_cur.get("motion")
        vc = vcontrast(av_prev.get("last"), av_cur.get("first"))
        role, linger = av_cur.get("role"), av_cur.get("linger")
        energy, energy_prev = av_cur.get("energy"), av_prev.get("energy")

        typ, reason, soft = None, "sahne içi devam", False  # None = cut

        if reg_cur != reg_prev and reg_cur == "interior" and not seen_interior:
            typ, reason = "black", "dış→iç eşiği (ilk kez içeri)"
        elif reg_cur != reg_prev and reg_cur == "sleeping":
            typ, reason = "black", "gündüz→gece/uyku eşiği"
        elif s.establishing or (s.no_characters and (environment or s.scale in ("drone", "wide", "top_down"))):
            typ, reason = "fade", "kuruluş/manzara (nefes beat'i)"
        elif p.establishing:
            typ, reason = "fade", "kuruluştan sahneye dönüş"
        elif action:
            typ, reason = None, "ACTION (sahne içi devam)"
        elif reg_cur != reg_prev:
            typ, reason = "fade", f"rejim değişimi ({reg_prev}→{reg_cur})"
        elif s.subjects and p.subjects and set(s.subjects) != set(p.subjects):
            typ, reason = "fade", "aynı konumda özne değişimi"
        elif sim < cfg.sim_block_thresh:
            typ, reason = "fade", f"sahne bloğu sınırı (benzerlik {sim:.2f})"
        elif role in ("establishing", "scenery") and linger and not action:
            typ, reason = "fade", "AI: manzara/nefes beat'i (linger)"
        elif energy is not None and energy_prev is not None and abs(energy - energy_prev) >= 3:
            typ, reason = "fade", f"AI: enerji sıçraması ({energy_prev}→{energy})"

        # DERİN ANALİZ kuralı: kalan sert kesimde yüksek görsel sıçrama varsa kısa fade'le yumuşat (§9.5 #4)
        if typ is None and not action and vc >= cfg.jarring_contrast:
            typ, reason, soft = "fade", f"sarsıcı kesim yumuşatıldı (görsel sıçrama {vc:.0f})", True

        if reg_cur == "interior":
            seen_interior = True

        decisions[i] = {
            "type": typ, "reason": reason, "sim": round(sim, 2),
            "regime": reg_cur, "regime_prev": reg_prev, "soft": soft,
            "motion": round(motion, 2) if motion is not None else None,
            "vc": round(vc, 1),
        }

    _apply_refinements(decisions, cfg)
    _assign_durations(decisions, scenes, cfg)
    return decisions, committed


# --- §9.5 #6 monotonluk önleme + #5 imza -------------------------------------#
def _apply_refinements(decisions, cfg: Config):
    cuts_since_fade = 99
    last_noncut = None
    for i, d in enumerate(decisions):
        if d is None:
            continue
        t = d["type"]
        if t is None:
            cuts_since_fade += 1
            continue
        if t == "black":
            if cfg.no_back_to_back_black and last_noncut == "black":
                d["type"], d["reason"] = "fade", d["reason"] + " (art arda black→fade)"
                t = "fade"
            else:
                last_noncut = "black"
                cuts_since_fade = 0
                continue
        if t == "fade":
            # major olmayan fade çok erken geliyorsa cut'a indir (ritim)
            major = "eşik" in d["reason"]
            if not major and cuts_since_fade < cfg.min_cuts_between_fades:
                d["type"] = None
                d["reason"] += f" (ritim: {cfg.min_cuts_between_fades} cut arası → cut)"
                cuts_since_fade += 1
            else:
                last_noncut = "fade"
                cuts_since_fade = 0


def _assign_durations(decisions, scenes, cfg: Config):
    for i, d in enumerate(decisions):
        if d is None or d["type"] is None:
            continue
        sc = scenes[i].scene
        if d["type"] == "fade":
            if d.get("soft"):  # sarsıcı-cut yumuşatma: kısa, sıçrama büyüdükçe biraz uzun
                vcn = clamp(((d.get("vc") or 0) - cfg.jarring_contrast) / 40.0, 0, 1)
                base, lo = cfg.soft_fade_min + (cfg.soft_fade_max - cfg.soft_fade_min) * vcn, cfg.soft_fade_min
            else:  # prompt farkı VEYA görsel sıçramanın büyüğüyle ölçekle
                vcn = clamp((d.get("vc") or 0) / 75.0, 0, 1)
                base, lo = cfg.fade_min + (cfg.fade_max - cfg.fade_min) * max(1 - d["sim"], vcn), cfg.fade_min
            jit = (seeded(f"{cfg.seed}:fade:{sc}") - 0.5) * 0.3
            d["dur"] = frame_align(clamp(base + jit, lo, cfg.fade_max), cfg.fps)
        else:  # black
            base = (cfg.black_min + cfg.black_max) / 2
            jit = (seeded(f"{cfg.seed}:black:{sc}") - 0.5) * (cfg.black_max - cfg.black_min)
            d["dur"] = frame_align(clamp(base + jit, cfg.black_min, cfg.black_max), cfg.fps)


# --------------------------------------------------------------------------- #
def summary(merged, decisions, committed, cfg):
    scenes = [m["prompt"] for m in merged]
    types = [("cut" if d["type"] is None else d["type"]) for d in decisions[1:]]
    ct = Counter(types)
    n = len(types)
    print(f"Bölüm: {len(scenes)} sahne | seed={cfg.seed} hyst={cfg.hysteresis} sim_thr={cfg.sim_block_thresh}")
    print(f"GEÇİŞ DAĞILIMI → cut: {ct['cut']} ({100*ct['cut']//n}%)  "
          f"fade: {ct['fade']} ({100*ct['fade']//n}%)  black: {ct['black']}")
    # committed rejim eşikleri (pürüzsüzleştirilmiş)
    thr = [f"{i+1}:{committed[i-1]}→{committed[i]}" for i in range(1, len(committed)) if committed[i] != committed[i-1]]
    print(f"Pürüzsüz rejim eşikleri ({len(thr)}):", thr)
    blacks = [scenes[i].scene for i, d in enumerate(decisions) if d and d["type"] == "black"]
    print("BLACK noktaları:", blacks)
    print("\nÖrnek kararlar (1-22):")
    for i in range(1, min(23, len(decisions))):
        d = decisions[i]
        t = "CUT " if d["type"] is None else d["type"].upper()
        dur = f" {d.get('dur')}s" if d.get("dur") else ""
        print(f"  {scenes[i].scene:>3} [{t}{dur:<5}] {d['reason']}")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    do_probe = "--probe" in sys.argv
    if len(args) < 2:
        print('Kullanım: python3 sidecar/decide.py "<image_prompt.txt>" "<video_klasoru>" [--probe]')
        sys.exit(1)
    merged, report = match_episode(args[0], args[1], do_probe)
    cfg = Config.from_toml(CONFIG_PATH)
    cfg.seed = os.path.basename(args[0]).split(")")[0].strip("( ") or "episode"
    decisions, committed = decide_transitions(merged, cfg)
    summary(merged, decisions, committed, cfg)
