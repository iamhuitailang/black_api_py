class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.active = true;
    }

    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    collidesWith(other) {
        const a = this.getBounds();
        const b = other.getBounds();
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    getCircleCollisionRadius() {
        return Math.max(this.width, this.height) / 2;
    }

    circleCollidesWith(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < this.getCircleCollisionRadius() + other.getCircleCollisionRadius();
    }

    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
    }

    draw(ctx) {
    }

    isActive() {
        return this.active;
    }

    destroy() {
        this.active = false;
    }
}

class Player extends Entity {
    constructor(x, y) {
        super(x, y, 40, 40);
        this.speed = 350;
        this.maxHealth = 100;
        this.health = 100;
        this.maxEnergy = 100;
        this.energy = 0;
        this.fireRate = 150;
        this.lastFireTime = 0;
        this.damage = 20;
        this.bulletSpeed = 600;
        this.invincible = false;
        this.invincibleTime = 0;
        this.invincibleDuration = 1.5;
    }

    update(deltaTime, keys, mouseX, mouseY, canvasWidth, canvasHeight) {
        let moveX = 0;
        let moveY = 0;

        if (keys['KeyW'] || keys['ArrowUp']) moveY -= 1;
        if (keys['KeyS'] || keys['ArrowDown']) moveY += 1;
        if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
        if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;

        if (moveX !== 0 || moveY !== 0) {
            const length = Math.sqrt(moveX * moveX + moveY * moveY);
            moveX /= length;
            moveY /= length;

            if (moveX !== 0 && moveY !== 0) {
                moveX *= 0.707;
                moveY *= 0.707;
            }

            this.vx = moveX * this.speed;
            this.vy = moveY * this.speed;

            if (Math.random() < 0.5) {
                particleSystem.emitThruster(this.x, this.y, this.angle);
            }
        } else {
            this.vx *= 0.9;
            this.vy *= 0.9;
        }

        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        const margin = this.width / 2;
        this.x = Math.max(margin, Math.min(canvasWidth - margin, this.x));
        this.y = Math.max(margin, Math.min(canvasHeight - margin, this.y));

        this.angle = Math.atan2(mouseY - this.y, mouseX - this.x);

        if (this.invincible) {
            this.invincibleTime -= deltaTime;
            if (this.invincibleTime <= 0) {
                this.invincible = false;
            }
        }
    }

    canFire(currentTime) {
        return currentTime - this.lastFireTime >= this.fireRate;
    }

    fire(currentTime) {
        if (!this.canFire(currentTime)) return null;
        
        this.lastFireTime = currentTime;
        
        const bullet = new Bullet(
            this.x + Math.cos(this.angle) * 25,
            this.y + Math.sin(this.angle) * 25,
            Math.cos(this.angle) * this.bulletSpeed,
            Math.sin(this.angle) * this.bulletSpeed,
            this.damage,
            true
        );
        
        return bullet;
    }

