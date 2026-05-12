class Physics {
    static applyGravity(entity, gravity = CONFIG.GRAVITY) {
        entity.vy += gravity;
    }

    static applyFriction(entity, friction = CONFIG.FRICTION) {
        if (entity.grounded) {
            entity.vx *= friction;
        }
    }

    static limitSpeed(entity, maxSpeed = CONFIG.MAX_SPEED) {
        const speed = Math.abs(entity.vx);
        if (speed > maxSpeed) {
            entity.vx = Math.sign(entity.vx) * maxSpeed;
        }
    }

    static updatePosition(entity) {
        entity.x += entity.vx;
        entity.y += entity.vy;
    }

    static checkCollision(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    static resolveCollision(entity, platform) {
        const overlapX = Math.min(
            entity.x + entity.width - platform.x,
            platform.x + platform.width - entity.x
        );
        const overlapY = Math.min(
            entity.y + entity.height - platform.y,
            platform.y + platform.height - entity.y
        );

        if (overlapX < overlapY) {
            if (entity.x < platform.x) {
                entity.x = platform.x - entity.width;
            } else {
                entity.x = platform.x + platform.width;
            }
            entity.vx = 0;
        } else {
            if (entity.y < platform.y) {
                entity.y = platform.y - entity.height;
                entity.vy = 0;
                entity.grounded = true;
            } else {
                entity.y = platform.y + platform.height;
                entity.vy = 0;
            }
        }
    }

    static checkPlatformCollision(entity, platforms) {
        entity.grounded = false;
        
        for (const platform of platforms) {
            if (this.checkCollision(entity, platform)) {
                if (entity.vy > 0 && entity.y + entity.height - entity.vy <= platform.y) {
                    entity.y = platform.y - entity.height;
                    entity.vy = 0;
                    entity.grounded = true;
                    
                    if (platform.type === 'spring') {
                        entity.vy = platform.bounceForce || -20;
                        entity.grounded = false;
                    } else if (platform.type === 'speedBoost') {
                        entity.vx = platform.direction * (CONFIG.MAX_SPEED * 1.5);
                    }
                } else {
                    this.resolveCollision(entity, platform);
                }
            }
        }
    }

    static checkRingCollection(player, rings) {
        const collected = [];
        for (let i = 0; i < rings.length; i++) {
            if (this.checkCollision(player, rings[i])) {
                collected.push(i);
            }
        }
        return collected;
    }

    static checkEnemyCollision(player, enemies) {
        for (const enemy of enemies) {
            if (!enemy.defeated && this.checkCollision(player, enemy)) {
                return enemy;
            }
        }
        return null;
    }

    static checkSpikeCollision(player, spikes) {
        for (const spike of spikes) {
            if (this.checkCollision(player, spike)) {
                return true;
            }
        }
        return false;
    }

    static checkGoalReached(player, goal) {
        return this.checkCollision(player, goal);
    }

    static keepInBounds(entity, bounds) {
        if (entity.x < bounds.left) {
            entity.x = bounds.left;
            entity.vx = 0;
        }
        if (entity.x + entity.width > bounds.right) {
            entity.x = bounds.right - entity.width;
            entity.vx = 0;
        }
        if (entity.y < bounds.top) {
            entity.y = bounds.top;
            entity.vy = 0;
        }
    }

    static checkFallOff(entity, groundY) {
        return entity.y > groundY + 200;
    }
}
