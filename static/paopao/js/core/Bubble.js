class Bubble {
    constructor(options = {}) {
        this.id = options.id || Helpers.generateId();
        this.row = options.row || 0;
        this.col = options.col || 0;
        this.color = options.color || getRandomBubbleColor();
        this.type = options.type || 'normal';
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.vx = 0;
        this.vy = 0;
        this.isMoving = false;
        this.isPopping = false;
        this.isDropping = false;
        this.popProgress = 0;
        this.dropProgress = 0;
        this.dropStartY = 0;
        this.dropTargetY = 0;
        this.rotation = 0;
        this.scale = 1;
        this.opacity = 1;
        this.wobbleOffset = 0;
        this.wobbleSpeed = Helpers.randomRange(0.02, 0.05);
        this.wobbleAmount = Helpers.randomRange(2, 5);
        this.pierceCount = 0;
        this.chainTriggered = false;
    }
    
    get config() {
        return BUBBLE_TYPES_CONFIG[this.type] || BUBBLE_TYPES_CONFIG.normal;
    }
    
    get displayColor() {
        if (this.type === 'normal') {
            return this.color;
        }
        return this.config.color || this.color;
    }
    
    setPositionFromGrid() {
        const pos = Helpers.gridToPixel(this.row, this.col);
        this.x = pos.x;
        this.y = pos.y;
    }
    
    launch(angle, speed = CONSTANTS.BUBBLE_SPEED) {
        const vec = Helpers.angleToVector(angle);
        this.vx = vec.x * speed;
        this.vy = vec.y * speed;
        this.isMoving = true;
    }
    
    update(deltaTime) {
        if (this.isMoving) {
            this.x += this.vx;
            this.y += this.vy;
            
            if (this.x - CONSTANTS.BUBBLE_RADIUS < 0) {
                this.x = CONSTANTS.BUBBLE_RADIUS;
                this.vx = -this.vx;
            }
            if (this.x + CONSTANTS.BUBBLE_RADIUS > CONSTANTS.CANVAS_WIDTH) {
                this.x = CONSTANTS.CANVAS_WIDTH - CONSTANTS.BUBBLE_RADIUS;
                this.vx = -this.vx;
            }
        }
        
        if (this.isPopping) {
            this.popProgress += deltaTime / CONSTANTS.ANIMATION.POP_DURATION;
            this.scale = 1 + this.popProgress * 0.5;
            this.opacity = 1 - this.popProgress;
            if (this.popProgress >= 1) {
                this.isPopping = false;
                return true;
            }
        }
        
        if (this.isDropping) {
            this.dropProgress += deltaTime / CONSTANTS.ANIMATION.DROP_DURATION;
            const ease = Helpers.easeInCubic(this.dropProgress);
            this.y = Helpers.lerp(this.dropStartY, this.dropTargetY, ease);
            this.opacity = 1 - this.dropProgress;
            this.rotation += 0.1;
            if (this.dropProgress >= 1) {
                this.isDropping = false;
                return true;
            }
        }
        
        if (!this.isMoving && !this.isPopping && !this.isDropping) {
            this.wobbleOffset += this.wobbleSpeed;
        }
        
        return false;
    }
    
    startPop() {
        this.isPopping = true;
        this.popProgress = 0;
    }
    
    startDrop(targetY) {
        this.isDropping = true;
        this.dropProgress = 0;
        this.dropStartY = this.y;
        this.dropTargetY = targetY;
    }
    
    stop() {
        this.isMoving = false;
        this.vx = 0;
        this.vy = 0;
    }
    
    getDisplayPosition() {
        const wobbleY = Math.sin(this.wobbleOffset) * this.wobbleAmount;
        return {
            x: this.x,
            y: this.y + wobbleY
        };
    }
    
    serialize() {
        return {
            id: this.id,
            row: this.row,
            col: this.col,
            color: this.color,
            type: this.type,
            x: this.x,
            y: this.y
        };
    }
    
    static deserialize(data) {
        return new Bubble(data);
    }
}
