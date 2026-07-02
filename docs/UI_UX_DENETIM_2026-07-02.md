# UI/UX Denetim Raporu — 2026-07-02 (beta v1.0 / 1.0.1)

> **Nasıl üretildi:** 4 paralel inceleme ajanı (tasarım sistemi · ekran/UX akışı · animasyon · bileşen/erişilebilirlik) + `ui-ux-pro-max` tasarım-zekâsı skill'i (stil/palet/tipografi taraması). **Durum: SADECE PLANLAMA — hiçbir kod değişmedi.** Uygulama sırası kullanıcıyla birlikte belirlenecek.

## Genel değerlendirme
Temel çok sağlam: token'lı koyu tema (WCAG AA/AAA kontrast), Radix + özel bileşen kütüphanesi, ~%95 reduced-motion desteği, zengin mikro-etkileşim, tutarlı Türkçe kopya. Animasyon kalitesi 7.5/10. Skill taraması mevcut estetiğin **"Modern Dark (Cinema)"** stiliyle (koyu sinematik + ambient ışık + cam + sıcak vurgu) örtüştüğünü doğruladı; Inter doğru font. Eksikler: birkaç veri-güvenliği UX durumu, filmstrip koreografisi/sanallaştırması, token disiplini (59 hardcoded hex, 40+ rastgele gölge), odak yönetimi.

---

## A) VERİ GÜVENLİĞİ / KRİTİK UX (P0 — en önce)

### A1. Review boş-durum kontrolü yok (YÜKSEK)
`ReviewScreen.tsx` — tüm klipler kapatılırsa ekran yine de çizilir; "Premiere'de Kur" boş/bozuk timeline üretebilir.
**Öneri:** `enabled` klip sayısı 0 ise footer CTA'yı kilitle + boş-durum kartı ("En az bir klip açık olmalı — geri al veya sıfırla").

### A2. Build, eklenti kontrolünü animasyondan SONRA yapıyor (YÜKSEK)
`BuildScreen.tsx:156-160` — MONTAJCI doğrulanmamışsa kullanıcı 3.6 sn'lik kurulum animasyonunu boşuna izliyor.
**Öneri:** `phase='building'`e girmeden önce `setup.plugin !== 'ok'` ise uyarı modalı ("Önce Hazırlık'ta MONTAJCI'yı doğrula") + Hazırlık'a kısayol.

### A3. Arşivden "Yeniden aç" mevcut işi sormadan eziyor (ORTA)
`store.ts reopenArchived` — aktif düzenleme varken onaysız üzerine yükler.
**Öneri:** Aktif manifest + değişiklik varsa onay modalı ("Mevcut düzenleme kaybolacak. Devam?").

### A4. Toplu "Sil"de onay yok (ORTA)
`ReviewScreen.tsx:69` — 50 işaretli klip tek tıkla kapanır (undo toast var ama niyet doğrulanmıyor).
**Öneri:** >5 klipte onay iste; Arşiv silme için de aynı (ArchiveScreen.tsx:46).

### A5. Video önizleme hata/yükleniyor durumu yok (YÜKSEK)
`PreviewStage.tsx:36-44` — dosya eksik/bozuksa sahne sessizce siyah kalır.
**Öneri:** `readyState<2` iken skeleton/spinner; `onerror`da rozet ("Klip okunamadı: <ad>") + thumb'a düş.

### A6. Analiz hata mesajları eyleme dönük değil (ORTA)
`AnalysisScreen.tsx` — "Tekrar dene" aynı girdilerle sonsuz döngüye girebilir; hangi dosyanın patladığı belirsiz.
**Öneri:** Sidecar hatasını kullanıcı diline çevir (dosya adı + sebep + ne yapmalı).

---

## B) DİNAMİK / PREMIUM HİS (P1 — "wow" katmanı)

### B1. Filmstrip giriş koreografisi (EN YÜKSEK GETİRİ)
160 klip aniden beliriyor. **Öneri:** görünür ilk ~12 karta 40-60ms kademeli giriş (opacity+y8, ease-out-expo); gerisi anında. Reduced-motion'da kapalı.

