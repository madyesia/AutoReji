# Referans Desenler — Dünya Standardı Araçlardan "Çalınabilir" Desenler (2025–2026)

> **Amaç:** AutoReji'nin premium koyu arayüzünü, sınıfının en iyisi yaratıcı/AI masaüstü araçlarının (Linear, Figma, Frame.io, Descript, Runway, Raycast, DaVinci Resolve, CapCut, ElevenLabs, Rive, Arc) **somut, gözlemlenmiş** desenleriyle beslemek.
> **Tarih:** 2026-07-02 · Web araştırması (birincil kaynaklar: resmi bloglar + tasarımcı yazıları). Kaynak adları/URL'ler olduğu gibi bırakıldı.
> **Efor:** S = saatlik iş (tek bileşen/CSS) · M = 1–2 gün · L = 3+ gün / mimari değişiklik.
> **Not:** AutoReji'de zaten var olan altyapıya (ink-950…500 yüzey merdiveni, amber-400 imza, `--dur-fast/base/slow`, `--ease-out-expo`, shimmer/breathe animasyonları, klip thumb + sprite üretimi) bağlanan yerler özellikle işaretlendi.

---

## A. Koyu tema yüzey / katman sistemi

### 1. Üç değişkenli tema: taban + vurgu + kontrast (LCH)
- **Kim yapıyor:** Linear — UI redesign part II ([linear.app/now/how-we-redesigned-the-linear-ui](https://linear.app/now/how-we-redesigned-the-linear-ui))
- **Ne:** Linear, tema başına 98 değişken tanımlamayı bıraktı; sadece **3 girdi** var: taban renk, vurgu renk, kontrast (30–100 arası). Tüm yüzey/metin/kenarlık tonları bu üçünden **LCH renk uzayında** türetiliyor. LCH algısal olarak düzgün olduğu için "yükseklik = açıklık adımı" kuralı her temada tutarlı çalışıyor. Ayrıca kasıtlı olarak **kromayı kıstılar** ("daha nötr ve zamansız görünüm").
- **AutoReji'ye uyum:** Ink merdiveni (950→500) zaten bu mantıkta; eksik olan **yazılı kural**: "her katman bir üst ink tonu + aynı kenarlık kuralı". Panel=ink-800, yükseltilmiş kart=ink-700, dialog/modal=ink-750+shadow-pop gibi sabit bir eşleme tablosu yaz, tüm ekranlarda tek kaynaktan uygula. İleride "tema" gerekirse (uyku modu vb.) 3 değişkenden türet.
- **Efor:** S (kural tablosu + denetim) / M (türetilmiş tema altyapısı)

### 2. Kapanabilir 3-panel iskeleti + "cep oynatıcı"
- **Kim yapıyor:** Frame.io V4 ([blog.frame.io — New Design, Smooth Navigation](https://blog.frame.io/2024/05/21/frame-io-v4-web-app-beta-feature-focus-new-design-smooth-navigation/))
- **Ne:** Sol (gezinme) / orta (oynatıcı) / sağ (yorum+özellikler) panelleri **sağ üst köşedeki üç ikonla** tek tek açılıp kapanıyor. En iyi numara: galeriye dönünce oynatıcı kaybolmuyor, **küçük "cep" versiyonu** köşede oynamaya devam ediyor. Oynatıcı kontrolleri içerik tipi ne olursa olsun **hep aynı yerde, altta sabit**.
- **AutoReji'ye uyum:** ReviewScreen (önizleme + film şeridi + Inspector) birebir bu iskelet. Inspector'ı ikonla kapatıp önizlemeye yer açma + film şeridinde gezinirken küçük önizlemenin oynamaya devam etmesi, "profesyonel kurgu masası" hissini verir. Kontrollerin sabit konumu, teknik olmayan kullanıcı için ezber yükünü sıfırlar.
- **Efor:** M

### 3. Görüntü değerlendirme alanında renk tarafsızlığı
- **Kim yapıyor:** DaVinci Resolve ([Resolve kılavuzu — UI Settings](https://www.steakunderwater.com/VFXPedia/__man/Resolve18-6/DaVinciResolve18_Manual_files/part133.htm))
- **Ne:** Resolve'un varsayılan arayüzü mavi-gri; ama renk-kritik iş için **tamamen nötr, desatüre gri** seçeneği sunar. Gerekçe açık: koyu odada renkli arayüz **gözü yanıltır**, görüntü hakkında yanlış karar verdirir. Kullanıcı forumlarında mavi cast en çok şikayet edilen şeydir.
- **AutoReji'ye uyum:** Kullanıcı ReviewScreen'de klipleri **gözle** değerlendiriyor. Kural: video önizleme penceresinin **hemen çevresi** en koyu ve en nötr yüzey (ink-950, sıfır renk tonu); amber glow, rejim renkleri ve renkli rozetler videonun kenarına **değmesin** (en az 16–24px nötr tampon). Amber imza kalır ama monitör alanına sızmaz.
- **Efor:** S

### 4. Başlıkta ifade, gövdede okunurluk: Inter Display ayrımı
- **Kim yapıyor:** Linear ([linear.app/now/how-we-redesigned-the-linear-ui](https://linear.app/now/how-we-redesigned-the-linear-ui))
- **Ne:** Başlıklarda **Inter Display** (daha dar aralıklı, ekran başlığı için çizilmiş optik kesim), gövde metinde normal Inter. Tek aile, iki optik boyut; ucuz ama görünür bir "pahalı ürün" sinyali.
- **AutoReji'ye uyum:** Zaten Inter Variable gömülü; `font-optical-sizing`/Display kesimiyle ekran başlıklarını (örn. "Bölüm hazır", analiz ekranı başlığı) ayrıştırmak offline ve bedava. Negatif letter-spacing (-0.01/-0.02em) sadece başlıkta.
- **Efor:** S

---

## B. AI pipeline / uzun iş ilerleme deneyimi

### 5. Aşama listesi: her aşama sabrı sıfırlar
- **Kim yapıyor:** AI ürünleri geneli; desen dokümantasyonu: [particula.tech — Long-Running AI Tasks](https://particula.tech/blog/long-running-ai-tasks-user-interface-patterns), [uxpatterns.dev — AI Loading States](https://uxpatterns.dev/patterns/ai-intelligence/ai-loading-states)
- **Ne:** Uzun işi tek çubuk yerine **görünür aşamalara böl**: "Belge okunuyor → Öğeler çıkarılıyor → İlişkiler analiz ediliyor → Özet üretiliyor". Her aşama geçişi kullanıcıya "taze bilgi" verdiği için **sabır sayacını sıfırlar**. Biten aşamaya kalıcı tik, aktif olana canlı gösterge.
- **AutoReji'ye uyum:** AnalysisScreen'in aşama-aşama dolum+tik yapısı zaten bu desenin üstünde. Cilalanacak yer: aşama adlarını kullanıcı diliyle yaz ("Klipler taranıyor · 42/163" gibi **sayaçlı**), biten aşamanın süresini küçük yaz (güven verir), aktif aşamada mevcut shimmer'ı kullan.
- **Efor:** S

### 6. Dürüst ETA: aralık ver, sahte kesinlik verme
- **Kim yapıyor:** [particula.tech](https://particula.tech/blog/long-running-ai-tasks-user-interface-patterns) ("Typically completes in 30–60 seconds"), [uxpatterns.dev](https://uxpatterns.dev/patterns/ai-intelligence/ai-loading-states) ("bitiş zamanını bilir gibi yapma"); Runway da kuyruğunu dürüst adlandırır: Explore Mode "daha yavaş, değişken öncelikli kuyruk" diye açıkça yazar ([help.runwayml.com](https://help.runwayml.com/hc/en-us/articles/32881061675795-Why-is-my-generation-stuck))
- **Ne:** "%73" gibi uydurma kesinlik yerine **aralık + güncelleme**: "Genelde 3–5 dk sürer" ile başla, veri geldikçe daralt. Kural: tahminde **hoş sürpriz yönünde** yanıl (erken bitsin, geç değil). Süre 10 sn'yi aşan her işte yüzde + durum metni birlikte ([pencilandpaper.io eşikleri](https://www.pencilandpaper.io/articles/ux-pattern-analysis-loading-feedback): 1 sn altı hiçbir gösterge, 1–3 sn spinner/skeleton, 3–10 sn belirli çubuk, 10 sn üstü yüzde+durum).
- **AutoReji'ye uyum:** 160 klip analizi dakikalar sürüyor. İlk çalıştırmada "Genelde ~4 dk" (kalibre edilmiş gerçek ortalamadan), sonraki bölümlerde önceki koşuların gerçek süresinden hesapla — tamamen offline yapılabilir. Sahte yüzde asla.
- **Efor:** S

### 7. Gerçek işin görselleştirilmesi: analiz akarken kareler aksın
- **Kim yapıyor:** [particula.tech](https://particula.tech/blog/long-running-ai-tasks-user-interface-patterns) ("contextual activity visualization" — animasyonu gerçek işe bağla); Descript Underlord da ajan işini arka planda görünür adımlarla yürütür ([descript.com/underlord](https://www.descript.com/underlord), [help.descript.com](https://help.descript.com/hc/en-us/articles/36803785502221-Underlord-beta-Your-AI-co-editor-in-Descript))
- **Ne:** Soyut spinner yerine **o anda işlenen gerçek içerik** gösterilir: metin üretiminde kelimeler, görüntü analizinde taranan kare. Kullanıcı "makine gerçekten benim dosyalarımla uğraşıyor" diye görür; güven ve algılanan hız artar.
- **AutoReji'ye uyum:** Sidecar zaten her klip için thumb üretiyor. Analiz ekranında **işlenen klibin karesi + dosya adı** küçük bir şeritte aksın ("şimdi: 00166 … enerji ölçülüyor"); biten klipler minik mozaik olarak birikssin. "Sahte yok — gerçek + doğrula" ilkesinin görsel hâli; teknik bilmeyen kullanıcıya en ikna edici ilerleme kanıtı.
- **Efor:** M

### 8. Durum yaşam döngüsü sözlüğü + hatada "sıradaki en iyi eylem"
- **Kim yapıyor:** [uxpatterns.dev — AI Loading States](https://uxpatterns.dev/patterns/ai-intelligence/ai-loading-states)
- **Ne:** İsimlendirilmiş durumlar: bekliyor / doğruluyor / çalışıyor / akıyor / tamamlandı / **kesildi** / **hata**. Anti-desen: durumu gizlemek. Hata olduğunda genel "bir şeyler ters gitti" yasak; **ne bozulduğunu söyle, kısmi sonucu koru, tek tık çözüm sun** (yeniden dene / bu klibi atla / raporu kopyala). "Hatadan sonra yeniden denemek hiçbir işi kaybettirmesin."
- **AutoReji'ye uyum:** Pipeline Türkçe durum sözlüğüne bağlansın; bozuk tek klip tüm bölümü düşürmesin ("163 klip tamam, 2 klip atlandı — gör" deseni). Manifest kısmi yazılabildiği için "kaldığı yerden devam" mümkün.
- **Efor:** M

### 9. Arka plana alma merdiveni: 15/30/60 saniye
- **Kim yapıyor:** [particula.tech](https://particula.tech/blog/long-running-ai-tasks-user-interface-patterns)
- **Ne:** 15. saniyede sessiz bir "Arka planda sürsün mü?" seçeneği belirir; 30. saniyede belirginleşir; 60. saniyede tahmini bitişle birlikte **proaktif** önerilir. Bitince sistem bildirimi + yumuşak ses.
- **AutoReji'ye uyum:** Kullanıcı analizi başlatıp çayını demlemeye gidebilmeli. Tauri'de pencere küçültme + macOS bildirimi ("Bölüm 9 hazır — incelemeye geç") tamamen yerel. ASMR kanalına uygun tek yumuşak "tamamlandı" sesi.
- **Efor:** M

---

## C. Medya inceleme çalışma alanı

### 10. Hover-scrub: kartın üstünde gezince klipin içi görünür
- **Kim yapıyor:** Frame.io V4 ("Hover Scrub" — [blog.frame.io](https://blog.frame.io/2024/05/21/frame-io-v4-web-app-beta-feature-focus-new-design-smooth-navigation/)); oynatıcı zaman çizgisinde de imleçle **kare önizlemesi** ([blog.frame.io — Player and Commenting](https://blog.frame.io/2024/05/28/frame-io-v4-features-player-and-commenting/))
- **Ne:** Galeri kartında fare yatay gezdikçe klipin farklı kareleri gösterilir (sprite tabanlı, video yüklemeden). Zaman çizgisinde hover = o anın karesi baloncukta.
- **AutoReji'ye uyum:** Sprite üretimi zaten var. Film şeridi kartlarında hover-scrub, teknik olmayan kullanıcının 160 klipi **tıklamadan** taramasını sağlar — inceleme süresini ciddi kısaltır. Timeline hover'ında kare baloncuğu ikinci adım.
- **Efor:** M (sprite hazır olduğundan çoğu iş frontend)

### 11. Yazarken otomatik duraklat, gönderince odağı oynatıcıya iade et
- **Kim yapıyor:** Frame.io V4 ([blog.frame.io — Player and Commenting](https://blog.frame.io/2024/05/28/frame-io-v4-features-player-and-commenting/))
- **Ne:** Yorum kutusuna yazmaya başlayınca video **kendiliğinden durur** (detay kaçmasın); yorum gönderilince klavye odağı **oynatıcıya geri döner**, boşluk tuşu yine oynat/durdur olur. Küçük ama "bu araç beni anlıyor" dedirten kural.
- **AutoReji'ye uyum:** Inspector'da not/karar alanına yazarken önizleme dursun; Enter/ESC sonrası odak önizlemeye dönsün. Tek kullanıcılı akışta bile aynı rahatlama etkisi.
- **Efor:** S

### 12. Önbellek-önce render + iyimser güncelleme (50 ms hissi)
- **Kim yapıyor:** Linear (etkileşim hedefi ~50 ms, görünüm geçişi <100 ms — [performance.dev](https://performance.dev/how-is-linear-so-fast-a-technical-breakdown)); Frame.io V4 ("optimistic updates" — [blog.frame.io](https://blog.frame.io/2024/05/21/frame-io-v4-web-app-beta-feature-focus-new-design-smooth-navigation/)); Raycast geliştirici kuralı: "bileşeni hemen çiz, veriyi sonra doldur; ağ düşerse önbelleği göster" ([developers.raycast.com/information/best-practices](https://developers.raycast.com/information/best-practices))
- **Ne:** Ekran **asla boş bekletilmez**: iskelet + son bilinen veri anında gelir, taze veri arkadan yerine oturur. Kullanıcı eylemi (onay, işaretleme) diske yazılmadan **önce** arayüzde tamamlanmış görünür.
- **AutoReji'ye uyum:** ArchiveScreen ve ReviewScreen açılışta son manifest'i anında göstersin; klip onay/işaretleme tıklamaları anlık işlesin, dosya yazımı arkada. Yerel dosya sistemiyle çalıştığı için "iyimser" olmak neredeyse risksiz.
- **Efor:** M

---

## D. Klavye-önce ve komut deseni

### 13. Tek harf kısayollar + arayüzün kendisi kısayolu öğretir
- **Kim yapıyor:** Linear (C, ., G+I gibi tek/akor kısayollar); Todoist/⌘K bar anatomisi: satırın sağında kısayol ipucu göstererek öğretmek ([maggieappleton.com/command-bar](https://maggieappleton.com/command-bar)); cmdk kütüphanesi Linear/Raycast/Vercel'de standart ([shadcn.io/ui/command](https://www.shadcn.io/ui/command))
- **Ne:** Sık eylemler tek harfe bağlanır; menü/butonların yanında kısayol rozeti hep görünür durur, kullanıcı farkında olmadan ezberler. ⌘K paleti bulanık arama + **en üstte son kullanılanlar** ile çalışır.
- **AutoReji'ye uyum:** Tam palet şart değil (kullanıcı teknik değil) ama inceleme ekranında **J/K önceki-sonraki klip, Boşluk oynat/durdur, A onayla** + butonlarda görünür tuş rozetleri, 160 klip incelemesini oyun rahatlığına getirir. Rozetler amber-200/ink-600 çipler olarak mevcut dile oturur.
- **Efor:** S (kısayol+rozet) / L (tam ⌘K paleti — şimdilik gereksiz)

### 14. Sık eyleme animasyon yok; seçim tek "blink" ile onaylanır
- **Kim yapıyor:** Rauno Freiberg (Linear tasarımcısı) — [rauno.me/craft/interaction-design](https://rauno.me/craft/interaction-design)
- **Ne:** Komut menüsü/palet **bilerek animasyonsuz** açılır — günde yüzlerce kez kullanılan şeyde animasyon "bilişsel yük"tür. macOS bağlam menüsü kuralı: menü anında açılır, seçilen öğe **vurgu rengiyle bir kez kısacık yanıp söner**, menü kapanırken hafifçe erir. Onay hissi animasyondan değil bu tek blink'ten gelir.
- **AutoReji'ye uyum:** Film şeridinde klip değiştirme, Inspector alan geçişleri gibi **yüksek frekanslı** etkileşimlerde giriş animasyonlarını kaldır/`--dur-fast`a indir; klip onaylandığında kartta tek amber blink. "Premium = her yerde animasyon" yanılgısının panzehiri.
- **Efor:** S

---

## E. Kutlama / tamamlanma anı

### 15. Tek zirve kuralı: konfeti yalnız "bölüm kuruldu" anında
- **Kim yapıyor:** Raycast — Confetti komutu (ekranı dolduran konfeti + isteğe bağlı tezahürat sesi; CEO'nun gerçek konfeti topu reddedilince yazdığı komut — [raycast.com/changelog](https://www.raycast.com/changelog), [stefanjudis.com](https://www.stefanjudis.com/notes/a-raycast-confetti-shell-command/)). Sınır çizen kaynak: [uxdesign.cc — The over-confetti-ing of digital experiences](https://uxdesign.cc/the-over-confetti-ing-of-digital-experiences-af523745db19) (FEAT çerçevesi: kullanıcının **uğrunda çalıştığı** an ise konfeti; gündelik olaysa asla).
- **Ne:** Kutlama tek ve büyük anda patlar; ara adımlar (dosya seçildi, analiz bitti) sadece sakin tik alır. Konfeti 1,5–2 sn, `prefers-reduced-motion`a saygılı, tekrar tetiklenmez.
- **AutoReji'ye uyum:** Kullanıcının günlük zirvesi **"Premiere'de kuruldu"** (BuildScreen başarı anı). Amber/altın tonlu, seed'li (bölüm adından üretilen deterministik desen — projenin seed ilkesiyle uyumlu), tamamen offline canvas konfeti + tek yumuşak ses. Analiz bitişi ise sakin kalır: yalnız tik + review'a akış.
- **Efor:** S

---

## F. Onboarding / ilk kullanım

### 16. Tur değil: kontrol listesi + öğreten boş-durumlar + erken özgürlük
- **Kim yapıyor:** Arc Browser (hızlı kişiselleştirme, özellik bombardımanı yok, kullanıcıyı beklenenden **erken serbest bırakma** — [saasui.design/pattern/onboarding/arc-browser](https://www.saasui.design/pattern/onboarding/arc-browser), [howtheygrow.co](https://www.howtheygrow.co/p/how-arc-grows)); sektör verisi: turlar 45 sn'yi geçmesin, atlanabilir olsun; kontrol listesi **tek net eyleme** işaret etsin; boş-durum ekranı en iyi öğretmen ([appcues.com/blog/user-onboarding-ui-ux-patterns](https://www.appcues.com/blog/user-onboarding-ui-ux-patterns), [flowjam.com](https://www.flowjam.com/blog/saas-onboarding-best-practices-2025-guide-checklist))
- **Ne:** Overlay balon turu yerine: (a) kurulum ekranı zaten kontrol listesidir, (b) her boş ekran "burada ne olacak + tek buton" anlatır, (c) ipuçları bağlamında, o özelliğe ilk dokunuşta belirir.
- **AutoReji'ye uyum:** SetupScreen'in 3 maddelik Hazırlık listesi doğru omurga. Eksik olan: IntakeScreen/ArchiveScreen boş-durumlarının **tek cümle + tek eylem** anlatması ("Henüz bölüm yok. Prompt belgesini sürükle — gerisini AutoReji kurar."). Balonlu tur ekleme; kullanıcı kuralı gereği elle adımlar zaten sohbetle tarif ediliyor.
- **Efor:** S

---

## G. Mikro-etkileşim imzası

### 17. Motion bütçesi: <300 ms, ease-out, yalnız transform+opacity
- **Kim yapıyor:** Emil Kowalski (Sonner/Vaul yazarı) — [emilkowal.ski/ui/great-animations](https://emilkowal.ski/ui/great-animations)
- **Ne:** Somut kurallar: standart animasyon **300 ms altı**; `ease-out` = "hızlı tepki" hissi; klavyeyle tekrarlanan eylemlere animasyon **yok**; yalnız `transform` ve `opacity` (60 fps garantisi, layout tetikleyen padding/margin animasyonu yasak); her şey aynı anda animasyonlıysa hiçbir şey hissedilmez; `prefers-reduced-motion` şart.
- **AutoReji'ye uyum:** Mevcut `--dur-fast:130 / --dur-base:220 / --dur-slow:360` + `--ease-out-expo` bu bütçeye zaten uygun — kural olarak yaz ve denetle: 360 ms yalnız sahne girişlerinde, hover'da hep 130 ms, film şeridi gezinmesinde 0. Reduced-motion medya sorgusu tüm keyframe'lere eklenmeli.
- **Efor:** S

### 18. Tek toast'un yaşam döngüsü: Çalışıyor → Başarılı/Hata (aynı balon güncellenir)
- **Kim yapıyor:** Raycast — Toast API ([developers.raycast.com/api-reference/feedback/toast](https://developers.raycast.com/api-reference/feedback/toast), [best-practices](https://developers.raycast.com/information/best-practices))
- **Ne:** Async iş başlarken `Animated` stilinde tek toast çıkar; iş bitince **aynı toast** Success/Failure stiline dönüşür (yeni toast yığını oluşmaz). Toast eylem taşıyabilir: iptal, geri al, hata detayını kopyala. Felsefe: "beklenen hatalar akışı kesmesin — ağ düştüyse önbelleği göster, toast'la bildir".
- **AutoReji'ye uyum:** Manifest yazımı, arşive kopyalama, panel testi gibi kısa async işler için tek-toast yaşam döngüsü + "Geri al / Klasörü aç" eylemi. Modal hata pencereleri yalnız gerçekten akışı durduran sorunlara kalsın.
- **Efor:** S

### 19. Durum canlısı: pipeline'ın "nefes alan" tek göstergesi
- **Kim yapıyor:** ElevenLabs UI — Orb bileşeni (ajan durumunu dinliyor/düşünüyor/konuşuyor olarak yansıtan, veri akışına senkron SVG animasyonu — [elevenlabs.io/blog/elevenlabs-ui](https://elevenlabs.io/blog/elevenlabs-ui), [ui.elevenlabs.io](https://ui.elevenlabs.io/)); Rive — durum makinesi yaklaşımı: idle/hover/çalışıyor durumları arasında koşullu geçiş yapan tek grafik ([rive.app](https://rive.app/))
- **Ne:** Ajanın/motorun durumu metin loglarıyla değil, **tek küçük canlı formla** anlatılır: boşta yavaş nefes alır, çalışırken hızlanır/parlar, bitince durulur. Durum makinesi mantığı: her durumun ayrı animasyonu, geçişler koşullu.
- **AutoReji'ye uyum:** Mevcut `breathe` animasyonu tohum olarak hazır. Başlık çubuğunda küçük amber küre: boşta 4,5 sn'lik sakin nefes; analizde tempo artar + shimmer; hatada danger tonuna döner. Kullanıcı hangi ekranda olursa olsun "beyin ne yapıyor" sorusunun tek bakışlık cevabı. Yağmur/ASMR ruhuna uygun, sessiz bir canlılık.
- **Efor:** M

---

## 2026 trend notları — neyden KAÇIN (artık eskimiş / yanlış sinyal)

1. **Her adımda konfeti/rozet (aşırı oyunlaştırma).** 2020–2023 modası; pro araçlarda güven kaybettiriyor. Kutlama tek zirveye ([uxdesign.cc — over-confetti-ing](https://uxdesign.cc/the-over-confetti-ing-of-digital-experiences-af523745db19)).
2. **Sahte yüzde ve sahte kesin ETA.** AI çağının normu dürüst belirsizlik: aralık + aşama + iptal hakkı ([uxpatterns.dev](https://uxpatterns.dev/patterns/ai-intelligence/ai-loading-states)). "%73'te takılı çubuk" 2026'da ucuzluk sinyali.
3. **Mor-mavi "AI gradyanı" + neon glow bombardımanı.** 2023–24 üretken-AI klişesi. 2025–26 yönü nötr, düşük kromalı, içerik-öncelikli yüzeyler (Linear'ın bilinçli kroma kısması, Frame.io Vapor/LCH). AutoReji'nin amber imzası zaten bu klişenin dışında — koru, yaygınlaştırma.
4. **Uzun, atlanamaz balonlu ürün turları.** 45 sn üstü tur = terk; kontrol listesi + boş-durum kazandı ([flowjam.com](https://www.flowjam.com/blog/saas-onboarding-best-practices-2025-guide-checklist)).
5. **Her elemanda yaylı/zıplayan animasyon.** Frekans kuralı: sık kullanılan şey animasyonsuz; yay yalnız vurgu girişlerinde ([rauno.me](https://rauno.me/craft/interaction-design), [emilkowal.ski](https://emilkowal.ski/ui/great-animations)).
6. **10+ sn belirsiz spinner.** 10 sn üstü her iş yüzde + durum metni + arka plan seçeneği ister ([pencilandpaper.io](https://www.pencilandpaper.io/articles/ux-pattern-analysis-loading-feedback)).
7. **HSL'den elle tema türetme.** Endüstri LCH/OKLCH'ye geçti (Linear, Frame.io Vapor); koyu temada tutarlı katman ancak algısal uzayda kurulur.
8. **Görüntü alanına sızan renkli arayüz.** Kurgu/renk araçlarında UI, medyanın algısını bozamaz — Resolve'un nötr gri ilkesi kalıcı standart.
9. **Her yerde cam/blur (glassmorphism enflasyonu).** Figma UI3 bile "hover'da beliren süper-minimal UI" denemesini "çalışma ortamını istikrarsızlaştırıyor" diye reddetti ([figma.com/blog/behind-our-redesign-ui3](https://www.figma.com/blog/behind-our-redesign-ui3/)); cam etkisi yalnız geçici katmanlarda (dialog, palet), kalıcı panellerde opak yüzey.
10. **"Boş ekran + spinner" açılışlar.** 2026 standardı önbellek-önce: son bilinen içerik anında, tazesi arkadan (Linear, Frame.io, Raycast).

---

## Hızlı uygulama sırası önerisi (efora göre)

| Öncelik | Desen | Efor |
|---|---|---|
| 1 | #6 Dürüst ETA + #5 sayaçlı aşamalar (AnalysisScreen cilası) | S |
| 2 | #11 Yazarken duraklat + odak iadesi | S |
| 3 | #13 J/K/Boşluk/A kısayolları + görünür tuş rozetleri | S |
| 4 | #15 "Bölüm kuruldu" amber konfetisi (seed'li, offline) | S |
| 5 | #3 Önizleme çevresinde nötr tampon | S |
| 6 | #14 Sık eylemde animasyon kısıtı + onay blink'i | S |
| 7 | #17 Motion bütçesi denetimi + reduced-motion | S |
| 8 | #18 Tek-toast yaşam döngüsü | S |
| 9 | #10 Film şeridinde hover-scrub (sprite hazır) | M |
| 10 | #7 Analizde gerçek kare akışı | M |
| 11 | #8 Durum sözlüğü + klip-atla hata akışı | M |
| 12 | #12 Önbellek-önce açılış | M |
| 13 | #19 Durum canlısı (amber küre) | M |
| 14 | #2 Kapanabilir paneller + cep önizleme | M |
| 15 | #9 Arka plan merdiveni + macOS bildirimi | M |
| 16 | #1 Yüzey kural tablosu (S) / türetilmiş tema (M) | S–M |

---

## Kaynakça (tümü)

- Linear: https://linear.app/now/how-we-redesigned-the-linear-ui · https://performance.dev/how-is-linear-so-fast-a-technical-breakdown
- Figma UI3: https://www.figma.com/blog/behind-our-redesign-ui3/
- Frame.io V4: https://blog.frame.io/2024/05/21/frame-io-v4-web-app-beta-feature-focus-new-design-smooth-navigation/ · https://blog.frame.io/2024/05/28/frame-io-v4-features-player-and-commenting/
- Raycast: https://developers.raycast.com/information/best-practices · https://developers.raycast.com/api-reference/feedback/toast · https://www.stefanjudis.com/notes/a-raycast-confetti-shell-command/
- Rauno Freiberg: https://rauno.me/craft/interaction-design
- Emil Kowalski: https://emilkowal.ski/ui/great-animations
- AI yükleme desenleri: https://uxpatterns.dev/patterns/ai-intelligence/ai-loading-states · https://particula.tech/blog/long-running-ai-tasks-user-interface-patterns · https://www.pencilandpaper.io/articles/ux-pattern-analysis-loading-feedback
- Descript Underlord: https://www.descript.com/underlord · https://help.descript.com/hc/en-us/articles/36803785502221-Underlord-beta-Your-AI-co-editor-in-Descript
- Runway (kuyruk dürüstlüğü): https://help.runwayml.com/hc/en-us/articles/32881061675795-Why-is-my-generation-stuck
- ElevenLabs UI: https://elevenlabs.io/blog/elevenlabs-ui · https://ui.elevenlabs.io/
- Rive: https://rive.app/
- DaVinci Resolve UI: https://www.steakunderwater.com/VFXPedia/__man/Resolve18-6/DaVinciResolve18_Manual_files/part133.htm
- CapCut arayüz analizi: https://cardsrealm.com/en-us/articles/reviewing-capcuts-user-interface-intuitive-design-for-seamless-editing
- Komut paleti: https://maggieappleton.com/command-bar · https://www.shadcn.io/ui/command
- Onboarding: https://www.saasui.design/pattern/onboarding/arc-browser · https://www.howtheygrow.co/p/how-arc-grows · https://www.appcues.com/blog/user-onboarding-ui-ux-patterns · https://www.flowjam.com/blog/saas-onboarding-best-practices-2025-guide-checklist
- Kutlama sınırı: https://uxdesign.cc/the-over-confetti-ing-of-digital-experiences-af523745db19

> Bu belge yalnız referans/spec'tir; kod değişikliği içermez. Uygulama kararları `docs/UI_GELISTIRME_FIKIRLERI.md` yol haritasına işlenmeli.
