const DEMO_SONGS = {
    xiaoxingxing: {
        name: '小星星',
        tempo: 120,
        notes: [
            { note: 60, duration: 0.5 },
            { note: 60, duration: 0.5 },
            { note: 67, duration: 0.5 },
            { note: 67, duration: 0.5 },
            { note: 69, duration: 0.5 },
            { note: 69, duration: 0.5 },
            { note: 67, duration: 1 },
            { note: 65, duration: 0.5 },
            { note: 65, duration: 0.5 },
            { note: 64, duration: 0.5 },
            { note: 64, duration: 0.5 },
            { note: 62, duration: 0.5 },
            { note: 62, duration: 0.5 },
            { note: 60, duration: 1 },
            { note: 67, duration: 0.5 },
            { note: 67, duration: 0.5 },
            { note: 65, duration: 0.5 },
            { note: 65, duration: 0.5 },
            { note: 64, duration: 0.5 },
            { note: 64, duration: 0.5 },
            { note: 62, duration: 1 },
            { note: 67, duration: 0.5 },
            { note: 67, duration: 0.5 },
            { note: 65, duration: 0.5 },
            { note: 65, duration: 0.5 },
            { note: 64, duration: 0.5 },
            { note: 64, duration: 0.5 },
            { note: 62, duration: 1 },
            { note: 60, duration: 0.5 },
            { note: 60, duration: 0.5 },
            { note: 67, duration: 0.5 },
            { note: 67, duration: 0.5 },
            { note: 69, duration: 0.5 },
            { note: 69, duration: 0.5 },
            { note: 67, duration: 1 },
            { note: 65, duration: 0.5 },
            { note: 65, duration: 0.5 },
            { note: 64, duration: 0.5 },
            { note: 64, duration: 0.5 },
            { note: 62, duration: 0.5 },
            { note: 62, duration: 0.5 },
            { note: 60, duration: 1 }
        ]
    },
    liangzhilaohu: {
        name: '两只老虎',
        tempo: 120,
        notes: [
            { note: 60, duration: 0.5 },
            { note: 62, duration: 0.5 },
            { note: 64, duration: 0.5 },
            { note: 60, duration: 0.5 },
            { note: 60, duration: 0.5 },
            { note: 62, duration: 0.5 },
            { note: 64, duration: 0.5 },
            { note: 60, duration: 0.5 },
            { note: 64, duration: 0.5 },
            { note: 65, duration: 0.5 },
            { note: 67, duration: 1 },
            { note: 64, duration: 0.5 },
            { note: 65, duration: 0.5 },
            { note: 67, duration: 1 },
            { note: 67, duration: 0.25 },
            { note: 69, duration: 0.25 },
            { note: 67, duration: 0.25 },
            { note: 65, duration: 0.25 },
            { note: 64, duration: 0.5 },
            { note: 60, duration: 0.5 },
            { note: 67, duration: 0.25 },
            { note: 69, duration: 0.25 },
            { note: 67, duration: 0.25 },
            { note: 65, duration: 0.25 },
            { note: 64, duration: 0.5 },
            { note: 60, duration: 0.5 },
            { note: 62, duration: 0.5 },
            { note: 55, duration: 0.5 },
            { note: 60, duration: 1 },
            { note: 62, duration: 0.5 },
            { note: 55, duration: 0.5 },
            { note: 60, duration: 1 }
        ]
    },
    tianshangde: {
        name: '天上的星星不说话',
        tempo: 90,
        notes: [
            { note: 65, duration: 0.5 },
            { note: 65, duration: 0.5 },
            { note: 67, duration: 0.5 },
            { note: 69, duration: 0.5 },
            { note: 69, duration: 0.5 },
            { note: 67, duration: 0.5 },
            { note: 65, duration: 1 },
            { note: 64, duration: 0.5 },
            { note: 64, duration: 0.5 },
            { note: 62, duration: 0.5 },
            { note: 60, duration: 0.5 },
            { note: 60, duration: 0.5 },
            { note: 62, duration: 0.5 },
            { note: 65, duration: 1 },
            { note: 65, duration: 0.5 },
            { note: 67, duration: 0.5 },
            { note: 69, duration: 1 },
            { note: 69, duration: 0.5 },
            { note: 67, duration: 0.5 },
            { note: 65, duration: 1 },
            { note: 64, duration: 0.5 },
            { note: 62, duration: 0.5 },
            { note: 60, duration: 2 },
            { note: 60, duration: 0.5 },
            { note: 62, duration: 0.5 },
            { note: 64, duration: 0.5 },
            { note: 64, duration: 0.5 },
            { note: 65, duration: 0.5 },
            { note: 62, duration: 0.5 },
            { note: 60, duration: 2 }
        ]
    }
};

class DemoPlayer {
    constructor(audio, pianoKeys) {
        this.audio = audio;
        this.pianoKeys = pianoKeys;
        this.isPlaying = false;
        this.currentSong = null;
        this.currentNoteIndex = 0;
        this.timeoutId = null;
        this.activeTimeouts = [];
        this.pressedNotes = new Map();
    }

    play(songName) {
        if (this.isPlaying) {
            this.stop();
        }
        
        const song = DEMO_SONGS[songName];
        if (!song) {
            console.error('Song not found:', songName);
            return;
        }
        
        this.isPlaying = true;
        this.currentSong = song;
        this.currentNoteIndex = 0;
        this.activeTimeouts = [];
        this.pressedNotes.clear();
        
        this.playNextNote();
        
        return songName;
    }

    playNextNote() {
        if (!this.isPlaying || !this.currentSong) {
            return;
        }
        
        const { notes, tempo } = this.currentSong;
        
        if (this.currentNoteIndex >= notes.length) {
            this.stop();
            return;
        }
        
        const noteData = notes[this.currentNoteIndex];
        const durationMs = (noteData.duration * 60 / tempo) * 1000;
        
        if (noteData.note !== null && noteData.note !== undefined) {
            const note = noteData.note;
            const currentCount = this.pressedNotes.get(note) || 0;
            this.pressedNotes.set(note, currentCount + 1);
            
            this.pianoKeys.pressKey(note);
            
            const releaseTimeout = setTimeout(() => {
                if (this.isPlaying) {
                    this.releaseNoteByDemo(note);
                }
            }, durationMs * 0.7);
            this.activeTimeouts.push(releaseTimeout);
        }
        
        this.currentNoteIndex++;
        
        this.timeoutId = setTimeout(() => {
            this.playNextNote();
        }, durationMs);
    }

    releaseNoteByDemo(note) {
        const count = this.pressedNotes.get(note) || 0;
        if (count > 0) {
            this.pressedNotes.set(note, count - 1);
            this.pianoKeys.releaseKey(note);
        }
    }

    stop() {
        this.isPlaying = false;
        this.currentSong = null;
        this.currentNoteIndex = 0;
        
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        
        this.activeTimeouts.forEach(tid => clearTimeout(tid));
        this.activeTimeouts = [];
        
        this.pressedNotes.forEach((count, note) => {
            for (let i = 0; i < count; i++) {
                this.pianoKeys.releaseKey(note);
            }
        });
        this.pressedNotes.clear();
    }
}

window.DEMO_SONGS = DEMO_SONGS;
window.DemoPlayer = DemoPlayer;
