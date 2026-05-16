class Owner {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = -100;
        this.y = CONFIG.CANVAS_HEIGHT - 200;
        this.width = 60;
        this.height = 120;
        this.isPresent = false;
        this.isLeaving = false;
        this.timer = 0;
        this.appearTimer = CONFIG.OWNER.APPEAR_INTERVAL;
        this.caughtCat = false;
        this.warningTime = 0;
        this.facingRight = true;
        this.animFrame = 0;
        this.animTimer = 0;
    }
    
    update(deltaTime, cat) {
        this.animTimer += deltaTime;
        if (this.animTimer > 200) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 2;
        }
        
        if (!this.isPresent) {
            this.appearTimer -= deltaTime;
            if (this.appearTimer <= 0) {
                this.appear();
            }
            return;
        }
        
        if (this.warningTime > 0) {
            this.warningTime -= deltaTime;
            return;
        }
        
        if (this.isLeaving) {
            this.x -= CONFIG.OWNER.MOVE_SPEED;
            if (this.x < -100) {
                this.isPresent = false;
                this.isLeaving = false;
                this.appearTimer = CONFIG.OWNER.APPEAR_INTERVAL;
            }
            return;
        }
        
        const targetX = cat.x + cat.width / 2 - this.width / 2;
        if (Math.abs(this.x - targetX) > 5) {
            if (this.x < targetX) {
                this.x += CONFIG.OWNER.MOVE_SPEED;
                this.facingRight = true;
            } else {
                this.x -= CONFIG.OWNER.MOVE_SPEED;
                this.facingRight = false;
            }
        }
        
        this.timer -= deltaTime;
        if (this.timer <= 0) {
            this.leave();
        }
    }
    
    appear() {
        this.isPresent = true;
        this.isLeaving = false;
        this.x = -50;
        this.timer = CONFIG.OWNER.STAY_DURATION;
        this.warningTime = 1500;
        this.caughtCat = false;
    }
    
    leave() {
        this.isLeaving = true;
    }
    
    checkCatch(cat) {
        if (!this.isPresent || this.isLeaving || this.warningTime > 0) {
            return false;
        }
        
        if (cat.isHiding) {
            const chance = Math.random() * 10;
            if (chance < CONFIG.CAT.HIDE_SUCCESS_RATE) {
                return false;
            }
        }
        
        const catCenter = cat.x + cat.width / 2;
        const ownerCenter = this.x + this.width / 2;
        const dist = Math.abs(catCenter - ownerCenter);
        
        if (dist < CONFIG.OWNER.CATCH_DISTANCE) {
            if (!this.caughtCat) {
                this.caughtCat = true;
                return true;
            }
        }
        return false;
    }
    
    getState() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            isPresent: this.isPresent,
            isLeaving: this.isLeaving,
            timer: this.timer,
            appearTimer: this.appearTimer,
            caughtCat: this.caughtCat,
            warningTime: this.warningTime,
            facingRight: this.facingRight
        };
    }
    
    loadState(state) {
        this.x = state.x;
        this.y = state.y;
        this.width = state.width;
        this.height = state.height;
        this.isPresent = state.isPresent;
        this.isLeaving = state.isLeaving;
        this.timer = state.timer;
        this.appearTimer = state.appearTimer;
        this.caughtCat = state.caughtCat;
        this.warningTime = state.warningTime;
        this.facingRight = state.facingRight;
    }
}