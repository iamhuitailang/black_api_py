const Levels = {
    1: {
        name: '星光草原',
        width: 1800,
        height: 700,
        playerStart: { x: 50, y: 550 },
        goal: { x: 1700, y: 100, width: 60, height: 80 },
        platforms: [
            { x: 0, y: 650, width: 400, height: 50, type: 'solid' },
            { x: 500, y: 600, width: 150, height: 30, type: 'solid' },
            { x: 700, y: 520, width: 150, height: 30, type: 'solid' },
            { x: 900, y: 450, width: 150, height: 30, type: 'solid' },
            { x: 1100, y: 380, width: 150, height: 30, type: 'solid' },
            { x: 1300, y: 310, width: 150, height: 30, type: 'solid' },
            { x: 1500, y: 240, width: 150, height: 30, type: 'solid' },
            { x: 1650, y: 180, width: 150, height: 30, type: 'solid' }
        ],
        enemies: [
            { x: 550, y: 565, patrolDistance: 120 }
        ],
        traps: [
            { x: 450, y: 630, width: 40, height: 20, type: 'spike' }
        ]
    },
    
    2: {
        name: '流星峡谷',
        width: 2200,
        height: 700,
        playerStart: { x: 50, y: 550 },
        goal: { x: 2100, y: 80, width: 60, height: 80 },
        platforms: [
            { x: 0, y: 650, width: 300, height: 50, type: 'solid' },
            { x: 400, y: 600, width: 120, height: 30, type: 'fragile' },
            { x: 580, y: 530, width: 120, height: 30, type: 'fragile' },
            { x: 750, y: 470, width: 180, height: 30, type: 'moving', options: { moveX: 100, moveY: 0, speed: 2 } },
            { x: 1000, y: 400, width: 120, height: 30, type: 'solid' },
            { x: 1180, y: 340, width: 120, height: 30, type: 'fragile' },
            { x: 1350, y: 280, width: 180, height: 30, type: 'moving', options: { moveX: 0, moveY: 60, speed: 2.5 } },
            { x: 1580, y: 220, width: 120, height: 30, type: 'solid' },
            { x: 1750, y: 160, width: 120, height: 30, type: 'fragile' },
            { x: 1920, y: 100, width: 150, height: 30, type: 'solid' },
            { x: 2050, y: 160, width: 150, height: 30, type: 'solid' }
        ],
        enemies: [
            { x: 1030, y: 365, patrolDistance: 80 },
            { x: 1610, y: 185, patrolDistance: 80 }
        ],
        traps: [
            { x: 330, y: 630, width: 60, height: 20, type: 'spike' },
            { x: 1450, y: 260, width: 50, height: 20, type: 'spike' }
        ]
    },
    
    3: {
        name: '星云圣殿',
        width: 2600,
        height: 700,
        playerStart: { x: 50, y: 550 },
        goal: { x: 2480, y: 60, width: 60, height: 80 },
        platforms: [
            { x: 0, y: 650, width: 250, height: 50, type: 'solid' },
            { x: 320, y: 600, width: 100, height: 30, type: 'invisible' },
            { x: 470, y: 540, width: 100, height: 30, type: 'invisible' },
            { x: 620, y: 480, width: 150, height: 30, type: 'moving', options: { moveX: 80, moveY: 0, speed: 3 } },
            { x: 850, y: 420, width: 100, height: 30, type: 'fragile' },
            { x: 1000, y: 360, width: 100, height: 30, type: 'invisible' },
            { x: 1150, y: 300, width: 150, height: 30, type: 'moving', options: { moveX: 0, moveY: 70, speed: 2.5 } },
            { x: 1350, y: 240, width: 100, height: 30, type: 'fragile' },
            { x: 1500, y: 190, width: 100, height: 30, type: 'invisible' },
            { x: 1650, y: 140, width: 180, height: 30, type: 'moving', options: { moveX: 120, moveY: 0, speed: 2 } },
            { x: 1900, y: 100, width: 100, height: 30, type: 'solid' },
            { x: 2050, y: 80, width: 100, height: 30, type: 'fragile' },
            { x: 2200, y: 60, width: 100, height: 30, type: 'invisible' },
            { x: 2380, y: 140, width: 150, height: 30, type: 'solid' }
        ],
        enemies: [
            { x: 670, y: 445, patrolDistance: 100 },
            { x: 1180, y: 265, patrolDistance: 100 },
            { x: 1700, y: 105, patrolDistance: 120 }
        ],
        traps: [
            { x: 270, y: 630, width: 40, height: 20, type: 'spike' },
            { x: 780, y: 460, width: 60, height: 20, type: 'spike' },
            { x: 1280, y: 220, width: 60, height: 20, type: 'spike' },
            { x: 1830, y: 80, width: 60, height: 20, type: 'spike' }
        ]
    }
};

