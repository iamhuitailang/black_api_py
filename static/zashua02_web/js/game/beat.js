const BeatSystem = {
    bpm: 120,
    beatInterval: 500,
    currentBeat: 0,
    isRunning: false,
    beatCallback: null,
    timeoutId: null,
    startTime: 0,

    init(bpm = 120) {
        this.bpm = bpm;
        this.beatInterval = 60000 / bpm;
        this.currentBeat = 0;
        this.startTime = 0;
    },

    start(callback) {
        this.beatCallback = callback;
        this.isRunning = true;
        this.currentBeat = 0;
        this.startTime = Date.now();
        this.scheduleBeat();
    },

    stop() {
        this.isRunning = false;
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    },

    scheduleBeat() {
        if (!this.isRunning) return;

        const now = Date.now();
        this.currentBeat++;
        
        if (this.startTime === 0) {
            this.startTime = now;
        }

        if (this.beatCallback) {
            this.beatCallback(this.currentBeat);
        }

        const expectedNext = this.startTime + this.currentBeat * this.beatInterval;
        const delay = Math.max(0, expectedNext - Date.now());
        
        this.timeoutId = setTimeout(() => this.scheduleBeat(), delay);
    },

    getBeatSync(offset = 0) {
        return (this.currentBeat + offset) % 4;
    },

    checkSync(actionTime, windowMs = 150) {
        const timeInBeat = this.getTimeInBeat(actionTime);
        return timeInBeat < windowMs || (this.beatInterval - timeInBeat) < windowMs;
    },

    getSyncPercentage(actionTime) {
        const timeInBeat = this.getTimeInBeat(actionTime);
        const halfBeat = this.beatInterval / 2;
        const diff = Math.abs(timeInBeat - halfBeat);
        return Math.max(0, 100 - (diff / halfBeat * 100));
    },

    getTimeInBeat(actionTime) {
        if (this.startTime === 0) return 0;
        const elapsed = actionTime - this.startTime;
        return elapsed % this.beatInterval;
    }
};

window.BeatSystem = BeatSystem;
