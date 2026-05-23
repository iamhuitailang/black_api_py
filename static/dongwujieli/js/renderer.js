const Renderer = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    cameraY: 0,
    particles: [],
    effects: [],

    init() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    },

    resize() {
        const container = document.getElementById('game-container');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    },

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    },

    updateCamera(characterSystem) {
        const char = characterSystem.getCurrent();
        if (!char) return;

        const targetY = char.y - this.height / 2;
        this.cameraY += (targetY - this.cameraY) * 0.1;
        this.cameraY = Math.max(0, Math.min(GameConfig.GAME.TRACK_LENGTH - this.height, this.cameraY));
    },

    render(levelConfig, characterSystem, obstacleSystem, itemSystem, gameState) {
        this.clear();

        this.drawBackground(levelConfig);
        this.drawTrack(levelConfig);
        this.drawObstacles(obstacleSystem);
        this.drawRelayPoints(obstacleSystem);
        this.drawItems(itemSystem);
        this.drawCharacters(characterSystem);
        this.drawParticles();
        this.drawEffects();
        this.drawHUD(gameState, characterSystem, itemSystem);
    },

    drawBackground(levelConfig) {
        const ctx = this.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);

        switch (levelConfig.id) {
            case 1:
                gradient.addColorStop(0, '#F4E4C1');
                gradient.addColorStop(1, '#D4B896');
                break;
            case 2:
                gradient.addColorStop(0, '#C9D6DF');
                gradient.addColorStop(1, '#8B9AAB');
                break;
            case 3:
                gradient.addColorStop(0, '#D4C8BE');
                gradient.addColorStop(1, '#A09080');
                break;
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);

        this.drawDecorations(levelConfig);
    },

    drawDecorations(levelConfig) {
        const ctx = this.ctx;
        const offset = this.cameraY * 0.3;

        ctx.globalAlpha = 0.1;

        for (let i = 0; i < 10; i++) {
            const y = (i * 200 - offset % 200) + 100;
            if (y < -50 || y > this.height + 50) continue;

            ctx.fillStyle = levelConfig.accentColor;
            ctx.beginPath();

            if (levelConfig.id === 1) {
                ctx.ellipse(100 + i * 80, y, 80, 30, 0, 0, Math.PI * 2);
            } else if (levelConfig.id === 2) {
                ctx.moveTo(50 + i * 100, y);
                ctx.lineTo(100 + i * 100, y - 80);
                ctx.lineTo(150 + i * 100, y);
            } else {
                ctx.moveTo(80 + i * 90, y);
                ctx.lineTo(100 + i * 90, y - 60);
                ctx.lineTo(120 + i * 90, y);
            }

            ctx.fill();
        }

        ctx.globalAlpha = 1;
    },

    drawTrack(levelConfig) {
        const ctx = this.ctx;
        const trackWidth = GameConfig.CANVAS.TRACK_WIDTH;
        const trackX = (this.width - trackWidth) / 2;

        ctx.fillStyle = levelConfig.trackColor;
        ctx.fillRect(trackX, 0, trackWidth, this.height);

        ctx.strokeStyle = levelConfig.accentColor;
        ctx.lineWidth = 3;
        ctx.setLineDash([20, 10]);

        const lineOffset = (this.cameraY % 60);
        for (let y = -lineOffset; y < this.height; y += 60) {
            ctx.beginPath();
            ctx.moveTo(trackX + trackWidth / 2 - 10, y);
            ctx.lineTo(trackX + trackWidth / 2 + 10, y);
            ctx.stroke();
        }

        ctx.setLineDash([]);

        ctx.strokeStyle = levelConfig.obstacleColor;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(trackX, 0);
        ctx.lineTo(trackX, this.height);
        ctx.moveTo(trackX + trackWidth, 0);
        ctx.lineTo(trackX + trackWidth, this.height);
        ctx.stroke();

        const finishY = GameConfig.GAME.FINISH_LINE - this.cameraY;
        if (finishY > -50 && finishY < this.height + 50) {
            this.drawFinishLine(trackX, trackWidth, finishY);
        }
    },

    drawFinishLine(x, width, y) {
        const ctx = this.ctx;
        const squareSize = 20;
        const numSquares = Math.floor(width / squareSize);

        for (let i = 0; i < numSquares; i++) {
            for (let j = 0; j < 2; j++) {
                ctx.fillStyle = (i + j) % 2 === 0 ? '#FFF' : '#000';
                ctx.fillRect(x + i * squareSize, y - squareSize + j * squareSize, squareSize, squareSize);
            }
        }

        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏁 终点 🏁', x + width / 2, y - 35);
    },

    worldToScreen(x, y) {
        const trackWidth = GameConfig.CANVAS.TRACK_WIDTH;
        const trackX = (this.width - trackWidth) / 2;
        return {
            x: trackX + x,
            y: y - this.cameraY
        };
    },

    drawObstacles(obstacleSystem) {
        const ctx = this.ctx;
        const obstacles = obstacleSystem.getObstaclesInView(this.cameraY, this.height);

        obstacles.forEach(obs => {
            const pos = this.worldToScreen(obs.x, obs.y);
            if (pos.y < -100 || pos.y > this.height + 100) return;

            const config = obs.config;

            if (config.type === 'hidden' && !obs.revealed) {
                return;
            }

            ctx.save();
            ctx.translate(pos.x, pos.y);

            if (config.type === 'static') {
                this.drawStaticObstacle(config);
            } else if (config.type === 'dynamic_slow' || config.type === 'dynamic_fast') {
                this.drawDynamicObstacle(config, obs);
            } else if (config.type === 'hidden') {
                this.drawHiddenTrap(config, obs);
            }

            ctx.restore();
        });
    },

    drawStaticObstacle(config) {
        const ctx = this.ctx;
        const size = config.size;

        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;

        ctx.fillStyle = config.color;

        switch (config.id) {
            case 'rock':
                ctx.beginPath();
                ctx.moveTo(-size / 2, size / 3);
                ctx.lineTo(-size / 3, -size / 2);
                ctx.lineTo(size / 4, -size / 2);
                ctx.lineTo(size / 2, size / 4);
                ctx.lineTo(size / 3, size / 2);
                ctx.lineTo(-size / 3, size / 2);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.2)';
                ctx.beginPath();
                ctx.ellipse(-size / 6, -size / 4, size / 4, size / 6, -0.3, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'tree':
                ctx.fillStyle = '#5D4037';
                ctx.fillRect(-size / 8, 0, size / 4, size / 2);
                ctx.fillStyle = config.color;
                ctx.beginPath();
                ctx.arc(0, -size / 4, size / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.beginPath();
                ctx.arc(-size / 6, -size / 3, size / 4, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'pit':
                ctx.fillStyle = '#1A1A1A';
                ctx.beginPath();
                ctx.ellipse(0, 0, size / 2, size / 3, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#333';
                ctx.beginPath();
                ctx.ellipse(0, -size / 8, size / 2.5, size / 4, 0, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'bridge_broken':
                ctx.fillStyle = '#5D4037';
                ctx.fillRect(-size / 2, -size / 6, size, size / 3);
                ctx.fillStyle = '#8D6E63';
                for (let i = -2; i <= 2; i++) {
                    ctx.fillRect(i * size / 5 - 2, -size / 6, 4, size / 3);
                }
                break;
        }

        ctx.shadowColor = 'transparent';
    },

    drawDynamicObstacle(config, obs) {
        const ctx = this.ctx;
        const size = config.size;

        if (config.id === 'moving_ball') {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
            ctx.shadowBlur = 15;
            ctx.shadowOffsetY = 3;

            const rotation = obs.timer * 0.005 * obs.direction;
            ctx.rotate(rotation);

            ctx.fillStyle = config.color;
            ctx.beginPath();
            ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-size / 3, 0);
            ctx.lineTo(size / 3, 0);
            ctx.moveTo(0, -size / 3);
            ctx.lineTo(0, size / 3);
            ctx.stroke();
        } else if (config.id === 'fast_saw') {
            const rotation = obs.timer * 0.01;
            ctx.rotate(rotation);

            ctx.fillStyle = config.color;
            const teeth = 8;
            ctx.beginPath();
            for (let i = 0; i < teeth * 2; i++) {
                const angle = (i / (teeth * 2)) * Math.PI * 2;
                const r = i % 2 === 0 ? size / 2 : size / 3;
                const x = Math.cos(angle) * r;
                const y = Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(0, 0, size / 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.shadowColor = 'transparent';
    },

    drawHiddenTrap(config, obs) {
        const ctx = this.ctx;
        const size = config.size;

        if (obs.revealed) {
            ctx.globalAlpha = 0.8 + Math.sin(Date.now() * 0.01) * 0.2;
            ctx.fillStyle = config.color;

            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
                const x = Math.cos(angle) * size / 2;
                const y = Math.sin(angle) * size / 2;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('!', 0, 0);

            ctx.globalAlpha = 1;
        }
    },

    drawRelayPoints(obstacleSystem) {
        const ctx = this.ctx;
        const points = obstacleSystem.getRelayPointsInView(this.cameraY, this.height);

        points.forEach(point => {
            const pos = this.worldToScreen(point.x, point.y);

            const pulse = Math.sin(point.pulsePhase) * 0.2 + 0.8;
            const radius = point.radius * pulse;

            if (point.activated) {
                ctx.strokeStyle = 'rgba(100, 200, 100, 0.5)';
            } else {
                ctx.strokeStyle = 'rgba(255, 200, 100, 0.8)';
            }
            ctx.lineWidth = 4;
            ctx.setLineDash([10, 5]);
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius);
            if (point.activated) {
                gradient.addColorStop(0, 'rgba(100, 200, 100, 0.3)');
                gradient.addColorStop(1, 'rgba(100, 200, 100, 0)');
            } else {
                gradient.addColorStop(0, 'rgba(255, 200, 100, 0.3)');
                gradient.addColorStop(1, 'rgba(255, 200, 100, 0)');
            }
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = point.activated ? '#4CAF50' : '#FFC864';
            ctx.font = 'bold 20px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(point.activated ? '✓' : '🔄', pos.x, pos.y);
        });
    },

    drawItems(itemSystem) {
        const ctx = this.ctx;
        const items = itemSystem.getItemsInView(this.cameraY, this.height);

        items.forEach(item => {
            const pos = this.worldToScreen(item.x, item.y);

            const bob = Math.sin(Date.now() * 0.003 + item.bobOffset) * 5;

            ctx.shadowColor = item.config.color;
            ctx.shadowBlur = 15;

            ctx.fillStyle = item.config.color;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y + bob, 15, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = '20px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.config.emoji, pos.x, pos.y + bob);

            ctx.shadowColor = 'transparent';
        });
    },

    drawCharacters(characterSystem) {
        const ctx = this.ctx;
        const characters = characterSystem.getAll();

        characters.forEach((char, index) => {
            if (char.finished && index !== characterSystem.currentIndex) return;

            const pos = this.worldToScreen(char.x, char.y);

            if (pos.y < -100 || pos.y > this.height + 100) return;

            ctx.save();
            ctx.translate(pos.x, pos.y);

            if (char.active) {
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, char.size);
                gradient.addColorStop(0, 'rgba(255, 200, 100, 0.5)');
                gradient.addColorStop(1, 'rgba(255, 200, 100, 0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(0, 0, char.size * 1.2, 0, Math.PI * 2);
                ctx.fill();
            }

            const bounceOffset = char.animation.bouncing
                ? Math.sin(char.animation.frame * Math.PI / 2) * 3
                : 0;

            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetY = 5;

            this.drawCharacterBody(char, bounceOffset);

            if (char.active) {
                this.drawCharacterEffects(char, characterSystem);
            }

            ctx.font = `${char.size}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(char.emoji, 0, bounceOffset);

            ctx.shadowColor = 'transparent';
            ctx.restore();
        });
    },

    drawCharacterBody(char, bounceOffset) {
        const ctx = this.ctx;

        ctx.fillStyle = char.color;
        ctx.beginPath();
        ctx.ellipse(0, bounceOffset, char.size / 2, char.size / 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        if (char.stamina < char.maxStamina * 0.3) {
            ctx.fillStyle = '#FF5722';
            ctx.beginPath();
            ctx.arc(char.size / 3, -char.size / 2 + bounceOffset, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#FF5722';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(char.size / 3, -char.size / 2 - 8 + bounceOffset);
            ctx.lineTo(char.size / 3, -char.size / 2 - 15 + bounceOffset);
            ctx.stroke();
        }
    },

    drawCharacterEffects(char, characterSystem) {
        const ctx = this.ctx;
        const effects = characterSystem.getEffects();

        effects.forEach(effect => {
            if (effect.type === 'shield') {
                ctx.strokeStyle = 'rgba(33, 150, 243, 0.8)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, char.size * 0.8, 0, Math.PI * 2);
                ctx.stroke();
            }
            if (effect.type === 'speedMultiplier' && effect.value > 1) {
                for (let i = 0; i < 3; i++) {
                    ctx.fillStyle = `rgba(0, 188, 212, ${0.3 - i * 0.1})`;
                    ctx.beginPath();
                    ctx.ellipse(-10 - i * 8, 5, 15, 8, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            if (effect.type === 'magnetRange') {
                ctx.strokeStyle = 'rgba(233, 30, 99, 0.5)';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.arc(0, 0, effect.value / 3, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        });
    },

    drawParticles() {
        const ctx = this.ctx;

        this.particles = this.particles.filter(p => {
            p.life -= 16;
            if (p.life <= 0) return false;

            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;

            const alpha = p.life / p.maxLife;
            const pos = this.worldToScreen(p.x, p.y);

            ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, p.size * alpha, 0, Math.PI * 2);
            ctx.fill();

            return true;
        });
    },

    drawEffects() {
        const ctx = this.ctx;

        this.effects = this.effects.filter(e => {
            e.life -= 16;
            if (e.life <= 0) return false;

            const alpha = e.life / e.maxLife;
            const pos = this.worldToScreen(e.x, e.y);

            ctx.globalAlpha = alpha;
            ctx.font = `${e.size}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(e.text, pos.x, pos.y);
            ctx.globalAlpha = 1;

            e.y += e.vy;

            return true;
        });
    },

    drawHUD(gameState, characterSystem, itemSystem) {
        document.getElementById('hud-level').textContent = gameState.level;
        document.getElementById('hud-time').textContent = this.formatTime(gameState.elapsedTime);
        document.getElementById('hud-score').textContent = gameState.score;

        this.updateTeamDisplay(characterSystem);
        this.updateStaminaBar(characterSystem);
        this.updateItemSlot(itemSystem);
    },

    updateTeamDisplay(characterSystem) {
        const container = document.getElementById('team-display');
        const characters = characterSystem.getAll();
        const currentIndex = characterSystem.currentIndex;

        container.innerHTML = characters.map((char, i) => {
            let classes = 'team-member';
            if (i === currentIndex) classes += ' active';
            if (char.finished) classes += ' finished';
            return `<div class="${classes}">${char.emoji}</div>`;
        }).join('');
    },

    updateStaminaBar(characterSystem) {
        const fill = document.getElementById('stamina-fill');
        const percent = characterSystem.getStaminaPercent();

        fill.style.width = `${percent}%`;

        fill.classList.remove('low', 'critical');
        if (percent < 30) {
            fill.classList.add('critical');
        } else if (percent < 60) {
            fill.classList.add('low');
        }
    },

    updateItemSlot(itemSystem) {
        const itemIcon = document.getElementById('current-item');
        const heldItem = itemSystem.getHeldItem();

        itemIcon.textContent = heldItem ? heldItem.config.emoji : '📦';
    },

    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    },

    addParticles(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 2,
                size: 3 + Math.random() * 4,
                color,
                life: 500 + Math.random() * 500,
                maxLife: 1000
            });
        }
    },

    addFloatingText(x, y, text, size = 24, color = '#FFF') {
        this.effects.push({
            x,
            y,
            text,
            size,
            color,
            vy: -1,
            life: 1500,
            maxLife: 1500
        });
    }
};