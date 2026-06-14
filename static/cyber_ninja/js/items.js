class Item {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 24;
        this.type = type;
        this.vy = -5;
        this.active = true;
        this.bobOffset = 0;
        this.bobTimer = 0;
        this.rotation = 0;
        this.collected = false;
        this.collectTimer = 0;
    }

    update(deltaTime, game) {
        if (this.collected) {
            this.collectTimer -= deltaTime;
            if (this.collectTimer <= 0) {
                this.active = false;
            }
            return;
        }
        
        this.vy += 0.3;
        this.y += this.vy;
        this.rotation += 0.05;
        this.bobTimer += deltaTime;
        this.bobOffset = Math.sin(this.bobTimer / 200) * 5;
        
        if (this.y + this.height >= GameConfig.GROUND_Y) {
            this.y = GameConfig.GROUND_Y - this.height;
            this.vy = 0;
        }
        
        const playerBox = game.player.getBounds();
        const itemBox = this.getBounds();
        
        if (this.boxIntersects(playerBox, itemBox) && !game.player.isDead) {
            this.collect(game);
        }
    }

    getBounds() {
        return {
            left: this.x - this.width / 2,
            right: this.x + this.width / 2,
            top: this.y + this.bobOffset - this.height / 2,
            bottom: this.y + this.bobOffset + this.height / 2
        };
    }

    boxIntersects(a, b) {
        return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    }

    collect(game) {
        this.collected = true;
        this.collectTimer = 300;
        
        switch (this.type) {
            case 'data_shard':
                game.score += GameConfig.ITEMS.DATA_SHARD_SCORE;
                game.showFloatingText(this.x, this.y, `+${GameConfig.ITEMS.DATA_SHARD_SCORE}`, '#00ffff');
                break;
            case 'energy_core':
                game.player.heal(GameConfig.ITEMS.ENERGY_CORE_HEAL);
                game.showFloatingText(this.x, this.y, `+${GameConfig.ITEMS.ENERGY_CORE_HEAL} HP`, '#ff4444');
                break;
            case 'golden_module':
                game.showBuffSelection();
                break;
        }
        
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const color = this.getColor();
            particleSystem.addParticle(
                this.x,
                this.y,
                Math.cos(angle) * 3,
                Math.sin(angle) * 3,
                color,
                3,
                400
            );
        }
    }

    getColor() {
        switch (this.type) {
            case 'data_shard': return '#00ffff';
            case 'energy_core': return '#ff4444';
            case 'golden_module': return '#ffd700';
            default: return '#ffffff';
        }
    }

    draw(ctx) {
        const drawY = this.y + this.bobOffset;
        const alpha = this.collected ? this.collectTimer / 300 : 1;
        const scale = this.collected ? 1 + (1 - this.collectTimer / 300) * 0.5 : 1;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.x, drawY);
        ctx.rotate(this.rotation);
        ctx.scale(scale, scale);
        
        const color = this.getColor();
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        
        switch (this.type) {
            case 'data_shard':
                this.drawDataShard(ctx, color);
                break;
            case 'energy_core':
                this.drawEnergyCore(ctx, color);
                break;
            case 'golden_module':
                this.drawGoldenModule(ctx, color);
                break;
        }
        
        ctx.restore();
    }

    drawDataShard(ctx, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(10, -4);
        ctx.lineTo(8, 8);
        ctx.lineTo(-8, 8);
        ctx.lineTo(-10, -4);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(5, -2);
        ctx.lineTo(0, 0);
        ctx.lineTo(-5, -2);
        ctx.closePath();
        ctx.fill();
    }

    drawEnergyCore(ctx, color) {
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 12);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, color);
        gradient.addColorStop(1, 'rgba(255, 68, 68, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-2, -2, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawGoldenModule(ctx, color) {
        ctx.fillStyle = color;
        ctx.fillRect(-10, -10, 20, 20);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(-10, -10, 20, 20);
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-6, -2, 12, 4);
        ctx.fillRect(-2, -6, 4, 12);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(-10, -10, 20, 4);
    }
}

class FloatingText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 1000;
        this.maxLife = 1000;
        this.vy = -2;
        this.active = true;
    }

    update(deltaTime) {
        this.life -= deltaTime;
        this.y += this.vy;
        this.vy *= 0.98;
        
        if (this.life <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        const alpha = this.life / this.maxLife;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.font = 'bold 16px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}
