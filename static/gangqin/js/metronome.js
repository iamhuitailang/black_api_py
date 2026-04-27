class Metronome {
    constructor(audio) {
        this.audio = audio;
        this.bpm = 120;
        this.isPlaying = false;
        this.beatCount = 0;
        this.beatsPerMeasure = 4;
        this.intervalId = null;
    }

    setBPM(bpm) {
        this.bpm = Math.max(40, Math.min(200, bpm));
        
        if (this.isPlaying) {
            this.stop();
            this.start();
        }
    }

    start() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.beatCount = 0;
        
        const intervalMs = (60 / this.bpm) * 1000;
        
        this.tick();
        this.intervalId = setInterval(() => {
            this.tick();
        }, intervalMs);
    }

    tick() {
        this.beatCount++;
        
        const isFirstBeat = this.beatCount % this.beatsPerMeasure === 1;
        
        this.audio.playClickSound(isFirstBeat);
        
        if (this.onTick) {
            this.onTick(this.beatCount, isFirstBeat);
        }
    }

    stop() {
        this.isPlaying = false;
        this.beatCount = 0;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    toggle() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.start();
        }
        return this.isPlaying;
    }
}

window.Metronome = Metronome;
