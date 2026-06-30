# AutoReji → "Madyes Reji" — Yol Haritası & Ürün Vizyonu (PLANLAMA NOTU)

> ⏸️ **DURUM: Strateji/vizyon — HENÜZ UYGULANMADI.** (Kullanıcı kararları 2026-07-01.)
> Amaç: aylar sonra başka bir oturumda açılınca niyetin TAMAMI net anlaşılsın (kısa-kısa değil, gerekçeli).
> Bağlı: oto-güncelleme tekniği `docs/GUNCELLEME_MIMARISI.md` · mevcut ürün spec `docs/Blueprint.md`.

---

## 0. BUGÜN nerede
AutoReji = "Ghibli Mood ON" için **cozy yağmur ASMR'a özel**, **OFFLINE**, yerel macOS `.app` (Tauri 2 + Python sidecar). Yayıncı **Madyes**, sürüm **beta v1.0 (teknik 1.0.1)**. Karar prompt-odaklı; render yok (düzenlenebilir Premiere timeline).

## ⭐ EN ÖNEMLİ AYRIM: BU İKİ AYRI ÜRÜN
Karıştırma — gelecekte iki farklı ürün var, farklı mimari/iş modeli:

| | **Ürün 1: AutoReji (mevcut)** | **Ürün 2: Genel Reji SaaS (gelecek)** |
|---|---|---|
| İçerik | cozy ghibli ASMR (niş) | her tür kurgu (geniş pazar) |
| Çalışma | **tamamen OFFLINE** (hard constraint) | **ONLINE — her açılışta üyelik/login** |
| İş modeli | beta → arkadaş/aynı tarz; belki tek-seferlik niş | **aylık ABONELİK** (kayıt + hesap + paketler) |
| Karar | prompt-odaklı | içerik-odaklı (AI stili kendi belirler) |
| Çıktı | Premiere (render yok) | çok-NLE + gömülü render |

> ⚠️ **Mevcut AutoReji'nin OFFLINE ilkesi DEĞİŞMEZ.** Online/abonelik yalnız **Ürün 2** içindir. Önceki notta "offline-toleranslı lisans" mevcut ürün içindi; **genel SaaS için kullanıcı kararı: tam online abonelik.**

---

## ÜRÜN 2 — "Genel Reji SaaS" (detaylı vizyon)

### 1. İş modeli (kullanıcı kararı)
- **Her açılışta üyelik sistemi + login** (offline yok). Kayıt/signup.
- **Aylık abonelik.** Uygulama içinde **hesap sayfası** (profil, abonelik, fatura, çıkış).
- **Paketler:** **ücretsiz paket çok sınırlı işlev** + **3-4 ücretli paket** (kademeli). (Tier örneği aşağıda.)

### 2. Çekirdek: içerik-odaklı otomatik kurgu
- Kullanıcı **görsel/video klasörünü seçer** → **AI içeriği analiz edip stili kendi belirler**: *dinamik / soft / normal* → detaylı kurgu üretir. (Bugünkü cozy mantık = "soft profil"in örneği.)
- VLM + hareket/renk analizi global stil + klip-bazında tempo/geçiş kararı verir (bugünkü linger/energy çekirdeği bunun temeli).

### 3. Çok dil (20-30 dil)
- **Tüm arayüz + yapı kullanıcının dilinde** (i18n altyapısı: dil-başına çeviri dosyaları; uygulama dili seçilir/otomatik algılanır).
- Mevcut AutoReji Türkçe-sabit → genel ürüne i18n **baştan** tasarlanmalı (sonradan eklemek pahalı).

### 4. Otomatik altyazı + stiller
- **Konuşma→metin** ile otomatik altyazı (öneri: **yerel Whisper / whisper.cpp** → bulut STT maliyeti yok, gizlilik korunur).
- **Altyazı stilleri** (font, boyut, renk, konum, animasyon/"karaoke" caption — sosyal medya trendi).
- Çok dilli + **otomatik çeviri** (altyazıyı başka dile çevir). Çıktı: gömülü (burned-in) veya ayrı `.srt`.

### 5. Video format / ebat
- **Dikey / yatay / kare** (9:16, 16:9, 1:1) + özel ebat. **Platform ön-ayarları** (YouTube / TikTok / Reels / Shorts).
- **Auto-reframe** (akıllı kırpma: özneyi merkezde tutarak dikeye çevir — Premiere "Auto Reframe" benzeri).

