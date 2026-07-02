# Tasarım Sistemi 2.0 — Token Spesifikasyonu (SADECE PLANLAMA)

> **Durum:** Planlama belgesi — hiçbir kaynak dosya değişmedi. Kaynak: `docs/UI_UX_DENETIM_2026-07-02.md` (C1–C7, D4) + 2026-07-02 tam kod taraması (`brain/src` grep sayımları).
> **Amaç:** Konsolidasyon, **yeniden tema DEĞİL.** Mürekkep (ink) ve amber tonları, rejim/geçiş/semantik renkler, radius, süre/easing token'ları **birebir aynı kalır.** Değişen tek şey: dağınık keyfi değerlerin adlandırılmış token'lara toplanması + 3 bilinçli görünürlük iyileştirmesi (hairline, disabled, fg-faint).

## Tarama özeti (bu speç neye dayanıyor)

| Sorun | Ölçülen gerçek durum |
|---|---|
| Keyfi yazı boyutu `text-[Npx]` | **21 farklı boyut, 213 kullanım** (9→34px; en yoğun: 11px×53, 13px×31, 12.5px×28) |
| Keyfi gölge | **22 `shadow-[…]` sınıfı + 19 satır inline `boxShadow`** ≈ 41 (denetimdeki "40+" doğrulandı) |
| Ham hex (TS/TSX) | 29 adet 6-haneli (+ index.css içindekiler → denetimdeki 59) |
| İkon boyutu `size={N}` | 22 farklı değer (7→132); UI aralığı 10–20 dağınık |
| Hairline | `.07` (hairline sınıfları) + `.08` (glass, ring-hair) karışık |
| Disabled | `disabled:opacity-30` (~1.7:1) ve `disabled:opacity-40` (~2.2:1) — ikisi de 3:1 altı |

---

## 1) Hazır-yapıştır token bloğu

Aşağıdaki blok `brain/src/index.css` içindeki mevcut `@theme`'in **sonuna eklenir** (saf ekleme — hiçbir mevcut token silinmez/değişmez):

```css
  /* ================= Tasarım Sistemi 2.0 — EK TOKEN'LAR ================= */

  /* ---- Tip ölçeği (C4) — 7 çekirdek + 2 display; leading-none serbest kalır ---- */
  --text-micro: 10px;                    /* süs/mini sayı: % son eki, geçiş baloncuğu sayısı */
  --text-micro--line-height: 14px;
  --text-caption: 11px;                  /* mikro etiket: rozet, kicker, ipucu (en yaygın adım) */
  --text-caption--line-height: 15px;
  --text-label: 12px;                    /* veri çipi: sahne no, süre rozeti, tooltip */
  --text-label--line-height: 16px;
  --text-body: 13px;                     /* gövde/açıklama metni (mevcut leading-snug ritmiyle aynı) */
  --text-body--line-height: 18px;
  --text-ui: 14px;                       /* girdi, orta buton, palet input */
  --text-ui--line-height: 20px;
  --text-lead: 15px;                     /* büyük buton, satır başlığı */
  --text-lead--line-height: 22px;
  --text-title: 18px;                    /* panel/dialog/durum başlığı, Stat değeri */
  --text-title--line-height: 24px;
  --text-headline: 24px;                 /* büyük durum başlığı + orta sayaç */
  --text-headline--line-height: 30px;
  --text-headline--letter-spacing: -0.02em;
  --text-display: 32px;                  /* ekran hero H1 + büyük % sayacı */
  --text-display--line-height: 38px;
  --text-display--letter-spacing: -0.02em;

  /* ---- Elevation ekleri (C3) — soft/raised/pop AYNEN kalır; 2 amber-glow eklenir ---- */
  /* glow-sm: küçük kontroller (primary buton, segmented aktif, oynat CTA)
     kaynak birleşim: 0 2px 10px -2px/.5 · 0 2px 10px -3px/.55 · 0 2px 10px -2px/.6 → orta değer */
  --shadow-glow-sm: 0 2px 10px -2px rgb(234 184 102 / 0.55);
  /* glow-lg: seçili/işaretli film kartı (yüzen kart halesi)
     kaynak birleşim: 0 14px 40px -10px/.5 (seçili) · 0 8px 28px -10px/.5 (işaretli) → orta değer */
  --shadow-glow-lg: 0 12px 36px -10px rgb(234 184 102 / 0.50);

  /* ---- Kenarlık (C6) — hairline .07→.10, güçlü kenar .14 ---- */
  --color-hairline: rgb(255 255 255 / 0.10);
  --color-hairline-strong: rgb(255 255 255 / 0.14);

  /* ---- Kamera-ölçeği kimlik renkleri (C2) — utils.ts'teki 8 hex'in TEK kaynağı ---- */
  --color-scale-drone:  #7fb6e6;   /* gök mavisi */
  --color-scale-wide:   #5ec9a6;   /* teal-yeşil */
  --color-scale-medium: #e7b667;   /* amber */
  --color-scale-close:  #e98c5a;   /* turuncu */
  --color-scale-xclose: #e36d8d;   /* pembe-kırmızı */
  --color-scale-pov:    #ab8ce2;   /* mor */
  --color-scale-top:    #6f8ce2;   /* indigo */
  --color-scale-other:  #8a93a8;   /* nötr gri */

  /* ---- Yağmur rengi (C1) — RainCanvas rgba(176,202,234,α)'nın TEK kaynağı ---- */
  --color-rain: #b0caea;
```

