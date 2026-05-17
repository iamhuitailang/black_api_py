const Physics = {
    checkCollision(bubble1, bubble2) {
        const dist = Helpers.distance(bubble1.x, bubble1.y, bubble2.x, bubble2.y);
        return dist < CONSTANTS.BUBBLE_DIAMETER * 0.95;
    },
    
    checkWallCollision(bubble) {
        if (bubble.x - CONSTANTS.BUBBLE_RADIUS < 0) {
            return { hit: true, wall: 'left' };
        }
        if (bubble.x + CONSTANTS.BUBBLE_RADIUS > CONSTANTS.CANVAS_WIDTH) {
            return { hit: true, wall: 'right' };
        }
        if (bubble.y - CONSTANTS.BUBBLE_RADIUS < 0) {
            return { hit: true, wall: 'top' };
        }
        return { hit: false };
    },
    
    resolveWallCollision(bubble, wall) {
        switch (wall) {
            case 'left':
                bubble.x = CONSTANTS.BUBBLE_RADIUS;
                bubble.vx = -bubble.vx;
                break;
            case 'right':
                bubble.x = CONSTANTS.CANVAS_WIDTH - CONSTANTS.BUBBLE_RADIUS;
                bubble.vx = -bubble.vx;
                break;
            case 'top':
                bubble.y = CONSTANTS.BUBBLE_RADIUS;
                bubble.vy = -bubble.vy;
                break;
        }
    },
    
    checkGridCollision(bubble, grid) {
        for (const gridBubble of grid.getAllBubbles()) {
            if (this.checkCollision(bubble, gridBubble)) {
                return {
                    hit: true,
                    bubble: gridBubble,
                    distance: Helpers.distance(bubble.x, bubble.y, gridBubble.x, gridBubble.y)
                };
            }
        }
        return { hit: false };
    },
    
    checkTopCollision(bubble) {
        return bubble.y - CONSTANTS.BUBBLE_RADIUS <= 0;
    },
    
    checkBottomCollision(bubble) {
        return bubble.y + CONSTANTS.BUBBLE_RADIUS >= CONSTANTS.CANVAS_HEIGHT;
    },
    
    updateActiveBubble(gameState, deltaTime = 16) {
        const bubble = gameState.activeBubble;
        if (!bubble || !bubble.isMoving) return false;
        
        bubble.update(deltaTime);
        
        if (this.checkTopCollision(bubble)) {
            bubble.y = CONSTANTS.BUBBLE_RADIUS;
            return this.handleLanding(gameState, bubble);
        }
        
        const gridCollision = this.checkGridCollision(bubble, gameState.grid);
        if (gridCollision.hit) {
            const hitBubble = gridCollision.bubble;
            const dx = bubble.x - hitBubble.x;
            const dy = bubble.y - hitBubble.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                const overlap = CONSTANTS.BUBBLE_DIAMETER - dist;
                bubble.x += (dx / dist) * overlap * 0.5;
                bubble.y += (dy / dist) * overlap * 0.5;
            }
            return this.handleLanding(gameState, bubble);
        }
        
        if (this.checkBottomCollision(bubble)) {
            bubble.stop();
            gameState.activeBubble = null;
            gameState.resetCombo();
            return true;
        }
        
        return false;
    },
    
    handleLanding(gameState, bubble) {
        return GameLogic.processBubbleLanding(gameState, bubble);
    },
    
    calculateBounceAngle(bubble, collisionPoint) {
        const normal = {
            x: bubble.x - collisionPoint.x,
            y: bubble.y - collisionPoint.y
        };
        
        const len = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
        normal.x /= len;
        normal.y /= len;
        
        const dot = bubble.vx * normal.x + bubble.vy * normal.y;
        
        return {
            x: bubble.vx - 2 * dot * normal.x,
            y: bubble.vy - 2 * dot * normal.y
        };
    },
    
    predictTrajectory(angle, startX, startY, grid, maxSteps = 200) {
        const vec = Helpers.angleToVector(angle);
        let x = startX;
        let y = startY;
        let vx = vec.x * CONSTANTS.BUBBLE_SPEED;
        let vy = vec.y * CONSTANTS.BUBBLE_SPEED;
        
        const points = [{ x, y }];
        
        for (let i = 0; i < maxSteps; i++) {
            x += vx;
            y += vy;
            
            if (x - CONSTANTS.BUBBLE_RADIUS < 0) {
                x = CONSTANTS.BUBBLE_RADIUS;
                vx = -vx;
            }
            if (x + CONSTANTS.BUBBLE_RADIUS > CONSTANTS.CANVAS_WIDTH) {
                x = CONSTANTS.CANVAS_WIDTH - CONSTANTS.BUBBLE_RADIUS;
                vx = -vx;
            }
            
            if (y - CONSTANTS.BUBBLE_RADIUS < 0) {
                points.push({ x, y });
                break;
            }
            
            let hitBubble = false;
            for (const bubble of grid.getAllBubbles()) {
                const dist = Helpers.distance(x, y, bubble.x, bubble.y);
                if (dist < CONSTANTS.BUBBLE_DIAMETER * 0.9) {
                    hitBubble = true;
                    break;
                }
            }
            
            if (hitBubble) {
                points.push({ x, y });
                break;
            }
            
            if (i % 5 === 0) {
                points.push({ x, y });
            }
        }
        
        return points;
    }
};
