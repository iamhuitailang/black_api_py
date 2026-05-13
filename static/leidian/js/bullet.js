const Bullet = (() => {
    let playerBullets = [];
    let enemyBullets = [];
    
    const createPlayerBullet = (x, y, damage) => {
        return {
            x: x - 3,
            y,
            width: 6,
            height: 20,
            speed: Config.PLAYER.BULLET_SPEED,
            damage,
            isPlayer: true
        };
    };
    
    const createEnemyBullet = (x, y, targetX, targetY, speed = 5) => {
        const angle = Math.atan2(targetY - y, targetX - x);
        return {
            x: x - 4,
            y,
            width: 8,
            height: 8,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            damage: 1,
            isPlayer: false
        };
    };
    
    const addPlayerBullet = (bullet) => {
        playerBullets.push(bullet);
    };
    
    const addEnemyBullet = (bullet) => {
        enemyBullets.push(bullet);
    };
    
    const update = () => {
        playerBullets = playerBullets.filter(bullet => {
            bullet.y -= bullet.speed;
            return bullet.y > -bullet.height;
        });
        
        enemyBullets = enemyBullets.filter(bullet => {
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            return bullet.y < Config.CANVAS_HEIGHT + bullet.height &&
                   bullet.x > -bullet.width &&
                   bullet.x < Config.CANVAS_WIDTH + bullet.width;
        });
    };
    
    const draw = (ctx) => {
        ctx.save();
        ctx.fillStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10;
        
        playerBullets.forEach(bullet => {
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });
        
        ctx.fillStyle = '#ff4444';
        ctx.shadowColor = '#ff4444';
        
        enemyBullets.forEach(bullet => {
            ctx.beginPath();
            ctx.arc(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, 
                    bullet.width / 2, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    };
    
    const clear = () => {
        playerBullets = [];
        enemyBullets = [];
    };
    
    const getPlayerBullets = () => playerBullets;
    const getEnemyBullets = () => enemyBullets;
    
    const removePlayerBullet = (index) => {
        playerBullets.splice(index, 1);
    };
    
    const removeEnemyBullet = (index) => {
        enemyBullets.splice(index, 1);
    };
    
    const getState = () => ({
        playerBullets: [...playerBullets],
        enemyBullets: [...enemyBullets]
    });
    
    const restoreState = (state) => {
        playerBullets = [...state.playerBullets];
        enemyBullets = [...state.enemyBullets];
    };
    
    return {
        createPlayerBullet,
        createEnemyBullet,
        addPlayerBullet,
        addEnemyBullet,
        update,
        draw,
        clear,
        getPlayerBullets,
        getEnemyBullets,
        removePlayerBullet,
        removeEnemyBullet,
        getState,
        restoreState
    };
})();
