class Level {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.theme = data.theme;
        this.width = data.width;
        this.height = data.height;
        this.tiles = data.tiles || [];
        this.enemies = [];
        this.items = [];
        this.particles = [];
        this.players = [];
        this.spawnPoints = data.spawnPoints || [{ x: 100, y: 300 }];
        this.goal = data.goal || { x: this.width - 100, y: 300, width: 60, height: 80 };
        this.difficultyMultiplier = 1;
        this.backgroundGradient = this.createBackgroundGradient(data.theme);
        this.isBossLevel = data.isBossLevel || false;
        this.boss = null;
    }

    createBackgroundGradient(theme) {
        const gradients = {
            garden: ['#0a1a0a', '#1a3a1a', '#0a2a0a'],
            kitchen: ['#1a1a0a', '#2a2a1a', '#1a2010'],
            toyroom: ['#1a0a1a', '#2a1a2a', '#1a0a2a'],
            lab: ['#0a1a2a', '#1a2a3a', '#0a1a2a'],
            factory: ['#1a1a1a', '#2a2a2a', '#1a1a1a'],
            casino: ['#2a0a1a', '#3a1a2a', '#2a0a1a'],
            boss: ['#1a0a2a', '#2a1a3a', '#1a0a2a']
        };
        return gradients[theme] || gradients.garden;
    }

    init(players, difficulty = 'normal') {
        this.players = players;
        this.difficultyMultiplier = CONFIG.DIFFICULTY[difficulty].enemySpeed;
        
        const enemyConfig = CONFIG.ENEMIES;
        this.enemies = [];
        
        const levelData = LEVELS[this.id - 1];
        if (levelData && levelData.enemies) {
            levelData.enemies.forEach(e => {
                const enemy = new Enemy(e.x, e.y, e.type);
                if (e.patrolLeft !== undefined) {
                    enemy.patrolLeft = e.patrolLeft;
                    enemy.patrolRight = e.patrolRight;
                }
                if (this.isBossLevel && e.type === 'boss_cat') {
                    enemy.health = Math.floor(enemyConfig.boss_cat.health * CONFIG.DIFFICULTY[difficulty].bossHealth);
                    enemy.maxHealth = enemy.health;
                    this.boss = enemy;
                }
                this.enemies.push(enemy);
            });
        }

        this.items = [];
        if (levelData && levelData.items) {
            levelData.items.forEach(i => {
                const item = new Item(i.x, i.y, i.type);
                this.items.push(item);
            });
        }

        players.forEach((player, index) => {
            const spawn = this.spawnPoints[index] || this.spawnPoints[0];
            player.x = spawn.x;
            player.y = spawn.y;
            player.vx = 0;
            player.vy = 0;
            player.active = true;
        });

        this.particles = [];
    }

    getTilesNear(x, y, width, height) {
        const nearby = [];
        const margin = 50;
        
        for (const tile of this.tiles) {
            if (tile.x + tile.width > x - margin &&
                tile.x < x + width + margin &&
                tile.y + tile.height > y - margin &&
                tile.y < y + height + margin) {
                nearby.push(tile);
            }
        }
        
        return nearby;
    }

    getGroundY(x) {
        let groundY = null;
        
        for (const tile of this.tiles) {
            if (tile.solid &&
                x >= tile.x && x <= tile.x + tile.width &&
                tile.y > 0) {
                if (groundY === null || tile.y < groundY) {
                    groundY = tile.y;
                }
            }
        }
        
        return groundY;
    }

    addParticles(particles) {
        this.particles.push(...particles);
    }

    removeItem(item) {
        const index = this.items.indexOf(item);
        if (index > -1) {
            this.items.splice(index, 1);
        }
    }

    update(dt) {
        for (const player of this.players) {
            if (player.active) {
                player.update(dt, this);
            }
        }

        for (const enemy of this.enemies) {
            if (enemy.active) {
                enemy.update(dt, this, this.players);
            }
        }

        for (const item of this.items) {
            if (item.active && !item.isHeld) {
                item.update(dt, this, this.players);
            }
        }

        for (const particle of this.particles) {
            if (particle.active) {
                particle.update(dt);
            }
        }

        this.enemies = this.enemies.filter(e => e.active);
        this.items = this.items.filter(i => i.active || i.isHeld);
        this.particles = this.particles.filter(p => p.active);
    }

    checkGoal(player) {
        if (this.isBossLevel && this.boss && !this.boss.isDead) return false;

        return Utils.rectIntersect(player.bounds, this.goal);
    }

    draw(ctx, cameraX) {
        this.drawBackground(ctx, cameraX);
        
        for (const tile of this.tiles) {
            if (tile.x + tile.width > cameraX && tile.x < cameraX + CONFIG.CANVAS_WIDTH) {
                tile.draw(ctx, cameraX, this.theme);
            }
        }

        const goalScreenX = this.goal.x - cameraX;
        ctx.fillStyle = CONFIG.COLORS.neonGreen;
        ctx.shadowColor = CONFIG.COLORS.neonGreen;
        ctx.shadowBlur = 20;
        ctx.fillRect(goalScreenX, this.goal.y, 10, this.goal.height);
        
        ctx.beginPath();
        ctx.moveTo(goalScreenX + 10, this.goal.y);
        ctx.lineTo(goalScreenX + 50, this.goal.y + 15);
        ctx.lineTo(goalScreenX + 10, this.goal.y + 30);
        ctx.fill();
        ctx.shadowBlur = 0;

        for (const item of this.items) {
            if (item.active && !item.isHeld) {
                item.draw(ctx, cameraX);
            }
        }

        for (const enemy of this.enemies) {
            if (enemy.active) {
                enemy.draw(ctx, cameraX);
            }
        }

        for (const player of this.players) {
            if (player.active) {
                player.draw(ctx, cameraX);
            }
        }

        for (const particle of this.particles) {
            if (particle.active) {
                particle.draw(ctx, cameraX);
            }
        }
    }

    drawBackground(ctx, cameraX) {
        const colors = this.backgroundGradient;
        const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(0.5, colors[1]);
        gradient.addColorStop(1, colors[2]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        ctx.globalAlpha = 0.1;
        for (let i = 0; i < 50; i++) {
            const x = ((i * 73 + cameraX * 0.1) % (CONFIG.CANVAS_WIDTH + 100)) - 50;
            const y = (i * 37) % CONFIG.CANVAS_HEIGHT;
            const size = (i % 3) + 1;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        this.drawThemeElements(ctx, cameraX);
    }

    drawThemeElements(ctx, cameraX) {
        switch (this.theme) {
            case 'garden':
                this.drawGardenBackground(ctx, cameraX);
                break;
            case 'kitchen':
                this.drawKitchenBackground(ctx, cameraX);
                break;
            case 'toyroom':
                this.drawToyRoomBackground(ctx, cameraX);
                break;
            case 'lab':
                this.drawLabBackground(ctx, cameraX);
                break;
            case 'factory':
                this.drawFactoryBackground(ctx, cameraX);
                break;
            case 'casino':
                this.drawCasinoBackground(ctx, cameraX);
                break;
            case 'boss':
                this.drawBossBackground(ctx, cameraX);
                break;
        }
    }

    drawGardenBackground(ctx, cameraX) {
        ctx.fillStyle = '#0d2818';
        for (let i = 0; i < 10; i++) {
            const x = (i * 200 - cameraX * 0.3) % (this.width + 400) - 200;
            ctx.beginPath();
            ctx.moveTo(x, CONFIG.CANVAS_HEIGHT);
            ctx.lineTo(x + 50, CONFIG.CANVAS_HEIGHT - 150);
            ctx.lineTo(x + 100, CONFIG.CANVAS_HEIGHT);
            ctx.fill();
        }
    }

    drawKitchenBackground(ctx, cameraX) {
        ctx.fillStyle = '#2a2010';
        for (let i = 0; i < 8; i++) {
            const x = (i * 250 - cameraX * 0.2) % (this.width + 500) - 250;
            ctx.fillRect(x, 100, 150, 200);
            ctx.strokeStyle = '#4a4030';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, 100, 150, 200);
        }
    }

    drawToyRoomBackground(ctx, cameraX) {
        const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3'];
        for (let i = 0; i < 15; i++) {
            const x = (i * 180 - cameraX * 0.4) % (this.width + 360) - 180;
            const y = 50 + (i % 3) * 100;
            ctx.fillStyle = colors[i % colors.length];
            ctx.shadowColor = colors[i % colors.length];
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(x, y, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    drawLabBackground(ctx, cameraX) {
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 1;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 5;
        for (let i = 0; i < 10; i++) {
            const y = 80 + i * 50;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(CONFIG.CANVAS_WIDTH, y);
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
    }

    drawFactoryBackground(ctx, cameraX) {
        ctx.fillStyle = '#333';
        for (let i = 0; i < 12; i++) {
            const x = (i * 150 - cameraX * 0.5) % (this.width + 300) - 150;
            ctx.fillRect(x, 0, 30, CONFIG.CANVAS_HEIGHT);
            
            const gearY = 100 + (i % 3) * 150;
            const rotation = (Date.now() / 1000 + i) % (Math.PI * 2);
            this.drawGear(ctx, x + 15, gearY, 40, rotation);
        }
    }

    drawGear(ctx, x, y, radius, rotation) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        
        ctx.fillStyle = '#555';
        ctx.strokeStyle = '#777';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const innerR = radius * 0.7;
            const outerR = radius;
            ctx.lineTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
            ctx.lineTo(Math.cos(angle + 0.2) * outerR, Math.sin(angle + 0.2) * outerR);
            ctx.lineTo(Math.cos(angle + 0.4) * outerR, Math.sin(angle + 0.4) * outerR);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    drawCasinoBackground(ctx, cameraX) {
        const colors = ['#ff0000', '#000000'];
        for (let i = 0; i < 20; i++) {
            const x = (i * 100 - cameraX * 0.3) % (this.width + 200) - 100;
            ctx.fillStyle = colors[i % 2];
            ctx.globalAlpha = 0.3;
            ctx.fillRect(x, 0, 100, CONFIG.CANVAS_HEIGHT);
            ctx.globalAlpha = 1;
        }
        
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 10;
        for (let i = 0; i < 10; i++) {
            const x = (i * 200 - cameraX * 0.2) % (this.width + 400) - 200;
            ctx.font = '30px Arial';
            ctx.fillText('$', x, 100 + (i % 3) * 80);
        }
        ctx.shadowBlur = 0;
    }

    drawBossBackground(ctx, cameraX) {
        const centerX = CONFIG.CANVAS_WIDTH / 2;
        const gradient = ctx.createRadialGradient(centerX, CONFIG.CANVAS_HEIGHT / 2, 0, centerX, CONFIG.CANVAS_HEIGHT / 2, 400);
        gradient.addColorStop(0, 'rgba(168, 85, 247, 0.2)');
        gradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 10;
        const time = Date.now() / 1000;
        for (let i = 0; i < 3; i++) {
            const radius = 100 + i * 80 + Math.sin(time + i) * 20;
            ctx.globalAlpha = 0.3 - i * 0.1;
            ctx.beginPath();
            ctx.arc(centerX, CONFIG.CANVAS_HEIGHT / 2, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }
}

const LEVELS = [
    {
        id: 1,
        name: '花园庭院',
        theme: 'garden',
        width: 3000,
        height: 540,
        spawnPoints: [{ x: 100, y: 300 }, { x: 150, y: 300 }],
        goal: { x: 2850, y: 320, width: 60, height: 80 },
        tiles: [
            ...createGroundTiles(0, 460, 3000, 80),
            new Tile(300, 380, 120, 20, 'solid'),
            new Tile(500, 320, 120, 20, 'solid'),
            new Tile(700, 260, 120, 20, 'solid'),
            new Tile(900, 380, 150, 20, 'solid'),
            new Tile(1100, 320, 120, 20, 'solid'),
            new Tile(1300, 260, 150, 20, 'solid'),
            new Tile(1500, 380, 120, 20, 'solid'),
            new Tile(1700, 320, 150, 20, 'solid'),
            new Tile(1900, 260, 120, 20, 'solid'),
            new Tile(2100, 380, 150, 20, 'solid'),
            new Tile(2300, 320, 120, 20, 'solid'),
            new Tile(2500, 380, 150, 20, 'solid'),
            new Tile(2700, 320, 120, 20, 'solid')
        ],
        enemies: [
            { type: 'rat', x: 400, y: 430, patrolLeft: 350, patrolRight: 550 },
            { type: 'rat', x: 800, y: 430, patrolLeft: 750, patrolRight: 950 },
            { type: 'bee', x: 600, y: 200 },
            { type: 'rat', x: 1200, y: 430, patrolLeft: 1150, patrolRight: 1350 },
            { type: 'bee', x: 1400, y: 180 },
            { type: 'rat', x: 1800, y: 430, patrolLeft: 1750, patrolRight: 1950 },
            { type: 'dog', x: 2200, y: 420, patrolLeft: 2100, patrolRight: 2400 },
            { type: 'bee', x: 2400, y: 200 },
            { type: 'rat', x: 2600, y: 430, patrolLeft: 2550, patrolRight: 2750 }
        ],
        items: [
            { type: 'wood_box', x: 200, y: 420 },
            { type: 'wood_box', x: 350, y: 340 },
            { type: 'apple', x: 450, y: 430 },
            { type: 'flower', x: 550, y: 290 },
            { type: 'wood_box', x: 750, y: 280 },
            { type: 'pinecone', x: 950, y: 350 },
            { type: 'flower', x: 1150, y: 290 },
            { type: 'wood_box', x: 1350, y: 220 },
            { type: 'star', x: 1550, y: 350 },
            { type: 'flower', x: 1750, y: 290 },
            { type: 'bomb', x: 1950, y: 220 },
            { type: 'wood_box', x: 2150, y: 350 },
            { type: 'flower', x: 2350, y: 290 },
            { type: 'apple', x: 2550, y: 350 },
            { type: 'flower', x: 2750, y: 290 }
        ]
    },
    {
        id: 2,
        name: '厨房餐桌',
        theme: 'kitchen',
        width: 3200,
        height: 540,
        spawnPoints: [{ x: 100, y: 300 }, { x: 150, y: 300 }],
        goal: { x: 3050, y: 320, width: 60, height: 80 },
        tiles: [
            ...createGroundTiles(0, 460, 3200, 80),
            new Tile(250, 380, 100, 20, 'solid'),
            new Tile(400, 320, 100, 20, 'solid'),
            new Tile(550, 260, 100, 20, 'solid'),
            new Tile(750, 380, 120, 20, 'solid'),
            new Tile(950, 320, 100, 20, 'solid'),
            new Tile(1100, 260, 120, 20, 'solid'),
            new Tile(1300, 380, 100, 20, 'solid'),
            new Tile(1450, 320, 120, 20, 'solid'),
            new Tile(1650, 260, 100, 20, 'solid'),
            new Tile(1800, 380, 120, 20, 'solid'),
            new Tile(2000, 320, 100, 20, 'solid'),
            new Tile(2150, 260, 120, 20, 'solid'),
            new Tile(2350, 380, 100, 20, 'solid'),
            new Tile(2500, 320, 120, 20, 'solid'),
            new Tile(2700, 260, 100, 20, 'solid'),
            new Tile(2850, 380, 120, 20, 'solid')
        ],
        enemies: [
            { type: 'rat', x: 300, y: 430, patrolLeft: 250, patrolRight: 450 },
            { type: 'rat', x: 600, y: 430, patrolLeft: 550, patrolRight: 750 },
            { type: 'bee', x: 500, y: 180 },
            { type: 'dog', x: 900, y: 420, patrolLeft: 800, patrolRight: 1050 },
            { type: 'rat', x: 1200, y: 430, patrolLeft: 1100, patrolRight: 1350 },
            { type: 'bee', x: 1400, y: 200 },
            { type: 'dog', x: 1700, y: 420, patrolLeft: 1600, patrolRight: 1850 },
            { type: 'rat', x: 2000, y: 430, patrolLeft: 1900, patrolRight: 2100 },
            { type: 'bee', x: 2300, y: 180 },
            { type: 'dog', x: 2550, y: 420, patrolLeft: 2450, patrolRight: 2700 },
            { type: 'rat', x: 2800, y: 430, patrolLeft: 2750, patrolRight: 2950 }
        ],
        items: [
            { type: 'wood_box', x: 200, y: 420 },
            { type: 'iron_box', x: 350, y: 340 },
            { type: 'apple', x: 500, y: 290 },
            { type: 'flower', x: 650, y: 230 },
            { type: 'wood_box', x: 850, y: 350 },
            { type: 'pinecone', x: 1000, y: 290 },
            { type: 'flower', x: 1200, y: 230 },
            { type: 'wood_box', x: 1400, y: 350 },
            { type: 'star', x: 1600, y: 290 },
            { type: 'bomb', x: 1750, y: 230 },
            { type: 'apple', x: 1950, y: 290 },
            { type: 'flower', x: 2150, y: 230 },
            { type: 'wood_box', x: 2400, y: 350 },
            { type: 'pinecone', x: 2600, y: 290 },
            { type: 'flower', x: 2800, y: 350 }
        ]
    },
    {
        id: 3,
        name: '玩具房间',
        theme: 'toyroom',
        width: 3400,
        height: 540,
        spawnPoints: [{ x: 100, y: 300 }, { x: 150, y: 300 }],
        goal: { x: 3250, y: 320, width: 60, height: 80 },
        tiles: [
            ...createGroundTiles(0, 460, 3400, 80),
            new Tile(200, 380, 80, 20, 'solid'),
            new Tile(350, 320, 80, 20, 'solid'),
            new Tile(500, 260, 80, 20, 'solid'),
            new Tile(650, 200, 80, 20, 'solid'),
            new Tile(850, 380, 100, 20, 'solid'),
            new Tile(1000, 320, 80, 20, 'solid'),
            new Tile(1150, 260, 100, 20, 'solid'),
            new Tile(1300, 200, 80, 20, 'solid'),
            new Tile(1500, 380, 100, 20, 'solid'),
            new Tile(1650, 320, 100, 20, 'solid'),
            new Tile(1800, 260, 80, 20, 'solid'),
            new Tile(1950, 200, 100, 20, 'solid'),
            new Tile(2150, 380, 100, 20, 'solid'),
            new Tile(2300, 320, 80, 20, 'solid'),
            new Tile(2450, 260, 100, 20, 'solid'),
            new Tile(2600, 200, 80, 20, 'solid'),
            new Tile(2800, 380, 100, 20, 'solid'),
            new Tile(2950, 320, 100, 20, 'solid'),
            new Tile(3100, 260, 80, 20, 'solid')
        ],
        enemies: [
            { type: 'rat', x: 300, y: 430, patrolLeft: 250, patrolRight: 400 },
            { type: 'rat', x: 550, y: 430, patrolLeft: 500, patrolRight: 650 },
            { type: 'bee', x: 450, y: 150 },
            { type: 'tank', x: 750, y: 410, patrolLeft: 700, patrolRight: 900 },
            { type: 'rat', x: 1050, y: 430, patrolLeft: 1000, patrolRight: 1150 },
            { type: 'bee', x: 1250, y: 150 },
            { type: 'dog', x: 1450, y: 420, patrolLeft: 1350, patrolRight: 1550 },
            { type: 'tank', x: 1700, y: 410, patrolLeft: 1600, patrolRight: 1850 },
            { type: 'bee', x: 1900, y: 130 },
            { type: 'rat', x: 2100, y: 430, patrolLeft: 2050, patrolRight: 2200 },
            { type: 'dog', x: 2350, y: 420, patrolLeft: 2250, patrolRight: 2450 },
            { type: 'bee', x: 2550, y: 150 },
            { type: 'tank', x: 2750, y: 410, patrolLeft: 2650, patrolRight: 2850 },
            { type: 'rat', x: 3000, y: 430, patrolLeft: 2950, patrolRight: 3100 }
        ],
        items: [
            { type: 'wood_box', x: 180, y: 420 },
            { type: 'wood_box', x: 280, y: 340 },
            { type: 'iron_box', x: 430, y: 280 },
            { type: 'apple', x: 580, y: 220 },
            { type: 'flower', x: 730, y: 170 },
            { type: 'pinecone', x: 900, y: 350 },
            { type: 'wood_box', x: 1080, y: 290 },
            { type: 'flower', x: 1230, y: 230 },
            { type: 'star', x: 1380, y: 170 },
            { type: 'wood_box', x: 1550, y: 350 },
            { type: 'bomb', x: 1730, y: 290 },
            { type: 'flower', x: 1880, y: 230 },
            { type: 'apple', x: 2030, y: 170 },
            { type: 'wood_box', x: 2200, y: 350 },
            { type: 'pinecone', x: 2380, y: 290 },
            { type: 'flower', x: 2530, y: 230 },
            { type: 'bomb', x: 2680, y: 170 },
            { type: 'wood_box', x: 2850, y: 350 },
            { type: 'flower', x: 3030, y: 290 }
        ]
    },
    {
        id: 4,
        name: '实验室',
        theme: 'lab',
        width: 3600,
        height: 540,
        spawnPoints: [{ x: 100, y: 300 }, { x: 150, y: 300 }],
        goal: { x: 3450, y: 320, width: 60, height: 80 },
        tiles: [
            ...createGroundTiles(0, 460, 3600, 80),
            new Tile(300, 380, 120, 20, 'solid'),
            new Tile(500, 320, 120, 20, 'solid'),
            new Tile(700, 260, 120, 20, 'solid'),
            new Tile(900, 200, 120, 20, 'solid'),
            new Tile(1100, 380, 150, 20, 'solid'),
            new Tile(1300, 320, 120, 20, 'solid'),
            new Tile(1500, 260, 150, 20, 'solid'),
            new Tile(1700, 200, 120, 20, 'solid'),
            new Tile(1900, 380, 150, 20, 'solid'),
            new Tile(2100, 320, 150, 20, 'solid'),
            new Tile(2300, 260, 120, 20, 'solid'),
            new Tile(2500, 200, 150, 20, 'solid'),
            new Tile(2700, 380, 120, 20, 'solid'),
            new Tile(2900, 320, 150, 20, 'solid'),
            new Tile(3100, 260, 120, 20, 'solid'),
            new Tile(3300, 380, 150, 20, 'solid')
        ],
        enemies: [
            { type: 'rat', x: 400, y: 430, patrolLeft: 350, patrolRight: 500 },
            { type: 'rat', x: 650, y: 430, patrolLeft: 600, patrolRight: 750 },
            { type: 'eagle', x: 550, y: 150 },
            { type: 'dog', x: 950, y: 420, patrolLeft: 850, patrolRight: 1100 },
            { type: 'bee', x: 1200, y: 200 },
            { type: 'rat', x: 1400, y: 430, patrolLeft: 1350, patrolRight: 1500 },
            { type: 'eagle', x: 1600, y: 130 },
            { type: 'dog', x: 1850, y: 420, patrolLeft: 1750, patrolRight: 2000 },
            { type: 'bee', x: 2050, y: 180 },
            { type: 'tank', x: 2250, y: 410, patrolLeft: 2150, patrolRight: 2350 },
            { type: 'eagle', x: 2450, y: 150 },
            { type: 'rat', x: 2650, y: 430, patrolLeft: 2600, patrolRight: 2750 },
            { type: 'dog', x: 2900, y: 420, patrolLeft: 2800, patrolRight: 3050 },
            { type: 'bee', x: 3150, y: 200 },
            { type: 'rat', x: 3350, y: 430, patrolLeft: 3300, patrolRight: 3450 }
        ],
        items: [
            { type: 'wood_box', x: 250, y: 420 },
            { type: 'iron_box', x: 400, y: 340 },
            { type: 'wood_box', x: 600, y: 280 },
            { type: 'apple', x: 800, y: 220 },
            { type: 'flower', x: 950, y: 170 },
            { type: 'wood_box', x: 1150, y: 350 },
            { type: 'pinecone', x: 1350, y: 290 },
            { type: 'flower', x: 1550, y: 230 },
            { type: 'star', x: 1750, y: 170 },
            { type: 'iron_box', x: 1950, y: 350 },
            { type: 'bomb', x: 2150, y: 290 },
            { type: 'flower', x: 2350, y: 230 },
            { type: 'wood_box', x: 2550, y: 170 },
            { type: 'apple', x: 2750, y: 350 },
            { type: 'pinecone', x: 2950, y: 290 },
            { type: 'flower', x: 3150, y: 230 },
            { type: 'star', x: 3350, y: 350 }
        ]
    },
    {
        id: 5,
        name: '工厂流水线',
        theme: 'factory',
        width: 3800,
        height: 540,
        spawnPoints: [{ x: 100, y: 300 }, { x: 150, y: 300 }],
        goal: { x: 3650, y: 320, width: 60, height: 80 },
        tiles: [
            ...createGroundTiles(0, 460, 3800, 80),
            new Tile(250, 400, 100, 20, 'solid'),
            new Tile(400, 340, 100, 20, 'solid'),
            new Tile(550, 280, 100, 20, 'solid'),
            new Tile(700, 220, 100, 20, 'solid'),
            new Tile(900, 400, 120, 20, 'solid'),
            new Tile(1080, 340, 100, 20, 'solid'),
            new Tile(1230, 280, 120, 20, 'solid'),
            new Tile(1400, 220, 100, 20, 'solid'),
            new Tile(1600, 400, 120, 20, 'solid'),
            new Tile(1780, 340, 120, 20, 'solid'),
            new Tile(1960, 280, 100, 20, 'solid'),
            new Tile(2110, 220, 120, 20, 'solid'),
            new Tile(2300, 400, 100, 20, 'solid'),
            new Tile(2450, 340, 120, 20, 'solid'),
            new Tile(2620, 280, 100, 20, 'solid'),
            new Tile(2770, 220, 120, 20, 'solid'),
            new Tile(2950, 400, 120, 20, 'solid'),
            new Tile(3120, 340, 100, 20, 'solid'),
            new Tile(3270, 280, 120, 20, 'solid'),
            new Tile(3450, 400, 100, 20, 'solid')
        ],
        enemies: [
            { type: 'rat', x: 350, y: 430, patrolLeft: 300, patrolRight: 450 },
            { type: 'rat', x: 600, y: 430, patrolLeft: 550, patrolRight: 700 },
            { type: 'dog', x: 800, y: 420, patrolLeft: 700, patrolRight: 900 },
            { type: 'eagle', x: 1000, y: 150 },
            { type: 'tank', x: 1150, y: 410, patrolLeft: 1050, patrolRight: 1250 },
            { type: 'bee', x: 1350, y: 180 },
            { type: 'rat', x: 1550, y: 430, patrolLeft: 1500, patrolRight: 1650 },
            { type: 'dog', x: 1750, y: 420, patrolLeft: 1650, patrolRight: 1850 },
            { type: 'eagle', x: 1950, y: 150 },
            { type: 'tank', x: 2150, y: 410, patrolLeft: 2050, patrolRight: 2250 },
            { type: 'bee', x: 2350, y: 180 },
            { type: 'dog', x: 2550, y: 420, patrolLeft: 2450, patrolRight: 2650 },
            { type: 'rat', x: 2750, y: 430, patrolLeft: 2700, patrolRight: 2850 },
            { type: 'eagle', x: 2950, y: 150 },
            { type: 'tank', x: 3150, y: 410, patrolLeft: 3050, patrolRight: 3250 },
            { type: 'bee', x: 3350, y: 180 },
            { type: 'dog', x: 3500, y: 420, patrolLeft: 3400, patrolRight: 3600 }
        ],
        items: [
            { type: 'wood_box', x: 220, y: 420 },
            { type: 'wood_box', x: 320, y: 370 },
            { type: 'iron_box', x: 470, y: 310 },
            { type: 'bomb', x: 620, y: 250 },
            { type: 'flower', x: 770, y: 190 },
            { type: 'wood_box', x: 950, y: 370 },
            { type: 'pinecone', x: 1130, y: 310 },
            { type: 'flower', x: 1280, y: 250 },
            { type: 'star', x: 1450, y: 190 },
            { type: 'iron_box', x: 1650, y: 370 },
            { type: 'wood_box', x: 1830, y: 310 },
            { type: 'flower', x: 2010, y: 250 },
            { type: 'apple', x: 2180, y: 190 },
            { type: 'bomb', x: 2370, y: 370 },
            { type: 'pinecone', x: 2520, y: 310 },
            { type: 'flower', x: 2690, y: 250 },
            { type: 'star', x: 2840, y: 190 },
            { type: 'wood_box', x: 3020, y: 370 },
            { type: 'iron_box', x: 3190, y: 310 },
            { type: 'flower', x: 3340, y: 250 },
            { type: 'apple', x: 3500, y: 370 }
        ]
    },
    {
        id: 6,
        name: '赌场',
        theme: 'casino',
        width: 4000,
        height: 540,
        spawnPoints: [{ x: 100, y: 300 }, { x: 150, y: 300 }],
        goal: { x: 3850, y: 320, width: 60, height: 80 },
        tiles: [
            ...createGroundTiles(0, 460, 4000, 80),
            new Tile(200, 380, 80, 20, 'solid'),
            new Tile(330, 320, 80, 20, 'solid'),
            new Tile(460, 260, 80, 20, 'solid'),
            new Tile(590, 200, 80, 20, 'solid'),
            new Tile(720, 140, 80, 20, 'solid'),
            new Tile(900, 380, 100, 20, 'solid'),
            new Tile(1050, 320, 80, 20, 'solid'),
            new Tile(1180, 260, 100, 20, 'solid'),
            new Tile(1330, 200, 80, 20, 'solid'),
            new Tile(1460, 140, 100, 20, 'solid'),
            new Tile(1650, 380, 100, 20, 'solid'),
            new Tile(1800, 320, 100, 20, 'solid'),
            new Tile(1950, 260, 80, 20, 'solid'),
            new Tile(2080, 200, 100, 20, 'solid'),
            new Tile(2230, 140, 80, 20, 'solid'),
            new Tile(2400, 380, 120, 20, 'solid'),
            new Tile(2570, 320, 80, 20, 'solid'),
            new Tile(2700, 260, 100, 20, 'solid'),
            new Tile(2850, 200, 80, 20, 'solid'),
            new Tile(2980, 140, 100, 20, 'solid'),
            new Tile(3150, 380, 100, 20, 'solid'),
            new Tile(3300, 320, 100, 20, 'solid'),
            new Tile(3450, 260, 80, 20, 'solid'),
            new Tile(3580, 200, 100, 20, 'solid'),
            new Tile(3750, 380, 100, 20, 'solid')
        ],
        enemies: [
            { type: 'dog', x: 300, y: 420, patrolLeft: 250, patrolRight: 380 },
            { type: 'rat', x: 500, y: 430, patrolLeft: 450, patrolRight: 580 },
            { type: 'eagle', x: 400, y: 100 },
            { type: 'tank', x: 750, y: 410, patrolLeft: 650, patrolRight: 850 },
            { type: 'bee', x: 650, y: 120 },
            { type: 'dog', x: 1000, y: 420, patrolLeft: 900, patrolRight: 1100 },
            { type: 'rat', x: 1200, y: 430, patrolLeft: 1150, patrolRight: 1300 },
            { type: 'eagle', x: 1100, y: 100 },
            { type: 'tank', x: 1450, y: 410, patrolLeft: 1350, patrolRight: 1550 },
            { type: 'bee', x: 1350, y: 120 },
            { type: 'dog', x: 1750, y: 420, patrolLeft: 1650, patrolRight: 1850 },
            { type: 'rat', x: 1950, y: 430, patrolLeft: 1900, patrolRight: 2050 },
            { type: 'eagle', x: 1850, y: 100 },
            { type: 'tank', x: 2200, y: 410, patrolLeft: 2100, patrolRight: 2300 },
            { type: 'bee', x: 2050, y: 120 },
            { type: 'dog', x: 2500, y: 420, patrolLeft: 2400, patrolRight: 2600 },
            { type: 'rat', x: 2700, y: 430, patrolLeft: 2650, patrolRight: 2800 },
            { type: 'eagle', x: 2600, y: 100 },
            { type: 'tank', x: 2900, y: 410, patrolLeft: 2800, patrolRight: 3050 },
            { type: 'bee', x: 2800, y: 120 },
            { type: 'dog', x: 3200, y: 420, patrolLeft: 3100, patrolRight: 3350 },
            { type: 'rat', x: 3500, y: 430, patrolLeft: 3450, patrolRight: 3600 },
            { type: 'eagle', x: 3400, y: 100 }
        ],
        items: [
            { type: 'wood_box', x: 180, y: 420 },
            { type: 'iron_box', x: 280, y: 340 },
            { type: 'wood_box', x: 410, y: 280 },
            { type: 'star', x: 540, y: 220 },
            { type: 'bomb', x: 670, y: 160 },
            { type: 'wood_box', x: 850, y: 420 },
            { type: 'pinecone', x: 970, y: 350 },
            { type: 'flower', x: 1100, y: 290 },
            { type: 'apple', x: 1250, y: 230 },
            { type: 'star', x: 1380, y: 170 },
            { type: 'iron_box', x: 1510, y: 110 },
            { type: 'wood_box', x: 1700, y: 350 },
            { type: 'flower', x: 1850, y: 290 },
            { type: 'bomb', x: 2000, y: 230 },
            { type: 'pinecone', x: 2130, y: 170 },
            { type: 'apple', x: 2280, y: 110 },
            { type: 'wood_box', x: 2450, y: 350 },
            { type: 'star', x: 2620, y: 290 },
            { type: 'flower', x: 2750, y: 230 },
            { type: 'iron_box', x: 2900, y: 170 },
            { type: 'bomb', x: 3030, y: 110 },
            { type: 'wood_box', x: 3200, y: 350 },
            { type: 'pinecone', x: 3350, y: 290 },
            { type: 'flower', x: 3500, y: 230 },
            { type: 'star', x: 3630, y: 170 },
            { type: 'apple', x: 3780, y: 350 }
        ]
    },
    {
        id: 7,
        name: '肥猫总部',
        theme: 'boss',
        width: 2000,
        height: 540,
        isBossLevel: true,
        spawnPoints: [{ x: 100, y: 300 }, { x: 150, y: 300 }],
        goal: { x: 1850, y: 320, width: 60, height: 80 },
        tiles: [
            ...createGroundTiles(0, 460, 2000, 80),
            new Tile(300, 380, 150, 20, 'solid'),
            new Tile(550, 320, 150, 20, 'solid'),
            new Tile(800, 260, 200, 20, 'solid'),
            new Tile(1100, 320, 150, 20, 'solid'),
            new Tile(1350, 380, 150, 20, 'solid'),
            new Tile(1600, 320, 150, 20, 'solid')
        ],
        enemies: [
            { type: 'boss_cat', x: 1400, y: 370, patrolLeft: 1000, patrolRight: 1700 },
            { type: 'rat', x: 500, y: 430, patrolLeft: 400, patrolRight: 600 },
            { type: 'rat', x: 1000, y: 430, patrolLeft: 900, patrolRight: 1100 },
            { type: 'bee', x: 700, y: 180 },
            { type: 'bee', x: 1200, y: 180 }
        ],
        items: [
            { type: 'wood_box', x: 200, y: 420 },
            { type: 'iron_box', x: 350, y: 340 },
            { type: 'apple', x: 600, y: 280 },
            { type: 'pinecone', x: 850, y: 220 },
            { type: 'bomb', x: 1150, y: 280 },
            { type: 'apple', x: 1400, y: 340 },
            { type: 'pinecone', x: 1650, y: 280 },
            { type: 'wood_box', x: 1750, y: 420 }
        ]
    }
];

function createGroundTiles(x, y, width, height) {
    const tiles = [];
    const tileWidth = 40;
    for (let i = 0; i < width; i += tileWidth) {
        tiles.push(new Tile(x + i, y, Math.min(tileWidth, width - i), height, 'solid'));
    }
    return tiles;
}

function createLevel(levelId) {
    const data = LEVELS[levelId - 1];
    if (!data) return null;
    return new Level(data);
}
