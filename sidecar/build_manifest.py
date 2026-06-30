#!/usr/bin/env python3
"""AutoReji — bölüm manifesti üretici (Faz 1, §10).

parser + match + decide + trim → <bölüm>_manifest.json (JSON EDL, §10 şeması).
Şema doğrulaması + handle/in-out kontrolü dahil.

Kullanım:
  python3 sidecar/build_manifest.py "<image_prompt.txt>" "<video_klasoru>" [--probe] [--out <dir>]
"""
from __future__ import annotations

import datetime
import hashlib
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from match import match_episode      # noqa: E402
from decide import Config, decide_transitions, CONFIG_PATH  # noqa: E402
from trim import compute_trim        # noqa: E402


def episode_name_from(path: str) -> str:
    base = os.path.basename(path)
    m = re.match(r"\((\d+)\.?\s*Bölüm\)\s*(.+?)\s*Image Prompt", base, re.I)
    if m:
        title = re.sub(r"[^A-Za-z0-9]+", "_", m.group(2)).strip("_")
        return f"{m.group(1)}_{title}"
    return re.sub(r"[^A-Za-z0-9]+", "_", re.sub(r"\.txt$", "", base)).strip("_")


def _confidence(d) -> float:
    if not d or d["type"] is None and "ACTION" not in d.get("reason", ""):
        if not d:
            return 1.0
    r = d.get("reason", "")
    if d["type"] == "black":
        return 0.92
    if "eşik" in r:
        return 0.9
    if "ACTION" in r:
        return 0.85
    if "kuruluş" in r or "manzara" in r:
        return 0.8
    if "özne" in r:
        return 0.75
    if "blok sınırı" in r:
        return 0.6
    return 0.7


def _generate_thumbs(clips, out_dir="_manifest"):
    """Her klibin GÜVENLİ pencere ORTASINDAN (kötü baş/son dışı) 1 önizleme karesi →
    <out_dir>/thumbs/<scene>.jpg. UI film şeridi + Inspector bunu gösterir (gerçek bölümde mock thumb yok).
    Her klip izole try/except + timeout; ffmpeg yok/bozuk klip → o klip thumb=None (UI zarifçe karoya düşer)."""
    import concurrent.futures as cf
    import subprocess as sp
    tdir = os.path.join(out_dir, "thumbs")
    try:
        os.makedirs(tdir, exist_ok=True)
    except Exception:
        return

    def _one(c):
        f = c.get("file")
        if not f or not os.path.exists(f):
            return c["scene"], None
        t = (c["in"] + c["out"]) / 2.0          # güvenli pencere ortası = garanti-iyi kare
        dst = os.path.join(tdir, f"{c['scene']}.jpg")
        try:
            sp.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", f"{t:.3f}",
                    "-i", f, "-frames:v", "1", "-vf", "scale=480:-2", "-q:v", "4", dst],
                   capture_output=True, timeout=30)
            return c["scene"], (os.path.abspath(dst) if os.path.exists(dst) else None)
        except Exception:
            return c["scene"], None

    res = {}
    try:
        with cf.ThreadPoolExecutor(max_workers=6) as ex:
            for sc, p in ex.map(_one, clips):
                res[sc] = p
    except Exception:
        pass
    for c in clips:
        c["thumb"] = res.get(c["scene"])


