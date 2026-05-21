class Player {
    constructor(options = {}) {
        this.id = options.id || 'player';
        this.name = options.name || '少年骑手';
        this.lane = options.lane || 1;
        this.targetLane = this.lane;
        this.distance = options.distance || 0;
        this.speed = 0;
        this.targetSpeed = CONFIG.SPEED.NORMAL;
        this.tilt = 0;
        this.balance = 0;
        this.isFallen = false;
        this.fallTimer = 0;
        this.color = options.color || CONFIG.COLORS.PLAYER;

        this.item = null;
        this.effects = {
            boost: 0,
            shield: 0
        };

        this.x = 0;
        this.y = 0;
        this.width = 40;
        this.height = 70;

        this.isAI = false;
        this.finished = false;
        this.finishTime = 0;
        
        this.laneChangeCooldown = 0;
    }

    update(deltaTime, track, keys) {
        if (this.finished) return;

        if (this.laneChangeCooldown > 0) {
            this.laneChangeCooldown -= deltaTime;
            if (this.laneChangeCooldown < 0) this.laneChangeCooldown = 0;
        }

        if (this.isFallen) {
            this.fallTimer -= deltaTime;
            if (this.fallTimer <= 0) {
                this.isFallen = false;
                this.balance = 0;
            }
            this.speed *= 0.95;
            return;
        }

        this.handleInput(keys);
        this.updateSpeed(deltaTime);
        this.updateLane(deltaTime);
        this.updateBalance(deltaTime);
        this.updateEffects(deltaTime);

        this.distance += this.speed * (deltaTime / 16);

        if (this.distance >= CONFIG.GAME.TRACK_LENGTH) {
            this.finished = true;
            this.finishTime = Date.now();
        }
    }

    handleInput(keys) {
        if (this.isAI) return;

        if (this.laneChangeCooldown <= 0) {
            if (keys['ArrowLeft'] && this.targetLane > 0) {
                this.targetLane--;
                keys['ArrowLeft'] = false;
                this.laneChangeCooldown = 250;
            }
            if (keys['ArrowRight'] && this.targetLane < CONFIG.GAME.LANES - 1) {
                this.targetLane++;
                keys['ArrowRight'] = false;
                this.laneChangeCooldown = 250;
            }
        }

        if (keys['ArrowUp']) {
            this.tilt = Utils.lerp(this.tilt, CONFIG.TILT.FAST, CONFIG.TILT.TILT_SPEED);
            this.targetSpeed = CONFIG.SPEED.FAST;
        } else if (keys['ArrowDown']) {
            this.tilt = Utils.lerp(this.tilt, -CONFIG.TILT.SLOW, CONFIG.TILT.TILT_SPEED);
            this.targetSpeed = CONFIG.SPEED.SLOW;
        } else {
            this.tilt = Utils.lerp(this.tilt, CONFIG.TILT.NORMAL, CONFIG.TILT.TILT_SPEED * 0.5);
            this.targetSpeed = CONFIG.SPEED.NORMAL;
        }
    }

    updateSpeed(deltaTime) {
        let speedMultiplier = 1;
        if (this.effects.boost > 0) {
            speedMultiplier = CONFIG.SPEED.BOOST_MULTIPLIER;
        }

        const targetSpeed = this.targetSpeed * speedMultiplier;
        this.speed = Utils.lerp(this.speed, targetSpeed, 0.05);
    }

    updateLane(deltaTime) {
        this.lane = Utils.lerp(this.lane, this.targetLane, 0.15);
    }

    updateBalance(deltaTime) {
        const tiltFactor = Math.abs(this.tilt);
        this.balance += (tiltFactor - CONFIG.TILT.BALANCE_RECOVERY) * 0.02;
        this.balance = Utils.clamp(this.balance, -CONFIG.TILT.MAX_BALANCE, CONFIG.TILT.MAX_BALANCE);

        if (Math.abs(this.balance) >= CONFIG.TILT.MAX_BALANCE) {
            this.fall();
        }
    }

    updateEffects(deltaTime) {
        if (this.effects.boost > 0) {
            this.effects.boost -= deltaTime;
        }
        if (this.effects.shield > 0) {
            this.effects.shield -= deltaTime;
        }
    }

    fall() {
        this.isFallen = true;
        this.fallTimer = 1500;
        this.balance = 0;
    }

    pickupItem(itemType) {
        if (!this.item) {
            this.item = itemType;
            return true;
        }
        return false;
    }

    useItem() {
        if (!this.item) return null;
        
        const item = this.item;
        this.item = null;
        return item;
    }

    applyEffect(effectType, duration) {
        if (effectType === 'boost') {
            this.effects.boost = duration;
        } else if (effectType === 'shield') {
            this.effects.shield = duration;
        }
    }

    hasShield() {
        return this.effects.shield > 0;
    }

    hitObstacle(obstacleType) {
        if (this.hasShield()) {
            this.effects.shield = 0;
            return false;
        }

        switch (obstacleType) {
            case 'gravel':
                this.speed *= CONFIG.OBSTACLES.GRAVEL_SPEED_PENALTY;
                break;
            case 'slope':
                this.balance += CONFIG.OBSTACLES.SLOPE_BALANCE_PENALTY * 20;
                break;
            case 'barrier':
                this.speed = 0;
                this.fall();
                break;
            case 'wind':
                this.targetLane += Math.random() > 0.5 ? 1 : -1;
                this.targetLane = Utils.clamp(this.targetLane, 0, CONFIG.GAME.LANES - 1);
                break;
        }
        return true;
    }

    getState() {
        return {
            id: this.id,
            name: this.name,
            lane: this.lane,
            targetLane: this.targetLane,
            distance: this.distance,
            speed: this.speed,
            targetSpeed: this.targetSpeed,
            tilt: this.tilt,
            balance: this.balance,
            isFallen: this.isFallen,
            fallTimer: this.fallTimer,
            item: this.item,
            effects: { ...this.effects },
            isAI: this.isAI,
            finished: this.finished,
            finishTime: this.finishTime,
            laneChangeCooldown: this.laneChangeCooldown
        };
    }

    loadState(state) {
        Object.assign(this, state);
        this.effects = { ...state.effects };
        this.laneChangeCooldown = state.laneChangeCooldown || 0;
    }
}
