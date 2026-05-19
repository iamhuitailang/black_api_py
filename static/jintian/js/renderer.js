const Renderer = {
    ctx: null,
    canvas: null,
    
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    },
    
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    
    drawBackground() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        const skyGradient = ctx.createLinearGradient(0, 0, 0, h);
        skyGradient.addColorStop(0, '#0a0a1a');
        skyGradient.addColorStop(0.4, '#1a1a3e');
        skyGradient.addColorStop(0.7, '#2d1810');
        skyGradient.addColorStop(1, '#1a0a0a');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, w, h);
        
        this.drawStars();
        this.drawMoon();
        this.drawMountains();
        this.drawStage();
    },
    
    drawStars() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 50; i++) {
            const x = (i * 73) % this.canvas.width;
            const y = (i * 37) % (this.canvas.height * 0.4);
            const size = (i % 3) + 1;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    },
    
    drawMoon() {
        const ctx = this.ctx;
        const moonX = 750;
        const moonY = 100;
        const moonR = 40;
        
        const moonGlow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, moonR * 3);
        moonGlow.addColorStop(0, 'rgba(255, 255, 200, 0.3)');
        moonGlow.addColorStop(1, 'rgba(255, 255, 200, 0)');
        ctx.fillStyle = moonGlow;
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonR * 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffcc';
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
        ctx.fill();
    },
    
    drawMountains() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const groundY = GameConfig.GROUND_Y;
        
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(0, groundY - 80);
        ctx.lineTo(100, groundY - 150);
        ctx.lineTo(200, groundY - 100);
        ctx.lineTo(300, groundY - 180);
        ctx.lineTo(400, groundY - 120);
        ctx.lineTo(500, groundY - 200);
        ctx.lineTo(600, groundY - 140);
        ctx.lineTo(700, groundY - 160);
        ctx.lineTo(800, groundY - 130);
        ctx.lineTo(900, groundY - 170);
        ctx.lineTo(w, groundY - 110);
        ctx.lineTo(w, groundY);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#0f0f1a';
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(0, groundY - 40);
        ctx.lineTo(150, groundY - 100);
        ctx.lineTo(300, groundY - 60);
        ctx.lineTo(450, groundY - 120);
        ctx.lineTo(600, groundY - 80);
        ctx.lineTo(750, groundY - 110);
        ctx.lineTo(w, groundY - 70);
        ctx.lineTo(w, groundY);
        ctx.closePath();
        ctx.fill();
    },
    
    drawStage() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const groundY = GameConfig.GROUND_Y;
        
        const stageGradient = ctx.createLinearGradient(0, groundY, 0, this.canvas.height);
        stageGradient.addColorStop(0, '#3d2817');
        stageGradient.addColorStop(1, '#1a0f0a');
        ctx.fillStyle = stageGradient;
        ctx.fillRect(0, groundY, w, this.canvas.height - groundY);
        
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            const y = groundY + 20 + i * 20;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
        
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(0, groundY - 10, w, 10);
        
        ctx.fillStyle = '#ffd700';
        for (let i = 0; i < 10; i++) {
            const x = 50 + i * 95;
            ctx.fillRect(x, groundY - 8, 40, 6);
        }
        
        this.drawStagePillars();
    },
    
    drawStagePillars() {
        const ctx = this.ctx;
        const groundY = GameConfig.GROUND_Y;
        
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(30, groundY - 200, 25, 200);
        ctx.fillRect(this.canvas.width - 55, groundY - 200, 25, 200);
        
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(25, groundY - 210, 35, 15);
        ctx.fillRect(this.canvas.width - 60, groundY - 210, 35, 15);
        
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.moveTo(42, groundY - 210);
        ctx.lineTo(30, groundY - 250);
        ctx.lineTo(55, groundY - 250);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(this.canvas.width - 42, groundY - 210);
        ctx.lineTo(this.canvas.width - 55, groundY - 250);
        ctx.lineTo(this.canvas.width - 30, groundY - 250);
        ctx.closePath();
        ctx.fill();
    },
    
    drawCharacter(character) {
        if (!character) return;
        
        const ctx = this.ctx;
        const x = character.x;
        const y = character.y;
        const w = character.width;
        const h = character.height;
        
        ctx.save();
        
        if (character.isInvincible && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        if (character.isHurt) {
            ctx.globalAlpha = 0.7;
        }
        
        if (character.facing === -1) {
            ctx.translate(x + w, y);
            ctx.scale(-1, 1);
            ctx.translate(-x, -y);
        }
        
        this.drawCharacterBody(ctx, x, y, w, h, character);
        this.drawCharacterHead(ctx, x, y, w, character);
        this.drawCharacterLimbs(ctx, x, y, w, h, character);
        
        ctx.restore();
    },
    
    drawCharacterBody(ctx, x, y, w, h, character) {
        const bodyY = y + 35;
        const bodyH = h - 55;
        
        ctx.fillStyle = character.costumeColor;
        ctx.beginPath();
        ctx.moveTo(x + 10, bodyY);
        ctx.lineTo(x + w - 10, bodyY);
        ctx.lineTo(x + w - 5, bodyY + bodyH);
        ctx.lineTo(x + 5, bodyY + bodyH);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = character.bodyColor;
        ctx.beginPath();
        ctx.moveTo(x + 15, bodyY + 10);
        ctx.lineTo(x + w - 15, bodyY + 10);
        ctx.lineTo(x + w - 10, bodyY + bodyH - 10);
        ctx.lineTo(x + 10, bodyY + bodyH - 10);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(x + 20, bodyY + 5, w - 40, 5);
        ctx.fillRect(x + 20, bodyY + bodyH - 10, w - 40, 5);
    },
    
    drawCharacterHead(ctx, x, y, w, character) {
        const headX = x + w / 2;
        const headY = y + 20;
        const headR = 18;
        
        const faceColor = character.getCurrentFaceColor();
        
        ctx.fillStyle = faceColor;
        ctx.beginPath();
        ctx.arc(headX, headY, headR, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(headX, headY, headR, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(headX - 6, headY - 2, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(headX + 6, headY - 2, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(headX - 8, headY + 8);
        ctx.lineTo(headX + 8, headY + 8);
        ctx.stroke();
        
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.moveTo(headX - 15, headY - 12);
        ctx.lineTo(headX - 8, headY - 20);
        ctx.lineTo(headX + 8, headY - 20);
        ctx.lineTo(headX + 15, headY - 12);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(headX - 3, headY - 25, 6, 8);
    },
    
    drawCharacterLimbs(ctx, x, y, w, h, character) {
        const bodyY = y + 35;
        const bodyH = h - 55;
        
        let armOffset = 0;
        let legOffset = 0;
        
        if (character.state === 'walk') {
            armOffset = Math.sin(character.animFrame * Math.PI / 2) * 10;
            legOffset = Math.sin(character.animFrame * Math.PI / 2) * 8;
        } else if (character.state === 'punch') {
            armOffset = 25;
        } else if (character.state === 'kick') {
            legOffset = 30;
        } else if (character.state === 'ultimate') {
            armOffset = 35;
            legOffset = 10;
        } else if (character.state === 'hurt') {
            armOffset = -10;
        }
        
        ctx.fillStyle = character.costumeColor;
        ctx.fillRect(x + w - 5, bodyY + 15, 15 + armOffset, 8);
        
        ctx.fillRect(x - 10 - armOffset, bodyY + 15, 15, 8);
        
        const legY = bodyY + bodyH;
        ctx.fillRect(x + 15, legY, 10, 20 + legOffset);
        ctx.fillRect(x + w - 25, legY, 10, 20 - legOffset);
        
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x + 12, legY + 18 + legOffset, 16, 8);
        ctx.fillRect(x + w - 28, legY + 18 - legOffset, 16, 8);
    },
    
    drawAttackEffect(attacker) {
        if (!attacker.isAttacking || attacker.attackPhase !== 'active') return;
        
        const ctx = this.ctx;
        const attackRange = attacker.currentAttack.range;
        const attackX = attacker.facing === 1 
            ? attacker.x + attacker.width 
            : attacker.x - attackRange;
        const attackY = attacker.y + 30;
        const attackH = attacker.height - 60;
        
        ctx.save();
        ctx.globalAlpha = 0.6;
        
        const gradient = ctx.createLinearGradient(
            attackX, 0, 
            attackX + (attacker.facing === 1 ? attackRange : -attackRange), 0
        );
        gradient.addColorStop(0, attacker.getCurrentFaceColor());
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.shadowColor = attacker.getCurrentFaceColor();
        ctx.shadowBlur = 20;
        
        if (attacker.state === 'ultimate') {
            ctx.beginPath();
            ctx.arc(
                attacker.x + attacker.width / 2 + attacker.facing * 50,
                attacker.y + attacker.height / 2,
                60,
                0,
                Math.PI * 2
            );
            ctx.fill();
        } else {
            ctx.fillRect(attackX, attackY, attackRange, attackH);
        }
        
        ctx.restore();
    },
    
    render(game) {
        try {
            const shakeOffset = game.particleSystem ? 
                game.particleSystem.getScreenShakeOffset() : { x: 0, y: 0 };
            
            this.ctx.save();
            this.ctx.translate(shakeOffset.x, shakeOffset.y);
            
            this.clear();
            this.drawBackground();
            
            if (game.combatManager) {
                game.combatManager.render(this.ctx);
            }
            
            if (game.player) {
                this.drawCharacter(game.player);
                this.drawAttackEffect(game.player);
            }
            
            if (game.enemy) {
                this.drawCharacter(game.enemy);
                this.drawAttackEffect(game.enemy);
            }
            
            if (game.particleSystem) {
                game.particleSystem.render(this.ctx);
            }
            
            this.ctx.restore();
        } catch (e) {
            console.error('Render error:', e);
            this.ctx.restore();
            this.clear();
            this.drawBackground();
        }
    }
};
