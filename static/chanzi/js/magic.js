class MagicSystem {
    constructor() {
        this.projectiles = [];
        this.currentSpell = 'fireball';
        this.cooldown = 0;
    }
    
    castSpell(player, direction) {
        if (player.mana < 25 || this.cooldown > 0) return false;
        
        player.mana -= 25;
        this.cooldown = 30;
        AudioSystem.magicUse();
        
        const x = direction > 0 ? player.x + player.width : player.x - 24;
        const y = player.y + player.height / 2 - 12;
        
        this.projectiles.push(new MagicProjectile(x, y, direction, this.currentSpell));
        return true;
    }
    
    update(player, enemies, level) {
        if (this.cooldown > 0) {
            this.cooldown--;
        }
        
        this.projectiles = this.projectiles.filter(proj => {
            proj.update();
            
            enemies.forEach(enemy => {
                if (!enemy.dead && Utils.rectCollision(proj, enemy)) {
                    enemy.takeDamage(3, proj.direction > 0);
                    proj.dead = true;
                }
            });
            
            const tileX = Math.floor(proj.x / level.tileSize);
            const tileY = Math.floor(proj.y / level.tileSize);
            if (level.isSolid(tileX, tileY)) {
                proj.dead = true;
            }
            
            return !proj.dead;
        });
    }
    
    draw(ctx) {
        this.projectiles.forEach(proj => proj.draw(ctx));
    }
    
    clear() {
        this.projectiles = [];
    }
}

class MagicProjectile {
    constructor(x, y, direction, type) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 24;
        this.direction = direction;
        this.type = type;
        this.speed = 8;
        this.dead = false;
        this.lifetime = 120;
        this.animFrame = 0;
    }
    
    update() {
        this.x += this.speed * this.direction;
        this.lifetime--;
        this.animFrame++;
        
        if (this.lifetime <= 0) {
            this.dead = true;
        }
    }
    
    draw(ctx) {
        ctx.save();
        
        switch (this.type) {
            case 'fireball':
                this.drawFireball(ctx);
                break;
            case 'ice':
                this.drawIce(ctx);
                break;
            case 'lightning':
                this.drawLightning(ctx);
                break;
        }
        
        ctx.restore();
    }
    
    drawFireball(ctx) {
        const pulse = Math.sin(this.animFrame * 0.3) * 2;
        
        ctx.fillStyle = '#ff4400';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 10 + pulse, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 6 + pulse * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 0.5;
        for (let i = 0; i < 3; i++) {
            const offsetX = -this.direction * (i * 8 + 4);
            const offsetY = Math.sin(this.animFrame * 0.5 + i) * 4;
            ctx.fillStyle = i === 0 ? '#ff6600' : i === 1 ? '#ff8800' : '#ffaa00';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2 + offsetX, this.y + this.height / 2 + offsetY, 4 - i, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawIce(ctx) {
        const pulse = Math.sin(this.animFrame * 0.3) * 2;
        
        ctx.fillStyle = '#88ddff';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y + pulse);
        ctx.lineTo(this.x + this.width, this.y + this.height / 2);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height - pulse);
        ctx.lineTo(this.x, this.y + this.height / 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#ccffff';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y + 4 + pulse);
        ctx.lineTo(this.x + this.width - 4, this.y + this.height / 2);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height / 2);
        ctx.lineTo(this.x + 4, this.y + this.height / 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2 - 2, this.y + this.height / 2 - 2, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawLightning(ctx) {
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        let px = this.x;
        let py = this.y + this.height / 2;
        ctx.moveTo(px, py);
        
        for (let i = 0; i < 5; i++) {
            px += this.direction * 5;
            py += (Math.random() - 0.5) * 10;
            ctx.lineTo(px, py);
        }
        ctx.stroke();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height / 2);
        
        px = this.x;
        py = this.y + this.height / 2;
        for (let i = 0; i < 5; i++) {
            px += this.direction * 5;
            py += (Math.random() - 0.5) * 6;
            ctx.lineTo(px, py);
        }
        ctx.stroke();
    }
}