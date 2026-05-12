import { TILE_SIZE } from './config.js';
import { BlockSprite, FlagSprite, CoinSprite, GoombaSprite, KoopaSprite, PiranhaSprite } from './sprite.js';

export class Level {
    constructor(ctx) {
        this.ctx = ctx;
        this.blocks = [];
        this.enemies = [];
        this.coins = [];
        this.items = [];
        this.flag = null;
        this.width = 100 * TILE_SIZE;
    }

    generateLevel1(usedBlocks = [], collectedCoins = [], defeatedEnemies = []) {
        this.blocks = [];
        this.enemies = [];
        this.coins = [];
        this.items = [];

        const groundY = 14 * TILE_SIZE;
        
        for (let x = 0; x < 100; x++) {
            if (x < 20 || (x >= 22 && x < 30) || (x >= 32 && x < 50) || 
                (x >= 52 && x < 60) || (x >= 62 && x < 80) || 
                (x >= 82 && x < 100)) {
                const block = new BlockSprite(this.ctx, x * TILE_SIZE, groundY, 'ground');
                this.blocks.push(block);
            }
        }

        const questionBlocks = [
            { x: 3, y: 9, item: 'coin' },
            { x: 4, y: 9, item: 'mushroom' },
            { x: 5, y: 9, item: 'coin' },
            { x: 16, y: 9, item: 'coin' },
            { x: 18, y: 9, item: 'flower' },
            { x: 21, y: 5, item: 'coin' },
            { x: 23, y: 5, item: 'star' },
            { x: 40, y: 9, item: 'coin' },
            { x: 42, y: 9, item: 'coin' },
            { x: 65, y: 9, item: 'mushroom' },
            { x: 70, y: 5, item: 'coin' },
            { x: 72, y: 5, item: 'coin' },
        ];

        for (const qb of questionBlocks) {
            const block = new BlockSprite(this.ctx, qb.x * TILE_SIZE, qb.y * TILE_SIZE, 'question');
            block.item = qb.item;
            const blockKey = `${qb.x}_${qb.y}`;
            if (usedBlocks.includes(blockKey)) {
                block.used = true;
            }
            this.blocks.push(block);
        }

        const brickPositions = [
            { x: 6, y: 9 }, { x: 7, y: 9 }, { x: 8, y: 9 },
            { x: 10, y: 9 }, { x: 11, y: 9 },
            { x: 20, y: 9 }, { x: 22, y: 9 },
            { x: 35, y: 9 }, { x: 36, y: 9 }, { x: 37, y: 9 },
            { x: 41, y: 9 },
            { x: 55, y: 7 }, { x: 56, y: 7 }, { x: 57, y: 7 },
            { x: 66, y: 9 }, { x: 67, y: 9 },
            { x: 71, y: 5 },
        ];

        for (const pos of brickPositions) {
            const block = new BlockSprite(this.ctx, pos.x * TILE_SIZE, pos.y * TILE_SIZE, 'brick');
            this.blocks.push(block);
        }

        const platformPositions = [
            { x: 25, y: 10, width: 4 },
            { x: 45, y: 8, width: 3 },
            { x: 46, y: 10, width: 3 },
            { x: 60, y: 9, width: 4 },
            { x: 75, y: 7, width: 5 },
        ];

        for (const platform of platformPositions) {
            for (let i = 0; i < platform.width; i++) {
                const block = new BlockSprite(
                    this.ctx, 
                    (platform.x + i) * TILE_SIZE, 
                    platform.y * TILE_SIZE, 
                    'brick'
                );
                this.blocks.push(block);
            }
        }

        const pipePositions = [
            { x: 9, y: 12, height: 1 },
            { x: 13, y: 11, height: 2 },
            { x: 30, y: 12, height: 1 },
            { x: 50, y: 11, height: 2 },
            { x: 78, y: 12, height: 1 },
        ];

        for (const pipe of pipePositions) {
            const topBlock = new BlockSprite(
                this.ctx, 
                pipe.x * TILE_SIZE, 
                (14 - pipe.height) * TILE_SIZE, 
                'pipe_top'
            );
            this.blocks.push(topBlock);
            
            for (let h = 1; h < pipe.height; h++) {
                const block = new BlockSprite(
                    this.ctx, 
                    pipe.x * TILE_SIZE, 
                    (14 - pipe.height + h) * TILE_SIZE, 
                    'pipe'
                );
                this.blocks.push(block);
            }
        }

        const coinPositions = [
            { x: 12, y: 8 }, { x: 13, y: 8 }, { x: 14, y: 8 },
            { x: 26, y: 7 }, { x: 27, y: 7 }, { x: 28, y: 7 },
            { x: 38, y: 7 }, { x: 39, y: 7 },
            { x: 47, y: 5 }, { x: 48, y: 5 }, { x: 49, y: 5 },
            { x: 62, y: 6 }, { x: 63, y: 6 }, { x: 64, y: 6 },
            { x: 76, y: 4 }, { x: 77, y: 4 },
        ];

        for (const pos of coinPositions) {
            const coinKey = `${pos.x}_${pos.y}`;
            if (!collectedCoins.includes(coinKey)) {
                const coin = new CoinSprite(this.ctx, pos.x * TILE_SIZE, pos.y * TILE_SIZE);
                this.coins.push(coin);
            }
        }

        const enemyData = [
            { x: 16, type: 'goomba' },
            { x: 24, type: 'goomba' },
            { x: 33, type: 'goomba' },
            { x: 43, type: 'koopa_green' },
            { x: 53, type: 'goomba' },
            { x: 58, type: 'koopa_red' },
            { x: 68, type: 'goomba' },
            { x: 73, type: 'goomba' },
        ];

        for (const enemy of enemyData) {
            const enemyKey = `${enemy.x}_${enemy.type}`;
            if (!defeatedEnemies.includes(enemyKey)) {
                let enemySprite;
                switch (enemy.type) {
                    case 'goomba':
                        enemySprite = new GoombaSprite(this.ctx, enemy.x * TILE_SIZE, 13 * TILE_SIZE);
                        break;
                    case 'koopa_green':
                        enemySprite = new KoopaSprite(this.ctx, enemy.x * TILE_SIZE, 12 * TILE_SIZE, 'green');
                        break;
                    case 'koopa_red':
                        enemySprite = new KoopaSprite(this.ctx, enemy.x * TILE_SIZE, 12 * TILE_SIZE, 'red');
                        break;
                }
                if (enemySprite) {
                    enemySprite.vx = -1;
                    enemySprite.vy = 0;
                    this.enemies.push(enemySprite);
                }
            }
        }

        const piranhaPositions = [
            { x: 30, y: 11 },
            { x: 50, y: 10 },
        ];

        for (const pos of piranhaPositions) {
            const piranha = new PiranhaSprite(
                this.ctx, 
                pos.x * TILE_SIZE, 
                pos.y * TILE_SIZE
            );
            this.enemies.push(piranha);
        }

        this.flag = new FlagSprite(this.ctx, 90 * TILE_SIZE, 5 * TILE_SIZE);

        return this;
    }

