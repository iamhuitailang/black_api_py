class PianoAudio {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.sustainGain = null;
        this.volume = 0.7;
        this.sustainActive = false;
        this.activeOscillators = new Map();
        this.sustainedOscillators = new Set();
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = this.volume;
        this.masterGain.connect(this.audioContext.destination);
        
        this.sustainGain = this.audioContext.createGain();
        this.sustainGain.gain.value = 1;
        this.sustainGain.connect(this.masterGain);
        
        this.initialized = true;
    }

    setVolume(value) {
        this.volume = value / 100;
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
    }

    setSustain(active) {
        this.sustainActive = active;
        
        if (!active && this.sustainedOscillators.size > 0) {
            this.sustainedOscillators.forEach(note => {
                this.stopNote(note, true);
            });
            this.sustainedOscillators.clear();
        }
    }

    getFrequency(noteNumber) {
        return 440 * Math.pow(2, (noteNumber - 69) / 12);
    }

    playNote(noteNumber) {
        if (!this.initialized) {
            this.init();
        }
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        if (this.activeOscillators.has(noteNumber)) {
            return;
        }
        
        const freq = this.getFrequency(noteNumber);
        const now = this.audioContext.currentTime;
        
        const oscillators = [];
        const gains = [];
        
        const osc1 = this.audioContext.createOscillator();
        const gain1 = this.audioContext.createGain();
        osc1.type = 'sine';
        osc1.frequency.value = freq;
        gain1.gain.value = 0.6;
        oscillators.push(osc1);
        gains.push(gain1);
        
        const osc2 = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();
        osc2.type = 'sine';
        osc2.frequency.value = freq * 2;
        gain2.gain.value = 0.3;
        oscillators.push(osc2);
        gains.push(gain2);
        
        const osc3 = this.audioContext.createOscillator();
        const gain3 = this.audioContext.createGain();
        osc3.type = 'sine';
        osc3.frequency.value = freq * 3;
        gain3.gain.value = 0.15;
        oscillators.push(osc3);
        gains.push(gain3);
        
        const osc4 = this.audioContext.createOscillator();
        const gain4 = this.audioContext.createGain();
        osc4.type = 'sine';
        osc4.frequency.value = freq * 4;
        gain4.gain.value = 0.1;
        oscillators.push(osc4);
        gains.push(gain4);
        
        const osc5 = this.audioContext.createOscillator();
        const gain5 = this.audioContext.createGain();
        osc5.type = 'triangle';
        osc5.frequency.value = freq * 0.5;
        gain5.gain.value = 0.2;
        oscillators.push(osc5);
        gains.push(gain5);
        
        const mainGain = this.audioContext.createGain();
        mainGain.gain.setValueAtTime(0, now);
        mainGain.gain.linearRampToValueAtTime(1, now + 0.02);
        mainGain.gain.exponentialRampToValueAtTime(0.6, now + 0.1);
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = Math.min(4000, freq * 6);
        filter.Q.value = 1;
        
        for (let i = 0; i < oscillators.length; i++) {
            oscillators[i].connect(gains[i]);
            gains[i].connect(filter);
        }
        
        filter.connect(mainGain);
        mainGain.connect(this.sustainGain);
        
        this.activeOscillators.set(noteNumber, {
            oscillators,
            mainGain,
            startTime: now
        });
        
        oscillators.forEach(osc => osc.start(now));
        
        return noteNumber;
    }

    stopNote(noteNumber, force = false) {
        const noteData = this.activeOscillators.get(noteNumber);
        if (!noteData) return;
        
        const { oscillators, mainGain } = noteData;
        const now = this.audioContext.currentTime;
        
        mainGain.gain.cancelScheduledValues(now);
        
        const currentGain = mainGain.gain.value;
        mainGain.gain.setValueAtTime(currentGain, now);
        
        const releaseTime = this.sustainActive ? 4.0 : (force ? 0.5 : 1.5);
        mainGain.gain.exponentialRampToValueAtTime(0.001, now + releaseTime);
        
        oscillators.forEach(osc => {
            try {
                osc.stop(now + releaseTime);
            } catch (e) {}
        });
        
        this.activeOscillators.delete(noteNumber);
        this.sustainedOscillators.delete(noteNumber);
    }

    playClickSound(isBeat) {
        if (!this.initialized) {
            this.init();
        }
        
        const now = this.audioContext.currentTime;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = isBeat ? 'square' : 'sine';
        osc.frequency.value = isBeat ? 1000 : 800;
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + 0.15);
    }
}

window.PianoAudio = PianoAudio;
