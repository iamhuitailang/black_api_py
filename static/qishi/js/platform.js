class Platform {
    constructor(x, y, width, height, type = 'normal') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
    }

    draw(ctx) {
        switch (this.type) {
            case 'stone':
                this.drawStone(ctx);
                break;
            case 'bone':
                this.drawBone(ctx);
                break;
            default:
                this.drawNormal(ctx);
        }
    }

    drawNormal(ctx) {
        ctx.fillStyle = CONFIG.COLORS.PLATFORM;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.fillStyle = CONFIG.COLORS.PLATFORM_LIGHT;
        ctx.fillRect(this.x, this.y, this.width, 3);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.x, this.y + this.height - 2, this.width, 2);
    }

    drawStone(ctx) {
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.fillStyle = '#3a3a4a';
        for (let i = 0; i < this.width; i += 20) {
            ctx.fillRect(this.x + i, this.y, 10, 3);
        }
        
        ctx.strokeStyle = '#1a1a2a';
        ctx.lineWidth = 1;
        for (let i = 0; i < this.width; i += 40) {
            ctx.beginPath();
            ctx.moveTo(this.x + i, this.y);
            ctx.lineTo(this.x + i + 10, this.y + this.height);
            ctx.stroke();
        }
    }

    drawBone(ctx) {
        ctx.fillStyle = '#d0c8b8';
        ctx.fillRect(this.x, this.y + 5, this.width, this.height - 10);
        
        ctx.beginPath();
        ctx.ellipse(this.x + 5, this.y + this.height / 2, 10, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(this.x + this.width - 5, this.y + this.height / 2, 10, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        for (let i = 15; i < this.width - 15; i += 20) {
            ctx.fillRect(this.x + i, this.y + 8, 2, this.height - 16);
        }
    }
}

class Wall {
    constructor(x, y, width, height, type = 'stone') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
    }

    draw(ctx) {
        ctx.fillStyle = CONFIG.COLORS.WALL;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.fillStyle = '#251535';
        for (let y = this.y; y < this.y + this.height; y += 30) {
            for (let x = this.x; x < this.x + this.width; x += 40) {
                const offset = (Math.floor((y - this.y) / 30) % 2) * 20;
                ctx.fillRect(x + offset, y, 38, 28);
            }
        }
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.x, this.y, 2, this.height);
        ctx.fillRect(this.x + this.width - 2, this.y, 2, this.height);
    }
}

