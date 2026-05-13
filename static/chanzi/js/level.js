class Level {
    constructor(levelData) {
        this.tileSize = 32;
        this.width = levelData.width * this.tileSize;
        this.height = levelData.height * this.tileSize;
        this.tiles = levelData.tiles;
        this.tileTypes = levelData.tileTypes || {};
        this.bgColor = levelData.bgColor || '#1a1a2e';
        this.name = levelData.name || 'Unknown';
    }
    
    isSolid(tileX, tileY) {
        if (tileX < 0 || tileX >= this.tiles[0].length || tileY < 0 || tileY >= this.tiles.length) {
            return tileY >= this.tiles.length;
        }
        const tile = this.tiles[tileY][tileX];
        return tile === 1 || tile === 3 || tile === 4;
    }
    
    isBreakable(tileX, tileY) {
        if (tileX < 0 || tileX >= this.tiles[0].length || tileY < 0 || tileY >= this.tiles.length) {
            return false;
        }
        return this.tiles[tileY][tileX] === 3;
    }
    
    damageBlock(tileX, tileY) {
        if (this.isBreakable(tileX, tileY)) {
            this.tiles[tileY][tileX] = 0;
            AudioSystem.dig();
            return true;
        }
        return false;
    }
    
    damageBlocks(rect) {
        const startX = Math.floor(rect.x / this.tileSize);
        const endX = Math.floor((rect.x + rect.width) / this.tileSize);
        const startY = Math.floor(rect.y / this.tileSize);
        const endY = Math.floor((rect.y + rect.height) / this.tileSize);
        
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                this.damageBlock(x, y);
            }
        }
    }
    
    getTileAt(x, y) {
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        if (tileX < 0 || tileX >= this.tiles[0].length || tileY < 0 || tileY >= this.tiles.length) {
            return 0;
        }
        return this.tiles[tileY][tileX];
    }
    
    draw(ctx, camera) {
        this.drawBackground(ctx, camera);
        
        const startX = Math.max(0, Math.floor(camera.x / this.tileSize));
        const endX = Math.min(this.tiles[0].length, Math.ceil((camera.x + 800) / this.tileSize) + 1);
        const startY = Math.max(0, Math.floor(camera.y / this.tileSize));
        const endY = Math.min(this.tiles.length, Math.ceil((camera.y + 600) / this.tileSize) + 1);
        
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const tile = this.tiles[y][x];
                if (tile !== 0) {
                    this.drawTile(ctx, x, y, tile);
                }
            }
        }
    }
    
    drawBackground(ctx, camera) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 600);
        gradient.addColorStop(0, '#0a0a1a');
        gradient.addColorStop(0.5, '#1a1a3e');
        gradient.addColorStop(1, '#2a2a4e');
        ctx.fillStyle = gradient;
        ctx.fillRect(camera.x, camera.y, 800, 600);
        
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 50; i++) {
            const x = (i * 137 + camera.x * 0.1) % 800 + camera.x;
            const y = (i * 89) % 600 + camera.y * 0.05;
            const size = (i % 3) * 0.5 + 1;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawTile(ctx, x, y, type) {
        const px = x * this.tileSize;
        const py = y * this.tileSize;
        
        switch (type) {
            case 1:
                this.drawSolidTile(ctx, px, py);
                break;
            case 2:
                this.drawPlatformTile(ctx, px, py);
                break;
            case 3:
                this.drawBreakableTile(ctx, px, py);
                break;
            case 4:
                this.drawFinishTile(ctx, px, py);
                break;
        }
    }
    
    drawSolidTile(ctx, x, y) {
        ctx.fillStyle = '#3d5a80';
        ctx.fillRect(x, y, this.tileSize, this.tileSize);
        
        ctx.fillStyle = '#4a6fa5';
        ctx.fillRect(x + 2, y + 2, this.tileSize - 4, 4);
        ctx.fillRect(x + 2, y + 2, 4, this.tileSize - 4);
        
        ctx.fillStyle = '#2d4a60';
        ctx.fillRect(x + this.tileSize - 4, y + 2, 4, this.tileSize - 4);
        ctx.fillRect(x + 2, y + this.tileSize - 4, this.tileSize - 4, 4);
    }
    
    drawPlatformTile(ctx, x, y) {
        ctx.fillStyle = '#6b7280';
        ctx.fillRect(x, y, this.tileSize, 8);
        
        ctx.fillStyle = '#9ca3af';
        ctx.fillRect(x + 2, y + 2, this.tileSize - 4, 2);
    }
    
    drawBreakableTile(ctx, x, y) {
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(x, y, this.tileSize, this.tileSize);
        
        ctx.fillStyle = '#a0724a';
        ctx.fillRect(x + 2, y + 2, this.tileSize - 4, 4);
        ctx.fillRect(x + 2, y + 2, 4, this.tileSize - 4);
        
        ctx.strokeStyle = '#6b4423';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 8, y + 8);
        ctx.lineTo(x + 16, y + 16);
        ctx.lineTo(x + 12, y + 24);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x + 24, y + 6);
        ctx.lineTo(x + 20, y + 18);
        ctx.lineTo(x + 26, y + 26);
        ctx.stroke();
    }
    
    drawFinishTile(ctx, x, y) {
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(x, y + 16, this.tileSize, 16);
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 14, y, 4, 20);
        
        const pulse = Math.sin(Date.now() / 200) * 2;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(x + 18, y + 2);
        ctx.lineTo(x + 30 + pulse, y + 8);
        ctx.lineTo(x + 18, y + 14);
        ctx.closePath();
        ctx.fill();
    }
    
    getPlayerSpawn() {
        for (let y = 0; y < this.tiles.length; y++) {
            for (let x = 0; x < this.tiles[y].length; x++) {
                if (this.tiles[y][x] === 5) {
                    return { x: x * this.tileSize, y: y * this.tileSize - 16 };
                }
            }
        }
        return { x: 100, y: 100 };
    }
    
    getFinishPosition() {
        for (let y = 0; y < this.tiles.length; y++) {
            for (let x = 0; x < this.tiles[y].length; x++) {
                if (this.tiles[y][x] === 4) {
                    return { x: x * this.tileSize, y: y * this.tileSize };
                }
            }
        }
        return { x: this.width - 100, y: 100 };
    }
}

