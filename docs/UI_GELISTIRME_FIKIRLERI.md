# AutoReji UI — Derin İnceleme & Geliştirme Fikirleri

> Tarih: 2026-06-29 · Sürüm tabanı: v1.7.0 · Kapsam: `brain/` (Vite+React+TS+Tailwind v4)
> Yöntem: (1) kod tabanı tek tek incelendi (~2000 satır, 23 dosya), (2) 4 ekran gerçek tarayıcıda render edilip gözlendi (Playwright), (3) Blueprint §13 spec'iyle karşılaştırıldı, (4) profesyonel NLE / UX en iyi pratikleri internetten araştırıldı (Premiere, DaVinci, Final Cut, CapCut, Descript, Frame.io, Mux, NN/g, Material, Apple HIG, WCAG).
> Bu belge **fikir havuzu + öncelik haritası**. Uygulama kullanıcı seçimiyle yapılır.

---

## 0. Genel değerlendirme (özet)

UI **zaten güçlü ve premium**: temiz tasarım sistemi (renk token'ları, cam yüzey, amber vurgu), 4 akıcı ekran, undo/redo, klavye sürüşü, canlı video önizleme, zaman çizelgesi, QC rozetleri, 3 mod. Blueprint §13'ün büyük kısmı uygulanmış. Aşağıdaki fikirler "iyi"yi **"kusursuz"a** taşımak içindir; kategorilere ve önceliğe ayrıldı.

Öncelik kodları: **P0** = hemen, yüksek etki/düşük maliyet · **P1** = yüksek değer · **P2** = derinlik/cila · **P3** = Faz 4 (Tauri/backend) bekler.

> **✅ Uygulama durumu (v1.7.1):** P0 hızlı kazanımları yapıldı ve prod build'de doğrulandı → **1.1** hover→Inspector senkronu (önizleme rozeti) · **1.2** analiz ekranı metni · **1.3** pasif "Analizi Başlat" görünümü · **1.5** stepper ilk açılıştan · **1.6** favicon. **v1.8.0:** **2.2** hover-scrub ✅. **v1.8.1:** önizleme siyahı — `--color-black`/Tailwind token çakışması düzeltildi (kök neden) ✅ · **hareketli önizleme aç/kapa toggle** (kullanıcı isteği) ✅ · mikro-etkileşim altyapısı (easing + asimetrik süre token'ları) + **7.3** `prefers-reduced-motion` ✅. **v1.9.0:** premium video çerçevesi + oynatım kontrolleri/ilerleme çubuğu/döngü/fade (§5/§13.5/2.8) ✅ · ölçek kimlik renkleri (film şeridi + timeline) ✅ · geçiş tıkla-döngü + fosforlu + büyük/boşluklu yuvarlaklar (2.8) ✅ · 720p **kırmızı** uyarı — manifeste `resolution` (§3.4) ✅ · timeline fosforlu geçiş + ölçek şeridi ✅.
**v1.9.1:** tüm-kurgu film şeridinden **devam** · film şeridinde **tekil klip sil** (çöp kutusu, `enabled` toggle) · ileri/geri = **sonraki/önceki video** · ses **kalıcı** (varsayılan kapalı) · crop işareti kaldırıldı — hepsi ✅.
**v1.10.0 — kalan öncelikli frontend paketi (hepsi ✅):** boş durum onboarding (1.4/3.1) · toplu seçim ⌘/Shift+tık + toplu Cut/Fade/Black/Sil (2.4) · komut paleti ⌘K + sahneye atla (2.5) · genel bakış/mini-harita dikkat bayrakları (2.3) · tümünü sıfırla + "N elle değişik" sayacı (2.6) · klavye odağı (Enter/Space) + `?` yardım kartı + ⌘K ipucu (7.1/2.7) · Kur ekranı çıktı yolu (kopyala) + UXP numaralı adımlar (5.1/5.2).
**v1.11.0 — kalan UI cilası (hepsi ✅):** **Arşiv/Geçmiş ekranı** (§9 — sinematik poster galerisi, localStorage, kuruldukça otomatik kayıt) · **toast bildirim** (6.3, "Geri al"lı) · **stil-değişim "ne değişti" özeti** (6.2 — mod kurgu kararını değiştirmediği için yalnız stile bağlandı) · **kontrast WCAG AA** (7.2) · **film şeridi sanallaştırma** (8.1, native `content-visibility`) · **count-up + panel/kart giriş stagger** (6.1) · **Inspector mini-önizleme** (2.8) · **Analiz iptal + cozy hata kartı** (4.3) · **Kur ekranı "Finder'da göster"** (`native.ts` köprü) + recap + mini-şerit + tüm-yolları-kopyala (5.x).
Kalan (yalnız Faz 4'e bağlı / opsiyonel): odak gezinme sayacı (2.9) · gerçek ilerleme (4.2/P3) · profiller & A/B (P2, localStorage→config) · **gerçek stereo ses önizleme · slider→motor canlı yeniden hesap · gerçek arşiv yolu + Finder reveal** (P3 — `native.ts` köprüsü paket eklenince çalışır).

---

## 1. ŞİMDİ YAKALANAN SORUNLAR & TUTARSIZLIKLAR (önce bunlar)

| # | Sorun | Kanıt | Öncelik |
|---|-------|-------|---------|
| 1.1 | **Film şeridi hover → Inspector güncellenmiyor.** Hover'da üstteki video değişiyor (`PreviewStage` `hovered`'ı kullanıyor) ama sağdaki Inspector yalnız `selected`'a bakıyor. Kullanıcının birincil isteği. | `Inspector.tsx` `clips.find(x=>x.scene===selected)`; `hovered` hiç kullanılmıyor | **P0** |
| 1.2 | **Analiz ekranı son aşama metni eski.** "Görsel-AI kalite denetimi · anatomi/halüsinasyon taraması" yazıyor — oysa v1.6.0'da VLM hata denetiminden çıkarıldı, artık **kurgu sinyali** (energy/role/linger). | `AnalysisScreen.tsx` STAGES + ekran görüntüsü | **P0** |
| 1.3 | **"Analizi Başlat" boşken disabled ama görsel olarak parlak/aktif görünüyor.** `[disabled]` doğru ama soluk değil → yanıltıcı. | İlk açılış snapshot (`[disabled]`) vs görünüm | **P0** |
| 1.4 | **Boş (empty) durumda ölü alan.** Giriş ve Kur ekranlarında içerik üstte toplanıyor, alt yarı boş; "premium" yerine "bitmemiş" hissi (dolu halde sorun yok). | 01-acilis.png, 05-build.png | **P1** |
| 1.5 | **Stepper (Giriş/İnceleme/Kur) ilk açılışta yok.** Yeni kullanıcı nerede olduğunu/akışın uzunluğunu görmüyor; veri yüklenince beliriyor. | İlk açılış vs Build ekran görüntüsü | **P1** |
| 1.6 | **favicon.ico 404** (console error). Kozmetik ama temiz değil. | console error | **P0** (5 dk) |
| 1.7 | **Yönetmen panelindeki slider'lar bağlı değil** (fade üst sınırı, min-cut, eşik...). UI'da duruyor ama karar motorunu tetiklemiyor → kullanıcı oynatınca hiçbir şey olmuyor (sessiz "ölü kontrol"). | `DirectorPanel.tsx` local `useState`, `applyStyle` bunları kullanmıyor | **P1** (görsel uyarı) / **P3** (gerçek bağlama) |
| 1.8 | **160 klip DOM'da (sanallaştırma yok).** Şimdilik lazy-img ile akıcı, ama 160 düğüm + 4 zoom seviyesi büyüdükçe risk. | `Filmstrip.tsx` flex min-w-max | **P2** |

