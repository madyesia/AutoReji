# PLAN.md — AutoReji İş Planı & Checklist

> **Yaşayan belge.** İlerledikçe `[ ]` → `[x]`. Sıra Blueprint'e (`docs/Blueprint.md`) göredir; hiçbir adım atlanmaz. Güncel durum özeti: `DEVAM.md`.
> Her faz **çalışan, gösterilebilir bir kontrol noktasıyla** biter; "bitti" kriteri karşılanmadan sonraki faza geçilmez.
> Son güncelleme: 2026-06-30 (GENEL SÜRÜM "AutoReji beta v1.0" / teknik 1.0.0 — üretim denetimi + Madyes markası).

---

## Faz -1 — Kurulum & Hazırlık (ortam + izinler + iskelet)
- [x] Blueprint'i baştan sona oku (⚠️ ve 🔧 not edildi)
- [x] Ortam taraması (araçlar; footage/prompt konumları)
- [x] İskelet belgeler: `CLAUDE.md`, `PLAN.md`, `DEVAM.md`, `CHANGELOG.md`, `README.md`, `VERSION`, `.gitignore`
- [x] Blueprint → `docs/Blueprint.md` kopyalandı
- [x] **Auto modu aktif** (kesintisiz + güvenli; classifier riskli/yetki-aşan eylemleri durdurur)
- [ ] (Ops.) Proje izin listesi `.claude/settings.json` — Auto modu aktif olduğundan şart değil; kullanıcı onayıyla eklenebilir
- [x] Araç kurulumu: Node v26.4.0 / npm 11.17, Rust/cargo 1.96, ffmpeg/ffprobe 8.1 (Homebrew)
- [x] Gerçek footage doğrulandı: örnek klip H.264 1920×1080 24fps 8s + **AAC 48kHz stereo**
- [ ] `scripts/setup` (tek-komut ortam kurulumu) ilk sürüm
- [ ] (Opsiyonel) Önerilen eklenti: **Context7 MCP** (canlı kütüphane dokümanı)
- [ ] (Opsiyonel) Git deposu başlat + ilk commit
- [ ] Gerçek prompt formatını örnekle doğrula (Blueprint §4 parser şeması)

## Faz 0 — ⭐ Demo prototip + stereo de-risk (KRİTİK KAPI — her şeyden önce)
> Bu geçmeden tüm yapıyı kurmaya **geçme**. Sonuç Blueprint §3.7'ye yazılır.
- [x] Demo için 3 gerçek klip hazırlandı (`demo/clips/clip1-3.mp4`, stereo doğrulandı) — image prompt Faz 1'de
- [x] Resmî `premiere-api` paneli referans alındı + `@adobe/premierepro` API tipleri incelendi
- [x] Minimal UXP panel yazıldı (`panel/`): import → createSequenceFromMedia → overwrite + in/out kırpma → Cross Dissolve + Dip to Black; sözdizimi doğrulandı
- [x] Adobe **UXP Developer Tool** kurulumu + Developer Mode (kullanıcı yaptı)
- [x] Premiere 26.x'te canlı test — **GEÇTİ** ✅
- [x] **Bitti (a):** ses **native stereo** — A1'de tek stereo katman ✓ (gözle onaylandı)
- [x] **Bitti (b):** iki geçiş **düzenlenebilir** geldi ✓ (Cross Dissolve + Dip to Black)
- [x] **Bitti (c):** **render yok** ✓
- [x] 🔧 matchName'ler: Cross Dissolve=`AE.ADBE Cross Dissolve New`, Dip to Black=`AE.ADBE Dip To Black`; `AddTransitionOptions.setApplyToStart(true)+setDuration(TickTime)` → §3.7 + DEVAM §8
- [x] 🔧 Kırpma: `clipProjectItem.createSetInOutPointsAction(in,out)` yerleştirmeden önce; in=1/out=7 → ~1s handle (geçişe yetti)
- [x] 🔧 Dizim: `createSequenceFromMedia(name, tüm klipler)` hepsini dizer (overwrite gerekmez); gerekirse **ham ProjectItem**
- [~] (Gerek kalmadı) ExtendScript yedeği — UXP tüm akışı karşıladı