class Level {
    constructor(levelNum) {
        this.levelNum = levelNum;
        this.data = Levels[levelNum];
        this.platforms = [];
        this.enemies = [];
        this.traps = [];
        this.load();
    }
    
    load() {
        this.platforms = this.data.platforms.map(p => 
            new Platform(p.x, p.y, p.width, p.height, p.type, p.options || {})
        );
        
        this.enemies = this.data.enemies.map(e => 
            new Enemy(e.x, e.y, e)
        );
        
        this.traps = this.data.traps.map(t => 
            new Trap(t.x, t.y, t.type, t)
        );
    }
    
    update(deltaTime, playerX, playerY) {
        this.platforms.forEach(p => p.update(deltaTime, playerX, playerY));
        this.enemies.forEach(e => e.update(deltaTime));
        this.traps.forEach(t => t.update(deltaTime));
    }
    
    render(ctx, particleSystem) {
        this.platforms.forEach(p => p.render(ctx, particleSystem));
        this.enemies.forEach(e => e.render(ctx));
        this.traps.forEach(t => t.render(ctx));
        this.renderGoal(ctx);
    }
    
    renderGoal(ctx) {
        ctx.save();
        
        const g = this.data.goal;
        const time = Date.now();
        const wave = Math.sin(time / 200) * 5;
        
        ctx.fillStyle = '#8b7355';
        ctx.shadowBlur = 0;
        ctx.fillRect(g.x + 25, g.y, 8, g.height);
        
        ctx.fillStyle = '#fdcb6e';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#fdcb6e';
        
        ctx.beginPath();
        ctx.moveTo(g.x + 33, g.y + 5);
        ctx.lineTo(g.x + 33 + 40 + wave, g.y + 25);
        ctx.lineTo(g.x + 33, g.y + 45);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#ffeaa7';
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#ffeaa7';
        ctx.beginPath();
        ctx.arc(g.x + 50, g.y - 10, 15, 0, Math.PI * 2);
        ctx.fill();
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + time / 500;
            const rayLength = 20 + Math.sin(time / 300 + i) * 5;
            ctx.beginPath();
            ctx.moveTo(g.x + 50, g.y - 10);
            ctx.lineTo(
                g.x + 50 + Math.cos(angle) * rayLength,
                g.y - 10 + Math.sin(angle) * rayLength
            );
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(253, 203, 110, 0.6)';
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    getWidth() {
        return this.data.width;
    }
    
    getHeight() {
        return this.data.height;
    }
    
    getPlayerStart() {
        return this.data.playerStart;
    }
    
    getGoal() {
        return this.data.goal;
    }
    
    serialize() {
        return {
            levelNum: this.levelNum,
            platforms: this.platforms.map(p => p.serialize()),
            enemies: this.enemies.map(e => e.serialize()),
            traps: this.traps.map(t => t.serialize())
        };
    }
    
    static deserialize(data) {
        const level = new Level(data.levelNum);
        level.platforms = data.platforms.map(p => Platform.deserialize(p));
        level.enemies = data.enemies.map(e => Enemy.deserialize(e));
        level.traps = data.traps.map(t => Trap.deserialize(t));
        return level;
    }
}
