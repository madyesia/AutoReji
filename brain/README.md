# AutoReji — BEYİN (web UI)

AutoReji'nin premium arayüzü (Blueprint §13). İleride **Tauri 2** ile sarılıp `.app` olacak (Faz 4);
şu an tarayıcıda çalışan, tamamen **offline** bir Vite + React + TypeScript uygulaması.

## Çalıştırma
```bash
cd brain
npm install        # ilk sefer
npm run dev        # → http://localhost:5173
```
`npm run build` → `dist/` (prod, type-check dahil). `npm run preview` → prod önizleme.

## Stack
- **Vite 8 + React 19 + TypeScript 6**
- **Tailwind v4** (`@tailwindcss/vite`) — tasarım token'ları `src/index.css` `@theme`
- **Framer Motion** (hareket) · **Radix UI** (slider/tooltip/switch/dialog) · **lucide-react** (ikon)
- **zustand** (durum + geri/ileri al) · Inter (fontsource, gömülü → offline)

## Veri
- `public/episode.json` — gerçek Bölüm 2 manifesti (BEYİN sidecar üretir; `_manifest/*.json`'dan kopyalanır).
- `public/thumbs/<sahne>.jpg` — her klipten gerçek önizleme karesi (ffmpeg).
- Üretim akışında bu dosyaları Python sidecar üretir; UI yalnızca **okur + düzenler** (manifest şeması §10).

## Yapı
```
src/
  index.css              # tasarım sistemi (token + temel + bileşen katmanı)
  App.tsx                # ekran yönlendirme (intake→analiz→inceleme→kur)
  lib/      types · utils · data · store(zustand)
  components/
    AppShell · Logo · RainCanvas · ui (Button/Segmented/Slider/Switch/Tooltip…)
    review/  MiniMap · Filmstrip · Inspector · DirectorPanel · PreviewModal
  screens/  IntakeScreen · AnalysisScreen · ReviewScreen · BuildScreen
```

## Notlar
- Karar motoru (sidecar) çıktısını gösterir/düzenler; **çalışma anında AI yok** (Blueprint kısıtı).
- Geçiş önizleme şu an thumbnail tabanlı simülasyon; **gerçek stereo video önizleme** Tauri asset protokolüyle Faz 4'te.
- Yönetmen panelindeki "canlı yeniden hesap" sidecar'a bağlanınca gerçek zamanlı olur.
