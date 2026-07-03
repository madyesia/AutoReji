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

/** Üst amber ışık halesi (ekranlar-arası tek kaynak — §0.4; eskiden 3 farklı ayarla kopyalanmıştı). */
export function AmberHalo() {
  return <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-amber-500/[0.05] to-transparent" />
}
