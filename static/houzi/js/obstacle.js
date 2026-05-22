class Obstacle {
    constructor(type, x, y, direction = 1) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.active = true;
        this.animFrame = 0;
        this.animTimer = 0;
        
        switch (type) {
            case 'rock':
                this.width = GameConfig.OBSTACLE.ROCK.WIDTH;
                this.height = GameConfig.OBSTACLE.ROCK.HEIGHT;
                this.damage = GameConfig.OBSTACLE.ROCK.DAMAGE;
                this.speed = GameConfig.OBSTACLE.ROCK.SPEED;
                break;
            case 'bird':
                this.width = GameConfig.OBSTACLE.BIRD.WIDTH;
                this.height = GameConfig.OBSTACLE.BIRD.HEIGHT;
                this.damage = GameConfig.OBSTACLE.BIRD.DAMAGE;
                this.speed = GameConfig.OBSTACLE.BIRD.SPEED;
                this.wingAngle = 0;
                break;
            case 'thorn':
                this.width = GameConfig.OBSTACLE.THORN.WIDTH;
                this.height = GameConfig.OBSTACLE.THORN.HEIGHT;
                this.damage = GameConfig.OBSTACLE.THORN.DAMAGE;
                this.speed = 0;
                break;
        }
    }

    update(deltaTime) {
        if (this.type === 'rock') {
            this.x += this.speed * this.direction;
            if (this.x < -this.width || this.x > GameConfig.CANVAS.WIDTH + this.width) {
                this.active = false;
            }
        } else if (this.type === 'bird') {
            this.x += this.speed * this.direction;
            this.wingAngle = Math.sin(Date.now() / 100) * 0.5;
            if (this.x < -this.width || this.x > GameConfig.CANVAS.WIDTH + this.width) {
                this.active = false;
            }
        }
        
        this.animTimer += deltaTime;
        if (this.animTimer > 150) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 2;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        switch (this.type) {
            case 'rock':
                this.drawRock(ctx);
                break;
            case 'bird':
                this.drawBird(ctx);
                break;
            case 'thorn':
                this.drawThorn(ctx);
                break;
        }
        
        ctx.restore();
    }

    drawRock(ctx) {
        ctx.fillStyle = GameConfig.COLORS.ROCK;
        ctx.beginPath();
        ctx.moveTo(-this.width / 2, this.height / 2);
        ctx.lineTo(-this.width / 2 + 5, -this.height / 4);
        ctx.lineTo(0, -this.height / 2);
        ctx.lineTo(this.width / 2 - 5, -this.height / 3);
        ctx.lineTo(this.width / 2, this.height / 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#A0A0A0';
        ctx.beginPath();
        ctx.ellipse(-5, -5, 8, 5, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#606060';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-this.width / 3, 0);
        ctx.lineTo(this.width / 4, -5);
        ctx.stroke();
    }

    drawBird(ctx) {
        ctx.save();
        if (this.direction < 0) {
            ctx.scale(-1, 1);
        }
        
        ctx.fillStyle = GameConfig.COLORS.BIRD;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 3, this.height / 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = GameConfig.COLORS.BIRD;
        ctx.beginPath();
        ctx.ellipse(this.width / 4, -2, 12, 8, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.moveTo(this.width / 3, 0);
        ctx.lineTo(this.width / 2, -2);
        ctx.lineTo(this.width / 3, 3);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(this.width / 4, -4, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.width / 4 + 1, -4, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = GameConfig.COLORS.BIRD;
        ctx.save();
        ctx.rotate(this.wingAngle);
        ctx.beginPath();
        ctx.ellipse(-5, -10, 15, 6, -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        ctx.fillStyle = '#3A5FCD';
        ctx.beginPath();
        ctx.ellipse(-2, 5, 8, 4, 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    drawThorn(ctx) {
        ctx.fillStyle = GameConfig.COLORS.THORN;
        ctx.beginPath();
        ctx.moveTo(-this.width / 2, this.height / 2);
        
        const spikeCount = 5;
        const spikeWidth = this.width / spikeCount;
        
        for (let i = 0; i < spikeCount; i++) {
            const x = -this.width / 2 + i * spikeWidth;
            ctx.lineTo(x + spikeWidth / 2, -this.height / 2);
            ctx.lineTo(x + spikeWidth, this.height / 2);
        }
        
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#4A6A6A';
        for (let i = 0; i < spikeCount; i++) {
            const x = -this.width / 2 + i * spikeWidth + spikeWidth / 2;
            ctx.beginPath();
            ctx.moveTo(x, -this.height / 3);
            ctx.lineTo(x - 3, 0);
            ctx.lineTo(x + 3, 0);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.fillStyle = 'rgba(255, 100, 100, 0.5)';
        for (let i = 0; i < spikeCount; i++) {
            const x = -this.width / 2 + i * spikeWidth + spikeWidth / 2;
            ctx.beginPath();
            ctx.moveTo(x, -this.height / 2);
            ctx.lineTo(x - 2, -this.height / 2 + 10);
            ctx.lineTo(x + 2, -this.height / 2 + 10);
            ctx.closePath();
            ctx.fill();
        }
    }

    getBounds() {
        return {
            x: this.x - this.width / 2 + 5,
            y: this.y - this.height / 2 + 5,
            width: this.width - 10,
            height: this.height - 10
        };
    }

    isOffScreen() {
        return !this.active;
    }

    toJSON() {
        return {
            type: this.type,
            x: this.x,
            y: this.y,
            direction: this.direction
        };
    }

    static fromJSON(data) {
        return new Obstacle(data.type, data.x, data.y, data.direction);
    }
}

class ObstacleManager {
    constructor() {
        this.obstacles = [];
        this.spawnTimer = 0;
    }

    init(savedObstacles = []) {
        this.obstacles = [];
        for (let data of savedObstacles) {
            this.obstacles.push(Obstacle.fromJSON(data));
        }
        this.spawnTimer = 0;
    }

    spawnObstacle() {
        if (this.obstacles.length >= GameConfig.OBSTACLE.MAX_ON_SCREEN) {
            return;
        }
        
        const types = ['rock', 'bird', 'thorn'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        let x, y, direction;
        let safeDistance = 150;
        
        switch (type) {
            case 'rock':
                direction = Math.random() < 0.5 ? 1 : -1;
                x = direction > 0 ? -50 : GameConfig.CANVAS.WIDTH + 50;
                y = GameConfig.CANVAS.GROUND_Y - 30;
                break;
            case 'bird':
                direction = Math.random() < 0.5 ? 1 : -1;
                x = direction > 0 ? -50 : GameConfig.CANVAS.WIDTH + 50;
                y = Math.random() * (GameConfig.OBSTACLE.BIRD.FLY_HEIGHT_MAX - GameConfig.OBSTACLE.BIRD.FLY_HEIGHT_MIN) + GameConfig.OBSTACLE.BIRD.FLY_HEIGHT_MIN;
                break;
            case 'thorn':
                let attempts = 0;
                do {
                    x = Math.random() * (GameConfig.CANVAS.WIDTH - 100) + 50;
                    y = GameConfig.CANVAS.GROUND_Y - 20;
                    attempts++;
                } while (attempts < 5 && this.isTooCloseToPlayers(x, y, safeDistance));
                break;
        }
        
        this.obstacles.push(new Obstacle(type, x, y, direction));
    }
    
    isTooCloseToPlayers(x, y, distance) {
        const game = window.currentGame;
        if (!game || !game.player || !game.ai) return false;
        
        const distToPlayer = Math.hypot(game.player.x - x, game.player.y - y);
        const distToAI = Math.hypot(game.ai.x - x, game.ai.y - y);
        
        return distToPlayer < distance || distToAI < distance;
    }

    update(deltaTime) {
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= GameConfig.OBSTACLE.SPAWN_INTERVAL) {
            this.spawnTimer = 0;
            this.spawnObstacle();
        }
        
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            this.obstacles[i].update(deltaTime);
            if (this.obstacles[i].isOffScreen()) {
                this.obstacles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        for (let obstacle of this.obstacles) {
            obstacle.draw(ctx);
        }
    }

    checkCollision(entity) {
        const entityBounds = entity.getBounds();
        let damage = 0;
        
        for (let obstacle of this.obstacles) {
            const obstacleBounds = obstacle.getBounds();
            if (this.isColliding(entityBounds, obstacleBounds)) {
                damage = Math.max(damage, obstacle.damage);
                if (obstacle.type !== 'thorn') {
                    obstacle.active = false;
                }
            }
        }
        
        return damage;
    }

    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    getNearbyObstacles(x, y, range) {
        return this.obstacles.filter(obs => {
            const dist = Math.hypot(obs.x - x, obs.y - y);
            return dist < range;
        });
    }

    toJSON() {
        return this.obstacles.map(o => o.toJSON());
    }
}
