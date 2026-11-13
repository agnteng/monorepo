// ─────────────────────────────────────────────────────────────────────────
// Storm sound for Storm.tsx, synthesised with Web Audio, so there are no
// audio files to ship. Three layers:
//
//   rain    white noise, band-limited to the hiss of heavy rain
//   wind    brown noise through a swept band-pass (the roar), plus a narrow
//           resonant band that whistles higher as the gusts pick up
//   thunder a crack (close strikes only) and a long low rumble, played a
//           beat after each lightning flash, the way sound lags light
//
// The storm starts on a key press, which counts as the user gesture that
// browsers require before audio plays.
// ─────────────────────────────────────────────────────────────────────────

const MASTER = 0.9;

function noiseBuffer(ctx: AudioContext, seconds: number, brown: boolean) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (brown) {
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      } else {
        d[i] = w;
      }
    }
  }
  return buf;
}

export interface StormAudio {
  /** Called every frame: `env` 0..1 is how far the storm has built, `wind` its speed. */
  setWind(env: number, wind: number): void;
  /** One thunderclap. `close` adds the crack and shortens the delay. */
  thunder(close: boolean): void;
  /** Fades out, then releases the audio device. */
  stop(): void;
}

export function startStormAudio(): StormAudio | null {
  const AC =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  const ctx = new AC();
  ctx.resume().catch(() => {});

  const master = ctx.createGain();
  master.gain.value = 0;
  master.gain.setTargetAtTime(MASTER, ctx.currentTime, 0.4);
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.ratio.value = 4;
  master.connect(comp).connect(ctx.destination);

  const white = noiseBuffer(ctx, 4, false);
  const brown = noiseBuffer(ctx, 6, true);
  const loop = (buf: AudioBuffer) => {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.loopStart = Math.random();
    src.start(0, Math.random() * buf.duration);
    return src;
  };

  // Rain.
  const rainHp = ctx.createBiquadFilter();
  rainHp.type = 'highpass';
  rainHp.frequency.value = 900;
  const rainLp = ctx.createBiquadFilter();
  rainLp.type = 'lowpass';
  rainLp.frequency.value = 7500;
  const rainGain = ctx.createGain();
  rainGain.gain.value = 0;
  const rain = loop(white);
  rain.connect(rainHp).connect(rainLp).connect(rainGain).connect(master);

  // Wind roar.
  const roarBp = ctx.createBiquadFilter();
  roarBp.type = 'bandpass';
  roarBp.Q.value = 0.7;
  roarBp.frequency.value = 300;
  const roarGain = ctx.createGain();
  roarGain.gain.value = 0;
  const roar = loop(brown);
  roar.connect(roarBp).connect(roarGain).connect(master);

  // Wind whistle.
  const whistleBp = ctx.createBiquadFilter();
  whistleBp.type = 'bandpass';
  whistleBp.Q.value = 14;
  whistleBp.frequency.value = 600;
  const whistleGain = ctx.createGain();
  whistleGain.gain.value = 0;
  const whistle = loop(white);
  whistle.connect(whistleBp).connect(whistleGain).connect(master);

  const sources: AudioScheduledSourceNode[] = [rain, roar, whistle];
  let stopped = false;

  return {
    setWind(env, wind) {
      if (stopped) return;
      const now = ctx.currentTime;
      const w = Math.min(1, wind / 45); // 0..1, gusts included
      rainGain.gain.setTargetAtTime(0.05 + 0.3 * env, now, 0.3);
      roarGain.gain.setTargetAtTime(0.15 + 1.1 * env * w, now, 0.15);
      roarBp.frequency.setTargetAtTime(220 + 700 * w, now, 0.2);
      whistleGain.gain.setTargetAtTime(0.1 * env * w * w, now, 0.2);
      whistleBp.frequency.setTargetAtTime(500 + 1100 * w, now, 0.25);
    },

    thunder(close) {
      if (stopped) return;
      const t0 = ctx.currentTime + (close ? 0.08 : 0.35 + Math.random() * 0.9);

      if (close) {
        const crack = ctx.createBufferSource();
        crack.buffer = white;
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 1200;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(0.9, t0 + 0.005);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);
        crack.connect(hp).connect(g).connect(master);
        crack.start(t0, Math.random() * 2, 0.4);
      }

      const len = close ? 4.5 : 3 + Math.random() * 2;
      const rumble = ctx.createBufferSource();
      rumble.buffer = brown;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(close ? 900 : 450, t0);
      lp.frequency.exponentialRampToValueAtTime(120, t0 + len);
      const g = ctx.createGain();
      const peak = close ? 2.2 : 1.2 + Math.random() * 0.6;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(peak, t0 + (close ? 0.03 : 0.25));
      // A couple of rolls in the rumble before it dies away.
      g.gain.linearRampToValueAtTime(peak * 0.45, t0 + len * 0.25);
      g.gain.linearRampToValueAtTime(peak * 0.75, t0 + len * 0.38);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + len);
      rumble.connect(lp).connect(g).connect(master);
      rumble.start(t0, Math.random() * 3, len + 0.1);
    },

    stop() {
      if (stopped) return;
      stopped = true;
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0, now + 0.6);
      window.setTimeout(() => {
        for (const s of sources) {
          try {
            s.stop();
          } catch {
            /* already stopped */
          }
        }
        ctx.close().catch(() => {});
      }, 700);
    },
  };
}
