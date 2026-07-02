# AutoReji 2.0 — Sıfırdan Vizyon (Tasarım Belgesi)

> ⏸️ **DURUM: SADECE PLANLAMA / VİZYON — UYGULANMAYACAK (şimdilik).**
> Bu belge "uygulamayı bugün, aynı teknolojiyle (Tauri 2 + React 19 + Tailwind v4 + framer-motion + Radix) sıfırdan tasarlasaydık nasıl olurdu?" sorusunun cevabıdır. Hiçbir kod değişikliği içermez; kararlar kullanıcıyla birlikte, zamanı gelince verilecek.
> Tarih: 2026-07-02 · Taban: beta v1.0 (teknik 1.0.1)
> Bağlı belgeler: `docs/YOL_HARITASI_VE_VIZYON.md` (Ürün 2 / SaaS vizyonu) · `docs/UI_UX_DENETIM_2026-07-02.md` (güncel denetim; A–E maddelerine buradan atıf yapılır) · `docs/UI_GELISTIRME_FIKIRLERI.md` · `docs/Blueprint.md §13`.

---

## 0. Amaç ve varsayımlar

**Bu belge nedir:** 2.0 için kabuk (pencere düzeni + gezinme), tema evrimi, SaaS'a ölçeklenme, "1.0'dan ne yaşar" ve kademeli geçiş planı. Çizimler ASCII taslak; piksel-mükemmel değil, **yerleşim niyeti**dir.

**Bu belge ne değildir:** İş listesi değil. Motor/sidecar mimarisine dokunmaz. Ürün 2'nin (genel SaaS) iş modeli kararlarını tekrarlamaz — onlar `YOL_HARITASI_VE_VIZYON.md`'de.

**Sabit varsayımlar:**
- Aynı yığın: Tauri 2 + React + Tailwind v4 token sistemi + framer-motion + Radix + Zustand.
- AutoReji (Ürün 1) **offline kalır**; SaaS bölümleri (§3) yalnız Ürün 2 içindir.
- Kullanıcı teknik değil → gezinme her an "neredeyim, sırada ne var?" sorusuna cevap vermeli.
- Motor (sidecar + manifest) en değerli varlık; UI kabuğu onun etrafında değiştirilebilir katmandır.

---

## 1. Kabuk & Gezinme Modeli

### 1.1 Üç aday, tek seçim

| Aday | Güçlü yanı | Neden tek başına yetmez |
|---|---|---|
| **Bugünkü üst stepper** | Doğrusal akışı çok net anlatır; alan yemez | Uygulama-gezinmesi (Arşiv, Hazırlık, Hakkında) ile bölüm-akışı (Giriş→Kur) aynı barda karışıyor. Çok bölüm, ayarlar, yardım, (ileride) hesap/altyazı/format büyüdükçe üst bar taşar. "Tek seferde tek bölüm" varsayımına kilitli. |
| **Kalıcı sol ray (her ekran ray öğesi)** | Çok alanlı uygulamalarda standart; ölçeklenir | Boru hattının doğrusallığı kaybolur ("Analiz bitmeden İnceleme'ye giremezsin" bilgisini ray anlatamaz). Teknik olmayan kullanıcı için rehberlik zayıflar. |
| **MELEZ (ÖNERİ)** | Ray = "uygulamada neredeyim", bölüm şeridi = "bu bölümde neredeyim". İki soruyu iki ayrı, sade araçla cevaplar | Ray ~56px yatay alan yer (maliyet, aşağıda dürüstçe ele alındı) |

**KARAR ÖNERİSİ: Melez model.** İnce, ikon-tabanlı **sol ray** (uygulama düzeyi) + çalışma alanının üstünde **bölüm boru-hattı şeridi** (bölüm düzeyi; bugünkü stepper'ın DNA'sı burada yaşar).

