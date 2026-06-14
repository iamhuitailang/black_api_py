class AudioManager {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.masterVolume = 0.3;
    }

    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    playTone(frequency, duration, type = 'square', volume = 0.3) {
        if (!this.enabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(volume * this.masterVolume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    playSlash() {
        this.playTone(800, 0.1, 'sawtooth', 0.2);
        setTimeout(() => this.playTone(600, 0.05, 'sawtooth', 0.15), 30);
    }

    playShuriken() {
        this.playTone(1200, 0.08, 'sine', 0.15);
    }

    playHit() {
        this.playTone(150, 0.15, 'square', 0.3);
    }

    playHurt() {
        this.playTone(200, 0.2, 'sawtooth', 0.4);
        setTimeout(() => this.playTone(150, 0.15, 'sawtooth', 0.3), 50);
    }

    playJump() {
        this.playTone(400, 0.1, 'sine', 0.15);
        setTimeout(() => this.playTone(600, 0.08, 'sine', 0.1), 40);
    }

    playDoubleJump() {
        this.playTone(500, 0.08, 'sine', 0.15);
        setTimeout(() => this.playTone(800, 0.1, 'sine', 0.15), 30);
    }

    playEnemyDeath() {
        this.playTone(300, 0.1, 'sawtooth', 0.25);
        setTimeout(() => this.playTone(200, 0.15, 'sawtooth', 0.2), 50);
        setTimeout(() => this.playTone(100, 0.2, 'sawtooth', 0.15), 100);
    }

    playPickup() {
        this.playTone(800, 0.08, 'sine', 0.2);
        setTimeout(() => this.playTone(1000, 0.08, 'sine', 0.2), 60);
        setTimeout(() => this.playTone(1200, 0.1, 'sine', 0.2), 120);
    }

    playExplosion() {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.playTone(100 + Math.random() * 100, 0.15, 'sawtooth', 0.3);
            }, i * 30);
        }
    }

    playWarning() {
        this.playTone(1000, 0.05, 'square', 0.2);
    }

    playStep() {
        this.playTone(80 + Math.random() * 40, 0.05, 'square', 0.1);
    }

    playMechStep() {
        this.playTone(60, 0.1, 'square', 0.2);
    }

    playLaser() {
        this.playTone(500, 0.5, 'sawtooth', 0.15);
    }

    playBossAttack() {
        this.playTone(200, 0.2, 'sawtooth', 0.3);
        setTimeout(() => this.playTone(150, 0.15, 'sawtooth', 0.25), 50);
    }

    playVictory() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((note, i) => {
            setTimeout(() => this.playTone(note, 0.2, 'sine', 0.2), i * 150);
        });
    }

    playDefeat() {
        const notes = [400, 350, 300, 200];
        notes.forEach((note, i) => {
            setTimeout(() => this.playTone(note, 0.3, 'sawtooth', 0.2), i * 200);
        });
    }

    playLevelComplete() {
        const notes = [523, 659, 784, 880, 1047];
        notes.forEach((note, i) => {
            setTimeout(() => this.playTone(note, 0.15, 'sine', 0.2), i * 100);
        });
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }
}

const audioManager = new AudioManager();
