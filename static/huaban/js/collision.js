const Collision = (function() {
    function rectIntersect(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }
    
    function pointInRect(px, py, rect) {
        return px >= rect.x && px <= rect.x + rect.width &&
               py >= rect.y && py <= rect.y + rect.height;
    }
    
    function circleIntersect(a, b) {
        const dx = (a.x + a.width / 2) - (b.x + b.width / 2);
        const dy = (a.y + a.height / 2) - (b.y + b.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = (Math.min(a.width, a.height) + Math.min(b.width, b.height)) / 2;
        return distance < minDistance;
    }
    
    function checkObstacleCollision(player, obstacles) {
        const playerHitbox = {
            x: player.x + 5,
            y: player.y + 5,
            width: player.width - 10,
            height: player.height - 5
        };
        
        for (const obstacle of obstacles) {
            if (rectIntersect(playerHitbox, obstacle)) {
                return {
                    collided: true,
                    obstacle: obstacle
                };
            }
        }
        
        return { collided: false };
    }
    
    function checkCollectibleCollision(player, collectibles) {
        const playerHitbox = {
            x: player.x,
            y: player.y,
            width: player.width,
            height: player.height
        };
        
        const collected = [];
        
        for (let i = collectibles.length - 1; i >= 0; i--) {
            const item = collectibles[i];
            if (circleIntersect(playerHitbox, item)) {
                collected.push(item);
                collectibles.splice(i, 1);
            }
        }
        
        return collected;
    }
    
    function checkBoostPadCollision(player, boostPads) {
        const playerHitbox = {
            x: player.x,
            y: player.y + player.height - 10,
            width: player.width,
            height: 10
        };
        
        for (const pad of boostPads) {
            if (rectIntersect(playerHitbox, pad)) {
                return {
                    collided: true,
                    pad: pad
                };
            }
        }
        
        return { collided: false };
    }
    
    function checkRailGrind(player, rails, grindKeyPressed) {
        if (!grindKeyPressed && !player.isGrinding) {
            return { grinding: false };
        }
        
        const playerBottom = player.y + player.height;
        const playerCenterX = player.x + player.width / 2;
        
        for (const rail of rails) {
            const railTop = rail.y;
            const railLeft = rail.x;
            const railRight = rail.x + rail.width;
            
            if (playerCenterX > railLeft && playerCenterX < railRight) {
                const verticalDist = Math.abs(playerBottom - railTop);
                
                if (player.isGrinding && player.onRail === rail) {
                    if (verticalDist < 30) {
                        return {
                            grinding: true,
                            rail: rail,
                            canContinue: true
                        };
                    } else {
                        return {
                            grinding: false,
                            rail: rail,
                            ended: true
                        };
                    }
                }
                
                if (grindKeyPressed && !player.isGrounded && verticalDist < 20 && verticalDist > -10) {
                    return {
                        grinding: true,
                        rail: rail,
                        started: true
                    };
                }
            }
        }
        
        if (player.isGrinding) {
            return {
                grinding: false,
                ended: true
            };
        }
        
        return { grinding: false };
    }
    
    function checkVehicleCollision(player, vehicles) {
        const playerHitbox = {
            x: player.x + 5,
            y: player.y + 5,
            width: player.width - 10,
            height: player.height - 5
        };
        
        for (const vehicle of vehicles) {
            if (rectIntersect(playerHitbox, vehicle)) {
                return {
                    collided: true,
                    vehicle: vehicle
                };
            }
        }
        
        return { collided: false };
    }
    
    function checkFallOffMap(player, groundY, fallLimit = 500) {
        return player.y > groundY + fallLimit;
    }
    
    function checkScreenBounds(entity, canvasWidth, canvasHeight) {
        return entity.x + entity.width < 0 || 
               entity.x > canvasWidth ||
               entity.y + entity.height < 0 ||
               entity.y > canvasHeight;
    }
    
    function clampToScreen(entity, canvasWidth, canvasHeight) {
        if (entity.x < 0) entity.x = 0;
        if (entity.x + entity.width > canvasWidth) entity.x = canvasWidth - entity.width;
        if (entity.y < 0) entity.y = 0;
        if (entity.y + entity.height > canvasHeight) entity.y = canvasHeight - entity.height;
    }
    
    function getCollisionSide(player, obstacle) {
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const obstacleCenterX = obstacle.x + obstacle.width / 2;
        const obstacleCenterY = obstacle.y + obstacle.height / 2;
        
        const dx = playerCenterX - obstacleCenterX;
        const dy = playerCenterY - obstacleCenterY;
        const width = (player.width + obstacle.width) / 2;
        const height = (player.height + obstacle.height) / 2;
        const crossWidth = width * dy;
        const crossHeight = height * dx;
        
        if (Math.abs(dx) <= width && Math.abs(dy) <= height) {
            if (crossWidth > crossHeight) {
                return crossWidth > -crossHeight ? 'bottom' : 'left';
            } else {
                return crossWidth > -crossHeight ? 'right' : 'top';
            }
        }
        
        return null;
    }
    
    return {
        rectIntersect,
        pointInRect,
        circleIntersect,
        checkObstacleCollision,
        checkCollectibleCollision,
        checkBoostPadCollision,
        checkRailGrind,
        checkVehicleCollision,
        checkFallOffMap,
        checkScreenBounds,
        clampToScreen,
        getCollisionSide
    };
})();
