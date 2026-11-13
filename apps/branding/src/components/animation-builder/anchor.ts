// A 9-point alignment anchor (the AlignPad widget), shared by logo placement
// and image cropping. fx/fy are 0=left/top, 0.5=center, 1=right/bottom.
export type Anchor =
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'left'
  | 'center'
  | 'right'
  | 'bottom-left'
  | 'bottom'
  | 'bottom-right';

export const ANCHORS: Anchor[] = [
  'top-left',
  'top',
  'top-right',
  'left',
  'center',
  'right',
  'bottom-left',
  'bottom',
  'bottom-right',
];

export function anchorFactors(a: Anchor): { fx: number; fy: number } {
  const fx = a.includes('left') ? 0 : a.includes('right') ? 1 : 0.5;
  const fy = a.includes('top') ? 0 : a.includes('bottom') ? 1 : 0.5;
  return { fx, fy };
}
