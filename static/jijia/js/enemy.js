class Enemy {
    constructor(x, y) {
        this.config = CONFIG.ENEMY;
        this.x = x;
        this.y = y;
        this.width = 100;
        this.height = 120;
        this.health = this.config.health;
        this.maxHealth = this.config.health;
        this.damage = this.config.damage;
        this.speed = this.config.speed;
        this.color = this.config.color;
        this.direction = 1;
        this.lastAttackTime = 0;
        this.attackInterval = this.config.attackInterval;
        this.isStunned = false;
        this.stunEndTime = 0;
        this.isBurning = false;
        this.burnEndTime = 0;
        this.burnDamage = 0;
        this.targetY = y;
        this.moveTimer = 0;
        this.attackPattern = 0;
        this.defenseModules = this.createDefenseModules();
    }
    
    createDefenseModules() {
        const modules = [];
        const moduleCount = 4;
        const startX = this.x - this.width / 2 + 10;
        
        for (let i = 0; i < moduleCount; i++) {
            modules.push({
                x: startX + i * 20,
                y: this.y + this.height / 2 - 10,
                width: 15,
                height: 12,
                health: 30,
                maxHealth: 30,
                destroyed: false
            });
        }
        return modules;
    }

    update(canvasWidth, playerX, playerY) {
        this.updateEffects();
        
        if (this.isStunned) return;
        
        this.moveTimer++;
        
        if (this.moveTimer % 120 === 0) {
            this.direction = Math.random() > 0.5 ? 1 : -1;
        }
        
        const oldX = this.x;
        this.x += this.speed * this.direction;
        const dx = this.x - oldX;
        
        if (this.x - this.width / 2 < 50) {
            this.x = 50 + this.width / 2;
            this.direction = 1;
        } else if (this.x + this.width / 2 > canvasWidth - 50) {
            this.x = canvasWidth - 50 - this.width / 2;
            this.direction = -1;
        }
        
        if (this.moveTimer % 180 === 0) {
            this.targetY = this.y + (Math.random() - 0.5) * 60;
            this.targetY = Math.max(80, Math.min(200, this.targetY));
        }
        
        const oldY = this.y;
        const dy = this.targetY - this.y;
        this.y += dy * 0.02;
        const actualDy = this.y - oldY;
        
        for (const module of this.defenseModules) {
            module.x += dx;
            module.y += actualDy;
        }
    }

    canAttack() {
        const now = Date.now();
        return !this.isStunned && now - this.lastAttackTime > this.attackInterval;
    }

    attack(playerX, playerY) {
        this.lastAttackTime = Date.now();
        this.attackPattern = (this.attackPattern + 1) % 3;
        
        const balls = [];
        const startX = this.x;
        const startY = this.y + this.height / 2;
        
        const dx = playerX - startX;
        const dy = playerY - startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = 8;
        
        switch (this.attackPattern) {
            case 0:
                balls.push(new Ball(
                    startX, startY,
                    (dx / dist) * speed,
                    (dy / dist) * speed,
                    'normal', false
                ));
                break;
                
            case 1:
                for (let i = -1; i <= 1; i++) {
                    const angle = Math.atan2(dy, dx) + i * 0.3;
                    balls.push(new Ball(
                        startX, startY,
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed,
                        'normal', false
                    ));
                }
                break;
                
            case 2:
                balls.push(new Ball(
                    startX, startY,
                    (dx / dist) * speed * 0.8,
                    (dy / dist) * speed * 0.8,
                    'explosive', false
                ));
                break;
        }
        
        return balls;
    }

    takeDamage(damage) {
        this.health -= damage;
        if (this.health < 0) this.health = 0;
    }

    applyEffect(effectType, duration, damage = 0) {
        const now = Date.now();
        
        switch (effectType) {
            case 'paralyze':
                this.isStunned = true;
                this.stunEndTime = now + duration * 1000;
                break;
            case 'burn':
                this.isBurning = true;
                this.burnEndTime = now + duration * 1000;
                this.burnDamage = damage;
                break;
        }
    }

    updateEffects() {
        const now = Date.now();
        
        if (this.isStunned && now > this.stunEndTime) {
            this.isStunned = false;
        }
        
        if (this.isBurning) {
            if (now > this.burnEndTime) {
                this.isBurning = false;
            } else {
                this.health -= this.burnDamage * 0.016;
                if (this.health < 0) this.health = 0;
            }
        }
    }

    draw(ctx) {
        const enemyX = this.x - this.width / 2;
        const enemyY = this.y - this.height / 2;
        
        const gradient = ctx.createLinearGradient(enemyX, enemyY, enemyX + this.width, enemyY + this.height);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.5, this.adjustColor(this.color, -30));
        gradient.addColorStop(1, this.adjustColor(this.color, -60));
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(enemyX, enemyY, this.width, this.height, 15);
        ctx.fill();
        
        ctx.strokeStyle = this.isStunned ? '#ffff00' : this.adjustColor(this.color, 30);
        ctx.lineWidth = 4;
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(this.x - 20, enemyY + 35, 12, 8, 0, 0, Math.PI * 2);
        ctx.ellipse(this.x + 20, enemyY + 35, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = this.isStunned ? '#ffff00' : '#ff0000';
        ctx.beginPath();
        ctx.arc(this.x - 20, enemyY + 35, 5, 0, Math.PI * 2);
        ctx.arc(this.x + 20, enemyY + 35, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = this.adjustColor(this.color, -40);
        ctx.beginPath();
        ctx.roundRect(enemyX + 15, enemyY + 60, this.width - 30, 25, 5);
        ctx.fill();
        
        ctx.fillStyle = '#00ff00';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(this.x - 20 + i * 20, enemyY + 72, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.fillStyle = this.adjustColor(this.color, -20);
        ctx.beginPath();
        ctx.moveTo(enemyX + 10, enemyY);
        ctx.lineTo(enemyX + 20, enemyY - 25);
        ctx.lineTo(enemyX + 30, enemyY);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(enemyX + this.width - 30, enemyY);
        ctx.lineTo(enemyX + this.width - 20, enemyY - 25);
        ctx.lineTo(enemyX + this.width - 10, enemyY);
        ctx.fill();
        
        if (this.isBurning) {
            ctx.fillStyle = 'rgba(255, 100, 0, 0.6)';
            for (let i = 0; i < 8; i++) {
                const flameX = enemyX + Math.random() * this.width;
                const flameY = enemyY + Math.random() * this.height * 0.6;
                ctx.beginPath();
                ctx.arc(flameX, flameY, 6 + Math.random() * 6, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        for (const module of this.defenseModules) {
            if (!module.destroyed) {
                const moduleGradient = ctx.createLinearGradient(module.x, module.y, module.x + module.width, module.y + module.height);
                moduleGradient.addColorStop(0, '#ff6666');
                moduleGradient.addColorStop(1, '#cc3333');
                ctx.fillStyle = moduleGradient;
                ctx.beginPath();
                ctx.roundRect(module.x, module.y, module.width, module.height, 3);
                ctx.fill();
                ctx.strokeStyle = '#ff9999';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
        
        if (this.isBurning) {
            ctx.fillStyle = 'rgba(255, 100, 0, 0.6)';
            for (let i = 0; i < 8; i++) {
                const flameX = enemyX + Math.random() * this.width;
                const flameY = enemyY + Math.random() * this.height * 0.6;
                ctx.beginPath();
                ctx.arc(flameX, flameY, 6 + Math.random() * 6, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        if (this.isStunned) {
            ctx.fillStyle = '#ffff00';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('💫', this.x, enemyY - 35);
        }
    }

    adjustColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    getState() {
        return {
            x: this.x,
            y: this.y,
            health: this.health,
            maxHealth: this.maxHealth,
            direction: this.direction,
            lastAttackTime: this.lastAttackTime,
            isStunned: this.isStunned,
            stunEndTime: this.stunEndTime,
            isBurning: this.isBurning,
            burnEndTime: this.burnEndTime,
            burnDamage: this.burnDamage,
            targetY: this.targetY,
            moveTimer: this.moveTimer,
            attackPattern: this.attackPattern,
            defenseModules: this.defenseModules
        };
    }

    loadState(state) {
        this.x = state.x;
        this.y = state.y;
        this.health = state.health;
        this.maxHealth = state.maxHealth;
        this.direction = state.direction;
        this.lastAttackTime = state.lastAttackTime;
        this.isStunned = state.isStunned;
        this.stunEndTime = state.stunEndTime;
        this.isBurning = state.isBurning;
        this.burnEndTime = state.burnEndTime;
        this.burnDamage = state.burnDamage;
        this.targetY = state.targetY;
        this.moveTimer = state.moveTimer;
        this.attackPattern = state.attackPattern;
        this.defenseModules = state.defenseModules || this.defenseModules;
    }
}