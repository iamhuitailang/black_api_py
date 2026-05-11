const Renderer = {
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();
    },
    
    resize() {
        const container = document.getElementById('game-container');
        this.canvas.width = Math.min(container.clientWidth - 40, 1200);
        this.canvas.height = Math.min(container.clientHeight - 40, 800);
    },
    
    clear() {
        this.ctx.fillStyle = GameConfig.Canvas.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },
    
    applyShake(state) {
        const shake = EffectsManager.getShakeOffset(state);
        this.ctx.save();
        this.ctx.translate(shake.x, shake.y);
    },
    
    restoreShake() {
        this.ctx.restore();
    },
    
    drawTarget(state) {
        const { target } = state;
        
        this.ctx.save();
        this.ctx.translate(target.x, target.y);
        
        const time = Date.now() / 1000;
        const pulse = 0.8 + Math.sin(time * 2) * 0.2;
        
        const outerNeonGlow = this.ctx.createRadialGradient(0, 0, target.radius * 0.5, 0, 0, target.radius + 60);
        outerNeonGlow.addColorStop(0, `rgba(255, 215, 0, ${0.4 * pulse})`);
        outerNeonGlow.addColorStop(0.3, `rgba(255, 100, 100, ${0.3 * pulse})`);
        outerNeonGlow.addColorStop(0.6, `rgba(78, 205, 196, ${0.2 * pulse})`);
        outerNeonGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = outerNeonGlow;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, target.radius + 60, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.shadowColor = '#ff6b6b';
        this.ctx.shadowBlur = 30;
        
        const metalBorder1 = this.ctx.createLinearGradient(-target.radius - 30, -target.radius - 30, target.radius + 30, target.radius + 30);
        metalBorder1.addColorStop(0, '#ffd700');
        metalBorder1.addColorStop(0.2, '#ffed4a');
        metalBorder1.addColorStop(0.4, '#ffd700');
        metalBorder1.addColorStop(0.6, '#daa520');
        metalBorder1.addColorStop(0.8, '#ffd700');
        metalBorder1.addColorStop(1, '#b8860b');
        this.ctx.fillStyle = metalBorder1;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, target.radius + 30, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
        
        const metalBorder2 = this.ctx.createLinearGradient(-target.radius - 25, -target.radius - 25, target.radius + 25, target.radius + 25);
        metalBorder2.addColorStop(0, '#1a1a2e');
        metalBorder2.addColorStop(0.3, '#333355');
        metalBorder2.addColorStop(0.5, '#222244');
        metalBorder2.addColorStop(0.7, '#333355');
        metalBorder2.addColorStop(1, '#1a1a2e');
        this.ctx.fillStyle = metalBorder2;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, target.radius + 22, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#ffd700';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        const neonRing = this.ctx.createRadialGradient(0, 0, target.radius, 0, 0, target.radius + 18);
        neonRing.addColorStop(0, 'rgba(255, 107, 107, 0.9)');
        neonRing.addColorStop(0.5, 'rgba(255, 215, 0, 0.7)');
        neonRing.addColorStop(1, 'rgba(78, 205, 196, 0.5)');
        this.ctx.fillStyle = neonRing;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, target.radius + 18, 0, Math.PI * 2);
        this.ctx.arc(0, 0, target.radius, 0, Math.PI * 2, true);
        this.ctx.fill();
        
        const baseGradient = this.ctx.createRadialGradient(
            -target.radius * 0.3, -target.radius * 0.3, 0,
            0, 0, target.radius
        );
        baseGradient.addColorStop(0, '#ffffff');
        baseGradient.addColorStop(0.5, '#f8f8f8');
        baseGradient.addColorStop(1, '#e8e8e8');
        
        this.ctx.fillStyle = baseGradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, target.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowOffsetX = 8;
        this.ctx.shadowOffsetY = 8;
        
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, target.radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        for (let i = GameConfig.TargetRings.length - 1; i >= 0; i--) {
            const ring = GameConfig.TargetRings[i];
            const ringRadius = ring.radius * target.radius;
            
            let ringGradient;
            if (ring.isBullseye) {
                ringGradient = this.ctx.createRadialGradient(
                    -ringRadius * 0.2, -ringRadius * 0.2, 0,
                    0, 0, ringRadius
                );
                ringGradient.addColorStop(0, '#ff9999');
                ringGradient.addColorStop(0.3, '#ff6666');
                ringGradient.addColorStop(0.6, '#ff3333');
                ringGradient.addColorStop(1, '#cc0000');
            } else if (ring.score === 10) {
                ringGradient = this.ctx.createRadialGradient(
                    -ringRadius * 0.3, -ringRadius * 0.3, ringRadius * 0.1,
                    0, 0, ringRadius
                );
                ringGradient.addColorStop(0, '#ffffcc');
                ringGradient.addColorStop(0.2, '#ffff66');
                ringGradient.addColorStop(0.5, '#ffd700');
                ringGradient.addColorStop(0.8, '#ffaa00');
                ringGradient.addColorStop(1, '#cc8800');
            } else if (ring.score === 9) {
                ringGradient = this.ctx.createRadialGradient(
                    -ringRadius * 0.3, -ringRadius * 0.3, ringRadius * 0.1,
                    0, 0, ringRadius
                );
                ringGradient.addColorStop(0, '#99ddff');
                ringGradient.addColorStop(0.2, '#66ccff');
                ringGradient.addColorStop(0.5, '#3399ff');
                ringGradient.addColorStop(0.8, '#0066cc');
                ringGradient.addColorStop(1, '#004499');
            } else if (ring.score === 8) {
                ringGradient = this.ctx.createRadialGradient(
                    -ringRadius * 0.3, -ringRadius * 0.3, ringRadius * 0.1,
                    0, 0, ringRadius
                );
                ringGradient.addColorStop(0, '#888888');
                ringGradient.addColorStop(0.2, '#666666');
                ringGradient.addColorStop(0.5, '#444444');
                ringGradient.addColorStop(0.8, '#333333');
                ringGradient.addColorStop(1, '#111111');
            } else if (ring.score === 7) {
                ringGradient = this.ctx.createRadialGradient(
                    -ringRadius * 0.3, -ringRadius * 0.3, ringRadius * 0.1,
                    0, 0, ringRadius
                );
                ringGradient.addColorStop(0, '#ffffff');
                ringGradient.addColorStop(0.3, '#f5f5f5');
                ringGradient.addColorStop(0.6, '#eeeeee');
                ringGradient.addColorStop(1, '#dddddd');
            } else {
                ringGradient = this.ctx.createRadialGradient(
                    -ringRadius * 0.3, -ringRadius * 0.3, ringRadius * 0.1,
                    0, 0, ringRadius
                );
                ringGradient.addColorStop(0, '#e0f7fa');
                ringGradient.addColorStop(0.2, '#b2ebf2');
                ringGradient.addColorStop(0.5, '#81d4fa');
                ringGradient.addColorStop(0.8, '#4fc3f7');
                ringGradient.addColorStop(1, '#29b6f6');
            }
            
            this.ctx.fillStyle = ringGradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            if (i < GameConfig.TargetRings.length - 1) {
                this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        }
        
        const bullseye = GameConfig.TargetRings[0];
        const bullseyeRadius = bullseye.radius * target.radius;
        
        this.ctx.shadowColor = '#ff3333';
        this.ctx.shadowBlur = 20;
        
        const bullseyeGlow = this.ctx.createRadialGradient(0, 0, 0, 0, 0, bullseyeRadius * 2.5);
        bullseyeGlow.addColorStop(0, `rgba(255, 255, 255, ${0.7 * pulse})`);
        bullseyeGlow.addColorStop(0.3, `rgba(255, 255, 255, ${0.5 * pulse})`);
        bullseyeGlow.addColorStop(0.5, `rgba(255, 100, 100, ${0.4 * pulse})`);
        bullseyeGlow.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        this.ctx.fillStyle = bullseyeGlow;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, bullseyeRadius * 2.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
        
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = `bold ${Math.max(16, target.radius * 0.08)}px Arial Black`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        this.ctx.shadowBlur = 5;
        
        for (let i = 1; i < GameConfig.TargetRings.length; i++) {
            const ring = GameConfig.TargetRings[i];
            const prevRing = GameConfig.TargetRings[i - 1];
            const labelRadius = (ring.radius + prevRing.radius) / 2 * target.radius;
            
            this.ctx.fillStyle = ring.score >= 8 ? '#ffffff' : '#333333';
            this.ctx.font = `bold ${Math.max(12, target.radius * 0.06)}px Arial Black`;
            this.ctx.fillText(ring.score.toString(), 0, -labelRadius);
            this.ctx.fillText(ring.score.toString(), 0, labelRadius);
            this.ctx.fillText(ring.score.toString(), -labelRadius, 0);
            this.ctx.fillText(ring.score.toString(), labelRadius, 0);
        }
        
        this.ctx.shadowBlur = 0;
        this.ctx.restore();
    },
    
    drawDart(state) {
        const { dart, dartState } = state;
        
        if (dartState === GameConfig.GameState.DART_LANDED && dart.isLanded) {
            this.drawLandedDart(dart);
        } else if (dartState === GameConfig.GameState.DART_FLYING) {
            this.drawFlyingDart(dart);
        } else if (dartState === GameConfig.GameState.DART_READY || dartState === GameConfig.GameState.DART_POWERING) {
            this.drawReadyDart(state);
        }
    },
    
    drawReadyDart(state) {
        const { target, pullCurrent, pullStart, power } = state;
        
        const baseX = this.canvas.width * 0.15;
        const baseY = this.canvas.height * 0.5;
        
        if (state.dartState === GameConfig.GameState.DART_POWERING) {
            this.ctx.save();
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([10, 10]);
            this.ctx.beginPath();
            this.ctx.moveTo(baseX, baseY);
            this.ctx.lineTo(pullStart.x, pullStart.y);
            this.ctx.stroke();
            this.ctx.restore();
            
            this.ctx.save();
            this.ctx.strokeStyle = 'rgba(78, 205, 196, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            
            const angle = Math.atan2(target.y - pullStart.y, target.x - pullStart.x);
            const powerPercent = power / (GameConfig.Dart.baseSpeed * GameConfig.Dart.maxSpeedMultiplier);
            const lineLength = 100 + powerPercent * 200;
            
            this.ctx.beginPath();
            this.ctx.moveTo(baseX, baseY);
            this.ctx.lineTo(
                baseX + Math.cos(angle) * lineLength,
                baseY + Math.sin(angle) * lineLength
            );
            this.ctx.stroke();
            this.ctx.restore();
            
            this.drawPowerBar(power);
        }
        
        this.ctx.save();
        this.ctx.translate(baseX, baseY);
        
        if (state.dartState === GameConfig.GameState.DART_POWERING) {
            const angle = Math.atan2(target.y - pullStart.y, target.x - pullStart.x);
            this.ctx.rotate(angle);
        }
        
        this.drawDartShape();
        
        this.ctx.restore();
    },
    
    drawFlyingDart(dart) {
        this.ctx.save();
        this.ctx.translate(dart.x, dart.y);
        this.ctx.rotate(dart.angle);
        this.drawDartShape();
        this.ctx.restore();
    },
    
    drawLandedDart(dart) {
        this.ctx.save();
        this.ctx.translate(dart.landedX, dart.landedY);
        this.ctx.rotate(dart.angle);
        this.drawDartShape();
        this.ctx.restore();
    },
    
    drawDartShape() {
        const dart = GameConfig.Dart;
        
        this.ctx.save();
        
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 5;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        
        this.ctx.fillStyle = dart.flightColor;
        this.ctx.beginPath();
        this.ctx.moveTo(-dart.height / 4, 0);
        this.ctx.lineTo(-dart.height / 2, -dart.width / 2);
        this.ctx.lineTo(-dart.height / 4 - 5, 0);
        this.ctx.lineTo(-dart.height / 2, dart.width / 2);
        this.ctx.closePath();
        this.ctx.fill();
        
        const flightGradient = this.ctx.createLinearGradient(-dart.height / 2, -dart.width / 2, -dart.height / 4, 0);
        flightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        flightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        flightGradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
        
        this.ctx.fillStyle = flightGradient;
        this.ctx.fill();
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        const shaftGradient = this.ctx.createLinearGradient(0, -dart.width / 6, 0, dart.width / 6);
        shaftGradient.addColorStop(0, '#666');
        shaftGradient.addColorStop(0.3, '#333');
        shaftGradient.addColorStop(0.5, '#222');
        shaftGradient.addColorStop(0.7, '#333');
        shaftGradient.addColorStop(1, '#555');
        
        this.ctx.fillStyle = shaftGradient;
        this.ctx.fillRect(-dart.height / 4, -dart.width / 6, dart.height / 2 + 10, dart.width / 3);
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(-dart.height / 4, -dart.width / 6 + 2, dart.height / 2 + 10, 2);
        
        const tipGradient = this.ctx.createLinearGradient(dart.height / 2 - 15, 0, dart.height / 2, 0);
        tipGradient.addColorStop(0, '#c0c0c0');
        tipGradient.addColorStop(0.5, '#e8e8e8');
        tipGradient.addColorStop(1, '#a0a0a0');
        
        this.ctx.fillStyle = tipGradient;
        this.ctx.beginPath();
        this.ctx.moveTo(dart.height / 2, 0);
        this.ctx.lineTo(dart.height / 2 - 15, -dart.width / 4);
        this.ctx.lineTo(dart.height / 2 - 15, dart.width / 4);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(dart.height / 2, 0);
        this.ctx.lineTo(dart.height / 2 - 15, -dart.width / 6);
        this.ctx.stroke();
        
        this.ctx.restore();
    },
    
    drawPowerBar(power) {
        const maxPower = GameConfig.Dart.baseSpeed * GameConfig.Dart.maxSpeedMultiplier;
        const powerPercent = Math.min(power / maxPower, 1);
        
        const barX = 20;
        const barY = this.canvas.height - 80;
        const barWidth = 300;
        const barHeight = 30;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        const gradient = this.ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
        gradient.addColorStop(0, '#4ecdc4');
        gradient.addColorStop(0.5, '#ffd93d');
        gradient.addColorStop(1, '#ff6b6b');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(barX, barY, barWidth * powerPercent, barHeight);
        
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`力量: ${Math.round(powerPercent * 100)}%`, barX + barWidth / 2, barY + barHeight / 2);
    },
    
    drawLandedDarts(state) {
        state.landedDarts.forEach(dart => {
            this.ctx.save();
            this.ctx.translate(dart.x, dart.y);
            this.ctx.rotate(dart.angle);
            this.drawDartShape();
            this.ctx.restore();
        });
    },
    
    drawEffects(state) {
        const { effects } = state;
        
        effects.glowEffects.forEach(glow => {
            this.ctx.save();
            this.ctx.globalAlpha = glow.opacity;
            const gradient = this.ctx.createRadialGradient(
                glow.x, glow.y, 0,
                glow.x, glow.y, glow.radius
            );
            gradient.addColorStop(0, glow.color);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(glow.x, glow.y, glow.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
        
        effects.floatingTexts.forEach(text => {
            this.ctx.save();
            this.ctx.globalAlpha = text.opacity;
            this.ctx.fillStyle = text.color;
            this.ctx.font = 'bold 36px Arial Black';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.shadowColor = text.color;
            this.ctx.shadowBlur = 10;
            this.ctx.fillText(text.text, text.x, text.y);
            this.ctx.restore();
        });
        
        effects.fireworks.forEach(firework => {
            this.ctx.save();
            this.ctx.globalAlpha = firework.life;
            this.ctx.fillStyle = firework.color;
            this.ctx.beginPath();
            this.ctx.arc(firework.x, firework.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
        
        effects.confetti.forEach(confetti => {
            this.ctx.save();
            this.ctx.translate(confetti.x, confetti.y);
            this.ctx.rotate(confetti.rotation);
            this.ctx.fillStyle = confetti.color;
            this.ctx.fillRect(-confetti.size / 2, -confetti.size / 4, confetti.size, confetti.size / 2);
            this.ctx.restore();
        });
    },
    
    drawUI(state) {
        this.ctx.save();
        
        if (state.mode === GameConfig.GameMode.STANDARD) {
            const roundText = `第 ${state.currentRound}/${state.totalRounds} 轮`;
            this.ctx.fillStyle = '#a8e6cf';
            this.ctx.font = 'bold 24px Arial Black';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'top';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 5;
            this.ctx.fillText(roundText, this.canvas.width / 2, 20);
        } else {
            const timeText = `剩余时间: ${state.timeLeft}秒`;
            this.ctx.fillStyle = '#ff8b94';
            this.ctx.font = 'bold 28px Arial Black';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'top';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 5;
            this.ctx.fillText(timeText, this.canvas.width / 2, 20);
        }
        
        const scoreText = `当前得分: ${state.score}`;
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = 'bold 28px Arial Black';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(scoreText, 20, 20);
        
        const highScoreText = `最高分: ${state.highScore}`;
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.font = 'bold 24px Arial Black';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(highScoreText, this.canvas.width - 20, 20);
        
        this.ctx.restore();
    },
    
    render(state) {
        this.clear();
        
        if (state.state !== GameConfig.GameState.MENU) {
            this.applyShake(state);
            
            this.drawTarget(state);
            this.drawLandedDarts(state);
            this.drawDart(state);
            this.drawEffects(state);
            
            this.restoreShake();
        }
    }
};

if (typeof window !== 'undefined') {
    window.Renderer = Renderer;
}
