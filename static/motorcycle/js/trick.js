class TrickManager {
    constructor() {
        this.currentTricks = [];
        this.completedTricks = [];
        this.combo = 0;
        this.maxCombo = 0;
        this.lastTrickTime = 0;
        this.totalScore = 0;
        this.trickInProgress = false;
    }

    update(motorcycle, input, currentTime) {
        if (currentTime - this.lastTrickTime > CONFIG.COMBO_TIMEOUT && this.combo > 0) {
            this.combo = 0;
        }

        if (motorcycle.isInAir()) {
            this.checkTrickKeys(input, motorcycle);
            this.checkFlipTricks(motorcycle);
        } else if (motorcycle.landed) {
            this.onLanding(motorcycle);
        }

        this.checkWheelieTrick(motorcycle);
    }

    checkTrickKeys(input, motorcycle) {
        const keys = input.getTrickKeys();
        if (keys.length === 0) return;

        const airTime = motorcycle.getAirTime();
        let trickFound = null;

        for (const [trickId, trick] of Object.entries(CONFIG.TRICKS)) {
            if (trick.type === 'flip') continue;

            if (trick.keys) {
                if (this.arraysEqual(trick.keys, keys)) {
                    trickFound = { id: trickId, ...trick };
                    break;
                }
            } else if (trick.key && keys.length === 1 && keys[0] === trick.key) {
                trickFound = { id: trickId, ...trick };
                break;
            }
        }

        if (trickFound && airTime >= trickFound.minAirTime) {
            if (!this.currentTricks.find(t => t.id === trickFound.id)) {
                this.currentTricks.push(trickFound);
                this.trickInProgress = true;
            }
        }
    }

    checkFlipTricks(motorcycle) {
        const flipCount = motorcycle.getFlipCount();
        const flipDir = motorcycle.getFlipDirection();
        
        if (flipCount >= 2) {
            const doubleFlip = CONFIG.TRICKS.doubleBackflip;
            if (doubleFlip && !this.currentTricks.find(t => t.id === 'doubleBackflip')) {
                if (flipDir < 0) {
                    this.currentTricks.push({ id: 'doubleBackflip', ...doubleFlip });
                    this.trickInProgress = true;
                }
            }
        } else if (flipCount >= 1) {
            const flipTrick = flipDir < 0 ? CONFIG.TRICKS.backflip : CONFIG.TRICKS.frontflip;
            const trickId = flipDir < 0 ? 'backflip' : 'frontflip';
            if (flipTrick && !this.currentTricks.find(t => t.id === trickId)) {
                this.currentTricks.push({ id: trickId, ...flipTrick });
                this.trickInProgress = true;
            }
        }
    }

    onLanding(motorcycle) {
        if (this.currentTricks.length > 0) {
            const angle = Math.abs(motorcycle.normalizeAngle(motorcycle.getRotation()));
            const speed = motorcycle.getSpeed();
            
            if (angle < Math.PI * 0.5) {
                this.completeTricks(speed);
            } else {
                this.failTricks();
            }
        }
        motorcycle.landed = false;
        this.trickInProgress = false;
    }

    completeTricks(speed) {
        this.combo++;
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }

        const comboMultiplier = 1 + (this.combo - 1) * 0.2;
        const speedMultiplier = 1 + speed / CONFIG.MAX_SPEED * 0.5;

        for (const trick of this.currentTricks) {
            const score = Math.floor(
                trick.baseScore * 
                trick.difficulty * 
                comboMultiplier * 
                speedMultiplier
            );
            this.totalScore += score;
            this.completedTricks.push({
                ...trick,
                score: score,
                combo: this.combo,
                time: Date.now()
            });
        }

        this.lastTrickTime = Date.now();
        this.currentTricks = [];
    }

    failTricks() {
        this.combo = 0;
        this.currentTricks = [];
    }

    checkWheelieTrick(motorcycle) {
        if (motorcycle.wheelieTime > 1 && !this.currentTricks.find(t => t.id === 'wheelie')) {
            const wheelieScore = Math.floor(motorcycle.wheelieTime * 100);
            this.totalScore += wheelieScore;
            this.completedTricks.push({
                id: 'wheelie',
                name: '翘头',
                score: wheelieScore,
                time: Date.now()
            });
        }
        if (motorcycle.stoppieTime > 1 && !this.currentTricks.find(t => t.id === 'stoppie')) {
            const stoppieScore = Math.floor(motorcycle.stoppieTime * 100);
            this.totalScore += stoppieScore;
            this.completedTricks.push({
                id: 'stoppie',
                name: '翘尾',
                score: stoppieScore,
                time: Date.now()
            });
        }
    }

    arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        const sortedA = [...a].sort();
        const sortedB = [...b].sort();
        return sortedA.every((val, i) => val === sortedB[i]);
    }

    getScore() {
        return this.totalScore;
    }

    getCombo() {
        return this.combo;
    }

    getMaxCombo() {
        return this.maxCombo;
    }

    getCompletedTricksCount() {
        return this.completedTricks.length;
    }

    getCurrentTricks() {
        return this.currentTricks;
    }

    hasTrickInProgress() {
        return this.trickInProgress && this.currentTricks.length > 0;
    }

    getLastTrick() {
        if (this.completedTricks.length > 0) {
            return this.completedTricks[this.completedTricks.length - 1];
        }
        return null;
    }

    reset() {
        this.currentTricks = [];
        this.completedTricks = [];
        this.combo = 0;
        this.maxCombo = 0;
        this.totalScore = 0;
        this.trickInProgress = false;
    }

    getState() {
        return {
            currentTricks: this.currentTricks,
            completedTricks: this.completedTricks,
            combo: this.combo,
            maxCombo: this.maxCombo,
            totalScore: this.totalScore
        };
    }

    restoreState(state) {
        this.currentTricks = state.currentTricks || [];
        this.completedTricks = state.completedTricks || [];
        this.combo = state.combo || 0;
        this.maxCombo = state.maxCombo || 0;
        this.totalScore = state.totalScore || 0;
    }
}

const trickManager = new TrickManager();