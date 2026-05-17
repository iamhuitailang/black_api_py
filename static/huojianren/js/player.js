class Player {
    constructor(characterType, isEnemy = false) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.character = characterType;
        this.isEnemy = isEnemy;
        this.x = isEnemy ? 1000 : 200;
        this.y = GAME_CONFIG.GROUND_Y;
        this.maxHealth = characterType.maxHealth;
        this.health = characterType.maxHealth;
        this.attack = characterType.attack;
        this.dodge = characterType.dodge;
        this.moveSpeed = characterType.moveSpeed;
        this.specialDamage = characterType.specialDamage;
        this.specialCooldown = characterType.specialCooldown;
        this.color = characterType.color;
        
        this.velocityX = 0;
        this.velocityY = 0;
        this.isCrouching = false;
        this.isMoving = false;
        this.facingRight = !isEnemy;
        
        this.chargeTime = 0;
        this.isCharging = false;
        this.chargeType = null;
        
        this.attackCooldown = 0;
        this.specialCooldownRemaining = 0;
        this.chargeEffect = null;
        
        this.animFrame = 0;
        this.animTimer = 0;
        this.hurtFlash = 0;
        
        this.shootAngle = 0;
        this.bowDraw = 0;
        
        this.pendingShot = null;
    }

    update(keys, prevKeys, targetX, targetY) {
        this.animTimer++;
        if (this.animTimer > 10) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }

        if (this.hurtFlash > 0) {
            this.hurtFlash--;
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }

        if (this.specialCooldownRemaining > 0) {
            this.specialCooldownRemaining--;
        }

        this.pendingShot = null;
        this.velocityX = 0;
        this.isMoving = false;

        if (!this.isEnemy) {
            this.handlePlayerInput(keys, prevKeys);
        }

        if (this.velocityX !== 0) {
            this.x += this.velocityX;
            this.isMoving = true;
        }

        this.x = Math.max(50, Math.min(GAME_CONFIG.CANVAS_WIDTH - 50, this.x));

        if (this.isCharging) {
            this.chargeTime++;
            if (this.chargeEffect) {
                this.chargeEffect.update(this.x, this.y - 40);
            }
        }

        this.updateAim(targetX, targetY);
        
        return this.pendingShot;
    }

    handlePlayerInput(keys, prevKeys) {
        if (!this.isCharging) {
            if (keys.ArrowLeft || keys.KeyA) {
                this.velocityX = -this.moveSpeed;
                this.facingRight = false;
            }
            if (keys.ArrowRight || keys.KeyD) {
                this.velocityX = this.moveSpeed;
                this.facingRight = true;
            }
        }

        this.isCrouching = (keys.ArrowDown || keys.KeyS) && !this.isCharging;

        if (this.attackCooldown <= 0 && !this.isCharging) {
            if (keys.KeyJ) {
                this.startCharge('normal');
                this.pendingShot = this.releaseCharge();
            }
        }

        if (!this.isCharging && this.attackCooldown <= 0) {
            if (this.isKeyPressed('KeyK', keys, prevKeys)) {
                this.startCharge('charged');
            }
            if (this.isKeyPressed('KeyL', keys, prevKeys) && this.specialCooldownRemaining <= 0) {
                this.startCharge('special');
            }
        }

        if (this.isCharging && this.chargeType !== 'normal') {
            const releaseKey = this.getReleaseKey(this.chargeType);
            if (this.isKeyReleased(releaseKey, keys, prevKeys)) {
                this.pendingShot = this.releaseCharge();
            }
        }
    }

    isKeyPressed(keyCode, keys, prevKeys) {
        return keys[keyCode] && !prevKeys[keyCode];
    }

    isKeyReleased(keyCode, keys, prevKeys) {
        return !keys[keyCode] && prevKeys[keyCode];
    }

    getReleaseKey(chargeType) {
        switch (chargeType) {
            case 'normal': return 'KeyJ';
            case 'charged': return 'KeyK';
            case 'special': return 'KeyL';
            default: return 'KeyJ';
        }
    }

    startCharge(type) {
        this.isCharging = true;
        this.chargeType = type;
        this.chargeTime = 0;
        const arrowType = this.getArrowType(type);
        this.chargeEffect = new ChargeEffect(this.x, this.y - 40, arrowType.color);
    }

    releaseCharge() {
        if (!this.isCharging) return null;

        const arrowType = this.getArrowType(this.chargeType);
        const chargeMultiplier = Math.min(1 + this.chargeTime / arrowType.chargeTime, 2);
        const damage = Math.floor(arrowType.damage * chargeMultiplier);
        
        const modifiedType = { ...arrowType, damage };
        
        if (this.chargeType === 'special') {
            modifiedType.damage = this.specialDamage;
            this.specialCooldownRemaining = this.specialCooldown;
            
            if (this.character.id === 'balanced') {
                modifiedType.piercing = true;
            } else if (this.character.id === 'power') {
                modifiedType.explosive = true;
                modifiedType.explosionRadius = 80;
            } else if (this.character.id === 'speed') {
                modifiedType.homing = true;
            }
        }

        this.attackCooldown = arrowType.cooldown;
        this.isCharging = false;
        this.chargeEffect = null;
        
        const angle = this.shootAngle;
        const startX = this.x + (this.facingRight ? 30 : -30);
        const startY = this.y - 40;
        
        this.chargeTime = 0;
        this.chargeType = null;

        return { x: startX, y: startY, angle, arrowType: modifiedType, owner: this.isEnemy ? 'enemy' : 'player' };
    }

    getArrowType(type) {
        switch (type) {
            case 'normal': return { ...ARROW_TYPES.NORMAL };
            case 'charged': return { ...ARROW_TYPES.CHARGED };
            case 'special': return { ...ARROW_TYPES.SPECIAL };
            default: return { ...ARROW_TYPES.NORMAL };
        }
    }

    updateAim(targetX, targetY) {
        const dx = targetX - this.x;
        const dy = targetY - (this.y - 40);
        this.shootAngle = Math.atan2(dy, dx);
        this.bowDraw = Math.min(1, this.chargeTime / 60);
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        this.hurtFlash = 15;
    }

    isDead() {
        return this.health <= 0;
    }

    getSpecialCooldownPercent() {
        return 1 - (this.specialCooldownRemaining / this.specialCooldown);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        if (!this.facingRight) {
            ctx.scale(-1, 1);
        }

        if (this.hurtFlash > 0 && this.hurtFlash % 4 < 2) {
            ctx.globalAlpha = 0.5;
        }

        const bodyColor = this.hurtFlash > 0 ? '#ff4444' : (this.isEnemy ? '#aa4444' : '#44aaff');
        const lineColor = this.hurtFlash > 0 ? '#ff6666' : (this.isEnemy ? '#cc6666' : '#66ccff');

        if (this.isCrouching) {
            this.drawCrouching(ctx, bodyColor, lineColor);
        } else {
            this.drawStanding(ctx, bodyColor, lineColor);
        }

        this.drawBow(ctx);

        if (this.chargeEffect) {
            ctx.restore();
            this.chargeEffect.draw(ctx);
            return;
        }

        ctx.restore();
    }

    drawStanding(ctx, bodyColor, lineColor) {
        const legOffset = this.isMoving ? Math.sin(this.animFrame * Math.PI / 2) * 8 : 0;
        
        ctx.strokeStyle = bodyColor;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(-12 + legOffset, -30);
        ctx.moveTo(8, 0);
        ctx.lineTo(12 - legOffset, -30);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(0, -60);
        ctx.stroke();

        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(0, -75, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(5, -78, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(6, -78, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = bodyColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, -60);
        ctx.lineTo(-15, -45);
        ctx.moveTo(0, -60);
        ctx.lineTo(25, -50);
        ctx.stroke();
    }

    drawCrouching(ctx, bodyColor, lineColor) {
        ctx.strokeStyle = bodyColor;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.lineTo(-8, -15);
        ctx.lineTo(8, -15);
        ctx.lineTo(12, 0);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(0, -35);
        ctx.stroke();

        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(0, -50, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(5, -53, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(6, -53, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = bodyColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, -35);
        ctx.lineTo(-12, -25);
        ctx.moveTo(0, -35);
        ctx.lineTo(20, -30);
        ctx.stroke();
    }

    drawBow(ctx) {
        const aimAngle = this.shootAngle;
        const adjustedAngle = this.facingRight ? aimAngle : Math.PI - aimAngle;
        
        ctx.save();
        const armY = this.isCrouching ? -30 : -50;
        ctx.translate(20, armY);
        ctx.rotate(adjustedAngle);

        const bowColor = '#8B4513';
        const stringColor = '#D2B48C';

        ctx.strokeStyle = bowColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 25, -Math.PI / 2.5, Math.PI / 2.5);
        ctx.stroke();

        const drawOffset = this.bowDraw * 15;
        ctx.strokeStyle = stringColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -22);
        ctx.lineTo(-drawOffset, 0);
        ctx.lineTo(0, 22);
        ctx.stroke();

        if (this.isCharging) {
            const arrowColor = this.getArrowType(this.chargeType).color;
            ctx.strokeStyle = arrowColor;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-drawOffset, 0);
            ctx.lineTo(25, 0);
            ctx.stroke();
            
            ctx.fillStyle = arrowColor;
            ctx.beginPath();
            ctx.moveTo(25, 0);
            ctx.lineTo(18, -4);
            ctx.lineTo(18, 4);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }

    serialize() {
        return {
            id: this.id,
            characterId: this.character.id,
            x: this.x,
            y: this.y,
            health: this.health,
            maxHealth: this.maxHealth,
            isEnemy: this.isEnemy,
            facingRight: this.facingRight,
            specialCooldownRemaining: this.specialCooldownRemaining
        };
    }

    static deserialize(data) {
        const charType = Object.values(CHARACTER_TYPES).find(c => c.id === data.characterId);
        const player = new Player(charType, data.isEnemy);
        player.id = data.id;
        player.x = data.x;
        player.y = data.y;
        player.health = data.health;
        player.maxHealth = data.maxHealth;
        player.facingRight = data.facingRight;
        player.specialCooldownRemaining = data.specialCooldownRemaining;
        return player;
    }
}