### 6. Gömülü render motoru
- Çözünürlük (1080p/4K…) + kodek + kalite/fps seç → **ffmpeg ile render** (kırpma + concat + fade'li geçiş + ses crossfade). NLE'ye gitmeden doğrudan video.
- (Blueprint'teki "FFmpeg birleştirici" tohumu → olgun, kullanıcıya açık hali.)

### 7. Çok-NLE çıktı (NLE'ye gitmek isteyene)
- Manifest (soyut timeline) → her program için adaptör: **Premiere** (UXP/AAF), **Final Cut + DaVinci** (tek hamlede **FCPXML**), **CapCut** (proprietary JSON draft — en zor, en son). Ortak omurga: **OTIO / FCPXML**.

### 8. ⚙️ MİMARİ KARARI (kritik — kullanıcının ufkunu netleştir)
İki seçenek var, **doğru seçim ürünün maliyetini/hızını belirler:**
- **(A) YEREL İŞLEME + BULUT HESAP (ÖNERİLEN):** ağır iş (analiz, render, altyazı/Whisper) **kullanıcının makinesinde** yerel; bulut **yalnızca** auth + abonelik + hesap + lisans + (ops.) şablon/varlık. **Video ASLA buluta yüklenmez** → düşük altyapı maliyeti, hız, gizlilik. Login online ama işleme yerel. **Video aracı için en gerçekçi model.**
- **(B) TAM BULUT (video yükle, sunucuda işle):** ince istemci + çapraz-cihaz AMA **çok pahalı** (GPU sunucu + depolama) + yavaş (büyük video upload). Çoğu durumda gereksiz/aşırı.
- → **Öneri: (A).** Abonelik erişimi kapıdan kontrol eder; işleme yerelde kalır (bugünkü mimariye yakın). Whisper + Ollama yerel çalışabilir.

#### 8b. Tauri/webview mi, "başlı başına native yazılım" mı? (kaydedilen karar)
**Sonuç: Tauri KALIR — native'e geçmek GEREKMEZ ve daha verimsizdir.** Gerekçe: ürünün şekli zaten "**ince native kabuk + web UI + AĞIR yerel sidecar (ffmpeg/Whisper/Ollama/OTIO) + bulut auth**" — bu, Tauri'nin EN iyi olduğu desen.
- Login/abonelik/hesap/i18n (20-30 dil) = **web UI** → web stack'inde KOLAY (native'de zor).
- Altyazı/render/format/çok-NLE/stil-AI = **sidecar** (Python/binary, **dil-bağımsız**).
- **Tek GERÇEK sınır:** webview, gerçek-zamanlı kare-hassas ÇOK-TRACK NLE preview'unda zorlanır. AMA AutoReji modeli = "AI auto-edit → hafif inceleme → ffmpeg render → NLE'ye teslim"; gerçek-zamanlı manuel timeline DEĞİL → bu sınır ürünü VURMAZ.
- **Kritik güvence:** asıl değer/IP = **motor (sidecar: analiz + AI + ffmpeg)**, framework'ten **BAĞIMSIZ ve taşınabilir.** Kabuk ileride değişse bile motor durur → kabuk seçimi düşük risk.
- **Çapraz-platform:** Tauri **tek kod** → mac + Windows (+Linux). Native = her OS'a ayrı yazım (solo/küçük ekipte çok pahalı). 
- **Native yalnızca** gerçek-zamanlı GPU efekt/timeline editörü olsaydı gerekirdi — bizim ürün o değil. **Verimlilik:** Tauri = daha hızlı geliştirme + mevcut yatırımı (UI/manifest/sidecar) koruma + küçük/ucuz dağıtım. Native = yavaş, pahalı, mevcut işi çöpe atar.
- **Alternatifler:** Electron (her şeyi yapar ama 100MB+ şişkin, daha çok RAM; Tauri daha hafif/güvenli) · saf web (yerel ffmpeg/Whisper/dosya erişimi YAPAMAZ → "yerel işleme" modeliyle uyumsuz; bulut portalı olarak yan ürün olabilir).

### 9. 💡 BENİM ÖNERDİĞİM EK ÖZELLİKLER (kullanıcı istedi: "buna benzer geliştirmeler sun")
Ticari bir oto-kurgu SaaS'ı için yüksek değerli, gerçekçi eklentiler:
- **Otomatik müzik + beat-sync:** telifsiz müzik kütüphanesi + kesimleri ritme/beat'e oturtma (genel kurguda çok güçlü).
- **Sessizlik / "dead-air" kesme:** konuşma aralarındaki boşlukları otomatik at (talking-head / podcast / vlog editörlüğünün en istenen özelliği).
- **Dolgu-kelime temizliği:** "ııı", "şey", "um" otomatik tespit+kes (trend).
- **Müzik ducking:** konuşma varken müziği otomatik kıs.
- **Highlight / en iyi an tespiti:** uzun çekimden AI ile en iyi anları çıkar (uzun→kısa, "shorts" üretimi).
- **Marka kiti:** kullanıcı logosu + intro/outro + lower-third + watermark (abonelikte özelleştirilebilir; ücretsizde zorunlu watermark).
- **Renk / LUT ön-ayarları + klipler arası otomatik renk eşitleme.**
- **Şablonlar / platform ön-ayarları** (tek tıkla TikTok/Reels/Shorts düzeni).
- **Doğrudan yayınlama:** çıktıyı uygulamadan YouTube/TikTok'a gönder (API).
- **Bulut proje senkronu** (abonelik avantajı, cihazlar arası) — ama medya yerel (bkz. mimari A; yalnız proje/manifest senkronu).
- **Stok / B-roll entegrasyonu** (telifsiz görsel/video kütüphanesi).
- **Çapraz-platform:** SaaS olduğundan **Windows (ve belki web)** desteği — pazarı kat kat büyütür (mevcut yalnız macOS).
- **Uygulama içi onboarding / mini eğitimler** (yeni kullanıcı için).

### 10. Paket (tier) farklılaştırma — örnek iskelet
- **Ücretsiz:** watermark zorunlu · 720p · sınırlı render dk/ay · 1-2 dil · temel stiller.
- **Başlangıç / Pro / Stüdyo (3 ücretli):** watermark yok · 1080p→4K · daha çok/sınırsız render · tüm diller · gelişmiş AI (highlight, auto-reframe, beat-sync) · çok-NLE çıktı · doğrudan yayınlama · öncelikli destek.
- (Kademeler özellik + kota + çözünürlük + dil sayısıyla ayrışır.)

---

## AÇIK KARARLAR (zamanı gelince)
1. **Ürün 1 ↔ Ürün 2 ilişkisi:** AutoReji genel ürünün içinde bir "ASMR/soft profil" mi olur, yoksa ayrı mı kalır?
2. **Mimari:** yerel-işleme+bulut-hesap (önerilen A) onayı.
3. **Backend/ödeme:** auth+abonelik için hazır altyapı (Supabase/Firebase + Stripe/Paddle) mı, özel mi?
4. **İlk diller** (20-30'a giderken ilk 5-6 hangileri?) + i18n çatısı.
5. **Altyazı:** yerel Whisper (önerilen) mi bulut STT mi.
6. **Çok-NLE sırası:** Premiere(var) → FCPXML(FinalCut+DaVinci) → CapCut(en son).
7. **Genel ürün adı** (AutoReji niş/ghibli çağrışımlı; genel ürün yeni ad + Madyes yayıncı).
8. **Platform:** yalnız mac mı, Windows/web de mi.

## Neden bugünkü temel bu vizyona UYGUN (sıfırdan değil, üstüne inşa)
- **Manifest (JSON EDL):** NLE-bağımsız soyut timeline → çok-NLE + render için **omurga** (en değerli varlık).
- **Python sidecar:** ffmpeg + analiz zaten var → render + altyazı (Whisper) + format adaptörleri buraya.
- **VLM + içerik analizi:** zaten var → genel "stil tespiti"nin çekirdeği (genel üründe AI BİRİNCİL karar verici olur — nişte "ince" kalan AI burada YILDIZ olur).
- **Tauri 2 + premium UI + motifler:** genel ürün arayüzü (i18n, hesap, format/render/altyazı panelleri) bunun üstüne kurulur; Tauri çapraz-platforma (Windows) açılabilir.

> Sıra: önce AutoReji kapalı beta + geri bildirim → sonra bu kararlar → Genel Reji SaaS (muhtemelen ayrı/yeni ürün, v2 değil "yeni ürün").
