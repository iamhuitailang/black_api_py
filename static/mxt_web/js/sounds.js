const SoundManager = {
    audioContext: null,

    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    },

    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        this.init();
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

    playFunnySuccess() {
        this.playTone(523, 0.1, 'sine', 0.3);
        setTimeout(() => this.playTone(659, 0.1, 'sine', 0.3), 100);
        setTimeout(() => this.playTone(784, 0.2, 'sine', 0.3), 200);
        setTimeout(() => this.playTone(1047, 0.3, 'sine', 0.4), 400);
    },

    playFunnyFail() {
        this.playTone(400, 0.2, 'sawtooth', 0.2);
        setTimeout(() => this.playTone(300, 0.3, 'sawtooth', 0.2), 200);
        setTimeout(() => this.playTone(200, 0.4, 'sawtooth', 0.2), 400);
    },

    playFunnyBoing() {
        this.playTone(200, 0.1, 'sine', 0.3);
        setTimeout(() => this.playTone(400, 0.1, 'sine', 0.3), 50);
        setTimeout(() => this.playTone(300, 0.15, 'sine', 0.3), 100);
    },

    playCoinSound() {
        this.playTone(988, 0.1, 'square', 0.2);
        setTimeout(() => this.playTone(1319, 0.15, 'square', 0.2), 80);
    },

    playPop() {
        this.playTone(600, 0.05, 'sine', 0.3);
    },

    playTrumpet() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((note, i) => {
            setTimeout(() => {
                this.playTone(note, 0.15, 'triangle', 0.2);
            }, i * 100);
        });
    },

    playSlideDown() {
        this.init();
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.5);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
    },

    playDrum() {
        this.init();
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.1);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.15);
    },

    playLaugh() {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.playTone(300 + i * 50, 0.08, 'square', 0.15);
            }, i * 80);
        }
    },

    playClick() {
        this.playTone(800, 0.03, 'square', 0.1);
    }
};
