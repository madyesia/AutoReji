# CHANGELOG — AutoReji

Tüm önemli değişiklikler burada. Biçim: [Keep a Changelog] benzeri; sürümleme SemVer benzeri.
Başlangıç sürümü **v1.1**; her güncellemede artar.

## [beta v1.4 · 1.4.0] — 2026-07-03 — UI/UX TUR 4: İnceleme 2.0 (AI verisini görünür kıl) + amber buton yazı düzeltmesi
> Kaynak: `docs/tasarim/tarama-review.md` §3/§8. Amaç: manifestteki zengin AI sinyalini (enerji/oyalanma/mood/ses/algo-önerisi) tek Inspector satırından çıkarıp göze görünür kılmak — "neden bu klip böyle?" sorusunun görsel cevabı.
### 🔧 Regresyon düzeltmesi (kullanıcı bildirdi — amber butonlarda beyaz yazı)
- **Amber (primary) butonların yazısı beyaza düşmüştü** (okunurluk düşük): "Modeli indir", "MONTAJCI'yı İndir", "Premiere'de Kur"… TUR 2'de buton boyutu `text-sm` → `text-body` olunca `tailwind-merge` özel `text-body` token'ını RENK sanıp `text-ink-950`'i sildi → yazı kalıtılan `--color-fg` (beyazımsı) oldu. **Kök çözüm:** `cn()` artık `extendTailwindMerge` ile DS2 tip token'larını (`text-micro…display`) **font-boyutu** sınıfı olarak tanıtıyor → renkle çakışmıyor. Amber butonlar tekrar koyu lacivert (`ink-950`, ~11:1 kontrast). Aynı kökten kaynaklı gizli başka renk/boyut çakışmaları da düzeldi.
### İnceleme 2.0 — veri yüzeye çıktı
- **Enerji eğrisi:** zaman çizelgesinin üstüne ince alan-grafiği (AI'ın 1-5 enerji sinyali; süre kararının kaldıracı). Veri yoksa çizilmez.
- **Rejim lejantı:** çizelge başlığına Dış/İç/Uyku renk göstergesi (artık tonları ezberlemek gerekmez — Z6).
- **Oyalanma (linger) rozeti:** film şeridi kartlarında kum saati ikonu — ritmin birincil kaldıracı (REF B2: 160'ta 64 klip), eskiden yalnız Inspector'da gizliydi. Tarayıcıda 64/160 doğrulandı.
- **min · ort · max süre** alt bara ("3.48s – 5.88s · ort 5.22s") — "hiçbir klip 4.30s altında" kuralının görünen kanıtı (`stats.min/max` zaten hesaplanıyordu, kullanılmıyordu).
- **Inspector "Ses" bölümü** (yeniydi — ASMR ürününde ses tamamen görünmezdi): "Mikro-geçiş 60ms yumuşatma · Stereo native (sol-sağ korunur)" → native-stereo hard-constraint'ini UI'da kanıtlar.
- **Inspector "Hava" (mood) satırı** (eskiden HİÇBİR yerde): cozy→huzurlu, melancholic→hüzünlü… sapmalar tam bakılması gereken klipler.
- **algo_default hayalet çipi:** bir geçişi elle değiştirince "AutoReji önerisi: Fade 1.5s ← dön" çipi → neye kıyasla değiştiğin görünür, tek tıkla AI önerisine dönülür (mock'ta null → yalnız gerçek override'da çıkar).
### Doğrulama
- `ds_guard.sh` 4/4 ✓ · `tsc` strict + build temiz · tarayıcıda gözle: enerji gradient + "enerji" etiketi · lejant · min–max satırı · **64 linger rozeti** · Inspector Ses/Hava · amber buton `rgb(7,9,13)` koyu yazı — 0 konsol hatası. `.app` yeniden derlendi. Panel işlevi değişmedi (yalnız v1.4 çipi).
> **Bu tur ertelendi (bilinçli):** çift-çekim varyant seçici (mock'ta 0 varyant → tarayıcıda test edilemez, gerçek veriyle sonra) + mod sistemi sadeleştirme (3 mod çalışıyor, riskli — sonraki tura).

## [beta v1.3 · 1.3.0] — 2026-07-03 — UI/UX TUR 3: Hareket Sistemi 2.0 (motion.ts + ambient atmosfer)
> Kaynak: `docs/tasarim/spec-motion.md`. Yeni tek kaynak: **`brain/src/lib/motion.ts`** (DUR/FX/EASE/SPRING + variants). Yalnız arayüz hareketi — Faz 2/4 dondurulmuş dosyalara dokunulmadı.
### Tek kaynak + adoptasyon
- **9 el-yazması spring → 4 adlandırılmış preset** (`SPRING.snappy/gentle/pop/pill`): AnalysisScreen (hata/done/aşama-tiki), BuildScreen (lejant/istatistik), Toast, ui.tsx Segmented, motifs (Seal/BirthStat). Kaçak `stiffness:` = 0 (yalnız motion.ts).
- **Birincil eğri tek kaynaktan:** 9 dosyadaki inline `[0.16,1,0.3,1]` → `EASE.outExpo` (0 kaldı). Yeni `--ease-inout-sine` (döngüler).
- **Linear easing'ler yumuşadı (B2):** ScanBeam `linear 2.2s` → `inOutSine 2.6s + 400ms nefes` (mekanik bant hissi bitti); ProgressRing indeterminate dönüş linear kalır ama dash yayı `inOutSine` ile nefes alır (sabit hızlı, canlı).
### Yeni hareket desenleri
- **Yönlü ekran geçişi (B4):** App.tsx `screenVariants(dir)` + `AnimatePresence custom` — ileri akış (Hazırlık→Giriş→Analiz→İnceleme→Kur) içeriği sağdan getirir sola çıkarır; geri tersi (eski salt `opacity+y6` yerine mekânsal süreklilik). `prevScreen` ref'i yönü hesaplar.
- **Film şeridi kademeli giriş (B1):** 160 kart aniden belirmiyor — ilk ~12 kart 45ms adımla `float-up` (CSS animasyon, eleman ömründe tek atım, ref-gate bedava; 13.+ kart aynı karede). 160 kartta ek re-render/JS döngüsü YOK.
- **Basma geri bildirimi (B5):** Button `active:scale-[0.97]` · IconButton `0.94` · Review toplu Cut/Fade/Black/Çıkar butonları — tıklayınca hafif iç-basma.
- **Kutlama (B3):** aşama tiki / done ikonu / mühür `SPRING.pop` (doğal ~%10 taşma) ile "pat" oturur.
### Ambient atmosfer (B6 — Ghibli/analog kimlik)
- **`AmbientLayer`** (yeni bileşen, CSS-only, JS döngüsü açmaz): 3 çok-yavaş ışık lekesi (amber/yağmur-mavisi/gece-moru, .06-.09 opacity, 34/26/42s — desen gözle yakalanmaz). Intake/Analiz/Kur/Hazırlık/Arşiv'de RainCanvas'ın altında; **Review'da YOK** (zaten yoğun). `blur()` kullanılmaz (radial-gradient yumuşatır → sıfır maliyet).
- **Film greni** (statik SVG noise, opacity .04, `mix-blend overlay`) yalnız Review önizleme çerçevesinde → "stüdyo monitörü / analog" dokusu.
- **Durdurma:** pencere arka plana düşünce (`visibilitychange` → `data-app-idle`) blob'lar durur (GPU/pil sıfır); `prefers-reduced-motion`'da statik ışık lekesi kalır (hava kaybolmaz).
- **`<MotionConfig reducedMotion="user">`** App köküne eklendi (yeni variant'lar otomatik kısılır).
### Doğrulama
- `ds_guard.sh` 4/4 ✓ · kaçak spring 0 · inline expo 0 · `tsc` strict + build temiz · tarayıcıda gözle: ambient 3 blob (drift-a 34s) · yönlü geçiş · 160 kart stagger (mount'ta) · film greni · 0 konsol hatası. `.app` yeniden derlendi. **Panel işlevi değişmedi** (yalnız sürüm çipi v1.3 — yeniden kurmak şart değil).

## [beta v1.2 · 1.2.0] — 2026-07-03 — UI/UX TUR 2: Tasarım Sistemi 2.0 token konsolidasyonu + tam Türkçe dil temizliği
> Kaynak: `docs/tasarim/spec-tokenlar.md` + `tarama-kopya.md`. Marka birebir aynı (aynı ink/amber) — bu tur **konsolidasyon**, yeniden tema değil.
### Tasarım Sistemi 2.0 (index.css @theme ekleri + tüketim)
- **9 adımlı adlandırılmış tip ölçeği** (`text-micro…text-display`, satır aralıklı): 21 keyfi `text-[Npx]` boyutu (213 kullanım) → 0. Yarım-piksel boyutlar (10.5/11.5/12.5/13.5) tam sayıya oturdu (1x ekranda daha net); hero H1'ler 30↔34 → **32**'de birleşti.
- **Gölge konsolidasyonu:** ~41 keyfi gölge → token'lar. 2 yeni token: `--shadow-glow-sm` (primary buton/segmented) + `--shadow-glow-lg` (seçili/işaretli film kartı halesi); `shadow-[var(--…)]` yazımları utility'ye (`shadow-pop/raised/soft`); birleşik istisnalar `index.css` bileşen sınıflarına taşındı (`.frame-gold` altın video çerçevesi · `.playhead-glow` · `.ctrl-glass`). Kalan tek `shadow-[`: 2 danger halesi (bilinçli — token tüketiyor).
- **Kenarlık:** `--color-hairline` (.07/.08→**.10**) + `--color-hairline-strong` (.14, glass-pop) — hat/kart tanımı hafif belirginleşti (denetim C6, istenen).
- **Ham hex temizliği:** kamera-ölçeği 8 rengi `--color-scale-*` token'larına (utils.ts artık var() döndürür) · RainCanvas `--color-rain`'i `getComputedStyle` ile okur · inline `#0b0e14`ler `var(--color-ink-900)` · Logo/motifs amber hex'leri token · PreviewStage/Filmstrip yakın-hex zeminleri ink token'larına. **brain/src'de ham hex: 0.**
- **Disabled standardı:** `opacity-30/40` (~1.7-2.2:1, okunmaz) → **`opacity-60`** (fg-muted üstünde ~3.4:1 ✓).
- **fg-faint terfileri:** aksiyon linkleri ("tekrar kontrol et/test et", "Kaldır", "İptal") + bilgi taşıyan etiketler `fg-subtle`e; fg-faint yalnız dekor/placeholder.
- `ICON` sabiti eklendi (xs12/sm14/md16/lg18 — kullanım migrasyonu sonraki tur) · `rounded-[1.7rem]`→`rounded-2xl` · **`scripts/ds_guard.sh`** koruma scripti (text-[Npx]/shadow-[/ham hex/disabled grep'leri — 4/4 ✓).
### Türkçe dil temizliği (~45 metin)
- **Terim birliği:** "offline"→**çevrimdışı** (6 yer) · "Sil"→**Çıkar** ailesi (geri alınabilir eylem; "sil" yalnız arşivde) · "{n} klip seçili"→**işaretli** · "timeline"→**zaman çizelgesi** · "Reji'ye"→**İnceleme'ye** · "varyant/çift çekim"→**çekim ailesi** (aday/yedek çekim) · "opsiyonel"→**isteğe bağlı** · "Rejim"→**Mekân** · "algoritma"→**AutoReji** (marka sesi).
- **Jargon söküldü:** ffprobe (3), Q4_K_M→"sıkıştırılmış sürüm", QC→kalite kontrol, "durum makinesi"→kurgu kuralları, L≠R→"tek ses katmanı, sol-sağ gerçek stereo", ACTION/ENV→hareket/ortam sahnesi, "Baş (in)/Son (out)"→Baş/Son, benzerlik 0.82→**%82**, seed satırları korunmadı→(kurgu kodu Tur sonrası), Ollama'nın "Manifest çekiliyor"→"İndirme hazırlanıyor" (AutoReji manifest'iyle çakışıyordu).
- **Türkçe ek uyumu:** geçiş baloncuğu "Fade'**a**" → TRANSITION meta'ya `dative` alanı ("Cut'a/Fade'e/Black'e") · ⌘K "Sahne 40'e git"→**"Sahneye git: 40"**.
- **E3:** Intake'teki sabit "cozy yağmur ASMR" çipi artık **seçilen belgeden türeyen bölüm adını** gösterir.
- **Hata formülü** (ne oldu + neden + ne yapmalı): model indirilemedi · kayıtlı manifest açılamadı · örnek bölüm yüklenemedi · Inspector/palet boş-durumları dolduruldu · çift-✓ toast'ları tekilleştirildi · "🎬" başlık emojisi kaldırıldı (🌧️ tek imza olarak kaldı).
- **Panel (⚠️ `.ccx` yeniden paketlendi):** "Açık proje yok" formüle bağlandı · "BİTTİ — RENDER YOK"→"Bitti — render alınmadı" (bağırma bitti) · 🎉 kaldırıldı (UXP emoji güvenilmez) · JSON/textarea/UXP jargonu kullanıcı diline · "2.5) Medya"→"3) Medya hazırlanıyor" · durum çubuğu bağlama göre ("Manifest bekleniyor" / "Hazır — Bölümü Kur'a basabilirsin").
### Doğrulama
- `ds_guard.sh` 4/4 ✓ · `tsc` strict + build temiz · `node --check` panel temiz · tarayıcıda gözle: 32px display H1, hairline, "işaretli/Çıkar", glow token kartta, çevrimdışı metinleri — 0 konsol hatası · `.app` + `.ccx` yeniden derlendi.

## [beta v1.1 · 1.1.0] — 2026-07-02 — Görünen sürüm etiketi güncellemelerle artacak (kullanıcı kararı)
- **YENİ SÜRÜM KURALI (kullanıcı 2026-07-02):** görünen etiket artık sabit kalmaz — her anlamlı güncelleme paketi görünen sürümü de artırır. TUR 0 + TUR 1 paketleri = **"beta v1.1"** (teknik semver **1.1.0**'a hizalandı).
- Etiket 6 yerde güncellendi: `APP_VERSION` (üst bar) · panel çipi (**`.ccx` yeniden paketlendi → yeniden kur**) · pencere başlığı + `copyright` (tauri.conf → Info.plist) · Hakkında footer · `LICENSE` · `README`.

## [beta v1.0 · 1.0.3] — 2026-07-02 — UI/UX TUR 1: veri güvenliği UX (A1-A6 + F2)
> Kaynak: denetim A maddeleri. Yeni ortak bileşen: **`ConfirmDialog`** (Radix Dialog — odak tuzağı/Esc/scroll kilidi hazır; normal + danger varyantı).
- **A1 — Boş kurgu artık kurulamaz:** tüm klipler çıkarılınca İnceleme'de önizleme+çizelge yerine rehber boş-durum kartı ("Kurguda hiç klip kalmadı" + Geri al / Tümünü geri getir; film şeridi açık kalır — kartlardan tek tek geri getirilebilir) ve **"Premiere'de Kur" kilitlenir** (tooltip nedenini söyler). Eskiden boş/bozuk timeline üretilebiliyordu.
- **A2 — Build ön-uçuş kontrolü:** MONTAJCI 'pending' ise READY fazında uyarı bandı ("manifest hazırlanır ama Premiere'de açılamaz" + Hazırlığı aç) ve CTA'da onay ("Yine de hazırla"). Eskiden uyarı yalnız 3.6sn animasyondan SONRA görünüyordu.
- **A3 — Arşivden üzerine-açma onayı:** aktif bölümde elle değişiklik varken "Yeniden aç" artık sorar ("Mevcut düzenlemenin üzerine açılsın mı?"). Eskiden sessizce eziyordu.
- **A4 — Yıkıcı işlem onayları:** toplu "Sil" >5 klipte onay ister ("N klibi kurgudan çıkar?" — dosyaların silinmediğini söyler); arşiv kaydı silme her zaman onaylı (undo toast'ı da duruyor).
- **A5 — Önizleme yükleme/hata durumu:** video kaynağı değişince "yükleniyor…" çipi; dosya okunamazsa açık hata rozeti (dosya adı + "taşınmış/bozuk olabilir" rehberi). Eskiden sahne sessizce siyah kalıyordu.
- **A6 — Analiz hatasında yol haritası:** hata kartına 3 maddelik kontrol listesi (belge-klasör eşleşmesi · yeniden seç · detayı not al) — "Tekrar dene" kısır döngüsüne rehber.
- **F2 — İşaret seti kaybına koruma:** ≥3 klip işaretliyken yanlış düz-tık işaretleri temizlerse "N işaret temizlendi — Geri al" toast'ı (store'a `setMarked`). Eskiden geri alınamıyordu (işaretler undo geçmişinde değil).
- Doğrulama: `tsc` strict + build temiz; tarayıcıda mekanik senaryolar: 160→0 klip boş-durum + kilitli CTA + "Tümünü geri getir" dönüşü · 9-klip toplu onay · arşiv silme onayı (Vazgeç korur) · yeniden-aç onayı · işaret-temizlendi toast'ı — hepsi GEÇTİ. `.app` yeniden derlendi.

## [beta v1.0 · 1.0.2] — 2026-07-02 — UI/UX TUR 0: kırıklar + dürüstlük (16-ajanlık denetimin ilk uygulama turu)
> Kaynak: `docs/UI_UX_DENETIM_2026-07-02.md` + `docs/tasarim/` (4+12 ajanlık tarama — fihrist: `docs/tasarim/README.md`). Tur planı orada; bu sürüm **TUR 0**.
### .app'te kırık özellikler (tarayıcıda görünmüyordu)
- **Geçiş önizleme modalı .app'te İKİ BOŞ GÖRSEL arasında oynuyordu** — `PreviewModal` mock `thumbUrl` kullanıyordu → gerçek kareye düşen `clipThumb`'a geçirildi (+ Play/Duraklat/Baştan butonlarına aria-label, anlamlı alt metinleri).
- **Hover-scrub .app'te SAHTE geri bildirim veriyordu** (sprite dosyaları yalnız dev mock'unda var; kare değişmezken amber ilerleme çizgisi oynuyordu) → `hasSprite` kapısı: sprite yoksa kare-gezinme + ilerleme çizgisi + "üstüne gel → içinde gezin" başlık eki tamamen kapalı (`Filmstrip`, `InspectorPreview`, `ShortcutsHelp` kopyaları dahil).
### Dürüstlük düzeltmeleri ("sahte yok" ilkesi — kopya gerçeği yansıtmıyordu)
- **"Bölüm kuruldu 🌧️" → "Bölüm kuruluma hazır 🌧️"**: bu ekran yalnız kurgu planını hazırlar; gerçek kurulum MONTAJCI'da. Gövde metni de dürüstleşti ("manifest'i kaydet → MONTAJCI'da aç → Premiere kurar").
- Build "Kuruluyor…" → **"Hazırlanıyor…"** + 5 adım adı jargonsuz/dürüst dile ("Klipler import ediliyor (native stereo)" → "Klip listesi hazırlanıyor" vb.).
- Intake tarayıcı kopyası "Sürükle-bırak veya tıkla" → **"Örneği yüklemek için tıkla"** (drop handler yok — boş vaatti).
- Setup **"MONTAJCI'yı Kur" → "MONTAJCI'yı İndir"** (buton yalnız indirir, kurulum çift-tık ile).
- Setup **Premiere kartı ↔ MONTAJCI kartı çelişkisi giderildi**: "geliştirici modu gerekir + Enable Developer Mode adımı" KALKTI (v1.14.3 araştırması: .ccx çift-tıkla kurulur, dev modu gerekmez) → tek hikâye "25.6+ yeterli — ek ayar gerekmez"; statik "(sende 2026 var ✓)" iddiası da gitti. Rozet "imzasız·..." → **"tek dosya · çift tıkla kurulur · internet gerekmez"** (güven dili).
- Arşiv toast'ı var olmayan **"Farklı Kaydet"** butonuna yönlendiriyordu → gerçek yol: 'Bölümü yeniden aç → Kur ekranında "Manifest'i Kaydet"'.
- Panel: **"Brain"** iç kod adı kullanıcıya sızıyordu → "AutoReji". PreviewModal alt notu "Native stereo ses tam uygulamada" → "Bu önizleme sessizdir — gerçek stereo sesi Premiere'de duyarsın."; "Geçiş önizleme(si)" dilbilgisi; Build eklenti uyarısı suçlayıcı dilden arındırıldı.
### Ölü kontrol
- **Kur ekranındaki mod anahtarı kaldırıldı** (BuildScreen modu hiç okumuyor — v1.14.6 "ölü kontrol" turunun kaçırdığı) → yalnız İnceleme'de görünür.
### MONTAJCI paneli (⚠️ `.ccx` yeniden paketlendi — Premiere'de yeniden kurulmalı)
- **Sessiz hata yolları görünür oldu**: adım-DIŞI `err()`/`warn()` artık toast da atar ("Açık proje yok", "Pano boş", "Önce manifest yükle"… kullanıcı butona basıp 'hiçbir şey olmadı' sanmaz). Adım-içi hatalar zaten step-error ile görünürdü — çifte bildirim engellendi (manifest okunamadı/geçersiz yolları salt-günlük).
- **"Bölümü Kur" yeniden-giriş kilidi**: kurulum sürerken ikinci tık iç içe ikinci pipeline başlatıyordu → `BUILD_RUNNING` bayrağı + "Kurulum zaten sürüyor" toast'ı.
### Doğrulama
- `tsc` strict + `vite build` temiz (608KB, önceki seviye) · `node --check panel/main.js` temiz · tarayıcıda uçtan uca gözle doğrulandı (Hazırlık→Giriş→örnek→Analiz→İnceleme→Kur; yeni kopyalar + film şeridi başlığı + Kur'da mod anahtarının yokluğu ekran görüntüsüyle) · `.app` + `.ccx` yeniden derlendi.

## [beta v1.0 · 1.0.1] — 2026-07-01 — Görsel-AI'yı süreye GERÇEKTEN bağla + AI-üretim baş/son garanti kesimi + gerçek önizleme kareleri
> **Faz 2 (kurgu motoru) kullanıcı onayıyla bilinçli AÇILDI — yalnız SÜRE/KIRPMA + thumbnail.** Geçiş kararları DEĞİŞMEDİ (REF Bölüm 2: cut 117 / fade 40 / black 2 — birebir). Amaç: bekletilen görsel-AI'yı boşa çalıştırmamak, en verimli işe koşmak.
### Süre motoru (trim.py) — HEDEF-SÜRE modeli (additive-mod'dan yeniden tasarlandı)
- **Her klip için "hold" skoru → tutulan süre [4.30s, ~6.8s] aralığında.** **KULLANICI KURALI: hiçbir klip 4.30s altında olmaz** (sert taban) · bazı klipler **~7s** (minimal kırpma) · çok kısaltma yok.
- **`linger` BİRİNCİL kaldıraç** (eski −0.16 etkisizdi): model "tut" dediğinde hedef süre belirgin uzar → **held↔flowing ritmi** (REF B2: linger 6.09s vs 5.66s). + iç/uyku & kuruluş/manzara uzun; yakın/aksiyon/dış kısa.
- **energy (VLM 1-5) + motion (ölçülen) TEK "yoğunluk" sinyaline birleşti** (eski "ya/ya da" çift-sayma bitti) + eğri (sakin→uzun, hareketli→kısa). NOT: bu içerikte enerji hep 1-3 (5'ler yok) → "kısaltma" ucu asıl çeşitli içerikte parlar; sakin Bölüm 2 doğal olarak 5-7s'de kümelenir.
- **AI-üretim artefaktı kesimi (kullanıcı isteği):** baş ≥~0.5s + **SON ≥~0.7s (baştan BÜYÜK)** her zaman kesilir; çevik klipler kuyruktan daha çok. `tail_min` 1.3→**0.7** (uzun klipler ~7s olabilsin) + yeni `[trim].keep_min` + `decide.Config.tail_min`.
- Sonuç (REF Bölüm 2): **min 4.96 / max 6.79 / ort 5.83s · ~15.6 dk** · 4.30-altı **0 klip** ✓ · ~7s (≥6.4) **19 klip** · baş pay 0.50 / son pay 0.71 · **0 hata/uyarı** · geçişler birebir (cut117/fade40/black2).
### Önizleme kareleri (film şeridi + Inspector boş-görüntü bug'ı — kullanıcı ekran görüntüsüyle bildirdi)
- **Gerçek `.app`'te per-sahne küçük resim ÜRETİLMİYORDU** → film şeridi + Inspector mini-önizleme boş/karo görünüyordu (yalnız büyük önizleme gerçek videoyu oynatıyordu). Mock `/thumbs`+`/sprites` yalnız tarayıcı önizleme içindi + `.app`'ten striplenmişti (üstelik Bölüm 2'nindi).
- **Pipeline artık her klibin GÜVENLİ pencere ortasından gerçek kare üretir** (`build_manifest._generate_thumbs` → `_manifest/thumbs/<scene>.jpg`; paralel ffmpeg, izole try/except + timeout) → `clip.thumb`. Frontend `clipThumb(c)`: Tauri'de `convertFileSrc` (asset://, büyük önizlemeyle aynı kanıtlı yol), tarayıcı/yoksa mock /thumbs, en sonda karo. REF Bölüm 2: **160/160 thumb**.
- Sürüm teknik 1.0.0 → **1.0.1** (görünen etiket "beta v1.0" sabit).
### Doğrulama
- REF Bölüm 2 pipeline ÖLÇÜLDÜ (yukarıdaki sayılar); `tsc` strict + `vite build` temiz; sidecar sözdizimi OK; `.app` yeniden derlendi (sidecar dahil). ⚠️ **Kullanıcı bir bölümü `.app`'te yeniden çalıştırınca** hem yeni süreler hem gerçek thumbnail'lar gelir (ikisi de pipeline çıktısı).

## [beta v1.0 — teknik 1.0.0] — 2026-06-30 — GENEL SÜRÜM markası (Madyes)
- **Genel sürüm kimliği:** kullanıcıya görünen ad/sürüm **"AutoReji beta v1.0"**; teknik **semver 1.0.0** (ilk genel sürüm — içerideki 1.1→1.14.6 dev iterasyonları hiç yayınlanmadı, temiz başlangıç). İki katman: `APP_VERSION` + panel çipi = **"beta v1.0"** (görünen); `VERSION`/`package.json`/`Cargo.toml`/`tauri.conf.json` = **1.0.0** (semver). Üst bar/Hakkında'daki çift "v" öneki kaldırıldı.
- **Telif satırı standartlaştırıldı:** **"AutoReji beta v1.0 · Developed by Madyes © 2026"** ("Developed by" = sektörel "yazılım geliştiricisi") → `tauri.conf.json` `copyright` (**.app Info.plist `NSHumanReadableCopyright`'a işlendi**), **Hakkında** footer, `LICENSE` başlığı. **Pencere başlığı** "AutoReji beta v1.0" (bundle/menü adı "AutoReji" — temiz dosya adı). `.dmg` → `AutoReji_1.0.0_aarch64.dmg`.
- Bu sürümün TÜM kalite/güvenlik/marka düzeltmeleri **[1.14.6] denetiminde** yapıldı (aşağıda) — **beta v1.0 = o denetlenmiş build'in genel-sürüm markası.** `.ccx` (beta v1.0 çipi) yeniden paketlendi → Premiere'de yeniden kur.
- **2. üretim denetimi turu (bağımsız skeptik ajan + tüm kapılar):** env dev/prod geçişi + JSON sözleşmeleri **temiz** doğrulandı (tek `import.meta.env.DEV`=simErr prod'da kapalı; mock yolları `tauriAvailable()` arkasında; shipped kodda "1.14"/console/TODO yok). **Bulunan + düzeltilen 8 ek sorun:**
  - **YÜKSEK** `detect_crop.py`: ffmpeg subprocess'e `timeout=120` + `try/except` (bozuk/eksik klip veya asılı ffmpeg → **sonsuz asılma**; crop pipeline'ın İLK adımı olduğundan tüm analiz donardı → artık o klip güvenli `scale=1.0` ile geçilir).
  - **YÜKSEK** `SetupScreen` model-indirme `NaN%` (total=0 iken `bytes/total`) → `prog.total>0` guard (ilk kurulumda kullanıcının GÖRDÜĞÜ ekran).
  - **ORTA** `removeUxpPlugin` sürüm-soneksiz yola bakıyordu → "Kaldır" sessizce hiçbir şey kaldırmıyordu → `detectUxpPlugin` ile aynı **prefix** (`<id>_<sürüm>`) mantığına çevrildi.
  - **ORTA** `prettyEpisode('')` boş bölüm adında boş başlık → "Bölüm" fallback.
  - **ORTA** `panel/main.js validateManifest` artık her etkin klibin `file`/`in<out`'ını doğrular → opak "HATA satırına bak" yerine "Klip #N: dosya/in-out…".
  - **DÜŞÜK** `sampleEvenly(arr,1)` NaN-indeks guard; kopya: "elle değişik"→"elle değişiklik", önizleme transport "video"→"klip".
  - **Kapılar:** tsc (strict) + vite build + oxlint = gerçek-hata 0; `detect_crop.py`/`main.js` sözdizimi OK. **Test script'i yok** → tip-kontrol + lint + build + canlı `.app` doğrulamasıyla kapanır.
  - **Bilinçli bırakıldı:** build_manifest/decide'daki 2 sıfır-klip metadata kusuru (yalnız CLI `__main__`, prod'a `cli.py` üzerinden ulaşmaz + Faz 2 donmuş).

## [1.14.6] — 2026-06-30 — ÜRETİM SÜRÜMÜ DENETİMİ (Madyes markası) + 6 kritik düzeltme · `.app` gözle doğrulandı
> Kapsamlı "release readiness" denetimi (5 paralel ajan: UI/kopya · kod kalitesi · sidecar/panel · paketleme/config · belgeler). Faz 2 (kurgu kararları) + Faz 4 (paketleme yapısı) DONMUŞ — yalnız marka/kalite/güvenlik düzeltildi.
### Marka & Lisans — Madyes (ürün adı "AutoReji" KORUNDU; yayıncı/marka = Madyes)
- **`LICENSE`** eklendi (© 2026 Madyes, proprietary + 3. parti bileşen notu). `tauri.conf.json`: `publisher:"Madyes"` + `copyright:"© 2026 Madyes. All rights reserved."` + `licenseFile` (**→ .app Info.plist `NSHumanReadableCopyright`'a işlendi, doğrulandı**). `Cargo.toml`: `authors=["Madyes"]` + `license-file` + `publish=false`. `package.json`: `author/license/description`. **Hakkında** footer "© 2026 Madyes" (eski "Geliştirme verisi: Bölüm 2…" satırı kaldırıldı). **README** baştan yazıldı (gün-1 iskeleti "v1.1 · erken geliştirme · scripts/setup yok" → v1.14.6 üretim + son-kullanıcı kurulum + Madyes/lisans).
### Kritik düzeltmeler (denetimde bulundu)
- **Paketleme — ~18.7 MB SAHTE demo verisi prod `.app`'e giriyordu:** örnek Bölüm 2'nin `episode.json` + 160 thumbnail + 160 sprite, Vite tarafından `dist/`'e kopyalanıp `.app`'e gömülüyordu (yanlış/sabit veri + 20× şişkinlik — "sahte yok" ilkesine aykırı). Yeni Vite eklentisi `stripDevFixtures` (build-only `closeBundle`) bunları SADECE prod çıktısından siler; dev önizleme `public/`'ten çalışır. **dist 19MB → 0.95MB · `.app` 13MB · doğrulandı: `.app/Contents/Resources`'ta fixture YOK.** Gerçek `.app` önizlemeleri gerçek video karelerinden (asset://) gelir.
- **Panel zorla siyah fade:** `panel/main.js` intro/outro `(...) || 1.0/1.5` → `0` falsy olduğundan, kanal sahibi açılış/kapanış imzasını KAPATMIŞ (config_toml=0) olsa bile her bölüme 1.0s/1.5s siyah fade ekliyordu. Artık **`0 = kapalı`** (manifesti onurlandırır); her geçiş yalnız süresi >0 ise eklenir. **(`.ccx` yeniden paketlendi → Premiere'de YENİDEN KURULMALI.)**
- **Inspector tutarsızlığı (panel bug'ının UI eşi):** Sahne 1'de "siyahtan fade-in {0.0s}" yazıyordu (intro kapalıyken) → intro 0 ise **"düz başlangıç — siyah fade kapalı"**.
- **Analiz ekranı bozuk gradient:** tanımsız `var(--color-gold)`/`--color-gold-deep` token'ları (HER açılışta görünen analiz ekranında aktif aşama ikonu + dolum çubuğu gradient'i boş/geçersiz çözülüyordu) → mevcut `--color-amber-400/500`.
- **Yönetmen paneli ölü kontroller:** "Rafineler (§9.5)" + tempo/eşik/fade slider'ları + "Profil" butonu YALNIZ yerel state'e yazıp kurguyu DEĞİŞTİRMİYORDU (+ yanlış "değeri oynatınca harita anında yeniden hesaplanır" notu). Karar motoru DONMUŞ → dürüstleştirildi: yalnız GERÇEKTEN çalışan 3 kurgu stili (sakin/tempolu/sinematik) + dürüst açıklama kaldı; iç-spec atfı "(§9.5)" kaldırıldı.
### Üretim güvenliği & yapılandırma
- `minimumSystemVersion` 10.15 → **11.0** (build arm64-only; 10.15 = Intel-only macOS → çalışamayacağı makinelerde "kurulabilir" görünüyordu).
- **CSP** `null` → kısıtlı içerik-güvenlik politikası. **`.app`'te gözle DOĞRULANDI: WebView + IPC + 3/3 tespit (Premiere · Ollama-HTTP · MONTAJCI) CSP altında çalışıyor** (yerel/offline app sertleştirmesi, işlevi kırmadı).
- TypeScript **`strict` modu açıldı** (eksikti) — **sıfır hatayla** derlendi.
- Sahte örnek bölüm adı + "örnek bölümü yükle" `.app`'te gizlendi (yalnız tarayıcı önizleme); arşiv "Yeniden aç" `.app`'te artık GERÇEK kayıtlı manifesti diskten okur (`savedPath`) — mock değil, yoksa dürüst uyarı; "geliştirme modu" hata test-kancası prod'da kapalı (`import.meta.env.DEV`).
### UI / kopya / erişilebilirlik
- Panel adı "AutoReji De-Risk" → **"AutoReji"** (Premiere'de görünen Faz-0 kod adı kalktı; `id` korundu → tespit prefix'i bozulmaz).
- İkon-butonlara `aria-label` (üst bar · film şeridi zoom/sil + sahne kartı · önizleme transport · Inspector) — ekran okuyucu erişilebilirliği.
- Lint: kullanılmayan ternary ifadesi düzeltildi (`no-unused-expressions`); kalan uyarılar dev-only (fast-refresh) + bilinçli effect-deps.
- Sürüm 1.14.5 → **1.14.6** (6 noktada senkron).
### Doğrulama
- `tsc -b` (strict) + `vite build` temiz; dist sahte-fixture'sız 0.95MB; `.ccx` yeniden paketlendi; **`.app` yeniden derlendi → ad-hoc imza geçerli + Gatekeeper kabul + computer-use ile açılış/CSP/3-3 tespit/Hakkında(© 2026 Madyes)/sürüm v1.14.6 gözle DOĞRULANDI.** `.dmg` (11MB) üretildi + Masaüstü kopyası v1.14.6.

## [1.14.5] — 2026-06-30 — KRİTİK (dağıtım): AI modeli GERÇEK Ollama tespit + indirme (sahte simülasyon kaldırıldı)
### Düzeltildi / Değişti
- **EN KRİTİK — "Modeli indir" SAHTE simülasyon yapıyordu:** `.app`'te `ollama` komutu minimal PATH'te olmadığından gerçek `ollama pull` çalışamıyor, kod sessizce **sahte ilerleme** gösterip "indi" diyordu → model gerçekte kurulmuyordu, uygulama kullanılamaz haldeydi. **Tamamen gerçek hale getirildi:** indirme artık Ollama'nın **`/api/pull` HTTP stream**'i üzerinden (sidecar; PATH/CLI gerekmez, çalışma anıyla AYNI yol) — gerçek bayt-bayt ilerleme, bitince **gerçekten sunulabiliyor mu doğrular**. Başarısızsa dürüstçe hata (asla "indi" demez). Tarayıcı önizlemede simülasyon kalır (açıkça etiketli).
- **Ollama kurulu/çalışıyor mu HİÇ test edilmiyordu** (oysa çalışma anında VLM için ŞART): yeni sidecar komutları **`ollama_status`** (running/installed/hasModel/onDisk/ready — HTTP `/api/version`+`/api/tags` + disk) ve **`ollama_pull`** (gerçek stream). Frontend `detectModel`/`detectOllama` bunları kullanır.
- **HER AÇILIŞTA gerçek kontrol:** AI Modeli bölümü artık 5 gerçek durum gösterir → **Ollama yok** ("Ollama'yı indir" — ollama.com), **kurulu ama kapalı** ("Ollama'yı başlat" → `open -a Ollama`), **çalışıyor + model yok** ("Modeli indir" — gerçek), **hazır** ("Model hazır · doğrulandı"), indiriliyor (gerçek %). Mount'ta + manuel "tekrar kontrol et" ile.
- **Dağıtım garantisi:** uygulama başkasına verildiğinde — Ollama yoksa kurmaya yönlendirir, modeli gerçekten indirir, "hazır" yalnızca çalışma anında VLM gerçekten çalışacaksa der. "indi gibi yapma" yok.
- Sürüm 1.14.4 → **1.14.5**.

## [1.14.4] — 2026-06-30 — KRİTİK: homeDir izni (tespitler çalışmıyordu) + MONTAJCI launch oto-tespit + Kaldır + arşiv galeri sarması
### Düzeltildi
- **KRİTİK — `homeDir()` `.app`'te çalışmıyordu → home-bazlı TÜM tespitler (AI model + MONTAJCI) sessizce false dönüyordu:** capabilities'te **`core:path:default` izni eksikti** (`homeDir → resolve_directory` komutu reddediliyordu); Premiere tespiti home kullanmadığı için çalışıyordu, diğerleri çökmüştü. Kanıt: model `~/.ollama/.../qwen2.5vl/7b` diskte VARdı ama "onaylı" (false), MONTAJCI kuruluydu ama "bulunamadı". **İzin eklendi → `homeDir` çalışır → model "doğrulandı", MONTAJCI gerçekten tespit edilir.**
- **MONTAJCI her açılışta "Kur" geliyordu (oto-test etmeden):** `detectAndPatch`'e plugin **oto-tespiti geri geldi** (artık `homeDir` güvenilir) → her açılışta gerçek durumu doğrular: kuruluysa "kurulu" (Kur çıkmaz), kaldırılmışsa "Kur"a düşer, indirilip kurulmadıysa "test bekliyor". "Test et" elle doğrulama da kalır.
- **MONTAJCI "Kaldır"a basıp CC'de KALDIRMAYINCA da "Kur" geliyordu:** Kaldır artık durumu **erken sıfırlamıyor** (CC'yi açar + "kaldır, sonra tekrar test et" der); gerçek durum tekrar-test/yeniden-açılış oto-tespitiyle güncellenir → kaldırmadıkça "kurulu" kalır (dürüst).
- **Arşiv galeri görünümünde "Yeniden aç" alt satıra kayıyordu** (silme ikonu eklenince sığmadı): galeri modunda aksiyon satırı **dikey-stack** (TxDots üstte, butonlar altta sağa dayalı) + `whitespace-nowrap` → tek satır, taşma yok. Liste görünümü değişmedi.
- Sürüm 1.14.3 → **1.14.4**.

## [1.14.3] — 2026-06-30 — MONTAJCI "Test et" doğrulama akışı · UDT kaldırıldı · arşiv klasör-aç+sil · ad taşması (5 ajan araştırma)
### Eklendi / Değişti
- **MONTAJCI: indir ≠ kuruldu — ayrı "Test et" doğrulaması (#1):** "Kur" artık YALNIZ indirir (otomatik "sistem doğruladı" YOK). İndirilince durum **"indirildi · test bekliyor"** (amber). Kullanıcı çift-tıkla kurar → **"Test et"** butonuna basar → kısa **doğrulama animasyonu** (ProgressRing + "Premiere eklenti klasörü taranıyor / İmza okunuyor / Bağlantı doğrulanıyor") + **GERÇEK tespit** (`verifyPlugin` → Tauri `detectUxpPlugin`, tarayıcı: indirme kaydı) → dürüst sonuç: bulunursa yeşil **"kurulu · test edildi ✓"**, bulunmazsa kırmızı **"bulunamadı"** + "Premiere'i yeniden başlat, tekrar test et". `detectAndPatch` artık MONTAJCI'yı otomatik 'ok' yapmaz (kullanıcı-tetikli doğrulama).
- **UXP Developer Tools bölümü Hazırlık'tan KALDIRILDI (#5):** araştırma (5 ajan) doğruladı — imzasız `.ccx` **Creative Cloud Desktop** ile kurulur, **UDT gerekmez** (yalnız Premiere developer-mode gerekir, o Premiere bölümünde kalır). Hazırlık **4 → 3 öğe** (Premiere · AI modeli · MONTAJCI). `SetupState.uxp`, `detectUdt`, `UxpSection`, `SUM_ITEMS`/`ITEMS` 'uxp' tümü temizlendi.
- **Arşiv: "klasörü aç" çalışır oldu (#3):** kart butonu artık `savedPath` varsa aktif → **`revealInFinder`** (Finder'da göster); yoksa devre dışı + "önce manifesti kaydet" ipucu. ("Faz 4" placeholder kaldırıldı.)
- **Arşiv: kartlara silme ikonu (#4):** "klasörü aç" yanında **Trash2** ikon-buton → `removeArchiveEntry` + liste anında yenilenir + **"geri al"lı toast** (yanlış silmeye karşı).
- **Uzun manifest dosya adı taşması (#2):** UXP paneli `#load-summary .ls-name`/`.ls-head`'e **`min-width:0` + `flex:1`** → uzun ad artık **… ile kesilir**, label dışına taşmaz.
- Sürüm 1.14.2 → **1.14.3**.

## [1.14.2] — 2026-06-30 — Analiz hang/ring/pacing düzeltmeleri + CC açma + model disk-tespit (kullanıcı .app testi)
### Düzeltildi
- **Analiz "tamamlandı · Reji'ye geçiliyor"da TAKILIYORDU (geçmiyordu) — KRİTİK:** tamamlanma `setTimeout`'u, `setPhase('done')` re-render'ı effect'i yeniden kurup **clearTimeout**'luyordu → geçiş hiç olmuyordu. **İki ayrı effect'e bölündü** (biri 'done'a geçirir, diğeri yalnız 'done'da 1 kez timer kurar) → artık review'e geçiyor.
- **Üst ring dolum-arc'ı boş görünüyordu + "saçma dönen sarı nokta":** custom SVG + yanlış-konumlu dönen nokta KALDIRILDI → test edilmiş **`ProgressRing`** (gerçekten dolan altın halka). Hareket hissi aşama çubuğundaki **kayan ışıkta**.
- **Son aşama %79'da ~10dk takılı kalıyordu:** "creep" gerçek ilerlemeyi AŞIP cap'e oturuyordu → kaldırıldı; % artık **gerçek motor ilerlemesini** izler (vlm uzun adımında yavaş ama gerçek ilerler), donma hissini sürekli kayan ışık önler.
- **MONTAJCI "Kaldır" + UXP DevTools "Aç" hiçbir şey açmıyordu:** Tauri webview'de `window.open` dış URL/uygulama açmaz → **`/usr/bin/open`** ile: Kaldır → `open -a "Creative Cloud"` (Desktop, eklenti yönetimi); UXP DevTools → `open <url>`. ACL'e `open` eklendi.
- **AI model "indir geliyor" (yine):** `detectModel` artık **disk-öncelikli** (`~/.ollama/.../qwen2.5vl/7b` manifest) — `.app` minimal PATH'inde `ollama` komutu bulunmadığından sunucu-kontrolü güvenilmezdi; disk her durumda doğrular.
- **"Anında doğrulama" hep aynı (sahte) çıkıyordu:** gerçek dosya seçilince artık **sahte sabit değerleri göstermez** ("eşleşme/çözünürlük/varyant analizde çıkarılır" der); demo değerler yalnız örnek modunda.
- Sürüm 1.14.1 → **1.14.2**. **DOĞRULAMA:** computer-use ile Hazırlık 4/4 + analiz animasyonu (ring doluyor, aşama-tik, tamamlanma) + tarayıcı pace testi (aşama 2→5 ilerliyor).

## [1.14.1] — 2026-06-30 — .app cila: güvenilir tespit + akışkan analiz animasyonu + intro/outro kapalı
### Düzeltildi / Eklendi
- **MONTAJCI "kurulu ama her açılışta Kur geliyor" düzeldi:** Creative Cloud, `.ccx`'i `Plugins/External/<id>_<sürüm>` (ör. `com.autoreji.derisk_0.1.0` — **SÜRÜM SONEKLİ!**) kuruyor; tespit soneksiz tam-yol arıyordu → bulamıyordu. Artık `ls Plugins/External|Develop` + **PREFIX eşleşme** (güvenilir) → kuruluysa "bağlı", değilse "Kur". `detectAndPatch`'e otoriter geri eklendi (gerçek install yeri Bash ile bulundu).
- **AI Model "indir geliyor" düzeldi:** (a) `detectModel` Ollama sunucusu kapalıyken bile **disk fallback** (`~/.ollama/models/manifests/.../qwen2.5vl/7b`) ile doğrular; (b) `ModelSection` durumu `setup.model` değişince **senkronlanır** (tespit 'ok' yapınca "Model hazır", "indir" kalmaz).
- **Analiz ekranı yeniden tasarlandı (kullanıcı isteği):** genel % artık **akışkan** (rAF ease + creep → DAİMA hareket, sıçrama yok); ring **dönen ışık** taşır; **her aşama 0→100 dolar → yeşil tik animasyonu → sonraki aşama 0'dan** başlar (üstte aktif aşamanın %'si); aşama çubuğunda **sürekli kayan ışık**; bitince **"Bölüm analizi tamamlandı 🎬 · Reji'ye geçiliyor"** ikon+metin animasyonu + ~2s bekleyip review'e geçer. Gerçek motor arka planda koşar; tamamlanma motora bağlanır (mock'ta zamanlı).
- **Açılış/kapanış imzası VARSAYILAN KAPALI** (kanal sahibi tercihi): `decide.py intro_fade/outro_fade = 0.0` → manifest'te siyah fade-in/out yok; Yönetmen paneli toggle'ı da varsayılan kapalı (kullanıcı isterse açar).
- **Sürüm her güncellemede yükseltiliyor** (kullanıcı kuralı) → 1.14.0 → **1.14.1** (6 yerde senkron).

## [1.14.0] — 2026-06-30 — FAZ 4: GERÇEK macOS .app (Tauri 2 + Python sidecar + ad-hoc imza) ❄️ DONDURULDU
### Eklendi — Paketleme (Faz 4)
- **Gerçek `.app`** — `brain/src-tauri/` Tauri 2 kabuğu sıfırdan: `tauri.conf.json` (AutoReji, com.autoreji.app, devUrl 5173, frontendDist ../dist), `Cargo.toml` (+release: LTO/opt-s/strip), `build.rs`, `src/lib.rs` (mobil-hazır run() + dialog/fs/opener/shell init), `src/main.rs`, `capabilities/default.json` (v2 ACL: dialog/fs `$HOME` scope/opener/shell-execute+sidecar), `Entitlements.plist` (JIT + disable-library-validation → WebView çökmesin), premium ikon (`tauri icon`). **Release .app derlendi (31MB) · derin imza geçerli · entitlements var · AÇILIYOR — doğrulandı.**
- **Python sidecar gömülü** — `sidecar/cli.py` dispatcher (ping/parse/match/detect_crop/analyze_video/vlm_scene/build_manifest; stdin-JSON + stderr-ilerleme sözleşmesi; DONMUŞ karar modüllerine DOKUNMADAN sarar) → **PyInstaller tek-dosya 8MB** (saf stdlib, torch yok), `config.toml` gömülü (`--add-data` + `scripts/pyi_rthook_config.py` → frozen'da `decide.CONFIG_PATH` düzeltilir), ad `autoreji-sidecar-aarch64-apple-darwin`, **ad-hoc imzalı**, `bundle.externalBin` ile .app'e gömülü. **Frozen ping + parse (gerçek prompt, 160 sahne) + .app içinden ping doğrulandı.**
- **Ad-hoc imza** (ücretsiz, `signingIdentity:"-"`): .app + iç binary + sidecar ayrı imzalı; notarization YOK (ilk açılış bir kez "yine de aç").
- **Native köprüler GERÇEĞE bağlandı** — `lib/tauri.ts` (yeni; Command/sidecar-stream/dialog/fs/opener izole helper). `lib/native.ts saveTextFile` → Tauri `plugin-dialog save()` mutlak yol + `plugin-fs`. `lib/setup.ts`: `pullModel` (gerçek `ollama list`/`pull` + % ayrıştırma) · **gerçek tespit** `detectPremiere`/`detectUdt`/`detectOllama`/`detectModel`/`detectUxpPlugin` + `detectAndPatch` (Hazırlık 'ack'→sistem-doğrulamalı 'ok') · `installPlugin` (pakette .ccx yaz+sistemle aç→CC kurar). `lib/engine.ts` (yeni): **gerçek sidecar pipeline** (crop→analyze→vlm→build_manifest, canlı ilerleme, manifesti diskten okur). Hepsi `tauriAvailable()` arkasında; **tarayıcı fallback korunur — uçtan uca 0 konsol hatası doğrulandı.**
- **UI ekranları köprülere BAĞLANDI (gerçek .app'te demo değil):** Hazırlık açılışta `detectAndPatch` ile **gerçek tespit** (Premiere/Ollama/model/MONTAJCI kuruluysa yeşil "doğrulandı"; ".app"te "sistem doğrulayamaz"/"Faz 4" etiketleri kalkar → "yerel · Ollama") · Giriş kartları **gerçek `dialog.open` dosya/klasör seçici** (seçilen yol gösterilir → store `intake`) · Analiz gerçek girdiyle **`engine.runPipeline`** (sidecar) çalıştırır, hata graceful kart (hang yok). Tarayıcıda hepsi eski mock (Playwright 0 hata). [kullanıcı tespiti: .app hâlâ demo/Faz4 gösteriyordu — köprü fonksiyonları vardı ama UI'a bağlı değildi]
- **`.app` RUNTIME düzeltmeleri (kullanıcının .app testinden — tarayıcıda görünmeyen, yalnız pakette çıkan buglar):** (1) **Plugin import kökü:** Tauri pluginleri `@vite-ignore`+değişken-isimli dinamik import ile yükleniyordu → paketlenmiş `.app`'te bare-module ÇÖZÜLMÜYOR, tüm plugin çağrıları (dialog/fs/opener/shell) **sessizce ölüyordu** (dosya seçici açılmıyor · MONTAJCI .ccx inmiyor) → **statik-string `import('@tauri-apps/plugin-x')`** (Vite lazy chunk olarak bundle'lar, .app'te çözülür). **⚠️ TUZAK: Tauri plugin importu ASLA @vite-ignore/değişken olmasın — statik literal ŞART.** (2) İkili `.ccx` yazımı + dialog/opener için ACL eklendi: `fs:allow-write-file`/`fs:allow-read-file` ($HOME) + `dialog:allow-open`/`allow-save` + `opener:allow-open-path`/`allow-reveal-item-in-dir`. (3) **Video önizleme** `.app`'te `/@fs` (Vite dev) ile çalışmaz → **`convertFileSrc` + asset protokolü** (`tauri.conf` `assetProtocol.enable` + scope `$HOME/**` + Cargo `tauri` feature `protocol-asset`). (4) **Analiz motoru** `Command.sidecar().spawn()` kullanıyordu → "plugin:shell|spawn not allowed by ACL" → **`shell:allow-spawn`** izni eklendi + sidecar girdisi STDIN yerine **argv[2]** ile geçiriliyor (stdin-write iznine gerek kalmadı, daha sağlam). (5) **MONTAJCI kaldırma**: Hazırlık'ta kurulu durumda **"Kaldır"** butonu (`removeUxpPlugin` → `~/Library/.../UXP/Plugins` altındaki plugin klasörünü siler; `fs:allow-remove`) + elle CC Desktop talimatı + test ipucu. Tarayıcı akışı 0 konsol hatası (regresyon yok).
- **`.app` RUNTIME fix-2 (kullanıcı .app testi → computer-use + Bash ile KENDİM DOĞRULADIM):** (6) **Analiz `FileNotFoundError: 'ffmpeg'`** → macOS GUI .app **minimal PATH** ile açılır (Homebrew `/opt/homebrew/bin` YOK) → sidecar `subprocess` ffmpeg/ffprobe'u bulamıyordu → **`cli.py` modül-yükünde PATH'e `/opt/homebrew/bin` vb. ekler** (⚠️ TUZAK: paketli .app sidecar'ı kullanıcı shell PATH'ini ALMAZ). (7) **Plugin akışı sadeleşti** (kullanıcı isteği): "Kur" = yalnız **indir + Finder'da göster** (otomatik açma YOK, kullanıcı çift-tıklar); "Kaldır" = **Creative Cloud'u açar** (kullanıcı elle kaldırır). (8) **Dürüst/otoriter tespit**: Premiere/UDT/model güvenilir → otoriter ('ok' yoksa 'pending'e DÜŞER); MONTAJCI CC-`.ccx` konumu opak → **asla otomatik 'ok' DEĞİL** → yanlış "sistem doğruladı" + kaybolan Kur butonu düzeldi. **DOĞRULAMA (self-test):** computer-use → Hazırlık 3/4 · MONTAJCI 'bekliyor' + Kur→.ccx Finder'da seçili · Bash (minimal-PATH) → tam pipeline crop+analyze+vlm+build_manifest **manifest üretti** (ffmpeg + Ollama çalıştı, 0 hata).
- **`scripts/`**: `setup.sh` · `build_sidecar.sh` (PyInstaller+config+imza+ping) · `build.sh` (sidecar→web→tauri release→derin imza doğrula→Gatekeeper notu) · `dev.sh` · `fetch_models.sh`. `vite.config.ts` Tauri-uyumlu (strictPort 5173/clearScreen/envPrefix). `.claude/settings.json` izin allowlist.
### Donduruldu
- **Faz 4 ❄️** — paketleme kabuğu + sidecar + imza + entitlements SABİT. Tauri/sidecar/imza yapısına dokunma; yalnız içerik (UI/kurgu) gelişir.
### Kalan (kullanıcının GERÇEK testi — UXP/Premiere/GUI/Ollama, burada otomatik test EDİLEMEZ)
- `.app` içinde: Hazırlık tespitleri · `ollama pull` ilerlemesi · sidecar pipeline uçtan uca (gerçek video klasörü + Ollama, ~dakikalar) · MONTAJCI .ccx açılışı · manifest "Farklı Kaydet" mutlak yolu. Köprü kodu CURRENT Tauri 2 dokümanına göre yazıldı; build/imza/açılış + tarayıcı akışı doğrulandı, **runtime GUI akışı kullanıcıda**.

## [1.13.2] — 2026-06-30 — Panel GERÇEK altın render (div-button) + ferah boyut + kayan % + gerçek "Manifest'i Kaydet" + MONTAJCI kalıcı "kurulu"
### Düzeltildi
- **UXP panel butonları artık GERÇEKTEN altın render oluyor** — kök neden (araştırma + gerçek Premiere testi): native `<button>` UXP'de host/Spectrum stil kapsamı taşıyıp `background: linear-gradient`'i **eziyor** (`appearance:none` UXP'de yok) → düz gri kalıyordu. Çözüm (Adobe forum uzmanı önerisi): **tüm aksiyonlar `<div role="button"/role="tab" tabindex="0">`** (div gradient'i güvenilir render eder) + `ui.js` Enter/Space klavye köprüsü. Ayrıca **3-duraklı gradient + box-shadow UXP'de no-op**'muş → 2-duraklıya + `::before`/`::after` pseudo glow'a indirildi. **→ Kullanıcı gerçek Premiere'de onayladı: altın butonlar çalışıyor.**
- **Panel açılış boyutu büyütüldü** — `preferredFloatingSize` 560×820, `preferredDockedSize` 460×720, `minimumSize` 320×360 (önceden sıkışık/küçük açılıyordu).
- **Kur "Kuruluyor" yüzdesi kayarak ilerliyor** — adım-bazlı 0→20→40 sıçraması yerine **sürekli rAF ilerlemesi** (0→100 akışkan, `prog`); StageTimeline adımları `prog`'tan türetilir. reduced-motion'da anında.
- **Kur "Bölüm kuruldu" → cilalı gerçek "Manifest'i Kaydet"** — yanıltıcı kopyala-yol satırları (sahte `_manifest/`,`_archive/` + Finder; PathRow sökülüp temizlendi) **kaldırıldı**. Yerine: **tam-genişlik birincil buton** (artık sarmıyor/alt satıra kaymıyor) → **gerçek "Farklı Kaydet"** (`native.ts saveTextFile` → `SaveResult {ok,native,name,path}`; **Tauri** `plugin-dialog save()` MUTLAK yol + `plugin-fs writeTextFile` köprüsü hazır · **tarayıcı** `showSaveFilePicker` kullanıcı yeri seçer · yoksa Blob indirme) → `{ad}_manifest.json` (`{...manifest, clips}` = düzenlenmiş hâl). Kaydedince **KALICI "Manifest kaydedildi"** (eskiden 2.5s sonra geri dönüyordu — düzeltildi) + **kaydedilen konum satırı + kopya ikonu** (Tauri: mutlak yol · tarayıcı: dosya adı + **dürüst not**: tarayıcı güvenlik gereği tam klasör yolunu vermez — Faz 4 .app'te tam yol gelir; **3-ajan araştırma + adversarial doğruladı: standart workaround YOK**) + "Tekrar kaydet" linki. Kaydetme **arşive işlenir** (`markArchiveSaved` → `ArchiveEntry.savedAt/savedName/savedPath`; `writeArchiveEntry` tekrar-kuruşta bunları KORUR) ve **Arşiv ekranında "kaydedildi" rozeti** görünür. Panel "Yükle → Manifest Dosyası Seç" ile okur. (Kullanıcı tespitleri: kötü yerleşim · "kaydedildi" geri dönüyor · arşive eklenmiyor · klasör yolu+kopya yok — dördü de giderildi; Playwright doğruladı.)
- **Hazırlık MONTAJCI: indirince kalıcı "kurulu"** — `.ccx` indirildiğinde `setup.plugin='ack'` (kalıcı) → her açılışta "MONTAJCI'yı Kur" butonu yerine **"MONTAJCI bağlı"** gösterir (kullanıcı tespiti: sürekli Kur butonu çıkıyordu). "Yeniden kur" linki duruyor. Playwright doğruladı: indirince ack, reload sonrası "bağlı", Kur butonu yok.
- ppro `main.js` dokunulmadı (6 transaction + 9 runStep sabit). **.ccx yeniden paketlendi (v1.13.2) → yeniden kur gerekir.**

## [1.13.1] — 2026-06-30 — Düzeltmeler: Hazırlık stepper'da · .ccx adı · Analiz sweep · panel premium + picker
### Düzeltildi
- **Hazırlık üst adım çubuğuna (stepper) eklendi** — artık **Hazırlık › Giriş › İnceleme › Kur** (Hazırlık ilk adım, hep erişilebilir; setup ekranında aktif). Önceden gizli kapıydı, stepper'da görünmüyordu (kullanıcı tespiti).
- **`.ccx` doğru adla iniyor** — Blob yerine **doğrudan statik yola** indirme (`a.href=CCX_URL`); tarayıcının (Safari) Blob URL'de download adını yok sayıp UUID vermesi sorunu çözüldü → `com.autoreji.derisk_premierepro.ccx`.
- **Analiz ekranı** — saçma radyal halka (RippleField) + dağınık/dengesiz gradient **kaldırıldı**; yerine **çok saydam (0.05–0.09 alfa), simetrik, blur'lu, soldan-sağa gidip-gelen** `SoftSweep` — yazıları kapatmaz.
- **UXP paneli premium yeniden tasarım** — altın gradient birincil butonlar + rafine cam ikincil + ince altın sekmeler + stillenmiş textarea (düz gri amatör görünüm gitti); **dosya seçici sağlamlaştırıldı** (UXP `fileTypes` sabiti + `initialDomain` + fallback + açılmazsa **görünür toast/log** — kök neden: `types:["json"]` ham dizi bazı Premiere sürümlerinde sessiz/boş picker). ppro birebir korundu. → **.ccx yeniden paketlendi; yeniden kur gerekir.**
- **Kur "kuruluma hazır"** — cut/fade/black göstergelerine yaylı stagger dinamizmi (madde 8 tamamlandı).
- **MONTAJCI "Gelişmiş — UDT ile elle yükle" bölümü KALDIRILDI** — son kullanıcıda `manifest.json` mutlak yolu yok (sadece `.ccx` geliyor) + developer modu gerektiriyordu; `.ccx` çift-tıkla kurulum zaten doğrudan kuruyor, gereksiz/yanıltıcıydı (kullanıcı tespiti).

## [1.13.0] — 2026-06-30 — Hazırlık her-açılış %-tarama + gerçek .ccx kurulum + premium animasyon + panel sekmeli
### Eklendi
- **Hazırlık — her açılışta + sıralı %-tarama:** Hazırlık artık HER açılışta görünür (store init sabit `'setup'`); 4 adım (Premiere · UXP/CC · AI model · MONTAJCI) arkada hızlı çözülür, ÖNDE sırayla dolan **ProgressRing + ScanBeam** ile taranır ("Stüdyo taranıyor… · Premiere" → …); önceden onaylı adımlar **hızlı** ✓, AI modeli her açılış kontrol edilir. `useScanChoreography` motifi (tek zamanlayıcı, ek rAF yok).
- **MONTAJCI gerçek kurulum (.ccx):** "manifest yolu kopyala" elle-akışı → **uygulamaya gömülü `.ccx` paketi** + "MONTAJCI'yı Kur" %-akışı. `scripts/pack_panel.sh` panel/'den `.ccx` üretir (`brain/public/plugin/`, ~25 KB + sha256 meta — şişme yok). Tarayıcıda: `installPlugin` premium %-flow → **.ccx GERÇEKTEN diske iner** (`downloadCcx` Blob) → "çift-tıkla → Creative Cloud kurar" talimatı (**imzasız .ccx · geliştirici modu gerekmez · offline**). Pakette: aynı imzayla UPIA `--install` (köprü hazır). Gelişmiş UDT-Load yolu RevealPanel altında gizli.
- **Gerçek Creative Cloud / UXP linki:** "Creative Cloud'u Aç" → doğrulanmış `https://creativecloud.adobe.com/apps/download/uxp-developer-tools` (kırılgan `aam://` reddedildi).
- **Premium animasyon yükseltmeleri** (önceki "düşük skor" şikayetlerine): Giriş "anında doğrulama" → ışık-süpürme + **satır-satır onay dalgası** (SweepReveal); Analiz → metni KAPATMAYAN **yayılan dalgalar** (RippleField, CSS keyframe, arkada); Kur "kuruluma hazır" → sayılar **"doğarak" yükselir** (BirthStat: blur-in + overshoot + count-up) + kart doğum-parıltısı + "ne kurulacak" alttan açılan **RevealPanel**.
- **UXP paneli sekmeli + kaydırılabilir** (önceki "scroll yok, taşıyor" şikayetine): **Yükle** (dosya seç + JSON yapıştır + panodan yapıştır) → otomatik **Kur** (pipeline) → **Rapor**; her sekme bağımsız scroll (panel taşmaz); manifest yüklenene dek Kur/Rapor kilitli. **ppro 9-adım/6-transaction birebir korundu.**
### Teknik
- `components/motifs.tsx`: BirthStat · RippleField · SweepReveal · RevealPanel · useScanChoreography (mevcut ScanBeam/ProgressRing/ApprovedSeal/ConnPulse/StageTimeline korunur). `lib/setup.ts`: installPlugin/downloadCcx/CCX_URL/InstallProgress + CC_URL güncel. `scripts/pack_panel.sh` + `brain/public/plugin/{.ccx, manifest.meta.json}`. Store init her açılışta `'setup'`. index.css `ripple-out` keyframe + `.ripple-field/.ripple-ring`.
- Prod build temiz, **0 konsol hatası** (Playwright uçtan uca: her-açılış Hazırlık → %-tarama → **.ccx GERÇEK indirme** → tam akış → reload yine Hazırlık). Kurgu kararları / Faz 2 dondurması dokunulmadı. ⚠️ UXP paneli + `.ccx` çift-tık kurulumunun GERÇEK testi Premiere 2026'da (UDT/çift-tık).

## [1.12.0] — 2026-06-30 — Hazırlık kurulum sayfası + tüm akış ekranları premium + UXP paneli yeniden inşa
### Eklendi
- **Hazırlık (Stüdyo Kurulumu) ekranı** — Giriş'in önünde **ilk-ekran kapısı**: 4 bölüm (Premiere · UXP/Creative Cloud + UDT · AI model indirme · MONTAJCI entegrasyonu) dikey **"Bağlantı Hattı"** spine üzerinde + **sıralı görsel tarama** (görsel şölen) + üst durum özeti & **dürüstlük lejandı** (yeşil=doğrulandı · amber=onaylı · gri=bekliyor). **Atlanabilir ama önemini bildiren** uyarı + AppShell **N/4 rozeti** + Kur ekranında hatırlatma. localStorage kalıcı (bir kez geçilince Giriş ilk ekran olur).
- **AI model indirme** (`lib/setup.ts`) — qwen2.5-VL 7B (6 GB) premium durum makinesi: **navigator.onLine GERÇEK** → seed'li **simüle indirme** (altın ProgressRing + canlı %/MB/s + aşamalar) → "Model hazır" + onay mührü + toast. **DÜRÜST:** "önizleme · gerçek indirme Faz 4" (sahte 'kuruldu' yok); köprü imzası Faz 4'te gerçek `ollama pull`'a bağlanır.
- **Premium imza motifleri** (`components/motifs.tsx`) — **ScanBeam** (tarama huzmesi) · **ProgressRing** (fosforlu uç + glow, determinate/indeterminate) · **ApprovedSeal** (mühür + halka + 6 çentik) · **ConnPulse** (bağlantı nabzı, gerçek online) · **StageTimeline** (raylı aşamalı-rapor). Tüm akış ekranlarına yayıldı.
- **Tüm akış ekranları premium genişletildi:** Giriş (doğrulama paneli ScanBeam), **Tarama** (ProgressRing + StageTimeline + ScanBeam; iptal + cozy-hata korunur), **Kur** ("kuruluyor" → ProgressRing + StageTimeline pipeline; "kuruldu" → **ApprovedSeal mührü**; MONTAJCI hatırlatma bandı).
- **UXP Premiere paneli (`panel/`) premium yeniden inşa** — ham log + 3 buton yerine: premium header (altın marka + sürüm) · aşamalı **pipeline kartları** (idle/aktif/bitti/hata + dikey spine omurga) · canlı **rapor paneli** (klip/cut/fade/black/boşluk=0/crop/süre) · durum çubuğu + elapsed · final başarı **recap** + tükenen-çubuklu **toast**. `main.js` yapısal event-emitter'a bağlandı, `panel/ui.js` (yeni) render katmanı. **9-adımlı ppro kurma mantığı + 6 transaction birebir KORUNDU (regresyon kapısı geçti).** UXP-güvenli (CSS transition/@keyframes/grid/backdrop-filter/color-mix YOK; tüm hareket setTimeout; sistem fontu). ⚠️ Gerçek test Premiere'de (UDT Load) yapılır — tarayıcıda doğrulanamaz.
### Teknik
- Yeni dosyalar: `lib/setup.ts` (köprü: getSetupState/patchSetup/isSetupDone/setupReadyCount + pullModel sim + useOnline gerçek + openCreativeCloud + integratePlugin), `lib/seed.ts` (mulberry32 RNG — Date.now/Math.random yerine), `screens/SetupScreen.tsx`, `components/motifs.tsx`, `panel/ui.js`. Store: `setup` state + setSetup/completeSetup/skipSetup + **ilk-ekran kapısı** (isSetupDone). `index.css`: glow token'ları + `.glass-raised`/`.glass-pop` elevation. Screen tipine `'setup'`.
- Prod build temiz, **0 konsol hatası** (Playwright uçtan uca: Hazırlık kapısı → atla → tam akış). **Kurgu kararları / Faz 2 dondurması dokunulmadı.**

## [1.11.0] — 2026-06-30 — Kalan UI tamamlandı: Arşiv · Toast · Inspector önizleme · Analiz iptal/hata · değişim özeti · mikro-etkileşim · kontrast/sanallaştırma · Kur geliştirmeleri
### Eklendi
- **Arşiv / Geçmiş ekranı** — kurulan bölümlerin **sinematik poster galerisi**: hover-scrub kapak, dominant rejim alt-glow + rejim dağılım şeridi, geçiş noktaları, tarih grupları (Bugün/Bu hafta/Daha eski), Galeri/Liste yoğunluğu, boş durum onboarding (yağmur + nefes). "Yeniden aç" → manifesti yükleyip İnceleme'ye. localStorage tabanlı (Faz 4'te gerçek `_archive/`). Üst barda **Library** butonu + komut paleti girişi.
- **Toast bildirim sistemi** — cam, **fosforlu sol-şerit**, yaylı giriş, hover-pause + **tükenen ışık çubuğu**; sil / sıfırla / toplu işlem / kopyala / kuruldu için **"Geri al"lı** bildirimler. En fazla 3 yığılır.
- **Inspector mini-önizleme** — seçili klibin **ölçek-renkli + altın çerçeveli** canlı mini videosu (hover-scrub / autoplay, ses yok); tıkla → büyük sahnede oynat.
- **Analiz ekranı: iptal + hata** — sürerken zarif **"İptal"** → Giriş'e döner; hata durumunda **cozy yağmur-bulutu** kartı + "Tekrar dene" / "Girişe dön" (suçlayıcı olmayan dil).
- **Stil değişiminde "ne değişti" özeti** — delta-chip'li toast (örn. "Sakin · +12 fade ↑ · ort 4.1→4.6s ↑"). Mod kurgu kararını değiştirmediği için yalnız **stil** değişimine bağlandı (dürüst işaretleme).
- **Mikro-etkileşim cilası-2** — istatistik sayıları **count-up** (0'dan yumuşak tırmanış), kart/panel **giriş stagger**'ları; `prefers-reduced-motion`'da anında.
- **Kontrast (WCAG AA)** — `fg-subtle`/`fg-faint` token'ları okunur eşiğe çekildi (premium soluk hiyerarşi korunarak).
- **Film şeridi sanallaştırma** — native **`content-visibility:auto`** (ekran-dışı kartlar boyanmaz; custom JS pencereleme yerine — boş-kutu/scroll-kayması riski yok).
- **Kur ekranı geliştirmeleri** — **"Finder'da göster"** (ince `native.ts` köprüsü: Tauri varsa gerçek reveal, yoksa yolu kopyalar + "Faz 4" bildirimi), kuruluş **recap'i** ("ne yapıldı": native stereo · N fade ortalandı · render yok…), **mini thumbnail şeridi**, "tüm yolları kopyala", **cozy başarı parıltısı**, kuruldu → **arşive otomatik kayıt** + "Arşiv'i aç".
### Teknik
- Yeni dosyalar: `lib/native.ts` (Tauri köprüsü — dinamik import + clipboard fallback), `lib/archive.ts` (localStorage katmanı), `lib/diff.ts` (saf snapshot/diff), `components/Toast.tsx`, `components/ChangeSummaryToast.tsx`, `components/review/InspectorPreview.tsx`, `screens/ArchiveScreen.tsx`. `ui.tsx`'e `useCountUp`/`CountUp` + `Stat` count-up desteği.
- Store: `toasts` + `pushToast`/`dismissToast`/`pushChangeSummary`/`reopenArchived`; yıkıcı/toplu aksiyonlara toast + stil değişimine diff özeti. **Kurgu kararları / Faz 2 dondurması dokunulmadı.** Prod build temiz, 0 konsol hatası (Playwright doğruladı).

## [1.10.0] — 2026-06-29 — Kalan UI paketi: onboarding · toplu seçim · komut paleti · genel bakış · sıfırla · kısayollar · Kur
### Eklendi
- **Boş durum onboarding** (Giriş): girdi yokken **"Nasıl çalışır" 3 adımı** (Ver → İncele → Kur) + belirgin "örnek dene"; girdi gelince doğrulama paneline döner.
- **Toplu seçim** (film şeridi): **⌘/Ctrl+tık** tekil işaretle/kaldır, **Shift+tık** aralık; alt barda **"N klip seçili → Cut / Fade / Black · Sil · Temizle"** (tek undo adımı). İşaretli klipler amber ring + hafif yukarı.
- **Komut paleti (⌘K)**: ara-bul-çalıştır — Git/Mod/Kurgu stili/seçili-klip geçiş/Görünüm/Düzenle komutları; **sahne numarası yazınca o sahneye atla**. Fuzzy arama, ↑↓ gez, Enter çalıştır, Esc kapat.
- **Genel bakış (mini-harita)**: zaman çizelgesine **dikkat bayrakları** (risk/720p = kırmızı · düşük güven = sarı, parlayan nokta); başlık "Genel bakış · zaman çizelgesi".
- **Tümünü sıfırla + diff sayacı**: alt barda **"N elle değişik"** → tıkla, tüm elle değişiklikleri algoritmanın orijinaline döndür (tek undo).
- **Klavye kısayolları kartı (`?`)** + film şeridi kartlarında **Enter/Space** ile seçim + üst barda **⌘K** ipucu ve kısayol (Keyboard) butonları (kod bilmeyen kullanıcı keşfetsin).
- **Kur ekranı**: çıktı (manifest/arşiv) **yolları + kopyala** butonu + Premiere/UXP'de yapılacakların **numaralı adım kartı**.

## [1.9.1] — 2026-06-29 — Oynatım devamı + film şeridinde sil + ince ayarlar
### Eklendi / değişti
- **Tüm kurgu aktifken film şeridinden klip açınca oradan DEVAM eder** — oynatım durmaz, tıklanan klipten sürer (`playScene` güncellenir).
- **Film şeridinde sil:** kart **alt-sağ köşede kırmızı yuvarlak çöp kutusu** (hover'da belirir, tek tık) → klibi kurgudan çıkarır (`enabled=false`). UXP panel `enabled:false` klipleri **atlar** → toplam süre/boşluk sorunu olmaz. **Geri alınabilir** (tekrar tık → ↩ / ⌘Z). Silinen klip film şeridinde soluk-gri.
- **İleri/geri tuşları** artık **sonraki/önceki videoya** geçer (eski "sona/başa git" anlamsızdı).
- **Ses varsayılan kapalı** (teyit — yenilemede hep kapalı başlar).
- **Crop büyütme işareti** film şeridinden kaldırıldı (gereksizdi).
### Düzeltildi
- Klip kartı `<button>` → `<div role="button">` — iç içe buton (çöp kutusu) geçersizliği giderildi.

## [1.9.0] — 2026-06-29 — Premium önizleme + ölçek renkleri + geçiş döngüsü + 720p uyarısı
### Önizleme (PreviewStage)
- **Premium altın çerçeve:** video, "Kur butonu" altın tonunda **kalın çerçeve** (ring-2) + yuvarlak köşe (rounded-2xl) + çok-katmanlı gölge (altın glow + derin gölge); arka plan **koyu gradientli zemin** (Inspector ruhu — eski amber dolgu/siyah letterbox kaldırıldı).
- **Tekleme/küçülme giderildi:** çerçeve temel boyutu sabitlendi (`h-full aspect-video`) → hover geçişlerinde video sıçramıyor (ölçüldü: 871×490 sabit).
- **Parlaklık:** video `brightness(1.08) saturate(1.04)`.
- **Gömülü premium oynatım kontrolleri:** tüm kontroller video çerçevesinin **içine gömülü** (kenara taşmaz), **cam-gradient** butonlar + glow. **Akıcı/kayan ilerleme çubuğu** (`requestAnimationFrame` ~60Hz, tıkla→seek) + amber gradient + tutamak. Sol **"Tüm kurguyu oynat"**, orta **önceki video / durdur-devam / sonraki video**, sağ **ses + süre**.
- **Ses (kalıcı):** önizleme sesi aç/kapa — varsayılan **kapalı**, açınca klipten klibe **korunur** (`store.muted`).
- **Tüm kurgu takibi:** oynatım sırasında oynayan klip film şeridinde **otomatik seçili + ortaya kayar**, Inspector ona göre güncellenir; geçiş **fade/black ise canlı görünür** (dip süresi geçiş süresine bağlı). Tek-klip önizlemede **döngü** + fade/black'te **fadeli açılış**.
### Film şeridi & ölçek renkleri
- **Ölçek kimlik renkleri:** Drone (gök mavisi) · Geniş (teal) · Orta (amber) · Yakın (turuncu) · Çok yakın (pembe) · POV (mor) · Tepeden (indigo) — `SCALE_META`.
- **Kart altı glow** artık kartın **ölçek rengine** göre (sabit amber değil) + ölçek etiketinde renk noktası.
- **Geçiş yuvarlakları:** büyütüldü + aralandı; **cut görünür** (gri dolu yuvarlak), fade/black **fosforlu** (renkli glow, fade=teal/black=mor). Geçişe **tıkla → cut→fade→black→cut döngüsü**.
- **Film şeridi zemini:** koyu gradientli panel (Inspector ruhu).
- **720p/düşük çözünürlük:** 1080p olmayan klipler **yoğun kırmızı ring + "{h}p" rozet** ile aşırı belirgin (Bölüm 2'de sahne 115 = 720p).
### Zaman çizelgesi
- Her segmentin altında **ölçek rengi şeridi**; fade/black'lerde **fosforlu dikey çizgi** (glow).
### Sidecar / veri
- `build_manifest`: manifeste klip başına **`resolution`** (ffprobe gerçek yüksekliği; dosya adı "1080p" yanıltabiliyor). `match.probe` zaten `h` veriyordu. Kararlar **birebir korundu** (yeniden üretim: cut 117/fade 40/black 2, 0 hata). `types.Clip.resolution` eklendi.

## [1.8.1] — 2026-06-29 — Önizleme siyahı (renk token çakışması) + hareketli önizleme toggle + mikro-etkileşim altyapısı
### Düzeltildi (önemli — kök neden)
- **Renk token çakışması: tüm "siyah"lar yanlışlıkla MORDU.** `index.css`'te `--color-black: #8b86dd` (dip-to-black geçiş rengi) **Tailwind'in standart `black`ini eziyordu** → `bg-black`/`from-black`/`to-black` kullanan her yer (büyük önizleme **letterbox**'ı, film şeridi gradient'leri, geçiş önizleme modalı) mor render oluyordu. Geçiş rengi **`--color-dip`**'e taşındı (`utils.ts` TRANSITION.black → `var(--color-dip)`). Artık tüm siyahlar gerçek siyah. *Kullanıcı geri bildirimi: "video sağ-sol mor → siyah olsun."* Doğrulandı: letterbox computed `rgb(0,0,0)`.
### Eklendi
- **Hareketli önizleme toggle** (film şeridi başlığında **"Hareketli"** butonu): basınca hover-scrub + büyük önizlemede hover'da video oynatma **kapanır/açılır** (statik kareler ↔ hareketli). Store `motionPreview` (varsayılan açık). "Tüm kurguyu oynat" bundan bağımsız çalışır. Doğrulandı: açıkken scrub var, kapalıyken yok.
- **Mikro-etkileşim altyapısı + erişilebilirlik:** profesyonel easing eğrileri (`--ease-in-quart` çıkış, `--ease-spring` vurgu) + asimetrik süre token'ları (`--dur-fast 130ms` / `--dur-base 220ms` / `--dur-slow 360ms`, Atlassian/Linear); **`prefers-reduced-motion`** desteği — sistemde "hareketi azalt" seçiliyse dekoratif animasyonlar kısılır (WCAG 2.3.3).
- Üst bar sürüm rozeti `APP_VERSION` → 1.8.1.

## [1.8.0] — 2026-06-29 — Hover-scrub (film şeridinde kare kazıma)
### Eklendi
- **Hover-scrub:** film şeridinde bir klibin üzerinde fareyle **yatay gezerken kartın içinde klibin kareleri akar** (sol kenar = baş, sağ = son) → klibi açmadan 8 saniyenin içini tarama. Profesyonel NLE deseni (Premiere Hover Scrub / DaVinci / Frame.io). Alt kenarda küçük **scrub ilerleme çubuğu**.
  - **Teknik (performans):** her klip için **tek yatay sprite şeridi** (8 kare birleşik JPEG, `brain/public/sprites/<scene>.jpg`, ffmpeg `fps+tile` ile üretildi) → hover'da yalnız `background-position` kaydırılır, **kare başına ağ/decode çağrısı YOK** (Mux/YouTube storyboard tekniği). 160 sprite · ~15 MB · 0 hata.
  - Kod: `scratchpad/gen_sprites.py` (üretici); `data.ts` → `spriteUrl` + `SPRITE_FRAMES=8`; `Filmstrip.ClipCard` → fare X'ten kare + sprite overlay + scrub göstergesi.
  - **Doğrulama (Playwright):** fare X %4→%30→%60→%97 ⇒ sprite konumu %0→%28.6→%57.1→%100 (birebir oransal); prod build `tsc` temiz.
### Düzeltildi
- **Üst bardaki sürüm rozeti koddan kopuktu** (hep "v1.6.0" gösteriyordu); `APP_VERSION` güncel sürümle senkronlandı. *(İleride VERSION dosyasından build-time okunabilir.)*

## [1.7.1] — 2026-06-29 — UI cila & hızlı kazanımlar (P0 paketi)
### Eklendi / iyileştirildi
- **Hover → Inspector senkronizasyonu (kullanıcı isteği):** film şeridinde bir klibin üzerine gelince (tıklamadan) sağ Inspector + üst önizleme o klibe geçer; **"önizleme" rozeti** ile uçucu olduğu belli, tıklayınca seçili olarak kilitlenir (*preview-on-hover, commit-on-click* — Premiere/NN-g deseni). `Inspector` artık `playScene ?? hovered ?? selected` ile `PreviewStage` ile senkron.
- **Stepper ilk açılıştan itibaren görünür** (Giriş aktif; İnceleme/Kur, bölüm yüklenene dek soluk-kilitli + "Önce bir bölüm yükle" ipucu) → kullanıcı akışın neresinde olduğunu baştan görür.
- **"Analizi Başlat" boşken pasif görünür** (outline + soluk); eskiden disabled olmasına rağmen yanıltıcı şekilde parlak/aktif duruyordu.
- **favicon eklendi** (`brain/public/favicon.svg`, amber damla) → console `favicon.ico 404` hatası giderildi.
### Düzeltildi
- **Analiz ekranı son aşama metni güncellendi:** "Görsel-AI kalite denetimi · anatomi/halüsinasyon taraması" → **"Görsel-AI sahne analizi · enerji · rol · ritim (kurgu sinyali)"** (v1.6.0'da VLM hata denetiminden kurgu sinyaline çevrilmişti; ekran metni eski kalmıştı — yanlış bilgi).
### İnceleme / yol haritası
- Kapsamlı UI derin incelemesi yapıldı: kod tabanı (23 dosya) + 4 ekran gerçek render (Playwright) + Blueprint §13 gap + profesyonel NLE/UX web araştırması (Premiere/DaVinci/FCP/Frame.io/Linear/Material/WCAG). Sonuç: **`docs/UI_GELISTIRME_FIKIRLERI.md`** — 50+ kaynaklı madde, P0–P3 öncelikli. Bu sürüm P0 paketinin ilk kısmını uyguladı; prod build temiz.

## [1.7.0] — 2026-06-29 — ❄️ Faz 2 DONDURULDU (config.toml kanonik + 20 bölüm doğrulaması)
### Dondurma (Faz 2 → "donmuş algoritma")
- **`config/config.toml` kanonik kaynak oldu:** tüm kalibre değerler (karar eşikleri, geçiş/black süreleri, kırpma/handle, derin-analiz sinyalleri, §9.5 rafineleri) tek dosyada, Faz 2 damgalı. `decide.py` + `build_manifest.py` artık `Config.from_toml(CONFIG_PATH)` ile bunu okur; dosya/alan yoksa kod varsayılanına **güvenle** düşer (davranış asla bozulmaz).
- **Davranış %100 korundu (kanıt):** config.toml değerleri kod varsayılanıyla birebir; Bölüm 2 manifesti yeniden üretildi → 160 klipte **0 fark**, `config_hash` aynı (`f7d42833`), **CUT 117 / FADE 40 / BLACK 2**.
### Doğrulama (20 bölüm / 3200 sahne — `örnek_image_prompts/`)
- **Prompt-omurgası 20 bölümde doğrulandı:** her bölüm **tam 160 sahne**; 48 karakter kodu (`<harf><in/out/slp>`) **0 yanlış eşleşme**; ölçek tespiti "other" yalnız %1.75.
- **`sim_block_thresh=0.18` evrensel:** 20-bölüm ardışık-Jaccard medyanı **0.22**, P25 0.158 → eşik medyanın hemen altında (ham aday %33, ritim filtresinden sonra ~%25 fade). Bölüm 2'ye özel şans değil → DEVAM §9'daki *"yalnız Bölüm 2'de kalibre"* riski büyük ölçüde **kapandı**.
- **Tek genel algoritma yeterli** (Blueprint §6 🔧 yanıtlandı): rejim histerezisi A/B/C tipinden bağımsız adaptif; tip-özel eşik gerekmedi.
### Açık / not
- Video-analizi + görsel-AI (VLM) sinyalleri hâlâ yalnız Bölüm 2'de kalibre (prompt-omurga 20 bölümde). Gerçek farklı bir bölüm gelince izlenecek.
- Renk tespiti (`COLD_RE`/`WARM_RE`) dar (%30 renk-unknown, dış/fırtına bölümlerde); state çoğunlukla koddan geldiği için etkisi sınırlı — gelecekte genişletilebilir.
- Gece/uyku tempo (interior ile benzer ~5.2s) **kullanıcı kararıyla değiştirilmedi** (mevcut onaylı denge donduruldu).

## [1.6.0] — 2026-06-29 — Görsel-AI kurguya bağlandı (süre + geçiş + ritim)
### Eklendi
- **VLM artık sadece QC değil, KURGU sinyali:** her sahne için `energy` (1-5) · `role` (kuruluş/manzara/detay/karakter/aksiyon/geçiş) · `linger` → `trim.py` süreyi (sakin/manzara/linger uzun, aksiyon/detay kısa), `decide.py` geçişi (manzara+linger → "nefes" fade, büyük enerji sıçraması → fade) içeriğe göre ayarlıyor. Inspector "Sahne analizi · görsel-AI" gösterir.
- Birleşik VLM çağrısı: tek istekte hem QC hem kurgu sinyalleri (ek süre yok).
### Kalibrasyon / onay
- Kullanıcı onayladı: **CUT 120 · FADE 37 · BLACK 2** (~%75/%23/%1) — cozy hedefiyle birebir ("çoğunluk cut + cömert fade + black yalnız gerçek eşikte"). Her karar açıklanabilir.
- Cozy içerik tek-düze sakin olduğundan VLM etkisi ince (doğru); "Daha sakin" stili fade'i %40'a çıkarabilir (lever kullanıcıda).
- **Test pratiği:** iterasyon testleri 20-30 klip; tam 160 yalnız gerçek/final kurguda.
### Kaldırıldı / netleşti
- **Görsel-AI ile HATA denetimi kaldırıldı** (`vlm_qc.py` → `vlm_scene.py`): 7B, anime/silüet stilinde ince hataları güvenilir yakalayamıyor (kullanıcı geri bildirimi); elle Premiere'de denetlenecek. VLM artık **yalnız kurgu sinyali** (energy/role/linger) üretir; `build_manifest` VLM'i qc'ye katmaz. **Teknik hata kontrolü DURUYOR:** crop (`detect_crop.py`) + heuristik QC (`analyze_video.py`: donma/siyah/decode/flicker).

## [1.5.0] — 2026-06-29 — Yerel Görsel-AI denetimi (anlamsal hata / halüsinasyon)
### Eklendi
- **`sidecar/vlm_qc.py` — yerel görsel-AI QC (Ollama + Qwen2.5-VL 7B):** her klipten zaman boyunca **4 kare** → tek istekte modele; **fazla/eksik el-parmak-uzuv, eriyen yüz, imkânsız anatomi, morphing, hayalet özne, kareler arası tutarsızlık** tespiti. Strict JSON rapor (`format=json`, temperature=0). **Tamamen yerel/offline** (model bir kez `ollama pull` ile iner). Çıktı `_manifest/vlm_qc.json`.
- **Birleşik QC:** `build_manifest._merge_qc` heuristik QC (donma/siyah/decode…) + görsel-AI (anatomi/halüsinasyon) bulgularını `clip.qc`'de birleştirir → tek risk skoru. UI'daki risk rozeti/süzgeç/Inspector otomatik gösterir.
- **Mimari kararlar:** (1) **kare-tabanlı** denetim (video değil) — hatalar tek karelerde, zaman montajı tutarsızlığı da gösterir; (2) en iyi yerel çözüm **Ollama + Qwen2.5-VL** (Apple Silicon Metal); (3) model **gömülmez, ilk kullanımda indirilir** (uygulama küçük kalır, sonra offline).
- Kurulum: `brew install ollama` → `brew services start ollama` → `ollama pull qwen2.5vl:3b` (~3GB, tek sefer).
- **Paralel + varsayılan 4 kare:** `OLLAMA_NUM_PARALLEL=4` + 3 eşzamanlı istek → **160 klip ~5 dk** (warm, M3 Max). Tüm klipler her zaman taranır (sadece riskli değil).
- **Model + kalibrasyon (kritik):** 3B algıda zayıf (Türkçe halüsinasyon) → **7B**. Ham prompt silüetlerde yanlış "fazla parmak" uydurdu (20/30 yanlış pozitif) → **İngilizce + muhafazakâr + silüet-bilir prompt** (yalnız NET görünen + bariz hata), etiketler Türkçe'ye çevrilir. Doğrulama: 10 el yakın-çekiminde 0 yanlış pozitif + doğru betimleme + gözle teyit. Kurulum: `ollama pull qwen2.5vl:7b` (~6GB).
- Analiz ekranına "Görsel-AI kalite denetimi" aşaması eklendi.

## [1.4.0] — 2026-06-29 — Sayfa geçişi + Kalite Kontrol ("yerel AI QC")
### Eklendi
- **Sayfa geçişi:** üst barda tıklanabilir **adım çubuğu** (Giriş / İnceleme / Kur) + logo → başa dön. Ekranlar arası serbest gezinme.
- **Kalite Kontrol motoru (`analyze_video.py` genişletildi) — model yok, tamamen yerel:** her klibin her karesinden **donma, siyah/boş kare, bozulma (decode hatası), titreme/flicker, aşırı poz, olası tekrar, eksik kare** tespiti → risk skoru (0–100) + seviye (ok/low/med/high) + sorun listesi. Manifeste `clip.qc`.
- **UI'da QC:** film şeritte **risk rozeti** (kırmızı/amber, sorunları listeler), alt barda **"Riskli N"** süzgeci (riskli'leri göster) ya da **"✓ Tümü temiz"**, Inspector'da **Kalite kontrol** bölümü; sorunluyu "Klibi çıkar" ile atla (build'e girmez).
- **Doğrulama:** Bölüm 2 (temiz) → 0 risk. Sahte bozuk kliplerde kanıtlandı: freeze→donma, siyah→karanlık+donma, truncated→decode hatası (hepsi yakalandı).
### Not / sıradaki
- Anlamsal hatalar (morphing/bozuk anatomi) heuristikle yakalanmaz → opsiyonel **yerel görsel-AI (Ollama VLM)** sadece riskli kliplere "ikinci görüş" olarak eklenebilir (kullanıcı onayı bekliyor; offline, tek seferlik indirme).

## [1.3.0] — 2026-06-29 — İnceleme deneyimi + Derin video analizi ("yerel AI")
### Eklendi
- **Yeni İnceleme düzeni:** üstte **büyük önizleme** (gerçek video), altta zaman çizelgesi + film şeridi. Film şeritte bir klibe gelince önizleme **anında o videoyu oynatır** (Vite `/@fs` ile gerçek dosyalar; trim'li bölgede döngü). Kartlar büyüdü, hover/seçim çok daha belirgin (ölçek + amber halka + glow + alt çubuk).
- **Tüm kurgu önizleme:** "Tüm kurguyu oynat" — klipleri sırayla oynatır, geçişlerde dip; altta **zaman çizelgesi** rejim bantları + cut/fade/black işaretleri + akan playhead + tıkla-git.
- **Canlı kurgu stili:** Yönetmen'de "Daha sakin" → fade sayısı ~2× + süreler uzun (canlı, manifest tabanından, elle değişeni korur); "Daha tempolu" → az/kısa fade; "Sinematik" → biraz uzun. Doğrulandı: 34 → 65 fade.
- **DERİN VİDEO ANALİZİ (`sidecar/analyze_video.py`) — "yerel AI":** her videonun HER karesini ffmpeg `signalstats` ile inceler (parlaklık, renk, doygunluk, hareket) + ilk/son kare imzası. 160 klip × her kare. Çıktı `_manifest/video_analysis.json`.
- **Karar motoru zenginleşti (`decide.py`/`trim.py`):** (a) **sarsıcı-cut yumuşatma** — sınır görsel sıçraması yüksekse cut → kısa fade (Bölüm 2'de 5 sahne: 22/63/85/91/94); (b) **hareket→süre** — hareketli klip kısa, sakin klip uzun (motion 9.8→3.6s, 0.35→5.1s); (c) fade süresi prompt-farkı + görsel sıçramanın büyüğüyle ölçeklenir. Sinyaller manifeste + Inspector'a yazıldı ("Derin analiz · her kare").
- Hakkında/Ayarlar diyaloğu; sürüm UI'da tek kaynaktan (`APP_VERSION`).
### Not
- Tauri paketleme (Faz 4) hâlâ sırada; UI şu an tarayıcıda (offline), gerçek video `/@fs` ile, ileride Tauri asset protokolü.

## [1.1.x] — 2026-06-28→29 — Faz 0/1 omurga + Faz 2 başlangıcı (tarihçe)
### Eklendi
- Geliştirme araçları kuruldu: Node v26.4.0, npm 11.17, Rust/cargo 1.96, ffmpeg/ffprobe 8.1 (Homebrew).
- Gerçek footage doğrulandı: H.264 1920×1080 24fps 8s + AAC 48kHz **stereo** (channels=2).
- **Faz 0 UXP de-risk paneli** (`panel/`): import → createSequenceFromMedia → overwrite + in/out kırpma → Cross Dissolve + Dip to Black; resmî `@adobe/premierepro` tipleriyle doğrulandı, sözdizimi geçti.
- 3 demo klibi hazırlandı (`demo/clips/`).
- **Faz 0 GEÇTİ (canlı, Premiere 26.x):** native stereo (A1 tek katman) + 3 klip sıralı (18s) + 2 düzenlenebilir geçiş — Cross Dissolve=`AE.ADBE Cross Dissolve New`, Dip to Black=`AE.ADBE Dip To Black`; render yok.
- **Faz 1 başladı — `sidecar/parser.py`:** image prompt → sahne sahne (scale/subjects/state/regime/color/establishing/tokens), deterministik/AI'sız. Bölüm 2 (`REF/`) gerçek belgesinde **160/160 sahne** doğrulandı.
- **`sidecar/match.py`:** prompt↔video eşleştirme + varyant + ffprobe sağlık. Bölüm 2: **160↔160**, %98 ölçek çapraz-uyum, ACTION/ENV etiketleri, **sahne 115 = 720p** (dosya adı "1080p" diyordu) yakalandı.
- **`sidecar/decide.py` (karar motoru):** durum makinesi + histerezis + öncelikli kurallar (§7) → cut/fade/black + süre + gerekçe. Bölüm 2: **123 cut / 34 fade / 2 black**; histerezis flip-flop'u tek eşiğe indirdi (38 dış→iç, 149 →uyku). Eşik/süre kalibrasyonu Faz 2.
- **`sidecar/trim.py` (§8):** in/out + **handle ≥ T/2 garanti** + rejim/ölçek tempo modülasyonu (asla tam 1.0s).
- **`sidecar/build_manifest.py` (§10):** tam pipeline → `_manifest/<bölüm>_manifest.json` (şema 1.0, decision şeffaflığı) + handle/in-out doğrulaması. **Bölüm 2: 160 klip, ~16.1 dk, 0 hata/0 uyarı.**
- **UXP panel — tam bölüm kurar (`panel/`):** Manifest seç → import → kare-hizalı kırpma → `createSequenceFromMedia(tümü)` → **boşluk kapatma** (her track item `getDuration` + `createMoveAction` ile uç-uca; **video+ses AYRI**) → geçişler → intro/outro → crop scale.
- **Faz 1 GEÇTİ ✅ (canlı):** Bölüm 2 (160 klip) panelden uçtan uca kuruldu — **boşluksuz** (video+ses), 36 geçiş + intro/outro, native stereo, render yok.
- **Faz 2 başladı (kalibrasyon):**
  - **Süre çeşitliliği:** kırpma genişletildi (`decide.py`/`trim.py`) → klipler 3.3–7.0s, ritimli (manzara uzun, aksiyon kısa).
  - **Crop siyah bar:** ffmpeg `cropdetect` ile üst/alt bar tespiti → manifeste per-klip `scale` → panel Motion>Scale uygular (`setClipScale`). Asimetri: max(üst,alt).
  - **Fade ortalama garantisi (single-sided/"siyahtan başlama" düzeltildi):** merkezli cross-dissolve kesimin iki yanında ≥T/2 handle ister; pay yetmeyince Premiere tek-taraflı yapıp klip↔siyah geçiş çiziyordu. Çözüm: (1) `trim.py` her klibi her yandan **≥1.042s** kırpar (garanti handle, küsüratlı, asla tam 1.000s) + fade kenarında T/2+0.5s bol pay; (2) `decide.py` tüm fade/black süreleri **kare-hizalı**; (3) `build_manifest.py` her fade **2·min(handle)−2 kare**'ye kısıtlanır (sığmazsa cut'a iner); (4) `panel/main.js` `setForceSingleSided(false)` + apply'da süre tekrar kareye hizalanır. Sonuç: tüm fade'lerde pay marjı **≥11 kare**, klip süresi ~3.0–5.9s, bölüm ~13.5 dk.
  - **ASIL KÖK NEDEN — alt-kare "mikro boşluk" (kullanıcı buldu) ✅ canlı onaylandı:** Handle yeterliydi ama fade elle bile ortalanmıyordu; kullanıcı klipleri elle yapıştırınca (kareye snap) anında ortalandı. Sebep: boşluk kapatma klipleri **saniye** ile taşıyordu → kareye birebir oturmuyor, görünmez kare-altı boşluk kalıyordu (Premiere mikro boşlukta iki-taraflı geçiş koyamaz). **Çözüm:** `closeGapsOnTrack` artık **tam sayı TICK** ile taşıyor (`createWithTicks`), süreyi tam kareye sabitliyor; `measureGaps` tick hassasiyetinde (1 tick'i bile görür). Mikro boşluk imkânsız → fade default'ta ortalanıyor (alignment değeri gerekmedi).

## [1.2.0] — 2026-06-29 — Faz 3: Premium UI başladı
### Eklendi
- **`brain/` — AutoReji masaüstü arayüzü (web UI, Tauri'ye hazır):** Vite 8 + React 19 + TypeScript 6 + **Tailwind v4** + Framer Motion + Radix UI + lucide + zustand. Tamamen **offline** (Inter fontu gömülü). Prod build geçiyor (419 modül, ~156KB gzip JS).
- **Tasarım sistemi (§13.7):** koyu "cozy yağmur" teması, amber-altın imza vurgusu, rejim renkleri (dış mavi / iç amber / uyku indigo), cam yüzeyler, yumuşak gölgeler, hareket token'ları — `src/index.css` `@theme`.
- **Ekranlar:** Intake (3 sürükle-bırak + anında doğrulama paneli, gerçek Bölüm 2 verisi) · Analiz (dairesel ilerleme + 5 aşama + sakin yağmur canvas) · **İnceleme çalışma alanı** (mini-harita + gerçek 160 thumbnail film şeridi + inspector) · Build (özet + kuruluş + manifest/arşiv yolu).
- **İnceleme (kalp):** rejim bantlı mini-harita; düzenlenebilir geçiş baloncukları; trim editörü (in/out + görsel tutamak); karar şeffaflığı (gerekçe + güven + sinyaller); varyant; crop/flag rozetleri.
- **Etkileşim:** klavye sürüşü (←/→ · C/F/B · Delete · ⌘Z), undo/redo, elle-değişen "diff" işareti, sıfırla, odak inceleme, in-app geçiş önizleme (thumbnail simülasyon).
- **3 mod** (Hızlı/Kontrollü/Yönetmen); Yönetmen Stüdyosu (rafine slider'ları + alt stiller + profil).
- Gerçek veri: `public/episode.json` (Bölüm 2 manifesti) + 160 gerçek `public/thumbs/*.jpg` (ffmpeg).
### Sıradaki
- Crop ince ayar (asimetrik over-zoom için Position-recenter seçeneği), eşik/süre kalibrasyonu → dondur.
- `scripts/setup` tek-komut kurulum.

## [1.1.0] — 2026-06-28
### Eklendi
- Proje iskeleti: `CLAUDE.md` (rol + kurallar), `PLAN.md` (faz checklist), `DEVAM.md` (devir belgesi), `CHANGELOG.md`, `README.md`, `VERSION`.
- `.gitignore`.
- Blueprint `docs/Blueprint.md`'ye kopyalandı.
- Ortam taraması yapıldı (macOS 26.5.1 arm64; python3/pip/git/brew mevcut; Node/Rust/ffmpeg kurulacak).
