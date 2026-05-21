const Physics = (function() {

    const MAX_BOUNCE_HEIGHT = 350;

    function applyGravity(character) {
        character.vy += GRAVITY * character.weight;
        if (character.vy > 18) character.vy = 18;
    }

    function updatePosition(character) {
        character.x += character.vx * character.agility;
        character.y += character.vy;
        character.vx *= 0.92;
    }

    function checkGroundCollision(character) {
        if (character.y + character.height >= GROUND_Y) {
            character.y = GROUND_Y - character.height;
            if (character.vy > 3) {
                character.vy = -character.vy * 0.3;
            } else {
                character.vy = 0;
            }
            character.isGrounded = true;
            character.onTrampoline = false;
            return true;
        }
        character.isGrounded = false;
        return false;
    }

    function checkTrampolineCollision(character) {
        for (let trampoline of TRAMPOLINES) {
            const charBottom = character.y + character.height;
            
            if (character.vy > 0 && 
                character.x + character.width > trampoline.x &&
                character.x < trampoline.x + trampoline.width &&
                charBottom >= trampoline.y &&
                charBottom <= trampoline.y + trampoline.height + 30) {
                
                character.y = trampoline.y - character.height;
                
                const baseForce = trampoline.bounceForce;
                const jumpBonus = character.jumpPower / 25;
                const heightBonus = character.jumpHeightMultiplier;
                let bounceForce = baseForce * (0.8 + jumpBonus) * heightBonus;
                
                const maxVelocity = Math.sqrt(2 * GRAVITY * character.weight * MAX_BOUNCE_HEIGHT);
                if (bounceForce > maxVelocity) {
                    bounceForce = maxVelocity;
                }
                
                character.vy = -bounceForce;
                character.isGrounded = true;
                character.onTrampoline = true;
                character.lastTrampolineBounce = Date.now();
                character.trampolineAnim = 1;
                return trampoline;
            }
        }
        return null;
    }

    function checkSpringboardCollision(character) {
        for (let springboard of SPRINGBOARDS) {
            const charBottom = character.y + character.height;
            
            if (character.vy > 0 && 
                character.x + character.width > springboard.x &&
                character.x < springboard.x + springboard.width &&
                charBottom >= springboard.y &&
                charBottom <= springboard.y + springboard.height + 25) {
                
                character.y = springboard.y - character.height;
                
                const baseForce = springboard.bounceForce;
                const jumpBonus = character.jumpPower / 25;
                let bounceForce = baseForce * (0.8 + jumpBonus);
                
                const maxVelocity = Math.sqrt(2 * GRAVITY * character.weight * MAX_BOUNCE_HEIGHT);
                if (bounceForce > maxVelocity) {
                    bounceForce = maxVelocity;
                }
                
                character.vy = -bounceForce;
                character.vx += character.facingRight ? 6 : -6;
                character.isGrounded = true;
                character.onTrampoline = true;
                character.lastSpringboardBounce = Date.now();
                character.springboardAnim = 1;
                return springboard;
            }
        }
        return null;
    }

    function checkEdgeSlope(character) {
        for (let slope of EDGE_SLOPES) {
            if (character.x + character.width > slope.x + 5 &&
                character.x < slope.x + slope.width - 5 &&
                character.y + character.height > slope.y) {
                
                const pushForce = slope.side === 'left' ? -4 : 4;
                character.vx += pushForce;
                character.onEdge = true;
                return slope;
            }
        }
        character.onEdge = false;
        return null;
    }

    function checkArenaBounds(character) {
        if (character.x + character.width < 0 || 
            character.x > GAME_WIDTH ||
            character.y > GAME_HEIGHT + 50) {
            character.isOut = true;
            return true;
        }
        return false;
    }

    function clampPosition(character) {
        if (character.x < ARENA_LEFT) {
            character.x = ARENA_LEFT;
            character.vx = Math.abs(character.vx) * 0.3;
        }
        if (character.x + character.width > ARENA_RIGHT) {
            character.x = ARENA_RIGHT - character.width;
            character.vx = -Math.abs(character.vx) * 0.3;
        }
        
        if (character.y < 50) {
            character.y = 50;
            character.vy = Math.abs(character.vy) * 0.5;
        }
    }

    function checkCharacterCollision(char1, char2) {
        return char1.x < char2.x + char2.width &&
               char1.x + char1.width > char2.x &&
               char1.y < char2.y + char2.height &&
               char1.y + char1.height > char2.y;
    }

    function resolveCharacterCollision(char1, char2) {
        const overlapX = Math.min(
            char1.x + char1.width - char2.x,
            char2.x + char2.width - char1.x
        );
        const overlapY = Math.min(
            char1.y + char1.height - char2.y,
            char2.y + char2.height - char1.y
        );

        if (overlapX < overlapY) {
            const pushX = overlapX / 2 + 3;
            if (char1.x < char2.x) {
                char1.x -= pushX;
                char2.x += pushX;
            } else {
                char1.x += pushX;
                char2.x -= pushX;
            }
            const avgVx = (char1.vx + char2.vx) / 2;
            char1.vx = avgVx * 0.6;
            char2.vx = avgVx * 0.6;
        } else {
            const pushY = overlapY / 2 + 3;
            if (char1.y < char2.y) {
                char1.y -= pushY;
                char2.y += pushY;
                char2.vy = Math.max(3, char2.vy);
                char1.vy = Math.min(-1, char1.vy);
            } else {
                char1.y += pushY;
                char2.y -= pushY;
                char1.vy = Math.max(3, char1.vy);
                char2.vy = Math.min(-1, char2.vy);
            }
        }
    }

    function applyKnockback(character, direction, force) {
        character.vx += direction * force / character.weight;
        character.vy -= force * 0.4 / character.weight;
        character.knockbackTimer = 350;
    }

    function updatePhysics(character) {
        applyGravity(character);
        updatePosition(character);
        
        let onSurface = false;
        
        const hitTrampoline = checkTrampolineCollision(character);
        if (hitTrampoline) onSurface = true;
        
        const hitSpringboard = checkSpringboardCollision(character);
        if (hitSpringboard) onSurface = true;
        
        if (!onSurface) {
            const hitGround = checkGroundCollision(character);
            if (hitGround) onSurface = true;
        }
        
        if (!onSurface) {
            character.isGrounded = false;
        }
        
        checkEdgeSlope(character);
        clampPosition(character);
        
        return {
            hitTrampoline,
            hitSpringboard
        };
    }

    return {
        applyGravity,
        updatePosition,
        checkGroundCollision,
        checkTrampolineCollision,
        checkSpringboardCollision,
        checkEdgeSlope,
        checkArenaBounds,
        clampPosition,
        checkCharacterCollision,
        resolveCharacterCollision,
        applyKnockback,
        updatePhysics
    };
})();