class Bench {
    constructor(x, y, sceneName) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 30;
        this.sceneName = sceneName;
        this.isActive = false;
        this.glowIntensity = 0;
    }

    update(player) {
        const dist = Math.sqrt(
            Math.pow(player.getCenterX() - (this.x + this.width / 2), 2) +
            Math.pow(player.getCenterY() - (this.y + this.height / 2), 2)
        );
        
        this.isActive = dist < 60;
        
        if (this.isActive) {
            this.glowIntensity = Math.min(1, this.glowIntensity + 0.05);
        } else {
            this.glowIntensity = Math.max(0, this.glowIntensity - 0.02);
        }
    }

    draw(ctx) {
        if (this.glowIntensity > 0) {
            const gradient = ctx.createRadialGradient(
                this.x + this.width / 2, this.y + this.height / 2, 0,
                this.x + this.width / 2, this.y + this.height / 2, 60
            );
            gradient.addColorStop(0, `rgba(255, 200, 100, ${this.glowIntensity * 0.4})`);
            gradient.addColorStop(1, 'rgba(255, 200, 100, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(this.x - 30, this.y - 30, this.width + 60, this.height + 60);
        }
        
        ctx.fillStyle = '#4a3020';
        ctx.fillRect(this.x + 5, this.y + 10, this.width - 10, 5);
        ctx.fillRect(this.x + 10, this.y + 15, 4, 15);
        ctx.fillRect(this.x + this.width - 14, this.y + 15, 4, 15);
        
        ctx.fillStyle = '#6a5040';
        ctx.fillRect(this.x + 3, this.y + 8, this.width - 6, 4);
        
        ctx.strokeStyle = `rgba(255, 220, 150, ${this.glowIntensity})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x + 2, this.y + 7, this.width - 4, 5);
        
        if (this.isActive) {
            ctx.fillStyle = '#ffe0a0';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('按 E 休息', this.x + this.width / 2, this.y - 10);
        }
    }

    getCheckpoint() {
        return {
            scene: this.sceneName,
            x: this.x,
            y: this.y - 50
        };
    }
}

class Collectible {
    constructor(x, y, type, value) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.type = type;
        this.value = value;
        this.collected = false;
        this.floatOffset = Math.random() * Math.PI * 2;
    }

    update() {
        this.floatOffset += 0.05;
    }

    draw(ctx) {
        if (this.collected) return;
        
        const floatY = Math.sin(this.floatOffset) * 5;
        
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2 + floatY);
        
        switch (this.type) {
            case 'essence':
                this.drawEssence(ctx);
                break;
            case 'health':
                this.drawHealth(ctx);
                break;
            case 'soul':
                this.drawSoul(ctx);
                break;
        }
        
        ctx.restore();
    }

    drawEssence(ctx) {
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 15);
        gradient.addColorStop(0, 'rgba(255, 220, 100, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 220, 100, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffe060';
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const r = i % 2 === 0 ? 8 : 4;
            if (i === 0) {
                ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
            } else {
                ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
            }
        }
        ctx.closePath();
        ctx.fill();
    }

    drawHealth(ctx) {
        ctx.fillStyle = 'rgba(255, 50, 50, 0.3)';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ff4040';
        ctx.beginPath();
        ctx.moveTo(0, 8);
        ctx.bezierCurveTo(-8, 0, -8, -6, 0, -8);
        ctx.bezierCurveTo(8, -6, 8, 0, 0, 8);
        ctx.fill();
    }

    drawSoul(ctx) {
        ctx.fillStyle = 'rgba(60, 150, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#40a0ff';
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(6, 0);
        ctx.lineTo(0, 8);
        ctx.lineTo(-6, 0);
        ctx.closePath();
        ctx.fill();
    }

    checkCollision(player) {
        if (this.collected) return false;
        
        return player.x < this.x + this.width &&
               player.x + player.width > this.x &&
               player.y < this.y + this.height &&
               player.y + player.height > this.y;
    }
}

class AbilityPickup {
    constructor(x, y, abilityType) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 50;
        this.abilityType = abilityType;
        this.collected = false;
        this.glowPhase = 0;
    }

    update() {
        this.glowPhase += 0.03;
    }

    draw(ctx) {
        if (this.collected) return;
        
        const glowSize = 30 + Math.sin(this.glowPhase) * 5;
        const gradient = ctx.createRadialGradient(
            this.x + this.width / 2, this.y + this.height / 2, 0,
            this.x + this.width / 2, this.y + this.height / 2, glowSize + 20
        );
        gradient.addColorStop(0, 'rgba(150, 100, 255, 0.6)');
        gradient.addColorStop(1, 'rgba(150, 100, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x - 20, this.y - 20, this.width + 40, this.height + 40);
        
        ctx.fillStyle = '#1a0a2a';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height * 0.3);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height * 0.3);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#8060a0';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#c0a0e0';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let icon = '?';
        switch (this.abilityType) {
            case 'dash': icon = '💨'; break;
            case 'wallClimb': icon = '🧗'; break;
            case 'spell': icon = '🎯'; break;
            case 'shadowDash': icon = '✨'; break;
        }
        ctx.fillText(icon, this.x + this.width / 2, this.y + this.height / 2 + 5);
    }

    checkCollision(player) {
        if (this.collected) return false;
        
        return player.x < this.x + this.width &&
               player.x + player.width > this.x &&
               player.y < this.y + this.height &&
               player.y + player.height > this.y;
    }
}