def build_manifest(prompt_path, video_folder, do_probe=False):
    merged, report = match_episode(prompt_path, video_folder, do_probe)
    name = episode_name_from(prompt_path)

    # Crop ölçekleri (siyah bar gidermek için) — varsa oku (sidecar cropdetect üretir)
    crop_scales = {}
    try:
        cs = json.load(open(os.path.join("_manifest", "crop_scales.json"), encoding="utf-8"))
        crop_scales = {int(k): v for k, v in cs.items()}
    except Exception:
        pass
    # Derin video analizi (analyze_video.py) — varsa kararları + süreleri zenginleştirir
    analysis = {}
    try:
        va = json.load(open(os.path.join("_manifest", "video_analysis.json"), encoding="utf-8"))
        analysis = {int(k): v for k, v in va.get("clips", {}).items()}
    except Exception:
        pass
    # Görsel-AI sahne sinyalleri (energy/role/linger) — yalnız KURGU için (hata denetimi kaldırıldı)
    vlm = {}
    try:
        vq = json.load(open(os.path.join("_manifest", "vlm_scene.json"), encoding="utf-8"))
        vlm = vq.get("clips", {})
    except Exception:
        pass
    # Görsel-AI KURGU sinyallerini (energy/role/linger/mood) analiz sözlüğüne kat → decide/trim kullanır
    for sc, av in analysis.items():
        e = vlm.get(str(sc))
        if e:
            for k in ("energy", "role", "linger", "mood"):
                if e.get(k) is not None:
                    av[k] = e.get(k)
    cfg = Config.from_toml(CONFIG_PATH)   # Faz 2 DONMUŞ değerler (Blueprint §15); dosya yoksa kod varsayılanı
    cfg.seed = name
    decisions, committed = decide_transitions(merged, cfg, analysis)
    n = len(merged)

    clips = []
    for i, m in enumerate(merged):
        s = m["prompt"]
        c = m["chosen"] or {}
        av = analysis.get(s.scene) or {}
        res_h = (c.get("_probe") or {}).get("h") or c.get("resolution")  # gerçek yükseklik (ffprobe); dosya adı "1080p" yalan söyleyebilir
        in_pt, out_pt, dur = compute_trim(i, merged, decisions, cfg, n, analysis)
        d = decisions[i]
        trans = None
        if d and d["type"]:
            trans = {"type": d["type"], "dur": d.get("dur"), "align": "center"}
        regime_change = bool(d and d["regime"] != d["regime_prev"])

        # crop: siyah bar varsa gerekli scale (1.06 üstü anomali → 1.0, elle ele alınır, örn. 720p)
        cs = crop_scales.get(s.scene)
        scale = 1.0
        if cs:
            sv = cs.get("scale", 1.0)
            scale = round(sv, 4) if 1.0 < sv <= 1.06 else 1.0

        clips.append({
            "index": i + 1,
            "scene": s.scene,
            "file": os.path.abspath(c.get("path", "")),
            "in": in_pt,
            "out": out_pt,
            "source_dur": round(dur, 4),
            "scale": scale,
            "resolution": res_h,
            "enabled": True,
            "meta": {"scale": s.scale, "subjects": s.subjects,
                     "regime": committed[i], "state": s.state, "color": s.color},
            "analysis": {"motion": av.get("motion"), "brightness": av.get("brightness"),
                         "saturation": av.get("saturation"), "energy": av.get("energy"),
                         "role": av.get("role"), "linger": av.get("linger"), "mood": av.get("mood")} if av else None,
            "qc": av.get("qc"),
            "transition_in": trans,
            "audio": {"micro_crossfade": cfg.audio_micro_crossfade,
                      "mask_stereo_shift": regime_change and cfg.mask_stereo_shift},
            "decision": {
                "reason": d["reason"] if d else "açılış (ilk klip)",
                "confidence": _confidence(d),
                "signals": {
                    "regime_change": f"{d['regime_prev']}→{d['regime']}" if regime_change else None,
                    "prompt_sim_prev": d["sim"] if d else None,
                    "action": bool(c.get("action")),
                    "environment": bool(c.get("environment")),
                    "motion": d.get("motion") if d else None,
                    "visual_contrast": d.get("vc") if d else None,
                },
                "user_overridden": False,
                "algo_default": trans,
            },
            "variant": {
                "chosen": os.path.basename(c.get("path", "")) or None,
                "candidates": [x["file"] for x in m["candidates"]],
                "reason": "tek 1080p" if len(m["candidates"]) <= 1 else "çoklu aday",
            },
            "thumb": None,
        })

    # --- GEÇİŞ SÜRESİNİ TUTAMAĞA GÖRE KISITLA (asla bozuk/single-sided fade) -----------------
    # Merkezli geçiş için: önceki klibin SON payı ≥ T/2 VE bu klibin BAŞ payı ≥ T/2.
    # T = min(karar süresi, 2·min(handle) − 2 kare). Kareye AŞAĞI yuvarla (handle'ı asla aşma).
    # Tutamak 6 kareyi (~0.25s) bile taşımıyorsa fade'i CUT'a indir (bozuk fade yerine temiz kes).
    fps = cfg.fps
    min_fade = round(6 / fps, 5)
    downgraded = []
    for i in range(1, len(clips)):
        t = clips[i].get("transition_in")
        if not t or not t.get("type") or not t.get("dur"):
            continue
        prev = clips[i - 1]
        tail_h = prev["source_dur"] - prev["out"]      # önceki klibin son payı (handle)
        head_h = clips[i]["in"]                          # bu klibin baş payı (handle)
        avail = min(tail_h, head_h)
        d_fit = min(t["dur"], 2 * avail - 2 / fps)
        d_fit = int(round(d_fit * fps - 1e-6)) / fps     # kareye aşağı yuvarla
        if d_fit < min_fade:
            downgraded.append((clips[i]["scene"], t["type"], round(avail, 3)))
            clips[i]["transition_in"] = None
            clips[i]["decision"]["algo_default"] = None
            clips[i]["decision"]["reason"] += f" (handle yetersiz {avail:.2f}s → cut)"
        else:
            t["dur"] = round(d_fit, 5)
            t["handle"] = round(avail, 3)               # şeffaflık: bu geçişin her iki yanındaki pay

    # önizleme kareleri (gerçek bölüm): her klibin güvenli pencere ortasından → clip.thumb
    _generate_thumbs(clips)

    manifest = {
        "schema_version": "1.0",
        "episode": {"name": name, "source_doc": os.path.basename(prompt_path)},
        "sequence": {"fps": 24, "width": 1920, "height": 1080, "par": "square",
                     "audio_rate": 48000, "audio_channels": 2},
        "build": {
            "generated_at": datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat(),
            "seed": name, "engine_version": "1.0",
            "config_hash": hashlib.md5(repr(cfg).encode()).hexdigest()[:8],
            "fades_downgraded_to_cut": len(downgraded),
        },
        "intro": {"fade_in_from_black": cfg.intro_fade},
        "outro": {"fade_out_to_black": cfg.outro_fade},
        "clips": clips,
    }
    return manifest, report, cfg, downgraded


