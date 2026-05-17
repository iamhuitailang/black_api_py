class Plant {
    constructor(type, col, row) {
        const config = CONFIG.PLANTS[type];
        this.type = type;
        this.col = col;
        this.row = row;
        const pos = Utils.gridToPixel(col, row);
        this.x = pos.x + CONFIG.CANVAS.CELL_WIDTH / 2;
        this.y = pos.y + CONFIG.CANVAS.CELL_HEIGHT / 2;
        this.width = CONFIG.CANVAS.CELL_WIDTH - 10;
        this.height = CONFIG.CANVAS.CELL_HEIGHT - 10;
        this.maxHealth = config.health;
        this.health = config.health;
        this.emoji = config.emoji;
        this.color = config.color;
        this.lastActionTime = 0;
        this.isAttacking = false;
        this.attackFrame = 0;
    }

    update(deltaTime, gameState) {
        const config = CONFIG.PLANTS[this.type];
        
        if (this.type === 'sunflower') {
            if (Date.now() - this.lastActionTime >= config.sunInterval) {
                this.produceSun(gameState);
                this.lastActionTime = Date.now();
            }
        } else if (this.type === 'peashooter' || this.type === 'iceshooter') {
            if (Date.now() - this.lastActionTime >= config.attackInterval) {
                const target = this.findTarget(gameState.zombies);
                if (target) {
                    this.shoot(target, gameState);
                    this.lastActionTime = Date.now();
                    this.isAttacking = true;
                    this.attackFrame = 0;
                }
            }
        }

        if (this.isAttacking) {
            this.attackFrame += deltaTime;
            if (this.attackFrame > 200) {
                this.isAttacking = false;
            }
        }
    }

    findTarget(zombies) {
        for (const zombie of zombies) {
            if (zombie.row === this.row && zombie.x > this.x) {
                return zombie;
            }
        }
        return null;
    }

    shoot(target, gameState) {
        const config = CONFIG.PLANTS[this.type];
        const projectile = {
            x: this.x + 20,
            y: this.y,
            targetRow: this.row,
            speed: config.projectileSpeed,
            damage: config.damage,
            type: this.type,
            slowEffect: config.slowEffect || 0,
            slowDuration: config.slowDuration || 0,
            width: 15,
            height: 15
        };
        gameState.projectiles.push(projectile);
    }

    produceSun(gameState) {
        const config = CONFIG.PLANTS.sunflower;
        const sun = {
            x: this.x + Utils.randomFloat(-20, 20),
            y: this.y - 20,
            targetY: this.y + 30,
            amount: config.sunProduction,
            collected: false,
            fadeTimer: 0,
            rising: true
        };
        gameState.suns.push(sun);
    }

    takeDamage(damage) {
        this.health -= damage;
        return this.health <= 0;
    }

    draw(ctx) {
        const bounceOffset = this.isAttacking ? Math.sin(this.attackFrame / 50) * 3 : 0;
        
        ctx.save();
        ctx.translate(this.x, this.y + bounceOffset);
        
        ctx.fillStyle = this.color + '40';
        ctx.beginPath();
        ctx.ellipse(0, 10, this.width / 2 - 5, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.font = '48px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, 0, 0);
        
        const healthPercent = this.health / this.maxHealth;
        if (healthPercent < 1) {
            ctx.fillStyle = '#333';
            ctx.fillRect(-25, -35, 50, 6);
            ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FFC107' : '#F44336';
            ctx.fillRect(-25, -35, 50 * healthPercent, 6);
        }
        
        ctx.restore();
    }
}

class PlantManager {
    constructor() {
        this.plants = [];
        this.grid = [];
        this.initGrid();
    }

    initGrid() {
        for (let row = 0; row < CONFIG.CANVAS.GRID_ROWS; row++) {
            this.grid[row] = [];
            for (let col = 0; col < CONFIG.CANVAS.GRID_COLS; col++) {
                this.grid[row][col] = null;
            }
        }
    }

    canPlant(col, row) {
        if (!Utils.isValidGrid(col, row)) return false;
        return this.grid[row][col] === null;
    }

    plant(type, col, row) {
        if (!this.canPlant(col, row)) return null;
        const plant = new Plant(type, col, row);
        this.plants.push(plant);
        this.grid[row][col] = plant;
        return plant;
    }

    remove(plant) {
        const index = this.plants.indexOf(plant);
        if (index > -1) {
            this.plants.splice(index, 1);
            this.grid[plant.row][plant.col] = null;
        }
    }

    getPlantAt(col, row) {
        if (!Utils.isValidGrid(col, row)) return null;
        return this.grid[row][col];
    }

    update(deltaTime, gameState) {
        for (let i = this.plants.length - 1; i >= 0; i--) {
            const plant = this.plants[i];
            plant.update(deltaTime, gameState);
            
            if (plant.health <= 0) {
                this.remove(plant);
            }
        }
    }

    draw(ctx) {
        for (const plant of this.plants) {
            plant.draw(ctx);
        }
    }

    serialize() {
        return this.plants.map(p => ({
            type: p.type,
            col: p.col,
            row: p.row,
            health: p.health
        }));
    }

    deserialize(data) {
        this.plants = [];
        this.initGrid();
        for (const pData of data) {
            const plant = new Plant(pData.type, pData.col, pData.row);
            plant.health = pData.health;
            this.plants.push(plant);
            this.grid[pData.row][pData.col] = plant;
        }
    }
}
