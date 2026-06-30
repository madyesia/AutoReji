#!/usr/bin/env python3
"""AutoReji — YEREL GÖRSEL-AI SAHNE ANALİZİ (kurgu sinyalleri).

Her klibe bakıp KURGU için içerik sinyali üretir: energy (1-5), role (kuruluş/manzara/
detay/karakter/aksiyon/geçiş), mood, linger. Bunlar süre + geçiş + ritim kararını besler
(decide.py / trim.py). Tamamen YEREL (Ollama + Qwen2.5-VL), offline.

NOT: Hata/QC denetimi BU MODÜLDE YOK (kullanıcı kararı — VLM hata aramada güvenilmez,
elle Premiere'de denetlenir). Teknik hata kontrolü ayrı: crop (detect_crop.py) +
heuristik QC (analyze_video.py: donma/siyah/decode/flicker).

Mantık: her klipten zaman boyunca birkaç kare → tek istekte modele (detay + zaman-tutarlılığı).
Çıktı: <out>/vlm_scene.json  (scene → {energy, role, mood, linger})
Kullanım:
  python3 sidecar/vlm_scene.py "<video_klasoru>" [--out _manifest] [--model qwen2.5vl:7b]
                               [--frames 4] [--parallel 3] [--limit N] [--scenes 5,6]
Gerekli: `brew services start ollama` + `ollama pull qwen2.5vl:7b`.
"""
from __future__ import annotations

import base64
import collections
import concurrent.futures as cf
import json
import os
import re
import subprocess
import sys
import tempfile
import urllib.request

OLLAMA = os.environ.get("OLLAMA_URL", "http://localhost:11434")
MODEL = "qwen2.5vl:7b"
FRAMES = 4
PAR = 3
FW = 512

PROMPT = (
    "You analyze frames (in time order) from ONE ~8-second clip of a cozy Studio Ghibli-style rainy ASMR animation, "
    "to help an automatic EDITOR choose pacing and transitions. Return ONLY JSON with EXACTLY these fields:\n"
    '{"energy": <1-5 int>, "role": "establishing|scenery|detail|character|action|transition", '
    '"mood": "<one English word>", "linger": <true|false>}\n'
    "Guidance:\n"
    "- energy: 1 = very still/calm/slow; 5 = very dynamic/fast. Judge the real motion & intensity across the frames.\n"
    "- role: establishing = wide opening / location-setting; scenery = ambient landscape/atmosphere; "
    "detail = close insert of an object; character = people moment; action = clear movement/event; "
    "transition = quiet in-between beat.\n"
    "- mood: one English word (serene, cozy, peaceful, melancholic, tense, lively, warm...).\n"
    "- linger: true if it is a slow, beautiful or emotional moment worth holding on; else false."
)
ROLES = {"establishing", "scenery", "detail", "character", "action", "transition"}

_num = re.compile(r"(\d+)")
def scene_of(fn):
    m = _num.match(fn); return int(m.group(1)) if m else None


def _duration(path):
    try:
        return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=nk=1:nw=1", path], capture_output=True, text=True, timeout=20).stdout.strip())
    except Exception:
        return 8.0


def _frames_b64(path, n):
    dur = _duration(path)
    out = []
    with tempfile.TemporaryDirectory() as td:
        for i in range(n):
            frac = (i + 1) / (n + 1)
            dst = os.path.join(td, f"{i}.jpg")
            subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", f"{dur * frac:.3f}",
                "-i", path, "-frames:v", "1", "-vf", f"scale={FW}:-2", "-q:v", "3", dst], timeout=40)
            if os.path.exists(dst):
                out.append(base64.b64encode(open(dst, "rb").read()).decode())
    return out


def _ask(images, model):
    body = json.dumps({
        "model": model,
        "messages": [{"role": "user", "content": PROMPT, "images": images}],
        "stream": False, "format": "json", "options": {"temperature": 0},
    }).encode()
    req = urllib.request.Request(f"{OLLAMA}/api/chat", data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=180) as r:
        content = json.loads(r.read())["message"]["content"]
    try:
        d = json.loads(content)
    except Exception:
        m = re.search(r"\{.*\}", content, re.S)
        d = json.loads(m.group(0)) if m else {}
    try:
        energy = max(1, min(5, int(d.get("energy", 3))))
    except Exception:
        energy = 3
    role = str(d.get("role", "scenery")).strip().lower()
    if role not in ROLES:
        role = "scenery"
    return {"energy": energy, "role": role, "mood": str(d.get("mood", ""))[:24], "linger": bool(d.get("linger", False))}


def _check_model(model):
    try:
        with urllib.request.urlopen(f"{OLLAMA}/api/tags", timeout=10) as r:
            tags = [m["name"] for m in json.loads(r.read()).get("models", [])]
        return any(t == model or t.split(":")[0] == model.split(":")[0] for t in tags)
    except Exception:
        return False


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    g = lambda k, d=None: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d
    out_dir = g("--out", "_manifest")
    model = g("--model", MODEL)
    n = int(g("--frames", FRAMES))
    par = int(g("--parallel", PAR))
    limit = int(g("--limit")) if "--limit" in sys.argv else None
    only = set(int(x) for x in g("--scenes", "").split(",") if x.strip()) if "--scenes" in sys.argv else None
    if not args:
        print('Kullanım: python3 sidecar/vlm_scene.py "<video>" [--model qwen2.5vl:7b] [--frames 4] [--scenes 5,6]')
        sys.exit(1)

    try:
        urllib.request.urlopen(f"{OLLAMA}/api/version", timeout=5)
    except Exception:
        print("✗ Ollama çalışmıyor. Başlat: `brew services start ollama`"); sys.exit(2)
    if not _check_model(model):
        print(f"✗ Model yok: {model}. İndir: `ollama pull {model}`"); sys.exit(3)

    folder = args[0]
    files = sorted([f for f in os.listdir(folder) if f.lower().endswith((".mp4", ".mov", ".m4v")) and scene_of(f) is not None],
                   key=lambda x: scene_of(x))
    seen, uniq = set(), []
    for f in files:
        sc = scene_of(f)
        if sc in seen or (only and sc not in only):
            continue
        seen.add(sc); uniq.append(f)
    if limit:
        uniq = uniq[:limit]

    print(f"Görsel-AI sahne analizi ({model}): {len(uniq)} klip × {n} kare, {par} paralel…", flush=True)
    result, done = {}, 0

    def process(f):
        sc = scene_of(f)
        try:
            imgs = _frames_b64(os.path.join(folder, f), n)
            r = _ask(imgs, model) if imgs else {"energy": 3, "role": "scenery", "mood": "", "linger": False}
        except Exception as e:
            r = {"energy": 3, "role": "scenery", "mood": "", "linger": False, "error": str(e)}
        return sc, r

    with cf.ThreadPoolExecutor(max_workers=par) as ex:
        for sc, r in ex.map(process, uniq):
            result[str(sc)] = r
            done += 1
            if done % 20 == 0:
                print(f"  {done}/{len(uniq)}…", flush=True)

    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, "vlm_scene.json")
    json.dump({"model": model, "frames": n, "count": len(result), "clips": result}, open(path, "w"), ensure_ascii=False, indent=2)
    roles = collections.Counter(v.get("role") for v in result.values() if "error" not in v)
    energy = collections.Counter(v.get("energy") for v in result.values() if "error" not in v)
    print(f"✓ {path} — {len(result)} klip (kurgu sinyalleri)")
    print(f"  rol dağılımı: {dict(roles)}  | enerji: {dict(sorted(energy.items()))}")


if __name__ == "__main__":
    main()
