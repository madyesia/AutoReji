# docs/tasarim/ — UI/UX Geliştirme Ana Planı (2026-07-02)

> **DURUM: SADECE PLANLAMA — hiçbir kod değişmedi.** Uygulama, kullanıcı onayıyla tur tur yapılacak.
> Üretim: 4-ajanlık ilk denetim (`../UI_UX_DENETIM_2026-07-02.md`) + 12-ajanlık derin tarama/çözüm filosu + `ui-ux-pro-max` tasarım-zekâsı skill'i.

## Dosya fihristi

| Dosya | Ne anlatır |
|---|---|
| `../UI_UX_DENETIM_2026-07-02.md` | İlk denetim: A (veri güvenliği) · B (premium his) · C (token disiplini) · D (erişilebilirlik) · E (rehberlik/kopya) |
| `tarama-review.md` | İnceleme ekranı derin tarama: yerleşim ölçüleri, SAHTE mod sistemi, gösterilmeyen veri envanteri (enerji/linger/mood/ses), **.app'te kırık P1-P2**, Timeline yoğunluk analizi |
| `tarama-ekranlar.md` | 5 ekranın görsel/kompozisyon eleştirisi: glass-raised hiç kullanılmıyor, konteyner zıplaması, Build'de yağmur kopukluğu, ekran-ekran KORU/DEĞİŞTİR listeleri |
| `tarama-kopya.md` | Tam Türkçe metin denetimi: 🔴 9 doğruluk hatası ("Bölüm kuruldu" yalanı dahil) · 🟡 ~40 jargon/tutarsızlık · terim sözlüğü · hata mesajı formülü |
| `tarama-panel.md` | MONTAJCI (Premiere UXP) paneli: sessiz hata yolları, çift-tık koruması yok, marka renk kaymaları, ~160 klipte ilerleme eksikleri |
| `spec-tokenlar.md` | Tasarım Sistemi 2.0: hazır-yapıştır @theme bloğu (9 adımlı tip ölçeği, 2 glow gölgesi, hairline .10, 8 kamera-ölçeği tokeni, --color-rain) + 21→9 boyut eşleme tablosu + migrasyon sırası |
| `spec-motion.md` | Hareket Sistemi 2.0: `lib/motion.ts` spesifikasyonu — DUR(4)+FX rafı, EASE(5), SPRING 9→4 preset, yönlü ekran geçişi, filmstrip stagger, kutlama koreografileri, ambient katman |
| `spec-referans-desenler.md` | Dünya standardı araçlardan (Linear/Frame.io/Descript/Resolve/Raycast…) 15+ somut "çalınabilir desen" — kaynaklı, eforlu |
| `spec-vizyon-2-0.md` | ⏸️ VİZYON (uygulanmaz): melez kabuk (sol ray + bölüm şeridi), "Stüdyo" çok-bölümlü ana ekran, Bölüm=belge modeli, tema evrimi, SaaS ölçeklenmesi, 3-fazlı geçiş |

**Tamamlanamayan 4 derinlemesine tarama** (oturum limiti kesti; konuları denetim + tarama-review düzeyinde zaten kapsanıyor, istenirse sonra derinleştirilir): `tarama-performans` · `spec-review-redesign` · `spec-ekran-sahneleri` · `spec-bilesenler`.

## Önerilen uygulama sırası (onay sonrası, tur tur)

Her tur: uygula → Playwright + gözle test → prod build → sürüm bump → CHANGELOG/DEVAM/PLAN.

- **TUR 0 — Kırık & dürüstlük (küçük, acil):** PreviewModal `clipThumb` düzeltmesi (.app'te boş oynuyor) · sprite scrub dürüstleştirme · Build'de ölü mod anahtarı · 🔴 kopya düzeltmeleri ("Bölüm kuruldu"→"kuruluma hazır", "Sürükle-bırak" boş vaadi, "MONTAJCI'yı Kur"→İndir, "Farklı Kaydet" hayaleti, panel "Brain") · panel sessiz-hata + çift-tık koruması.
- **TUR 1 — Veri güvenliği UX (denetim A1-A6 + F2):** Review boş-durum kilidi · Build ön-uçuş kontrolü · arşiv sil/yeniden-aç onayları · toplu silme onayı · önizleme hata/yükleme durumu · eyleme dönük analiz hataları · işaretli-set kaybına koruma.
- **TUR 2 — Token + dil konsolidasyonu:** `spec-tokenlar` @theme bloğu + tip/gölge/ikon migrasyonu + hairline/disabled · `tarama-kopya` 🟡 jargon temizliği (çevrimdışı/çıkar/zaman çizelgesi/işaretli + Türkçe ek uyumları).
- **TUR 3 — Hareket Sistemi 2.0:** `motion.ts` + yönlü geçişler + filmstrip stagger + aşama kutlamaları + ScanBeam/halka easing + ambient katman.
- **TUR 4 — İnceleme 2.0:** Enerji eğrisi + linger rozetleri + Timeline katmanlama (cetvel/çentik/lejant) · varyant seçici · mod sadeleştirme (DirectorPanel→Inspector sekmesi) · min/ort/max istatistikleri.
- **TUR 5 — Ekran kompozisyonu:** Build'e yağmur + RippleField · ekran başına 1 `glass-raised` · Setup özet-satırı · Intake onboarding'i geri itme · Archive hero kart + konteyner/ritim eşitlemeleri.
- **TUR 6 — Panel + referans desenleri:** panel P1/P2 listesi (renk/metin/ilerleme sayacı/iptal) · seçilmiş desenler (video çevresinde nötr tampon, sayaçlı aşamalar, dürüst ETA, arka plan bildirimi, J/K kısayolları).
