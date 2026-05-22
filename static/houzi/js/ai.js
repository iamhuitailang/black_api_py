class AIPlayer {
    constructor(character, x, y) {
        this.character = character;
        this.x = x;
        this.y = y;
        this.width = GameConfig.AI.WIDTH;
        this.height = GameConfig.AI.HEIGHT;
        this.vx = 0;
        this.vy = 0;
        
        this.maxHp = GameConfig.AI.MAX_HP;
        this.hp = this.maxHp;
        this.speed = GameConfig.AI.MOVE_SPEED;
        this.jumpForce = GameConfig.AI.JUMP_FORCE;
        this.doubleJumpForce = GameConfig.PHYSICS.DOUBLE_JUMP_FORCE;
        
        this.isGrounded = false;
        this.canDoubleJump = false;
        this.facingRight = true;
        
        this.bananaCount = 0;
        this.isInvincible = false;
        this.invincibleTime = 0;
        
        this.targetBanana = null;
        this.targetObstacle = null;
        this.decisionTimer = 0;
        this.reactionTime = GameConfig.AI.REACTION_TIME;
        
        this.animFrame = 0;
        this.animTimer = 0;
        this.isMoving = false;
    }

    update(deltaTime, game) {
        this.decisionTimer += deltaTime;
        
        if (this.decisionTimer >= this.reactionTime) {
            this.decisionTimer = 0;
            this.makeDecision(game);
        }
        
        this.executeMovement();
        
        this.vy += GameConfig.PHYSICS.GRAVITY;
        this.vy = Math.min(this.vy, GameConfig.PHYSICS.MAX_FALL_SPEED);
        
        this.x += this.vx;
        this.y += this.vy;
        
        this.x = Math.max(this.width / 2, Math.min(GameConfig.CANVAS.WIDTH - this.width / 2, this.x));
        
        const groundY = GameConfig.CANVAS.GROUND_Y - this.height / 2;
        if (this.y >= groundY) {
            this.y = groundY;
            this.vy = 0;
            this.isGrounded = true;
            this.canDoubleJump = true;
        }
        
        if (this.isInvincible) {
            this.invincibleTime -= deltaTime;
            if (this.invincibleTime <= 0) {
                this.isInvincible = false;
            }
        }
        
        this.animTimer += deltaTime;
        if (this.animTimer > 100) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
    }

    makeDecision(game) {
        const bananas = game.bananas;
        const obstacles = game.obstacles;
        const player = game.player;
        
        this.targetBanana = null;
        this.targetObstacle = null;
        
        let nearestBanana = null;
        let nearestBananaDist = Infinity;
        
        for (let banana of bananas) {
            if (banana.collected) continue;
            const dist = Math.hypot(banana.x - this.x, banana.y - this.y);
            if (dist < nearestBananaDist) {
                nearestBananaDist = dist;
                nearestBanana = banana;
            }
        }
        
        let nearestObstacle = null;
        let nearestObstacleDist = Infinity;
        
        for (let obstacle of obstacles) {
            if (!obstacle.active) continue;
            const dist = Math.hypot(obstacle.x - this.x, obstacle.y - this.y);
            if (dist < nearestObstacleDist && dist < 200) {
                nearestObstacleDist = dist;
                nearestObstacle = obstacle;
            }
        }
        
        if (nearestObstacle && nearestObstacleDist < 100) {
            this.targetObstacle = nearestObstacle;
        } else {
            this.targetBanana = nearestBanana;
        }
    }

    executeMovement() {
        this.vx = 0;
        this.isMoving = false;
        
        if (this.targetObstacle) {
            const obstacle = this.targetObstacle;
            const dx = this.x - obstacle.x;
            const dy = Math.abs(obstacle.y - this.y);
            
            if (Math.abs(dx) > 5) {
                this.vx = dx > 0 ? this.speed : -this.speed;
                this.facingRight = dx < 0;
                this.isMoving = true;
            }
            
            if (obstacle.type === 'thorn' && this.isGrounded && Math.abs(dx) < 100) {
                this.vy = this.jumpForce * 1.2;
                this.isGrounded = false;
                this.canDoubleJump = true;
            } else if (obstacle.type !== 'thorn' && this.isGrounded && dy < 80) {
                this.vy = this.jumpForce;
                this.isGrounded = false;
                this.canDoubleJump = true;
            } else if (!this.isGrounded && this.canDoubleJump && dy < 60 && this.vy > -5) {
                this.vy = this.doubleJumpForce;
                this.canDoubleJump = false;
            }
        } else if (this.targetBanana) {
            const banana = this.targetBanana;
            const dx = banana.x - this.x;
            
            if (Math.abs(dx) > 5) {
                this.vx = dx > 0 ? this.speed : -this.speed;
                this.facingRight = dx > 0;
                this.isMoving = true;
            }
            
            if (this.isGrounded && banana.y < this.y - 30) {
                this.vy = this.jumpForce;
                this.isGrounded = false;
                this.canDoubleJump = true;
            } else if (!this.isGrounded && this.canDoubleJump && banana.y < this.y - 20 && this.vy > -3) {
                this.vy = this.doubleJumpForce;
                this.canDoubleJump = false;
            }
        } else {
            if (Math.random() < 0.02) {
                this.facingRight = !this.facingRight;
            }
            this.vx = this.facingRight ? this.speed * 0.5 : -this.speed * 0.5;
            this.isMoving = true;
            
            if (this.isGrounded && Math.random() < 0.01) {
                this.vy = this.jumpForce;
                this.isGrounded = false;
                this.canDoubleJump = true;
            }
        }
    }

    takeDamage(amount) {
        if (this.isInvincible) return false;
        
        this.hp -= amount;
        this.isInvincible = true;
        this.invincibleTime = 2000;
        
        if (this.hp < 0) this.hp = 0;
        return true;
    }

    addBanana(count = 1) {
        this.bananaCount += count;
    }

    draw(ctx) {
        ctx.save();
        
        const drawX = this.x - this.width / 2;
        const drawY = this.y - this.height / 2;
        
        if (this.isInvincible && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        this.drawAIMonkey(ctx, drawX, drawY);
        
        ctx.restore();
    }

    drawAIMonkey(ctx, x, y) {
        const w = this.width;
        const h = this.height;
        const bounceOffset = this.isMoving && this.isGrounded ? Math.sin(this.animFrame * Math.PI / 2) * 3 : 0;
        
        ctx.save();
        
        if (!this.facingRight) {
            ctx.translate(x + w, y - bounceOffset);
            ctx.scale(-1, 1);
            ctx.translate(-x, -(y - bounceOffset));
        }
        
        ctx.fillStyle = '#4A4A4A';
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2 + bounceOffset, w / 2.2, h / 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#5A5A5A';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 4 + bounceOffset, w / 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#E0E0E0';
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 4 + 5 + bounceOffset, w / 4, h / 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#F00';
        ctx.beginPath();
        ctx.arc(x + w / 2 - 6, y + h / 4 + bounceOffset, 3, 0, Math.PI * 2);
        ctx.arc(x + w / 2 + 6, y + h / 4 + bounceOffset, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 4 + 8 + bounceOffset, 3, 0, Math.PI);
        ctx.fill();
        
        ctx.fillStyle = '#5A5A5A';
        ctx.beginPath();
        ctx.arc(x + w / 2 - w / 2.5, y + h / 4 + bounceOffset, 8, 0, Math.PI * 2);
        ctx.arc(x + w / 2 + w / 2.5, y + h / 4 + bounceOffset, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#E0E0E0';
        ctx.beginPath();
        ctx.arc(x + w / 2 - w / 2.5, y + h / 4 + bounceOffset, 5, 0, Math.PI * 2);
        ctx.arc(x + w / 2 + w / 2.5, y + h / 4 + bounceOffset, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#5A5A5A';
        ctx.beginPath();
        ctx.ellipse(x + w / 2 - w / 2 + 5, y + h / 2 + bounceOffset, 8, 6, -0.3, 0, Math.PI * 2);
        ctx.ellipse(x + w / 2 + w / 2 - 5, y + h / 2 + bounceOffset, 8, 6, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#5A5A5A';
        ctx.beginPath();
        ctx.ellipse(x + w / 2 - 10, y + h / 2 + 10 + bounceOffset, 6, 12, 0, 0, Math.PI * 2);
        ctx.ellipse(x + w / 2 + 10, y + h / 2 + 10 + bounceOffset, 6, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#5A5A5A';
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
        
        ctx.fillStyle = '#FF4444';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('敌', x + w / 2, y - 10);
        
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
            x: this.x,
            y: this.y,
            hp: this.hp,
            bananaCount: this.bananaCount,
            vx: this.vx,
            vy: this.vy,
            facingRight: this.facingRight
        };
    }

    static fromJSON(data) {
        const ai = new AIPlayer({ id: 'enemy', emoji: '🙊', color: '#5A5A5A', stats: { speed: 1, jump: 1, hp: 1 } }, data.x, data.y);
        ai.hp = data.hp;
        ai.bananaCount = data.bananaCount || 0;
        ai.vx = data.vx || 0;
        ai.vy = data.vy || 0;
        ai.facingRight = data.facingRight !== false;
        return ai;
    }
}
