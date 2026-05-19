class Timer {
    constructor(durationSeconds, onTick, onComplete) {
        this.duration = durationSeconds;
        this.remaining = durationSeconds;
        this.onTick = onTick || (() => {});
        this.onComplete = onComplete || (() => {});
        this.isRunning = false;
        this.startTime = null;
        this.pauseTime = null;
        this.animationFrameId = null;
        this.lastTickTime = 0;
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        const now = Date.now();
        
        if (this.pauseTime) {
            this.startTime = now - (this.duration - this.remaining) * 1000;
            this.pauseTime = null;
        } else {
            this.startTime = now;
        }
        
        this.lastTickTime = now;
        this.tick();
    }

    pause() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        this.pauseTime = Date.now();
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    reset(newDuration = null) {
        this.pause();
        
        if (newDuration !== null) {
            this.duration = newDuration;
        }
        
        this.remaining = this.duration;
        this.startTime = null;
        this.pauseTime = null;
        this.onTick(this.remaining, this.duration);
    }

    tick() {
        if (!this.isRunning) return;
        
        const now = Date.now();
        const elapsed = (now - this.startTime) / 1000;
        this.remaining = Math.max(0, this.duration - elapsed);
        
        if (now - this.lastTickTime >= 100) {
            this.onTick(this.remaining, this.duration);
            this.lastTickTime = now;
        }
        
        if (this.remaining <= 0) {
            this.remaining = 0;
            this.isRunning = false;
            this.onTick(0, this.duration);
            this.onComplete();
            return;
        }
        
        this.animationFrameId = requestAnimationFrame(() => this.tick());
    }

    getProgress() {
        if (this.duration === 0) return 0;
        return 1 - (this.remaining / this.duration);
    }

    getRemainingTime() {
        return this.remaining;
    }

    getDuration() {
        return this.duration;
    }

    isActive() {
        return this.isRunning;
    }

    destroy() {
        this.pause();
        this.onTick = null;
        this.onComplete = null;
    }

    toJSON() {
        return {
            duration: this.duration,
            remaining: this.remaining,
            isRunning: this.isRunning,
            startTime: this.startTime,
            pauseTime: this.pauseTime
        };
    }

    static fromJSON(json, onTick, onComplete) {
        const timer = new Timer(json.duration, onTick, onComplete);
        timer.remaining = json.remaining;
        timer.startTime = json.startTime;
        timer.pauseTime = json.pauseTime;
        timer.isRunning = false;
        
        if (json.isRunning) {
            if (json.pauseTime) {
                timer.isRunning = false;
            } else {
                const now = Date.now();
                const elapsed = (now - json.startTime) / 1000;
                timer.remaining = Math.max(0, json.duration - elapsed);
                
                if (timer.remaining > 0) {
                    timer.isRunning = true;
                    timer.lastTickTime = now;
                    timer.tick();
                } else {
                    timer.remaining = 0;
                    timer.isRunning = false;
                }
            }
        }
        
        if (onTick) {
            onTick(timer.remaining, timer.duration);
        }
        
        return timer;
    }
}

export { Timer };
