import { useEffect, useState } from 'react';
import type { OverlayAssets } from './overlay';

// Preload the logo SVGs (white + blue mark/wordmark) once, gated on load, for
// the overlay compositor. Mirrors BannerBuilder's asset-loading pattern.
export function useLogoAssets(): OverlayAssets {
  const [assets, setAssets] = useState<OverlayAssets>({ mark: null, word: null, markBlue: null, wordBlue: null });
  useEffect(() => {
    const srcs: Record<keyof OverlayAssets, string> = {
      mark: '/assets/logo/ae-mark-white.svg',
      word: '/assets/logo/ae-wordmark-white.svg',
      markBlue: '/assets/logo/ae-mark.svg',
      wordBlue: '/assets/logo/ae-wordmark.svg',
    };
    const imgs = {} as OverlayAssets;
    const keys = Object.keys(srcs) as (keyof OverlayAssets)[];
    let n = 0;
    const done = () => { if (++n >= keys.length) setAssets({ ...imgs }); };
    keys.forEach((k) => {
      const im = new Image();
      im.onload = done;
      im.onerror = done;
      im.src = srcs[k];
      imgs[k] = im;
    });
  }, []);
  return assets;
}

// Wait for Kode Mono so pill/text metrics are correct (LumaCoverBuilder pattern).
export function useFontsReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const d = (document as Document & { fonts?: { load: (s: string) => Promise<unknown>; ready: Promise<unknown> } }).fonts;
    if (d && d.load) {
      d.load('600 22px "Kode Mono"').then(() => d.ready).then(() => setReady(true)).catch(() => setReady(true));
      const id = setTimeout(() => setReady(true), 1500);
      return () => clearTimeout(id);
    }
    setReady(true);
  }, []);
  return ready;
}
