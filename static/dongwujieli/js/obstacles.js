const ObstacleSystem = {
    obstacles: [],
    relayPoints: [],
    dynamicTimer: 0,

    init(levelConfig) {
        this.obstacles = [];
        this.relayPoints = [];
        this.dynamicTimer = 0;
        this.generateObstacles(levelConfig);
        this.generateRelayPoints();
    },

    generateObstacles(levelConfig) {
        const trackLength = GameConfig.GAME.TRACK_LENGTH;
        const trackWidth = GameConfig.CANVAS.TRACK_WIDTH;

        const staticTypes = ['rock', 'tree', 'pit', 'bridge_broken'];
        const slowDynamicTypes = ['moving_ball'];
        const fastDynamicTypes = ['fast_saw'];
        const hiddenTypes = ['hidden_trap'];

        for (let i = 0; i < levelConfig.obstacleCount; i++) {
            const type = staticTypes[Math.floor(Math.random() * staticTypes.length)];
            const config = GameConfig.OBSTACLES[type];

            this.obstacles.push({
                id: `obs_static_${i}`,
                type,
                config,
                x: 60 + Math.random() * (trackWidth - 120),
                y: 300 + (i / levelConfig.obstacleCount) * (trackLength - 600),
                baseX: 0,
                baseY: 0,
                direction: 1,
                timer: 0,
                revealed: false
            });
        }

        for (let i = 0; i < levelConfig.dynamicCount; i++) {
            const isFast = i < Math.floor(levelConfig.dynamicCount / 3);
            const type = isFast
                ? fastDynamicTypes[Math.floor(Math.random() * fastDynamicTypes.length)]
                : slowDynamicTypes[Math.floor(Math.random() * slowDynamicTypes.length)];
            const config = GameConfig.OBSTACLES[type];

            const baseX = 80 + Math.random() * (trackWidth - 160);
            const baseY = 400 + (i / levelConfig.dynamicCount) * (trackLength - 800);

            this.obstacles.push({
                id: `obs_dynamic_${i}`,
                type,
                config,
                x: baseX,
                y: baseY,
                baseX,
                baseY,
                direction: 1,
                timer: Math.random() * 1000,
                revealed: true
            });
        }

        for (let i = 0; i < levelConfig.hiddenCount; i++) {
            const type = hiddenTypes[Math.floor(Math.random() * hiddenTypes.length)];
            const config = GameConfig.OBSTACLES[type];

            this.obstacles.push({
                id: `obs_hidden_${i}`,
                type,
                config,
                x: 80 + Math.random() * (trackWidth - 160),
                y: 500 + (i / levelConfig.hiddenCount) * (trackLength - 1000),
                baseX: 0,
                baseY: 0,
                direction: 1,
                timer: 0,
                revealed: false
            });
        }
    },

    generateRelayPoints() {
        const trackLength = GameConfig.GAME.TRACK_LENGTH;
        const relayCount = GameConfig.GAME.RELAY_POINTS;
        const sectionLength = trackLength / (relayCount + 2);

        for (let i = 1; i <= relayCount; i++) {
            this.relayPoints.push({
                id: `relay_${i}`,
                x: GameConfig.CANVAS.TRACK_WIDTH / 2,
                y: sectionLength * (i + 1),
                radius: 50,
                activated: false,
                pulsePhase: Math.random() * Math.PI * 2
            });
        }
    },

    update(deltaTime, characterSystem) {
        this.dynamicTimer += deltaTime;

        this.obstacles.forEach(obs => {
            if (obs.config.type === 'dynamic_slow' || obs.config.type === 'dynamic_fast') {
                obs.timer += deltaTime;
                const speed = obs.config.speed;
                const range = obs.config.range;

                if (obs.config.type === 'dynamic_slow') {
                    obs.x = obs.baseX + Math.sin(obs.timer * 0.001 * speed) * range;
                } else {
                    const phase = (obs.timer * 0.003) % (Math.PI * 2);
                    if (phase < 0.1 || phase > Math.PI * 2 - 0.1) {
                        obs.direction *= -1;
                    }
                    obs.x = obs.baseX + Math.sin(obs.timer * 0.003) * range;
                }
            }
        });

        this.relayPoints.forEach(point => {
            point.pulsePhase += deltaTime * 0.003;
        });

        const char = characterSystem.getCurrent();
        if (char) {
            this.relayPoints.forEach(point => {
                if (!point.activated) {
                    const dist = Math.hypot(char.x - point.x, char.y - point.y);
                    if (dist < point.radius) {
                        point.activated = true;
                    }
                }
            });
        }
    },

    checkCollision(characterSystem) {
        const char = characterSystem.getCurrent();
        if (!char || char.finished) return null;

        for (const obs of this.obstacles) {
            const config = obs.config;
            const dist = Math.hypot(char.x - obs.x, char.y - obs.y);
            const collisionDist = char.size / 2 + config.size / 2;

            if (dist < collisionDist) {
                if (config.type === 'hidden' && !obs.revealed) {
                    obs.revealed = true;
                }

                return {
                    obstacle: obs,
                    config,
                    x: obs.x,
                    y: obs.y
                };
            }
        }
        return null;
    },

    checkRelayPoint(characterSystem) {
        const char = characterSystem.getCurrent();
        if (!char || char.finished) return null;

        for (const point of this.relayPoints) {
            if (point.activated) continue;

            const dist = Math.hypot(char.x - point.x, char.y - point.y);
            if (dist < point.radius) {
                point.activated = true;
                return point;
            }
        }
        return null;
    },

    getObstaclesInView(viewY, viewHeight) {
        return this.obstacles.filter(obs => {
            return obs.y > viewY - 100 &&
                   obs.y < viewY + viewHeight + 100;
        });
    },

    getRelayPointsInView(viewY, viewHeight) {
        return this.relayPoints.filter(point => {
            return point.y > viewY - 100 &&
                   point.y < viewY + viewHeight + 100;
        });
    },

    getNextRelayPoint(characterSystem) {
        const char = characterSystem.getCurrent();
        if (!char) return null;

        for (const point of this.relayPoints) {
            if (!point.activated && point.y > char.y) {
                return point;
            }
        }
        return null;
    }
};