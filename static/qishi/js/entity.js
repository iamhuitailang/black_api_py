class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        this.gravity = CONFIG.PLAYER.GRAVITY;
        this.onGround = false;
        this.facingRight = true;
    }

    update(platforms, walls) {
        this.applyGravity();
        this.move(platforms, walls);
    }

    applyGravity() {
        this.vy += this.gravity;
    }

    move(platforms, walls) {
        this.x += this.vx;
        this.handleWallCollisions(walls);
        
        this.y += this.vy;
        this.handlePlatformCollisions(platforms);
    }

    handleWallCollisions(walls) {
        for (const wall of walls) {
            if (this.collidesWith(wall)) {
                if (this.vx > 0) {
                    this.x = wall.x - this.width;
                } else if (this.vx < 0) {
                    this.x = wall.x + wall.width;
                }
                this.vx = 0;
            }
        }
    }

    handlePlatformCollisions(platforms) {
        this.onGround = false;
        for (const platform of platforms) {
            if (this.collidesWith(platform)) {
                if (this.vy > 0 && this.y + this.height - this.vy <= platform.y) {
                    this.y = platform.y - this.height;
                    this.vy = 0;
                    this.onGround = true;
                } else if (this.vy < 0 && this.y - this.vy >= platform.y + platform.height) {
                    this.y = platform.y + platform.height;
                    this.vy = 0;
                }
            }
        }
    }

    collidesWith(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }

    getCenterX() {
        return this.x + this.width / 2;
    }

    getCenterY() {
        return this.y + this.height / 2;
    }

    distanceTo(other) {
        const dx = this.getCenterX() - other.getCenterX();
        const dy = this.getCenterY() - other.getCenterY();
        return Math.sqrt(dx * dx + dy * dy);
    }
}