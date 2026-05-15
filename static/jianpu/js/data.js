const NoteData = {
    baseNotes: [
        { number: 1, sing: 'do', pitch: 'C', frequency: 261.63 },
        { number: 2, sing: 're', pitch: 'D', frequency: 293.66 },
        { number: 3, sing: 'mi', pitch: 'E', frequency: 329.63 },
        { number: 4, sing: 'fa', pitch: 'F', frequency: 349.23 },
        { number: 5, sing: 'sol', pitch: 'G', frequency: 392.00 },
        { number: 6, sing: 'la', pitch: 'A', frequency: 440.00 },
        { number: 7, sing: 'si', pitch: 'B', frequency: 493.88 }
    ],

    octaves: [
        { id: -2, name: '低低八度', multiplier: 0.25, dotsBelow: 2, dotsAbove: 0 },
        { id: -1, name: '低八度', multiplier: 0.5, dotsBelow: 1, dotsAbove: 0 },
        { id: 0, name: '中音', multiplier: 1, dotsBelow: 0, dotsAbove: 0 },
        { id: 1, name: '高八度', multiplier: 2, dotsBelow: 0, dotsAbove: 1 },
        { id: 2, name: '高高八度', multiplier: 4, dotsBelow: 0, dotsAbove: 2 }
    ],

    accidentals: [
        { id: 0, symbol: '', name: '自然', offset: 0 },
        { id: 1, symbol: '#', name: '升', offset: 1 },
        { id: -1, symbol: 'b', name: '降', offset: -1 }
    ],

    generateNotes(difficulty) {
        const notes = [];
        let octaveRange = [];
        let includeAccidentals = false;

        switch (difficulty) {
            case 'easy':
                octaveRange = [0];
                includeAccidentals = false;
                break;
            case 'medium':
                octaveRange = [-1, 0, 1];
                includeAccidentals = false;
                break;
            case 'hard':
                octaveRange = [-2, -1, 0, 1, 2];
                includeAccidentals = true;
                break;
            default:
                octaveRange = [0];
        }

        const accidentals = includeAccidentals 
            ? this.accidentals 
            : [this.accidentals[0]];

        for (const octave of octaveRange) {
            const octaveData = this.octaves.find(o => o.id === octave);
            for (const note of this.baseNotes) {
                for (const acc of accidentals) {
                    notes.push({
                        ...note,
                        octave: octaveData,
                        accidental: acc,
                        frequency: note.frequency * octaveData.multiplier * Math.pow(2, acc.offset / 12)
                    });
                }
            }
        }

        return notes;
    },

    getAnswerModeAnswers(mode) {
        switch (mode) {
            case 'sing':
                return this.baseNotes.map(n => n.sing);
            case 'pitch':
                return this.baseNotes.map(n => n.pitch);
            case 'number':
                return this.baseNotes.map(n => n.number.toString());
            case 'listen':
                return this.baseNotes.map(n => n.number.toString());
            default:
                return this.baseNotes.map(n => n.sing);
        }
    }
};