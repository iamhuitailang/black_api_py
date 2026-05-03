const AudioManager = {
    enabled: true,
    audioContext: null,
    masterVolume: 0.5,
    
    init() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    },
    
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    },
    
    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.enabled || !this.audioContext) return;
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        const finalVolume = volume * this.masterVolume;
        gainNode.gain.setValueAtTime(finalVolume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    },
    
    playMatchSound() {
        if (!this.enabled) return;
        
        this.playTone(880, 0.1, 'sine', 0.4);
        
        setTimeout(() => {
            this.playTone(1100, 0.15, 'sine', 0.3);
        }, 100);
        
        setTimeout(() => {
            this.playTone(1320, 0.2, 'sine', 0.25);
        }, 200);
    },
    
    playNoMatchSound() {
        if (!this.enabled) return;
        
        this.playTone(200, 0.3, 'sawtooth', 0.15);
        
        setTimeout(() => {
            this.playTone(180, 0.2, 'sawtooth', 0.1);
        }, 150);
    },
    
    playFlipSound() {
        if (!this.enabled) return;
        
        this.playTone(600, 0.05, 'triangle', 0.15);
    },
    
    playSpecialCardSound(specialType) {
        if (!this.enabled) return;
        
        switch (specialType) {
            case CONSTANTS.CARD_TYPE.SHUFFLE:
                this.playTone(400, 0.1, 'square', 0.2);
                setTimeout(() => this.playTone(500, 0.1, 'square', 0.2), 100);
                setTimeout(() => this.playTone(600, 0.1, 'square', 0.2), 200);
                break;
                
            case CONSTANTS.CARD_TYPE.PEEK:
                this.playTone(700, 0.15, 'sine', 0.3);
                setTimeout(() => this.playTone(900, 0.1, 'sine', 0.2), 100);
                break;
                
            case CONSTANTS.CARD_TYPE.FREEZE:
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => this.playTone(300 + i * 50, 0.1, 'triangle', 0.15), i * 80);
                }
                break;
                
            case CONSTANTS.CARD_TYPE.TRAP:
                this.playTone(150, 0.4, 'sawtooth', 0.2);
                setTimeout(() => this.playTone(100, 0.3, 'sawtooth', 0.15), 200);
                break;
        }
    },
    
    playWinSound() {
        if (!this.enabled) return;
        
        const notes = [523, 659, 784, 1047];
        notes.forEach((note, i) => {
            setTimeout(() => this.playTone(note, 0.3, 'sine', 0.3), i * 150);
        });
    },
    
    playGameOverSound() {
        if (!this.enabled) return;
        
        this.playTone(400, 0.3, 'sine', 0.3);
        setTimeout(() => this.playTone(350, 0.3, 'sine', 0.25), 200);
        setTimeout(() => this.playTone(300, 0.5, 'sine', 0.2), 400);
    }
};
