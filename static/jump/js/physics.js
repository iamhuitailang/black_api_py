const Physics = {
    updateFreeFall(player, deltaTime) {
        const dt = deltaTime / 1000;
        
        player.velocityY += CONFIG.GRAVITY * dt;
        
        const terminalVelocity = CONFIG.TERMINAL_VELOCITY_FREE_FALL;
        if (player.velocityY > terminalVelocity) {
            player.velocityY = terminalVelocity;
        }
        
        player.y += player.velocityY * dt * 2;
        player.altitude = Math.max(0, CONFIG.GAME.START_ALTITUDE - player.y);
    },
    
    updateParachuteFall(player, windSpeed, deltaTime) {
        const dt = deltaTime / 1000;
        
        player.velocityY += CONFIG.GRAVITY * dt * 0.3;
        
        const terminalVelocity = CONFIG.TERMINAL_VELOCITY_PARACHUTE;
        if (player.velocityY > terminalVelocity) {
            player.velocityY = terminalVelocity;
        }
        
        const drag = 1 - CONFIG.PARACHUTE_DRAG * dt;
        player.velocityX *= drag;
        player.velocityY *= drag;
        
        player.velocityX += windSpeed * dt * 2;
        
        player.x += player.velocityX * dt * 2;
        player.y += player.velocityY * dt * 2;
        
        player.x = Utils.clamp(player.x, 50, CONFIG.GAME.WORLD_WIDTH - 50);
        player.altitude = Math.max(0, CONFIG.GAME.START_ALTITUDE - player.y);
    },
    
    applyHorizontalControl(player, direction, deltaTime) {
        const dt = deltaTime / 1000;
        const moveSpeed = CONFIG.PLAYER.MOVE_SPEED;
        
        player.velocityX += direction * moveSpeed * dt * 10;
        player.velocityX = Utils.clamp(player.velocityX, -15, 15);
    },
    
    applyVerticalControl(player, isFastDescend, isSlowDescend) {
        if (isFastDescend) {
            player.velocityY *= CONFIG.PLAYER.FAST_DESCEND_MULTIPLIER;
        } else if (isSlowDescend) {
            player.velocityY *= CONFIG.PLAYER.SLOW_DESCEND_MULTIPLIER;
        }
    },
    
    checkCollision(obj1, obj2) {
        const dist = Utils.distance(obj1.x, obj1.y, obj2.x, obj2.y);
        return dist < (obj1.radius || 20) + (obj2.radius || 20);
    },
    
    applyStaminaCost(player, cost, deltaTime) {
        const dt = deltaTime / 1000;
        player.stamina = Math.max(0, player.stamina - cost * dt * 60);
    },
    
    regenerateStamina(player, deltaTime) {
        const dt = deltaTime / 1000;
        player.stamina = Math.min(CONFIG.PLAYER.STAMINA_MAX, 
            player.stamina + CONFIG.PLAYER.STAMINA_REGEN * dt);
    },
    
    applyKnockback(player, direction, strength) {
        player.velocityX += direction * strength;
        player.velocityX = Utils.clamp(player.velocityX, -20, 20);
    },
    
    applyTurbulence(player, deltaTime) {
        const dt = deltaTime / 1000;
        const randomX = Utils.randomRange(-1, 1) * dt * 50;
        const randomY = Utils.randomRange(-0.5, 0.5) * dt * 20;
        
        player.velocityX += randomX;
        player.velocityY += randomY;
        
        player.velocityX = Utils.clamp(player.velocityX, -20, 20);
    }
};
