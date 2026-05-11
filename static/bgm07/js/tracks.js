const Tracks = {
    tracks: [],
    hasSolo: false,

    init(tracksData) {
        this.tracks = tracksData.map(track => ({
            ...track,
            isPlaying: false,
            nextEventTime: 0,
            pattern: this.getDefaultPattern(track.id),
            currentStep: 0
        }));
    },

    getDefaultPattern(trackId) {
        switch (trackId) {
            case 'kick':
                return [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
            case 'snare':
                return [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
            case 'hihat':
                return [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0];
            case 'bass':
                return [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
            case 'chord':
                return [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0];
            case 'lead':
                return [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0];
            case 'pad':
                return [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            case 'fx':
                return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0];
            default:
                return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        }
    },

    getTrackById(id) {
        return this.tracks.find(t => t.id === id);
    },

    setVolume(trackId, volume) {
        const track = this.getTrackById(trackId);
        if (track) {
            track.volume = Math.max(0, Math.min(100, volume));
        }
    },

    toggleMute(trackId) {
        const track = this.getTrackById(trackId);
        if (track) {
            track.muted = !track.muted;
        }
    },

    toggleSolo(trackId) {
        const track = this.getTrackById(trackId);
        if (track) {
            track.solo = !track.solo;
            this.updateSoloState();
        }
    },

    updateSoloState() {
        this.hasSolo = this.tracks.some(t => t.solo);
    },

    isTrackActive(trackId) {
        const track = this.getTrackById(trackId);
        if (!track) return false;
        if (track.muted) return false;
        if (this.hasSolo && !track.solo) return false;
        return true;
    },

    getEffectiveVolume(trackId) {
        const track = this.getTrackById(trackId);
        if (!track) return 0;
        if (!this.isTrackActive(trackId)) return 0;
        return track.volume / 100;
    },

    updatePattern(trackId, pattern) {
        const track = this.getTrackById(trackId);
        if (track) {
            track.pattern = [...pattern];
        }
    },

    resetSteps() {
        this.tracks.forEach(track => {
            track.currentStep = 0;
        });
    },

    getTracksData() {
        return this.tracks.map(track => ({
            id: track.id,
            name: track.name,
            icon: track.icon,
            volume: track.volume,
            muted: track.muted,
            solo: track.solo
        }));
    },

    getNotesForTrack(trackId, currentChordProgression) {
        const notes = {
            kick: [60],
            snare: [60],
            hihat: [60],
            bass: [currentChordProgression.root],
            chord: [
                currentChordProgression.root,
                currentChordProgression.third,
                currentChordProgression.fifth
            ],
            lead: [
                currentChordProgression.root,
                currentChordProgression.third,
                currentChordProgression.fifth,
                currentChordProgression.root + 12
            ],
            pad: [
                currentChordProgression.root - 12,
                currentChordProgression.root,
                currentChordProgression.third
            ],
            fx: [60]
        };
        return notes[trackId] || [60];
    },

    scheduleStep(trackId, startTime, step, bpm, currentChord, effects) {
        const track = this.getTrackById(trackId);
        if (!track) return;

        const patternIndex = step % track.pattern.length;
        if (!track.pattern[patternIndex]) return;

        const volume = this.getEffectiveVolume(trackId);
        if (volume <= 0) return;

        const stepDuration = (60 / bpm) / 4;
        const actualStartTime = startTime + step * stepDuration;

        const notes = this.getNotesForTrack(trackId, currentChord);

        switch (trackId) {
            case 'kick':
                AudioEngine.createKick(actualStartTime, volume);
                break;
            case 'snare':
                AudioEngine.createSnare(actualStartTime, volume * 0.8);
                break;
            case 'hihat':
                AudioEngine.createHiHat(actualStartTime, volume * 0.5, patternIndex % 2 === 0);
                break;
            case 'bass':
                AudioEngine.createBass(actualStartTime, this.midiToFreq(notes[0]), volume);
                break;
            case 'chord':
                const chordNotes = notes.map(n => this.midiToFreq(n));
                AudioEngine.createChord(actualStartTime, chordNotes, stepDuration * 2, volume * 0.7);
                break;
            case 'lead':
                const leadNote = notes[step % notes.length];
                AudioEngine.createLead(actualStartTime, this.midiToFreq(leadNote), stepDuration * 1.5, volume);
                break;
            case 'pad':
                const padNotes = notes.map(n => this.midiToFreq(n));
                AudioEngine.createPad(actualStartTime, padNotes, stepDuration * 8, volume * 0.6);
                break;
            case 'fx':
                const fxTypes = ['riser', 'impact', 'white_noise'];
                const fxType = fxTypes[step % fxTypes.length];
                AudioEngine.createFX(actualStartTime, fxType, volume);
                break;
        }
    },

    midiToFreq(midi) {
        return 440 * Math.pow(2, (midi - 69) / 12);
    }
};
