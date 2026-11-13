import { useEffect, useRef, type ReactNode } from 'react';
import { STAGE_H, STAGE_W } from '../slides/deck';
import { lisbonDebris } from './lisbonDebris';
import { startStormAudio } from './stormAudio';

// ─────────────────────────────────────────────────────────────────────────
// The Lisbon storm, 11 Nov 2026. Wrap a slide's content in <Storm on={…}>
// and mark every piece that should get torn away with `data-gust`.
//
// When `on` flips true:
//   1. A Three.js layer rolls in over the stage: slanted rain, gust streaks,
//      tumbling debris in the brand colours, lightning with a screen flash
//      and a camera shake. The wind ramps up over ~1.5s and keeps gusting.
//      Sardines, pastéis de nata and Portuguese flags get flung through it
//      (lisbonDebris.ts), and it all comes with sound (stormAudio.ts).
//   2. Each [data-gust] element trembles, then is ripped off to the right,
//      tumbling in 3D. The wind front travels left to right, so pieces on the
//      left go first.
//
// When `on` flips false everything is put back. Teardown waits for the deck's
// 260ms cross-fade so the rain doesn't vanish mid-fade when the presenter
// moves on.
//
// Three.js is imported lazily (prefetched while the slide is merely `armed`),
// so it costs nothing on the other slides.
// ─────────────────────────────────────────────────────────────────────────

const PALETTE = [0x3a4dff, 0xb5a6ff, 0xed4ba0, 0xf4f5ff, 0xf9c835, 0x1e2be6];
const TEARDOWN_DELAY_MS = 320;

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export default function Storm({ on, armed, children }: { on: boolean; armed: boolean; children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);

  // Warm the module cache so the first press doesn't wait on the network.
  useEffect(() => {
    if (armed) import('three').catch(() => {});
  }, [armed]);

  useEffect(() => {
    const root = rootRef.current;
    const sky = skyRef.current;
    const flash = flashRef.current;
    const dim = dimRef.current;
    if (!on || !root || !sky || !flash || !dim) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const anims = blowAway(root, reduced);
    dim.style.opacity = '1';
    const stopSky = reduced ? () => {} : startSky(sky, flash);

    return () => {
      dim.style.opacity = '0';
      window.setTimeout(() => {
        stopSky();
        restore(anims);
      }, TEARDOWN_DELAY_MS);
    };
  }, [on]);

  return (
    <div ref={rootRef} style={{ position: 'absolute', inset: 0 }}>
      {children}
      <div
        ref={dimRef}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0,
          transition: 'opacity 1.2s ease',
          background: 'radial-gradient(ellipse at 30% 0%, rgba(5,7,30,0.15), rgba(5,7,30,0.6) 75%)',
        }}
      />
      <div ref={skyRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
      <div
        ref={flashRef}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0,
          background: '#E8ECFF',
        }}
      />
    </div>
  );
}

// ── the slide being torn apart ──────────────────────────────────────────

