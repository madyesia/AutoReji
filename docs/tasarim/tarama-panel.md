# MONTAJCI Panel (UXP) — UI/UX Denetimi

**Tarih:** 2026-07-02 · **Kapsam:** `panel/index.html` (995 satır) · `panel/main.js` (610) · `panel/ui.js` (865) · `panel/manifest.json`
**Karşılaştırma tabanı:** beyin uygulaması tasarım sistemi `brain/src/index.css` (token'lar) + ekran metinleri.
**Not:** Bu bir TARAMA raporudur — hiçbir kaynak dosya değiştirilmedi.

---

## 0) Genel değerlendirme (özet)

Panel şaşırtıcı derecede özenli: sekmeli sihirbaz akışı, kilit mantığı, JS ile sürülen animasyonlar,
erişilebilirlik köprüsü (Enter/Space) ve UXP tuzaklarına karşı belgelenmiş savunmalar var.
**Ama iki ciddi boşluk var:**

1. **Sessiz hata yolları** — bazı hatalar yalnızca gizli "Ham günlük"e yazılıyor; kullanıcı butona basıyor, **hiçbir şey olmuyor** (aşağıda §4).
2. **"Bölümü Kur" çift tıklama koruması yok** — kurulum sürerken tekrar basılırsa **ikinci bir kurulum iç içe başlar** (§3).

Marka olarak panel beyin uygulamasına "yakın ama aynı değil": altın (#eab866) birebir tutuyor,
fakat zemin/metin/durum renklerinin çoğu hafif farklı ve geçiş çipleri **yanlış renk ailesini** kullanıyor (§1).

---

## 1) Marka tutarlılığı — beyin ↔ panel

### 1.1 Renk token karşılaştırması

Panel token'ları: `panel/index.html:29-57` · Beyin token'ları: `brain/src/index.css:8-72`.

| Kavram | Panel | Beyin | Durum |
|---|---|---|---|
| En koyu zemin | `--ink-0` **#07090d** (index.html:31) | `--color-ink-950` #07090d | ✅ birebir |
| **Gövde zemini** | `--ink-1` **#0c0f16** (index.html:32, body: :65) | `--color-ink-900` **#0b0e14** (kanonik marka zemini) | ⚠️ farklı |
| Yüzey | `--ink-2` **#141a27** (index.html:33) | `--color-ink-800` #141a27 | ✅ birebir |
| Yükseltilmiş yüzey | `--ink-3` **#1b2433** (index.html:34) | `--color-ink-750` **#1a2132** | ⚠️ farklı |
| Ana metin | `--txt` **#e8ecf4** (index.html:39) | `--color-fg` **#eaeefb** | ⚠️ farklı |
| Soluk metin | `--txt-dim` **#8b93a7** (index.html:40) | `--color-fg-muted` **#97a3bd** (AA için bilinçli ayarlı, index.css:23) | ⚠️ farklı + daha koyu |
| **Altın (birincil)** | `--gold` **#eab866** (index.html:42) | `--color-amber-400` #eab866 | ✅ birebir |
| Koyu altın | `--gold-deep` **#caa05a** (index.html:43) | `--color-amber-500` **#dc9f4a** | ⚠️ farklı |
| Başarı | `--ok` **#7ddc8f** (index.html:52) | `--color-ok` **#66d39a** | ⚠️ farklı |
| Hata | `--err` **#ff8f8f** (index.html:54) | `--color-danger` **#ec7e6e** | ⚠️ farklı |
| Uyarı | `--warn` **#ffd9a0** (index.html:56) | `--color-warn` **#ecc16b** | ⚠️ farklı |
| Rejim: dış/iç/uyku | #6ba8d6 / #e6ad68 / #8a86d6 (index.html:48-50) | #6ba8d6 / #e6ad68 / #8a86d6 (index.css:34-39) | ✅ birebir |
| Amber glow | rgba(…,0.34) (index.html:45) | 0.35 (index.css:69) | ✅ ihmal edilebilir |

### 1.2 Geçiş çipi renkleri — **anlam kayması** (en belirgin marka hatası)

Beyin, geçiş tipleri için ÖZEL renkler tanımlamış (`index.css:42-44`):
`cut` = nötr gri **#828ea6** · `fade` = turkuaz **#58c4bd** · `dip/black` = çivit **#8b86dd**.

Panel ise rapor çiplerinde **rejim renklerini geri dönüştürüyor** (`index.html:456-459`):
`c-cut` → `--ext` (yağmur mavisi) · `c-fade` → `--int` (amber) · `c-black` → `--sleep`.
Yani beyin ekranında turkuaz olan "fade", panelde amber görünüyor. **Aynı kavram, iki üründe iki farklı renk** — ortak dili bozuyor. Çözüm basit: panele `--cut/--fade/--dip` token'larını beyindeki hex'lerle ekle.

### 1.3 Tipografi

- Panel: `"SF Pro Text", Helvetica, Arial` (index.html:64) · Beyin: **Inter Variable** (index.css:53).
  Kısmen mazur: UXP'de generic font aileleri kırılıyor (index.html:24 yorumu) ve Inter sistemde kurulu değil.
  Yine de "aynı ürün" hissi için Inter'i `@font-face` ile gömmeyi denemeye değer (çalışmazsa SF Pro kalır — görsel fark küçük).
- Harf aralığı ters yönde: beyin **negatif** tracking kullanır (-0.011em, index.css:124), panel her yerde **pozitif** (0.2–0.4px, örn. index.html:106,162).
- Punto: panelde çok sayıda **10px** hatta **9px** metin var (`.step-badge` 9px, index.html:624; substep/rozet/çip 10px). Beyinde alt sınır ~11px. Soluk renk (#8b93a7) + 10px birleşince okunabilirlik sınırda.
- Mono: SF Mono/Menlo — beyinle uyumlu ✅.

### 1.4 Diğer görsel farklar

- Kart yarıçapı: panel 12px (index.html:85), beyin `--radius-lg` 14.4px — küçük fark, sorun değil.
- `main.js` log renkleri **hardcoded hex** (#7ddc8f, #ff8f8f, #cfd6e6, #ffd9a0 → main.js:47-53; #5a6880 → main.js:550). #cfd6e6 hiçbir token setinde yok. `var()`'a bağlanmalı ki tema tek yerden yönetilsin.
- Sürüm çipi "beta v1.0" (index.html:893) = beyin `APP_VERSION` (utils.ts:7) ✅ tutarlı.
- **Ama** `panel/manifest.json:4` sürümü hâlâ **"0.1.0"** — Creative Cloud eklenti listesinde bu görünür. Ürün 1.0.x iken plugin 0.1.0 tutarsız. (⚠️ `id: "com.autoreji.derisk"` de Faz-0 kalıntısı; DEĞİŞTİRİRKEN DİKKAT — CC kurulum klasörü `<id>_<sürüm>` olduğundan beyindeki MONTAJCI tespiti (SetupScreen) buna bağlı.)

---

## 2) Akış ve durum haritası

### 2.1 Mevcut akış (üç sekme, kilitli sihirbaz)

```
Yükle ──(doğrulama ✓)──▶ Kur ──("Bölümü Kur", 11 adım)──▶ Rapor
  ▲  kilit: Kur+Rapor manifest yüklenene dek kapalı (ui.js:607-609)   │
  └────────────── "Yeni bölüm kur" = tam sıfırla (ui.js:764-770) ◀────┘
```

1. **Açılış:** her zaman Yükle sekmesine zorlanır (ui.js:849-851, doğru karar), varsa "Son kurulum: … · N klip · tarih" rozeti (ui.js:577-595).
2. **Yükle:** "Manifest Dosyası Seç" (dosya seçici) VEYA yapıştır + "Doğrula" / "Panodan Yapıştır". Başarı → yeşil özet kartı (ad, klip sayısı count-up, fps/süre çipleri) → 600ms sonra **otomatik Kur sekmesi** (ui.js:722-753).
3. **Kur:** rapor çipleri alanı + 11 adımlık dikey pipeline (omurga çizgisi + nokta + spinner/tik/çarpı) + "Bölümü Kur" / "Geçişleri listele" / "Temizle" + durum çubuğu ve geçen süre.
4. **Kurulum:** buton "Kuruluyor… (k/11)" (ui.js:319), footer'da altın ilerleme çizgisi (adım başına dolar), aktif adımda 12-segment spinner + substep satırı, süre sayacı 250ms'de bir.
5. **Başarı:** `done` → Rapor sekmesine otomatik geçiş + recap kartı ("✓ BİTTİ — RENDER YOK" + satır satır özet) + toast (ui.js:821-829).
6. **Hata:** adım kartı kırmızı, hata satırı + "Yeniden dene (tam sıfırla)" butonu, **Kur sekmesinde kalır** (doğru karar, ui.js:831-836).

### 2.2 Var olan durumlar (iyi kapsanmış)

| Durum | Nerede |
|---|---|
| Dosya seçici iptali | toast "Dosya seçilmedi…" (main.js:326) ✅ |
| Okunamayan dosya / bozuk JSON | kırmızı kutu + toast (main.js:317-321, ui.js:708-720) ✅ |
| Geçersiz manifest (clips yok, in/out bozuk) | kırmızı kutu, ilk hata (main.js:154-165) ✅ |
| Kilitli sekmeye tıklama | 1 kez toast "Önce manifest yükle" (ui.js:650-654) — sonrakiler sessiz ⚠️ |
| Non-fatal adım (Intro/Outro, Crop) | atlanır, "—" rozeti, kurulum sürer (main.js:481-541) ✅ |
| Rapor boş durumu | "Henüz kurulum yapılmadı…" (index.html:980) ✅ |
| Hareket azaltma tercihi | tüm animasyonlar atlanır (ui.js:42-45) ✅ |

### 2.3 EKSİK durumlar

| # | Eksik | Etki |
|---|---|---|
| E1 | **Proje açık değilken "Bölümü Kur"** → `err()` yalnız gizli günlüğe yazar (main.js:82), UI sıfırlanır ve… hiçbir şey. Kullanıcı için "buton bozuk". | KRİTİK |
| E2 | **Kurulum sırasında ikinci tık** → `runBuild` yeniden girer, iç içe iki pipeline (main.js:354'te koruma yok; ui.js `building` bayrağı yalnız retry butonunu koruyor :304). | KRİTİK |
| E3 | **İptal yok** — 160 klipte dakikalar süren kurulumu durdurmanın hiçbir yolu yok. | Yüksek |
| E4 | **Kur sekmesi kurulum ÖNCESİ boş** — manifest yüklendi ama Kur'da ne bölüm adı ne klip sayısı görünür (başlıktaki ad ancak kurulum BAŞLAYINCA dolar, ui.js:392-399). Kullanıcı neyi kuracağını göremeden butona basıyor. | Orta |
| E5 | **Tekrar kurulum çakışması** — hata sonrası "Yeniden dene" baştan import + `createSequenceFromMedia` çalıştırır → projede **aynı adla ikinci sequence** oluşur; uyarı yok. | Orta |
| E6 | **Kısmi başarı özeti yok** — hata anında "6/11 adım tamamlandı, timeline'da klipler dizili ama geçişler eksik" gibi durum tarifi verilmiyor. | Orta |
| E7 | Pano boş / pano erişimi reddedildi → yalnız gizli günlük (main.js:580,584). "Panodan Yapıştır"a basan kullanıcı hiçbir şey görmez. | Orta |
| E8 | "Geçişleri listele" çıktısı yalnız gizli günlüğe akar (main.js:86-91) → görünürde ölü buton. (Zaten geliştirici aracı — birincil UI'da olmamalı.) | Düşük |

---

## 3) ~160 klipte ilerleme geri bildirimi

**Kullanıcının gördüğü:** buton "Kuruluyor… (k/11)" + footer çizgisi (yalnız **adım** bitince dolar, 11 adım ≈ %9'luk sıçramalar, ui.js:781-789) + aktif adımda spinner + substep metni + geçen süre.

Sorunlar:

1. **Klip bazlı ilerleme yok.** En uzun aşamalar (1-Import: tek `importFiles` çağrısı main.js:378-380; 2.5-Medya bekleme; 7-Geçişler) sırasında çizgi kıpırdamaz. 160 klip importunda bar dakikalarca %0'da durabilir. Tek canlı sinyal 2.5'ta: "medya yükleniyor… N bekliyor" (main.js:203) — bu desen diğer adımlara örnek olmalı.
2. **ETA yok.** `localStorage`'da geçen kurulumun verisi zaten duruyor (`lastDoneAt`, `lastRecap` — ui.js:826); "geçen sefer ≈ 2:40 sürdü" demek bedava.
3. **Donma riski (gerçek):** kırpma/boşluk-kapatma/geçiş adımları eylemleri **tek senkron transaction**'da işler (main.js:395-404, 245-255, 471-475). Senkron blok JS iş parçacığını kilitler → spinner ve süre sayacı (ikisi de `setInterval`) o an **donar**. 160 eylemli transaction'da bu görünür takılma yapar; kullanıcı "kasıldı mı?" hisseder. (Async kısımlar — import, medya bekleme, okuma döngüleri — canlı kalır.)
4. İyi taraf: spinner + nabız + substep + buton sayacı + durum çubuğu + süre sayacı kombinasyonu, adım aralarında "yaşıyor" hissini başarıyla veriyor.

---

## 4) Hata yüzeyleri

Dört katman var: (a) satır-içi kırmızı kutu (Yükle), (b) adım kartı kırmızı + retry (Kur), (c) toast, (d) gizli "Ham günlük".

- **Mimari kusur:** `main.js` içindeki `err()/warn()/info()` çıktıları `PANEL.emit("log")` yayar ama **ui.js "log" olayına hiç abone değil** (subscribe: ui.js:793-838'de `log` yok). Yani `runStep` dışındaki her hata yalnız, varsayılan **gizli** `#log`'a düşer. §2.3 E1/E7/E8'in kökü bu.
- Adım hataları iyi: kırmızı kart + mesaj + retry + toast "Durdu: <adım> — detaya bak" + durum çubuğu. ✅
- Yükle hataları iyi: kutu + textarea kenarı kırmızı + toast. ✅
- **Mesaj dili sorunlu (teknik bilmeyen kullanıcı için):**
  - "Yapıştırılan metin boş — manifest JSON'unu **textarea**'ya yapıştır." (main.js:113) → "aşağıdaki kutuya yapıştır".
  - "Dosya sistemi erişilemiyor (**UXP storage** yok)…" (main.js:119) → jargon.
  - "Manifest bir **JSON nesnesi** değil." / "'clips' **dizisi** yok." (main.js:155-156) → "Bu dosya AutoReji manifesti değil" gibi tercüme edilmeli.
  - "Klip #12: geçersiz **in/out** (5.2 → 3.1)." (main.js:162) → beyin diliyle "Sahne 12" + "başlangıç/bitiş".
  - "Açık proje yok. **File > New > Project.**" (main.js:82) → tek doğru İngilizce (Premiere menüsü İngilizce) ama görünmüyor (E1).
- Retry etiketi "Yeniden dene (tam sıfırla)" (ui.js:302) dürüst ve doğru. ✅

---

## 5) Metin (copy) envanteri ve dil tutarlılığı

Beyin uygulaması dili: **bölüm** kur / **sahne** N (Inspector.tsx:47, Filmstrip.tsx:88) / klip / geçiş etiketleri **Cut·Fade·Black** (Inspector.tsx:160) / "MONTAJCI".

| Metin (panel) | Yer | Değerlendirme |
|---|---|---|
| "Yükle · Kur · Rapor" sekmeleri | index.html:902-904 | ✅ beyin BuildScreen talimatıyla birebir (BuildScreen.tsx:192) |
| "**Brain**'in ürettiği manifest.json'u seç…" | index.html:914 | ❌ "Brain" iç kod adı — kullanıcı bunu bilmez → "AutoReji'nin ürettiği" |
| "Manifest Dosyası Seç" / "Doğrula" / "Panodan Yapıştır" | index.html:917-924 | ✅ net, beyin talimatıyla uyumlu |
| "manifest.json içeriğini buraya yapıştır (Cmd+V)" | index.html:920 | ✅ |
| "Kur sekmesine geçiliyor…" | index.html:936 | ✅ |
| "▶ Bölümü Kur" / "Temizle / Yeniden" | index.html:960,962 | ✅ "bölüm/kur" dili doğru |
| "Geçişleri listele" | index.html:961 | ⚠️ geliştirici aracı; kullanıcıya anlamsız + çıktısı görünmez (E8) |
| "▸ Ham günlük (geliştirici)" | index.html:953 | ✅ doğru etiketlenmiş |
| Adım adları: "1) **Import**" · "4) **Sequence** + ham dizim" · "8) **Intro/Outro fade**" · "8.5) **Crop** (siyah bar)" | ui.js:16-26 | ⚠️ yarı İngilizce. Öneri: "İçe aktarma", "Sekans oluştur", "Giriş/çıkış karartması", "Büyütme (siyah bar)" |
| "2.5)" / "8.5)" ara numaralar | ui.js:18,25 | ⚠️ iç mutfak numarası; kullanıcıya 1-11 düz sayı daha temiz |
| Çipler: "Cut: N · Fade: N · Black: N" | ui.js:353-357 | ✅ beyin Inspector'la aynı etiketler — yalnız RENKLER farklı (§1.2) |
| "Boşluk: 0 ✓" / "Boşluk: N (Nt)" | ui.js:364-367 | ⚠️ "(586t)" tick kısaltması jargon |
| "Boşluk: 0 **tick** (tam kare hizası)" | ui.js:488 | ⚠️ "tick" → "kare-tam hizalı" yeter |
| "MİKRO BOŞLUK: … 🎉" substep'leri | main.js:437-439,547 | ⚠️ log dili UI'a sızıyor (substep'te "#1 start=0.00 end=5.20 len=5.20" bile görünebilir, main.js:433) |
| "✓ BİTTİ — RENDER YOK" + "Native stereo · düzenlenebilir klip + geçiş" | index.html:976-977 | ✅ ürünün ana vaadi, marka diliyle birebir |
| "Bitti — N klip kuruldu, boşluk 0" | ui.js:825 | ✅ |
| "Önce manifest yükle (Yükle sekmesi)." | ui.js:652, main.js:355 | ✅ tutarlı, iki yerde aynı |
| "Son kurulum: <ad> · N klip · tarih" | ui.js:592 | ✅ güzel dokunuş |
| "Klip #N: …" doğrulama hataları | main.js:161-162 | ⚠️ beyin "**Sahne** N" der — ürünler arası aynı kelime kullanılmalı |
| "Hazır" / "Kuruluyor: …" / "Durdu: …" durum çubuğu | ui.js:261,311,570 | ✅ |

Genel: noktalama tutarsız (kimi mesaj noktalı kimi değil), büyük harf BAĞIRMA az ve yerinde (BİTTİ), emoji (🎉) yalnız log'da — kabul.

---

## 6) UXP web-view kısıtları (koddan çıkan envanter)

Panel bu kısıtları zaten **belgeleyip savunmuş** — bu bilgi başka geliştirme yapacak herkes için kritik:

- Native `<button>` Premiere host/Spectrum stilini taşır → custom gradient **ezilir**; `appearance:none` da yok → çözüm: `<div role="button" tabindex="0">` (index.html:9-16, 662-670).
- Sessizce kırılan CSS: `transition`, `@keyframes/animation`, `backdrop-filter`, `filter`, `color-mix()`, `display:grid`, `text-shadow`, `box-shadow` (bayraksız no-op), 3+ duraklı gradient, generic font aileleri (index.html:18-26).
- Güvenli alt küme: flexbox, absolute/relative, `var()`, `calc()`, 2 duraklı linear/radial gradient, border-radius, opacity, rgba (index.html:18-20).
- Tüm hareket JS `setTimeout/setInterval` ile; `requestAnimationFrame`'e güvenilmez (ui.js:8-9,38-40). Spinner 12 ayrı div segmenti (ui.js:68-98).
- `box-shadow` yerine `::before/::after` pseudo-glow tekniği (index.html:189-199, 708-717).
- Scroll tuzağı: ara flex konteynerlerde `min-height:0` + `html,body{height:100%}` şart (index.html:26,61-62).
- Dosya seçicide `types:["json"]` bazı build'lerde picker'ı sessiz no-op yapar → `fileTypes.all` + argümansız fallback (main.js:100-142).
- `classList.toggle(x, bool)` iki-argümanlı biçimden kaçınılmış (ui.js:657).
- `prefers-reduced-motion` destekleniyor (ui.js:42-45) — beyinle aynı ilke (index.css:148) ✅.

**Sonuç:** blur'lı cam, gerçek gölge, CSS animasyon beklenmesin; "premium" his ancak gradient + pseudo-glow + JS hareketiyle verilebilir — panel bunu zaten yapıyor.

---

## 7) İyileştirme listesi (öncelikli, küçük → büyük)

### P0 — Kritik, küçük dokunuş (dakikalar)
1. **Sessiz hataları görünür yap:** `ui.js subscribe()`'a `P.on("log")` ekleyip `err/warn` seviyesini toast'a bağla — veya en az üç noktaya doğrudan `PANEL.emit("toast", …)`: proje-yok (main.js:82), pano-boş (main.js:580), pano-erişim (main.js:584). (E1/E7)
2. **`runBuild` yeniden giriş koruması:** başta `if (BUILDING) return;` bayrağı (main.js:354) + `#btn-build`'e görsel kilit. (E2)
3. **"Brain'in ürettiği" → "AutoReji'nin ürettiği"** (index.html:914).
4. `panel/manifest.json:4` sürümünü ürün semver'iyle eşitle (0.1.0 → 1.0.x). `id`'ye DOKUNMA (kurulum yolu + beyin tespiti bozulur).
5. Birincil butonda görünmez odak: `.btn-primary:focus` kenarı #1a140a (koyu, altın üstünde kaybolur — index.html:723) → belirgin odak rengi.

### P1 — Orta (saatler)
6. **Renk token'larını beyinle eşitle:** `--ink-1→#0b0e14`, `--ink-3→#1a2132`, `--txt→#eaeefb`, `--txt-dim→#97a3bd`, `--gold-deep→#dc9f4a`, `--ok→#66d39a`, `--err→#ec7e6e`, `--warn→#ecc16b` (index.html:31-56) + **geçiş çiplerine özel renkler**: cut #828ea6 · fade #58c4bd · black #8b86dd (index.html:456-459). `main.js` hardcoded hex'lerini `var()`'a çek (main.js:47-53,550).
7. **Kur sekmesi ön-özeti:** `manifest-loaded` olayında başlık sağını (bölüm adı + "N klip · fps") ve bir "Kurulacak" çipini hemen doldur (ui.js:722-753'e ekleme). (E4)
8. **Metin cilası:** adım adlarını Türkçeleştir (ui.js:15-27), "Sahne N" dili (main.js:161-162), "tick" jargonu (ui.js:367,488), textarea/JSON-nesnesi mesajları (main.js:113,119,155-156), kilit toast'ını her tıkta göster (ui.js:35,652).
9. **ETA:** `lastRecap`/`lastDoneAt` verisinden "geçen kurulum ≈ M:SS sürdü" rozetini Kur sekmesine ekle.
10. "Geçişleri listele"yi ana butonluktan çıkar → "Ham günlük" bölümüne küçük bağlantı yap (index.html:961). (E8)

### P2 — Büyük (planlı iş)
11. **Klip-bazlı ilerleme + donma azaltma:** büyük transaction'ları 20-30 eylemlik parçalara bölüp aralarına `setTimeout(0)` koy (main.js:395-404,471-475; closeGaps main.js:245-255) → footer çizgisi adım İÇİNDE de aksın, spinner donmasın; substep'e "84/160 klip" sayacı. (§3)
12. **İptal:** adım sınırlarında kontrol edilen bir `CANCELLED` bayrağı + "Durdur" butonu (transaction ortasında değil, adım arasında güvenli durur). (E3)
13. **Tekrar-kurulum farkındalığı:** kurulumdan önce projede aynı adlı sequence var mı bak; varsa "aynı adla ikinci sequence oluşacak — devam?" onayı veya "ad (2)" son eki. (E5)
14. **Kısmi başarı raporu:** `failed` olayında Rapor sekmesine "6/11 adım tamamlandı; timeline'da klipler dizili, geçişler eksik" tarzı dürüst özet. (E6)
15. **Inter denemesi:** UXP `@font-face` ile Inter'i gömmeyi dene; olmuyorsa SF Pro bilinçli istisna olarak belgelenir (§1.3).

---

*Dosya beyin tarafında değil, panelde yaşayan her şeyin envanteridir; kaynak koda dokunulmamıştır. Ana referanslar: `panel/index.html`, `panel/main.js`, `panel/ui.js`, `panel/manifest.json`, `brain/src/index.css`.*
