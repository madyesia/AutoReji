# AutoReji — Otomatik Kurgu Sistemi (Ghibli Mood ON)
### Claude Code Yapım Belgesi · Ürün: **AutoReji** · Başlangıç sürümü: **v1.1**

Bu belge, sistemi **sıfırdan kuracak Claude Code** içindir. Amaç: her gün üretilen ~160 klipten oluşan bir bölümü, Premiere Pro 2026'da **düzenlenebilir klipler + düzenlenebilir geçişler + native stereo ses** ile, **render almadan** kuran, tamamen yerel (çalışma anında ücretli AI gerektirmeyen) premium bir macOS uygulaması: **AutoReji**.

**Ürün kimliği ve sürümleme:** Uygulamanın adı **AutoReji**'dir; bu ad `.app` adında, pencere başlığında, UXP panel başlığında ve "Hakkında" ekranında görünür. **İlk sürüm v1.1**'dir; her güncellemede **v1.2, v1.3, …** diye artar. Sürüm `package.json`/`VERSION` dosyasında ve `CHANGELOG.md`'de tutulur, UI'da gösterilir (bkz. §20).

Zor kısımların çoğu (geçiş karar algoritması, düzensiz kırpma, Dip-to-Black mantığı, ses senkronu) kullanıcının gerçek görüntüsü üzerinde **kanıtlandı**. Geriye kalan ana risk: **native stereo** (çözüm aşağıda) ve bunları tek bir donanımlı uygulamada birleştirmek.

---

## 🎯 ÖNCE BUNU OKU — Claude Code: Rol ve Çalışma Talimatı

Bu bölüm her şeyden önce gelir ve tüm çalışmanı yönetir. Aşağıdaki belge bir **spesifikasyon ve niyet beyanı**dır; harfiyen kopyalanacak bir reçete değil. Senden beklenen, bu ürünün **sahibi gibi** davranıp onu **mümkün olan en yüksek kalitede** hayata geçirmen.

### Rolün
Kıdemli/uzman bir **yazılım mühendisi + kalite sorumlusu + zanaatkâr ürün geliştiricisin.** Bu uygulamayı kendi imzanı taşıyan bir ürün gibi sahiplen. Kullanıcı (tek kişilik bir stüdyo) her gün bunu kullanacak; aracın güvenilirliği ve kurgu kalitesi doğrudan onun işini etkiliyor.

### Temel mandat (pazarlık konusu değil)
1. **Baştan savma kesinlikle yok.** Her parça düşünülmüş, test edilmiş, sağlam olacak. "Çalışıyor gibi" yetmez; **gerçekten çalışacak** ve kaliteli olacak.
2. **Her aşamada önce test, sonra ilerle.** Bir modülü yazınca **gerçek veriyle** (kullanıcının footage'ı, prompt belgeleri, gerçek bölümleri) doğrula. Doğrulamadan bir sonrakine geçme. Kırılırsa düzelt, sonra devam.
3. **Gerekçeli inisiyatif al.** Belgedeki bir karardan daha iyisini görürsen körü körüne uygulama: kısa gerekçeyle **öner ve uygula**. Belge yön verir; final kaliteyi sen kovalarsın. Belirsizlikte en sağlam/en kaliteli seçeneği tercih et.
4. **En kaliteliyi yakala.** Çıta yüksek: kurgu "elle yapılmış" hissetmeli, ses ASMR kalitesinde kesintisiz olmalı, UI premium olmalı, sistem dağınık girdiye dayanıklı olmalı. "Yeterince iyi"yle yetinme; ama spesifikasyonun amacını aşan gereksiz süsleme de yapma.
5. **Riskleri dürüst işaretle.** Bir şey belirsizse veya canlı testte beklenenden farklı çıkarsa, sakla değil — açıkça yaz, alternatif öner.

### Çalışma biçimi (nasıl)
- **İlk iş: stereo de-risk (Faz 0).** Tüm sistemi kurmadan önce UXP'de import + kırpma + geçiş + **native stereo**'yu 2-3 klip üzerinde canlı kanıtla (§3.7). Bu tutmadan ileri gitme.
- **Faz faz ilerle (§16).** Her faz **çalışan, gösterilebilir bir kontrol noktasıyla** bitsin; "bitti" kriterleri karşılanmadan faz kapanmaz.
- **Gerçek veride kalibre et, sonra dondur.** Eşikler/rafineler kullanıcının gerçek bölümlerinde ayarlanır; oturunca sabitlenir (çalışma anında AI/kalibrasyon yok).
- **🔧 alanlarını doldur.** Belgedeki her 🔧 alanına, **canlı testten çıkan** kararını ve gerekçeni yaz; o alanlar senin teknik defterin.
- **Köprüyü ince ve değiştirilebilir tut.** Premiere'e dokunan UXP katmanı izole olsun (ileride API değişirse sadece o parça güncellensin).
- **Sonuçları göster, iddia etme.** İlerlemeyi çalışan çıktı/küçük testlerle göster; "yaptım" demek yerine "şu testte şu sonucu verdi" de. Kullanıcının vaktini koru: özlü iletişim, ama eksiksiz iş.

### Asla taviz verilmeyen kısıtlar (hard constraints)
- **Native stereo** ses (tek katman, L≠R) — §3.
- **Render YOK** — düzenlenebilir klipler + düzenlenebilir geçişler.
- **Çalışma anında ücretli/harici AI YOK** — tamamen yerel/offline (internet sadece ilk kurulum indirmesi).
- **Karar prompt-odaklı** (image prompt birincil) — §4, §5.
- **macOS `.app`, Tauri 2 + Python sidecar, ad-hoc imza** — §2.
- **Premiere köprüsü UXP** (ExtendScript yalnız geçici yedek) — §3.

### Bu üründe "mükemmel"in tanımı
- Kurgu **elle yapılmış gibi** hisseder (mekanik değil; rejime/ölçeğe duyarlı tempo, doğru yerde black, çoğunlukla cut + zengin fade).
- **Ses kusursuz akar** (ASMR önceliği: hiç tık yok, stereo alan korunur).
- **Günlük güvenilir**: dağınık/eksik girdiye dayanıklı, net uyarılar, hızlı.
- **Premium UI**: hem tek-tık hızlı hem derin kontrol; odak inceleme; in-app önizleme.
- **Sağlam mühendislik**: test edilmiş, izole katmanlar, sürümlü manifest, config'ten yönetilen davranış.

### Kullanıcıyla çalışma (ÇOK ÖNEMLİ — kullanıcı kod/çalışma mantığı bilmiyor)
Kullanıcı daha önce hiç kod yazmadı ve teknik mantığı bilmiyor. Bu yüzden:
- **Mümkün olan HER ŞEYİ kendin yap.** Araç kurma, bağımlılık yükleme, kod yazma/çalıştırma, klasör oluşturma, test koşma — hepsini sen yap. Kullanıcıya yalnızca **senin yapamayacağın gerçekten elle** işleri bırak (Premiere/Adobe UXP aracında tıklama, macOS izin penceresini onaylama, görüntü/prompt dosyalarını sağlama, uygulamayı gözle test etme).
- **Elle bir şey gerektiğinde EN BASİT şekilde, adım adım, HER SEFERİNDE tarif et** — sıfır bilen birine anlatır gibi. "Şu klasörü aç", "şuna tıkla", "şunu indir", "uygulamayı çalıştır" gibi durumlarda: tam olarak nereye tıklayacağını/ne yazacağını ve ekranda ne göreceğini söyle. Asla "bilir" varsayma.
- **Elle adım istedikten sonra bekle ve onayla;** kullanıcı "yaptım" demeden devam etme.
- **Sohbette basit konuş;** teknik derinlik kodda ve belgelerde kalsın. Kullanıcının vaktini koru.

### İzinler (başta geniş iste, sonra aşama aşama)
- **En başta**, kullanıcıya **basitçe** şunu kur: sana kesintisiz çalışma izni versin. Öner: **Auto modu** (eylemleri bir sınıflandırıcı denetler; güvenli olanları otomatik onaylar, tehlikeli/yetki-aşan olanları durdurur) ya da en az **acceptEdits** (dosya düzenlemeleri sorulmadan akar). Kullanıcıya bunu nasıl açacağını tarif et (Desktop app'te ilgili anahtar / terminalde Shift+Tab / `settings.json`'da `defaultMode`).
- Ayrıca bu projeye özel bir **`.claude/settings.json` izin listesi** kur: bu projenin sık ve güvenli komutları (npm, cargo/tauri, python/pip, ffmpeg/ffprobe, git, dosya işlemleri) tekrar tekrar sormasın.
- İzinler başta genel verilince **aşama aşama** ilerle; kullanıcı her fazda ne olduğunu görsün.

### İlk iş: iş planı + checklist çıkar
- Belgeyi baştan sona okuduktan sonra **ilk işin**: tüm fazları/adımları kapsayan **detaylı, sıralı bir iş planı + checklist** üret (madde madde, **hiçbir şey atlamadan**, bu belgedeki sıraya göre). Bunu yaşayan bir dosya olarak tut (örn. `PLAN.md` / `CHECKLIST.md`); ilerledikçe işaretle ve güncel tut. Planı **önce kullanıcıya göster**.
- Bu "Rol ve Çalışma Talimatı"nı bir **`CLAUDE.md`** dosyasına da koy ki tüm oturumlarda kalıcı olsun.

### ⭐ KRİTİK: Önce basit demo prototip, sonra tüm sistem
Tüm sistemi kurmadan **önce**, basit hatlarla bir **demo/prototip** kur ve sistemi en baştan test et: **birkaç gerçek video** al, minimal uçtan-uca akışı çalıştır ve **Premiere'de** şunları doğrula — (a) video **geçişleri** düzgün aktarılıyor mu, (b) sesler **native STEREO** aktarılıyor mu. Bu demo **geçmeden** tüm yapıyı/sistemi kurmaya geçme. (Bu, §16 Faz 0'ın genişletilmiş hâlidir ve projenin en kritik kapısıdır — başarısız olursa yaklaşım orada düzeltilir.)

