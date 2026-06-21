class ElementSystem {
    constructor() {
        this.activeEffects = [];
        this.effectParticles = new ParticleSystem();
        this.heatActive = false;
        this.growthActive = false;
        this.freezeActive = false;
        this.frozenPrisms = new Set();
    }

    checkResonance(colors) {
        const effects = [];
        const hasRed = colors.red > 0.15;
        const hasGreen = colors.green > 0.15;
        const hasBlue = colors.blue > 0.15;

        if (hasRed && hasBlue) {
            effects.push('heat');
            this.heatActive = true;
        }
        if (hasRed && hasGreen) {
            effects.push('growth');
            this.growthActive = true;
        }
        if (hasBlue && hasGreen) {
            effects.push('freeze');
            this.freezeActive = true;
        }

        return effects;
    }

    applyHeatEffect(targetX, targetY, particles) {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                particles.emit(targetX, targetY, {
                    count: 15,
                    color: '#ff6600',
                    speed: 80,
                    size: 4,
                    life: 0.8,
                    spread: Math.PI * 2
                });
            }, i * 100);
        }

        return {
            type: 'heat',
            armorPierce: 20,
            description: '高温穿透 - 无视20点护甲'
        };
    }

    applyGrowthEffect(startX, startY, angle, game) {
        const splitAngles = [-25, 0, 25];
        const beams = [];

        for (const offset of splitAngles) {
            const beamAngle = angle + offset;
            beams.push({
                x: startX,
                y: startY,
                angle: beamAngle,
                intensity: 0.5
            });
        }

        return {
            type: 'growth',
            beams: beams,
            description: '生长蔓延 - 光束分裂为3条子束'
        };
    }

    applyFreezeEffect(prism) {
        let frozen = false;
        if (prism && prism.isRotatable && !prism.frozen) {
            prism.freeze();
            this.frozenPrisms.add(prism.id);
            frozen = true;
        }

        return {
            type: 'freeze',
            frozen: frozen,
            prismId: prism ? prism.id : null,
            description: '冷冻凝固 - 目标棱镜3秒不可旋转'
        };
    }

    update(deltaTime, particles) {
        this.effectParticles.update(deltaTime);

        if (this.heatActive) {
            this.heatActive = false;
        }
        if (this.growthActive) {
            this.growthActive = false;
        }
    }

    drawEffectIndicators(ctx, x, y, effects) {
        if (!effects || effects.length === 0) return;

        const iconSize = 20;
        const spacing = 25;
        const startX = x - (effects.length - 1) * spacing / 2;

        for (let i = 0; i < effects.length; i++) {
            const ex = startX + i * spacing;
            const ey = y - 30;

            ctx.save();
            ctx.globalAlpha = 0.9;

            if (effects[i] === 'heat') {
                this._drawHeatIcon(ctx, ex, ey, iconSize);
            } else if (effects[i] === 'growth') {
                this._drawGrowthIcon(ctx, ex, ey, iconSize);
            } else if (effects[i] === 'freeze') {
                this._drawFreezeIcon(ctx, ex, ey, iconSize);
            }

            ctx.restore();
        }
    }

    _drawHeatIcon(ctx, x, y, size) {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
        gradient.addColorStop(0, '#ffff00');
        gradient.addColorStop(0.5, '#ff6600');
        gradient.addColorStop(1, '#ff0000');

        ctx.fillStyle = gradient;
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 15;

        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = -Math.PI / 2 + (i * 2 * Math.PI / 5);
            const outerX = x + size * 0.5 * Math.cos(angle);
            const outerY = y + size * 0.5 * Math.sin(angle);
            const innerAngle = angle + Math.PI / 5;
            const innerX = x + size * 0.2 * Math.cos(innerAngle);
            const innerY = y + size * 0.2 * Math.sin(innerAngle);

            if (i === 0) {
                ctx.moveTo(outerX, outerY);
            } else {
                ctx.lineTo(outerX, outerY);
            }
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();
    }

    _drawGrowthIcon(ctx, x, y, size) {
        ctx.fillStyle = '#33ff66';
        ctx.shadowColor = '#33ff66';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
        ctx.fill();

        for (let i = 0; i < 3; i++) {
            const angle = -Math.PI / 2 + (i - 1) * 0.8;
            const len = size * 0.6;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#33ff66';
            ctx.stroke();
        }
    }

    _drawFreezeIcon(ctx, x, y, size) {
        ctx.strokeStyle = '#3366ff';
        ctx.shadowColor = '#3366ff';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2;

        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const len = size * 0.5;

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
            ctx.stroke();

            const midX = x + Math.cos(angle) * len * 0.5;
            const midY = y + Math.sin(angle) * len * 0.5;
            const perpAngle = angle + Math.PI / 3;
            const branchLen = size * 0.2;

            ctx.beginPath();
            ctx.moveTo(midX, midY);
            ctx.lineTo(midX + Math.cos(perpAngle) * branchLen, midY + Math.sin(perpAngle) * branchLen);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(midX, midY);
            ctx.lineTo(midX - Math.cos(perpAngle) * branchLen, midY - Math.sin(perpAngle) * branchLen);
            ctx.stroke();
        }
    }

    reset() {
        this.heatActive = false;
        this.growthActive = false;
        this.freezeActive = false;
        this.frozenPrisms.clear();
        this.activeEffects = [];
        this.effectParticles.clear();
    }
}