const LevelData = {
    1: {
        name: '科技森林',
        width: 50,
        height: 20,
        bgColor: '#1a1a2e',
        tiles: [],
        enemies: [
            { type: 'slime', x: 400, y: 520 },
            { type: 'slime', x: 600, y: 520 },
            { type: 'slime', x: 900, y: 456 },
            { type: 'skeleton', x: 1100, y: 456 }
        ],
        traps: [
            { type: 'spike', x: 700, y: 560, width: 64 }
        ],
        collectibles: [
            { type: 'coin', x: 300, y: 520 },
            { type: 'coin', x: 350, y: 520 },
            { type: 'mana', x: 500, y: 480 },
            { type: 'gem', x: 1000, y: 400 },
            { type: 'health', x: 800, y: 500 }
        ]
    },
    2: {
        name: '熔岩洞穴',
        width: 55,
        height: 22,
        bgColor: '#2a1a1a',
        tiles: [],
        enemies: [
            { type: 'slime', x: 400, y: 616 },
            { type: 'ghost', x: 600, y: 500 },
            { type: 'ghost', x: 800, y: 450 },
            { type: 'skeleton', x: 1000, y: 552 },
            { type: 'bomber', x: 1200, y: 500 }
        ],
        traps: [
            { type: 'fire', x: 500, y: 616 },
            { type: 'fire', x: 700, y: 616 },
            { type: 'saw', x: 900, y: 550, endX: 1000 }
        ],
        collectibles: [
            { type: 'coin', x: 350, y: 580 },
            { type: 'coin', x: 400, y: 580 },
            { type: 'mana', x: 550, y: 550 },
            { type: 'gem', x: 1100, y: 480 },
            { type: 'health', x: 850, y: 520 }
        ]
    },
    3: {
        name: '浮空城市',
        width: 60,
        height: 25,
        bgColor: '#1a2a3a',
        tiles: [],
        enemies: [
            { type: 'ghost', x: 500, y: 400 },
            { type: 'ghost', x: 700, y: 350 },
            { type: 'bomber', x: 900, y: 380 },
            { type: 'bomber', x: 1100, y: 320 },
            { type: 'skeleton', x: 1300, y: 680 }
        ],
        traps: [
            { type: 'breakable', x: 600, y: 480 },
            { type: 'breakable', x: 632, y: 480 },
            { type: 'spike', x: 1000, y: 728, width: 96 },
            { type: 'saw', x: 1200, y: 600, endX: 1350 }
        ],
        collectibles: [
            { type: 'coin', x: 450, y: 380 },
            { type: 'coin', x: 500, y: 380 },
            { type: 'mana', x: 750, y: 300 },
            { type: 'gem', x: 1050, y: 650 },
            { type: 'health', x: 1400, y: 650 }
        ]
    },
    4: {
        name: '机械堡垒',
        width: 65,
        height: 24,
        bgColor: '#2a2a2a',
        tiles: [],
        enemies: [
            { type: 'skeleton', x: 400, y: 648 },
            { type: 'skeleton', x: 600, y: 648 },
            { type: 'bomber', x: 800, y: 550 },
            { type: 'ghost', x: 1000, y: 500 },
            { type: 'ghost', x: 1200, y: 480 },
            { type: 'slime', x: 1400, y: 648 }
        ],
        traps: [
            { type: 'spike', x: 500, y: 752, width: 64 },
            { type: 'saw', x: 700, y: 600, endX: 850 },
            { type: 'fire', x: 1100, y: 680 },
            { type: 'fire', x: 1150, y: 680 },
            { type: 'breakable', x: 1300, y: 600 }
        ],
        collectibles: [
            { type: 'coin', x: 450, y: 620 },
            { type: 'coin', x: 550, y: 620 },
            { type: 'mana', x: 900, y: 500 },
            { type: 'gem', x: 1250, y: 450 },
            { type: 'health', x: 1500, y: 620 }
        ]
    },
    5: {
        name: '巨龙巢穴',
        width: 70,
        height: 26,
        bgColor: '#1a0a0a',
        tiles: [],
        enemies: [
            { type: 'slime', x: 400, y: 712 },
            { type: 'skeleton', x: 600, y: 712 },
            { type: 'ghost', x: 800, y: 600 },
            { type: 'bomber', x: 1000, y: 550 },
            { type: 'dragon', x: 1800, y: 650 }
        ],
        traps: [
            { type: 'fire', x: 500, y: 744 },
            { type: 'fire', x: 700, y: 744 },
            { type: 'spike', x: 1200, y: 752, width: 128 },
            { type: 'saw', x: 1400, y: 650, endX: 1550 },
            { type: 'breakable', x: 1600, y: 650 }
        ],
        collectibles: [
            { type: 'coin', x: 450, y: 680 },
            { type: 'coin', x: 550, y: 680 },
            { type: 'mana', x: 900, y: 550 },
            { type: 'mana', x: 1100, y: 520 },
            { type: 'gem', x: 1500, y: 600 },
            { type: 'health', x: 1700, y: 620 }
        ]
    }
};

