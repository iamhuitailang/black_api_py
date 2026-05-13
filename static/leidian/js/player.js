const Player = (() => {
    let x = 0;
    let y = 0;
    let width = 0;
    let height = 0;
    let lives = 0;
    let maxLives = 0;
    let speed = 0;
    let damage = 1;
    let isInvincible = false;
    let invincibleTimer = 0;
    let lastShootTime = 0;
    let shootInterval = 0;
    let bulletSpeed = 0;
    let hasDoubleShot = false;
    let hasSpeedBoost = false;
    
    const init = () => {
        width = Config.PLAYER.WIDTH;
        height = Config.PLAYER.HEIGHT;
        lives = Config.PLAYER.INITIAL_LIVES;
        maxLives = Config.PLAYER.MAX_LIVES;
        speed = Config.PLAYER.SPEED;
        damage = Config.PLAYER.BULLET_DAMAGE;
        shootInterval = Config.PLAYER.SHOOT_INTERVAL;
        bulletSpeed = Config.PLAYER.BULLET_SPEED;
        isInvincible = false;
        invincibleTimer = 0;
        lastShootTime = 0;
        hasDoubleShot = false;
        hasSpeedBoost = false;
        
        x = Config.CANVAS_WIDTH / 2 - width / 2;
        y = Config.CANVAS_HEIGHT - height - 50;
    };
    
    const update = (deltaTime) => {
        const currentSpeed = hasSpeedBoost ? speed * 1.5 : speed;
        const movement = Input.getMovement(x + width / 2, y + height / 2, currentSpeed);
        
        x += movement.dx;
        y += movement.dy;
        
        x = Math.max(0, Math.min(Config.CANVAS_WIDTH - width, x));
        y = Math.max(0, Math.min(Config.CANVAS_HEIGHT - height, y));
        
        if (isInvincible) {
            invincibleTimer -= deltaTime;
            if (invincibleTimer <= 0) {
                isInvincible = false;
            }
        }
    };
    
    const shoot = (currentTime) => {
        if (currentTime - lastShootTime < shootInterval) {
            return [];
        }
        
        lastShootTime = currentTime;
        const bullets = [];
        
        if (hasDoubleShot) {
            bullets.push(Bullet.createPlayerBullet(x + width * 0.25, y, damage));
            bullets.push(Bullet.createPlayerBullet(x + width * 0.75, y, damage));
        } else {
            bullets.push(Bullet.createPlayerBullet(x + width / 2, y, damage));
        }
        
        return bullets;
    };
    
    const takeDamage = () => {
        if (isInvincible) return false;
        
        lives--;
        isInvincible = true;
        invincibleTimer = Config.PLAYER.INVINCIBLE_TIME;
        
        return lives <= 0;
    };
    
    const addLife = () => {
        if (lives < maxLives) {
            lives++;
        }
    };
    
    const activateDoubleShot = () => {
        hasDoubleShot = true;
        setTimeout(() => {
            hasDoubleShot = false;
        }, 10000);
    };
    
    const activateSpeedBoost = () => {
        hasSpeedBoost = true;
        setTimeout(() => {
            hasSpeedBoost = false;
        }, 8000);
    };
    
    const activateDamageBoost = () => {
        const originalDamage = damage;
        damage = originalDamage * 2;
        setTimeout(() => {
            damage = originalDamage;
        }, 8000);
    };
    
    const draw = (ctx) => {
        ctx.save();
        
        if (isInvincible && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        ctx.fillStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        ctx.moveTo(x + width / 2, y);
        ctx.lineTo(x + width * 0.1, y + height * 0.8);
        ctx.lineTo(x + width * 0.4, y + height * 0.6);
        ctx.lineTo(x + width / 2, y + height);
        ctx.lineTo(x + width * 0.6, y + height * 0.6);
        ctx.lineTo(x + width * 0.9, y + height * 0.8);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#0088aa';
        ctx.beginPath();
        ctx.moveTo(x + width / 2, y + height * 0.2);
        ctx.lineTo(x + width * 0.35, y + height * 0.5);
        ctx.lineTo(x + width / 2, y + height * 0.45);
        ctx.lineTo(x + width * 0.65, y + height * 0.5);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#ff6600';
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.ellipse(x + width / 2, y + height + 5, 8, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.ellipse(x + width / 2, y + height + 3, 4, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    };
    
    const getState = () => ({
        x, y, width, height, lives, maxLives, speed, damage,
        isInvincible, invincibleTimer, hasDoubleShot, hasSpeedBoost
    });
    
    const restoreState = (state) => {
        x = state.x;
        y = state.y;
        width = state.width;
        height = state.height;
        lives = state.lives;
        maxLives = state.maxLives;
        speed = state.speed;
        damage = state.damage;
        isInvincible = state.isInvincible;
        invincibleTimer = state.invincibleTimer;
        hasDoubleShot = state.hasDoubleShot;
        hasSpeedBoost = state.hasSpeedBoost;
        shootInterval = Config.PLAYER.SHOOT_INTERVAL;
        bulletSpeed = Config.PLAYER.BULLET_SPEED;
    };
    
    return {
        init,
        update,
        shoot,
        takeDamage,
        addLife,
        activateDoubleShot,
        activateSpeedBoost,
        activateDamageBoost,
        draw,
        getState,
        restoreState
    };
})();
