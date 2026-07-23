let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.15,
  rampDown = true
) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    if (rampDown) {
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // audio not available
  }
}

function playNoise(duration: number, volume = 0.08) {
  try {
    const ctx = getCtx();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3000, ctx.currentTime);
    filter.Q.setValueAtTime(0.5, ctx.currentTime);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    source.start(ctx.currentTime);
    source.stop(ctx.currentTime + duration);
  } catch {
    // audio not available
  }
}

export const sounds = {
  plant: () => {
    playTone(200, 0.15, 'triangle', 0.12);
    setTimeout(() => playTone(300, 0.1, 'triangle', 0.1), 50);
  },

  water: () => {
    playNoise(0.3, 0.06);
    setTimeout(() => playNoise(0.2, 0.04), 100);
  },

  nutrient: () => {
    playTone(600, 0.1, 'sine', 0.08);
    setTimeout(() => playTone(800, 0.1, 'sine', 0.08), 80);
    setTimeout(() => playTone(1000, 0.15, 'sine', 0.06), 160);
  },

  harvest: () => {
    playTone(500, 0.08, 'square', 0.06);
    setTimeout(() => playTone(700, 0.12, 'square', 0.08), 60);
    setTimeout(() => playTone(900, 0.1, 'triangle', 0.1), 120);
  },

  sell: () => {
    playTone(800, 0.08, 'square', 0.1);
    setTimeout(() => playTone(1000, 0.08, 'square', 0.1), 100);
    setTimeout(() => playTone(1200, 0.12, 'square', 0.08), 200);
  },

  buy: () => {
    playTone(400, 0.1, 'triangle', 0.1);
    setTimeout(() => playTone(500, 0.1, 'triangle', 0.08), 80);
  },

  error: () => {
    playTone(150, 0.2, 'sawtooth', 0.06);
    setTimeout(() => playTone(100, 0.3, 'sawtooth', 0.04), 150);
  },

  levelUp: () => {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.2, 'sine', 0.1, true), i * 100);
    });
  },

  yerbon: () => {
    const notes = [523, 659, 784, 1047, 1319, 1568];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.3, 'sine', 0.12, true), i * 120);
    });
  },
};