### Taşınabilir teslim (başka Claude hesabından devam edebilme — ÖNEMLİ)
Kullanıcı, projeyi **başka bir Claude hesabında** sıfırdan bağlam vermeden sürdürebilmek istiyor. Bu yüzden çıktı **tamamen kendi kendine yeten** olmalı: kullanıcı proje klasörünü (veya zip'ini) + içindeki belgeleri yeni bir hesaba/oturuma verince **başka hiçbir şeye ihtiyaç duymamalı.** Bunu sağlamak için:
- Repo **kendi içinde** taşır: tüm kaynak kod, `CLAUDE.md` (rol+kurallar+konvansiyonlar), `DEVAM.md` (güncel durum/devir belgesi), `README.md` (sıfırdan kurulum), bu **Blueprint**, bağımlılık manifestoları, kurulum/build scriptleri, modeller (veya tek-komut indirme), `CHANGELOG.md` + sürüm.
- `DEVAM.md` ve `CHANGELOG.md` **yaşayan belgelerdir**: baştan oluştur, her fazda/oturum sonunda güncelle (ne bitti, ne kaldı, kararlar, tuzaklar, kalibre değerler, checklist durumu).
- Detaylı şema **§20**'de. Hedef: "klasörü yeni hesapta aç → `CLAUDE.md`+`DEVAM.md` okunur → kurulum scripti çalışır → geliştirmeye devam." Başka bir şey gerekmez.

### İlk adımlar (özet, sırayla)
1. Belgeyi baştan sona oku; ⚠️ ve 🔧'leri not et.
2. Kullanıcıya izinleri **basitçe** açtır (Auto/acceptEdits) + proje izin listesini kur.
3. **İş planı + checklist** çıkar, kullanıcıya göster; `CLAUDE.md` oluştur.
4. **⭐ Demo prototip (Faz 0):** birkaç videoyla geçiş + **stereo**'yu Premiere'de canlı kanıtla; sonucu §3.7'ye yaz. Geçmeden ilerleme.
5. Gerçek dosya adları/prompt formatını örnekten doğrula (§4).
6. Faz 1 omurgayı kur, gerçek bölümde uçtan uca test et.
7. Devam: kalibrasyon → UI → cila; her faz kendi testiyle ve checklist güncellemesiyle kapanır.

---

## 🚀 Kurulum ve Claude Code ayarları (kullanıcı + ilk oturum)

> Bu bölüm kısmen **kullanıcı içindir** (basit tutuldu). Kullanıcı kod bilmiyor; bu yüzden **senin tek başına yapamayacağın tek seferlik adımlar** burada. Geri kalan her şeyi (Rust, Python, ffmpeg, Tauri araçları, tüm bağımlılıklar) **Claude Code kendisi kuracak** — kullanıcının elle indirmesine gerek yok.

### Kullanıcının tek seferlik yapması gerekenler
1. **Claude Code'u kur.** En kolay yol (terminal bilmeye gerek yok): **Claude Desktop uygulaması** (macOS için indir, terminalsiz Claude Code içerir). Alternatif: terminalden native installer veya `npm install -g @anthropic-ai/claude-code` (Node.js 18+ gerekir). Sürüm güncel olsun (Opus 4.8 için Claude Code'un güncel sürümü gerekir; güncellemeyi Claude Code kendisi `claude update` ile yapabilir).
2. **Hesap:** Claude **Max** aboneliğiyle giriş yap (kullanıcıda var).
3. **Git** (önerilir, zorunlu değil): yoksa Claude Code kurmana yardım eder.
4. **Premiere Pro 2026** (kullanıcıda var) — UXP panelini yüklemek için Adobe'nin UXP Developer Tool'u gerekebilir; Claude Code adım adım tarif eder.
5. Bunun dışında **hiçbir şey indirmene gerek yok** — kalan tüm araçları Claude Code kurar.

