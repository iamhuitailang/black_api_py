class Obstacle {
    constructor(type, x, y, config) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.config = config;
        this.active = true;
        this.animFrame = 0;
        
        switch (type) {
            case GameConfig.OBSTACLE_TYPES.BIRD:
                this.vx = -3 - Math.random() * 2;
                this.vy = Math.sin(Math.random() * Math.PI * 2) * 0.5;
                this.width = 40;
                this.height = 30;
                break;
            case GameConfig.OBSTACLE_TYPES.ROCK:
                this.vx = -1;
                this.vy = 2 + Math.random() * 2;
                this.width = 30;
                this.height = 30;
                this.rotation = 0;
                this.rotationSpeed = (Math.random() - 0.5) * 0.1;
                break;
            case GameConfig.OBSTACLE_TYPES.WIND:
                this.vx = -2;
                this.vy = 0;
                this.width = 80;
                this.height = 100;
                this.strength = config.windStrength;
                this.direction = Math.random() > 0.5 ? 1 : -1;
                break;
        }
    }

    update(dt, playerX, wireY) {
        this.animFrame += dt * 0.01;
        
        switch (this.type) {
            case GameConfig.OBSTACLE_TYPES.BIRD:
                this.x += this.vx;
                this.y += this.vy;
                this.vy += Math.sin(this.animFrame * 0.1) * 0.05;
                break;
            case GameConfig.OBSTACLE_TYPES.ROCK:
                this.x += this.vx;
                this.y += this.vy;
                this.vy += 0.1;
                this.rotation += this.rotationSpeed;
                break;
            case GameConfig.OBSTACLE_TYPES.WIND:
                this.x += this.vx;
                break;
        }

        if (this.x < -100 || this.y > 1000) {
            this.active = false;
        }
    }

    checkCollision(playerX, playerY, playerRadius) {
        if (!this.active) return false;
        
        const dx = this.x - playerX;
        const dy = this.y - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const collisionRadius = Math.max(this.width, this.height) / 2 + playerRadius;
        
        return distance < collisionRadius;
    }

    applyEffect(balanceSystem, character) {
        switch (this.type) {
            case GameConfig.OBSTACLE_TYPES.BIRD:
                balanceSystem.applyImpact((Math.random() - 0.5) * 20);
                break;
            case GameConfig.OBSTACLE_TYPES.ROCK:
                balanceSystem.applyImpact((Math.random() - 0.5) * 30);
                break;
            case GameConfig.OBSTACLE_TYPES.WIND:
                balanceSystem.applyWind(this.strength, this.direction);
                break;
        }
    }
}

class ObstacleSystem {
    constructor(scene) {
        this.scene = scene;
        this.obstacles = [];
        this.spawnTimer = 0;
        this.spawnInterval = 2000;
        this.distance = 0;
    }

    update(dt, playerX, wireY, balanceSystem, character) {
        this.distance += dt * 0.05;

        this.spawnTimer += dt;
        if (this.spawnTimer > this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnObstacle(playerX, wireY);
            this.spawnInterval = 1500 + Math.random() * 2000 / this.scene.obstacleRate;
        }

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.update(dt, playerX, wireY);
            
            if (!obs.active) {
                this.obstacles.splice(i, 1);
                continue;
            }

            if (obs.checkCollision(playerX, wireY - 50, 30)) {
                obs.applyEffect(balanceSystem, character);
                obs.active = false;
            }
        }
    }

    spawnObstacle(playerX, wireY) {
        const types = [];
        
        if (Math.random() < this.scene.birdRate) {
            types.push(GameConfig.OBSTACLE_TYPES.BIRD);
        }
        if (Math.random() < this.scene.rockRate) {
            types.push(GameConfig.OBSTACLE_TYPES.ROCK);
        }
        if (Math.random() < this.scene.windStrength) {
            types.push(GameConfig.OBSTACLE_TYPES.WIND);
        }

        if (types.length === 0) return;

        const type = types[Math.floor(Math.random() * types.length)];
        const x = playerX + 800 + Math.random() * 400;
        let y;

        switch (type) {
            case GameConfig.OBSTACLE_TYPES.BIRD:
                y = wireY - 80 - Math.random() * 150;
                break;
            case GameConfig.OBSTACLE_TYPES.ROCK:
                y = wireY - 200 - Math.random() * 100;
                break;
            case GameConfig.OBSTACLE_TYPES.WIND:
                y = wireY - 50;
                break;
        }

        this.obstacles.push(new Obstacle(type, x, y, this.scene));
    }

    reset() {
        this.obstacles = [];
        this.spawnTimer = 0;
        this.distance = 0;
    }

    serialize() {
        return {
            obstacles: this.obstacles.map(o => ({
                type: o.type,
                x: o.x,
                y: o.y,
                vx: o.vx,
                vy: o.vy
            })),
            spawnTimer: this.spawnTimer,
            distance: this.distance
        };
    }

    deserialize(data) {
        if (data) {
            this.spawnTimer = data.spawnTimer || 0;
            this.distance = data.distance || 0;
            this.obstacles = [];
            if (data.obstacles) {
                data.obstacles.forEach(o => {
                    const obs = new Obstacle(o.type, o.x, o.y, this.scene);
                    obs.vx = o.vx;
                    obs.vy = o.vy;
                    this.obstacles.push(obs);
                });
            }
        }
    }
}
