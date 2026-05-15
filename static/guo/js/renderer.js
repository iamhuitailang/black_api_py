const Renderer = {
    canvas: null,
    ctx: null,
    particles: [],
    hitEffects: [],

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    },

    resize() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;
    },

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },

    renderBackground() {
        const ctx = this.ctx;
        
        const skyGradient = ctx.createLinearGradient(0, 0, 0, CONFIG.GROUND_Y);
        skyGradient.addColorStop(0, '#1a3a5c');
        skyGradient.addColorStop(0.3, '#2d5a7b');
        skyGradient.addColorStop(0.6, '#4a7b9a');
        skyGradient.addColorStop(1, '#87CEEB');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, this.canvas.width, CONFIG.GROUND_Y);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.drawCloud(ctx, 100, 60, 60);
        this.drawCloud(ctx, 350, 100, 50);
        this.drawCloud(ctx, 600, 50, 70);
        this.drawCloud(ctx, 850, 90, 55);
        this.drawCloud(ctx, 1050, 70, 45);
        
        ctx.fillStyle = '#3d5c3d';
        ctx.beginPath();
        ctx.moveTo(0, CONFIG.GROUND_Y);
        ctx.quadraticCurveTo(200, CONFIG.GROUND_Y - 80, 400, CONFIG.GROUND_Y - 40);
        ctx.quadraticCurveTo(600, CONFIG.GROUND_Y - 100, 800, CONFIG.GROUND_Y - 60);
        ctx.quadraticCurveTo(1000, CONFIG.GROUND_Y - 90, 1200, CONFIG.GROUND_Y - 30);
        ctx.lineTo(1200, CONFIG.GROUND_Y);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#4a6b4a';
        ctx.beginPath();
        ctx.moveTo(0, CONFIG.GROUND_Y);
        ctx.quadraticCurveTo(150, CONFIG.GROUND_Y - 50, 300, CONFIG.GROUND_Y - 25);
        ctx.quadraticCurveTo(500, CONFIG.GROUND_Y - 70, 700, CONFIG.GROUND_Y - 35);
        ctx.quadraticCurveTo(900, CONFIG.GROUND_Y - 55, 1200, CONFIG.GROUND_Y - 20);
        ctx.lineTo(1200, CONFIG.GROUND_Y);
        ctx.closePath();
        ctx.fill();
        
        const groundGradient = ctx.createLinearGradient(0, CONFIG.GROUND_Y, 0, CONFIG.CANVAS_HEIGHT);
        groundGradient.addColorStop(0, '#5a7a3c');
        groundGradient.addColorStop(0.3, '#4a6a32');
        groundGradient.addColorStop(1, '#3a5a28');
        ctx.fillStyle = groundGradient;
        ctx.fillRect(0, CONFIG.GROUND_Y, this.canvas.width, this.canvas.height - CONFIG.GROUND_Y);
        
        ctx.fillStyle = 'rgba(74, 90, 44, 0.6)';
        for (let i = 0; i < 100; i++) {
            const x = (i * 47) % this.canvas.width;
            const y = CONFIG.GROUND_Y + 10 + (i * 23) % 80;
            ctx.fillRect(x, y, 3 + (i % 4) * 2, 2);
        }
        
        this.drawTree(ctx, 80, CONFIG.GROUND_Y - 20, 0.8);
        this.drawTree(ctx, 1100, CONFIG.GROUND_Y - 25, 0.9);
        this.drawTree(ctx, 50, CONFIG.GROUND_Y - 15, 0.6);
        
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)';
        ctx.lineWidth = 4;
        ctx.setLineDash([20, 10]);
        
        ctx.beginPath();
        ctx.moveTo(CONFIG.BOUNDARY_LEFT, CONFIG.GROUND_Y - 120);
        ctx.lineTo(CONFIG.BOUNDARY_LEFT, CONFIG.GROUND_Y + 30);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(CONFIG.BOUNDARY_RIGHT, CONFIG.GROUND_Y - 120);
        ctx.lineTo(CONFIG.BOUNDARY_RIGHT, CONFIG.GROUND_Y + 30);
        ctx.stroke();
        
        ctx.setLineDash([]);
        
        ctx.fillStyle = '#8B0000';
        ctx.beginPath();
        ctx.moveTo(CONFIG.BOUNDARY_LEFT, CONFIG.GROUND_Y - 120);
        ctx.lineTo(CONFIG.BOUNDARY_LEFT, CONFIG.GROUND_Y - 140);
        ctx.lineTo(CONFIG.BOUNDARY_LEFT + 25, CONFIG.GROUND_Y - 130);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(CONFIG.BOUNDARY_RIGHT, CONFIG.GROUND_Y - 120);
        ctx.lineTo(CONFIG.BOUNDARY_RIGHT, CONFIG.GROUND_Y - 140);
        ctx.lineTo(CONFIG.BOUNDARY_RIGHT - 25, CONFIG.GROUND_Y - 130);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#e67e22';
        ctx.fillRect(CONFIG.BOUNDARY_LEFT - 3, CONFIG.GROUND_Y - 140, 6, 170);
        ctx.fillRect(CONFIG.BOUNDARY_RIGHT - 3, CONFIG.GROUND_Y - 140, 6, 170);
    },

    drawCloud(ctx, x, y, size) {
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.arc(x + size * 0.4, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
        ctx.arc(x + size * 0.8, y, size * 0.45, 0, Math.PI * 2);
        ctx.arc(x + size * 0.4, y + size * 0.2, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
    },

    drawTree(ctx, x, y, scale) {
        ctx.fillStyle = '#4a3728';
        ctx.fillRect(x - 5 * scale, y, 10 * scale, 30 * scale);
        
        ctx.fillStyle = '#2d5a27';
        ctx.beginPath();
        ctx.moveTo(x, y - 40 * scale);
        ctx.lineTo(x - 25 * scale, y + 10 * scale);
        ctx.lineTo(x + 25 * scale, y + 10 * scale);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#3a6a32';
        ctx.beginPath();
        ctx.moveTo(x, y - 55 * scale);
        ctx.lineTo(x - 20 * scale, y - 10 * scale);
        ctx.lineTo(x + 20 * scale, y - 10 * scale);
        ctx.closePath();
        ctx.fill();
    },

    renderCharacter(character) {
        const ctx = this.ctx;
        const x = character.x;
        const y = character.y;
        const width = character.width;
        const height = character.height;
        
        ctx.save();
        
        if (character.invincible > 0 && Math.floor(character.invincible / 3) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        if (character.facing === -1) {
            ctx.translate(x + width, y);
            ctx.scale(-1, 1);
            ctx.translate(-x, -y);
        }
        
        const bodyHeight = character.isCrouching ? height * 0.6 : height;
        const bodyY = character.isCrouching ? y + height * 0.4 : y;
        
        const legOffset = character.state === 'walk' ? Math.sin(Date.now() / 100) * 5 : 0;
        
        this.renderBoots(ctx, x + 12, bodyY + bodyHeight - 22 + legOffset, 16, 22);
        this.renderBoots(ctx, x + width - 28, bodyY + bodyHeight - 22 - legOffset, 16, 22);
        
        this.renderPants(ctx, x + 10, bodyY + bodyHeight - 35, width - 20, 25);
        
        this.renderBody(ctx, x + 8, bodyY + 25, width - 16, bodyHeight - 45, character.type);
        
        this.renderBackpack(ctx, x + 5, bodyY + 28, 12, 35, character.type);
        
        this.renderArms(ctx, x, bodyY + 30, width, character);
        
        this.renderHead(ctx, x + width / 2, bodyY + 5, character.type);
        
        this.renderPan(character, x, y, width, height);
        
        if (character.isCharging) {
            const gradient = ctx.createRadialGradient(
                x + width / 2, y + height / 2, 0,
                x + width / 2, y + height / 2, 50 + character.chargeLevel * 30
            );
            gradient.addColorStop(0, 'rgba(255, 200, 50, 0.8)');
            gradient.addColorStop(0.5, 'rgba(255, 150, 0, 0.4)');
            gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x + width / 2, y + height / 2, 50 + character.chargeLevel * 30, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    },

    renderBoots(ctx, x, y, width, height) {
        ctx.fillStyle = '#2c1810';
        ctx.beginPath();
        ctx.moveTo(x, y + height);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x + width - 3, y + height * 0.6);
        ctx.lineTo(x + 3, y + height * 0.6);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#1a0f08';
        ctx.fillRect(x - 2, y + height - 6, width + 4, 6);
        
        ctx.fillStyle = '#3d2817';
        ctx.beginPath();
        ctx.moveTo(x + 3, y + height * 0.6);
        ctx.lineTo(x + width - 3, y + height * 0.6);
        ctx.lineTo(x + width - 6, y + 5);
        ctx.lineTo(x + 6, y + 5);
        ctx.closePath();
        ctx.fill();
    },

    renderPants(ctx, x, y, width, height) {
        ctx.fillStyle = '#4a5d23';
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 3);
        ctx.fill();
        
        ctx.fillStyle = '#3d4d1c';
        ctx.fillRect(x + 5, y + 5, 8, 10);
        ctx.fillRect(x + width - 13, y + 5, 8, 10);
        
        ctx.strokeStyle = '#2d3a14';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + width / 2, y);
        ctx.lineTo(x + width / 2, y + height);
        ctx.stroke();
    },

    renderBody(ctx, x, y, width, height, type) {
        const colors = {
            soldier: { main: '#5a6b7a', accent: '#7a8b9a' },
            girl: { main: '#d4a574', accent: '#e8c49a' },
            warrior: { main: '#2d2d2d', accent: '#4a4a4a' }
        };
        const c = colors[type] || colors.soldier;
        
        ctx.fillStyle = c.main;
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 5);
        ctx.fill();
        
        ctx.fillStyle = c.accent;
        ctx.beginPath();
        ctx.roundRect(x + 3, y + 5, width - 6, 12, 2);
        ctx.fill();
        
        ctx.fillStyle = c.main;
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(x + 8 + i * 12, y + 20, 8, 10);
        }
        
        ctx.fillStyle = '#8b0000';
        ctx.beginPath();
        ctx.roundRect(x + width / 2 - 10, y + 2, 20, 16, 3);
        ctx.fill();
        
        ctx.strokeStyle = '#5c0000';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + width / 2 - 8, y + 4, 16, 12);
    },

    renderBackpack(ctx, x, y, width, height, type) {
        const colors = {
            soldier: '#5a6b7a',
            girl: '#c4956a',
            warrior: '#1a1a1a'
        };
        const color = colors[type] || colors.soldier;
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 3);
        ctx.fill();
        
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(x + 2, y + 5, width - 4, 3);
        ctx.fillRect(x + 2, y + height - 8, width - 4, 3);
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + width / 2, y + 10);
        ctx.lineTo(x + width / 2, y + height - 10);
        ctx.stroke();
    },

    renderArms(ctx, x, bodyY, width, character) {
        const armColor = character.type === 'soldier' ? '#5a6b7a' :
                        character.type === 'girl' ? '#d4a574' : '#2d2d2d';
        
        const attackProgress = character.state === 'attack' ? 
            Math.sin(character.attackFrame / Math.floor(30 / character.attackSpeed) * Math.PI) : 0;
        
        const armAngle = character.state === 'attack' ? -0.5 + attackProgress * 1.2 : 0;
        const armY = bodyY + 15;
        
        ctx.save();
        ctx.translate(x + width - 5, armY);
        ctx.rotate(armAngle);
        
        ctx.fillStyle = armColor;
        ctx.beginPath();
        ctx.roundRect(0, -5, 25, 12, 3);
        ctx.fill();
        
        ctx.fillStyle = '#e8beac';
        ctx.beginPath();
        ctx.arc(25, 1, 7, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        ctx.fillStyle = armColor;
        ctx.beginPath();
        ctx.roundRect(x - 5, armY - 5, 25, 12, 3);
        ctx.fill();
        
        ctx.fillStyle = '#e8beac';
        ctx.beginPath();
        ctx.arc(x - 5, armY + 1, 7, 0, Math.PI * 2);
        ctx.fill();
    },

    renderHead(ctx, x, y, type) {
        const faceColor = '#e8beac';
        
        ctx.fillStyle = faceColor;
        ctx.beginPath();
        ctx.arc(x, y + 10, 14, 0, Math.PI * 2);
        ctx.fill();
        
        if (type === 'soldier') {
            ctx.fillStyle = '#1a472a';
            ctx.beginPath();
            ctx.arc(x, y + 5, 16, Math.PI, 0);
            ctx.fill();
            
            ctx.fillStyle = '#0d2818';
            ctx.beginPath();
            ctx.ellipse(x, y + 2, 14, 8, 0, Math.PI, 0);
            ctx.fill();
            
            ctx.fillStyle = '#2d5a3a';
            ctx.fillRect(x - 8, y - 5, 16, 5);
            
            ctx.strokeStyle = '#3d7a4a';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x - 6, y - 3);
            ctx.lineTo(x - 6, y + 2);
            ctx.moveTo(x + 6, y - 3);
            ctx.lineTo(x + 6, y + 2);
            ctx.stroke();
        } else if (type === 'girl') {
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.arc(x, y + 2, 15, Math.PI, 0);
            ctx.fill();
            
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.moveTo(x - 14, y + 5);
            ctx.quadraticCurveTo(x - 18, y + 20, x - 12, y + 25);
            ctx.lineTo(x - 8, y + 18);
            ctx.closePath();
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(x + 14, y + 5);
            ctx.quadraticCurveTo(x + 18, y + 20, x + 12, y + 25);
            ctx.lineTo(x + 8, y + 18);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = '#ff69b4';
            ctx.beginPath();
            ctx.arc(x + 10, y - 2, 5, 0, Math.PI * 2);
            ctx.fill();
        } else if (type === 'warrior') {
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(x - 14, y - 2, 28, 20);
            
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.ellipse(x - 5, y + 6, 4, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x + 5, y + 6, 4, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ff0000';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 5;
            ctx.beginPath();
            ctx.ellipse(x - 5, y + 6, 2, 1.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x + 5, y + 6, 2, 1.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            ctx.fillStyle = '#2a2a2a';
            ctx.beginPath();
            ctx.arc(x, y - 5, 10, Math.PI, 0);
            ctx.fill();
        }
        
        if (type !== 'warrior') {
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(x - 5, y + 8, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + 5, y + 8, 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#c4956a';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(x, y + 13, 4, 0.1 * Math.PI, 0.9 * Math.PI);
            ctx.stroke();
        }
    },

    renderPan(character, x, y, width, height) {
        const ctx = this.ctx;
        
        const attackProgress = character.state === 'attack' ? 
            Math.sin(character.attackFrame / Math.floor(30 / character.attackSpeed) * Math.PI) : 0;
        
        let panAngle = 0.2;
        if (character.state === 'attack') {
            panAngle = -0.8 + attackProgress * 1.8;
        }
        if (character.specialActive) {
            panAngle = character.panRotation;
        }
        
        const panX = x + width + 15;
        const panY = y + (character.isCrouching ? 50 : 35);
        
        ctx.save();
        ctx.translate(panX, panY);
        ctx.rotate(panAngle);
        
        ctx.fillStyle = '#4a3728';
        ctx.beginPath();
        ctx.roundRect(-5, -6, 35, 12, 3);
        ctx.fill();
        
        ctx.fillStyle = '#5a4738';
        ctx.beginPath();
        ctx.roundRect(-3, -4, 31, 8, 2);
        ctx.fill();
        
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.ellipse(38, 0, 30, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath();
        ctx.ellipse(38, 0, 26, 21, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#3a3a3a';
        ctx.beginPath();
        ctx.ellipse(38, -2, 22, 17, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#f39c12';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(38, 0, 30, 25, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(38, 0, 22, 17, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        if (character.specialActive) {
            const gradient = ctx.createRadialGradient(38, 0, 0, 38, 0, 60);
            gradient.addColorStop(0, 'rgba(255, 215, 0, 0.9)');
            gradient.addColorStop(0.5, 'rgba(255, 140, 0, 0.5)');
            gradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(38, 0, 60, 0, Math.PI * 2);
            ctx.fill();
            
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2 + Date.now() / 200;
                ctx.strokeStyle = 'rgba(255, 200, 0, 0.8)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(38 + Math.cos(angle) * 25, Math.sin(angle) * 20);
                ctx.lineTo(38 + Math.cos(angle) * 55, Math.sin(angle) * 45);
                ctx.stroke();
            }
        }
        
        ctx.restore();
    },

    addHitEffect(x, y, type) {
        const colors = {
            light: '#f39c12',
            heavy: '#e74c3c',
            special: '#9b59b6'
        };
        
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 30,
                maxLife: 30,
                color: colors[type] || '#fff',
                size: 5 + Math.random() * 5
            });
        }
        
        this.hitEffects.push({
            x: x,
            y: y,
            life: 20,
            maxLife: 20,
            radius: 10,
            color: colors[type] || '#fff'
        });
    },

    updateEffects() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.3;
            p.life--;
            return p.life > 0;
        });
        
        this.hitEffects = this.hitEffects.filter(e => {
            e.life--;
            e.radius += 3;
            return e.life > 0;
        });
    },

    renderEffects() {
        const ctx = this.ctx;
        
        this.hitEffects.forEach(e => {
            ctx.globalAlpha = e.life / e.maxLife;
            ctx.strokeStyle = e.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
            ctx.stroke();
        });
        
        this.particles.forEach(p => {
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.globalAlpha = 1;
    },

    renderGame(player, enemy) {
        this.clear();
        this.renderBackground();
        this.renderCharacter(player);
        this.renderCharacter(enemy);
        this.renderEffects();
        
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(255, 200, 50, 0.9)';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('👆 点击游戏区域以获得键盘焦点', 20, 25);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '14px Arial';
        ctx.fillText('← → 移动 | ↑ 跳跃 | ↓ 下蹲 | J 攻击 | K 蓄力攻击', 20, 50);
    }
};