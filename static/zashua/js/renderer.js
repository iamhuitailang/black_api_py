class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.theme = GameConfig.THEMES.hell;
        this.fireTimer = 0;
        this.resize();
        
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.groundY = this.canvas.height - 100;
    }
    
    setTheme(themeName) {
        this.theme = GameConfig.THEMES[themeName] || GameConfig.THEMES.hell;
    }
    
    render(game) {
        this.clear();
        this.drawBackground();
        this.drawGround();
        
        this.drawPlayerZones(game);
        this.drawPlayers(game);
        this.drawItems(game);
        this.drawParticles();
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, this.theme.bgGradient[0]);
        gradient.addColorStop(0.5, this.theme.bgGradient[1]);
        gradient.addColorStop(1, this.theme.bgGradient[2]);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawGround() {
        this.ctx.fillStyle = this.theme.groundColor;
        this.ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);
        
        this.ctx.strokeStyle = this.theme.accentColor;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.groundY);
        this.ctx.lineTo(this.canvas.width, this.groundY);
        this.ctx.stroke();
    }
    
    drawBackgroundFire() {
        ParticleSystem.createFire(
            Math.random() * this.canvas.width,
            this.groundY,
            this.theme.particleColors
        );
    }
    
    drawPlayerZones(game) {
        const playerCount = game.players.length;
        const zoneWidth = this.canvas.width / playerCount;
        
        game.players.forEach((player, index) => {
            const x = index * zoneWidth;
            
            this.ctx.fillStyle = player.isEliminated ? 'rgba(50, 0, 0, 0.3)' : 'rgba(100, 0, 0, 0.2)';
            this.ctx.fillRect(x + 10, this.groundY - 150, zoneWidth - 20, 150);
            
            this.ctx.strokeStyle = player.isEliminated ? '#330000' : this.theme.accentColor;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x + 10, this.groundY - 150, zoneWidth - 20, 150);
        });
    }
    
    drawPlayers(game) {
        game.players.forEach(player => {
            this.drawPlayer(player);
        });
    }
    
    drawPlayer(player) {
        const x = player.x;
        const y = player.y;
        
        this.ctx.save();
        this.ctx.translate(x, y);
        
        if (player.isEliminated) {
            this.ctx.globalAlpha = 0.3;
        } else if (player.isStunned) {
            this.ctx.globalAlpha = 0.7;
            this.drawStunStars(0, -60);
        }
        
        if (player.hasShield) {
            this.drawShield(0, -20);
        }
        
        this.ctx.fillStyle = '#222';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 10, 30, 15, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = this.getPlayerColor(player.type);
        this.ctx.beginPath();
        this.ctx.arc(0, -20, 35, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        this.ctx.font = '40px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(player.emoji, 0, -20);
        
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(player.name, 0, -65);
        
        this.drawHpBar(player);
        
        if (!player.isAI) {
            this.ctx.fillStyle = this.theme.accentColor;
            this.ctx.beginPath();
            this.ctx.moveTo(0, -75);
            this.ctx.lineTo(-10, -90);
            this.ctx.lineTo(10, -90);
            this.ctx.closePath();
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    getPlayerColor(type) {
        const colors = {
            clown: '#ff6666',
            street: '#66ff66',
            strong: '#6666ff',
            girl: '#ff66ff'
        };
        return colors[type] || '#888';
    }
    
    drawHpBar(player) {
        const barWidth = 60;
        const barHeight = 8;
        const x = -barWidth / 2;
        const y = 25;
        
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x, y, barWidth, barHeight);
        
        const hpPercent = player.hp / player.maxHp;
        const hpColor = hpPercent > 0.5 ? '#44ff44' : hpPercent > 0.25 ? '#ffaa00' : '#ff4444';
        
        this.ctx.fillStyle = hpColor;
        this.ctx.fillRect(x, y, barWidth * hpPercent, barHeight);
        
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, barWidth, barHeight);
    }
    
    drawStunStars(x, y) {
        const time = Date.now() / 200;
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        
        for (let i = 0; i < 3; i++) {
            const angle = time + (i * Math.PI * 2) / 3;
            const sx = Math.cos(angle) * 25;
            const sy = Math.sin(angle) * 10;
            this.ctx.fillText('⭐', sx, sy);
        }
    }
    
    drawShield(x, y) {
        this.ctx.save();
        this.ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 200) * 0.2;
        this.ctx.strokeStyle = '#44aaff';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 50, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.restore();
    }
    
    drawItems(game) {
        game.items.forEach(item => {
            if (item.isActive) {
                this.drawItem(item);
            }
        });
    }
    
    drawItem(item) {
        this.ctx.save();
        this.ctx.translate(item.x, item.y);
        this.ctx.rotate(item.rotation);
        
        if (item.config.type === 'danger') {
            this.drawDangerGlow(item);
        }
        
        if (item.config.type === 'buff') {
            this.drawBuffGlow(item);
        }
        
        this.ctx.font = '35px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(item.config.emoji, 0, 0);
        
        this.ctx.restore();
    }
    
    drawDangerGlow(item) {
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 35);
        gradient.addColorStop(0, item.getDangerColor() + '88');
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 35, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawBuffGlow(item) {
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 40);
        gradient.addColorStop(0, item.config.color + 'aa');
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 40, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawItemParticles(item) {
        item.particles.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = item.getDangerColor();
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }
    
    drawParticles() {
        ParticleSystem.particles.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Renderer;
}