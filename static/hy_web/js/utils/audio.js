class OceanAudioEngine {
    constructor() {
        this.audioCtx = null;
        this.isPlaying = false;
        this.currentTrack = null;
        this.masterGain = null;
        this.scheduledNodes = [];
        this.loopInterval = null;
    }

    init() {
        if (this.audioCtx) return;
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.value = 0.3;
        this.masterGain.connect(this.audioCtx.destination);
    }

    playTrack(trackConfig) {
        this.stop();
        this.init();
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        this.currentTrack = trackConfig;
        this.isPlaying = true;
        this._scheduleLoop(trackConfig);
    }

    _scheduleLoop(trackConfig) {
        const bpm = trackConfig.bpm || 80;
        const beatDuration = 60 / bpm;
        const pattern = this._getPattern(trackConfig.mood);
        const barLength = beatDuration * pattern.beats;

        const scheduleBar = () => {
            if (!this.isPlaying) return;
            const now = this.audioCtx.currentTime;
            pattern.notes.forEach(note => {
                if (note.freq > 0) {
                    this._playNote(note.freq, now + note.time * beatDuration, note.duration * beatDuration, note.type || 'sine', note.gain || 0.15);
                }
            });
        };

        scheduleBar();
        this.loopInterval = setInterval(() => {
            if (this.isPlaying) scheduleBar();
        }, barLength * 1000);
    }

    _getPattern(mood) {
        const patterns = {
            calm: {
                beats: 8,
                notes: [
                    { freq: 130.81, time: 0, duration: 3.5, type: 'sine', gain: 0.12 },
                    { freq: 164.81, time: 1, duration: 2.5, type: 'sine', gain: 0.10 },
                    { freq: 196.00, time: 2, duration: 2.0, type: 'sine', gain: 0.08 },
                    { freq: 130.81, time: 4, duration: 3.5, type: 'sine', gain: 0.12 },
                    { freq: 174.61, time: 5, duration: 2.5, type: 'sine', gain: 0.10 },
                    { freq: 220.00, time: 6, duration: 2.0, type: 'triangle', gain: 0.07 },
                    { freq: 0, time: 0, duration: 8, type: 'sine', gain: 0.03 }
                ]
            },
            playful: {
                beats: 8,
                notes: [
                    { freq: 261.63, time: 0, duration: 0.8, type: 'triangle', gain: 0.12 },
                    { freq: 329.63, time: 1, duration: 0.8, type: 'triangle', gain: 0.12 },
                    { freq: 392.00, time: 2, duration: 0.8, type: 'triangle', gain: 0.12 },
                    { freq: 523.25, time: 3, duration: 0.4, type: 'sine', gain: 0.10 },
                    { freq: 392.00, time: 4, duration: 0.8, type: 'triangle', gain: 0.12 },
                    { freq: 329.63, time: 5, duration: 0.8, type: 'triangle', gain: 0.12 },
                    { freq: 261.63, time: 6, duration: 1.5, type: 'sine', gain: 0.10 },
                    { freq: 0, time: 0, duration: 8, type: 'sine', gain: 0.02 }
                ]
            },
            mysterious: {
                beats: 8,
                notes: [
                    { freq: 110.00, time: 0, duration: 4, type: 'sine', gain: 0.10 },
                    { freq: 138.59, time: 2, duration: 3, type: 'sine', gain: 0.08 },
                    { freq: 164.81, time: 4, duration: 3, type: 'sine', gain: 0.10 },
                    { freq: 123.47, time: 5.5, duration: 2, type: 'triangle', gain: 0.06 },
                    { freq: 146.83, time: 6, duration: 2, type: 'sine', gain: 0.08 },
                    { freq: 0, time: 0, duration: 8, type: 'sine', gain: 0.04 }
                ]
            },
            intense: {
                beats: 8,
                notes: [
                    { freq: 82.41, time: 0, duration: 1.5, type: 'sawtooth', gain: 0.06 },
                    { freq: 98.00, time: 1, duration: 1.5, type: 'sawtooth', gain: 0.06 },
                    { freq: 110.00, time: 2, duration: 1.0, type: 'sawtooth', gain: 0.07 },
                    { freq: 130.81, time: 3, duration: 0.5, type: 'square', gain: 0.04 },
                    { freq: 82.41, time: 4, duration: 1.5, type: 'sawtooth', gain: 0.06 },
                    { freq: 110.00, time: 5, duration: 1.0, type: 'sawtooth', gain: 0.07 },
                    { freq: 146.83, time: 6, duration: 0.8, type: 'square', gain: 0.04 },
                    { freq: 130.81, time: 7, duration: 0.5, type: 'sawtooth', gain: 0.05 }
                ]
            },
            epic: {
                beats: 8,
                notes: [
                    { freq: 65.41, time: 0, duration: 4, type: 'sine', gain: 0.12 },
                    { freq: 130.81, time: 0, duration: 4, type: 'triangle', gain: 0.06 },
                    { freq: 196.00, time: 2, duration: 3, type: 'sine', gain: 0.10 },
                    { freq: 261.63, time: 3, duration: 2, type: 'triangle', gain: 0.08 },
                    { freq: 65.41, time: 4, duration: 4, type: 'sine', gain: 0.12 },
                    { freq: 174.61, time: 5, duration: 2, type: 'sine', gain: 0.10 },
                    { freq: 220.00, time: 6, duration: 1.5, type: 'triangle', gain: 0.08 },
                    { freq: 0, time: 0, duration: 8, type: 'sine', gain: 0.03 }
                ]
            }
        };

        return patterns[mood] || patterns.calm;
    }

    _playNote(freq, startTime, duration, type, gain) {
        if (!this.audioCtx || !this.isPlaying) return;

        const osc = this.audioCtx.createOscillator();
        const noteGain = this.audioCtx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);

        noteGain.gain.setValueAtTime(0, startTime);
        noteGain.gain.linearRampToValueAtTime(gain, startTime + 0.05);
        noteGain.gain.setValueAtTime(gain, startTime + duration * 0.7);
        noteGain.gain.linearRampToValueAtTime(0, startTime + duration);

        osc.connect(noteGain);
        noteGain.connect(this.masterGain);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.1);

        this.scheduledNodes.push(osc);
    }

    playBubble() {
        this.init();
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600 + Math.random() * 400, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    playCollect() {
        this.init();
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        const now = this.audioCtx.currentTime;
        [523.25, 659.25, 783.99].forEach((freq, i) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.15, now + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.25);
        });
    }

    playDanger() {
        this.init();
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.3);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.35);
    }

    playDiscover() {
        this.init();
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        const now = this.audioCtx.currentTime;
        [261.63, 329.63, 392.00, 523.25, 659.25, 783.99].forEach((freq, i) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.1, now + i * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.3);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now + i * 0.06);
            osc.stop(now + i * 0.06 + 0.35);
        });
    }

    setVolume(vol) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, vol));
        }
    }

    stop() {
        this.isPlaying = false;
        if (this.loopInterval) {
            clearInterval(this.loopInterval);
            this.loopInterval = null;
        }
        this.scheduledNodes.forEach(node => {
            try { node.stop(); } catch (e) {}
        });
        this.scheduledNodes = [];
    }
}

export const audioEngine = new OceanAudioEngine();
