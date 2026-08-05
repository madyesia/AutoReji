# AutoReji

**Madyes** tarafından yayımlanan, **"Ghibli Mood ON"** kanalı için **otomatik kurgu sistemi** (macOS). Her gün ~160 klipten oluşan bir bölümü **Adobe Premiere Pro 2026**'da **düzenlenebilir klipler + düzenlenebilir geçişler + native stereo ses** ile, **render almadan** kurar. Tamamen **yerel/offline** çalışır (çalışma anında ücretli/harici AI yok; internet yalnız ilk kurulum indirmesi için).

- **Sürüm:** **AutoReji beta v1.8** (teknik semver 1.8.0)
- **Durum:** Üretim/beta sürümü — Faz 0–7 tamam. Gerçek macOS `.app` derleniyor, ad-hoc imzalı, açılıyor. (Faz 5: 7 turluk UI/UX yenilemesi · Faz 6: Hızlı Üretim modu · Faz 7: üretim sağlamlığı.)
- **Telif:** AutoReji beta v1.8 · Developed by Madyes © 2026 → [`LICENSE`](LICENSE)
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
   - **AI modeli (Ollama, yerel & ücretsiz)** — kurulu değilse uygulama [ollama.com](https://ollama.com)'a yönlendirir; görsel-AI modelini (`qwen2.5vl:7b`, ~6 GB, tek sefer) uygulama içinden indirir. Sonra tamamen offline çalışır. *(Zorunlu değil — bkz. Hızlı Üretim.)*
   - **MONTAJCI paneli** — uygulamadan `.ccx`'i indirin → çift tıklayın → Creative Cloud kurar → Premiere'de **Window → UXP Plugins → AutoReji**.
4. **Bir bölüm kurun:** görsel prompt belgesi + video klasörünü seçin → analiz → İnceleme'de gözden geçirin → **Manifest'i Kaydet** → Premiere'de AutoReji panelinde **Bölümü Kur**.

## İki üretim modu
| | **Normal** (görsel-AI açık) | **⚡ Hızlı Üretim** (Giriş ekranındaki anahtar) |
|---|---|---|
| Görsel-AI (Ollama) | her klibe bakar | **atlanır** → 160 klipte dakikalar kazanılır |
| Ritim/süre kaynağı | AI yargısı (enerji/rol/oyalanma) + ölçümler | ölçülen hareket + sahne bilgisi + seed'li ritim dalgası |
| Süre çeşitliliği (REF B2) | 4.96–6.79s · 40 benzersiz | 4.58–6.71s · **45 benzersiz** |
| Ollama gerekir mi | evet | **hayır** |
| Geçişler · crop · native stereo · 4.30s taban | aynı | aynı |

Anahtar kalıcıdır (bir kez açılır, hep açık kalır). Hızlı modda arayüz AI verisi/rozeti göstermez (sahte bilgi yok).

## Üretim notları
- **Baş/son siyah fade varsayılan KAPALI** — bölüm düz başlar/biter. İstenirse `config/config.toml` → `intro_fade` / `outro_fade`.
- **Eksik klip esnektir** — 160 sahnelik prompt + 159/145 video verirseniz eksik sahneler atlanır, manifest kaç klip varsa onunla kurulur (Premiere entegrasyonu hata vermez); analiz ekranı atlananları bildirir.

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
