class Enemy {
    constructor(type, x, y) {
        const config = Config.ENEMY_TYPES[type];
        this.id = Utils.uuid();
        this.type = type;
        this.name = config.name;
        this.x = x;
        this.y = y;
        this.radius = config.radius;
        this.maxHealth = config.maxHealth;
        this.health = config.maxHealth;
        this.moveSpeed = config.moveSpeed;
        this.damage = config.damage;
        this.attackRange = config.attackRange;
        this.attackCooldown = config.attackCooldown;
        this.aggroRange = config.aggroRange;
        this.color = config.color;
        this.score = config.score;
        
        this.angle = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.targetX = x;
        this.targetY = y;
        
        this.lastAttackTime = 0;
        this.isAttacking = false;
        this.attackProgress = 0;
        
        this.hitFlashTime = 0;
        this.isDead = false;
        
        this.state = 'idle';
    }

    update(dt, currentTime, player, map, bullets) {
        if (this.isDead) return;
        
        const distToPlayer = Utils.distance(this.x, this.y, player.x, player.y);
        
        if (distToPlayer <= this.aggroRange || this.type === 'elite') {
            this.state = 'chase';
            this.targetX = player.x;
            this.targetY = player.y;
            this.angle = Utils.angle(this.x, this.y, player.x, player.y);
            
            if (distToPlayer <= this.attackRange) {
                if (currentTime - this.lastAttackTime >= this.attackCooldown) {
                    this.attack(currentTime, player, bullets);
                }
            }
        } else {
            this.state = 'idle';
            if (Math.random() < 0.01) {
                this.targetX = this.x + Utils.randomRange(-100, 100);
                this.targetY = this.y + Utils.randomRange(-100, 100);
                this.angle = Utils.angle(this.x, this.y, this.targetX, this.targetY);
            }
        }
        
        this.move(dt, map);
        
        if (this.hitFlashTime > 0) {
            this.hitFlashTime -= dt;
        }
    }

    move(dt, map) {
        const distToTarget = Utils.distance(this.x, this.y, this.targetX, this.targetY);
        
        if (distToTarget > 5) {
            const angle = Utils.angle(this.x, this.y, this.targetX, this.targetY);
            const speed = this.state === 'chase' ? this.moveSpeed : this.moveSpeed * 0.5;
            
            let vx = Math.cos(angle) * speed;
            let vy = Math.sin(angle) * speed;
            
            const newX = this.x + vx * dt;
            const newY = this.y + vy * dt;
            
            if (!map.checkCollision(newX, this.y, this.radius)) {
                this.x = newX;
            }
            if (!map.checkCollision(this.x, newY, this.radius)) {
                this.y = newY;
            }
            
            this.x = Utils.clamp(this.x, this.radius, Config.MAP_WIDTH - this.radius);
            this.y = Utils.clamp(this.y, this.radius, Config.MAP_HEIGHT - this.radius);
        }
    }

    attack(currentTime, player, bullets) {
        this.lastAttackTime = currentTime;
        this.isAttacking = true;
        this.attackProgress = 0;
        
        if (this.type === 'shooter') {
            const angle = Utils.angle(this.x, this.y, player.x, player.y);
            bullets.push(new Bullet({
                x: this.x + Math.cos(angle) * this.radius,
                y: this.y + Math.sin(angle) * this.radius,
                angle: angle,
                speed: 400,
                damage: this.damage,
                range: 600,
                color: '#ff4444',
                owner: 'enemy'
            }));
        } else {
            const dist = Utils.distance(this.x, this.y, player.x, player.y);
            if (dist <= this.attackRange) {
                player.takeDamage(this.damage);
            }
        }
    }

    takeDamage(damage) {
        if (this.isDead) return 0;
        
        this.health -= damage;
        this.hitFlashTime = 0.15;
        this.state = 'chase';
        
        if (this.health <= 0) {
            this.isDead = true;
            return this.score;
        }
        return 0;
    }

    render(ctx, camera) {
        if (this.isDead) return;
        
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.angle);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(2, 4, this.radius, this.radius * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const bodyColor = this.hitFlashTime > 0 ? '#ffffff' : this.color;
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        if (this.type === 'elite') {
            ctx.strokeStyle = '#ff6600';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 4, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(this.radius * 0.3, -this.radius * 0.25, this.radius * 0.2, 0, Math.PI * 2);
        ctx.arc(this.radius * 0.3, this.radius * 0.25, this.radius * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        const barWidth = this.radius * 2;
        const barHeight = 5;
        const barX = screenX - barWidth / 2;
        const barY = screenY - this.radius - 12;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#44ff44' : healthPercent > 0.25 ? '#ffaa00' : '#ff4444';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }

    serialize() {
        return {
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y,
            health: this.health,
            maxHealth: this.maxHealth,
            angle: this.angle,
            velocityX: this.velocityX,
            velocityY: this.velocityY,
            targetX: this.targetX,
            targetY: this.targetY,
            lastAttackTime: this.lastAttackTime,
            isAttacking: this.isAttacking,
            attackProgress: this.attackProgress,
            hitFlashTime: this.hitFlashTime,
            isDead: this.isDead,
            state: this.state
        };
    }

    static deserialize(data) {
        const enemy = new Enemy(data.type, data.x, data.y);
        enemy.id = data.id;
        enemy.health = data.health;
        enemy.maxHealth = data.maxHealth;
        enemy.angle = data.angle;
        enemy.velocityX = data.velocityX;
        enemy.velocityY = data.velocityY;
        enemy.targetX = data.targetX;
        enemy.targetY = data.targetY;
        enemy.lastAttackTime = data.lastAttackTime;
        enemy.isAttacking = data.isAttacking;
        enemy.attackProgress = data.attackProgress;
        enemy.hitFlashTime = data.hitFlashTime;
        enemy.isDead = data.isDead;
        enemy.state = data.state;
        return enemy;
    }
}
