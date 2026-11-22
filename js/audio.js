/**
 * Web Audio Engine for Ludo Mobile
 * Synthesizes all sound effects on-the-fly using the Web Audio API.
 * Zero external asset dependencies, zero network latency, 100% offline.
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.hapticsEnabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleSound(forceState) {
    this.enabled = forceState !== undefined ? forceState : !this.enabled;
    return this.enabled;
  }

  toggleHaptics(forceState) {
    this.hapticsEnabled = forceState !== undefined ? forceState : !this.hapticsEnabled;
    return this.hapticsEnabled;
  }

  vibrate(pattern) {
    if (!this.hapticsEnabled || !navigator.vibrate) return;
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Ignore vibration error on unsupported platforms
    }
  }

  // Play subtle UI button click
  playClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.05);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
    this.vibrate(10);
  }

  // Dice rolling tumble sound effect
  playRoll() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    this.vibrate([15, 30, 15, 30, 20]);

    const count = 7;
    for (let i = 0; i < count; i++) {
      const delay = i * 0.09 + Math.random() * 0.03;
      setTimeout(() => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        const freq = 180 + Math.random() * 120;
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.04);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.04);
      }, delay * 1000);
    }
  }

  // Dice landing final thud
  playLand() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
    this.vibrate(25);
  }

  // Token hop / step sound
  playStep(pitchMultiplier = 1) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const baseFreq = 440 * (pitchMultiplier || 1);
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.07);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
    this.vibrate(12);
  }

  // Rolling a 6 celebration chime
  playSix() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    this.vibrate([30, 40, 50]);

    const notes = [659.25, 880, 1046.5]; // E5, A5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.22);
      }, idx * 75);
    });
  }

  // Token captured / cut sound effect
  playCapture() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    this.vibrate([40, 30, 70]);

    const now = this.ctx.currentTime;
    
    // Whoosh / punch combo
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(320, now);
    osc1.frequency.exponentialRampToValueAtTime(80, now + 0.25);

    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.linearRampToValueAtTime(0.01, now + 0.25);

    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // High zap accent
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.05);
    osc2.frequency.exponentialRampToValueAtTime(220, now + 0.28);

    gain2.gain.setValueAtTime(0.2, now + 0.05);
    gain2.gain.linearRampToValueAtTime(0.01, now + 0.28);

    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.28);
  }

  // Reaching Safe Star
  playStarSafe() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    this.vibrate([20, 30, 20]);
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C, E, G, C
    freqs.forEach((freq, i) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.35);
      }, i * 60);
    });
  }

  // Token reaches center Home!
  playHome() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    this.vibrate([50, 40, 50, 40, 80]);

    const arpeggio = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    arpeggio.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.45);
      }, idx * 80);
    });
  }

  // Player Victory Fanfare
  playVictory() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    this.vibrate([100, 50, 100, 50, 200, 100, 300]);

    const fanfare = [
      { f: 523.25, t: 0, d: 0.15 },
      { f: 523.25, t: 0.16, d: 0.15 },
      { f: 523.25, t: 0.32, d: 0.15 },
      { f: 659.25, t: 0.48, d: 0.4 },
      { f: 587.33, t: 0.9, d: 0.2 },
      { f: 659.25, t: 1.12, d: 0.2 },
      { f: 783.99, t: 1.35, d: 0.7 }
    ];

    fanfare.forEach(({ f, t, d }) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + d);
      }, t * 1000);
    });
  }
}

window.soundEngine = new SoundEngine();
