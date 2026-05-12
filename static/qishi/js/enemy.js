class Enemy extends Entity {
    constructor(type, x, y) {
        const config = CONFIG.ENEMIES[type.toUpperCase()] || CONFIG.ENEMIES.BEETLE;
        super(x, y, config.width, config.height);
        
        this.type = type;
        this.name = config.name;
        this.maxHealth = config.health;
        this.health = config.health;
        this.damage = config.damage;
        this.speed = config.speed;
        this.essence = config.essence;
        this.behavior = config.behavior;
        
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.patrolStart = x - 100;
        this.patrolEnd = x + 100;
        this.floatOffset = 0;
        this.isCharging = false;
        this.chargeTimer = 0;
        this.target = null;
        
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.hitFlash = 0;
    }

    update(platforms, walls, player) {
        this.target = player;
        this.updateAI(player);
        super.update(platforms, walls);
        
        this.animationTimer++;
        if (this.animationTimer > 10) {
            this.animationFrame = (this.animationFrame + 1) % 4;
            this.animationTimer = 0;
        }
        
        if (this.hitFlash > 0) this.hitFlash--;
    }

    updateAI(player) {
        const dist = this.distanceTo(player);
        
        switch (this.behavior) {
            case 'patrol':
                this.patrolBehavior();
                break;
            case 'float':
                this.floatBehavior();
                break;
            case 'charge':
                this.chargeBehavior(player, dist);
                break;
            case 'wallJump':
                this.wallJumpBehavior();
                break;
        }
        
        if (this.facingRight !== (player.x > this.x)) {
            this.facingRight = player.x > this.x;
        }
    }

    patrolBehavior() {
        this.vx = this.direction * this.speed;
        
        if (this.x <= this.patrolStart) {
            this.direction = 1;
        } else if (this.x >= this.patrolEnd) {
            this.direction = -1;
        }
    }

    floatBehavior() {
        this.floatOffset += 0.05;
        this.vy = Math.sin(this.floatOffset) * 2;
        this.vx = this.direction * this.speed * 0.5;
        
        if (this.x <= this.patrolStart) {
            this.direction = 1;
        } else if (this.x >= this.patrolEnd) {
            this.direction = -1;
        }
    }

    chargeBehavior(player, dist) {
        if (!this.isCharging && dist < 200) {
            this.isCharging = true;
            this.chargeTimer = 30;
            this.direction = player.x > this.x ? 1 : -1;
        }
        
        if (this.isCharging) {
            this.chargeTimer--;
            if (this.chargeTimer > 0) {
                this.vx = 0;
            } else if (this.chargeTimer > -30) {
                this.vx = this.direction * this.speed * 3;
            } else {
                this.isCharging = false;
            }
        } else {
            this.patrolBehavior();
        }
    }

    wallJumpBehavior() {
        if (this.onGround) {
            this.vy = -10;
            this.vx = this.direction * this.speed * 2;
        }
        
        if (this.x <= this.patrolStart) {
            this.direction = 1;
        } else if (this.x >= this.patrolEnd) {
            this.direction = -1;
        }
    }

    takeDamage(amount, particleSystem) {
        this.health -= amount;
        this.hitFlash = 10;
        particleSystem.emitHit(this.getCenterX(), this.getCenterY());
        return this.health <= 0;
    }

    draw(ctx) {
        ctx.save();
        
        if (this.hitFlash > 0) {
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.fillStyle = CONFIG.COLORS.ENEMY;
        }
        
        const cx = this.getCenterX();
        const cy = this.getCenterY();
        
        switch (this.type) {
            case 'beetle':
                this.drawBeetle(ctx, cx, cy);
                break;
            case 'moth':
                this.drawMoth(ctx, cx, cy);
                break;
            case 'shell':
                this.drawShell(ctx, cx, cy);
                break;
            case 'spider':
                this.drawSpider(ctx, cx, cy);
                break;
            default:
                this.drawBeetle(ctx, cx, cy);
        }
        
        ctx.restore();
    }

    drawBeetle(ctx, cx, cy) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, 15, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = CONFIG.COLORS.ENEMY_LIGHT;
        ctx.beginPath();
        ctx.ellipse(cx, cy - 3, 12, 8, 0, Math.PI, 0);
        ctx.fill();
        
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(cx - 5, cy - 2, 2, 0, Math.PI * 2);
        ctx.arc(cx + 5, cy - 2, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawMoth(ctx, cx, cy) {
        const wingFlap = Math.sin(this.animationFrame * 0.8) * 0.3;
        
        ctx.fillStyle = CONFIG.COLORS.ENEMY_LIGHT;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(wingFlap);
        ctx.beginPath();
        ctx.ellipse(-12, 0, 10, 15, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-wingFlap);
        ctx.beginPath();
        ctx.ellipse(12, 0, 10, 15, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        ctx.fillStyle = CONFIG.COLORS.ENEMY;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 6, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(cx - 2, cy - 3, 2, 0, Math.PI * 2);
        ctx.arc(cx + 2, cy - 3, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawShell(ctx, cx, cy) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, 20, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = CONFIG.COLORS.ENEMY_LIGHT;
        ctx.beginPath();
        ctx.ellipse(cx, cy - 5, 18, 12, 0, Math.PI, 0);
        ctx.fill();
        
        ctx.strokeStyle = CONFIG.COLORS.ENEMY;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 15);
        ctx.lineTo(cx, cy + 5);
        ctx.stroke();
        
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(cx - 8, cy - 3, 3, 0, Math.PI * 2);
        ctx.arc(cx + 8, cy - 3, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawSpider(ctx, cx, cy) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, 12, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = CONFIG.COLORS.ENEMY;
        ctx.lineWidth = 3;
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI - Math.PI / 2 + 0.2;
            const legMove = Math.sin(this.animationFrame + i) * 3;
            
            ctx.beginPath();
            ctx.moveTo(cx - 10, cy + i * 3 - 5);
            ctx.lineTo(cx - 25 + legMove, cy + i * 5);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(cx + 10, cy + i * 3 - 5);
            ctx.lineTo(cx + 25 - legMove, cy + i * 5);
            ctx.stroke();
        }
        
        ctx.fillStyle = '#ff0000';
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(cx - 5 + (i % 2) * 10, cy - 5 + Math.floor(i / 2) * 4, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

class Boss extends Entity {
    constructor(type, x, y) {
        const config = CONFIG.BOSSES[type.toUpperCase()] || CONFIG.BOSSES.BEE_QUEEN;
        super(x, y, config.width, config.height);
        
        this.type = type;
        this.name = config.name;
        this.phases = config.phases;
        this.currentPhase = 0;
        this.maxHealth = this.phases[0].health;
        this.health = this.maxHealth;
        this.damage = config.damage;
        this.essence = config.essence;
        
        this.attackTimer = 60;
        this.currentAttack = null;
        this.isActive = false;
        this.target = null;
        
        this.animationFrame = 0;
        this.hitFlash = 0;
        this.vx = 0;
        this.vy = 0;
    }

    activate() {
        this.isActive = true;
    }

    update(platforms, walls, player) {
        if (!this.isActive) {
            this.vy = 0;
            this.vx = 0;
            return;
        }
        
        this.target = player;
        this.updateAttacks(player);
        super.update(platforms, walls);
        
        this.animationFrame++;
        if (this.hitFlash > 0) this.hitFlash--;
    }

    updateAttacks(player) {
        if (this.attackTimer > 0) {
            this.attackTimer--;
        }
        
        if (this.attackTimer <= 0) {
            const attacks = this.phases[this.currentPhase].attacks;
            this.currentAttack = attacks[Math.floor(Math.random() * attacks.length)];
            this.executeAttack(this.currentAttack, player);
            this.attackTimer = 120;
        }
    }

    executeAttack(attack, player) {
        switch (attack) {
            case 'summon':
                this.vy = -5;
                this.vx = (player.x > this.x ? 1 : -1) * 3;
                break;
            case 'stab':
                this.vy = -8;
                this.vx = (player.x > this.x ? 1 : -1) * 6;
                break;
            case 'charge':
                this.vx = (player.x > this.x ? 1 : -1) * 10;
                break;
            case 'shockwave':
                this.vy = -12;
                break;
            case 'venom':
                this.vx = (player.x > this.x ? 1 : -1) * 5;
                break;
        }
    }

    takeDamage(amount, particleSystem) {
        this.health -= amount;
        this.hitFlash = 10;
        particleSystem.emitHit(this.getCenterX(), this.getCenterY());
        
        if (this.currentPhase < this.phases.length - 1) {
            const nextPhaseHealth = this.phases[this.currentPhase + 1].health;
            if (this.health <= nextPhaseHealth) {
                this.currentPhase++;
                this.maxHealth = nextPhaseHealth;
            }
        }
        
        return this.health <= 0;
    }

    draw(ctx) {
        if (!this.isActive) return;
        
        ctx.save();
        
        if (this.hitFlash > 0) {
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.fillStyle = CONFIG.COLORS.ENEMY;
        }
        
        const cx = this.getCenterX();
        const cy = this.getCenterY();
        
        switch (this.type) {
            case 'beeQueen':
                this.drawBeeQueen(ctx, cx, cy);
                break;
            case 'scorpion':
                this.drawScorpion(ctx, cx, cy);
                break;
            default:
                this.drawBeeQueen(ctx, cx, cy);
        }
        
        ctx.restore();
    }

    drawBeeQueen(ctx, cx, cy) {
        const wingFlap = Math.sin(this.animationFrame * 0.3) * 0.4;
        
        ctx.fillStyle = 'rgba(200, 150, 255, 0.5)';
        ctx.save();
        ctx.translate(cx, cy - 10);
        ctx.rotate(wingFlap);
        ctx.beginPath();
        ctx.ellipse(-35, 0, 25, 35, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        ctx.save();
        ctx.translate(cx, cy - 10);
        ctx.rotate(-wingFlap);
        ctx.beginPath();
        ctx.ellipse(35, 0, 25, 35, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : '#904060';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 30, 35, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(cx, cy - 40, 20, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffcc00';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(cx - 25, cy - 15 + i * 12, 50, 6);
        }
        
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(cx - 8, cy - 42, 5, 0, Math.PI * 2);
        ctx.arc(cx + 8, cy - 42, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : '#602040';
        ctx.beginPath();
        ctx.moveTo(cx, cy + 30);
        ctx.lineTo(cx - 8, cy + 55);
        ctx.lineTo(cx + 8, cy + 55);
        ctx.closePath();
        ctx.fill();
    }

    drawScorpion(ctx, cx, cy) {
        ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : '#703020';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 40, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : '#502010';
        ctx.beginPath();
        ctx.ellipse(cx + 45, cy, 15, 20, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : '#804030';
        const clawWave = Math.sin(this.animationFrame * 0.1) * 5;
        ctx.beginPath();
        ctx.ellipse(cx + 60, cy - 20 + clawWave, 12, 8, 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 60, cy + 20 - clawWave, 12, 8, -0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : '#603020';
        for (let i = 0; i < 4; i++) {
            const tailX = cx - 25 - i * 18;
            const tailY = cy - 20 - i * 15 + Math.sin(this.animationFrame * 0.1 + i) * 5;
            ctx.beginPath();
            ctx.arc(tailX, tailY, 10 - i, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.moveTo(cx - 90, cy - 70);
        ctx.lineTo(cx - 100, cy - 85);
        ctx.lineTo(cx - 80, cy - 75);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(cx + 50, cy - 8, 4, 0, Math.PI * 2);
        ctx.arc(cx + 50, cy + 8, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    getHealthPercent() {
        return this.health / this.phases[0].health;
    }
}