/* Synthesized sound effects (no external files) + Indonesian speech */

let ctx: AudioContext | null = null;
let muted = false;

if (typeof window !== 'undefined') {
  muted = localStorage.getItem('robot-angka-muted') === '1';
}

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function isMuted() { return muted; }
export function setMuted(m: boolean) {
  muted = m;
  localStorage.setItem('robot-angka-muted', m ? '1' : '0');
  if (m && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

function osc(
  type: OscillatorType, f0: number, f1: number, t: number, dur: number,
  vol: number, dest?: AudioNode,
) {
  const c = ac(); if (!c || muted) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  const now = c.currentTime + t;
  o.frequency.setValueAtTime(f0, now);
  o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), now + dur);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(vol, now + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  o.connect(g).connect(dest ?? c.destination);
  o.start(now); o.stop(now + dur + 0.05);
}

function noise(dur: number, t: number, vol: number, filterFreq: number, type: BiquadFilterType = 'lowpass', q = 1) {
  const c = ac(); if (!c || muted) return;
  const size = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, size, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = type; f.frequency.value = filterFreq; f.Q.value = q;
  const g = c.createGain();
  const now = c.currentTime + t;
  g.gain.setValueAtTime(vol, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  src.connect(f).connect(g).connect(c.destination);
  src.start(now); src.stop(now + dur);
}

export const sfx = {
  click() {
    osc('square', 620, 900, 0, 0.09, 0.12);
    osc('sine', 1200, 1600, 0, 0.06, 0.06);
  },

  pick() {
    osc('triangle', 500, 780, 0, 0.1, 0.14);
  },

  laser() {
    osc('sawtooth', 1500, 180, 0, 0.28, 0.22);
    osc('square', 2200, 300, 0, 0.2, 0.1);
    noise(0.16, 0, 0.12, 3800, 'highpass');
  },

  /** rising energy whine while the cannon charges up */
  charge() {
    osc('sine', 220, 1500, 0, 0.34, 0.16);
    osc('triangle', 440, 2100, 0.02, 0.32, 0.08);
    noise(0.3, 0, 0.05, 5200, 'highpass');
  },

  explosion() {
    noise(0.9, 0, 0.5, 900, 'lowpass');
    noise(0.4, 0, 0.3, 2500, 'bandpass');
    osc('sine', 120, 34, 0, 0.7, 0.5);
    osc('sine', 80, 28, 0.08, 0.8, 0.4);
    noise(1.4, 0.35, 0.14, 500, 'lowpass');
  },

  zap() {
    // high-voltage crackle: rapid random square blips + hiss
    for (let i = 0; i < 14; i++) {
      const t = i * 0.055 + Math.random() * 0.02;
      const f = 900 + Math.random() * 3200;
      osc('square', f, f * (0.4 + Math.random()), t, 0.05, 0.1);
    }
    noise(0.8, 0, 0.16, 4200, 'highpass');
    osc('sawtooth', 180, 60, 0, 0.75, 0.12);
  },

  correct() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      osc('triangle', f, f, i * 0.09, 0.22, 0.18);
      osc('sine', f * 2, f * 2, i * 0.09, 0.16, 0.06);
    });
  },

  wrong() {
    osc('sawtooth', 260, 90, 0, 0.5, 0.2);
    osc('square', 190, 70, 0.06, 0.45, 0.1);
  },

  fanfare() {
    const seq: [number, number][] = [
      [523.25, 0], [659.25, 0.14], [783.99, 0.28], [1046.5, 0.42],
      [783.99, 0.6], [1046.5, 0.72], [1318.5, 0.9],
    ];
    seq.forEach(([f, t]) => {
      osc('triangle', f, f, t, 0.34, 0.2);
      osc('sine', f / 2, f / 2, t, 0.34, 0.12);
    });
    noise(0.7, 0.9, 0.1, 3000, 'highpass');
  },

  bigExplosion() {
    sfx.explosion();
    noise(1.8, 0.2, 0.4, 600, 'lowpass');
    osc('sine', 60, 22, 0, 1.4, 0.55);
    setTimeout(() => sfx.explosion(), 260);
  },
};

/* ---------- speech (read questions aloud for pre-readers) ---------- */
export function speak(text: string) {
  if (muted) return;
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'id-ID';
    u.rate = 0.92;
    u.pitch = 1.12;
    u.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const id = voices.find((v) => v.lang.toLowerCase().startsWith('id'));
    if (id) u.voice = id;
    window.speechSynthesis.speak(u);
  } catch {
    /* speech unsupported */
  }
}

export function stopSpeak() {
  try {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  } catch {}
}