Tailwind v4 bu token'lardan otomatik utility üretir: `text-micro … text-display`, `shadow-glow-sm`, `shadow-glow-lg`, `border-hairline`, `ring-hairline`, `bg-scale-drone`, vb. Mevcut `--shadow-soft/raised/pop` zaten `shadow-soft/raised/pop` utility'si üretiyor → `shadow-[var(--shadow-pop)]` yazımına gerek kalmaz.

### 1.1 index.css'te değişecek mevcut satırlar (token'ları tüketsin diye)

| Yer | Eski | Yeni | Görsel fark |
|---|---|---|---|
| `.hairline`/`-t`/`-b`/`-r` | `rgb(255 255 255 / 0.07)` | `var(--color-hairline)` (.10) | ⚠️ hatlar hafif belirginleşir — **istenen** (C6) |
| `@utility ring-hair` | `/ 0.08` | `var(--color-hairline)` (.10) | ⚠️ aynı yönde, 20 kullanım |
| `.glass` border | `/ 0.08` | `var(--color-hairline)` (.10) | ⚠️ minimal |
| `.glass-raised` border | `/ 0.10` | `var(--color-hairline)` | fark yok (aynı değer) |
| `.glass-pop` border | `/ 0.12` | `var(--color-hairline-strong)` (.14) | ⚠️ modal çerçevesi hafif netleşir |
| `.dropring` halo | `rgb(234 184 102 / 0.35)` | `var(--glow-amber)` (aynı .35) | fark yok |
| scrollbar thumb `.08` | değişmez (dekoratif) | — | — |

**Dürüstlük notu:** .10 hairline hâlâ "dekoratif" kontrasttadır (~zemine karşı 1.2–1.3:1); kart tanımını asıl taşıyan zemin farkı + gölgedir. .10 "algılanabilirlik" eşiğini geçer, temayı bozmaz. .14 üstüne çıkmak (örn. .20) cam estetiğini griye çeker — önerilmez.

---

## 2) Tip ölçeği — eşleme tablosu (21 eski boyut → 9 adım)

Görevdeki 14 listeli boyut (9→34) **7 çekirdek adıma** iner; tam taramada bulunan 7 ek büyük boyut (16/17/20/22/24/26/30) için **2 display adımı** eklendi. Yarım piksel boyutlar (10.5/11.5/12.5/13.5) 1x ekranda bulanık render olur — tam sayıya oturmak netlik de kazandırır.