function generateLevelTiles(levelNum) {
    const data = LevelData[levelNum];
    const tiles = [];
    
    for (let y = 0; y < data.height; y++) {
        tiles[y] = [];
        for (let x = 0; x < data.width; x++) {
            tiles[y][x] = 0;
        }
    }
    
    for (let x = 0; x < data.width; x++) {
        tiles[data.height - 2][x] = 1;
        tiles[data.height - 1][x] = 1;
    }
    
    const platforms = getPlatformsForLevel(levelNum);
    platforms.forEach(p => {
        for (let x = p.startX; x < p.endX; x++) {
            tiles[p.y][x] = p.type || 1;
        }
    });
    
    const breakables = getBreakablesForLevel(levelNum);
    breakables.forEach(b => {
        tiles[b.y][b.x] = 3;
    });
    
    const spawn = getSpawnForLevel(levelNum);
    tiles[spawn.y][spawn.x] = 5;
    
    const finish = getFinishForLevel(levelNum);
    tiles[finish.y][finish.x] = 4;
    
    data.tiles = tiles;
    return data;
}

function getPlatformsForLevel(level) {
    const platforms = {
        1: [
            { startX: 8, endX: 15, y: 16 },
            { startX: 18, endX: 25, y: 14 },
            { startX: 28, endX: 35, y: 12 },
            { startX: 38, endX: 45, y: 15 }
        ],
        2: [
            { startX: 8, endX: 14, y: 18 },
            { startX: 17, endX: 24, y: 16 },
            { startX: 27, endX: 34, y: 14 },
            { startX: 37, endX: 45, y: 17 },
            { startX: 48, endX: 53, y: 15 }
        ],
        3: [
            { startX: 8, endX: 13, y: 15 },
            { startX: 16, endX: 22, y: 13 },
            { startX: 25, endX: 32, y: 11 },
            { startX: 35, endX: 42, y: 14 },
            { startX: 45, endX: 52, y: 17 },
            { startX: 55, endX: 59, y: 21 }
        ],
        4: [
            { startX: 8, endX: 15, y: 19 },
            { startX: 18, endX: 26, y: 17 },
            { startX: 29, endX: 37, y: 15 },
            { startX: 40, endX: 48, y: 18 },
            { startX: 51, endX: 58, y: 16 },
            { startX: 61, endX: 64, y: 20 }
        ],
        5: [
            { startX: 8, endX: 16, y: 21 },
            { startX: 19, endX: 28, y: 19 },
            { startX: 31, endX: 40, y: 17 },
            { startX: 43, endX: 52, y: 20 },
            { startX: 55, endX: 64, y: 18 },
            { startX: 50, endX: 65, y: 22 }
        ]
    };
    return platforms[level] || [];
}

