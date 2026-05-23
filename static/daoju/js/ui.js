class UI {
    constructor(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.scorePopups = [];
        this.floatingTexts = [];
    }

    reset() {
        this.scorePopups = [];
        this.floatingTexts = [];
    }

    addScorePopup(x, y, score, isCombo = false) {
        this.scorePopups.push({
            x,
            y,
            score,
            isCombo,
            life: 1.0,
            vy: -80
        });
    }

    addFloatingText(text, x, y, color = '#FF6B6B') {
        this.floatingTexts.push({
            text,
            x,
            y,
            color,
            life: 1.0,
            vy: -60
        });
    }

    update(deltaTime) {
        for (let i = this.scorePopups.length - 1; i >= 0; i--) {
            const popup = this.scorePopups[i];
            popup.y += popup.vy * deltaTime;
            popup.life -= deltaTime * 1.5;
            if (popup.life <= 0) {
                this.scorePopups.splice(i, 1);
            }
        }

        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const text = this.floatingTexts[i];
            text.y += text.vy * deltaTime;
            text.life -= deltaTime * 1.2;
            if (text.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    drawBackground(ctx, theme, elapsedTime) {
        const themeConfig = GameConfig.THEMES[theme];
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
        gradient.addColorStop(0, themeConfig.skyTop);
        gradient.addColorStop(1, themeConfig.skyBottom);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        if (theme === 'night') {
            this.drawStars(ctx);
        }

        this.drawClouds(ctx, themeConfig, elapsedTime);
        this.drawSun(ctx, themeConfig, elapsedTime);
        this.drawGround(ctx, themeConfig);
        this.drawGrass(ctx, themeConfig);
    }

    drawStars(ctx) {
        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        
        const stars = [
            { x: 30, y: 50, size: 2 },
            { x: 80, y: 30, size: 1.5 },
            { x: 150, y: 60, size: 2.5 },
            { x: 200, y: 25, size: 1.8 },
            { x: 280, y: 70, size: 2.2 },
            { x: 350, y: 40, size: 1.6 },
            { x: 400, y: 80, size: 2 },
            { x: 60, y: 100, size: 1.4 },
            { x: 250, y: 45, size: 1.8 },
            { x: 430, y: 55, size: 2.1 }
        ];

        stars.forEach(star => {
            const twinkle = Math.sin(Date.now() * 0.003 + star.x) * 0.3 + 0.7;
            ctx.globalAlpha = twinkle;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }

    drawClouds(ctx, themeConfig, elapsedTime) {
        ctx.save();
        ctx.fillStyle = themeConfig.cloud;
        ctx.globalAlpha = 0.7;

        const clouds = [
            { x: 50, y: 70, size: 45, speed: 12 },
            { x: 180, y: 100, size: 55, speed: 8 },
            { x: 320, y: 60, size: 40, speed: 15 },
            { x: 100, y: 140, size: 35, speed: 10 },
            { x: 400, y: 90, size: 50, speed: 14 }
        ];

        clouds.forEach(cloud => {
            const offset = (elapsedTime * cloud.speed / 1000) % (this.canvasWidth + 150);
            const x = (cloud.x + offset) % (this.canvasWidth + 150) - 75;
            
            ctx.beginPath();
            ctx.arc(x, cloud.y, cloud.size * 0.5, 0, Math.PI * 2);
            ctx.arc(x + cloud.size * 0.4, cloud.y, cloud.size * 0.4, 0, Math.PI * 2);
            ctx.arc(x - cloud.size * 0.4, cloud.y, cloud.size * 0.4, 0, Math.PI * 2);
            ctx.arc(x + cloud.size * 0.2, cloud.y - cloud.size * 0.2, cloud.size * 0.35, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }

    drawSun(ctx, themeConfig, elapsedTime) {
        const sunX = this.canvasWidth - 50;
        const sunY = 55;
        const sunRadius = 30;

        ctx.save();
        
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = themeConfig.sun;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius + 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 0.15;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius + 35, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
        const gradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius);
        gradient.addColorStop(0, '#FFF59D');
        gradient.addColorStop(0.7, themeConfig.sun);
        gradient.addColorStop(1, themeConfig.sun);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();

        const rayCount = 12;
        ctx.strokeStyle = themeConfig.sun;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.4;

        for (let i = 0; i < rayCount; i++) {
            const angle = (i / rayCount) * Math.PI * 2 + elapsedTime * 0.0003;
            const innerRadius = sunRadius + 8;
            const outerRadius = sunRadius + 18 + Math.sin(elapsedTime * 0.002 + i) * 5;
            
            ctx.beginPath();
            ctx.moveTo(
                sunX + Math.cos(angle) * innerRadius,
                sunY + Math.sin(angle) * innerRadius
            );
            ctx.lineTo(
                sunX + Math.cos(angle) * outerRadius,
                sunY + Math.sin(angle) * outerRadius
            );
            ctx.stroke();
        }

        ctx.restore();
    }

    drawGround(ctx, themeConfig) {
        const groundY = this.canvasHeight - 70;
        
        ctx.fillStyle = themeConfig.ground;
        ctx.fillRect(0, groundY, this.canvasWidth, 70);

        const groundGradient = ctx.createLinearGradient(0, groundY, 0, groundY + 20);
        groundGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
        groundGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = groundGradient;
        ctx.fillRect(0, groundY, this.canvasWidth, 20);

        ctx.fillStyle = themeConfig.groundDark;
        ctx.fillRect(0, groundY + 45, this.canvasWidth, 25);
    }

    drawGrass(ctx, themeConfig) {
        const groundY = this.canvasHeight - 70;
        ctx.strokeStyle = themeConfig.grass || themeConfig.groundDark;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';

        for (let i = 0; i < this.canvasWidth; i += 12) {
            const height = Utils.random(8, 18);
            ctx.beginPath();
            ctx.moveTo(i, groundY);
            ctx.quadraticCurveTo(i + 2, groundY - height * 0.6, i + 4, groundY - height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(i + 6, groundY);
            ctx.quadraticCurveTo(i + 8, groundY - height * 0.5, i + 10, groundY - height * 0.7);
            ctx.stroke();
        }
    }

    drawHUD(ctx, game, player) {
        this.drawHPBar(ctx, player);
        this.drawScore(ctx, game);
        this.drawCombo(ctx, player);
        this.drawHighScore(ctx, game);
        this.drawTimer(ctx, game);
        this.drawDifficultyIndicator(ctx, game);
    }

    drawHPBar(ctx, player) {
        const x = 15;
        const y = 15;
        const width = 130;
        const height = 24;
        const padding = 3;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        Utils.drawRoundRect(ctx, x - 3, y - 3, width + 6, height + 6, 10);
        ctx.fill();

        ctx.fillStyle = 'rgba(44, 62, 80, 0.92)';
        Utils.drawRoundRect(ctx, x, y, width, height, 8);
        ctx.fill();

        const hpWidth = (player.hp / player.maxHp) * (width - padding * 2);
        const gradient = ctx.createLinearGradient(x, y, x + width, y);
        gradient.addColorStop(0, '#FF6B6B');
        gradient.addColorStop(0.5, '#FF5252');
        gradient.addColorStop(1, '#E74C3C');
        ctx.fillStyle = gradient;
        Utils.drawRoundRect(ctx, x + padding, y + padding, hpWidth, height - padding * 2, 5);
        ctx.fill();

        if (player.hp > player.maxHp * 0.3) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(x + padding + 2, y + padding + 2, hpWidth * 0.3, 4);
        }

        ctx.fillStyle = GameConfig.COLORS.white;
        ctx.font = 'bold 14px -apple-system, "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 4;
        ctx.fillText(`❤ ${player.hp}/${player.maxHp}`, x + width / 2, y + height / 2);
        ctx.shadowBlur = 0;

        if (player.isInvincible) {
            ctx.save();
            const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
            ctx.globalAlpha = pulse;
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            Utils.drawRoundRect(ctx, x - 5, y - 5, width + 10, height + 10, 12);
            ctx.stroke();
            ctx.restore();
        }
    }

    drawScore(ctx, game) {
        const x = this.canvasWidth - 15;
        const y = 22;

        ctx.save();
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        ctx.font = '12px -apple-system, "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 3;
        ctx.fillText('得分', x - 70, y - 16);

        ctx.font = 'bold 28px -apple-system, "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
        ctx.fillStyle = '#27AE60';
        ctx.shadowColor = 'rgba(39, 174, 96, 0.4)';
        ctx.shadowBlur = 10;
        ctx.fillText(game.score.toString(), x, y);
        ctx.shadowBlur = 0;

        ctx.restore();
    }

    drawCombo(ctx, player) {
        if (player.combo <= 0) return;

        const x = this.canvasWidth / 2;
        const y = 55;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const scale = 1 + Math.min(player.combo / 50, 1) * 0.4;
        const pulse = Math.sin(Date.now() * 0.005) * 0.08 + 1;

        ctx.translate(x, y);
        ctx.scale(scale * pulse, scale * pulse);

        ctx.font = 'bold 28px -apple-system, "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
        
        const hue = (120 - Math.min(player.combo * 2, 60));
        ctx.fillStyle = `hsl(${hue}, 85%, 58%)`;
        ctx.shadowColor = `hsla(${hue}, 85%, 58%, 0.6)`;
        ctx.shadowBlur = 18;
        ctx.fillText(`${player.combo} 连击!`, 0, 0);

        if (player.combo >= 10) {
            ctx.font = '13px -apple-system, "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
            ctx.fillStyle = '#F39C12';
            ctx.shadowBlur = 6;
            ctx.fillText(`+${Math.floor(player.combo / 10) * 50}%加成`, 0, 24);
        }

        ctx.restore();
    }

    drawHighScore(ctx, game) {
        const x = 15;
        const y = 55;

        ctx.save();
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        ctx.font = '11px -apple-system, "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 2;
        ctx.fillText('最高分', x, y);

        ctx.font = 'bold 17px -apple-system, "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
        ctx.fillStyle = '#F39C12';
        ctx.shadowColor = 'rgba(243, 156, 18, 0.4)';
        ctx.shadowBlur = 6;
        ctx.fillText(game.highScore.toString(), x, y + 20);
        ctx.shadowBlur = 0;

        ctx.restore();
    }

    drawTimer(ctx, game) {
        const x = this.canvasWidth / 2;
        const y = 24;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.font = 'bold 20px -apple-system, "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.fillText(Utils.formatTime(game.elapsedTime), x, y);
        ctx.shadowBlur = 0;

        ctx.restore();
    }

    drawDifficultyIndicator(ctx, game) {
        const stage = game.itemManager.currentStage;
        const x = this.canvasWidth / 2;
        const y = 85;

        if (stage === 0) return;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const alpha = Math.min(1, (game.elapsedTime % GameConfig.GAME.DIFFICULTY_INCREASE_INTERVAL) / 2000);
        
        ctx.globalAlpha = 0.7 + alpha * 0.3;
        ctx.font = 'bold 15px -apple-system, "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
        ctx.fillStyle = '#E67E22';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 4;
        
        const stageNames = ['', '速度提升!', '难度增加!', '杂物增多!', '极限挑战!'];
        if (stage < stageNames.length) {
            ctx.fillText(stageNames[stage], x, y);
        }
        ctx.shadowBlur = 0;

        ctx.restore();
    }

    drawScorePopups(ctx) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        this.scorePopups.forEach(popup => {
            ctx.globalAlpha = Math.max(0, popup.life);
            ctx.font = `bold ${popup.isCombo ? 24 : 20}px -apple-system, "PingFang SC", "Microsoft YaHei", Arial, sans-serif`;
            ctx.fillStyle = popup.isCombo ? '#FF6B6B' : '#27AE60';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 6;
            ctx.fillText(`+${popup.score}`, popup.x, popup.y);
        });

        ctx.restore();
    }

    drawFloatingTexts(ctx) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        this.floatingTexts.forEach(text => {
            ctx.globalAlpha = Math.max(0, text.life);
            ctx.font = 'bold 20px -apple-system, "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
            ctx.fillStyle = text.color;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 6;
            ctx.fillText(text.text, text.x, text.y);
        });

        ctx.restore();
    }

    drawStartScreen(ctx, game) {
        ctx.save();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.font = 'bold 40px -apple-system, "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
        ctx.fillStyle = GameConfig.COLORS.white;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 18;
        ctx.fillText('🍎🔪 苹果刀具狂接', this.canvasWidth / 2, this.canvasHeight / 2 - 120);

        ctx.font = '19px -apple-system, "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.shadowBlur = 10;
        ctx.fillText('接住水果刀具，躲避危险物品！', this.canvasWidth / 2, this.canvasHeight / 2 - 65);

        ctx.font = '15px -apple-system, "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
        ctx.shadowBlur = 6;
        ctx.fillText('← → 移动 | 空格 居中 | P 暂停', this.canvasWidth / 2, this.canvasHeight / 2 - 22);

        const pulse = Math.sin(Date.now() * 0.005) * 0.1 + 1;
        ctx.font = `bold ${22 * pulse}px -apple-system, "PingFang SC", "Microsoft YaHei", Arial, sans-serif`;
        ctx.fillStyle = '#4ECDC4';
        ctx.shadowBlur = 12;
        ctx.fillText('点击开始游戏', this.canvasWidth / 2, this.canvasHeight / 2 + 42);

        ctx.font = '16px -apple-system, "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
        ctx.fillStyle = '#F39C12';
        ctx.shadowBlur = 6;
        ctx.fillText(`🏆 最高分: ${game.highScore}`, this.canvasWidth / 2, this.canvasHeight / 2 + 88);
        ctx.fillText(`🔥 最高连击: ${game.highCombo}`, this.canvasWidth / 2, this.canvasHeight / 2 + 115);
        ctx.shadowBlur = 0;

        ctx.restore();
    }

    drawPauseScreen(ctx) {
        ctx.save();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.font = 'bold 54px -apple-system, "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
        ctx.fillStyle = GameConfig.COLORS.white;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 18;
        ctx.fillText('⏸ 暂停中', this.canvasWidth / 2, this.canvasHeight / 2 - 42);

        ctx.font = '24px -apple-system, "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
        ctx.shadowBlur = 8;
        ctx.fillText('按 P 继续游戏', this.canvasWidth / 2, this.canvasHeight / 2 + 32);
        ctx.shadowBlur = 0;

        ctx.restore();
    }

    drawGameOverScreen(ctx, game, player) {
        ctx.save();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.font = 'bold 46px -apple-system, "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
        ctx.fillStyle = '#FF6B6B';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 18;
        ctx.fillText('游戏结束', this.canvasWidth / 2, this.canvasHeight / 2 - 140);

        ctx.font = 'bold 28px -apple-system, "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
        ctx.fillStyle = GameConfig.COLORS.white;
        ctx.shadowBlur = 10;
        ctx.fillText(`本局得分: ${game.score}`, this.canvasWidth / 2, this.canvasHeight / 2 - 75);

        ctx.font = '22px -apple-system, "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
        ctx.fillStyle = '#F39C12';
        ctx.shadowBlur = 6;
        ctx.fillText(`🏆 最高分: ${game.highScore}`, this.canvasWidth / 2, this.canvasHeight / 2 - 38);
        ctx.fillText(`🔥 最高连击: ${game.highCombo}`, this.canvasWidth / 2, this.canvasHeight / 2 - 2);
        ctx.shadowBlur = 0;

        if (game.score >= game.highScore && game.score > 0) {
            const pulse = Math.sin(Date.now() * 0.008) * 0.15 + 1;
            ctx.font = `bold ${26 * pulse}px -apple-system, "PingFang SC", "Microsoft YaHei", Arial, sans-serif`;
            ctx.fillStyle = '#FFD700';
            ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
            ctx.shadowBlur = 24;
            ctx.fillText('🎉 新纪录！', this.canvasWidth / 2, this.canvasHeight / 2 + 52);
            ctx.shadowBlur = 0;
        }

        const pulse2 = Math.sin(Date.now() * 0.005) * 0.1 + 1;
        ctx.font = `bold ${22 * pulse2}px -apple-system, "PingFang SC", "Microsoft YaHei", Arial, sans-serif`;
        ctx.fillStyle = '#4ECDC4';
        ctx.shadowBlur = 10;
        ctx.fillText('点击重新开始', this.canvasWidth / 2, this.canvasHeight / 2 + 115);
        ctx.shadowBlur = 0;

        ctx.restore();
    }

    drawThemeSelector(ctx, game, themeButtons) {
        ctx.save();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.font = 'bold 32px -apple-system, "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
        ctx.fillStyle = GameConfig.COLORS.white;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 12;
        ctx.fillText('选择主题', this.canvasWidth / 2, 100);
        ctx.shadowBlur = 0;

        themeButtons.forEach(btn => {
            ctx.fillStyle = btn.hover ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.15)';
            Utils.drawRoundRect(ctx, btn.x, btn.y, btn.width, btn.height, 12);
            ctx.fill();

            if (game.currentTheme === btn.theme) {
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 3;
                Utils.drawRoundRect(ctx, btn.x, btn.y, btn.width, btn.height, 12);
                ctx.stroke();
            }

            const themeConfig = GameConfig.THEMES[btn.theme];
            const previewSize = 35;
            const previewX = btn.x + 25;
            const previewY = btn.y + btn.height / 2;

            const skyGradient = ctx.createLinearGradient(
                previewX - previewSize / 2, previewY - previewSize / 2, 
                previewX - previewSize / 2, previewY + previewSize / 2
            );
            skyGradient.addColorStop(0, themeConfig.skyTop);
            skyGradient.addColorStop(1, themeConfig.skyBottom);
            ctx.fillStyle = skyGradient;
            Utils.drawRoundRect(ctx, previewX - previewSize / 2, previewY - previewSize / 2, 
                               previewSize, previewSize, 6);
            ctx.fill();

            ctx.fillStyle = themeConfig.ground;
            ctx.fillRect(previewX - previewSize / 2, previewY + previewSize / 4, previewSize, previewSize / 4);

            ctx.font = 'bold 22px -apple-system, "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
            ctx.fillStyle = GameConfig.COLORS.white;
            ctx.textAlign = 'left';
            ctx.fillText(themeConfig.name, previewX + previewSize + 15, previewY);
        });

        ctx.font = '20px -apple-system, "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.textAlign = 'center';
        ctx.fillText('按 ESC 返回', this.canvasWidth / 2, this.canvasHeight - 55);

        ctx.restore();
    }

    drawControlButtons(ctx, buttons) {
        buttons.forEach(btn => {
            ctx.save();
            
            ctx.globalAlpha = btn.visible ? 0.6 : 0;
            if (btn.hover) ctx.globalAlpha = 0.85;
            
            const gradient = ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.height);
            gradient.addColorStop(0, btn.color);
            gradient.addColorStop(1, btn.colorDark);
            ctx.fillStyle = gradient;
            
            Utils.drawRoundRect(ctx, btn.x, btn.y, btn.width, btn.height, btn.radius);
            ctx.fill();

            ctx.globalAlpha = btn.visible ? 0.9 : 0;
            ctx.font = `bold ${btn.fontSize}px -apple-system, "PingFang SC", "Microsoft YaHei", Arial, sans-serif`;
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(btn.label, btn.x + btn.width / 2, btn.y + btn.height / 2);

            ctx.restore();
        });
    }
}
