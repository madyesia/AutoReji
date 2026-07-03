# AutoReji

**Madyes** tarafından yayımlanan, **"Ghibli Mood ON"** kanalı için **otomatik kurgu sistemi** (macOS). Her gün ~160 klipten oluşan bir bölümü **Adobe Premiere Pro 2026**'da **düzenlenebilir klipler + düzenlenebilir geçişler + native stereo ses** ile, **render almadan** kurar. Tamamen **yerel/offline** çalışır (çalışma anında ücretli/harici AI yok; internet yalnız ilk kurulum indirmesi için).

- **Sürüm:** **AutoReji beta v1.3** (teknik semver 1.3.0)
- **Durum:** Üretim/beta sürümü — Faz 0–4 tamam. Gerçek macOS `.app` derleniyor, ad-hoc imzalı, açılıyor.
- **Telif:** AutoReji beta v1.3 · Developed by Madyes © 2026 → [`LICENSE`](LICENSE)
- **Tam spesifikasyon:** [`docs/Blueprint.md`](docs/Blueprint.md) · **Durum/devir:** [`DEVAM.md`](DEVAM.md) · **Kurallar/rol:** [`CLAUDE.md`](CLAUDE.md) · **İş listesi:** [`PLAN.md`](PLAN.md)

## Mimari
```
[image prompt + (ops.) video prompt + video klasörü]
        ↓  BEYİN — Tauri 2 (.app) + Python sidecar
   manifest.json (JSON EDL) + native dosya yolları
        ↓  MONTAJCI — Premiere UXP panel (tek "Bölümü Kur")
   Premiere'de native stereo, düzenlenebilir, render'sız timeline
```

## Son kullanıcı kurulumu (uygulamayı kullanmak için)
1. **AutoReji.app**'i edinin ve `Applications` klasörüne kopyalayın.
2. **İlk açılış** (ad-hoc imza, ücretsiz dağıtım): uygulamaya **sağ tıklayın → Aç → Aç**. Bu yalnızca bir kez gerekir; sonra normal açılır.
3. **Hazırlık** ekranı her açılışta üç bileşeni gerçek olarak kontrol eder:
   - **Adobe Premiere Pro 2026** — kurulu olmalı.
   - **AI modeli (Ollama, yerel & ücretsiz)** — kurulu değilse uygulama [ollama.com](https://ollama.com)'a yönlendirir; görsel-AI modelini (`qwen2.5vl:7b`, ~6 GB, tek sefer) uygulama içinden indirir. Sonra tamamen offline çalışır.
   - **MONTAJCI paneli** — uygulamadan `.ccx`'i indirin → çift tıklayın → Creative Cloud kurar → Premiere'de **Window → UXP Plugins → AutoReji**.
4. **Bir bölüm kurun:** görsel prompt belgesi + video klasörünü seçin → analiz → İnceleme'de gözden geçirin → **Manifest'i Kaydet** → Premiere'de AutoReji panelinde **Bölümü Kur**.

## Gereksinimler
- **macOS 11 (Big Sur) veya üzeri**, **Apple Silicon (arm64)**
- **Adobe Premiere Pro 2026** (UXP panel desteği)
- **Ollama** (yerel görsel-AI; ücretsiz, tek seferlik indirme) — uygulama yönlendirir/indirir

## Geliştirme (kaynaktan)
```bash
bash scripts/setup.sh         # bağımlılıklar: Node/npm, Rust/cargo, ffmpeg/ffprobe
cd brain && npm run dev       # UI önizleme → http://localhost:5173 (tarayıcı, örnek bölüm)
bash scripts/build.sh         # .app paketle → src-tauri/target/aarch64-apple-darwin/release/bundle/macos/AutoReji.app
```
Diğer scriptler: `build_sidecar.sh` (Python sidecar → tek-dosya binary) · `pack_panel.sh` (UXP paneli → `.ccx`) · `fetch_models.sh` (modeli indir) · `dev.sh`.

## Taşınabilirlik
Bu repo **kendi içinde taşır**: kaynak kod + tüm belgeler + bağımlılık manifestoları + scriptler. Başka bir makineye/hesaba verildiğinde `CLAUDE.md` + `DEVAM.md` okunur, `scripts/setup.sh` çalışır, geliştirmeye devam edilir. Ayrıntı: [`docs/Blueprint.md`](docs/Blueprint.md) §20.

## Lisans
Özel (proprietary) yazılım — **© 2026 Madyes**, tüm hakları saklıdır. Bkz. [`LICENSE`](LICENSE).
