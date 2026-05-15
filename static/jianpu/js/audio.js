const AudioPlayer = {
    audioContext: null,

    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    },

    playNote(frequency, duration = 1) {
        this.init();
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

        gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    },

    playNotePiano(frequency, duration = 1.5) {
        this.init();
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const now = this.audioContext.currentTime;

        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const osc3 = this.audioContext.createOscillator();
        
        const gain1 = this.audioContext.createGain();
        const gain2 = this.audioContext.createGain();
        const gain3 = this.audioContext.createGain();
        const masterGain = this.audioContext.createGain();

        osc1.connect(gain1);
        osc2.connect(gain2);
        osc3.connect(gain3);
        
        gain1.connect(masterGain);
        gain2.connect(masterGain);
        gain3.connect(masterGain);
        
        masterGain.connect(this.audioContext.destination);

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(frequency, now);
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(frequency * 2, now);
        
        osc3.type = 'triangle';
        osc3.frequency.setValueAtTime(frequency * 3, now);

        gain1.gain.setValueAtTime(0.5, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        gain2.gain.setValueAtTime(0.25, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.8);
        
        gain3.gain.setValueAtTime(0.125, now);
        gain3.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.6);

        masterGain.gain.setValueAtTime(0, now);
        masterGain.gain.linearRampToValueAtTime(0.8, now + 0.01);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc1.start(now);
        osc2.start(now);
        osc3.start(now);
        
        osc1.stop(now + duration);
        osc2.stop(now + duration);
        osc3.stop(now + duration);
    }
};