| Eski | Kullanım | Yeni token | Fark | Not / taviz |
|---|---|---|---|---|
| `text-[9px]` | 1 | `text-micro` (10) | **+1** ⚠️ | Filmstrip geçiş baloncuğu sayısı — dar pill'de sığma kontrol edilir |
| `text-[10px]` | 8 | `text-micro` | = | |
| `text-[10.5px]` | 8 | `text-caption` (11) | **+0.5** ⚠️ | okunabilirlik yönünde (Setup ipuçları, ölçek çipi) |
| `text-[11px]` | 53 | `text-caption` | = | en yaygın adım — çıpa |
| `text-[11.5px]` | 14 | `text-label` (12) | **+0.5** ⚠️ | süre/rejim çipleri sahne-no çipiyle (12) birleşir — tutarlılık kazancı |
| `text-[12px]` | 23 | `text-label` | = | |
| `text-[12.5px]` | 28 | `text-body` (13) | **+0.5** ⚠️ | açıklama paragrafları büyür (denetim C7 ruhu); lh 18px = mevcut `leading-snug` ritmi |
| `text-[13px]` | 31 | `text-body` | = | |
| `text-[13.5px]` | 3 | `text-body` | −0.5 ⚠️ | |
| `text-[14px]` + `text-sm` | 7+1 | `text-ui` | = | CommandPalette input dahil |
| `text-[15px]` | 11 | `text-lead` | = | |
| `text-[16px]` | 1 | `text-lead` (15) | **−1** ⚠️ | AnalysisScreen aşama etiketi |
| `text-[17px]` | 1 | `text-title` (18) | +1 ⚠️ | Setup mini % sayacı |
| `text-[18px]` | 1 | `text-title` | = | |
| `text-[19px]` | 2 | `text-title` | −1 ⚠️ | Analiz başarı H2 + Build % sayacı |
| `text-[20px]` + `text-xl` | 2+2 | `text-title` | **−2** ⚠️ | AboutDialog başlığı, Stat değeri; *istisna:* Archive boş-durum H2 → `text-headline` (+4) daha doğru |
| `text-[22px]` | 1 | `text-headline` (24) | +2 ⚠️ | Setup ana % sayacı — halka içinde sığma kontrol |
| `text-[24px]` | 1 | `text-headline` | = | |
| `text-[26px]` | 1 | `text-headline` | −2 ⚠️ | Build başarı H1 "Bölüm kuruldu" |
| `text-[30px]` | 3 | `text-display` (32) | +2 ⚠️ | Archive/Build H1; **Analiz % sayacı halka içinde sığma kontrol** |
| `text-[34px]` | 2 | `text-display` | **−2** ⚠️ | Intake/Setup hero H1 — 30↔34 tutarsızlığı 32'de buluşur |

- `leading-none` (sayısal rozet/sayaçlarda) serbest kalır — token lh'ını ezer, sorun değil.
- Opsiyonel uyum önerisi (ayrı karar): tüm **durum başlıkları** (başarı/hata/boş: bugün 18/19/20/26 karışık) tek adımda `text-headline`'da toplanabilir — daha büyük görsel fark yaratır, Faz C'de kullanıcıyla bakılır.

---

## 3) İkon boyut standardı (C5)

`brain/src/lib/utils.ts`'e (veya `lib/icons.ts`) eklenecek sabit:

```ts
/** İkon boyut standardı — lucide `size` prop'u YALNIZ bunlardan alır (dekoratif ≥22 hariç). */
export const ICON = {
  xs: 12,  // çip/rozet içi; text-caption/label yanı
  sm: 14,  // satır içi buton ikonu, liste satırı; text-body yanı
  md: 16,  // md/lg buton, panel başlığı satırı; text-ui/lead yanı
  lg: 18,  // IconButton (h-9 w-9), toolbar, breadcrumb aksiyonları
} as const
export type IconSize = keyof typeof ICON
```

Eşleme (lucide 24×24 grid'inde çift sayılar stroke'u net çizer — 11/13/15/17 yarım-piksel bulanıklığı yapar; bu takas ikonları **keskinleştirir**):

| Eski `size` | Adet | Yeni | Not |
|---|---|---|---|
| 10, 11 | 11 | `ICON.xs` (12) | +1..2 ⚠️ mini rozetlerde sığma kontrol |
| 12 | 15 | `ICON.xs` | = |
| 13 | 23 | `ICON.sm` (14) | +1 ⚠️; çip İÇİNDEyse `ICON.xs` |
| 14 | 28 | `ICON.sm` | = |
| 15 | 35 | `ICON.md` (16) | +1 ⚠️ en kalabalık takas; satır içi metin yanındaysa `ICON.sm` |
| 16 | 19 | `ICON.md` | = |
| 17 | 4 | `ICON.lg` (18) | +1 (Undo/Redo, Keyboard) |
| 18 | 7 | `ICON.lg` | = |
| 20 | 10 | `ICON.lg` (18) | **−2** ⚠️ en görünür ikon farkı — başlık ikonları |
| 7 | 1 | muaf | `Dot` bileşeni (lucide değil, renk noktası) |
| 22–132 | 14 | muaf (dekoratif/hero) | boş-durum ve başarı illüstrasyonları; sabit gerekmiyor |

