class Level {
    constructor(levelNum, roomNum) {
        this.levelNum = levelNum;
        this.roomNum = roomNum;
        this.isBossRoom = this.checkIsBossRoom();
        
        this.platforms = [];
        this.enemies = [];
        this.snowdrifts = [];
        
        this.generate();
    }
    
    checkIsBossRoom() {
        return this.roomNum % CONFIG.LEVEL.BOSS_EVERY === 0;
    }
    
    generate() {
        this.generatePlatforms();
        this.generateSnowdrifts();
        this.generateEnemies();
    }
    
    generatePlatforms() {
        this.platforms = [];
        
        const groundPlatform = new Platform(
            0, CONFIG.CANVAS_HEIGHT - 40,
            CONFIG.CANVAS_WIDTH, 40,
            true, true
        );
        this.platforms.push(groundPlatform);
        
        const platformCount = 4 + Math.floor(this.roomNum / 2);
        const minY = 300;
        const maxY = CONFIG.CANVAS_HEIGHT - 120;
        const heightStep = (maxY - minY) / 3;
        
        for (let i = 0; i < platformCount; i++) {
            const y = minY + heightStep * (i % 3) + Utils.random(-15, 15);
            const width = Utils.randomInt(100, 180);
            const x = Utils.randomInt(20, CONFIG.CANVAS_WIDTH - width - 20);
            
            let overlaps = false;
            for (const p of this.platforms) {
                if (Math.abs(p.y - y) < 50 && 
                    x < p.x + p.width && 
                    x + width > p.x) {
                    overlaps = true;
                    break;
                }
            }
            
            if (!overlaps) {
                this.platforms.push(new Platform(
                    x, y, width, 20,
                    true, Math.random() > 0.5
                ));
            }
        }
    }
    
    generateSnowdrifts() {
        this.snowdrifts = [];
        
        const driftCount = Utils.randomInt(2, 4);
        for (let i = 0; i < driftCount; i++) {
            const x = Utils.randomInt(50, CONFIG.CANVAS_WIDTH - 100);
            const y = CONFIG.CANVAS_HEIGHT - 60 - Utils.randomInt(0, 10);
            const width = Utils.randomInt(60, 100);
            const height = Utils.randomInt(20, 30);
            
            this.snowdrifts.push(new SnowDrift(x, y, width, height));
        }
    }
    
    generateEnemies() {
        this.enemies = [];
        
        if (this.isBossRoom) {
            this.generateBoss();
            return;
        }
        
        const enemyCount = 3 + Math.floor(this.roomNum / 2);
        const availableTypes = this.getAvailableEnemyTypes();
        
        for (let i = 0; i < enemyCount; i++) {
            const type = availableTypes[Utils.randomInt(0, availableTypes.length - 1)];
            const pos = this.getEnemySpawnPosition();
            
            const enemy = new Enemy(pos.x, pos.y, type);
            this.enemies.push(enemy);
        }
    }
    
    getAvailableEnemyTypes() {
        const types = ['GREEN_MONSTER'];
        
        if (this.roomNum >= 2) {
            types.push('RED_BAT');
        }
        
        if (this.roomNum >= 4) {
            types.push('ICE_OCTOPUS');
        }
        
        return types;
    }
    
    getEnemySpawnPosition() {
        const platformIndex = this.platforms.length > 1 
            ? Utils.randomInt(1, this.platforms.length - 1) 
            : 0;
        const platform = this.platforms[platformIndex];
        
        const minX = platform.x + 20;
        const maxX = platform.x + platform.width - 60;
        
        if (maxX <= minX) {
            return {
                x: platform.x + platform.width / 2 - 18,
                y: platform.y - 50
            };
        }
        
        return {
            x: Utils.randomInt(minX, maxX),
            y: platform.y - 50
        };
    }
    
    generateBoss() {
        const boss = new Enemy(
            CONFIG.CANVAS_WIDTH / 2 - 40,
            100,
            'BOSS'
        );
        this.enemies.push(boss);
        
        const minionCount = 2;
        for (let i = 0; i < minionCount; i++) {
            const pos = this.getEnemySpawnPosition();
            this.enemies.push(new Enemy(pos.x, pos.y, 'GREEN_MONSTER'));
        }
    }
    
    getPlayerStartPosition() {
        return {
            x: 100,
            y: CONFIG.CANVAS_HEIGHT - 100
        };
    }
    
    isCleared() {
        return this.enemies.length === 0;
    }
    
    update() {
        this.snowdrifts.forEach(drift => drift.update());
    }
    
    drawBackground(ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
        gradient.addColorStop(0, '#1a1a4a');
        gradient.addColorStop(0.5, '#2a2a6a');
        gradient.addColorStop(1, '#1a3a5a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        
        this.drawSnowflakes(ctx);
        this.drawCastle(ctx);
    }
    
    drawSnowflakes(ctx) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        const time = Date.now() / 1000;
        
        for (let i = 0; i < 30; i++) {
            const x = (i * 73 + time * 20) % CONFIG.CANVAS_WIDTH;
            const y = (i * 47 + time * 30 + Math.sin(time + i) * 10) % CONFIG.CANVAS_HEIGHT;
            const size = 2 + (i % 3);
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawCastle(ctx) {
        ctx.fillStyle = 'rgba(100, 149, 237, 0.2)';
        
        for (let i = 0; i < 5; i++) {
            const x = i * 180 - 20;
            const height = 80 + (i % 2) * 40;
            
            ctx.fillRect(x, CONFIG.CANVAS_HEIGHT - 40 - height, 60, height);
            
            ctx.fillRect(x - 5, CONFIG.CANVAS_HEIGHT - 40 - height - 15, 15, 15);
            ctx.fillRect(x + 20, CONFIG.CANVAS_HEIGHT - 40 - height - 15, 15, 15);
            ctx.fillRect(x + 45, CONFIG.CANVAS_HEIGHT - 40 - height - 15, 15, 15);
        }
        
        ctx.fillStyle = 'rgba(135, 206, 235, 0.3)';
        const time = Date.now() / 2000;
        for (let i = 0; i < 8; i++) {
            const angle = time + (Math.PI * 2 / 8) * i;
            const length = 150 + Math.sin(time * 2 + i) * 20;
            const startX = 400;
            const startY = 200;
            const endX = startX + Math.cos(angle) * length;
            const endY = startY + Math.sin(angle) * length;
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = `rgba(135, 206, 235, ${0.1 + Math.sin(time + i) * 0.1})`;
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }
    
    draw(ctx) {
        this.drawBackground(ctx);
        this.snowdrifts.forEach(drift => drift.draw(ctx));
        this.platforms.forEach(platform => platform.draw(ctx));
    }
}
