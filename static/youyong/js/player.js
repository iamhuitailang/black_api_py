class Player {
    constructor(options = {}) {
        this.lane = options.lane || 0;
        this.name = options.name || '玩家';
        this.isAI = options.isAI || false;
        this.color = options.color || Config.COLORS.player;

        this.position = 0;
        this.lap = 1;
        this.direction = 1;
        this.speed = 0;
        this.maxSpeed = 0;
        this.avgSpeed = 0;
        this.distance = 0;

        this.stroke = options.stroke || 'freestyle';
        this.strokeConfig = Config.STROKES[this.stroke];

        this.stats = options.stats || this.getDefaultStats();
        this.stamina = this.stats.maxStamina;
        this.oxygen = Config.PLAYER.baseOxygen;

        this.isBreathing = false;
        this.breathPenaltyTimer = 0;
        this.isChoking = false;
        this.chokeTimer = 0;

        this.isTurning = false;
        this.turnProgress = 0;
        this.turnTimer = 0;
        this.turnTapCount = 0;
        this.turnQuality = 1;

        this.breathCount = 0;
        this.turnCount = 0;
        this.perfectTurnCount = 0;
        this.strokeCount = 0;

        this.finished = false;
        this.finishTime = 0;
        this.positionRank = 0;

        this.animFrame = 0;
        this.splashParticles = [];
    }

    getDefaultStats() {
        return {
            speed: Config.PLAYER.baseSpeed,
            maxStamina: Config.PLAYER.baseStamina,
            recovery: Config.PLAYER.baseRecovery,
            turnSpeed: Config.PLAYER.baseTurnSpeed,
            power: Config.PLAYER.basePower
        };
    }

    getStrokeEfficiency() {
        const staminaFactor = Math.max(0.3, this.stamina / this.stats.maxStamina);
        const oxygenFactor = this.strokeConfig.needsBreath ? Math.max(0.2, this.oxygen / 100) : 1;
        return staminaFactor * oxygenFactor;
    }

    getBaseSpeed() {
        return (this.stats.speed / 10) * this.strokeConfig.speedMultiplier;
    }

    update(dt, inputData = null) {
        if (this.finished) return;

        this.animFrame += dt * 10;

        if (this.isChoking) {
            this.chokeTimer -= dt;
            this.speed = 0;
            if (this.chokeTimer <= 0) {
                this.isChoking = false;
                this.oxygen = 30;
            }
            return;
        }

        if (this.isBreathing) {
            this.breathPenaltyTimer -= dt;
            if (this.breathPenaltyTimer <= 0) {
                this.isBreathing = false;
            }
        }

        if (this.isTurning) {
            this.updateTurning(dt);
            return;
        }

        if (inputData && !this.isAI) {
            this.handlePlayerInput(dt, inputData);
        } else if (this.isAI) {
            this.handleAI(dt);
        } else {
            this.applyNaturalDeceleration(dt);
        }

        this.updateOxygen(dt);
        this.updateStamina(dt);
        this.updatePosition(dt);
        this.checkTurn();
        this.updateParticles(dt);
    }

    handlePlayerInput(dt, inputData) {
        if (inputData.type === 'stroke') {
            this.performStroke(inputData.rhythm);
        }
    }

    performStroke(rhythmBonus = 1) {
        this.strokeCount++;

        const baseSpeed = this.getBaseSpeed();
        const efficiency = this.getStrokeEfficiency();
        const powerMultiplier = this.stats.power;

        let targetSpeed = baseSpeed * rhythmBonus * efficiency * powerMultiplier;

        if (this.isBreathing) {
            targetSpeed *= Config.PLAYER.breathPenaltySpeed;
        }

        this.speed = Math.min(this.speed + targetSpeed * 0.5, baseSpeed * powerMultiplier * 2);
        this.maxSpeed = Math.max(this.maxSpeed, this.speed);

        const staminaCost = this.strokeConfig.staminaCost * (0.5 + Math.abs(this.speed - baseSpeed) / baseSpeed * 0.5);
        this.stamina = Math.max(0, this.stamina - staminaCost);

        this.createSplash();
    }

    handleAI(dt) {
        if (!this.aiController) return;

        const decision = this.aiController.decide(dt, this);

        if (decision.stroke) {
            this.performStroke(decision.rhythm || 1);
        }

        if (decision.breathe && this.strokeConfig.needsBreath) {
            this.breathe();
        }

        if (decision.turn) {
            this.startTurn();
        }

        this.applyNaturalDeceleration(dt * 0.5);
    }

    applyNaturalDeceleration(dt) {
        const drag = 0.99;
        this.speed *= Math.pow(drag, dt * 60);
        if (this.speed < 0.1) this.speed = 0;
    }

    updateOxygen(dt) {
        if (!this.strokeConfig.needsBreath) return;
        if (this.isBreathing) return;

        const depletionRate = Config.PLAYER.oxygenDepletionRate * this.strokeConfig.oxygenCost;
        const activityFactor = 1 + this.speed * 0.5;

        this.oxygen -= depletionRate * activityFactor * dt;
        this.oxygen = Math.max(0, this.oxygen);

        if (this.oxygen <= 0 && !this.isChoking) {
            this.startChoking();
        }
    }

    updateStamina(dt) {
        if (this.speed < 0.3) {
            const recoveryRate = this.stats.recovery * (1 - this.speed);
            this.stamina = Math.min(this.stats.maxStamina, this.stamina + recoveryRate * dt);
        }
    }

    updatePosition(dt) {
        const poolLength = Config.GAME.POOL_LENGTH;
        this.position += this.speed * this.direction * dt;

        this.distance += Math.abs(this.speed * dt);

        if (this.position >= poolLength || this.position <= 0) {
            this.position = Math.max(0, Math.min(poolLength, this.position));
        }

        const totalDistance = this.distance;
        const raceDistance = Config.GAME.POOL_LENGTH * Config.GAME.TOTAL_LAPS;
        this.avgSpeed = this.distance / Math.max(0.01, this.getRaceTime());
    }

    checkTurn() {
        const poolLength = Config.GAME.POOL_LENGTH;
        const atEdge = (this.direction > 0 && this.position >= poolLength - 1) ||
                      (this.direction < 0 && this.position <= 1);

        if (atEdge && !this.isTurning && !this.finished) {
            if (this.lap >= Config.GAME.TOTAL_LAPS && this.direction > 0 && this.position >= poolLength - 0.5) {
                this.finish();
            } else {
                this.startTurn();
            }
        }
    }

    startTurn() {
        this.isTurning = true;
        this.turnProgress = 0;
        this.turnTimer = Config.TURN.timeLimit;
        this.turnTapCount = 0;
        this.speed *= 0.3;
        this.turnCount++;
    }

    updateTurning(dt) {
        this.turnTimer -= dt;

        if (this.turnTimer <= 0 || this.turnTapCount >= Config.TURN.requiredTaps) {
            this.completeTurn();
        }
    }

    addTurnTap() {
        if (!this.isTurning) return;

        this.turnTapCount++;
        this.turnProgress = this.turnTapCount / Config.TURN.requiredTaps;

        const timeUsed = Config.TURN.timeLimit - this.turnTimer;
        const speedBonus = Math.max(0.8, 1 + (1 - timeUsed / Config.TURN.timeLimit) * 0.5);
        this.turnQuality = Math.min(1.3, this.turnProgress * speedBonus);
    }

    completeTurn() {
        this.isTurning = false;
        this.direction *= -1;
        this.position = this.direction > 0 ? 0.5 : Config.GAME.POOL_LENGTH - 0.5;

        if (this.direction < 0) {
            this.lap++;
        }

        if (this.turnQuality >= 1.2) {
            this.perfectTurnCount++;
        }

        this.speed = this.getBaseSpeed() * this.stats.power * this.turnQuality * 0.8;
        this.turnQuality = 1;
    }

    breathe() {
        if (this.isBreathing || this.isChoking || !this.strokeConfig.needsBreath) return;
        if (this.oxygen >= 90) return;

        this.isBreathing = true;
        this.breathPenaltyTimer = Config.PLAYER.breathPenaltyTime;
        this.oxygen = Math.min(100, this.oxygen + Config.PLAYER.breathRecovery);
        this.breathCount++;
    }

    startChoking() {
        this.isChoking = true;
        this.chokeTimer = Config.PLAYER.chokePenaltyTime;
        this.speed = 0;
    }

    finish() {
        this.finished = true;
        this.speed = 0;
    }

    getRaceTime() {
        return this.finishTime || (performance.now() / 1000 - (this.startTime || 0));
    }

    getProgress() {
        const totalDistance = Config.GAME.POOL_LENGTH * Config.GAME.TOTAL_LAPS;
        const currentDistance = (this.lap - 1) * Config.GAME.POOL_LENGTH +
            (this.direction > 0 ? this.position : Config.GAME.POOL_LENGTH - this.position);
        return Math.min(1, currentDistance / totalDistance);
    }

    createSplash() {
        for (let i = 0; i < 5; i++) {
            this.splashParticles.push({
                x: this.position,
                y: this.lane * 20 + 10,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 1) * 3,
                life: 0.5,
                maxLife: 0.5,
                size: Math.random() * 3 + 2
            });
        }
    }

    updateParticles(dt) {
        for (let i = this.splashParticles.length - 1; i >= 0; i--) {
            const p = this.splashParticles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 5 * dt;
            p.life -= dt;

            if (p.life <= 0) {
                this.splashParticles.splice(i, 1);
            }
        }
    }

    getState() {
        return {
            lane: this.lane,
            name: this.name,
            isAI: this.isAI,
            color: this.color,
            position: this.position,
            lap: this.lap,
            direction: this.direction,
            speed: this.speed,
            maxSpeed: this.maxSpeed,
            avgSpeed: this.avgSpeed,
            distance: this.distance,
            stroke: this.stroke,
            stats: this.stats,
            stamina: this.stamina,
            oxygen: this.oxygen,
            isBreathing: this.isBreathing,
            breathPenaltyTimer: this.breathPenaltyTimer,
            isChoking: this.isChoking,
            chokeTimer: this.chokeTimer,
            isTurning: this.isTurning,
            turnProgress: this.turnProgress,
            turnTimer: this.turnTimer,
            turnTapCount: this.turnTapCount,
            turnQuality: this.turnQuality,
            breathCount: this.breathCount,
            turnCount: this.turnCount,
            perfectTurnCount: this.perfectTurnCount,
            strokeCount: this.strokeCount,
            finished: this.finished,
            finishTime: this.finishTime,
            positionRank: this.positionRank,
            startTime: this.startTime
        };
    }

    loadState(state) {
        Object.assign(this, state);
        this.strokeConfig = Config.STROKES[this.stroke];
    }

    reset() {
        this.position = 0;
        this.lap = 1;
        this.direction = 1;
        this.speed = 0;
        this.maxSpeed = 0;
        this.avgSpeed = 0;
        this.distance = 0;
        this.stamina = this.stats.maxStamina;
        this.oxygen = Config.PLAYER.baseOxygen;
        this.isBreathing = false;
        this.breathPenaltyTimer = 0;
        this.isChoking = false;
        this.chokeTimer = 0;
        this.isTurning = false;
        this.turnProgress = 0;
        this.turnTimer = 0;
        this.turnTapCount = 0;
        this.turnQuality = 1;
        this.breathCount = 0;
        this.turnCount = 0;
        this.perfectTurnCount = 0;
        this.strokeCount = 0;
        this.finished = false;
        this.finishTime = 0;
        this.positionRank = 0;
        this.startTime = 0;
        this.splashParticles = [];
    }
}
