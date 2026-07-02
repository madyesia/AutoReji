# Hareket Sistemi 2.0 — `src/lib/motion.ts` Spesifikasyonu

> **Durum: SADECE PLANLAMA — hiçbir kod değişmedi.** Bu belge, `docs/UI_UX_DENETIM_2026-07-02.md` animasyon bulgularının (B1–B7 + "gereksizler" bölümü) tek dosyalık bir hareket sistemine dönüştürülmesinin tarifidir. Uygulama onay sonrası, §6'daki sırayla yapılır.
> Kapsam yalnız **arayüz hareketi** — Faz 2 (❄️ geçiş kararları) ve Faz 4 (❄️ paketleme) dosyalarına dokunulmaz.

**Bugünkü envanter (2026-07-02 taraması):**
- Birincil eğri `[0.16, 1, 0.3, 1]` (ease-out-expo) — 3 dosyada ayrı ayrı `const EXPO` olarak kopyalanmış (`motifs.tsx:8`, `AnalysisScreen.tsx:23`, inline'lar).
- **9 ayrı spring konfigi** (stiffness 220–500 / damping 16–38) — hepsi el yazması, hiçbirinin adı yok.
- **10+ farklı süre** (0.12s → 0.5s bandında) + CSS'te `--dur-fast/base/slow` tanımlı ama motion tarafında hiç kullanılmıyor (`--dur-slow` tamamen boşta).
- `ScanBeam` (motifs.tsx:25) ve `ProgressRing` indeterminate dönüşü (motifs.tsx:76) **linear** → mekanik his.
- Ekran geçişi yalnız `opacity + y6` (App.tsx:23) — yön duygusu yok.
- Film şeridi 160 kart aniden beliriyor — koreografi yok.
- Reduced-motion kapsaması ~%95 (çok iyi) — yeni sistemde **%100 hedef**: her variant'ın tanımlı fallback'i var.

---

## 1) Sabit tablolar

### 1.1 DUR — süre ölçeği (4 ad + FX rafı)

`motion.ts` saniye cinsinden (framer-motion), `index.css` ms cinsinden aynı değerleri taşır. **Kural: bu dört ad dışında süre yazılamaz; uymayan her süre FX rafına adıyla kaldırılır.**

| Ad | ms | s | Ne için |
|---|---|---|---|
| `DUR.fast` | **130** | 0.13 | hover, basma, tooltip, mikro-çıkışlar, fadeSwap çıkışı |
| `DUR.base` | **220** | 0.22 | standart durum değişimi, satır/rozet girişleri, fadeSwap girişi |
| `DUR.slow` | **360** | 0.36 | panel/akordeon, kart girişleri, liste satırları (y'li) |
| `DUR.scene` | **460** | 0.46 | ekran girişleri + "hero" anları (başlık, büyük kart) |

**FX rafı** (döngü/özel efekt süreleri — adlandırılır, tabloya karışmaz):

```ts
export const FX = {
  count: 0.7,      // BirthStat/CountUp sayaç
  bloom: 0.9,      // tek-sefer altın parlama (Build kart / mühür arkası)
  glowPulse: 0.6,  // %100 halka nabzı (tek sefer)
  sealWave: 1.1,   // ApprovedSeal şok halkası
  ringSpin: 1.4,   // ProgressRing indeterminate devri
  connPulse: 2.4,  // ConnPulse nabız
  scanBeam: 2.6,   // ScanBeam süpürme (eski 2.2 → 2.6, ease değişimiyle dengeli)
  softSweep: 3.8,  // SoftSweep gidiş-dönüş
} as const
```

**Mevcut sürelerin eşleme tablosu** (migrasyonda birebir uygulanır):

| Mevcut değer | Nerede | Yeni |
|---|---|---|
| 0.12 | Toast reduced (Toast.tsx:64) | `fast` |
| 0.2 / 0.22 / 0.25 | Analysis run/err girişleri, InspectorPreview, RevealPanel opacity, ChangeSummaryToast | `base` |
| 0.28 | App.tsx ekran geçişi | `scene` (giriş) + `base` (çıkış) — §2.1 |
| 0.28 / 0.3 / 0.32 / 0.34 | Inspector, Recap satırları, Archive satırları, RevealPanel height | `slow` (y'li satır/panel) veya `base` (salt opacity) |
| 0.4 / 0.45 / 0.5 | Intake kartları, Setup/Intake hero, Build done, MiniStrip | `scene` |
| 0.7 / 0.9 / 1.1 / 2.2 / 2.4 / 3.8 | sayaç, bloom, ripple/shimmer, beam, pulse, sweep | `FX.*` |
| ui.tsx `duration-150` (Button/IconButton) | CSS transition | `duration-[var(--dur-fast)]` |

### 1.2 EASE — eğriler

```ts
export const EASE = {
  outExpo:   [0.16, 1, 0.3, 1],    // BİRİNCİL giriş — mevcut EXPO, tek kaynaktan
  outQuart:  [0.25, 1, 0.5, 1],    // hover / küçük hareket
  inQuart:   [0.5, 0, 0.75, 0],    // çıkışlar (hızlanan son)
  inOutSine: [0.37, 0, 0.63, 1],   // YENİ — döngüler ve ping-pong (linear'ın yerine)
  sweep:     [0.5, 0, 0.5, 1],     // SweepReveal frontier'ı (mevcut, korunur)
} as const
// CSS tarafı: --ease-out-expo/quart, --ease-in-quart, --ease-spring zaten var; --ease-inout-sine EKLENİR.
```

**Linear'ların değişimi (denetim B2):**

- **ScanBeam** (`motifs.tsx:25`): `linear 2.2s` → **`EASE.inOutSine`, `FX.scanBeam` (2.6s) + `repeatDelay: 0.4`**. Huzme kenarlarda yavaşlayıp ortada hızlanır (gerçek far süpürmesi); pas arasındaki 400ms nefes, "mekanik bant" hissini bitirir.
- **ProgressRing indeterminate** (`motifs.tsx:76`): dönüşe easing koymak sarkaç gibi durur — dönüş **linear kalır ama teknik değişir** (Material yaklaşımı): `rotate 360° linear FX.ringSpin` + **dash yayı `0.24C ↔ 0.42C` arasında `EASE.inOutSine`, aynı 1.4s periyot** ile nefes alır. Sabit hızlı ama canlı. (Tek-satır alternatif istenirse: `duration 1.2, ease [0.45, 0, 0.55, 1]` — önce birincisi gözle denenir.)
- `StageTimeline` içindeki 15px `Loader2 animate-spin` küçük ve standarttır — **dokunulmaz**.
- `shimmer` keyframe'i arka planda linear kalabilir (denetim onayı).

### 1.3 SPRING — 9 konfig → 4 adlandırılmış preset

```ts
export const SPRING = {
  snappy: { type: 'spring', stiffness: 420, damping: 30 },  // hızlı, taşmasız — toast, küçük UI
  gentle: { type: 'spring', stiffness: 260, damping: 24 },  // yumuşak — kart/panel girişleri, hata ikonu
  pop:    { type: 'spring', stiffness: 420, damping: 16 },  // ~%10-12 taşma — kutlama: tik, mühür, sayı
  pill:   { type: 'spring', stiffness: 520, damping: 38 },  // kritik sönümlü — layoutId kaydırıcılar
} as const satisfies Record<string, Transition>
```

**Mevcut 9 kullanımın eşlemesi:**

| Mevcut (stiffness/damping) | Yer | Preset | Görsel fark |
|---|---|---|---|
| 240 / 20 | AnalysisScreen:132 hata ikonu | `gentle` | fark yok denecek kadar az |
| 220 / 16 | AnalysisScreen:144 done ikonu | `pop` | biraz daha çevik (istenen: kutlama) |
| 460 / 16 | AnalysisScreen:178 aşama tiki | `pop` | kıl payı yumuşar |
| 420 / 18 | BuildScreen:107 lejant noktaları | `pop` | fark yok |
| 380 / 24 | BuildScreen:220 istatistik kartı | `gentle` | hafif yumuşar (kart = yüzey, doğrusu bu) |
| 420 / 30 | Toast.tsx:64 giriş | `snappy` | birebir |
| 300 / 16 | motifs.tsx:111 ApprovedSeal | `pop` | biraz daha diri mühür — **gözle test şart** |
| 420 / 17 | motifs.tsx:185 BirthStat | `pop` | birebir sayılır |
| 500 / 38 | ui.tsx:74 Segmented pill | `pill` | birebir sayılır |

---

## 2) Ortak variant deposu (kod taslakları)

Tümü `motion.ts`'ten export edilir. **Her variant'ın reduced-motion fallback'i tanımlıdır** — bileşen `useReducedMotion()` sonucunu variant seçiminde kullanır (mevcut desen korunur; ileride `<MotionConfig reducedMotion="user">` ile sadeleştirilebilir, §5.3).

### 2.1 `screenEnter(direction)` — yönlü ekran geçişi (denetim B4)

Akış sırası: `setup(0) → intake(1) → analysis(2) → review(3) → build(4)`; `archive(5)` yan ekran (her girişte "ileri", çıkışta "geri" doğal düşer).

```ts
export const SCREEN_ORDER: Record<Screen, number> =
  { setup: 0, intake: 1, analysis: 2, review: 3, build: 4, archive: 5 }

export const screenDir = (from: Screen | null, to: Screen): 1 | -1 =>
  !from || SCREEN_ORDER[to] >= SCREEN_ORDER[from] ? 1 : -1

export const screenEnter = {
  initial: (dir: 1 | -1) => ({ opacity: 0, x: 16 * dir }),
  animate: { opacity: 1, x: 0, transition: { duration: DUR.scene, ease: EASE.outExpo } },
  exit:    (dir: 1 | -1) => ({ opacity: 0, x: -16 * dir, transition: { duration: DUR.base, ease: EASE.inQuart } }),
}
// reduced: initial {opacity:0} / animate {opacity:1, dur .15} / exit {opacity:0, dur .1} — x YOK.
```

Kullanım (App.tsx): store'a `prevScreen` eklenir (veya App içinde `useRef`), `dir = screenDir(prev, screen)`;
`<AnimatePresence mode="wait" custom={dir}>` + `<motion.div key={screen} custom={dir} variants={screenEnter} …>`.
İleri = içerik **sağdan** gelir sola çıkar; geri = tersi → mekânsal süreklilik. y6 kalkar, x∓16 gelir.

### 2.2 `staggerList(i, opts)` — kademeli liste girişi (denetim B1)

```ts
export const staggerList = (i: number, o?: { cap?: number; step?: number; y?: number }) => {
  const { cap = 12, step = 0.05, y = 8 } = o ?? {}
  return {
    initial: { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: { duration: DUR.base, ease: EASE.outExpo, delay: i < cap ? i * step : 0 },
  }
}
// reduced: initial false (animasyonsuz, direkt görünür).
```

- **Filmstrip**: `staggerList(i, { cap: 12, step: 0.045 })` — yalnız görünür ilk ~12 kart dalgalanır (40–60ms bandı), 13.+ kart `delay 0` ile aynı karede gelir. **Yalnız ilk mount'ta** oynar (ref-gate: `hasEnteredRef`); Odak/Riskli filtre değişiminde TEKRAR OYNAMAZ.
- Diğer listeler mevcut değerleriyle bu çatıya oturur: Archive satırları `step .045, cap 9` (bugünkü `Math.min(i*0.045, 0.4)` ile eşdeğer), Setup spine `step .04`, Build Recap `step .06, cap 6`.

### 2.3 `pressable` — basma geri bildirimi (denetim B5)

```ts
export const pressable = { whileTap: { scale: 0.97 }, transition: { duration: DUR.fast, ease: EASE.outQuart } }
// motion olmayan butonlar için CSS eşdeğeri (ui.tsx Button/IconButton + Review toplu Cut/Fade/Black):
//   'active:scale-[0.97] transition-transform duration-[var(--dur-fast)]'
// reduced: KORUNUR — kullanıcı-tetiklemeli %3'lük mikro ölçek vestibüler tetikleyici değildir (WCAG 2.3.3 kapsam dışı).
```

### 2.4 `fadeSwap` — içerik değişimi (AnimatePresence `mode="wait"` ile)

```ts
export const fadeSwap = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE.outExpo } },
  exit:    { opacity: 0, y: -4, transition: { duration: DUR.fast, ease: EASE.inQuart } },
}
// reduced: y'siz, yalnız opacity (giriş .15 / çıkış .1).
```

Kullanım: Analysis faz değişimleri (run→done→err), Inspector içerik değişimi, ring % sayısı devri, Build faz geçişleri. Denetim B7'deki "girişli ama çıkışsız" kartlar (Intake slotları, Setup spine) da `exit`'ini buradan alır.

### 2.5 `celebrate` — aşama-tamamlama mikro-kutlaması (denetim B3)

```ts
export const celebrate = {
  initial: { scale: 0.4, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: SPRING.pop },  // pop doğal taşmayla 0.4→~1.12→1 çizer
}
// reduced: { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.15 } } }
```

Kullanım: Analysis aşama tiki, Intake ValRow tiki, ApprovedSeal gövdesi, BirthStat, lejant noktaları.

---

## 3) Koreografi storyboard'ları (ms zaman çizelgeleri)

### (a) Intake — doğrulama reveal'ı (`ready` true olduğu an = T0)

| Zaman | Olay |
|---|---|
| T0 | Doğrulama paneli: `opacity 0→1, y 8→0` (`slow`, outExpo) |
| T0+80 | `SweepReveal` başlar (1400ms, `EASE.sweep`) — frontier 0→1 yayınlanır |
| T0+255 / 605 / 955 / 1305 | Satır i, frontier `(i+0.5)/4`'ü geçince: `blur 1.3px→0, opacity .4→1` (300ms) + ikon `Circle→Check/Alert` **celebrate-mini** (`pop`, scale .5→1) |
| T0+1480 | "Bölüm adı" bölümü `fadeSwap` girişi |
| T0+1560 | Alt bar mesajı "Her şey hazır görünüyor."a döner; CTA primary — üzerinde **tek sefer** glow nabzı (`FX.glowPulse`) |

Reduced: frontier=1 anında (mevcut davranış), satırlar direkt dolu, sweep ve nabız yok.

### (b) Analysis — aşama i biter → i+1 başlar (bar %100 anı = T0)

| Zaman | Olay |
|---|---|
| T0 | Bar rengi amber→ok (CSS 180ms); bar üstü shimmer söner (opacity→0, 150ms) |
| T0+40 | Satır ikonu `fadeSwap`: aşama ikonu → `Check` **celebrate** (`pop`) |
| T0+60 | Halka merkezi: eski "%100" yukarı çıkar, "%0" aşağıdan gelir (`fadeSwap`, 140ms); "aşama i+2/6" etiketi güncellenir |
| T0+120 | Sıradaki satır `opacity .4→1` (`base`); barı 0'dan dolmaya başlar; shimmer'ı başlar → **bar devir-teslimi: ölü kare yok** |
| T0+160 | Halka ucu (fosforlu tip-dot) flaş: `scale 1→1.5→1` (240ms, outQuart) — "bayrak devri" vurgusu |

Toplam devir ≤ 400ms; tik pop'u ile yeni barın dolumu bilinçli örtüşür (süreklilik). Reduced: renk + anında ikon değişimi, pop/flaş yok.

### (c) Analysis — HEPSİ bitti → Review'a geçiş (prog=1 & manifest hazır = T0)

| Zaman | Olay |
|---|---|
| T0 | `phase='done'`; koşu görünümü çıkar (`opacity→0, scale .98`, 200ms) |
| T0+200 | Done görünümü: yeşil rozet dairesi **celebrate** (`pop`) — çap **128px ≈ ProgressRing 132px, aynı merkez noktada** → halka rozete "devrolur" (süreklilik: ring'in son karesi ile rozet 250ms crossfade, morf hissi) |
| T0+200 | Rozetten ripple halkası (1.2s, easeOut, sonsuz — done ekranı ≤2s yaşar) |
| T0+350 | "Bölüm analizi tamamlandı 🎬" `y6` fade (`base`) |
| T0+500 | "Reji'ye geçiliyor…" fade; üç-nokta nabzı (1.1s döngü) |
| T0+1900 | `setScreen('review')` → **screenEnter ileri**: done ekranı sola-16 çıkar (240ms), Review sağdan+16 girer (460ms) |
| T0+2400 → +2940 | Film şeridi ilk 12 kart `staggerList` (45ms adım); Timeline + Inspector `fadeSwap` (delay 120ms) — "kurgu masası kuruluyor" hissi |

RainCanvas yoğunluğu done'da zaten 1.15→0.7 düşüyor (korunur). Reduced: done görünümü anında; 1900ms bekleme **korunur** (okuma süresi, hareket değil); geçiş salt opacity; stagger yok.

### (d) Build — mühür anı (`building`→`done` = T0)

| Zaman | Olay |
|---|---|
| T0 | Building görünümü `fadeSwap` çıkışı (200ms) |
| T0+50 | **ApprovedSeal**: şok halkası `scale .55→1.9 / opacity .55→0` (`FX.sealWave`); gövde `pop` (scale 0, rot -12°→0; ~500ms otur); arkada altın bloom `opacity 0→.5→0` (`FX.bloom`) |
| T0+200→440 | 6 parçacık 60° aralıkla belirir (delay 150+i·40, 300ms) — mevcut, korunur |
| T0+250 | "Bölüm kuruldu 🌧️" `y6` fade (`base`) |
| T0+400 | Glass panel `y 8→0` (`gentle`) |
| T0+550→850 | Recap satırları `staggerList` (60ms adım × 5) |
| T0+700 | MiniStrip `opacity 0→1` (`scene`) — kurulan sıranın "film negatifi" görünümü |
| T0+900 | Manifest kaydet bölümü görünür — sahne tamam |

Reduced: seal salt-opacity (200ms, mevcut fallback), satırlar staggersız, bloom/parçacık yok.

### (e) %100 halka glow-pulse (herhangi bir ProgressRing 1.0'a değince — TEK SEFER)

| Zaman | Olay |
|---|---|
| T0 | Halkanın hazır glow katmanı (motifs.tsx:74'teki absolute div) `opacity .5→1→.5` + `scale 1→1.08→1` (`FX.glowPulse`, outQuart) — box-shadow ANİMASYONU YOK, katman opacity'si oynar (§5 politikası) |
| T0+0 | Halka svg'si `scale 1→1.03→1` (500ms, outQuart) |
| T0+80 | Merkez % sayısı mini `pop` (scale .9→1) |

Analysis'te her aşama %100'ünde tetiklenir (b-adımıyla birleşik: tip-dot flaşı bunun küçüğüdür); Build ringinde kurulum bitişinde bir kez. Reduced: yalnız 200ms renk/opacity değişimi.

---

## 4) Ambient katman (denetim B6 — Ghibli/analog kimlik)

### 4.1 Işık blob'ları (`AmbientLayer` bileşeni — CSS-only, JS döngüsü yok)

RainCanvas'ın kardeşi; onun ALTINA (z olarak) yerleşir. **`filter: blur()` KULLANILMAZ** — aynı görsel sonuç sıfır maliyetle `radial-gradient` yumuşamasıyla alınır; animasyon yalnız `transform`.

| Blob | Boyut | Renk (ink-amber ailesi) | Tepe opacity | Periyot |
|---|---|---|---|---|
| b1 | 52vmin | amber `--color-amber-500` (#dc9f4a) | .09 | 34s |
| b2 | 44vmin | yağmur mavisi `--color-ext-deep` (#3f6f9c) | .07 | 26s |
| b3 | 38vmin | gece moru `--color-sleep-deep` (#565299) | .06 | 42s |

(Periyotlar kasıtlı asal-benzeri: desen gözle yakalanamaz. Hepsi .06–.10 bandında, 20–40s+ kuralına uygun.)

```css
.ambient { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.ambient i { position: absolute; border-radius: 9999px; will-change: transform;
  background: radial-gradient(circle, var(--blob-c) 0%, transparent 70%); }
.ambient .b1 { width: 52vmin; height: 52vmin; left: -12%; top: -14%; --blob-c: rgb(220 159 74 / .09);
  animation: drift-a 34s var(--ease-inout-sine) infinite alternate; }
.ambient .b2 { width: 44vmin; height: 44vmin; right: -8%; top: 28%; --blob-c: rgb(63 111 156 / .07);
  animation: drift-b 26s var(--ease-inout-sine) infinite alternate; }
.ambient .b3 { width: 38vmin; height: 38vmin; left: 34%; bottom: -16%; --blob-c: rgb(86 82 153 / .06);
  animation: drift-c 42s var(--ease-inout-sine) infinite alternate; }
@keyframes drift-a { to { transform: translate3d(9vmin, 6vmin, 0) scale(1.12); } }
@keyframes drift-b { to { transform: translate3d(-7vmin, 8vmin, 0) scale(1.08); } }
@keyframes drift-c { to { transform: translate3d(6vmin, -7vmin, 0) scale(1.15); } }
@media (prefers-reduced-motion: reduce) { .ambient i { animation: none; } } /* statik ışık lekesi kalır */
html[data-app-idle] .ambient i { animation-play-state: paused; }
```

**Hangi ekranlarda:** Intake, Analysis, Build, Setup, Archive (boş durum). **Review'da YOK** — ekran zaten en yoğun (160 kart + video + timeline); oradaki atmosferi grain verir.

**Durdurma kuralları:**
- `document.visibilitychange` + Tauri `onFocusChanged` → `<html data-app-idle>` attribute'u → `animation-play-state: paused`. (.app arka plana düşünce GPU/pil sıfır maliyet.)
- `prefers-reduced-motion` → animasyon yok, blob'lar statik (yumuşak degrade zemin olarak kalır — Ghibli havası kaybolmaz).
- **Pil API'si kullanılmaz**: `navigator.getBattery` WKWebView'de (Tauri/macOS) yok → güvenilir sinyal odak/kaybıdır; yukarıdaki kural bunu zaten karşılar.

### 4.2 Film greni overlay'i (opsiyon, "Vintage Analog" dokunuşu)

- **Statik** SVG noise tile (animasyonlu gren = her kare tam-ekran paint → yasak):
```css
.grain { position: absolute; inset: 0; pointer-events: none; opacity: .04; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 180px 180px; }
```
- Opacity bandı **.03–.05** (başlangıç .04; gözle kalibre edilir).
- **Nerede:** Review'da PreviewStage çerçevesi (video sahnesinin çevresi — "stüdyo monitörü" hissi) + Build `done` panelinde. Tüm uygulamaya YAYILMAZ.
- Statik olduğu için reduced-motion'da da aynen kalır (hareket içermez).

---

## 5) Performans bütçesi

### 5.1 Kurallar (motion.ts başına yorum bloğu olarak da yazılır)

1. **Sonsuz animasyon tavanı: ekran başına ≤3 composited döngü + ≤1 canvas rAF** (RainCanvas). Örn. Analysis koşarken: rain(1 rAF) + aktif bar shimmer + halka ucu = tavan. Ambient blob'lar bu sayıya dahildir → blob'lu ekranda diğer döngüler kısılır.
2. **Döngülerde yalnız `transform` + `opacity`.** `filter`/`box-shadow`/`width-height` döngüde YASAK. Tek-seferlik girişlerde ≤500ms `filter: blur` serbest (BirthStat mevcut hâliyle uyumlu). Glow nabzı hazır gölge katmanının **opacity**'siyle yapılır (§3e).
3. **will-change disiplini:** yalnız döngü elemanlarında ve `AmbientLayer`'da kalıcı; tek-seferlik girişlerde animasyon bitince kalkmalı (framer zaten yönetir — elle `style.willChange` eklenmez); **160'lık liste kartlarında yasak**; ekran başına ≤8 eleman.
4. **Stagger tek-atımlık:** yalnız ilk mount (ref-gate); filtre/sıralama değişiminde tekrar oynamaz. Cap sonrası `delay: 0` → kalan ~148 kart tek karede.
5. Filmstrip'teki `contentVisibility: auto` + `containIntrinsicSize` korunur (mevcut, doğru).
6. `AnimatePresence mode="wait"` ekran/faz değişimlerinde standart (çift-DOM anını önler).
7. **Ölçüm ritüeli:** Review'da 6× CPU throttle ile şerit kaydırma 60fps hedef, dropped frame <%5; Analysis koşarken Activity Monitor'da .app GPU'su gözlenir (Faz 4 gerçek-doğrulama geleneği).

### 5.2 Ekran başına döngü envanteri (hedef durum)

| Ekran | Döngüler | Durum |
|---|---|---|
| Intake | rain rAF + blob + (ready'de kısa sweep) | ≤3 ✓ |
| Analysis | rain rAF + aktif bar shimmer + blob | ≤3 ✓ (SoftSweep bu ekranda kullanılmaz) |
| Review | video decode + hover-scrub (kullanıcı-tetikli) + grain(statik=0) | ✓ blob yok |
| Build | building'de: halka + StageTimeline spinner; done'da: yok (seal tek-sefer) + blob | ✓ |
| Setup/Archive | blob + tek durum nabzı | ✓ |

### 5.3 LazyMotion / `m` değerlendirmesi — **KARAR: YAPMA (ertele)**

- Kazanç: tam `motion` ≈ 34kb min+gz; `LazyMotion + m + domAnimation` ≈ 21kb. **Ama** `Segmented` `layoutId` ve `Toast` `layout` kullanıyor → `domMax` şart ≈ 27-29kb → net kazanç **~5-7kb**.
- Maliyet: tüm `motion.*` → `m.*` dönüşümü (30+ dosya-nokta), `strict` modda kaçak `motion` importu sessiz kırılma riski (bkz. CLAUDE.md .app tuzağı #2 ruhu: sessiz ölüm en pahalı hata sınıfımız).
- Bağlam: offline masaüstü .app, dist zaten 0.95MB, ağdan indirme yok → bundle-boyutu değersiz metrik.
- **Bunun yerine alınacak ucuz kazanım:** `<MotionConfig reducedMotion="user">` App köküne eklenir — yeni yazılan variant'larda transform'lar otomatik kısılır; mevcut elle `useReducedMotion` dalları (süre/park değeri de değiştirdikleri için) korunur, zamanla sadeleşir.

---

## 6) Migrasyon sırası (her adım: Playwright + gözle test → prod build → sürüm/CHANGELOG ritüeli)

| # | Adım | Dosyalar | Beklenen görsel fark / risk |
|---|---|---|---|
| 1 | `lib/motion.ts` oluştur (DUR/EASE/SPRING/FX/variants) + `index.css`'e `--ease-inout-sine` | yeni dosya | **Sıfır** — henüz kimse kullanmıyor |
| 2 | `ui.tsx`: Segmented→`SPRING.pill`, Button/IconButton'a `active:scale-[0.97]` + `--dur-fast`, useCountUp ease→`EASE.outExpo` importu | ui.tsx | Çok düşük — pill birebir; basma hissi YENİ (istenen B5) |
| 3 | `Toast.tsx` + `ChangeSummaryToast.tsx` → `snappy` + DUR | 2 dosya | Çok düşük — birebir eşleme |
| 4 | `motifs.tsx`: EXPO'yu motion.ts'ten al; ScanBeam→inOutSine; Ring indeterminate→linear+dash-nefesi; Seal→`pop`; RevealPanel/BirthStat→DUR/EASE | motifs.tsx | **Orta** — spinner ve beam hissi değişir (amaç bu); mutlaka gözle karşılaştır, geri alması tek satır |
| 5 | `App.tsx` + `store.ts`: `prevScreen` + `screenEnter(dir)` | 2 dosya | Orta — tüm ekran geçişleri yön kazanır; tek nokta, tek variant → regresyon alanı dar |
| 6 | `AnalysisScreen.tsx`: aşama devir-teslim koreografisi (§3b) + done-morf (§3c) | 1 dosya | **Orta-yüksek** — en çok yeni kod burada; simErr + mock ramp ile her faz izlenir |
| 7 | `BuildScreen.tsx`: mühür storyboard'u (§3d) + %100 nabzı (§3e) | 1 dosya | Orta — mevcut sahne zaten yakın, çoğu zamanlama ayarı |
| 8 | `IntakeScreen.tsx`: reveal zamanlaması (§3a) + slot kartlarına `exit` (B7) | 1 dosya | Düşük |
| 9 | `Filmstrip.tsx`: `staggerList` (ref-gate'li) + kartlara pressable | 1 dosya | Orta — 160 kartta performans ölçümü ŞART (§5.1 ritüeli) |
| 10 | `AmbientLayer` + grain: yeni bileşen, ekran ekran açılır (önce Intake) | yeni + index.css | Düşük — additive; beğenilmezse tek satırla söner |
| 11 | Archive/Setup/CommandPalette/ShortcutsHelp süre-token temizliği | 4 dosya | Çok düşük — not: palette/help zaten D1 ile Radix'e taşınacak, motion işi o refactor'a bindirilir |

**Bitti kriteri:** `grep`'te `stiffness:` yalnız motion.ts'te; `duration: 0.` ad-hoc değerleri FX/DUR dışına sızmamış; reduced-motion %100 (her yeni variant fallback'li); prod build temiz; .app'te gözle doğrulama.
