import { CONFIG } from './config.js';
import { random, randomInt, clamp, distance } from './utils.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.PLAYER.WIDTH;
        this.height = CONFIG.PLAYER.HEIGHT;
        this.stamina = CONFIG.PLAYER.MAX_STAMINA;
        this.maxStamina = CONFIG.PLAYER.MAX_STAMINA;
        this.isJumping = false;
        this.isFalling = false;
        this.isSliding = false;
        this.currentHold = null;
        this.jumpStartX = x;
        this.jumpStartY = y;
        this.jumpTargetX = x;
        this.jumpTargetY = y;
        this.jumpProgress = 0;
        this.jumpDuration = CONFIG.PLAYER.JUMP_DURATION;
        this.side = 'left';
        this.animFrame = 0;
        this.animTimer = 0;
    }

    get centerX() {
        return this.x + this.width / 2;
    }

    get centerY() {
        return this.y + this.height / 2;
    }

    get altitude() {
        return Math.max(0, -this.y / 10);
    }

    update(deltaTime) {
        this.animTimer += deltaTime;
        if (this.animTimer > 200) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }

        if (this.isJumping) {
            this.jumpProgress += deltaTime / this.jumpDuration;
            if (this.jumpProgress >= 1) {
                this.jumpProgress = 1;
                this.isJumping = false;
                this.x = this.jumpTargetX;
                this.y = this.jumpTargetY;
            }
        }

        if (!this.isJumping && !this.isFalling && !this.isSliding) {
            this.stamina = clamp(
                this.stamina + CONFIG.PLAYER.STAMINA_REGEN_RATE * deltaTime / 1000,
                0,
                this.maxStamina
            );
        }
    }

    startJump(targetX, targetY) {
        if (this.stamina < CONFIG.PLAYER.JUMP_STAMINA_COST) return false;
        
        this.stamina -= CONFIG.PLAYER.JUMP_STAMINA_COST;
        this.isJumping = true;
        this.jumpProgress = 0;
        this.jumpStartX = this.x;
        this.jumpStartY = this.y;
        this.jumpTargetX = targetX;
        this.jumpTargetY = targetY;
        this.currentHold = null;
        this.side = targetX < this.jumpStartX ? 'left' : 'right';
        
        const dist = distance(this.jumpStartX, this.jumpStartY, targetX, targetY);
        this.jumpDuration = CONFIG.PLAYER.JUMP_DURATION * clamp(dist / 150, 0.6, 1.5);
        
        return true;
    }

    getJumpPosition() {
        if (!this.isJumping) {
            return { x: this.x, y: this.y };
        }
        
        const t = this.jumpProgress;
        const easeT = t * (2 - t);
        
        const x = this.jumpStartX + (this.jumpTargetX - this.jumpStartX) * easeT;
        const baseY = this.jumpStartY + (this.jumpTargetY - this.jumpStartY) * easeT;
        const arcHeight = Math.abs(this.jumpTargetY - this.jumpStartY) * 0.3 + 30;
        const y = baseY - Math.sin(t * Math.PI) * arcHeight;
        
        return { x, y };
    }

    startFall() {
        this.isFalling = true;
        this.currentHold = null;
        this.stamina = Math.max(0, this.stamina - CONFIG.PLAYER.FALL_STAMINA_COST);
    }

    startSlide() {
        this.isSliding = true;
        this.currentHold = null;
    }

    attachToHold(hold) {
        this.currentHold = hold;
        this.isFalling = false;
        this.isSliding = false;
        this.isJumping = false;
        this.x = hold.x + (hold.width - this.width) / 2;
        this.y = hold.y - this.height;
        this.side = this.x < hold.x + hold.width / 2 ? 'left' : 'right';
    }

    serialize() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            stamina: this.stamina,
            maxStamina: this.maxStamina,
            isJumping: this.isJumping,
            isFalling: this.isFalling,
            isSliding: this.isSliding,
            jumpStartX: this.jumpStartX,
            jumpStartY: this.jumpStartY,
            jumpTargetX: this.jumpTargetX,
            jumpTargetY: this.jumpTargetY,
            jumpProgress: this.jumpProgress,
            jumpDuration: this.jumpDuration,
            side: this.side,
            currentHoldIndex: this.currentHold ? this.currentHold.index : null
        };
    }

    static deserialize(data, holds) {
        const player = new Player(data.x, data.y);
        player.width = data.width;
        player.height = data.height;
        player.stamina = data.stamina;
        player.maxStamina = data.maxStamina;
        player.isJumping = data.isJumping;
        player.isFalling = data.isFalling;
        player.isSliding = data.isSliding;
        player.jumpStartX = data.jumpStartX;
        player.jumpStartY = data.jumpStartY;
        player.jumpTargetX = data.jumpTargetX;
        player.jumpTargetY = data.jumpTargetY;
        player.jumpProgress = data.jumpProgress;
        player.jumpDuration = data.jumpDuration;
        player.side = data.side;
        if (data.currentHoldIndex !== null && holds[data.currentHoldIndex]) {
            player.currentHold = holds[data.currentHoldIndex];
        }
        return player;
    }
}

