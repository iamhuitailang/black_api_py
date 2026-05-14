class Character {
    constructor(characterId, isPlayer, x) {
        const data = GameData.characters[characterId];
        this.id = characterId;
        this.name = data.name;
        this.isPlayer = isPlayer;
        this.maxHealth = data.maxHealth;
        this.health = data.maxHealth;
        this.attackPower = data.attack;
        this.defense = data.defense;
        this.speed = data.speed;
        this.specialDamage = data.specialDamage;
        this.color = data.color;
        this.secondaryColor = data.secondaryColor;
        this.moves = data.moves;

        this.x = x;
        this.y = 500;
        this.width = 80;
        this.height = 120;
        this.velocityX = 0;
        this.velocityY = 0;
        this.facingRight = isPlayer;

        this.state = GameData.states.IDLE;
        this.previousState = GameData.states.IDLE;
        this.stateTimer = 0;

        this.currentAttack = null;
        this.attackTimer = 0;
        this.attackPhase = 'startup';
        this.hasHit = false;

        this.invincible = false;
        this.invincibleTimer = 0;

        this.animationFrame = 0;
        this.animationTimer = 0;

        this.projectiles = [];
        this.hitEffect = null;
    }

    update(deltaTime, opponent, groundY) {
        this.animationTimer += deltaTime;
        if (this.animationTimer > 100) {
            this.animationFrame = (this.animationFrame + 1) % 4;
            this.animationTimer = 0;
        }

        if (this.invincible) {
            this.invincibleTimer -= deltaTime;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }

        if (this.state === GameData.states.HIT || this.state === GameData.states.KNOCKDOWN) {
            this.stateTimer -= deltaTime;
            if (this.stateTimer <= 0) {
                this.state = GameData.states.IDLE;
            }
            return;
        }

        if (this.state === GameData.states.ATTACK || this.state === GameData.states.SPECIAL) {
            this.updateAttack(deltaTime, opponent);
            return;
        }

        this.velocityY += 0.8;
        this.y += this.velocityY;

        if (this.y > groundY - this.height) {
            this.y = groundY - this.height;
            this.velocityY = 0;
            if (this.state === GameData.states.JUMP) {
                this.state = GameData.states.IDLE;
            }
        }

        this.updateProjectiles(deltaTime, opponent);

        if (this.hitEffect) {
            this.hitEffect.timer -= deltaTime;
            if (this.hitEffect.timer <= 0) {
                this.hitEffect = null;
            }
        }
    }

    updateAttack(deltaTime, opponent) {
        if (!this.currentAttack) return;

        this.attackTimer += deltaTime;
        const attackData = GameData.attacks[this.currentAttack];

        if (this.attackPhase === 'startup') {
            if (this.attackTimer >= attackData.startup) {
                this.attackPhase = 'active';
                this.onAttackActive();
            }
        } else if (this.attackPhase === 'active') {
            if (!this.hasHit) {
                this.checkAttackHit(opponent, attackData);
            }

            if (this.attackTimer >= attackData.startup + 150) {
                this.attackPhase = 'recovery';
            }
        } else if (this.attackPhase === 'recovery') {
            if (this.attackTimer >= attackData.startup + attackData.recovery) {
                this.finishAttack();
            }
        }

        this.updateProjectiles(deltaTime, opponent);
    }

    onAttackActive() {
        if (this.currentAttack === 'shoryuken') {
            this.velocityY = -12;
            this.invincible = true;
            this.invincibleTimer = 300;
        }
    }

    checkAttackHit(opponent, attackData) {
        if (attackData.type === 'projectile') {
            this.fireProjectile(attackData);
            this.hasHit = true;
            return;
        }

        const attackX = this.facingRight ? this.x + this.width : this.x - attackData.range;
        const attackWidth = attackData.range;

        if (this.checkCollision(
            { x: attackX, y: this.y, width: attackWidth, height: this.height },
            opponent
        )) {
            this.dealDamage(opponent, attackData);
            this.hasHit = true;
        }
    }

    fireProjectile(attackData) {
        const projectile = {
            x: this.facingRight ? this.x + this.width : this.x,
            y: this.y + this.height / 2 - 15,
            width: 30,
            height: 30,
            velocityX: this.facingRight ? attackData.speed : -attackData.speed,
            damage: attackData.damage,
            color: this.color,
            active: true
        };
        this.projectiles.push(projectile);
    }

    updateProjectiles(deltaTime, opponent) {
        this.projectiles = this.projectiles.filter(projectile => {
            if (!projectile.active) return false;

            projectile.x += projectile.velocityX;

            if (projectile.x < 0 || projectile.x > 1280) {
                return false;
            }

            if (this.checkCollision(projectile, opponent)) {
                this.dealDamage(opponent, { damage: projectile.damage });
                return false;
            }

            return true;
        });
    }

    dealDamage(opponent, attackData) {
        let damage = attackData.damage + this.attackPower - opponent.defense;
        damage = Math.max(damage, 1);

        if (opponent.state === GameData.states.BLOCK) {
            damage = Math.floor(damage * 0.2);
        }

        opponent.takeDamage(damage);
        
        opponent.hitEffect = {
            x: opponent.x + opponent.width / 2,
            y: opponent.y + opponent.height / 2,
            timer: 200
        };
    }

    takeDamage(damage) {
        this.health = Math.max(0, this.health - damage);
        this.state = damage > 15 ? GameData.states.KNOCKDOWN : GameData.states.HIT;
        this.stateTimer = damage > 15 ? 500 : 200;
        
        this.velocityX = this.facingRight ? -3 : 3;
    }

    finishAttack() {
        this.state = GameData.states.IDLE;
        this.currentAttack = null;
        this.attackTimer = 0;
        this.attackPhase = 'startup';
        this.hasHit = false;
        this.invincible = false;
    }

    checkCollision(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    moveLeft() {
        if (this.canMove()) {
            this.velocityX = -this.speed;
            this.state = GameData.states.WALK_BACKWARD;
        }
    }

    moveRight() {
        if (this.canMove()) {
            this.velocityX = this.speed;
            this.state = GameData.states.WALK_FORWARD;
        }
    }

    crouch() {
        if (this.canMove()) {
            this.state = GameData.states.CROUCH;
            this.velocityX = 0;
        }
    }

    jump() {
        if (this.canMove() && this.velocityY === 0) {
            this.velocityY = -15;
            this.state = GameData.states.JUMP;
        }
    }

    attack(attackType) {
        if (this.canAttack()) {
            this.state = GameData.states.ATTACK;
            this.currentAttack = attackType;
            this.attackTimer = 0;
            this.attackPhase = 'startup';
            this.hasHit = false;
            this.velocityX = 0;
        }
    }

    specialMove(moveName) {
        if (this.canAttack()) {
            this.state = GameData.states.SPECIAL;
            this.currentAttack = moveName;
            this.attackTimer = 0;
            this.attackPhase = 'startup';
            this.hasHit = false;
            this.velocityX = 0;

            if (GameData.attacks[moveName].invincible) {
                this.invincible = true;
                this.invincibleTimer = 300;
            }
        }
    }

    block() {
        if (this.canMove()) {
            this.state = GameData.states.BLOCK;
            this.velocityX = 0;
        }
    }

    stopMoving() {
        if (this.state === GameData.states.WALK_FORWARD || 
            this.state === GameData.states.WALK_BACKWARD ||
            this.state === GameData.states.CROUCH) {
            this.state = GameData.states.IDLE;
        }
        this.velocityX = 0;
    }

    canMove() {
        return this.state === GameData.states.IDLE ||
               this.state === GameData.states.WALK_FORWARD ||
               this.state === GameData.states.WALK_BACKWARD ||
               this.state === GameData.states.CROUCH ||
               this.state === GameData.states.JUMP;
    }

    canAttack() {
        return this.state === GameData.states.IDLE ||
               this.state === GameData.states.WALK_FORWARD ||
               this.state === GameData.states.WALK_BACKWARD ||
               this.state === GameData.states.CROUCH;
    }

    applyPosition() {
        this.x += this.velocityX;
        this.x = Math.max(0, Math.min(1280 - this.width, this.x));
    }

    getState() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            health: this.health,
            maxHealth: this.maxHealth,
            state: this.state,
            facingRight: this.facingRight,
            velocityX: this.velocityX,
            velocityY: this.velocityY,
            currentAttack: this.currentAttack,
            attackPhase: this.attackPhase,
            attackTimer: this.attackTimer,
            invincible: this.invincible,
            projectiles: this.projectiles,
            hitEffect: this.hitEffect
        };
    }

    loadState(state) {
        this.x = state.x;
        this.y = state.y;
        this.health = state.health;
        this.maxHealth = state.maxHealth || this.maxHealth;
        this.state = state.state;
        this.facingRight = state.facingRight;
        this.velocityX = state.velocityX || 0;
        this.velocityY = state.velocityY || 0;
        this.currentAttack = state.currentAttack;
        this.attackPhase = state.attackPhase;
        this.attackTimer = state.attackTimer || 0;
        this.invincible = state.invincible || false;
        this.projectiles = state.projectiles || [];
        this.hitEffect = state.hitEffect || null;
    }
}