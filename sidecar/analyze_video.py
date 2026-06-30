#!/usr/bin/env python3
"""AutoReji — DERİN VİDEO ANALİZİ + KALİTE KONTROL ("yerel AI", model yok).

Her videonun HER karesini ffmpeg `signalstats` ile inceler:
  • metrikler: parlaklık/renk/doygunluk/hareket + ilk/son kare imzası (karar motoru için)
  • KALİTE KONTROL (QC): donma, siyah/boş kare, bozulma (decode), titreme/flicker,
    aşırı poz, olası tekrar, eksik kare → risk skoru + sorun listesi.

Tamamen yerel, ffmpeg dışında bağımlılık yok. Riskli klipler işaretlenir; kullanıcı
inceleyip "kullanma" der (enabled=false), build'e girmez.

Çıktı: <out>/video_analysis.json  (scene → metrikler + qc)
Kullanım:
  python3 sidecar/analyze_video.py "<video_klasoru>" [--out _manifest] [--limit N] [--scale 240]
"""
from __future__ import annotations

import concurrent.futures as cf
import json
import os
import re
import subprocess
import sys

SCALE = 240
WORKERS = 6
FPS = 24

_num = re.compile(r"(\d+)")
def scene_of(fn: str):
    m = _num.match(fn)
    return int(m.group(1)) if m else None


def _signalstats(path: str, extra_vf: str = "") -> dict:
    vf = f"scale={SCALE}:-2,{extra_vf}signalstats,metadata=print:file=-"
    out = subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-nostats", "-i", path,
         "-vf", vf, "-an", "-f", "null", "-"],
        capture_output=True, text=True, timeout=180,
    ).stdout
    return {
        "y": [float(x) for x in re.findall(r"YAVG=([\d.]+)", out)],
        "u": [float(x) for x in re.findall(r"UAVG=([\d.]+)", out)],
        "v": [float(x) for x in re.findall(r"VAVG=([\d.]+)", out)],
        "s": [float(x) for x in re.findall(r"SATAVG=([\d.]+)", out)],
    }


def _decode_errors(path: str) -> str:
    return subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-an", "-f", "null", "-"],
        capture_output=True, text=True, timeout=180,
    ).stderr.strip()


def _mean(a): return sum(a) / len(a) if a else 0.0
def _std(a):
    if len(a) < 2: return 0.0
    m = _mean(a); return (sum((x - m) ** 2 for x in a) / len(a)) ** 0.5
def _runs(vals, pred, min_len):
    best, n = 0, 0
    for v in vals:
        n = n + 1 if pred(v) else 0
        best = max(best, n)
    return best if best >= min_len else 0


def analyze_one(path: str) -> dict:
    base = _signalstats(path)
    motion = _signalstats(path, extra_vf="tblend=all_mode=difference,")
    y, u, v, mot = base["y"], base["u"], base["v"], motion["y"]
    n = len(y)
    ym = _mean(y)
    res = {
        "frames": n,
        "brightness": round(ym, 2),
        "brightness_std": round(_std(y), 2),
        "u": round(_mean(u), 2),
        "v": round(_mean(v), 2),
        "saturation": round(_mean(base["s"]), 2),
        "motion": round(_mean(mot), 3),
        "motion_peak": round(max(mot) if mot else 0, 2),
        "first": {"y": round(y[0], 2), "u": round(u[0], 2), "v": round(v[0], 2)} if y else None,
        "last": {"y": round(y[-1], 2), "u": round(u[-1], 2), "v": round(v[-1], 2)} if y else None,
    }

    # ---- KALİTE KONTROL ----
    issues = []
    err = _decode_errors(path)
    if err:
        issues.append({"k": "decode", "sev": 100, "d": "çözme/bozulma hatası (oynatılamayabilir)"})
    if n and n < 180:
        issues.append({"k": "short", "sev": 60, "d": f"eksik/kısa ({n} kare)"})
    blk = _runs(y, lambda x: x < 16, int(0.3 * FPS))          # gerçek siyah kare dizisi
    if blk:
        issues.append({"k": "black", "sev": 80, "d": f"siyah/boş kare ({blk} kare)"})
    frz = _runs(mot, lambda x: x < 0.12, int(1.0 * FPS))      # neredeyse özdeş kareler = donma
    if frz:
        issues.append({"k": "freeze", "sev": 70, "d": f"donma ({frz} kare hareketsiz)"})
    if n > 2:
        jumps = sum(1 for i in range(1, n) if abs(y[i] - y[i - 1]) > 22)
        if jumps > n * 0.15:
            issues.append({"k": "flicker", "sev": 50, "d": f"titreme/flicker ({jumps} ani sıçrama)"})
    if ym < 18:
        issues.append({"k": "dark", "sev": 40, "d": "aşırı karanlık (pozlama)"})
    elif ym > 232:
        issues.append({"k": "bright", "sev": 40, "d": "aşırı parlak (pozlama)"})

    res["qc"] = {"issues": issues}
    res["_fp"] = f"{round(ym)}:{round(_mean(u))}:{round(_mean(v))}:{round(_mean(mot), 1)}"
    return res