### 1.2 Kabuk taslağı (ASCII)

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ ÜST BAR (~36px, cam): ⛰ AutoReji 2.0 · [aktif bölüm adı]        ⌘K   ◉ 3/3    │
├──────┬─────────────────────────────────────────────────────────────────────────┤
│      │ BÖLÜM ŞERİDİ (~44px):                                                   │
│  🏠  │  ● Giriş ✓ ── ● Analiz ✓ ── ◉ İnceleme ── ○ Kur     [Hızlı|Kontrollü|Yön.]│
│Stüdyo├─────────────────────────────────────────────────────────────────────────┤
│      │                                                                         │
│  🎬  │                                                                         │
│Bölüm │              AKTİF AŞAMANIN İÇERİĞİ                                     │
│      │   (İnceleme örneği: sahne + timeline + film şeridi + Inspector —        │
│      │    bugünkü ReviewScreen İÇERİĞİ AYNEN, sadece konteyner değişti)        │
│      │                                                                         │
│ ──── │                                                                         │
│  ⚙   │                                                                         │
│  ?   │                                                                         │
│ (👤) │                                                                         │
└──────┴─────────────────────────────────────────────────────────────────────────┘
  56px    Ray: 🏠 Stüdyo (ana ekran) · 🎬 Açık bölüm (yalnız bölüm açıkken görünür)
          Alt grup: ⚙ Ayarlar · ? Yardım · (👤 Hesap — YALNIZ Ürün 2/SaaS)
```

Kurallar:
- **Ray hep 56px, yalnız ikon + tooltip.** Genişleyen/daralan ray YOK (karmaşıklık + İnceleme ekranının yatay alanı değerli).
- **Bölüm şeridi** aşama durumlarını taşır: ✓ bitti · ◉ aktif · ○ kilitli. Analiz koşarken kendi adımında **mini ilerleme halkası** döner (denetim E4'ün kalıcı çözümü).
- Mod anahtarı (Hızlı/Kontrollü/Yönetmen) bölüm şeridinin sağına taşınır — bölüme ait bir ayardır, uygulamaya değil.
- ⌘K komut paleti **uygulama-geneli** olur: "Bölüm 9'u aç", "Stüdyo'ya dön", "ayarları aç" da paletle yapılır.

### 1.3 "Proje/Bölüm" zihinsel modeli (doğrusal sihirbazın yerine)

Bugün: uygulama = tek seferlik sihirbaz (aç → yükle → kur → kapat). Arşiv sadece "geçmiş kayıt defteri".

2.0'da: **Bölüm = belge (döküman) gibi bir varlıktır.** Word'ün dosyaları gibi: açılır, yarım bırakılır, devam edilir.

```
Bölüm varlığı (kalıcı):
  ad · kaynak girdiler (prompt yolu + video klasörü) · aşama (giriş/analiz/inceleme/kur/bitti)
  manifest + elle değişiklikler · son açılış zamanı · kapak karesi · kurulum kaydı (varsa)
