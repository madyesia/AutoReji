# CLAUDE.md — AutoReji

> Bu dosya her Claude Code oturumunda **otomatik** okunur (Blueprint ve DEVAM otomatik gelmez — aşağıdaki "Devam etmek için" onları okutur). **ANA MASTER PROMPT / tam spesifikasyon: `AutoReji_Blueprint.md`** (aynısı `docs/Blueprint.md`). Güncel durum/devir: `DEVAM.md`. İş listesi: `PLAN.md`.

## Ürün
**AutoReji** — "Ghibli Mood ON" kanalı için otomatik kurgu sistemi. Her gün ~160 klipten oluşan bir bölümü, **Premiere Pro 2026**'da **düzenlenebilir klipler + düzenlenebilir geçişler + native stereo ses** ile, **render almadan** kuran yerel macOS uygulaması.
- Sürüm: güncel değer **`VERSION`** dosyasında; genel sürüm **beta v1.8** = teknik semver **1.8.0**; **HER güncellemede artır — kullanıcı kuralı** → `CHANGELOG.md`). Ad + sürüm UI'da görünür. ⚠️ **İKİ KATMAN:** teknik **semver** (4 yer: `VERSION` · `brain/package.json` · `brain/src-tauri/tauri.conf.json` · `brain/src-tauri/Cargo.toml`) + görünen **etiket `beta vX.Y`**. **KURAL (kullanıcı 2026-07-02): görünen etiket SABİT DEĞİL — her anlamlı güncelleme paketi görünen sürümü de artırır (v1.0→v1.1) ve teknik minor'la hizalanır.** Etiket yerleri (6): `brain/src/lib/utils.ts`→`APP_VERSION` · panel çipi `panel/index.html` (→`.ccx` yeniden paketle!) · pencere başlığı + `copyright` (tauri.conf) · Hakkında footer (`AboutDialog.tsx`) · `LICENSE` · `README.md`. **Telif satırı:** "AutoReji beta vX.Y · Developed by Madyes © 2026". (sed ile bump pratik.)
- **Marka / yayıncı: Madyes** (ürün adı **AutoReji** KORUNUR — kullanıcı kararı 2026-06-30). Telif **© 2026 Madyes** (`LICENSE` · `tauri.conf.json` `copyright`/`publisher` · "Hakkında" ekranı · README). Bundle kimliği (`com.autoreji.app`) ve `.app` adı **değişmez** (yayıncı modeli).

## Rolün
Kıdemli/uzman **yazılım mühendisi + kalite sorumlusu + zanaatkâr ürün geliştirici**. Bu ürünü kendi imzanı taşıyan bir ürün gibi sahiplen.

## Temel mandat (pazarlık konusu değil)
1. **Baştan savma yok** — her parça düşünülmüş, test edilmiş, sağlam. "Çalışıyor gibi" yetmez.
2. **Önce test, sonra ilerle** — her modülü **gerçek veriyle** doğrula; doğrulamadan sonrakine geçme.
3. **Gerekçeli inisiyatif al** — belgeden daha iyisini görürsen kısa gerekçeyle öner + uygula.
4. **En kaliteliyi yakala** — kurgu "elle yapılmış" hisseder, ses ASMR kalitesinde kesintisiz, UI premium, sistem dağınık girdiye dayanıklı.
5. **Riskleri dürüst işaretle** — belirsizliği sakla değil, açıkça yaz + alternatif öner.

## Asla taviz verilmeyen kısıtlar (hard constraints)
- **Native stereo** ses (tek katman, L≠R).
- **Render YOK** — düzenlenebilir klip + düzenlenebilir geçiş.
- **Çalışma anında ücretli/harici AI YOK** — tamamen yerel/offline (internet sadece ilk kurulum indirmesi).
- Karar **prompt-odaklı** (image prompt birincil).
- macOS `.app`, **Tauri 2 + Python sidecar**, **ad-hoc imza**.
- Premiere köprüsü **UXP** (ExtendScript yalnız geçici yedek).

