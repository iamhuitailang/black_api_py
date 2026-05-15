import { BOX_TYPES, GRAVITY, MAX_FALL_SPEED, CANVAS_HEIGHT, CENTER_X, BASE_PLATFORM_Y } from './config.js';

export class Box {
    constructor(type, x, y) {
        const boxConfig = BOX_TYPES[type];
        this.type = type;
        this.x = x;
        this.y = y;
        this.width = boxConfig.width;
        this.height = boxConfig.height;
        this.color = boxConfig.color;
        this.borderColor = boxConfig.borderColor;
        this.baseScore = boxConfig.baseScore;
        this.weight = boxConfig.weight;
        this.friction = boxConfig.friction;
        this.stability = boxConfig.stability;
        this.scoreMultiplier = boxConfig.scoreMultiplier || 1;
        this.offsetPenalty = boxConfig.offsetPenalty || 1;
        this.vibrationEffect = boxConfig.vibrationEffect || false;
        this.fallSpeedMultiplier = boxConfig.fallSpeed || 1;
        
        this.velocityY = 0;
        this.velocityX = 0;
        this.isFalling = false;
        this.isPlaced = false;
        this.rotation = 0;
        this.angularVelocity = 0;
    }

    update(deltaTime) {
        if (this.isFalling) {
            this.velocityY += GRAVITY * this.weight * this.fallSpeedMultiplier;
            this.velocityY = Math.min(this.velocityY, MAX_FALL_SPEED);
            this.y += this.velocityY;
            
            this.x += this.velocityX;
            this.rotation += this.angularVelocity;
        }
    }

    startFalling() {
        this.isFalling = true;
    }

    place() {
        this.isFalling = false;
        this.isPlaced = true;
        this.velocityY = 0;
        this.velocityX = 0;
        this.angularVelocity = 0;
    }

    getLeft() {
        return this.x - this.width / 2;
    }

    getRight() {
        return this.x + this.width / 2;
    }

    getTop() {
        return this.y - this.height / 2;
    }

    getBottom() {
        return this.y + this.height / 2;
    }

    calculateOverlap(otherBox) {
        const overlapLeft = Math.max(this.getLeft(), otherBox.getLeft());
        const overlapRight = Math.min(this.getRight(), otherBox.getRight());
        const overlapWidth = Math.max(0, overlapRight - overlapLeft);
        
        return overlapWidth;
    }

    calculateAlignmentPercentage(otherBox) {
        const overlapWidth = this.calculateOverlap(otherBox);
        const percentage = (overlapWidth / this.width) * 100;
        return Math.min(100, Math.max(0, percentage));
    }

    trimToOverlap(otherBox) {
        const overlapLeft = Math.max(this.getLeft(), otherBox.getLeft());
        const overlapRight = Math.min(this.getRight(), otherBox.getRight());
        
        const newWidth = overlapRight - overlapLeft;
        if (newWidth <= 0) {
            return false;
        }
        
        this.x = (overlapLeft + overlapRight) / 2;
        this.width = newWidth;
        return true;
    }

    isOffScreen() {
        return this.getTop() > CANVAS_HEIGHT || 
               this.getRight() < 0 || 
               this.getLeft() > CANVAS_WIDTH;
    }

    serialize() {
        return {
            type: this.type,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            velocityY: this.velocityY,
            velocityX: this.velocityX,
            isFalling: this.isFalling,
            isPlaced: this.isPlaced,
            rotation: this.rotation,
            angularVelocity: this.angularVelocity
        };
    }

    static deserialize(data) {
        const box = new Box(data.type, data.x, data.y);
        box.width = data.width;
        box.height = data.height;
        box.velocityY = data.velocityY || 0;
        box.velocityX = data.velocityX || 0;
        box.isFalling = data.isFalling || false;
        box.isPlaced = data.isPlaced || false;
        box.rotation = data.rotation || 0;
        box.angularVelocity = data.angularVelocity || 0;
        return box;
    }

    static createBasePlatform() {
        const box = new Box('WOOD', CENTER_X, BASE_PLATFORM_Y);
        box.width = 200;
        box.isPlaced = true;
        return box;
    }
}