---

## 2. İNCELEME EKRANI (kalp) — en yüksek değerli geliştirmeler

### 2.1 Hover → Inspector senkronizasyonu (P0)
- **Ne:** Film şeridinde bir klibe gelince (tıklamadan) sağdaki Inspector o klibin bilgilerini göstersin; tıklayınca "kilitlensin" (seçili). Oynatım sırasında devre dışı.
- **Neden:** Kullanıcının doğrudan isteği; NLE'lerde standart "preview-on-hover, commit-on-click" deseni (Premiere Hover Scrub, Wikipedia/LessWrong link önizleme — NN/g). 160 klibi taramayı dakikalara indirir.
- **Nasıl:** Inspector'ın aktif klibi `playing ? selected : (hovered ?? selected)` olsun (PreviewStage'deki mantığın aynısı). Hover bittiğinde son seçili kalsın. NN/g zamanlaması: hover'ı **0.3–0.5s "fare durdu"** gecikmesiyle ortaya çıkar, ayrılınca **>0.5s** koru → titreme olmaz. Seçili (kilitli) klip için ince bir "📌 sabit" göstergesi.

### 2.2 Hover-scrub (kare kazıma) — film şeridi thumbnail'inde (P1) — ✅ YAPILDI (v1.8.0)
- **Ne:** Bir klip kartının üzerinde fareyi **yatay** gezdirince thumbnail o ana atlasın (sol kenar = ilk kare, sağ = son kare). Tıklamadan klibin içeriğini "tara".
- **Neden:** NLE'lerde neredeyse evrensel: Premiere Project panel Hover Scrub, DaVinci media pool, Frame.io review. 8 sn'lik klibin neyi içerdiğini açmadan anlamak.
- **Nasıl (performanslı):** Her klip için ffmpeg ile **tek yatay "sprite şeridi"** üret (ör. 8–12 kare birleşik tek JPEG/WebP); hover'da `background-position` kaydır → **kare başına ağ/decode yok** (Mux/YouTube storyboard tekniği). `mousemove`'u `requestAnimationFrame`'e throttle et. (Şu an üstteki büyük video hover'da oynuyor; bu, thumbnail'in kendi içinde de çalışmasıdır.)

