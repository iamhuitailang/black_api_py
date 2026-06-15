class RhythmAudio {
    constructor() {
        this.audioContext = null;
        this.bpm = 120;
        this.isPlaying = false;
        this.startTime = 0;
        this.nextNoteTime = 0;
        this.currentBeat = 0;
        this.schedulerTimer = null;
        this.lookahead = 25.0;
        this.scheduleAheadTime = 0.1;
        this.beatCallback = null;
        this.totalBeats = 0;
        this.duration = 180;
        this.masterGain = null;
    }

    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.5;
            this.masterGain.connect(this.audioContext.destination);
        }
    }

    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    setBpm(bpm) {
        this.bpm = bpm;
    }

    setDuration(seconds) {
        this.duration = seconds;
        this.totalBeats = Math.floor((this.bpm / 60) * this.duration);
    }

    getBeatTime() {
        if (!this.isPlaying) return 0;
        const elapsed = this.audioContext.currentTime - this.startTime;
        return (elapsed * this.bpm) / 60;
    }

    getTotalBeats() {
        return this.totalBeats;
    }

    start() {
        if (!this.audioContext) {
            this.init();
        }
        this.resume();

        this.isPlaying = true;
        this.currentBeat = 0;
        this.startTime = this.audioContext.currentTime + 0.1;
        this.nextNoteTime = this.startTime;
        this.totalBeats = Math.floor((this.bpm / 60) * this.duration);

        this.scheduler();
    }

    startFromBeat(beat) {
        if (!this.audioContext) {
            this.init();
        }
        this.resume();

        this.isPlaying = true;
        this.totalBeats = Math.floor((this.bpm / 60) * this.duration);

        const secondsPerBeat = 60.0 / this.bpm;
        const startOffset = beat * secondsPerBeat;
        this.startTime = this.audioContext.currentTime - startOffset;
        this.currentBeat = Math.floor(beat);
        this.nextNoteTime = this.startTime + this.currentBeat * secondsPerBeat;

        while (this.nextNoteTime < this.audioContext.currentTime) {
            this.nextNote();
        }

        this.scheduler();
    }

    stop() {
        this.isPlaying = false;
        if (this.schedulerTimer) {
            clearTimeout(this.schedulerTimer);
            this.schedulerTimer = null;
        }
    }

    scheduler() {
        if (!this.isPlaying) return;

        while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
            this.scheduleNote(this.currentBeat, this.nextNoteTime);
            this.nextNote();
        }

        this.schedulerTimer = setTimeout(() => this.scheduler(), this.lookahead);
    }

    nextNote() {
        const secondsPerBeat = 60.0 / this.bpm;
        this.nextNoteTime += secondsPerBeat;
        this.currentBeat++;
    }

    scheduleNote(beatNumber, time) {
        if (beatNumber >= this.totalBeats) return;

        const beatInBar = beatNumber % 4;

        this.playKick(time, beatInBar === 0 ? 1.0 : 0.8);

        if (beatInBar === 2) {
            this.playSnare(time, 0.6);
        }

        this.playBass(time, beatNumber);

        if (this.beatCallback) {
            this.beatCallback(beatNumber, time);
        }
    }

    playKick(time, volume = 1.0) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);

        gain.gain.setValueAtTime(volume * 0.8, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

        osc.start(time);
        osc.stop(time + 0.5);
    }

    playSnare(time, volume = 1.0) {
        const noiseBuffer = this.createNoiseBuffer();
        const noise = this.audioContext.createBufferSource();
        noise.buffer = noiseBuffer;

        const noiseGain = this.audioContext.createGain();
        const noiseFilter = this.audioContext.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 1000;

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);

        noiseGain.gain.setValueAtTime(volume * 0.5, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

        noise.start(time);
        noise.stop(time + 0.2);

        const osc = this.audioContext.createOscillator();
        const oscGain = this.audioContext.createGain();
        osc.type = 'triangle';

        osc.connect(oscGain);
        oscGain.connect(this.masterGain);

        osc.frequency.setValueAtTime(250, time);
        oscGain.gain.setValueAtTime(volume * 0.3, time);
        oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

        osc.start(time);
        osc.stop(time + 0.15);
    }

    playBass(time, beatNumber) {
        const notes = [55, 55, 62, 55, 49, 49, 55, 49];
        const noteIndex = beatNumber % notes.length;
        const freq = notes[noteIndex];

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sawtooth';
        osc.connect(gain);
        gain.connect(this.masterGain);

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 300;
        osc.disconnect();
        osc.connect(filter);
        filter.connect(gain);

        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

        osc.start(time);
        osc.stop(time + 0.3);
    }

    createNoiseBuffer() {
        const bufferSize = this.audioContext.sampleRate * 0.2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    setVolume(value) {
        if (this.masterGain) {
            this.masterGain.gain.value = value;
        }
    }

    onBeat(callback) {
        this.beatCallback = callback;
    }

    getCurrentBeat() {
        return this.currentBeat;
    }

    getProgress() {
        if (this.totalBeats === 0) return 0;
        return Math.min(this.getBeatTime() / this.totalBeats, 1);
    }
}