def validate(manifest):
    errs, warns = [], []
    clips = manifest["clips"]
    for c in clips:
        if not (0 <= c["in"] < c["out"]):
            errs.append(f"#{c['scene']}: in/out geçersiz ({c['in']}/{c['out']})")
        if not c["file"] or not os.path.exists(c["file"]):
            warns.append(f"#{c['scene']}: dosya yok ({os.path.basename(c['file'])})")
    # handle kontrolü: merkezli geçişin her iki yanında ≥ T/2 malzeme (gerçek kaynak süresiyle)
    for i in range(1, len(clips)):
        t = clips[i]["transition_in"]
        if not t or not t.get("dur"):
            continue
        need = t["dur"] / 2
        head_handle = clips[i]["in"]                            # bu klibin baş payı
        prev = clips[i - 1]
        tail_handle = prev.get("source_dur", 8.0) - prev["out"]  # önceki klibin son payı
        if head_handle + 1e-6 < need:
            warns.append(f"#{clips[i]['scene']}: baş handle yetersiz ({head_handle:.2f}<{need:.2f}) {t['type']}")
        if tail_handle + 1e-6 < need:
            warns.append(f"#{prev['scene']}: son handle yetersiz ({tail_handle:.2f}<{need:.2f})")
    return errs, warns


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    do_probe = "--probe" in sys.argv
    out_dir = "_manifest"
    if "--out" in sys.argv:
        out_dir = sys.argv[sys.argv.index("--out") + 1]
    if len(args) < 2:
        print('Kullanım: python3 sidecar/build_manifest.py "<image_prompt.txt>" "<video>" [--probe] [--out dir]')
        sys.exit(1)

    manifest, report, cfg, downgraded = build_manifest(args[0], args[1], do_probe)
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, f"{manifest['episode']['name']}_manifest.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    errs, warns = validate(manifest)
    clips = manifest["clips"]
    trans = [c["transition_in"]["type"] for c in clips if c["transition_in"]]
    from collections import Counter
    tc = Counter(trans)
    durs = [round(c["out"] - c["in"], 2) for c in clips]
    # fade tutamağı (handle) marjı: her geçişin sığdığının kanıtı
    fmins, tight = [], []
    for i in range(1, len(clips)):
        t = clips[i]["transition_in"]
        if not t or not t.get("dur"):
            continue
        hh = clips[i]["in"]
        th = clips[i - 1].get("source_dur", 8.0) - clips[i - 1]["out"]
        avail = min(hh, th)
        fmins.append(avail - t["dur"] / 2)            # pozitif = sığıyor (kare cinsinden ×24)
        if avail - t["dur"] / 2 < 0.25:
            tight.append(clips[i]["scene"])
    print(f"✓ Manifest yazıldı: {out_path}")
    print(f"  Bölüm: {manifest['episode']['name']}  | {len(clips)} klip")
    print(f"  Geçiş: cut {len(clips)-1-len(trans)}  fade {tc.get('fade',0)}  black {tc.get('black',0)}")
    print(f"  Klip süresi (timeline): min {min(durs)}s  max {max(durs)}s  ort {sum(durs)/len(durs):.2f}s")
    if fmins:
        print(f"  Fade tutamak marjı (her yan, T/2 sonrası): en az {min(fmins):.3f}s "
              f"(~{min(fmins)*24:.0f} kare) ort {sum(fmins)/len(fmins):.3f}s — hepsi ≥0 → her fade ortalı sığar")
    if tight:
        print(f"  ⚠ kıt marjlı (≤0.25s) geçiş: {tight}")
    if downgraded:
        print(f"  ↓ handle yetmediği için cut'a indirilen fade: {len(downgraded)} → {downgraded[:8]}")
    print(f"  Toplam süre ~{sum(durs):.0f}s (~{sum(durs)/60:.1f} dk) + geçiş bindirmeleri")
    print(f"  Intro fade-in {manifest['intro']['fade_in_from_black']}s / Outro fade-out {manifest['outro']['fade_out_to_black']}s")
    risky = [c for c in clips if (c.get("qc") or {}).get("risk", 0) > 0]
    if risky:
        print(f"  ⚠ QC riskli klip: {len(risky)} → " + ", ".join(f"#{c['scene']}({(c['qc']['issues'][0]['d'])[:24]})" for c in risky[:6]))
    else:
        print("  QC: tüm klipler temiz ✓ (heuristik teknik kontrol + crop)")
    print(f"  Doğrulama → HATA: {len(errs)}  UYARI: {len(warns)}")
    for e in errs[:10]:
        print("   ✗", e)
    for w in warns[:10]:
        print("   ⚠", w)


if __name__ == "__main__":
    main()
