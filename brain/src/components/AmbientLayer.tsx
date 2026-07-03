/** Ambient ışık katmanı (Hareket 2.0 §4.1) — CSS-only, JS döngüsü açmaz.
 *  RainCanvas'ın ALTINA konur. Ekranlar: Intake/Analysis/Build/Setup/Archive(boş).
 *  Review'da KULLANILMAZ (ekran zaten en yoğun — atmosferi grain verir). */
export function AmbientLayer() {
  return (
    <div className="ambient" aria-hidden>
      <i className="b1" /><i className="b2" /><i className="b3" />
    </div>
  )
}
