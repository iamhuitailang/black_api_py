class Trap {
    constructor(x, y, type, options = {}) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.isActive = true;
        this.animFrame = 0;
        this.animTimer = 0;
        
        this.setupByType(options);
    }
    
    setupByType(options) {
        switch (this.type) {
            case 'spike':
                this.width = options.width || 32;
                this.height = 16;
                break;
            case 'saw':
                this.width = 32;
                this.height = 32;
                this.startX = this.x;
                this.endX = options.endX || this.x + 200;
                this.speed = options.speed || 2;
                this.movingRight = true;
                break;
            case 'fire':
                this.width = 32;
                this.height = 48;
                this.interval = options.interval || 120;
                this.duration = options.duration || 60;
                this.timer = 0;
                this.firing = false;
                break;
            case 'breakable':
                this.width = 32;
                this.height = 32;
                this.breakTimer = 0;
                this.broken = false;
                this.respawnTime = 300;
                break;
        }
    }
    
    update(player, level) {
        this.animTimer++;
        if (this.animTimer >= 8) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
        
        switch (this.type) {
            case 'saw':
                this.updateSaw();
                break;
            case 'fire':
                this.updateFire();
                break;
            case 'breakable':
                this.updateBreakable(player, level);
                break;
        }
    }
    
    updateSaw() {
        if (this.movingRight) {
            this.x += this.speed;
            if (this.x >= this.endX) {
                this.movingRight = false;
            }
        } else {
            this.x -= this.speed;
            if (this.x <= this.startX) {
                this.movingRight = true;
            }
        }
    }
    
    updateFire() {
        this.timer++;
        if (this.timer >= this.interval + this.duration) {
            this.timer = 0;
        }
        this.firing = this.timer >= this.interval;
        this.isActive = this.firing;
    }
    
    updateBreakable(player, level) {
        if (this.broken) {
            this.breakTimer++;
            if (this.breakTimer >= this.respawnTime) {
                this.broken = false;
                this.isActive = false;
                this.breakTimer = 0;
            }
            return;
        }
        
        const playerOnTop = player.y + player.height >= this.y &&
                           player.y + player.height <= this.y + 10 &&
                           player.x + player.width > this.x &&
                           player.x < this.x + this.width &&
                           player.vy >= 0;
        
        if (playerOnTop) {
            this.breakTimer++;
            if (this.breakTimer >= 60) {
                this.broken = true;
                this.breakTimer = 0;
                this.isActive = false;
            }
        } else if (this.breakTimer > 0) {
            this.breakTimer = Math.max(0, this.breakTimer - 2);
        }
    }
    
    draw(ctx) {
        ctx.save();
        
        switch (this.type) {
            case 'spike':
                this.drawSpike(ctx);
                break;
            case 'saw':
                this.drawSaw(ctx);
                break;
            case 'fire':
                this.drawFire(ctx);
                break;
            case 'breakable':
                this.drawBreakable(ctx);
                break;
        }
        
        ctx.restore();
    }
    
    drawSpike(ctx) {
        ctx.fillStyle = '#888888';
        const spikeCount = Math.floor(this.width / 16);
        for (let i = 0; i < spikeCount; i++) {
            ctx.beginPath();
            ctx.moveTo(this.x + i * 16, this.y + this.height);
            ctx.lineTo(this.x + i * 16 + 8, this.y);
            ctx.lineTo(this.x + i * 16 + 16, this.y + this.height);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.fillStyle = '#aaaaaa';
        for (let i = 0; i < spikeCount; i++) {
            ctx.beginPath();
            ctx.moveTo(this.x + i * 16 + 4, this.y + this.height);
            ctx.lineTo(this.x + i * 16 + 8, this.y + 4);
            ctx.lineTo(this.x + i * 16 + 12, this.y + this.height);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    drawSaw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.animFrame * Math.PI / 2);
        
        ctx.fillStyle = '#aaaaaa';
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#666666';
        for (let i = 0; i < 8; i++) {
            ctx.save();
            ctx.rotate(i * Math.PI / 4);
            ctx.beginPath();
            ctx.moveTo(0, -4);
            ctx.lineTo(this.width / 2 - 2, -2);
            ctx.lineTo(this.width / 2, 0);
            ctx.lineTo(this.width / 2 - 2, 2);
            ctx.lineTo(0, 4);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
        
        ctx.fillStyle = '#444444';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    drawFire(ctx) {
        if (this.firing) {
            const flicker = Math.random() * 4;
            
            ctx.fillStyle = '#ff4400';
            ctx.beginPath();
            ctx.moveTo(this.x + 4, this.y + this.height);
            ctx.quadraticCurveTo(this.x + this.width / 2, this.y + flicker, this.x + this.width - 4, this.y + this.height);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.moveTo(this.x + 10, this.y + this.height);
            ctx.quadraticCurveTo(this.x + this.width / 2, this.y + 10 + flicker, this.x + this.width - 10, this.y + this.height);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillStyle = '#664422';
            ctx.fillRect(this.x + 8, this.y + this.height - 8, 16, 8);
        }
    }
    
    drawBreakable(ctx) {
        if (this.broken) return;
        
        const shake = this.breakTimer > 30 ? (Math.random() - 0.5) * 4 : 0;
        
        ctx.fillStyle = this.breakTimer > 30 ? '#aa6644' : '#886644';
        ctx.fillRect(this.x + shake, this.y, this.width, this.height);
        
        if (this.breakTimer > 0) {
            ctx.strokeStyle = '#553322';
            ctx.lineWidth = 2;
            const progress = this.breakTimer / 60;
            
            if (progress > 0.3) {
                ctx.beginPath();
                ctx.moveTo(this.x + 8 + shake, this.y + 4);
                ctx.lineTo(this.x + 16 + shake, this.y + 16);
                ctx.lineTo(this.x + 8 + shake, this.y + 28);
                ctx.stroke();
            }
            if (progress > 0.6) {
                ctx.beginPath();
                ctx.moveTo(this.x + 24 + shake, this.y + 4);
                ctx.lineTo(this.x + 20 + shake, this.y + 20);
                ctx.lineTo(this.x + 28 + shake, this.y + 28);
                ctx.stroke();
            }
        }
    }
}

class Collectible {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.collected = false;
        this.animFrame = 0;
        this.animTimer = 0;
        this.floatOffset = 0;
        
        switch (type) {
            case 'coin':
                this.width = 20;
                this.height = 20;
                this.value = 10;
                break;
            case 'mana':
                this.width = 20;
                this.height = 24;
                this.value = 20;
                break;
            case 'gem':
                this.width = 24;
                this.height = 24;
                this.value = 100;
                break;
            case 'health':
                this.width = 24;
                this.height = 24;
                this.value = 1;
                break;
        }
    }
    
    collect(player) {
        if (this.collected) return;
        this.collected = true;
        
        switch (this.type) {
            case 'coin':
            case 'gem':
                AudioSystem.collectCoin();
                Game.addScore(this.value);
                break;
            case 'mana':
                AudioSystem.collectMana();
                player.mana = Math.min(player.maxMana, player.mana + this.value);
                break;
            case 'health':
                AudioSystem.collectCoin();
                player.health = Math.min(player.maxHealth, player.health + this.value);
                break;
        }
    }
    
    update() {
        this.animTimer++;
        if (this.animTimer >= 10) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
        this.floatOffset = Math.sin(Date.now() / 200) * 3;
    }
    
    draw(ctx) {
        if (this.collected) return;
        
        ctx.save();
        const y = this.y + this.floatOffset;
        
        switch (this.type) {
            case 'coin':
                this.drawCoin(ctx, y);
                break;
            case 'mana':
                this.drawMana(ctx, y);
                break;
            case 'gem':
                this.drawGem(ctx, y);
                break;
            case 'health':
                this.drawHealth(ctx, y);
                break;
        }
        
        ctx.restore();
    }
    
    drawCoin(ctx, y) {
        const sparkle = Math.random() > 0.7;
        
        ctx.fillStyle = '#ffdd00';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, y + this.height / 2, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffee66';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2 - 2, y + this.height / 2 - 2, this.width / 4, this.height / 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        if (sparkle) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(this.x + 4, y + 4, 3, 3);
        }
    }
    
    drawMana(ctx, y) {
        ctx.fillStyle = '#aa44ff';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, y);
        ctx.lineTo(this.x + this.width, y + this.height / 2);
        ctx.lineTo(this.x + this.width / 2, y + this.height);
        ctx.lineTo(this.x, y + this.height / 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#cc88ff';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, y + 4);
        ctx.lineTo(this.x + this.width - 4, y + this.height / 2);
        ctx.lineTo(this.x + this.width / 2, y + this.height / 2);
        ctx.lineTo(this.x + 4, y + this.height / 2);
        ctx.closePath();
        ctx.fill();
    }
    
    drawGem(ctx, y) {
        const sparkle = Math.random() > 0.7;
        
        ctx.fillStyle = '#00ffaa';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, y);
        ctx.lineTo(this.x + this.width, y + this.height / 3);
        ctx.lineTo(this.x + this.width / 2, y + this.height);
        ctx.lineTo(this.x, y + this.height / 3);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#66ffcc';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, y + 4);
        ctx.lineTo(this.x + this.width - 6, y + this.height / 3);
        ctx.lineTo(this.x + this.width / 2, y + this.height / 2);
        ctx.lineTo(this.x + 6, y + this.height / 3);
        ctx.closePath();
        ctx.fill();
        
        if (sparkle) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(this.x + 8, y + 8, 4, 4);
        }
    }
    
    drawHealth(ctx, y) {
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, y + 6);
        ctx.bezierCurveTo(this.x + this.width / 2 - 8, y, this.x, y + 8, this.x + this.width / 2, y + this.height);
        ctx.bezierCurveTo(this.x + this.width, y + 8, this.x + this.width / 2 + 8, y, this.x + this.width / 2, y + 6);
        ctx.fill();
        
        ctx.fillStyle = '#ff8888';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2 - 4, y + 10, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}