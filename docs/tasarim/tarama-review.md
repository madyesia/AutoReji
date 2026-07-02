# İnceleme (Review) Çalışma Alanı — Derin Tarama (2026-07-02)

> **Kapsam:** `ReviewScreen.tsx` + `components/review/*` + `lib/store.ts` + `lib/data.ts` + `lib/types.ts`.
> **İlişki:** `docs/UI_UX_DENETIM_2026-07-02.md` raporundaki bulgular (boş durum, sanallaştırma, odak halkaları, token disiplini vb.) **tekrarlanmadı** — burası o raporun GİRMEDİĞİ derinlik: ölçülü yerleşim haritası, mod sisteminin gerçeği, gösterilmeyen veri envanteri, görev-tıklama sayıları, Timeline yakın bakışı ve **yalnız paketli .app'te ortaya çıkan kırıklar**.
> **Durum: SADECE TESPİT — hiçbir kod değişmedi.**

---

## 1) Yerleşim haritası — gerçek ölçüler

```
┌────────────────────────────────────────────────────────────────┐
│ AppShell üst bar                                    h-14 (56px)│
├──────────┬──────────────────────────────────────┬──────────────┤
│ Yönetmen │  PreviewStage (flex-1 → artan alan)  │  Inspector   │
│ Paneli   │                                      │              │
│ 280px    ├──────────────────────────────────────┤  360px sabit │
│ (yalnız  │  Timeline               ~78px sabit  │  (fast'te    │
│ director)│  (veri barı sadece 36px)             │   yok)       │
│          ├──────────────────────────────────────┤              │
│          │  Filmstrip     177–276px (zoom'a göre)│             │
├──────────┴──────────────────────────────────────┴──────────────┤
│ Alt bar (istatistik / toplu işlem + CTA)            h-14 (56px)│
└────────────────────────────────────────────────────────────────┘
```

Kaynaklar: dış iskelet `ReviewScreen.tsx:49-58`, alt bar `:60`; `DirectorPanel.tsx:17` (`w-[280px]`), `Inspector.tsx:40` (`w-[360px]`), `Timeline.tsx:30-35`, `Filmstrip.tsx:37-54` (başlık `h-9`=36px + şerit `py-5`=40px), zoom kademeleri `Filmstrip.tsx:9` → kart genişliği `[180, 232, 288, 356]` → 16:9 kart yüksekliği `[101, 131, 162, 200]` → Filmstrip blok toplamı `[177, 207, 238, 276]px`.

**Dikey bütçe hesabı** (sabitler: 56 üst + 56 alt + 78 timeline + 207 filmstrip @varsayılan zoom = 397px):

