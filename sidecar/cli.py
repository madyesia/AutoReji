#!/usr/bin/env python3
"""AutoReji — sidecar TEK GİRİŞ NOKTASI (Faz 4 köprü kontratı).

Mevcut tüm modülleri (parser / match / decide / trim / build_manifest /
analyze_video / vlm_scene / detect_crop) TEK dispatcher altında toplar.
BEYİN (Tauri 2) bunu `Command.sidecar` ile çağırır.

═══ KONTRAT ════════════════════════════════════════════════════════════════
  argv[1]          = komut adı (ör. "build_manifest", "match", "ping" …)
  GİRDİ (JSON)     = stdin'den okunur (boruyla/`child.write`).  Stdin boş/tty
                     ise argv[2] tek-eleman JSON, o da yoksa pozisyonel argv.
  ÇIKTI (JSON)     = stdout'a TEK satır + son newline.  Her zaman:
                       {"ok": true,  "cmd": <ad>, "result": <…>}
                     veya hata:
                       {"ok": false, "cmd": <ad>, "error": <mesaj>, "kind": <tip>}
  İLERLEME (ops.)  = uzun komutlarda (analyze/vlm/crop/build) stderr'e satır
                     satır JSON: {"event":"progress","cmd":…,"done":n,"total":N,"msg":…}
                     → BEYİN stderr'i dinleyip yüzde gösterir; stdout SAF sonuç kalır.
  HATA             = stderr'e insan-okur mesaj + (mümkünse) JSON; exit kodu ≠ 0.

  Çıkış kodları:  0 ok · 2 kullanım/girdi hatası · 3 bağımlılık yok (ollama vb.)
                  · 4 dosya/klasör yok · 1 beklenmeyen.

  ⚠ Mevcut modüller DEĞİŞTİRİLMEDİ — bu dosya yalnız onları sarmalar (köprü
    ince/değiştirilebilir kalsın, Blueprint mandatı). Yan-artefaktları
    (`_manifest/*.json`) build_manifest CWD'ye göre okuduğu için, çağıran
    `work_dir` verirse oraya `os.chdir` ederiz → relatif çözüm doğru yere oturur.

Örnek (kabuktan):
  echo '{"prompt":"…/(2.Bölüm) … Image Prompt.txt","video":"…/HAM/2"}' \
      | python3 sidecar/cli.py build_manifest
  python3 sidecar/cli.py ping
"""
from __future__ import annotations

import io
import json
import os
import sys
import traceback

# --- Frozen (PyInstaller) + script çalıştırma: kardeş modülleri her durumda bul.
#     Mevcut modüller `sys.path.insert(0, dirname(__file__))` ile import ediyor;
#     burada da garanti altına alıyoruz (frozen'da _MEIPASS, script'te dosya dizini).
_HERE = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)

# --- KRİTİK (paketlenmiş .app): macOS GUI uygulaması minimal PATH ile açılır
#     (/usr/bin:/bin) → Homebrew /opt/homebrew/bin YOK → subprocess ffmpeg/ffprobe'u BULAMAZ
#     (FileNotFoundError: 'ffmpeg'). Yaygın bin dizinlerini PATH'in BAŞINA ekle (idempotent).
_BIN_DIRS = ["/opt/homebrew/bin", "/opt/homebrew/sbin", "/usr/local/bin", "/usr/bin", "/bin", "/usr/sbin", "/sbin"]
_pp = [p for p in os.environ.get("PATH", "").split(os.pathsep) if p]
for _d in reversed(_BIN_DIRS):
    if _d not in _pp:
        _pp.insert(0, _d)
os.environ["PATH"] = os.pathsep.join(_pp)


