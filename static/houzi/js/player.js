class Player {
    constructor(character, x, y) {
        this.character = character;
        this.x = x;
        this.y = y;
        this.width = GameConfig.PLAYER.WIDTH;
        this.height = GameConfig.PLAYER.HEIGHT;
        this.vx = 0;
        this.vy = 0;
        
        const stats = character.stats;
        this.maxHp = Math.floor(GameConfig.PLAYER.MAX_HP * stats.hp);
        this.hp = this.maxHp;
        this.speed = GameConfig.PHYSICS.MOVE_SPEED * stats.speed;
        this.jumpForce = GameConfig.PHYSICS.JUMP_FORCE * stats.jump;
        this.doubleJumpForce = GameConfig.PHYSICS.DOUBLE_JUMP_FORCE * stats.jump;
        
        this.isGrounded = false;
        this.canDoubleJump = false;
        this.facingRight = true;
        
        this.isGliding = false;
        this.glideTimer = 0;
        this.maxGlideTime = 1500;
        this.hasShield = false;
        this.shieldTime = 0;
        
        this.isInvincible = false;
        this.invincibleTime = 0;
        
        this.bananaCount = 0;
        
        this.animFrame = 0;
        this.animTimer = 0;
        this.isMoving = false;
        
        this.skillCooldowns = {
            quickGrab: 0,
            shield: 0
        };
    }

    update(deltaTime) {
        this.vx = 0;
        this.isMoving = false;
        
        if (Input.isDown('left')) {
            this.vx = -this.speed;
            this.facingRight = false;
            this.isMoving = true;
        }
        if (Input.isDown('right')) {
            this.vx = this.speed;
            this.facingRight = true;
            this.isMoving = true;
        }
        
        if (Input.wasPressed('up')) {
            if (this.isGrounded) {
                this.vy = this.jumpForce;
                this.isGrounded = false;
                this.canDoubleJump = true;
                this.glideTimer = 0;
            } else if (this.canDoubleJump) {
                this.vy = this.doubleJumpForce;
                this.canDoubleJump = false;
                this.glideTimer = 0;
            }
        }
        
        const canGlide = this.character.skill === 'glide' && !this.isGrounded && Input.isDown('up') && this.vy > 0 && !this.canDoubleJump;
        
        if (canGlide && this.glideTimer < this.maxGlideTime) {
            this.isGliding = true;
            this.glideTimer += deltaTime;
            this.vy = Math.min(this.vy, GameConfig.PHYSICS.GLIDE_FALL_SPEED);
        } else {
            this.isGliding = false;
            this.vy += GameConfig.PHYSICS.GRAVITY;
            this.vy = Math.min(this.vy, GameConfig.PHYSICS.MAX_FALL_SPEED);
        }
        
        this.x += this.vx;
        this.y += this.vy;
        
        this.x = Math.max(this.width / 2, Math.min(GameConfig.CANVAS.WIDTH - this.width / 2, this.x));
        
        const groundY = GameConfig.CANVAS.GROUND_Y - this.height / 2;
        if (this.y >= groundY) {
            this.y = groundY;
            this.vy = 0;
            this.isGrounded = true;
            this.canDoubleJump = false;
            this.isGliding = false;
        }
        
        if (this.isInvincible) {
            this.invincibleTime -= deltaTime;
            if (this.invincibleTime <= 0) {
                this.isInvincible = false;
            }
        }
        
        if (this.hasShield) {
            this.shieldTime -= deltaTime;
            if (this.shieldTime <= 0) {
                this.hasShield = false;
            }
        }
        
        for (let skill in this.skillCooldowns) {
            if (this.skillCooldowns[skill] > 0) {
                this.skillCooldowns[skill] -= deltaTime;
            }
        }
        
        this.animTimer += deltaTime;
        if (this.animTimer > 100) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
    }

    takeDamage(amount) {
        if (this.isInvincible) return false;
        
        if (this.hasShield) {
            this.hasShield = false;
            this.shieldTime = 0;
            return true;
        }
        
        this.hp -= amount;
        this.isInvincible = true;
        this.invincibleTime = GameConfig.PLAYER.INVINCIBLE_TIME;
        
        if (this.hp < 0) this.hp = 0;
        
        return true;
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    addBanana(count = 1) {
        this.bananaCount += count;
    }

    useQuickGrab() {
        if (this.skillCooldowns.quickGrab > 0) return false;
        this.skillCooldowns.quickGrab = GameConfig.SKILL.QUICK_GRAB.COOLDOWN;
        return true;
    }

    useShield() {
        if (this.skillCooldowns.shield > 0 || this.hasShield) return false;
        this.skillCooldowns.shield = GameConfig.SKILL.SHIELD.COOLDOWN;
        this.hasShield = true;
        this.shieldTime = GameConfig.SKILL.SHIELD.DURATION;
        return true;
    }

    canUseSkill(skillName) {
        return this.skillCooldowns[skillName] <= 0;
    }

    getSkillCooldown(skillName) {
        return Math.max(0, this.skillCooldowns[skillName]);
    }

    draw(ctx) {
        ctx.save();
        
        const drawX = this.x - this.width / 2;
        const drawY = this.y - this.height / 2;
        
        if (this.isInvincible && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        if (this.hasShield) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        
        ctx.fillStyle = this.character.color;
        
        this.drawMonkey(ctx, drawX, drawY);
        
        if (this.isGliding) {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x - 30, this.y + 20);
            ctx.lineTo(this.x + 30, this.y + 20);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
    }

    drawMonkey(ctx, x, y) {
        const w = this.width;
        const h = this.height;
        const bounceOffset = this.isMoving && this.isGrounded ? Math.sin(this.animFrame * Math.PI / 2) * 3 : 0;
        
        ctx.save();
        
        if (!this.facingRight) {
            ctx.translate(x + w, y - bounceOffset);
            ctx.scale(-1, 1);
            ctx.translate(-x, -(y - bounceOffset));
        }
        
        ctx.fillStyle = this.character.color;
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2 + bounceOffset, w / 2.2, h / 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = this.character.color;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 4 + bounceOffset, w / 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFE4C4';
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 4 + 5 + bounceOffset, w / 4, h / 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + w / 2 - 6, y + h / 4 + bounceOffset, 3, 0, Math.PI * 2);
        ctx.arc(x + w / 2 + 6, y + h / 4 + bounceOffset, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(x + w / 2 - 5, y + h / 4 - 1 + bounceOffset, 1, 0, Math.PI * 2);
        ctx.arc(x + w / 2 + 7, y + h / 4 - 1 + bounceOffset, 1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 4 + 8 + bounceOffset, 3, 0, Math.PI);
        ctx.fill();
        
        ctx.fillStyle = this.character.color;
        ctx.beginPath();
        ctx.arc(x + w / 2 - w / 2.5, y + h / 4 + bounceOffset, 8, 0, Math.PI * 2);
        ctx.arc(x + w / 2 + w / 2.5, y + h / 4 + bounceOffset, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFE4C4';
        ctx.beginPath();
        ctx.arc(x + w / 2 - w / 2.5, y + h / 4 + bounceOffset, 5, 0, Math.PI * 2);
        ctx.arc(x + w / 2 + w / 2.5, y + h / 4 + bounceOffset, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = this.character.color;
        ctx.beginPath();
        ctx.ellipse(x + w / 2 - w / 2 + 5, y + h / 2 + bounceOffset, 8, 6, -0.3, 0, Math.PI * 2);
        ctx.ellipse(x + w / 2 + w / 2 - 5, y + h / 2 + bounceOffset, 8, 6, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = this.character.color;
        ctx.beginPath();
        if (this.isGliding) {
            ctx.ellipse(x + w / 2 - 8, y + h / 2 + 5 + bounceOffset, 8, 15, -0.5, 0, Math.PI * 2);
            ctx.ellipse(x + w / 2 + 8, y + h / 2 + 5 + bounceOffset, 8, 15, 0.5, 0, Math.PI * 2);
        } else {
            ctx.ellipse(x + w / 2 - 10, y + h / 2 + 10 + bounceOffset, 6, 12, 0, 0, Math.PI * 2);
            ctx.ellipse(x + w / 2 + 10, y + h / 2 + 10 + bounceOffset, 6, 12, 0, 0, Math.PI * 2);
        }
        ctx.fill();
        
        ctx.strokeStyle = this.character.color;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        const tailWave = Math.sin(Date.now() / 200) * 10;
        ctx.moveTo(x + w / 2 + (this.facingRight ? -10 : 10), y + h / 2 + 10 + bounceOffset);
        ctx.quadraticCurveTo(
            x + w / 2 + (this.facingRight ? -30 : 30), y + h / 2 + tailWave + bounceOffset,
            x + w / 2 + (this.facingRight ? -35 : 35), y + h / 2 - 10 + tailWave + bounceOffset
        );
        ctx.stroke();
        
        ctx.restore();
    }

    getBounds() {
        return {
            x: this.x - this.width / 2 + 5,
            y: this.y - this.height / 2 + 5,
            width: this.width - 10,
            height: this.height - 10
        };
    }

    getPickupRange() {
        return {
            x: this.x - GameConfig.PLAYER.PICKUP_RANGE,
            y: this.y - GameConfig.PLAYER.PICKUP_RANGE,
            width: GameConfig.PLAYER.PICKUP_RANGE * 2,
            height: GameConfig.PLAYER.PICKUP_RANGE * 2
        };
    }

    isDead() {
        return this.hp <= 0;
    }

    toJSON() {
        return {
            characterId: this.character.id,
            x: this.x,
            y: this.y,
            hp: this.hp,
            bananaCount: this.bananaCount,
            vx: this.vx,
            vy: this.vy,
            facingRight: this.facingRight,
            skillCooldowns: this.skillCooldowns
        };
    }

    static fromJSON(data, character) {
        const player = new Player(character, data.x, data.y);
        player.hp = data.hp;
        player.bananaCount = data.bananaCount || 0;
        player.vx = data.vx || 0;
        player.vy = data.vy || 0;
        player.facingRight = data.facingRight !== false;
        player.skillCooldowns = data.skillCooldowns || { quickGrab: 0, shield: 0 };
        return player;
    }
}
