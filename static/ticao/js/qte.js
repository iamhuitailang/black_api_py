const QTE = {
    currentAction: null,
    currentActionIndex: 0,
    actions: [],
    beatTimers: [],
    currentBeat: 0,
    isActive: false,
    isWaitingForLanding: false,
    isLandingPhase: false,
    hitResults: [],
    comboCount: 0,
    maxCombo: 0,
    bpm: 120,
    beatInterval: 500,
    beatStartTime: 0,
    landingTimeout: null,
    onActionComplete: null,
    onSequenceComplete: null,
    onLandingStart: null,
    onComboUpdate: null,
    onActionStart: null,

    init(actions) {
        this.actions = [...actions];
        this.currentActionIndex = 0;
        this.currentBeat = 0;
        this.isActive = false;
        this.isWaitingForLanding = false;
        this.isLandingPhase = false;
        this.hitResults = [];
        this.comboCount = 0;
        this.maxCombo = 0;
        this.beatTimers = [];
    },

    startAction(action) {
        this.currentAction = action;
        this.currentBeat = 0;
        this.isActive = true;
        this.isWaitingForLanding = false;
        this.isLandingPhase = false;
        this.beatTimers = [];
        this.hitResults = [];
        
        this.bpm = 100 + action.qteCount * 10;
        this.beatInterval = 60000 / this.bpm;
        
        for (let i = 0; i < action.qteCount; i++) {
            this.beatTimers.push({
                key: action.keys[i] || 'F',
                targetTime: i * this.beatInterval,
                hit: false,
                quality: null,
                missTime: null
            });
        }
        
        this.beatStartTime = performance.now();
    },

    handleInput(key, timing) {
        if (!this.isActive || this.isLandingPhase) return null;
        
        const beatIndex = this.currentBeat;
        if (beatIndex >= this.beatTimers.length) return null;
        
        const beat = this.beatTimers[beatIndex];
        if (beat.hit) return null;
        
        const validKeys = ['A', 'S', 'D', 'F', 'J', 'K', 'L'];
        if (!validKeys.includes(key)) return null;
        
        if (key === beat.key) {
            const expectedTime = beat.targetTime;
            const actualTime = timing - this.beatStartTime;
            const timingDiff = (actualTime - expectedTime) / this.beatInterval;
            
            const errorRate = Environment.getErrorRate();
            const quality = Scoring.evaluateHitQuality(timingDiff, errorRate);
            
            beat.hit = true;
            beat.quality = quality.quality;
            beat.score = quality.score;
            
            this.hitResults.push({
                beat: beatIndex,
                quality: quality.quality,
                score: quality.score,
                timing: timingDiff
            });
            
            if (quality.quality === 'miss') {
                this.comboCount = 0;
            } else {
                this.comboCount++;
                if (this.comboCount > this.maxCombo) {
                    this.maxCombo = this.comboCount;
                }
            }
            
            if (this.onComboUpdate) {
                this.onComboUpdate(this.comboCount);
            }
            
            this.currentBeat++;
            
            if (this.currentBeat >= this.beatTimers.length) {
                this.completeAction();
            }
            
            return {
                beat: beatIndex,
                quality: quality.quality,
                score: quality.score,
                offset: quality.offset,
                key: key
            };
        } else {
            beat.hit = true;
            beat.quality = 'miss';
            beat.score = 0;
            
            this.hitResults.push({
                beat: beatIndex,
                quality: 'miss',
                score: 0,
                timing: 1
            });
            
            this.comboCount = 0;
            this.currentBeat++;
            
            if (this.currentBeat >= this.beatTimers.length) {
                this.completeAction();
            }
            
            if (this.onComboUpdate) {
                this.onComboUpdate(this.comboCount);
            }
            
            return {
                beat: beatIndex,
                quality: 'miss',
                score: 0,
                offset: 0,
                key: key
            };
        }
    },

    update(currentTime) {
        if (!this.isActive || this.isLandingPhase) return;
        
        const elapsed = currentTime - this.beatStartTime;
        
        for (let i = 0; i < this.beatTimers.length; i++) {
            const beat = this.beatTimers[i];
            if (!beat.hit && elapsed > beat.targetTime + this.beatInterval) {
                beat.hit = true;
                beat.quality = 'miss';
                beat.score = 0;
                beat.missTime = currentTime;
                
                this.hitResults.push({
                    beat: i,
                    quality: 'miss',
                    score: 0,
                    timing: 1
                });
                
                this.comboCount = 0;
                this.currentBeat++;
                
                if (this.currentBeat >= this.beatTimers.length) {
                    this.completeAction();
                    break;
                }
            }
        }
    },

    completeAction() {
        this.isActive = false;
        this.isWaitingForLanding = true;
        
        if (this.landingTimeout) {
            clearTimeout(this.landingTimeout);
        }
        this.landingTimeout = setTimeout(() => {
            if (this.isWaitingForLanding) {
                this.startLanding();
            }
        }, 1500);
        
        if (this.onActionComplete) {
            this.onActionComplete(this.hitResults);
        }
    },

    startLanding() {
        this.isWaitingForLanding = false;
        this.isLandingPhase = true;
        
        if (this.landingTimeout) {
            clearTimeout(this.landingTimeout);
            this.landingTimeout = null;
        }
        
        if (this.onLandingStart) {
            this.onLandingStart();
        }
    },

    completeLanding(landingQuality) {
        this.isLandingPhase = false;
        
        this.currentActionIndex++;
        
        if (this.currentActionIndex >= this.actions.length) {
            if (this.onSequenceComplete) {
                this.onSequenceComplete(this.hitResults, landingQuality);
            }
        } else {
            if (this.onActionStart) {
                this.onActionStart(this.currentActionIndex);
            }
            setTimeout(() => {
                this.startAction(this.actions[this.currentActionIndex]);
            }, 500);
        }
        
        return landingQuality;
    },

    getCurrentBeatProgress(currentTime) {
        if (!this.isActive || this.beatTimers.length === 0) return 0;
        
        const elapsed = currentTime - this.beatStartTime;
        const totalDuration = this.beatTimers[this.beatTimers.length - 1].targetTime + this.beatInterval;
        
        return Math.min(elapsed / totalDuration, 1);
    },

    getCurrentBeatIndex(currentTime) {
        if (!this.isActive) return -1;
        
        const elapsed = currentTime - this.beatStartTime;
        
        for (let i = 0; i < this.beatTimers.length; i++) {
            const beat = this.beatTimers[i];
            if (!beat.hit && elapsed >= beat.targetTime - this.beatInterval * 0.3) {
                return i;
            }
        }
        
        return -1;
    },

    getBeatTiming(currentTime, beatIndex) {
        if (!this.beatTimers[beatIndex]) return 0;
        
        const elapsed = currentTime - this.beatStartTime;
        const targetTime = this.beatTimers[beatIndex].targetTime;
        
        return (elapsed - targetTime) / this.beatInterval;
    },

    getCurrentActionName() {
        if (this.currentActionIndex < this.actions.length) {
            return this.actions[this.currentActionIndex].name;
        }
        return '';
    },

    getProgress() {
        return {
            current: this.currentActionIndex,
            total: this.actions.length,
            action: this.currentAction ? this.currentAction.name : '',
            beat: this.currentBeat,
            totalBeats: this.beatTimers.length
        };
    },

    reset() {
        this.currentAction = null;
        this.currentActionIndex = 0;
        this.actions = [];
        this.beatTimers = [];
        this.currentBeat = 0;
        this.isActive = false;
        this.isWaitingForLanding = false;
        this.isLandingPhase = false;
        this.hitResults = [];
        this.comboCount = 0;
        this.maxCombo = 0;
    }
};
