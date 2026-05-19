const Renderer = {
    canvas: null,
    ctx: null,

    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
    },

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },

    drawBackground() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        const skyGradient = ctx.createLinearGradient(0, 0, 0, h);
        skyGradient.addColorStop(0, '#2c1810');
        skyGradient.addColorStop(0.5, '#4a2c1a');
        skyGradient.addColorStop(1, '#6b3a22');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, w, h);

        this.drawBuildings();
        this.drawLanterns();
        this.drawSpectators();
        this.drawArena();
    },

    drawBuildings() {
        const ctx = this.ctx;
        const groundY = GameData.gameConfig.groundY;

        const buildings = [
            { x: 0, w: 120, h: 200, color: '#3d2914' },
            { x: 100, w: 100, h: 250, color: '#4a3520' },
            { x: 220, w: 140, h: 180, color: '#3d2914' },
            { x: 380, w: 120, h: 220, color: '#4a3520' },
            { x: 520, w: 100, h: 190, color: '#3d2914' },
            { x: 640, w: 130, h: 240, color: '#4a3520' },
            { x: 780, w: 110, h: 200, color: '#3d2914' },
            { x: 870, w: 90, h: 230, color: '#4a3520' }
        ];

        const windowPatterns = [
            [1, 1, 0, 1, 0, 1, 1, 0],
            [1, 0, 1, 1, 0, 1, 0, 1],
            [0, 1, 1, 0, 1, 1, 0, 1],
            [1, 1, 0, 1, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 1, 1, 1],
            [1, 0, 1, 0, 1, 0, 1, 1],
            [1, 1, 1, 0, 1, 1, 0, 0],
            [0, 1, 0, 1, 1, 0, 1, 1]
        ];

        buildings.forEach((b, bi) => {
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x, groundY - b.h, b.w, b.h);

            ctx.fillStyle = '#ffd700';
            ctx.globalAlpha = 0.6;
            const pattern = windowPatterns[bi % windowPatterns.length];
            let pi = 0;
            for (let row = 0; row < Math.floor(b.h / 40); row++) {
                for (let col = 0; col < Math.floor(b.w / 30); col++) {
                    if (pattern[pi % pattern.length] === 1) {
                        ctx.fillRect(b.x + 10 + col * 30, groundY - b.h + 20 + row * 40, 12, 18);
                    }
                    pi++;
                }
            }
            ctx.globalAlpha = 1;

            ctx.fillStyle = '#8b4513';
            ctx.fillRect(b.x - 5, groundY - b.h - 15, b.w + 10, 15);
        });
    },

    drawLanterns() {
        const ctx = this.ctx;
        const groundY = GameData.gameConfig.groundY;

        const lanternPositions = [
            { x: 150, y: groundY - 320 },
            { x: 350, y: groundY - 350 },
            { x: 550, y: groundY - 340 },
            { x: 750, y: groundY - 330 },
            { x: 880, y: groundY - 310 }
        ];

        lanternPositions.forEach(pos => {
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(pos.x - 2, pos.y, 4, 30);

            ctx.fillStyle = '#c41e3a';
            ctx.beginPath();
            ctx.ellipse(pos.x, pos.y + 45, 18, 22, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffd700';
            ctx.fillRect(pos.x - 15, pos.y + 25, 30, 4);
            ctx.fillRect(pos.x - 15, pos.y + 61, 30, 4);

            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('福', pos.x, pos.y + 50);

            ctx.fillStyle = '#ffd700';
            ctx.fillRect(pos.x - 1, pos.y + 65, 2, 15);
        });
    },

    drawSpectators() {
        const ctx = this.ctx;
        const groundY = GameData.gameConfig.groundY;

        const hasBanner = [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0];

        for (let i = 0; i < 15; i++) {
            const x = 50 + i * 60 + Math.sin(i) * 10;
            const y = groundY - 60;

            ctx.fillStyle = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'][i % 5];
            ctx.fillRect(x - 12, y, 24, 30);

            ctx.fillStyle = '#f5deb3';
            ctx.beginPath();
            ctx.arc(x, y - 8, 10, 0, Math.PI * 2);
            ctx.fill();

            if (hasBanner[i] === 1) {
                ctx.fillStyle = '#fff';
                ctx.fillRect(x - 15, y - 40, 30, 5);
            }
        }
    },

    drawArena() {
        const ctx = this.ctx;
        const groundY = GameData.gameConfig.groundY;
        const w = this.canvas.width;

        ctx.fillStyle = '#8b4513';
        ctx.fillRect(0, groundY, w, this.canvas.height - groundY);

        ctx.strokeStyle = '#d4a574';
        ctx.lineWidth = 2;
        for (let i = 0; i < w; i += 40) {
            ctx.beginPath();
            ctx.moveTo(i, groundY + 10);
            ctx.lineTo(i, groundY + 20);
            ctx.stroke();
        }

        ctx.fillStyle = '#c41e3a';
        ctx.fillRect(0, groundY - 5, w, 5);
    },

    drawCharacter(character) {
        if (!character) return;
        
        const ctx = this.ctx;
        const x = character.x;
        const y = character.y;
        const facing = character.facing || 1;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(facing, 1);

        if (character.state === GameData.states.HURT && character.hurtTimer > 0) {
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 50) * 0.3;
        }

        const colors = character.colors;
        const bodyOffset = character.isCrouching ? 30 : 0;

        ctx.fillStyle = colors.clothes;
        ctx.fillRect(-20, 30 + bodyOffset, 40, 50 - bodyOffset);

        ctx.fillStyle = colors.body;
        ctx.beginPath();
        ctx.arc(0, 15 + bodyOffset, 22, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = colors.head;
        ctx.beginPath();
        ctx.arc(0, 10 + bodyOffset, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(6, 8 + bodyOffset, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = colors.body;
        if (character.state === GameData.states.ATTACKING) {
            const attackType = character.attackType;
            if (attackType === 'lightPunch' || attackType === 'heavyPunch') {
                ctx.fillRect(20, 35 + bodyOffset, 35, 10);
                ctx.fillRect(-25, 35 + bodyOffset, 10, 8);
            } else if (attackType === 'lightKick' || attackType === 'heavyKick') {
                ctx.fillRect(15, 70 + bodyOffset, 35, 10);
                ctx.fillRect(-25, 70 + bodyOffset, 12, 25);
            } else if (attackType === 'ultimate') {
                ctx.fillRect(25, 30 + bodyOffset, 45, 15);
                ctx.fillRect(-30, 30 + bodyOffset, 15, 12);
                ctx.fillRect(20, 65 + bodyOffset, 40, 12);
                ctx.fillRect(-30, 65 + bodyOffset, 15, 30);

                ctx.globalAlpha = 0.6;
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.arc(50, 50 + bodyOffset, 30, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        } else if (character.state === GameData.states.BLOCKING) {
            ctx.fillRect(15, 25 + bodyOffset, 10, 30);
            ctx.fillRect(-25, 25 + bodyOffset, 10, 30);
            ctx.fillRect(-28, 20 + bodyOffset, 16, 40);
        } else {
            ctx.fillRect(20, 35 + bodyOffset, 12, 25);
            ctx.fillRect(-32, 35 + bodyOffset, 12, 25);
        }

        if (character.state !== GameData.states.ATTACKING || 
            (character.attackType !== 'lightKick' && character.attackType !== 'heavyKick' && character.attackType !== 'ultimate')) {
            ctx.fillStyle = '#2c3e50';
            if (character.state === GameData.states.WALKING) {
                const legOffset = Math.sin(character.animFrame * 1.5) * 8;
                ctx.fillRect(-18, 75 + bodyOffset, 14, 25 - bodyOffset + legOffset);
                ctx.fillRect(4, 75 + bodyOffset, 14, 25 - bodyOffset - legOffset);
            } else if (character.state === GameData.states.JUMPING) {
                ctx.fillRect(-18, 75 + bodyOffset, 14, 18);
                ctx.fillRect(4, 75 + bodyOffset, 14, 18);
            } else {
                ctx.fillRect(-18, 75 + bodyOffset, 14, 25 - bodyOffset);
                ctx.fillRect(4, 75 + bodyOffset, 14, 25 - bodyOffset);
            }
        }

        ctx.restore();

        if (character.hitEffectTimer > 0) {
            this.drawHitEffect(character.hitEffectX, character.hitEffectY);
        }
    },

    drawHitEffect(x, y) {
        const ctx = this.ctx;
        ctx.save();
        ctx.globalAlpha = 0.8;

        ctx.fillStyle = '#ffd700';
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const dist = 20;
            ctx.beginPath();
            ctx.arc(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = '#ff6b35';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('砰!', x, y - 30);

        ctx.restore();
    },

    drawUI(player, opponent, timeLeft, debugInfo = null) {
        this.drawHealthBar(player, 30, 15, true);
        this.drawHealthBar(opponent, this.canvas.width - 330, 15, false);
        this.drawEnergyBar(player, 30, 65, true);
        this.drawEnergyBar(opponent, this.canvas.width - 330, 65, false);
        this.drawTimer(timeLeft);
        
        if (debugInfo) {
            this.drawDebugInfo(debugInfo);
        }
    },

    drawDebugInfo(info) {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, this.canvas.height - 140, 450, 130);
        
        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        
        ctx.fillStyle = '#ffd700';
        ctx.fillText('调试信息 (按J/K/U/I/L攻击):', 20, this.canvas.height - 115);
        
        ctx.fillStyle = '#fff';
        ctx.fillText(`按住: J=${info.keys.j ? '是' : '否'} K=${info.keys.k ? '是' : '否'} U=${info.keys.u ? '是' : '否'} I=${info.keys.i ? '是' : '否'} L=${info.keys.l ? '是' : '否'}`, 20, this.canvas.height - 95);
        
        ctx.fillStyle = info.justPressed.j || info.justPressed.k || info.justPressed.u || info.justPressed.i || info.justPressed.l ? '#2ecc71' : '#fff';
        ctx.fillText(`检测: J=${info.justPressed.j ? '是' : '否'} K=${info.justPressed.k ? '是' : '否'} U=${info.justPressed.u ? '是' : '否'} I=${info.justPressed.i ? '是' : '否'} L=${info.justPressed.l ? '是' : '否'}`, 20, this.canvas.height - 75);
        
        ctx.fillStyle = info.inputResult.lightPunch || info.inputResult.heavyPunch || info.inputResult.lightKick || info.inputResult.heavyKick || info.inputResult.ultimate ? '#2ecc71' : '#fff';
        ctx.fillText(`触发: J=${info.inputResult.lightPunch ? '是' : '否'} K=${info.inputResult.heavyPunch ? '是' : '否'} U=${info.inputResult.lightKick ? '是' : '否'} I=${info.inputResult.heavyKick ? '是' : '否'} L=${info.inputResult.ultimate ? '是' : '否'}`, 20, this.canvas.height - 55);
        
        ctx.fillStyle = '#fff';
        ctx.fillText(`状态: ${info.playerState}  能量: ${info.playerEnergy}  可行动: ${info.canAct ? '是' : '否'}`, 20, this.canvas.height - 35);
    },

    drawHealthBar(character, x, y, isLeft) {
        const ctx = this.ctx;
        const width = 300;
        const height = 30;

        ctx.fillStyle = '#000';
        ctx.fillRect(x - 3, y - 3, width + 6, height + 6);

        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, width, height);

        const healthPercent = character.health / character.maxHealth;
        const healthWidth = width * healthPercent;

        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        if (healthPercent > 0.5) {
            gradient.addColorStop(0, '#2ecc71');
            gradient.addColorStop(1, '#27ae60');
        } else if (healthPercent > 0.25) {
            gradient.addColorStop(0, '#f39c12');
            gradient.addColorStop(1, '#e67e22');
        } else {
            gradient.addColorStop(0, '#e74c3c');
            gradient.addColorStop(1, '#c0392b');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, healthWidth, height);

        ctx.strokeStyle = '#d4a574';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px sans-serif';
        if (isLeft) {
            ctx.textAlign = 'left';
            ctx.fillText(character.name, x + 5, y + 20);
        } else {
            ctx.textAlign = 'right';
            ctx.fillText(character.name, x + width - 5, y + 20);
        }

        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${character.health}/${character.maxHealth}`, x + width - 5, y + 45);
    },

    drawEnergyBar(character, x, y, isLeft) {
        const ctx = this.ctx;
        const width = 300;
        const height = 15;

        ctx.fillStyle = '#000';
        ctx.fillRect(x - 2, y - 2, width + 4, height + 4);

        ctx.fillStyle = '#222';
        ctx.fillRect(x, y, width, height);

        const energyPercent = character.energy / character.maxEnergy;
        const energyWidth = width * energyPercent;

        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, '#3498db');
        gradient.addColorStop(1, '#2980b9');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, energyWidth, height);

        if (character.energy >= 100) {
            ctx.fillStyle = `rgba(255, 215, 0, ${0.5 + Math.sin(Date.now() / 100) * 0.3})`;
            ctx.fillRect(x, y, width, height);
        }

        ctx.strokeStyle = '#d4a574';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);

        ctx.fillStyle = '#fff';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`气: ${character.energy}%`, x + width - 5, y + 12);
    },

    drawTimer(timeLeft) {
        const ctx = this.ctx;
        const x = this.canvas.width / 2;
        const y = 50;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.arc(x, y, 35, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#d4a574';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = timeLeft <= 10 ? '#e74c3c' : '#ffd700';
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(Math.ceil(timeLeft), x, y);
    },

    drawRoundStart(round) {
        const ctx = this.ctx;
        ctx.save();
        ctx.globalAlpha = 0.9;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 64px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`第 ${round} 回合`, this.canvas.width / 2, this.canvas.height / 2);

        ctx.fillStyle = '#fff';
        ctx.font = '28px sans-serif';
        ctx.fillText('准备...', this.canvas.width / 2, this.canvas.height / 2 + 60);

        ctx.restore();
    }
};
