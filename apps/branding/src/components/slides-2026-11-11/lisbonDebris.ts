import type * as Three from 'three';

// ─────────────────────────────────────────────────────────────────────────
// Lisbon things caught in the storm: sardines, pastéis de nata and the
// Portuguese flag, flung across the slide by Storm.tsx's wind.
//
// Everything is drawn procedurally onto 2D canvases at run time, so there are
// no image assets to ship. They move slower than the confetti (heavier, and
// slow enough to recognise as they cross), and they start well off to the
// left so they arrive over the first few seconds instead of all at once.
// ─────────────────────────────────────────────────────────────────────────

type T = typeof Three;

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

const SARDINES = 12;
const NATAS = 9;
const FLAGS = 3;
// Web Summit is in town the same week; a few of its logos go too.
const WEB_SUMMITS = 4;
const WEB_SUMMIT_LOGO = '/assets/storm/web-summit.png';
const FLAG_W = 1.9;
const FLAG_H = 1.27;

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!] as const;
}

function sardineTexture(THREE: T) {
  const [c, g] = canvas(512, 192);

  // Tail fork.
  g.fillStyle = '#56708F';
  g.beginPath();
  g.moveTo(122, 96);
  g.lineTo(28, 34);
  g.quadraticCurveTo(70, 96, 28, 158);
  g.closePath();
  g.fill();

  // Dorsal and belly fins.
  g.fillStyle = '#4A6584';
  g.beginPath();
  g.moveTo(250, 46);
  g.lineTo(300, 22);
  g.lineTo(320, 44);
  g.closePath();
  g.fill();
  g.beginPath();
  g.moveTo(230, 140);
  g.lineTo(262, 166);
  g.lineTo(280, 142);
  g.closePath();
  g.fill();

  // Body: blue back, silver flank, white belly.
  const body = new Path2D();
  body.moveTo(110, 96);
  body.quadraticCurveTo(270, 22, 470, 84);
  body.quadraticCurveTo(492, 96, 470, 110);
  body.quadraticCurveTo(270, 170, 110, 100);
  body.closePath();
  const grad = g.createLinearGradient(0, 40, 0, 150);
  grad.addColorStop(0, '#22406E');
  grad.addColorStop(0.42, '#7F9AB8');
  grad.addColorStop(0.6, '#D7E1EC');
  grad.addColorStop(1, '#F6F8FB');
  g.fillStyle = grad;
  g.fill(body);

  // Lateral shine and the row of dark spots sardines have along the flank.
  g.save();
  g.clip(body);
  g.strokeStyle = 'rgba(255,255,255,0.55)';
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(140, 94);
  g.quadraticCurveTo(290, 70, 440, 90);
  g.stroke();
  g.fillStyle = 'rgba(18,30,58,0.75)';
  for (let i = 0; i < 6; i++) {
    g.beginPath();
    g.arc(370 - i * 34, 74 + i * 1.5, 5, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();

  // Gill, eye, mouth.
  g.strokeStyle = 'rgba(30,45,75,0.6)';
  g.lineWidth = 4;
  g.beginPath();
  g.arc(452, 98, 46, Math.PI * 0.72, Math.PI * 1.28);
  g.stroke();
  g.fillStyle = '#F6F8FB';
  g.beginPath();
  g.arc(440, 88, 12, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#0B0E2A';
  g.beginPath();
  g.arc(442, 88, 7, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#2B3A57';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(486, 98);
  g.lineTo(466, 102);
  g.stroke();

  return finish(THREE, c);
}

function flagTexture(THREE: T) {
  const [c, g] = canvas(600, 400);
  g.fillStyle = '#046A38';
  g.fillRect(0, 0, 240, 400);
  g.fillStyle = '#DA291C';
  g.fillRect(240, 0, 360, 400);

  // Armillary sphere, simplified: the ring, its bands, the axis.
  const cx = 240;
  const cy = 200;
  const r = 100;
  g.strokeStyle = '#FFE900';
  g.lineWidth = 11;
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.stroke();
  g.lineWidth = 7;
  for (const [ry, rot] of [
    [26, 0],
    [24, 0.5],
    [24, -0.5],
  ] as const) {
    g.beginPath();
    g.ellipse(cx, cy, r, ry, rot, 0, Math.PI * 2);
    g.stroke();
  }
  g.beginPath();
  g.moveTo(cx, cy - r);
  g.lineTo(cx, cy + r);
  g.stroke();

  // Shield: red border with yellow castles, white field, five blue shields.
  const shield = (w: number, h: number) => {
    const p = new Path2D();
    p.moveTo(cx - w / 2, cy - h / 2);
    p.lineTo(cx + w / 2, cy - h / 2);
    p.lineTo(cx + w / 2, cy + h / 6);
    p.quadraticCurveTo(cx + w / 2, cy + h / 2, cx, cy + h / 2);
    p.quadraticCurveTo(cx - w / 2, cy + h / 2, cx - w / 2, cy + h / 6);
    p.closePath();
    return p;
  };
  g.fillStyle = '#FFFFFF';
  g.fill(shield(124, 144));
  g.fillStyle = '#DA291C';
  g.fill(shield(112, 132));
  g.fillStyle = '#FFE900';
  for (const [x, y] of [
    [-44, -54],
    [0, -54],
    [44, -54],
    [-46, -8],
    [46, -8],
    [-32, 40],
    [32, 40],
  ]) {
    g.fillRect(cx + x - 7, cy + y - 7, 14, 14);
  }
  g.fillStyle = '#FFFFFF';
  g.fill(shield(76, 96));
  g.fillStyle = '#003399';
  for (const [x, y] of [
    [0, -26],
    [-20, 0],
    [0, 0],
    [20, 0],
    [0, 26],
  ]) {
    g.beginPath();
    g.moveTo(cx + x - 8, cy + y - 10);
    g.lineTo(cx + x + 8, cy + y - 10);
    g.lineTo(cx + x + 8, cy + y + 3);
    g.quadraticCurveTo(cx + x + 8, cy + y + 11, cx + x, cy + y + 11);
    g.quadraticCurveTo(cx + x - 8, cy + y + 11, cx + x - 8, cy + y + 3);
    g.closePath();
    g.fill();
  }

  return finish(THREE, c);
}

/** The top of a pastel de nata: flaky crust ring, custard, scorched spots. */
function nataTopTexture(THREE: T) {
  const [c, g] = canvas(256, 256);
  const m = 128;

  const crust = g.createRadialGradient(m, m, 90, m, m, 128);
  crust.addColorStop(0, '#B7741F');
  crust.addColorStop(0.5, '#E2A848');
  crust.addColorStop(1, '#9A5A16');
  g.fillStyle = crust;
  g.beginPath();
  g.arc(m, m, 128, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = 'rgba(110,60,12,0.55)';
  g.lineWidth = 2;
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    g.beginPath();
    g.arc(m, m, rnd(104, 124), a, a + rnd(0.15, 0.4));
    g.stroke();
  }

  const custard = g.createRadialGradient(m - 20, m - 20, 10, m, m, 100);
  custard.addColorStop(0, '#FCE38A');
  custard.addColorStop(0.7, '#F2C24A');
  custard.addColorStop(1, '#D99A2B');
  g.fillStyle = custard;
  g.beginPath();
  g.arc(m, m, 98, 0, Math.PI * 2);
  g.fill();

  // Caramelised blotches, from amber to nearly black.
  for (let i = 0; i < 16; i++) {
    const a = rnd(0, Math.PI * 2);
    const d = rnd(0, 78);
    const x = m + Math.cos(a) * d;
    const y = m + Math.sin(a) * d;
    const rr = rnd(8, 26);
    const spot = g.createRadialGradient(x, y, 0, x, y, rr);
    const dark = Math.random() < 0.45;
    spot.addColorStop(0, dark ? 'rgba(40,18,4,0.95)' : 'rgba(120,60,10,0.85)');
    spot.addColorStop(0.6, dark ? 'rgba(90,40,8,0.6)' : 'rgba(170,95,20,0.45)');
    spot.addColorStop(1, 'rgba(170,95,20,0)');
    g.fillStyle = spot;
    g.beginPath();
    g.ellipse(x, y, rr, rr * rnd(0.6, 1), rnd(0, 3), 0, Math.PI * 2);
    g.fill();
  }

  return finish(THREE, c);
}

/** The side of the tart: stacked layers of puff pastry. */
function nataSideTexture(THREE: T) {
  const [c, g] = canvas(256, 64);
  g.fillStyle = '#C98A32';
  g.fillRect(0, 0, 256, 64);
  for (let y = 4; y < 64; y += 7) {
    g.strokeStyle = Math.random() < 0.5 ? 'rgba(240,195,110,0.8)' : 'rgba(120,70,15,0.7)';
    g.lineWidth = rnd(1.5, 3);
    g.beginPath();
    g.moveTo(0, y + rnd(-1, 1));
    for (let x = 0; x <= 256; x += 16) g.lineTo(x, y + rnd(-1.5, 1.5));
    g.stroke();
  }
  return finish(THREE, c);
}

/** The Web Summit logo on a rounded white card, like a sign torn off a wall.
 *  The texture is blank until the image arrives, then fills itself in. */
function webSummitTexture(THREE: T) {
  const [c, g] = canvas(320, 320);
  const tex = finish(THREE, c);
  const img = new Image();
  img.onload = () => {
    g.save();
    g.beginPath();
    g.roundRect(0, 0, 320, 320, 36);
    g.clip();
    g.fillStyle = '#FFFFFF';
    g.fillRect(0, 0, 320, 320);
    g.drawImage(img, 0, 0, 320, 320);
    g.restore();
    tex.needsUpdate = true;
  };
  img.src = WEB_SUMMIT_LOGO;
  return tex;
}

function finish(THREE: T, c: HTMLCanvasElement) {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

interface Flung {
  obj: Three.Object3D;
  drift: number;
  phase: number;
  spin: Three.Vector3;
  flag?: { geo: Three.PlaneGeometry; rest: Float32Array };
}

/** Builds the props into `scene`; returns a per-frame update and a dispose. */
export function lisbonDebris(THREE: T, scene: Three.Scene) {
  const disposables: { dispose(): void }[] = [];
  const keep = <D extends { dispose(): void }>(d: D) => (disposables.push(d), d);

  const sardineMat = keep(
    new THREE.MeshBasicMaterial({
      map: keep(sardineTexture(THREE)),
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide,
    }),
  );
  const sardineGeo = keep(new THREE.PlaneGeometry(1.5, 0.56));

  const nataGeo = keep(new THREE.CylinderGeometry(0.5, 0.38, 0.24, 36));
  const nataMats = [
    keep(new THREE.MeshBasicMaterial({ map: keep(nataSideTexture(THREE)) })),
    keep(new THREE.MeshBasicMaterial({ map: keep(nataTopTexture(THREE)) })),
    keep(new THREE.MeshBasicMaterial({ color: 0xb87a28 })),
  ];

  const flagTex = keep(flagTexture(THREE));
  const flagMat = keep(new THREE.MeshBasicMaterial({ map: flagTex, side: THREE.DoubleSide }));

  const webSummitGeo = keep(new THREE.PlaneGeometry(1.8, 1.8));
  const webSummitMat = keep(
    new THREE.MeshBasicMaterial({
      map: keep(webSummitTexture(THREE)),
      transparent: true,
      side: THREE.DoubleSide,
    }),
  );

  const items: Flung[] = [];
  const add = (obj: Three.Object3D, extra: Partial<Flung> = {}) => {
    scene.add(obj);
    items.push({
      obj,
      drift: 0,
      phase: 0,
      spin: new THREE.Vector3(),
      ...extra,
    });
  };

  for (let i = 0; i < SARDINES; i++) add(new THREE.Mesh(sardineGeo, sardineMat));
  for (let i = 0; i < NATAS; i++) add(new THREE.Mesh(nataGeo, nataMats));
  for (let i = 0; i < FLAGS; i++) {
    const geo = keep(new THREE.PlaneGeometry(FLAG_W, FLAG_H, 24, 12));
    const rest = new Float32Array(geo.attributes.position.array);
    add(new THREE.Mesh(geo, flagMat), { flag: { geo, rest } });
  }
  for (let i = 0; i < WEB_SUMMITS; i++) add(new THREE.Mesh(webSummitGeo, webSummitMat));

  const spawn = (it: Flung, first: boolean) => {
    // First wave is strung out far to the left so things keep arriving.
    it.obj.position.set(first ? rnd(-62, -14) : rnd(-26, -16), rnd(-5.5, 5.5), rnd(-2, 3.5));
    it.obj.rotation.set(rnd(0, 6.3), rnd(0, 6.3), rnd(0, 6.3));
    it.drift = rnd(0.32, 0.52);
    it.phase = rnd(0, 6.3);
    if (it.flag) {
      // Flags sail more than they tumble, so the colours stay readable.
      it.obj.rotation.set(rnd(-0.3, 0.3), rnd(-0.5, 0.5), rnd(-0.4, 0.4));
      it.spin.set(rnd(-0.6, 0.6), rnd(-1, 1), rnd(-0.8, 0.8));
    } else if (it.obj instanceof THREE.Mesh && it.obj.geometry === webSummitGeo) {
      // Mostly face-on, cartwheeling, so the logo is readable as it goes.
      it.obj.rotation.set(rnd(-0.35, 0.35), rnd(-0.35, 0.35), rnd(0, 6.3));
      it.spin.set(rnd(-0.25, 0.25), rnd(-0.35, 0.35), rnd(-2.5, 2.5));
    } else if (it.obj instanceof THREE.Mesh && it.obj.geometry === nataGeo) {
      // Custard side to the room: tip the tart's axis toward the camera,
      // then spin it about that axis and only wobble the rest, so it reads
      // as a nata and not as a plain brown disc.
      it.obj.scale.setScalar(1.4);
      it.obj.rotation.set(Math.PI / 2 + rnd(-0.5, 0.5), rnd(0, 6.3), rnd(-0.4, 0.4));
      it.spin.set(rnd(-0.4, 0.4), rnd(-4, 4), rnd(-0.5, 0.5));
    } else {
      it.obj.scale.setScalar(1.25);
      it.obj.rotation.set(rnd(-0.6, 0.6), rnd(-0.6, 0.6), rnd(-0.5, 0.5));
      it.spin.set(rnd(-5, 5), rnd(-2, 2), rnd(-3, 3));
    }
  };
  for (const it of items) spawn(it, true);

  const update = (t: number, dt: number, wind: number, gate: number) => {
    for (const it of items) {
      const o = it.obj;
      o.position.x += wind * it.drift * gate * dt;
      o.position.y += Math.sin(t * 1.9 + it.phase) * 1.6 * dt;
      o.rotation.x += it.spin.x * dt;
      o.rotation.y += it.spin.y * dt;
      o.rotation.z += it.spin.z * dt + Math.sin(t * 7 + it.phase) * 0.02;
      if (o.position.x > 20) spawn(it, false);

      if (it.flag) {
        // Ripple the cloth, pinned along the hoist (left) edge.
        const pos = it.flag.geo.attributes.position as Three.BufferAttribute;
        const rest = it.flag.rest;
        for (let v = 0; v < pos.count; v++) {
          const x = rest[v * 3];
          const y = rest[v * 3 + 1];
          const free = (x + FLAG_W / 2) / FLAG_W;
          pos.setZ(v, Math.sin(x * 3.4 - t * 11 + it.phase + y * 0.8) * 0.16 * free);
        }
        pos.needsUpdate = true;
      }
    }
  };

  const dispose = () => {
    for (const it of items) scene.remove(it.obj);
    for (const d of disposables) d.dispose();
  };

  return { update, dispose };
}
