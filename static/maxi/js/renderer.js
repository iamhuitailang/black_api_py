class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.time = 0;
    }
    
    clear() {
        const ctx = this.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.5, '#98D8C8');
        gradient.addColorStop(1, '#F7DC6F');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
    }
    
    drawBackground() {
        this.time += 0.03;
        this.drawTent();
        this.drawGround();
        this.drawAudience();
        this.drawLights();
    }
    
    drawTent() {
        const ctx = this.ctx;
        const centerX = this.width / 2;
        const tentY = 200;
        
        ctx.fillStyle = '#E67E22';
        ctx.fillRect(0, tentY + 60, this.width, 50);
        
        ctx.fillStyle = '#F39C12';
        ctx.fillRect(0, tentY + 45, this.width, 20);
        
        const stripes = 10;
        const stripeWidth = this.width / stripes;
        
        for (let i = 0; i < stripes; i++) {
            const x = i * stripeWidth;
            ctx.fillStyle = i % 2 === 0 ? '#E74C3C' : '#FFFFFF';
            ctx.beginPath();
            ctx.moveTo(x, tentY + 45);
            ctx.lineTo(centerX, 50);
            ctx.lineTo(x + stripeWidth, tentY + 45);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.fillStyle = '#F1C40F';
        ctx.beginPath();
        ctx.arc(centerX, 55, 18, 0, Math.PI * 2);
        ctx.fill();
        
        const flagWave = Math.sin(this.time * 3) * 8;
        ctx.fillStyle = '#E74C3C';
        ctx.beginPath();
        ctx.moveTo(centerX, 35);
        ctx.lineTo(centerX + 30, 25 + flagWave);
        ctx.lineTo(centerX, 15 + flagWave);
        ctx.closePath();
        ctx.fill();
    }
    
    drawGround() {
        const ctx = this.ctx;
        const groundY = GameConfig.GROUND_Y;
        
        const groundGradient = ctx.createLinearGradient(0, groundY, 0, this.height);
        groundGradient.addColorStop(0, '#F5DEB3');
        groundGradient.addColorStop(1, '#D2691E');
        ctx.fillStyle = groundGradient;
        ctx.fillRect(0, groundY + 30, this.width, this.height - groundY);
        
        const ringGradient = ctx.createRadialGradient(
            this.width / 2, groundY + 50, 0,
            this.width / 2, groundY + 50, 350
        );
        ringGradient.addColorStop(0, '#FFFAF0');
        ringGradient.addColorStop(0.7, '#FFF8DC');
        ringGradient.addColorStop(1, '#F5DEB3');
        
        ctx.fillStyle = ringGradient;
        ctx.beginPath();
        ctx.ellipse(this.width / 2, groundY + 50, 400, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#E74C3C';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.ellipse(this.width / 2, groundY + 50, 370, 35, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = '#F1C40F';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(this.width / 2, groundY + 50, 340, 30, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    drawAudience() {
        const ctx = this.ctx;
        const emojis = ['👏', '🎉', '😄', '🥳', '🤩', '🌟'];
        
        ctx.font = 'bold 26px Arial';
        ctx.textAlign = 'center';
        
        for (let i = 0; i < 12; i++) {
            const x = 80 + i * 95;
            const bounce = Math.sin(this.time * 2 + i * 0.7) * 6;
            const emoji = emojis[i % emojis.length];
            ctx.fillText(emoji, x, 290 + bounce);
        }
    }
    
    drawLights() {
        const ctx = this.ctx;
        const lights = [
            { x: 120, y: 260, color: '#FF6B6B' },
            { x: 300, y: 240, color: '#FECA57' },
            { x: 480, y: 230, color: '#48DBFB' },
            { x: 720, y: 230, color: '#FF9FF3' },
            { x: 900, y: 240, color: '#54A0FF' },
            { x: 1080, y: 260, color: '#5F27CD' }
        ];
        
        lights.forEach((light, i) => {
            const pulse = Math.sin(this.time * 3 + i) * 0.4 + 0.6;
            
            const glow = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, 30);
            glow.addColorStop(0, light.color);
            glow.addColorStop(1, 'transparent');
            
            ctx.globalAlpha = pulse * 0.5;
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(light.x, light.y, 30, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.globalAlpha = 1;
            ctx.fillStyle = light.color;
            ctx.beginPath();
            ctx.arc(light.x, light.y, 12, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(light.x - 3, light.y - 3, 4, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    drawCharacter(char) {
        const ctx = this.ctx;
        const x = char.x;
        const y = char.y;
        
        ctx.save();
        
        if (char.hitFlashTimer > 0 && Math.floor(char.hitFlashTimer * 12) % 2 === 0) {
            ctx.globalAlpha = 0.4;
        }
        
        if (char.isInvincible) {
            ctx.globalAlpha = 0.5 + Math.sin(this.time * 15) * 0.3;
        }
        
        if (!char.facingRight) {
            ctx.translate(x * 2, 0);
            ctx.scale(-1, 1);
        }
        
        this.drawCuteCharacter(char, x, y);
        
        if (char.isAttacking && char.attackPhase === 'active') {
            this.drawAttackEffect(char, x, y);
        }
        
        ctx.restore();
        
        this.drawProjectiles(char);
        this.drawNameTag(char);
    }
    
    drawCuteCharacter(char, x, y) {
        const ctx = this.ctx;
        const isCrouching = char.isCrouching;
        const isJumping = char.isJumping;
        const isAttacking = char.isAttacking;
        
        const bodyOffset = isCrouching ? 30 : 0;
        const bodyTop = y - 40 - bodyOffset;
        const bodyBottom = isCrouching ? y - 10 : y + 30;
        const headY = bodyTop - 20;
        
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(x, y + 18, 30, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const legBounce = isJumping ? -15 : (char.state === 'walk' ? Math.sin(char.animFrame * Math.PI / 2) * 8 : 0);
        
        ctx.fillStyle = '#2C3E50';
        ctx.fillRect(x - 14, y - 8 + legBounce, 10, 28);
        ctx.fillRect(x + 4, y - 8 - legBounce, 10, 28);
        
        ctx.fillStyle = '#E74C3C';
        ctx.beginPath();
        ctx.ellipse(x - 9, y + 22 + legBounce, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 9, y + 22 - legBounce, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const bodyColor = char.data.color;
        const bodyGradient = ctx.createRadialGradient(x - 8, bodyTop + 20, 0, x, bodyTop + 25, 35);
        bodyGradient.addColorStop(0, this.lightenColor(bodyColor, 30));
        bodyGradient.addColorStop(1, bodyColor);
        
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.roundRect(x - 28, bodyTop, 56, bodyBottom - bodyTop, 18);
        ctx.fill();
        
        ctx.fillStyle = this.lightenColor(bodyColor, 50);
        ctx.beginPath();
        ctx.roundRect(x - 18, bodyTop + 8, 30, 12, 6);
        ctx.fill();
        
        const armSwing = char.state === 'walk' ? Math.sin(char.animFrame * Math.PI / 2) * 12 : 0;
        
        ctx.fillStyle = '#FFEAA7';
        
        if (isAttacking) {
            const punch = char.attackPhase === 'active' ? 35 : 15;
            ctx.beginPath();
            ctx.arc(x - 32, bodyTop + 25 + armSwing, 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + 25 + punch, bodyTop + 20, 14, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(x - 32, bodyTop + 25 + armSwing, 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + 32, bodyTop + 25 - armSwing, 11, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const headGradient = ctx.createRadialGradient(x - 5, headY - 8, 0, x, headY, 28);
        headGradient.addColorStop(0, '#FFF8E7');
        headGradient.addColorStop(1, '#FFE4B5');
        
        ctx.fillStyle = headGradient;
        ctx.beginPath();
        ctx.arc(x, headY, 28, 0, Math.PI * 2);
        ctx.fill();
        
        this.drawHat(char, x, headY);
        this.drawFace(char, x, headY);
    }
    
    drawHat(char, x, headY) {
        const ctx = this.ctx;
        
        if (char.data.id === 'clown') {
            ctx.fillStyle = '#E74C3C';
            ctx.beginPath();
            ctx.moveTo(x - 22, headY - 18);
            ctx.quadraticCurveTo(x, headY - 55, x + 22, headY - 18);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(x, headY - 50, 9, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#F1C40F';
            ctx.fillRect(x - 25, headY - 20, 50, 7);
            
        } else if (char.data.id === 'tamer') {
            ctx.fillStyle = '#2C3E50';
            ctx.beginPath();
            ctx.ellipse(x, headY - 22, 28, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#2C3E50';
            ctx.beginPath();
            ctx.ellipse(x, headY - 32, 20, 15, 0, Math.PI, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#E74C3C';
            ctx.fillRect(x - 22, headY - 25, 44, 5);
            
        } else if (char.data.id === 'dancer') {
            const colors = ['#E74C3C', '#3498DB', '#2ECC71', '#9B59B6', '#F1C40F'];
            
            colors.forEach((color, i) => {
                ctx.strokeStyle = color;
                ctx.lineWidth = 4;
                ctx.lineCap = 'round';
                ctx.beginPath();
                const startX = x - 18 + i * 9;
                const wave = Math.sin(this.time * 2 + i) * 8;
                ctx.moveTo(startX, headY - 15);
                ctx.quadraticCurveTo(startX + wave, headY - 35, startX - 5, headY - 30);
                ctx.stroke();
            });
        }
    }
    
    drawFace(char, x, headY) {
        const ctx = this.ctx;
        
        ctx.fillStyle = '#2C3E50';
        ctx.beginPath();
        ctx.ellipse(x - 9, headY - 5, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 9, headY - 5, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x - 7, headY - 7, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 11, headY - 7, 2, 0, Math.PI * 2);
        ctx.fill();
        
        if (char.isAttacking) {
            ctx.fillStyle = '#E74C3C';
            ctx.beginPath();
            ctx.arc(x, headY + 12, 9, 0, Math.PI);
            ctx.fill();
        } else if (char.isStunned) {
            ctx.strokeStyle = '#E74C3C';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, headY + 10, 7, 0.1 * Math.PI, 0.9 * Math.PI);
            ctx.stroke();
        } else {
            ctx.strokeStyle = '#E74C3C';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(x, headY + 8, 8, 0.15 * Math.PI, 0.85 * Math.PI);
            ctx.stroke();
        }
        
        if (char.data.id === 'clown') {
            ctx.fillStyle = '#E74C3C';
            ctx.beginPath();
            ctx.arc(x, headY + 3, 6, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255, 150, 150, 0.5)';
            ctx.beginPath();
            ctx.ellipse(x - 20, headY + 5, 7, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x + 20, headY + 5, 7, 5, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        if (char.data.id === 'dancer') {
            ctx.fillStyle = 'rgba(255, 182, 193, 0.6)';
            ctx.beginPath();
            ctx.ellipse(x - 18, headY + 6, 6, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x + 18, headY + 6, 6, 4, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawAttackEffect(char, x, y) {
        const ctx = this.ctx;
        const move = char.currentAttack;
        if (!move) return;
        
        const range = GameConfig.ATTACK_RANGES[move.range];
        const effectX = x + range / 2;
        const effectY = y - 50;
        
        ctx.globalAlpha = 0.85;
        
        if (move.type === 'punch') {
            ctx.fillStyle = '#F39C12';
            ctx.beginPath();
            ctx.arc(effectX, effectY, 35, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.font = 'bold 35px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('💥', effectX, effectY + 12);
            
        } else if (move.type === 'kick') {
            ctx.fillStyle = '#E74C3C';
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2 + this.time * 4;
                const r = 25;
                ctx.beginPath();
                ctx.arc(
                    effectX + Math.cos(angle) * r,
                    effectY + 15 + Math.sin(angle) * r * 0.6,
                    8, 0, Math.PI * 2
                );
                ctx.fill();
            }
            
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🦵', effectX, effectY + 25);
            
        } else if (move.type === 'special') {
            const colors = ['#E74C3C', '#F39C12', '#3498DB', '#9B59B6', '#2ECC71'];
            
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2 + this.time * 3;
                const r = 30 + Math.sin(this.time * 5 + i) * 10;
                ctx.fillStyle = colors[i % colors.length];
                ctx.beginPath();
                ctx.arc(
                    effectX + Math.cos(angle) * r,
                    effectY + Math.sin(angle) * r,
                    12, 0, Math.PI * 2
                );
                ctx.fill();
            }
            
            ctx.font = 'bold 40px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('✨', effectX, effectY + 14);
            
        } else if (move.type === 'projectile') {
            ctx.font = 'bold 30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🎾', effectX, effectY);
        }
        
        ctx.globalAlpha = 1;
    }
    
    drawProjectiles(char) {
        const ctx = this.ctx;
        
        char.projectiles.forEach(proj => {
            if (!proj.active) return;
            
            const trailGradient = ctx.createLinearGradient(
                proj.x - proj.velocityX * 3, proj.y,
                proj.x, proj.y
            );
            trailGradient.addColorStop(0, 'transparent');
            trailGradient.addColorStop(1, char.data.color);
            ctx.strokeStyle = trailGradient;
            ctx.lineWidth = 10;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(proj.x - proj.velocityX * 3, proj.y);
            ctx.lineTo(proj.x, proj.y);
            ctx.stroke();
            
            const glow = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, 25);
            glow.addColorStop(0, '#F1C40F');
            glow.addColorStop(0.5, char.data.color);
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, 25, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🎾', proj.x, proj.y);
        });
    }
    
    drawNameTag(char) {
        const ctx = this.ctx;
        const tagY = char.y - 105;
        
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        
        const textWidth = 100;
        const tagX = char.x - textWidth / 2;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.roundRect(tagX, tagY - 16, textWidth, 24, 8);
        ctx.fill();
        
        ctx.fillStyle = char.isPlayer ? '#2ECC71' : '#E74C3C';
        ctx.fillText(char.data.name, char.x, tagY + 2);
    }
    
    drawUI(player1, player2, timer) {
        this.updateHealthBar('player1', player1);
        this.updateHealthBar('player2', player2);
        this.updateAtmosphereBar('player1', player1);
        this.updateAtmosphereBar('player2', player2);
        this.updateTimer(timer);
    }
    
    updateHealthBar(playerId, player) {
        const healthBar = document.getElementById(`${playerId}-health`);
        const healthText = document.getElementById(`${playerId}-health-text`);
        const percentage = (player.health / player.maxHealth) * 100;
        
        healthBar.style.width = percentage + '%';
        healthText.textContent = `${Math.ceil(player.health)}/${player.maxHealth}`;
        
        if (percentage > 60) {
            healthBar.style.background = 'linear-gradient(to right, #2ECC71, #58D68D)';
        } else if (percentage > 30) {
            healthBar.style.background = 'linear-gradient(to right, #F39C12, #F1C40F)';
        } else {
            healthBar.style.background = 'linear-gradient(to right, #E74C3C, #FF6B6B)';
        }
    }
    
    updateAtmosphereBar(playerId, player) {
        const atmosphereBar = document.getElementById(`${playerId}-atmosphere`);
        const percentage = (player.atmosphere / GameConfig.MAX_ATMOSPHERE) * 100;
        atmosphereBar.style.width = percentage + '%';
    }
    
    updateTimer(timer) {
        const timerElement = document.getElementById('timer');
        timerElement.textContent = Math.ceil(timer);
        
        if (timer <= 10) {
            timerElement.style.color = '#E74C3C';
            timerElement.style.animation = 'pulse 0.3s infinite';
        } else {
            timerElement.style.color = '#E74C3C';
            timerElement.style.animation = 'none';
        }
    }
    
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
    
    render(player1, player2, timer, deltaTime) {
        this.clear();
        this.drawBackground();
        this.drawCharacter(player2);
        this.drawCharacter(player1);
        this.drawUI(player1, player2, timer);
    }
}
