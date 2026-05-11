const Presets = {
    presets: {
        edm: {
            name: '电子舞曲 (EDM)',
            bpm: 128,
            tracks: {
                kick: { volume: 90, muted: false, solo: false },
                snare: { volume: 75, muted: false, solo: false },
                hihat: { volume: 80, muted: false, solo: false },
                bass: { volume: 85, muted: false, solo: false },
                chord: { volume: 55, muted: false, solo: false },
                lead: { volume: 70, muted: false, solo: false },
                pad: { volume: 40, muted: false, solo: false },
                fx: { volume: 60, muted: false, solo: false }
            },
            effects: {
                eq: { low: 3, mid: -1, high: 2 },
                reverb: { roomSize: 1.5, mix: 20 },
                delay: { time: 0.3, feedback: 30, mix: 15 },
                filter: { type: 'lowpass', cutoff: 15000, resonance: 1 },
                distortion: { gain: 10, amount: 15 }
            },
            chordProgression: [
                { root: 60, third: 64, fifth: 67 },
                { root: 55, third: 59, fifth: 62 },
                { root: 57, third: 61, fifth: 64 },
                { root: 52, third: 56, fifth: 59 }
            ],
            patterns: {
                kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
                snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
                hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
                bass: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
                chord: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
                lead: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
                pad: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                fx: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]
            }
        },

        lofi: {
            name: '放松Lo-Fi',
            bpm: 85,
            tracks: {
                kick: { volume: 60, muted: false, solo: false },
                snare: { volume: 50, muted: false, solo: false },
                hihat: { volume: 55, muted: false, solo: false },
                bass: { volume: 65, muted: false, solo: false },
                chord: { volume: 70, muted: false, solo: false },
                lead: { volume: 55, muted: false, solo: false },
                pad: { volume: 60, muted: false, solo: false },
                fx: { volume: 45, muted: false, solo: false }
            },
            effects: {
                eq: { low: 2, mid: 3, high: -2 },
                reverb: { roomSize: 2.0, mix: 40 },
                delay: { time: 0.5, feedback: 50, mix: 30 },
                filter: { type: 'lowpass', cutoff: 8000, resonance: 0.8 },
                distortion: { gain: 5, amount: 10 }
            },
            chordProgression: [
                { root: 57, third: 60, fifth: 64 },
                { root: 52, third: 55, fifth: 59 },
                { root: 55, third: 59, fifth: 62 },
                { root: 50, third: 53, fifth: 57 }
            ],
            patterns: {
                kick: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
                snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
                hihat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
                bass: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
                chord: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
                lead: [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1],
                pad: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
                fx: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]
            }
        },

        '8bit': {
            name: '8-bit 复古',
            bpm: 150,
            tracks: {
                kick: { volume: 80, muted: false, solo: false },
                snare: { volume: 70, muted: false, solo: false },
                hihat: { volume: 75, muted: false, solo: false },
                bass: { volume: 85, muted: false, solo: false },
                chord: { volume: 60, muted: false, solo: false },
                lead: { volume: 85, muted: false, solo: false },
                pad: { volume: 45, muted: false, solo: false },
                fx: { volume: 70, muted: false, solo: false }
            },
            effects: {
                eq: { low: 0, mid: 4, high: 3 },
                reverb: { roomSize: 0.8, mix: 15 },
                delay: { time: 0.2, feedback: 20, mix: 10 },
                filter: { type: 'lowpass', cutoff: 4000, resonance: 2 },
                distortion: { gain: 15, amount: 25 }
            },
            chordProgression: [
                { root: 60, third: 64, fifth: 67 },
                { root: 58, third: 62, fifth: 65 },
                { root: 60, third: 64, fifth: 67 },
                { root: 55, third: 59, fifth: 62 }
            ],
            patterns: {
                kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
                snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
                hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
                bass: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
                chord: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
                lead: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
                pad: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                fx: [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0]
            }
        },

        epic: {
            name: '史诗管弦',
            bpm: 90,
            tracks: {
                kick: { volume: 85, muted: false, solo: false },
                snare: { volume: 75, muted: false, solo: false },
                hihat: { volume: 40, muted: true, solo: false },
                bass: { volume: 75, muted: false, solo: false },
                chord: { volume: 65, muted: false, solo: false },
                lead: { volume: 80, muted: false, solo: false },
                pad: { volume: 70, muted: false, solo: false },
                fx: { volume: 65, muted: false, solo: false }
            },
            effects: {
                eq: { low: 4, mid: 1, high: 0 },
                reverb: { roomSize: 3.0, mix: 50 },
                delay: { time: 0.6, feedback: 40, mix: 25 },
                filter: { type: 'lowpass', cutoff: 12000, resonance: 1.2 },
                distortion: { gain: 0, amount: 0 }
            },
            chordProgression: [
                { root: 57, third: 61, fifth: 64 },
                { root: 62, third: 66, fifth: 69 },
                { root: 55, third: 59, fifth: 62 },
                { root: 60, third: 64, fifth: 67 }
            ],
            patterns: {
                kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
                snare: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
                hihat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                bass: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
                chord: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
                lead: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
                pad: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                fx: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]
            }
        },

        ambient: {
            name: '环境氛围',
            bpm: 60,
            tracks: {
                kick: { volume: 30, muted: true, solo: false },
                snare: { volume: 30, muted: true, solo: false },
                hihat: { volume: 30, muted: true, solo: false },
                bass: { volume: 45, muted: false, solo: false },
                chord: { volume: 55, muted: false, solo: false },
                lead: { volume: 50, muted: false, solo: false },
                pad: { volume: 80, muted: false, solo: false },
                fx: { volume: 70, muted: false, solo: false }
            },
            effects: {
                eq: { low: 2, mid: 0, high: 1 },
                reverb: { roomSize: 3.0, mix: 70 },
                delay: { time: 1.0, feedback: 60, mix: 50 },
                filter: { type: 'lowpass', cutoff: 6000, resonance: 0.5 },
                distortion: { gain: 0, amount: 0 }
            },
            chordProgression: [
                { root: 55, third: 58, fifth: 62 },
                { root: 55, third: 58, fifth: 62 },
                { root: 52, third: 55, fifth: 59 },
                { root: 52, third: 55, fifth: 59 }
            ],
            patterns: {
                kick: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                hihat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                bass: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                chord: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                lead: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                pad: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                fx: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            }
        }
    },

    getPreset(presetName) {
        return this.presets[presetName] || null;
    },

    getAllPresetNames() {
        return Object.keys(this.presets);
    },

    getPresetTracks(presetName) {
        const preset = this.getPreset(presetName);
        return preset ? preset.tracks : null;
    },

    getPresetEffects(presetName) {
        const preset = this.getPreset(presetName);
        return preset ? preset.effects : null;
    },

    getPresetBPM(presetName) {
        const preset = this.getPreset(presetName);
        return preset ? preset.bpm : 120;
    },

    getPresetPatterns(presetName) {
        const preset = this.getPreset(presetName);
        return preset ? preset.patterns : null;
    },

    getPresetChordProgression(presetName) {
        const preset = this.getPreset(presetName);
        return preset ? preset.chordProgression : null;
    }
};
