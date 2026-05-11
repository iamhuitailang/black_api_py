const AudioEngine = {
    audioContext: null,
    masterGain: null,
    analyser: null,
    isInitialized: false,
    startTime: 0,
    pausedTime: 0,
    scheduledEvents: [],
    isMuted: false,

    init(force = false) {
        if (this.isInitialized && !force) return;
        
        try {
            if (force && this.audioContext) {
                try {
                    this.audioContext.close();
                } catch (e) {}
            }
            
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.isMuted = false;
            
            this.masterGain.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            this.isInitialized = true;
            console.log('✅ 音频引擎初始化成功，AudioContext状态:', this.audioContext.state);
        } catch (error) {
            console.error('❌ 音频引擎初始化失败:', error);
        }
    },

    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    },

    setMasterVolume(value) {
        if (this.masterGain && !this.isMuted) {
            this.masterGain.gain.value = value / 100;
        }
    },

    mute() {
        if (this.masterGain) {
            this.masterGain.gain.value = 0;
            this.isMuted = true;
        }
    },

    unmute(currentVolume) {
        if (this.masterGain) {
            this.masterGain.gain.value = currentVolume / 100;
            this.isMuted = false;
        }
    },

    getSampleRate() {
        return this.audioContext ? this.audioContext.sampleRate : 44100;
    },

    getCurrentTime() {
        return this.audioContext ? this.audioContext.currentTime : 0;
    },

    getAudioLevel() {
        if (!this.analyser) return 0;
        
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteTimeDomainData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            const v = (dataArray[i] - 128) / 128;
            sum += v * v;
        }
        
        return Math.sqrt(sum / bufferLength);
    },

    createOscillator(type, frequency) {
        if (!this.audioContext) return null;
        
        const osc = this.audioContext.createOscillator();
        osc.type = type;
        osc.frequency.value = frequency;
        return osc;
    },

    createGain(volume = 1) {
        if (!this.audioContext) return null;
        
        const gain = this.audioContext.createGain();
        gain.gain.value = volume;
        return gain;
    },

    createFilter(type, frequency, Q) {
        if (!this.audioContext) return null;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = type;
        filter.frequency.value = frequency;
        filter.Q.value = Q;
        return filter;
    },

    createDelay(time) {
        if (!this.audioContext) return null;
        
        const delay = this.audioContext.createDelay();
        delay.delayTime.value = time;
        return delay;
    },

    createWaveShaper() {
        if (!this.audioContext) return null;
        return this.audioContext.createWaveShaper();
    },

    createConvolver() {
        if (!this.audioContext) return null;
        return this.audioContext.createConvolver();
    },

    createNoiseBuffer(duration = 2) {
        if (!this.audioContext) return null;
        
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        return buffer;
    },

    createReverbImpulseResponse(duration = 2, decay = 2) {
        if (!this.audioContext) return null;
        
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const impulse = this.audioContext.createBuffer(2, length, sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
            }
        }
        
        return impulse;
    },

    createSineWave(frequency, duration, startTime) {
        if (!this.audioContext) return;
        
        const osc = this.createOscillator('sine', frequency);
        const gain = this.createGain();
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        const t0 = startTime;
        const t1 = t0 + duration * 0.1;
        const t2 = t0 + duration * 0.8;
        const t3 = t0 + duration;
        
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(0.5, t1);
        gain.gain.linearRampToValueAtTime(0.3, t2);
        gain.gain.linearRampToValueAtTime(0, t3);
        
        osc.start(t0);
        osc.stop(t3);
    },

    createKick(startTime, volume = 0.8) {
        if (!this.audioContext) return;
        
        const osc = this.createOscillator('sine', 150);
        const gain = this.createGain(0);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        const t = startTime;
        const duration = 0.3;
        
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(0.01, t + duration);
        
        gain.gain.setValueAtTime(volume, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + duration);
        
        osc.start(t);
        osc.stop(t + duration);
    },

    createSnare(startTime, volume = 0.6) {
        if (!this.audioContext) return;
        
        const noiseBuffer = this.createNoiseBuffer(0.2);
        const noise = this.audioContext.createBufferSource();
        noise.buffer = noiseBuffer;
        
        const noiseFilter = this.createFilter('highpass', 1000, 1);
        const noiseGain = this.createGain(0);
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        
        const osc = this.createOscillator('triangle', 200);
        const oscGain = this.createGain(0);
        
        osc.connect(oscGain);
        oscGain.connect(this.masterGain);
        
        const t = startTime;
        const duration = 0.2;
        
        noiseGain.gain.setValueAtTime(volume * 0.5, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, t + duration);
        
        oscGain.gain.setValueAtTime(volume * 0.3, t);
        oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        
        noise.start(t);
        noise.stop(t + duration);
        osc.start(t);
        osc.stop(t + 0.1);
    },

    createHiHat(startTime, volume = 0.3, closed = true) {
        if (!this.audioContext) return;
        
        const noiseBuffer = this.createNoiseBuffer(0.05);
        const noise = this.audioContext.createBufferSource();
        noise.buffer = noiseBuffer;
        
        const filter = this.createFilter('highpass', closed ? 7000 : 4000, 1);
        const gain = this.createGain(0);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        const t = startTime;
        const duration = closed ? 0.05 : 0.3;
        
        gain.gain.setValueAtTime(volume, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + duration);
        
        noise.start(t);
        noise.stop(t + duration);
    },

    createBass(startTime, frequency, volume = 0.7) {
        if (!this.audioContext) return;
        
        const osc1 = this.createOscillator('sawtooth', frequency);
        const osc2 = this.createOscillator('square', frequency * 2);
        
        const filter = this.createFilter('lowpass', 800, 2);
        const gain = this.createGain(0);
        
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        const t = startTime;
        const duration = 0.5;
        
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(volume, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(volume * 0.3, t + duration);
        
        filter.frequency.setValueAtTime(800, t);
        filter.frequency.exponentialRampToValueAtTime(400, t + 0.3);
        
        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + duration);
        osc2.stop(t + duration);
    },

    createChord(startTime, notes, duration, volume = 0.4) {
        if (!this.audioContext) return;
        
        notes.forEach((frequency, index) => {
            const osc = this.createOscillator('sine', frequency);
            const gain = this.createGain(0);
            const filter = this.createFilter('lowpass', 2000, 1);
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            
            const t = startTime + index * 0.02;
            const noteDuration = duration;
            
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(volume / notes.length, t + 0.05);
            gain.gain.linearRampToValueAtTime(volume / notes.length * 0.8, t + noteDuration * 0.8);
            gain.gain.linearRampToValueAtTime(0, t + noteDuration);
            
            osc.start(t);
            osc.stop(t + noteDuration);
        });
    },

    createLead(startTime, frequency, duration, volume = 0.5) {
        if (!this.audioContext) return;
        
        const osc = this.createOscillator('square', frequency);
        const subOsc = this.createOscillator('sine', frequency / 2);
        
        const filter = this.createFilter('lowpass', 3000, 3);
        const gain = this.createGain(0);
        
        osc.connect(filter);
        subOsc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        const t = startTime;
        
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(volume, t + 0.02);
        gain.gain.linearRampToValueAtTime(volume * 0.9, t + duration * 0.7);
        gain.gain.linearRampToValueAtTime(0, t + duration);
        
        filter.frequency.setValueAtTime(3000, t);
        filter.frequency.linearRampToValueAtTime(2500, t + duration * 0.5);
        filter.frequency.linearRampToValueAtTime(3000, t + duration);
        
        osc.start(t);
        subOsc.start(t);
        osc.stop(t + duration);
        subOsc.stop(t + duration);
    },

    createPad(startTime, notes, duration, volume = 0.3) {
        if (!this.audioContext) return;
        
        notes.forEach((frequency, index) => {
            const osc1 = this.createOscillator('sine', frequency);
            const osc2 = this.createOscillator('sine', frequency * 1.005);
            
            const gain = this.createGain(0);
            const filter = this.createFilter('lowpass', 1500, 1);
            
            osc1.connect(filter);
            osc2.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            
            const t = startTime + index * 0.05;
            
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(volume / notes.length, t + 1);
            gain.gain.linearRampToValueAtTime(volume / notes.length, t + duration - 1);
            gain.gain.linearRampToValueAtTime(0, t + duration);
            
            osc1.start(t);
            osc2.start(t);
            osc1.stop(t + duration);
            osc2.stop(t + duration);
        });
    },

    createFX(startTime, type, volume = 0.4) {
        if (!this.audioContext) return;
        
        const t = startTime;
        
        switch (type) {
            case 'riser':
                const riserOsc = this.createOscillator('sawtooth', 100);
                const riserFilter = this.createFilter('lowpass', 500, 5);
                const riserGain = this.createGain(0);
                
                riserOsc.connect(riserFilter);
                riserFilter.connect(riserGain);
                riserGain.connect(this.masterGain);
                
                riserOsc.frequency.setValueAtTime(100, t);
                riserOsc.frequency.exponentialRampToValueAtTime(2000, t + 2);
                
                riserFilter.frequency.setValueAtTime(500, t);
                riserFilter.frequency.exponentialRampToValueAtTime(8000, t + 2);
                
                riserGain.gain.setValueAtTime(0, t);
                riserGain.gain.linearRampToValueAtTime(volume, t + 1.5);
                riserGain.gain.linearRampToValueAtTime(0, t + 2);
                
                riserOsc.start(t);
                riserOsc.stop(t + 2);
                break;
                
            case 'impact':
                const impactOsc = this.createOscillator('sine', 80);
                const impactGain = this.createGain(0);
                
                impactOsc.connect(impactGain);
                impactGain.connect(this.masterGain);
                
                impactOsc.frequency.setValueAtTime(80, t);
                impactOsc.frequency.exponentialRampToValueAtTime(20, t + 0.5);
                
                impactGain.gain.setValueAtTime(volume, t);
                impactGain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
                
                impactOsc.start(t);
                impactOsc.stop(t + 0.5);
                break;
                
            case 'white_noise':
                const noiseBuffer = this.createNoiseBuffer(1);
                const noise = this.audioContext.createBufferSource();
                noise.buffer = noiseBuffer;
                
                const noiseGain = this.createGain(0);
                
                noise.connect(noiseGain);
                noiseGain.connect(this.masterGain);
                
                noiseGain.gain.setValueAtTime(volume * 0.3, t);
                noiseGain.gain.linearRampToValueAtTime(0, t + 1);
                
                noise.start(t);
                noise.stop(t + 1);
                break;
        }
    }
};
