const AudioSystem = {
    audioContext: null,
    masterGain: null,
    enabled: true,
    
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.audioContext.destination);
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    },
    
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    },
    
    playTone(frequency, duration, type = 'square', volume = 0.5) {
        if (!this.enabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(volume * 0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    },
    
    shovelHit() {
        this.playTone(200, 0.1, 'square', 0.4);
        setTimeout(() => this.playTone(150, 0.15, 'sawtooth', 0.3), 30);
    },
    
    shovelBounce() {
        this.playTone(800, 0.1, 'sine', 0.5);
        setTimeout(() => this.playTone(1000, 0.15, 'sine', 0.4), 50);
    },
    
    collectCoin() {
        this.playTone(880, 0.1, 'sine', 0.4);
        setTimeout(() => this.playTone(1100, 0.1, 'sine', 0.4), 80);
        setTimeout(() => this.playTone(1320, 0.15, 'sine', 0.3), 160);
    },
    
    collectMana() {
        this.playTone(600, 0.1, 'sine', 0.3);
        setTimeout(() => this.playTone(800, 0.15, 'sine', 0.4), 60);
    },
    
    playerHurt() {
        this.playTone(200, 0.2, 'sawtooth', 0.5);
        setTimeout(() => this.playTone(150, 0.25, 'square', 0.4), 100);
    },
    
    playerDeath() {
        this.playTone(400, 0.2, 'square', 0.5);
        setTimeout(() => this.playTone(300, 0.2, 'square', 0.4), 150);
        setTimeout(() => this.playTone(200, 0.3, 'sawtooth', 0.5), 300);
    },
    
    enemyHit() {
        this.playTone(300, 0.1, 'square', 0.3);
    },
    
    enemyDeath() {
        this.playTone(400, 0.1, 'square', 0.4);
        setTimeout(() => this.playTone(300, 0.15, 'sawtooth', 0.3), 80);
    },
    
    magicUse() {
        this.playTone(500, 0.1, 'sine', 0.3);
        setTimeout(() => this.playTone(700, 0.15, 'sine', 0.4), 50);
        setTimeout(() => this.playTone(900, 0.2, 'sine', 0.5), 100);
    },
    
    bossStart() {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.playTone(100 + i * 50, 0.15, 'square', 0.5);
            }, i * 100);
        }
    },
    
    levelComplete() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.3, 'sine', 0.4), i * 150);
        });
    },
    
    dig() {
        this.playTone(100, 0.1, 'sawtooth', 0.3);
    },
    
    spikeDeath() {
        this.playTone(150, 0.3, 'sawtooth', 0.6);
    }
};