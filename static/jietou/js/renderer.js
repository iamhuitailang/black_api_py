class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.groundY = 600;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#FF6B35');
        gradient.addColorStop(0.25, '#FF8C42');
        gradient.addColorStop(0.5, '#FFD93D');
        gradient.addColorStop(0.75, '#87CEEB');
        gradient.addColorStop(1, '#98D8C8');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.drawSun(1100, 80, 70);
        this.drawCloud(80, 100, 60);
        this.drawCloud(500, 60, 80);
        this.drawCloud(900, 140, 55);

        this.drawCityBackground();

        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, this.groundY, this.width, this.height - this.groundY);

        this.ctx.strokeStyle = '#A0522D';
        this.ctx.lineWidth = 3;
        for (let i = 0; i < this.width; i += 80) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, this.groundY);
            this.ctx.lineTo(i + 40, this.groundY + 20);
            this.ctx.stroke();
        }

        this.ctx.fillStyle = '#D2691E';
        this.ctx.fillRect(0, this.groundY, this.width, 10);
    }

    drawSun(x, y, radius) {
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius * 2.5);
        gradient.addColorStop(0, 'rgba(255, 255, 220, 1)');
        gradient.addColorStop(0.3, 'rgba(255, 220, 100, 0.9)');
        gradient.addColorStop(0.6, 'rgba(255, 150, 50, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius * 2.5, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#FFE066';
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#FFA500';
        this.ctx.lineWidth = 5;
        this.ctx.stroke();

        this.ctx.fillStyle = '#FFF';
        this.ctx.beginPath();
        this.ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.25, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawCloud(x, y, size) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.45, y - size * 0.25, size * 0.45, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.9, y, size * 0.5, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.45, y + size * 0.15, size * 0.35, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = 'rgba(150, 150, 200, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    drawCityBackground() {
        this.ctx.fillStyle = '#2D3436';
        this.drawBuilding(50, this.groundY - 150, 80, 150);
        this.drawBuilding(150, this.groundY - 200, 100, 200);
        this.drawBuilding(280, this.groundY - 120, 70, 120);
        this.drawBuilding(400, this.groundY - 180, 90, 180);
        this.drawBuilding(550, this.groundY - 140, 85, 140);
        this.drawBuilding(700, this.groundY - 190, 95, 190);
        this.drawBuilding(850, this.groundY - 130, 75, 130);
        this.drawBuilding(970, this.groundY - 170, 88, 170);
        this.drawBuilding(1100, this.groundY - 155, 82, 155);
    }

    drawBuilding(x, y, width, height) {
        this.ctx.fillRect(x, y, width, height);
        
        this.ctx.fillStyle = '#FFEAA7';
        const windowSize = 8;
        const windowGap = 15;
        for (let wy = y + 15; wy < y + height - 15; wy += windowGap) {
            for (let wx = x + 10; wx < x + width - 10; wx += windowGap) {
                if (Math.random() > 0.3) {
                    this.ctx.fillRect(wx, wy, windowSize, windowSize);
                }
            }
        }
    }

    drawCharacter(character) {
        const { x, y, width, height, color, secondaryColor, facingRight, state, invincible, 
                currentAttack, attackPhase, attackTimer, animationFrame, id } = character;

        this.ctx.save();

        if (invincible && Math.floor(Date.now() / 50) % 2 === 0) {
            this.ctx.globalAlpha = 0.6;
        }

        if (!facingRight) {
            this.ctx.translate(x + width, 0);
            this.ctx.scale(-1, 1);
            this.ctx.translate(-x, 0);
        }

        const isCrouching = state === GameData.states.CROUCH;
        const isJumping = state === GameData.states.JUMP;
        const isAttacking = state === GameData.states.ATTACK || state === GameData.states.SPECIAL;
        const isHit = state === GameData.states.HIT || state === GameData.states.KNOCKDOWN;

        const actualHeight = isCrouching ? height * 0.75 : height;
        const actualY = isCrouching ? y + height * 0.25 : y;

        if (id === 'ryu') {
            this.drawRyu(x, actualY, width, actualHeight, color, secondaryColor, state, 
                        currentAttack, attackPhase, attackTimer, animationFrame, facingRight);
        } else if (id === 'ken') {
            this.drawKen(x, actualY, width, actualHeight, color, secondaryColor, state,
                        currentAttack, attackPhase, attackTimer, animationFrame, facingRight);
        } else if (id === 'chunli') {
            this.drawChunLi(x, actualY, width, actualHeight, color, secondaryColor, state,
                           currentAttack, attackPhase, attackTimer, animationFrame, facingRight);
        }

        this.ctx.restore();

        character.projectiles.forEach(projectile => {
            this.drawProjectile(projectile, id);
        });

        if (character.hitEffect) {
            this.drawHitEffect(character.hitEffect);
        }
    }

    drawRyu(x, y, width, height, color, secondaryColor, state, attack, phase, timer, frame, facingRight) {
        const isAttacking = state === GameData.states.ATTACK || state === GameData.states.SPECIAL;
        const isPunch = attack && (attack.includes('Punch') || attack === 'hadouken' || attack === 'shoryuken');
        const isCrouching = state === GameData.states.CROUCH;
        const isHit = state === GameData.states.HIT || state === GameData.states.KNOCKDOWN;

        const headSize = width * 0.42;
        const headX = x + width / 2;
        const headY = y + headSize * 0.7;

        const legOffset = isCrouching ? -10 : 0;
        const legWidth = width * 0.24;
        const legHeight = height * 0.4 + legOffset;
        const legY = y + height * 0.6 - legOffset;

        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;

        this.ctx.beginPath();
        this.ctx.moveTo(x + width * 0.22, legY);
        this.ctx.lineTo(x + width * 0.18, legY + legHeight);
        this.ctx.lineTo(x + width * 0.32, legY + legHeight);
        this.ctx.lineTo(x + width * 0.30, legY);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(x + width * 0.55, legY);
        this.ctx.lineTo(x + width * 0.58, legY + legHeight);
        this.ctx.lineTo(x + width * 0.72, legY + legHeight);
        this.ctx.lineTo(x + width * 0.70, legY);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = '#FF6B6B';
        this.ctx.fillRect(x + width * 0.15, legY + legHeight - 15, legWidth + 5, 15);
        this.ctx.fillRect(x + width * 0.55, legY + legHeight - 15, legWidth + 5, 15);

        const bodyY = headY + headSize * 0.65;
        const bodyHeight = height * 0.38;
        
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(headX - width * 0.35, bodyY);
        this.ctx.lineTo(headX + width * 0.35, bodyY);
        this.ctx.lineTo(headX + width * 0.30, bodyY + bodyHeight);
        this.ctx.lineTo(headX - width * 0.30, bodyY + bodyHeight);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = secondaryColor;
        this.ctx.fillRect(headX - width * 0.25, bodyY + 10, width * 0.5, 14);
        this.ctx.strokeRect(headX - width * 0.25, bodyY + 10, width * 0.5, 14);

        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(headX - width * 0.30, bodyY);
        this.ctx.lineTo(headX - width * 0.35, bodyY - 20);
        this.ctx.lineTo(headX + width * 0.35, bodyY - 20);
        this.ctx.lineTo(headX + width * 0.30, bodyY);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        this.drawArms(x, y, width, height, state, attack, phase, timer, '#FFE4C4', color);

        this.ctx.fillStyle = '#FFE4C4';
        this.ctx.beginPath();
        this.ctx.arc(headX, headY, headSize, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = '#FFF';
        this.ctx.beginPath();
        this.ctx.moveTo(headX - headSize * 0.6, headY - headSize * 0.15);
        this.ctx.lineTo(headX - headSize * 0.35, headY - headSize * 0.35);
        this.ctx.lineTo(headX, headY - headSize * 0.2);
        this.ctx.lineTo(headX + headSize * 0.35, headY - headSize * 0.35);
        this.ctx.lineTo(headX + headSize * 0.6, headY - headSize * 0.15);
        this.ctx.lineTo(headX, headY + headSize * 0.15);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.strokeStyle = '#CCC';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(headX, headY - headSize * 0.5, headSize * 0.12, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#FFA500';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.fillStyle = '#000';
        const eyeOffset = isHit ? -3 : 0;
        this.ctx.beginPath();
        this.ctx.ellipse(headX - headSize * 0.25, headY + eyeOffset + 2, 4, 5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(headX + headSize * 0.15, headY + eyeOffset + 2, 4, 5, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#FFF';
        this.ctx.beginPath();
        this.ctx.arc(headX - headSize * 0.23, headY + 1, 1.5, 0, Math.PI * 2);
        this.ctx.arc(headX + headSize * 0.17, headY + 1, 1.5, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(headX - headSize * 0.38, headY - 8);
        this.ctx.lineTo(headX - headSize * 0.12, headY - 5);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(headX + headSize * 0.08, headY - 5);
        this.ctx.lineTo(headX + headSize * 0.33, headY - 8);
        this.ctx.stroke();

        if (!isHit) {
            this.ctx.strokeStyle = '#8B4513';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(headX, headY + headSize * 0.35, 5, 0, Math.PI);
            this.ctx.stroke();
        } else {
            this.ctx.fillStyle = '#000';
            this.ctx.beginPath();
            this.ctx.arc(headX, headY + headSize * 0.3, 6, 0, Math.PI * 2);
            this.ctx.fill();
        }

        if (attack === 'shoryuken' && phase === 'active') {
            this.drawPowerAura(x + width / 2, y + height / 2, 80);
        }
    }

    drawKen(x, y, width, height, color, secondaryColor, state, attack, phase, timer, frame, facingRight) {
        const isAttacking = state === GameData.states.ATTACK || state === GameData.states.SPECIAL;
        const isPunch = attack && (attack.includes('Punch') || attack === 'hadouken' || attack === 'shoryuken');
        const isCrouching = state === GameData.states.CROUCH;
        const isHit = state === GameData.states.HIT || state === GameData.states.KNOCKDOWN;

        const headSize = width * 0.42;
        const headX = x + width / 2;
        const headY = y + headSize * 0.7;

        const legOffset = isCrouching ? -10 : 0;
        const legWidth = width * 0.24;
        const legHeight = height * 0.4 + legOffset;
        const legY = y + height * 0.6 - legOffset;

        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;

        this.ctx.beginPath();
        this.ctx.moveTo(x + width * 0.22, legY);
        this.ctx.lineTo(x + width * 0.18, legY + legHeight);
        this.ctx.lineTo(x + width * 0.32, legY + legHeight);
        this.ctx.lineTo(x + width * 0.30, legY);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(x + width * 0.55, legY);
        this.ctx.lineTo(x + width * 0.58, legY + legHeight);
        this.ctx.lineTo(x + width * 0.72, legY + legHeight);
        this.ctx.lineTo(x + width * 0.70, legY);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = '#FF4500';
        this.ctx.fillRect(x + width * 0.15, legY + legHeight - 15, legWidth + 5, 15);
        this.ctx.fillRect(x + width * 0.55, legY + legHeight - 15, legWidth + 5, 15);

        const bodyY = headY + headSize * 0.65;
        const bodyHeight = height * 0.38;
        
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(headX - width * 0.35, bodyY);
        this.ctx.lineTo(headX + width * 0.35, bodyY);
        this.ctx.lineTo(headX + width * 0.30, bodyY + bodyHeight);
        this.ctx.lineTo(headX - width * 0.30, bodyY + bodyHeight);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = secondaryColor;
        this.ctx.fillRect(headX - width * 0.25, bodyY + 10, width * 0.5, 14);
        this.ctx.strokeRect(headX - width * 0.25, bodyY + 10, width * 0.5, 14);

        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(headX - width * 0.30, bodyY);
        this.ctx.lineTo(headX - width * 0.35, bodyY - 20);
        this.ctx.lineTo(headX + width * 0.35, bodyY - 20);
        this.ctx.lineTo(headX + width * 0.30, bodyY);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        this.drawArms(x, y, width, height, state, attack, phase, timer, '#FFE4C4', color);

        this.ctx.fillStyle = '#FFE4C4';
        this.ctx.beginPath();
        this.ctx.arc(headX, headY, headSize, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = '#FF6B00';
        this.ctx.beginPath();
        this.ctx.moveTo(headX - headSize * 0.8, headY - headSize * 0.1);
        this.ctx.quadraticCurveTo(headX - headSize * 0.5, headY - headSize * 1.0, headX, headY - headSize * 0.85);
        this.ctx.quadraticCurveTo(headX + headSize * 0.5, headY - headSize * 1.0, headX + headSize * 0.8, headY - headSize * 0.1);
        this.ctx.quadraticCurveTo(headX + headSize * 0.6, headY - headSize * 0.4, headX, headY - headSize * 0.55);
        this.ctx.quadraticCurveTo(headX - headSize * 0.6, headY - headSize * 0.4, headX - headSize * 0.8, headY - headSize * 0.1);
        this.ctx.fill();
        this.ctx.strokeStyle = '#CC5500';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.fillStyle = '#FF4500';
        for (let i = 0; i < 5; i++) {
            const flameX = headX - headSize * 0.6 + i * headSize * 0.3;
            this.ctx.beginPath();
            this.ctx.moveTo(flameX, headY - headSize * 0.3);
            this.ctx.quadraticCurveTo(
                flameX + 5, 
                headY - headSize * (0.6 + Math.sin(Date.now() / 100 + i) * 0.1),
                flameX + 10, 
                headY - headSize * 0.3
            );
            this.ctx.fill();
        }

        this.ctx.fillStyle = '#000';
        const eyeOffset = isHit ? -3 : 0;
        this.ctx.beginPath();
        this.ctx.ellipse(headX - headSize * 0.25, headY + eyeOffset + 2, 4, 5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(headX + headSize * 0.15, headY + eyeOffset + 2, 4, 5, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#FFF';
        this.ctx.beginPath();
        this.ctx.arc(headX - headSize * 0.23, headY + 1, 1.5, 0, Math.PI * 2);
        this.ctx.arc(headX + headSize * 0.17, headY + 1, 1.5, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(headX - headSize * 0.40, headY - 10);
        this.ctx.lineTo(headX - headSize * 0.12, headY - 6);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(headX + headSize * 0.08, headY - 6);
        this.ctx.lineTo(headX + headSize * 0.36, headY - 10);
        this.ctx.stroke();

        if (!isHit) {
            this.ctx.strokeStyle = '#8B4513';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(headX, headY + headSize * 0.35, 6, 0.1, Math.PI - 0.1);
            this.ctx.stroke();
        }

        if (attack === 'shoryuken' && phase === 'active') {
            this.drawFireEffect(x + width, y - 20, 80);
        }
    }

    drawChunLi(x, y, width, height, color, secondaryColor, state, attack, phase, timer, frame, facingRight) {
        const isAttacking = state === GameData.states.ATTACK || state === GameData.states.SPECIAL;
        const isKick = attack && (attack.includes('Kick') || attack === 'hyakuretsukyaku' || attack === 'tatsumaki');
        const isCrouching = state === GameData.states.CROUCH;
        const isHit = state === GameData.states.HIT || state === GameData.states.KNOCKDOWN;

        const headSize = width * 0.40;
        const headX = x + width / 2;
        const headY = y + headSize * 0.65;

        const legOffset = isCrouching ? -10 : 0;
        const legWidth = width * 0.22;
        const legHeight = height * 0.42 + legOffset;
        const legY = y + height * 0.58 - legOffset;

        this.ctx.fillStyle = '#000080';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;

        this.ctx.beginPath();
        this.ctx.moveTo(x + width * 0.26, legY);
        this.ctx.lineTo(x + width * 0.22, legY + legHeight * 0.75);
        this.ctx.lineTo(x + width * 0.18, legY + legHeight);
        this.ctx.lineTo(x + width * 0.36, legY + legHeight);
        this.ctx.lineTo(x + width * 0.34, legY + legHeight * 0.75);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(x + width * 0.54, legY);
        this.ctx.lineTo(x + width * 0.58, legY + legHeight * 0.75);
        this.ctx.lineTo(x + width * 0.62, legY + legHeight);
        this.ctx.lineTo(x + width * 0.44, legY + legHeight);
        this.ctx.lineTo(x + width * 0.46, legY + legHeight * 0.75);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.ellipse(x + width * 0.27, legY + legHeight, 12, 14, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.ellipse(x + width * 0.53, legY + legHeight, 12, 14, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        const bodyY = headY + headSize * 0.65;
        const bodyHeight = height * 0.40;
        
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(headX - width * 0.33, bodyY);
        this.ctx.quadraticCurveTo(headX - width * 0.38, bodyY + bodyHeight * 0.55, headX - width * 0.28, bodyY + bodyHeight);
        this.ctx.lineTo(headX + width * 0.28, bodyY + bodyHeight);
        this.ctx.quadraticCurveTo(headX + width * 0.38, bodyY + bodyHeight * 0.55, headX + width * 0.33, bodyY);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.moveTo(headX, bodyY + bodyHeight * 0.6);
        this.ctx.lineTo(headX - width * 0.15, bodyY + bodyHeight);
        this.ctx.lineTo(headX + width * 0.15, bodyY + bodyHeight);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = secondaryColor;
        this.ctx.fillRect(headX - width * 0.22, bodyY + 12, width * 0.44, 12);
        this.ctx.strokeRect(headX - width * 0.22, bodyY + 12, width * 0.44, 12);

        this.drawArms(x, y, width, height, state, attack, phase, timer, '#FFE4C4', color);

        this.ctx.fillStyle = '#FFE4C4';
        this.ctx.beginPath();
        this.ctx.arc(headX, headY, headSize, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = '#2ECC71';
        this.ctx.beginPath();
        this.ctx.arc(headX, headY - headSize * 0.2, headSize * 0.88, Math.PI * 0.88, Math.PI * 2.12);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(headX - headSize * 0.95, headY + headSize * 0.15);
        this.ctx.quadraticCurveTo(headX - headSize * 1.15, headY - headSize * 0.4, headX - headSize * 0.72, headY - headSize * 0.58);
        this.ctx.lineTo(headX - headSize * 0.52, headY - headSize * 0.25);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(headX + headSize * 0.95, headY + headSize * 0.15);
        this.ctx.quadraticCurveTo(headX + headSize * 1.15, headY - headSize * 0.4, headX + headSize * 0.72, headY - headSize * 0.58);
        this.ctx.lineTo(headX + headSize * 0.52, headY - headSize * 0.25);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(headX - headSize * 0.85, headY, 6, 0, Math.PI * 2);
        this.ctx.arc(headX + headSize * 0.85, headY, 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#FFA500';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.fillStyle = '#000';
        const eyeOffset = isHit ? -3 : 0;
        this.ctx.beginPath();
        this.ctx.ellipse(headX - headSize * 0.24, headY + eyeOffset, 5, 6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(headX + headSize * 0.18, headY + eyeOffset, 5, 6, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#FFF';
        this.ctx.beginPath();
        this.ctx.arc(headX - headSize * 0.22, headY - 2, 2, 0, Math.PI * 2);
        this.ctx.arc(headX + headSize * 0.20, headY - 2, 2, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(headX - headSize * 0.36, headY - 10);
        this.ctx.lineTo(headX - headSize * 0.14, headY - 7);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(headX + headSize * 0.10, headY - 7);
        this.ctx.lineTo(headX + headSize * 0.32, headY - 10);
        this.ctx.stroke();

        this.ctx.strokeStyle = '#FF9999';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(headX - headSize * 0.30, headY + 10, 7, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.arc(headX + headSize * 0.26, headY + 10, 7, 0, Math.PI * 2);
        this.ctx.stroke();

        if (!isHit) {
            this.ctx.strokeStyle = '#FF6B6B';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(headX, headY + headSize * 0.32, 5, 0, Math.PI);
            this.ctx.stroke();
        }

        if (attack === 'hyakuretsukyaku' && phase === 'active') {
            this.drawKickEffect(x + width, y + height * 0.6, 60);
        }

        if (attack === 'tatsumaki' && phase === 'active') {
            this.drawSpinEffect(x + width / 2, y + height / 2, 70);
        }
    }

    drawArms(x, y, width, height, state, attack, phase, timer, skinColor, clothColor) {
        const isAttacking = state === GameData.states.ATTACK || state === GameData.states.SPECIAL;
        const isPunch = attack && (attack.includes('Punch') || attack === 'hadouken' || attack === 'shoryuken');
        const isKick = attack && (attack.includes('Kick') || attack === 'tatsumaki' || attack === 'hyakuretsukyaku');
        
        const shoulderY = y + height * 0.44;
        const shoulderLeftX = x + width * 0.12;
        const shoulderRightX = x + width * 0.88;

        this.ctx.fillStyle = skinColor;
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;

        if (isAttacking && phase === 'active') {
            if (isPunch) {
                const punchExtend = Math.min(timer / 80, 1) * 50;
                this.ctx.beginPath();
                this.ctx.ellipse(shoulderRightX + punchExtend + 25, shoulderY + 8, 16, 14, 0, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                
                this.ctx.beginPath();
                this.ctx.moveTo(shoulderRightX, shoulderY + 5);
                this.ctx.lineTo(shoulderRightX + punchExtend, shoulderY + 10);
                this.ctx.lineTo(shoulderRightX + punchExtend, shoulderY + 30);
                this.ctx.lineTo(shoulderRightX, shoulderY + 25);
                this.ctx.closePath();
                this.ctx.fillStyle = clothColor;
                this.ctx.fill();
                this.ctx.stroke();
            } else if (isKick) {
                const kickExtend = Math.min(timer / 80, 1) * 40;
                this.ctx.beginPath();
                this.ctx.ellipse(x + width + kickExtend, y + height * 0.55, 14, 12, 0, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
            }
        } else {
            this.ctx.beginPath();
            this.ctx.ellipse(shoulderLeftX - 8, shoulderY + 28, 13, 12, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.ellipse(shoulderRightX + 8, shoulderY + 28, 13, 12, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
        }

        if (!isAttacking || phase !== 'active' || !isPunch) {
            this.ctx.fillStyle = clothColor;
            this.ctx.beginPath();
            this.ctx.ellipse(shoulderLeftX, shoulderY + 10, 12, 10, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.ellipse(shoulderRightX, shoulderY + 10, 12, 10, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
        }
    }

    drawPowerAura(x, y, size) {
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, size);
        gradient.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
        gradient.addColorStop(0.3, 'rgba(100, 200, 255, 0.6)');
        gradient.addColorStop(0.6, 'rgba(50, 150, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 100, 255, 0)');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)';
        this.ctx.lineWidth = 3;
        for (let i = 0; i < 6; i++) {
            const angle = (Date.now() / 150 + i * Math.PI / 3) % (Math.PI * 2);
            const radius = size * (0.5 + Math.sin(Date.now() / 200 + i) * 0.2);
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, angle, angle + 0.8);
            this.ctx.stroke();
        }
    }

    drawFireEffect(x, y, size) {
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, size);
        gradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 200, 50, 0.9)');
        gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.7)');
        gradient.addColorStop(0.8, 'rgba(255, 50, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fill();

        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2 + Date.now() / 120;
            const flameSize = size * (0.45 + Math.sin(Date.now() / 80 + i) * 0.15);
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.quadraticCurveTo(
                x + Math.cos(angle) * size * 0.6,
                y + Math.sin(angle) * size * 0.6,
                x + Math.cos(angle) * flameSize * 1.3,
                y + Math.sin(angle) * flameSize * 1.3
            );
            this.ctx.quadraticCurveTo(
                x + Math.cos(angle + 0.25) * size * 0.4,
                y + Math.sin(angle + 0.25) * size * 0.4,
                x, y
            );
            this.ctx.fillStyle = `rgba(255, ${100 + i * 15}, 0, ${0.7 - i * 0.05})`;
            this.ctx.fill();
        }
    }

    drawKickEffect(x, y, size) {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.lineWidth = 4;
        
        for (let i = 0; i < 6; i++) {
            const offset = (Date.now() / 40 + i * 18) % size;
            const alpha = 1 - offset / size;
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
            this.ctx.beginPath();
            this.ctx.arc(x - offset, y, 12 + i * 10, -Math.PI * 0.3, Math.PI * 0.4);
            this.ctx.stroke();
        }

        this.ctx.fillStyle = 'rgba(100, 200, 255, 0.6)';
        for (let i = 0; i < 8; i++) {
            const angle = (Date.now() / 100 + i * Math.PI / 4) % (Math.PI * 2);
            const dist = 20 + Math.sin(Date.now() / 150 + i) * 15;
            this.ctx.beginPath();
            this.ctx.arc(
                x + Math.cos(angle) * dist,
                y + Math.sin(angle) * dist * 0.5,
                4, 0, Math.PI * 2
            );
            this.ctx.fill();
        }
    }

    drawSpinEffect(x, y, size) {
        this.ctx.strokeStyle = 'rgba(100, 200, 255, 0.9)';
        this.ctx.lineWidth = 4;
        
        for (let i = 0; i < 5; i++) {
            const angle = (Date.now() / 60 + i * Math.PI / 2.5) % (Math.PI * 2);
            const radius = size * (0.4 + i * 0.12);
            
            this.ctx.beginPath();
            for (let a = 0; a < Math.PI * 1.8; a += 0.1) {
                const r = radius * (1 - a / (Math.PI * 2.5));
                const px = x + Math.cos(angle + a) * r;
                const py = y + Math.sin(angle + a) * r * 0.6;
                if (a === 0) {
                    this.ctx.moveTo(px, py);
                } else {
                    this.ctx.lineTo(px, py);
                }
            }
            this.ctx.stroke();
        }

        this.ctx.fillStyle = 'rgba(150, 220, 255, 0.5)';
        for (let i = 0; i < 10; i++) {
            const angle = (Date.now() / 80 + i * Math.PI / 5) % (Math.PI * 2);
            const dist = size * 0.3 + i * 5;
            this.ctx.beginPath();
            this.ctx.arc(
                x + Math.cos(angle) * dist,
                y + Math.sin(angle) * dist * 0.5,
                3 + i * 0.5, 0, Math.PI * 2
            );
            this.ctx.fill();
        }
    }

    drawProjectile(projectile, characterId) {
        const { x, y, width, height, color } = projectile;

        if (characterId === 'chunli') {
            const gradient = this.ctx.createRadialGradient(
                x + width / 2, y + height / 2, 0,
                x + width / 2, y + height / 2, width * 1.2
            );
            gradient.addColorStop(0, 'rgba(200, 255, 220, 1)');
            gradient.addColorStop(0.3, 'rgba(100, 255, 180, 0.9)');
            gradient.addColorStop(0.6, 'rgba(50, 200, 120, 0.6)');
            gradient.addColorStop(1, 'rgba(0, 150, 80, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(x + width / 2, y + height / 2, width * 1.1, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.lineWidth = 3;
            for (let i = 0; i < 4; i++) {
                this.ctx.beginPath();
                this.ctx.arc(x + width / 2, y + height / 2, width * (0.3 + i * 0.2), 
                           Date.now() / 180 + i * 0.5, Date.now() / 180 + i * 0.5 + Math.PI * 0.6);
                this.ctx.stroke();
            }

            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.beginPath();
            this.ctx.arc(x + width / 2, y + height / 2, width * 0.35, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            const gradient = this.ctx.createRadialGradient(
                x + width / 2, y + height / 2, 0,
                x + width / 2, y + height / 2, width * 1.3
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.25, 'rgba(200, 230, 255, 0.95)');
            gradient.addColorStop(0.5, 'rgba(100, 180, 255, 0.8)');
            gradient.addColorStop(0.75, 'rgba(50, 130, 255, 0.5)');
            gradient.addColorStop(1, 'rgba(0, 80, 255, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(x + width / 2, y + height / 2, width * 1.2, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.lineWidth = 3;
            for (let i = 0; i < 4; i++) {
                const spiralRadius = width * (0.35 + i * 0.2);
                this.ctx.beginPath();
                for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
                    const r = spiralRadius * (1 - angle / (Math.PI * 2.5));
                    const px = x + width / 2 + Math.cos(angle + Date.now() / 90) * r;
                    const py = y + height / 2 + Math.sin(angle + Date.now() / 90) * r * 0.7;
                    if (angle === 0) {
                        this.ctx.moveTo(px, py);
                    } else {
                        this.ctx.lineTo(px, py);
                    }
                }
                this.ctx.stroke();
            }

            this.ctx.fillStyle = 'rgba(255, 255, 255, 1)';
            this.ctx.beginPath();
            this.ctx.arc(x + width / 2, y + height / 2, width * 0.3, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawHitEffect(effect) {
        const { x, y } = effect;
        
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 5;
        
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const length = 30 + Math.sin(Date.now() / 40 + i) * 12;
            this.ctx.beginPath();
            this.ctx.moveTo(x + Math.cos(angle) * 12, y + Math.sin(angle) * 12);
            this.ctx.lineTo(
                x + Math.cos(angle) * length,
                y + Math.sin(angle) * length
            );
            this.ctx.stroke();
        }

        this.ctx.fillStyle = '#FFF';
        for (let i = 0; i < 7; i++) {
            const angle = (i / 7) * Math.PI * 2 + 0.25;
            const dist = 22 + Math.sin(Date.now() / 70 + i) * 8;
            this.ctx.beginPath();
            this.ctx.arc(
                x + Math.cos(angle) * dist,
                y + Math.sin(angle) * dist,
                5, 0, Math.PI * 2
            );
            this.ctx.fill();
        }

        this.ctx.fillStyle = '#FF6B6B';
        this.ctx.font = 'bold 28px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('HIT!', x, y - 35 + Math.sin(Date.now() / 100) * 5);
        this.ctx.strokeStyle = '#FFF';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText('HIT!', x, y - 35 + Math.sin(Date.now() / 100) * 5);
    }

    drawGameOver(text) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const gradient = this.ctx.createLinearGradient(
            this.width / 2 - 250, this.height / 2 - 60,
            this.width / 2 + 250, this.height / 2 + 60
        );
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.3, '#FFA500');
        gradient.addColorStop(0.6, '#FF6347');
        gradient.addColorStop(1, '#FF4500');

        this.ctx.fillStyle = gradient;
        this.ctx.font = 'bold 90px "Arial Black", Impact, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = '#8B0000';
        this.ctx.lineWidth = 8;
        this.ctx.strokeText(text, this.width / 2, this.height / 2 + 25);
        this.ctx.fillText(text, this.width / 2, this.height / 2 + 25);

        this.ctx.shadowColor = '#FFD700';
        this.ctx.shadowBlur = 40;
        this.ctx.fillText(text, this.width / 2, this.height / 2 + 25);
        this.ctx.shadowBlur = 0;

        for (let i = 0; i < 20; i++) {
            const sparkleX = this.width / 2 + Math.cos(Date.now() / 300 + i) * (200 + i * 10);
            const sparkleY = this.height / 2 + 25 + Math.sin(Date.now() / 200 + i * 2) * (80 + i * 5);
            this.ctx.fillStyle = `rgba(255, 215, 0, ${0.5 + Math.sin(Date.now() / 100 + i) * 0.5})`;
            this.ctx.beginPath();
            this.ctx.arc(sparkleX, sparkleY, 3 + i * 0.2, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
}
