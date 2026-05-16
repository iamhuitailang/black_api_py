class Clerk {
    constructor(x, patrolCenter) {
        this.x = x;
        this.y = CONSTANTS.GROUND_Y - 55;
        this.width = 45;
        this.height = 55;
        this.vx = 0;
        
        this.patrolCenter = patrolCenter;
        this.patrolRange = CONSTANTS.CLERK.patrolRange;
        this.speed = CONSTANTS.CLERK.speed;
        this.chaseRange = CONSTANTS.CLERK.chaseRange;
        this.catchRange = CONSTANTS.CLERK.catchRange;
        
        this.state = 'patrol';
        this.patrolDirection = 1;
        this.facingRight = true;
        
        this.isStunned = false;
        this.stunnedTimer = 0;
        this.justCaught = false;
    }
    
    update(player, deltaTime) {
        if (this.isStunned) {
            this.stunnedTimer -= deltaTime;
            if (this.stunnedTimer <= 0) {
                this.isStunned = false;
            }
            return;
        }
        
        const dx = player.x + player.width / 2 - (this.x + this.width / 2);
        const dy = player.y + player.height / 2 - (this.y + this.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= this.catchRange && !this.justCaught) {
            this.state = 'catch';
        } else if (distance <= this.chaseRange) {
            this.state = 'chase';
        } else {
            this.state = 'patrol';
        }
        
        if (this.state === 'chase') {
            if (dx > 10) {
                this.vx = this.speed * 1.5;
                this.facingRight = true;
            } else if (dx < -10) {
                this.vx = -this.speed * 1.5;
                this.facingRight = false;
            } else {
                this.vx = 0;
            }
        } else if (this.state === 'patrol') {
            const leftBound = this.patrolCenter - this.patrolRange;
            const rightBound = this.patrolCenter + this.patrolRange;
            
            if (this.x >= rightBound) {
                this.patrolDirection = -1;
                this.facingRight = false;
            } else if (this.x <= leftBound) {
                this.patrolDirection = 1;
                this.facingRight = true;
            }
            
            this.vx = this.speed * this.patrolDirection * 0.6;
        } else if (this.state === 'catch') {
            this.vx = 0;
        }
        
        this.x += this.vx;
        this.x = Math.max(0, Math.min(CONSTANTS.CANVAS_WIDTH - this.width, this.x));
    }
    
    canCatch() {
        return this.state === 'catch' && !this.justCaught;
    }
    
    stun() {
        this.isStunned = true;
        this.stunnedTimer = CONSTANTS.CLERK.stunnedTime;
        this.justCaught = true;
        setTimeout(() => {
            this.justCaught = false;
        }, 1000);
    }
    
    getState() {
        return {
            x: this.x,
            y: this.y,
            patrolCenter: this.patrolCenter,
            patrolDirection: this.patrolDirection,
            state: this.state,
            isStunned: this.isStunned,
            stunnedTimer: this.stunnedTimer,
            facingRight: this.facingRight,
            justCaught: this.justCaught
        };
    }
    
    loadState(state) {
        this.x = state.x;
        this.y = state.y;
        this.patrolCenter = state.patrolCenter;
        this.patrolDirection = state.patrolDirection;
        this.state = state.state;
        this.isStunned = state.isStunned;
        this.stunnedTimer = state.stunnedTimer;
        this.facingRight = state.facingRight;
        this.justCaught = state.justCaught || false;
    }
}