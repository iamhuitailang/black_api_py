const RenderSystem = {
    canvas: null,
    ctx: null,

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    },

    render() {
        if (!this.ctx) return;
        
        this.ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        
        this.drawBackground();
        this.drawResourcePoints();
        this.drawColony();
        this.drawUnits();
        this.drawEnemies();
        this.drawEffects();
    },

    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.4, '#90EE90');
        gradient.addColorStop(0.7, '#8FBC8F');
        gradient.addColorStop(1, '#8B4513');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        this.ctx.fillStyle = '#228B22';
        for (let i = 0; i < 50; i++) {
            const x = (i * 73) % CONFIG.CANVAS_WIDTH;
            const y = 200 + (i * 47) % 350;
            this.drawGrass(x, y);
        }

        this.ctx.fillStyle = '#654321';
        this.ctx.beginPath();
        this.ctx.ellipse(CONFIG.COLONY.X, CONFIG.COLONY.Y + 40, 100, 30, 0, 0, Math.PI * 2);
        this.ctx.fill();
    },

    drawGrass(x, y) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.fillStyle = '#228B22';
        for (let i = -3; i <= 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * 2, 0);
            this.ctx.quadraticCurveTo(i * 3, -8, i * 2, -15);
            this.ctx.quadraticCurveTo(i * 1, -8, i * 2, 0);
            this.ctx.fill();
        }
        this.ctx.restore();
    },

    drawColony() {
        const colony = GameState.colony;
        if (!colony) return;

        this.ctx.save();
        this.ctx.translate(colony.x, colony.y);

        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.moveTo(-60, 40);
        this.ctx.quadraticCurveTo(-60, -20, 0, -30);
        this.ctx.quadraticCurveTo(60, -20, 60, 40);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.fillStyle = '#654321';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 10, 25, 18, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#1a0a00';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 10, 15, 10, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#A0522D';
        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.arc(-40 + i * 40, -10 - (i % 2) * 10, 8, 0, Math.PI * 2);
            this.ctx.fill();
        }

        const hpPercent = colony.hp / colony.maxHp;
        const barWidth = 100;
        const barHeight = 8;
        const barX = -barWidth / 2;
        const barY = -50;

        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

        this.ctx.fillStyle = hpPercent > 0.5 ? '#4CAF50' : hpPercent > 0.25 ? '#FFC107' : '#F44336';
        this.ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${Math.ceil(colony.hp)}/${colony.maxHp}`, 0, barY - 5);

        this.ctx.restore();
    },

    drawResourcePoints() {
        GameState.resourcePoints.forEach(point => {
            this.ctx.save();
            this.ctx.translate(point.x, point.y);

            if (point.isEmpty) {
                this.ctx.globalAlpha = 0.3;
            }

            if (point.type === 'leaf') {
                this.ctx.fillStyle = '#228B22';
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, 18, 12, Math.PI / 6, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.strokeStyle = '#006400';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(-15, 5);
                this.ctx.lineTo(15, -5);
                this.ctx.stroke();
            } else {
                this.ctx.fillStyle = '#DC143C';
                for (let i = 0; i < 5; i++) {
                    const angle = (i / 5) * Math.PI * 2;
                    const bx = Math.cos(angle) * 8;
                    const by = Math.sin(angle) * 8;
                    this.ctx.beginPath();
                    this.ctx.arc(bx, by, 7, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                this.ctx.fillStyle = '#8B0000';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 6, 0, Math.PI * 2);
                this.ctx.fill();
            }

            if (!point.isEmpty) {
                const percent = point.amount / point.maxAmount;
                this.ctx.fillStyle = '#fff';
                this.ctx.font = 'bold 10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(`${Math.ceil(point.amount)}`, 0, 28);
            } else {
                const regenPercent = 1 - (point.regenTimer / CONFIG.RESOURCE_POINTS.REGEN_TIME);
                this.ctx.fillStyle = '#333';
                this.ctx.fillRect(-15, 22, 30, 4);
                this.ctx.fillStyle = '#4CAF50';
                this.ctx.fillRect(-15, 22, 30 * regenPercent, 4);
            }

            this.ctx.restore();
        });
    },

    drawUnits() {
        GameState.units.forEach(unit => {
            this.ctx.save();
            this.ctx.translate(unit.x, unit.y);
            this.ctx.rotate(unit.angle);

            if (unit.isFlying) {
                this.ctx.globalAlpha = 0.8;
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                this.ctx.beginPath();
                this.ctx.ellipse(-5, -10, 12, 6, -0.3, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.ellipse(-5, 10, 12, 6, 0.3, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.globalAlpha = 1;
            }

            this.ctx.fillStyle = unit.color;
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, unit.size, unit.size * 0.7, 0, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = unit.color;
            this.ctx.beginPath();
            this.ctx.arc(unit.size * 0.6, 0, unit.size * 0.4, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = '#000';
            this.ctx.beginPath();
            this.ctx.arc(unit.size * 0.7, -unit.size * 0.15, 2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(unit.size * 0.7, unit.size * 0.15, 2, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.strokeStyle = unit.color;
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(unit.size * 0.8, -unit.size * 0.2);
            this.ctx.lineTo(unit.size * 1.2, -unit.size * 0.5);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(unit.size * 0.8, unit.size * 0.2);
            this.ctx.lineTo(unit.size * 1.2, unit.size * 0.5);
            this.ctx.stroke();

            if (unit.canGather && unit.carrying > 0) {
                this.ctx.fillStyle = '#228B22';
                this.ctx.beginPath();
                this.ctx.arc(-unit.size * 0.3, -unit.size * 0.5, 5, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.ctx.restore();

            const hpPercent = unit.hp / unit.maxHp;
            if (hpPercent < 1) {
                const barWidth = unit.size * 2;
                const barHeight = 3;
                this.ctx.fillStyle = '#333';
                this.ctx.fillRect(unit.x - barWidth / 2, unit.y - unit.size - 8, barWidth, barHeight);
                this.ctx.fillStyle = hpPercent > 0.5 ? '#4CAF50' : '#F44336';
                this.ctx.fillRect(unit.x - barWidth / 2, unit.y - unit.size - 8, barWidth * hpPercent, barHeight);
            }
        });
    },

    drawEnemies() {
        GameState.enemies.forEach(enemy => {
            this.ctx.save();
            this.ctx.translate(enemy.x, enemy.y);
            this.ctx.rotate(enemy.angle);

            if (enemy.isFlying) {
                this.ctx.globalAlpha = 0.8;
                this.ctx.fillStyle = 'rgba(200, 100, 100, 0.5)';
                this.ctx.beginPath();
                this.ctx.ellipse(-5, -10, 12, 6, -0.3, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.ellipse(-5, 10, 12, 6, 0.3, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.globalAlpha = 1;
            }

            if (enemy.type === 'spider' || enemy.type === 'beetle') {
                this.ctx.fillStyle = enemy.color;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, enemy.size, 0, Math.PI * 2);
                this.ctx.fill();

                for (let i = 0; i < 8; i++) {
                    const legAngle = (i / 8) * Math.PI * 2;
                    this.ctx.strokeStyle = enemy.color;
                    this.ctx.lineWidth = 3;
                    this.ctx.beginPath();
                    this.ctx.moveTo(Math.cos(legAngle) * enemy.size * 0.8, Math.sin(legAngle) * enemy.size * 0.8);
                    this.ctx.lineTo(Math.cos(legAngle) * enemy.size * 1.5, Math.sin(legAngle) * enemy.size * 1.5);
                    this.ctx.stroke();
                }

                this.ctx.fillStyle = '#ff0000';
                for (let i = 0; i < 4; i++) {
                    const ex = enemy.size * 0.5 + (i % 2) * 6;
                    const ey = -enemy.size * 0.2 + Math.floor(i / 2) * 8;
                    this.ctx.beginPath();
                    this.ctx.arc(ex, ey, 3, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            } else {
                this.ctx.fillStyle = enemy.color;
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, enemy.size, enemy.size * 0.6, 0, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = enemy.color;
                this.ctx.beginPath();
                this.ctx.arc(enemy.size * 0.6, 0, enemy.size * 0.4, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = '#ff0000';
                this.ctx.beginPath();
                this.ctx.arc(enemy.size * 0.7, -enemy.size * 0.15, 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.arc(enemy.size * 0.7, enemy.size * 0.15, 2, 0, Math.PI * 2);
                this.ctx.fill();

                if (enemy.isBoss) {
                    this.ctx.fillStyle = '#ffd700';
                    this.ctx.font = 'bold 14px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('👑', 0, -enemy.size - 5);
                }
            }

            this.ctx.restore();

            const hpPercent = enemy.hp / enemy.maxHp;
            const barWidth = enemy.size * 2;
            const barHeight = 4;
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.size - 10, barWidth, barHeight);
            this.ctx.fillStyle = enemy.isBoss ? '#ff6b6b' : '#f44336';
            this.ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.size - 10, barWidth * hpPercent, barHeight);
        });
    },

    drawEffects() {
        GameState.effects = GameState.effects.filter(effect => {
            effect.life -= 16;
            
            if (effect.type === 'damage') {
                this.ctx.save();
                this.ctx.globalAlpha = effect.life / effect.maxLife;
                this.ctx.fillStyle = effect.color || '#ff0000';
                this.ctx.font = 'bold 14px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(`-${effect.value}`, effect.x, effect.y);
                effect.y -= 1;
                this.ctx.restore();
            } else if (effect.type === 'heal') {
                this.ctx.save();
                this.ctx.globalAlpha = effect.life / effect.maxLife;
                this.ctx.fillStyle = '#4CAF50';
                this.ctx.font = 'bold 14px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(`+${effect.value}`, effect.x, effect.y);
                effect.y -= 1;
                this.ctx.restore();
            } else if (effect.type === 'stone') {
                this.ctx.save();
                this.ctx.globalAlpha = effect.life / effect.maxLife;
                this.ctx.fillStyle = '#888';
                this.ctx.font = 'bold 14px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(`+${effect.value}🪨`, effect.x, effect.y);
                effect.y -= 1;
                this.ctx.restore();
            }
            
            return effect.life > 0;
        });
    },

    addEffect(type, x, y, value, color) {
        GameState.effects.push({
            type,
            x,
            y,
            value,
            color,
            life: 800,
            maxLife: 800
        });
    }
};
