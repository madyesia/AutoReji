# CLAUDE.md — AutoReji

> Bu dosya her Claude Code oturumunda **otomatik** okunur (Blueprint ve DEVAM otomatik gelmez — aşağıdaki "Devam etmek için" onları okutur). **ANA MASTER PROMPT / tam spesifikasyon: `AutoReji_Blueprint.md`** (aynısı `docs/Blueprint.md`). Güncel durum/devir: `DEVAM.md`. İş listesi: `PLAN.md`.

## Ürün
**AutoReji** — "Ghibli Mood ON" kanalı için otomatik kurgu sistemi. Her gün ~160 klipten oluşan bir bölümü, **Premiere Pro 2026**'da **düzenlenebilir klipler + düzenlenebilir geçişler + native stereo ses** ile, **render almadan** kuran yerel macOS uygulaması.
- Sürüm: güncel değer **`VERSION`** dosyasında genel sürüm **beta v1.0** = teknik semver **1.0.1**; **HER güncellemede artır — kullanıcı kuralı** → `CHANGELOG.md`). Ad + sürüm UI'da görünür. ⚠️ **İKİ KATMAN:** teknik **semver `1.0.0`** (4 yer: `VERSION` · `brain/package.json` · `brain/src-tauri/tauri.conf.json` · `brain/src-tauri/Cargo.toml`) + görünen **etiket `beta v1.0`** (2 yer: `brain/src/lib/utils.ts`→`APP_VERSION` · panel çipi `panel/index.html`). **Telif satırı:** "AutoReji beta v1.0 · Developed by Madyes © 2026" (tauri.conf `copyright` · Hakkında footer · `LICENSE` · pencere başlığı). (sed ile bump pratik.)
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
1. **İLK İŞ — şunları oku (sırayla):** (a) bu `CLAUDE.md`; (b) **`AutoReji_Blueprint.md`** — ana master prompt/spec, **baştan sona** (büyük ama projenin tüm niyeti/kararları orada, mutlaka oku); (c) `DEVAM.md` — güncel durum/devir (§1 durum + **"KALAN UI İŞLERİ" sıralı listesi**, §6 komutlar, §7 kalibre değerler, §8 tuzaklar+çözümler); (d) **UI üzerinde çalışacaksan** `docs/UI_GELISTIRME_FIKIRLERI.md` (UI yol haritası P0–P3 + durum notları); (e) **gelecek/strateji (PLANLAMA — uygulanmadı):** `docs/YOL_HARITASI_VE_VIZYON.md` (ticarileşme yol haritası + genel-amaçlı pivot: her tür kurgu · çok-NLE çıktı · gömülü render) · `docs/GUNCELLEME_MIMARISI.md` (oto-güncelleme + temalı splash + merkezi feed). → bağlam tam.
2. **NEREDE KALDIK (2026-07-01, beta v1.0 / teknik 1.0.1):** **[v1.0.1 — GÖRSEL-AI SÜREYE BAĞLANDI + gerçek önizleme kareleri.** **HEDEF-SÜRE modeli [4.30s SERT TABAN, ~7s]** (kullanıcı: hiçbir klip <4.30, bazıları ~7s, çok kısaltma yok; REF B2 min4.96/max6.79/ort5.83/~15.6dk, 4.30-altı 0) · `linger` birincil kaldıraç (held↔flowing) · energy+motion tek eğrili sinyal · AI baş≥0.5/SON≥0.7 artefakt kesimi (`tail_min`1.3→0.7 + `keep_min`) · `build_manifest._generate_thumbs` her klibin güvenli-orta karesini üretir → `clip.thumb` → frontend `clipThumb()` (film şeridi/Inspector BOŞ-GÖRÜNTÜ bug'ı çözüldü; .app'te per-sahne thumb üretilmiyordu). **⚠️ Faz 2 SÜRE/KIRPMA mantığı kullanıcı onayıyla AÇILDI; GEÇİŞ kararları HÂLÂ DONMUŞ (cut117/fade40/black2 birebir korundu). config_hash değişti (beklenen).** Kullanıcı bir bölümü `.app`'te yeniden çalıştırınca yeni süreler + thumbnail'lar gelir. CHANGELOG [1.0.1].]** **[GENEL SÜRÜM markası: kullanıcıya "AutoReji beta v1.0" · teknik semver 1.0.0 · telif "AutoReji beta v1.0 · Developed by Madyes © 2026" · pencere başlığı/Hakkında/LICENSE/.app Info.plist'e işlendi + `.app` yeniden derlendi (AutoReji_1.0.0.dmg).]** **[v1.14.6 denetimi — ÜRETİM SÜRÜMÜ DENETİMİ + Madyes markası]** 5-ajan release denetimi (UI/kopya · kod · sidecar/panel · paketleme · belgeler). Madyes yayıncı/telif + `LICENSE` (ürün adı AutoReji korundu). **6 kritik düzeltme:** (1) **18.7MB SAHTE demo verisi** (episode.json+thumbs+sprites) prod `.app`'ten Vite eklentisi `stripDevFixtures` ile strip (dist 19→0.95MB · `.app` 13MB; dev önizleme `public/`'ten çalışır); (2) **panel zorla-siyah-fade** (`panel/main.js` intro/outro `|| 1.0/1.5` → 0 falsy → kapalıyken bile ekliyordu → **0=kapalı**, `.ccx` yeniden kurulmalı); (3) **Inspector** "siyahtan fade-in" intro kapalıyken yazıyordu → "düz başlangıç"; (4) **analiz ekranı tanımsız `--color-gold`/`-deep`** token (her açılışta bozuk gradient) → `--color-amber-400/500`; (5) **Yönetmen paneli ölü-kontroller** (slider/toggle/profil hiçbir şey yapmıyordu + yanlış "anında hesaplanır" notu) → dürüstleştirildi; (6) `minimumSystemVersion` 10.15→**11.0** + **CSP** null→kısıtlı + **TS `strict`** açıldı. README baştan yazıldı. **`.app` v1.14.6 yeniden derlendi → computer-use ile açılış/CSP/3-3 tespit/Hakkında(© 2026 Madyes) GÖZLE DOĞRULANDI.** Detay: `CHANGELOG.md [1.14.6]`. — Faz 0+1 ✅ · **Faz 2 ❄️ DONDURULDU** (`config.toml` kanonik — değiştirme) · **Faz 3 (Premium UI) TAMAM** · **Faz 4 ❄️ — GERÇEK macOS `.app` ÇALIŞIYOR + computer-use ile GÖZLE DOĞRULANDI** · **v1.14.3: 5 düzeltme (MONTAJCI "Test et" doğrulama akışı · UDT bölümü kaldırıldı → Hazırlık 3 öğe · arşiv klasör-aç+sil · panel ad-taşması) — 5 araştırma ajanı + tarayıcı self-test ile doğrulandı; detay CHANGELOG [1.14.3]** (Tauri 2 `brain/src-tauri/`; gömülü `autoreji-sidecar` 8MB PyInstaller saf-stdlib + `config.toml`(rthook); **ad-hoc imza** `-`; JIT `Entitlements.plist`; `scripts/`; `.claude/settings.json`). Native köprüler GERÇEK (`tauriAvailable()` arkasında, tarayıcı fallback, 0 hata): `lib/tauri.ts` · `lib/engine.ts` (sidecar pipeline) · `lib/setup.ts` (detect*/pullModel/installPlugin) · `lib/native.ts` (saveTextFile). **v1.14.1-2 .app-runtime cilası (kullanıcı .app testi + benim computer-use doğrulamam):** Hazırlık 3/3 (Premiere/model otomatik tespit · MONTAJCI "Test et" ile kullanıcı-doğrular), analiz ekranı yeniden tasarım (akışkan % + kayan ışık + aşama-aşama dolum+tik + tamamlanma→review GEÇİYOR), video önizleme .app'te oynuyor. **PAKETLE:** `bash scripts/build.sh` → `…/release/bundle/macos/AutoReji.app` (Masaüstünde kopya var). **`.app`'i computer-use ile KENDİM test edebilirim** (request_access AutoReji+Finder → screenshot/click). ⚠️ **Yeniden test ederken: süreç adı `autoreji` (küçük harf) — `killall AutoReji` ÇALIŞMAZ, eski süreç açık kalır + `open` sadece onu öne getirir (eski sürümü test edersin!). Doğrusu: `pkill -f "AutoReji.app/Contents/MacOS/autoreji"` → sonra `open`. Ayrıca taze frontend için cache şart değil; süreç gerçekten yeniden başlamalı.** ⚠️ **`.app` TUZAKLARI (ezber):** (1) GUI .app MİNİMAL PATH alır (Homebrew yok) → sidecar `cli.py` PATH'e `/opt/homebrew/bin` ekler, frontend dış komut için `/usr/bin/open`; (2) Tauri plugin = **STATİK-string** `import('@tauri-apps/...')` (asla @vite-ignore/değişken — .app'te çözülmez, sessizce ölür); (3) `window.open` .app'te dış URL açmaz → opener/`open`; (4) CC `.ccx`'i `Plugins/External/<id>_<sürüm>` kurar → **prefix** tespit; (5) fs ikili=`fs:allow-write-file`, sidecar=`shell:allow-spawn`; (6) effect içinde kurulan `setTimeout`'u `setState` re-render'ı clearTimeout'layabilir → effect'i böl; (7) **`@tauri-apps/api/path` `homeDir()` için capabilities'te `core:path:default` ŞART** (`core:default` içermez) — yoksa `resolve_directory` reddedilir, `homeDir()` null döner ve home-bazlı TÜM tespitler (model/plugin) sessizce çöker. Detay: `DEVAM.md §1` + `CHANGELOG.md [1.14.x]`. (Faz 2: **GEÇİŞ kararları ❄️ donmuş — DOKUNMA**; **SÜRE/KIRPMA mantığı v1.0.1'de kullanıcı onayıyla evrildi** — linger/tail_min/energy-eğri. Faz 4 ❄️ paketleme yapısı — DOKUNMA.) **SIRADAKİ: kullanıcının yeni düzeltme/geliştirmeleri.**
3. UI'yı gör: `cd brain && npm run dev` → http://localhost:5173. (Görsel-AI/Ollama gerekirse: `brew services start ollama`.)
4. `DEVAM.md §1 "KALAN UI İŞLERİ"` sırasından / `PLAN.md` checklist'inden devam et. **Her iş bitince ritüel:** (i) test et (Playwright mekanik + gözle/ekran görüntüsü); (ii) prod build temiz (`npm --prefix brain run build`); (iii) sürümü senkron yükselt (`VERSION` + `APP_VERSION`); (iv) `CHANGELOG.md` + `DEVAM.md` + `PLAN.md` + (UI ise fikir belgesi) güncelle.