```

- **Tek bölüm açık** kuralı korunur (bellekte tek manifest; sekme cehennemine girmiyoruz — dürüst basitleştirme).
- "Devam et" bölümü **kaldığı yerden** açar: aşama + seçili sahne + elle değişiklikler geri gelir. (Geri-al geçmişi kalıcı DEĞİL — bunu saklamak maliyetli ve gereksiz; dürüst sınır.)
- Analiz için 2.0 hedefi (ucuz orta yol): analiz **bölümün içinde** akar ama kullanıcı Stüdyo'ya dönüp gezebilir; ray'daki 🎬 ikonunda ilerleme halkası görünür. *Gerçek* arka-plan işi (uygulamayı kapat-aç, iş sürsün) sidecar iş-protokolü ister → M3 sonrası, pahalı, şimdilik vaat edilmez.

### 1.4 Stüdyo — çok-bölümlü ana ekran (ASCII)

Bugünkü Arşiv ekranının poster-galeri DNA'sı, uygulamanın **ana ekranına** terfi eder:

```
┌──────┬──────────────────────────────────────────────────────────────────────┐
│ ray  │  Stüdyo                                        [ara ⌘K]   Sistem 3/3 │
│      │                                                                      │
│      │  ┌ DEVAM ET ───────────────────────────────┐  ┌ + YENİ BÖLÜM ─────┐  │
│      │  │ [kapak]  Bölüm 12 · Rainy Harbor        │  │  prompt belgesi + │  │
│      │  │ ◉ İnceleme aşamasında · 158 klip        │  │  video klasörünü  │  │
│      │  │ son açılış: dün 21:40      [Devam et →] │  │  sürükle-bırak    │  │
│      │  └─────────────────────────────────────────┘  └───────────────────┘  │
│      │                                                                      │
│      │  BÖLÜMLER                     [filtre: Tümü | Sürüyor | Kuruldu ✓]   │
│      │  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐                   │
│      │  │kapak  │ │kapak  │ │kapak  │ │kapak  │ │kapak  │                   │
│      │  │B11 ✓  │ │B10 ✓  │ │B9  ⏸  │ │B8  ✓  │ │B7  ✓  │  ← poster kartlar │
│      │  │Kuruldu│ │Kuruldu│ │İncele.│ │Kuruldu│ │Kuruldu│    (Arşiv DNA'sı) │
│      │  └───────┘ └───────┘ └───────┘ └───────┘ └───────┘                   │
│      │                                                                      │
│      │  Sistem sağlığı: Premiere ✓ · AI modeli ✓ · MONTAJCI ✓    [⚙ detay]  │
└──────┴──────────────────────────────────────────────────────────────────────┘
```

- **"Devam et" kartı** en büyük öğe: yarım kalan iş her açılışta ilk göze çarpan şeydir (kullanıcının gerçek günlük rutini: her gün 1 bölüm).
- **"Yeni bölüm"** bugünkü IntakeScreen'in sürükle-bırak akışını açar (ekran olarak korunur, giriş noktası Stüdyo olur).
- Poster kartta durum rozeti: ✓ Kuruldu · ⏸ aşama adı (yarım) — "hangi bölüm ne durumda" tek bakışta.

### 1.5 Arşiv, Ayarlar, Yardım nereye gider?

| Bugün | 2.0'da |
|---|---|
| **Arşiv** (üst barda ikon, ayrı ekran) | **Ayrı ekran olarak KALKAR.** Stüdyo'nun "Bölümler" bölümüne erir ("Kuruldu ✓" filtresi = eski Arşiv). Poster kartlar, klasör-aç/sil eylemleri aynen taşınır. |
| **Hazırlık/Setup** (akışın 1. adımı + üst bar 3/3 çipi) | İkiye ayrılır: (a) **ilk açılış sihirbazı** (yalnız ilk kurulumda tam ekran), (b) **Ayarlar → Sistem** sekmesi (Premiere/model/MONTAJCI sağlık kartları + "Test et"). Üst bardaki 3/3 sağlık çipi kalır → tıklayınca Ayarlar→Sistem açılır. |
| **Ayarlar** (bugün yok; Hakkında dağınık) | Ray altında ⚙ → tek birleşik ekran, 4 sekme: **Sistem** (eski Hazırlık) · **Görünüm** (ileride tema seçimi, §2) · **Kurgu varsayılanları** (config'in salt-okunur görünümü; Faz 2 dondu — dokunulmaz) · **Hakkında** (bugünkü AboutDialog içeriği + sürüm notları). |
| **Yardım** (üst barda ⌨ ikonu, ShortcutsHelp) | Ray altında **?** → panel: klavye kısayolları + "ilk kullanım turunu yeniden başlat" (denetim E1) + sürüm notları bağlantısı. |
| **Hesap** (yok) | Yalnız Ürün 2: ray'ın en altında 👤 (bkz. §3.5). AutoReji'de bu yuva **hiç görünmez**. |

### 1.6 Dürüst maliyetler (kabuk)

- **En büyük gizli maliyet UI değil, durum yönetimi:** bugün store "tek manifest + screen union" varsayar. Bölüm-varlığı, kalıcılık (localStorage → dosya) ve devam-durumu için store'un omurgası elden geçer; ekranların neredeyse hepsi `useApp`'e dokunur. Bu, dikkatli faz planı ister (§5).
- Ray 56px yatay alan yer. İnceleme ekranı en yoğun ekran; Yönetmen paneli + Inspector açıkken min pencere genişliği ~1200px'e çıkar (bugün de fiilen bu civarda rahat).
- "Analiz sürerken Stüdyo'da gezin" bile (tam arka-plan işi olmadan) iptal/yeniden-giriş uç durumları getirir; test yükü küçümsenmemeli.
- Kabaca ölçek: kabuk değişimi tek başına **haftalar** mertebesi (günler değil).

---

## 2. Tema Evrimi — İki Yön

İki yön de **mevcut token'lardan türetilir** (`brain/src/index.css @theme`); ikisi de denetimin C-serisi borcunu (59 hardcoded hex, gölge kaosu, tipografi ölçeği) ödedikten sonra anlam kazanır.

### 2.1 Yön A — "Rafine Sinema" (mevcut kimlik, daha derin)

Bugünkü mürekkep+amber kimliği korunur; katmanlar derinleşir, ışık disiplinli hale gelir. Kimlik değişmez, **kalite algısı** artar.

Anahtar token farkları (mevcut → öneri):

| Token | Bugün | Rafine Sinema | Niyet |
|---|---|---|---|
| `--color-ink-1000` | yok | **#04060a (YENİ)** | Gövde arka planının en dibi; sahne derinliği bir katman artar (gradyan #141b29→#0b0e14→#04060a) |
| `.hairline` opaklığı | rgb(255 255 255 / **0.07**) | **0.11** | Kart sınırları görünür olur (denetim C6); tema bozulmaz |
| `--shadow-glow-sm` / `--shadow-glow-lg` | yok (40+ keyfi gölge) | **YENİ:** örn. `0 0 0 1px rgb(234 184 102/.45), 0 0 24px -6px var(--glow-amber)` | Seçim/vurgu gölgeleri 2 token'a, kalan her şey soft/raised/pop üçlüsüne iner (C3) |
| `--color-rain` | yok (RainCanvas'ta gömülü rgba(176,202,234,…)) | **#b0caea (YENİ)** | Yağmur/ambient tek kaynaktan; tema değişiminde tek yer (C1) |
| `--ambient-amber` / `--ambient-rain` | yok | **YENİ:** rgb(234 184 102/.05) · rgb(107 168 214/.04) | 2-3 çok yavaş salınan ışık blob'u (denetim B6a) — "film stüdyosu" havası; reduced-motion'da statik |
| Tipografi ölçeği | 20+ keyfi `text-[Npx]` | **YENİ:** `--text-2xs:10 … --text-display:34` adlandırılmış ölçek | Denetim C4; i18n/tema esnekliğinin ön şartı |

Cam disiplini (token değil, kural): aynı ekranda en çok 2 cam katmanı; `.glass-pop` yalnız yüzen öğelerde — bugünkü yorum satırındaki kural yazılı tasarım kuralına terfi eder.

### 2.2 Yön B — "Ghibli Sıcak Analog" (film + kâğıt)

Mavi-duman mürekkep, sıcak is/sepyaya kayar; altın doygunlaşır; başlıklara serif; çok hafif film greni. "Stüdyo cihazı" değil, "masaldaki atölye" hissi.

| Token | Bugün | Ghibli Sıcak Analog | Niyet |
|---|---|---|---|
| `--color-ink-900` (ve tüm ink merdiveni) | #0b0e14 (mavi eğilimli) | **#12100d** (is/kahve eğilimli; ink-800: #141a27→#1c1712) | Zemin ısınır; mavi cast gider |
| `--color-fg` | #eaeefb (soğuk beyaz) | **#f2ebdf** (kâğıt beyazı; muted/subtle aynı sıcaklıkta yeniden türetilir) | Metin "kâğıt üzerinde" okunur |
| `--color-amber-400` | #eab866 | **#e6a84e** (amber-300: #f6d293→#f3c87e) | Daha doymuş altın; tüm `--glow-*` rgba'ları yeniden hesaplanır (UXP paritesi: color-mix YASAK kuralı korunur) |
| `--font-serif` | yok | **YENİ:** `"Fraunces Variable", Georgia, serif` — paket: **`@fontsource-variable/fraunces`** (⚠️ **latin-ext alt kümesi ŞART** — ğ/ı/ş/ç/ö/ü) | Yalnız bölüm adı + hero başlıklar (denetim B8); gövde Inter kalır. Alternatif: `@fontsource-variable/source-serif-4` |
| `--grain-url` / `--grain-opacity` | yok | **YENİ:** küçük data-URI noise karosu · opacity **0.04** | CSS overlay film greni (denetim B6b) — canvas/JS döngüsü YOK; önce yalnız İnceleme önizleme çevresi |
| `--color-paper` / `--color-paper-ink` | yok | **YENİ:** #efe6d4 / #2a241c | Tek özel "kâğıt" yüzeyi (örn. Inspector'daki karar-gerekçesi kutusu) — masal dokunuşu, her yerde değil |

Dürüst riskler (B): tüm kontrastlar **yeniden ölçülür** (fg-subtle sıcak zeminde AA sınırına yaklaşabilir); rejim renkleri (dış=soğuk mavi!) sıcak zeminde kirlenebilir → rejim paleti de yeniden kalibre gerekir; +1 font dosyası (~100–200KB, offline pakete gömülür, sorun değil ama sıfır da değil); UXP panelinin ayrı CSS'i de senkron ister.

### 2.3 ÖNERİ ve gerekçe

**Öneri: Çekirdek = Yön A (Rafine Sinema). Yön B'den yalnız iki ödünç alma: (1) Fraunces serif'i bölüm adı/hero başlıkta dene (kolay geri alınır), (2) film grenini yalnız İnceleme önizleme çevresinde dene.**

Gerekçe:
1. **A, borç ödeyerek aynı kimliği derinleştirir** — düşük risk, WCAG dengesi bozulmaz, bugünkü "Modern Dark Cinema" onayının (denetim) devamı.
2. **B'ye tam geçiş pahalı:** ink+fg+amber+rejim+glow zincirleme yeniden kalibrasyon + UXP parite + kontrast ölçümü. Getirisi duygusal, maliyeti sistemik.
3. **B ölmez:** §3.1'deki tema mimarisi kurulunca B, "Ghibli Sıcak" adlı **seçilebilir tema** olarak ucuza geri gelir (AutoReji'nin imza teması / SaaS'ta marka temalarından biri). Bugün ikisinden birine kilitlenmek zorunda değiliz — mimari bu kararı erteletir, bu bir kazançtır.

---

## 3. SaaS Geleceğine Ölçeklenme (yalnız Ürün 2 — yerleşim taslakları)

> ⚠️ Bu bölümdeki hiçbir şey AutoReji'ye (offline Ürün 1) girmez. Amaç: 2.0 kabuğunun bu yükleri **yer açmadan taşıyabildiğini** kanıtlamak.

### 3.1 Çok-marka tema mimarisi (multi-brand)

Token'lar iki katmana ayrılır — bugünkü tek `@theme` bloğunun evrimi:

```css
/* Katman 1 — İLKEL (marka başına değişir): ham paletler */
[data-theme="cinema"]  { --brand-ink-900:#0b0e14; --brand-accent:#eab866; … }
[data-theme="ghibli"]  { --brand-ink-900:#12100d; --brand-accent:#e6a84e; … }

/* Katman 2 — ANLAMSAL (tüm bileşenler YALNIZ bunu okur): */
:root { --surface: var(--brand-ink-800); --accent: var(--brand-accent); --text: var(--brand-fg); … }
```

Bileşenler asla ilkel katmanı okumaz → yeni marka = tek CSS dosyası. Ön şart: denetim C1–C2 (59 hex + kamera-ölçeği renkleri token'a). Kural korunur: önceden-hesaplı rgba (UXP/eski webview paritesi), `color-mix()` yok.

### 3.2 Dil değişimi (20–30 dil)

- Tüm kopya `t('anahtar')` üzerinden (bugün ~yüzlerce sabit Türkçe dize — çıkarım işi büyük ve mekanik; yalnız Ürün 2'de yapılır).
- **+%30 genişleme kuralı:** hiçbir etikete sabit genişlik verilmez; butonlar `min-width` + esner; bölüm şeridi adımları dar pencerede **ikon+tooltip'a düşer**; sayı/tarih `Intl` ile.
- **RTL notu (Arapça/İbranice):** yerleşim `pl-/pr-` yerine mantıksal (`ps-/pe-`, start/end) yazılır; ok/chevron ikonları yön-duyarlı. **İstisna:** film şeridi + zaman çizelgesi **her dilde soldan-sağa kalır** (zaman ekseni medya konvansiyonudur; NLE'ler RTL'de bile timeline'ı çevirmez) — bu istisna baştan yazılı kural olmalı, yoksa yarı-çevrilmiş kaos çıkar.

### 3.3 Altyazı editörü — yerleşim

İnceleme çalışma alanının **alt bölgesi sekmeli** olur; altyazı ayrı ekran DEĞİL, kurgunun yanında yaşar:

```
┌──────┬───────────────────────────────────────────────┬──────────────────┐
│ ray  │  önizleme sahnesi        [16:9 ▾ · 9:16 · 1:1]│ INSPECTOR        │
│      │  ┌─────────────────────┐  ┌────┐              │ [Karar│Altyazı│  │
│      │  │     16:9 sahne      │  │9:16│ ← yan yana   │        Format]   │
│      │  │ (letterbox + güvenli│  │kırp│   format     │  ← sekmeli olur  │
│      │  │  alan çizgileri)    │  │pen.│   önizleme   │                  │
│      │  └─────────────────────┘  └────┘              │ seçili öğe       │
│      │  ── genel bakış / timeline ────────────────── │ ayrıntısı        │
│      │  [ Film şeridi │ Altyazılar ]   ← sekmeli alt │                  │
│      │  ┌ 00:12–00:16  "yağmur birden bastırıyor" ┐  │ 🔒 Pro rozeti    │
│      │  │ 00:16–00:21  "vapur düdüğü uzaktan…"    │  │ (kilitli özellik │
│      │  └ satır içi düzenle · stil ▾ · böl/birleş ┘  │  deseni, §3.5)   │
└──────┴───────────────────────────────────────────────┴──────────────────┘
```

- Altyazı sekmesi: zaman-sıralı satır listesi (satır içi metin düzenleme, böl/birleş, stil seçici). Inspector'ın "Altyazı" sekmesi seçili satırın stilini (font/renk/konum/karaoke) düzenler.
- Dürüst not: bu bir **gerçek editör**dür (undo, zaman çakışması, kaydırma-senkron) — "panel eklemek"ten çok daha büyük iş.

### 3.4 Format önizleme (9:16 / 1:1)

- Önizleme sahnesinin üstünde **format anahtarı** (16:9 ▾ · 9:16 · 1:1 · platform ön-ayarları). Seçim, sahneyi letterbox'lar + güvenli-alan çizgileri çizer.
- Auto-reframe verisi geldiğinde: 16:9 karenin üzerinde **sürüklenebilir kırpma penceresi** (9:16 penceresi) — kullanıcı AI'nın kadrajını elle düzeltebilir. Kırpma verisi sidecar'dan gelir; UI yalnız gösterir/düzeltir.
- Bölüm şeridine etkisi yok; format, bölümün bir özelliğidir (Inspector → Format sekmesi + Kur/Çıktı aşamasında hedef seçimi).

### 3.5 Hesap / paket UI — yerleşim

- **Ray altı 👤** → Hesap sayfası: profil · abonelik/paket · fatura · çıkış. (Login zorunlu olduğundan ilk açılış = giriş ekranı; kabuk login'den sonra yüklenir.)
- **Paket rozeti** ray'daki avatarın köşesinde (Free/Pro/Stüdyo rengi).
- **Kilitli özellik deseni:** paket dışı özellik gri + 🔒 + "Pro" çipi; tıklayınca kısa açıklama + "Paketleri gör" (utangaç gizleme yerine dürüst gösterme — keşfedilebilirlik satışın kendisidir).
- Çıktı/Kur aşamasında kota göstergesi (örn. "render: 34/60 dk bu ay").

---

## 4. 1.0'dan Ne Yaşar? — Dürüst Tablo

| Öğe / desen | Karar | Not |
|---|---|---|
| Tasarım token'ları (`index.css @theme`) | **EVRİLİR** | 2 katmana ayrılır (§3.1); C1–C8 borcu ödenir. Çekirdek değerler yaşar |
| `ui.tsx` primitifleri (Button, IconButton, Segmented, Switch, Tip, Kbd, Dot) | **KALIR** | Küçük evrim: odak halkaları (D2) + basma geri bildirimi (B5) |
| Üst bar + Stepper (`AppShell`) | **DEĞİŞİR** | Ray + bölüm şeridine ayrışır; stepper'ın DNA'sı (adım/kilit/aktif) bölüm şeridinde yaşar |
| Mod anahtarı (Hızlı/Kontrollü/Yönetmen) | **EVRİLİR** | Bölüm şeridine taşınır; kavram sorgulanır (aşağıdaki DirectorPanel satırı) |
| DirectorPanel | **DEĞİŞİR** | v1.14.6'da dürüstleştirilen ölü kontroller: ya motora gerçekten bağlanır ya panel kaldırılır — ikisinin ortası 2.0'a taşınmaz |
| İnceleme çekirdeği (PreviewStage, Timeline, Filmstrip, Inspector) | **KALIR — kalp** | Sanallaştırma (D5) + Filmstrip koreografisi (B1) + Inspector'ın sekmeli geleceği (§3.3). En değerli UI varlığı |
| CommandPalette (⌘K) | **KALIR** | Radix Dialog'a taşınır (D1); kapsamı uygulama-geneline büyür |
| ShortcutsHelp | **KALIR** | Radix'e taşınır; Yardım paneline bağlanır |
| Toast sistemi (geri-allı) | **KALIR** | X kapatma eklenir (E5) |
| Klavye sürüşü (←/→, C/F/B, ⌘Z, Space…) | **KALIR** | Aynen; güç kullanıcı sermayesi |
| SetupScreen | **EVRİLİR** | İlk-açılış sihirbazı + Ayarlar→Sistem'e bölünür (§1.5) |
| IntakeScreen | **EVRİLİR** | Stüdyo'dan açılan "Yeni bölüm" akışı olur; sürükle-bırak + doğrulama paneli aynen |
| AnalysisScreen | **EVRİLİR** | Tam-ekran tiyatro hissi korunur ama "ekran" değil "bölümün iş durumu" sunumudur; Stüdyo gezilebilir (§1.3) |
| BuildScreen | **EVRİLİR** | "Çıktı" aşaması; SaaS'ta çok-hedef sekmeleri (Premiere / FCPXML / render) |
| ArchiveScreen | **DEĞİŞİR** | Ayrı ekran ölür; poster-kart DNA'sı Stüdyo'da yaşar (§1.4) |
| RainCanvas + motifler (ConnPulse, RippleField…) | **KALIR** | Tema-duyarlı hale gelir (`--color-rain`, `--ambient-*`); SaaS'ta marka başına ambient |
| Zustand store (tek manifest + `Screen` union) | **DEĞİŞİR** | Bölüm-varlığı + kalıcılık + iş durumu. **En büyük gizli maliyet** — kabuğun asıl bedeli burada |
| localStorage arşiv (`archive.ts`) | **DEĞİŞİR** | Dosya-tabanlı bölüm deposu (zaten "Faz 4'te gerçek `_archive/`" diye planlıydı); v1→v2 veri geçişi yazılır |
| Türkçe sabit kopya | **DEĞİŞİR (yalnız Ürün 2)** | i18n anahtarlarına çıkarım; AutoReji Türkçe-sabit kalabilir |
| AboutDialog, Logo | **KALIR** | Hakkında, Ayarlar'ın sekmesi olur |

---

## 5. Geçiş Stratejisi — 3 Faz (büyük-patlama yeniden yazım YOK, her faz yayınlanabilir)

### Faz M1 — "Sağlam zemin" (v1.x serisi; kabuk AYNI kalır)
- Denetim turları: veri güvenliği (A1–A6) + token disiplini (C1–C8) + odak/a11y (D1–D4) + `lib/motion.ts` ortak animasyon deposu.
- **Görünmez hazırlık:** ekran kayıt defteri (screen union → tablo/kayıt yapısı; rota benzeri ince katman) + `ArchiveEntry`'ye "aşama/devam" alanlarının eklenmesi (UI'da henüz kullanılmaz, veri birikmeye başlar).
- **Yayın:** bugünkü uygulamanın daha sağlam hali. Risk: düşük. Kullanıcı fark eder: daha tutarlı, daha erişilebilir; düzen aynı.

### Faz M2 — "Kabuk 2.0" (AutoReji 2.0 çıkışı)
- Sol ray + Stüdyo ana ekranı + bölüm şeridi. **Ekran içerikleri taşınır, yeniden yazılmaz** (İnceleme/Kur/Giriş gövdeleri aynen; değişen konteyner + giriş noktaları).
- Store omurga değişimi: bölüm-varlığı + kalıcılık (localStorage v2 + v1'den otomatik geçiş; ileride dosya deposu). ArchiveScreen → Stüdyo erimesi.
- Analiz: "bölüm içinde akar, Stüdyo gezilebilir" orta yolu. Tema: Yön A token'ları + Fraunces/gren denemesi (beğenilmezse tek commit geri).
- **Yayın:** AutoReji 2.0 — hâlâ offline, hâlâ Ghibli aracı, artık çok-bölümlü zihinsel model. Risk: orta-yüksek (store); ekran-ekran ilerleyip her adımda Playwright + gözle test şart.

### Faz M3 — "SaaS iskeleti" (yalnız Ürün 2 kararı verilirse; muhtemelen ayrı ürün/dal)
- i18n çıkarımı + 2-katman tema (`data-theme`) + Inspector sekmeleri + format-önizleme yuvası + hesap/paket yer tutucuları (feature-flag arkasında) + ikinci marka teması pilotu.
- **Yayın:** Ürün 2 alfa kabuğu. Dürüst not: bu faz mevcut AutoReji'ye **girmez**; repo/fork kararı açık (aşağıda).

Kural (her fazda): CLAUDE.md ritüeli — test → prod build → sürüm bump → CHANGELOG/DEVAM/PLAN.

---

## 6. Açık Sorular / Risk Özeti

1. **Tek-açık-bölüm kuralı** yeterli mi, yoksa 2 bölüm karşılaştırma (A/B) ihtiyacı doğar mı? (Öneri: 2.0'da tek; A/B talebi gelirse ayrı özellik.)
2. **Gerçek arka-plan analizi** (uygulama kapansa da iş sürsün) ne zaman? Sidecar iş-protokolü ister; M3 sonrası.
3. **Tema seçimi kullanıcıya açılır mı** (Ayarlar→Görünüm) yoksa tek imza tema mı? (Öneri: 2.0'da tek tema + gizli Ghibli-tema denemesi; SaaS'ta çok tema.)
4. **Ürün 2 adı/markası** (AutoReji adı nişte kalır) — tema/marka mimarisini etkiler ama bloklamaz.
5. **Fraunces lisans/paket doğrulaması** (OFL, @fontsource-variable/fraunces, latin-ext) uygulama öncesi son kontrol.
6. En pahalı üç kalem, sırasıyla: **store omurgası (M2)** · **altyazı editörü (M3)** · **i18n çıkarımı (M3)**. Bunlar takvimlenmeden hiçbir "2.0" sözü verilmemeli.
