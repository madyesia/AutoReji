#!/usr/bin/env python3
"""AutoReji — prompt parser (Faz 1 omurgası, §4.3).

Image prompt belgesini sahne sahne ayrıştırır; her sahne için
scale / subjects / state / regime / color / establishing / tokens çıkarır.
Deterministik, AI'sız, harici bağımlılık yok (saf Python + re).

Kullanım:  python3 sidecar/parser.py "<image_prompt.txt>"
"""
from __future__ import annotations

import re
import sys
from collections import Counter
from dataclasses import dataclass, field, asdict

# --- Her promptun sabit baş kalıbı (strip için) -----------------------------
STYLE_PREFIX = re.compile(r"^\s*studio ghibli anime style.*?not 3d,?\s*", re.I)
BOILERPLATE = re.compile(
    r"full frame|no cropping|still frame|single illustration|no motion blur|"
    r"absolutely no 3d rendering|2d animation look|not 3d|"
    r"studio ghibli anime style|cel-?shaded",
    re.I,
)

# --- Çekim ölçeği (sıra önemli: spesifik → genel) ---------------------------
SCALE_PATTERNS = [
    ("drone", r"drone shot"),
    ("extreme_close_up", r"extreme close-?up"),
    ("close_up", r"close-?up shot"),
    ("top_down", r"top-?down shot"),
    ("pov", r"\bpov shot\b"),
    ("wide", r"wide shot"),
    ("medium", r"medium shot"),
]

# --- Karakter kodları: (fout) (min) (dslp) ... ------------------------------
CODE_RE = re.compile(r"\(([a-z]{1,4}?)(out|in|slp)\)", re.I)
# Bölüm 2 karakter harfleri; başka bölümde genişletilebilir (§4.3 🔧)
CHAR_NAMES = {"f": "father", "m": "mother", "d": "girl", "g": "girl", "b": "boy"}
STATE_FROM_SUFFIX = {"out": "exterior", "in": "interior", "slp": "sleeping"}

# --- Renk sinyali (rejim doğrulaması) ---------------------------------------
WARM_RE = re.compile(r"amber|honey glow|golden|warm (?:glow|light|spot|lamp|honey)|firelight|candle", re.I)
COLD_RE = re.compile(r"slate blue|charcoal|cold (?:charcoal|wash|blue)|deep slate", re.I)
NO_CHAR_RE = re.compile(r"no character", re.I)

# location_text / token benzerliği için gürültü kelimeleri
STOP = {
    "the", "and", "with", "from", "shot", "into", "onto", "over", "under", "across",
    "rain", "wet", "dark", "scene", "frame", "light", "glow", "wash", "side", "edge",
    "down", "through", "above", "below", "behind", "around", "front", "back",
    "left", "right", "deep", "cold", "warm", "soft", "faint", "bright", "small",
    "large", "visible", "surface", "entire", "single", "still", "full", "view",
}


@dataclass
class Scene:
    scene: int
    scale: str
    subjects: list = field(default_factory=list)
    state: str = "unknown"      # exterior | interior | sleeping | unknown
    regime: str = "unknown"     # exterior | interior | sleeping
    color: str = "unknown"      # cold | warm | mixed | unknown
    establishing: bool = False
    no_characters: bool = False
    tokens: list = field(default_factory=list)
    raw: str = ""


def detect_scale(text: str) -> str:
    for name, pat in SCALE_PATTERNS:
        if re.search(pat, text, re.I):
            return name
    return "other"


def parse_codes(text: str):
    subjects, states = [], set()
    for m in CODE_RE.finditer(text):
        ch, st = m.group(1).lower(), m.group(2).lower()
        name = CHAR_NAMES.get(ch[0], ch) if ch else ch
        if name and name not in subjects:
            subjects.append(name)
        states.add(st)
    return subjects, states


def detect_color(text: str) -> str:
    warm, cold = bool(WARM_RE.search(text)), bool(COLD_RE.search(text))
    if warm and cold:
        return "mixed"
    if warm:
        return "warm"
    if cold:
        return "cold"
    return "unknown"


def clean_tokens(text: str) -> list:
    t = STYLE_PREFIX.sub("", text.lower())
    t = BOILERPLATE.sub(" ", t)
    t = CODE_RE.sub(" ", t)
    words = re.findall(r"[a-z]{3,}", t)
    return [w for w in words if w not in STOP]


def parse_prompt(scene_no: int, text: str) -> Scene:
    text = text.strip()
    scale = detect_scale(text)
    subjects, states = parse_codes(text)
    # Karakter kodu yoksa = karaktersiz (environment / insert / nesne close-up).
    # NO_CHAR_RE yalnızca ek doğrulama; image prompt'ta genelde kod hiç olmaz.
    no_char = not subjects
    color = detect_color(text)

    # state: kodlardan (uyku > iç > dış önceliği); yoksa renkten
    state = "unknown"
    if states:
        for s in ("slp", "in", "out"):
            if s in states:
                state = STATE_FROM_SUFFIX[s]
                break
    elif color == "warm":
        state = "interior"
    elif color == "cold":
        state = "exterior"

    regime = state if state != "unknown" else "unknown"

    # establishing (hro benzeri "nefes" beat'i): dronlar + karaktersiz geniş/manzara
    establishing = scale == "drone" or (
        no_char and scale in ("wide", "drone", "top_down") and color in ("cold", "mixed")
    )

    return Scene(
        scene=scene_no, scale=scale, subjects=subjects, state=state, regime=regime,
        color=color, establishing=establishing, no_characters=no_char,
        tokens=clean_tokens(text), raw=text,
    )


def parse_document(path: str) -> list:
    with open(path, encoding="utf-8") as f:
        content = f.read()
    blocks = [b.strip() for b in re.split(r"\n\s*\n", content) if b.strip()]
    return [parse_prompt(i + 1, b) for i, b in enumerate(blocks)]


def summary(scenes: list) -> None:
    print(f"Toplam sahne: {len(scenes)}")
    print("Ölçek      :", dict(Counter(s.scale for s in scenes)))
    print("State      :", dict(Counter(s.state for s in scenes)))
    print("Renk       :", dict(Counter(s.color for s in scenes)))
    print("Karaktersiz:", sum(s.no_characters for s in scenes))
    print("Establishing:", sum(s.establishing for s in scenes))
    mixed = [s.scene for s in scenes if s.color == "mixed"]
    print(f"Mixed-renk (eşik adayı, {len(mixed)}):", mixed[:25])
    # rejim değişim noktaları (ardışık state farkı)
    changes = []
    prev = None
    for s in scenes:
        if s.regime != "unknown" and prev is not None and s.regime != prev:
            changes.append(f"{s.scene}({prev}->{s.regime})")
        if s.regime != "unknown":
            prev = s.regime
    print(f"Rejim değişimleri ({len(changes)}):", changes[:30])
    print("\nİlk 10 sahne:")
    for s in scenes[:10]:
        print(f"  #{s.scene:>3} scale={s.scale:<16} state={s.state:<9} "
              f"color={s.color:<7} subj={s.subjects} est={int(s.establishing)}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Kullanım: python3 sidecar/parser.py <image_prompt.txt>")
        sys.exit(1)
    scenes = parse_document(sys.argv[1])
    summary(scenes)
