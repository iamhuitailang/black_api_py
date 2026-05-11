const Storage = {
    STORAGE_KEY: 'bgm_mixer_state_v1',

    getDefaultState() {
        return {
            isPlaying: false,
            isPaused: false,
            bpm: 120,
            masterVolume: 80,
            currentPreset: null,
            playbackTime: 0,
            tracks: [
                { id: 'kick', name: '鼓组 (Kick)', icon: '🥁', volume: 80, muted: false, solo: false },
                { id: 'snare', name: '鼓组 (Snare)', icon: '🎯', volume: 70, muted: false, solo: false },
                { id: 'hihat', name: '踩镲 (Hi-hat)', icon: '🍽', volume: 75, muted: false, solo: false },
                { id: 'bass', name: '贝斯 (Bass)', icon: '🎸', volume: 85, muted: false, solo: false },
                { id: 'chord', name: '和弦 (Chord)', icon: '🎹', volume: 60, muted: false, solo: false },
                { id: 'lead', name: '主旋律 (Lead)', icon: '🎷', volume: 75, muted: false, solo: false },
                { id: 'pad', name: '氛围 (Pad)', icon: '🌊', volume: 50, muted: false, solo: false },
                { id: 'fx', name: '效果 (FX)', icon: '✨', volume: 65, muted: false, solo: false }
            ],
            effects: {
                eq: { low: 0, mid: 0, high: 0 },
                reverb: { roomSize: 1.0, mix: 30 },
                delay: { time: 0.3, feedback: 40, mix: 20 },
                filter: { type: 'lowpass', cutoff: 5000, resonance: 1.0 },
                distortion: { gain: 0, amount: 0 }
            }
        };
    },

    save(state) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.error('保存状态失败:', error);
        }
    },

    load() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                const parsedState = JSON.parse(saved);
                return this.mergeWithDefault(parsedState);
            }
        } catch (error) {
            console.error('加载状态失败:', error);
        }
        return this.getDefaultState();
    },

    mergeWithDefault(savedState) {
        const defaultState = this.getDefaultState();
        const merged = { ...defaultState, ...savedState };
        merged.tracks = savedState.tracks ? savedState.tracks : defaultState.tracks;
        merged.effects = savedState.effects ? { ...defaultState.effects, ...savedState.effects } : defaultState.effects;
        return merged;
    },

    clear() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
};
