class Hippo {
    constructor(type = 'normal') {
        this.type = type;
        const config = CONFIG.HIPPO_TYPES[type];
        
        this.name = config.name;
        this.maxHealth = config.maxHealth;
        this.health = config.maxHealth;
        this.attack = config.attack;
        this.defense = config.defense;
        this.moveSpeed = config.moveSpeed;
        this.biteSpeed = config.biteSpeed;
        this.ultimateDamage = config.ultimateDamage;
        this.color = config.color;
        this.ultimateName = config.ultimateName;
        
        this.x = CONFIG.CANVAS_WIDTH / 2;
        this.y = CONFIG.HIPPO_Y;
        this.width = 180;
        this.height = 120;
        
        this.headAngle = CONFIG.HEAD_ANGLE.NEUTRAL;
        this.targetHeadAngle = CONFIG.HEAD_ANGLE.NEUTRAL;
        
        this.mouthOpen = 0;
        this.targetMouthOpen = 0;
        this.isBiting = false;
        this.biteType = null;
        this.biteProgress = 0;
        
        this.isCharging = false;
        this.chargeStartTime = 0;
        this.chargeLevel = 0;
        
        this.ultimateEnergy = 0;
        this.isUsingUltimate = false;
        this.ultimateProgress = 0;
        
        this.vx = 0;
        this.facingRight = true;
        
        this.invincible = false;
        this.invincibleTime = 0;
        
        this.shakeAmount = 0;
        this.combo = 0;
        this.comboTimer = 0;
    }

    update(deltaTime, input) {
        this.vx = 0;
        if (input.left) {
            this.vx = -this.moveSpeed;
            this.facingRight = false;
        }
        if (input.right) {
            this.vx = this.moveSpeed;
            this.facingRight = true;
        }
        
        this.x += this.vx;
        this.x = Utils.clamp(this.x, 100, CONFIG.CANVAS_WIDTH - 100);
        
        this.targetHeadAngle = CONFIG.HEAD_ANGLE.NEUTRAL;
        if (input.up) this.targetHeadAngle = CONFIG.HEAD_ANGLE.UP;
        if (input.down) this.targetHeadAngle = CONFIG.HEAD_ANGLE.DOWN;
        
        this.headAngle = Utils.lerp(this.headAngle, this.targetHeadAngle, 0.15);
        
        if (this.isBiting) {
            this.updateBite(deltaTime);
        }
        
        if (this.isCharging) {
            this.updateCharge(deltaTime);
        }
        
        if (this.isUsingUltimate) {
            this.updateUltimate(deltaTime);
        }
        
        if (this.invincible) {
            this.invincibleTime -= deltaTime;
            if (this.invincibleTime <= 0) {
                this.invincible = false;
            }
        }
        
        if (this.shakeAmount > 0) {
            this.shakeAmount *= 0.9;
        }
        
        if (this.comboTimer > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.combo = 0;
            }
        }
        
