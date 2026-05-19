class Obstacle {
    constructor(type, lane, progress) {
        this.type = type;
        this.config = GameConfig.OBSTACLES.TYPES[type];
        this.lane = lane;
        this.progress = progress;
        this.x = 0;
        this.y = 0;
        this.width = this.config.width;
        this.height = this.config.height;
        this.active = true;
        this.hit = false;
    }

    update(playerProgress, canvasHeight) {
        const waterStartY = canvasHeight * 0.3;
        const waterHeight = canvasHeight - waterStartY;
        const playerScreenY = waterStartY + waterHeight * 0.65;
        const pixelsPerProgress = 1.5;
        const relativeProgress = this.progress - playerProgress;

        if (relativeProgress < -80 || relativeProgress > 200) {
            this.active = false;
            return;
        }

        this.x = GameConfig.LANE_START_X + this.lane * GameConfig.LANE_WIDTH + GameConfig.LANE_WIDTH / 2;
        this.y = playerScreenY - relativeProgress * pixelsPerProgress;
    }

    checkCollision(boat) {
        if (!this.active || this.hit) return false;

        const boatLeft = boat.x - 50;
        const boatRight = boat.x + 50;
        const boatTop = boat.y - 30;
        const boatBottom = boat.y + 30;

        const obsLeft = this.x - this.width / 2;
        const obsRight = this.x + this.width / 2;
        const obsTop = this.y - this.height / 2;
        const obsBottom = this.y + this.height / 2;

        return !(boatRight < obsLeft || boatLeft > obsRight || boatBottom < obsTop || boatTop > obsBottom);
    }

    toJSON() {
        return {
            type: this.type,
            lane: this.lane,
            progress: this.progress,
            active: this.active,
            hit: this.hit
        };
    }

    static fromJSON(data) {
        const obstacle = new Obstacle(data.type, data.lane, data.progress);
        obstacle.active = data.active;
        obstacle.hit = data.hit;
        return obstacle;
    }
}

class ObstacleManager {
    constructor() {
        this.obstacles = [];
        this.spawnTimer = 0;
        this.nextSpawnProgress = 50;
    }

    update(deltaTime, playerProgress, canvasHeight) {
        this.spawnTimer += deltaTime;

        if (playerProgress > this.nextSpawnProgress && playerProgress < GameConfig.GAME_LENGTH - 100) {
            this.spawnObstacle(playerProgress);
            this.nextSpawnProgress += GameConfig.OBSTACLES.SPAWN_INTERVAL + Math.random() * 40;
        }

        this.obstacles.forEach(obstacle => {
            obstacle.update(playerProgress, canvasHeight);
        });

        this.obstacles = this.obstacles.filter(o => o.active && !o.hit);
    }

    spawnObstacle(playerProgress) {
        const types = Object.keys(GameConfig.OBSTACLES.TYPES);
        const type = types[Math.floor(Math.random() * types.length)];
        const lane = Math.floor(Math.random() * GameConfig.LANES);
        const progress = playerProgress + 150 + Math.random() * 50;

        this.obstacles.push(new Obstacle(type, lane, progress));
    }

    checkCollisions(boat) {
        const collisions = [];
        this.obstacles.forEach(obstacle => {
            if (obstacle.checkCollision(boat)) {
                obstacle.hit = true;
                collisions.push(obstacle);
            }
        });
        return collisions;
    }

    reset() {
        this.obstacles = [];
        this.spawnTimer = 0;
        this.nextSpawnProgress = 50;
    }

    toJSON() {
        return {
            obstacles: this.obstacles.map(o => o.toJSON()),
            nextSpawnProgress: this.nextSpawnProgress
        };
    }

    static fromJSON(data) {
        const manager = new ObstacleManager();
        manager.obstacles = data.obstacles.map(o => Obstacle.fromJSON(o));
        manager.nextSpawnProgress = data.nextSpawnProgress;
        return manager;
    }
}
