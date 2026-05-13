class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        const config = CONFIG.ENEMIES[type];
        this.maxHealth = config.health;
        this.health = config.health;
        this.damage = config.damage;
        this.speed = config.speed;
        this.name = config.name;
        
        this.width = 35;
        this.height = 50;
        this.vx = 0;
        this.vy = 0;
        
        this.state = 'patrol';
        this.patrolDirection = 1;
        this.patrolTimer = 0;
        this.attackCooldown = 0;
        this.hitStun = 0;
        
        this.facingRight = true;
        this.isGrounded = false;
        this.animFrame = 0;
        this.animTimer = 0;
    }
    
    update(player, platforms) {
        if (this.health <= 0) return;
        
        this.animTimer++;
        if (this.animTimer > 10) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
        
        if (this.hitStun > 0) {
            this.hitStun--;
            return;
        }
        
        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }
        
        const distToPlayer = Math.sqrt(Math.pow(player.x - this.x, 2) + Math.pow(player.y - this.y, 2));
        
        switch (this.state) {
            case 'patrol':
                this.patrol(platforms);
                if (distToPlayer < 300) {
                    this.state = 'chase';
                }
                break;
                
            case 'chase':
                this.chase(player, platforms);
                if (distToPlayer < 60) {
                    this.state = 'attack';
                } else if (distToPlayer > 400) {
                    this.state = 'patrol';
                }
                break;
                
            case 'attack':
                this.attackPlayer(player);
                if (distToPlayer > 80) {
                    this.state = 'chase';
                }
                break;
        }
        
        this.vy += CONFIG.GRAVITY;
        this.x += this.vx;
        this.y += this.vy;
        
        this.handleCollisions(platforms);
        
        this.x = Math.max(this.width / 2, Math.min(Game.canvas.width - this.width / 2, this.x));
        
        if (this.y > Game.canvas.height + 100) {
            this.health = 0;
        }
    }
    
    patrol(platforms) {
        this.patrolTimer++;
        if (this.patrolTimer > 120) {
            this.patrolTimer = 0;
            this.patrolDirection *= -1;
        }
        
        this.vx = this.speed * 0.5 * this.patrolDirection;
        this.facingRight = this.patrolDirection > 0;
    }
    
    chase(player, platforms) {
        const dx = player.x - this.x;
        this.vx = Math.sign(dx) * this.speed;
        this.facingRight = dx > 0;
        
        if (this.type === 'ELITE' && this.isGrounded && Math.abs(player.y - this.y) > 50) {
            this.vy = -12;
        }
    }
    
    attackPlayer(player) {
        this.vx = 0;
        
        if (this.attackCooldown <= 0) {
            const dist = Math.sqrt(Math.pow(player.x - this.x, 2) + Math.pow(player.y - this.y, 2));
            
            if (this.type === 'GUNNER') {
                this.shoot(player);
                this.attackCooldown = 90;
            } else if (dist < 60) {
                this.meleeAttack(player);
                this.attackCooldown = 60;
            }
        }
    }
    
    meleeAttack(player) {
        player.takeDamage(this.damage);
    }
    
    shoot(player) {
        Game.createProjectile(this.x, this.y - 10, player.x, player.y, this.damage);
    }
    
    handleCollisions(platforms) {
        this.isGrounded = false;
        
        for (const platform of platforms) {
            if (this.checkPlatformCollision(platform)) {
                if (this.vy > 0 && this.y - this.height / 2 < platform.y) {
                    this.y = platform.y - this.height / 2;
                    this.vy = 0;
                    this.isGrounded = true;
                }
            }
        }
    }
    
    checkPlatformCollision(platform) {
        return this.x + this.width / 2 > platform.x &&
               this.x - this.width / 2 < platform.x + platform.width &&
               this.y + this.height / 2 > platform.y &&
               this.y - this.height / 2 < platform.y + platform.height;
    }
    
    takeDamage(amount) {
        this.health -= amount;
        this.hitStun = 20;
        
        if (this.health <= 0) {
            Game.onEnemyDefeated(this);
        }
    }
    
    draw(ctx) {
        if (this.health <= 0) return;
        
        const safeX = isNaN(this.x) ? 200 : this.x;
        const safeY = isNaN(this.y) ? 300 : this.y;
        
        ctx.save();
        ctx.translate(safeX, safeY);
        
        if (!this.facingRight) {
            ctx.scale(-1, 1);
        }
        
        const baseColor = this.hitStun > 0 ? '#ffffff' : CONFIG.COLORS.ENEMY;
        const bodyGradient = ctx.createLinearGradient(-13, -15, 13, 25);
        bodyGradient.addColorStop(0, this.hitStun > 0 ? '#ffffff' : '#993399');
        bodyGradient.addColorStop(0.5, this.hitStun > 0 ? '#cccccc' : CONFIG.COLORS.ENEMY);
        bodyGradient.addColorStop(1, this.hitStun > 0 ? '#999999' : '#4d004d');
        ctx.fillStyle = bodyGradient;
        
        ctx.beginPath();
        ctx.ellipse(0, 5, 13, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255, 0, 100, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = this.hitStun > 0 ? '#cccccc' : '#660066';
        ctx.fillRect(-10, -8, 20, 3);
        ctx.fillRect(-8, 2, 16, 2);
        ctx.fillRect(-6, 10, 12, 2);
        
        const headGradient = ctx.createRadialGradient(0, -20, 0, 0, -20, 12);
        headGradient.addColorStop(0, this.hitStun > 0 ? '#ffffff' : '#cc44cc');
        headGradient.addColorStop(0.7, this.hitStun > 0 ? '#cccccc' : CONFIG.COLORS.ENEMY);
        headGradient.addColorStop(1, this.hitStun > 0 ? '#999999' : '#4d004d');
        ctx.fillStyle = headGradient;
        
        ctx.beginPath();
        ctx.ellipse(0, -20, 10, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255, 0, 100, 0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#ff0066';
        ctx.shadowColor = '#ff0066';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.ellipse(-4, -22, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(4, -22, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = CONFIG.COLORS.ENEMY_HIGHLIGHT;
        ctx.fillRect(-12, -32, 24, 5);
        
        ctx.strokeStyle = 'rgba(255, 100, 200, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-10, -32);
        ctx.lineTo(-8, -38);
        ctx.lineTo(-4, -32);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(10, -32);
        ctx.lineTo(8, -38);
        ctx.lineTo(4, -32);
        ctx.stroke();
        
        const legGradient = ctx.createLinearGradient(0, 22, 0, 35);
        legGradient.addColorStop(0, this.hitStun > 0 ? '#ffffff' : '#993399');
        legGradient.addColorStop(1, this.hitStun > 0 ? '#999999' : '#660066');
        ctx.fillStyle = legGradient;
        
        const legOffset = Math.sin(this.animFrame * Math.PI / 2) * 3;
        ctx.fillRect(-10, 22, 6, 12 + legOffset);
        ctx.fillRect(4, 22, 6, 12 - legOffset);
        
        ctx.strokeStyle = 'rgba(255, 0, 100, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(-10, 22, 6, 12 + legOffset);
        ctx.strokeRect(4, 22, 6, 12 - legOffset);
        
        ctx.fillStyle = legGradient;
        ctx.fillRect(12, 0, 6, 12);
        ctx.fillRect(-18, 0, 6, 12);
        
        ctx.strokeStyle = 'rgba(255, 0, 100, 0.5)';
        ctx.strokeRect(12, 0, 6, 12);
        ctx.strokeRect(-18, 0, 6, 12);
        
        ctx.restore();
        
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#1a0a1a';
        ctx.fillRect(this.x - 20, this.y - 45, 40, 5);
        ctx.strokeStyle = 'rgba(255, 0, 100, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - 20, this.y - 45, 40, 5);
        
        const healthColor = healthPercent > 0.5 ? '#00ff88' : healthPercent > 0.25 ? '#ffaa00' : '#ff4444';
        ctx.fillStyle = healthColor;
        ctx.shadowColor = healthColor;
        ctx.shadowBlur = 5;
        ctx.fillRect(this.x - 20, this.y - 45, 40 * healthPercent, 5);
        ctx.shadowBlur = 0;
    }
}