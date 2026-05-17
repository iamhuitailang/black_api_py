class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.cameraX = 0;
        this.cameraY = 0;
        this.shake = null;
        this.transitionAlpha = 0;
        this.transitionType = null;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    setCamera(targetX, targetY, levelWidth) {
        const targetCameraX = targetX - this.width / 2;
        this.cameraX = Utils.clamp(targetCameraX, 0, Math.max(0, levelWidth - this.width));
        this.cameraY = 0;
    }

    applyShake() {
        if (this.shake) {
            const elapsed = Date.now() - this.shake.startTime;
            if (elapsed < this.shake.duration) {
                const progress = 1 - elapsed / this.shake.duration;
                const intensity = this.shake.intensity * progress;
                this.ctx.save();
                this.ctx.translate(
                    Utils.random(-intensity, intensity),
                    Utils.random(-intensity, intensity)
                );
            } else {
                this.shake = null;
            }
        }
    }

    resetShakeTransform() {
        if (this.shake) {
            this.ctx.restore();
        }
    }

    triggerShake(intensity = 5, duration = 200) {
        this.shake = {
            intensity: intensity,
            duration: duration,
            startTime: Date.now()
        };
    }

    drawLevel(level) {
        this.applyShake();
        level.draw(this.ctx, this.cameraX);
        this.resetShakeTransform();
    }

    drawUI(game) {
        this.drawHUD(game);
        this.drawTransition();
    }

    drawHUD(game) {
        const player1 = game.players[0];
        if (player1) {
            this.drawPlayerStats(player1, 20, 20, 'P1');
        }

        if (game.mode === 'coop' && game.players[1]) {
            this.drawPlayerStats(game.players[1], 20, 70, 'P2');
        }

        this.drawCenterHUD(game);
        this.drawRightHUD(game);
    }

    drawPlayerStats(player, x, y, label) {
        const ctx = this.ctx;
        
        ctx.fillStyle = CONFIG.COLORS.neonBlue;
        ctx.shadowColor = CONFIG.COLORS.neonBlue;
        ctx.shadowBlur = 5;
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.fillText(label, x, y);
        ctx.shadowBlur = 0;

        for (let i = 0; i < CONFIG.PLAYER.MAX_HEALTH; i++) {
            ctx.fillStyle = i < player.health ? CONFIG.COLORS.neonRed : '#333';
            if (i < player.health) {
                ctx.shadowColor = CONFIG.COLORS.neonRed;
                ctx.shadowBlur = 5;
            }
            this.drawHeart(x + 40 + i * 25, y - 12, 18);
            ctx.shadowBlur = 0;
        }

        ctx.fillStyle = CONFIG.COLORS.neonYellow;
        ctx.shadowColor = CONFIG.COLORS.neonYellow;
        ctx.shadowBlur = 5;
        ctx.font = '14px "Courier New", monospace';
        ctx.fillText(`x${player.lives}`, x + 40 + CONFIG.PLAYER.MAX_HEALTH * 25 + 10, y);
        ctx.shadowBlur = 0;
    }

    drawHeart(x, y, size) {
        const ctx = this.ctx;
        ctx.beginPath();
        const s = size / 2;
        ctx.moveTo(x + s, y + size * 0.8);
        ctx.bezierCurveTo(x, y + size * 0.4, x, y - size * 0.1, x + s, y + size * 0.2);
        ctx.bezierCurveTo(x + s * 2, y - size * 0.1, x + s * 2, y + size * 0.4, x + s, y + size * 0.8);
        ctx.fill();
    }

    drawCenterHUD(game) {
        const ctx = this.ctx;
        const centerX = this.width / 2;

        ctx.fillStyle = CONFIG.COLORS.neonGreen;
        ctx.shadowColor = CONFIG.COLORS.neonGreen;
        ctx.shadowBlur = 10;
        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`得分: ${game.score}`, centerX, 35);
        ctx.fillText(`关卡: ${game.currentLevel}/${LEVELS.length}`, centerX, 60);
        ctx.textAlign = 'left';
        ctx.shadowBlur = 0;
    }

    drawRightHUD(game) {
        const ctx = this.ctx;
        const rightX = this.width - 20;

        ctx.fillStyle = CONFIG.COLORS.neonYellow;
        ctx.shadowColor = CONFIG.COLORS.neonYellow;
        ctx.shadowBlur = 10;
        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(Utils.formatTime(game.levelTime), rightX, 35);
        ctx.shadowBlur = 0;

        const player1 = game.players[0];
        if (player1) {
            ctx.fillStyle = '#fff';
            ctx.font = '14px "Courier New", monospace';
            ctx.fillText(`🌸 x${player1.flowerCount}  ⭐ x${player1.starCount}`, rightX, 55);
        }

        ctx.textAlign = 'left';
    }

    drawTransition() {
        if (this.transitionAlpha > 0) {
            this.ctx.fillStyle = `rgba(0, 0, 0, ${this.transitionAlpha})`;
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
    }

    startTransition(type, duration = 500) {
        this.transitionType = type;
        this.transitionAlpha = 0;
        this.transitionDuration = duration;
        this.transitionStartTime = Date.now();
        this.transitionPhase = 'in';
    }

    updateTransition() {
        if (!this.transitionType) return false;

        const elapsed = Date.now() - this.transitionStartTime;
        const progress = Math.min(elapsed / this.transitionDuration, 1);

        if (this.transitionPhase === 'in') {
            this.transitionAlpha = progress;
            if (progress >= 1) {
                this.transitionPhase = 'out';
                this.transitionStartTime = Date.now();
                return true;
            }
        } else {
            this.transitionAlpha = 1 - progress;
            if (progress >= 1) {
                this.transitionType = null;
                this.transitionAlpha = 0;
            }
        }

        return false;
    }

    drawLoadingScreen(progress) {
        const ctx = this.ctx;
        
        ctx.fillStyle = CONFIG.COLORS.darkBg;
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.fillStyle = CONFIG.COLORS.neonPink;
        ctx.shadowColor = CONFIG.COLORS.neonPink;
        ctx.shadowBlur = 20;
        ctx.font = 'bold 64px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('松鼠大战', this.width / 2, this.height / 2 - 60);
        ctx.shadowBlur = 0;

        ctx.fillStyle = CONFIG.COLORS.neonYellow;
        ctx.shadowColor = CONFIG.COLORS.neonYellow;
        ctx.shadowBlur = 10;
        ctx.font = '24px "Courier New", monospace';
        ctx.fillText('经典复刻版', this.width / 2, this.height / 2 - 20);
        ctx.shadowBlur = 0;

        const barWidth = 300;
        const barHeight = 20;
        const barX = (this.width - barWidth) / 2;
        const barY = this.height / 2 + 20;

        ctx.fillStyle = CONFIG.COLORS.darkSurface;
        ctx.fillRect(barX, barY, barWidth, barHeight);

        const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
        gradient.addColorStop(0, CONFIG.COLORS.neonBlue);
        gradient.addColorStop(1, CONFIG.COLORS.neonPink);
        ctx.fillStyle = gradient;
        ctx.shadowColor = CONFIG.COLORS.neonBlue;
        ctx.shadowBlur = 10;
        ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        ctx.shadowBlur = 0;

        ctx.strokeStyle = CONFIG.COLORS.neonBlue;
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = CONFIG.COLORS.neonGreen;
        ctx.font = '16px "Courier New", monospace';
        ctx.fillText(`加载中... ${Math.floor(progress * 100)}%`, this.width / 2, barY + barHeight + 25);

        ctx.textAlign = 'left';
    }

    drawPauseOverlay() {
        const ctx = this.ctx;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.fillStyle = CONFIG.COLORS.neonBlue;
        ctx.shadowColor = CONFIG.COLORS.neonBlue;
        ctx.shadowBlur = 20;
        ctx.font = 'bold 48px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('游戏暂停', this.width / 2, this.height / 2 - 40);
        ctx.shadowBlur = 0;

        ctx.fillStyle = CONFIG.COLORS.neonYellow;
        ctx.font = '20px "Courier New", monospace';
        ctx.fillText('按 Enter 继续', this.width / 2, this.height / 2 + 20);
        ctx.fillText('按 R 重新开始', this.width / 2, this.height / 2 + 50);
        ctx.fillText('按 ESC 返回菜单', this.width / 2, this.height / 2 + 80);

        ctx.textAlign = 'left';
    }

    drawGameOverScreen(game) {
        const ctx = this.ctx;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.fillStyle = CONFIG.COLORS.neonRed;
        ctx.shadowColor = CONFIG.COLORS.neonRed;
        ctx.shadowBlur = 20;
        ctx.font = 'bold 64px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('游戏结束', this.width / 2, this.height / 2 - 80);
        ctx.shadowBlur = 0;

        ctx.fillStyle = CONFIG.COLORS.neonYellow;
        ctx.font = '24px "Courier New", monospace';
        ctx.fillText(`最终得分: ${game.score}`, this.width / 2, this.height / 2 - 20);
        ctx.fillText(`击杀数: ${game.killCount}`, this.width / 2, this.height / 2 + 15);
        ctx.fillText(`用时: ${Utils.formatTime(game.totalTime)}`, this.width / 2, this.height / 2 + 50);

        ctx.fillStyle = CONFIG.COLORS.neonGreen;
        ctx.font = '18px "Courier New", monospace';
        ctx.fillText('按 Enter 重新开始', this.width / 2, this.height / 2 + 100);
        ctx.fillText('按 ESC 返回菜单', this.width / 2, this.height / 2 + 130);

        ctx.textAlign = 'left';
    }

    drawLevelCompleteScreen(game) {
        const ctx = this.ctx;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.fillStyle = CONFIG.COLORS.neonGreen;
        ctx.shadowColor = CONFIG.COLORS.neonGreen;
        ctx.shadowBlur = 20;
        ctx.font = 'bold 48px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('关卡完成!', this.width / 2, this.height / 2 - 100);
        ctx.shadowBlur = 0;

        ctx.fillStyle = CONFIG.COLORS.neonYellow;
        ctx.font = '24px "Courier New", monospace';
        ctx.fillText(`得分: ${game.score}`, this.width / 2, this.height / 2 - 40);
        ctx.fillText(`击杀数: ${game.killCount}`, this.width / 2, this.height / 2 - 5);
        ctx.fillText(`用时: ${Utils.formatTime(game.levelTime)}`, this.width / 2, this.height / 2 + 30);

        const rank = Utils.calculateRank(game.score, game.levelTime, game.killCount);
        ctx.fillStyle = this.getRankColor(rank);
        ctx.shadowColor = this.getRankColor(rank);
        ctx.shadowBlur = 15;
        ctx.font = 'bold 72px "Courier New", monospace';
        ctx.fillText(rank, this.width / 2, this.height / 2 + 110);
        ctx.shadowBlur = 0;

        ctx.fillStyle = CONFIG.COLORS.neonBlue;
        ctx.font = '18px "Courier New", monospace';
        ctx.fillText('按 Enter 进入下一关', this.width / 2, this.height / 2 + 160);

        ctx.textAlign = 'left';
    }

    drawVictoryScreen(game) {
        const ctx = this.ctx;
        
        const gradient = ctx.createRadialGradient(
            this.width / 2, this.height / 2, 0,
            this.width / 2, this.height / 2, 400
        );
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.fillStyle = CONFIG.COLORS.neonYellow;
        ctx.shadowColor = CONFIG.COLORS.neonYellow;
        ctx.shadowBlur = 30;
        ctx.font = 'bold 64px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('🎉 胜利! 🎉', this.width / 2, this.height / 2 - 100);
        ctx.shadowBlur = 0;

        ctx.fillStyle = CONFIG.COLORS.neonPink;
        ctx.shadowColor = CONFIG.COLORS.neonPink;
        ctx.shadowBlur = 15;
        ctx.font = 'bold 32px "Courier New", monospace';
        ctx.fillText('你击败了肥猫!', this.width / 2, this.height / 2 - 40);
        ctx.shadowBlur = 0;

        ctx.fillStyle = CONFIG.COLORS.neonGreen;
        ctx.font = '24px "Courier New", monospace';
        ctx.fillText(`最终得分: ${game.score}`, this.width / 2, this.height / 2 + 20);
        ctx.fillText(`总用时: ${Utils.formatTime(game.totalTime)}`, this.width / 2, this.height / 2 + 55);

        ctx.fillStyle = CONFIG.COLORS.neonBlue;
        ctx.font = '18px "Courier New", monospace';
        ctx.fillText('按 Enter 返回菜单', this.width / 2, this.height / 2 + 110);

        ctx.textAlign = 'left';
    }

    getRankColor(rank) {
        const colors = {
            'S': '#FFD700',
            'A': '#C0C0C0',
            'B': '#CD7F32',
            'C': '#8B4513',
            'D': '#808080'
        };
        return colors[rank] || '#fff';
    }

    drawBossHealthBar(boss) {
        if (!boss || !boss.active || boss.isDead) return;

        const ctx = this.ctx;
        const barWidth = 400;
        const barHeight = 20;
        const x = (this.width - barWidth) / 2;
        const y = this.height - 50;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x - 5, y - 30, barWidth + 10, barHeight + 40);

        ctx.fillStyle = CONFIG.COLORS.neonRed;
        ctx.shadowColor = CONFIG.COLORS.neonRed;
        ctx.shadowBlur = 10;
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('肥猫 BOSS', this.width / 2, y - 10);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, barWidth, barHeight);

        const healthPercent = boss.health / boss.maxHealth;
        const healthColor = healthPercent > 0.5 ? CONFIG.COLORS.neonGreen : 
                           healthPercent > 0.25 ? CONFIG.COLORS.neonYellow : CONFIG.COLORS.neonRed;
        
        ctx.fillStyle = healthColor;
        ctx.shadowColor = healthColor;
        ctx.shadowBlur = 10;
        ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
        ctx.shadowBlur = 0;

        ctx.strokeStyle = CONFIG.COLORS.neonBlue;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, barWidth, barHeight);

        ctx.textAlign = 'left';
    }
}