## Faz 1 — Omurga (başsız / CLI, UI yok)
> Uçtan uca tek komut: image prompt + video klasörü → manifest.json → UXP "Kur" → Premiere timeline.
- [x] **Prompt parser** (`sidecar/parser.py`, deterministik): scale/subjects/state/regime/color/establishing/tokens — Bölüm 2'de **160/160 sahne** ayrıştırıldı ✓ (eşik 32-38, uyku 147-149 ham olarak görünüyor)
- [x] **Eşleştirme** (`sidecar/match.py`): prompt[N]↔video N — Bölüm 2'de **160↔160** ✓, dosya adından ölçek **%98** çapraz-uyum, ACTION/ENV etiketleri çıkarıldı
- [~] **Varyant/sağlık** (ffprobe): 1080p tercih + süre/stereo + 1080p-altı uyarısı çalışıyor (**sahne 115 = 720p yakalandı**). Akıllı komşu-pürüzsüzlük seçimi sonra (Bölüm 2'de çift çekim yok)
- [x] **Prompt-metin benzerliği** (içerik-kelime Jaccard, `decide.py`) — rejim içi konum/blok sınırı sinyali (§5.2-5.3)
- [ ] **Önizleme kareleri** (akıllı kare: %35/%50/%65 örnekle, en temsili) — yalnız thumbnail (§5, §4.6)
- [x] **Geçiş karar algoritması** (`sidecar/decide.py`, durum makinesi + histerezis + öncelikli kurallar, §7) → cut/fade/black. Bölüm 2: **123 cut / 34 fade / 2 black**; eşikler 38(dış→iç), 149(→uyku) temizlendi ✓
- [x] **Kırpma** (`sidecar/trim.py`): düzensiz ~1s baş+son, asla tam 1.0, **handle ≥ T/2 garanti**, rejim/ölçek modülasyonu (§8) — Bölüm 2: klipler 5.4-6.4s, handle uyarısı 0
- [x] **Süre atama** (`decide.py`: değişken fade 1.0-2.0s / black 1.5-2.5s, seed'li deterministik jitter) (§9) — süre kalibrasyonu Faz 2
- [~] **§9.5 rafineleri**: nefes tempo + ölçek kırpma + monotonluk (#6) + açılış/kapanış imzası + ses mikro-crossfade bayrağı ✓ manifestte. Sarsıcı-cut yumuşatma (#4, kare gerekir) + stereo-mask uygulaması panel/ileride.
- [x] **manifest.json** üretimi (`sidecar/build_manifest.py`, şema §10, sürümlü, seed'li, decision şeffaflığı + handle doğrulaması) — Bölüm 2: **0 hata/0 uyarı**, ~16.1 dk
- [x] **Bölüm adı + arşiv** (prompt belgesi adından → `2_Glass_Dome_Treehouse_in_Heavy_Rain`, çıktı `_manifest/`, §12)
- [x] **UXP panel "Kur"** (`panel/` yükseltildi): manifest seç → import → kırp → diz → geçişler → intro/outro. Sözdizimi OK (§11)
- [~] **Bitti kriteri:** beyin tarafı ✓ (160 klip manifesti, 0 hata). Premiere'de tam bölüm kurulumu = **kullanıcı canlı testi bekliyor** (bu geçince Faz 1 kapanır)

## Faz 2 — Algoritma kalibrasyonu → ❄️ DONDURULDU (2026-06-29, v1.7.0)
- [x] **Derin video analizi** (`sidecar/analyze_video.py`, her kare: parlaklık/renk/hareket) → karar motoruna bağlandı: **sarsıcı-cut yumuşatma** + **hareket→süre** (Bölüm 2: 5 yumuşatma; motion 9.8→3.6s, 0.35→5.1s)
- [x] **Kalite Kontrol (yerel, model yok)**: donma/siyah/decode/flicker/poz/tekrar/eksik tespiti → `clip.qc` + UI risk rozeti/süzgeç. Bölüm 2 temiz; sahte bozuklarda kanıtlandı
- [x] **Yerel görsel-AI (Ollama + Qwen2.5-VL 3B)** — `sidecar/vlm_qc.py`: kare-tabanlı anlamsal hata denetimi (fazla el/parmak, morphing, halüsinasyon, kareler arası tutarsızlık) → `clip.qc`'ye birleşir. Offline; model ilk kullanımda iner (gömülmez). Pipeline doğrulandı (M3 Max ~3-4 sn/klip)
- [x] **(Faz 4, v1.14.5) Model indirme uygulama içinde — GERÇEK:** sidecar `ollama_status` (HTTP `/api/version`+`/api/tags`+disk) + `ollama_pull` (gerçek `/api/pull` stream); ModelSection 5 durum (Ollama yok→kur / kapalı→başlat / model yok→indir / hazır / indiriliyor), her açılışta kontrol. Sahte simülasyon KALDIRILDI. Gerçek Ollama + paketli `.app` ile doğrulandı
- [x] Kanıtlanmış prototip kuralları taşındı (16-35 seti → `decide.py` öncelikli kuralları + histerezis)
- [x] Eşik/rafineler **gerçek veride** ayarlandı; prompt-omurga **20 bölümde (3200 sahne)** doğrulandı (`örnek_image_prompts/`). **Tek genel algoritma yeterli** — tip-özel eşik gerekmedi (§6 🔧 yanıtlandı). *İzleme: video/VLM sinyalleri yalnız Bölüm 2'de kalibre.*
- [x] 🔧 Kalibre değerleri **`config/config.toml`** (kanonik, `Config.from_toml`) + Blueprint §15'e yazıldı
- [x] **Bitti kriteri ✓:** Bölüm 2 kararları + kırpma + rafineler kullanıcı onayından geçti (cozy: CUT 117/FADE 40/BLACK 2, ~13.9 dk); `config.toml` kanonik kaynak oldu, davranış **birebir korundu** (yeniden üretim 0-fark, config_hash aynı); değerler **sabitlendi** (donmuş algoritma)

## Faz 3 — Premium UI (§13)  → **TAMAM (v1.13.0) · `brain/` + **Hazırlık kapısı** (her-açılış %-tarama + gerçek .ccx kurulum) + **UXP paneli sekmeli/kaydırılabilir** · prod build temiz + 0 konsol hatası, kullanıcı onayladı · sıradaki: Faz 4**
- [x] Tasarım dili (§13.7): koyu zemin + amber-altın vurgu + rejim renkleri + cam yüzey + token'lar (`src/index.css`)
- [x] App shell: kimlik + sürüm + bölüm adı + **3 mod anahtarı** (Hızlı/Kontrollü/Yönetmen)
- [x] Intake (3 sürükle-bırak alanı + **anında doğrulama paneli** gerçek Bölüm 2 verisiyle + bölüm adı)
- [x] Analiz ekranı (dairesel ilerleme + 5 aşama + **sakin yağmur** canvas)
- [x] **İnceleme çalışma alanı:** mini-harita (rejim bantları + geçiş/flag) + **film şeridi (gerçek 160 thumbnail)** + inspector/gerekçe
- [x] Geçiş tıkla-değiştir (cut/fade/black + süre slider + handle payı + "neden?") — film şeridi baloncuğu → inspector
- [x] Klavye sürüşü (←/→ · C/F/B · Delete · ⌘Z/⇧⌘Z) + undo/redo + **diff (elle-değişen işareti)** + sıfırla
- [x] **Odak inceleme** (sadece dikkat gerektiren klipleri vurgula)
- [x] **Büyük önizleme alanı (üstte)** — film şeritte hover'da **gerçek video anında oynar** (`/@fs`); klikle seç
- [x] **"Tüm kurguyu oynat"** — sıralı oynatım + geçiş dip + akan playhead
- [x] **Zaman çizelgesi (altta):** rejim bantları + cut/fade/black işaretleri + tıkla-git
- [x] Film şeridi **alta alındı + büyük kartlar** + güçlü hover/seçim (ölçek + amber halka + glow)
- [x] **Canlı kurgu stili** Yönetmen'de gerçekten kararı değiştirir (Daha sakin → fade ~2× + uzun)
- [x] In-app önizleme: gerçek video (thumbnail poster). Gerçek **stereo ses** önizleme = Tauri/Faz 4
- [x] **Sayfa geçişi**: üst bar adım çubuğu (Giriş/İnceleme/Kur) + logo→başa
- [x] **QC UI**: risk rozeti + "Riskli N" süzgeci + Inspector kalite bölümü + "✓ Tümü temiz"
- [x] **Toplu işlem (çoklu seçim)** — film şeridi ⌘/Shift+tık → alt barda toplu Cut/Fade/Black/Sil (tek undo) · v1.10.0
- [x] **Yönetmen paneli** (rafine slider'ları + alt stiller + profil) — *canlı yeniden hesap motora bağlanacak (sidecar)*
- [x] 3 mod (Hızlı / Kontrollü / Yönetmen)
- [x] Trim editörü (in/out slider + görsel tutamak şeridi + baş/son pay göstergesi)
- [x] Build ekranı (özet + kuruluş simülasyonu + manifest/arşiv yolu + talimat)
- [x] **Film şeridi sanallaştırma** — native `content-visibility:auto` (ekran-dışı kartlar boyanmaz; boş-kutu/scroll riski yok) · v1.11.0
- [x] **Arşiv/Geçmiş ekranı** — sinematik poster galerisi (hover-scrub kapak + rejim glow/şerit + tarih grupları + Galeri/Liste + boş durum); localStorage, kuruldukça otomatik kayıt, "Yeniden aç" · v1.11.0 *(gerçek arşiv yolu Faz 4)*
- [x] **Komut paleti ⌘K** (ara-çalıştır + sahneye atla) · **genel bakış/mini-harita** dikkat bayrakları · **boş durum onboarding** · **klavye kısayolları `?`** + ⌘K ipucu · **tümünü sıfırla + "N elle değişik"** · v1.10.0
- [x] **v1.7–1.10 premium cila:** hover-scrub (sprite) · premium altın-çerçeve önizleme + gömülü oynatım kontrolleri (kayan çubuk/seek/önceki-sonraki) + **kalıcı ses** · ölçek kimlik renkleri · geçiş tıkla-döngü (cut→fade→black) + fosforlu timeline · 720p kırmızı uyarı · Kur ekranı yol+kopyala+UXP numaralı adımlar · reduced-motion (WCAG)
- [x] **v1.11.0 kalan UI tamamlandı:** Arşiv galerisi · **Toast** (Geri al'lı) · Inspector mini-önizleme · Analiz iptal/cozy-hata · stil-değişim "ne değişti" özeti · count-up/stagger mikro-etkileşim · WCAG AA kontrast · content-visibility sanallaştırma · Kur ekranı **Finder'da göster** (native köprü) + recap + mini-şerit + tüm-yolları-kopyala
- [x] **Bitti kriteri (v1.11.0):** prod build ✓, 0 konsol hatası (Playwright); tüm ekranlar (Giriş/Analiz/İnceleme/Kur/**Arşiv**) + tüm düzenleme/oynatım/bildirim akışları çalışıyor; **kullanıcı kurgu oranını + UI'yı onayladı.** UI **TAMAM** — kalan yalnız Faz 4'e bağlı (gerçek stereo ses, slider canlı hesap, gerçek arşiv yolu/Finder reveal).
- [x] **v1.12.0 — Hazırlık kapısı + akış premium + UXP panel:** **Hazırlık kurulum ekranı** (`SetupScreen.tsx` — Giriş öncesi ilk-ekran kapısı: AI model indirme / UXP-CC+UDT / Premiere / MONTAJCI entegrasyonu · dikey "Bağlantı Hattı" + sıralı görsel tarama + dürüst ok/ack/pending lejandı · **atlanabilir ama önemini bildirir** · localStorage `isSetupDone` kapısı · AppShell N/4 rozeti + ConnPulse) · **premium imza motifleri** (`motifs.tsx`: ScanBeam/ProgressRing/ApprovedSeal/ConnPulse/StageTimeline) Tarama+Kur+Giriş'e yayıldı · **UXP paneli (`panel/`) premium yeniden inşa** (pipeline kartları + canlı rapor + recap + toast; `main.js` event-emitter + `panel/ui.js`; **ppro 9-adım/6-transaction birebir korundu**; UXP-güvenli CSS; gerçek test Premiere'de UDT Load) · Faz 4 köprüleri hazır (`lib/native.ts`+`lib/setup.ts`). Prod build temiz, 0 konsol hatası.
- [x] **v1.13.0 — Hazırlık her-açılış + gerçek .ccx + premium anim + panel sekmeli:** Hazırlık HER açılışta görünür + **sıralı %-tarama** (`useScanChoreography`, ProgressRing+ScanBeam; onaylı=hızlı; AI model her açılış kontrol) · **MONTAJCI GERÇEK kurulum** = gömülü `.ccx` (`scripts/pack_panel.sh`→`brain/public/plugin/`, ~25KB+sha256) + "Kur" %-akışı → **.ccx GERÇEK indirme** (`installPlugin`/`downloadCcx`; çift-tıkla CC kurar, imzasız, dev-mode gerekmez, offline; pakette UPIA) · gerçek CC/UXP linki · **premium anim** (SweepReveal/RippleField/BirthStat/RevealPanel) önceki "düşük skor" şikayetlerine · **UXP paneli sekmeli/kaydırılabilir** (Yükle→Kur→Rapor + JSON yapıştır; ppro birebir). Prod build temiz, 0 konsol hatası (uçtan uca + reload'da Hazırlık yine). ⚠️ panel + .ccx çift-tık GERÇEK testi Premiere'de.

## Faz 4 — Cila & paketleme  → **❄️ DONDURULDU (v1.14.6) · gerçek `.app` build+imza+açılış + üretim denetimi (marka/kalite/güvenlik) + computer-use DOĞRULANDI**
> **v1.14.1–1.14.5 .app-runtime cilası (computer-use + gerçek Ollama):** Hazırlık **3 öğe** (UDT kaldırıldı) · analiz ekranı (akışkan %+kayan ışık+tamamlanma→review) · ffmpeg PATH fix · Tauri plugin statik-import · `window.open`→`/usr/bin/open` · **MONTAJCI "Test et" gerçek doğrulama** · **`homeDir` izni** (`core:path:default` — tespitler çalışmıyordu) · MONTAJCI launch oto-tespit · Kaldır erken-sıfırlama yok · arşiv klasör-aç+sil · ad-taşması · **AI modeli GERÇEK Ollama tespit/indirme** (sahte simülasyon kaldırıldı, dağıtım-hazır). Tuzaklar: CLAUDE.md §2 + DEVAM.md §8.
- [x] Tauri `.app` build + **Python sidecar gömme** (PyInstaller `aarch64-apple-darwin`, 8MB saf-stdlib + `config.toml` rthook) · `brain/src-tauri/` · **release 31MB, açılıyor, gömülü sidecar frozen ping**
- [x] Model: ilk-kurulum **tek-komut** `scripts/fetch_models.sh` (ollama pull qwen2.5vl:7b) + `setup.ts pullModel` gerçek (list/pull, % ayrıştırma) — gömme YOK (app şişmesin; offline-sonrası)
- [x] **Ad-hoc imza** (§2.3) `signingIdentity:"-"` + sidecar/iç binary ayrı imza + **JIT entitlements** (`Entitlements.plist`: allow-jit + disable-library-validation) · `codesign --verify --deep --strict` ✓
- [x] **Native köprüler GERÇEK:** `lib/tauri.ts` (Command/sidecar/dialog/fs/opener) · `lib/engine.ts` (sidecar pipeline crop→analyze→vlm→build_manifest) · `lib/setup.ts` (detect*/pullModel/installPlugin) · `lib/native.ts` (saveTextFile mutlak yol) · `scripts/setup|build_sidecar|build|dev` · `.claude/settings.json` · tarayıcı fallback korunur (0 hata)
- [~] Performans + hata toleransı — sidecar pipeline kullanıcının GERÇEK testinde (gerçek video klasörü + Ollama, ~dk)
- [x] **Bitti kriteri (yapısal):** `.app` derlenir+imzalanır+açılır; gömülü sidecar frozen ping; tarayıcı akışı 0 konsol hatası. ⚠️ **Offline/Premiere/sidecar-pipeline UÇTAN UCA = kullanıcının GUI testi (otomatik EDİLEMEZ)**

## Faz 5 — UI/UX Geliştirme Turları (kaynak: `docs/UI_UX_DENETIM_2026-07-02.md` + `docs/tasarim/README.md`)
> 16-ajanlık denetim → 7 turluk plan. ⏸️ Ticarileşme/Vizyon-2.0 RAFTA (yalnız beta/kendi kullanımı). Her tur: test → prod build → sürüm bump → CHANGELOG/DEVAM/PLAN.
- [x] **TUR 0 — Kırıklar + dürüstlük (v1.0.2):** PreviewModal `clipThumb` · hover-scrub `hasSprite` kapısı · Kur'da ölü mod anahtarı · 🔴 kopyalar ("kuruluma hazır", Build adımları, "MONTAJCI'yı İndir", dev-mode çelişkisi, "Farklı Kaydet", panel "Brain") · panel sessiz-hata toast + Kur çift-tık kilidi (.ccx yeniden paketlendi)
- [x] **TUR 1 — Veri güvenliği UX (v1.0.3):** Review boş-durum kilidi · Build ön-uçuş kontrolü · arşiv sil/yeniden-aç onayları · toplu silme onayı (>5) · önizleme yükleme/hata durumu · analiz hata rehberi · işaretli-set kaybına Geri-al toast'ı (+ yeni `ConfirmDialog` bileşeni)
- [x] **TUR 2 — Token + dil konsolidasyonu (v1.2.0):** 9 adımlı tip ölçeği (213 kullanım → 0 keyfi boyut) · gölge token'ları (glow-sm/lg + .frame-gold/.ctrl-glass/.playhead-glow) · hairline .10 · ham hex 0 · disabled 60 · fg-faint terfileri · ~45 Türkçe metin (çevrimdışı/Çıkar/işaretli/ek uyumu/hata formülü) · panel dili (.ccx repack) · `scripts/ds_guard.sh`
- [ ] **TUR 3 — Hareket Sistemi 2.0** (`spec-motion.md`: motion.ts + yönlü geçiş + filmstrip stagger + kutlamalar + ambient)
- [ ] **TUR 4 — İnceleme 2.0** (`tarama-review.md` §3/§8: enerji eğrisi + linger + Timeline katmanlama + varyant seçici + mod sadeleştirme)
- [ ] **TUR 5 — Ekran kompozisyonu** (`tarama-ekranlar.md`: Build'e yağmur+RippleField · glass-raised hiyerarşi · Setup özet-satırı · Archive hero)
- [ ] **TUR 6 — Panel + referans desenleri** (`tarama-panel.md` P1/P2 + `spec-referans-desenler.md` seçmeleri)

## Sürekli — Teslim / Devir paketi (§20)
- [x] `DEVAM.md` + `CHANGELOG.md` her faz/oturum sonunda güncel (v1.14.6)
- [x] `README.md` sıfırdan kurulum güncel (üretim durumu + son-kullanıcı kurulum + Madyes/lisans)
- [x] `LICENSE` — © 2026 Madyes (proprietary)
- [x] Bağımlılık manifestoları (`package.json`, `Cargo.toml`; sidecar saf-stdlib → ek manifest gerekmez)
- [x] `scripts/`: `setup.sh` · `dev.sh` · `build.sh` · `build_sidecar.sh` · `fetch_models.sh` · `pack_panel.sh`
- [x] `.gitignore` (büyük model/araç/`binaries/`/build çıktısı hariç)

---

### 🔧 Açık karar noktaları (canlı testte doldurulacak — Blueprint'teki 🔧'ler)
- Sidecar paketleme (PyInstaller tek-binary vs CoreML), beyin↔panel veri aktarımı (sabit yol / watch / seç) — §2
- UXP geçiş/kırpma kesin API imzaları, transaction stratejisi, idempotency — §3.7
- Prompt parser kural seti + bölüme özel karakter harfleri — §4
- Prompt-metin benzerliği: kelime-overlap vs MiniLM; sahne-değişti eşiği/histerezis — §5
- Bölüm tipi (A/B/C) otomatik sınıflandırma gerekli mi — §6
- Eşik kalibrasyonu (sabit vs otomatik), düzleştirme/komşu-kuralı, açıklanabilirlik UI — §7
- Rafine şiddetleri kalibrasyonu (§9.5), config'ten kapatılabilirlik — §9.5
- Manifest süre temsili (saniye vs tick), insan-okunur karar raporu — §10
- UI bileşen mimarisi, güven skoru hesabı, karar motoru servis ayrımı — §13