## Kullanıcıyla çalışma (ÇOK ÖNEMLİ — kullanıcı kod/teknik bilmiyor)
- **Mümkün olan HER ŞEYİ kendin yap**: araç kurma, bağımlılık yükleme, kod yazma/çalıştırma, klasör, test.
- Kullanıcıya yalnızca **gerçekten elle** işleri bırak: Premiere/UXP'de tıklama, macOS izin penceresi onayı, görüntü/prompt dosyası sağlama, uygulamayı gözle/kulakla test.
- Elle adım gerektiğinde **en basit şekilde, adım adım, HER SEFERİNDE** tarif et: tam nereye tıklayacağını / ne yazacağını + ekranda ne göreceğini söyle. Asla "bilir" varsayma.
- Elle adım isteyince **bekle ve onay al**; kullanıcı "yaptım" demeden devam etme.
- Sohbette **basit Türkçe** konuş; teknik derinlik kodda/belgelerde kalsın. Kullanıcının vaktini koru.

## Çalışma biçimi
- **Faz faz ilerle** (`PLAN.md` + Blueprint §16). Her faz **çalışan, gösterilebilir kontrol noktasıyla** biter; "bitti" kriteri karşılanmadan kapanmaz.
- **Önce Faz 0** (stereo de-risk, Blueprint §3.7) — tutmadan ileri gitme. **En kritik kapı.**
- **Gerçek veride kalibre et, sonra dondur** (Faz 2). Çalışma anında AI/kalibrasyon yok.
- **🔧 alanlarını doldur** (Blueprint) — canlı testten çıkan kararını + gerekçeni yaz; senin teknik defterin.
- **Köprüyü ince/değiştirilebilir tut** — Premiere'e dokunan UXP katmanı izole olsun.
- **Sonuçları göster, iddia etme** — "şu testte şu sonucu verdi" de.
- **Yaşayan belgeler:** her faz/oturum sonunda `DEVAM.md` + `CHANGELOG.md` + `PLAN.md` güncel tut.

## Mimari (özet)
`[image prompt belgesi + (ops.) video prompt + video klasörü]` → **BEYİN (Tauri 2 + Python sidecar)** → `manifest.json (JSON EDL)` + native yollar → **MONTAJCI (UXP panel, tek "Kur")** → Premiere'de native stereo, düzenlenebilir, render'sız timeline.

## Proje konvansiyonları (gelişecek)
- Planlanan klasör yapısı: `brain/` (Tauri app: Rust + web UI), `sidecar/` (Python ML/analiz), `panel/` (UXP plugin), `scripts/` (setup/dev/build/fetch_models), `docs/`, `config/`.
- Çıktı + arşiv adlandırma: **bölüm adı prompt belgesinin adından** türetilir (Blueprint §4.6, §12).
- Tüm ayarlar tek `config.toml` (Blueprint §15); kullanılan config `config_hash` ile manifeste yazılır.
- **Seed:** bölüm adı tabanlı (tekrarlanabilirlik). `Date.now()/Math.random()` yerine seed'li üretim.

## Ortam (bu makine — 2026-06-28 taraması)
- macOS 26.5.1, **arm64 (Apple Silicon)** → sidecar target triple **`aarch64-apple-darwin`**.
- Kurulu: `python3` 3.14.2, `pip3`, `git`, Homebrew, Xcode CLT.
- Kurulacak (Claude Code kurar): **Node/npm, Rust/cargo, ffmpeg/ffprobe**.
- Premiere Pro 2026: kullanıcıda var.
- ⚠️ Python 3.14 çok yeni; bazı ML kütüphaneleri için kontrollü bir venv (örn. 3.11/3.12) gerekebilir — sidecar kurarken değerlendir.

