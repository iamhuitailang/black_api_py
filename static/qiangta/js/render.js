const GameRenderer = {
    ctx: null,
    canvas: null,
    particles: [],
    resizeListener: null,

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        if (this.resizeListener) {
            window.removeEventListener('resize', this.resizeListener);
        }
        
        this.resizeListener = () => this.resize();
        window.addEventListener('resize', this.resizeListener);
        
        this.resize();
    },

    resize() {
        const container = this.canvas.parentElement;
        if (container && container.clientWidth > 0 && container.clientHeight > 0) {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
        } else {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight - 200;
        }
    },

    render(gameState) {
        if (!this.ctx || !gameState) return;
        
        const width = this.canvas.width || 800;
        const height = this.canvas.height || 600;
        
        this.ctx.clearRect(0, 0, width, height);
        
        this.drawDotaBackground(width, height);
        this.drawDotaPath(width, height);
        this.drawBases(gameState, width, height);
        this.drawTower(gameState, width, height);
        this.drawUnits(gameState);
        this.updateAndDrawParticles();
    },

    drawDotaBackground(width, height) {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.3, '#16213e');
        gradient.addColorStop(0.7, '#0f3460');
        gradient.addColorStop(1, '#1a1a2e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, width, height);

        this.ctx.fillStyle = 'rgba(34, 139, 34, 0.1)';
        for (let i = 0; i < 50; i++) {
            const x = (i * 137) % width;
            const y = (i * 89) % height;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 20 + Math.random() * 30, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 100; i++) {
            const x = (i * 73) % width;
            const y = (i * 47) % height;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 1, 0, Math.PI * 2);
            this.ctx.fill();
        }
    },

    drawDotaPath(width, height) {
        const centerY = height / 2;
        
        const pathGradient = this.ctx.createLinearGradient(0, centerY - 80, 0, centerY + 80);
        pathGradient.addColorStop(0, 'rgba(139, 69, 19, 0.4)');
        pathGradient.addColorStop(0.3, 'rgba(160, 82, 45, 0.6)');
        pathGradient.addColorStop(0.5, 'rgba(139, 69, 19, 0.7)');
        pathGradient.addColorStop(0.7, 'rgba(160, 82, 45, 0.6)');
        pathGradient.addColorStop(1, 'rgba(139, 69, 19, 0.4)');
        this.ctx.fillStyle = pathGradient;
        this.ctx.fillRect(0, centerY - 80, width, 160);

        this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([20, 10]);
        this.ctx.beginPath();
        this.ctx.moveTo(0, centerY);
        this.ctx.lineTo(width, centerY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        this.ctx.fillStyle = 'rgba(70, 130, 180, 0.1)';
        for (let x = 100; x < width / 2 - 100; x += 80) {
            this.ctx.beginPath();
            this.ctx.arc(x, centerY, 15, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.fillStyle = 'rgba(220, 20, 60, 0.1)';
        for (let x = width - 100; x > width / 2 + 100; x -= 80) {
            this.ctx.beginPath();
            this.ctx.arc(x, centerY, 15, 0, Math.PI * 2);
            this.ctx.fill();
        }
    },

    drawBases(gameState, width, height) {
        this.drawDotaBase(
            0,
            height / 2 - GameData.BASE.HEIGHT / 2,
            GameData.BASE.WIDTH,
            GameData.BASE.HEIGHT,
            gameState.player.baseHp,
            GameData.BASE.MAX_HP,
            'player'
        );

        this.drawDotaBase(
            width - GameData.BASE.WIDTH,
            height / 2 - GameData.BASE.HEIGHT / 2,
            GameData.BASE.WIDTH,
            GameData.BASE.HEIGHT,
            gameState.enemy.baseHp,
            GameData.BASE.MAX_HP,
            'enemy'
        );
    },

    drawDotaBase(x, y, width, height, hp, maxHp, team) {
        const colors = GameData.COLORS[team];
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(x + 8, y + 8, width, height);

        const baseGradient = this.ctx.createLinearGradient(x, y, x, y + height);
        baseGradient.addColorStop(0, colors.primary);
        baseGradient.addColorStop(0.3, colors.secondary);
        baseGradient.addColorStop(0.7, colors.dark);
        baseGradient.addColorStop(1, '#000');
        this.ctx.fillStyle = baseGradient;
        this.ctx.fillRect(x, y, width, height);

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fillRect(x + 5, y + 5, width - 10, 15);

        const towerX = x + width / 2;
        const towerY = y - 40;
        
        this.ctx.fillStyle = colors.secondary;
        this.ctx.fillRect(towerX - 15, towerY, 30, 50);
        
        this.ctx.fillStyle = colors.primary;
        this.ctx.beginPath();
        this.ctx.moveTo(towerX - 20, towerY);
        this.ctx.lineTo(towerX, towerY - 25);
        this.ctx.lineTo(towerX + 20, towerY);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.fillStyle = team === 'player' ? '#00ff00' : '#ff0000';
        this.ctx.shadowColor = team === 'player' ? '#00ff00' : '#ff0000';
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.arc(towerX, towerY - 15, 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        this.ctx.strokeStyle = colors.primary;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x, y, width, height);

        this.drawDotaHpBar(x + 5, y - 45, width - 10, 10, hp, maxHp, colors.primary);

        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;
        const text = team === 'player' ? '⚔️ 天辉基地' : '💀 夜魇基地';
        this.ctx.strokeText(text, x + width / 2, y - 55);
        this.ctx.fillText(text, x + width / 2, y - 55);
    },

    drawTower(gameState, width, height) {
        const x = width / 2 - GameData.TOWER.WIDTH / 2;
        const y = height / 2 - GameData.TOWER.HEIGHT / 2;
        
        let ownerColors;
        let ownerName;
        if (gameState.tower.owner === 'player') {
            ownerColors = GameData.COLORS.player;
            ownerName = '天辉';
        } else if (gameState.tower.owner === 'enemy') {
            ownerColors = GameData.COLORS.enemy;
            ownerName = '夜魇';
        } else {
            ownerColors = GameData.COLORS.neutral;
            ownerName = '中立';
        }

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.fillRect(x + 5, y + 5, GameData.TOWER.WIDTH, GameData.TOWER.HEIGHT);

        const towerGradient = this.ctx.createLinearGradient(x, y, x, y + GameData.TOWER.HEIGHT);
        towerGradient.addColorStop(0, ownerColors.primary);
        towerGradient.addColorStop(0.3, ownerColors.secondary);
        towerGradient.addColorStop(0.7, ownerColors.dark);
        towerGradient.addColorStop(1, '#000');
        this.ctx.fillStyle = towerGradient;
        this.ctx.fillRect(x, y, GameData.TOWER.WIDTH, GameData.TOWER.HEIGHT);

        const towerX = x + GameData.TOWER.WIDTH / 2;
        const towerTop = y - 50;
        
        this.ctx.fillStyle = ownerColors.secondary;
        this.ctx.fillRect(towerX - 12, towerTop, 24, 60);
        
        this.ctx.fillStyle = ownerColors.primary;
        this.ctx.beginPath();
        this.ctx.moveTo(towerX - 18, towerTop);
        this.ctx.lineTo(towerX, towerTop - 30);
        this.ctx.lineTo(towerX + 18, towerTop);
        this.ctx.closePath();
        this.ctx.fill();

        const glowColor = gameState.tower.owner === 'player' ? '#00ff00' : 
                          gameState.tower.owner === 'enemy' ? '#ff0000' : '#ffd700';
        this.ctx.fillStyle = glowColor;
        this.ctx.shadowColor = glowColor;
        this.ctx.shadowBlur = 20;
        this.ctx.beginPath();
        this.ctx.arc(towerX, towerTop - 15, 8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        this.ctx.strokeStyle = ownerColors.primary;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x, y, GameData.TOWER.WIDTH, GameData.TOWER.HEIGHT);

        this.drawDotaHpBar(x + 5, y - 60, GameData.TOWER.WIDTH - 10, 8, gameState.tower.hp, GameData.TOWER.MAX_HP, ownerColors.primary);

        if (gameState.tower.owner) {
            this.ctx.font = 'bold 14px Arial';
            this.ctx.fillStyle = '#fff';
            this.ctx.textAlign = 'center';
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            const bonusText = `${ownerName} +${GameData.TOWER.GOLD_PER_SECOND}💰/秒`;
            this.ctx.strokeText(bonusText, x + GameData.TOWER.WIDTH / 2, y - 70);
            this.ctx.fillText(bonusText, x + GameData.TOWER.WIDTH / 2, y - 70);
        } else {
            this.ctx.font = 'bold 14px Arial';
            this.ctx.fillStyle = '#ffd700';
            this.ctx.textAlign = 'center';
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeText('🏰 争夺中', x + GameData.TOWER.WIDTH / 2, y - 70);
            this.ctx.fillText('🏰 争夺中', x + GameData.TOWER.WIDTH / 2, y - 70);
        }
    },

    drawUnits(gameState) {
        for (const unit of gameState.units) {
            this.drawDotaUnit(unit);
        }
    },

    drawDotaUnit(unit) {
        const colors = GameData.COLORS[unit.team];
        const yOffset = unit.isFlying ? -25 : 0;
        
        if (unit.isFlying) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.beginPath();
            this.ctx.ellipse(unit.x, unit.y + 20, 18, 10, 0, 0, Math.PI * 2);
            this.ctx.fill();
        }

        const unitSize = unit.type === 'shield' ? 22 : (unit.type === 'mage' ? 18 : 20);
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.beginPath();
        this.ctx.arc(unit.x + 3, unit.y + yOffset + 3, unitSize, 0, Math.PI * 2);
        this.ctx.fill();

        const unitGradient = this.ctx.createRadialGradient(
            unit.x - 5, unit.y + yOffset - 5, 0,
            unit.x, unit.y + yOffset, unitSize
        );
        unitGradient.addColorStop(0, colors.primary);
        unitGradient.addColorStop(0.5, colors.secondary);
        unitGradient.addColorStop(1, colors.dark);
        this.ctx.fillStyle = unitGradient;
        this.ctx.beginPath();
        this.ctx.arc(unit.x, unit.y + yOffset, unitSize, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = colors.primary;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(GameData.UNIT_TYPES[unit.type].icon, unit.x, unit.y + yOffset);

        if (unit.type === 'shield') {
            this.ctx.strokeStyle = 'rgba(100, 149, 237, 0.6)';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(unit.x, unit.y + yOffset, unitSize + 5, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        if (unit.isFlying) {
            const time = Date.now() / 200;
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(unit.x, unit.y + yOffset, unitSize + 3 + Math.sin(time) * 2, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        if (unit.attackCooldown > 0 && unit.target) {
            const targetY = unit.target.y !== undefined ? unit.target.y : this.canvas.height / 2;
            this.ctx.strokeStyle = unit.team === 'player' ? 'rgba(76, 209, 55, 0.6)' : 'rgba(232, 65, 24, 0.6)';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(unit.x, unit.y + yOffset);
            this.ctx.lineTo(unit.target.x, targetY + (unit.target.isFlying ? -25 : 0));
            this.ctx.stroke();
        }

        this.drawDotaHpBar(unit.x - 18, unit.y + yOffset - 30, 36, 5, unit.hp, unit.maxHp, colors.primary);
    },

    drawDotaHpBar(x, y, width, height, hp, maxHp, color) {
        const hpPercent = hp / maxHp;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x, y, width, height);

        let hpColor;
        if (hpPercent > 0.6) {
            hpColor = '#4cd137';
        } else if (hpPercent > 0.3) {
            hpColor = '#fbc531';
        } else {
            hpColor = '#e84118';
        }
        
        const hpGradient = this.ctx.createLinearGradient(x, y, x, y + height);
        hpGradient.addColorStop(0, hpColor);
        hpGradient.addColorStop(1, this.darkenColor(hpColor, 30));
        this.ctx.fillStyle = hpGradient;
        this.ctx.fillRect(x + 1, y + 1, (width - 2) * hpPercent, height - 2);

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);
    },

    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
    },

    addParticle(x, y, color) {
        this.particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 1,
            color
        });
    },

    updateAndDrawParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }
    }
};
