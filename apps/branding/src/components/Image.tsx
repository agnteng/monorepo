// ─────────────────────────────────────────────────────────────────────────
// Image — a vanilla, config-only child of <Animation>.
//   <Animation ...><Image src contrast edgeGlow tone /></Animation>
// It renders nothing on its own: <Animation> reads its props and draws the
// photo *through* the animated field. Keeping the image concern (contrast,
// edge glow, tone) in its own component means the field engine and the image
// treatment can each be improved without touching the other.
// ─────────────────────────────────────────────────────────────────────────

import type { Anchor } from './animation-builder/anchor';

export type ImagePosition = Anchor;

export interface ImageProps {
  src: string;
  contrast?: number; // luminance contrast (default 1.4)
  edgeGlow?: number; // edge-detection emphasis (default 1.3)
  tone?: number; // overall luminance lift / exposure (default 0.5)
  position?: Anchor; // 9-point cover-crop alignment (default center)
}

function Image(_props: ImageProps) {
  return null;
}

// marker so <Animation> can detect this child among its children without
// importing the symbol (which would shadow the global Image constructor).
(Image as unknown as { isAnimationImage: boolean }).isAnimationImage = true;

export default Image;
