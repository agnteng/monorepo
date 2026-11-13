import { useEffect, useState } from 'react';

// Load a list of image sources (blob: URLs from a file upload, typically)
// into <img> elements the canvas can draw synchronously. Mirrors
// useLogoAssets' load-then-set pattern, generalised to N slots instead of 4
// fixed ones — speaker photos and sponsor logos are user-uploaded, so the
// count and the URLs themselves change as the user edits the form.
export function useImageList(srcs: (string | null)[]): (HTMLImageElement | null)[] {
  const key = srcs.join('|');
  const [imgs, setImgs] = useState<(HTMLImageElement | null)[]>([]);

  useEffect(() => {
    if (srcs.every((s) => !s)) {
      setImgs(srcs.map(() => null));
      return;
    }
    let cancelled = false;
    const next: (HTMLImageElement | null)[] = srcs.map(() => null);
    let pending = srcs.filter(Boolean).length;
    if (pending === 0) {
      setImgs(next);
      return;
    }
    srcs.forEach((s, i) => {
      if (!s) return;
      const im = new Image();
      const settle = () => {
        next[i] = im;
        if (!cancelled && --pending <= 0) setImgs([...next]);
      };
      im.onload = settle;
      im.onerror = settle;
      im.src = s;
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return imgs;
}
