class AIPlayer extends Player {
    constructor(options) {
        super(options);
        this.isAI = true;
        this.behavior = 'CRUISE';
        this.behaviorTimer = 0;
        this.skillLevel = options.skillLevel || Utils.random(0.8, 1.0);
        this.reactionTimer = 0;
        this.decisionCooldown = 0;
    }

    update(deltaTime, game, keys, allPlayers) {
        if (this.finished) return;

        this.updateAI(deltaTime, game, allPlayers);
        super.update(deltaTime, game, {});
    }

    updateAI(deltaTime, game, allPlayers) {
        if (this.isFallen) return;

        this.decisionCooldown -= deltaTime;
        this.behaviorTimer -= deltaTime;

        if (this.behaviorTimer <= 0 || this.decisionCooldown <= 0) {
            this.decideBehavior(allPlayers, game);
        }

        this.executeBehavior(allPlayers, game);
    }

    decideBehavior(allPlayers, game) {
        const playerRank = this.getRank(allPlayers);
        const progress = this.distance / CONFIG.GAME.TRACK_LENGTH;

        let weights = { ...CONFIG.AI.BEHAVIOR };

        if (progress > 0.7) {
            weights.SPRINT = 0.5;
            weights.CRUISE = 0.2;
        }

        if (playerRank > 1) {
            weights.OVERTAKE += playerRank * 0.15;
        }

        const nearObstacle = this.findNearbyObstacle(game);
        if (nearObstacle) {
            weights.EVADE = 0.5;
            weights.CRUISE = 0.2;
        }

        if (this.item && Math.random() < 0.5) {
            weights.ITEM = 0.5;
        }

        this.behavior = Utils.weightRandom(weights).toUpperCase();
        this.behaviorTimer = Utils.random(400, 1500);
        this.decisionCooldown = Utils.random(200, 600);
    }

    executeBehavior(allPlayers, game) {
        const speedBoost = CONFIG.AI.BASE_SPEED_BOOST || 1;
        switch (this.behavior) {
            case 'IDLE':
                this.targetSpeed = CONFIG.SPEED.NORMAL * this.skillLevel * speedBoost * 0.8;
                this.tilt = Utils.lerp(this.tilt, CONFIG.TILT.NORMAL * 0.5, 0.05);
                break;

            case 'CRUISE':
                this.targetSpeed = CONFIG.SPEED.NORMAL * this.skillLevel * speedBoost;
                this.tilt = Utils.lerp(this.tilt, CONFIG.TILT.NORMAL, 0.03);
                this.stayInLane();
                this.tryPickupItem(allPlayers, game);
                break;

            case 'OVERTAKE':
                this.targetSpeed = CONFIG.SPEED.FAST * this.skillLevel * speedBoost;
                this.tilt = Utils.lerp(this.tilt, CONFIG.TILT.FAST, 0.05);
                this.tryOvertake(allPlayers);
                break;

            case 'EVADE':
                this.targetSpeed = CONFIG.SPEED.NORMAL * this.skillLevel * speedBoost * 0.7;
                this.tilt = Utils.lerp(this.tilt, CONFIG.TILT.SLOW, 0.05);
                this.evadeObstacle(game);
                break;

            case 'ITEM':
                this.useAIItem(allPlayers, game);
                this.behavior = 'CRUISE';
                break;

            case 'SPRINT':
                this.targetSpeed = CONFIG.SPEED.FAST * this.skillLevel * speedBoost * 1.15;
                this.tilt = Utils.lerp(this.tilt, CONFIG.TILT.FAST * 1.1, 0.04);
                break;
        }
    }

    tryPickupItem(allPlayers, game) {
        if (!game.itemManager) return;
        
        for (const item of game.itemManager.items) {
            if (item.collected) continue;
            const distDiff = item.distance - this.distance;
            if (distDiff > 0 && distDiff < 100) {
                const laneDiff = Math.abs(Math.round(this.lane) - item.lane);
                if (laneDiff <= 1) {
                    this.targetLane = item.lane;
                }
            }
        }
    }

    useAIItem(allPlayers, game) {
        const item = this.useItem();
        if (!item) return;

        switch (item) {
            case 'boost':
                this.applyEffect('boost', CONFIG.ITEMS.BOOST_DURATION);
                break;
            case 'shield':
                this.applyEffect('shield', CONFIG.ITEMS.SHIELD_DURATION);
                break;
            case 'bomb':
                if (game.itemManager) {
                    game.itemManager.useBomb(this, allPlayers);
                }
                break;
            case 'trap':
                if (game.itemManager) {
                    game.itemManager.placeTrap(this);
                }
                break;
        }
    }

    stayInLane() {
        if (Math.abs(this.lane - this.targetLane) < 0.1) {
            if (Math.random() < 0.02) {
                const offset = Utils.randomInt(-1, 1);
                this.targetLane = Utils.clamp(Math.round(this.lane) + offset, 0, CONFIG.GAME.LANES - 1);
            }
        }
    }

    tryOvertake(allPlayers) {
        const aheadPlayer = this.findPlayerAhead(allPlayers);
        if (aheadPlayer) {
            const targetLane = this.findEmptyLane(allPlayers, aheadPlayer.lane);
            if (targetLane !== -1) {
                this.targetLane = targetLane;
            }
        }
    }

    findPlayerAhead(allPlayers) {
        let closest = null;
        let minDistance = Infinity;

        for (const player of allPlayers) {
            if (player === this || player.finished) continue;
            const distDiff = player.distance - this.distance;
            if (distDiff > 0 && distDiff < 200 && distDiff < minDistance) {
                minDistance = distDiff;
                closest = player;
            }
        }

        return closest;
    }

    findEmptyLane(allPlayers, excludeLane) {
        const lanes = [0, 1, 2].filter(l => l !== excludeLane && l !== Math.round(this.lane));
        
        for (const lane of lanes) {
            let isSafe = true;
            for (const player of allPlayers) {
                if (player === this) continue;
                const distDiff = Math.abs(player.distance - this.distance);
                if (Math.round(player.lane) === lane && distDiff < 100) {
                    isSafe = false;
                    break;
                }
            }
            if (isSafe) return lane;
        }

        return -1;
    }

    findNearbyObstacle(game) {
        const lookAhead = 150;
        const obstacles = game.obstacleManager ? game.obstacleManager.obstacles : [];
        for (const obstacle of obstacles) {
            const distDiff = obstacle.distance - this.distance;
            if (distDiff > 0 && distDiff < lookAhead && Math.round(this.lane) === obstacle.lane) {
                return obstacle;
            }
        }
        return null;
    }

    evadeObstacle(game) {
        const obstacle = this.findNearbyObstacle(game);
        if (obstacle) {
            const currentLane = Math.round(this.lane);
            if (currentLane === obstacle.lane) {
                const safeLane = currentLane === 0 ? 1 : (currentLane === 2 ? 1 : (Math.random() > 0.5 ? 0 : 2));
                this.targetLane = safeLane;
            }
        }
    }

    getRank(allPlayers) {
        const sorted = [...allPlayers].sort((a, b) => b.distance - a.distance);
        return sorted.indexOf(this) + 1;
    }

    getState() {
        const state = super.getState();
        state.behavior = this.behavior;
        state.behaviorTimer = this.behaviorTimer;
        state.skillLevel = this.skillLevel;
        return state;
    }

    loadState(state) {
        super.loadState(state);
        this.behavior = state.behavior || 'CRUISE';
        this.behaviorTimer = state.behaviorTimer || 0;
        this.skillLevel = state.skillLevel || 0.9;
    }
}
