class AudioManager {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.musicEnabled = true;
        this.soundEnabled = true;
        this.musicGain = null;
        this.soundGain = null;
        this.activeMusic = null;
        this.musicPlaying = false;
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.musicGain = this.audioContext.createGain();
            this.soundGain = this.audioContext.createGain();
            this.musicGain.connect(this.audioContext.destination);
            this.soundGain.connect(this.audioContext.destination);
            this.musicGain.gain.value = 0.3;
            this.soundGain.gain.value = 0.5;
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    }

    playTone(frequency, duration, type = 'sine', volume = 0.5) {
        if (!this.enabled || !this.soundEnabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.soundGain);
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    playJump() {
        this.playTone(400, 0.1, 'square', 0.3);
        setTimeout(() => this.playTone(600, 0.1, 'square', 0.2), 50);
    }

    playThrow() {
        this.playTone(300, 0.08, 'sawtooth', 0.3);
    }

    playPickup() {
        this.playTone(523, 0.08, 'sine', 0.4);
        setTimeout(() => this.playTone(659, 0.08, 'sine', 0.3), 80);
    }

    playHit() {
        this.playTone(150, 0.2, 'sawtooth', 0.4);
        this.playTone(100, 0.15, 'square', 0.3);
    }

    playEnemyDeath() {
        this.playTone(200, 0.1, 'square', 0.3);
        this.playTone(150, 0.1, 'square', 0.3);
        setTimeout(() => this.playTone(100, 0.2, 'sawtooth', 0.2), 100);
    }

    playPlayerHurt() {
        this.playTone(200, 0.15, 'sawtooth', 0.4);
        setTimeout(() => this.playTone(150, 0.15, 'sawtooth', 0.3), 75);
    }

    playExplosion() {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.playTone(Utils.random(50, 150), 0.1, 'sawtooth', 0.3);
            }, i * 30);
        }
    }

    playLevelComplete() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.4), i * 150);
        });
    }

    playGameOver() {
        const notes = [400, 350, 300, 200];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.3, 'sawtooth', 0.3), i * 200);
        });
    }

    playMenuSelect() {
        this.playTone(800, 0.08, 'sine', 0.2);
    }

    playStart() {
        const notes = [262, 330, 392, 523];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.15, 'square', 0.3), i * 100);
        });
    }

    startMusic() {
        if (!this.enabled || !this.musicEnabled || !this.audioContext || this.musicPlaying) return;
        
        this.musicPlaying = true;
        this.playMusicLoop();
    }

    playMusicLoop() {
        if (!this.musicPlaying || !this.musicEnabled) return;

        const melody = [
            { freq: 262, dur: 0.3 },
            { freq: 330, dur: 0.3 },
            { freq: 392, dur: 0.3 },
            { freq: 523, dur: 0.6 },
            { freq: 392, dur: 0.3 },
            { freq: 330, dur: 0.3 },
            { freq: 262, dur: 0.6 }
        ];

        let time = 0;
        melody.forEach(note => {
            setTimeout(() => {
                if (this.musicPlaying && this.musicEnabled) {
                    this.playMusicNote(note.freq, note.dur);
                }
            }, time * 1000);
            time += note.dur;
        });

        setTimeout(() => {
            if (this.musicPlaying) {
                this.playMusicLoop();
            }
        }, time * 1000);
    }

    playMusicNote(frequency, duration) {
        if (!this.audioContext || !this.musicGain) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.musicGain);
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    stopMusic() {
        this.musicPlaying = false;
    }

    setMusicEnabled(enabled) {
        this.musicEnabled = enabled;
        if (!enabled) {
            this.stopMusic();
        }
    }

    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
    }

    setMusicVolume(volume) {
        if (this.musicGain) {
            this.musicGain.gain.value = volume;
        }
    }

    setSoundVolume(volume) {
        if (this.soundGain) {
            this.soundGain.gain.value = volume;
        }
    }

    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}

const Audio = new AudioManager();
