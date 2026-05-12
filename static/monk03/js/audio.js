class AudioManager {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
            this.enabled = false;
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

    playClimb() {
        this.playTone(800, 0.1, 'sine', 0.2);
        setTimeout(() => this.playTone(1000, 0.05, 'sine', 0.1), 50);
    }

    playCollect() {
        this.playTone(880, 0.1, 'sine', 0.3);
        setTimeout(() => this.playTone(1100, 0.1, 'sine', 0.3), 80);
        setTimeout(() => this.playTone(1320, 0.15, 'sine', 0.3), 160);
    }

    playHit() {
        this.playTone(150, 0.3, 'square', 0.4);
        this.playTone(100, 0.4, 'sawtooth', 0.3);
    }

    playGameOver() {
        this.playTone(400, 0.3, 'sine', 0.3);
        setTimeout(() => this.playTone(350, 0.3, 'sine', 0.3), 200);
        setTimeout(() => this.playTone(300, 0.5, 'sine', 0.3), 400);
    }

    playPowerup() {
        this.playTone(523, 0.1, 'sine', 0.3);
        setTimeout(() => this.playTone(659, 0.1, 'sine', 0.3), 100);
        setTimeout(() => this.playTone(784, 0.1, 'sine', 0.3), 200);
        setTimeout(() => this.playTone(1047, 0.2, 'sine', 0.3), 300);
    }

    playRhythmBeat() {
        this.playTone(600, 0.1, 'sine', 0.4);
    }

    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}

const audioManager = new AudioManager();
