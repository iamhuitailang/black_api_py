const AudioManager = {
    audioContext: null,
    soundEnabled: true,
    masterGain: null,
    currentCatType: 'lihua',

    CAT_TYPES: {
        lihua: {
            name: '狸花猫',
            description: '中华田园猫，声音活泼明亮',
            baseFreqMultiplier: 1.0,
            volumeMultiplier: 1.0,
            vibratoAmount: 1.0,
            formantShift: 0,
            purrFreq: 25,
            attackTime: 1.0,
            releaseTime: 1.0
        },
        siamese: {
            name: '暹罗猫',
            description: '话痨猫，声音高亢多话',
            baseFreqMultiplier: 1.3,
            volumeMultiplier: 1.15,
            vibratoAmount: 1.5,
            formantShift: 200,
            purrFreq: 30,
            attackTime: 0.8,
            releaseTime: 1.3
        },
        persian: {
            name: '波斯猫',
            description: '优雅安静，声音低沉柔和',
            baseFreqMultiplier: 0.75,
            volumeMultiplier: 0.85,
            vibratoAmount: 0.6,
            formantShift: -200,
            purrFreq: 20,
            attackTime: 1.2,
            releaseTime: 0.8
        }
    },

    init() {
        this.updateSettings();
        const settings = Storage.getSettings();
        this.currentCatType = settings.catType || 'lihua';
    },

    updateSettings() {
        const settings = Storage.getSettings();
        this.soundEnabled = settings.soundEnabled !== false;
        this.currentCatType = settings.catType || 'lihua';
    },

    toggle() {
        this.soundEnabled = !this.soundEnabled;
        Storage.setSettings({ soundEnabled: this.soundEnabled });
        return this.soundEnabled;
    },

    setCatType(catType) {
        if (this.CAT_TYPES[catType]) {
            this.currentCatType = catType;
            Storage.setSettings({ catType: catType });
            return true;
        }
        return false;
    },

    getCurrentCatType() {
        return this.currentCatType;
    },

    getCatTypeInfo(catType) {
        return this.CAT_TYPES[catType] || this.CAT_TYPES.lihua;
    },

    isEnabled() {
        return this.soundEnabled;
    },

    ensureAudioContext() {
        if (!this.audioContext) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.3;
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    },

    applyCatModifications(baseOptions) {
        const catInfo = this.getCatTypeInfo(this.currentCatType);
        
        return {
            ...baseOptions,
            baseFreq: baseOptions.baseFreq * catInfo.baseFreqMultiplier,
            peakFreq: baseOptions.peakFreq * catInfo.baseFreqMultiplier,
            endFreq: baseOptions.endFreq * catInfo.baseFreqMultiplier,
            volume: baseOptions.volume * catInfo.volumeMultiplier,
            vibratoAmount: baseOptions.vibratoAmount * catInfo.vibratoAmount,
            formantFreq: (baseOptions.formantFreq || 1000) + catInfo.formantShift,
            riseTime: baseOptions.riseTime * catInfo.attackTime,
            fallTime: baseOptions.fallTime * catInfo.releaseTime
        };
    },

    createMeowSound(options) {
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        const modifiedOptions = this.applyCatModifications(options);
        
        const {
            baseFreq = 800,
            peakFreq = 1200,
            endFreq = 600,
            riseTime = 0.08,
            peakTime = 0.05,
            fallTime = 0.2,
            volume = 0.3,
            vibratoAmount = 30,
            vibratoRate = 12,
            formantFreq = 1000,
            breathAmount = 0.1
        } = modifiedOptions;
        
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const osc3 = ctx.createOscillator();
        const osc4 = ctx.createOscillator();
        
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();
        const gain3 = ctx.createGain();
        const gain4 = ctx.createGain();
        
        const filter1 = ctx.createBiquadFilter();
        const filter2 = ctx.createBiquadFilter();
        const mainGain = ctx.createGain();
        
        filter1.type = 'bandpass';
        filter1.Q.value = 5;
        
        filter2.type = 'lowpass';
        filter2.Q.value = 1;
        filter2.frequency.value = 5000;
        
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc3.type = 'sine';
        osc4.type = 'triangle';
        
        osc1.frequency.setValueAtTime(baseFreq * 1.0, now);
        osc2.frequency.setValueAtTime(baseFreq * 2.0, now);
        osc3.frequency.setValueAtTime(baseFreq * 3.5, now);
        osc4.frequency.setValueAtTime(baseFreq * 0.5, now);
        
        osc1.frequency.linearRampToValueAtTime(peakFreq * 1.0, now + riseTime);
        osc2.frequency.linearRampToValueAtTime(peakFreq * 2.0, now + riseTime);
        osc3.frequency.linearRampToValueAtTime(peakFreq * 3.5, now + riseTime);
        osc4.frequency.linearRampToValueAtTime(peakFreq * 0.5, now + riseTime);
        
        osc1.frequency.setValueAtTime(peakFreq * 1.0, now + riseTime + peakTime);
        osc2.frequency.setValueAtTime(peakFreq * 2.0, now + riseTime + peakTime);
        osc3.frequency.setValueAtTime(peakFreq * 3.5, now + riseTime + peakTime);
        osc4.frequency.setValueAtTime(peakFreq * 0.5, now + riseTime + peakTime);
        
        osc1.frequency.exponentialRampToValueAtTime(endFreq * 1.0, now + riseTime + peakTime + fallTime);
        osc2.frequency.exponentialRampToValueAtTime(endFreq * 2.0, now + riseTime + peakTime + fallTime);
        osc3.frequency.exponentialRampToValueAtTime(endFreq * 3.5, now + riseTime + peakTime + fallTime);
        osc4.frequency.exponentialRampToValueAtTime(endFreq * 0.5, now + riseTime + peakTime + fallTime);
        
        if (vibratoAmount > 0) {
            const vibrato = ctx.createOscillator();
            const vibratoGain = ctx.createGain();
            
            vibrato.frequency.value = vibratoRate;
            vibratoGain.gain.value = vibratoAmount;
            
            vibrato.connect(vibratoGain);
            vibratoGain.connect(osc1.frequency);
            vibratoGain.connect(osc2.frequency);
            
            vibrato.start(now + riseTime * 0.5);
            vibrato.stop(now + riseTime + peakTime + fallTime + 0.1);
        }
        
        filter1.frequency.setValueAtTime(formantFreq, now);
        filter1.frequency.linearRampToValueAtTime(formantFreq * 1.15, now + riseTime);
        filter1.frequency.linearRampToValueAtTime(formantFreq * 0.85, now + riseTime + peakTime + fallTime);
        
        gain1.gain.value = 1.0;
        gain2.gain.value = 0.35;
        gain3.gain.value = 0.15;
        gain4.gain.value = 0.2;
        
        mainGain.gain.setValueAtTime(0, now);
        mainGain.gain.linearRampToValueAtTime(volume, now + riseTime * 0.3);
        mainGain.gain.setValueAtTime(volume * 1.0, now + riseTime + peakTime);
        mainGain.gain.exponentialRampToValueAtTime(0.001, now + riseTime + peakTime + fallTime);
        
        osc1.connect(gain1);
        osc2.connect(gain2);
        osc3.connect(gain3);
        osc4.connect(gain4);
        
        gain1.connect(filter1);
        gain2.connect(filter1);
        gain3.connect(filter1);
        gain4.connect(filter1);
        
        filter1.connect(filter2);
        filter2.connect(mainGain);
        mainGain.connect(this.masterGain);
        
        const totalTime = riseTime + peakTime + fallTime + 0.1;
        
        osc1.start(now);
        osc2.start(now);
        osc3.start(now);
        osc4.start(now);
        
        osc1.stop(now + totalTime);
        osc2.stop(now + totalTime);
        osc3.stop(now + totalTime);
        osc4.stop(now + totalTime);
        
        return {
            stop: () => {
                mainGain.gain.cancelScheduledValues(now);
                mainGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            }
        };
    },

    createPurrSound(duration = 2) {
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        const catInfo = this.getCatTypeInfo(this.currentCatType);
        
        const purrFreq = catInfo.purrFreq;
        const volume = 0.25 * catInfo.volumeMultiplier;
        
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const modulator = ctx.createOscillator();
        const modGain = ctx.createGain();
        
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();
        const mainGain = ctx.createGain();
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 350;
        
        osc1.type = 'triangle';
        osc2.type = 'sine';
        modulator.type = 'sine';
        
        osc1.frequency.value = purrFreq;
        osc2.frequency.value = purrFreq * 2;
        modulator.frequency.value = purrFreq * 0.9;
        
        modGain.gain.value = 8;
        
        modulator.connect(modGain);
        modGain.connect(osc1.frequency);
        modGain.connect(osc2.frequency);
        
        gain1.gain.value = 0.8;
        gain2.gain.value = 0.4;
        
        mainGain.gain.setValueAtTime(0, now);
        mainGain.gain.linearRampToValueAtTime(volume, now + 0.2);
        mainGain.gain.setValueAtTime(volume, now + duration - 0.3);
        mainGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        osc1.connect(gain1);
        osc2.connect(gain2);
        gain1.connect(filter);
        gain2.connect(filter);
        filter.connect(mainGain);
        mainGain.connect(this.masterGain);
        
        osc1.start(now);
        osc2.start(now);
        modulator.start(now);
        
        osc1.stop(now + duration);
        osc2.stop(now + duration);
        modulator.stop(now + duration);
    },

    createHissSound() {
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        const catInfo = this.getCatTypeInfo(this.currentCatType);
        
        const baseFreq = 2000 + catInfo.formantShift;
        const volume = 0.15 * catInfo.volumeMultiplier;
        
        const bufferSize = ctx.sampleRate * 0.5;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.5;
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        
        const filter1 = ctx.createBiquadFilter();
        filter1.type = 'highpass';
        filter1.frequency.value = baseFreq;
        filter1.Q.value = 5;
        
        const filter2 = ctx.createBiquadFilter();
        filter2.type = 'bandpass';
        filter2.frequency.value = baseFreq + 500;
        filter2.Q.value = 3;
        
        const mainGain = ctx.createGain();
        mainGain.gain.setValueAtTime(0, now);
        mainGain.gain.linearRampToValueAtTime(volume, now + 0.05);
        mainGain.gain.setValueAtTime(volume, now + 0.3);
        mainGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        
        noise.connect(filter1);
        filter1.connect(filter2);
        filter2.connect(mainGain);
        mainGain.connect(this.masterGain);
        
        noise.start(now);
        noise.stop(now + 0.65);
    },

    playMeow(type = 'normal') {
        if (!this.soundEnabled) return;
        
        this.ensureAudioContext();
        
        const catInfo = this.getCatTypeInfo(this.currentCatType);
        
        const options = {
            short: {
                baseFreq: 650,
                peakFreq: 950,
                endFreq: 500,
                riseTime: 0.06,
                peakTime: 0.03,
                fallTime: 0.15,
                volume: 0.28,
                vibratoAmount: 15,
                vibratoRate: 10,
                formantFreq: 1100
            },
            long: {
                baseFreq: 550,
                peakFreq: 800,
                endFreq: 450,
                riseTime: 0.12,
                peakTime: 0.08,
                fallTime: 0.35,
                volume: 0.25,
                vibratoAmount: 25,
                vibratoRate: 8,
                formantFreq: 900
            },
            low: {
                baseFreq: 350,
                peakFreq: 450,
                endFreq: 280,
                riseTime: 0.08,
                peakTime: 0.05,
                fallTime: 0.25,
                volume: 0.22,
                vibratoAmount: 10,
                vibratoRate: 6,
                formantFreq: 600
            },
            fast: {
                baseFreq: 800,
                peakFreq: 1100,
                endFreq: 600,
                riseTime: 0.04,
                peakTime: 0.02,
                fallTime: 0.1,
                volume: 0.3,
                vibratoAmount: 20,
                vibratoRate: 15,
                formantFreq: 1300
            },
            high: {
                baseFreq: 1000,
                peakFreq: 1400,
                endFreq: 800,
                riseTime: 0.05,
                peakTime: 0.03,
                fallTime: 0.12,
                volume: 0.25,
                vibratoAmount: 30,
                vibratoRate: 18,
                formantFreq: 1600
            },
            normal: {
                baseFreq: 600,
                peakFreq: 850,
                endFreq: 500,
                riseTime: 0.08,
                peakTime: 0.04,
                fallTime: 0.2,
                volume: 0.25,
                vibratoAmount: 20,
                vibratoRate: 10,
                formantFreq: 1000
            }
        };

        if (type === 'purr') {
            this.createPurrSound(2);
            return;
        }
        
        if (type === 'hiss') {
            this.createHissSound();
            return;
        }

        const soundOptions = options[type] || options.normal;
        this.createMeowSound(soundOptions);
    },

    playClick() {
        if (!this.soundEnabled) return;
        
        this.ensureAudioContext();
        const ctx = this.audioContext;
        
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        const now = ctx.currentTime;
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, now);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        
        oscillator.start(now);
        oscillator.stop(now + 0.1);
    },

    playSuccess() {
        if (!this.soundEnabled) return;
        
        this.ensureAudioContext();
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        const notes = [523, 659, 784];
        
        notes.forEach((freq, i) => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, now + i * 0.1);
            gainNode.gain.setValueAtTime(0.15, now + i * 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.15);
            
            oscillator.start(now + i * 0.1);
            oscillator.stop(now + i * 0.1 + 0.2);
        });
    },

    playHeart() {
        if (!this.soundEnabled) return;
        
        this.ensureAudioContext();
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();
        
        osc1.type = 'sine';
        osc2.type = 'sine';
        
        osc1.frequency.setValueAtTime(523, now);
        osc1.frequency.linearRampToValueAtTime(659, now + 0.15);
        osc1.frequency.linearRampToValueAtTime(784, now + 0.3);
        
        osc2.frequency.setValueAtTime(659, now + 0.1);
        osc2.frequency.linearRampToValueAtTime(784, now + 0.25);
        osc2.frequency.linearRampToValueAtTime(1047, now + 0.4);
        
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.15, now + 0.05);
        gain1.gain.setValueAtTime(0.15, now + 0.35);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        
        gain2.gain.setValueAtTime(0, now + 0.1);
        gain2.gain.linearRampToValueAtTime(0.12, now + 0.15);
        gain2.gain.setValueAtTime(0.12, now + 0.4);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        
        osc1.connect(gain1);
        osc2.connect(gain2);
        gain1.connect(this.masterGain);
        gain2.connect(this.masterGain);
        
        osc1.start(now);
        osc2.start(now + 0.1);
        osc1.stop(now + 0.55);
        osc2.stop(now + 0.65);
    },

    playSneeze() {
        if (!this.soundEnabled) return;
        
        this.ensureAudioContext();
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        const catInfo = this.getCatTypeInfo(this.currentCatType);
        
        const volume = 0.15 * catInfo.volumeMultiplier;
        
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.5;
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        
        const filter1 = ctx.createBiquadFilter();
        filter1.type = 'bandpass';
        filter1.frequency.setValueAtTime(1000, now);
        filter1.frequency.linearRampToValueAtTime(2000, now + 0.1);
        filter1.Q.value = 3;
        
        const filter2 = ctx.createBiquadFilter();
        filter2.type = 'highpass';
        filter2.frequency.value = 800;
        
        const mainGain = ctx.createGain();
        mainGain.gain.setValueAtTime(0, now);
        mainGain.gain.linearRampToValueAtTime(volume, now + 0.05);
        mainGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        
        noise.connect(filter1);
        filter1.connect(filter2);
        filter2.connect(mainGain);
        mainGain.connect(this.masterGain);
        
        noise.start(now);
        noise.stop(now + 0.3);
        
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300 * catInfo.baseFreqMultiplier, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(100 * catInfo.baseFreqMultiplier, now + 0.3);
        
        oscGain.gain.setValueAtTime(0, now + 0.1);
        oscGain.gain.linearRampToValueAtTime(volume * 0.6, now + 0.15);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        
        osc.connect(oscGain);
        oscGain.connect(this.masterGain);
        
        osc.start(now + 0.1);
        osc.stop(now + 0.4);
    }
};
