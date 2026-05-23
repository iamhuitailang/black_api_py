class PhysicsEngine {
    constructor() {
        this.gravity = GameConfig.gravity;
        this.maxFallSpeed = GameConfig.maxFallSpeed;
    }
    
    applyGravity(entity) {
        entity.velocityY += this.gravity;
        entity.velocityY = Math.min(entity.velocityY, this.maxFallSpeed);
    }
    
    updatePosition(entity) {
        entity.x += entity.velocityX;
        entity.y += entity.velocityY;
    }
    
    checkPlatformCollision(player, platform) {
        const playerBottom = player.y + player.height;
        const playerLeft = player.x;
        const playerRight = player.x + player.width;
        
        const platformLeft = platform.x;
        const platformRight = platform.x + platform.width;
        const platformTop = platform.y;
        const platformBottom = platform.y + platform.height;
        
        const isAbove = playerBottom >= platformTop - 10 && 
                        playerBottom <= platformBottom + player.velocityY;
        const isWithinX = playerRight > platformLeft && playerLeft < platformRight;
        const isFalling = player.velocityY > 0;
        
        return isAbove && isWithinX && isFalling;
    }
    
    resolveCollision(player, platform) {
        player.y = platform.y - player.height;
        player.velocityY = 0;
        player.isOnGround = true;
        player.currentPlatform = platform;
    }
    
    checkBoundaries(entity, canvasWidth, canvasHeight) {
        if (entity.x < 0) {
            entity.x = 0;
            entity.velocityX = 0;
        }
        if (entity.x + entity.width > canvasWidth) {
            entity.x = canvasWidth - entity.width;
            entity.velocityX = 0;
        }
        if (entity.y < 0) {
            entity.y = 0;
            entity.velocityY = 0;
        }
    }
    
    isOutOfBounds(entity, canvasWidth, canvasHeight) {
        return entity.y > canvasHeight + 100;
    }
}

window.PhysicsEngine = PhysicsEngine;
