class Cat {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = CONFIG.CANVAS_WIDTH / 2 - CONFIG.CAT.WIDTH / 2;
        this.y = CONFIG.CANVAS_HEIGHT - 150;
        this.width = CONFIG.CAT.WIDTH;
        this.height = CONFIG.CAT.HEIGHT;
        this.vx = 0;
        this.vy = 0;
        this.lives = CONFIG.CAT.INITIAL_LIVES;
        this.score = 0;
        this.isJumping = false;
        this.isHiding = false;
        this.isAttacking = false;
        this.attackType = null;
        this.attackCooldown = 0;
        this.facingRight = true;
        this.groundY = CONFIG.CANVAS_HEIGHT - 150;
        this.animFrame = 0;
        this.animTimer = 0;
    }
    
    update(keys, deltaTime) {
        this.animTimer += deltaTime;
        if (this.animTimer > 150) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
        
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
        
        if (keys.left) {
            this.vx = -CONFIG.CAT.MOVE_SPEED;
            this.facingRight = false;
        } else if (keys.right) {
            this.vx = CONFIG.CAT.MOVE_SPEED;
            this.facingRight = true;
        } else {
            this.vx = 0;
        }
        
        if (keys.up && !this.isJumping && !this.isHiding) {
            this.vy = CONFIG.CAT.JUMP_FORCE;
            this.isJumping = true;
        }
        
        if (keys.down && !this.isJumping) {
            this.isHiding = true;
            this.height = CONFIG.CAT.HEIGHT / 2;
        } else if (!keys.down && this.isHiding) {
            this.isHiding = false;
            this.height = CONFIG.CAT.HEIGHT;
        }
        
        this.vy += CONFIG.CAT.GRAVITY;
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.x < 0) this.x = 0;
        if (this.x > CONFIG.CANVAS_WIDTH - this.width) {
            this.x = CONFIG.CANVAS_WIDTH - this.width;
        }
        
        if (this.y >= this.groundY) {
            this.y = this.groundY;
            this.vy = 0;
            this.isJumping = false;
        }
    }
    
    attack(type) {
        if (this.attackCooldown > 0 || this.isHiding) return null;
        
        this.isAttacking = true;
        this.attackType = type;
        this.attackCooldown = type === 'ultimate' ? 2000 : 500;
        
        setTimeout(() => {
            this.isAttacking = false;
            this.attackType = null;
        }, 300);
        
        let damage = CONFIG.CAT.ATTACK_POWER;
        let score = 0;
        
        switch (type) {
            case 'scratch':
                damage = CONFIG.CAT.ATTACK_POWER;
                break;
            case 'push':
                damage = CONFIG.CAT.ATTACK_POWER * 1.2;
                break;
            case 'bite':
                damage = CONFIG.CAT.ATTACK_POWER * 1.5;
                break;
            case 'ultimate':
                damage = CONFIG.CAT.ATTACK_POWER * 3;
                score = CONFIG.CAT.ULTIMATE_SCORE;
                break;
        }
        
        return { damage, score, type };
    }
    
    takeDamage() {
        this.lives--;
        return this.lives <= 0;
    }
    
    getHitbox() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    getState() {
        return {
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            lives: this.lives,
            score: this.score,
            isJumping: this.isJumping,
            isHiding: this.isHiding,
            facingRight: this.facingRight,
            groundY: this.groundY,
            width: this.width,
            height: this.height
        };
    }
    
    loadState(state) {
        this.x = state.x;
        this.y = state.y;
        this.vx = state.vx;
        this.vy = state.vy;
        this.lives = state.lives;
        this.score = state.score;
        this.isJumping = state.isJumping;
        this.isHiding = state.isHiding;
        this.facingRight = state.facingRight;
        this.groundY = state.groundY;
        this.width = state.width;
        this.height = state.height;
    }
}