const Player = (function() {
    let x = 0;
    let y = 0;
    let width = Config.PLAYER.width;
    let height = Config.PLAYER.height;
    let velocityX = 0;
    let velocityY = 0;
    let isJumping = false;
    let isFalling = false;
    let health = Config.PLAYER.maxHealth;
    let isInvincible = false;
    let invincibleTimer = 0;
    let speedMultiplier = 1;
    let speedBoostTimer = 0;
    let hasShield = false;
    let jumpCount = 0;
    let maxJumps = 2;
    let angle = 0;
    let animTime = 0;
    
    function init() {
        x = Config.PLAYER.startX;
        y = Config.PLAYER.startY;
        velocityX = 0;
        velocityY = 0;
        isJumping = false;
        isFalling = false;
        health = Config.PLAYER.maxHealth;
        isInvincible = false;
        invincibleTimer = 0;
        speedMultiplier = 1;
        speedBoostTimer = 0;
        hasShield = false;
        jumpCount = 0;
        angle = 0;
        animTime = 0;
    }
    
    function update(keys, deltaTime) {
        velocityX = 0;
        if (keys.left) {
            velocityX = -Config.PLAYER.moveSpeed;
            angle = Math.max(angle - 0.1, -0.5);
        } else if (keys.right) {
            velocityX = Config.PLAYER.moveSpeed;
            angle = Math.min(angle + 0.1, 0.5);
        } else {
            angle *= 0.9;
        }
        
        x += velocityX;
        
        const minX = width / 2 + 20;
        const maxX = Config.CANVAS_WIDTH - width / 2 - 20;
        x = Math.max(minX, Math.min(maxX, x));
        
        if (isJumping || isFalling) {
            velocityY += Config.PLAYER.gravity;
            y += velocityY;
            
            if (y >= Config.PLAYER.startY) {
                y = Config.PLAYER.startY;
                velocityY = 0;
                isJumping = false;
                isFalling = false;
                jumpCount = 0;
            }
        }
        
        if (isInvincible) {
            invincibleTimer -= deltaTime;
            if (invincibleTimer <= 0) {
                isInvincible = false;
            }
        }
        
        if (speedBoostTimer > 0) {
            speedBoostTimer -= deltaTime;
            if (speedBoostTimer <= 0) {
                speedMultiplier = 1;
            }
        }
        
        animTime += deltaTime * 0.01;
    }
    
    function jump() {
        if (jumpCount < maxJumps) {
            velocityY = -Config.PLAYER.jumpPower;
            isJumping = true;
            isFalling = true;
            jumpCount++;
        }
    }
    
    function takeDamage(amount) {
        if (isInvincible) return false;
        
        if (hasShield) {
            hasShield = false;
            setInvincible(1000);
            return true;
        }
        
        health -= amount;
        setInvincible(Config.PLAYER.invincibleTime);
        return true;
    }
    
    function heal(amount) {
        health = Math.min(health + amount, Config.PLAYER.maxHealth);
    }
    
    function setInvincible(time) {
        isInvincible = true;
        invincibleTimer = time;
    }
    
    function setSpeedBoost(multiplier, duration) {
        speedMultiplier = multiplier;
        speedBoostTimer = duration;
    }
    
    function getSpeedMultiplier() {
        return speedMultiplier;
    }
    
    function setShield() {
        hasShield = true;
    }
    
    function getState() {
        return {
            x, y, width, height, velocityX, velocityY,
            isJumping, isFalling, health, isInvincible,
            invincibleTimer, speedMultiplier, speedBoostTimer,
            hasShield, jumpCount, angle, animTime
        };
    }
    
    function loadState(state) {
        x = state.x;
        y = state.y;
        width = state.width;
        height = state.height;
        velocityX = state.velocityX;
        velocityY = state.velocityY;
        isJumping = state.isJumping;
        isFalling = state.isFalling;
        health = state.health;
        isInvincible = state.isInvincible;
        invincibleTimer = state.invincibleTimer;
        speedMultiplier = state.speedMultiplier;
        speedBoostTimer = state.speedBoostTimer;
        hasShield = state.hasShield;
        jumpCount = state.jumpCount;
        angle = state.angle || 0;
        animTime = state.animTime || 0;
    }
    
    function draw(ctx) {
        const w = width;
        const h = height;
        const glideOffset = isJumping ? 0 : Math.sin(animTime) * 1.5;
        
        ctx.save();
        ctx.translate(x, y + glideOffset);
        ctx.rotate(angle);
        
        if (isInvincible && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        if (hasShield) {
            ctx.beginPath();
            ctx.arc(0, 0, h * 0.55, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(52, 152, 219, 0.6)';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.fillStyle = 'rgba(52, 152, 219, 0.15)';
            ctx.fill();
        }
        
        ctx.fillStyle = '#2C3E50';
        ctx.save();
        ctx.rotate(-0.7);
        ctx.fillRect(-w * 0.5, h * 0.28, w * 0.65, h * 0.05);
        ctx.restore();
        
        ctx.save();
        ctx.rotate(0.7);
        ctx.fillRect(-w * 0.15, h * 0.28, w * 0.65, h * 0.05);
        ctx.restore();
        
        ctx.fillStyle = '#3498DB';
        ctx.fillRect(-w * 0.16, h * 0.12, w * 0.12, h * 0.16);
        ctx.fillRect(w * 0.04, h * 0.12, w * 0.12, h * 0.16);
        
        ctx.fillStyle = '#E74C3C';
        ctx.beginPath();
        ctx.ellipse(0, 0, w * 0.28, h * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#C0392B';
        ctx.fillRect(-w * 0.25, -h * 0.08, w * 0.5, h * 0.08);
        
        ctx.fillStyle = '#FFE4C4';
        ctx.fillRect(-w * 0.1, -h * 0.18, w * 0.07, h * 0.14);
        ctx.fillRect(w * 0.03, -h * 0.18, w * 0.07, h * 0.14);
        
        ctx.fillStyle = '#2C3E50';
        ctx.save();
        ctx.rotate(-0.5);
        ctx.fillRect(-w * 0.45, -h * 0.22, w * 0.38, h * 0.05);
        ctx.restore();
        
        ctx.save();
        ctx.rotate(0.5);
        ctx.fillRect(w * 0.07, -h * 0.22, w * 0.38, h * 0.05);
        ctx.restore();
        
        ctx.fillStyle = '#FFE4C4';
        ctx.beginPath();
        ctx.arc(0, -h * 0.32, w * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#2C3E50';
        ctx.beginPath();
        ctx.ellipse(0, -h * 0.43, w * 0.22, h * 0.07, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-w * 0.13, -h * 0.5, w * 0.26, h * 0.08);
        
        ctx.fillStyle = '#E74C3C';
        ctx.beginPath();
        ctx.arc(0, -h * 0.45, w * 0.05, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#2C3E50';
        ctx.beginPath();
        ctx.arc(-w * 0.08, -h * 0.32, w * 0.03, 0, Math.PI * 2);
        ctx.arc(w * 0.08, -h * 0.32, w * 0.03, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#E74C3C';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -h * 0.26, w * 0.07, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
        
        ctx.restore();
    }
    
    function getBounds() {
        return {
            x: x - width * 0.3,
            y: y - height * 0.4,
            width: width * 0.6,
            height: height * 0.7
        };
    }
    
    return {
        init,
        update,
        jump,
        takeDamage,
        heal,
        setInvincible,
        setSpeedBoost,
        getSpeedMultiplier,
        setShield,
        getState,
        loadState,
        draw,
        getBounds,
        getX: () => x,
        getY: () => y,
        getHealth: () => health,
        getMaxHealth: () => Config.PLAYER.maxHealth,
        isInvincible: () => isInvincible,
        hasShield: () => hasShield,
        isJumping: () => isJumping,
        getSpeedBoostTimer: () => speedBoostTimer
    };
})();