---

## 4) Elevation — gölge konsolidasyonu (3 + 2)

`--shadow-soft/raised/pop` **değişmeden kalır.** 41 keyfi gölgenin hedef dağılımı:

| Grup | Örnek yerler | Hedef |
|---|---|---|
| Zaten token (`shadow-[var(--shadow-pop)]`) | Toast, CommandPalette, AboutDialog, ShortcutsHelp, PreviewModal, Analysis/Archive, ui.tsx:108, IntakeScreen (raised) | `shadow-pop` / `shadow-raised` utility — sıfır fark |
| Amber CTA parlaması `.5/.55/.6` | ui.tsx:13 (Button primary), ui.tsx:75 (Segmented), PreviewStage:184 (Oynat) | `shadow-glow-sm` ⚠️ mikro (alfa .5→.55 vb.); Oynat'taki `inset 0 1px 0 white/.4` iç vurgu kalkar → istenirse bileşen sınıfına taşınır (aşağıda istisnalar) |
| Kart halesi | Filmstrip:102 (seçili 14/40), :104 (işaretli 8/28) | `shadow-glow-lg` ⚠️ seçili birazcık sıkılaşır, işaretli birazcık genişler; ayrım zaten ring+kaldırma ile korunur |
| Küçük siyah gölgeler | ui.tsx:127 (slider thumb), Filmstrip:146 (sil butonu), PreviewStage:177 (scrub thumb) | `shadow-soft` ⚠️ mikro |
| Dinamik renkli nokta parlaması `0 0 8px -1px ${color}` | Dot, Toast:71/95, motifs:133, Archive:125, Setup:156 | değer dinamik → token OLMAZ; ortak reçete: `.glow-dot { box-shadow: 0 0 8px -1px var(--glow-c) }` + `style={{'--glow-c': color}}` (P2, opsiyonel) |
| Danger uyarı halesi | Filmstrip:105/129 | zaten `var(--color-danger)` tüketiyor — kalır |

