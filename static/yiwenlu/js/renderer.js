import { GAME_CONFIG, ATTACK_DATA, SKILL_DATA } from './config.js';
import { CharacterState } from './character.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.pixelScale = 2;
        this.screenShake = 0;
        this.screenShakeIntensity = 0;
        this.time = 0;
    }

    clear() {
        this.ctx.fillStyle = '#1a0a00';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    render(gameState) {
        this.time += 16;
        
        this.ctx.save();
        
        if (this.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShakeIntensity;
            const shakeY = (Math.random() - 0.5) * this.screenShakeIntensity;
            this.ctx.translate(shakeX, shakeY);
            this.screenShake -= 16;
        }
        
        this.drawBackground();
        this.drawGround();
        
        if (gameState.enemy) {
            this.drawCharacter(gameState.enemy);
            this.drawProjectiles(gameState.enemy);
            this.drawEffects(gameState.enemy);
        }
        
        if (gameState.player) {
            this.drawCharacter(gameState.player);
            this.drawProjectiles(gameState.player);
            this.drawEffects(gameState.player);
        }
        
        this.ctx.restore();
        
        if (this.screenShake < 0) this.screenShake = 0;
    }

    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#2d1810');
        gradient.addColorStop(0.5, '#3d2818');
        gradient.addColorStop(1, '#1a0a00');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.drawClouds();
        this.drawMountain();
        this.drawAncientPattern();
    }

    drawClouds() {
        this.ctx.fillStyle = 'rgba(200, 180, 150, 0.15)';
        const cloudOffset = (this.time * 0.02) % (this.width + 200);
        
        for (let i = 0; i < 5; i++) {
            const x = ((i * 250 + cloudOffset) % (this.width + 200)) - 100;
            const y = 50 + i * 30;
            this.drawCloud(x, y, 60 + i * 10);
        }
    }

    drawCloud(x, y, size) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.3, y - size * 0.1, size * 0.35, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.6, y, size * 0.4, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.3, y + size * 0.1, size * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawMountain() {
        this.ctx.fillStyle = 'rgba(80, 50, 30, 0.6)';
        this.ctx.beginPath();
        this.ctx.moveTo(0, GAME_CONFIG.GROUND_Y);
        this.ctx.lineTo(150, 200);
        this.ctx.lineTo(300, 320);
        this.ctx.lineTo(450, 150);
        this.ctx.lineTo(600, 280);
        this.ctx.lineTo(750, 180);
        this.ctx.lineTo(900, 300);
        this.ctx.lineTo(this.width, GAME_CONFIG.GROUND_Y);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.fillStyle = 'rgba(100, 70, 40, 0.4)';
        this.ctx.beginPath();
        this.ctx.moveTo(0, GAME_CONFIG.GROUND_Y);
        this.ctx.lineTo(100, 300);
        this.ctx.lineTo(250, 380);
        this.ctx.lineTo(400, 280);
        this.ctx.lineTo(550, 350);
        this.ctx.lineTo(700, 320);
        this.ctx.lineTo(850, 370);
        this.ctx.lineTo(this.width, GAME_CONFIG.GROUND_Y);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawAncientPattern() {
        this.ctx.strokeStyle = 'rgba(139, 69, 19, 0.2)';
        this.ctx.lineWidth = 2;
        
        for (let x = 0; x < this.width; x += 80) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, GAME_CONFIG.GROUND_Y - 10);
            this.ctx.lineTo(x + 20, GAME_CONFIG.GROUND_Y - 30);
            this.ctx.lineTo(x + 40, GAME_CONFIG.GROUND_Y - 10);
            this.ctx.stroke();
        }
        
        this.ctx.strokeStyle = 'rgba(184, 134, 11, 0.15)';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(10, 10, this.width - 20, this.height - 20);
    }

    drawGround() {
        const groundGradient = this.ctx.createLinearGradient(0, GAME_CONFIG.GROUND_Y, 0, this.height);
        groundGradient.addColorStop(0, '#5C4033');
        groundGradient.addColorStop(0.3, '#3D2914');
        groundGradient.addColorStop(1, '#1A0F0A');
        this.ctx.fillStyle = groundGradient;
        this.ctx.fillRect(0, GAME_CONFIG.GROUND_Y, this.width, this.height - GAME_CONFIG.GROUND_Y);
        
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(0, GAME_CONFIG.GROUND_Y);
        this.ctx.lineTo(this.width, GAME_CONFIG.GROUND_Y);
        this.ctx.stroke();
        
        this.ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)';
        this.ctx.lineWidth = 1;
        for (let x = 0; x < this.width; x += 30) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, GAME_CONFIG.GROUND_Y + 5);
            this.ctx.lineTo(x + 15, GAME_CONFIG.GROUND_Y + 5);
            this.ctx.stroke();
        }
    }

    drawCharacter(character) {
        const x = character.x;
        const y = character.y;
        const facing = character.facing;
        
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.scale(facing, 1);
        
        if (character.isInvincible && Math.floor(this.time / 100) % 2 === 0) {
            this.ctx.globalAlpha = 0.5;
        }
        
        if (character.hurtFlash > 0) {
            this.ctx.fillStyle = '#FFFFFF';
        } else {
            this.ctx.fillStyle = character.color;
        }
        
        if (character.charId === 'qinglong') {
            this.drawQinglong(character);
        } else if (character.charId === 'zhuque') {
            this.drawZhuque(character);
        } else if (character.charId === 'xuanwu') {
            this.drawXuanwu(character);
        }
        
        if (character.state === CharacterState.BLOCK) {
            this.drawShield(character);
        }
        
        this.ctx.restore();
    }

    drawQinglong(character) {
        const bounce = character.state === CharacterState.WALK ? Math.sin(this.time * 0.02) * 3 : 0;
        const bodyY = -60 + bounce;
        
        this.ctx.fillStyle = character.hurtFlash > 0 ? '#FFFFFF' : character.color;
        this.ctx.beginPath();
        this.ctx.ellipse(0, bodyY, 45, 35, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = character.hurtFlash > 0 ? '#FFFFFF' : character.secondaryColor;
        for (let i = 0; i < 4; i++) {
            const scaleX = character.facing;
            this.ctx.beginPath();
            this.ctx.moveTo(-20 + i * 15, bodyY - 25);
            this.ctx.lineTo(-15 + i * 15, bodyY - 45);
            this.ctx.lineTo(-10 + i * 15, bodyY - 25);
            this.ctx.closePath();
            this.ctx.fill();
        }
        
        this.ctx.fillStyle = character.hurtFlash > 0 ? '#FFFFFF' : character.color;
        this.ctx.beginPath();
        this.ctx.ellipse(35, bodyY - 10, 25, 18, 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.beginPath();
        this.ctx.arc(45, bodyY - 15, 5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(47, bodyY - 15, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.moveTo(42, bodyY - 5);
        this.ctx.lineTo(50, bodyY);
        this.ctx.lineTo(42, bodyY + 5);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.fillStyle = character.hurtFlash > 0 ? '#FFFFFF' : character.secondaryColor;
        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(30 + i * 8, bodyY - 28);
            this.ctx.lineTo(33 + i * 8, bodyY - 45);
            this.ctx.lineTo(36 + i * 8, bodyY - 28);
            this.ctx.closePath();
            this.ctx.fill();
        }
        
        const legOffset = character.state === CharacterState.WALK ? Math.sin(this.time * 0.03) * 10 : 0;
        this.ctx.fillStyle = character.hurtFlash > 0 ? '#FFFFFF' : character.color;
        this.ctx.fillRect(-25, bodyY + 20, 12, 25 + legOffset);
        this.ctx.fillRect(10, bodyY + 20, 12, 25 - legOffset);
        
        this.ctx.fillStyle = character.hurtFlash > 0 ? '#FFFFFF' : character.secondaryColor;
        const tailWave = Math.sin(this.time * 0.02) * 8;
        this.ctx.beginPath();
        this.ctx.moveTo(-40, bodyY);
        this.ctx.quadraticCurveTo(-60, bodyY + tailWave, -75, bodyY + tailWave * 1.5);
        this.ctx.quadraticCurveTo(-60, bodyY + tailWave * 0.5 + 10, -40, bodyY + 10);
        this.ctx.closePath();
        this.ctx.fill();
        
        if (character.isAttacking()) {
            this.drawAttackEffect(character, 60, bodyY - 5);
        }
    }

    drawZhuque(character) {
        const bounce = character.state === CharacterState.WALK ? Math.sin(this.time * 0.025) * 4 : 0;
        const bodyY = -55 + bounce;
        
        const wingFlap = Math.sin(this.time * 0.04) * 15;
        
        this.ctx.fillStyle = character.hurtFlash > 0 ? '#FFFFFF' : character.secondaryColor;
        this.ctx.beginPath();
        this.ctx.ellipse(-15, bodyY - 15 + wingFlap * 0.5, 35, 20, -0.5 + wingFlap * 0.02, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(15, bodyY - 15 - wingFlap * 0.5, 35, 20, 0.5 - wingFlap * 0.02, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = character.hurtFlash > 0 ? '#FFFFFF' : character.color;
        this.ctx.beginPath();
        this.ctx.ellipse(0, bodyY, 30, 35, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = character.hurtFlash > 0 ? '#FFFFFF' : '#FFEB3B';
        for (let i = 0; i < 5; i++) {
            const angle = -0.8 + i * 0.4;
            const len = 25 - Math.abs(i - 2) * 5;
            this.ctx.beginPath();
            this.ctx.moveTo(0, bodyY - 30);
            this.ctx.lineTo(Math.cos(angle) * len, bodyY - 30 - Math.sin(angle) * len);
            this.ctx.lineTo(Math.cos(angle) * (len - 8), bodyY - 30 - Math.sin(angle) * (len - 8));
            this.ctx.closePath();
            this.ctx.fill();
        }
        
        this.ctx.fillStyle = character.hurtFlash > 0 ? '#FFFFFF' : character.color;
        this.ctx.beginPath();
        this.ctx.arc(20, bodyY - 15, 18, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(28, bodyY - 18, 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(30, bodyY - 18, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFA000';
        this.ctx.beginPath();
        this.ctx.moveTo(35, bodyY - 15);
        this.ctx.lineTo(50, bodyY - 12);
        this.ctx.lineTo(35, bodyY - 8);
        this.ctx.closePath();
        this.ctx.fill();
        
        const tailFire = Math.sin(this.time * 0.05) * 5;
        this.ctx.fillStyle = character.hurtFlash > 0 ? '#FFFFFF' : '#FF5722';
        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(-25, bodyY + 10 + i * 8);
            this.ctx.quadraticCurveTo(-50, bodyY + 10 + i * 8 + tailFire, -65, bodyY + 5 + i * 10 + tailFire * 1.5);
            this.ctx.quadraticCurveTo(-50, bodyY + 15 + i * 8 + tailFire, -25, bodyY + 20 + i * 8);
            this.ctx.closePath();
            this.ctx.fill();
        }
        
        this.ctx.fillStyle = character.hurtFlash > 0 ? '#FFFFFF' : character.secondaryColor;
        this.ctx.fillRect(-12, bodyY + 25, 8, 20);
        this.ctx.fillRect(4, bodyY + 25, 8, 20);
        
        if (character.isAttacking()) {
            this.drawAttackEffect(character, 50, bodyY - 10);
        }
    }

    drawXuanwu(character) {
        const bounce = character.state === CharacterState.WALK ? Math.sin(this.time * 0.015) * 2 : 0;
        const bodyY = -45 + bounce;
        
        this.ctx.fillStyle = character.hurtFlash > 0 ? '#FFFFFF' : character.secondaryColor;
        this.ctx.beginPath();
        this.ctx.ellipse(0, bodyY, 50, 40, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = character.hurtFlash > 0 ? '#FFFFFF' : '#6D4C41';
        this.ctx.beginPath();
        this.ctx.ellipse(0, bodyY - 5, 45, 35, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = character.hurtFlash > 0 ? '#FFFFFF' : '#5D4037';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            this.ctx.beginPath();
            this.ctx.moveTo(0, bodyY - 5);
            this.ctx.lineTo(Math.cos(angle) * 30, bodyY - 5 + Math.sin(angle) * 25);
            this.ctx.stroke();
        }
        
        this.ctx.fillStyle = character.hurtFlash > 0 ? '#FFFFFF' : character.color;
        this.ctx.beginPath();
        this.ctx.ellipse(40, bodyY + 5, 20, 15, 0.2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#FFEB3B';
        this.ctx.beginPath();
        this.ctx.arc(48, bodyY, 4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(49, bodyY, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = character.hurtFlash > 0 ? '#FFFFFF' : character.secondaryColor;
        const legBounce = character.state === CharacterState.WALK ? Math.sin(this.time * 0.02) * 5 : 0;
        this.ctx.fillRect(-35, bodyY + 25, 15, 18 + legBounce);
        this.ctx.fillRect(20, bodyY + 25, 15, 18 - legBounce);
        
        this.ctx.fillStyle = character.hurtFlash > 0 ? '#FFFFFF' : character.color;
        const tailWave = Math.sin(this.time * 0.015) * 3;
        this.ctx.beginPath();
        this.ctx.moveTo(-45, bodyY + 10);
        this.ctx.quadraticCurveTo(-60, bodyY + 15 + tailWave, -70, bodyY + 10 + tailWave);
        this.ctx.quadraticCurveTo(-60, bodyY + 25 + tailWave, -45, bodyY + 20);
        this.ctx.closePath();
        this.ctx.fill();
        
        if (character.state === CharacterState.BLOCK) {
            this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(0, bodyY, 60, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        if (character.isAttacking()) {
            this.drawAttackEffect(character, 55, bodyY + 5);
        }
    }

    drawAttackEffect(character, x, y) {
        const progress = character.stateTime / 300;
        
        this.ctx.save();
        this.ctx.translate(x, y);
        
        if (character.type === 'water') {
            this.ctx.fillStyle = 'rgba(79, 195, 247, 0.6)';
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2 + this.time * 0.01;
                const dist = 10 + progress * 40;
                this.ctx.beginPath();
                this.ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist * 0.5, 8 - i, 0, Math.PI * 2);
                this.ctx.fill();
            }
        } else if (character.type === 'fire') {
            this.ctx.fillStyle = 'rgba(255, 87, 34, 0.7)';
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const dist = 15 + progress * 35 + Math.sin(this.time * 0.05 + i) * 5;
                this.ctx.beginPath();
                this.ctx.moveTo(0, 0);
                this.ctx.lineTo(Math.cos(angle) * dist, Math.sin(angle) * dist - 10);
                this.ctx.lineTo(Math.cos(angle) * (dist - 10), Math.sin(angle) * (dist - 10));
                this.ctx.closePath();
                this.ctx.fill();
            }
        } else if (character.type === 'earth') {
            this.ctx.fillStyle = 'rgba(141, 110, 99, 0.8)';
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const dist = 20 + progress * 30;
                this.ctx.fillRect(
                    Math.cos(angle) * dist - 5,
                    Math.sin(angle) * dist - 5,
                    10, 10
                );
            }
        }
        
        this.ctx.restore();
    }

    drawShield(character) {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(0, -50, 55, 65, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        this.ctx.restore();
    }

    drawProjectiles(character) {
        for (const proj of character.projectiles) {
            this.ctx.save();
            this.ctx.translate(proj.x, proj.y);
            
            if (proj.type === 'water') {
                const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 25);
                gradient.addColorStop(0, 'rgba(79, 195, 247, 0.9)');
                gradient.addColorStop(0.5, 'rgba(3, 169, 244, 0.7)');
                gradient.addColorStop(1, 'rgba(3, 169, 244, 0)');
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 25, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                this.ctx.beginPath();
                this.ctx.arc(-5, -5, 8, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (proj.type === 'fire') {
                const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
                gradient.addColorStop(0, 'rgba(255, 193, 7, 0.9)');
                gradient.addColorStop(0.3, 'rgba(255, 87, 34, 0.8)');
                gradient.addColorStop(0.7, 'rgba(211, 47, 47, 0.6)');
                gradient.addColorStop(1, 'rgba(211, 47, 47, 0)');
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 30, 0, Math.PI * 2);
                this.ctx.fill();
                
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2 + this.time * 0.05;
                    this.ctx.fillStyle = 'rgba(255, 152, 0, 0.6)';
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, 0);
                    this.ctx.lineTo(Math.cos(angle) * 35, Math.sin(angle) * 35 - 15);
                    this.ctx.lineTo(Math.cos(angle) * 20, Math.sin(angle) * 20);
                    this.ctx.closePath();
                    this.ctx.fill();
                }
            } else if (proj.type === 'earth') {
                this.ctx.fillStyle = '#6D4C41';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 20, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.strokeStyle = '#5D4037';
                this.ctx.lineWidth = 2;
                for (let i = 0; i < 4; i++) {
                    const angle = (i / 4) * Math.PI * 2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, 0);
                    this.ctx.lineTo(Math.cos(angle) * 15, Math.sin(angle) * 15);
                    this.ctx.stroke();
                }
            }
            
            this.ctx.restore();
        }
    }

    drawEffects(character) {
        for (const effect of character.effects) {
            const progress = 1 - effect.life / effect.maxLife;
            
            this.ctx.save();
            this.ctx.translate(effect.x, effect.y);
            
            if (effect.type === 'hit') {
                this.ctx.strokeStyle = `rgba(255, 215, 0, ${1 - progress})`;
                this.ctx.lineWidth = 3;
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const dist = 10 + progress * 30;
                    this.ctx.beginPath();
                    this.ctx.moveTo(Math.cos(angle) * dist * 0.5, Math.sin(angle) * dist * 0.5);
                    this.ctx.lineTo(Math.cos(angle) * dist, Math.sin(angle) * dist);
                    this.ctx.stroke();
                }
            } else if (effect.type === 'hurt') {
                this.ctx.fillStyle = `rgba(255, 0, 0, ${0.8 - progress})`;
                for (let i = 0; i < 5; i++) {
                    const angle = (i / 5) * Math.PI * 2 + this.time * 0.02;
                    const dist = progress * 40;
                    this.ctx.beginPath();
                    this.ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, 5 * (1 - progress), 0, Math.PI * 2);
                    this.ctx.fill();
                }
            } else if (effect.type === 'jump') {
                this.ctx.fillStyle = `rgba(139, 69, 19, ${0.6 - progress})`;
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2;
                    const dist = 10 + progress * 20;
                    this.ctx.beginPath();
                    this.ctx.arc(Math.cos(angle) * dist, 0, 4 * (1 - progress), 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
            
            this.ctx.restore();
        }
    }

    addScreenShake(duration, intensity) {
        this.screenShake = Math.max(this.screenShake, duration);
        this.screenShakeIntensity = Math.max(this.screenShakeIntensity, intensity);
    }
}
