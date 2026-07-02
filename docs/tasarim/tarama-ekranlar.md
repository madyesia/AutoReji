# Görsel / Kompozisyon Taraması — Ekranlar (2026-07-02)

> **Kapsam:** SetupScreen · IntakeScreen · AnalysisScreen · BuildScreen · ArchiveScreen. (ReviewScreen ayrı taramada.)
> **Ne yapar:** `docs/UI_UX_DENETIM_2026-07-02.md` akış/durum denetimiydi; bu belge onun YAPMADIĞI **görsel/kompozisyon** eleştirisidir: hizalar, ritim, yüzey hiyerarşisi, süsleme dengesi, mikro kusurlar. Kod okunarak (JSX + className) hazırlandı; **hiçbir kod değişmedi — sadece planlama.**
> Öncekiyle çakışan yerlerde referans verildi (örn. C4/C6/C8), tekrar edilmedi.

---

## 0) Ekranlar-arası bulgular (en önemlisi burada)

### 0.1 Yükseklik sistemi TANIMLI ama HİÇ KULLANILMIYOR (ana bulgu)
`index.css:168-181` — `.glass-raised` ve `.glass-pop` özenle tanımlanmış (yorumda kural bile var: "aynı ekranda en fazla 2") ama **beş ekranın hiçbirinde tek kullanım yok**; her kart düz `.glass`. Sonuç: her ekran "aynı cam dikdörtgenin tekrarı" hissi veriyor. Tek düzeltme kalıbı: **ekran başına 1 baskın yüzeye `glass-raised`**, ikincil bilgi yüzeylerine **inset** (`bg-ink-900/50 ring-hair` — Setup zaten `SetupScreen.tsx:395,458`'de bunu doğru yapıyor, örnek alınmalı), gerisi `.glass` ya da tamamen kartsız.

### 0.2 Konteyner ekseni ekran geçişlerinde zıplıyor
- Setup `max-w-3xl` (768px, `SetupScreen.tsx:51`) → Intake `max-w-5xl` (1024, `IntakeScreen.tsx:70`) → Analysis sabit `w-[520px]` kart (`AnalysisScreen.tsx:127`) → Build `max-w-2xl` (672, `BuildScreen.tsx:88`) → Archive `max-w-5xl` (`ArchiveScreen.tsx:64`).
- Ekran geçiş animasyonu yalnız opacity+y olduğundan başlığın sol kenarı her geçişte yatay sıçrıyor. **Öneri:** tek-kolon "huni" ekranları (Setup, Build) **aynı genişlikte buluşsun → ikisi de `max-w-3xl`**; geniş ekranlar (Intake, Archive) `max-w-5xl` kalsın. Analysis'in merkez kartı istisna olarak doğru.

### 0.3 Sayfa dolgusu ve başlık ölçeği tutarsız
- Dikey dolgu: Setup/Intake/Build `py-12`, Archive `py-10` (`ArchiveScreen.tsx:64`) → **`py-12`'ye eşitle**. Geri-dön butonu marjı: Build `mb-6` (`BuildScreen.tsx:89`) vs Archive `mb-5` (`ArchiveScreen.tsx:65`) → `mb-6`.
- H1: 34px (Setup:58, Intake:75) · 30px (Build:93, Archive:71) · Build fazlarında 24 (`:139`) ve 26 (`:151`). Beş ekranda 4 farklı başlık boyutu. **Öneri:** önceki denetim C4'teki ölçek tanımlanınca: giriş/hero ekranları `text-display` (34), araç ekranları (Build/Archive) 30'da sabit; Build'in faz başlıkları tek değer (26).

### 0.4 Üst amber gradyanın 3 varyantı var
Aynı süs üç ayarla kopyalanmış: `h-64 …/[0.04]` (Setup:49, Intake:68) · `h-72 …/[0.05]` (Build:87) · `h-64 …/[0.05]` (Archive:63). **Tek satırlık `<AmberHalo />` bileşenine çek** (motifs.tsx'e) — hem tutarlılık hem C1 token temizliğine hazırlık.

### 0.5 Yağmur kimliği: yükselen bir eğri var ama Build'de KOPUYOR
RainCanvas yoğunlukları güzel bir dramatik eğri çiziyor: Setup 0.5·op50 → Intake 0.7·op60 → **Analysis 1.15 (doruk)** → … **Build: HİÇ YOK** → Archive yalnız boş-durumda 0.7. Uygulamanın finali ("Bölüm kuruldu", yağmur temalı başlık!) yağmursuz tek ekran. Ayrıca **hazır süsler kullanılmıyor:** `RippleField` (motifs.tsx:197 — su halkası, birebir Ghibli motifi) ve `SoftSweep` (motifs.tsx:308) **hiçbir ekranda çağrılmıyor**. RainCanvas dışında kimlik amber ışık + rejim renkleriyle kısmen taşınıyor; ama "su" motifi yalnız canvas'ta. **Öneri:** Build'e düşük doz yağmur (0.35·op40) ve/veya done fazına `RippleField` (bkz. §4).

### 0.6 Mikro kusur envanteri (ekranlar-arası)
| Kusur | Yerler | Öneri |
|---|---|---|
| Üç farklı ikon-buton stili | `IconButton` h-9 w-9 (ui.tsx:40) · ikon-tek `Button size=sm` px-3 → kare değil (ArchiveScreen.tsx:180-183) · elle h-8 w-8 kopyala butonu (BuildScreen.tsx:306) | Hepsi `IconButton`; Archive'daki dikdörtgen ikon butonlar görünür şekilde yamuk |
| Dikey ayraç 3 boyda | `h-3 w-px` (Setup:55) · `h-4 w-px` (Build:111) · `h-5 w-px` (AppShell:81) | Tek yardımcı: `.vrule` (h-4) |
| Metin glifi ↔ lucide karışımı | "Şimdilik atla →" (Setup:88), "Hazırlığı aç →" (Build:159) metin oku; CTA'lar `ArrowRight`. "Yaptım ✓" (Setup:180), "çalışıyor ✓" (Setup:286,330) metin tiki; rozetler `Check` | Buton/link içinde gliflere devam edilecekse hepsi glif; ama tek dil en iyisi: lucide (C8 ile aynı ruh) |
| İki "numaralı adım çipi" stili | Steps: h-5 w-5 text-[11px] (Setup:192, Build:195 kopya kod) · Intake onboarding: h-8 w-8 text-[13px] (Intake:152) | Steps bileşenini paylaş; Intake'te numara+ikon çifte çipi teke indir (§2) |
| Seed değeri düz metin | `seed: …` (Build:112) ve `seed …` (Archive:172) tabular/mono değil | `font-mono text-[11.5px]` — manifest kod çipiyle (Build:172) aynı dil |
| Hairline ikizleri | `.hairline` 0.07 (index.css:182) vs `ring-hair` 0.08 (index.css:223) — aynı iş, iki opaklık | C6 ile birlikte tek değere (0.10-0.12) |
| Tabular durumu | Genel olarak İYİ: Badge (ui.tsx:88) ve Stat/BirthStat tabular'ı gömülü taşıyor | Yalnız seed satırları eksik (yukarıda) |

---

## 1) SetupScreen — Hazırlık

### Kompozisyon
- `max-w-3xl px-8 py-12` (`:51`); dikey ritim `mt-7 / mt-7 / mt-6 / mt-7` (`:65,68,79,87`) — uyarı kutusunun `mt-6`'sı ritmi tek başına bozuyor.
- **1280×800'de sayfa ~900px+** (özet kartı ~110px + 3 spine kartı + uyarı + alt bar): birincil CTA "Giriş'e geç" fold altında kalıyor. Büyük pencerede 768px kolon sorunsuz (liste doğası gereği).
- Asıl kompozisyon sorunu **bilgi tekrarı**: ScanSummary kartı (`:104-131`) ile hemen altındaki 3 spine kartı **aynı 3 öğeyi aynı durum renkleriyle iki kez** gösteriyor; ikisi de eş ağırlıkta cam blok. İlk bakışta 4 eş dikdörtgen.

### Hiyerarşi / baskın öğe
Baskın öğe 3 görev kartı (spine) olmalı — şu an tepedeki özet kartı ilk bakışı çalıyor. Spine kartlarının kendi içinde durum farkı (renk çubuğu) iyi ama **yüzey farkı yok**: sıradaki (pending) adım da bitmiş adım da aynı `.glass`.

### Süsleme envanteri
RainCanvas 0.5·op50 (`:48`) + amber halo (`:49`) + ScanBeam (tarama sırasında, `:116`) + spine gradyan hattı ve parlayan düğümler (`:69-70,156`) + ProgressRing glow'ları + ApprovedSeal. **Yoğunluk dengeli** — ilk kurulum ekranına yakışan "stüdyo taranıyor" tiyatrosu. Fazla-boş bölge yok; tek fazlalık yine özet kartının kendisi.

### Detay kusurları
- Lejant metni `text-[10.5px] text-fg-subtle` (`:111-112`) — çok küçük; 11px + aynı kalsın (C7 sınırında).
- `Badge` içinde uzun cümle: "onaylı · sistem doğrulayamaz" (`:177`) — h-5 tek satır rozet dar pencerede başlıkla yarışıp taşma riski taşıyor; rozet kısalsın ("onaylı"), açıklama alt metne insin.
- Paragraf ortasında rozet kullanımı (`:413` ".ccx · imzasız · …") — rozet burada cümle parçası gibi; ya düz metin ya satır sonuna.

### KORU (zaten çok iyi)
- Spine metaforu: durum-renkli düğüm + kartın sol 3px renk kenarı (`:156-158`) — durum dili tek bakışta.
- **Inset panel kullanımı** `bg-ink-900/50 ring-hair` (`:395` kurulum adımları, `:458` doğrulama notu) — uygulamadaki tek ikinci-yüzey örneği; diğer ekranlara taşınacak desen bu.
- İndirme halkası içinde % + GB sayacı tabular (`:292-295`); h-11 w-11 ikon çipi Intake ile birebir aynı (ekranlar-arası tutarlılık).
- Numaralı adım çipleri (`:192`) net ve okunur.

### DEĞİŞTİR (somut)
1. **ScanSummary'yi karttan çıkar** (`:108` `rounded-2xl glass p-4` → kartsız): başlık bloğunun altına tek satır chip dizisi (`mt-4 flex gap-2`; chip stili `:120-122`'de hazır). Sayfa ~110px kısalır → CTA fold'a girer, tekrar hissi biter.
2. `:79` uyarı `mt-6` → `mt-7` (ritim 28px'e sabitlenir).
3. Sıradaki (ilk pending) spine kartına `glass-raised`, bitenlere `.glass` — "şimdi burası" hissi.
4. `:177` rozet metnini kısalt; `:111` lejantı 11px'e çıkar.
5. "Şimdilik atla →" (`:88`) → `ArrowRight size={13}` ile ikonlu ghost link.

**Tek hamle (küçük emek / büyük etki):** #1 — özet kartını satıra indir; hem tekrarı hem fold sorununu tek dokunuşta çözer.

---

## 2) IntakeScreen — Giriş

### Kompozisyon
- `max-w-5xl px-8 py-12`, `flex min-h-full flex-col` + `flex-1` ayırıcı (`:70,168`) — alt bar kısa içerikte tabana yapışıyor: **doğru kurgu**. 1280×800'de boş durum tek ekrana sığıyor (dengeli); dolu durumda doğrulama paneliyle hafif kaydırma, sorun değil.
- Ritim: `mt-9 / mt-9 / mt-8` (`:82,118/143,169`) — son blok 32px'e düşüyor; `mt-9`'a eşitle.
- **Grid boşlukları çakışıyor:** slot grid'i `gap-3.5` (`:82`) vs onboarding grid'i `gap-4` (`:145`) — aynı ekranda iki kart grid'i iki farklı oluk. İkisi de `gap-4`.

### Hiyerarşi / baskın öğe
Baskın öğe 3 giriş slotu olmalı. Boş durumda ekranda **6 eş cam dikdörtgen** var (3 slot + 3 "Nasıl çalışır" kartı, hepsi `glass rounded-2xl p-5` — `:93` vs `:150`); bilgi kartları aksiyon kartlarıyla aynı ağırlıkta. Doluyken sorun yok: seçili slotun `bg-ink-800 + ring-amber-400/40 + shadow-raised` dönüşümü (`:93`) zaten güçlü bir ikinci yüzey.

### Süsleme envanteri
Rain 0.7·op60 (`:67`) + amber halo + SweepReveal ışık süpürmesi doğrulama panelinde (`:119`) + hover `dropring`. Denge iyi; boş durumun alt yarısı (onboarding) süssüz ama kartlar camken kalabalık görünüyor — kartlar sadeleşince (aşağıda) mevcut süs seviyesi tam oturur.

### Detay kusurları
- Onboarding kartında **çifte çip** (`:152-153`): numara çipi (amber) + ikon çipi (gri) yan yana iki 32px kare — göz iki kez takılıyor. Tek çip: numara; ikon başlık satırına.
- Slot örnek-dosya satırı `text-[12px] tabular` (`:107`) — dosya adına tabular gereksiz (rakam hizası değil, metin); zararsız ama anlamsız.
- "Sürükle-bırak veya tıkla" (`:109`) tarayıcı kopyası — kodda drop handler görünmüyor; kopya davranışı vaat etmesin ("Tıkla ve seç").
- Doğrulama satır grid'i `gap-x-8` (`:130`) — 5xl genişlikte iki kolon arası fark edilir; `gap-x-10`'la kolonlar daha net ayrışır (küçük tercih).
- Alt bar sol metni `text-[12px]` (`:170`) — Setup alt barı 13px; 13'e eşitle.

### KORU
- Slot dolu-durum dönüşümü (`:93,98,107-108`): cam→mürekkep + amber ring + dosya adının amber koda dönmesi — uygulamanın en iyi durum-değişimi.
- SweepReveal'ın satır onaylarıyla senkron "frontier" akışı (`:119,131,187-189`) — pahalı görünen, ucuz yapılmış premium an.
- Bölüm adı bloğunun `hairline-t pt-4` ile panelden ayrılması (`:134`) — doğru iç bölümleme.
- h-11 w-11 ikon çipleri Setup ile aynı ölçü.

### DEĞİŞTİR (somut)
1. **Onboarding kartlarını camdan çıkar** (`:150` `glass p-5` → `rounded-2xl bg-white/[0.02] ring-hair p-5` veya tamamen kartsız numaralı satırlar): slotlar tek baskın öğe olur.
2. `:82` `gap-3.5` → `gap-4`; `:169` `mt-8` → `mt-9`.
3. Doğrulama paneli (`:118`) baskın olduğu anda `glass` → `glass-raised`.
4. Çifte çipi teke indir (`:152-153`); numara çipini Steps stiline (h-5 w-5) yaklaştırmak da olur.
5. `:73` sabit "cozy yağmur ASMR" satırı — E3 ile aynı iş; görsel açıdan da seçilen belge adını göstermek üst satırı canlandırır.

**Tek hamle:** #1 — bilgi kartlarını bir kademe geri it; ekranın "ne yapmam gerekiyor" cevabı anında netleşir.

---

## 3) AnalysisScreen — Analiz

### Kompozisyon
- Tek merkez kart `w-[520px] max-w-[92vw] p-8` (`:127`), çevrede yağmur 1.15 (doruk) + 520px ışık blob'u (`:122-124`). 1280×800'de kart (~580px) rahat sığıyor; büyük pencerede çevredeki boşluk **bilinçli sinema hissi** — doğru karar, dokunma.
- Kart içi ritim: halka → `mt-5` başlık → `mt-7` aşama listesi (`space-y-2.5`) → `mt-6 hairline-t pt-4` alt bar — tutarlı ve nefesli.

### Hiyerarşi / baskın öğe
Baskın öğe 132px ProgressRing + altın %30px rakam (`:160-163`) — **gerçekten baskın; beş ekranın en doğru hiyerarşisi.** Aşama listesi ikincil, İptal üçüncül. Örnek alınacak ekran.

### Süsleme envanteri
En süslü ekran: yağmur doruğu + blob + halka glow + aktif aşamada kayan ışık şeridi (`:188-193`). Yoğun ama **hepsi tek odağın etrafında** — dağınıklık yok. "Fazla mı?" sınırında değil; done fazında yağmurun 0.7'ye inmesi (`:122`) zarif bir detay.

### Detay kusurları
- `rounded-[1.7rem]` (`:127`) — token dışı keyfi yarıçap; `--radius-2xl`(1.5rem)=`rounded-2xl` yeterli.
- Done ve error fazları ikiz ama ölçüler farklı: daire 128 vs 120 (`:145` vs `:133`), başlık 19px vs 18px (`:150` vs `:134`) — tek sabit (124 / 19px).
- Genel yönelim göstergesi yok: halka **aşama** %'sini gösteriyor, "işin toplamda neresindeyim" yalnız minik "aşama 2/6" satırında (`:162`, 10px). 
- Aşama alt-bilgi satırı `:165` "· tamamen yerel, offline" her aşamada tekrar ediyor — bir kez üstte söylemek yeter (kopyada sadeleşme).

### KORU
- Kart-tek-odak kompozisyonu ve halkanın mutlak baskınlığı.
- Aşama satırlarının üç-durum dili (yeşil tik pop / dolan amber + ışık / sönük) `:170-198`.
- Yağmur yoğunluğunun faza bağlanması (`:122`) — kimliğin işlevle birleştiği yer.

### DEĞİŞTİR (somut)
1. `:127` `rounded-[1.7rem]` → `rounded-2xl`.
2. Done/error daire 124px, başlık 19px'te birleştir (`:133-134,145,150`).
3. Kartın üst kenarına 2px genel-ilerleme hattı: `absolute top-0 left-0 h-[2px] bg-gradient-to-r from-amber-500 to-amber-300` genişlik `prog*100%` — aşama %'siyle çakışmadan "toplam yol" duygusu verir.
4. `:165` "tamamen yerel, offline" tekrarını başlık altına bir kez al.

**Tek hamle:** #3 — tek satırlık süs değil, oryantasyon: uzun VLM aşamasında kullanıcı toplam yolu görür.

---

## 4) BuildScreen — Kur

### Kompozisyon
- `max-w-2xl px-8 py-12` (`:88`) — en dar ana ekran. **Ready fazı 1280×800'de ~450px içerik**: sayfanın alt %40'ı boş; büyük pencerede (yağmur da olmadığından) uygulamanın **en boş hissettiren** ekranı. Done fazında ise tersine 672px kolonda tek mega-kart uzayıp gidiyor.
- Ritim dağınık: back `mb-6` → stats `mt-7` → lejant `mt-3` → RevealPanel `mt-7` → CTA `mt-8` (`:89,96,103,115,126`) — 28/12/28/32 karışımı.
- Üç fazda üç başlık boyutu: 30 → 24 → 26 (`:93,139,151`).

### Hiyerarşi / baskın öğe
- Ready'de baskın öğe "Premiere'de Kur" CTA'sı olmalı; görsel ağırlık 4'lü istatistik grid'inde. CTA sağ-altta doğru yerde ama üstündeki her şey eş cam olduğundan sayfa "önce oku sonra bul" akıyor. 
- **Building fazı çıplak** (`:132-145`): kartsız halka + zaman çizelgesi. Analysis'teki kardeş anın (analiz koşusu) sinematik kartına karşılık, uygulamanın ASIL doruğu (Premiere kurulumu!) en az giydirilmiş sahne. Tutarsızlık hissi buradan geliyor.
- Done'da dört bölüm tek `.glass` kartta hairline'larla (`:155-201`) — kritik aksiyon (Manifest'i Kaydet) 3. bölümde gömülü; `w-full primary` buton bunu kısmen kurtarıyor.

### Süsleme envanteri
**RainCanvas YOK** (§0.5) — yalnız amber halo `h-72` (`:87`). Kart doğum ışıltısı (`:221-226`) ve BirthStat sayaçları güzel mikro-süs; MiniStrip (28 kare film şeridi, `:267-288`) başlı başına kimlik taşıyıcı. Ama ambiyans katmanı sıfır: "Bölüm kuruldu" başlığı yağmur temalı olduğu hâlde ekran kuru. `RippleField` tam bu an için yazılmış ve kullanılmıyor.

### Detay kusurları
- Seed satırı düz metin (`:112`) — mono/tabular değil (§0.6).
- Lejant şeridi de `.glass` (`:103`) — ekrandaki 6-7. cam; bilgi ikincil → inset olmalı.
- İkiz kopya kod: numaralı adım çipi Steps'in aynısı elle yazılmış (`:195` vs SetupScreen:192).
- Kopyala butonu üçüncü ikon-buton stili (`:306`, §0.6).
- Alt üçlü buton satırı ortalanmış (`:203`) — sayfanın geri kalanı sola hizalı/sol-eksenli; eksen kırılıyor. Sağa yasla ya da done bloğu gibi ortala-tümünü (öneri: sağ).

### KORU
- BirthStat + kademeli kart doğumu (`:96-101,215-229`) — "istatistikler doğuyor" anı premium.
- **MiniStrip** (`:267-288`): eşit örneklenmiş 28 kare + alt 2px ölçek-rengi çizgisi — kurulan işin görsel mührü, uygulamanın en özgün parçası.
- Recap'in somut satırları + warn/ok çipleri (`:242-263`); manifest kod çipi mono-amber (`:172`).
- Done üstündeki ApprovedSeal 72px (`:150`) — doğru tören.

### DEĞİŞTİR (somut)
1. **Ambiyans:** `:87`'nin üstüne `<RainCanvas intensity={0.35} className="opacity-40" />`; done fazında ek olarak `<RippleField tint="var(--glow-ok)" />` (motifs.tsx:197 hazır) — final yağmur/su ile kapanır.
2. Building fazını Analysis diliyle sarmala: halka+timeline'ı `rounded-2xl glass-raised p-6` karta al (`:133-144`); başlık 24 kalabilir.
3. `max-w-2xl` → `max-w-3xl` (`:88`, §0.2): done mega-kartı kısalır, MiniStrip kareleri büyür.
4. Lejant `:103` `glass` → `bg-ink-900/50 ring-hair`; seed `:112` → `font-mono tabular text-[11.5px]`.
5. Ritim: `:103` `mt-3` bilinçli (bağlı blok) — kalsın; `:126` `mt-8` → `mt-7`.
6. Başlıklar: ready 30 / building 24 / done 26 → 30 / 24 / 30 (tören başlığı ready ile eş ağırlık hak ediyor).
7. Done'da manifest bölümünü kendi kartına ayır (`glass-raised`), kalan üç bölüm mevcut kartta — "tek yapman gereken şu" netleşir.

**Tek hamle:** #1 — iki satır: yağmur geri gelir, final finale benzer, §0.5 eğrisi tamamlanır.

---

## 5) ArchiveScreen — Arşiv

### Kompozisyon
- `max-w-5xl px-8 py-10` (`:64`) — tek `py-10` (§0.3). Grup ritmi `mt-8` + `space-y-9` + grup içi `mt-3` (`:85,89`) — 36px grup arası iyi; `mt-8` üst girişi `mt-9`'la eşitlenebilir (küçük).
- Galeri `grid-cols-1 sm:2 lg:3 gap-4` (`:89`): 1280×800'de 3 kolon ~322px kart — doğru yoğunluk. Büyük pencerede 3 kolon sabit kaldığından kartlar genişliyor (5xl sınırı sayesinde taşmıyor) — sorunsuz.
- Liste yoğunluğunda kapak `w-36` (`:141`) — 144px kapakta üç yüzer-çip sıkışıyor (tarih + kaydedildi + klip·süre aynı kapakta); listede çipleri ikiye indir ya da kapağı `w-44` yap.

### Hiyerarşi / baskın öğe
Kartlar eş ağırlıkta ızgara — arşiv doğası gereği kabul edilebilir; ama **hiçbir öğe sahne almıyor**: en son kurulan bölüm (kullanıcının %90 aradığı şey) diğerleriyle aynı boyutta. Grup başlıkları yalnız 11px `SectionLabel` (`:88`) — bölümleme çizgisi/sayısı yok, uzun listede grup sınırı siliniyor.

### Süsleme envanteri
Dolu durumda süs YOK (yalnız üst halo `:63`) — kimliği **içerik taşıyor**: rejim-tonlu kapak gradyanı (`:142`), alt rejim ışık sızması (`:156-157`), RegimeStrip. Bu doğru: içerik varken süs geri durmalı. Boş durum ise tam tersi zengin (rain 0.7 + blob + nefes alan çip, `:207-218`) — **denge iki uçta da doğru kurulmuş.** Tek eksik: hover sprite-scrub (`:143-153`) gibi cömert bir detayın yanında kart-altı buton bölgesinin sıradanlığı.

### Detay kusurları
- Kapak çipleri iki boyut: tarih/klip `text-[10.5px]` vs "kaydedildi" `text-[10px]` (`:158-162`) → 10.5 tek boyut.
- İkon-tek `Button size=sm` dikdörtgen (`:180-183`, §0.6) — `IconButton`'a geç; "Yeniden aç" primary sm ile yan yana yükseklikleri de (32 vs 36) uyuşur.
- Galeri kart alt bölgesi `flex-col items-stretch` (`:176-178`): TxDots solda, butonlar sağa yaslı ayrı satır — liste modunda tek satır. İki modda iki farklı düzen kaçınılmaz ama TxDots noktalarının glow'u (`:125`) buton satırıyla dikey hizada değil; TxDots'a `h-8 items-center` verip buton satırıyla aynı yükseklik ritmine oturt.
- Başlık `text-[14px]` + meta 11px (`:169-171`) — kart içinde iyi; seed 11px düz (§0.6).

### KORU
- Kapak bilgi mimarisi: sol-üst tarih, sağ-üst kaydedildi, sol-alt klip·süre + rejim gradyanı — yoğun ama okunur "film afişi".
- Hover: `-translate-y-1.5 + shadow-pop + ring-white/20` (`:196`) — uygulamanın en iyi kart hover'ı.
- RegimeStrip 1.5px dağılım çubuğu (`:103-113`) — minicik, bilgi dolu.
- Boş durum bütünüyle (`:205-219`).
- Galeri/Liste Segmented'ının yalnız kayıt varken görünmesi (`:74-79`).

### DEĞİŞTİR (somut)
1. `:64` `py-10` → `py-12`; `:65` `mb-5` → `mb-6`.
2. **Hero kart:** galeri modunda ilk grubun ilk kartına `sm:col-span-2` (yalnız `i===0 && groups[0]`) — en taze bölüm sahne alır; tek satır koşul.
3. Grup başlığına sayı + çizgi: `Bugün · 3` + `hairline-b pb-2` (`:88`) — uzun listede tarama kolaylaşır.
4. Çip boyutlarını 10.5'te birleştir (`:160`); ikon butonları `IconButton`'a çevir (`:180-183`).
5. Liste kapağı `w-36` → `w-44` veya listede çipleri (tarih + klip) ikiye indir (`:141,158-162`).

**Tek hamle:** #2 — bir className koşulu; arşiv "depo"dan "vitrin"e döner.

---

## 6) Uygulama sırası önerisi (görsel tur — önceki denetimin Tur 2/3'üyle birleşir)
1. **Kimlik/süreklilik:** Build'e yağmur + RippleField (§4.1) · gradyan bileşeni (§0.4) · Build `max-w-3xl` (§0.2).
2. **Hiyerarşi:** Setup özet-kartını satıra indir (§1.1) · Intake onboarding'i geri it (§2.1) · ekran başına 1 `glass-raised` (§0.1).
3. **Ritim/nit:** py/mt eşitlemeleri (§0.3) · ikon-buton/ayraç/glif birleştirme (§0.6) · Archive hero + grup başlığı (§5.2-3).
Her adım: Playwright + ekran görüntüsü → prod build → sürüm/CHANGELOG ritüeli.