        this.mouthOpen = Utils.lerp(this.mouthOpen, this.targetMouthOpen, 0.2);
    }

    startCharge() {
        if (!this.isBiting && !this.isUsingUltimate) {
            this.isCharging = true;
            this.chargeStartTime = Date.now();
            this.chargeLevel = 0;
        }
    }

    updateCharge(deltaTime) {
        const chargeTime = Date.now() - this.chargeStartTime;
        this.chargeLevel = Math.min(chargeTime / CONFIG.CHARGE_TIME, 1);
    }

    releaseBite() {
        if (this.isCharging) {
            this.isCharging = false;
            
            if (this.chargeLevel >= 0.9) {
                this.startBite(CONFIG.BITE.CHARGED);
            } else {
                this.startBite(CONFIG.BITE.NORMAL);
            }
        }
    }

    startBite(type = CONFIG.BITE.NORMAL) {
        if (this.isBiting || this.isUsingUltimate) return;
        
        this.isBiting = true;
        this.biteType = type;
        this.biteProgress = 0;
        this.targetMouthOpen = type === CONFIG.BITE.CHARGED ? 1.2 : 1;
    }

    updateBite(deltaTime) {
        this.biteProgress += deltaTime * 0.003 * this.biteSpeed;
        
        if (this.biteProgress < 0.3) {
            this.targetMouthOpen = this.biteType === CONFIG.BITE.CHARGED ? 1.2 : 1;
        } else if (this.biteProgress < 0.5) {
            this.targetMouthOpen = 0;
        } else if (this.biteProgress >= 1) {
            this.isBiting = false;
            this.biteType = null;
            this.targetMouthOpen = 0;
        }
    }

    useUltimate() {
        if (this.ultimateEnergy < CONFIG.ULTIMATE_ENERGY_MAX || this.isUsingUltimate) return false;
        
        this.isUsingUltimate = true;
        this.ultimateProgress = 0;
        this.ultimateEnergy = 0;
        this.shakeAmount = 1;
        
        ParticleSystem.createBurst(this.x, this.y - 50, 30, {
            color: '#9c27b0',
            size: 15,
            vx: 0,
            vy: 0,
            gravity: 0
        });
        
        return true;
    }

    updateUltimate(deltaTime) {
        this.ultimateProgress += deltaTime * 0.002;
        
        if (this.ultimateProgress < 0.3) {
            this.targetMouthOpen = 2;
        } else if (this.ultimateProgress >= 1.5) {
            this.isUsingUltimate = false;
            this.targetMouthOpen = 0;
        }
    }

    addUltimateEnergy(amount) {
        this.ultimateEnergy = Math.min(this.ultimateEnergy + amount, CONFIG.ULTIMATE_ENERGY_MAX);
    }

    takeDamage(amount) {
        if (this.invincible) return 0;
        
        const reduction = this.defense * 0.5;
        const actualDamage = Math.max(amount - reduction, 2);
        this.health -= actualDamage;
        this.shakeAmount = 0.5;
        this.invincible = true;
        this.invincibleTime = 500;
        
        ParticleSystem.createBurst(this.x, this.y - 30, 10, {
            color: '#ff4444',
            size: 8
        });
        
        return actualDamage;
    }

    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
    }

    addCombo() {
        this.combo++;
        this.comboTimer = 2000;
    }

    getBiteHitbox() {
        if (!this.isBiting && !this.isUsingUltimate) return null;
        
        const bitePhase = this.isUsingUltimate ? 
            (this.ultimateProgress > 0.3 && this.ultimateProgress < 1) :
            (this.biteProgress > 0.3 && this.biteProgress < 0.6);
        
        if (!bitePhase) return null;
        
        const angleRad = this.headAngle * Math.PI / 180;
        const mouthX = this.x + Math.sin(angleRad) * 60;
        const mouthY = this.y - 60 + Math.cos(angleRad) * 30;
        const radius = this.isUsingUltimate ? 150 : (this.biteType === CONFIG.BITE.CHARGED ? 80 : 60);
        
        return { x: mouthX, y: mouthY, radius };
    }

    getDamage() {
        if (this.isUsingUltimate) {
            return this.ultimateDamage;
        }
        if (this.biteType === CONFIG.BITE.CHARGED) {
            return this.attack * CONFIG.MAX_CHARGE_MULTIPLIER;
        }
        return this.attack;
    }

    render(ctx) {
        ctx.save();
        
        const shakeX = Utils.shake(this.shakeAmount);
        const shakeY = Utils.shake(this.shakeAmount);
        ctx.translate(this.x + shakeX, this.y + shakeY);
        
        if (!this.facingRight) {
            ctx.scale(-1, 1);
        }
        
        if (this.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        this.drawBody(ctx);
        this.drawHead(ctx);
        
        ctx.restore();
        
        if (this.isCharging) {
            this.drawChargeIndicator(ctx);
        }
    }

    drawBody(ctx) {
        const bodyGradient = ctx.createRadialGradient(-20, 0, 0, 0, 20, 100);
        bodyGradient.addColorStop(0, this.lightenColor(this.color, 30));
        bodyGradient.addColorStop(0.5, this.color);
        bodyGradient.addColorStop(1, this.darkenColor(this.color, 30));
        
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(0, 20, 95, 55, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = this.darkenColor(this.color, 40);
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.fillStyle = '#FFE4C4';
        ctx.beginPath();
        ctx.ellipse(0, 38, 65, 30, 0, 0.15, Math.PI - 0.15);
        ctx.fill();
        
        const legColor = this.darkenColor(this.color, 20);
        ctx.fillStyle = legColor;
        ctx.beginPath();
        ctx.ellipse(-55, 55, 22, 18, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(55, 55, 22, 18, -0.4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = this.darkenColor(this.color, 25);
        ctx.beginPath();
        ctx.ellipse(-20, 62, 12, 8, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(20, 62, 12, 8, -0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.ellipse(-40, -5, 35, 25, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        if (this.type === 'defense') {
            ctx.strokeStyle = 'rgba(100, 149, 237, 0.5)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.ellipse(0, 20, 100, 60, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    drawHead(ctx) {
        ctx.save();
        ctx.translate(0, -30);
        ctx.rotate(this.headAngle * Math.PI / 180);
        
        const headGradient = ctx.createRadialGradient(-10, -35, 0, 0, -25, 65);
        headGradient.addColorStop(0, this.lightenColor(this.color, 40));
        headGradient.addColorStop(0.5, this.color);
        headGradient.addColorStop(1, this.darkenColor(this.color, 30));
        
        ctx.fillStyle = headGradient;
        ctx.beginPath();
        ctx.ellipse(0, -25, 58, 45, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = this.darkenColor(this.color, 40);
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.fillStyle = this.lightenColor(this.color, 20);
        ctx.beginPath();
        ctx.ellipse(0, -10, 35, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.ellipse(15, -12, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-15, -12, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.ellipse(25, -35, 9, 11, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-25, -35, 9, 11, -0.1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(26, -34, 4, 6, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-24, -34, 4, 6, -0.1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(27.5, -36, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-22.5, -36, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 182, 193, 0.5)';
        ctx.beginPath();
        ctx.ellipse(40, -22, 10, 7, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-40, -22, 10, 7, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = this.lightenColor(this.color, 15);
        ctx.beginPath();
        ctx.ellipse(40, -50, 12, 15, 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-40, -50, 12, 15, -0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.ellipse(-20, -35, 20, 15, -0.4, 0, Math.PI * 2);
        ctx.fill();
        
        this.drawMouth(ctx);
        
        ctx.restore();
    }

    drawMouth(ctx) {
        const mouthOpenAmount = this.mouthOpen * 45;
        
        ctx.fillStyle = '#8B0000';
        ctx.beginPath();
        ctx.moveTo(-35, -10);
        ctx.quadraticCurveTo(0, -10 + mouthOpenAmount * 0.6, 35, -10);
        ctx.quadraticCurveTo(0, -8 + mouthOpenAmount + 10, -35, -10);
        ctx.fill();
        
        ctx.strokeStyle = '#5C0000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#FFFAF0';
        for (let i = -2; i <= 2; i++) {
            const tx = i * 14;
            ctx.beginPath();
            ctx.moveTo(tx - 5, -12);
            ctx.lineTo(tx + 5, -12);
            ctx.lineTo(tx + 2.5, -2);
            ctx.lineTo(tx - 2.5, -2);
            ctx.closePath();
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(tx - 5, 3 + mouthOpenAmount * 0.55);
            ctx.lineTo(tx + 5, 3 + mouthOpenAmount * 0.55);
            ctx.lineTo(tx + 2.5, 12 + mouthOpenAmount * 0.55);
            ctx.lineTo(tx - 2.5, 12 + mouthOpenAmount * 0.55);
            ctx.closePath();
            ctx.fill();
        }
        
        if (mouthOpenAmount > 10) {
            ctx.fillStyle = '#FF6B9D';
            ctx.beginPath();
            ctx.ellipse(0, mouthOpenAmount * 0.35, 18, 12, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        if (this.isUsingUltimate) {
            const glowSize = 120 + Math.sin(Date.now() * 0.02) * 20;
            const glowColor = this.type === 'fast' ? 'rgba(255, 215, 0, 0.6)' : 
                              (this.type === 'defense' ? 'rgba(100, 149, 237, 0.6)' : 'rgba(156, 39, 176, 0.6)');
            
            ctx.fillStyle = glowColor;
            ctx.beginPath();
            ctx.arc(0, -8, glowSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawChargeIndicator(ctx) {
        const indicatorRadius = 100 + this.chargeLevel * 30;
        const gradient = ctx.createRadialGradient(
            this.x, this.y - 50, 0,
            this.x, this.y - 50, indicatorRadius
        );
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0)');
        gradient.addColorStop(0.7, `rgba(255, 215, 0, ${this.chargeLevel * 0.5})`);
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 50, indicatorRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = `rgba(255, 215, 0, ${0.5 + this.chargeLevel * 0.5})`;
        ctx.lineWidth = 3 + this.chargeLevel * 5;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 50, indicatorRadius - 10, 0, Math.PI * 2 * this.chargeLevel);
        ctx.stroke();
    }

    darkenColor(hex, amount) {
        const rgb = Utils.hexToRgb(hex);
        return Utils.colorToString(
            Math.max(0, rgb.r - amount),
            Math.max(0, rgb.g - amount),
            Math.max(0, rgb.b - amount)
        );
    }

    lightenColor(hex, amount) {
        const rgb = Utils.hexToRgb(hex);
        return Utils.colorToString(
            Math.min(255, rgb.r + amount),
            Math.min(255, rgb.g + amount),
            Math.min(255, rgb.b + amount)
        );
    }

    getState() {
        return {
            type: this.type,
            health: this.health,
            x: this.x,
            ultimateEnergy: this.ultimateEnergy,
            combo: this.combo
        };
    }

    loadState(state) {
        this.health = state.health;
        this.x = state.x;
        this.ultimateEnergy = state.ultimateEnergy;
        this.combo = state.combo || 0;
    }
}