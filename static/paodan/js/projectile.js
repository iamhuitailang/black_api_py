class Projectile {
    constructor(x, y, angle, power, config, isPlayer = true, specialSkill = null) {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.isPlayer = isPlayer;
        this.specialSkill = specialSkill;

        if (specialSkill) {
            this.power = specialSkill.power;
            this.radius = specialSkill.name === '高空抛物弹' ? 16 : 12;
            this.color = specialSkill.color;
            this.effect = specialSkill.effect;
            this.name = specialSkill.name;
        } else {
            this.power = config.power;
            this.radius = config.radius;
            this.color = config.color;
            this.effect = null;
            this.name = config.name;
        }

        const velocity = Physics.calculateVelocity(angle, power, config.speed || 1);
        this.vx = velocity.vx;
        this.vy = velocity.vy;

        this.active = true;
        this.trail = [];
        this.maxTrailLength = 20;
        this.rotation = 0;
        this.bounceCount = 0;
        this.maxBounces = 2;
        this.isGroundSkimming = this.effect === 'ground_skimming';
        this.ignoreLowDodge = this.effect === 'ignore_low_dodge';
    }

    update() {
        if (!this.active) return;

        this.trail.push({ x: this.x, y: this.y, alpha: 1 });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        this.trail.forEach((point, i) => {
            point.alpha = (i + 1) / this.maxTrailLength;
        });

        if (this.isGroundSkimming) {
            this.y = GameConfig.GROUND_Y - this.radius - 5;
            this.vy = 0;
            this.vx *= 0.99;
        } else {
            this.vy += GameConfig.GRAVITY;
        }

        this.x += this.vx;
        this.y += this.vy;

        this.rotation += 0.15;

        this.checkCollisions();
    }

    checkCollisions() {
        if (this.x < -50 || this.x > GameConfig.CANVAS_WIDTH + 50 || this.y > GameConfig.CANVAS_HEIGHT + 50) {
            this.active = false;
            return;
        }

        const targetX = this.isPlayer ? GameConfig.COLORS.enemyCannon.x : GameConfig.COLORS.playerCannon.x;
        const targetY = this.isPlayer ? GameConfig.COLORS.enemyCannon.y : GameConfig.COLORS.playerCannon.y;

        if (Physics.checkCannonCollision(this.x, this.y, this.radius, targetX, targetY, 50)) {
            this.handleCannonHit();
            return;
        }

        const obstacleCollision = Physics.checkObstacleCollision(this.x, this.y, this.radius);
        if (obstacleCollision.hit) {
            this.handleObstacleCollision(obstacleCollision.obstacle);
            return;
        }

        if (Physics.checkGroundCollision(this.y, this.radius)) {
            this.handleGroundCollision();
            return;
        }
    }

    handleObstacleCollision(obstacle) {
        if (obstacle.type === 'bump') {
            const bounce = Physics.calculateBounce(this.vx, this.vy, -Math.PI / 4, 0.7);
            this.vx = bounce.vx;
            this.vy = bounce.vy;
            this.bounceCount++;
            if (this.bounceCount >= this.maxBounces) {
                this.explode();
            }
        } else {
            this.explode();
        }
    }

    handleGroundCollision() {
        if (this.isGroundSkimming) {
            if (Math.abs(this.vx) < 2) {
                this.explode();
            }
        } else {
            this.y = GameConfig.GROUND_Y - this.radius;
            if (this.bounceCount < this.maxBounces && Math.abs(this.vy) > 2) {
                this.vy = -this.vy * 0.5;
                this.vx *= 0.8;
                this.bounceCount++;
            } else {
                this.explode();
            }
        }
    }

    handleCannonHit() {
        this.explode(true);
    }

    explode(isDirectHit = false) {
        this.active = false;
        this.exploded = true;
        this.isDirectHit = isDirectHit;

        const blastRadius = this.specialSkill ?
            (this.specialSkill.name === '连环飞人' ? 60 : 100) :
            80;

        this.blastData = {
            x: this.x,
            y: this.y,
            radius: 0,
            maxRadius: blastRadius,
            alpha: 1
        };
    }

    updateExplosion() {
        if (!this.blastData) return false;

        this.blastData.radius += 8;
        this.blastData.alpha -= 0.05;

        return this.blastData.alpha > 0;
    }

    getExplosionDamage(targetX, targetY) {
        if (!this.blastData) return 0;

        const distance = Utils.distance(this.blastData.x, this.blastData.y, targetX, targetY);
        if (distance > this.blastData.maxRadius) return 0;

        return Physics.calculateDamage(this.power, distance, this.blastData.maxRadius);
    }
}

const ProjectileManager = {
    projectiles: [],
    explosions: [],

    createProjectile(x, y, angle, power, config, isPlayer = true, specialSkill = null) {
        const projectile = new Projectile(x, y, angle, power, config, isPlayer, specialSkill);
        this.projectiles.push(projectile);
        return projectile;
    },

    update() {
        this.projectiles.forEach(p => p.update());
        this.projectiles = this.projectiles.filter(p => p.active || p.blastData);

        this.projectiles.forEach(p => {
            if (p.blastData) {
                if (!p.updateExplosion()) {
                    p.blastData = null;
                }
            }
        });

        this.projectiles = this.projectiles.filter(p => p.active || p.blastData);
    },

    getActiveProjectiles() {
        return this.projectiles.filter(p => p.active);
    },

    getExplosions() {
        return this.projectiles.filter(p => p.blastData);
    },

    hasActiveProjectiles() {
        return this.projectiles.some(p => p.active || p.blastData);
    },

    clear() {
        this.projectiles = [];
    }
};
