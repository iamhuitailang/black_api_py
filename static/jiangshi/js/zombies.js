class Zombie {
    constructor(type, row, difficulty = 'normal') {
        const config = CONFIG.ZOMBIES[type];
        const diffConfig = CONFIG.DIFFICULTY[difficulty];
        
        this.type = type;
        this.row = row;
        this.x = CONFIG.CANVAS.WIDTH + 50;
        const pos = Utils.gridToPixel(0, row);
        this.y = pos.y + CONFIG.CANVAS.CELL_HEIGHT / 2;
        this.width = 50;
        this.height = 70;
        
        this.maxHealth = config.health * diffConfig.zombieHealthMultiplier;
        this.health = this.maxHealth;
        this.armor = config.armor || 0;
        this.maxArmor = this.armor;
        
        this.baseSpeed = config.speed * diffConfig.zombieSpeedMultiplier;
        this.speed = this.baseSpeed;
        this.damage = config.damage;
        this.attackInterval = config.attackInterval;
        
        this.emoji = config.emoji;
        this.color = config.color;
        
        this.state = 'walking';
        this.target = null;
        this.lastAttackTime = 0;
        this.attackFrame = 0;
        
        this.slowed = false;
        this.slowEndTime = 0;
        
        this.walkAnim = 0;
    }

    update(deltaTime, plantManager) {
        if (this.slowed && Date.now() > this.slowEndTime) {
            this.slowed = false;
            this.speed = this.baseSpeed;
        }

        this.walkAnim += deltaTime;

        if (this.state === 'walking') {
            const target = this.findPlantInFront(plantManager);
            if (target) {
                this.state = 'attacking';
                this.target = target;
                this.attackFrame = 0;
            } else {
                this.x -= this.speed;
            }
        } else if (this.state === 'attacking' && this.target) {
            if (this.target.health <= 0) {
                this.state = 'walking';
                this.target = null;
            } else {
                if (Date.now() - this.lastAttackTime >= this.attackInterval) {
                    this.attack(this.target);
                    this.lastAttackTime = Date.now();
                    this.attackFrame = 0;
                }
                this.attackFrame += deltaTime;
            }
        }
    }

    findPlantInFront(plantManager) {
        for (let col = CONFIG.CANVAS.GRID_COLS - 1; col >= 0; col--) {
            const plant = plantManager.getPlantAt(col, this.row);
            if (plant) {
                const plantPos = Utils.gridToPixel(col, this.row);
                const plantRightEdge = plantPos.x + CONFIG.CANVAS.CELL_WIDTH;
                if (this.x <= plantRightEdge + 10 && this.x >= plantPos.x - 20) {
                    return plant;
                }
            }
        }
        return null;
    }

    attack(plant) {
        plant.takeDamage(this.damage);
    }

    takeDamage(damage, slowEffect = 0, slowDuration = 0) {
        if (this.armor > 0) {
            const armorDamage = Math.min(this.armor, damage);
            this.armor -= armorDamage;
            damage -= armorDamage;
        }
        
        this.health -= damage;
        
        if (slowEffect > 0) {
            this.slowed = true;
            this.speed = this.baseSpeed * slowEffect;
            this.slowEndTime = Date.now() + slowDuration;
        }
        
        return this.health <= 0;
    }

    hasReachedHouse() {
        return this.x <= CONFIG.CANVAS.GRID_OFFSET_X - 30;
    }

    draw(ctx) {
        const bounceOffset = this.state === 'walking' ? Math.sin(this.walkAnim / 100) * 2 : 0;
        const attackOffset = this.state === 'attacking' ? Math.sin(this.attackFrame / 50) * 5 : 0;
        
        ctx.save();
        ctx.translate(this.x + attackOffset, this.y + bounceOffset);
        
        if (this.slowed) {
            ctx.shadowColor = '#00BFFF';
            ctx.shadowBlur = 15;
        }
        
        ctx.font = '48px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, 0, 0);
        
        ctx.restore();
        
        const totalMaxHealth = this.maxHealth + (this.maxArmor || 0);
        const totalCurrentHealth = this.health + (this.armor || 0);
        const healthPercent = totalCurrentHealth / totalMaxHealth;
        
        if (healthPercent < 1) {
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x - 25, this.y - 45, 50, 6);
            
            let barWidth = 50;
            if (this.maxArmor > 0) {
                const armorPercent = this.armor / this.maxArmor;
                const healthOnlyPercent = this.health / this.maxHealth;
                
                if (this.armor > 0) {
                    ctx.fillStyle = '#708090';
                    ctx.fillRect(this.x - 25, this.y - 45, 50 * armorPercent * (this.maxArmor / totalMaxHealth), 6);
                }
                
                const healthBarStart = this.x - 25 + 50 * (this.maxArmor / totalMaxHealth);
                const healthBarWidth = 50 * (this.maxHealth / totalMaxHealth) * healthOnlyPercent;
                ctx.fillStyle = healthOnlyPercent > 0.5 ? '#4CAF50' : healthOnlyPercent > 0.25 ? '#FFC107' : '#F44336';
                ctx.fillRect(healthBarStart, this.y - 45, healthBarWidth, 6);
            } else {
                ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FFC107' : '#F44336';
                ctx.fillRect(this.x - 25, this.y - 45, 50 * healthPercent, 6);
            }
        }
        
        if (this.type === 'cone' && this.armor > 0) {
            ctx.font = '20px serif';
            ctx.fillText('🟠', this.x + 5, this.y - 35);
        } else if (this.type === 'bucket' && this.armor > 0) {
            ctx.font = '20px serif';
            ctx.fillText('🪣', this.x + 5, this.y - 35);
        }
    }
}