### 2.3 Mini-harita / genel bakış şeridi (P1)
- **Ne:** İnceleme'nin en üstüne, tüm bölümün **tek bakışta** kuş-bakışı şeridi: rejim renk bantları + geçiş yoğunluğu (cut/fade/black işaretleri) + düşük-güven/QC bayrakları + o an görünen pencere kutusu. Tıkla → oraya atla.
- **Neden:** Blueprint §13.3 açıkça istiyor ("Üst — Mini-harita"). 160 klipte "bölümün şekli"ni (yolculuk→yuva→gece) anında gösterir; DaVinci Color sayfası "klip başına tek thumbnail" mantığı.
- **Nasıl:** Mevcut `Timeline` bileşeni buna yakın; ayrı ince bir "overview" şeridi olarak üste taşı veya ikinci bir yoğunluk katmanı ekle. Güven rengi: düşük-güven kararlar belirgin.

### 2.4 Toplu seçim + toplu işlem (P1)
- **Ne:** Shift+tık (aralık) / ⌘+tık (tekil ekle) ile birden çok klip seç → hepsine birden cut/fade/black uygula, süreleri ölçekle, toplu enable/disable.
- **Neden:** Blueprint §13.3 + PLAN'da `[~]` bekliyor. Günlük 160 klip iş akışında büyük hız.
- **Nasıl:** `selected: number | null` → `selected: Set<number>` + `anchor` (shift-aralık için). Filmstrip/Timeline çoklu ring; alt barda "N seçili · hepsini Fade yap / Cut yap / Sıfırla". Klavye: `Shift+←/→` aralık büyüt.

### 2.5 Komut paleti (⌘K) (P1)
- **Ne:** ⌘K ile arama kutusu: "fade yap", "bu klibi çıkar", "gece bölümüne git", "tümünü sıfırla", "Daha sakin stili", "Premiere'de kur"... + sahne numarasına atla.
- **Neden:** Power-user verimliliği; Linear/Raycast/Arc standardı. Kısayolları **keşfedilebilir** yapar (kullanıcı kod bilmiyor → kısayolları ezberlemek yerine arar).
- **Nasıl:** Hafif bir cmdk benzeri liste; eylemler zaten store'da mevcut (setTransitionType, applyStyle, toggleEnabled...). Sahne ara → seç/atla.

### 2.6 "Tümünü algoritmaya sıfırla" + diff sayacı (P1)
- **Ne:** Alt barda "Elle değişen: N" göstergesi + tek tıkla "tümünü sıfırla". Şu an yalnız tek-klip sıfırlama var.
- **Neden:** Blueprint §13.3 "diff + algoritmaya sıfırla (tümü)". Kullanıcı denedikten sonra güvenle başa dönebilsin.
- **Nasıl:** `user_overridden` sayısı zaten var; toplu `resetClip` döngüsü + onay.

### 2.7 Klavye keşfedilebilirliği & yardım (P1)
- **Ne:** `?` tuşu → kısayol kartı (←/→, C/F/B, Space, Delete, ⌘Z, ⌘K...). Her kontrolün tooltip'inde kısayol harfi.
- **Neden:** Kısayollar var ama görünmüyor; kod bilmeyen kullanıcı keşfedemez.
- **Nasıl:** Basit modal + tooltip'lere kısayol rozetleri.

