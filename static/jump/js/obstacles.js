class ObstacleSystem {
    constructor() {
        this.obstacles = [];
        this.rewards = [];
        this.lastObstacleSpawn = 0;
        this.lastRewardSpawn = 0;
        this.activeEffects = [];
        this.densityMultiplier = 1.0;
    }
    
    init() {
        this.obstacles = [];
        this.rewards = [];
        this.lastObstacleSpawn = Date.now();
        this.lastRewardSpawn = Date.now();
        this.activeEffects = [];
        this.densityMultiplier = 1.0;
    }
    
    update(player, deltaTime) {
        const now = Date.now();
        
        const adjustedSpawnInterval = CONFIG.OBSTACLES.SPAWN_INTERVAL / this.densityMultiplier;
        if (now - this.lastObstacleSpawn > adjustedSpawnInterval && this.obstacles.length < CONFIG.OBSTACLES.MAX_ACTIVE) {
            this.spawnObstacle(player.altitude);
            this.lastObstacleSpawn = now;
        }
        
        if (now - this.lastRewardSpawn > CONFIG.REWARDS.SPAWN_INTERVAL) {
            this.spawnReward(player.altitude);
            this.lastRewardSpawn = now;
        }
        
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            
            if (obs.type === 'BIRD' || obs.type === 'BALLOON') {
                obs.x += Math.sin(now / 500 + i) * 0.5;
            }
            
            if (obs.worldY > player.altitude + 200 || obs.worldY < player.altitude - 800) {
                this.obstacles.splice(i, 1);
            }
        }
        
        for (let i = this.rewards.length - 1; i >= 0; i--) {
            const reward = this.rewards[i];
            
            if (reward.worldY > player.altitude + 200 || reward.worldY < player.altitude - 600) {
                this.rewards.splice(i, 1);
            }
        }
        
        this.activeEffects = this.activeEffects.filter(effect => {
            effect.remainingTime -= deltaTime;
            return effect.remainingTime > 0;
        });
    }
    
    spawnObstacle(altitude) {
        const availableTypes = [];
        
        for (const [type, config] of Object.entries(CONFIG.OBSTACLES.TYPES)) {
            if (altitude >= config.minAlt && altitude <= config.maxAlt) {
                availableTypes.push(type);
            }
        }
        
        if (availableTypes.length === 0) return;
        
        const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        const config = CONFIG.OBSTACLES.TYPES[type];
        
        const obstacle = {
            id: Date.now() + Math.random(),
            type,
            x: Utils.randomRange(100, CONFIG.GAME.WORLD_WIDTH - 100),
            y: 0,
            worldY: altitude - Utils.randomRange(50, 300),
            radius: config.radius,
            speed: config.speed,
            emoji: config.emoji,
            effect: config.effect,
            rotation: 0
        };
        
        this.obstacles.push(obstacle);
    }
    
    spawnReward(altitude) {
        const availableTypes = [];
        
        for (const [type, config] of Object.entries(CONFIG.REWARDS.TYPES)) {
            if (altitude >= config.minAlt && altitude <= config.maxAlt) {
                availableTypes.push(type);
            }
        }
        
        if (availableTypes.length === 0) return;
        
        const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        const config = CONFIG.REWARDS.TYPES[type];
        
        const reward = {
            id: Date.now() + Math.random(),
            type,
            x: Utils.randomRange(100, CONFIG.GAME.WORLD_WIDTH - 100),
            y: 0,
            worldY: altitude - Utils.randomRange(50, 200),
            radius: config.radius,
            speed: 0.2,
            emoji: config.emoji,
            effect: config.effect,
            duration: config.duration,
            rotation: 0,
            pulsePhase: 0
        };
        
        this.rewards.push(reward);
    }
    
    checkCollisions(player, windSystem) {
        const playerObj = { x: player.x, y: player.altitude, radius: 30 };
        
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            const obsObj = { x: obs.x, y: obs.worldY, radius: obs.radius };
            
            if (Physics.checkCollision(playerObj, obsObj)) {
                this.handleObstacleCollision(player, obs, windSystem);
                if (obs.effect !== 'vision') {
                    this.obstacles.splice(i, 1);
                }
            }
        }
        
        for (let i = this.rewards.length - 1; i >= 0; i--) {
            const reward = this.rewards[i];
            const rewardObj = { x: reward.x, y: reward.worldY, radius: reward.radius };
            
            if (Physics.checkCollision(playerObj, rewardObj)) {
                this.handleRewardCollision(player, reward, windSystem);
                this.rewards.splice(i, 1);
            }
        }
    }
    
    handleObstacleCollision(player, obstacle, windSystem) {
        switch (obstacle.effect) {
            case 'knockback':
                const direction = player.x < obstacle.x ? -1 : 1;
                Physics.applyKnockback(player, direction, 8);
                break;
            case 'turbulence':
                Physics.applyTurbulence(player, 500);
                break;
            case 'death':
                player.isDead = true;
                player.deathReason = '撞上了热气球!';
                break;
        }
    }
    
    handleRewardCollision(player, reward, windSystem) {
        switch (reward.effect) {
            case 'speedBoost':
                this.addEffect('speedBoost', 1.5, reward.duration);
                break;
            case 'tailwind':
                windSystem.addEffect('tailwind', 1.5, reward.duration);
                this.addEffect('tailwind', 1, reward.duration);
                break;
            case 'magnet':
                player.hasMagnet = true;
                this.addEffect('magnet', 1, reward.duration);
                setTimeout(() => {
                    player.hasMagnet = false;
                }, reward.duration);
                break;
        }
    }
    
    addEffect(type, multiplier, duration) {
        this.activeEffects.push({
            type,
            multiplier,
            remainingTime: duration,
            startTime: Date.now()
        });
    }
    
    hasEffect(type) {
        return this.activeEffects.some(e => e.type === type);
    }
    
    getEffectMultiplier(type) {
        const effect = this.activeEffects.find(e => e.type === type);
        return effect ? effect.multiplier : 1;
    }
    
    getObstaclesInView(player, viewHeight) {
        return this.obstacles.filter(obs => {
            return obs.worldY > player.altitude - 1000 && obs.worldY < player.altitude + 200;
        });
    }
    
    getRewardsInView(player, viewHeight) {
        return this.rewards.filter(reward => {
            return reward.worldY > player.altitude - 800 && reward.worldY < player.altitude + 200;
        });
    }
    
    serialize() {
        return {
            obstacles: [...this.obstacles],
            rewards: [...this.rewards],
            lastObstacleSpawn: this.lastObstacleSpawn,
            lastRewardSpawn: this.lastRewardSpawn,
            activeEffects: [...this.activeEffects]
        };
    }
    
    deserialize(data) {
        if (!data) return;
        this.obstacles = data.obstacles || [];
        this.rewards = data.rewards || [];
        this.lastObstacleSpawn = data.lastObstacleSpawn || Date.now();
        this.lastRewardSpawn = data.lastRewardSpawn || Date.now();
        this.activeEffects = data.activeEffects || [];
    }
}
