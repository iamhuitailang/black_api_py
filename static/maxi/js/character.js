class Character {
    constructor(data, isPlayer = true, side = 'left') {
        this.data = data;
        this.isPlayer = isPlayer;
        this.side = side;
        
        this.maxHealth = data.maxHealth;
        this.health = data.maxHealth;
        this.attack = data.attack;
        this.defense = data.defense;
        this.moveSpeed = GameConfig.MOVE_SPEEDS[data.moveSpeed];
        this.atmosphere = 0;
        
        this.x = side === 'left' ? 200 : GameConfig.CANVAS_WIDTH - 200;
        this.y = GameConfig.GROUND_Y;
        this.velocityY = 0;
        this.velocityX = 0;
        this.facingRight = side === 'left';
        
        this.width = 60;
        this.height = 100;
        
        this.state = 'idle';
        this.animFrame = 0;
        this.animTimer = 0;
        
        this.isCrouching = false;
        this.isJumping = false;
        this.isAttacking = false;
        this.isBlocking = false;
        this.isStunned = false;
        this.isInvincible = false;
        
        this.currentAttack = null;
        this.attackTimer = 0;
        this.attackPhase = 'idle';
        this.attackHasHit = false;
        
        this.stunTimer = 0;
        this.invincibleTimer = 0;
        this.hitFlashTimer = 0;
        
        this.projectiles = [];
        
        this.attackCooldown = 0;
    }
    
    update(deltaTime, opponent) {
        this.updateTimers(deltaTime);
        this.updatePhysics(deltaTime);
        this.updateAttackState(deltaTime, opponent);
        this.updateGeneralState(deltaTime);
        this.updateProjectiles(deltaTime, opponent);
    }
    
    updateTimers(deltaTime) {
        if (this.stunTimer > 0) {
            this.stunTimer -= deltaTime;
            if (this.stunTimer <= 0) {
                this.isStunned = false;
                this.stunTimer = 0;
            }
        }
        
        if (this.invincibleTimer > 0) {
            this.invincibleTimer -= deltaTime;
            if (this.invincibleTimer <= 0) {
                this.isInvincible = false;
                this.invincibleTimer = 0;
            }
        }
        
        if (this.hitFlashTimer > 0) {
            this.hitFlashTimer -= deltaTime;
            if (this.hitFlashTimer <= 0) {
                this.hitFlashTimer = 0;
            }
        }
        
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
            if (this.attackCooldown < 0) this.attackCooldown = 0;
        }
    }
    
    updatePhysics(deltaTime) {
        if (this.y < GameConfig.GROUND_Y) {
            this.velocityY += GameConfig.GRAVITY;
        }
        
        this.y += this.velocityY;
        this.x += this.velocityX;
        
        if (this.y >= GameConfig.GROUND_Y) {
            this.y = GameConfig.GROUND_Y;
            this.velocityY = 0;
            this.isJumping = false;
        }
        
        this.x = Math.max(50, Math.min(GameConfig.CANVAS_WIDTH - 50, this.x));
        
        if (!this.isAttacking) {
            this.velocityX *= 0.85;
        }
    }
    
    updateAttackState(deltaTime, opponent) {
        if (!this.isAttacking || !this.currentAttack) return;
        
        this.attackTimer += deltaTime;
        const move = this.currentAttack;
        
        if (this.attackPhase === 'startup') {
            if (this.attackTimer >= move.startupTime) {
                this.attackPhase = 'active';
                this.attackTimer = 0;
                console.log(`${this.data.name} 开始攻击: ${move.name}`);
            }
        } else if (this.attackPhase === 'active') {
            if (!this.attackHasHit && this.checkAttackHit(opponent)) {
                this.applyAttackDamage(opponent);
                this.attackHasHit = true;
                console.log(`${this.data.name} 命中! 伤害: ${move.baseDamage + this.attack}`);
            }
            
            if (this.attackTimer >= 0.15) {
                this.attackPhase = 'recovery';
                this.attackTimer = 0;
            }
        } else if (this.attackPhase === 'recovery') {
            if (this.attackTimer >= move.recoveryTime) {
                this.endAttack();
            }
        }
    }
    
    updateGeneralState(deltaTime) {
        if (this.isStunned || this.isAttacking) return;
        
        if (this.isJumping) {
            this.state = 'jump';
        } else if (this.isCrouching) {
            this.state = 'crouch';
        } else if (Math.abs(this.velocityX) > 0.5) {
            this.state = 'walk';
        } else {
            this.state = 'idle';
        }
        
        this.animTimer += deltaTime;
        if (this.animTimer >= 0.15) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
    }
    
    checkAttackHit(opponent) {
        const move = this.currentAttack;
        if (!move) return false;
        
        const range = GameConfig.ATTACK_RANGES[move.range];
        const dx = Math.abs(this.x - opponent.x);
        const dy = Math.abs(this.y - opponent.y);
        
        const facingOpponent = (this.facingRight && opponent.x > this.x) ||
                               (!this.facingRight && opponent.x < this.x);
        
        const hit = dx < range && dy < 120 && facingOpponent;
        return hit;
    }
    
    applyAttackDamage(opponent) {
        const move = this.currentAttack;
        if (!move) return;
        
        let baseDamage = move.baseDamage + this.attack;
        
        if (opponent.isBlocking && !opponent.isJumping) {
            let reduction = 0.5;
            
            if (opponent.atmosphere >= DefenseMoves.perfectBlock.cost) {
                opponent.atmosphere -= DefenseMoves.perfectBlock.cost;
                reduction = 1;
                console.log('完美格挡!');
            }
            
            baseDamage *= (1 - reduction);
        }
        
        const finalDamage = Math.max(1, Math.floor(baseDamage - opponent.defense * 0.5));
        
        const hits = move.multiHit || 1;
        for (let i = 0; i < hits; i++) {
            setTimeout(() => {
                if (opponent && opponent.health > 0) {
                    opponent.takeDamage(Math.ceil(finalDamage / hits));
                }
            }, i * 80);
        }
        
        this.atmosphere = Math.min(GameConfig.MAX_ATMOSPHERE, this.atmosphere + 8);
        
        if (move.iframe) {
            this.isInvincible = true;
            this.invincibleTimer = 0.4;
        }
        
        if (move.stun) {
            opponent.isStunned = true;
            opponent.stunTimer = 0.4;
        }
        
        if (move.type === 'projectile') {
            this.fireProjectile();
        }
    }
    
    fireProjectile() {
        const projectile = {
            x: this.x + (this.facingRight ? 40 : -40),
            y: this.y - 40,
            velocityX: this.facingRight ? 10 : -10,
            damage: this.currentAttack.baseDamage + this.attack * 0.5,
            active: true,
            lifetime: 3
        };
        this.projectiles.push(projectile);
    }
    
    updateProjectiles(deltaTime, opponent) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.x += proj.velocityX;
            proj.lifetime -= deltaTime;
            
            if (proj.active && 
                Math.abs(proj.x - opponent.x) < 50 &&
                Math.abs(proj.y - opponent.y) < 70) {
                
                proj.active = false;
                let damage = proj.damage - opponent.defense * 0.3;
                
                if (opponent.isBlocking && !opponent.isJumping) {
                    damage *= 0.5;
                }
                
                damage = Math.max(1, Math.floor(damage));
                opponent.takeDamage(damage);
            }
            
            if (proj.x < 0 || proj.x > GameConfig.CANVAS_WIDTH || !proj.active || proj.lifetime <= 0) {
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    takeDamage(damage) {
        if (this.isInvincible) {
            console.log(`${this.data.name} 免疫伤害!`);
            return;
        }
        
        this.health = Math.max(0, this.health - damage);
        this.hitFlashTimer = 0.3;
        
        console.log(`${this.data.name} 受到 ${damage} 点伤害，剩余血量: ${this.health}`);
        
        if (!this.isAttacking) {
            this.velocityX *= 0.3;
        }
        
        this.isStunned = true;
        this.stunTimer = 0.15;
    }
    
    startAttack(moveId) {
        if (this.isAttacking || this.isStunned) return false;
        if (this.attackCooldown > 0) return false;
        
        let move;
        if (moveId === 'special') {
            move = SpecialMoves[this.data.specialMove];
        } else {
            move = AttackMoves[moveId];
        }
        
        if (!move) {
            console.warn('未找到招式:', moveId);
            return false;
        }
        
        if (move.airborne && !this.isJumping) {
            this.jump();
        }
        
        this.currentAttack = move;
        this.isAttacking = true;
        this.attackPhase = 'startup';
        this.attackTimer = 0;
        this.attackHasHit = false;
        this.state = 'attack';
        this.attackCooldown = 0.15;
        
        console.log(`${this.data.name} 开始出招: ${move.name} (${moveId})`);
        return true;
    }
    
    endAttack() {
        if (this.currentAttack) {
            console.log(`${this.data.name} 收招: ${this.currentAttack.name}`);
        }
        this.isAttacking = false;
        this.currentAttack = null;
        this.attackPhase = 'idle';
        this.attackTimer = 0;
        this.attackHasHit = false;
    }
    
    moveLeft() {
        if (this.isAttacking || this.isStunned) return;
        this.velocityX = -this.moveSpeed;
        this.facingRight = false;
    }
    
    moveRight() {
        if (this.isAttacking || this.isStunned) return;
        this.velocityX = this.moveSpeed;
        this.facingRight = true;
    }
    
    jump() {
        if (this.isJumping || this.isStunned) return;
        if (this.isAttacking && !this.currentAttack?.airborne) return;
        
        this.velocityY = -14;
        this.isJumping = true;
        this.isCrouching = false;
    }
    
    crouch(isCrouching) {
        if (this.isJumping || this.isAttacking || this.isStunned) return;
        this.isCrouching = isCrouching;
    }
    
    block(isBlocking) {
        if (this.isJumping || this.isAttacking || this.isStunned) return;
        this.isBlocking = isBlocking;
    }
    
    serialize() {
        return {
            dataId: this.data.id,
            isPlayer: this.isPlayer,
            side: this.side,
            health: this.health,
            atmosphere: this.atmosphere,
            x: this.x,
            y: this.y,
            velocityY: this.velocityY,
            velocityX: this.velocityX,
            facingRight: this.facingRight,
            state: this.state,
            isCrouching: this.isCrouching,
            isJumping: this.isJumping,
            isAttacking: this.isAttacking,
            isBlocking: this.isBlocking,
            isStunned: this.isStunned,
            isInvincible: this.isInvincible
        };
    }
    
    static deserialize(data) {
        const charData = CharacterData[data.dataId];
        const char = new Character(charData, data.isPlayer, data.side);
        
        char.health = data.health;
        char.atmosphere = data.atmosphere;
        char.x = data.x;
        char.y = data.y;
        char.velocityY = data.velocityY;
        char.velocityX = data.velocityX;
        char.facingRight = data.facingRight;
        char.state = data.state;
        char.isCrouching = data.isCrouching;
        char.isJumping = data.isJumping;
        char.isAttacking = data.isAttacking;
        char.isBlocking = data.isBlocking;
        char.isStunned = data.isStunned;
        char.isInvincible = data.isInvincible;
        
        return char;
    }
}
