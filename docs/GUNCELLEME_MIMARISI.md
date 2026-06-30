# AutoReji — Oto-Güncelleme & Dağıtım Mimarisi (PLANLAMA NOTU)

> ⏸️ **DURUM: Tartışıldı + kaydedildi, HENÜZ UYGULANMADI** (kullanıcı kararı 2026-07-01).
> Uygulamadan önce aşağıdaki "Açık kararlar" netleşmeli. Bu dosya istişare/hatırlatma içindir.

## Amaç (kullanıcının tarif ettiği senaryo)
1. Merkezi bir yere bağlı **sürüm kaynağı** (canlı yayınlanan sürüm).
2. İlk açılışta **temalı, animasyonlu bir yükleniş ekranı** (örnek: G-Labs dönen radyal görsel) — ama AutoReji teması (amber/altın + yağmur + damla logo).
3. Açılışta **internet + sürüm kontrolü**: uygulama sürümü ≠ canlı sürüm → **isteğe bağlı güncelleme bildirimi**.
4. "Güncelle" → indir + uygulamayı otomatik güncelle.

## Mimari (3 parça)
1. **Merkezi sürüm kaynağı (feed):** uzakta bir `latest.json` (sürüm + indirme URL + imza + sürüm notları) + sürüm dosyaları. **Öneri: GitHub Releases (ÜCRETSİZ, Tauri ile en yaygın)** — alternatif: kendi sunucu / S3 / Cloudflare R2.
2. **Uygulama içi updater:** Tauri 2 **RESMÎ updater eklentisi** (`tauri-plugin-updater` + `@tauri-apps/plugin-updater`). Açılışta `check()` → `latest.json` sürümünü uygulamanın **teknik semver**'iyle (1.0.1) karşılaştırır → yeni varsa `downloadAndInstall()` + `relaunch()`. (Yani çoğu işi Tauri hazır veriyor; sıfırdan yazmıyoruz.)
3. **Temalı açılış (splash) ekranı:** dönen/efektli, AutoReji teması; **mevcut motiflerle kurulur** (`ProgressRing` · `ScanBeam` · `RainCanvas`). İçinde internet + sürüm kontrolü çalışır; bitince Hazırlık'a geçer veya güncelleme bildirimi gösterir.

## Akış (kullanıcı tarafı)
Açılış → temalı splash → (online ise) sürüm kontrolü → yeni sürüm varsa **isteğe bağlı "Güncelle" bildirimi** → "Güncelle" → imzalı paketi indir + doğrula + değiştir + yeniden başlat. **Offline ise → kontrol atlanır, uygulama normal açılır.**

## Yayınlama iş akışı (geliştirici tarafı — yeni sürüm çıkınca)
1. Teknik semver bump (1.0.1 → 1.0.2).
2. `bash scripts/build.sh` + **updater imzası** (`TAURI_SIGNING_PRIVATE_KEY` ile artifact imzalanır).
3. Artifact + `latest.json` host'a yüklenir (örn. GitHub Release).
4. Kullanıcı app'i açınca updater `latest.json`'u görür → güncelleme teklif eder.

## ⚠️ KRİTİK GERÇEK #1 — İMZA (en önemli karar)
- Updater'ın **kendi imza anahtarı** (minisign, Apple'dan AYRI; `tauri signer generate`) indirmenin sahteliğini engeller — bu kolay.
- AMA macOS'te updater `.app`'i değiştirip yeniden başlatınca: **ad-hoc imza ile her güncellemede Gatekeeper "doğrulanamadı" sürtünmesi** olur (binlerce kullanıcı için kötü deneyim).
- **Pürüzsüz oto-güncelleme = Apple Developer ID + notarization (~$99/yıl) ŞART.** Notarization ile güncellemeler sessiz/temiz olur.
- **Karar:** (a) Apple Developer hesabı al → tam pürüzsüz oto-güncelleme; ya da (b) ad-hoc kal → updater yine "yeni sürüm var" bildirir ama kurulum yarı-manuel ("yeni .dmg indir, sürükle"). 

## ⚠️ KRİTİK GERÇEK #2 — OFFLINE ÇAKIŞMASI
- Hard constraint: "çalışma anında internet GEREKMEZ (tamamen offline)" — kanal offline üretim yapıyor.
- **Her açılışta internet ZORUNLU yapmak bu ilkeyi bozar.** Öneri: internet **zorunlu DEĞİL** — kontrol online ise yapılır, offline ise zarifçe atlanır, uygulama yine açılır. İlk kurulum zaten online (model indirme); güncelleme kontrolü ona binebilir. (İstenirse "ilk kez aktivasyon" bir defaya mahsus online olabilir; günlük kullanım offline kalmalı.)

## Sürüm kontrolü
Updater **teknik semver**'i (1.0.1) karşılaştırır. Görünen "beta v1.0" pazarlama etiketi; her yayında semver artar (1.0.2, 1.0.3 …).

## AÇIK KARARLAR (uygulamadan önce netleşmeli)
1. **İmza:** Apple Developer ID + notarization (~$99/yıl) alınacak mı? → oto-güncelleme kalitesini belirler. **(En kritik.)**
2. **Host:** GitHub Releases (ücretsiz, önerilen) mi, kendi sunucu mu?
3. **İnternet:** graceful (önerilen) mi, ilk-açılış-zorunlu mu?
4. **Kanal:** beta kanalı ayrı tutulsun mu?

## Elimizde HAZIR olanlar (uygulanınca işi kolaylaştırır)
- Tauri 2 zaten kurulu → updater eklentisi eklenebilir.
- Premium motifler (`ProgressRing`/`ScanBeam`/`RainCanvas`) → splash'a hazır.
- Sürüm zaten senkron semver (6 nokta).
- Hazırlık ekranı zaten online kontrol (Ollama HTTP) yapıyor → desen mevcut, aynısı sürüm kontrolüne uygulanır.