def _finalize(result: dict):
    """risk skoru + seviye; çapraz-klip olası tekrar tespiti."""
    # olası tekrar: aynı parmak izini paylaşan klipler (sonrakine işaret)
    seen = {}
    for sc in sorted(result, key=lambda k: int(k)):
        v = result[sc]
        if "error" in v:
            v["qc"] = {"issues": [{"k": "error", "sev": 100, "d": v["error"]}], "risk": 100, "level": "high"}
            continue
        fp = v.pop("_fp", None)
        if fp is not None:
            if fp in seen:
                v["qc"]["issues"].append({"k": "duplicate", "sev": 30, "d": f"olası tekrar (#{seen[fp]} ile çok benzer)"})
            else:
                seen[fp] = sc
        iss = v["qc"]["issues"]
        risk = min(100, sum(i["sev"] for i in iss)) if iss else 0
        v["qc"]["risk"] = risk
        v["qc"]["level"] = "high" if risk >= 60 else "med" if risk >= 30 else "low" if risk > 0 else "ok"


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    out_dir = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else "_manifest"
    limit = int(sys.argv[sys.argv.index("--limit") + 1]) if "--limit" in sys.argv else None
    global SCALE
    if "--scale" in sys.argv: SCALE = int(sys.argv[sys.argv.index("--scale") + 1])
    if not args:
        print('Kullanım: python3 sidecar/analyze_video.py "<video_klasoru>" [--out _manifest] [--limit N]')
        sys.exit(1)
    folder = args[0]
    files = sorted(
        [f for f in os.listdir(folder) if f.lower().endswith((".mp4", ".mov", ".m4v")) and scene_of(f) is not None],
        key=lambda x: scene_of(x),
    )
    seen, uniq = set(), []
    for f in files:
        sc = scene_of(f)
        if sc not in seen:
            seen.add(sc); uniq.append(f)
    if limit: uniq = uniq[:limit]

    print(f"Derin analiz + QC: {len(uniq)} video × her kare (scale={SCALE}, {WORKERS} paralel)…", flush=True)
    result, done = {}, 0
    def work(f):
        try:
            return scene_of(f), analyze_one(os.path.join(folder, f))
        except Exception as e:
            return scene_of(f), {"error": str(e)}
    with cf.ThreadPoolExecutor(max_workers=WORKERS) as ex:
        for sc, data in ex.map(work, uniq):
            result[str(sc)] = data
            done += 1
            if done % 20 == 0 or done == len(uniq):
                print(f"  {done}/{len(uniq)} klip", flush=True)

    _finalize(result)
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, "video_analysis.json")
    json.dump({"scale": SCALE, "count": len(result), "clips": result}, open(path, "w"), indent=2)

    risky = [(k, v["qc"]) for k, v in result.items() if v.get("qc", {}).get("risk", 0) > 0]
    print(f"✓ {path} — {len(result)} klip")
    print(f"  RİSKLİ: {len(risky)}  (yüksek: {sum(1 for _, q in risky if q['level'] == 'high')}, "
          f"orta: {sum(1 for _, q in risky if q['level'] == 'med')}, düşük: {sum(1 for _, q in risky if q['level'] == 'low')})")
    for k, q in sorted(risky, key=lambda x: -x[1]["risk"])[:12]:
        print(f"   #{k} risk {q['risk']}: " + ", ".join(i["d"] for i in q["issues"]))


if __name__ == "__main__":
    main()
