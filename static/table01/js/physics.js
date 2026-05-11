var Physics = (function() {
    'use strict';

    var gameConfig = Config.GAME_CONFIG;

    function createBall(x, y, radius, color, label, isCue) {
        return {
            x: x,
            y: y,
            radius: radius || gameConfig.ballRadius,
            vx: 0,
            vy: 0,
            color: color,
            label: label || '',
            isCue: isCue || false,
            isPocketed: false,
            isMoving: false
        };
    }

    function updateBall(ball, friction) {
        ball.x += ball.vx;
        ball.y += ball.vy;

        ball.vx *= friction;
        ball.vy *= friction;

        var speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        if (speed < gameConfig.minSpeed) {
            ball.vx = 0;
            ball.vy = 0;
            ball.isMoving = false;
        } else {
            ball.isMoving = true;
        }
    }

    function checkWallCollision(ball, tableBounds) {
        var left = tableBounds.left;
        var right = tableBounds.right;
        var top = tableBounds.top;
        var bottom = tableBounds.bottom;
        var radius = ball.radius;
        var collided = false;

        if (ball.x - radius < left) {
            ball.x = left + radius;
            ball.vx = -ball.vx * gameConfig.restitution;
            collided = true;
        } else if (ball.x + radius > right) {
            ball.x = right - radius;
            ball.vx = -ball.vx * gameConfig.restitution;
            collided = true;
        }

        if (ball.y - radius < top) {
            ball.y = top + radius;
            ball.vy = -ball.vy * gameConfig.restitution;
            collided = true;
        } else if (ball.y + radius > bottom) {
            ball.y = bottom - radius;
            ball.vy = -ball.vy * gameConfig.restitution;
            collided = true;
        }

        return collided;
    }

    function checkBallCollision(ball1, ball2) {
        var dx = ball2.x - ball1.x;
        var dy = ball2.y - ball1.y;
        var distance = Math.sqrt(dx * dx + dy * dy);
        var minDist = ball1.radius + ball2.radius;

        if (distance < minDist && distance > 0) {
            var nx = dx / distance;
            var ny = dy / distance;

            var dvx = ball1.vx - ball2.vx;
            var dvy = ball1.vy - ball2.vy;
            var dvn = dvx * nx + dvy * ny;

            if (dvn > 0) {
                var overlap = minDist - distance;
                var overlapX = nx * overlap * 0.5;
                var overlapY = ny * overlap * 0.5;

                ball1.x -= overlapX;
                ball1.y -= overlapY;
                ball2.x += overlapX;
                ball2.y += overlapY;

                ball1.vx -= dvn * nx * gameConfig.restitution;
                ball1.vy -= dvn * ny * gameConfig.restitution;
                ball2.vx += dvn * nx * gameConfig.restitution;
                ball2.vy += dvn * ny * gameConfig.restitution;

                ball1.isMoving = true;
                ball2.isMoving = true;

                return {
                    collided: true,
                    normal: { x: nx, y: ny },
                    impactSpeed: Math.abs(dvn)
                };
            }
        }

        return { collided: false };
    }

    function checkPocketCollision(ball, pockets, pocketRadius) {
        for (var i = 0; i < pockets.length; i++) {
            var pocket = pockets[i];
            var dx = ball.x - pocket.x;
            var dy = ball.y - pocket.y;
            var distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < pocketRadius) {
                return {
                    pocketed: true,
                    pocketIndex: i
                };
            }
        }

        return { pocketed: false };
    }

    function areAnyBallsMoving(balls) {
        for (var i = 0; i < balls.length; i++) {
            if (balls[i].isMoving && !balls[i].isPocketed) {
                return true;
            }
        }
        return false;
    }

    function getTableBounds(tableWidth, tableHeight) {
        return {
            left: gameConfig.tableBorder,
            right: tableWidth - gameConfig.tableBorder,
            top: gameConfig.tableBorder,
            bottom: tableHeight - gameConfig.tableBorder,
            width: tableWidth - gameConfig.tableBorder * 2,
            height: tableHeight - gameConfig.tableBorder * 2
        };
    }

    function getPockets(tableBounds) {
        var cornerOffset = gameConfig.tableBorder * 0.5;
        return [
            { x: tableBounds.left + cornerOffset, y: tableBounds.top + cornerOffset },
            { x: tableBounds.right - cornerOffset, y: tableBounds.top + cornerOffset },
            { x: tableBounds.left + cornerOffset, y: tableBounds.bottom - cornerOffset },
            { x: tableBounds.right - cornerOffset, y: tableBounds.bottom - cornerOffset },
            { x: (tableBounds.left + tableBounds.right) / 2, y: tableBounds.top + cornerOffset },
            { x: (tableBounds.left + tableBounds.right) / 2, y: tableBounds.bottom - cornerOffset }
        ];
    }

    function checkPositionValid(x, y, balls, ballRadius, tableBounds) {
        if (x - ballRadius < tableBounds.left ||
            x + ballRadius > tableBounds.right ||
            y - ballRadius < tableBounds.top ||
            y + ballRadius > tableBounds.bottom) {
            return false;
        }

        for (var i = 0; i < balls.length; i++) {
            var ball = balls[i];
            if (ball.isPocketed) continue;
            var dx = x - ball.x;
            var dy = y - ball.y;
            var distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < ballRadius * 2) {
                return false;
            }
        }

        return true;
    }

    function generateBallPositions(count, tableBounds, ballRadius) {
        var positions = [];
        var startX = tableBounds.right - tableBounds.width * 0.25;
        var startY = (tableBounds.top + tableBounds.bottom) / 2;
        var spacing = ballRadius * 2.2;
        var rowHeight = spacing * 0.866;
        
        var rowCount = 0;
        var ballsInCurrentRow = 1;
        var ballsPlaced = 0;
        
        while (ballsPlaced < count && rowCount < 10) {
            var ballsInThisRow = Math.min(ballsInCurrentRow, count - ballsPlaced);
            var offsetY = -((ballsInThisRow - 1) * spacing) / 2;
            
            for (var i = 0; i < ballsInThisRow; i++) {
                positions.push({
                    x: startX + rowCount * rowHeight,
                    y: startY + offsetY + i * spacing
                });
                ballsPlaced++;
            }
            
            rowCount++;
            ballsInCurrentRow++;
        }
        
        return positions;
    }

    return {
        createBall: createBall,
        updateBall: updateBall,
        checkWallCollision: checkWallCollision,
        checkBallCollision: checkBallCollision,
        checkPocketCollision: checkPocketCollision,
        areAnyBallsMoving: areAnyBallsMoving,
        getTableBounds: getTableBounds,
        getPockets: getPockets,
        checkPositionValid: checkPositionValid,
        generateBallPositions: generateBallPositions
    };
})();