    getBlocks() {
        return this.blocks;
    }

    getEnemies() {
        return this.enemies;
    }

    getCoins() {
        return this.coins;
    }

    getFlag() {
        return this.flag;
    }

    getItems() {
        return this.items;
    }

    addItem(item) {
        this.items.push(item);
    }

    removeCoin(coin) {
        const index = this.coins.indexOf(coin);
        if (index > -1) {
            this.coins.splice(index, 1);
        }
    }

    removeEnemy(enemy) {
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            this.enemies.splice(index, 1);
        }
    }

    removeItem(item) {
        const index = this.items.indexOf(item);
        if (index > -1) {
            this.items.splice(index, 1);
        }
    }

    removeBlock(block) {
        const index = this.blocks.indexOf(block);
        if (index > -1) {
            this.blocks.splice(index, 1);
        }
    }

    update(cameraX) {
        for (const enemy of this.enemies) {
            if (enemy instanceof GoombaSprite || enemy instanceof KoopaSprite) {
                if (Math.abs(enemy.x - cameraX) < 1000) {
                    enemy.x += enemy.vx || 0;
                    enemy.vy = enemy.vy || 0;
                    enemy.vy += 0.3;
                    enemy.y += enemy.vy;

                    for (const block of this.blocks) {
                        if (enemy.y + enemy.height > block.y && 
                            enemy.y < block.y + block.height &&
                            enemy.x + enemy.width > block.x &&
                            enemy.x < block.x + block.width) {
                            if (enemy.vy > 0) {
                                enemy.y = block.y - enemy.height;
                                enemy.vy = 0;
                            }
                        }
                    }

                    if (enemy.x < 0 || enemy.x > this.width) {
                        enemy.vx = -(enemy.vx || 0);
                    }

                    if (enemy instanceof KoopaSprite && enemy.shellMode) {
                        enemy.vx = enemy.shellVelocity || 0;
                    }
                }
            }

            if (enemy instanceof PiranhaSprite) {
                enemy.extendTimer++;
                if (enemy.extendTimer > 120) {
                    enemy.extended = !enemy.extended;
                    enemy.extendTimer = 0;
                }
            }
        }

        for (const coin of this.coins) {
            coin.update();
        }

        for (const item of this.items) {
            if (item.vx !== undefined) {
                item.x += item.vx;
                item.vy = item.vy || 0;
                item.vy += 0.3;
                item.y += item.vy;

                for (const block of this.blocks) {
                    if (item.y + item.height > block.y && 
                        item.y < block.y + block.height &&
                        item.x + item.width > block.x &&
                        item.x < block.x + block.width) {
                        if (item.vy > 0) {
                            item.y = block.y - item.height;
                            item.vy = 0;
                        }
                        if (Math.abs(item.vx) > 0 && 
                            item.y + item.height > block.y + 5) {
                            item.vx = -item.vx;
                        }
                    }
                }
            }
        }
    }

    draw(cameraX) {
        const startX = Math.floor(cameraX / TILE_SIZE) * TILE_SIZE;
        const endX = startX + 900;

        for (const block of this.blocks) {
            if (block.x >= startX - TILE_SIZE && block.x <= endX) {
                const drawX = block.x - cameraX;
                this.drawBlock(block, drawX);
            }
        }

        for (const coin of this.coins) {
            if (coin.x >= startX - TILE_SIZE && coin.x <= endX) {
                const drawX = coin.x - cameraX;
                this.drawCoin(coin, drawX);
            }
        }

        for (const item of this.items) {
            if (item.x >= startX - TILE_SIZE && item.x <= endX) {
                const drawX = item.x - cameraX;
                this.drawItem(item, drawX);
            }
        }

        for (const enemy of this.enemies) {
            if (enemy.x >= startX - TILE_SIZE && enemy.x <= endX) {
                const drawX = enemy.x - cameraX;
                this.drawEnemy(enemy, drawX);
            }
        }

        if (this.flag) {
            const drawX = this.flag.x - cameraX;
            this.drawFlag(this.flag, drawX);
        }
    }

    drawBlock(block, x) {
        const ctx = this.ctx;
        const y = block.y;

        switch (block.type) {
            case 'ground':
                ctx.fillStyle = '#e09050';
                ctx.fillRect(x, y, TILE_SIZE, 4);
                ctx.fillStyle = '#c84c0c';
                ctx.fillRect(x, y + 4, TILE_SIZE, TILE_SIZE - 4);
                break;
                
            case 'brick':
                ctx.fillStyle = '#c84c0c';
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#000';
                ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, 1);
                ctx.fillRect(x + 1, y + 15, TILE_SIZE - 2, 1);
                ctx.fillRect(x + 15, y + 1, 1, TILE_SIZE - 2);
                break;
                
            case 'question':
                const color = block.used ? '#804000' : '#fc9838';
                ctx.fillStyle = color;
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#000';
                ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, 1);
                ctx.fillRect(x + 1, y + TILE_SIZE - 2, TILE_SIZE - 2, 1);
                if (!block.used) {
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(x + 12, y + 6, 8, 4);
                    ctx.fillRect(x + 14, y + 10, 4, 8);
                    ctx.fillRect(x + 12, y + 18, 8, 4);
                }
                break;
                
            case 'pipe':
                ctx.fillStyle = '#00a800';
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#008000';
                ctx.fillRect(x + 4, y + 4, 8, TILE_SIZE - 8);
                break;
                
            case 'pipe_top':
                ctx.fillStyle = '#00a800';
                ctx.fillRect(x - 4, y, TILE_SIZE + 8, 16);
                ctx.fillStyle = '#008000';
                ctx.fillRect(x + 4, y + 4, 8, 8);
                ctx.fillStyle = '#00a800';
                ctx.fillRect(x, y + 16, TILE_SIZE, 16);
                break;
        }
    }

    drawCoin(coin, x) {
        const ctx = this.ctx;
        const y = coin.y;

        if (coin.collected) return;

        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(x + 16, y + 16, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff59d';
        ctx.beginPath();
        ctx.arc(x + 16, y + 14, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    drawItem(item, x) {
        const ctx = this.ctx;
        const y = item.y;

        if (item.type === 'mushroom' || item.type === 'oneup') {
            const capColor = item.type === 'oneup' ? '#00ff00' : '#ff0000';
            ctx.fillStyle = capColor;
            ctx.beginPath();
            ctx.arc(x + 16, y + 12, 14, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.fillRect(x + 10, y + 6, 3, 3);
            ctx.fillRect(x + 18, y + 6, 3, 3);
            if (item.type === 'oneup') {
                ctx.fillRect(x + 6, y + 10, 3, 3);
                ctx.fillRect(x + 22, y + 10, 3, 3);
            }
            
            ctx.fillStyle = '#fff';
            ctx.fillRect(x + 10, y + 18, 12, 14);
            
            ctx.fillStyle = '#000';
            ctx.fillRect(x + 12, y + 22, 2, 2);
            ctx.fillRect(x + 18, y + 22, 2, 2);
        }
    }

    drawEnemy(enemy, x) {
        const ctx = this.ctx;
        const y = enemy.y;

        if (enemy instanceof GoombaSprite) {
            if (enemy.dead) {
                ctx.fillStyle = '#8b4513';
                ctx.fillRect(x + 2, y + enemy.height - 8, enemy.width - 4, 8);
                return;
            }

            ctx.fillStyle = '#8b4513';
            ctx.beginPath();
            ctx.arc(x + 16, y + 16, 14, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(x + 10, y + 14, 5, 0, Math.PI * 2);
            ctx.arc(x + 22, y + 14, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(x + 12, y + 14, 2, 0, Math.PI * 2);
            ctx.arc(x + 20, y + 14, 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#000';
            ctx.fillRect(x + 5, y + 10, 6, 2);
            ctx.fillRect(x + 21, y + 10, 6, 2);

            ctx.fillStyle = '#8b4513';
            ctx.fillRect(x + 4, y + 26, 8, 6);
            ctx.fillRect(x + 20, y + 26, 8, 6);
        }
    }

    drawFlag(flag, x) {
        const ctx = this.ctx;
        const y = flag.y;

        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(x + 8, y, 8, flag.height);
        
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(x + 12, y, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.moveTo(x + 16, y + 20);
        ctx.lineTo(x + 50, y + 35);
        ctx.lineTo(x + 16, y + 50);
        ctx.closePath();
        ctx.fill();
    }
}