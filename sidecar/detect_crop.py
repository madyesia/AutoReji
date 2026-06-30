#!/usr/bin/env python3
"""AutoReji — siyah bar (letterbox) tespiti (Faz 2, crop düzeltme).

Her klipte ffmpeg `cropdetect` ile üst/alt siyah barı ölçer ve barı kapatmak için
gereken Motion>Scale faktörünü hesaplar. Çıktı: <out>/crop_scales.json
Panel (`panel/main.js` → setClipScale) bu scale'i her klibe uygular.

Notlar:
- Barlar SAF siyah değil (değer ~10-24); cropdetect limit=10 hiçbir şey bulmaz, =24 yakalar.
- Asimetrik bar için büyütme **max(üst,alt)**'e göre (büyük tarafı kapatır; küçük taraf hafif over-zoom).
- 1.06 üstü (örn. 720p sahne 115) anomali kabul → 1.0 (elle ele alınır).

Kullanım:
  python3 sidecar/detect_crop.py "<video_klasoru>" [--out _manifest] [--frames 120]
"""
from __future__ import annotations

import collections
import json
import os
import re
import subprocess
import sys

LIMIT = 24          # cropdetect siyah eşiği (near-black bar)
MIN_BAR = 4         # bu px'in altı bar sayılmaz
MARGIN = 3          # güvenlik payı (px)
CAP = 1.08          # max scale
FRAME_H = 1080


def detect(video_folder: str, frames: int = 120):
    files = sorted(
        [fn for fn in os.listdir(video_folder) if fn.lower().endswith((".mp4", ".mov", ".m4v"))],
        key=lambda x: int(re.match(r"(\d+)", x).group(1)) if re.match(r"(\d+)", x) else 0,
    )
    res = {}
    for fn in files:
        p = os.path.join(video_folder, fn)
        try:
            out = subprocess.run(
                ["ffmpeg", "-hide_banner", "-i", p, "-vf", f"cropdetect={LIMIT}:2:0",
                 "-frames:v", str(frames), "-f", "null", "-"],
                capture_output=True, text=True, timeout=120,
            ).stderr
        except (subprocess.SubprocessError, OSError):
            # bozuk/eksik klip · ffmpeg yok · asılı kaldı → crop yapma (güvenli varsayılan 1.0), pipeline DURMASIN
            out = ""
        crops = re.findall(r"crop=(\d+):(\d+):(\d+):(\d+)", out)  # w:h:x:y
        top = bottom = 0
        h = FRAME_H
        if crops:
            w, h, x, y = map(int, crops[-1])
            top, bottom = max(0, y), max(0, FRAME_H - h - y)
        big = max(top, bottom)
        scale = min(round(1 + 2 * (big + MARGIN) / FRAME_H, 4), CAP) if (big >= MIN_BAR and h >= 800) else 1.0
        m = re.match(r"(\d+)", fn)
        if m:
            res[int(m.group(1))] = {"top": top, "bottom": bottom, "scale": scale}
    return res


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    out_dir = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else "_manifest"
    frames = int(sys.argv[sys.argv.index("--frames") + 1]) if "--frames" in sys.argv else 120
    if not args:
        print('Kullanım: python3 sidecar/detect_crop.py "<video_klasoru>" [--out _manifest] [--frames 120]')
        sys.exit(1)
    res = detect(args[0], frames)
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, "crop_scales.json")
    json.dump(res, open(path, "w"), indent=2)
    sc = collections.Counter(v["scale"] for v in res.values())
    barlı = sum(1 for v in res.values() if v["scale"] > 1.0)
    print(f"✓ {path} — {len(res)} klip, barlı (scale>1.0): {barlı}")
    print("  scale dağılımı:", dict(sorted(sc.items())))


if __name__ == "__main__":
    main()