**Bilinçli istisnalar** (global token yapılmaz; TSX'ten `index.css @layer components` sınıfına taşınır ki guardrail-2 mutlak kalsın):
1. `PreviewStage:139` altın video çerçevesi (5 katmanlı birleşik sinematik gölge) → `.frame-gold` sınıfı.
2. `Timeline:67` playhead beyaz parlaması (`0 0 8px white/.8`) → `.playhead-glow` sınıfı.
3. `PreviewStage:132` cam kontrol butonu birleşimi (siyah + iç vurgu) → `.ctrl-glass` sınıfı.

---

## 5) Kenarlık token'ları — özet

- `--color-hairline: rgb(255 255 255 / 0.10)` — standart ince hat (eski .07/.08'lerin tümü).
- `--color-hairline-strong: rgb(255 255 255 / 0.14)` — vurgulu çerçeve (glass-pop, seçili kart kenarı gibi "bir tık öne" durumlar).
- TSX'te inline `border-white/8`, `ring-white/10` gibi beyaz-alfa kenarlar migrasyonda `border-hairline` / `ring-hairline`'a döner (9 inline rgba + white/N kullanımları).

---

## 6) Disabled standardı (D4) — matematikle

Mevcut: `disabled:opacity-30` → fg-muted metin ink-900 üstünde **~1.7:1**; `disabled:opacity-40` → **~2.2:1**. İkisi de okunmaz.

**Standart:** `disabled:opacity-60 disabled:pointer-events-none` + taban metin rengi **en az `text-fg-muted`** (disabled olacak kontrole taban olarak asla fg-subtle/faint verilmez).

| Kombinasyon | Efektif renk (ink-900 üstünde) | Kontrast |
|---|---|---|
| fg-muted `#97a3bd` @ %60 | ≈ `#5f6879` | **~3.4:1 ✓** (≥3:1 hedefi) |
| primary buton (amber zemin + ink-950 metin) @ %60 | — | **~4.4:1 ✓** |
| fg-muted @ %40 (bugünkü Button) | ≈ `#4a5158` | ~2.2:1 ✗ |
| fg-faint @ %50 (denetimdeki ilk öneri) | ≈ `#36394d` | ~1.8:1 ✗ — **bu speç onu düzeltir** |

Opsiyonel tat: `disabled:saturate-50` — "kapalı" hissini kontrast kaybetmeden verir.
Değişecek yerler: `ui.tsx:31` (Button, 40→60) · `ReviewScreen.tsx:108-109` (Undo/Redo IconButton, 30→60). ⚠️ Görsel fark: disabled kontroller **daha okunur** görünür — istenen.

Bağlantılı kural (C7): `fg-faint` yalnız dekor/idle; **bilgi taşıyan veya tıklanan** her şey min `fg-subtle` — bugün ihlal edenler: `motifs.tsx:159` (idle aşama etiketi), `AppShell.tsx:27,32` (kilitli adım), `SetupScreen.tsx:272,299,406,444,453-455` (**"tekrar kontrol et" / "Kaldır" / "İptal" — bunlar AKSİYON linki, faint olamaz**), `IntakeScreen.tsx:138`, `Inspector.tsx:172`, `AboutDialog.tsx:40` (telif satırı — dekor sayılır, kalabilir), `CommandPalette.tsx:93` (placeholder — kalabilir).

---

## 7) Migrasyon haritası — güvenli sıra

### Faz A — Saf ekleme + birebir takas (SIFIR görsel fark)
1. `index.css` → §1 bloğunu @theme'e ekle (hiçbir şey tüketmiyor → fark yok).
2. `lib/utils.ts:41-49` → 8 hex → `var(--color-scale-*)` (aynı değerler; tüm tüketiciler CSS bağlamı — Filmstrip/InspectorPreview `color-mix`, Timeline:57, BuildScreen:282 — doğrulandı, `var()` her yerde çalışır).
3. `Logo.tsx:7-9,12-13,20` amber+ink hex → amber/ink token'ları; `motifs.tsx:63,67` amber hex → token (birebir aynı).
4. Inline `#0b0e14` → `var(--color-ink-900)`: `Filmstrip.tsx:108,175,180` · `InspectorPreview.tsx:72` · `ArchiveScreen.tsx:142` (birebir aynı).
5. `RainCanvas.tsx:39,53` → `--color-rain`'i JS'te oku (canvas `var()` almaz):
   ```ts
   const hex = getComputedStyle(document.documentElement).getPropertyValue('--color-rain').trim() // "#b0caea"
   const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))  // → ctx.strokeStyle = `rgba(${r},${g},${b},${d.a})`
   ```
6. `shadow-[var(--shadow-pop)]` (9 yer) + `shadow-[var(--shadow-raised)]` (1) → `shadow-pop` / `shadow-raised` utility (aynı değer).
7. `ICON` sabitini ekle (henüz kullanan yok).

### Faz B — Davranışsız takaslar (kontrollü MİKRO farklar ⚠️)
1. **Tip ölçeği** — dosya dosya, yoğunluk sırasıyla: `SetupScreen` (40) → `BuildScreen` (22) → `Inspector` (20) → `IntakeScreen` (19) → `ArchiveScreen`/`AnalysisScreen` (11+11) → `ui.tsx` (9) → Review bileşenleri → kalan 11 dosya. Fark: §2 tablosundaki ±0.5–2px'ler; her dosyadan sonra ekran görüntüsü karşılaştır.
2. **İkon boyutları** — aynı dosya sırası; §3 eşlemesi (+keskinlik bonusu).
3. **Glow gölgeler** — `ui.tsx:13,75` + `PreviewStage:184` → `shadow-glow-sm`; `Filmstrip:102,104` → `shadow-glow-lg`; siyah tek-off'lar → `shadow-soft`.
4. **Yakın-hex normalizasyonu** — `PreviewStage:136` (`#11151f/#0b0e16/#070910` → ink-850/900/950), `Filmstrip:38` (`#0a0d15` → ink-900) ⚠️ kanal başına ≤2 birim, gözle fark edilmez ama diff'te görünür.
5. Birleşik istisna gölgeleri (`.frame-gold`, `.playhead-glow`, `.ctrl-glass`) index.css'e taşı — piksel birebir aynı.

### Faz C — Görünür iyileştirmeler (İSTENEN farklar ⚠️ — kullanıcıyla ekran ekran onay)
1. Hairline .07/.08 → `--color-hairline` (.10); glass-pop → strong (.14). *Tüm ekranlarda hat belirginleşir.*
2. Disabled 30/40 → 60 (`ui.tsx:31`, `ReviewScreen:108-109`).
3. `fg-faint` → `fg-subtle` terfileri (§6 listesi; Setup'taki aksiyon linkleri öncelikli).
4. TSX inline beyaz rgba'lar (9 yer: AnalysisScreen:176,190 · ChangeSummaryToast:29 · Filmstrip:38 · motifs:49 · Timeline:67 · PreviewStage:132,184) → white/N utility, hairline token veya istisna sınıfı.
5. (Opsiyonel, ayrı onay) Durum başlığı uyumu: 18/19/20/26 → `text-headline`.

### Faz D — Temizlik + koruma
1. Grep doğrulaması: `text-[`, `shadow-[`, ham hex, ham rgba, ICON dışı `size={N}` → hepsi 0.
2. §8 guardrail'lerini `scripts/`'e basit grep script'i + PR checklist'i olarak ekle.
3. `--dur-slow` kararı: ekran geçişi/hero girişlerinde kullan **ya da** sil (denetim "Gereksiz" notu) — ayrı mikro-karar.
4. Ritüel: Playwright + gözle test → prod build → sürüm bump → CHANGELOG/DEVAM/PLAN.

**Riskli sığma noktaları (test listesi):** Analiz halkası %30→32 sayaç · Setup halkası %22→24 · Filmstrip geçiş baloncuğu 9→10 · h-6/h-8 çipler +0.5px metin · mini rozetlerde ikon +1–2px.

---

## 8) Guardrail'ler — gelecek PR checklist'i (grep'lenebilir)

| # | Kural | Kontrol (brain/src, *.ts/tsx) | Beklenen |
|---|---|---|---|
| 1 | **Ham hex yok** — renk yalnız `@theme` token'ı | `grep -rnE '#[0-9a-fA-F]{3,8}' --include='*.ts*'` | 0 sonuç (tek istisna: index.css @theme) |
| 2 | **`shadow-[` yok** — yalnız `shadow-soft/raised/pop/glow-sm/glow-lg`; birleşik özel gölge index.css bileşen sınıfında | `grep -rn 'shadow-\['` | 0 sonuç |
| 3 | **`text-[Npx]` yok** — yalnız 9 adlı adım; `leading-none` serbest | `grep -rnE 'text-\[[0-9]'` | 0 sonuç |
| 4 | **Inline `rgb(a)` string yok** — beyaz vurgu `white/N`, renkler `var(--…)`/`color-mix(var…)`; canvas token'ı `getComputedStyle` ile okur | `grep -rnE 'rgba?\(' --include='*.tsx'` | 0 sonuç |
| 5 | **İkon boyutu `ICON.*`'dan** — dekoratif ≥22 muaf | `grep -rnE 'size=\{(7|8|9|10|11|13|15|17|19|20|21)\}'` | 0 sonuç |
| 6 | **Disabled standardı** — yalnız `disabled:opacity-60` (+pointer-events-none); taban renk ≥ fg-muted | `grep -rnE 'disabled:opacity-(?!60)' -P` | 0 sonuç |
| 7 | **Süre/easing token'dan** — `duration-[var(--dur-*)]` ve `ease-[var(--ease-*)]`; çıplak ms/bezier yok; framer süreleri ortak `lib/motion.ts` sabitlerinden (denetim B4 ile birleşir) | `grep -rnE 'duration-\[[0-9]'` | 0 sonuç |
| 8 | **fg-faint yalnız dekor/disabled** — bilgi taşıyan/tıklanan metin min `fg-subtle`; yeni renk gerekiyorsa önce @theme'e token açılır (PR şablonu sorusu) | code review + `grep -rn 'text-fg-faint'` elden geçirme | liste §6'dakilerle sınırlı |

---

## 9) Açık sorular (uygulama onayında sorulacak)

1. Hero H1 32px'te buluşsun mu (34↔30 → 32), yoksa 34 sabit kalıp 30'lar mı yükselsin? (Speç önerisi: 32 — modüler 24→32 oranı.)
2. Durum başlıklarının `headline`'da toplanması (Faz C-5) istenir mi?
3. Oynat butonundaki iç-üst beyaz vurgu (inset .4) korunsun mu (`.ctrl-glass` benzeri sınıfla) yoksa sade `shadow-glow-sm` yeter mi?
4. `--dur-slow` kullanılacak mı, silinecek mi?
