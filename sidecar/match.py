#!/usr/bin/env python3
"""AutoReji — eşleştirme + varyant + sağlık (Faz 1, §4.2 / §4.5).

- Video dosya adlarını parse eder (sahne no + ölçek + özne + ACTION/ENVIRONMENT etiketi + çözünürlük + çekim no).
- prompt[N] ↔ video N eşleştirir, eksik/fazla doğrular.
- Çift çekimde varyant seçer (1080p tercih + sağlık).
- İsteğe bağlı ffprobe ile footage sağlığını doğrular (süre/çözünürlük/stereo).

Kullanım:
  python3 sidecar/match.py "<image_prompt.txt>" "<video_klasoru>" [--probe]
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from collections import Counter, defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from parser import parse_document  # noqa: E402

VIDEO_EXT = (".mp4", ".mov", ".m4v")

SCALE_FILE = [
    ("drone", r"drone"),
    ("extreme_close_up", r"extreme[_-]?close-?up"),
    ("close_up", r"close-?up"),
    ("top_down", r"top-?down"),
    ("pov", r"\bpov\b"),
    ("wide", r"wide"),
    ("medium", r"medium"),
]


def parse_filename(name: str):
    """`73_medium_shot_the_father_ACTIO_s1_1080p_1.mp4` → yapısal kayıt."""
    base = re.sub(r"\.(mp4|mov|m4v)$", "", name, flags=re.I)
    m = re.match(r"^(\d+)[_-](.*)$", base)
    if not m:
        return None
    scene = int(m.group(1))
    rest = m.group(2)
    low = rest.lower()

    scale = "other"
    for nm, pat in SCALE_FILE:
        if re.search(pat, low):
            scale = nm
            break

    subjects = []
    if re.search(r"father", low):
        subjects.append("father")
    if re.search(r"mother", low):
        subjects.append("mother")
    if re.search(r"\bgirl\b|daughter", low):
        subjects.append("girl")
    no_char = bool(re.search(r"no[_-]?char", low))

    action = bool(re.search(r"actio", low))             # ACTIO(N)
    environment = bool(re.search(r"envi", low))         # ENVI(RONMENT) — '_' kelime sınırı değil, \b kullanma

    # çözünürlük + çekim no: ..._1080p  /  ..._1080p_1
    res, take = None, 0
    rm = re.search(r"_(\d{3,4})p(?:_(\d+))?$", base)
    if rm:
        res = int(rm.group(1))
        take = int(rm.group(2)) if rm.group(2) else 0

    return {
        "scene": scene, "file": name, "scale_file": scale, "subjects_file": subjects,
        "no_characters_file": no_char, "action": action, "environment": environment,
        "resolution": res, "take": take,
    }


def scan_videos(folder: str):
    by_scene = defaultdict(list)
    bad = []
    for fn in sorted(os.listdir(folder)):
        if not fn.lower().endswith(VIDEO_EXT):
            continue
        rec = parse_filename(fn)
        if rec is None:
            bad.append(fn)
        else:
            rec["path"] = os.path.join(folder, fn)
            by_scene[rec["scene"]].append(rec)
    return by_scene, bad


def probe(path: str):
    """ffprobe → {w,h,dur,channels} veya None."""
    cmd = [
        "ffprobe", "-v", "error", "-show_entries",
        "stream=codec_type,width,height,channels:format=duration",
        "-of", "json", path,
    ]
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        data = json.loads(out.stdout or "{}")
    except Exception:
        return None
    info = {"w": None, "h": None, "dur": None, "channels": None}
    for st in data.get("streams", []):
        if st.get("codec_type") == "video" and info["w"] is None:
            info["w"], info["h"] = st.get("width"), st.get("height")
        if st.get("codec_type") == "audio" and info["channels"] is None:
            info["channels"] = st.get("channels")
    try:
        info["dur"] = round(float(data.get("format", {}).get("duration")), 2)
    except (TypeError, ValueError):
        pass
    return info


def choose_variant(clips: list, do_probe: bool):
    """Çift çekimde: 1080p tercih → sağlık → temel çekim (take 0). Akıllı komşu seçimi §4.5 sonra."""
    if not clips:
        return None, []
    cands = list(clips)
    if do_probe:
        for c in cands:
            c["_probe"] = probe(c["path"])
    # 1080p önce, sonra en yüksek; eşitse take 0 (temel)
    def key(c):
        res = c.get("resolution") or 0
        return (res == 1080, res, -c.get("take", 0))
    cands.sort(key=key, reverse=True)
    return cands[0], cands


def match_episode(prompt_path: str, video_folder: str, do_probe: bool = False):
    scenes = parse_document(prompt_path)
    by_scene, bad = scan_videos(video_folder)

    merged = []
    for s in scenes:
        clips = by_scene.get(s.scene, [])
        chosen, cands = choose_variant(clips, do_probe)
        merged.append({"prompt": s, "chosen": chosen, "candidates": cands})

    prompt_scenes = {s.scene for s in scenes}
    video_scenes = set(by_scene.keys())
    report = {
        "prompts": len(scenes),
        "videos": sum(len(v) for v in by_scene.values()),
        "video_scenes": len(video_scenes),
        "missing_video": sorted(prompt_scenes - video_scenes),
        "extra_video": sorted(video_scenes - prompt_scenes),
        "double_takes": {k: len(v) for k, v in by_scene.items() if len(v) > 1},
        "unparsed_files": bad,
    }
    return merged, report


def summary(merged, report, do_probe):
    print(f"Prompt sahne: {report['prompts']}  |  Video: {report['videos']} "
          f"({report['video_scenes']} sahne)")
    print("Eksik video:", report["missing_video"] or "yok")
    print("Fazla video:", report["extra_video"] or "yok")
    print("Çift çekim:", report["double_takes"] or "yok")
    print("Parse edilemeyen dosya:", report["unparsed_files"] or "yok")
    def real_res(c):  # ffprobe yüksekliği gerçeği söyler; dosya adı yalan söyleyebilir
        if not c:
            return None
        p = c.get("_probe")
        return (p.get("h") if p and p.get("h") else c.get("resolution"))
    below = [(m["prompt"].scene, real_res(m["chosen"]))
             for m in merged if m["chosen"] and (real_res(m["chosen"]) or 0) < 1080]
    src = "(ffprobe ile)" if do_probe else "(dosya adından — ffprobe önerilir)"
    print("1080p altı (UYARI):", below or "yok", src)

    # prompt ölçeği vs dosya adı ölçeği uyumu (çapraz doğrulama)
    agree = total = 0
    action_ct = env_ct = 0
    for m in merged:
        c = m["chosen"]
        if not c:
            continue
        total += 1
        if c["scale_file"] == m["prompt"].scale:
            agree += 1
        action_ct += int(c["action"])
        env_ct += int(c["environment"])
    if total:
        print(f"\nÖlçek uyumu (prompt↔dosyaadı): {agree}/{total} = {100*agree//total}%")
        print(f"Dosya adı etiketleri → ACTION: {action_ct}  ENVIRONMENT: {env_ct}")

    if do_probe:
        res_ct, dur_ct, ch_ct = Counter(), Counter(), Counter()
        for m in merged:
            p = (m["chosen"] or {}).get("_probe")
            if p:
                res_ct[f"{p['w']}x{p['h']}"] += 1
                dur_ct[p["dur"]] += 1
                ch_ct[p["channels"]] += 1
        print("\nffprobe — çözünürlük:", dict(res_ct))
        print("ffprobe — süre (s):", dict(sorted(dur_ct.items())))
        print("ffprobe — ses kanalı:", dict(ch_ct), "(2 = stereo)")

    print("\nİlk 8 eşleşme:")
    for m in merged[:8]:
        s, c = m["prompt"], m["chosen"]
        tag = ("ACTION" if c and c["action"] else "ENV" if c and c["environment"] else "-")
        print(f"  #{s.scene:>3} prompt[{s.scale}/{s.regime}] ↔ {c['file'] if c else 'YOK':<48} [{tag}]")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    do_probe = "--probe" in sys.argv
    if len(args) < 2:
        print('Kullanım: python3 sidecar/match.py "<image_prompt.txt>" "<video_klasoru>" [--probe]')
        sys.exit(1)
    merged, report = match_episode(args[0], args[1], do_probe)
    summary(merged, report, do_probe)