### 2.8 Inspector geçiş editörü cilası (P2)
- **Ne:** Cut/Fade/Black değiştirince **canlı küçük önizleme** (PreviewModal mantığı satır içi mini). Handle yetersizse "fade sığmıyor → cut" uyarısını **proaktif** göster. "neden bu karar?" gerekçesini her zaman görünür tut.
- **Neden:** Şeffaflık = güven (Blueprint). DaVinci'de geçiş bir blok; süre kenarından sürüklenir — Inspector slider'a ek olarak timeline'da geçiş bloğunu sürükleyerek süre ayarı düşünülebilir.

### 2.9 "Sadece dikkat gerekenler" odak modunu zenginleştir (P2)
- **Ne:** Odak modunda kritik klipler arasında **sıçrama** (J/K veya Tab ile "sonraki bayrak"), kaç tane kaldığı sayacı ("3/18 incelendi").
- **Neden:** Blueprint §13.4 günlük hız hedefi; odak modu var ama "gezinme" eksik.

---

## 3. GİRİŞ (INTAKE) EKRANI

### 3.1 Boş durum (empty state) yeniden tasarımı (P1)
- **Ne:** Hiç girdi yokken alt yarıyı doldur: kısa "nasıl çalışır" (3 adım: prompt+video ver → incele → Premiere'de kur), örnek bölüm kartı daha belirgin, ufak bir örnek kurgu görseli/animasyon.
- **Neden:** Şu an boşken ölü alan + "bitmemiş" his. NN/g: boş durum yön gösterir.
- **Nasıl:** Doğrulama paneli yerine (henüz boşken) onboarding içeriği; girdi gelince doğrulamaya dönüşür.

### 3.2 Sürükle-bırak alanı geri bildirimi (P1)
- **Ne:** Dosya/klasör sürüklenince alan **vurgulansın** (amber kenar + "bırak"), yanlış tür (örn. video yerine resim) için anında uyarı, yükleniyor durumu.
- **Neden:** Sürükle-bırak var ama "canlı" hissetmiyor; premium araçlarda güçlü hover/drop geri bildirimi standardı.

### 3.3 Disabled buton durumu (P0)
- **Ne:** "Analizi Başlat" girdi yokken görsel olarak **soluk/pasif** (opaklık + cursor), yanına "eksik: video klasörü" gibi net neden.
- **Neden:** Şu an parlak görünüp tıklanamıyor → kafa karışıklığı.

### 3.4 Çözünürlük/uyarı satırına aksiyon (P2)
- **Ne:** "sahne 115 = 720p" uyarısı tıklanabilir olsun → o klibe/varyanta git veya "elle ele al" notu.
- **Neden:** Uyarı bilgi veriyor ama yönlendirmiyor.

---

## 4. ANALİZ EKRANI

### 4.1 Aşama metnini güncelle (P0) — bkz. 1.2
- "Görsel-AI kalite denetimi · anatomi/halüsinasyon" → "Görsel-AI sahne analizi · enerji/rol/ritim (kurgu sinyali)". (Doğru ve dürüst.)

### 4.2 Gerçek ilerlemeyi yansıt (P2 / P3)
- **Ne:** Sahte yüzde yerine sidecar'dan gerçek aşama ilerlemesi (Faz 4'te). Şimdilik: aşama süreleri gerçekçi olsun, "tamamen yerel/offline" rozeti kalsın (güzel mesaj).
- **Neden:** Güven; ama gerçek bağlama Tauri'yi bekler.

### 4.3 Analiz iptal / arka plan (P2)
- **Ne:** "İptal" + uzun analizde "arka planda devam" seçeneği.

---

## 5. KUR (BUILD) EKRANI

### 5.1 Manifest & arşiv yolu + "Finder'da göster" / "yolu kopyala" (P1)
- **Ne:** Üretilen manifest/arşiv yolunu göster + kopyala + Finder'da aç. (Şu an ekranda yol görünmüyor.)
- **Neden:** Kullanıcı çıktının nereye gittiğini bilmeli; UXP panelinde bu manifesti seçecek.

