class BeatDetector {
    constructor(options = {}) {
        this.bpm = options.bpm || 120;
        this.beatInterval = 60000 / this.bpm;
        this.lastBeatTime = 0;
        this.beatCount = 0;
        this.onBeat = options.onBeat || null;
        this.onBeatWindow = options.onBeatWindow || null;
        this.isRunning = false;
        this.beatWindowStart = 0;
        this.beatWindowDuration = options.beatWindowDuration || 200;
        this.currentBeatOffset = 0;
        this.visualizerData = new Array(32).fill(0);
    }

    setBPM(bpm) {
        this.bpm = bpm;
        this.beatInterval = 60000 / this.bpm;
    }

    start() {
        this.isRunning = true;
        this.lastBeatTime = performance.now();
        this.beatCount = 0;
    }

    stop() {
        this.isRunning = false;
    }

    update(currentTime) {
        if (!this.isRunning) return;

        const elapsed = currentTime - this.lastBeatTime;
        
        if (elapsed >= this.beatInterval) {
            this.lastBeatTime = currentTime;
            this.beatCount++;
            this.beatWindowStart = currentTime;
            
            if (this.onBeat) {
                this.onBeat(this.beatCount);
            }
        }

        const timeSinceWindowStart = currentTime - this.beatWindowStart;
        const isInWindow = timeSinceWindowStart < this.beatWindowDuration;
        
        if (this.onBeatWindow) {
            this.onBeatWindow(isInWindow, timeSinceWindowStart / this.beatWindowDuration);
        }

        this.updateVisualizer(currentTime);
    }

    updateVisualizer(currentTime) {
        const progress = (currentTime - this.lastBeatTime) / this.beatInterval;
        
        for (let i = 0; i < this.visualizerData.length; i++) {
            const phase = (i / this.visualizerData.length) * Math.PI * 2;
            const beatIntensity = Math.max(0, 1 - progress * 2);
            const baseHeight = 20 + Math.sin(currentTime * 0.005 + phase) * 10;
            const beatHeight = beatIntensity * 80 * (1 + Math.sin(phase) * 0.3);
            this.visualizerData[i] = baseHeight + beatHeight;
        }
    }

    checkJumpTiming(jumpTime) {
        const timeSinceLastBeat = jumpTime - this.lastBeatTime;
        const timeToNextBeat = this.beatInterval - timeSinceLastBeat;
        
        let closestTime = timeSinceLastBeat;
        let isNextBeat = false;
        
        if (timeToNextBeat < timeSinceLastBeat) {
            closestTime = timeToNextBeat;
            isNextBeat = true;
        }

        const tolerance = this.beatWindowDuration;
        
        if (closestTime < tolerance * 0.3) {
            return { timing: 'perfect', offset: closestTime, isNextBeat };
        } else if (closestTime < tolerance) {
            return { timing: 'good', offset: closestTime, isNextBeat };
        }
        
        return { timing: 'miss', offset: closestTime, isNextBeat };
    }

    getTimeUntilNextBeat(currentTime) {
        const elapsed = currentTime - this.lastBeatTime;
        return this.beatInterval - elapsed;
    }

    getVisualizerData() {
        return this.visualizerData;
    }

    getProgress(currentTime) {
        return (currentTime - this.lastBeatTime) / this.beatInterval;
    }
}
