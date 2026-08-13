// Web Audio API Sound Synthesizer for TrackSense Dashboard

class TrackSenseAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private lastBuzzerTime: number = 0;
  private lastClickTime: number = 0;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Plays a subtle metallic rail click-clack sound as trolley wheels roll over track joints
  public playWheelClick() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      
      // First click
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);

      // Secondary clack
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(650, now + 0.03);
      osc2.frequency.exponentialRampToValueAtTime(90, now + 0.07);

      gain2.gain.setValueAtTime(0.05, now + 0.03);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);

      osc2.start(now + 0.03);
      osc2.stop(now + 0.07);
    } catch {
      // Ignore audio context autoplay restriction
    }
  }

  // Plays high-frequency jolt sound when vibration spike occurs
  public playJoltSound(intensity: number = 1.0) {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220 + intensity * 150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

      const volume = Math.min(0.2, 0.05 * intensity);
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {}
  }

  // Plays alert warning buzzer tone when Defect Confidence Score is high
  public playAlertBuzzer(severity: 'HIGH' | 'CRITICAL' = 'HIGH') {
    if (this.isMuted) return;
    const nowMs = Date.now();
    if (nowMs - this.lastBuzzerTime < 800) return; // Throttle sound repetition
    this.lastBuzzerTime = nowMs;

    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const freq = severity === 'CRITICAL' ? 880 : 660; // A5 vs E5
      osc1.type = 'square';
      osc2.type = 'sawtooth';

      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 1.5, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.setValueAtTime(0.08, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.3);
      osc2.stop(now + 0.3);
    } catch {}
  }

  // Alias methods for App.tsx compatibility
  public updateEngineSound(speed: number, playing: boolean) {
    if (!playing || this.isMuted) return;
    const nowMs = Date.now();
    const interval = Math.max(120, 400 / (speed || 1));
    if (nowMs - this.lastClickTime > interval) {
      this.lastClickTime = nowMs;
      this.playWheelClick();
    }
  }

  public triggerJointClick() {
    this.playWheelClick();
  }

  public triggerBuzzer() {
    this.playAlertBuzzer('HIGH');
  }

  public stopEngine() {
    // Engine stopped
  }
}

export const soundEngine = new TrackSenseAudioEngine();