function blowAway(root: HTMLElement, reduced: boolean): Animation[] {
  const box = root.getBoundingClientRect();
  const k = box.width / STAGE_W || 1; // the stage is CSS-scaled; work in stage px
  const els = Array.from(root.querySelectorAll<HTMLElement>('[data-gust]'));

  return els.map((el) => {
    if (reduced) {
      return el.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 600,
        fill: 'both',
      });
    }
    const r = el.getBoundingClientRect();
    const x = (r.left - box.left) / k;
    const w = r.width / k;

    // The wind front crosses the stage in ~0.9s, plus a little scatter.
    const delay = 450 + (x / STAGE_W) * 900 + rnd(0, 380);
    const dx = STAGE_W - x + w + rnd(300, 900);
    const dy = rnd(-460, 180);
    const dz = rnd(-250, 550);
    const rx = rnd(-140, 140);
    const ry = rnd(-300, -70);
    const rz = rnd(-80, 160);

    const t = (tx: number, ty: number, tz: number, a: number, b: number, c: number) =>
      `perspective(1200px) translate3d(${tx}px, ${ty}px, ${tz}px) rotateX(${a}deg) rotateY(${b}deg) rotateZ(${c}deg)`;

    el.style.transformOrigin = `${rnd(10, 60)}% ${rnd(30, 70)}%`;

    return el.animate(
      [
        {
          offset: 0,
          transform: t(0, 0, 0, 0, 0, 0),
          opacity: 1,
          filter: 'blur(0px)',
        },
        // Rattling in the wind before it lets go.
        {
          offset: 0.07,
          transform: t(rnd(-3, 3), rnd(-3, 3), 0, 0, 0, rnd(-1.5, 1.5)),
        },
        {
          offset: 0.14,
          transform: t(rnd(3, 7), rnd(-4, 2), 0, 0, 0, rnd(-3, 3)),
        },
        {
          offset: 0.21,
          transform: t(rnd(-2, 3), rnd(-3, 3), 0, 0, 0, rnd(-2.5, 2.5)),
        },
        {
          offset: 0.3,
          transform: t(rnd(18, 45), rnd(-28, -6), rnd(10, 60), rx * 0.04, ry * 0.06, rz * 0.05),
          opacity: 1,
          filter: 'blur(0px)',
          easing: 'cubic-bezier(.45,0,.9,.55)',
        },
        // Gone.
        {
          offset: 1,
          transform: t(dx, dy, dz, rx, ry, rz),
          opacity: 0,
          filter: 'blur(5px)',
        },
      ],
      { duration: rnd(1600, 2200), delay, fill: 'both' },
    );
  });
}

function restore(anims: Animation[]) {
  for (const a of anims) {
    a.cancel();
    const el = (a.effect as KeyframeEffect | null)?.target as HTMLElement | null;
    el?.animate(
      [
        { opacity: 0, transform: 'translateY(12px)' },
        { opacity: 1, transform: 'none' },
      ],
      {
        duration: 500,
        delay: rnd(0, 200),
        easing: 'ease-out',
        fill: 'backwards',
      },
    );
  }
}

// ── the weather ─────────────────────────────────────────────────────────

