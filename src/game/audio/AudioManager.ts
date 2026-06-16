import { AUDIO_CONFIG } from '../config';

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled: boolean = true;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.audioContext.destination);
    } catch (e) {
      console.warn('Web Audio API not supported');
      this.enabled = false;
    }
  }

  private ensureContext(): void {
    if (!this.audioContext) {
      this.initAudioContext();
    }
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 1
  ): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    this.ensureContext();

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  playJump(): void {
    this.playTone(AUDIO_CONFIG.JUMP_FREQUENCY, AUDIO_CONFIG.JUMP_DURATION, 'square', 0.4);
    setTimeout(() => {
      this.playTone(AUDIO_CONFIG.JUMP_FREQUENCY * 1.2, AUDIO_CONFIG.JUMP_DURATION * 0.5, 'square', 0.2);
    }, 30);
  }

  playScore(): void {
    this.playTone(AUDIO_CONFIG.SCORE_FREQUENCY, AUDIO_CONFIG.SCORE_DURATION, 'sine', 0.5);
  }

  playStarCollect(): void {
    const notes = [AUDIO_CONFIG.STAR_FREQUENCY, AUDIO_CONFIG.STAR_FREQUENCY * 1.25, AUDIO_CONFIG.STAR_FREQUENCY * 1.5];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, AUDIO_CONFIG.STAR_DURATION * 0.6, 'sine', 0.4);
      }, i * 60);
    });
  }

  playHit(): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    this.ensureContext();

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(AUDIO_CONFIG.HIT_FREQUENCY, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + AUDIO_CONFIG.HIT_DURATION);

    gainNode.gain.setValueAtTime(0.6, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + AUDIO_CONFIG.HIT_DURATION);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + AUDIO_CONFIG.HIT_DURATION);
  }

  playGameOver(): void {
    const notes = [440, 349, 294, 220];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, AUDIO_CONFIG.GAMEOVER_DURATION * 0.4, 'triangle', 0.4);
      }, i * 150);
    });
  }

  playFrenzy(): void {
    const notes = [AUDIO_CONFIG.FRENZY_FREQUENCY, AUDIO_CONFIG.FRENZY_FREQUENCY * 1.5, AUDIO_CONFIG.FRENZY_FREQUENCY * 2];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, AUDIO_CONFIG.FRENZY_DURATION, 'square', 0.3);
      }, i * 100);
    });
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }
}
