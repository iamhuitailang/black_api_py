import { GRAVITY, FRICTION, TILE_SIZE } from './config.js';

export class Physics {
    static applyGravity(entity) {
        entity.vy += GRAVITY;
    }

    static applyFriction(entity) {
        entity.vx *= FRICTION;
        if (Math.abs(entity.vx) < 0.1) {
            entity.vx = 0;
        }
    }

    static updatePosition(entity) {
        entity.x += entity.vx;
        entity.y += entity.vy;
    }

    static checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    static checkTopCollision(entity, block) {
        const entityBottom = entity.y + entity.height;
        const blockTop = block.y;
        const entityCenterX = entity.x + entity.width / 2;
        
        return entity.vy > 0 &&
               entityBottom >= blockTop &&
               entityBottom <= blockTop + 10 &&
               entityCenterX > block.x &&
               entityCenterX < block.x + block.width;
    }

    static checkBottomCollision(entity, block) {
        const entityTop = entity.y;
        const blockBottom = block.y + block.height;
        const entityCenterX = entity.x + entity.width / 2;
        
        return entity.vy < 0 &&
               entityTop <= blockBottom &&
               entityTop >= blockBottom - 10 &&
               entityCenterX > block.x &&
               entityCenterX < block.x + block.width;
    }

    static checkSideCollision(entity, block) {
        const entityCenterX = entity.x + entity.width / 2;
        const entityCenterY = entity.y + entity.height / 2;
        const blockCenterX = block.x + block.width / 2;
        const blockCenterY = block.y + block.height / 2;
        
        const dx = entityCenterX - blockCenterX;
        const dy = entityCenterY - blockCenterY;
        
        const overlapX = (entity.width / 2 + block.width / 2) - Math.abs(dx);
        const overlapY = (entity.height / 2 + block.height / 2) - Math.abs(dy);
        
        if (overlapX > 0 && overlapY > 0) {
            if (overlapX < overlapY) {
                return dx > 0 ? 'left' : 'right';
            }
        }
        return null;
    }

    static resolveCollision(entity, block) {
        if (this.checkTopCollision(entity, block)) {
            entity.y = block.y - entity.height;
            entity.vy = 0;
            entity.onGround = true;
            return 'top';
        }
        
        if (this.checkBottomCollision(entity, block)) {
            entity.y = block.y + block.height;
            entity.vy = 0;
            return 'bottom';
        }
        
        const side = this.checkSideCollision(entity, block);
        if (side) {
            if (side === 'left') {
                entity.x = block.x + block.width;
            } else {
                entity.x = block.x - entity.width;
            }
            entity.vx = 0;
            return side;
        }
        
        return null;
    }

    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    static isOnGround(entity, blocks) {
        const feetRect = {
            x: entity.x + 2,
            y: entity.y + entity.height,
            width: entity.width - 4,
            height: 4
        };
        
        for (const block of blocks) {
            if (!block.solid) continue;
            if (this.checkCollision(feetRect, block)) {
                return true;
            }
        }
        return false;
    }
}

export class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        return new Vector2(this.x + v.x, this.y + v.y);
    }

    subtract(v) {
        return new Vector2(this.x - v.x, this.y - v.y);
    }

    multiply(s) {
        return new Vector2(this.x * s, this.y * s);
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        const len = this.length();
        if (len === 0) return new Vector2();
        return new Vector2(this.x / len, this.y / len);
    }

    dot(v) {
        return this.x * v.x + this.y * v.y;
    }
}