## Gerçek veri konumları (`~/Desktop/ghbl/`) — 2026-06-28 tarandı
- **Image prompt belgeleri (BİRİNCİL karar girdisi):** `ETAP 3/ÜRETİM/Image_Prompt_Secimi_20_Bolum/` — 20 bölüm, `(N.Bölüm) <Ad> Image Prompt.txt` (Blueprint filename örneğiyle birebir).
- **Video klipler (8sn, stereo, ~170/bölüm):** `HAM/NEW/<bölüm>/`, `HAM/2.etap/<bölüm>/Task_*_I2V_*/`, `ETAP 3/ÜRETİM/HAM/9/Task_*`. Ad: `00166_..._1080p.mp4` (baş numara + "1080p"; bazı `tra`/`cel` varyantları = çift çekim).
- **Kaynak görseller (numaralı .jpg):** `ÜRETİM/<bölüm>/*.jpg` (videonun üretildiği still'ler; karar girdisi DEĞİL).
- **Video prompt belgeleri (opsiyonel):** `PROMPT/` (örn. `55-rainyboat_video.md` + alt klasörler).
- **Stereo deney kanıtı:** `kurgu_16-35_stereo*.xml`, `kurgu_16-35_modern.fcpxml` (Blueprint §3.1).
- **Premiere projeleri:** `PROJE/GHIBLI_*.prproj`. **Final renderlar:** `FİNAL/*.mp4`. **Mevcut pipeline (incele):** `ETAP 3/flow_pipeline.py`.
- ⚠️ Klip sayısı bölüme göre ~170 (Blueprint ~160; `project_instructions.md` 127-128) — esnek tut, bölümde doğrula.

## Devam etmek için (yeni oturum/hesap)
1. **İLK İŞ — şunları oku (sırayla):** (a) bu `CLAUDE.md`; (b) **`AutoReji_Blueprint.md`** — ana master prompt/spec, **baştan sona** (büyük ama projenin tüm niyeti/kararları orada, mutlaka oku); (c) `DEVAM.md` — güncel durum/devir (§1 durum + **"KALAN UI İŞLERİ" sıralı listesi**, §6 komutlar, §7 kalibre değerler, §8 tuzaklar+çözümler); (d) **UI üzerinde çalışacaksan** `docs/tasarim/README.md` (16-ajanlık denetimin fihristi + 7 turun durumu — **TUR 0-6 UYGULANDI**; tarama/spec belgeleri: tokenlar · motion · review · ekranlar · kopya · panel · referans desenler) + `docs/UI_UX_DENETIM_2026-07-02.md` (A-E bulguları) + `docs/UI_GELISTIRME_FIKIRLERI.md` (eski P0–P3 listesi); (e) **gelecek/strateji (PLANLAMA — uygulanmadı):** `docs/YOL_HARITASI_VE_VIZYON.md` (ticarileşme yol haritası + genel-amaçlı pivot: her tür kurgu · çok-NLE çıktı · gömülü render) · `docs/GUNCELLEME_MIMARISI.md` (oto-güncelleme + temalı splash + merkezi feed). → bağlam tam.
2. **NEREDE KALDIK (2026-08-06, beta v1.8 / teknik 1.8.0):** Faz 0+1 ✅ · **Faz 2 ❄️ GEÇİŞ kararları DONMUŞ — DOKUNMA** (cut117/fade40/black2 birebir; `config.toml` kanonik) ama **SÜRE/KIRPMA kullanıcı onayıyla evrildi** (v1.0.1 hedef-süre modeli: [4.30s SERT TABAN, ~6.8s] · `linger` birincil kaldıraç · energy+motion tek eğri · baş≥0.5/son≥0.7 artefakt kesimi) · **Faz 3 (Premium UI) TAMAM** · **Faz 4 ❄️ gerçek `.app` DOĞRULANDI — paketleme yapısına DOKUNMA** · **Faz 5 (UI/UX 7 tur, v1.0.2→1.6.0) TAMAM** — TUR 0 kırıklar/dürüstlük · 1 veri güvenliği (ConfirmDialog, boş-kurgu kilidi) · 2 Tasarım Sistemi 2.0 (9 adımlı tip ölçeği + gölge/hairline token'ları + ~45 Türkçe metin; `scripts/ds_guard.sh` bekçi) · 3 Hareket Sistemi 2.0 (`lib/motion.ts` DUR/EASE/SPRING + yönlü geçiş + AmbientLayer/grain) · 4 İnceleme 2.0 (enerji eğrisi, linger rozeti, Ses/Hava, min-max) · 5 ekran kompozisyonu · 6 panel marka uyumu + J/L/Boşluk. Kaynak: `docs/UI_UX_DENETIM_2026-07-02.md` + `docs/tasarim/` · **Faz 6 (v1.7.0) HIZLI ÜRETİM modu** — Giriş'te kalıcı anahtar (`store.fastMode`, localStorage): VLM atlanır (dakikalar kazanılır), `trim.py` sözde-sinyalleri YALNIZ süreye girer (hareket=enerji · profil+seed=oyalanma · sinüs ritim dalgası · clamp-öncesi yumuşak üst-sıkıştırma); geçişlere/manifest'e SIZMAZ; AI'lı yol bit-aynı · **Faz 7 (v1.8.0) üretim sağlamlığı** — (a) **eksik-klip esnekliği**: videosuz sahne kurguya girmez (159/145 kaç klip varsa o kadar) — KÖK: `chosen=None` → `file: abspath("")` = çalışma dizini yazılıyordu, Premiere import PATLIYORDU; (b) **intro/outro siyah fade varsayılan KAPALI** (`config.toml` 1.0/1.5→0.0); (c) crop→scale her iki modda sürüyor (kanıtlı). **Kurulu uygulama: `/Applications/AutoReji.app`** (Masaüstü kopyası kaldırıldı; dağıtım: `~/Desktop/AutoReji-Dağıtım-v1.6/`). **PAKETLE:** `bash scripts/build.sh`. ⚠️ **Yeniden test ederken süreç adı `autoreji` (küçük harf) — `killall AutoReji` ÇALIŞMAZ; doğrusu `pkill -f "AutoReji.app/Contents/MacOS/autoreji"` → sonra `open`.** ⚠️ **`.app` TUZAKLARI (ezber):** (1) GUI .app MİNİMAL PATH alır (Homebrew yok) → sidecar `cli.py` PATH'e `/opt/homebrew/bin` ekler, frontend dış komut için `/usr/bin/open`; (2) Tauri plugin = **STATİK-string** `import('@tauri-apps/...')` (değişken/@vite-ignore .app'te sessizce ölür); (3) `window.open` .app'te dış URL açmaz → opener/`open`; (4) CC `.ccx`'i `Plugins/External/<id>_<sürüm>` kurar → **prefix** tespit; (5) fs ikili=`fs:allow-write-file`, sidecar=`shell:allow-spawn`; (6) effect içinde kurulan `setTimeout`'u `setState` re-render'ı clearTimeout'layabilir → effect'i böl; (7) **`homeDir()` için capabilities'te `core:path:default` ŞART** (`core:default` içermez) — yoksa home-bazlı TÜM tespitler sessizce çöker; (8) **NaN kalkanı**: motor ilerleme olayında sayı eksik gelirse `prog` NaN → dizi[NaN]=undefined → ekran çöker (v1.7'de 3 katman eklendi — yeni ilerleme kodunda aynı kalkanı koru). **SIRADAKİ: kullanıcının gerçek bölümle kabul testi (hızlı mod + eksik klip) / yeni istekleri.**
3. UI'yı gör: `cd brain && npm run dev` → http://localhost:5173. (Görsel-AI/Ollama gerekirse: `brew services start ollama`.)
4. `DEVAM.md §1 "KALAN UI İŞLERİ"` sırasından / `PLAN.md` checklist'inden devam et. **Her iş bitince ritüel:** (i) test et (Playwright mekanik + gözle/ekran görüntüsü); (ii) prod build temiz (`npm --prefix brain run build`); (iii) sürümü senkron yükselt (`VERSION` + `APP_VERSION`); (iv) `CHANGELOG.md` + `DEVAM.md` + `PLAN.md` + (UI ise fikir belgesi) güncelle.
