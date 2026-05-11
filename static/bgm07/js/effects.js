const Effects = {
    eq: {
        lowFilter: null,
        midFilter: null,
        highFilter: null,
        values: { low: 0, mid: 0, high: 0 }
    },
    
    reverb: {
        convolver: null,
        dryGain: null,
        wetGain: null,
        values: { roomSize: 1.0, mix: 30 }
    },
    
    delay: {
        delayNode: null,
        feedback: null,
        dryGain: null,
        wetGain: null,
        values: { time: 0.3, feedback: 40, mix: 20 }
    },
    
    filter: {
        biquadFilter: null,
        values: { type: 'lowpass', cutoff: 5000, resonance: 1.0 }
    },
    
    distortion: {
        waveShaper: null,
        values: { gain: 0, amount: 0 }
    },
    
    isInitialized: false,

    init(audioContext, masterGain) {
        console.log('🎛️ 初始化效果器...');
        
        try {
            this.eq.lowFilter = audioContext.createBiquadFilter();
            this.eq.lowFilter.type = 'lowshelf';
            this.eq.lowFilter.frequency.value = 200;
            this.eq.lowFilter.gain.value = this.eq.values.low;

            this.eq.midFilter = audioContext.createBiquadFilter();
            this.eq.midFilter.type = 'peaking';
            this.eq.midFilter.frequency.value = 1000;
            this.eq.midFilter.Q.value = 1;
            this.eq.midFilter.gain.value = this.eq.values.mid;

            this.eq.highFilter = audioContext.createBiquadFilter();
            this.eq.highFilter.type = 'highshelf';
            this.eq.highFilter.frequency.value = 4000;
            this.eq.highFilter.gain.value = this.eq.values.high;

            this.reverb.convolver = audioContext.createConvolver();
            this.reverb.dryGain = audioContext.createGain();
            this.reverb.wetGain = audioContext.createGain();
            
            const reverbMix = this.reverb.values.mix / 100;
            this.reverb.dryGain.gain.value = 1 - reverbMix;
            this.reverb.wetGain.gain.value = reverbMix;

            this.updateReverbImpulse(audioContext, this.reverb.values.roomSize);

            this.delay.delayNode = audioContext.createDelay();
            this.delay.delayNode.delayTime.value = this.delay.values.time;
            
            this.delay.feedback = audioContext.createGain();
            this.delay.feedback.gain.value = this.delay.values.feedback / 100;
            
            this.delay.dryGain = audioContext.createGain();
            this.delay.wetGain = audioContext.createGain();
            
            const delayMix = this.delay.values.mix / 100;
            this.delay.dryGain.gain.value = 1 - delayMix;
            this.delay.wetGain.gain.value = delayMix;

            this.delay.delayNode.connect(this.delay.feedback);
            this.delay.feedback.connect(this.delay.delayNode);

            this.filter.biquadFilter = audioContext.createBiquadFilter();
            this.filter.biquadFilter.type = this.filter.values.type;
            this.filter.biquadFilter.frequency.value = this.filter.values.cutoff;
            this.filter.biquadFilter.Q.value = this.filter.values.resonance;

            this.distortion.waveShaper = audioContext.createWaveShaper();
            this.distortion.waveShaper.curve = this.createDistortionCurve(this.distortion.values.amount / 100);
            this.distortion.waveShaper.oversample = '4x';

            this.connectChain(masterGain);

            this.isInitialized = true;
            console.log('✅ 效果器模块初始化成功');
        } catch (error) {
            console.error('❌ 效果器初始化失败:', error);
        }
    },

    connectChain(masterGain) {
        this.eq.lowFilter.connect(this.eq.midFilter);
        this.eq.midFilter.connect(this.eq.highFilter);
        
        this.eq.highFilter.connect(this.reverb.dryGain);
        this.eq.highFilter.connect(this.reverb.convolver);
        
        this.reverb.convolver.connect(this.reverb.wetGain);
        
        this.reverb.dryGain.connect(this.delay.dryGain);
        this.reverb.wetGain.connect(this.delay.dryGain);
        
        this.reverb.dryGain.connect(this.delay.delayNode);
        this.reverb.wetGain.connect(this.delay.delayNode);
        
        this.delay.delayNode.connect(this.delay.wetGain);
        
        this.delay.dryGain.connect(this.filter.biquadFilter);
        this.delay.wetGain.connect(this.filter.biquadFilter);
        
        this.filter.biquadFilter.connect(this.distortion.waveShaper);
        this.distortion.waveShaper.connect(masterGain);
    },

    getInputNode() {
        return this.eq.lowFilter;
    },

    setEQ(low, mid, high) {
        this.eq.values = { low, mid, high };
        
        if (this.eq.lowFilter) {
            this.eq.lowFilter.gain.value = low;
        }
        if (this.eq.midFilter) {
            this.eq.midFilter.gain.value = mid;
        }
        if (this.eq.highFilter) {
            this.eq.highFilter.gain.value = high;
        }
    },

    updateReverbImpulse(audioContext, roomSize) {
        if (!audioContext) return;

        const sampleRate = audioContext.sampleRate;
        const length = sampleRate * roomSize;
        const impulse = audioContext.createBuffer(2, length, sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
            }
        }

        if (this.reverb.convolver) {
            this.reverb.convolver.buffer = impulse;
        }
    },

    setReverb(roomSize, mix) {
        this.reverb.values = { roomSize, mix };
        
        const mixValue = mix / 100;
        
        if (this.reverb.dryGain) {
            this.reverb.dryGain.gain.value = 1 - mixValue;
        }
        if (this.reverb.wetGain) {
            this.reverb.wetGain.gain.value = mixValue;
        }
    },

    setDelay(time, feedback, mix) {
        this.delay.values = { time, feedback, mix };
        
        if (this.delay.delayNode) {
            this.delay.delayNode.delayTime.value = time;
        }
        if (this.delay.feedback) {
            this.delay.feedback.gain.value = feedback / 100;
        }
        
        const mixValue = mix / 100;
        if (this.delay.dryGain) {
            this.delay.dryGain.gain.value = 1 - mixValue;
        }
        if (this.delay.wetGain) {
            this.delay.wetGain.gain.value = mixValue;
        }
    },

    setFilter(type, cutoff, resonance) {
        this.filter.values = { type, cutoff, resonance };
        
        if (this.filter.biquadFilter) {
            this.filter.biquadFilter.type = type;
            this.filter.biquadFilter.frequency.value = cutoff;
            this.filter.biquadFilter.Q.value = resonance;
        }
    },

    createDistortionCurve(amount) {
        const k = amount * 50;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;

        for (let i = 0; i < n_samples; i++) {
            const x = (i * 2) / n_samples - 1;
            curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
        }

        return curve;
    },

    setDistortion(gain, amount) {
        this.distortion.values = { gain, amount };
        
        if (this.distortion.waveShaper && amount > 0) {
            this.distortion.waveShaper.curve = this.createDistortionCurve(amount / 100);
        } else if (this.distortion.waveShaper) {
            this.distortion.waveShaper.curve = this.createDistortionCurve(0);
        }
    },

    getEffectsState() {
        return {
            eq: { ...this.eq.values },
            reverb: { ...this.reverb.values },
            delay: { ...this.delay.values },
            filter: { ...this.filter.values },
            distortion: { ...this.distortion.values }
        };
    },

    applyEffectsState(effectsState) {
        if (effectsState.eq) {
            this.setEQ(effectsState.eq.low, effectsState.eq.mid, effectsState.eq.high);
        }
        if (effectsState.reverb) {
            this.setReverb(effectsState.reverb.roomSize, effectsState.reverb.mix);
        }
        if (effectsState.delay) {
            this.setDelay(effectsState.delay.time, effectsState.delay.feedback, effectsState.delay.mix);
        }
        if (effectsState.filter) {
            this.setFilter(
                effectsState.filter.type,
                effectsState.filter.cutoff,
                effectsState.filter.resonance
            );
        }
        if (effectsState.distortion) {
            this.setDistortion(effectsState.distortion.gain, effectsState.distortion.amount);
        }
    }
};
