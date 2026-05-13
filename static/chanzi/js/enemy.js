class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.vx = 0;
        this.vy = 0;
        this.dead = false;
        this.health = 1;
        this.maxHealth = 1;
        this.damage = 1;
        this.score = 50;
        this.facingRight = true;
        this.knockback = false;
        this.knockbackTimer = 0;
        this.animFrame = 0;
        this.animTimer = 0;
        
        this.setupByType();
    }
    
    setupByType() {
        switch (this.type) {
            case 'slime':
                this.width = 32;
                this.height = 24;
                this.health = 1;
                this.maxHealth = 1;
                this.score = 50;
                this.speed = 1.5;
                break;
            case 'skeleton':
                this.width = 32;
                this.height = 48;
                this.health = 2;
                this.maxHealth = 2;
                this.score = 100;
                this.speed = 1;
                this.hasShield = true;
                break;
            case 'ghost':
                this.width = 28;
                this.height = 32;
                this.health = 1;
                this.maxHealth = 1;
                this.score = 80;
                this.speed = 2;
                this.floating = true;
                break;
            case 'bomber':
                this.width = 28;
                this.height = 28;
                this.health = 1;
                this.maxHealth = 1;
                this.score = 150;
                this.speed = 2.5;
                this.flying = true;
                break;
            case 'dragon':
                this.width = 64;
                this.height = 48;
                this.health = 10;
                this.maxHealth = 10;
                this.score = 250;
                this.speed = 3;
                this.fireTimer = 0;
                this.fireInterval = 120;
                this.isBoss = true;
                break;
        }
    }
    
    takeDamage(amount, fromRight) {
        if (this.hasShield && !fromRight === this.facingRight) {
            AudioSystem.enemyHit();
            return;
        }
        
        this.health -= amount;
        this.knockback = true;
        this.knockbackTimer = 10;
        this.vx = fromRight ? -5 : 5;
        
        AudioSystem.enemyHit();
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        this.dead = true;
        AudioSystem.enemyDeath();
        Game.addScore(this.score);
        
        if (Math.random() < 0.3) {
            Game.spawnMana(this.x + this.width / 2, this.y);
        }
    }
    
    update(player, level) {
        if (this.dead) return;
        
        if (this.knockback) {
            this.knockbackTimer--;
            if (this.knockbackTimer <= 0) {
                this.knockback = false;
                this.vx = 0;
            }
        } else {
            this.updateAI(player, level);
        }
        
        if (!this.floating && !this.flying) {
            this.vy += 0.5;
            if (this.vy > 10) this.vy = 10;
        }
        
        this.x += this.vx;
        this.y += this.vy;
        
        if (!this.floating && !this.flying) {
            this.handleCollisions(level);
        }
        
        this.animTimer++;
        if (this.animTimer >= 10) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
    }
    
    updateAI(player, level) {
        switch (this.type) {
            case 'slime':
                this.slimeAI(level);
                break;
            case 'skeleton':
                this.skeletonAI(player, level);
                break;
            case 'ghost':
                this.ghostAI(player);
                break;
            case 'bomber':
                this.bomberAI(player);
                break;
            case 'dragon':
                this.dragonAI(player, level);
                break;
        }
    }
    
    slimeAI(level) {
        if (this.facingRight) {
            this.vx = this.speed;
        } else {
            this.vx = -this.speed;
        }
        
        const checkX = this.facingRight ? this.x + this.width + 5 : this.x - 5;
        const groundCheck = level.isSolid(Math.floor(checkX / level.tileSize), Math.floor((this.y + this.height + 5) / level.tileSize));
        const wallCheck = level.isSolid(Math.floor(checkX / level.tileSize), Math.floor((this.y + this.height / 2) / level.tileSize));
        
        if (!groundCheck || wallCheck) {
            this.facingRight = !this.facingRight;
        }
    }
    
    skeletonAI(player, level) {
        const distX = player.x - this.x;
        
        if (Math.abs(distX) < 300) {
            this.facingRight = distX > 0;
            this.vx = this.facingRight ? this.speed : -this.speed;
        } else {
            this.vx = 0;
        }
    }
    
    ghostAI(player) {
        const distX = player.x - this.x;
        const distY = player.y - this.y;
        const dist = Math.sqrt(distX * distX + distY * distY);
        
        if (dist > 5) {
            this.vx = (distX / dist) * this.speed;
            this.vy = (distY / dist) * this.speed;
        }
        
        this.facingRight = distX > 0;
    }
    
    bomberAI(player) {
        const time = Date.now() / 200;
        this.vx = Math.sin(time) * this.speed;
        this.vy = Math.cos(time * 0.7) * this.speed * 0.5;
        this.facingRight = this.vx > 0;
    }
    
    dragonAI(player, level) {
        const distX = player.x - this.x;
        this.facingRight = distX > 0;
        
        if (Math.abs(distX) > 100) {
            this.vx = this.facingRight ? this.speed : -this.speed;
        } else {
            this.vx = 0;
        }
        
        this.fireTimer++;
        if (this.fireTimer >= this.fireInterval) {
            this.fireTimer = 0;
            this.fire(player);
        }
    }
    
    fire(player) {
        const fireX = this.facingRight ? this.x + this.width : this.x - 30;
        Game.spawnFire(fireX, this.y + 20, this.facingRight);
    }
    
    handleCollisions(level) {
        const left = Math.floor(this.x / level.tileSize);
        const right = Math.floor((this.x + this.width) / level.tileSize);
        const bottom = Math.floor((this.y + this.height) / level.tileSize);
        
        for (let tx = left; tx <= right; tx++) {
            if (level.isSolid(tx, bottom)) {
                this.y = bottom * level.tileSize - this.height;
                this.vy = 0;
            }
        }
    }
    
    draw(ctx) {
        if (this.dead) return;
        
        ctx.save();
        
        switch (this.type) {
            case 'slime':
                this.drawSlime(ctx);
                break;
            case 'skeleton':
                this.drawSkeleton(ctx);
                break;
            case 'ghost':
                this.drawGhost(ctx);
                break;
            case 'bomber':
                this.drawBomber(ctx);
                break;
            case 'dragon':
                this.drawDragon(ctx);
                break;
        }
        
        if (this.health < this.maxHealth) {
            const barWidth = this.width;
            const barHeight = 4;
            const barX = this.x;
            const barY = this.y - 10;
            
            ctx.fillStyle = '#333333';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(barX, barY, barWidth * (this.health / this.maxHealth), barHeight);
        }
        
        ctx.restore();
    }
    
    drawSlime(ctx) {
        const bounce = Math.sin(this.animFrame * 0.5) * 2;
        
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height - bounce, this.width / 2, this.height / 2 + bounce, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 8, 5, 0, Math.PI * 2);
        ctx.arc(this.x + 22, this.y + 8, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(this.x + 12, this.y + 8, 2, 0, Math.PI * 2);
        ctx.arc(this.x + 24, this.y + 8, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawSkeleton(ctx) {
        ctx.fillStyle = '#eeeeee';
        ctx.fillRect(this.x + 8, this.y + 16, 16, 24);
        
        ctx.beginPath();
        ctx.arc(this.x + 16, this.y + 12, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(this.x + 12, this.y + 10, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 20, this.y + 10, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#888888';
        const shieldX = this.facingRight ? this.x + 26 : this.x - 8;
        ctx.fillRect(shieldX, this.y + 16, 10, 24);
    }
    
    drawGhost(ctx) {
        const float = Math.sin(this.animFrame * 0.5) * 3;
        
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#aa88ff';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height);
        ctx.quadraticCurveTo(this.x, this.y + float, this.x + this.width / 2, this.y + float);
        ctx.quadraticCurveTo(this.x + this.width, this.y + float, this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x + this.width - 5, this.y + this.height - 8 + float);
        ctx.lineTo(this.x + this.width - 10, this.y + this.height);
        ctx.lineTo(this.x + this.width - 15, this.y + this.height - 6 + float);
        ctx.lineTo(this.x + this.width - 20, this.y + this.height);
        ctx.lineTo(this.x + 5, this.y + this.height - 8 + float);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 14 + float, 5, 0, Math.PI * 2);
        ctx.arc(this.x + 18, this.y + 14 + float, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(this.x + 11, this.y + 14 + float, 2, 0, Math.PI * 2);
        ctx.arc(this.x + 19, this.y + 14 + float, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawBomber(ctx) {
        const wobble = Math.sin(this.animFrame * 0.8) * 2;
        
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2 + wobble, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(this.x + this.width / 2 - 2, this.y - 5, 4, 8);
        
        const spark = Math.random() * 4;
        ctx.fillStyle = '#ff8800';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y - 8, spark, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 12, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 18, this.y + 12, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawDragon(ctx) {
        ctx.save();
        
        if (!this.facingRight) {
            ctx.translate(this.x + this.width, 0);
            ctx.scale(-1, 1);
            ctx.translate(-this.x, 0);
        }
        
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(this.x + 10, this.y + 20, 40, 24);
        
        ctx.beginPath();
        ctx.moveTo(this.x + 50, this.y + 20);
        ctx.lineTo(this.x + 64, this.y + 10);
        ctx.lineTo(this.x + 64, this.y + 35);
        ctx.lineTo(this.x + 50, this.y + 44);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(this.x + 55, this.y + 22);
        ctx.lineTo(this.x + 64, this.y + 18);
        ctx.lineTo(this.x + 64, this.y + 32);
        ctx.closePath();
        ctx.fillStyle = '#ffff00';
        ctx.fill();
        
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(this.x + 10, this.y + 25);
        ctx.lineTo(this.x - 10, this.y + 30);
        ctx.lineTo(this.x + 5, this.y + 44);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(this.x + 56, this.y + 20, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(this.x + 57, this.y + 20, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

class FireProjectile {
    constructor(x, y, right) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 20;
        this.vx = right ? 8 : -8;
        this.dead = false;
        this.lifetime = 120;
    }
    
    update(player) {
        this.x += this.vx;
        this.lifetime--;
        
        if (this.lifetime <= 0) {
            this.dead = true;
        }
        
        if (!player.invincible && Utils.rectCollision(this, player)) {
            player.takeDamage(1);
            this.dead = true;
        }
    }
    
    draw(ctx) {
        ctx.fillStyle = '#ff4400';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width / 4, this.height / 3, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}