    takeDamage(amount) {
        if (this.invincible) return;
        
        this.health -= amount;
        this.invincible = true;
        this.invincibleTime = this.invincibleDuration;
        
        particleSystem.emitHit(this.x, this.y);
        
        if (this.health <= 0) {
            this.health = 0;
            this.destroy();
        }
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    addEnergy(amount) {
        this.energy = Math.min(this.maxEnergy, this.energy + amount);
    }

    useUltimate() {
        if (this.energy >= this.maxEnergy) {
            this.energy = 0;
            return true;
        }
        return false;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        if (this.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        ctx.beginPath();
        ctx.moveTo(25, 0);
        ctx.lineTo(-15, -18);
        ctx.lineTo(-8, 0);
        ctx.lineTo(-15, 18);
        ctx.closePath();

        const gradient = ctx.createLinearGradient(-15, 0, 25, 0);
        gradient.addColorStop(0, '#1565c0');
        gradient.addColorStop(0.5, '#42a5f5');
        gradient.addColorStop(1, '#90caf9');
        
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.strokeStyle = '#64b5f6';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(8, 0, 8, 5, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#e3f2fd';
        ctx.fill();
        ctx.strokeStyle = '#90caf9';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.shadowColor = '#64b5f6';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(8, 0, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(100, 181, 246, 0.8)';
        ctx.fill();

        ctx.restore();

        if (this.energy >= this.maxEnergy) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.beginPath();
            ctx.arc(0, 0, 35, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 183, 77, ${0.5 + Math.sin(Date.now() / 200) * 0.3})`;
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();
        }
    }
}

class Bullet extends Entity {
    constructor(x, y, vx, vy, damage, isPlayerBullet = true) {
        super(x, y, 8, 8);
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.isPlayerBullet = isPlayerBullet;
        this.lifetime = 3;
        this.angle = Math.atan2(vy, vx);
    }

    update(deltaTime, canvasWidth, canvasHeight) {
        super.update(deltaTime);
        this.lifetime -= deltaTime;

        if (this.lifetime <= 0 ||
            this.x < -50 || this.x > canvasWidth + 50 ||
            this.y < -50 || this.y > canvasHeight + 50) {
            this.destroy();
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.isPlayerBullet ? 10 : 8);
        
        if (this.isPlayerBullet) {
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.3, 'rgba(100, 200, 255, 1)');
            gradient.addColorStop(1, 'rgba(100, 150, 255, 0)');
            
            ctx.shadowColor = '#64b5f6';
            ctx.shadowBlur = 10;
        } else {
            gradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
            gradient.addColorStop(0.3, 'rgba(255, 100, 100, 1)');
            gradient.addColorStop(1, 'rgba(255, 50, 50, 0)');
            
            ctx.shadowColor = '#ef5350';
            ctx.shadowBlur = 10;
        }

        ctx.beginPath();
        ctx.arc(0, 0, this.isPlayerBullet ? 6 : 5, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.lineTo(0, -3);
        ctx.lineTo(0, 3);
        ctx.closePath();
        ctx.fillStyle = this.isPlayerBullet ? 'rgba(100, 200, 255, 0.6)' : 'rgba(255, 100, 100, 0.6)';
        ctx.fill();

        ctx.restore();
    }
}

class Enemy extends Entity {
    constructor(x, y, width, height, type, wave) {
        super(x, y, width, height);
        this.type = type;
        this.wave = wave;
        this.difficultyMultiplier = 1 + (wave - 1) * 0.15;
        this.lastFireTime = 0;
        this.angle = 0;
        this.targetX = x;
        this.targetY = y;
        this.changeDirectionTime = 0;
    }

    getScoreValue() {
        return 0;
    }

    getEnergyDropChance() {
        return 0.3;
    }

    update(deltaTime, playerX, playerY, canvasWidth, canvasHeight) {
        super.update(deltaTime);
        this.angle = Math.atan2(playerY - this.y, playerX - this.x);
    }

    canFire(currentTime, fireRate) {
        return currentTime - this.lastFireTime >= fireRate;
    }

    fire(currentTime, playerX, playerY, speed, damage) {
        const angle = Math.atan2(playerY - this.y, playerX - this.x);
        const bullet = new Bullet(
            this.x + Math.cos(angle) * 20,
            this.y + Math.sin(angle) * 20,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            damage,
            false
        );
        this.lastFireTime = currentTime;
        return bullet;
    }

    takeDamage(amount) {
        this.health -= amount;
        particleSystem.emitHit(this.x, this.y);
        
        if (this.health <= 0) {
            this.destroy();
            return true;
        }
        return false;
    }

    onDeath() {
        particleSystem.emitExplosion(this.x, this.y);
    }
}

class Asteroid extends Enemy {
    constructor(x, y, wave, size = 'large') {
        const sizes = {
            large: { width: 60, height: 60, health: 60, speed: 80 },
            medium: { width: 40, height: 40, health: 35, speed: 120 },
            small: { width: 25, height: 25, health: 15, speed: 160 }
        };
        
        const sizeData = sizes[size];
        super(x, y, sizeData.width, sizeData.height, 'asteroid', wave);
        
        this.size = size;
        this.maxHealth = Math.floor(sizeData.health * this.difficultyMultiplier);
        this.health = this.maxHealth;
        this.speed = sizeData.speed;
        this.rotationSpeed = (Math.random() - 0.5) * 3;
        this.rotationAngle = Math.random() * Math.PI * 2;
        
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        
        this.vertices = this.generateVertices();
    }

    generateVertices() {
        const vertices = [];
        const numVertices = 8 + Math.floor(Math.random() * 5);
        for (let i = 0; i < numVertices; i++) {
            const angle = (Math.PI * 2 * i) / numVertices;
            const radius = (this.width / 2) * (0.7 + Math.random() * 0.3);
            vertices.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            });
        }
        return vertices;
    }

    getScoreValue() {
        const scores = { large: 50, medium: 30, small: 15 };
        return Math.floor(scores[this.size] * this.difficultyMultiplier);
    }

    getEnergyDropChance() {
        return { large: 0.4, medium: 0.3, small: 0.2 }[this.size];
    }

    update(deltaTime, playerX, playerY, canvasWidth, canvasHeight) {
        super.update(deltaTime, playerX, playerY, canvasWidth, canvasHeight);
        
        this.rotationAngle += this.rotationSpeed * deltaTime;

        const margin = this.width;
        if (this.x < -margin) this.x = canvasWidth + margin;
        if (this.x > canvasWidth + margin) this.x = -margin;
        if (this.y < -margin) this.y = canvasHeight + margin;
        if (this.y > canvasHeight + margin) this.y = -margin;
    }

    split() {
        if (this.size === 'large') {
            return ['medium', 'medium'];
        } else if (this.size === 'medium') {
            return ['small', 'small'];
        }
        return [];
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotationAngle);

        ctx.beginPath();
        ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
        for (let i = 1; i < this.vertices.length; i++) {
            ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
        }
        ctx.closePath();

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.width / 2);
        gradient.addColorStop(0, '#8d6e63');
        gradient.addColorStop(0.5, '#6d4c41');
        gradient.addColorStop(1, '#4e342e');
        
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 2;
        ctx.stroke();

        for (let i = 0; i < 3; i++) {
            const cx = (Math.random() - 0.5) * this.width * 0.5;
            const cy = (Math.random() - 0.5) * this.height * 0.5;
            const cr = Math.random() * 5 + 3;
            
            ctx.beginPath();
            ctx.arc(cx, cy, cr, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(62, 39, 35, 0.6)';
            ctx.fill();
        }

        ctx.restore();

        if (this.health < this.maxHealth) {
            const barWidth = this.width;
            const barHeight = 4;
            const barX = this.x - barWidth / 2;
            const barY = this.y - this.height / 2 - 10;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            ctx.fillStyle = '#ef5350';
            ctx.fillRect(barX, barY, barWidth * (this.health / this.maxHealth), barHeight);
        }
    }
}

class Alien extends Enemy {
    constructor(x, y, wave) {
        super(x, y, 45, 45, 'alien', wave);
        
        this.maxHealth = Math.floor(50 * this.difficultyMultiplier);
        this.health = this.maxHealth;
        this.speed = 100 * this.difficultyMultiplier;
        this.fireRate = Math.max(1500 - wave * 50, 800);
        this.damage = 15 * this.difficultyMultiplier;
        this.bulletSpeed = 250;
        
        this.movePattern = Math.random() < 0.5 ? 'zigzag' : 'circle';
        this.patternTime = 0;
        this.circleRadius = 100;
        this.circleAngle = Math.random() * Math.PI * 2;
    }

    getScoreValue() {
        return Math.floor(100 * this.difficultyMultiplier);
    }

    getEnergyDropChance() {
        return 0.5;
    }

    update(deltaTime, playerX, playerY, canvasWidth, canvasHeight) {
        super.update(deltaTime, playerX, playerY, canvasWidth, canvasHeight);
        
        this.patternTime += deltaTime;

        if (this.movePattern === 'zigzag') {
            const dx = playerX - this.x;
            const dy = playerY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 250) {
                this.vx = (dx / dist) * this.speed;
                this.vy = (dy / dist) * this.speed;
            } else {
                const perpX = -dy / dist;
                const perpY = dx / dist;
                const zigzag = Math.sin(this.patternTime * 3) * 0.5;
                
                this.vx = (dx / dist) * this.speed * 0.3 + perpX * this.speed * zigzag;
                this.vy = (dy / dist) * this.speed * 0.3 + perpY * this.speed * zigzag;
            }
        } else {
            this.circleAngle += deltaTime * 1.5;
            const targetX = playerX + Math.cos(this.circleAngle) * this.circleRadius;
            const targetY = playerY + Math.sin(this.circleAngle) * this.circleRadius;
            
            const dx = targetX - this.x;
            const dy = targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 10) {
                this.vx = (dx / dist) * this.speed;
                this.vy = (dy / dist) * this.speed;
            }
        }

        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        const margin = this.width;
        this.x = Math.max(margin, Math.min(canvasWidth - margin, this.x));
        this.y = Math.max(margin, Math.min(canvasHeight - margin, this.y));
    }

    tryFire(currentTime, playerX, playerY) {
        if (this.canFire(currentTime, this.fireRate)) {
            return this.fire(currentTime, playerX, playerY, this.bulletSpeed, this.damage);
        }
        return null;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.beginPath();
        ctx.ellipse(0, 0, 22, 15, 0, 0, Math.PI * 2);
        
        const gradient = ctx.createRadialGradient(0, -5, 0, 0, 0, 22);
        gradient.addColorStop(0, '#7b1fa2');
        gradient.addColorStop(0.5, '#9c27b0');
        gradient.addColorStop(1, '#4a148c');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = '#ce93d8';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(0, -5, 12, 8, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(200, 230, 255, 0.3)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(200, 230, 255, 0.5)';
        ctx.stroke();

        const eyePositions = [-6, 6];
        for (const ex of eyePositions) {
            ctx.beginPath();
            ctx.arc(ex, -5, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#000';
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(ex - 1, -6, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
        }

        ctx.beginPath();
        ctx.moveTo(-18, 8);
        ctx.quadraticCurveTo(-25, 15, -20, 20);
        ctx.moveTo(0, 12);
        ctx.quadraticCurveTo(0, 20, -5, 25);
        ctx.moveTo(18, 8);
        ctx.quadraticCurveTo(25, 15, 20, 20);
        ctx.strokeStyle = '#9c27b0';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.shadowColor = '#e040fb';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(-20, 20, 3, 0, Math.PI * 2);
        ctx.arc(-5, 25, 3, 0, Math.PI * 2);
        ctx.arc(20, 20, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#e040fb';
        ctx.fill();

        ctx.restore();

        if (this.health < this.maxHealth) {
            const barWidth = this.width;
            const barHeight = 4;
            const barX = this.x - barWidth / 2;
            const barY = this.y - this.height / 2 - 10;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            ctx.fillStyle = '#9c27b0';
            ctx.fillRect(barX, barY, barWidth * (this.health / this.maxHealth), barHeight);
        }
    }
}

class Boss extends Enemy {
    constructor(x, y, wave) {
        super(x, y, 120, 120, 'boss', wave);
        
        this.bossLevel = Math.floor(wave / 5);
        this.maxHealth = Math.floor(1000 * (1 + this.bossLevel * 0.5) * this.difficultyMultiplier);
        this.health = this.maxHealth;
        this.speed = 80 * this.difficultyMultiplier;
        this.fireRate = 800;
        this.damage = 25 * this.difficultyMultiplier;
        this.bulletSpeed = 300;
        
        this.phase = 1;
        this.phaseTimer = 0;
        this.patternIndex = 0;
        this.patternTimer = 0;
        
        this.targetX = x;
        this.targetY = y;
        this.moveTimer = 0;
    }

    getScoreValue() {
        return Math.floor(1000 * (1 + this.bossLevel * 0.5) * this.difficultyMultiplier);
    }

    getEnergyDropChance() {
        return 1;
    }

    getEnergyDropAmount() {
        return 10;
    }

    update(deltaTime, playerX, playerY, canvasWidth, canvasHeight) {
        super.update(deltaTime, playerX, playerY, canvasWidth, canvasHeight);
        
        this.phaseTimer += deltaTime;
        this.patternTimer += deltaTime;
        this.moveTimer += deltaTime;

        const healthPercent = this.health / this.maxHealth;
        if (healthPercent < 0.3) {
            this.phase = 3;
        } else if (healthPercent < 0.6) {
            this.phase = 2;
        }

        if (this.moveTimer > 2) {
            this.moveTimer = 0;
            this.targetX = 100 + Math.random() * (canvasWidth - 200);
            this.targetY = 100 + Math.random() * (canvasHeight / 2);
        }

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 10) {
            const speed = this.speed * (this.phase === 3 ? 1.5 : 1);
            this.vx = (dx / dist) * speed;
            this.vy = (dy / dist) * speed;
        } else {
            this.vx *= 0.95;
            this.vy *= 0.95;
        }

        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        const margin = this.width / 2 + 50;
        this.x = Math.max(margin, Math.min(canvasWidth - margin, this.x));
        this.y = Math.max(margin, Math.min(canvasHeight / 2, this.y));
    }

    tryFire(currentTime, playerX, playerY) {
        const currentFireRate = this.fireRate / (this.phase === 3 ? 1.5 : 1);
        
        if (!this.canFire(currentTime, currentFireRate)) return [];
        
        const bullets = [];
        
        if (this.phase === 1) {
            bullets.push(this.fire(currentTime, playerX, playerY, this.bulletSpeed, this.damage));
        } else if (this.phase === 2) {
            for (let i = -1; i <= 1; i++) {
                const angle = Math.atan2(playerY - this.y, playerX - this.x) + i * 0.3;
                const bullet = new Bullet(
                    this.x + Math.cos(angle) * 60,
                    this.y + Math.sin(angle) * 60,
                    Math.cos(angle) * this.bulletSpeed,
                    Math.sin(angle) * this.bulletSpeed,
                    this.damage,
                    false
                );
                bullets.push(bullet);
            }
            this.lastFireTime = currentTime;
        } else {
            const numBullets = 8 + this.bossLevel * 2;
            for (let i = 0; i < numBullets; i++) {
                const angle = (Math.PI * 2 * i) / numBullets + this.phaseTimer * 2;
                const bullet = new Bullet(
                    this.x + Math.cos(angle) * 60,
                    this.y + Math.sin(angle) * 60,
                    Math.cos(angle) * this.bulletSpeed * 0.8,
                    Math.sin(angle) * this.bulletSpeed * 0.8,
                    this.damage * 0.8,
                    false
                );
                bullets.push(bullet);
            }
            this.lastFireTime = currentTime;
        }
        
        return bullets;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.beginPath();
        ctx.moveTo(0, -50);
        ctx.lineTo(50, -20);
        ctx.lineTo(60, 20);
        ctx.lineTo(40, 50);
        ctx.lineTo(-40, 50);
        ctx.lineTo(-60, 20);
        ctx.lineTo(-50, -20);
        ctx.closePath();

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 60);
        gradient.addColorStop(0, '#c62828');
        gradient.addColorStop(0.5, '#e53935');
        gradient.addColorStop(1, '#b71c1c');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = '#ff8a80';
        ctx.lineWidth = 3;
        ctx.stroke();

        const eyeGlow = 0.5 + Math.sin(Date.now() / 300) * 0.5;
        ctx.beginPath();
        ctx.arc(-20, -10, 12, 0, Math.PI * 2);
        ctx.arc(20, -10, 12, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 235, 59, ${0.8 + eyeGlow * 0.2})`;
        ctx.fill();
        ctx.strokeStyle = '#fff176';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(-20, -10, 5, 0, Math.PI * 2);
        ctx.arc(20, -10, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-25, 20);
        ctx.quadraticCurveTo(0, 40, 25, 20);
        ctx.strokeStyle = '#b71c1c';
        ctx.lineWidth = 4;
        ctx.stroke();

        const numTeeth = 6;
        for (let i = 0; i < numTeeth; i++) {
            const tx = -20 + i * 8;
            ctx.beginPath();
            ctx.moveTo(tx, 22);
            ctx.lineTo(tx + 4, 32);
            ctx.lineTo(tx + 8, 22);
            ctx.fillStyle = '#fff';
            ctx.fill();
        }

        ctx.beginPath();
        ctx.moveTo(-50, -30);
        ctx.lineTo(-70, -10);
        ctx.lineTo(-50, 0);
        ctx.closePath();
        ctx.moveTo(50, -30);
        ctx.lineTo(70, -10);
        ctx.lineTo(50, 0);
        ctx.closePath();
        ctx.fillStyle = '#c62828';
        ctx.fill();
        ctx.strokeStyle = '#ff8a80';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.shadowColor = '#ff5722';
        ctx.shadowBlur = 20 + this.phase * 10;
        ctx.beginPath();
        ctx.arc(-60, -5, 8, 0, Math.PI * 2);
        ctx.arc(60, -5, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#ff5722';
        ctx.fill();

        ctx.restore();

        const barWidth = 200;
        const barHeight = 12;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.height / 2 - 25;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        const healthGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
        healthGradient.addColorStop(0, '#c62828');
        healthGradient.addColorStop(0.5, '#e53935');
        healthGradient.addColorStop(1, '#ff8a80');
        
        ctx.fillStyle = healthGradient;
        ctx.fillRect(barX, barY, barWidth * (this.health / this.maxHealth), barHeight);
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(`BOSS Lv.${this.bossLevel + 1}`, this.x, barY - 5);
    }
}

class EnergyFragment extends Entity {
    constructor(x, y) {
        super(x, y, 15, 15);
        this.vx = (Math.random() - 0.5) * 100;
        this.vy = (Math.random() - 0.5) * 100;
        this.lifetime = 15;
        this.rotationAngle = 0;
        this.rotationSpeed = 3;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.collecting = false;
        this.collectTarget = null;
    }

    update(deltaTime, playerX, playerY) {
        if (this.collecting && this.collectTarget) {
            const dx = this.collectTarget.x - this.x;
            const dy = this.collectTarget.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 25) {
                this.destroy();
                return true;
            }
            
            const speed = 500;
            this.vx = (dx / dist) * speed;
            this.vy = (dy / dist) * speed;
        } else {
            this.vx *= 0.98;
            this.vy *= 0.98;
            
            const dx = playerX - this.x;
            const dy = playerY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 50) {
                const attractForce = 100 * (1 - dist / 50);
                this.vx += (dx / dist) * attractForce * deltaTime;
                this.vy += (dy / dist) * attractForce * deltaTime;
            }
        }

        super.update(deltaTime);
        this.rotationAngle += this.rotationSpeed * deltaTime;
        this.pulsePhase += deltaTime * 4;
        this.lifetime -= deltaTime;

        if (this.lifetime <= 0) {
            this.destroy();
        }

        return false;
    }

    startCollecting(target) {
        this.collecting = true;
        this.collectTarget = target;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotationAngle);

        const pulse = 1 + Math.sin(this.pulsePhase) * 0.2;
        const size = this.width / 2 * pulse;

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 2);
        gradient.addColorStop(0, 'rgba(200, 255, 255, 1)');
        gradient.addColorStop(0.3, 'rgba(100, 200, 255, 0.8)');
        gradient.addColorStop(0.6, 'rgba(150, 100, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(100, 150, 255, 0)');

        ctx.shadowColor = '#64b5f6';
        ctx.shadowBlur = 20;

        ctx.beginPath();
        ctx.arc(0, 0, size * 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
            const x = Math.cos(angle) * size;
            const y = Math.sin(angle) * size;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();

        const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        coreGradient.addColorStop(0, '#ffffff');
        coreGradient.addColorStop(0.5, '#64b5f6');
        coreGradient.addColorStop(1, '#1976d2');

        ctx.fillStyle = coreGradient;
        ctx.fill();
        ctx.strokeStyle = '#90caf9';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fill();

        ctx.restore();
    }
}
