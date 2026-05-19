const Obstacle = (function() {
    let obstacles = [];
    let spawnTimer = 0;
    let lastSpawnY = -200;
    
    function init() {
        obstacles = [];
        spawnTimer = 0;
        lastSpawnY = -200;
    }
    
    function spawn(distance) {
        const types = Object.values(Config.OBSTACLE_TYPES);
        const density = Config.getDensityByDistance(distance);
        
        const collectibleChance = 0.15;
        const isCollectible = Math.random() < collectibleChance;
        
        let availableTypes;
        if (isCollectible) {
            availableTypes = types.filter(t => t.isCollectible);
        } else {
            availableTypes = types.filter(t => !t.isCollectible);
        }
        
        const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        const x = Math.random() * (Config.CANVAS_WIDTH - 100) + 50;
        
        obstacles.push({
            type: type,
            x: x,
            y: -50,
            width: type.width,
            height: type.height,
            collected: false
        });
    }
    
    function update(speed, deltaTime, distance) {
        spawnTimer += deltaTime;
        const spawnInterval = 1000 / (Config.getDensityByDistance(distance) * 60);
        
        if (spawnTimer >= spawnInterval) {
            spawn(distance);
            spawnTimer = 0;
        }
        
        for (let i = obstacles.length - 1; i >= 0; i--) {
            obstacles[i].y += speed;
            
            if (obstacles[i].y > Config.CANVAS_HEIGHT + 100) {
                obstacles.splice(i, 1);
            }
        }
    }
    
    function checkCollision(playerBounds, isJumping) {
        for (let i = 0; i < obstacles.length; i++) {
            const obs = obstacles[i];
            if (obs.collected) continue;
            
            const obsBounds = {
                x: obs.x - obs.width / 2,
                y: obs.y - obs.height / 2,
                width: obs.width,
                height: obs.height
            };
            
            if (isColliding(playerBounds, obsBounds)) {
                if (obs.type.isCollectible) {
                    obs.collected = true;
                    return { hit: true, type: obs.type, obstacle: obs, isCollect: true };
                }
                
                if (obs.type.mustJump && isJumping) {
                    continue;
                }
                
                if (obs.type.canJump && isJumping) {
                    continue;
                }
                
                return { hit: true, type: obs.type, obstacle: obs, isCollect: false };
            }
        }
        return { hit: false };
    }
    
    function isColliding(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }
    
    function remove(obstacle) {
        const index = obstacles.indexOf(obstacle);
        if (index > -1) {
            obstacles.splice(index, 1);
        }
    }
    
    function draw(ctx) {
        obstacles.forEach(obs => {
            if (obs.collected) return;
            
            ctx.save();
            ctx.translate(obs.x, obs.y);
            
            ctx.font = `${obs.height}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(obs.type.emoji, 0, 0);
            
            ctx.restore();
        });
    }
    
    function getState() {
        return {
            obstacles: obstacles.map(o => ({
                typeId: o.type.id,
                x: o.x,
                y: o.y,
                width: o.width,
                height: o.height,
                collected: o.collected
            })),
            spawnTimer,
            lastSpawnY
        };
    }
    
    function loadState(state) {
        const typeMap = {};
        Object.values(Config.OBSTACLE_TYPES).forEach(t => {
            typeMap[t.id] = t;
        });
        
        obstacles = state.obstacles.map(o => ({
            type: typeMap[o.typeId],
            x: o.x,
            y: o.y,
            width: o.width,
            height: o.height,
            collected: o.collected
        }));
        spawnTimer = state.spawnTimer;
        lastSpawnY = state.lastSpawnY;
    }
    
    return {
        init,
        update,
        checkCollision,
        remove,
        draw,
        getState,
        loadState,
        getObstacles: () => obstacles
    };
})();