### 5.2 Kuruluş sonrası net durum + UXP adımları (P1)
- **Ne:** "Premiere'de Kur" sonrası: ✓ başarı durumu + **Premiere/UXP'de ne yapacağının adım adım kartı** (panel aç → Kur'a bas) — kullanıcı kod bilmiyor.
- **Neden:** Köprü manuel; en kritik manuel adım burası, elden tutmak şart (CLAUDE.md mandatı).

### 5.3 Boş alan & özet zenginliği (P2)
- **Ne:** Alt boşluğa: rejim dağılımı mini-grafiği, en uzun/kısa klip, QC özeti, tahmini Premiere kurulum süresi.

---

## 6. GLOBAL: ETKİLEŞİM, HAREKET, MOD

### 6.1 Mikro-etkileşimler & hareket cilası (P2)
- **Ne:** Ekranlar arası tutarlı geçişler (zaten Framer var), buton/kart hover'da yumuşak yükselme, seçimde amber halka animasyonu, sayaç değişiminde "count-up", geçiş tipi değişince ufak onay nabzı.
- **Neden:** Linear/Arc/Raycast "feel" detayları premium algıyı yaratır. Ölçülü kalmalı (Ghibli: zarif, oyuncak değil).

### 6.2 Mod farklarını netleştir (P2)
- **Ne:** Hızlı/Kontrollü/Yönetmen geçişinde **ne değiştiğini** kısa göster (Hızlı = tek tık kur; Yönetmen = sol panel + slider'lar açılır). Şu an fark sessiz.
- **Neden:** 3 mod var ama kullanıcı farkı hissetmeyebilir.

### 6.3 Bildirim/uyarı sistemi (toast) (P2)
- **Ne:** "Stil uygulandı", "12 fade'e çıktı", "klip çıkarıldı (geri al)" gibi kısa, geri-alınabilir toast'lar.
- **Neden:** Aksiyon geri bildirimi; undo'yu keşfedilebilir yapar.

### 6.4 "Tüm geçişleri arka arkaya önizle" + "sadece sesi dinle" (P3)
- **Ne:** Blueprint §13.5. Geçiş zincirini ve (Faz 4'te) gerçek stereo sesi art arda dinleme.

---

## 7. ERİŞİLEBİLİRLİK (WCAG 2.1 AA) — premium = erişilebilir

### 7.1 Klavye odak göstergeleri (P1)
- **Ne:** Film şeridi kartları, timeline segmentleri, geçiş baloncukları **Tab ile gezilebilir** + net `:focus-visible` halkası (≥2px, ≥3:1 kontrast — WCAG 2.4.11/2.4.13).
- **Neden:** Şu an klavye navigasyonu var (←/→) ama görünür odak halkası eksik; WebAIM: sayfaların %78'inde odak sorunu.

### 7.2 Kontrast denetimi (P2)
- **Ne:** İkincil/üçüncül metin (`fg-subtle/faint`) koyu zeminde **≥4.5:1** mi (büyük metin ≥3:1, SC 1.4.3); rejim/geçiş renkleri ve kenarlıklar **≥3:1** (SC 1.4.11) mi — ölç ve gereğinde aç.
- **Neden:** Koyu temada düşük-vurgu metin sık AA'nın altına düşer. (Material dark: metin ≥15.8:1 hedefler ki en yüksek katmanda bile AA geçsin.)

### 7.3 `prefers-reduced-motion` desteği (P1)
- **Ne:** Sistem "hareketi azalt" diyorsa: yağmur animasyonu, parallax, büyük geçişler kapansın/sadeleşsin (opaklık geçişine in).
- **Neden:** WCAG 2.3.3; vestibüler rahatsızlık. Tek `@media` bloğuyla çözülür.

### 7.4 Tema katmanı / elevation tutarlılığı (P2)
- **Ne:** Panel yüzeyleri için tutarlı "yükseklik = biraz daha açık yüzey" sistemi (Material dark: 0→16% beyaz overlay; Apple: base vs elevated). Modal/popover biraz daha açık.
- **Neden:** Derinlik algısı; saf siyah yerine #121212-benzeri zemin zaten var (iyi).

---

## 8. PERFORMANS

### 8.1 Film şeridi sanallaştırma (P2)
- **Ne:** 160 (ileride daha fazla) kart için pencere-render (react-window/TanStack Virtual `FixedSizeGrid`) veya en azından her karta `content-visibility:auto` + `contain-intrinsic-size` (CSS-only, ~7× render kazancı).
- **Neden:** Blueprint §13.8 "sanal liste". Şu an lazy-img yeterli ama ölçek + hover-scrub gelince DOM ağırlaşır.

### 8.2 Thumbnail & sprite üretimi (P2)
- **Ne:** Küçük thumbnail'leri ffmpeg ile önceden üret (zaten plan var); hover-scrub için klip başına tek sprite şeridi. WebP (JPEG'den ~%60–70 küçük).
- **Neden:** 160 decode maliyetini düşürür; hover-scrub'ı bedavaya getirir.

### 8.3 Video önizleme yükleme disiplini (P2)
- **Ne:** Hover'da video `src` değişimi reload yapıyor olabilir; küçük LRU önbellek + `requestIdleCallback` ile komşu klipleri ön-ısıt (WebKit'te fallback şart). Object-URL kullanılırsa `revokeObjectURL` ile sızıntıyı önle.
- **Neden:** Uzun düzenleme oturumunda bellek + akıcılık.

