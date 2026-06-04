class AudioManager {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API 不支持');
        }
    }

    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.enabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    playAttack() {
        this.playTone(200, 0.1, 'sawtooth', 0.4);
        setTimeout(() => this.playTone(150, 0.15, 'square', 0.3), 50);
    }

    playHit() {
        this.playTone(100, 0.2, 'square', 0.5);
        this.playTone(80, 0.25, 'sawtooth', 0.4);
    }

    playHeal() {
        this.playTone(400, 0.1, 'sine', 0.3);
        setTimeout(() => this.playTone(500, 0.1, 'sine', 0.3), 100);
        setTimeout(() => this.playTone(600, 0.15, 'sine', 0.3), 200);
    }

    playSkill() {
        this.playTone(300, 0.1, 'triangle', 0.4);
        setTimeout(() => this.playTone(400, 0.1, 'triangle', 0.4), 80);
        setTimeout(() => this.playTone(500, 0.1, 'triangle', 0.4), 160);
        setTimeout(() => this.playTone(600, 0.2, 'triangle', 0.4), 240);
    }

    playVictory() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((note, i) => {
            setTimeout(() => this.playTone(note, 0.3, 'sine', 0.3), i * 150);
        });
    }

    playDefeat() {
        const notes = [400, 350, 300, 200];
        notes.forEach((note, i) => {
            setTimeout(() => this.playTone(note, 0.4, 'sawtooth', 0.3), i * 200);
        });
    }

    playClick() {
        this.playTone(800, 0.05, 'sine', 0.2);
    }

    playPowerup() {
        this.playTone(600, 0.1, 'sine', 0.3);
        setTimeout(() => this.playTone(800, 0.15, 'sine', 0.4), 100);
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

export const audioManager = new AudioManager();