class ZombieManager {
    constructor(difficulty = 'normal') {
        this.zombies = [];
        this.difficulty = difficulty;
        this.spawnQueue = [];
        this.lastSpawnTime = 0;
        this.spawnDelay = 2000;
        this.waveStarted = false;
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
    }

    spawnWave(waveIndex) {
        if (waveIndex >= CONFIG.WAVES.length) return;
        
        const wave = CONFIG.WAVES[waveIndex];
        this.spawnQueue = [];
        this.spawnDelay = wave.delay * CONFIG.DIFFICULTY[this.difficulty].spawnIntervalMultiplier;
        
        for (const zombieConfig of wave.zombies) {
            for (let i = 0; i < zombieConfig.count; i++) {
                this.spawnQueue.push(zombieConfig.type);
            }
        }
        
        this.spawnQueue = Utils.shuffleArray(this.spawnQueue);
        this.lastSpawnTime = Date.now();
        this.waveStarted = true;
    }

    update(deltaTime, plantManager) {
        if (this.spawnQueue.length > 0 && Date.now() - this.lastSpawnTime >= this.spawnDelay) {
            const type = this.spawnQueue.shift();
            const row = Utils.randomInt(0, CONFIG.CANVAS.GRID_ROWS - 1);
            const zombie = new Zombie(type, row, this.difficulty);
            this.zombies.push(zombie);
            this.lastSpawnTime = Date.now();
        }

        for (let i = this.zombies.length - 1; i >= 0; i--) {
            const zombie = this.zombies[i];
            zombie.update(deltaTime, plantManager);
            
            if (zombie.health <= 0) {
                this.zombies.splice(i, 1);
                continue;
            }
            
            if (zombie.hasReachedHouse()) {
                return 'house_reached';
            }
        }
        
        return null;
    }

    draw(ctx) {
        for (const zombie of this.zombies) {
            zombie.draw(ctx);
        }
    }

    isWaveComplete() {
        if (!this.waveStarted) return false;
        return this.spawnQueue.length === 0 && this.zombies.length === 0;
    }

    getZombieCount() {
        return this.zombies.length + this.spawnQueue.length;
    }

    serialize() {
        return {
            zombies: this.zombies.map(z => ({
                type: z.type,
                row: z.row,
                x: z.x,
                health: z.health,
                armor: z.armor,
                slowed: z.slowed,
                slowEndTime: z.slowEndTime
            })),
            spawnQueue: [...this.spawnQueue],
            lastSpawnTime: this.lastSpawnTime,
            spawnDelay: this.spawnDelay,
            waveStarted: this.waveStarted
        };
    }

    deserialize(data) {
        this.zombies = [];
        for (const zData of data.zombies) {
            const zombie = new Zombie(zData.type, zData.row, this.difficulty);
            zombie.x = zData.x;
            zombie.health = zData.health;
            zombie.armor = zData.armor;
            zombie.slowed = zData.slowed;
            zombie.slowEndTime = zData.slowEndTime;
            if (zombie.slowed) {
                zombie.speed = zombie.baseSpeed * 0.5;
            }
            this.zombies.push(zombie);
        }
        this.spawnQueue = data.spawnQueue || [];
        this.lastSpawnTime = data.lastSpawnTime || 0;
        this.spawnDelay = data.spawnDelay || 2000;
        this.waveStarted = data.waveStarted || false;
    }
}
