# Türkçe Mikro-Kopya Denetimi — tam tarama (2026-07-02)

> **Kapsam:** `brain/src` altındaki TÜM kullanıcıya görünen metinler + `panel/` (UXP) + pencere başlığı. Bu tarama, `docs/UI_UX_DENETIM_2026-07-02.md` raporunun E2/E3 maddelerinin devamı ve tamamlayıcısıdır. **Durum: SADECE PLANLAMA — hiçbir kod değişmedi.**
> **Ton hedefi:** sıcak, samimi ama premium ve net; teknik jargon YOK. Kullanıcı kod/teknik bilmiyor.
> Sorunsuz metinler listelenmedi (arşiv boş-durumu, Hazırlık metinleri, toast'ların çoğu zaten çok iyi).

---

## 1) Sorunlu metin tablosu

Öncelik: 🔴 = yanıltıcı/yanlış (önce düzelt) · 🟡 = jargon/tutarsız · ⚪ = cila.

### 🔴 Doğruluk sorunları (kopya gerçeği yansıtmıyor — "sahte yok" ilkesi)

| Yer | Mevcut metin | Sorun | Önerilen yeni metin | Gerekçe |
|---|---|---|---|---|
| `screens/BuildScreen.tsx:151-152` | "Bölüm kuruldu 🌧️" + "Premiere'de native stereo, düzenlenebilir, render'sız timeline hazır." | **Henüz Premiere'de hiçbir şey kurulmadı** — bu ekran sadece manifesti hazırlar; gerçek kurulum MONTAJCI panelinde olur. | Başlık: "Bölüm kuruluma hazır". Gövde: "Kurgu planın tamam. Şimdi manifest dosyasını kaydet ve MONTAJCI panelinde aç — Premiere zaman çizelgesini render almadan, native stereo kurar." | Kullanıcı "kuruldu" sanıp Premiere'i açınca boş proje görür; güven kırılır. |
| `screens/BuildScreen.tsx:139-140` | "Kuruluyor…" + "UXP paneli timeline'ı kuruyor · render yok" | Aynı yanılgı: bu anda UXP paneli hiçbir şey yapmıyor (3.6 sn'lik hazırlık animasyonu) + "UXP"/"timeline" jargon. | "Hazırlanıyor…" + "Kurgu planı ve manifest hazırlanıyor · render yok" | Dürüst + jargonsuz. |
| `screens/BuildScreen.tsx:14` | "Klipler import ediliyor (native stereo)", "Sequence kuruluyor", "Boşluklar kapatılıyor (tick-tam)", "Geçişler ekleniyor (ortalı)", "Crop · intro/outro" | Adımlar Premiere'de OLACAK işleri "şimdi oluyor" gibi gösteriyor + "import/Sequence/tick-tam/Crop" jargon. | "Klip listesi hazırlanıyor", "Kurgu sırası diziliyor", "Boşluk kontrolü planlanıyor", "Geçişler yerleştiriliyor", "Çerçeve + giriş-çıkış ayarı" | Plan hazırlığı diliyle dürüstleşir, jargon gider. |
| `screens/IntakeScreen.tsx:109` | "Sürükle-bırak veya tıkla" | **Sürükle-bırak kodda yok** (hiçbir onDrop yok) — boş vaat. | "Örneği yüklemek için tıkla" (tarayıcı) / "Seçmek için tıkla" (.app — zaten var) | Çalışmayan etkileşim vaadi güven bozar. |
| `screens/SetupScreen.tsx:466` | Buton: "MONTAJCI'yı Kur" | Buton yalnızca **indirir** (kurulumu kullanıcı çift-tıkla yapar) — toast bile "indirildi · çift-tıkla kur" diyor. | "MONTAJCI'yı İndir" | Buton adı yaptığı işi söylemeli; "Kur" deyip kurmamak kafa karıştırır. |
| `screens/SetupScreen.tsx:207-208` ↔ `413` | Premiere kartı: "…**geliştirici modu** gerekir" + "Enable Developer Mode işaretle" ↔ MONTAJCI kartı: "…**geliştirici modu gerekmez**" | **İki kart birbiriyle çelişiyor.** `.ccx` CC ile kurulduğu için büyük olasılıkla gerekmiyor; hangisi doğruysa TEK hikâye kalmalı. | Doğrusu ".ccx → gerekmez" ise Premiere kartı: "MONTAJCI paneli için Premiere Pro 25.6 veya üstü yeterli — ek ayar gerekmez." (adımlardan Developer Mode'u çıkar) | Kullanıcı gereksiz ayar kurcalar ya da neye güveneceğini bilemez. ⚠️ Teknik doğrulama şart (gerçek Premiere'de test). |
| `screens/SetupScreen.tsx:207` | "(sende 2026 var ✓)" | Statik metin — sistem daha tespit etmeden "sende var" iddia ediyor. | "(Premiere Pro 2026 bu şartı karşılar)" | İddia yerine bilgi; tespit sonucu zaten rozette görünüyor. |
| `lib/store.ts:161` | 'Bu kaydın manifest yolu yok — önce "Farklı Kaydet" ile kaydet' | **"Farklı Kaydet" diye bir buton yok** (gerçek buton: "Manifest'i Kaydet"). | Bkz. §4 yeniden yazım #3 | Var olmayan butona yönlendirme = çıkmaz sokak. |
| `panel/index.html:914` | "**Brain**'in ürettiği manifest.json'u seç…" | "Brain" iç kod adı — kullanıcı bunu hiç görmedi; ürün adı AutoReji. | "AutoReji'nin ürettiği <b>manifest.json</b>'u seç ya da içeriğini yapıştır." | İç terminoloji kullanıcıya sızmamalı. |

### 🟡 Jargon / İngilizce kalıntı / tutarsızlık

| Yer | Mevcut metin | Sorun | Önerilen yeni metin | Gerekçe |
|---|---|---|---|---|
| `screens/IntakeScreen.tsx:73` | "Yeni bölüm · cozy yağmur ASMR" | Hardcoded örnek metin (önceki denetim E3) + "cozy" İngilizce. | Belge seçilince addan türet; boşken: "Yeni bölüm · yağmurlu Ghibli akşamı" | Sabit yazı kişiselliği öldürüyor; "cozy" tona yabancı. |
| `screens/IntakeScreen.tsx:27` | "Çift çekim varyantları çözüldü" · detay "çoklu çekimde 1080p tercih edildi" | "çift çekim" + "varyant" açıklamasız jargon (E2). | "Yedek çekimler ayıklandı" · detay "aynı sahnenin birden çok videosundan en iyisi (1080p) seçildi" | Kullanıcı dili; tooltip'e gerek kalmaz. |
| `screens/IntakeScreen.tsx:28` | "sahne 115 işaretlendi (ffprobe)" | "ffprobe" araç adı (E2). | "sahne 115 işaretlendi" (paranteze gerek yok) | Araç adı kullanıcıya hiçbir şey söylemez. |
| `screens/IntakeScreen.tsx:127` | "…analiz adımında her klipten çıkarılır (ffprobe + prompt eşleştirme)" | Aynı ffprobe sızıntısı. | "…analiz adımında her klip tek tek incelenerek çıkarılır" | — |
| `screens/IntakeScreen.tsx:101` (ve 16, 20) | Badge "opsiyonel" | Yabancı kökenli; sıcak ton için sert. | "isteğe bağlı" | Daha yumuşak, öz Türkçe; 3 yerde birden değişmeli (tutarlılık). |
| `screens/IntakeScreen.tsx:21` | "geçiş ve kırpmaları kurar" | "kırpmayı kurmak" doğal Türkçe değil. | "geçişleri ve kırpmaları ayarlar" | Fiil-nesne uyumu. |
| `screens/AnalysisScreen.tsx:17` | alt yazı "varyant + ffprobe sağlık" | ffprobe + "sağlık" tuhaf; "varyant" jargon. | "yedek çekim seçimi · dosya kontrolü" | — |
| `screens/AnalysisScreen.tsx:19` | "hareket · QC · orta kare" | "QC" İngilizce kısaltma. | "hareket · kalite kontrol · orta kare" | Aynı ekranda başka yerde "kalite kontrol" yazılıyor zaten. |
| `screens/AnalysisScreen.tsx:21` | "Geçiş kararları + manifest" · "durum makinesi + ritim" | "manifest" burada gereksiz + "durum makinesi" (state machine!) saf mühendislik. | "Geçiş kararları" · "kurgu kuralları + ritim" | Kullanıcının göreceği son aşama adı sade olmalı. |
| `screens/AnalysisScreen.tsx:165` | "tamamen yerel, offline" | "offline" İng.; `motifs.tsx` "Çevrimdışı" diyor. | "tamamen yerel, çevrimdışı" | Tek terim: **çevrimdışı** (bkz. §2). |
| `screens/SetupScreen.tsx:275, 304, 323, 336` | "tamamen offline", "yerel/offline", "sonra offline", "offline çalışır" | Aynı tutarsızlık ×4. | "çevrimdışı" | — |
| `screens/SetupScreen.tsx:275` | "qwen2.5-VL 7B · 6.0 GB · Q4_K_M" | "Q4_K_M" saf jargon; model adı kalabilir (dosya gerçeği). | "qwen2.5-VL 7B · 6.0 GB · sıkıştırılmış sürüm" | Anlamsız kod yerine ne işe yaradığı. |
| `screens/SetupScreen.tsx:298` | "Ollama indiriyor · gerçek" | "· gerçek" geliştirici iç güvencesi — kullanıcı için anlamsız. | "Ollama üzerinden indiriliyor" | İç kalite etiketi UI'a sızmış. |
| `screens/SetupScreen.tsx:413` | Badge ".ccx · imzasız · geliştirici modu gerekmez · offline" | "imzasız" kullanıcıda **güvensizlik** çağrıştırır; ".ccx" jargon. | "tek dosya · çift tıkla kurulur · internet gerekmez" | Aynı bilgiyi güven veren dille söyler. |
| `screens/BuildScreen.tsx:112` | "seed: a1b2c3…" | "seed" jargon (Arşiv'de de `ArchiveScreen.tsx:172` "seed …"). | "kurgu kodu: a1b2c3…" + Tip: "Aynı girdiyle aynı kurguyu yeniden üretir" | Tekrarlanabilirlik değerini kullanıcıya da anlatır. |
| `screens/BuildScreen.tsx:118` & `components/AboutDialog.tsx:7` | "tek katman, L≠R — ASMR kesintisiz/önceliği" | "L≠R" kriptik. | "tek ses katmanı, sol-sağ gerçek stereo — ASMR kesintisiz" | Premium ama anlaşılır. |
| `screens/BuildScreen.tsx:120, 152` | "kayıpsız timeline", "render'sız timeline" | "timeline" İng.; `Timeline.tsx:32` "zaman çizelgesi" diyor. | "kayıpsız zaman çizelgesi" | Tek terim: **zaman çizelgesi** (Premiere menü adları İngilizce kalır). |
| `components/AboutDialog.tsx:10` | "karar image promptlardan" | "image prompt" İng.; her yerde "Görsel Prompt". | "karar görsel promptlardan" | Tek terim: **görsel prompt**. |
| `components/review/Inspector.tsx:108-109` | Badge "ACTION" / "ENV" | Ham İngilizce sinyal kodları UI'da. | "hareket sahnesi" / "ortam sahnesi" | Karar açıklaması Türkçe akarken iki İngilizce rozet sırıtıyor. |
| `components/review/Inspector.tsx:136-138` | "Varyant seçimi" · "Aday: {n} çekim" | "varyant" jargon; Filmstrip "aday çekim" diyor (iyi). | Başlık: "Çekim seçimi" · "Aday çekim: {n}" | Tek terim ailesi: **çekim / aday çekim / yedek çekim**. |
| `components/review/Inspector.tsx:200-201` | "Baş (in)" / "Son (out)" | Parantez içi kurgu jargonu gereksiz. | "Baş" / "Son" | Slider zaten görsel; in/out bilgisi eklemiyor. |
| `components/review/Inspector.tsx:107` | Badge "benzerlik 0.82" | Ham ondalık; kullanıcı yüzde bilir. | "benzerlik %82" | Diğer her skor % ile gösteriliyor (Güven %78 gibi). |
| `components/review/Filmstrip.tsx:40` | "üstüne gel → kare kazı" | "kare kazı" (scrub çevirisi) anlaşılmaz. | "üstüne gel → içinde gezin" | ShortcutsHelp:32'deki "kareyi kazı" da aynı şekilde değişmeli. |
| `components/review/Filmstrip.tsx:42` | "…aç (hover-scrub + video)" | "hover-scrub" ham İngilizce. | "Hareketli önizleme kapalı — aç (üstüne gelince video oynar)" | — |
| `components/review/Filmstrip.tsx:170` | "tıkla: **Fade**'a çevir" (sabit `'a`) | Ek uyumu bozuk: "Fade'**e**", "Black'**e**" olmalı; sadece "Cut'a" doğru. | Ek'i etikete taşı: TRANSITION meta'ya `dative` alanı ("Cut'a/Fade'e/Black'e") | Türkçe ek uyumu premium histe küçük ama çok görünür çatlak. |
| `components/CommandPalette.tsx:63` | "Sahne {num}**'e** git" (sabit ek) | Aynı ek sorunu: "Sahne 40'e" yanlış ("40'a" olmalı). | "Sahneye git: {num}" | Sayıya ek gerektirmeyen kalıp — sıfır gramer riski. |
| `screens/ReviewScreen.tsx:69` + `Filmstrip.tsx:144-145` + `ShortcutsHelp.tsx:21` | "Sil" / "klibini sil" / "Seçili klibi sil (kurgudan çıkar)" | Eylem silme DEĞİL, kurgudan çıkarma (geri alınabilir); Inspector zaten "Klibi çıkar / çıkarıldı" diyor. | Hepsinde "Çıkar" ailesi: "Çıkar", "Klibi çıkar — kurguya girmez (geri alınabilir)", "Seçili klibi kurgudan çıkar" | Tek terim: **çıkar** (bkz. §2). "Sil" kalıcılık korkusu yaratır. |
| `screens/ReviewScreen.tsx:63` | "{n} klip seçili" | "Seçili" tekil klip (Inspector) için kullanılıyor; buradaki durum "işaretli" (⌘-tık). ShortcutsHelp da "işaretle" diyor. | "{n} klip işaretli" | İki kavram tek kelimeyle çakışıyor. |
| `screens/ReviewScreen.tsx:85` | Tip "QC: riskli klipleri göster…" | "QC" kısaltması. | "Kalite kontrol: riskli klipleri göster — incele, gerekirse çıkar" | — |
| `screens/AnalysisScreen.tsx:152` | "Reji'ye geçiliyor" | Ekranın adı her yerde "İnceleme" (stepper, butonlar); "Reji" bir kez burada. | "İnceleme'ye geçiliyor" | Tek terim: **İnceleme**. |
| `components/review/DirectorPanel.tsx:47` | "…ince ayarını İnceleme ekranında yaparsın." | Kullanıcı ZATEN İnceleme ekranında (panel onun içinde) — başka yere yolluyor gibi. | "…ince ayarını sağdaki bilgi panelinden ve film şeridinden yaparsın." | Mekânsal doğruluk. |
| `lib/setup.ts:59` | Model indirme aşaması: "Manifest çekiliyor" · "SHA-256 doğrulanıyor" | Bu "manifest" Ollama'nın manifesti — AutoReji'nin manifest'iyle **çakışıyor**; SHA-256 jargon. | "İndirme hazırlanıyor" · "Dosya bütünlüğü kontrol ediliyor" | Aynı kelimenin iki anlamı kullanıcıyı şaşırtır. |
| `lib/setup.ts:109` | Gerçek indirmede `ev.msg` (Ollama'dan gelen İngilizce durum) doğrudan ekrana | "pulling manifest…" gibi İngilizce sızabilir. | İngilizce msg'leri Türkçe aşamalara eşle; eşleşmeyeni "Katmanlar indiriliyor"a düşür | UI dili karışmasın. |
| `lib/setup.ts:170` | "Creative Cloud'a veriliyor" · "Premiere'e bağlanıyor" | "veriliyor" tuhaf; "Premiere'e bağlanıyor" o anda gerçek değil (yalnız indirme). | "İndiriliyor" · "Paket doğrulanıyor" | Dürüst + doğal. |
| `panel/main.js:113` | "…manifest JSON'unu textarea'ya yapıştır." | "textarea" HTML jargonu. | "…yukarıdaki kutuya yapıştır." | — |
| `panel/main.js:119` | "Dosya sistemi erişilemiyor (UXP storage yok) — JSON'u yapıştırma yolunu kullan." | Parantez içi UXP jargonu. | "Dosya seçici bu Premiere sürümünde açılamıyor — manifest içeriğini kopyalayıp kutuya yapıştır, 'Doğrula'ya bas." | Çözüm yolu net kalır, jargon gider. |
| `panel/main.js:155-156, 162` | "Manifest bir JSON nesnesi değil." / "Manifest 'clips' dizisi yok." / "geçersiz in/out" | "JSON nesnesi / dizi / in-out" jargon. | "Bu dosya bir AutoReji manifest'i değil — Kur ekranında kaydettiğin <ad>_manifest.json'u seçtiğinden emin ol." (üçü tek kalıba iner; teknik ayrıntı ham günlükte kalır) | Kullanıcının tek yapabileceği doğru dosyayı seçmek. |
| `components/AppShell.tsx:104` | "Hakkında & ilkeler" | "&" Türkçe metinde yabancı. | "Hakkında ve ilkeler" | — |

### ⚪ Cila (küçük ama premium hisse dokunuyor)

| Yer | Mevcut metin | Sorun | Önerilen yeni metin | Gerekçe |
|---|---|---|---|---|
| `components/review/PreviewStage.tsx:189 vs 195` | Stop butonu "Durdur" + pause butonu "Durdur / Devam" | İki farklı eylem aynı kelime. | Stop: "Bitir" (veya "Durdur") · Pause: "Duraklat / Devam" | Oynatıcı standartları: duraklat ≠ durdur. |
| `components/review/PreviewModal.tsx:52` | "Geçiş önizleme" | Tamlama eki eksik. | "Geçiş önizlemesi" | Dil bilgisi. |
| `components/review/PreviewModal.tsx:78` | "Native stereo ses tam uygulamada (Premiere önizleme)" | Devrik/anlaşılmaz cümle. | "Bu önizleme sessizdir — gerçek stereo sesi Premiere'de duyarsın." | Ne beklediğini net söyler. |
| `components/AppShell.tsx:96` | "Hazırlık 2/3 · eksik — aç" | Telgraf dili, robotik. | "Hazırlık 2/3 — eksikleri tamamla" | Aynı bilgi, insan dili. |
| `screens/SetupScreen.tsx:177` | "onaylı · sistem doğrulayamaz" | Soğuk/robotik. | "onayladın · sistem göremiyor" | Aynı dürüstlük, sıcak dil. |
| `screens/BuildScreen.tsx:159` | "MONTAJCI panelini henüz bağlamadın —…" | Hafif suçlayıcı ("sen yapmadın"). | "MONTAJCI paneli henüz bağlı değil — bu olmadan bölüm Premiere'de açılmaz. Hazırlığı aç →" | Durumu söyle, kişiyi değil. |
| `components/review/Inspector.tsx:248` + `ReviewScreen.tsx:101` + `CommandPalette.tsx:51` | "Algoritmanın kararına döndür" / "algoritmanın orijinaline dön" / "Orijinale döndür (algoritma)" | "Algoritma" soğuk; ürün kişiliği AutoReji. | "AutoReji'nin kararına döndür" / "AutoReji'nin orijinaline dön" / "Orijinale döndür" | Marka sesi tutarlılığı. |
| `components/review/Inspector.tsx:130` | Satır etiketi "Rejim" | "Rejim" günlük Türkçede yadırgatıcı (politika/diyet çağrışımı). | "Mekân" (değerler zaten "Dış/İç/Uyku") | Etiket değeriyle uyumlu hâle gelir. |
| `panel/index.html:976` + `panel/main.js:551` | "✓ BİTTİ — RENDER YOK" / "BİTTİ — RENDER YOK. Klipler + geçişler + intro/outro…" | TAMAMI BÜYÜK harf bağırıyor; "intro/outro" jargon. | "✓ Bitti — render alınmadı" / "Bitti — render alınmadı. Klipler, geçişler ve giriş-çıkış hazır; ses native stereo, boşluk yok." | Kutlama sakin ve premium olmalı. |
| `panel/main.js:554` | "Durduruldu — HATA satırına bak." | Kuru + bağırık. | "Kurulum durdu — aşağıdaki kırmızı satırda sebebi ve 'Yeniden dene' butonu var." | Nereye bakacağını tarif eder. |
| `panel/ui.js:18` (adım etiketi) | "2.5) Medya hazır bekleniyor" | "2.5)" ara-numara kullanıcıya tuhaf. | Numaraları 1-9 yeniden sırala ("3) Medya hazırlanıyor") | Adım listesi insan için, kod için değil. |

---

## 2) Terminoloji tutarlılık matrisi

| Kavram | Kullanımdaki varyantlar (yer) | **Kanonik karar** | Değişecek yerler |
|---|---|---|---|
| **bölüm** | tutarlı ✓ | **bölüm** | — |
| **sahne / klip** | "Sahne N" (kimlik/numara) · "klip" (video parçası) — genelde doğru; tek çakışma: "{n} klip seçili" (işaretleme) | **sahne** = numara/yer, **klip** = video; **seçili** = Inspector'daki tek klip, **işaretli** = ⌘-tık çoklu | `ReviewScreen.tsx:63` "seçili"→"işaretli" |
| **geçiş (Cut/Fade/Black)** | Cut/Fade/Black her yerde İngilizce özel ad | **KORU** — Premiere terimleriyle bire bir; Türkçeleştirme (kesme/karartma) Premiere'de karşılık bulamaz | Yalnız ek uyumu düzelt (Fade'e/Black'e) |
| **kurgu** | tutarlı ✓ ("kurgu stili", "kurguya döndür") | **kurgu** | — |
| **kırpma** | "Kırpma & tutamak" (Inspector) · "Kırpma (in/out…)" (panel) | **kırpma**; alt kavram **tutamak payı** (baş pay/son pay ile karışmasın: "pay" = tutamak payı kısaltması olarak kalsın) | panel adımından "(in/out)" çıkar; Inspector "Baş (in)/Son (out)" → "Baş/Son" |
| **kur / kurulum** | (a) bölümü Premiere'e kurmak: "Premiere'de Kur", "Bölümü Kur", "Kuruluma hazır" · (b) yazılım kurulumu: "ilk kurulum", "MONTAJCI'yı Kur", "Kurulum doğrulanıyor" | **kur** = bölümü Premiere'e kurmak (ürün kimliği). Yazılım tarafında eylem adı ne yapıyorsa o: **indir / başlat / test et**. | `SetupScreen.tsx:466` "MONTAJCI'yı Kur"→"MONTAJCI'yı İndir" (zaten 🔴 tabloda) |
| **manifest** | "Manifest dosyası/Manifest'i Kaydet/Manifest Dosyası Seç/manifest yüklendi" (tutarlı) — ama Ollama aşaması "Manifest çekiliyor" çakışıyor; store "kurulum dosyası" gibi ikinci ad YOK (iyi) | **manifest** kalır (dosya adı `_manifest.json` gerçeği); ilk geçtiği yerde tanıt: "manifest — bölümün kurgu tarifi". Ollama aşaması yeniden adlandırılır. | `lib/setup.ts:59`; BuildScreen'e tek cümlelik tanım |
| **arşiv** | "Arşiv" (ekran) · "arşive eklendi" · "Arşiv'i aç" · "Arşivden sil" | **arşiv**; cümle içinde küçük ve kesme işaretsiz ("arşive eklendi"), ekran adı olarak "Arşiv" | `BuildScreen.tsx:205` "Arşiv'i aç" → "Arşivi aç" (tercih: tek stil) |
| **İnceleme (ekran)** | "İnceleme" (stepper/butonlar) · "Reji" (AnalysisScreen:152) | **İnceleme** | `AnalysisScreen.tsx:152` |
| **zaman çizelgesi** | "zaman çizelgesi" (Timeline.tsx) · "timeline" (BuildScreen ×3, panel yorumları) | **zaman çizelgesi** (Premiere menü adları hariç) | `BuildScreen.tsx:120,140,152` |
| **çevrimdışı** | "Çevrimdışı" (motifs) · "offline" (Setup ×4, Analysis, About) | **çevrimdışı** | 6 yer (tabloda) |
| **çekim** | "çift çekim" · "varyant" · "aday çekim" · "çoklu çekim" | **çekim** ailesi: "aday çekim" (adaylar), "yedek çekim" (çift çekim yerine) | Inspector:136, Intake:27, Analysis:17 |
| **görsel prompt** | "Görsel Prompt Belgesi" · "image prompt" (About) | **görsel prompt** | `AboutDialog.tsx:10` |
| **çıkar (klip)** | "çıkar/çıkarıldı" (Inspector, store) · "Sil" (ReviewScreen, Filmstrip, ShortcutsHelp) | **çıkar** (geri alınabilir olduğu için); "sil" YALNIZ arşiv kaydı silmede kalır (orası gerçekten siler) | ReviewScreen:69, Filmstrip:144-145, ShortcutsHelp:21 |

---

## 3) Ton denetimi — sıcak-premium çizgiyi kıran metinler

Genel durum **iyi**: "Bir şeyler eksik kalmış görünüyor — birlikte düzeltelim" (Analysis hata ekranı), "Kurulan bölümler burada birikir", "Zorunlu girdileri bekliyorum…" tam hedef tonda. Kıranlar:

| Tip | Yer | Sorun → Öneri |
|---|---|---|
| Robotik | `AppShell.tsx:96` "· eksik — aç" | → "— eksikleri tamamla" |
| Robotik | `SetupScreen.tsx:177` "onaylı · sistem doğrulayamaz" | → "onayladın · sistem göremiyor" |
| Robotik | `SetupScreen.tsx:298` "· gerçek" | → kaldır (iç etiket) |
| Bağırık | panel "✓ BİTTİ — RENDER YOK" / "Durduruldu — HATA satırına bak." | → cümle düzenine indir (bkz. §1 cila) |
| Soğuk/mekanik | "algoritma" ×3 (Inspector/Review/Palette) | → "AutoReji'nin kararı" — ürün bir yardımcı, bir algoritma değil |
| Hafif suçlayıcı | `BuildScreen.tsx:159` "henüz bağlamadın" | → "henüz bağlı değil" (durum dili) |
| Kuru fallback | `AnalysisScreen.tsx:75` "Bilinmeyen hata" · `lib/store.ts:164` "Kayıtlı manifest okunamadı" · `panel/ui.js:712` "Geçersiz manifest" | → §4 formülüne geçir |
| Kutlama dozu | `AnalysisScreen.tsx:150` "🎬" + `BuildScreen.tsx:151` "🌧️" | → bkz. §6 emoji kararı |

Kullanıcıyı suçlayan hata mesajı **bulunmadı** — bu çizgi korunmalı.

---

## 4) Hata mesajı formülü + en kötü 5'in yeniden yazımı

**Standart formül (öneri):**

> **[Ne oldu — kısa, suçlamasız] + [Neden — tek cümle, tahminse "olabilir"] + [Ne yapmalı — somut adım / buton adı]**
> İsteğe bağlı 4. satır: `Ayrıntı:` teknik mesaj (katlanabilir/soluk renkte — asla ana metin olarak değil).
> Kurallar: buton adları tırnak içinde ve **birebir gerçek** ("Tekrar dene"), İngilizce sistem çıktısı ana cümlede yasak, ünlem yok.

**Yeniden yazımlar:**

1. **`lib/engine.ts:52` → AnalysisScreen hata kutusu** — mevcut: ham sidecar çıktısı (`sidecar 'analyze_video' exit 1` / stderr dökümü)
   → "Video analizi tamamlanamadı. Klasördeki bir video okunamamış olabilir (bozuk ya da taşınmış). Video klasörünü kontrol et, sonra 'Tekrar dene'ye bas.
   Ayrıntı: {teknik mesaj}" *(hangi dosyada patladıysa adı da eklenmeli — önceki denetim A6 ile aynı iş)*

2. **`panel/main.js:82`** — mevcut: "Açık proje yok. File > New > Project."
   → "Premiere'de açık bir proje yok — kurulum bir projenin içine yapılır. Üst menüden File → Open ile projeni aç (ya da File → New → Project ile yeni oluştur), sonra tekrar 'Bölümü Kur'a bas."

3. **`lib/store.ts:161`** — mevcut: 'Bu kaydın manifest yolu yok — önce "Farklı Kaydet" ile kaydet' *(var olmayan buton!)*
   → "Bu bölüm yeniden açılamıyor çünkü manifest dosyası hiç kaydedilmemiş — arşiv yalnızca özet tutar. Bölümü tekrar kurup Kur ekranında 'Manifest'i Kaydet'e bas; ondan sonra buradan tek tıkla açılır."

4. **`panel/main.js:384`** — mevcut: "3 bulunamadı: a.mp4, b.mp4, c.mp4"
   → "3 klip Premiere projesinde bulunamadı (a.mp4, b.mp4…). Video dosyaları taşınmış ya da yeniden adlandırılmış olabilir. Videoların hâlâ manifest'teki klasörde olduğundan emin ol, sonra 'Yeniden dene'ye bas."

5. **`screens/SetupScreen.tsx:258-259`** — mevcut: "İndirilemedi — tekrar dene"
   → "Model indirilemedi. Bağlantı kopmuş ya da Ollama yanıt vermemiş olabilir. İnternetini kontrol edip 'Tekrar dene'ye bas — indirme kaldığı yerden devam eder."

6. *(bonus)* **`lib/store.ts:164`** — mevcut: "Kayıtlı manifest okunamadı"
   → "Kayıtlı manifest açılamadı. Dosya taşınmış ya da içeriği bozulmuş olabilir. Bölümü yeniden kurup 'Manifest'i Kaydet' ile yeni bir kopya al."

---

## 5) Boş / yükleniyor / başarı mikro-kopyası

**İyi olanlar (dokunma):** Arşiv boş-durumu ("Henüz arşiv yok… İlk bölümünü kur"), Intake "Nasıl çalışır" 3 adımı, panel "Henüz kurulum yapılmadı…", Setup "Ollama ve model kontrol ediliyor…", Intake alt bar "Zorunlu girdileri bekliyorum…".

**Eksik / tembel olanlar:**

| Yer | Mevcut | Öneri |
|---|---|---|
| `components/review/Inspector.tsx:31` | "Bir klip seç" (tek satır, çıplak) | "Henüz klip seçilmedi. Film şeridinden bir klibe tıkla — kararı, geçişi ve kırpması burada açılır." |
| `components/CommandPalette.tsx:98` | "Sonuç yok" | "Eşleşen komut yok — başka bir kelime dene ya da sahne numarası yaz." |
| `components/review/PreviewStage.tsx` | Video yüklenirken/hata verirken **hiç metin yok** (sahne sessizce siyah — önceki denetim A5) | Yüklenirken: "Klip açılıyor…" · hata: "Klip okunamadı: {dosya adı} — dosya taşınmış olabilir." |
| `screens/ReviewScreen.tsx` | Tüm klipler çıkarılırsa boş-durum metni yok (önceki denetim A1) | "Kurguda hiç klip kalmadı — en az bir klip gerekli. 'Geri al' (⌘Z) ile son çıkardıklarını geri getir." + CTA kilidi |
| `screens/AnalysisScreen.tsx:75` | Fallback "Bilinmeyen hata" | "Beklenmedik bir sorun oldu — tekrar denemek çoğu zaman çözer." (+ Ayrıntı satırı) |
| `lib/data.ts:8` | "Manifest yüklenemedi" (örnek bölüm fetch'i) | "Örnek bölüm yüklenemedi — sayfayı yenileyip tekrar dene." |
| `screens/BuildScreen.tsx:82` | "Kaydetme iptal edildi" (amber/alert ikonlu) | Metin doğru ama uyarı gibi görünüyor; nötr ton + ikon 'undo': "Kaydetme iptal edildi — hazır olunca tekrar deneyebilirsin." |
| `panel/ui.js:570` | Durum çubuğu "Hazır" (manifest yokken de) | Manifest yokken: "Manifest bekleniyor — Yükle sekmesi" · yüklüyse: "Hazır — Bölümü Kur'a basabilirsin" |
| `screens/SetupScreen.tsx:420` | `prog?.phase ?? 'Hazırlanıyor…'` — Ollama'dan İngilizce faz sızabilir (setup.ts:109) | İngilizce fazları Türkçe'ye eşle (bkz. §1 tablo) |

**Başarı anları:** toast'lar zaten kısa ve net ("Bölüm arşive eklendi", "MONTAJCI doğrulandı · kurulu ✓"). Tek düzeltme: toast metnindeki "✓" işareti ikonla **çift** onay üretiyor ("Manifest kaydedildi ✓" + yeşil tik ikonu) → metinden ✓ kaldır, ikon yeter (`BuildScreen.tsx:81`, `SetupScreen.tsx:252`).

---

## 6) Emoji kullanımı — yer yer karar

Kural hatırlatma: emoji **ikon olarak** kullanılmaz (lucide var); başlıkta dekoratif emoji zevk kararı.

| Yer | Emoji | Karar | Gerekçe |
|---|---|---|---|
| `AnalysisScreen.tsx:150` "Bölüm analizi tamamlandı 🎬" | 🎬 | **KALDIR** | Hemen üstünde zaten büyük klaket ikonu (Clapperboard) var — aynı sembol iki kez; başlık temiz kalsın. |
| `BuildScreen.tsx:151` "Bölüm kuruldu 🌧️" | 🌧️ | **TUT (tek kutlama imzası olarak)** | Kanal kimliği yağmur; uygulamada başka başlık emojisi kalmayınca bu tek an "imza" olur. (Başlık metni 🔴 tabloda zaten değişiyor: "Bölüm kuruluma hazır 🌧️".) İstersen tam tutarlılık için bunu da kaldır — ama ikisinden en fazla biri kalmalı. |
| `panel/main.js:439, 547` "…boşluk bile YOK 🎉" | 🎉 | **KALDIR** | UXP paneli emoji fontunu güvenilir çizmeyebilir (panelde tüm ikonlar bu yüzden CSS/SVG); log satırında kutlamayı "✓" karşılar. |
| `SetupScreen.tsx` / `BuildScreen.tsx` / panel içi "✓ / ▶ / ▸ / ● / →" glifleri | — | **TUT** | Bunlar emoji değil tipografik işaret; UXP-güvenli ve işlevsel (yalnız toast metinlerindeki çift-✓ kaldırılıyor, bkz. §5). |
| `IntakeScreen.tsx:73` başlık üstü Sparkles (lucide) | — | TUT | İkon, emoji değil — kural ihlali yok. |

Ekran gövdelerinde başka emoji **bulunmadı** (temiz durum — yeni kopya yazarken de bu çizgi korunmalı).

---

## 7) Önerilen uygulama sırası

1. **Tur A (doğruluk, 🔴):** BuildScreen "kuruldu→kuruluma hazır" ailesi · "Farklı Kaydet" hayalet butonu · "Sürükle-bırak" vaadi · "MONTAJCI'yı Kur→İndir" · panel "Brain" · geliştirici modu çelişkisi (teknik doğrulamayla).
2. **Tur B (terminoloji, 🟡):** çıkar/sil birleştirme · çevrimdışı · zaman çizelgesi · İnceleme · çekim ailesi · ek uyumu (Fade'e / "Sahneye git: N") · ffprobe/QC/UXP/ACTION-ENV temizliği.
3. **Tur C (hata formülü + boş durumlar):** §4'ün 6 yeniden yazımı + §5 eksik mikro-kopyalar (A1/A5/A6 UI işleriyle birlikte).
4. **Tur D (cila + emoji):** §1 ⚪ satırları + §6 kararları.

Her tur sonrası ritüel: tarayıcı + `.app`'te gözle kontrol → sürüm bump → CHANGELOG/DEVAM güncelle. Panel değişiklikleri `.ccx` yeniden paketleme gerektirir.
