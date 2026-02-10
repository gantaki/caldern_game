/**
 * Procedural ambient music generator using Web Audio API.
 * Creates a sad, slightly fearful atmosphere for Caldern mines.
 *
 * Layers:
 * - Low drone (foundation, sadness)
 * - Slow minor-key pad (melancholy)
 * - Occasional dissonant high tone (unease/fear)
 * - Reverb via convolver for cavernous feel
 */
export class AmbientMusic {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private padOsc: OscillatorNode | null = null;
  private padGain: GainNode | null = null;
  private playing = false;
  private padInterval: ReturnType<typeof setInterval> | null = null;
  private fearInterval: ReturnType<typeof setInterval> | null = null;

  // Minor scale notes in Hz (A minor, low register)
  private readonly PAD_NOTES = [
    110.00, // A2
    123.47, // B2
    130.81, // C3
    146.83, // D3
    164.81, // E3
    174.61, // F3
    196.00, // G3
  ];

  // Dissonant tones for fear element
  private readonly FEAR_NOTES = [
    311.13, // Eb4
    329.63, // E4
    349.23, // F4
    466.16, // Bb4
    493.88, // B4
  ];

  start(): void {
    if (this.playing) return;

    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0;
    this.masterGain.connect(this.ctx.destination);

    // Fade in
    this.masterGain.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + 3);

    this.startDrone();
    this.startPadCycle();
    this.startFearTones();

    this.playing = true;
  }

  stop(): void {
    if (!this.playing || !this.ctx || !this.masterGain) return;

    // Fade out
    this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 2);

    if (this.padInterval) clearInterval(this.padInterval);
    if (this.fearInterval) clearInterval(this.fearInterval);

    const ctx = this.ctx;
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 2500);

    this.ctx = null;
    this.masterGain = null;
    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.padOsc = null;
    this.padGain = null;
    this.padInterval = null;
    this.fearInterval = null;
    this.playing = false;
  }

  private startDrone(): void {
    if (!this.ctx || !this.masterGain) return;

    // Low drone - fundamental
    const droneGain = this.ctx.createGain();
    droneGain.gain.value = 0.3;
    droneGain.connect(this.masterGain);

    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc1.type = 'sine';
    this.droneOsc1.frequency.value = 55; // A1
    this.droneOsc1.connect(droneGain);
    this.droneOsc1.start();

    // Detuned drone for thickness
    const droneGain2 = this.ctx.createGain();
    droneGain2.gain.value = 0.15;
    droneGain2.connect(this.masterGain);

    this.droneOsc2 = this.ctx.createOscillator();
    this.droneOsc2.type = 'sine';
    this.droneOsc2.frequency.value = 55.5; // Slightly detuned for beating
    this.droneOsc2.connect(droneGain2);
    this.droneOsc2.start();

    // Sub-bass rumble
    const subGain = this.ctx.createGain();
    subGain.gain.value = 0.12;
    subGain.connect(this.masterGain);

    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.value = 36.71; // D1
    subOsc.connect(subGain);
    subOsc.start();

    // Slow LFO on drone pitch for unease
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 0.05; // Very slow wobble
    lfoGain.gain.value = 0.8;
    lfo.connect(lfoGain);
    lfoGain.connect(this.droneOsc1.frequency);
    lfo.start();
  }

  private startPadCycle(): void {
    if (!this.ctx || !this.masterGain) return;

    this.padGain = this.ctx.createGain();
    this.padGain.gain.value = 0;
    this.padGain.connect(this.masterGain);

    this.padOsc = this.ctx.createOscillator();
    this.padOsc.type = 'triangle';
    this.padOsc.frequency.value = this.PAD_NOTES[0]!;
    this.padOsc.connect(this.padGain);
    this.padOsc.start();

    // Change pad note every 4-8 seconds with slow fade
    const changePad = (): void => {
      if (!this.ctx || !this.padOsc || !this.padGain) return;

      const note = this.PAD_NOTES[Math.floor(Math.random() * this.PAD_NOTES.length)]!;
      const now = this.ctx.currentTime;

      // Fade out current
      this.padGain.gain.setValueAtTime(this.padGain.gain.value, now);
      this.padGain.gain.linearRampToValueAtTime(0, now + 1.5);

      // Change note and fade in
      this.padOsc.frequency.setValueAtTime(note, now + 1.5);
      this.padGain.gain.linearRampToValueAtTime(0.12, now + 3);
    };

    // Start first note
    setTimeout(() => changePad(), 2000);

    this.padInterval = setInterval(() => {
      changePad();
    }, 4000 + Math.random() * 4000);
  }

  private startFearTones(): void {
    if (!this.ctx || !this.masterGain) return;

    const playFearTone = (): void => {
      if (!this.ctx || !this.masterGain) return;

      const note = this.FEAR_NOTES[Math.floor(Math.random() * this.FEAR_NOTES.length)]!;
      const now = this.ctx.currentTime;
      const duration = 2 + Math.random() * 3;

      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = note;

      const gain = this.ctx.createGain();
      gain.gain.value = 0;
      gain.gain.linearRampToValueAtTime(0.04 + Math.random() * 0.03, now + duration * 0.3);
      gain.gain.linearRampToValueAtTime(0, now + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + duration + 0.1);
    };

    // Random fear tones every 6-15 seconds
    this.fearInterval = setInterval(() => {
      playFearTone();
    }, 6000 + Math.random() * 9000);

    // First tone after a delay
    setTimeout(() => playFearTone(), 5000);
  }
}