### Hangi model? (kullanıcı sordu)
- **Bu projede: Opus** (Max planında varsayılan en güçlü Opus modeli) — karmaşık mimari, uzun soluklu agentic kodlama için en iyisi. Sohbette/terminalde `/model opus`.
- **Effort: high.** (En güncel Opus modelleri "adaptive reasoning" kullanır: gereken adımda daha çok düşünür. "max" effort eski/özel bir ayardır; kalıcı en üst pratik ayar **high**'dır.) `/effort high`.
- **Uzun günlerde limit yaklaşırsa:** `/model opusplan` — Opus **planlar** (mimari kararlar), Sonnet **yazar** (kodun çoğu). Aynı kaliteyi kritik yerde korur, Max kullanım bütçesini uzatır. Bu proje için çok uygun bir denge.
- **Not:** Terminalde **etkileşimli** çalışmak Max planının normal limitlerinde kalır (otomatik/headless işler ayrı bir kredi havuzundan sayılır — biz etkileşimli çalışacağız).

### İzinler (sorulmadan çalışsın)
- Kullanıcı "başta hepsini vereyim" dedi. En iyi denge: **Auto modu** (bir sınıflandırıcı eylemleri denetler; güvenli olanları otomatik onaylar, tehlikeli/yetki-aşan olanları yine durdurur) — kesintisiz ama güvenli. Yoksa **acceptEdits** (dosya düzenlemeleri sorulmaz; yan etkili bash yine sorabilir).
- Açma yolu: Desktop app'te izin/mod anahtarı, ya da terminalde **Shift+Tab** ile mod döngüsü, ya da `settings.json`'da `"defaultMode": "auto"` (veya `"acceptEdits"`). Claude Code ilk oturumda kullanıcıya **basitçe** gösterecek.
- Claude Code ayrıca bu projeye özel bir **izin listesi** (`.claude/settings.json`) kurar: npm, cargo/tauri, python/pip, ffmpeg/ffprobe, git, dosya işlemleri tekrar tekrar sormasın.

### Önerilen Claude Code eklentileri (MCP + skill) — Claude Code kurar
> Kural: **az tut.** Fazla MCP/skill bağlam vergisi koyar ve kararları kötüleştirir. Yalnızca güvenilir kaynaklardan kur. **Bunları kullanıcı elle kurmak zorunda değil — Claude Code ilk oturumda izinle kurar ve her birini basitçe açıklar.**

**Connector (MCP) — 2-3 tane:**
- **Context7 (mutlaka)** — canlı, sürüme-özel kütüphane dokümanı (Tauri/Rust/Python/UXP API'lerinde güncel-olmayan koddan korur). Kur: `claude mcp add context7 -- npx -y @upstash/context7-mcp` (API anahtarı gerekmez). Kullanırken gerektiğinde "use context7" denebilir.
- **Playwright (UI testi)** — Claude Code AutoReji arayüzünü gerçek tarayıcıda açıp kendi test eder. Kur: `claude mcp add playwright -- npx @playwright/mcp@latest`. (Token-yoğun olabilir; gerektiğinde kullan.) *Not: native Tauri penceresi E2E'si için ayrıca `tauri-driver`+WebdriverIO kurulabilir.*
- **GitHub (opsiyonel, §20 teslim için ideal)** — projeyi özel repoda tutmak = sürüm geçmişi + başka hesaba taşıma kolay. Ücretsiz GitHub hesabı + token ister.
- **Kurma:** Filesystem MCP (Claude Code'un yerleşik dosya araçları zaten var).

**Skill/Plugin (1-2 tane, `/plugin` ile resmî marketplace):**
- **superpowers** — TDD zorunluluğu + 7-fazlı metodoloji (Brainstorm→Spec→Plan→TDD→Review→Finalize); "her aşamada test + en kalite" hedefiyle birebir. Kur: `/plugin` → Discover → superpowers.
- **skill-creator (opsiyonel)** — AutoReji'ye özel tekrarlayan işleri (ör. "günlük bölüm kur", "demo prototip çalıştır") kendi skill olarak paketlemek için. Kur: `/plugin install skill-creator@claude-plugins-official`.
- **code-reviewer (opsiyonel)** — her kilometre taşından önce hata/güvenlik incelemesi.

🔧 **CLAUDE CODE GÖRÜŞ/ÖNERİ ALANI (eklentiler):** Hangi MCP/skill bu projede gerçekten değer kattı, hangisi bağlam vergisi olduğu için kaldırıldı — kullanımdan sonra buraya yaz. Bu projeye özel bir `build-episode`/`run-demo` skill'i yazmak faydalı mı, değerlendir.

---

## 0. Bu belgedeki işaretler

- ✅ **KİLİTLİ** — kullanıcıyla kararlaştırıldı, aynen uygula (gerekçeli daha iyisini bulursan öner).
- ⚠️ **NETLEŞTİRİLECEK** — kullanıcı onayı/girdisi gerekiyor (kod yazmadan önce sor).
- 🔧 **CLAUDE CODE GÖRÜŞ/ÖNERİ ALANI** — kendi teknik görüşünü/önerini + canlı test sonucunu madde madde yaz.

---

## 1. Proje özeti ve günlük akış

**Kanal:** "Ghibli Mood ON" — Studio Ghibli tarzı, cozy, şiddetli yağmur ASMR. Hedef kitle Tier-1 ABD. Her bölüm ~160 klip.

**Tek bir klip:** 8 sn, 1920×1080, 24fps, H.264, AAC 48kHz **stereo** (bir kaynak görselin animasyonlu hali). Klipler dosya adındaki **baş numaraya** göre sıralı.

**Günlük akış (uygulama kurulduktan sonra):**
1. Kullanıcı uygulamayı açar, o bölümün **video klasörünü** seçer.
2. Uygulama arka planda her videodan kare çıkarır, analiz eder, geçiş kararlarını + kırpmaları üretir.
3. (Opsiyonel) Kullanıcı **geçiş haritasını** gözden geçirir/düzeltir.
4. Uygulama bir **manifest** + bir **Premiere build script'i** üretir; çıktı **bölüm adıyla** isimlenir ve arşivlenir.
5. Premiere'de tek tık (veya otomatik tetik) ile sequence kurulur: native stereo, ayrı klipler, düzenlenebilir geçişler, **render yok**.
6. Kullanıcı Premiere'de ince ayar yapar (kötü çekimi siler, bir geçişi değiştirir) ve dışa aktarır.

**Çalışma anı kısıtı:** ✅ İnternet serbest ama **ücretli/harici AI API YOK**. Tüm "zekâ" yerel (gömülü modeller). Build anında Claude Code kullanımı serbest.

---

## 2. Sistem mimarisi ve teknoloji ✅ KARAR

İki parça, net ayrılmış:

**A) Bağımsız macOS uygulaması = "BEYİN" → Tauri 2 + Python yan-süreç**
Klasör seçimi, kare çıkarma, analiz (yerel embedding + renk + metadata), geçiş karar algoritması, varyant seçimi, kırpma, bölüm-adı/arşiv, premium UI. Çıktısı: **manifest (JSON EDL)** + çözülmüş **native dosya yolları**.

**B) Premiere köprüsü = "MONTAJCI" → UXP plugin (panel)** (bkz. Bölüm 3)
Manifesti okuyup dosyaları **native** import eder (→ stereo garantisi), sequence'i kurar, her klibi kırparak yerleştirir, her geçişi süresiyle ekler. Premiere'de tek "Kur" butonu.

```
[image prompt belgesi (zorunlu)] + [video prompt (opsiyonel)] + [video klasörü]
      │  (kullanıcı 2-3 girdi seçer)
      ▼
┌──────────────────── BEYİN — Tauri 2 .app (web UI + Rust) ────────────────┐
│  1. Prompt parse (kodlar in/out/slp/hro + renk + özne + ölçek)  ← OMURGA  │
│  2. Eşleştirme prompt[N] ↔ video N  + varyant seçimi (1080p)             │
│  3. Prompt-metin benzerliği (rejim içi konum değişimi)  [Python yan-sür.] │
│  4. Kare çıkarma (yalnız önizleme küçük-resmi)         [ffmpeg]           │
│  5. Geçiş karar algoritması (durum makinesi + override)                   │
│  6. Değişken süre atama (fade/black) + düzensiz kırpma                    │
│  7. (Opsiyonel) geçiş haritası onayı  [premium UI]                        │
│  8. ÇIKTI: <bölüm_adı>_manifest.json + native yollar + arşiv             │
└──────────────────────────────────────────────────────────────────────────┘
      │  (manifest.json + native yollar)
      ▼
┌──────────────── MONTAJCI — Premiere UXP panel (tek "Kur" butonu) ────────┐
│  importFiles() → native stereo  │  newSequence + overwriteClip (kırpma)   │
│  createAddVideoTransitionAction → Cross Dissolve / Dip to Black (değişken)│
│  RENDER YOK → düzenlenebilir timeline                                      │
└──────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Neden Tauri (✅)
- **Gerçek `.app`** üretir (web değil): çift tıkla açılır, Dock'ta durur, offline çalışır. Tauri CLI otomatik olarak `.app`/`.dmg`'ye paketler, codesign + notarization seçenekleri sunar (min macOS 10.13; pratikte 10.15+ hedefle).
- **%100 Claude Code ile, sıfırdan finale kadar komutla** kurulabilir (Xcode GUI'sine bağımlı değil). Kullanıcının "baştan sona Claude Code" hedefine en uygun.
- **En açık/yeni ekosistem:** Rust çekirdek + web UI; istenen animasyon/grafik/UI bileşeni takılıp-çıkarılabilir (modeli/parçaları kolay değiştirme ilkesiyle uyumlu). Electron'dan daha hafif/küçük; ileride çapraz-platforma açılabilir.
- UI'nin "web ile çizilmesi" kullanıcıya görünmez; sıradan bir Mac uygulaması gibi durur.

### 2.2 ML / analiz yan-süreci (Python sidecar)
- Embedding + kare analizi **PyInstaller ile tek-parça binary** yapılır ve Tauri'ye **`externalBin` (sidecar)** olarak gömülür → kullanıcı Python kurmak zorunda kalmaz. Çağrı: shell plugin `Command.sidecar(...)`.
- Sidecar adı **`-$TARGET_TRIPLE`** ekiyle olmalı (Apple Silicon: `...-aarch64-apple-darwin`). Kişisel kullanım için arm64-only yeterli; her iki mimari istenirse universal binary gerekir (Tauri yalnız Rust binary'sini çoğullar, sidecar'ı sen universal yapmalısın).
- Beyin ↔ sidecar iletişimi: stdin/stdout (JSON) veya kısa ömürlü komut çağrıları. Uygulama kapanınca sidecar süreçleri **öldürülmeli** (orphan bırakma).

### 2.3 İmzalama / notarization (Mac güvenlik) ✅ KARAR: AD-HOC
- ✅ **Karar: ad-hoc imza (ÜCRETSİZ).** Kullanıcı uygulamayı **kendi makinesinde, kişisel** kullanacak. Ad-hoc imza yeterli: ilk açılışta "System Settings → Privacy & Security"de **bir kez** "yine de aç", sonra hep normal açılır. Apple Developer hesabı **gerekmez**.
- **İleride dağıtım gerekirse (geri dönüşlü):** **Developer ID Application** sertifikası + notarization (ücretli Apple Developer hesabı, ~$99/yıl) — tek ayar değişikliği. Tauri bunu env değişkenleriyle yapar (`APPLE_SIGNING_IDENTITY`, `APPLE_ID`/`APPLE_PASSWORD`/`APPLE_TEAM_ID` veya App Store Connect API anahtarı). Kod yapısı bunu en baştan destekleyecek şekilde kurulsun (imza yolu soyut).
- ⚠️ **Bilinen tuzaklar (Claude Code dikkat) — ad-hoc'ta da geçerli:** (a) sidecar/iç binary'ler `externalBin` ile eklendiğinde **her biri ayrıca imzalanmalı** (ad-hoc'ta `codesign -s -`; notarization'da hardened runtime + entitlements) yoksa açılış/notarization sorun verir; (b) Tauri WebView **JIT entitlements** ister, yoksa açılışta çökebilir. `Entitlements.plist` buna göre ayarlanmalı; (c) Apple Silicon hedef üçlüsü `aarch64-apple-darwin` doğru kurulmalı (sidecar adlandırması dahil).

🔧 **CLAUDE CODE GÖRÜŞ/ÖNERİ ALANI (mimari):**
- **Sidecar paketleme:** PyInstaller tek-binary mi, yoksa ayrı runtime + resource mu daha sağlam? CoreML kullanılırsa (Bölüm 5) Python yükü azalır — değerlendirir misin?
- **Beyin↔panel veri aktarımı:** manifest'i sabit bir yola mı yazalım, panel "watch" mı etsin, yoksa kullanıcı dosyayı panelde mi seçsin? En akıcısı hangisi?
- Mimari basitleştirme: ileride beyin'i de UXP hybrid panele taşıyıp tek-parça yapmak mantıklı mı (v2 notu)?

---

## 3. ⭐ KRİTİK: Premiere köprüsü ve stereo ses çözümü (UXP) ✅ KARAR

### 3.1 Sorun ve kök neden (kanıtlandı)
Elle yazılan FCP7 XML (xmeml) Premiere 26.3'te sesi **mono'ya indiriyor** — denenen tüm varyantlar (2 mono track, tek track native referans, `premiereTrackType="Stereo"`, `outputs`/pan filtreleri) ya 2 ayrı mono katman ya tek-mono verdi. Modern `.fcpxml` ise import edilemiyor (gri). Buna karşılık kullanıcının **doğrudan `.mp4` sürüklemesi native stereo veriyor** (tek katman, alt alta L≠R, monitörde sağ/sol ayrı).

**Kök neden:** Native sürüklemede dosyayı **Premiere'in kendi import motoru** açıyor ve kanal düzenini koruyor. Dosya-formatı interchange'i (XML/AAF) bunu güvenilir yapamıyor.

**✅ Çözüm ilkesi:** Timeline'ı dışarıdan dosyayla vermek yerine, **Premiere'e dosyaları kendine import ettirip kurguyu içeride kurdurmak.** `importFiles(...)` ile native import → ses **otomatik stereo** (sürüklemeyle birebir aynı motor). Bu ilke, hangi scripting API kullanılırsa kullanılsın geçerlidir.

### 3.2 Hangi scripting API? → **UXP (birincil) ✅**
- **ExtendScript:** çalışıyor ama **Eylül 2026'da Adobe tarafından kapatılıyor** (Kasım 2025'te Premiere UXP'ye geçti). Üstüne kalıcı sistem kurmak yanlış. QE DOM ise resmen "%100 desteksiz ve önerilmiyor" (Adobe).
- **UXP:** Adobe'nin yeni resmî yöntemi. `@adobe/premierepro` npm paketi + resmî TypeScript tipleri. Import, kırpma (in/out), **geçiş ekleme** ve efektler API'de mevcut. Resmî örnek panel `premiere-api` bunların hepsini çalıştırıyor.
- **Stereo değişmiyor:** UXP `importFiles` de aynı native import motorunu kullanır → **native stereo garantisi UXP'de de geçerli.**

> Karar: Köprü **UXP plugin (panel)** olarak yazılır. ExtendScript yalnızca, UXP'de geçiş ekleme canlı testte yetersiz çıkarsa **geçici** yedek (uzun vadede yine UXP'ye taşınır).

### 3.3 Somut UXP API'si (resmî tip bildirimlerinden)
Giriş: `const app = require("premierepro");` (UI thread'i bloklamaz; method'lar `Promise`, property'ler senkron). Değiştirme işlemleri **transaction/Action modeli** ile yapılır: `createXAction(...)` ile bir Action üret, `project.executeTransaction(cb, undoString)` içinde çalıştır.

Kullanılacak çekirdek çağrılar:
- **Import:** `importFiles(filePaths: string[], suppressUI?, targetBin?, asNumberedStills?): Promise<boolean>` → native stereo project item'lar.
- **Sequence:** `project.newSequence(name, pathToSequencePreset)` → 1920×1080, 24fps preset'inden yeni sequence.
- **Klip yerleştirme:** `sequence.overwriteClip(projectItem, time, vTrackIndex, aTrackIndex)` (ardışık yerleştirmede ripple olmadan; `insertClip` alternatif).
- **Kırpma (in/out):** `createSetInPointAction(...)` ve `createSetOutPointAction(...)` (TickTime ile track item in/out); ayrıca in noktasını "saniye kaydırarak" değiştiren yardımcı var.
- **Geçiş ekleme:** `createAddVideoTransitionAction(videoTransition: VideoTransition, options?: AddTransitionOptions): Action`. `VideoTransition` = Cross Dissolve (fade) / Dip to Black (black); `AddTransitionOptions` = hizalama (merkez) + **süre**. Geçişler düzenlenebilir gelir.
- **Manifest okuma (panel):** UXP `fs` modülü — `const fs = require("fs"); const file = await fs.getFileForOpening(); const content = await file.read();` (veya bilinen yoldan oku). `manifest.json` buradan okunur.
- **Render YOK.**

### 3.4 Build akışı (panelin yaptığı)
1. `manifest.json`'ı oku (native yollar + sıra + her klibin in/out + her birleşimin geçiş tipi & süresi).
2. `importFiles([native yollar])` → stereo project item'lar (tek bir hedef bin'e).
3. `newSequence(bölüm_adı, preset)` → 1920×1080 24fps.
4. Her klip için: `overwriteClip(...)` ile sıraya koy; `createSetInPointAction`/`createSetOutPointAction`'ı bir transaction'da çalıştırarak kırp.
5. Her `transition_in` için: `createAddVideoTransitionAction(Cross Dissolve | Dip to Black, {alignment: center, duration})` → transaction'da çalıştır.
6. Bitti — düzenlenebilir, native stereo, render'sız timeline.

### 3.5 Tetikleme
Beyin app `manifest.json` + native yolları yazar. Premiere'de **UXP panelinde tek "Kur" butonu** manifesti okuyup yukarıdaki akışı çalıştırır. (Komut satırından script tetikleme Adobe tarafından "önerilmiyor, platforma göre değişir" — panel butonu resmî/önerilen yol.) İleride otomatik tetik için panel bir "watch" klasörü dinleyebilir.

### 3.6 Sürüm uyumu (önemli)
Her Premiere sürümü belirli bir UXP sürümü içerir (örn. Premiere 25.6 = UXP 8.1). Plugin `manifest.json`'da `host.minVersion` bildirir ve **kurulu sürümde mevcut API'leri** hedefler. Kullanıcının Premiere 26.x sürümünde mevcut method imzaları canlı doğrulanır.

### 3.7 ⭐ İLK İŞ — DE-RISK (kod yazmadan önce)
Resmî `AdobeDocs/uxp-premiere-pro-samples` deposundaki **`premiere-api`** panelini referans alıp, 2-3 gerçek klip üzerinde canlı doğrula:
1. `importFiles` ile gelen klip **native stereo** mı (tek katman, L≠R, paning)?
2. `overwriteClip` + `SetInPoint/SetOutPoint` ile **kırpma** çalışıyor mu?
3. `createAddVideoTransitionAction` ile **Cross Dissolve + Dip to Black** özel süreyle eklenebiliyor ve **düzenlenebilir** mi?
4. `VideoTransition` nesnelerinin tam adlarını/erişim yolunu ve `AddTransitionOptions`'taki süre/hizalama alanlarını **kesinleştir** (buraya yaz).

Üçü de tutarsa tüm sistem UXP üstüne kurulur. Geçiş ekleme yetersizse → geçici ExtendScript+QE DOM köprüsü (sonra UXP'ye taşınır); o da yetersizse AAF/OTIO ihracı (`exportAAF`/`exportAsOpenTimelineIO` API'leri var) değerlendirilir.

🔧 **CLAUDE CODE GÖRÜŞ/ÖNERİ ALANI (köprü):**

**✅ DE-RISK SONUÇLARI (oturum 1 — Premiere 26.x'te CANLI GEÇTİ, 2026-06-28):**
- **Native stereo: KANITLANDI.** `importFiles` + `createSequenceFromMedia` ile klip sesi timeline'da **A1'de tek stereo katman** geldi (iki mono değil, mono değil). Eski XML sorununun izi yok.
- **Geçişler: KANITLANDI** (düzenlenebilir geldi). Tam matchName'ler (Premiere 26.x):
  - Cross Dissolve (fade) = **`AE.ADBE Cross Dissolve New`** (timeline etiketi: "Cross Dissolve (Legacy)").
  - Dip to Black = **`AE.ADBE Dip To Black`**.
  - Keşif: `ppro.TransitionFactory.getVideoTransitionMatchNames()` → regex eşleştirme (kırılgan hardcode yerine).
- **AddTransitionOptions:** `setApplyToStart(true)` + `setDuration(ppro.TickTime.createWithSeconds(s))` çalıştı. `setTransitionAlignment` vermeden hiza kabul edilebilir; gerekirse ince ayar.
- **Kırpma (kesin zincir):** `clipProjectItem.createSetInOutPointsAction(inTT, outTT)` — **yerleştirmeden ÖNCE**, kaynak seviyesinde. in=1.0/out=7.0 → 6s klip + her iki uçta ~1s handle (geçiş malzemesi yetti).
- **Yerleştirme:** `project.createSequenceFromMedia(name, [tüm klipler])` hepsini **sıralı/kırpılı/stereo** dizer → ayrı `overwriteClip` döngüsü gerekmez. (Tek-tek gerekirse `ppro.SequenceEditor.getEditor(seq).createOverwriteItemAction(item, time, 0, 0)` — ⚠️ **ham `ProjectItem` geç; cast `ClipProjectItem` "Invalid parameter" verir**.)
- **Transaction:** `project.lockedAccess(() => project.executeTransaction((ca) => ca.addAction(action), "etiket"))`.
- **Render YOK.** Tam API referansı: `DEVAM.md` §8. Panel: `panel/` (düz JS, build gerekmez).

**Karar:** Köprü tamamen **UXP** üstüne kuruluyor — ExtendScript yedeğine gerek kalmadı.

**Açık sorular (ileride):**
- `overwriteClip` vs `insertClip` — ardışık yerleştirme + geçiş tutamağı için hangisi daha temiz?
- Geçiş tutamağı: UXP'de geçişin malzeme bulması için klip kenarındaki fazla pay nasıl garanti edilir (in/out paylarıyla, Bölüm 8)?
- Tek transaction'da toplu mu (tüm klipler + geçişler) yoksa parça parça mı çalıştıralım (performans + geri-alma)?
- Aynı dosyanın tekrar import'unu (idempotency) ve hedef bin düzenini nasıl yönetelim?
- İleride "her şey tek UXP hybrid panel" (ML'i C++ addon'da) konsolidasyonu mantıklı mı — görüşün?

---

## 4. Girdi: prompt belgesi + video klasörü (PROMPT-ODAKLI MODEL ✅)

Bölüm 5.1 testi gösterdi: kare-AI sahne sınırını güvenilir vermiyor. Çözüm: **kararın omurgası, kullanıcının zaten ürettiği prompt belgesi olsun.** Prompt'lar sahnenin "üretim senaryosu"dur — dosya adından çok daha zengin ve kesin.

### 4.1 Üç girdi
1. **Image prompt belgesi — ZORUNLU / BİRİNCİL.** 160 prompt, her sahne için bir tane, **bir satır boşlukla ayrık, sırasıyla, kayma yok** → `prompt[N]` ↔ sahne `N`. Format tüm bölümlerde **sabit ve hazır**.
2. **Video prompt belgesi — OPSİYONEL.** Varsa yalnızca **hareket/kamera** sinyali için okunur (bkz. 4.4); yoksa sistem image prompt'la tam çalışır.
3. **Video klasörü** — 160 sahnenin videoları (bazı sahnelerde çift çekim). Numara ile eşleşir.

### 4.2 Eşleştirme (basit ve sağlam)
- `prompt[N]` (belgedeki N. satır-bloğu) ↔ baş-numarası **N** olan video(lar). Kayma olmadığı için doğrudan sıra/numarayla eşleşir.
- **Doğrulama:** prompt sayısı (160) ile bulunan sahne numaraları örtüşüyor mu? Eksik/fazla varsa UI'da uyar (sessizce yanlış eşleştirme yapma).
- Çift çekim sadece **videoda** olur (prompt'ta o sahne tek satır). Aynı numaradan birden çok video → **1080p** olanı seçilir (bkz. 4.5).

### 4.3 Prompt parser (asıl omurga — deterministik, AI'sız)
Her prompt'tan **kelime/regex tabanlı** çıkarılır (20 bölümde şema doğrulandı):
- `scale` ∈ {drone, wide, medium, close-up, extreme close-up, pov, other} — "X shot" kalıbı.
- `subjects` — parantez kodlarından karakter harfleri (f/m/d veya bölüme özel) / karakter yoksa `no_characters`.
- `state` ∈ {interior(`*in*`), exterior(`*out*`), sleeping(`*slp*`), establishing(`hro`)}. `hro`=yapı dış kuruluş çekimi (20/20 bölümde) → "nefes"/fade beat'i.
- `regime/locus` ∈ {exterior, interior, sleeping} — `state` + **renk betimi** (prompt'taki "deep slate blue/charcoal" = soğuk/dış ↔ "amber/honey glow" = sıcak/iç; ikisi birden = eşik).
- `location_text` — prompt'un içerik kelimeleri (mekân isimleri: tent, trail, stream, dome, fireplace…) → aynı rejim içinde **konum-değişimi** tespiti için prompt-metin benzerliği (Bölüm 5.2).

⚠️ Format sabit olduğu için parser şemaya güvenle dayanır; kullanıcı ileride prompt şablonunu değiştirirse parser uyarlanır.

### 4.4 Video prompt'tan olası fayda (opsiyonel, değerlendirilecek)
Image prompt sahne/mekân/mood/özneyi zaten tam verdiği için **karar omurgası image prompt'tur.** Video prompt'ın olası katkısı sadece **hareket yoğunluğu / kamera hareketi** (push-in, pan, "çok hareketli" vs "sabit duruş"): çok hareketli klipte cut daha enerjik, sakin klipte fade daha akıcı olabilir → **cut-vs-fade ince ayrımına** küçük katkı. Tasarım: video prompt **opsiyonel girdi** olarak alınır, varsa "hareket" sinyaline çevrilir ve cut-vs-fade'i **hafifçe** etkiler. Gerçek bir video-prompt belgesi gelince katkısı ölçülüp ağırlığı netleştirilecek (yoksa tamamen göz ardı edilir).

### 4.5 Varyant seçimi (çift çekim) — AKILLI ✅
Aynı baş-numaradan birden fazla video varsa:
1. Çözünürlüğü `ffprobe` ile oku; **1080p** olanları aday al (1080p yoksa en yükseği + UI uyarısı).
2. Sağlık kontrolü: süre ~8s mı, kodek beklenen mi, bozuk/yarım mı → eler.
3. **Akıllı seçim (rastgele yerine):** kalan 1080p adaylar arasında, **komşu kliplere en pürüzsüz bağlananı** seç. Ölçüt: adayın **ilk karesi** önceki klibin **son karesine**, adayın **son karesi** sonraki klibin **ilk karesine** parlaklık/renk/kompozisyon olarak ne kadar yakın (düşük zıtlık = pürüzsüz). Soldan sağa **greedy** tek geçiş; eşit/yakınsa bölüm-adı tabanlı seed ile kararlı seçim. "Yeniden seç" düğmesi kalır.

> Not: Bu, kareyi "sahne sınırı bulmak" için değil, "bu bağlantı pürüzsüz mü" için kullanır — Bölüm 5.1 testinin desteklediği geçerli kullanım.

### 4.6 Kareler ve bölüm adı
- **Kareler artık karar için DEĞİL, sadece önizleme** (geçiş haritasında küçük-resim) için her videodan bir akıllı kare çıkarılır (Bölüm 5). Karar prompt'tan gelir.
- ✅ **Bölüm adı prompt belgesinin adından** türetilir (örn. "(2.Bölüm) Glass Dome Treehouse … Image Prompt.txt" → `2_Glass_Dome_Treehouse`) → çıktı adı + arşiv otomatik. Kullanıcı son adı düzenleyebilir.

🔧 **CLAUDE CODE GÖRÜŞ/ÖNERİ ALANI (girdi):**
- Prompt parser: kodlar + renk + içerik-kelimeleri çıkarımı için en sağlam kural seti? Bölüme özel karakter harflerini (f/m/d vs y/c/h…) genel şemayla nasıl yakalarız?
- Eşleştirme doğrulaması: numara boşluğu/çift çekim/eksik video durumlarında en net uyarı akışı?
- Video prompt gerçekten geldiğinde "hareket" sinyalini nasıl çıkaralım (kamera-hareketi kelimeleri) ve cut-vs-fade'e ne ağırlıkla bağlayalım — ölç ve yaz.

---

## 5. Analiz katmanı — sinyal hiyerarşisi (GERÇEK TESTLE KARARLAŞTIRILDI) ✅

**Kare çıkarma (akıllı kare):** ✅ Sadece videodan. Tam ortadaki tek kare yerine klip boyunca **birkaç aday kare** örnekle (örn. %35/%50/%65) ve **en temsili** olanı seç. Test ışığında "en temsili" = adayların embedding'i içinde **medyan/komşularına en yakın** olan (yağmur parçacığı/hareket bulanıklığı dışlanır); keskinlik (Laplacian varyansı) ikincil ölçüt.

### 5.1 ⚠️ KRİTİK TEST BULGUSU (Bölüm 41, gerçek 160 kare)
Gerçek veride **CLIP (ViT-B/32) vs DINOv2 (ViT-S/14) vs histogram** kıyaslandı; ölçüt: bilinen iki perde sınırını (24→25 dış→iç, 128→129 iç→gece) within-act gürültüsünden ayırma. Sonuç:
- **Ardışık kare embedding mesafesi sahne sınırını GÜVENİLİR vermiyor** — ne CLIP ne DINO. Sınırlar mesafe sıralamasında çok geride kaldı (CLIP 24→25 #107/159, DINO 24→25 #144/159; ayrışma <1.0x). Sebep: bu içerikte bir **sahne içinde** de kareler çok değişiyor (geniş→yakın çekim→nesne close-up'ı), sınırlar tek-kare sıçraması yapmıyor.
- **Pencereli değişim-noktası** (bölgeyi öncesi/sonrasıyla kıyaslama) da kurtarmadı (en iyi DINO W8 sep=1.11x ama sınırlar hâlâ #61/#32).
- **Renk (histogram) dış→iç sınırını iyi yakaladı (#9)** çünkü o sürdürülen bir sıcak-soğuk değişimi; ama iç→gece sınırını kaçırdı (ikisi de sıcak).
- **Çıkarım:** kare-embedding'i bu görevde **omurga olamaz.** Asıl güvenilir sinyaller **dosya etiketleri** ve **sürdürülen renk rejimi**dir.

### 5.2 ✅ Sinyal hiyerarşisi (prompt-odaklı, teste göre)
1. **BİRİNCİL — Prompt kodları + renk betimi** (deterministik "sahne senaryosu"): image prompt'tan `in/out/slp/hro` + renk ("slate blue/charcoal"=soğuk/dış ↔ "amber/honey glow"=sıcak/iç) + özne + ölçek (§4.3). Büyük sınırları (dış→iç, →gece, kuruluş çekimleri) ve rejimi **doğrudan ve güvenilir** verir. 20 bölümde tutarlı (2128 `in`, 372 `out`, 241 `slp`; `hro` 20/20). Sistemin omurgası.
2. **İKİNCİL — Prompt-metin benzerliği** (aynı rejim içinde konum değişimi): ardışık prompt'ların içerik-kelime benzerliği; **düşük benzerlik = sahne/mekân değişti**. Gerçek prompt'larda doğrulandı (sahne-içi medyan ~0.55, değişim anları ~0.30) — kare-AI'dan çok daha temiz. Yerel, hafif.
3. **ÜÇÜNCÜL / OPSİYONEL** — (a) **video prompt hareket sinyali** (varsa cut-vs-fade'i hafifçe etkiler, §4.4); (b) **kare rengi** sürdürülen biçimde doğrulama için; (c) **görsel embedding (MobileCLIP) tamamen opsiyonel** — esas işlevi geçiş haritası **küçük-resmi**; karara katkısı kalibrasyonda zayıf çıkarsa hiç kullanılmaz.

### 5.3 ✅ "Akıllı" sinyal: prompt-metin benzerliği (+ opsiyonel modeller)
- **Birincil yöntem (modelsiz, deterministik):** ardışık prompt'larda **içerik-kelime kosinüs/Jaccard** benzerliği. Test edildi, makul ayrışma verdi; hiçbir model gerektirmez, tamamen offline. Önce bu.
- **Yükseltme (gerekirse):** çok küçük **yerel metin-embedding** modeli (örn. MiniLM ~80MB, offline) ile daha ince konum-değişimi. Pluggable; ancak kelime-benzerliği yetiyorsa eklenmez.
- **Görsel embedding (MobileCLIP):** **opsiyonel** — yalnızca kare-doğrulaması kalibrasyonda değer katarsa; aksi halde dahil edilmez. Eklenirse Python yan-süreçte ONNX/CoreML, PyInstaller'a gömülü, ilk kurulumda bir kez indirilir.
- **Kare çıkarma:** karar için değil, **önizleme küçük-resmi** için (§4.6).

🔧 **CLAUDE CODE GÖRÜŞ/ÖNERİ ALANI (analiz):**
- Prompt-metin benzerliği: kelime-overlap mı, küçük metin-embedding mi gerçek bölümlerde sahne-içi konum değişimini daha iyi veriyor? Ölç ve yaz.
- "Sahne değişti" eşiği: prompt benzerliği + rejim değişimi + (renk) nasıl birleştirilsin ki ne kaçırsın ne fazla bölsün (histerezis)?
- Görsel embedding kare-doğrulaması karara ölçülebilir katkı yapıyor mu — yapmıyorsa kapat.
- Video prompt geldiğinde "hareket" çıkarımı (kamera-hareketi kelimeleri) + cut-vs-fade'e ağırlığı.

---

## 6. Yapısal çeşitlilik (20 bölüm analizi → 3 tip) ✅

Algoritma **sabit perde konumu varsaymamalı**. 20 bölüm analizinden çıkan tipler:

- **Tip A — Yolculuk→Yuva (3 perde):** soğuk-dış yolculuk → eşik → sıcak-iç → gece/uyku. (B2, B8, B37). İçe-geçiş ~30. klip; black'ler gerçek eşiklerde.
- **Tip B — İç-ağırlıklı:** baştan içeride, az/yok dış yolculuk. (B114 %98 iç, B13, B17, B20, B22, B23, B60). Az black (çoğu sadece uyku), ağırlıklı cut + ara fade.
- **Tip C — Dış-ağırlıklı:** sıcak-iç yok; sığınak da açıkta. (B55, B75, B77, B79, B91, B93, B99). Soğuk→sıcak yayı zayıf; yapı hava/yoğunluk + tek sığınak anı.

**Tasarım ilkesi (soft prior):** "Bölümler aynı durumda (iç/dış/uyku) **ardışık çekim blokları** içerir; farklı durum/konum blokları arası **fade veya black**; blok içi **cut**." Durum, **prompt kodları (in/out/slp) + prompt renk betimi + prompt-metin benzerliğinden çıkarılır**, dayatılmaz. `hro` (yapı dış kuruluşu) tekrar eden bir "nefes" beat'idir → genelde **fade** noktası.

🔧 **CLAUDE CODE GÖRÜŞ/ÖNERİ ALANI (yapı):** Bölüm tipini (A/B/C) otomatik sınıflandırıp eşikleri tipe göre hafifçe ayarlamak ister miyiz, yoksa tek genel algoritma yeterli mi? Görüşün?

---

## 7. Geçiş karar algoritması (kanıtlanmış kurallar + durum makinesi) ✅

Prototip kullanıcının gerçek 16-35 setinde kanıtlandı (8 cut, 11 fade, 1 black; fade süreleri 1.0–1.9s; her karar açıklanabilir; sahne-içi çerçeve değişimleri doğru biçimde **cut** kaldı). Üretim sürümü:

> ⚠️ **Bölüm 5.1 testinin algoritmaya yansıması:** Büyük sınırlar (BLACK) ve rejim, **prompt kodları + renk betimi**nden gelir — kare-embedding bunlara karar VERMEZ (testte güvenilmez çıktı). Aynı rejim içindeki konum değişimi **prompt-metin benzerliğinden**; cut-vs-fade ince ayrımı buna (ve opsiyonel video-hareket sinyaline) dayanır. Yani aşağıdaki kuralların 1–3 ve 5'i (BLACK/FADE override'ları) prompt kodları+renk omurgasına dayanır; "görsel mesafe" yerine **prompt-metin mesafesi** 4. ve 6. maddede tie-breaker'dır.

**Durum makinesi:** `state ∈ {exterior, interior, sleeping}` izlenir; her klibin `locus/state` etiketi + **sürdürülen renk sıcaklığı** ile güncellenir (embedding değil).

**Karar kuralları (öncelik sırasıyla):**
1. **BLACK** — gerçek konum/zaman değişimi: `state` dış→iç eşiği (ilk kez içeri), veya gündüz→**gece/uyku** başlangıcı; AND görsel mesafe yüksek. (B2'de: trapdoor girişi + gece geçişi.)
2. **FADE** — bu klip `ENVIRONMENT`/`no_characters`/`hro` (kuruluş/manzara) veya drone/pull-back beat'i.
3. **FADE** — önceki klip kuruluş/insert idiyse (sahneye dönüş).
4. **CUT** — `ACTION` etiketi VEYA görsel mesafe eşiğin altında (sahne içi devamlılık, close-up'lar).
5. **FADE** — aynı konumda özne değişimi (kim sahnede değişti).
6. **FADE** — görsel mesafe ≥ eşik (sahne bloğu sınırı).
7. **CUT** — aksi halde.

**Cozy ayarı:** ✅ Çoğunluk **cut**; tipik kurguya göre **daha fazla fade**; **black yalnızca** gerçek mekan/zaman değişiminde.

🔧 **CLAUDE CODE GÖRÜŞ/ÖNERİ ALANI (algoritma):**
- Eşikler (görsel mesafe persentili vb.) sabit mi, bölüme göre **otomatik kalibre** mi olsun (build anında Claude ile kalibre edip dondurma fikri)?
- "Çok sık fade" / "art arda iki black" gibi istenmeyen ritimleri engelleyen bir **düzleştirme/komşu-kuralı** ekleyelim mi (örn. min. N cut arası fade)?
- Açıklanabilirlik: her karar için kısa gerekçe ("neden fade") UI'da gösterilsin mi (gözden geçirme adımı için çok değerli)?

---

## 8. Kırpma kuralı ✅

Her klip baştan **~1 sn** ve sondan **~1 sn** kırpılır; **ondalık, rastgele, asla tam 1.000 sn değil**; orta kısım (~5.4–6.6 sn) korunur. ✅

**Ritme duyarlı modülasyon (bkz. §9.5 #1, #2):** Bu temel kırpma, sahnenin **rejimine** ve **çekim ölçeğine** göre hafifçe ayarlanır — iç/uyku ve kuruluş/drone çekimleri biraz **daha uzun tutulur**, yolculuk/dış ve yakın/aksiyon biraz **daha kısa**. Böylece tempo mekanik değil "kompoze" hisseder. (Aralıklar yine ~1sn civarı; modülasyon küçük, ±0.3sn mertebesinde.)

**Geçiş-tutamağı (handle) kısıtı:** Geçişin her iki yanındaki klip kenarının **≥ T/2** kadar fazladan malzemesi olmalı (yoksa geçiş malzeme bulamaz). Bu yüzden **geçişe komşu kenarlar** biraz daha büyük kırpılır (baş in ≥ ~1.0s, son out ≤ ~7.0s), komşu olmayan kenarlar daha hafif (~0.8–1.3s). Tekrarlanabilirlik için bölüm-adı tabanlı seed.

🔧 **CLAUDE CODE GÖRÜŞ/ÖNERİ ALANI (kırpma):** Kullanıcı önceden "ortadan bir parça da çıkarılabilir mi" diye değinmişti; varsayılan **iki ucu kırp-ortayı tut**. Alternatif (ortadan da pay alma) bir konfig seçeneği olarak dursun mu?

---

## 9. Süre atama (değişken fade/black) ✅

- **Fade:** ~1.0–2.0 sn, **değişken** (asla standart); büyüklük **prompt-metin mesafesinden** (ne kadar farklı sahne) + seed'li jitter; 0.05'e yuvarla.
- **Black (dip to black):** ~1.5–2.5 sn, değişken.
- **Cut:** süresiz. (Cut sınırlarında çok kısa ses mikro-fade'i tıklamayı önler — bkz. §9.5 #3.)

---

## 9.5 ✨ Kurgu mükemmelliği rafineleri (içeriğe özel) ✅

"İyi algoritmik kurgu"yu "elle yapılmış gibi"ye taşıyan, cozy yağmur ASMR'a özel rafineler. Hepsi otomatik; geçiş haritasında yine elle ince ayar yapılabilir.

**#1 Nefes alan tempo (rejime göre):** Klip süreleri rejime göre modüle edilir — **iç/uyku** sahneleri biraz **daha uzun tutulur** (sakin, nefes alsın), **yolculuk/dış** biraz daha tempolu. Sinyal: prompt rejimi. (§8 kırpmaya bağlı, ±~0.3sn.)

**#2 Çekim ölçeğine göre kırpma:** **Kuruluş/drone/manzara** çekimleri uzun durur (izleyici manzaraya dalsın); **yakın/aksiyon** çekimleri daha kısa/öz. Sinyal: prompt ölçeği. Usta kurgu mantığı.

**#3 Ses pürüzsüzlüğü (ASMR için kritik):** Yağmur sesi asla "tık" yapmamalı. **Her birleşimde — cut'lar dahil — çok kısa ses çapraz-geçişi** uygulanır; sahne/konum değişiminde **stereo alan kayması fade ile maskelenir**. ASMR'da ses sürekliliği görüntüden önemli; kaliteyi en çok artıran madde. (Premiere'de native audio crossfade ile.)

**#4 "Sarsıcı cut" yumuşatma (kareyi burada kullanırız):** Bir kesimde çıkan klibin **son karesi** ile giren klibin **ilk karesi** parlaklık/renk/kompozisyon olarak çok zıtsa, o cut **kısa bir fade'e** çevrilir. Kare sahne-sınırı bulmaz ama "bu kesim sarsıcı mı"yı iyi yanıtlar (Bölüm 5.1 testiyle uyumlu, geçerli kullanım). Sert kesimleri otomatik yumuşatır.

**#5 Açılış/kapanış imzası:** Bölümün en başında **siyahtan fade-in**, en sonunda **siyaha fade-out** (kanal imzası). Opsiyonel: "Ghibli Mood ON" tabela anına küçük bir tutuş.

**#6 Monotonluk önleme:** Aynı süre/desen art arda gelmez (fade süreleri çeşitlenir); **fade'ler arası min. N cut**; **art arda iki black yok**. Ritim "kompoze" hisseder, mekanik değil.

**+ Akıllı varyant seçimi:** çoklu 1080p arasında komşulara en pürüzsüz bağlanan seçilir (§4.5).

🔧 **CLAUDE CODE GÖRÜŞ/ÖNERİ ALANI (rafineler):**
- Her rafinenin **şiddetini** (tempo modülasyon miktarı, sarsıcı-cut eşiği, mikro-crossfade süresi, min-cut-arası-fade) Mac'te gerçek bölümlerde kalibre et; değerleri config'e koy ve buraya yaz.
- #3 stereo-alan-kayması maskeleme: hangi sahne değişimlerinde devreye girsin (sadece black/fade'lerde mi, yoksa büyük pan farkı olan cut'larda da mı)?
- #4 sarsıcı-cut eşiği: parlaklık mı, renk mi, kompozisyon mu daha iyi gösterge — ölç.
- Her rafine **config'ten kapatılabilir** olmalı (kullanıcı istemezse).

---

## 10. Manifest şeması (JSON EDL) — TAM ve SÜRÜMLÜ ✅

Beyin bunu üretir; **UXP paneli** bunu okuyup timeline'ı kurar. Sürümlü (`schema_version`), ileri-uyumlu (bilinmeyen alanlar yok sayılır), tekrarlanabilir (seed). Tam şema:

```json
{
  "schema_version": "1.0",
  "episode": { "name": "108_Greenhill_Turf_House", "source_doc": "(108.Bölüm) Greenhill Turf House Image Prompt.txt" },
  "sequence": { "fps": 24, "width": 1920, "height": 1080, "par": "square", "audio_rate": 48000, "audio_channels": 2 },
  "build": { "generated_at": "2026-06-28T12:00:00Z", "seed": "108_Greenhill_Turf_House", "engine_version": "1.0", "config_hash": "ab12cd" },
  "intro": { "fade_in_from_black": 1.0 },
  "outro": { "fade_out_to_black": 1.5 },
  "clips": [
    {
      "index": 1,
      "scene": 1,
      "file": "/Users/.../108/0001_drone_environment.mp4",
      "in": 0.00, "out": 6.92,
      "enabled": true,
      "meta": { "scale": "drone", "subjects": [], "regime": "exterior", "state": "establishing" },
      "transition_in": null,
      "audio": { "micro_crossfade": 0.06, "mask_stereo_shift": false },
      "decision": {
        "reason": "açılış (kuruluş çekimi)",
        "confidence": 0.95,
        "signals": { "regime_change": null, "prompt_sim_prev": null, "color_shift": null, "jarring_cut": false, "motion": null },
        "user_overridden": false, "algo_default": null
      },
      "variant": { "chosen": "0001_drone_environment.mp4", "candidates": ["0001_..a.mp4","0001_..b.mp4"], "reason": "tek 1080p" },
      "thumb": "/Users/.../_archive/108/thumbs/0001.jpg"
    },
    {
      "index": 2, "scene": 2,
      "file": "/Users/.../108/0002_wide_family_interior.mp4",
      "in": 1.15, "out": 7.00, "enabled": true,
      "meta": { "scale": "wide", "subjects": ["mother","father","daughter"], "regime": "interior", "state": "interior" },
      "transition_in": { "type": "black", "dur": 1.80, "align": "center" },
      "audio": { "micro_crossfade": 0.06, "mask_stereo_shift": true },
      "decision": {
        "reason": "dış→iç eşiği (rejim değişti) + renk soğuk→sıcak",
        "confidence": 0.9,
        "signals": { "regime_change": "exterior→interior", "prompt_sim_prev": 0.31, "color_shift": 0.62, "jarring_cut": false, "motion": "low" },
        "user_overridden": false, "algo_default": { "type": "black", "dur": 1.80 }
      },
      "variant": { "chosen": "0002_wide_family_interior.mp4", "candidates": ["..."], "reason": "akıllı: önceki kareye en pürüzsüz" },
      "thumb": "/Users/.../_archive/108/thumbs/0002.jpg"
    }
  ]
}
```

**Alan açıklamaları:**
- `transition_in`: önceki kliple bu klip arası geçiş — `type` ∈ `null`(cut)/`fade`/`black`, `dur` saniye, `align` (merkez). İlk klipte `null`; `intro`/`outro` ayrı.
- `in`/`out`: kaynak içindeki kırpma noktaları (saniye; UXP TickTime'a çevirir).
- `enabled`: kötü çekim devre dışı bırakılırsa `false` (build'e girmez).
- `meta`: prompt'tan çıkan referans (ölçek/özne/rejim/state) — UI ve hata ayıklama için.
- `audio`: §9.5 #3 — her birleşimde mikro-crossfade süresi; sahne değişiminde stereo-alan maskeleme bayrağı.
- `decision`: **şeffaflık** — gerekçe, güven skoru (odak inceleme için), karara götüren sinyaller, kullanıcının elle değiştirip değiştirmediği + algoritmanın orijinal kararı (sıfırla için).
- `variant`: seçilen + adaylar + seçim gerekçesi (akıllı/tek/uyarı).
- `thumb`: önizleme küçük-resmi yolu (arşivde).

> UXP paneli yalnızca `file`, `in/out`, `transition_in`, `audio`, `intro/outro`, `enabled` alanlarını kullanır; gerisi UI/şeffaflık içindir (panel bilmeyenleri yok sayar).

🔧 **CLAUDE CODE GÖRÜŞ/ÖNERİ ALANI (manifest):** Süre temsili saniye mi tick mi tutulsun (UXP TickTime'a en kayıpsız çevrim)? `decision.signals` setini canlı kalibrasyonda zenginleştir. Manifest'i ayrıca insan-okunur bir "karar raporu" olarak dışa verelim mi?

---

## 11. Montaj: UXP paneli ve Premiere'de kurulum ✅

Beyin yalnızca **`manifest.json`** üretir (Bölüm 10). Montajı **UXP paneli** yapar (Bölüm 3); ayrı bir `.jsx` üretilmez. Panelin "Kur" akışı (Bölüm 3.4'teki mantık):
1. `manifest.json`'ı oku (UXP `fs`).
2. Native yolları `importFiles` ile içeri al (→ **stereo**).
3. `newSequence` (1920×1080, 24fps, tam sayı timebase).
4. Her klibi `in/out` ile `overwriteClip` + `createSetInPointAction`/`createSetOutPointAction` (transaction) ile sıraya yerleştir.
5. Her `transition_in` için `createAddVideoTransitionAction` → Cross Dissolve (fade) / Dip to Black (black), **değişken süreyle**.
6. `audio` alanına göre mikro-crossfade; `intro/outro` fade-in/out.
7. Render yok → düzenlenebilir, native stereo timeline.

⚠️ **DE-RISK önce:** Bölüm 3.7'deki 2-3 kliplik stereo+geçiş kanıtı yapılır; UXP method imzaları oradan kesinleşip buraya yazılır. (Geçişler UXP'de yetersiz çıkarsa **geçici** ExtendScript yedeği; import yine UXP ile, stereo korunur.)

🔧 **CLAUDE CODE GÖRÜŞ/ÖNERİ ALANI (montaj):**
- Panel manifesti **sabit yoldan mı** okusun, "watch" mı etsin, yoksa kullanıcı panelde mi seçsin? En akıcısı?
- Hata toleransı: bir klip import edilemezse panel ne yapsın (atla + Premiere'de görünür özet bırak)?
- Büyük import (160 dosya) + çok sayıda transaction'da performans/optimum gruplama?

---

## 12. Çıktı adlandırma ve arşiv ✅

- Çıktılar **bölüm adına** göre isimlenir: `108_Greenhill_Turf_House_manifest.json` + opsiyonel `..._thumbs/` küçük resimler. (Ayrı `.jsx` yok; montajı UXP paneli yapar.)
- Bir **arşiv klasörü** (konfigte yol): her bölüm kendi alt klasöründe saklanır; geçmişe dönüp yeniden açılabilir.
- ✅ Bölüm adı **prompt belgesinin adından** türetilir (Bölüm 4.6); arşiv ve çıktı adlandırması bunu kullanır. Kullanıcı son adı düzenleyebilir.

---

## 13. UI/UX — premium, gelişmiş tasarım ✅

Hedef: günlük üretim yapan bir power-user için hem **tek-tık hızlı** hem de istenildiğinde **derin kontrol**. Basit-varsayılan, derin-istenince. Karanlık tema (video işi için doğru), akıcı ama abartısız hareket.

### 13.1 Üç mod (katmanlı)
- **Hızlı mod:** seç → "Kur" → manifest hazır. Tek ekran, sıfır ara adım. Acelesi olan gün için.
- **Kontrollü mod (varsayılan):** analiz + **geçiş haritası incelemesi** + ince ayar + kur.
- **Yönetmen modu (gelişmiş panel):** rafine slider'ları, eşik ayarları, alternatif kurgu stilleri, canlı yeniden hesap. Kontrollü modun "derin" katmanı.

Mod, üstte tek bir anahtarla değişir; aynı bölümde moddan moda geçilebilir.

### 13.2 Ekran akışı
1. **Giriş (Intake):** büyük sürükle-bırak alanları — **image prompt belgesi (zorunlu)**, **video klasörü**, **video prompt (opsiyonel)**. Anında doğrulama paneli: "160 prompt ↔ 160 sahne eşleşti ✓", çift çekim sayısı, eksik/fazla uyarısı, çözünürlük dağılımı. **Bölüm adı** prompt belgesinden otomatik gelir, düzenlenebilir.
2. **Analiz:** canlı ilerleme (parse → eşleştirme → prompt-benzerliği → önizleme kareleri → karar), sayaç, sakin yağmur animasyonu. Uyarılar burada toplanır.
3. **İnceleme çalışma alanı (kalp):** §13.3.
4. **Çıktı/Kur:** "Premiere'de Kur" (tek tık) + manifest/arşiv konumu + kısa özet (kaç cut/fade/black, toplam süre).
5. **Arşiv/Geçmiş:** geçmiş bölümler kartlar halinde; yeniden aç, düzenle, yeniden kur.

### 13.3 İnceleme çalışma alanı (en kritik — detaylı)
Üç katmanlı tek ekran:

- **Üst — Mini-harita (overview):** tüm bölümün küçültülmüş şeridi. **Rejim renk bantları** (dış=soğuk mavi, iç=sıcak amber, gece=koyu lacivert) + geçiş yoğunluğu + bayrak işaretleri. Bölümün "şeklini" tek bakışta gösterir; tıkla → o noktaya atla. **Güven renklendirmesi:** düşük-güvenli kararlar belirgin.
- **Orta — Film şeridi (filmstrip):** 160 klip yatay, her klip **önizleme küçük-resmi** + numara + süre. Klipler arası **geçiş baloncuğu**: cut/fade/black ikonu + süre. Yatay kaydır + zoom (klavye/trackpad).
  - **Geçiş baloncuğuna tıkla:** tip değiştir (cut/fade/black), **süre slider'ı**, ve **"neden böyle?"** gerekçesi.
  - **Klibe tıkla → sağ Inspector:** prompt metni, rejim/özne/ölçek, kırpma in/out (elle ayarlanabilir), **varyant adayları** (önizleme + değiştir), **"bu klibi çıkar"** (kötü çekim; şerit otomatik dengelenir).
- **Sağ — Inspector + Gerekçe paneli:** seçili öğenin tüm detayı + **karara götüren sinyaller** (rejim değişti mi? prompt-benzerlik skoru, renk kayması, ölçek, sarsıcı-cut tespiti). Şeffaflık = güven.

**Etkileşim:**
- **Klavye sürüşü:** ←/→ birleşimler arası gez, **C/F/B** ile tip ata, **Space** önizle, **Delete** klibi çıkar, **Z** geri al. 160 klip için hız şart.
- **Toplu işlem:** birden çok birleşim seç → hepsini cut/fade yap, süreleri ölçekle.
- **Geri/İleri al (undo/redo):** tüm düzenlemelerde.
- **Default'tan fark (diff):** kullanıcının elle değiştirdiği geçişler işaretli; "algoritmaya sıfırla" (tek geçiş veya tümü).

### 13.4 Odak inceleme (focus review) — günlük hız için
160 birleşimin çoğu bariz cut'tır; hepsini tek tek görmek gerekmez. **"Sadece dikkat gerektirenleri göster"** filtresi: düşük-güvenli kararlar, otomatik-yumuşatılmış sarsıcı cut'lar, eksik varyant, çift çekim, rejim eşikleri (black/fade). Kullanıcı yalnızca **~15-25 kritik noktayı** gözden geçirir, gerisi otomatik kabul. Günlük üretimi dakikalara indirir.

### 13.5 In-app geçiş önizleme (premium özellik)
Seçili birleşimde, **gerçek video dosyalarından** çıkan klibin son ~2sn'si + geçiş + giren klibin ilk ~2sn'si **uygulama içinde oynatılır** (HTML5 video + **stereo ses**). Premiere'e gitmeden geçişi ve sesi **hissedersin** — tıklama-sesi/stereo kayması burada duyulur. ASMR'da ses kritik olduğu için ayrıca **"sadece sesi dinle"** ve **"tüm geçişleri arka arkaya önizle"** modu.

### 13.6 Yönetmen paneli (gelişmiş)
- **Rafine slider/toggle'ları (§9.5):** tempo modülasyonu, sarsıcı-cut eşiği, mikro-crossfade süresi, fade/black aralıkları, min-cut-arası-fade, açılış/kapanış imzası — her biri **kapatılabilir**.
- **Canlı yeniden hesap:** bir slider'ı oynat → tüm geçiş haritası **anında** güncellensin (karar motoru saniyeler sürüyor).
- **Alternatif kurgu stilleri:** "Daha sakin" / "Daha tempolu" / "Daha sinematik" ön-ayarları — tek tıkla tüm haritayı yeniden üretir; **A/B karşılaştır**.
- **Profiller:** bir stil kaydet (örn. "gece bölümü", "yolculuk bölümü") → sonraki bölümlerde tekrar kullan.

### 13.7 Tasarım dili
- Koyu zemin (kömür / gece mavisi), **sıcak amber–altın vurgu**, yumuşak köşeler, ince gölge, hafif cam hissi.
- Ghibli/yağmur dokunuşu **zarif ve ince** (örn. analiz ekranında sakin yağmur) — profesyonel, oyuncak değil.
- Tipografi temiz/okunur; sayı ve teknik bilgi net hizalı.
- Hareket akıcı ama abartısız; "premium yazılım" hissi. Karanlık tema varsayılan; açık tema opsiyonel.

### 13.8 Performans/teknik
- 160 küçük-resim: **sanal liste (virtualized)** + lazy-load → akıcı kaydırma.
- In-app önizleme: Tauri **asset protokolüyle** yerel video oynatma; sadece istenince yükle, oynatma bitince bırak.
- Canlı yeniden hesap: karar motoru Python yan-süreçte hızlı; UI optimistik güncellenir.
- Tüm düzenleme durumu bellekte + arşive yazılır (yeniden açılınca aynen gelir).

🔧 **CLAUDE CODE GÖRÜŞ/ÖNERİ ALANI (UI):**
- Film şeridi + mini-harita + inspector için en akıcı bileşen mimarisi (sanal liste, küçük-resim önbelleği)?
- In-app geçiş önizlemesi gerçek dosyalarla **takılmadan** nasıl oynatılır (önbellek, ön-yükleme, kısa segment kırpma)?
- "Güven skoru" nasıl hesaplanıp renklendirilsin (odak inceleme için kritik)?
- Canlı yeniden hesap için karar motorunu UI'dan ayrı, hızlı bir serviste mi tutalım?
- Tasarım sistemi (renk token'ları, tipografi, bileşenler) için somut bir öneri ver.

---

## 14. Yerel "yapay zeka" ve API politikası ✅

- Çalışma anında **ücretli/harici AI YOK**. İnternet serbest (örn. modelin ilk kurulumda indirilmesi) ama API gerekmez.
- "Bizim yapay zekamız" = gömülü embedding modeli (CLIP/DINO) + deterministik karar mantığı + renk/metadata sinyalleri.
- Build anında Claude Code serbest (kalibrasyon, eşik ayarı sonra **dondurulur**).

---

## 15. Konfigürasyon (tüm ayarlar tek yerde) ✅

Tek `config.toml` (veya JSON) tüm "knob"ları tutar; UI'dan düzenlenebilir; her bölümde kullanılan config bir `config_hash` ile manifeste yazılır (tekrar üretilebilirlik). İki katman: **Temel** (UI'da görünür) ve **Gelişmiş** (Yönetmen modunda açılır). Aşağıdaki varsayılanlar başlangıç noktasıdır; **Faz 2'de gerçek bölümlerde kalibre edilip kesinleşir.**

### Temel ayarlar (varsayılanlar)
```toml
[sequence]
fps = 24
width = 1920
height = 1080
audio_rate = 48000
audio_channels = 2

[mode]
default = "controlled"          # fast | controlled | director
focus_review = true             # sadece kritik birleşimleri göster

[paths]
archive_dir = "~/GhibliMoodON/_archive"
manifest_out = "~/GhibliMoodON/_manifest"     # panelin okuduğu yer
```

### Gelişmiş ayarlar (varsayılanlar)
```toml
[trim]                          # §8
head_min = 0.8
head_max = 1.3
tail_min = 0.8
tail_max = 1.3
never_exactly = 1.000
transition_edge_extra = 0.25    # geçişe komşu kenar payı (handle ≥ T/2)
take_from_middle = false        # opsiyonel orta-pay (varsayılan kapalı)

[transition]                    # §9
fade_min = 1.0
fade_max = 2.0
black_min = 1.5
black_max = 2.5
round_to = 0.05
min_cuts_between_fades = 2      # §9.5 #6
no_back_to_back_black = true

[decision]                      # §5, §7
black_on_regime_change = true   # dış↔iç, →gece gerçek eşikte black
prompt_sim_scene_change = 0.40  # bu eşiğin altı = sahne/konum değişti (kalibre edilecek)
color_shift_weight = 0.5        # kare rengi doğrulaması ağırlığı (opsiyonel)
fade_vs_cut_text_threshold = 0.55  # rejim içi: bu altı fade, üstü cut (kalibre)

[refinements]                   # §9.5 — her biri kapatılabilir
breathing_tempo = true          # #1 rejime göre tempo
breathing_amount = 0.30         # ± saniye
scale_aware_trim = true         # #2 ölçeğe göre kırpma
audio_micro_crossfade = 0.06    # #3 her birleşimde (cut dahil)
mask_stereo_shift = true        # #3 sahne değişiminde
jarring_cut_soften = true       # #4
jarring_cut_threshold = 0.60    # kontrast eşiği (kalibre)
open_close_signature = true     # #5
fade_in_from_black = 1.0
fade_out_to_black = 1.5
hold_on_plaque = false          # opsiyonel tabela tutuşu

[variant]                       # §4.5
prefer_resolution = "1080p"
selection = "smart"             # smart | random
health_check = true             # süre/kodek/bozukluk elemesi

[frames]                        # §4.6 — yalnız önizleme
thumb_sample = "midpoint"       # küçük-resim noktası
boundary_frames = true          # akıllı varyant + sarsıcı-cut için ilk/son kare

[model]                         # §5 — opsiyonel görsel embedding
image_embedding = "off"         # off | mobileclip   (varsayılan kapalı)
text_similarity = "wordoverlap" # wordoverlap | minilm
device = "auto"                 # auto | cpu | coreml
model_dir = "~/GhibliMoodON/_models"

[build]
seed_policy = "episode_name"    # bölüm adından deterministik seed
```

🔧 **CLAUDE CODE GÖRÜŞ/ÖNERİ ALANI (config):** Faz 2 kalibrasyonundan çıkan **gerçek** değerleri buraya yaz (eşikler, aralıklar, rafine şiddetleri). Hangi knob'lar Temel'de kalsın, hangileri Gelişmiş'e? Config şemasını da sürümle.

---

## 16. Yapım fazları (sıkı sıra, her faz kendi testiyle kapanır) ✅

Her faz **çalışan, gösterilebilir bir kontrol noktasıyla** biter. "Bitti" kriterleri karşılanmadan bir sonraki faza geçilmez. Her faz **gerçek veriyle** doğrulanır.

### Faz 0 — ⭐ Demo prototip + stereo de-risk (KRİTİK, her şeyden önce ve bağımsız)
Tüm sistemi kurmadan önce **basit hatlarla bir demo prototip** kur ve sistemi en baştan test et. UXP'de küçük bir uçtan-uca prova: **birkaç gerçek klip** native `importFiles` → `newSequence` → `overwriteClip` + in/out kırpma → 1 **Cross Dissolve** (fade) + 1 **Dip to Black**.
- **Amaç:** En riskli iki şeyi **gerçek videolarla** kanıtlamak — (a) video **geçişleri** Premiere'e düzgün/düzenlenebilir aktarılıyor mu, (b) sesler **native STEREO** aktarılıyor mu.
- **Bitti kriteri:** (a) timeline'da ses **native stereo** (tek katman, L≠R, monitörde sağ/sol ayrı) — kullanıcı gözle/kulakla doğrular; (b) iki geçiş **düzenlenebilir** geldi; (c) render yok. Sonuç §3.7'ye yazılır.
- **Bu demo GEÇMEDEN tüm yapıyı/sistemi kurmaya geçme.** Geçerse Faz 1'e; **tutmazsa** yaklaşım burada düzeltilir: geçişler için ExtendScript geçici yedeği denenir (yine UXP import ile **stereo korunur**); import+stereo her hâlükârda UXP'de kalır.
- **Kullanıcı adımı (basitçe tarif et):** kullanıcı sadece birkaç örnek videoyu sağlar ve Premiere'de paneldeki butona tıklayıp sonucu (geçişler + stereo) gözle/kulakla onaylar. Gerisini Claude Code yapar.

### Faz 1 — Omurga (başsız / CLI, UI yok)
Uçtan uca tek komut: image prompt + video klasörü → parse → eşleştirme (prompt[N]↔video N) → varyant seç → prompt-benzerliği → önizleme kareleri → geçiş kararı → kırpma → **manifest.json** → UXP panel "Kur" → Premiere'de timeline.
- **Bitti kriteri:** kullanıcının **gerçek bir bölümünde** (160 klip) komut sonuna kadar çalışıyor; Premiere'de düzgün, stereo, düzenlenebilir bir timeline kuruluyor; manifest şemaya uygun; 160 eşleşme doğrulanıyor; çökme/eksik-dosya zarifçe ele alınıyor.

### Faz 2 — Algoritma kalibrasyonu → DONDUR
Kanıtlanmış prototip kuralları taşınır; eşikler/rafineler (§15) kullanıcının **gerçek bölümlerinde** ayarlanır; **A/B/C tiplerinde** (§6) test edilir.
- **Bitti kriteri:** birkaç gerçek bölümde geçiş kararları + kırpma + rafineler kullanıcı onayından geçer (kurgu "elle yapılmış" hisseder, ses kesintisiz); kalibre edilmiş değerler config'e + §15'e yazılır; davranış **sabitlenir** (çalışma anında AI/kalibrasyon yok). Bu fazdan sonra algoritma "donmuş" kabul edilir.

### Faz 3 — Premium UI (§13)
Intake → analiz → **inceleme çalışma alanı** (mini-harita + film şeridi + inspector/gerekçe) → odak inceleme → **in-app stereo önizleme** → yönetmen paneli (canlı yeniden hesap, alt stiller, profiller) → çıktı/arşiv.
- **Bitti kriteri:** üç mod da çalışıyor; 160 küçük-resim akıcı (sanal liste); geçiş tıkla-değiştir + toplu + undo/redo + diff/sıfırla çalışıyor; in-app önizleme gerçek dosyalarla **takılmadan stereo** oynuyor; odak inceleme kritik noktaları doğru süzüyor; tasarım dili (§13.7) uygulanmış.

### Faz 4 — Cila & paketleme
Mac `.app` (Tauri) + Python sidecar + model gömülü; **ad-hoc imza** (§2.3); ilk-kurulum model indirme akışı; performans; hata toleransı; arşiv/geçmiş.
- **Bitti kriteri:** temiz bir Mac'te `.app` açılıyor (ilk açılışta bir kez "yine de aç"); sidecar/model çalışıyor; offline çalışıyor; günlük akış baştan sona pürüzsüz; bilinen tuzaklar (sidecar imza, JIT entitlements) çözülmüş.

> **Genel kural:** her fazda yeni bir parça eklenince ilgili **gerçek-veri testi** tekrar koşulur (regresyon); bir şey bozulursa düzeltilmeden ilerlenmez.

---

## 17. Kanıtlanmış referans kod ve veri (build anında elimde)

Aşağıdakiler kullanıcının gerçek görüntüsünde çalıştı; Claude Code referans alabilir / kullanıcıdan isteyebilir:
- **Geçiş karar prototipi** (16-35 setinde): metadata parse + ardışık görsel mesafe + öncelikli karar kuralları + değişken süre (seed'li jitter). Üretimde histogram → CLIP/DINO embedding.
- **FFmpeg birleştirici** (sadece **önizleme/test** için; günlük araçta render YOK): EDL CSV okuyup kırpma + xfade + dip-to-black + ses mikro-fade ile birleştirir; süre matematiği doğrulandı.
- **FCP7 XML mekanikleri** (artık ana yol değil, ama bilgi olarak): cut/fade/black geçişleri Premiere'e "(legacy)" düzenlenebilir geliyordu; tek eksik native stereo idi → bu yüzden **UXP** (native import = stereo) yoluna geçildi.
- **20 bölüm yapısal analizi** (bu belgenin Bölüm 6/7'si): tip dağılımı, in/out/slp şeması, hro yaygınlığı, renk yayı, ölçek dağılımı.
- **Örnek veri:** 16-35 (20 klip, biri 3 varyantlı), Bölüm 41 (160 görsel), 20 bölümün image-prompt belgeleri.

---

## 18. Karar durumu ve Claude Code'a kalan iş

Bu belgedeki büyük tasarım kararları kullanıcıyla **kapatıldı** (✅). Aşağıda durum + Claude Code'un asıl üreteceği iş.

**Kapanan kararlar (✅, aynen uygula):** stack = Tauri 2 + Python sidecar (§2); Premiere köprüsü = UXP, ExtendScript yalnız geçici yedek (§3); karar = **prompt-odaklı**, image prompt birincil, görsel-AI opsiyonel (§4-5); girdi = prompt belgesi + video klasörü + opsiyonel video prompt, eşleştirme prompt[N]↔video N (§4); geçiş hissi + kırpma + §9.5 rafineleri (§7-9.5); akıllı varyant (§4.5); manifest şeması (§10); UI/UX 3 mod + odak inceleme + in-app stereo önizleme + yönetmen paneli (§13); config + varsayılanlar (§15); fazlar + bitti kriterleri (§16); imza = ad-hoc (§2.3).

**Claude Code'un asıl işi (her bölümün 🔧 alanlarında detaylı):**
1. **Faz 0 stereo de-risk** — UXP'de canlı kanıt (§3.7), method imzalarını kilitle.
2. **Gerçek format doğrulama** — gerçek video dosya adı + prompt şablonundan parser'ı kilitle (§4).
3. **Faz 2 kalibrasyon** — eşikleri/rafineleri gerçek bölümlerde ayarla, config'e + §15'e yaz, **dondur** (§16).
4. **Performans** — 160 klip/gün hedef süresi; darboğazlar (kare çıkarma vs import vs UI); sanal liste + önizleme akıcılığı (§13.8).
5. **Hata toleransı** — bozuk/eksik klip, import hatası, Premiere'de görünür özet.
6. **Paketleme** — sidecar imza + JIT entitlements + model gömme + ilk-kurulum indirme (§2.3, §14).
7. **Tasarım sistemi** — somut renk token'ları/tipografi/bileşen önerisi (§13.7).
8. **Daha iyi bir fikir?** — mimaride/akışta köklü iyileştirme görürsen gerekçeli öner + uygula (rol talimatı).

> Tüm 🔧 alanları, canlı testten çıkan kararlarınla doldurulacak; o alanlar Claude Code'un teknik defteridir.

---

## 19. Kabul kriterleri ("bitti" tanımı) ✅

- ✅ Image prompt belgesi + video klasörü seçilince, tek akışla, **bölüm adıyla** isimlenmiş bir **manifest.json** üretiliyor (160 prompt ↔ 160 sahne doğrulanıyor).
- ✅ UXP paneli "Kur" ile Premiere'de kurulduğunda: klipler **ayrı ve düzenlenebilir**, geçişler **düzenlenebilir** (Cross Dissolve / Dip to Black), süreleri **değişken**, **render yok**.
- ✅ Ses **native stereo** (tek katman, L≠R, paning yerinde) — doğrudan sürüklemeyle birebir; **her birleşimde tık yok** (mikro-crossfade), sahne değişiminde stereo-alan akıcı.
- ✅ Kırpmalar düzensiz (ondalık, ~1s baş+son, asla tam 1.0), rejime/ölçeğe duyarlı tempo, geçiş tutamakları yeterli.
- ✅ Black yalnızca gerçek mekan/zaman değişiminde; çoğunluk cut; tipikten fazla fade; açılışta siyahtan, kapanışta siyaha imza.
- ✅ A/B/C tiplerinin hepsinde mantıklı sonuç (sabit perde varsayımı yok).
- ✅ Çalışma anında hiçbir ücretli/harici AI çağrısı yok; tamamen yerel/offline.
- ✅ Çift çekimde 1080p tercih + **akıllı** (komşuya en pürüzsüz) seçim.
- ✅ Premium, akıcı UI: 3 mod, geçiş haritası + odak inceleme, **in-app stereo önizleme**, yönetmen paneli (canlı yeniden hesap), arşiv.
- ✅ Mac `.app` ad-hoc imzayla temiz makinede açılıyor; sidecar + model offline çalışıyor.
- ✅ Kurgu bütün olarak **"elle yapılmış" hisseder** (mekanik değil) ve ses ASMR kalitesinde kesintisiz.
- ✅ **Taşınabilir teslim hazır:** proje klasörü + içindeki belgeler başka bir Claude hesabına verilince, başka hiçbir şeye gerek kalmadan geliştirmeye devam edilebiliyor (§20).
- ✅ Uygulama adı **AutoReji**, sürüm **v1.1**'den başlayıp güncellemelerde artıyor; ad + sürüm UI'da ("Hakkında"/pencere başlığı) görünüyor.

---

## 20. Teslim / Devir paketi (taşınabilirlik) ✅

**Amaç:** Kullanıcı, projeyi **başka bir Claude hesabında** sıfırdan bağlam aktarmadan sürdürebilsin. Teslim **tamamen kendi kendine yeten** olacak: kullanıcı proje klasörünü (veya zip'ini) yeni bir hesaba/oturuma verir, "devam et" der ve **başka hiçbir şeye ihtiyaç duymaz.**

### 20.1 Teslim ne zaman / ne olarak
- **Yaşayan teslim:** `DEVAM.md` + `CHANGELOG.md` baştan oluşturulur ve **her faz/oturum sonunda güncellenir** (sadece en sonda değil). Böylece proje her an devredilebilir durumdadır.
- **Paket = proje klasörünün kendisi** (gerekirse tek zip). Kullanıcı isterse bir **özel Git deposu** da olur (sürüm geçmişi için ideal); Claude Code kurmaya yardım eder.

### 20.2 Paketin içeriği (repo kökünde, kendi içinde taşır)
1. **Tam kaynak kod** — Tauri uygulaması (beyin), Python sidecar (analiz/ML), UXP paneli (montajcı), tüm config ve varlıklar.
2. **`CLAUDE.md`** — bu belgenin "Rol ve Çalışma Talimatı" + proje konvansiyonları (klasör yapısı, isimlendirme, komutlar) + "nasıl devam edilir" özeti. Yeni Claude Code oturumu bunu **otomatik okur**.
3. **`DEVAM.md` (devir belgesi — en kritik)** — projenin **güncel durumu**: ne bitti / ne kaldı, mimari özet, **klasör haritası**, sıfırdan kurulum, çalıştırma/build/test komutları, **kalibre edilmiş config değerleri** (Faz 2 sonrası), çözülen tuzaklar, açık işler, `PLAN.md` checklist'inin güncel hâli. Yeni geliştirici (Claude veya insan) bununla **anında devralır**.
4. **`README.md`** — kısa tanıtım + "sıfırdan kurulum" adımları (bağımlılıklar, tek-komut kurulum).
5. **Bağımlılık manifestoları** — `package.json`, `Cargo.toml`, `pyproject.toml`/`requirements.txt` vb. → ortam **tam tekrar üretilebilir**.
6. **Bu Blueprint** — `docs/Blueprint.md` olarak repoya konur (tasarım gerekçesi/spec).
7. **Modeller** — gömülü ya da `scripts/fetch_models` ile **tek komutta** indirilir (offline çalışma için); yol config'te.
8. **Kurulum/çalıştırma scriptleri** — tek komutla ortam kurma + geliştirme + build (`scripts/setup`, `scripts/dev`, `scripts/build`).
9. **Sürüm + değişiklik kaydı** — `VERSION`/`package.json` = mevcut sürüm (**v1.1**'den başlar); `CHANGELOG.md` her sürümde ne değiştiğini yazar.

### 20.3 Yeni hesapta devam akışı (hedeflenen deneyim)
1. Kullanıcı klasörü/zip'i yeni Claude hesabında açar (Claude Code'a verir).
2. Claude Code `CLAUDE.md` + `DEVAM.md`'yi okur → bağlamı **tam** edinir.
3. `scripts/setup`'ı çalıştırır (bağımlılıklar + modeller) → ortam hazır.
4. `PLAN.md` checklist'inden kaldığı yerden devam eder.
> Sonuç: **başka hiçbir şeye ihtiyaç yok.** (Tek dış gereksinim: yeni makinede Claude Code + Premiere — ki bunlar kullanıcının araçları; proje bilgisi tamamen pakette.)

🔧 **CLAUDE CODE GÖRÜŞ/ÖNERİ ALANI (teslim):** `DEVAM.md` şablonunu en faydalı hâliyle tasarla (bir sonraki geliştiricinin ilk 5 dakikada ihtiyaç duyacağı her şey). Git deposu + `.gitignore` (büyük modelleri/araçları hariç tutma + tek-komut indirme) en temiz nasıl kurulur?

---

*Belge sonu — v1 (tamamlandı). Ürün: **AutoReji v1.1**. Claude Code: en baştaki "Rol ve Çalışma Talimatı"yla başla, iş planı + checklist çıkar, Faz 0 demo prototip (geçiş + stereo) kapısını geç, sonra fazları sırayla yürüt; `DEVAM.md`/`CHANGELOG.md`'yi yaşayan belge olarak güncel tut; her 🔧 alanını canlı testten çıkan kararlarınla doldur.*
