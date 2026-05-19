class Boat {
    constructor(boatType, lane, name, isPlayer = false) {
        this.config = GameConfig.BOATS[boatType];
        this.boatType = boatType;
        this.name = name;
        this.isPlayer = isPlayer;

        this.lane = lane;
        this.targetLane = lane;
        this.x = GameConfig.LANE_START_X + lane * GameConfig.LANE_WIDTH + GameConfig.LANE_WIDTH / 2;
        this.targetX = this.x;
        this.y = 0;
        this.progress = 0;
        this.speed = GameConfig.BASE_SPEED;
        this.maxSpeed = GameConfig.MAX_SPEED * this.config.speedMultiplier;

        this.sprintActive = false;
        this.sprintEndTime = 0;
        this.shieldActive = false;
        this.shieldEndTime = 0;

        this.sprintCooldown = 0;
        this.shieldCooldown = 0;

        this.combo = 0;
        this.lastPaddleTime = 0;
        this.rhythmPosition = 0;
        this.rhythmDirection = 1;

        this.aiReactionTimer = 0;
        this.aiSkillLevel = GameConfig.AI.BASE_SKILL + (Math.random() - 0.5) * GameConfig.AI.SKILL_VARIANCE;
        this.aiNextAction = 0;

        this.finished = false;
        this.finishTime = null;

        this.hitEffect = 0;
    }

    update(deltaTime, gameState) {
        if (this.finished) return;

        const now = Date.now();
        const dt = Math.min(deltaTime, 50) / 16.67;

        if (this.sprintActive && now > this.sprintEndTime) {
            this.sprintActive = false;
        }
        if (this.shieldActive && now > this.shieldEndTime) {
            this.shieldActive = false;
        }

        if (this.sprintCooldown > 0) {
            this.sprintCooldown = Math.max(0, this.sprintCooldown - deltaTime);
        }
        if (this.shieldCooldown > 0) {
            this.shieldCooldown = Math.max(0, this.shieldCooldown - deltaTime);
        }

        if (this.hitEffect > 0) {
            this.hitEffect -= deltaTime;
        }

        this.rhythmPosition += GameConfig.RHYTHM.SWING_SPEED * dt * this.rhythmDirection;
        if (this.rhythmPosition >= 1) {
            this.rhythmPosition = 1;
            this.rhythmDirection = -1;
        } else if (this.rhythmPosition <= 0) {
            this.rhythmPosition = 0;
            this.rhythmDirection = 1;
        }

        this.speed *= Math.pow(GameConfig.SPEED_DECAY, dt);

        const minSpeed = GameConfig.BASE_SPEED * 0.4;
        let currentMaxSpeed = this.maxSpeed;
        if (this.sprintActive) {
            currentMaxSpeed = this.maxSpeed * GameConfig.SKILLS.sprint.speedBoost;
        }

        this.speed = Math.max(minSpeed, Math.min(this.speed, currentMaxSpeed));

        this.progress += this.speed * 0.002 * dt;

        this.targetX = GameConfig.LANE_START_X + this.targetLane * GameConfig.LANE_WIDTH + GameConfig.LANE_WIDTH / 2;
        this.x += (this.targetX - this.x) * 0.15 * dt;

        if (this.progress >= GameConfig.GAME_LENGTH) {
            this.finished = true;
            this.finishTime = now;
        }
    }

    paddle(paddleType, rhythmQuality) {
        const now = Date.now();
        const timeSinceLastPaddle = now - this.lastPaddleTime;

        let boost = paddleType.boost;

        if (rhythmQuality === 'perfect') {
            boost *= GameConfig.RHYTHM.PERFECT_MULTIPLIER;
            this.combo++;
        } else if (rhythmQuality === 'good') {
            boost *= GameConfig.RHYTHM.GOOD_MULTIPLIER;
            this.combo = Math.max(0, this.combo - 1);
        } else {
            boost *= GameConfig.RHYTHM.MISS_MULTIPLIER;
            this.combo = 0;
        }

        if (this.combo > 0) {
            boost *= (1 + this.combo * 0.05);
        }

        this.speed += boost * this.config.acceleration;
        this.lastPaddleTime = now;

        return { boost, rhythmQuality, combo: this.combo };
    }

    changeLane(direction) {
        const newLane = this.targetLane + direction;
        if (newLane >= 0 && newLane < GameConfig.LANES) {
            this.targetLane = newLane;
            return true;
        }
        return false;
    }

    activateSprint() {
        if (this.sprintCooldown <= 0 && !this.sprintActive) {
            this.sprintActive = true;
            this.sprintEndTime = Date.now() + GameConfig.SKILLS.sprint.duration;
            this.sprintCooldown = GameConfig.SKILLS.sprint.cooldown;
            return true;
        }
        return false;
    }

    activateShield() {
        if (this.shieldCooldown <= 0 && !this.shieldActive) {
            this.shieldActive = true;
            this.shieldEndTime = Date.now() + GameConfig.SKILLS.shield.duration;
            this.shieldCooldown = GameConfig.SKILLS.shield.cooldown;
            return true;
        }
        return false;
    }

    hitObstacle(obstacle) {
        if (this.shieldActive) {
            return { blocked: true };
        }

        const reduction = obstacle.speedReduction / this.config.obstacleResistance;
        this.speed *= (1 - reduction);
        this.hitEffect = 500;
        this.combo = 0;

        return { blocked: false, damage: obstacle.damage, reduction };
    }

    getRhythmQuality() {
        const pos = this.rhythmPosition;
        const [perfectStart, perfectEnd] = GameConfig.RHYTHM.PERFECT_ZONE;
        const [goodStart, goodEnd] = GameConfig.RHYTHM.GOOD_ZONE;

        if (pos >= perfectStart && pos <= perfectEnd) {
            return 'perfect';
        } else if (pos >= goodStart && pos <= goodEnd) {
            return 'good';
        }
        return 'miss';
    }

    updateAI(deltaTime, obstacles, otherBoats) {
        if (this.finished || this.isPlayer) return;

        const dt = Math.min(deltaTime, 50) / 16.67;
        this.aiReactionTimer -= deltaTime;

        if (this.aiReactionTimer <= 0) {
            this.aiReactionTimer = GameConfig.AI.REACTION_TIME;

            const currentLaneObstacles = obstacles.filter(o =>
                o.lane === this.targetLane &&
                Math.abs(o.progress - this.progress) < 50 &&
                o.progress > this.progress
            );

            if (currentLaneObstacles.length > 0) {
                const leftLane = this.targetLane - 1;
                const rightLane = this.targetLane + 1;

                const leftHasObstacle = leftLane >= 0 && obstacles.some(o =>
                    o.lane === leftLane && Math.abs(o.progress - this.progress) < 50 && o.progress > this.progress
                );

                const rightHasObstacle = rightLane < GameConfig.LANES && obstacles.some(o =>
                    o.lane === rightLane && Math.abs(o.progress - this.progress) < 50 && o.progress > this.progress
                );

                if (!leftHasObstacle && leftLane >= 0) {
                    this.changeLane(-1);
                } else if (!rightHasObstacle && rightLane < GameConfig.LANES) {
                    this.changeLane(1);
                }
            }

            if (Math.random() < GameConfig.AI.OVERTAKE_CHANCE * this.aiSkillLevel) {
                const fasterBoat = otherBoats.find(b =>
                    b.progress > this.progress &&
                    b.progress - this.progress < 30 &&
                    b.targetLane !== this.targetLane
                );

                if (fasterBoat && Math.random() < 0.5) {
                    const direction = fasterBoat.targetLane > this.targetLane ? 1 : -1;
                    const newLane = this.targetLane + direction;
                    if (newLane >= 0 && newLane < GameConfig.LANES) {
                        this.changeLane(direction);
                    }
                }
            }
        }

        if (Math.random() < 0.06 * this.aiSkillLevel * dt) {
            const quality = Math.random();
            let rhythmQuality;
            if (quality < 0.35) {
                rhythmQuality = 'perfect';
            } else if (quality < 0.75) {
                rhythmQuality = 'good';
            } else {
                rhythmQuality = 'miss';
            }

            const paddleTypes = ['LIGHT', 'MEDIUM', 'MEDIUM', 'HEAVY'];
            const paddleType = GameConfig.PADDLE_TYPES[paddleTypes[Math.floor(Math.random() * paddleTypes.length)]];
            this.paddle(paddleType, rhythmQuality);
        }

        if (Math.random() < 0.005 * dt && this.sprintCooldown <= 0) {
            this.activateSprint();
        }
    }

    getSpeedKmh() {
        return Math.round(this.speed * 0.3);
    }

    getSprintCooldownPercent() {
        return this.sprintCooldown / GameConfig.SKILLS.sprint.cooldown;
    }

    getShieldCooldownPercent() {
        return this.shieldCooldown / GameConfig.SKILLS.shield.cooldown;
    }

    toJSON() {
        return {
            boatType: this.boatType,
            name: this.name,
            isPlayer: this.isPlayer,
            lane: this.lane,
            targetLane: this.targetLane,
            x: this.x,
            targetX: this.targetX,
            progress: this.progress,
            speed: this.speed,
            finished: this.finished,
            finishTime: this.finishTime,
            combo: this.combo,
            sprintActive: this.sprintActive,
            shieldActive: this.shieldActive,
            sprintCooldown: this.sprintCooldown,
            shieldCooldown: this.shieldCooldown
        };
    }

    static fromJSON(data) {
        const boat = new Boat(data.boatType, data.lane, data.name, data.isPlayer);
        Object.assign(boat, data);
        return boat;
    }
}