export class Hold {
    constructor(x, y, type, index) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.HOLD.WIDTH;
        this.height = CONFIG.HOLD.HEIGHT;
        this.type = type;
        this.index = index;
        this.isHighlighted = false;
        this.isReachable = false;
        this.glowIntensity = 0;
    }

    get centerX() {
        return this.x + this.width / 2;
    }

    get centerY() {
        return this.y + this.height / 2;
    }

    update(deltaTime, player) {
        if (this.isReachable) {
            this.glowIntensity = (this.glowIntensity + deltaTime * 0.003) % (Math.PI * 2);
        } else {
            this.glowIntensity = 0;
        }
    }

    containsPoint(px, py) {
        const padding = 10;
        return px >= this.x - padding && px <= this.x + this.width + padding &&
               py >= this.y - padding && py <= this.y + this.height + padding;
    }

    canGrab() {
        return this.type !== CONFIG.HOLD.TYPES.CRACK;
    }

    isRestPoint() {
        return this.type === CONFIG.HOLD.TYPES.REST;
    }

    isIce() {
        return this.type === CONFIG.HOLD.TYPES.ICE;
    }

    serialize() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            type: this.type,
            index: this.index
        };
    }

    static deserialize(data) {
        return new Hold(data.x, data.y, data.type, data.index);
    }
}

export class Rock {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.OBSTACLE.ROCK.WIDTH;
        this.height = CONFIG.OBSTACLE.ROCK.HEIGHT;
        this.speedY = CONFIG.OBSTACLE.ROCK.SPEED;
        this.rotation = 0;
        this.rotationSpeed = random(-3, 3);
        this.active = true;
    }

    update(deltaTime) {
        this.y += this.speedY * deltaTime / 1000;
        this.rotation += this.rotationSpeed * deltaTime / 1000;
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    serialize() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            speedY: this.speedY,
            rotation: this.rotation,
            rotationSpeed: this.rotationSpeed,
            active: this.active
        };
    }

    static deserialize(data) {
        const rock = new Rock(data.x, data.y);
        rock.speedY = data.speedY;
        rock.rotation = data.rotation;
        rock.rotationSpeed = data.rotationSpeed;
        rock.active = data.active;
        return rock;
    }
}

export class Bird {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.OBSTACLE.BIRD.WIDTH;
        this.height = CONFIG.OBSTACLE.BIRD.HEIGHT;
        this.speedX = CONFIG.OBSTACLE.BIRD.SPEED * direction;
        this.direction = direction;
        this.wingPhase = 0;
        this.active = true;
    }

    update(deltaTime) {
        this.x += this.speedX * deltaTime / 1000;
        this.wingPhase += deltaTime * 0.01;
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    serialize() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            speedX: this.speedX,
            direction: this.direction,
            wingPhase: this.wingPhase,
            active: this.active
        };
    }

    static deserialize(data) {
        const bird = new Bird(data.x, data.y, data.direction);
        bird.speedX = data.speedX;
        bird.wingPhase = data.wingPhase;
        bird.active = data.active;
        return bird;
    }
}

export class SnowParticle {
    constructor(canvasWidth, canvasHeight, topY = 0) {
        this.reset(canvasWidth, canvasHeight, topY);
    }

    reset(canvasWidth, canvasHeight, topY = 0) {
        this.x = random(0, canvasWidth);
        this.y = random(topY - canvasHeight, topY);
        this.size = random(CONFIG.PARTICLES.SNOW_SIZE_MIN, CONFIG.PARTICLES.SNOW_SIZE_MAX);
        this.speedY = random(CONFIG.PARTICLES.SNOW_SPEED_MIN, CONFIG.PARTICLES.SNOW_SPEED_MAX);
        this.speedX = random(-20, 20);
        this.opacity = random(0.4, 0.9);
        this.wobble = random(0, Math.PI * 2);
        this.wobbleSpeed = random(0.5, 2);
    }

    update(deltaTime, canvasWidth, canvasHeight, cameraY) {
        this.y += this.speedY * deltaTime / 1000;
        this.wobble += this.wobbleSpeed * deltaTime / 1000;
        this.x += Math.sin(this.wobble) * this.speedX * deltaTime / 1000;

        const topLimit = cameraY - canvasHeight;
        if (this.y > cameraY + canvasHeight) {
            this.reset(canvasWidth, canvasHeight, cameraY);
        }
    }

    serialize() {
        return {
            x: this.x,
            y: this.y,
            size: this.size,
            speedY: this.speedY,
            speedX: this.speedX,
            opacity: this.opacity,
            wobble: this.wobble,
            wobbleSpeed: this.wobbleSpeed
        };
    }

    static deserialize(data) {
        const particle = new SnowParticle(0, 0);
        particle.x = data.x;
        particle.y = data.y;
        particle.size = data.size;
        particle.speedY = data.speedY;
        particle.speedX = data.speedX;
        particle.opacity = data.opacity;
        particle.wobble = data.wobble;
        particle.wobbleSpeed = data.wobbleSpeed;
        return particle;
    }
}

export class HoldGenerator {
    static generateHolds(startY, endY, wallWidth, existingHolds = []) {
        const holds = [];
        let currentY = startY;
        let index = existingHolds.length;

        while (currentY > endY) {
            const gapY = random(CONFIG.HOLD.MIN_GAP_Y, CONFIG.HOLD.MAX_GAP_Y);
            currentY -= gapY;

            const sides = ['left', 'right'];
            const numHolds = randomInt(1, 2);
            
            for (let i = 0; i < numHolds; i++) {
                const side = sides[i % sides.length];
                const xOffset = side === 'left' 
                    ? random(20, wallWidth * 0.35) 
                    : random(wallWidth * 0.65, wallWidth - CONFIG.HOLD.WIDTH - 20);
                
                let type = CONFIG.HOLD.TYPES.NORMAL;
                const rand = Math.random();
                if (rand < 0.15) {
                    type = CONFIG.HOLD.TYPES.REST;
                } else if (rand < 0.3) {
                    type = CONFIG.HOLD.TYPES.ICE;
                } else if (rand < 0.38) {
                    type = CONFIG.HOLD.TYPES.CRACK;
                }

                const hold = new Hold(xOffset, currentY, type, index++);
                holds.push(hold);
            }
        }

        return holds;
    }
}