function getBreakablesForLevel(level) {
    const breakables = {
        1: [
            { x: 20, y: 13 },
            { x: 30, y: 11 }
        ],
        2: [
            { x: 22, y: 15 },
            { x: 32, y: 13 }
        ],
        3: [
            { x: 18, y: 12 },
            { x: 28, y: 10 },
            { x: 38, y: 13 }
        ],
        4: [
            { x: 22, y: 16 },
            { x: 33, y: 14 },
            { x: 44, y: 17 }
        ],
        5: [
            { x: 24, y: 18 },
            { x: 36, y: 16 },
            { x: 48, y: 19 }
        ]
    };
    return breakables[level] || [];
}

function getSpawnForLevel(level) {
    const spawns = {
        1: { x: 3, y: 17 },
        2: { x: 3, y: 19 },
        3: { x: 3, y: 22 },
        4: { x: 3, y: 21 },
        5: { x: 3, y: 23 }
    };
    return spawns[level] || { x: 3, y: 17 };
}

function getFinishForLevel(level) {
    const finishes = {
        1: { x: 47, y: 14 },
        2: { x: 52, y: 14 },
        3: { x: 57, y: 20 },
        4: { x: 62, y: 19 },
        5: { x: 67, y: 21 }
    };
    return finishes[level] || { x: 47, y: 17 };
}

function loadLevel(levelNum) {
    const levelData = generateLevelTiles(levelNum);
    return new Level(levelData);
}