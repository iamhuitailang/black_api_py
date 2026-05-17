const Renderer = {
    canvas: null,
    ctx: null,
    
    init() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
    },
    
    clear() {
        this.ctx.fillStyle = GameConfig.COLORS.BACKGROUND;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },
    
    renderBackground() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        const skyGradient = ctx.createLinearGradient(0, 0, 0, GameConfig.GROUND_Y);
        skyGradient.addColorStop(0, '#0d0505');
        skyGradient.addColorStop(0.4, '#1a0808');
        skyGradient.addColorStop(0.7, '#2d1010');
        skyGradient.addColorStop(1, '#3d1515');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, w, GameConfig.GROUND_Y);
        
        ctx.fillStyle = '#0a0505';
        for (let i = 0; i < 8; i++) {
            const bx = i * 160 - 20;
            const bh = 200 + Math.sin(i * 1.5) * 100;
            const by = GameConfig.GROUND_Y - bh;
            
            ctx.fillStyle = '#120808';
            ctx.fillRect(bx, by, 140, bh);
            
            ctx.fillStyle = '#1a0d0d';
            ctx.fillRect(bx + 8, by, 124, bh);
            
            for (let row = 0; row < Math.floor(bh / 35); row++) {
                for (let col = 0; col < 4; col++) {
                    const wx = bx + 15 + col * 30;
                    const wy = by + 20 + row * 35;
                    if (Math.random() > 0.35) {
                        const glow = Math.random();
                        ctx.fillStyle = glow > 0.7 ? '#ff8800' : '#ffaa00';
                        ctx.globalAlpha = 0.5 + Math.random() * 0.5;
                        ctx.shadowColor = '#ff6600';
                        ctx.shadowBlur = 8;
                        ctx.fillRect(wx, wy, 22, 22);
                        ctx.shadowBlur = 0;
                        ctx.globalAlpha = 1;
                    } else {
                        ctx.fillStyle = '#0a0505';
                        ctx.fillRect(wx, wy, 22, 22);
                    }
                }
            }
        }
        
        ctx.fillStyle = '#0d0d0d';
        ctx.fillRect(0, GameConfig.GROUND_Y - 3, w, 3);
        
        const groundGradient = ctx.createLinearGradient(0, GameConfig.GROUND_Y, 0, h);
        groundGradient.addColorStop(0, '#4a2818');
        groundGradient.addColorStop(0.2, '#3d2015');
        groundGradient.addColorStop(0.5, '#2d1510');
        groundGradient.addColorStop(1, '#1a0a08');
        ctx.fillStyle = groundGradient;
        ctx.fillRect(0, GameConfig.GROUND_Y, w, h - GameConfig.GROUND_Y);
        
        ctx.strokeStyle = '#5c3a28';
        ctx.lineWidth = 1;
        for (let i = 0; i < w; i += 70) {
            ctx.beginPath();
            ctx.moveTo(i, GameConfig.GROUND_Y + 8);
            ctx.lineTo(i + 50, GameConfig.GROUND_Y + 45);
            ctx.stroke();
        }
        
        ctx.fillStyle = 'rgba(255, 30, 30, 0.08)';
        ctx.fillRect(0, GameConfig.GROUND_Y, w, 15);
        
        const vignette = ctx.createRadialGradient(
            w / 2, GameConfig.GROUND_Y - 100, 100,
            w / 2, GameConfig.GROUND_Y - 100, w * 0.7
        );
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, w, h);
    },
    
    renderCharacter(character) {
        const ctx = this.ctx;
        const { x, y, width, height, color, secondaryColor, facingRight, state, animFrame, invincible, name } = character;
        
        ctx.save();
        
        if (invincible && Math.floor(Date.now() / 70) % 2 === 0) {
            ctx.globalAlpha = 0.6;
        }
        
        if (!facingRight) {
            ctx.translate(x + width / 2, 0);
            ctx.scale(-1, 1);
            ctx.translate(-(x + width / 2), 0);
        }
        
        this.drawFighter(ctx, character);
        
        ctx.restore();
        
        if (character.blocking) {
            this.drawShield(ctx, x + width / 2, y + height * 0.4, width);
        }
        
        if (character.isAttacking()) {
            this.drawAttackEffect(ctx, character);
        }
        
        this.drawNameTag(ctx, character);
    },
    
    drawFighter(ctx, char) {
        const x = char.x;
        const y = char.y;
        const w = char.width;
        const h = char.height;
        const color = char.color;
        const secondaryColor = char.secondaryColor;
        const state = char.state;
        const animFrame = char.animFrame;
        
        const cx = w / 2;
        const headY = 18;
        const neckY = 38;
        const chestY = 55;
        const waistY = 85;
        const kneeY = 105;
        const footY = h;
        
        const walkBob = state === GameConfig.CHARACTER_STATES.WALKING ? Math.sin(animFrame * 0.8) * 2 : 0;
        const punchLean = state === GameConfig.CHARACTER_STATES.PUNCHING ? 10 : 0;
        const kickLean = state === GameConfig.CHARACTER_STATES.KICKING ? 6 : 0;
        const hurtLean = state === GameConfig.CHARACTER_STATES.HURT ? -12 : 0;
        const specialLean = state === GameConfig.CHARACTER_STATES.SPECIAL ? 15 : 0;
        const leanOffset = punchLean + kickLean + hurtLean + specialLean;
        
        ctx.save();
        ctx.translate(x + leanOffset, y + walkBob);
        
        this.drawShadow(ctx, cx, footY, w);
        
        this.drawLegs(ctx, state, animFrame, cx, waistY, kneeY, footY, color, secondaryColor);
        this.drawTorso(ctx, cx, neckY, chestY, waistY, color, secondaryColor, state);
        this.drawHead(ctx, cx, headY, color, secondaryColor, state);
        this.drawArms(ctx, state, animFrame, cx, chestY, color, secondaryColor);
        
        ctx.restore();
    },
    
    drawShadow(ctx, x, y, w) {
        ctx.save();
        ctx.globalAlpha = 0.4;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, w * 0.7);
        gradient.addColorStop(0, '#000');
        gradient.addColorStop(0.6, 'rgba(0,0,0,0.3)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(x, y, w * 0.55, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },
    
    drawHead(ctx, cx, headY, color, secondaryColor, state) {
        ctx.save();
        
        ctx.fillStyle = '#e8b89a';
        ctx.strokeStyle = '#c49578';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.ellipse(cx, headY, 17, 19, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = secondaryColor;
        ctx.beginPath();
        ctx.ellipse(cx, headY - 9, 16, 10, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(cx - 16, headY - 7);
        ctx.quadraticCurveTo(cx - 20, headY + 6, cx - 13, headY + 9);
        ctx.lineTo(cx + 13, headY + 9);
        ctx.quadraticCurveTo(cx + 20, headY + 6, cx + 16, headY - 7);
        ctx.lineTo(cx + 14, headY - 3);
        ctx.lineTo(cx - 14, headY - 3);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = secondaryColor;
        ctx.fillRect(cx - 14, headY - 6, 28, 5);
        
        ctx.fillStyle = '#fff';
        ctx.shadowColor = 'rgba(255,255,255,0.5)';
        ctx.shadowBlur = 2;
        ctx.beginPath();
        ctx.ellipse(cx - 6, headY - 1, 4, 3, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + 6, headY - 1, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#000';
        const eyeOffset = state === GameConfig.CHARACTER_STATES.HURT ? -1 : 0;
        const eyeSize = state === GameConfig.CHARACTER_STATES.SPECIAL ? 3 : 2;
        ctx.beginPath();
        ctx.arc(cx - 6 + eyeOffset, headY - 1, eyeSize, 0, Math.PI * 2);
        ctx.arc(cx + 6 + eyeOffset, headY - 1, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cx - 5 + eyeOffset, headY - 2, 1, 0, Math.PI * 2);
        ctx.arc(cx + 7 + eyeOffset, headY - 2, 1, 0, Math.PI * 2);
        ctx.fill();
        
        if (state === GameConfig.CHARACTER_STATES.HURT) {
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx - 10, headY - 5);
            ctx.lineTo(cx - 3, headY - 3);
            ctx.moveTo(cx + 10, headY - 5);
            ctx.lineTo(cx + 3, headY - 3);
            ctx.stroke();
        } else if (state === GameConfig.CHARACTER_STATES.PUNCHING || 
                   state === GameConfig.CHARACTER_STATES.KICKING ||
                   state === GameConfig.CHARACTER_STATES.SPECIAL ||
                   state === GameConfig.CHARACTER_STATES.GRABBING) {
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.ellipse(cx, headY + 8, 5, 4, 0, 0, Math.PI);
            ctx.fill();
            
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.ellipse(cx, headY + 8, 3, 2, 0, 0, Math.PI);
            ctx.fill();
        } else {
            ctx.strokeStyle = '#8a5a4a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, headY + 6, 4, 0.1, Math.PI - 0.1);
            ctx.stroke();
        }
        
        ctx.fillStyle = '#d49a78';
        ctx.beginPath();
        ctx.ellipse(cx, headY + 3, 2, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    },
    
    drawTorso(ctx, cx, neckY, chestY, waistY, color, secondaryColor, state) {
        ctx.save();
        
        const torsoGradient = ctx.createLinearGradient(cx - 20, chestY, cx + 20, chestY);
        torsoGradient.addColorStop(0, secondaryColor);
        torsoGradient.addColorStop(0.2, color);
        torsoGradient.addColorStop(0.8, color);
        torsoGradient.addColorStop(1, secondaryColor);
        
        ctx.fillStyle = torsoGradient;
        ctx.strokeStyle = secondaryColor;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(cx - 18, neckY);
        ctx.quadraticCurveTo(cx - 22, chestY, cx - 18, waistY);
        ctx.lineTo(cx + 18, waistY);
        ctx.quadraticCurveTo(cx + 22, chestY, cx + 18, neckY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = secondaryColor;
        ctx.fillRect(cx - 15, chestY - 3, 30, 6);
        
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(cx - 12, chestY + 5, 24, 3);
        ctx.globalAlpha = 1;
        
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - 14, chestY + 10);
        ctx.lineTo(cx - 10, waistY - 5);
        ctx.moveTo(cx + 14, chestY + 10);
        ctx.lineTo(cx + 10, waistY - 5);
        ctx.stroke();
        
        ctx.fillStyle = secondaryColor;
        ctx.beginPath();
        ctx.moveTo(cx - 10, waistY);
        ctx.lineTo(cx - 12, waistY + 8);
        ctx.lineTo(cx + 12, waistY + 8);
        ctx.lineTo(cx + 10, waistY);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    },
    
    drawArms(ctx, state, animFrame, cx, chestY, color, secondaryColor) {
        ctx.save();
        
        let leftShoulderAngle = -0.4;
        let rightShoulderAngle = 0.4;
        let leftElbowAngle = 0.6;
        let rightElbowAngle = 0.6;
        
        if (state === GameConfig.CHARACTER_STATES.PUNCHING) {
            rightShoulderAngle = -1.5;
            rightElbowAngle = -0.3;
            leftShoulderAngle = 0.6;
            leftElbowAngle = 0.9;
        } else if (state === GameConfig.CHARACTER_STATES.KICKING) {
            rightShoulderAngle = -1.0;
            rightElbowAngle = 0.4;
            leftShoulderAngle = 1.0;
            leftElbowAngle = 0.7;
        } else if (state === GameConfig.CHARACTER_STATES.SPECIAL) {
            rightShoulderAngle = -1.8;
            rightElbowAngle = -0.6;
            leftShoulderAngle = -1.6;
            leftElbowAngle = -0.4;
        } else if (state === GameConfig.CHARACTER_STATES.BLOCKING) {
            rightShoulderAngle = -1.4;
            rightElbowAngle = -1.2;
            leftShoulderAngle = 1.4;
            leftElbowAngle = 1.2;
        } else if (state === GameConfig.CHARACTER_STATES.HURT) {
            rightShoulderAngle = 1.2;
            rightElbowAngle = 1.4;
            leftShoulderAngle = -1.2;
            leftElbowAngle = -1.4;
        } else if (state === GameConfig.CHARACTER_STATES.WALKING) {
            const swing = Math.sin(animFrame * 0.8) * 0.5;
            leftShoulderAngle = -0.4 + swing;
            rightShoulderAngle = 0.4 - swing;
        } else if (state === GameConfig.CHARACTER_STATES.GRABBING) {
            rightShoulderAngle = -0.8;
            rightElbowAngle = 0.2;
            leftShoulderAngle = -0.6;
            leftElbowAngle = 0.1;
        } else if (state === GameConfig.CHARACTER_STATES.JUMPING) {
            rightShoulderAngle = -0.8;
            rightElbowAngle = 1.0;
            leftShoulderAngle = 0.8;
            leftElbowAngle = 1.0;
        }
        
        this.drawArm(ctx, cx - 18, chestY + 3, leftShoulderAngle, leftElbowAngle, color, secondaryColor);
        this.drawArm(ctx, cx + 18, chestY + 3, rightShoulderAngle, rightElbowAngle, color, secondaryColor);
        
        ctx.restore();
    },
    
    drawArm(ctx, shoulderX, shoulderY, shoulderAngle, elbowAngle, color, secondaryColor) {
        ctx.save();
        ctx.translate(shoulderX, shoulderY);
        ctx.rotate(shoulderAngle);
        
        const armGradient = ctx.createLinearGradient(0, -5, 0, 5);
        armGradient.addColorStop(0, color);
        armGradient.addColorStop(0.5, secondaryColor);
        armGradient.addColorStop(1, color);
        
        ctx.fillStyle = armGradient;
        ctx.strokeStyle = secondaryColor;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.roundRect(0, -6, 28, 12, 4);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#e8b89a';
        ctx.strokeStyle = '#c49578';
        ctx.beginPath();
        ctx.arc(28, 0, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.translate(28, 0);
        ctx.rotate(elbowAngle);
        
        ctx.fillStyle = armGradient;
        ctx.strokeStyle = secondaryColor;
        ctx.beginPath();
        ctx.roundRect(0, -5, 26, 10, 4);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#e8b89a';
        ctx.strokeStyle = '#c49578';
        ctx.beginPath();
        ctx.arc(26, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#d49a78';
        ctx.beginPath();
        ctx.arc(26, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    },
    
    drawLegs(ctx, state, animFrame, cx, waistY, kneeY, footY, color, secondaryColor) {
        ctx.save();
        
        let leftHipAngle = 0.2;
        let rightHipAngle = -0.2;
        let leftKneeAngle = 0.4;
        let rightKneeAngle = 0.4;
        
        if (state === GameConfig.CHARACTER_STATES.KICKING) {
            rightHipAngle = -1.4;
            rightKneeAngle = -0.2;
            leftHipAngle = 0.4;
            leftKneeAngle = 0.6;
        } else if (state === GameConfig.CHARACTER_STATES.HURT) {
            leftHipAngle = 0.4;
            rightHipAngle = -0.4;
            leftKneeAngle = 0.8;
            rightKneeAngle = 0.8;
        } else if (state === GameConfig.CHARACTER_STATES.WALKING) {
            const swing = Math.sin(animFrame * 0.8) * 0.6;
            leftHipAngle = 0.2 + swing;
            rightHipAngle = -0.2 - swing;
            leftKneeAngle = 0.4 + Math.abs(swing) * 0.4;
            rightKneeAngle = 0.4 + Math.abs(swing) * 0.4;
        } else if (state === GameConfig.CHARACTER_STATES.JUMPING) {
            leftHipAngle = 0.6;
            rightHipAngle = -0.6;
            leftKneeAngle = 1.0;
            rightKneeAngle = 1.0;
        } else if (state === GameConfig.CHARACTER_STATES.PUNCHING || 
                   state === GameConfig.CHARACTER_STATES.SPECIAL ||
                   state === GameConfig.CHARACTER_STATES.GRABBING) {
            leftHipAngle = 0.3;
            rightHipAngle = -0.3;
            leftKneeAngle = 0.5;
            rightKneeAngle = 0.5;
        }
        
        this.drawLeg(ctx, cx - 9, waistY, leftHipAngle, leftKneeAngle, footY - waistY, color, secondaryColor);
        this.drawLeg(ctx, cx + 9, waistY, rightHipAngle, rightKneeAngle, footY - waistY, color, secondaryColor);
        
        ctx.restore();
    },
    
    drawLeg(ctx, hipX, hipY, hipAngle, kneeAngle, legLength, color, secondaryColor) {
        ctx.save();
        ctx.translate(hipX, hipY);
        ctx.rotate(hipAngle);
        
        const legGradient = ctx.createLinearGradient(0, -6, 0, 6);
        legGradient.addColorStop(0, color);
        legGradient.addColorStop(0.5, secondaryColor);
        legGradient.addColorStop(1, color);
        
        ctx.fillStyle = legGradient;
        ctx.strokeStyle = secondaryColor;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.roundRect(0, -7, 32, 14, 5);
        ctx.fill();
        ctx.stroke();
        
        ctx.translate(32, 0);
        ctx.rotate(kneeAngle);
        
        ctx.fillStyle = legGradient;
        ctx.beginPath();
        ctx.roundRect(0, -6, 28, 12, 4);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#1a0f0a';
        ctx.strokeStyle = '#0d0705';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(24, -5, 20, 14, 3);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#2a1a10';
        ctx.fillRect(26, -3, 16, 4);
        
        ctx.restore();
    },
    
    drawShield(ctx, x, y, width) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, width * 0.65);
        gradient.addColorStop(0, 'rgba(100, 200, 255, 0.9)');
        gradient.addColorStop(0.5, 'rgba(100, 200, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(x, y, width * 0.55, 50, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = 'rgba(150, 220, 255, 1)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(x, y, width * 0.5, 45, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(200, 240, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x, y, width * 0.4, 35, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    },
    
    drawAttackEffect(ctx, character) {
        const attack = character.currentAttack;
        if (!attack) return;
        
        const cx = character.x + character.width / 2;
        const cy = character.y + character.height / 2;
        const direction = character.facingRight ? 1 : -1;
        
        ctx.save();
        
        if (attack === GameConfig.ATTACK_TYPES.SPECIAL) {
            const time = Date.now() / 80;
            const ex = cx + direction * 70;
            const ey = cy;
            
            const gradient = ctx.createRadialGradient(ex, ey, 0, ex, ey, 120);
            gradient.addColorStop(0, 'rgba(255, 220, 0, 1)');
            gradient.addColorStop(0.2, 'rgba(255, 150, 0, 0.9)');
            gradient.addColorStop(0.5, 'rgba(255, 50, 0, 0.5)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(ex, ey, 120, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 4;
            for (let i = 0; i < 16; i++) {
                const angle = (i / 16) * Math.PI * 2 + time * 0.6;
                const r = 60 + Math.sin(time * 2 + i) * 20;
                ctx.beginPath();
                ctx.moveTo(ex, ey);
                ctx.lineTo(
                    ex + Math.cos(angle) * r,
                    ey + Math.sin(angle) * r
                );
                ctx.stroke();
            }
            
            ctx.fillStyle = '#fff';
            ctx.shadowColor = '#ffaa00';
            ctx.shadowBlur = 20;
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('必杀!', ex, ey - 80);
            ctx.shadowBlur = 0;
            
        } else if (attack.name.includes('punch')) {
            const impactX = cx + direction * 60;
            const impactY = cy - 18;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(impactX, impactY, 22, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            ctx.strokeStyle = 'rgba(255, 200, 100, 1)';
            ctx.lineWidth = 4;
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(impactX + Math.cos(angle) * 25, impactY + Math.sin(angle) * 25);
                ctx.lineTo(impactX + Math.cos(angle) * 45, impactY + Math.sin(angle) * 45);
                ctx.stroke();
            }
            
            if (attack === GameConfig.ATTACK_TYPES.HEAVY_PUNCH) {
                ctx.fillStyle = 'rgba(255, 100, 0, 0.7)';
                ctx.shadowColor = '#ff6600';
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.arc(impactX, impactY, 30, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
            
        } else if (attack.name.includes('kick')) {
            const impactX = cx + direction * 70;
            const impactY = cy + 30;
            
            ctx.fillStyle = 'rgba(100, 150, 255, 0.8)';
            ctx.shadowColor = '#6688ff';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.ellipse(impactX, impactY, 38, 18, direction * 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            ctx.strokeStyle = 'rgba(150, 200, 255, 1)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(impactX - direction * 25, impactY + 12);
            ctx.lineTo(impactX + direction * 50, impactY - 8);
            ctx.stroke();
            
            if (attack === GameConfig.ATTACK_TYPES.HEAVY_KICK) {
                ctx.fillStyle = 'rgba(255, 50, 100, 0.6)';
                ctx.shadowColor = '#ff3366';
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.ellipse(impactX, impactY, 50, 25, direction * 0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
            
        } else if (attack === GameConfig.ATTACK_TYPES.GRAB) {
            const gx = cx + direction * 40;
            const gy = cy;
            
            ctx.strokeStyle = 'rgba(255, 100, 100, 1)';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(gx, gy, 40, -0.7, 0.7);
            ctx.stroke();
            
            ctx.fillStyle = 'rgba(255, 100, 100, 0.7)';
            ctx.beginPath();
            ctx.arc(gx, gy, 10, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(255, 150, 150, 0.8)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(gx, gy, 30, -0.5, 0.5);
            ctx.stroke();
            
        } else if (attack === GameConfig.ATTACK_TYPES.JUMP_ATTACK) {
            const impactX = cx + direction * 50;
            const impactY = cy - 15;
            
            ctx.fillStyle = 'rgba(255, 200, 100, 0.8)';
            ctx.shadowColor = '#ffcc66';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(impactX, impactY, 26, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            ctx.strokeStyle = 'rgba(255, 230, 150, 1)';
            ctx.lineWidth = 3;
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(impactX, impactY);
                ctx.lineTo(
                    impactX + Math.cos(angle) * 35,
                    impactY + Math.sin(angle) * 35
                );
                ctx.stroke();
            }
        }
        
        ctx.restore();
    },
    
    drawNameTag(ctx, character) {
        const centerX = character.x + character.width / 2;
        const y = character.y - 15;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.strokeStyle = character.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(centerX - 50, y - 22, 100, 28, 5);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 2;
        ctx.fillText(character.name, centerX, y - 8);
        ctx.shadowBlur = 0;
        
        if (character.state === GameConfig.CHARACTER_STATES.DEAD) {
            ctx.fillStyle = '#ff2222';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 10;
            ctx.font = 'bold 24px Arial';
            ctx.fillText('K.O.', centerX, y + 30);
            ctx.shadowBlur = 0;
        }
    },
    
    renderUI(player, opponent, round, winStreak) {
        this.renderHealthBar(player, 50, 30, true);
        this.renderHealthBar(opponent, GameConfig.CANVAS_WIDTH - 350, 30, false);
        this.renderEnergyBar(player, 50, 75, true);
        this.renderEnergyBar(opponent, GameConfig.CANVAS_WIDTH - 350, 75, false);
        this.renderRoundInfo(round, winStreak);
    },
    
    renderHealthBar(character, x, y, isPlayer) {
        const ctx = this.ctx;
        const width = 300;
        const height = 30;
        const borderWidth = 4;
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.roundRect(x - borderWidth, y - borderWidth, width + borderWidth * 2, height + borderWidth * 2, 6);
        ctx.fill();
        
        ctx.fillStyle = GameConfig.COLORS.HEALTH_BAR_BG;
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 4);
        ctx.fill();
        
        const healthPercent = character.health / character.maxHealth;
        const healthWidth = width * healthPercent;
        
        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        if (healthPercent > 0.5) {
            gradient.addColorStop(0, '#66ff66');
            gradient.addColorStop(0.5, '#33dd33');
            gradient.addColorStop(1, '#22aa22');
        } else if (healthPercent > 0.25) {
            gradient.addColorStop(0, '#ffcc00');
            gradient.addColorStop(0.5, '#ff9900');
            gradient.addColorStop(1, '#dd7700');
        } else {
            gradient.addColorStop(0, '#ff5555');
            gradient.addColorStop(0.5, '#ff2222');
            gradient.addColorStop(1, '#cc0000');
        }
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, healthWidth, height, 4);
        ctx.fill();
        
        if (healthPercent > 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.beginPath();
            ctx.roundRect(x + 2, y + 2, healthWidth - 4, height / 2 - 3, 2);
            ctx.fill();
        }
        
        ctx.strokeStyle = isPlayer ? '#4488ff' : '#ff4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 4);
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 3;
        ctx.fillText(`${character.name}`, x + 10, y + height / 2);
        
        ctx.textAlign = 'right';
        ctx.fillText(`${character.health}/${character.maxHealth}`, x + width - 10, y + height / 2);
        ctx.shadowBlur = 0;
    },
    
    renderEnergyBar(character, x, y, isPlayer) {
        const ctx = this.ctx;
        const width = 300;
        const height = 15;
        const borderWidth = 3;
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.roundRect(x - borderWidth, y - borderWidth, width + borderWidth * 2, height + borderWidth * 2, 4);
        ctx.fill();
        
        ctx.fillStyle = GameConfig.COLORS.ENERGY_BAR_BG;
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 3);
        ctx.fill();
        
        const energyPercent = character.energy / character.maxEnergy;
        const energyWidth = width * energyPercent;
        
        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        if (energyPercent >= 1) {
            gradient.addColorStop(0, '#00ffff');
            gradient.addColorStop(0.5, '#00ccff');
            gradient.addColorStop(1, '#0099cc');
        } else {
            gradient.addColorStop(0, '#6699ff');
            gradient.addColorStop(0.5, '#4477dd');
            gradient.addColorStop(1, '#2255aa');
        }
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, energyWidth, height, 3);
        ctx.fill();
        
        if (energyPercent >= 1) {
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.roundRect(x, y, energyWidth, height, 3);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        ctx.strokeStyle = isPlayer ? '#4488ff' : '#ff4444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 3);
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 2;
        
        if (energyPercent >= 1) {
            ctx.fillStyle = '#00ffff';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 5;
            ctx.fillText(`能量满！按 F 释放必杀`, x + width / 2, y + height / 2);
        } else {
            ctx.fillStyle = '#fff';
            ctx.fillText(`ENERGY ${character.energy}%`, x + width / 2, y + height / 2);
        }
        ctx.shadowBlur = 0;
    },
    
    renderRoundInfo(round, winStreak) {
        const ctx = this.ctx;
        const cx = GameConfig.CANVAS_WIDTH / 2;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(cx - 95, 20, 190, 55, 8);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 3;
        ctx.fillText(`第 ${round} 回合`, cx, 42);
        
        ctx.fillStyle = '#fff';
        ctx.font = '13px Arial';
        ctx.fillText(`连胜: ${winStreak}`, cx, 62);
        ctx.shadowBlur = 0;
    },
    
    renderPauseOverlay() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur = 25;
        ctx.fillText('已暂停', this.canvas.width / 2, this.canvas.height / 2);
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#aaa';
        ctx.font = '18px Arial';
        ctx.fillText('按 ESC 继续游戏', this.canvas.width / 2, this.canvas.height / 2 + 55);
    }
};

if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Renderer;
}
