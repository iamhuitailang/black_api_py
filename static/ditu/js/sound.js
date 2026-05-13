const Sound = {
    audioContext: null,

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    },

    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.audioContext) {
            this.init();
            if (!this.audioContext) return;
        }

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
    },

    playClick() {
        this.playTone(800, 0.1, 'sine', 0.2);
    },

    playCorrect() {
        this.playTone(523.25, 0.1, 'sine', 0.3);
        setTimeout(() => this.playTone(659.25, 0.1, 'sine', 0.3), 100);
        setTimeout(() => this.playTone(783.99, 0.15, 'sine', 0.3), 200);
    },

    playWrong() {
        this.playTone(200, 0.15, 'square', 0.2);
        setTimeout(() => this.playTone(150, 0.2, 'square', 0.2), 150);
    },

    playWarning() {
        this.playTone(440, 0.1, 'square', 0.2);
        setTimeout(() => this.playTone(440, 0.1, 'square', 0.2), 200);
    },

    playVictory() {
        const notes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
        notes.forEach((note, i) => {
            setTimeout(() => this.playTone(note, 0.2, 'sine', 0.3), i * 150);
        });
    },

    playGameOver() {
        const notes = [392.00, 349.23, 311.13, 261.63];
        notes.forEach((note, i) => {
            setTimeout(() => this.playTone(note, 0.3, 'sine', 0.2), i * 200);
        });
    }
};