/** Starts the Three.js storm in `host`; returns a synchronous stop. */
function startSky(host: HTMLElement, flash: HTMLElement): () => void {
  let stopped = false;
  let dispose = () => {};
  // Sound starts straight away, while the three import is still in flight.
  const audio = startStormAudio();
  let strikes = 0;

  import('three').then((THREE) => {
    if (stopped) return;

    // A fresh canvas per run, so a quick back-and-forth never has two
    // renderers fighting over one WebGL context.
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
    host.appendChild(canvas);

    let renderer: InstanceType<typeof THREE.WebGLRenderer>;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch {
      // No WebGL (GPU off or blocklisted): the slide still blows away and
      // the storm is still audible, just with no weather drawn.
      canvas.remove();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(STAGE_W, STAGE_H, false);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, STAGE_W / STAGE_H, 0.1, 100);
    camera.position.set(0, 0, 10);

    // Rain: line segments, head + tail recomputed from velocity every frame
    // so the streaks lengthen and lean as the wind picks up.
    const RAIN = 4200;
    const rain = new Float32Array(RAIN * 3);
    const rainSpeed = new Float32Array(RAIN);
    const rainPos = new Float32Array(RAIN * 6);
    const spawnDrop = (n: number, anywhere: boolean) => {
      rain[n * 3] = anywhere ? rnd(-30, 20) : rnd(-40, 14);
      rain[n * 3 + 1] = anywhere ? rnd(-11, 12) : rnd(11, 13);
      rain[n * 3 + 2] = rnd(-12, 6);
      rainSpeed[n] = rnd(0.75, 1.3);
    };
    for (let n = 0; n < RAIN; n++) spawnDrop(n, true);
    const rainGeo = new THREE.BufferGeometry();
    const rainAttr = new THREE.BufferAttribute(rainPos, 3).setUsage(THREE.DynamicDrawUsage);
    rainGeo.setAttribute('position', rainAttr);
    const rainMat = new THREE.LineBasicMaterial({
      color: 0xc9d0ff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    scene.add(new THREE.LineSegments(rainGeo, rainMat));

    // Gust streaks: long, faint, fast, nearly horizontal.
    const GUSTS = 90;
    const gust = new Float32Array(GUSTS * 4); // x, y, z, length
    const gustPos = new Float32Array(GUSTS * 6);
    const spawnGust = (n: number, anywhere: boolean) => {
      gust[n * 4] = anywhere ? rnd(-30, 20) : rnd(-45, -22);
      gust[n * 4 + 1] = rnd(-8, 8);
      gust[n * 4 + 2] = rnd(-8, 4);
      gust[n * 4 + 3] = rnd(2.5, 8);
    };
    for (let n = 0; n < GUSTS; n++) spawnGust(n, true);
    const gustGeo = new THREE.BufferGeometry();
    const gustAttr = new THREE.BufferAttribute(gustPos, 3).setUsage(THREE.DynamicDrawUsage);
    gustGeo.setAttribute('position', gustAttr);
    const gustMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    scene.add(new THREE.LineSegments(gustGeo, gustMat));

    // Debris: little cards in the brand colours, tumbling through in 3D.
    // Spread far off to the left so they arrive over several seconds.
    const BITS = 180;
    const bitGeo = new THREE.PlaneGeometry(0.26, 0.16);
    const bitMat = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
    });
    const bits = new THREE.InstancedMesh(bitGeo, bitMat, BITS);
    bits.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const bit = Array.from({ length: BITS }, () => ({
      p: new THREE.Vector3(),
      r: new THREE.Euler(),
      spin: new THREE.Vector3(),
      drift: 0,
      phase: 0,
      scale: 1,
    }));
    const spawnBit = (n: number, first: boolean) => {
      const b = bit[n];
      b.p.set(first ? rnd(-90, -18) : rnd(-30, -18), rnd(-8, 9), rnd(-6, 5));
      b.r.set(rnd(0, 6.3), rnd(0, 6.3), rnd(0, 6.3));
      b.spin.set(rnd(-9, 9), rnd(-12, 12), rnd(-7, 7));
      b.drift = rnd(0.7, 1.25);
      b.phase = rnd(0, 6.3);
      b.scale = rnd(0.5, 1.6);
    };
    const color = new THREE.Color();
    for (let n = 0; n < BITS; n++) {
      spawnBit(n, true);
      bits.setColorAt(n, color.setHex(PALETTE[n % PALETTE.length]));
    }
    scene.add(bits);
    const lisbon = lisbonDebris(THREE, scene);
    const dummy = new THREE.Object3D();

    // Lightning: a jagged bolt, rebuilt for every strike.
    const BOLT_PTS = 26;
    const boltPos = new Float32Array(BOLT_PTS * 3);
    const boltGeo = new THREE.BufferGeometry();
    boltGeo.setAttribute('position', new THREE.BufferAttribute(boltPos, 3));
    const boltMat = new THREE.LineBasicMaterial({
      color: 0xf4f5ff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const bolt = new THREE.Line(boltGeo, boltMat);
    bolt.position.z = -6;
    scene.add(bolt);

    let strikeAt = 0.35; // the first one lands with the wind
    let boltT = -1;
    let shake = 0;
    const strike = () => {
      let x = rnd(-12, 12);
      let y = 12;
      for (let n = 0; n < BOLT_PTS; n++) {
        boltPos[n * 3] = x;
        boltPos[n * 3 + 1] = y;
        boltPos[n * 3 + 2] = 0;
        x += rnd(-1.1, 1.1);
        y -= rnd(0.5, 1.1);
      }
      boltGeo.attributes.position.needsUpdate = true;
      boltT = 0;
      // The first strike is right on top of us; later ones are mostly farther off.
      audio?.thunder(strikes++ === 0 || Math.random() < 0.3);
      shake = 1;
      flash.animate(
        [
          { opacity: 0 },
          { opacity: 0.75, offset: 0.08 },
          { opacity: 0.08, offset: 0.25 },
          { opacity: 0.5, offset: 0.38 },
          { opacity: 0 },
        ],
        { duration: 520, easing: 'ease-out' },
      );
    };

    const t0 = performance.now();
    let last = t0;
    let raf = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = (now - t0) / 1000;

      const env = smoothstep(0, 1.6, t);
      const wind = 3 + env * (30 + 9 * Math.sin(t * 1.3) + 5 * Math.sin(t * 3.7 + 1));
      rainMat.opacity = 0.12 + 0.38 * env;
      gustMat.opacity = 0.18 * env * (0.6 + 0.4 * Math.sin(t * 2.1));

      for (let n = 0; n < RAIN; n++) {
        const s = rainSpeed[n];
        const vx = wind * s;
        const vy = -24 * s;
        let x = (rain[n * 3] += vx * dt);
        let y = (rain[n * 3 + 1] += vy * dt);
        if (y < -12 || x > 26) {
          spawnDrop(n, false);
          x = rain[n * 3];
          y = rain[n * 3 + 1];
        }
        const z = rain[n * 3 + 2];
        const o = n * 6;
        rainPos[o] = x;
        rainPos[o + 1] = y;
        rainPos[o + 2] = z;
        rainPos[o + 3] = x - vx * 0.035;
        rainPos[o + 4] = y - vy * 0.035;
        rainPos[o + 5] = z;
      }
      rainAttr.needsUpdate = true;

      for (let n = 0; n < GUSTS; n++) {
        const x = (gust[n * 4] += wind * 1.7 * dt);
        gust[n * 4 + 1] -= wind * 0.06 * dt;
        if (x - gust[n * 4 + 3] > 26) spawnGust(n, false);
        const o = n * 6;
        gustPos[o] = gust[n * 4];
        gustPos[o + 1] = gust[n * 4 + 1];
        gustPos[o + 2] = gust[n * 4 + 2];
        gustPos[o + 3] = gust[n * 4] - gust[n * 4 + 3];
        gustPos[o + 4] = gust[n * 4 + 1] + gust[n * 4 + 3] * 0.04;
        gustPos[o + 5] = gust[n * 4 + 2];
      }
      gustAttr.needsUpdate = true;

      for (let n = 0; n < BITS; n++) {
        const b = bit[n];
        b.p.x += wind * 0.9 * b.drift * dt * smoothstep(0.2, 1, env);
        b.p.y += Math.sin(t * 2.3 + b.phase) * 2.2 * dt - 0.6 * dt;
        b.p.z += Math.cos(t * 1.7 + b.phase) * 1.2 * dt;
        b.r.x += b.spin.x * dt;
        b.r.y += b.spin.y * dt;
        b.r.z += b.spin.z * dt;
        if (b.p.x > 24 || b.p.y < -12) spawnBit(n, false);
        dummy.position.copy(b.p);
        dummy.rotation.copy(b.r);
        dummy.scale.setScalar(b.scale);
        dummy.updateMatrix();
        bits.setMatrixAt(n, dummy.matrix);
      }
      bits.instanceMatrix.needsUpdate = true;
      lisbon.update(t, dt, wind, smoothstep(0.25, 1, env));
      audio?.setWind(env, wind);

      if (t >= strikeAt) {
        strike();
        strikeAt = t + rnd(2.5, 6);
      }
      if (boltT >= 0) {
        boltT += dt;
        boltMat.opacity =
          boltT < 0.07 ? 1 : boltT < 0.13 ? 0.15 : boltT < 0.22 ? 0.8 : Math.max(0, 0.8 - (boltT - 0.22) * 4);
        if (boltT > 0.5) boltT = -1;
      }

      shake = Math.max(0, shake - dt * 1.8);
      const gustShake = 0.02 * env;
      camera.position.x = rnd(-1, 1) * (0.12 * shake + gustShake);
      camera.position.y = rnd(-1, 1) * (0.12 * shake + gustShake);

      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(frame);

    dispose = () => {
      cancelAnimationFrame(raf);
      for (const a of flash.getAnimations()) a.cancel();
      rainGeo.dispose();
      rainMat.dispose();
      gustGeo.dispose();
      gustMat.dispose();
      bitGeo.dispose();
      bitMat.dispose();
      bits.dispose();
      boltGeo.dispose();
      boltMat.dispose();
      lisbon.dispose();
      renderer.dispose();
      canvas.remove();
    };
  });

  return () => {
    stopped = true;
    dispose();
    audio?.stop();
  };
}
