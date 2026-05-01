const Renderer = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    bgParticles: [],

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = GameConfig.CANVAS_WIDTH;
        this.height = GameConfig.CANVAS_HEIGHT;
        
        canvas.width = this.width;
        canvas.height = this.height;
        
        this.initBgParticles();
    },

    initBgParticles() {
        this.bgParticles = [];
        for (let i = 0; i < 30; i++) {
            this.bgParticles.push({
                x: Utils.random(0, this.width),
                y: Utils.random(0, this.height),
                speed: Utils.randomFloat(0.5, 1.5),
                size: Utils.random(1, 3),
                opacity: Utils.randomFloat(0.3, 0.6)
            });
        }
    },

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    },

    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#0a0a1a');
        gradient.addColorStop(0.5, '#1a1a2e');
        gradient.addColorStop(1, '#0a0a1a');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 40;
        for (let x = 0; x <= this.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
        
        this.updateBgParticles();
    },

    updateBgParticles() {
        for (const particle of this.bgParticles) {
            particle.y += particle.speed;
            
            if (particle.y > this.height) {
                particle.y = 0;
                particle.x = Utils.random(0, this.width);
            }
            
            this.ctx.save();
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.fillStyle = '#00ffff';
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    },

    draw(player, enemies, bullets, particles, effects) {
        this.drawBackground();
        
        for (const particle of particles) {
            if (particle.active) {
                particle.draw(this.ctx);
            }
        }
        
        for (const effect of effects) {
            if (effect.active) {
                effect.draw(this.ctx);
            }
        }
        
        for (const enemy of enemies) {
            if (enemy.active) {
                enemy.draw(this.ctx);
            }
        }
        
        for (const bullet of bullets) {
            if (bullet.active) {
                bullet.draw(this.ctx);
            }
        }
        
        if (player.active) {
            player.draw(this.ctx);
        }
    },

    drawPauseOverlay() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 10;
        this.ctx.fillText('已暂停', this.width / 2, this.height / 2);
        this.ctx.restore();
    },

    drawLevelUp(level, skinName) {
        this.ctx.save();
        
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        this.ctx.fillStyle = 'rgba(168, 85, 247, 0.3)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#a855f7';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#a855f7';
        this.ctx.shadowBlur = 15;
        this.ctx.fillText('🎖️ 坦克升级!', centerX, centerY - 40);
        
        this.ctx.fillStyle = '#fbbf24';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.shadowColor = '#fbbf24';
        this.ctx.fillText(`Lv.${level}`, centerX, centerY + 20);
        
        if (skinName) {
            this.ctx.fillStyle = '#00ffff';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.shadowColor = '#00ffff';
            this.ctx.fillText(`解锁: ${skinName}`, centerX, centerY + 60);
        }
        
        this.ctx.restore();
    },

    drawWaveNotification(wave, isBoss = false) {
        this.ctx.save();
        
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        const color = isBoss ? '#ef4444' : '#00ffff';
        
        this.ctx.fillStyle = isBoss ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 255, 255, 0.2)';
        this.ctx.fillRect(0, centerY - 60, this.width, 120);
        
        this.ctx.fillStyle = color;
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 15;
        
        if (isBoss) {
            this.ctx.fillText('⚠️ BOSS 关卡!', centerX, centerY);
        } else {
            this.ctx.fillText(`第 ${wave} 波`, centerX, centerY);
        }
        
        this.ctx.restore();
    }
};

window.Renderer = Renderer;
