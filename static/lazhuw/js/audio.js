class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.ambientGain = null;
        this.whiteNoiseGain = null;
        this.burnNoiseNode = null;
        this.rainNode = null;
        this.fireplaceNode = null;
        this.isInitialized = false;
        this.ambientSound = false;
        this.whiteNoiseType = 'none';
        this.activeOscillators = [];
        this.noiseInterval = null;
    }

    init() {
        if (this.isInitialized) return Promise.resolve();
        
        return new Promise((resolve) => {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.audioContext = new AudioContext();
                
                this.masterGain = this.audioContext.createGain();
                this.masterGain.gain.value = 0.5;
                this.masterGain.connect(this.audioContext.destination);
                
                this.ambientGain = this.audioContext.createGain();
                this.ambientGain.gain.value = 0;
                this.ambientGain.connect(this.masterGain);
                
                this.whiteNoiseGain = this.audioContext.createGain();
                this.whiteNoiseGain.gain.value = 0;
                this.whiteNoiseGain.connect(this.masterGain);
                
                this.isInitialized = true;
                resolve();
            } catch (e) {
                console.warn('Audio not supported:', e);
                resolve();
            }
        });
    }

    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    createNoiseBuffer(duration = 2) {
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    playBurnSound() {
        if (!this.isInitialized) return;
        
        this.stopBurnSound();
        
        const noiseBuffer = this.createNoiseBuffer(2);
        
        const noise = this.audioContext.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.Q.value = 0.5;
        
        const gain = this.audioContext.createGain();
        gain.gain.value = 0.05;
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ambientGain);
        
        noise.start();
        this.burnNoiseNode = { noise, filter, gain };
        
        const crackle = () => {
            if (!this.ambientSound) return;
            const crackleGain = this.audioContext.createGain();
            crackleGain.gain.setValueAtTime(0, this.audioContext.currentTime);
            crackleGain.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.01);
            crackleGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.05 + Math.random() * 0.1);
            
            const crackleOsc = this.audioContext.createOscillator();
            crackleOsc.type = 'square';
            crackleOsc.frequency.value = 100 + Math.random() * 200;
            crackleOsc.connect(crackleGain);
            crackleGain.connect(this.ambientGain);
            crackleOsc.start();
            crackleOsc.stop(this.audioContext.currentTime + 0.2);
        };
        
        this.noiseInterval = setInterval(() => {
            if (this.ambientSound && Math.random() > 0.3) {
                crackle();
            }
        }, 2000);
    }

    stopBurnSound() {
        if (this.burnNoiseNode) {
            try {
                this.burnNoiseNode.noise.stop();
            } catch (e) {}
            this.burnNoiseNode = null;
        }
        if (this.noiseInterval) {
            clearInterval(this.noiseInterval);
            this.noiseInterval = null;
        }
    }

    playRainSound() {
        if (!this.isInitialized) return;
        
        this.stopWhiteNoise();
        
        const noiseBuffer = this.createNoiseBuffer(4);
        
        const noise = this.audioContext.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        
        const gain = this.audioContext.createGain();
        gain.gain.value = 0.08;
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.whiteNoiseGain);
        
        noise.start();
        this.rainNode = { noise, filter, gain };
    }

    playFireplaceSound() {
        if (!this.isInitialized) return;
        
        this.stopWhiteNoise();
        
        const noiseBuffer = this.createNoiseBuffer(4);
        
        const noise = this.audioContext.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600;
        
        const gain = this.audioContext.createGain();
        gain.gain.value = 0.1;
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.whiteNoiseGain);
        
        noise.start();
        this.fireplaceNode = { noise, filter, gain };
    }

    stopWhiteNoise() {
        if (this.rainNode) {
            try {
                this.rainNode.noise.stop();
            } catch (e) {}
            this.rainNode = null;
        }
        if (this.fireplaceNode) {
            try {
                this.fireplaceNode.noise.stop();
            } catch (e) {}
            this.fireplaceNode = null;
        }
    }

    setAmbientSound(enabled) {
        this.ambientSound = enabled;
        if (this.ambientGain) {
            this.ambientGain.gain.linearRampToValueAtTime(
                enabled ? 1 : 0,
                this.audioContext.currentTime + 0.5
            );
        }
    }

    setWhiteNoise(type) {
        this.whiteNoiseType = type;
        
        if (type === 'none') {
            this.stopWhiteNoise();
            if (this.whiteNoiseGain) {
                this.whiteNoiseGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5);
            }
        } else {
            if (this.whiteNoiseGain) {
                this.whiteNoiseGain.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + 0.5);
            }
            
            if (type === 'rain') {
                this.playRainSound();
            } else if (type === 'fireplace') {
                this.playFireplaceSound();
            }
        }
    }

    playCompletionSound() {
        if (!this.isInitialized) return;
        
        this.resume();
        
        const oscillator = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        oscillator.connect(gain);
        gain.connect(this.masterGain);
        
        const now = this.audioContext.currentTime;
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, now);
        oscillator.frequency.setValueAtTime(659.25, now + 0.2);
        oscillator.frequency.setValueAtTime(783.99, now + 0.4);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
        gain.gain.linearRampToValueAtTime(0, now + 1.2);
        
        oscillator.start(now);
        oscillator.stop(now + 1.5);
        
        return new Promise(resolve => setTimeout(resolve, 1500));
    }

    playExtinguishSound() {
        if (!this.isInitialized) return;
        
        this.resume();
        
        const oscillator = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        oscillator.connect(gain);
        gain.connect(this.masterGain);
        
        const now = this.audioContext.currentTime;
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(300, now);
        oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.3);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        
        oscillator.start(now);
        oscillator.stop(now + 0.3);
    }

    playLightSound() {
        if (!this.isInitialized) return;
        
        this.resume();
        
        const oscillator = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        oscillator.connect(gain);
        gain.connect(this.masterGain);
        
        const now = this.audioContext.currentTime;
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.15);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        
        oscillator.start(now);
        oscillator.stop(now + 0.3);
    }

    vibrate(pattern = [200, 100, 200]) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }

    setMasterVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }

    destroy() {
        this.stopBurnSound();
        this.stopWhiteNoise();
        
        this.activeOscillators.forEach(osc => {
            try {
                osc.stop();
            } catch (e) {}
        });
        this.activeOscillators = [];
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.isInitialized = false;
    }
}

const audioManager = new AudioManager();

export { audioManager };
