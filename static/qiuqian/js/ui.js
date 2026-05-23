class UI {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
    }
    
    drawHealthBar(ctx, health, maxHealth, x, y) {
        ctx.save();
        
        const heartSize = 20;
        const spacing = 3;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        Utils.drawRoundedRect(ctx, x, y, 85, 28, 5);
        ctx.fill();
        
        ctx.font = 'bold 9px Arial';
        ctx.fillStyle = '#FF6B6B';
        ctx.textAlign = 'left';
        ctx.fillText('HP', x + 5, y + 10);
        
        for (let i = 0; i < maxHealth; i++) {
            const hx = x + 22 + i * (heartSize + spacing);
            const hy = y + 5;
            this.drawHeart(ctx, hx, hy, heartSize, i < health);
        }
        
        ctx.restore();
    }
    
    drawHeart(ctx, x, y, size, filled) {
        ctx.save();
        
        ctx.beginPath();
        ctx.moveTo(x + size / 2, y + size * 0.8);
        ctx.bezierCurveTo(x, y + size * 0.5, x, y + size * 0.15, x + size / 2, y + size * 0.2);
        ctx.bezierCurveTo(x + size, y + size * 0.15, x + size, y + size * 0.5, x + size / 2, y + size * 0.8);
        ctx.closePath();
        
        if (filled) {
            ctx.fillStyle = '#FF4444';
        } else {
            ctx.fillStyle = '#444';
        }
        ctx.fill();
        
        if (filled) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.beginPath();
            ctx.ellipse(x + size * 0.3, y + size * 0.3, size * 0.1, size * 0.12, -0.3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    drawTimer(ctx, time, targetTime, x, y) {
        ctx.save();
        
        const remaining = Math.max(0, targetTime - time);
        const progress = Math.min(1, time / targetTime);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        Utils.drawRoundedRect(ctx, x, y, 80, 28, 5);
        ctx.fill();
        
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFF';
        ctx.fillText(Utils.formatTime(remaining), x + 40, y + 18);
        
        const barWidth = 70;
        const barX = x + 5;
        const barY = y + 24;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, 3);
        
        const progressColor = progress > 0.7 ? '#4CAF50' : progress > 0.4 ? '#FFC107' : '#FF5722';
        ctx.fillStyle = progressColor;
        ctx.fillRect(barX, barY, barWidth * progress, 3);
        
        ctx.restore();
    }
    
    drawLevelInfo(ctx, level, x, y) {
        ctx.save();
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        Utils.drawRoundedRect(ctx, x, y, 70, 24, 5);
        ctx.fill();
        
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#FFD700';
        ctx.fillText('Lv.' + level, x + 8, y + 16);
        
        ctx.restore();
    }
    
    drawScoreInfo(ctx, survivalTime, brokenPlatforms, x, y) {
        ctx.save();
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        Utils.drawRoundedRect(ctx, x, y, 100, 40, 5);
        ctx.fill();
        
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#FFF';
        ctx.fillText('Time: ' + Utils.formatTime(survivalTime), x + 6, y + 14);
        ctx.fillText('Broken: ' + brokenPlatforms, x + 6, y + 30);
        
        ctx.restore();
    }
    
    drawBestRecord(ctx, record, x, y) {
        ctx.save();
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        Utils.drawRoundedRect(ctx, x, y, 90, 24, 5);
        ctx.fill();
        
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#FFD700';
        ctx.fillText('Best: ' + Utils.formatTime(record.longestSurvival), x + 6, y + 16);
        
        ctx.restore();
    }
    
    drawPauseOverlay(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFF';
        ctx.fillText('PAUSED', this.canvasWidth / 2, this.canvasHeight / 2 - 15);
        
        ctx.font = '14px Arial';
        ctx.fillStyle = '#CCC';
        ctx.fillText('ESC: Continue | R: Restart', this.canvasWidth / 2, this.canvasHeight / 2 + 20);
        ctx.restore();
    }
    
    drawGameOverOverlay(ctx, isVictory, stats) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        const cx = this.canvasWidth / 2;
        const cy = this.canvasHeight / 2;
        
        ctx.font = 'bold 38px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = isVictory ? '#4CAF50' : '#FF5722';
        ctx.fillText(isVictory ? 'VICTORY!' : 'GAME OVER', cx, cy - 60);
        
        if (stats) {
            ctx.font = '16px Arial';
            ctx.fillStyle = '#FFF';
            ctx.fillText('Time: ' + Utils.formatTime(stats.survivalTime), cx, cy - 15);
            ctx.fillText('Broken: ' + stats.brokenPlatforms, cx, cy + 10);
            ctx.fillText('Level: ' + stats.level, cx, cy + 35);
            
            if (stats.isNewRecord) {
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 20px Arial';
                ctx.fillText('NEW RECORD!', cx, cy + 75);
            }
        }
        
        ctx.fillStyle = '#CCC';
        ctx.font = '13px Arial';
        ctx.fillText('R: Restart | M: Menu', cx, cy + 110);
        ctx.restore();
    }
    
    drawMenu(ctx, selectedDifficulty, selectedTheme, hasSavedGame) {
        ctx.save();
        
        const cx = this.canvasWidth / 2;
        const cy = this.canvasHeight / 2;
        
        ctx.font = 'bold 34px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FF6B6B';
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.strokeText('Fragile Swing Adventure', cx, cy - 170);
        ctx.fillText('Fragile Swing Adventure', cx, cy - 170);
        
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#FFF';
        ctx.fillText('Difficulty', cx - 170, cy - 115);
        
        const difficulties = ['easy', 'normal', 'hard'];
        difficulties.forEach((diff, i) => {
            const x = cx - 200 + i * 140;
            const y = cy - 90;
            const w = 130;
            const h = 48;
            
            const selected = diff === selectedDifficulty;
            ctx.fillStyle = selected ? '#FF6B6B' : 'rgba(255,255,255,0.2)';
            Utils.drawRoundedRect(ctx, x, y, w, h, 8);
            ctx.fill();
            
            if (selected) {
                ctx.strokeStyle = '#FFF';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(GameConfig.difficultyLevels[diff].name, x + w / 2, y + 19);
            
            ctx.font = '11px Arial';
            ctx.fillStyle = '#DDD';
            ctx.fillText(GameConfig.difficultyLevels[diff].surviveTime + 's', x + w / 2, y + 37);
        });
        
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#FFF';
        ctx.fillText('Scene', cx - 170, cy + 0);
        
        const themes = ['sunny', 'sunset', 'dusk'];
        themes.forEach((theme, i) => {
            const x = cx - 200 + i * 140;
            const y = cy + 25;
            const w = 130;
            const h = 48;
            
            const selected = theme === selectedTheme;
            ctx.fillStyle = selected ? '#4ECDC4' : 'rgba(255,255,255,0.2)';
            Utils.drawRoundedRect(ctx, x, y, w, h, 8);
            ctx.fill();
            
            if (selected) {
                ctx.strokeStyle = '#FFF';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            
            const colors = GameConfig.sceneThemes[theme];
            const gradient = Utils.createGradient(ctx, x + 4, y + 4, w - 8, h - 8, colors.skyTop, colors.skyBottom);
            ctx.fillStyle = gradient;
            Utils.drawRoundedRect(ctx, x + 4, y + 4, w - 8, h - 8, 5);
            ctx.fill();
            
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 12px Arial';
            ctx.fillText(GameConfig.sceneThemes[theme].name, x + w / 2, y + 32);
        });
        
        let btnY = cy + 110;
        
        if (hasSavedGame) {
            ctx.fillStyle = '#FFC107';
            Utils.drawRoundedRect(ctx, cx - 70, btnY, 140, 40, 8);
            ctx.fill();
            ctx.fillStyle = '#333';
            ctx.font = 'bold 16px Arial';
            ctx.fillText('Continue', cx, btnY + 26);
            btnY += 50;
        }
        
        ctx.fillStyle = '#4CAF50';
        Utils.drawRoundedRect(ctx, cx - 70, btnY, 140, 40, 8);
        ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('Start Game', cx, btnY + 26);
        
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '10px Arial';
        ctx.fillText('Arrows: Move | Space: Jump | Hold Space: Charge', cx, this.canvasHeight - 38);
        ctx.fillText('ESC: Pause | R: Restart', cx, this.canvasHeight - 22);
        
        ctx.restore();
    }
    
    drawChargingIndicator(ctx, x, y, progress) {
        if (progress <= 0) return;
        
        ctx.save();
        
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.stroke();
        
        const color = progress > 0.8 ? '#FF6B6B' : progress > 0.5 ? '#FFC107' : '#4CAF50';
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 20, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
        ctx.stroke();
        
        if (progress >= 0.5) {
            ctx.fillStyle = color;
            ctx.font = 'bold 9px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(progress >= 1 ? 'MAX' : Math.floor(progress * 100) + '%', x, y + 3);
        }
        
        ctx.restore();
    }
    
    drawHint(ctx, text, x, y) {
        ctx.save();
        ctx.font = '13px Arial';
        ctx.textAlign = 'center';
        
        const w = ctx.measureText(text).width;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        Utils.drawRoundedRect(ctx, x - w / 2 - 10, y - 14, w + 20, 26, 5);
        ctx.fill();
        
        ctx.fillStyle = '#FFF';
        ctx.fillText(text, x, y + 4);
        ctx.restore();
    }
    
    drawGameUI(ctx, game) {
        this.drawHealthBar(ctx, game.player.health, game.player.maxHealth, 8, 8);
        this.drawLevelInfo(ctx, game.level, 8, 42);
        this.drawScoreInfo(ctx, game.survivalTime, game.brokenPlatforms, 8, 72);
        
        this.drawTimer(ctx, game.survivalTime, game.targetSurviveTime, this.canvasWidth - 88, 8);
        
        const record = game.storage.getBestRecord();
        this.drawBestRecord(ctx, record, this.canvasWidth - 98, 42);
        
        if (game.player.chargeProgress > 0) {
            this.drawChargingIndicator(
                ctx,
                game.player.x + game.player.width / 2,
                game.player.y - 30,
                game.player.chargeProgress
            );
        }
        
        if (game.survivalTime < 3 && game.state === GameConfig.gameStates.PLAYING) {
            this.drawHint(
                ctx,
                'Arrow keys: Move | Space: Jump',
                game.canvasWidth / 2,
                game.canvasHeight / 2
            );
        }
    }
}

window.UI = UI;