### B2. Linear easing'leri yumuşat
`motifs.tsx:25` ScanBeam + `:76` spinner linear → mekanik his. **Öneri:** ease-in-out / ease-out-quart (shimmer arka planda kalabilir).

### B3. Aşama-tamamlama mikro-kutlaması
Analiz'de aşama ikonları anında değişiyor. **Öneri:** pending→done geçişinde 200ms spring scale-pop (stiffness ~380) + %100'de halka glow-pulse (Build'de de).

### B4. Ekran geçişlerine yön duygusu
`App.tsx` sadece opacity+y6. **Öneri:** akış yönüne göre x∓16 kaydırma (ileri: sağdan, geri: soldan) — mekânsal süreklilik.

### B5. Basma geri bildirimi eksik butonlar
`ReviewScreen.tsx:65-69` toplu Cut/Fade/Black + IconButton'lar. **Öneri:** `active:scale-[0.97]` + `--dur-fast` standardı (skill kuralı: scale-feedback 0.95–1.05).

### B6. Sinematik ambient katman (Ghibli kimliği)
Skill'in "Modern Dark Cinema" + "Vintage Analog" bulgusu: (a) çok yavaş salınan 2-3 düşük-opasite ışık blob'u (ana ekran arka planı; RainCanvas ile kardeş), (b) çok hafif film greni overlay'i (opacity ~0.04, Review önizleme çevresinde) — "film stüdyosu" hissi. Reduced-motion'da statik.

### B7. Eksik exit animasyonları
IntakeScreen slot kartları + Setup spine kartları girişli ama çıkışsız (snap). **Öneri:** girişin aynası `exit` ekle (AnimatePresence).

### B8. Sıcak serif vurgu (opsiyonel marka dokunuşu)
Inter kalır; yalnız bölüm adı/hero başlıkta sıcak bir serif (örn. Fraunces/Source Serif) düşünülebilir — Ghibli-masalsı his. Denenip beğenilmezse geri alınır.

---

## C) TASARIM SİSTEMİ DİSİPLİNİ (P1-P2 — bakım/ölçeklenebilirlik)

### C1. 59 hardcoded hex → token
`#0b0e14` inline 8+ tekrar (Filmstrip/Archive/PreviewStage gradyanları) → `var(--color-ink-900)`. Logo/motifs amber duplikaları → amber token'ları. RainCanvas `rgba(176,202,234,…)` → `--color-rain` yeni token.

### C2. Kamera-ölçeği renkleri token'a
`utils.ts:41-49` 8 hex (drone/wide/medium/…) → `--color-scale-*` CSS değişkenleri (tema değişiminde tek yer).

### C3. Gölge kaosu → elevation ölçeği
40+ `shadow-[0_…]` keyfi değer; `--shadow-soft/raised/pop` zaten var. **Öneri:** amber-glow'lu seçim gölgeleri için 2 ek token (`--shadow-glow-sm/lg`), kalanı 3 mevcut tokena indirge.

### C4. Tipografi ölçeği tanımla
20+ keyfi `text-[Npx]` (9→34px). **Öneri:** @theme'de adlandırılmış ölçek: 10/11/12/13/15/18/22/28/34 → `text-2xs…text-display`; satır aralıklarıyla birlikte.

### C5. İkon boyut standardı
7–18px dağınık. **Öneri:** sabitler: 12(xs) 14(sm) 16(md) 18(lg); `ICON` sabiti veya sarmalayıcı.

### C6. Hairline border görünürlüğü
`rgba(255,255,255,.07)` neredeyse görünmez. **Öneri:** .10–.12'ye çıkar (kart tanımı belirginleşir, tema bozulmaz).

### C7. fg-faint (#616c87, 3.7:1) yanlış yerlerde
Sadece dekoratif/disabled'da kalmalı; `motifs.tsx:159` gibi bilgi taşıyan etiketlerde `fg-subtle`e yükselt.

### C8. Unicode glif (╱ ◑ ●) → ikonlaştır
`utils.ts` geçiş glifleri font'a bağımlı; lucide eşdeğerleriyle veya mini SVG ile değiştir.

---

## D) ERİŞİLEBİLİRLİK / ETKİLEŞİM (P2)

### D1. CommandPalette + ShortcutsHelp → Radix Dialog
Elle yazılmış modallar; odak tuzağı yok (Tab dışarı kaçar). AboutDialog/PreviewModal zaten Radix — aynı kalıba taşı.

### D2. Eksik odak halkaları
IconButton (ui.tsx:40-53), ClipCard (role="button"), palette input (`outline-none` yedeksiz) → `focus-visible:ring-2 ring-amber-400`.

### D3. PreviewModal aria-label'ları
Play/Pause/Restart ikon butonları etiketiz; + işlevsel önizleme img'lerine anlamlı alt.

### D4. Disabled çok soluk
`opacity-30` ~1.6:1'e düşürüyor. **Öneri:** opacity-50 + `text-fg-faint` kombinasyonu.

### D5. Filmstrip sanallaştırma
160 klip DOM'da (contentVisibility var ama windowing yok). Genel-amaç pivotta klip sayısı artarsa şart; şimdilik orta öncelik. **Öneri:** hafif custom windowing (yatay şerit için ±görünür alan render).

### D6. İşaretli klip yalnız renkle belli
`ring-amber-400/70` tek gösterge. **Öneri:** köşeye mini check rozeti.

---

## E) REHBERLİK / KOPYA (P2-P3)

### E1. Review ilk-kullanım turu
En karmaşık ekranda hiç rehber yok. **Öneri:** ilk girişte 3-4 adımlı spotlight turu (film şeridi → zaman çizelgesi → Inspector → mod anahtarı), "bir daha gösterme" ile.

### E2. Teknik jargon temizliği
"ffprobe", "UXP", "çift çekim" açıklamasız. **Öneri:** kullanıcı dilinde karşılık + gerekirse tooltip ("çift çekim = aynı sahnenin yedek videosu").

### E3. Statik örnek metin
`IntakeScreen.tsx:73` "Yeni bölüm · cozy yağmur ASMR" hardcoded → seçilen belge adından türet.

### E4. Stepper'da Analiz görünmez
Analiz koşarken breadcrumb "İnceleme"yi gösteriyor. **Öneri:** Analiz sırasında adımda mini spinner/"analiz ediliyor" rozeti.

### E5. Toast'a kapatma butonu
Yalnız otomatik kapanıyor; hover-pause var ama X yok.

---

## Gereksiz / sadeleştirilebilir
- Çift "Giriş'e dön" yolları (top bar + buton) — zararsız, dokunma.
- `--dur-slow` tanımlı ama kullanılmıyor — ya kullan ya sil.
- %40 animasyon süresi hardcoded — `--dur-*` token'larına topla.

## Önerilen uygulama sırası (onay sonrası)
1. **Tur 1 (güvenlik):** A1 A2 A5 → A3 A4 A6
2. **Tur 2 (premium his):** B1 B3 B5 B2 → B4 B6 B7
3. **Tur 3 (sistem):** C1 C2 C3 C4 C5 C6 → C7 C8
4. **Tur 4 (a11y+rehber):** D1 D2 D3 D4 → E1 E2 E3 → D5 D6 E4 E5
Her tur: Playwright + gözle test → prod build → sürüm bump → CHANGELOG/DEVAM/PLAN.

## Araç notları
- **ui-ux-pro-max skill** kuruldu (.claude/skills) — tasarım kararlarında sorgulanacak (stil: Modern Dark Cinema onaylı).
- **21st.dev Magic MCP** kuruldu — yeni bileşen taslakları için kullanılabilir (üretilen kod yine bizim token'lara uyarlanır).
- **framer-motion 12.42.2** güncel; B4 için `MotionConfig`/ortak variants deposu (`lib/motion.ts`) önerilir.
