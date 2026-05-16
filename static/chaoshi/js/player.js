class Player {
    constructor(characterType) {
        const config = CONSTANTS.CHARACTER_TYPES[characterType];
        this.type = characterType;
        this.name = config.name;
        this.maxLife = config.maxLife;
        this.life = config.maxLife;
        this.baseSpeed = config.speed;
        this.speed = config.speed;
        this.jumpForce = config.jumpForce;
        this.pickupRange = config.pickupRange;
        this.specialAbility = config.specialAbility;
        this.icon = config.icon;
        
        this.x = 100;
        this.y = CONSTANTS.GROUND_Y - 60;
        this.width = 50;
        this.height = 60;
        this.vx = 0;
        this.vy = 0;
        
        this.isJumping = false;
        this.isCrouching = false;
        this.isDashing = false;
        this.hasShield = false;
        this.hasCart = false;
        this.facingRight = true;
        
        this.dashCooldown = 0;
        this.cartCooldown = 0;
        this.shieldCooldown = 0;
        
        this.shieldTimer = 0;
        this.cartTimer = 0;
        this.dashTimer = 0;
        
        this.money = 0;
        this.itemCount = 0;
        
        this.keySequence = [];
        this.lastKeyTime = 0;
    }
    
    update(keys, deltaTime) {
        if (this.dashCooldown > 0) this.dashCooldown -= deltaTime;
        if (this.cartCooldown > 0) this.cartCooldown -= deltaTime;
        if (this.shieldCooldown > 0) this.shieldCooldown -= deltaTime;
        
        if (this.shieldTimer > 0) {
            this.shieldTimer -= deltaTime;
            if (this.shieldTimer <= 0) this.hasShield = false;
        }
        if (this.cartTimer > 0) {
            this.cartTimer -= deltaTime;
            if (this.cartTimer <= 0) this.hasCart = false;
        }
        if (this.dashTimer > 0) {
            this.dashTimer -= deltaTime;
            if (this.dashTimer <= 0) {
                this.isDashing = false;
                this.speed = this.baseSpeed;
            }
        }
        
        this.isCrouching = keys['ArrowDown'] || keys['KeyS'];
        
        if (!this.isDashing) {
            if (keys['ArrowLeft'] || keys['KeyA']) {
                this.vx = -this.speed;
                this.facingRight = false;
            } else if (keys['ArrowRight'] || keys['KeyD']) {
                this.vx = this.speed;
                this.facingRight = true;
            } else {
                this.vx *= 0.8;
            }
        }
        
        if ((keys['ArrowUp'] || keys['KeyW']) && !this.isJumping) {
            this.vy = -this.jumpForce;
            this.isJumping = true;
        }
        
        this.vy += CONSTANTS.GRAVITY;
        
        this.x += this.vx;
        this.y += this.vy;
        
        this.x = Math.max(0, Math.min(CONSTANTS.CANVAS_WIDTH - this.width, this.x));
        
        if (this.y >= CONSTANTS.GROUND_Y - this.height) {
            this.y = CONSTANTS.GROUND_Y - this.height;
            this.vy = 0;
            this.isJumping = false;
        }
        
        if (this.isCrouching) {
            this.height = 35;
        } else {
            this.height = 60;
        }
    }
    
    dash() {
        if (this.dashCooldown <= 0 && !this.isDashing) {
            this.isDashing = true;
            const config = CONSTANTS.CHARACTER_TYPES[this.type];
            this.speed = config.dashSpeed || 16;
            this.vx = this.facingRight ? this.speed : -this.speed;
            this.dashTimer = 300;
            this.dashCooldown = CONSTANTS.SKILLS.dashCooldown;
            return true;
        }
        return false;
    }
    
    activateShield() {
        if (this.shieldCooldown <= 0 && !this.hasShield) {
            this.hasShield = true;
            const config = CONSTANTS.CHARACTER_TYPES[this.type];
            this.shieldTimer = config.shieldDuration || 3000;
            this.shieldCooldown = CONSTANTS.SKILLS.shieldCooldown;
            return true;
        }
        return false;
    }
    
    activateCart() {
        if (this.cartCooldown <= 0 && !this.hasCart) {
            this.hasCart = true;
            this.cartTimer = CONSTANTS.SKILLS.cartDuration;
            this.cartCooldown = CONSTANTS.SKILLS.cartCooldown;
            return true;
        }
        return false;
    }
    
    pickupProduct(product) {
        let multiplier = 1;
        if (this.specialAbility === 'doublePickup') {
            multiplier = 2;
        }
        
        const earnedMoney = product.price * multiplier;
        this.money += earnedMoney;
        this.itemCount++;
        
        return earnedMoney;
    }
    
    takeDamage() {
        if (this.hasShield) {
            return false;
        }
        this.life--;
        return true;
    }
    
    isAlive() {
        return this.life > 0;
    }
    
    getPickupRange() {
        if (this.hasCart) {
            return CONSTANTS.SKILLS.cartRange;
        }
        return this.pickupRange;
    }
    
    getState() {
        return {
            type: this.type,
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            life: this.life,
            money: this.money,
            itemCount: this.itemCount,
            isJumping: this.isJumping,
            isCrouching: this.isCrouching,
            isDashing: this.isDashing,
            hasShield: this.hasShield,
            hasCart: this.hasCart,
            facingRight: this.facingRight,
            dashCooldown: this.dashCooldown,
            cartCooldown: this.cartCooldown,
            shieldCooldown: this.shieldCooldown,
            shieldTimer: this.shieldTimer,
            cartTimer: this.cartTimer,
            dashTimer: this.dashTimer
        };
    }
    
    loadState(state) {
        this.x = state.x;
        this.y = state.y;
        this.vx = state.vx;
        this.vy = state.vy;
        this.life = state.life;
        this.money = state.money;
        this.itemCount = state.itemCount;
        this.isJumping = state.isJumping;
        this.isCrouching = state.isCrouching;
        this.isDashing = state.isDashing;
        this.hasShield = state.hasShield;
        this.hasCart = state.hasCart;
        this.facingRight = state.facingRight;
        this.dashCooldown = state.dashCooldown;
        this.cartCooldown = state.cartCooldown;
        this.shieldCooldown = state.shieldCooldown;
        this.shieldTimer = state.shieldTimer;
        this.cartTimer = state.cartTimer;
        this.dashTimer = state.dashTimer;
    }
}