---

## 9. BLUEPRINT §13'TE İSTENEN AMA EKSİK/YARIM OLANLAR

| Özellik | Durum | Öncelik | Not |
|---------|-------|---------|-----|
| Arşiv / Geçmiş ekranı | Yok (`Screen='archive'` tipi var, bileşen yok) | **P1** | Geçmiş bölümler kart, "aç/yeniden kur" |
| Toplu seçim | Yok | **P1** | bkz. 2.4 |
| Gerçek stereo ses önizleme | Yarım (modal thumbnail simülasyonu) | **P3** | Tauri/backend ses I/O gerekir |
| Canlı yeniden hesap (slider → harita) | Yarım (slider'lar bağlı değil) | **P3** | Tauri + sidecar invoke gerekir |
| Profiller (stil kaydet/yükle) | Yarım ("Profil" butonu placeholder) | **P2** | localStorage ile şimdi, config.toml ile Faz 4 |
| A/B karşılaştırma (stiller) | Yok | **P2** | "önce/sonra" geçiş haritası |
| Mini-harita (ayrı overview) | Kısmi (Timeline yakın) | **P1** | bkz. 2.3 |

---

## 10. KOD SAĞLIĞI (kullanıcıya görünmez ama önemli)

- **Inspector.tsx (250 satır) çok büyük** → alt bileşenlere böl (TransitionSection/TrimSection/DecisionSection).
- **Tekrar eden `clips.find(scene)`** → tek `useClip(scene)` selector.
- **Sabitler dağınık** → `lib/constants.ts` (zoom seviyeleri, default süreler, HOLD).
- **`fetch('/episode.json')` tipsiz** → `as Manifest` veya Zod doğrulama.
- **DirectorPanel local state** → kalıcılık için store/profil (Faz 4).
- **favicon ekle** (404 gider).

---

## 11. ÖNERİLEN İLK PAKET (P0 + en yüksek değerli P1)

"Bugün/yakında" yapılırsa en çok hissedilecekler:
1. **Hover → Inspector** (1.1 / 2.1) — kullanıcının isteği, ~yarım saat.
2. **Analiz metni düzelt + favicon** (1.2, 1.6) — dürüstlük + temizlik, ~15 dk.
3. **Disabled buton + boş durum** (1.3, 3.1, 3.3) — giriş ekranı premium hissi.
4. **Stepper'ı baştan göster** (1.5).
5. **Hover-scrub (sprite)** (2.2) — "vay" etkisi, NLE hissi.
6. **Klavye odak halkaları + reduced-motion** (7.1, 7.3) — erişilebilirlik tabanı.
7. **Toplu seçim** (2.4) ve **Komut paleti** (2.5) — güç kullanıcı verimliliği.

Sonra: mini-harita (2.3), Arşiv ekranı (§9), profiller, sanallaştırma. Faz 4'e bağlı olanlar (gerçek stereo ses, canlı yeniden hesap) Tauri ile gelir.

---

## 12. EK — Web araştırmasından somut değerler & kaynaklar

Profesyonel ürünlerden doğrulanmış, doğrudan uygulanabilir sayısal değerler (yukarıdaki maddeleri besler):

**Hareket / hız (micro-interactions):**
- **Asimetrik süre:** girişler ~200–250ms, **çıkışlar daha hızlı ~150ms** (Linear `--speed-quickTransition:.1s`/`--speed-regularTransition:.25s`; Atlassian Motion). Panel açılış > kapanış.
- **Hazır easing eğrileri (Atlassian):** giriş `cubic-bezier(0,0.4,0,1)`, çıkış `cubic-bezier(0.6,0,0.8,0.6)`, günlük hover/fade `cubic-bezier(0.4,1,0.6,1)` → CSS değişkeni olarak benimse, her bileşen aynı seti kullansın.
- **Yalnız `transform`/`opacity` animasyonla** (layout tetikleyen `width/top/left` değil) → 160 klipli ekranda 60fps (Linear).
- **100ms = "anında" eşiği** (Superhuman/Paul Buchheit); her el hareketi <100ms görsel tepki. **NN/g 3 sınır: 0.1s / 1s / 10s** — 10s+ işlerde belirli (determinate) ilerleme şart.
- **Optimistic UI:** geçiş cut→fade veya klip çıkarma **anında** UI'da; manifest yazımı/hesap arkada; hata olursa geri al + uyar (Linear deseni).

**QC / inceleme iş-akışı (Frame.io, Carbon, Vimeo Review):**
- **Zaman çizelgesine iğnelenmiş QC işaretçisi:** her risk bulgusu timeline'da bir işaretçi; tıkla → playhead o riskli klibe/kareye atlar (Frame.io comment markers).
- **"Çözüldü" iş-akışı:** her riskli klip **İncelendi ✓ / Düzeltildi / Beklemede** olarak işaretlenebilsin; kullanıcı riskleri tek tek "kapatıp" bölümü güvenle göndersin (Vimeo Review notları).
- **İki-kademe risk rozeti (Carbon):** kırmızı=hata, **turuncu=ciddi uyarı, sarı=normal uyarı**, yeşil=ok; **renge tek başına güvenme** — her zaman ikon + kısa etiket (renk körlüğü, NN/g).
- **Inline kalıcı vs toast geçici:** klip-başı riskler **kalıcı inline rozet**; "Premiere'e kuruldu ✓" gibi onaylar **geçici toast**. Riskleri toast yapma (kaybolur).

**Uzun işlem / yükleme (NN/g, Smashing, Carbon):**
- **Konuşan adım etiketi:** "Klip 84/160 analiz ediliyor", "Manifest yazılıyor", "Premiere'e gönderiliyor" — çıplak yüzde yerine; **çubuk asla %99'da donmasın**.
- **Skeleton ekran:** film şeridi küçük resimleri yüklenirken gri kart placeholder (spinner'dan iyi); çok hızlı gelirse gösterip titretme.
- **Boş durum:** gerçek-veri yolu + "örnekle dene" yolu birlikte (NN/g + Loggly).

**Komut paleti (Raycast, Linear, cmdk):**
- **Sıralama:** tam eşleşme > prefix > fuzzy > **frecency (sıklık+yenilik)**; **boş palette son/sık kullanılanları** göster (her gün yapılan "Kur", "fade'e çevir" en üstte).
- **Fuzzy/bulanık arama zorunlu** (yazım hatası akışı bozmasın).

**Hover-scrub (Mux/YouTube storyboard):**
- **Sprite-sheet:** klip başına tek ızgara görsel (ör. 5×5=25 kare); hover'da `background-position` kaydır → kare başına **ağ/decode çağrısı yok**. İmleç X oranı (0–1) × süre = gösterilecek kare. **hover-intent ~150–250ms** (hızlı geçişte tetikleme yok), ~400ms sonra gerçek video sessiz döngü.

**Karanlık tema (Material, Apple HIG, WCAG):**
- Taban **#121212** (saf siyah değil); yükseklik = **beyaz overlay opaklığı** (0dp %0 → 24dp %16; pratik katmanlar ~%4/%8/%12). Accent **desature** (karanlıkta parlak/doygun yorar). Kontrast: normal metin **≥4.5:1**, büyük metin & UI bileşeni/kenar **≥3:1**. `prefers-reduced-motion`'a saygı.

> Kaynaklar (örnek): Mux/FastPix (sprite-sheet hover), Premiere/DaVinci/FCP/Descript/CapCut (timeline), Linear performance.dev + Atlassian Motion + Superhuman (hız/easing), Raycast Manual + cmdk (palette), Material Design 2 dark theme + Apple HIG + W3C WCAG 2.1/2.2 (tema/erişilebilirlik), Frame.io + Vimeo Review + Carbon + NN/g (QC/inceleme/bildirim/boş durum/ilerleme).
