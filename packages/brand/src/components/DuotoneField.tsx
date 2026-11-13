import Animation, { type AnimName, type Shape } from './Animation';
import Image, { type ImagePosition } from './Image';

// Composed island: <Animation><Image/></Animation> packaged for Astro, where a
// React island can't receive component children with props across the slot
// boundary. In .tsx you compose Animation + Image directly; in .astro use this.
interface Props {
  src: string;
  animation?: AnimName;
  color?: string;
  edge?: string;
  bg?: string;
  cell?: number;
  gap?: number;
  density?: number;
  motion?: number;
  shape?: Shape;
  fade?: 'none' | 'left' | 'right' | 'up' | 'down' | 'radial';
  contrast?: number;
  edgeGlow?: number;
  tone?: number;
  position?: ImagePosition;
  onStatus?: (s: 'ok' | 'cors' | 'error') => void;
  style?: React.CSSProperties;
}

export default function DuotoneField({
  src,
  animation = 'wave',
  color = '#1E2BE6',
  edge = '#B5A6FF',
  bg = '#05071E',
  cell = 4,
  gap = 0,
  density = 1,
  motion = 30,
  shape = 'square',
  fade = 'none',
  contrast = 1.4,
  edgeGlow = 1.3,
  tone = 0.5,
  position,
  onStatus,
  style,
}: Props) {
  return (
    <Animation
      animation={animation}
      color={color}
      edge={edge}
      bg={bg}
      cell={cell}
      gap={gap}
      density={density}
      motion={motion}
      shape={shape}
      fade={fade}
      onStatus={onStatus}
      style={style}
    >
      <Image src={src} contrast={contrast} edgeGlow={edgeGlow} tone={tone} position={position} />
    </Animation>
  );
}
