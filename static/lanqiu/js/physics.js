const Physics = {
    calculateTrajectory: function(startX, startY, angle, power, steps = 50) {
        const rad = Utils.degreesToRadians(angle);
        const vx = Math.cos(rad) * power;
        const vy = -Math.sin(rad) * power;
        
        const points = [];
        let x = startX;
        let y = startY;
        let currentVx = vx;
        let currentVy = vy;
        
        for (let i = 0; i < steps; i++) {
            points.push({ x, y });
            
            currentVy += CONSTANTS.PHYSICS.GRAVITY;
            x += currentVx;
            y += currentVy;
            
            if (y > CONSTANTS.DIMENSIONS.CANVAS_HEIGHT) {
                break;
            }
        }
        
        return points;
    },

    checkHoopCollision: function(ball, hoop) {
        const dx = ball.x - hoop.x;
        const dy = ball.y - hoop.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const collisionRadius = hoop.radius + ball.radius * 0.5;
        
        return {
            collided: distance < collisionRadius,
            distance: distance,
            dx: dx,
            dy: dy
        };
    },

    checkSwish: function(ball, hoop, previousY) {
        const hoopCenterX = hoop.x;
        const hoopCenterY = hoop.y;
        const hoopRadius = hoop.radius;
        
        const ballCenterY = ball.y;
        const ballPreviousCenterY = previousY;
        
        const passedThroughHoop = ballPreviousCenterY < hoopCenterY && 
                                  ballCenterY >= hoopCenterY;
        
        const isWithinHoop = Math.abs(ball.x - hoopCenterX) < hoopRadius * 0.5;
        
        const isDescending = ball.vy > 0;
        
        return passedThroughHoop && isWithinHoop && isDescending;
    },
    
    checkScore: function(ball, hoop, previousY) {
        const hoopCenterX = hoop.x;
        const hoopCenterY = hoop.y;
        const hoopRadius = hoop.radius;
        
        const passedThroughHoop = previousY < hoopCenterY && 
                                  ball.y >= hoopCenterY;
        
        const isWithinHoop = Math.abs(ball.x - hoopCenterX) < hoopRadius * 0.7;
        
        const isDescending = ball.vy > 0;
        
        return passedThroughHoop && isWithinHoop && isDescending;
    },

    checkBackboardCollision: function(ball) {
        const backboardX = CONSTANTS.POSITIONS.BACKBOARD_X;
        const backboardY = CONSTANTS.DIMENSIONS.HOOP_Y - 60;
        const backboardWidth = CONSTANTS.DIMENSIONS.BACKBOARD_WIDTH;
        const backboardHeight = CONSTANTS.DIMENSIONS.BACKBOARD_HEIGHT;
        
        const ballLeft = ball.x - ball.radius;
        const ballRight = ball.x + ball.radius;
        const ballTop = ball.y - ball.radius;
        const ballBottom = ball.y + ball.radius;
        
        const boardLeft = backboardX;
        const boardRight = backboardX + backboardWidth;
        const boardTop = backboardY;
        const boardBottom = backboardY + backboardHeight;
        
        const collided = ballRight > boardLeft && 
                        ballLeft < boardRight && 
                        ballBottom > boardTop && 
                        ballTop < boardBottom;
        
        let collisionSide = null;
        
        if (collided) {
            const overlapLeft = ballRight - boardLeft;
            const overlapRight = boardRight - ballLeft;
            const overlapTop = ballBottom - boardTop;
            const overlapBottom = boardBottom - ballTop;
            
            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
            
            if (minOverlap === overlapLeft) {
                collisionSide = 'left';
            } else if (minOverlap === overlapRight) {
                collisionSide = 'right';
            } else if (minOverlap === overlapTop) {
                collisionSide = 'top';
            } else {
                collisionSide = 'bottom';
            }
        }
        
        return {
            collided,
            side: collisionSide
        };
    },

    checkGroundCollision: function(ball) {
        const groundY = CONSTANTS.DIMENSIONS.CANVAS_HEIGHT - CONSTANTS.DIMENSIONS.COURT_HEIGHT;
        return ball.y + ball.radius >= groundY;
    },

    handleBackboardBounce: function(ball, collision) {
        if (collision.side === 'left' || collision.side === 'right') {
            ball.vx = -ball.vx * CONSTANTS.PHYSICS.BOUNCE_COEFFICIENT;
        }
        if (collision.side === 'top' || collision.side === 'bottom') {
            ball.vy = -ball.vy * CONSTANTS.PHYSICS.BOUNCE_COEFFICIENT;
        }
    },

    handleGroundBounce: function(ball) {
        const groundY = CONSTANTS.DIMENSIONS.CANVAS_HEIGHT - CONSTANTS.DIMENSIONS.COURT_HEIGHT;
        ball.y = groundY - ball.radius;
        ball.vy = -ball.vy * CONSTANTS.PHYSICS.BOUNCE_COEFFICIENT;
        ball.vx *= CONSTANTS.PHYSICS.FRICTION;
        
        if (Math.abs(ball.vy) < 1) {
            ball.vy = 0;
        }
    },

    calculateShotAccuracy: function(ball, hoop, powerPercent, angleDegrees) {
        const inGreenZone = Utils.isInGreenZone(powerPercent, angleDegrees);
        
        const distance = Utils.distance(ball.x, ball.y, hoop.x, hoop.y);
        const angleToHoop = Utils.angleBetween(ball.x, ball.y, hoop.x, hoop.y);
        const targetAngle = Math.PI / 4;
        const angleDifference = Math.abs(angleToHoop - targetAngle);
        
        let accuracy = 1;
        
        if (!inGreenZone) {
            accuracy *= 0.7;
        }
        
        accuracy *= Math.max(0.5, 1 - angleDifference * 0.5);
        
        return {
            accuracy,
            inGreenZone,
            angleDifference
        };
    },

    applyDefenderInterference: function(baseAccuracy, defender) {
        const penalty = defender.getInterferencePenalty();
        return Math.max(0.1, baseAccuracy - penalty);
    },

    isThreePointShot: function(playerX) {
        return playerX <= CONSTANTS.POSITIONS.THREE_POINT_LINE;
    },

    isFreeThrowShot: function(playerX) {
        return playerX > CONSTANTS.POSITIONS.THREE_POINT_LINE && 
               playerX <= CONSTANTS.POSITIONS.FREE_THROW_LINE;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Physics;
}
