class Obstacle {
    constructor(options = {}) {
        this.type = options.type || 'gravel';
        this.lane = options.lane || 0;
        this.distance = options.distance || 0;
        this.width = options.width || CONFIG.GAME.LANE_WIDTH;
        this.length = options.length || 100;
    }

    getColor() {
        const colors = {
            gravel: '#A0522D',
            slope: '#8B4513',
            barrier: '#696969',
            wind: '#87CEEB'
        };
        return colors[this.type] || '#888';
    }

    getIcon() {
        const icons = {
            gravel: '🪨',
            slope: '📐',
            barrier: '🚧',
            wind: '💨'
        };
        return icons[this.type] || '?';
    }
}

class ObstacleManager {
    constructor() {
        this.obstacles = [];
        this.spawnTimer = 0;
    }

    update(deltaTime, players, cameraDistance) {
        this.spawnTimer -= deltaTime;
        if (this.spawnTimer <= 0 && this.obstacles.length < CONFIG.OBSTACLES.MAX_ON_TRACK) {
            this.spawnObstacle(cameraDistance);
            this.spawnTimer = CONFIG.OBSTACLES.SPAWN_INTERVAL;
        }

        this.checkCollisions(players);
        this.cleanup(cameraDistance);
    }

    spawnObstacle(cameraDistance) {
        const types = ['gravel', 'slope', 'barrier', 'wind'];
        const weights = [0.4, 0.25, 0.2, 0.15];
        
        let type = 'gravel';
        let random = Math.random();
        let cumulative = 0;
        for (let i = 0; i < types.length; i++) {
            cumulative += weights[i];
            if (random < cumulative) {
                type = types[i];
                break;
            }
        }

        const obstacle = new Obstacle({
            type,
            lane: Utils.randomInt(0, CONFIG.GAME.LANES - 1),
            distance: cameraDistance + Utils.random(600, 1200),
            length: type === 'gravel' ? 150 : (type === 'slope' ? 120 : 60)
        });

        this.obstacles.push(obstacle);
    }

    checkCollisions(players) {
        for (const player of players) {
            if (player.finished || player.isFallen) continue;

            for (const obstacle of this.obstacles) {
                const distDiff = player.distance - obstacle.distance;
                const laneDiff = Math.abs(Math.round(player.lane) - obstacle.lane);

                if (distDiff >= 0 && distDiff < obstacle.length && laneDiff < 1) {
                    if (obstacle.type === 'gravel') {
                        player.speed *= CONFIG.OBSTACLES.GRAVEL_SPEED_PENALTY;
                    } else if (obstacle.type === 'slope') {
                        player.balance += CONFIG.OBSTACLES.SLOPE_BALANCE_PENALTY * 3;
                    } else if (obstacle.type === 'barrier') {
                        if (distDiff < 30) {
                            player.hitObstacle('barrier');
                        }
                    } else if (obstacle.type === 'wind') {
                        if (distDiff < 20) {
                            player.targetLane += Utils.randomInt(-1, 1);
                            player.targetLane = Utils.clamp(player.targetLane, 0, CONFIG.GAME.LANES - 1);
                        }
                    }
                }
            }
        }
    }

    cleanup(cameraDistance) {
        this.obstacles = this.obstacles.filter(obs => 
            obs.distance > cameraDistance - 300
        );
    }

    getState() {
        return this.obstacles.map(o => ({
            type: o.type,
            lane: o.lane,
            distance: o.distance,
            width: o.width,
            length: o.length
        }));
    }

    loadState(state) {
        this.obstacles = state.map(o => new Obstacle(o));
    }
}