| Pencere | Sahneye kalan yükseklik | Video boyutu (kontrollü mod) | Video boyutu (yönetmen modu) |
|---|---|---|---|
| 1512×982 (14" tam ekran) | ~586px | ~999×562 — iyi | genişlik 872−24 → **848×477** |
| 1280×800 (küçük pencere) | ~404px | ~676×380 (ekranın ~%26'sı) | genişlik 640−24 → **616×347** |

**Tespitler (alan israfı / sıkışıklık):**

- **T1 — Yönetmen Paneli 280px'lik tam-boy sütun ama içeriği ~350px dikey** (başlık + 3 stil kartı + bilgi kutusu + alt rozet, `DirectorPanel.tsx:16-55`). 982px pencerede sütunun ~%60'ı boş. Bedeli: küçük pencerede video Inspector'dan (360px) bile dar kalıyor (616px). Panel bir kez tıklanan, kalıcı ekran alanı hak etmeyen bir seçim.
- **T2 — Timeline bloğunun %54'ü krom:** 78px'in yalnız 36px'i veri barı; "GENEL BAKIŞ · ZAMAN ÇİZELGESİ" etiket satırı (`Timeline.tsx:31-34`) 22px yiyor ve sağındaki toplam süre, alt bardaki `~X dk` ile mükerrer (`ReviewScreen.tsx:79`).
- **T3 — Inspector 360px sabit** — 1280 pencerede içerik alanının %28'i; küçültme/gizleme tutamağı yok (tek yol "Hızlı" moda geçmek, o da her şeyi kaybettiriyor — bkz. §2).
- **T4 — Filmstrip yatay uzunluğu:** varsayılan zoom'da 160 kart × 232px + 159 baloncuk (36/64px) + padding ≈ **~43.000px kaydırma** (~29 ekran genişliği). Sahneye atlamanın tek hızlı yolu ⌘K'ya sayı yazmak (`CommandPalette.tsx:62-63`) veya Timeline'a tıklamak — ikisi de öğretilmiyor (Filmstrip başlığında ipucu yok).

---

## 2) Mod sistemi — ne yapıyor, ne yapmıyor

Kod izi: `store.ts:83` (varsayılan `controlled`), `store.ts:101` (`setMode` sadece state yazar). Modu okuyan **tek** dosya `ReviewScreen.tsx`:

| Mod | Gerçek etki | Başka etki? |
|---|---|---|
| Hızlı | `Inspector` gizlenir (`ReviewScreen.tsx:57`) | YOK |
| Kontrollü | varsayılan görünüm | YOK |
| Yönetmen | soldan `DirectorPanel` eklenir (`ReviewScreen.tsx:51`) | YOK |

Yani mod = **panel görünürlüğü anahtarı**; davranış, klavye, otomasyon hiçbir şey değişmiyor. Sorunlar:

- **M1 — Build ekranında ölü kontrol:** anahtar `screen === 'review' || 'build'`te görünüyor (`AppShell.tsx:66`) ama `BuildScreen.tsx` modu hiç okumuyor → Kur ekranında mod değiştirmek hiçbir şey yapmıyor. (v1.14.6 "ölü kontrol dürüstleştirme" turu bunu kaçırmış.)
- **M2 — "Yönetmen"in tek özelliği ekskluziv değil:** stiller ⌘K paletinden HER modda uygulanabiliyor (`CommandPalette.tsx:48-51`). Panel yalnız keşfedilebilirlik sağlıyor; karşılığında 280px sabit sütun.
- **M3 — "Hızlı" modda kazanç yok, kayıp çok:** kaybedilenler — trim, geçiş süresi kaydırıcısı, QC detayı, karar gerekçesi, "Önizle" modalı, varyant bilgisi, Sıfırla/Klibi çıkar panel düğmeleri. Kazanılan tek şey ~360px genişlik. "Hızlı" adı bir iş akışı vaat ediyor (ör. otomatik ilerleyen onay turu) ama sadece "daha az panel".
- **M4 — Hiçbir yerde açıklanmıyor:** anahtarın tooltip'i yok; üç kelimelik etiketlerden farkı anlamak imkânsız. Kullanıcı (teknik olmayan) için üç mod = üç belirsizlik.
- **M5 — Kalıcı değil:** her açılışta `controlled`a döner (localStorage'a yazılmıyor; `setup.ts` yalnız kurulum durumunu saklıyor).

**Öneri yönü:** modları kaldırıp tek görünüm + iki bağımsız aç/kapa (Inspector ▸ / Stil paneli ▸ — durumları hatırlanır) en dürüst çözüm. Modlar kalacaksa: Build'de gizle, tooltip'le açıkla, DirectorPanel'i Inspector içine sekme yap (280px geri kazanılır).

---

## 3) Gösterilmeyen veri envanteri — alan → şu an nerede → fırsat

Şema: `lib/types.ts:39-82`. Örnek gerçek dağılım (mock Bölüm 2, 160 klip): energy 1→3 / 2→62 / 3→95, **linger 64/160 (%40)**, mood 157 `cozy` + 3 sapma, `micro_crossfade` 0.06s.

| Alan | Şu an nerede görünüyor | Fırsat (görselleştirme) |
|---|---|---|
| `analysis.energy` (1-5) | yalnız Inspector metin satırı (`Inspector.tsx:118`) | ★★★ **Enerji eğrisi** Timeline üstüne 20-24px area-chart. v1.0.1'de süre kararı enerjiye bağlandı ama kullanıcı bu sinyali HİÇBİR yerde göremiyor — "neden bu klip 6.8s?" sorusunun görsel cevabı |
| `analysis.linger` | Inspector'da yalnız true iken bir satır (`Inspector.tsx:120`) | ★★★ Klip kartına küçük "oyalanma" rozeti + Timeline'da tik. Ritmin BİRİNCİL kaldıracı (64 klip!) tamamen görünmez |
| `analysis.mood` | **HİÇBİR YERDE** (tipte var: `types.ts:59`) | ★★ 157/160 `cozy` → sapmalar (melancholic/tense) tam da bakılması gerekenler; kartta mood-sapma rozeti veya Timeline mood bandı |
| `analysis.saturation` | **HİÇBİR YERDE** | ★ parlaklıkla birlikte "görsel ton" bandına girdi |
| `analysis.brightness` | Inspector satırı (`Inspector.tsx:122`) | ★★ Timeline altında gündüz/gece parlaklık şeridi — sert parlaklık sıçramaları fade gerekçesini görselleştirir |
| `decision.algo_default` | **HİÇBİR YERDE** (`types.ts:30`) | ★★★ TransitionEditor'da "algoritma önerisi: Fade 1.5s" hayalet çip — elle değişiklikte neye kıyasla değiştiğin görünür; tek tıkla algo'ya dön |
| `decision.signals.jarring_cut` | **HİÇBİR YERDE** (`types.ts:25`) | ★★ ilgili geçiş baloncuğunda uyarı halkası — "burada cut rahatsız edebilir" |
| `decision.signals.color_shift` | **HİÇBİR YERDE** | ★ Inspector sinyal rozetlerine ekle (fade gerekçesi) |
| `audio.micro_crossfade`, `mask_stereo_shift` | **HİÇBİR YERDE** (`types.ts:62`) | ★★ ASMR ürününde ses tamamen görünmez: Inspector'a "Ses" bölümü — "60ms mikro-crossfade ✓ · stereo düzeltme yok". Güven verir, hard-constraint'i (native stereo) UI'da kanıtlar |
| `variant.candidates` | sayı rozeti (`Filmstrip.tsx:139`) + salt-okunur metin (`Inspector.tsx:136-140`) | ★★★ **Varyant seçici yok** — bkz. §4(d) |
| `transition_in.handle` | 10.5px dipnot (`Inspector.tsx:174`) | ★ trim şeridinde tutamak bölgesini boya |
| `manifest.outro.fade_out_to_black` | **İncelemede hiçbir yerde** (intro ilk klipte var: `Inspector.tsx:79-83`) | ★ son klip seçiliyken "Kapanış: siyaha fade 1.5s" satırı + Timeline sağ ucunda çentik |
| `stats.min / max` | hesaplanıyor (`data.ts:59-60`) ama gösterilmiyor | ★★ alt bara "min 4.96 · ort 5.83 · max 6.79" — **4.30s SERT TABAN** kuralının kullanıcıya görünen kanıtı |
| `stats.lowConf` | hesaplanıyor (`data.ts:61`), **hiç kullanılmıyor** (ölü stat) | ★ alt barda "N düşük güven" çipi → tıklayınca odak filtre |
| `stats.regimes` | gösterilmiyor (Timeline tonu örtük) | ★ alt barda mini rejim dağılımı (Dış/İç/Uyku oranı) |
| `decision.signals.prompt_sim_prev` | Inspector rozeti; `calm` stili kullanıyor (`store.ts:190-199`) | ★ Timeline'da "benzerlik vadileri" — sahne sınırlarını gösterir |
| `meta.subjects` | yalnız Inspector (`Inspector.tsx:131`) | ★ ⌘K'da özne araması ("kedi" → o sahneler) |
| `clip.scale` (sayısal skor) | görünmüyor; yalnız `needsAttention` girdisi (`data.ts:72`) | ○ anlamı belirsiz — motor tarafıyla adlandırılıp "dikkat puanı" olarak açılabilir |

**Özet:** manifest zengin (enerji, linger, mood, ses, algo-varsayılanı, varyantlar) ama İnceleme yüzeyi bunların çoğunu ya tek Inspector satırına sıkıştırıyor ya hiç göstermiyor. En büyük kaldıraç: **Timeline'ı tek renk bandından "sinyal katmanlı" genel bakışa** çevirmek (enerji eğrisi + linger tikleri + parlaklık bandı) — mevcut 36px bar 60-70px olur, veri zaten elde.

---

## 4) Görev sürtünmesi — tıklama/adım sayıları

| Görev | Bugünkü yol | Adım | Değerlendirme |
|---|---|---|---|
| (a) Bir geçişin türünü değiştir | baloncuk tıkı döngü: cut→fade→black (`Filmstrip.tsx:159-168`); Inspector Segmented (`Inspector.tsx:164`); klavye C/F/B | **1-2** | İyi. Ama: hedef türe döngüyle gitmek 2 tık olabilir ve **her ara adım undo geçmişine + `user_overridden=true`** yazar (`store.ts:224-233`) — döngüden geçip başlangıca dönsen bile klip "elle değiştirildi" sayılır (kalem rozeti + alt bar sayacı yanlış şişer) |
| (b) Bir klibin trim'ini ayarla | kartı seç (1) → Inspector "Kırpma & tutamak" kaydırıcısı (2) | **2** | Yeterli ama kaba: görsel şerit (`Inspector.tsx:191-198`) **sürüklenemez, sadece süs**; sayısal giriş / ±1 kare düğmesi yok; Hızlı modda +1 adım (önce mod değiştir) |
| (c) Bir klibi kurgudan çıkar | hover → kırmızı çöp (`Filmstrip.tsx:142-149`) veya Delete | **1** | ✓ örnek nitelikte (tek tık + undo toast) |
| (d) Çift-çekim varyantlarını karşılaştır | — | **İMKÂNSIZ** | Veri var (`variant.candidates`, `types.ts:33-37`), video oynatma altyapısı var (`videoUrl`), ama **seçme/önizleme kontrolü yok**; Inspector salt-okunur. Blueprint'in "tra/cel çift çekim" gerçeğine karşılık UI sıfır. Mock'ta 0 varyant olduğundan dev önizlemede fark edilmiyor |
| (e) Bir geçişi önizle | seç (1) → Inspector "Önizle" (2) → modal | **2** | Sayı iyi ama: modal **paketli .app'te kırık** (bkz. §6-P1); ayrıca gizli alternatif var — hover'da PreviewStage geçişi fade-flash ile zaten oynatıyor (`PreviewStage.tsx:72`) ama bu hiçbir yerde söylenmiyor |

Ek sürtünmeler:
- **F1 — Geçiş süresi için ön ayar yok:** kaydırıcı hassas ama yavaş; "1.0 / 1.5 / 2.0" çipleri tek tıka indirir.
- **F2 — Toplu işaretleme kırılgan:** normal tık `clearMarks()` çağırır (`Filmstrip.tsx:63`) → 30 klip işaretliyken tek yanlış tık hepsini uçurur; **`marked` undo geçmişinde DEĞİL** (`store.ts:71-76` yalnız `clips`i kaydeder) → geri alınamaz, toast da çıkmaz.
- **F3 — "Riskli/odak filtreden topluca işaretle" yok:** riskli 12 klibi silmek için tek tek ⌘-tık gerekir; "görünenleri işaretle" komutu yok.
- **F4 — Oynatma klavyesizdir:** Space (oynat/duraklat), M (ses) yok; `ReviewScreen.tsx:29-46` yalnız gezinme/düzenleme. `ShortcutsHelp.tsx`te "Oynatma" grubu hiç yok.

---

## 5) Timeline yakın bakış (160 klip yoğunluğunda)

Klip başına çizilenler (`Timeline.tsx:36-63`): rejim tonu (%32 opak zemin), altta 3px ölçek şeridi, cut-değilse solda 3px fosforlu geçiş çizgisi, riskte/720p'de-düşük-güvende üstte 6px bayrak noktası, seçimde iç ring. Etkileşim: tık = seç (+oynatım atlar), hover = büyük önizleme sürer, tooltip = **native `title`** (~1sn gecikmeli, stilsiz — `Timeline.tsx:51`; uygulamanın her yerindeki `Tip` bileşeni burada kullanılmamış).

Yoğunluk matematiği (1512px pencere, kontrollü mod): bar iç genişlik ≈ 1120px → **~7px/klip**. Sonuçlar:

- **Z1 —** 3px geçiş çizgisi segmentin %43'ü → fade yoğun bölgede bar "çizgi ormanı"na döner; cut'lar ise tamamen görünmez (aynı rejimli komşu segmentler arasında sınır çizgisi yok → kesintisiz tek bant gibi okunur). Rejim genel bakışı ✓, klip-seviyesi okuma ✗.
- **Z2 — Zaman cetveli yok:** ne 5dk işaretleri ne oynatım konumuna tıklanabilir zaman — yalnız sağ üstte toplam. 15dk'lık bölümde "8. dakika civarı" bulunamaz.
- **Z3 — Kapatılan klip iz bırakmıyor** (`dur=0` → render yok, `Timeline.tsx:37`): kurgudan çıkarılan yerde ince bir çentik olmayınca "nerede boşluk oluştu" görülemez.
- **Z4 — 160 tab-stop:** her segment `<button>` ama ok-tuşu gezinimi yok; klavye kullanıcısı için Tab cehennemi.
- **Z5 —** Playhead zarif (klip süresi kadar linear kayış, `Timeline.tsx:66-69`) ama sürüklenemez; yalnız segment tıkıyla atlanır.
- **Z6 —** Rejim renk göstergesi/lejantı yok — Dış/İç/Uyku tonlarını kullanıcının ezbere bilmesi bekleniyor (alt bar yalnız cut/fade/black lejantı veriyor, `ReviewScreen.tsx:74-76`).

**Yön:** bar 36→64-72px; üst yarı enerji eğrisi + linger tikleri, alt yarı mevcut rejim bandı + 5dk cetvel; kapatılan klipe 1px kırmızı çentik; native `title` yerine `Tip`.

---

## 6) Yalnız paketli .app'te ortaya çıkan kırıklar (dev'de görünmez)

`vite.config.ts:14-24 stripDevFixtures` prod build'den `episode.json`, `thumbs/`, `sprites/` klasörlerini siler (doğru karar). Ama üç kod yolu hâlâ bu mock yollarına işaret ediyor:

- **P1 — "Önizle" geçiş modalı .app'te boş oynar (YÜKSEK):** `PreviewModal.tsx:4` `thumbUrl` import eder ve `:63,64,68`de doğrudan kullanır — gerçek kareye düşen `clipThumb` DEĞİL. .app'te `/thumbs/N.jpg` yok → çapraz-fade animasyonu iki boş görsel arasında oynar. Düzeltme tek satırlık: `thumbUrl(x.scene)` → `clipThumb(x)`.
- **P2 — Hover-scrub .app'te sahte geri bildirim veriyor (YÜKSEK):** kare kazıma sprite şeridi `/sprites/N.jpg`ten okunur (`data.ts:22-23`); .app'te dosya yok → CSS background sessizce boş kalır, **kare değişmez ama alttaki amber ilerleme çizgisi oynamaya devam eder** (`Filmstrip.tsx:152-154`). Üstelik başlık metni "üstüne gel → kare kazı" (`Filmstrip.tsx:40`), toggle tooltip'i (`:42`) ve `ShortcutsHelp.tsx:32` bu özelliği vaat ediyor. Aynı durum `InspectorPreview.tsx:81-84` scrub'ında (oradaki hover-autoplay gerçek videoyla çalışıyor, o sağlam). Çözüm: sidecar `_generate_thumbs` gibi sprite de üretip `clip.sprite` alanına yazmak; ya da .app'te scrub çizgisini+metnini gizlemek.
- **P3 — `clipThumb` son çare olarak yine mock'a düşüyor:** `data.ts:15-20` — .app'te `c.thumb` null ise (eski manifest / thumb üretimi başarısız) `/thumbs/N.jpg` 404. Karo zaten `onError` ile gradyana düşüyor ama davranış tesadüfe kalmış.
- **P4 — Dev fixture kör noktası:** mock bölümde **0 riskli klip ve 0 çift-çekim** var → QC risk paneli, risk rozetleri, "Riskli N" filtresi ve varyant rozeti tarayıcı önizlemesinde hiç egzersiz edilmiyor; görsel regresyon ancak .app'te gerçek veriyle görülür. Fixture'a birkaç riskli + varyantlı klip eklemek testi güçlendirir.

---

## 7) Diğer derin tespitler

- **D1 — Hover → büyük sahne video yüklemesi debounce'suz:** `PreviewStage.tsx:36-44` aktif klip her değiştiğinde `v.src` + `load()`; film şeridinde fareyi gezdirmek karttan karta tam video yükletir. Dev'de hafif, .app'te 1080p decode zinciri. ~120ms hover-intent gecikmesi yeter.
- **D2 — Ok tuşunu basılı tutmak smooth-scroll yığar:** her seçim `scrollIntoView({behavior:'smooth'})` (`Filmstrip.tsx:30-34`) — hızlı gezinmede animasyonlar üst üste biner; basılı tutuşta `behavior:'auto'`ya düşmek gerekir.
- **D3 — Alt bar bağlam kaybı:** işaretleme varken istatistik satırı tamamen yerini toplu işlem barına bırakıyor (`ReviewScreen.tsx:61-82`) — "20 klibi silersem toplam kaç dk kalır?" tam o anda görünmez. İkisi yan yana sığar.
- **D4 — Inspector linger kopyası motorla çelişebilir:** `Inspector.tsx:120` "oyalanma anı → uzun + **fade**" diyor; v1.0.1 motorunda linger süre kaldıracı (held↔flowing), fade garantisi değil. Kopya "→ uzun tutuş" olmalı (motor teyidiyle).
- **D5 — İlk klibin baloncuğu yok ama Inspector'da 'Açılış' var:** tutarlı; fakat **son klip** için simetrik "Kapanış" bilgisi yok (bkz. §3 outro).
- **D6 — `Segmented` mod anahtarında ikonlar var etiket kısa** (`AppShell.tsx:44-48`); `Tip` ile sarılmamış tek üst-bar kontrolü bu.

---

## 8) Öncelik önerisi

| Sıra | İş | Neden |
|---|---|---|
| 1 | **P1** PreviewModal `clipThumb` düzeltmesi | .app'te bariz kırık özellik; tek satır |
| 2 | **P2** sprite: .app'te üret veya scrub'ı dürüstleştir | sahte geri bildirim + yanlış vaat (kopya 3 yerde) |
| 3 | **F2** `marked` kaybına koruma (tık-dışı temizleme onayı veya marked'ı geçmişe dahil et) | geri alınamaz kullanıcı emeği kaybı |
| 4 | **(d)** Varyant seçici (Inspector'da aday listesi + hover önizleme + "bunu kullan") | veri + altyapı hazır, görev bugün imkânsız |
| 5 | **§3** Enerji eğrisi + linger rozetleri + min/ort/max | v1.0.1 süre modelini görünür kılar; "neden" sorusunun görsel cevabı |
| 6 | **§2** Mod sadeleşmesi (Build'de gizle → tooltip → DirectorPanel'i Inspector sekmesi yap) | ölü kontrol + 280px geri kazanım |
| 7 | **Z1-Z6** Timeline katmanlama (cetvel, çentik, lejant, Tip tooltip) | 160-klip yoğunluğunda tek genel bakış aracı |
| 8 | **a/F1** algo_default hayaleti + süre ön-ayar çipleri + override bayrağı düzeltmesi | dürüst "elle değişiklik" sayacı |
| 9 | D1-D3, F3-F4 (debounce, scroll, alt bar, Space/M, toplu-işaretle komutları) | cila |