# ═══ Çıktı yardımcıları ═════════════════════════════════════════════════════
def _emit_result(cmd: str, result) -> None:
    """Başarılı sonucu stdout'a TEK satır JSON yaz (BEYİN bunu okur)."""
    sys.stdout.write(json.dumps({"ok": True, "cmd": cmd, "result": result}, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def _emit_error(cmd: str, message: str, kind: str = "error") -> None:
    """Hata: stderr'e JSON + insan mesajı. (exit kodu çağıran main'de ayarlanır.)"""
    sys.stderr.write(json.dumps({"ok": False, "cmd": cmd, "error": message, "kind": kind}, ensure_ascii=False) + "\n")
    sys.stderr.flush()


def _progress(cmd: str, done: int, total: int, msg: str = "") -> None:
    """İlerleme satırı → stderr (stdout SAF sonuç kalır). BEYİN dinler, gösterir."""
    sys.stderr.write(json.dumps({"event": "progress", "cmd": cmd, "done": done, "total": total, "msg": msg}, ensure_ascii=False) + "\n")
    sys.stderr.flush()


class CliError(Exception):
    """Beklenen hata → temiz mesaj + exit kodu (traceback'siz)."""
    def __init__(self, message: str, code: int = 2, kind: str = "usage"):
        super().__init__(message)
        self.code = code
        self.kind = kind


# ═══ Girdi okuma ════════════════════════════════════════════════════════════
def _read_input(argv: list) -> dict:
    """JSON girdiyi sırayla dene: stdin (boru) → argv[2] (tek JSON) → {}.

    Boş/eksik girdi {} döner; her komut kendi alanını savunmacı okur
    (eksikse CliError). Pozisyonel argv (komut sonrası düz string'ler)
    ayrıca `_positional` altında verilir → kabuktan hızlı test için.
    """
    data: dict = {}
    # 1) stdin GİRDİSİ VAR MI? Sadece boru/yönlendirme ise oku (asla bloklamadan).
    #    tty → etkileşimli, girdi yok. tty değil ama bağlı bir terminal/eşdeğeri olabilir;
    #    bu yüzden okumadan önce select() ile "okunacak veri hazır mı" diye bakarız.
    #    Bağlanmamış/boş bir stdin'de read() EOF'u beklerken BLOKLAR — bunu engelliyoruz.
    if not sys.stdin.isatty() and _stdin_has_data():
        raw = sys.stdin.read()
        if raw and raw.strip():
            try:
                parsed = json.loads(raw)
                if isinstance(parsed, dict):
                    data = parsed
                else:
                    raise CliError("stdin JSON bir nesne (obje) olmalı", 2, "input")
            except json.JSONDecodeError as e:
                raise CliError(f"stdin JSON ayrıştırılamadı: {e}", 2, "input")
    # 2) stdin boşsa argv[2] tek-eleman JSON olabilir
    if not data and len(argv) >= 3 and argv[2].lstrip().startswith("{"):
        try:
            parsed = json.loads(argv[2])
            if isinstance(parsed, dict):
                data = parsed
        except json.JSONDecodeError:
            pass
    # 3) pozisyonel argümanlar (JSON olmayan) → kabuk testi kolaylığı
    positional = [a for a in argv[2:] if not a.lstrip().startswith("{") and not a.startswith("--")]
    if positional:
        data.setdefault("_positional", positional)
    return data


def _stdin_has_data(timeout: float = 0.15) -> bool:
    """Stdin'de okunacak veri/EOF hazır mı? select() ile BLOKLAMADAN bak.

    - Boru/yönlendirme ile JSON gelirse → hazır (True), read() güvenle çalışır.
    - /dev/null veya kapalı stdin → EOF hazır (True), read() anında "" döner.
    - Yazıcısı olmayan, bağlı bir terminal-pipe (kabuktan pozisyonel test) → hazır
      DEĞİL (False) → read() ÇAĞRILMAZ, sonsuz blok yok.
    Windows'ta select() pipe'larda çalışmaz → orada güvenli tarafta (True);
    AutoReji macOS hedefli, bu yol asıl. Sorun olursa argv yolu zaten var.
    """
    try:
        import select
        r, _, _ = select.select([sys.stdin], [], [], timeout)
        return bool(r)
    except Exception:
        # select desteklenmiyorsa (ör. Windows pipe): okumayı dene; çoğu durumda
        # brain JSON'ı borular → veri vardır. Risk: boş inherited stdin'de blok.
        return not sys.stdin.isatty()


def _req(data: dict, *keys: str):
    """Zorunlu alanları sırayla al; pozisyonel fallback ile. Yoksa CliError."""
    pos = data.get("_positional", [])
    out = []
    for i, k in enumerate(keys):
        v = data.get(k)
        if v is None and i < len(pos):
            v = pos[i]
        if v is None:
            raise CliError(f"eksik alan: '{k}'", 2, "input")
        out.append(v)
    return out[0] if len(out) == 1 else out


def _chdir_workdir(data: dict) -> None:
    """build/manifest yan-artefaktları (_manifest/*.json) CWD-relatif okunur.
    Çağıran `work_dir` verirse oraya geç → relatif çözüm doğru klasöre oturur."""
    wd = data.get("work_dir")
    if wd:
        if not os.path.isdir(wd):
            raise CliError(f"work_dir yok: {wd}", 4, "notfound")
        os.chdir(wd)


def _exists(path: str, what: str) -> str:
    if not path or not os.path.exists(path):
        raise CliError(f"{what} yok: {path}", 4, "notfound")
    return path


# ═══ Komut işleyicileri ═════════════════════════════════════════════════════
# Her işleyici: (data: dict) -> JSON-serileştirilebilir sonuç. Hata → CliError
# (beklenen) veya başka Exception (beklenmeyen → main yakalar, traceback stderr).

def cmd_ping(data: dict):
    """Sağlık/sürüm kontrolü — BEYİN sidecar'ın canlı olduğunu doğrular."""
    import platform
    deps = {}
    for tool in ("ffmpeg", "ffprobe"):
        deps[tool] = _which(tool)
    return {
        "service": "autoreji-sidecar",
        "python": platform.python_version(),
        "frozen": bool(getattr(sys, "frozen", False)),
        "commands": sorted(COMMANDS.keys()),
        "deps": deps,
    }


def cmd_parse(data: dict):
    """Image prompt belgesini sahne sahne ayrıştır (parser.parse_document)."""
    from dataclasses import asdict
    import parser as _parser  # noqa: E402  (kardeş modül)
    prompt = _exists(_req(data, "prompt"), "prompt belgesi")
    scenes = _parser.parse_document(prompt)
    return {"count": len(scenes), "scenes": [asdict(s) for s in scenes]}


def cmd_match(data: dict):
    """prompt[N] ↔ video N eşleştir + varyant + (ops.) ffprobe (match.match_episode)."""
    import match as _match  # noqa: E402
    prompt, video = _req(data, "prompt", "video")
    _exists(prompt, "prompt belgesi")
    _exists(video, "video klasörü")
    do_probe = bool(data.get("probe", False))
    merged, report = _match.match_episode(prompt, video, do_probe)
    # merged içinde dataclass var → JSON için sadeleştir (rapor zaten asıl çıktı).
    return {"report": report, "matched": len(merged)}


def cmd_detect_crop(data: dict):
    """Siyah bar (letterbox) tespiti → klip başına Scale faktörü (detect_crop.detect)."""
    import detect_crop as _crop  # noqa: E402
    video = _exists(_req(data, "video"), "video klasörü")
    frames = int(data.get("frames", 120))
    out_dir = data.get("out", "_manifest")
    res = _crop.detect(video, frames)
    # diske de yaz (build_manifest bunu _manifest/'ten okur) — mevcut sözleşme korunur
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, "crop_scales.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(res, f, indent=2)
    barred = sum(1 for v in res.values() if v.get("scale", 1.0) > 1.0)
    return {"path": os.path.abspath(path), "count": len(res), "barred": barred}


def cmd_analyze_video(data: dict):
    """DERİN ANALİZ + heuristik QC (analyze_video). Her kareyi ffmpeg ile tarar.
    İlerleme stderr'e; sonuç _manifest/video_analysis.json'a + stdout özetine."""
    import concurrent.futures as cf
    import analyze_video as _av  # noqa: E402
    video = _exists(_req(data, "video"), "video klasörü")
    out_dir = data.get("out", "_manifest")
    limit = data.get("limit")
    if "scale" in data:
        _av.SCALE = int(data["scale"])

    files = sorted(
        [f for f in os.listdir(video)
         if f.lower().endswith((".mp4", ".mov", ".m4v")) and _av.scene_of(f) is not None],
        key=lambda x: _av.scene_of(x),
    )
    seen, uniq = set(), []
    for f in files:
        sc = _av.scene_of(f)
        if sc not in seen:
            seen.add(sc)
            uniq.append(f)
    if limit:
        uniq = uniq[: int(limit)]
    if not uniq:
        raise CliError(f"video klasöründe ayrıştırılabilir klip yok: {video}", 4, "notfound")

    result, done = {}, 0
    total = len(uniq)

    def work(f):
        try:
            return _av.scene_of(f), _av.analyze_one(os.path.join(video, f))
        except Exception as e:  # tek klip patlasa diğerleri sürsün
            return _av.scene_of(f), {"error": str(e)}

    with cf.ThreadPoolExecutor(max_workers=_av.WORKERS) as ex:
        for sc, d in ex.map(work, uniq):
            result[str(sc)] = d
            done += 1
            if done % 10 == 0 or done == total:
                _progress("analyze_video", done, total, f"{done}/{total} klip")

    _av._finalize(result)
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, "video_analysis.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump({"scale": _av.SCALE, "count": len(result), "clips": result}, f, indent=2)
    risky = [k for k, v in result.items() if (v.get("qc") or {}).get("risk", 0) > 0]
    return {"path": os.path.abspath(path), "count": len(result), "risky": len(risky)}


def cmd_vlm_scene(data: dict):
    """YEREL GÖRSEL-AI sahne sinyalleri (vlm_scene → Ollama/Qwen2.5-VL).
    energy/role/mood/linger. Ollama/model yoksa temiz hata (exit 3)."""
    import concurrent.futures as cf
    import vlm_scene as _vlm  # noqa: E402
    import urllib.request

    video = _exists(_req(data, "video"), "video klasörü")
    out_dir = data.get("out", "_manifest")
    model = data.get("model", _vlm.MODEL)
    n = int(data.get("frames", _vlm.FRAMES))
    par = int(data.get("parallel", _vlm.PAR))
    limit = data.get("limit")
    only = None
    if data.get("scenes"):
        only = {int(x) for x in str(data["scenes"]).replace(" ", "").split(",") if x}

    ollama = os.environ.get("OLLAMA_URL", _vlm.OLLAMA)
    try:
        urllib.request.urlopen(f"{ollama}/api/version", timeout=5)
    except Exception:
        raise CliError("Ollama çalışmıyor (yerel görsel-AI). Başlat: `brew services start ollama`", 3, "dependency")
    if not _vlm._check_model(model):
        raise CliError(f"Görsel-AI modeli yok: {model}. İndir: `ollama pull {model}`", 3, "dependency")

    files = sorted(
        [f for f in os.listdir(video)
         if f.lower().endswith((".mp4", ".mov", ".m4v")) and _vlm.scene_of(f) is not None],
        key=lambda x: _vlm.scene_of(x),
    )
    seen, uniq = set(), []
    for f in files:
        sc = _vlm.scene_of(f)
        if sc in seen or (only and sc not in only):
            continue
        seen.add(sc)
        uniq.append(f)
    if limit:
        uniq = uniq[: int(limit)]
    if not uniq:
        raise CliError(f"video klasöründe ayrıştırılabilir klip yok: {video}", 4, "notfound")

    result, done = {}, 0
    total = len(uniq)

    def process(f):
        sc = _vlm.scene_of(f)
        try:
            imgs = _vlm._frames_b64(os.path.join(video, f), n)
            r = _vlm._ask(imgs, model) if imgs else {"energy": 3, "role": "scenery", "mood": "", "linger": False}
        except Exception as e:
            r = {"energy": 3, "role": "scenery", "mood": "", "linger": False, "error": str(e)}
        return sc, r

    with cf.ThreadPoolExecutor(max_workers=par) as ex:
        for sc, r in ex.map(process, uniq):
            result[str(sc)] = r
            done += 1
            if done % 10 == 0 or done == total:
                _progress("vlm_scene", done, total, f"{done}/{total} klip")

    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, "vlm_scene.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump({"model": model, "frames": n, "count": len(result), "clips": result}, f, ensure_ascii=False, indent=2)
    return {"path": os.path.abspath(path), "count": len(result), "model": model}


def cmd_build_manifest(data: dict):
    """ASIL ÇIKTI: parser+match+decide+trim → <bölüm>_manifest.json (JSON EDL §10).
    Yan-artefaktlar (_manifest/*.json) varsa kararları zenginleştirir."""
    import build_manifest as _bm  # noqa: E402
    prompt, video = _req(data, "prompt", "video")
    _exists(prompt, "prompt belgesi")
    _exists(video, "video klasörü")
    do_probe = bool(data.get("probe", False))
    out_dir = data.get("out", "_manifest")

    manifest, report, cfg, downgraded = _bm.build_manifest(prompt, video, do_probe)
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, f"{manifest['episode']['name']}_manifest.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    errs, warns = _bm.validate(manifest)
    clips = manifest["clips"]
    trans = [c["transition_in"]["type"] for c in clips if c["transition_in"]]
    from collections import Counter
    tc = Counter(trans)
    return {
        "manifest_path": os.path.abspath(out_path),
        "episode": manifest["episode"]["name"],
        "clips": len(clips),
        "transitions": {"cut": len(clips) - 1 - len(trans), "fade": tc.get("fade", 0), "black": tc.get("black", 0)},
        "fades_downgraded_to_cut": len(downgraded),
        "report": report,
        "errors": errs,
        "warnings": warns[:20],
        "config_hash": manifest["build"]["config_hash"],
    }


# ═══ Ollama (yerel görsel-AI) durum + indirme — GERÇEK, çalışma anıyla AYNI yol ═══
#  Tespit ve indirme Ollama HTTP API'si (localhost:11434) üzerinden yapılır:
#  PATH/CLI gerekmez (paketli .app'te `ollama` komutu PATH'te YOK), CORS yok.
#  "hazır" demek = çalışma anında VLM gerçekten çalışacak (sahte simülasyon YOK).
def _ollama_url():
    return os.environ.get("OLLAMA_URL", "http://localhost:11434")


def _ollama_running(timeout: float = 4.0) -> bool:
    import urllib.request
    try:
        urllib.request.urlopen(f"{_ollama_url()}/api/version", timeout=timeout)
        return True
    except Exception:
        return False


def _ollama_tags() -> list:
    import urllib.request
    try:
        with urllib.request.urlopen(f"{_ollama_url()}/api/tags", timeout=8) as r:
            return json.loads(r.read().decode("utf-8")).get("models", []) or []
    except Exception:
        return []


def _model_on_disk(model: str) -> bool:
    """Ollama model manifesti diskte mi? (server kapalı olsa bile kesin bilgi.)"""
    name = model.split(":")[0]
    tag = model.split(":")[1] if ":" in model else "latest"
    base = os.path.expanduser("~/.ollama/models/manifests/registry.ollama.ai/library")
    return os.path.exists(os.path.join(base, name, tag))


def _ollama_installed() -> bool:
    cands = ["/Applications/Ollama.app", os.path.expanduser("~/.ollama"),
             "/usr/local/bin/ollama", "/opt/homebrew/bin/ollama", "/usr/bin/ollama"]
    return any(os.path.exists(c) for c in cands)


def cmd_ollama_status(data: dict):
    """Ollama + model durumu — GERÇEK (HTTP + disk). BEYİN her açılışta çağırır.
    running: server ayakta · installed: Ollama kurulu (server kapalı olsa da) ·
    hasModel: server modeli SUNABİLİYOR (ready) · onDisk: model dosyaları var ·
    ready: çalışma anında VLM çalışır (server ayakta + model var)."""
    model = data.get("model", "qwen2.5vl:7b")
    running = _ollama_running()
    base = model.split(":")[0]
    models, has_model = [], False
    if running:
        for m in _ollama_tags():
            nm = m.get("name", "")
            models.append(nm)
            if nm == model or nm.split(":")[0] == base:
                has_model = True
    on_disk = _model_on_disk(model)
    return {
        "model": model,
        "running": running,
        "installed": running or _ollama_installed(),
        "hasModel": has_model,
        "onDisk": on_disk,
        "ready": bool(running and (has_model or on_disk)),
        "models": models,
    }


def cmd_ollama_pull(data: dict):
    """Modeli GERÇEKTEN indir — Ollama /api/pull (stream). PATH/CLI gerekmez.
    İlerleme stderr _progress ile akar (BEYİN gösterir). Ollama kapalıysa temiz hata.
    Bitince GERÇEKTEN sunulabiliyor mu doğrular (sahte 'indi' YOK)."""
    import urllib.request
    model = data.get("model", "qwen2.5vl:7b")
    if not _ollama_running():
        raise CliError("Ollama çalışmıyor — Ollama uygulamasını başlat, sonra tekrar dene.", 3, "dependency")
    body = json.dumps({"name": model, "stream": True}).encode("utf-8")
    req = urllib.request.Request(f"{_ollama_url()}/api/pull", data=body,
                                 headers={"Content-Type": "application/json"})
    last_total = 1
    _progress("ollama_pull", 0, 1, "Bağlanıyor")
    with urllib.request.urlopen(req, timeout=None) as r:
        for raw in r:
            s = raw.decode("utf-8", "replace").strip()
            if not s:
                continue
            try:
                ev = json.loads(s)
            except Exception:
                continue
            if ev.get("error"):
                raise CliError(f"Ollama indirme hatası: {ev['error']}", 3, "dependency")
            status = ev.get("status", "")
            total = int(ev.get("total", 0) or 0)
            completed = int(ev.get("completed", 0) or 0)
            if total:
                last_total = total
            _progress("ollama_pull", completed, total or last_total, status)
            if status == "success":
                break
    ready = any(m.get("name", "").split(":")[0] == model.split(":")[0] for m in _ollama_tags())
    return {"model": model, "ok": True, "ready": ready}


COMMANDS = {
    "ping": cmd_ping,
    "parse": cmd_parse,
    "match": cmd_match,
    "detect_crop": cmd_detect_crop,
    "analyze_video": cmd_analyze_video,
    "vlm_scene": cmd_vlm_scene,
    "build_manifest": cmd_build_manifest,
    "ollama_status": cmd_ollama_status,
    "ollama_pull": cmd_ollama_pull,
}


# ═══ Yardımcı ═══════════════════════════════════════════════════════════════
def _which(tool: str):
    import shutil
    return shutil.which(tool) is not None


# ═══ Giriş ══════════════════════════════════════════════════════════════════
def main(argv: list | None = None) -> int:
    argv = list(sys.argv if argv is None else argv)
    # stdout'u UTF-8'e zorla (Premiere/CC ortamı bazen ascii locale verir)
    try:
        sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
        sys.stderr.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
    except Exception:
        pass

    if len(argv) < 2 or argv[1] in ("-h", "--help"):
        _emit_error("(yok)", "Kullanım: cli.py <komut> ; girdi=stdin JSON. Komutlar: "
                    + ", ".join(sorted(COMMANDS)), "usage")
        return 2

    cmd = argv[1]
    handler = COMMANDS.get(cmd)
    if handler is None:
        _emit_error(cmd, f"bilinmeyen komut: {cmd}. Geçerli: {', '.join(sorted(COMMANDS))}", "usage")
        return 2

    try:
        data = _read_input(argv)
        _chdir_workdir(data)
        result = handler(data)
        _emit_result(cmd, result)
        return 0
    except CliError as e:
        _emit_error(cmd, str(e), e.kind)
        return e.code
    except KeyboardInterrupt:
        _emit_error(cmd, "iptal edildi", "interrupt")
        return 130
    except Exception as e:  # beklenmeyen → traceback stderr'e (debug), temiz JSON da yaz
        _emit_error(cmd, f"{type(e).__name__}: {e}", "unexpected")
        traceback.print_exc(file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
