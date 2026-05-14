class Game {
    constructor(canvas) {
        this.renderer = new Renderer(canvas);
        this.pathSystem = null;
        this.projectileSystem = new ProjectileSystem();
        
        this.gold = CONFIG.GAME.STARTING_GOLD;
        this.lives = CONFIG.GAME.STARTING_LIVES;
        this.currentWave = 0;
        this.totalWaves = CONFIG.GAME.TOTAL_WAVES;
        this.waveInProgress = false;
        this.waveEnemiesSpawned = 0;
        this.waveEnemiesTotal = 0;
        this.spawnTimer = 0;
        
        this.towers = [];
        this.enemies = [];
        this.effects = [];
        this.hero = null;
        
        this.selectedTower = null;
        this.selectedTowerForUpgrade = null;
        this.hoveredTower = null;
        this.selectedHero = 'gerard';
        
        this.gameOver = false;
        this.victory = false;
        this.isPaused = false;
        this.gameSpeed = 1;
        
        this.enemiesKilled = 0;
        this.totalDamageDealt = 0;
        
        this.lastTime = 0;
        this.autoSaveTimer = 0;
        this.frameCount = 0;
        
        this.mouseX = 0;
        this.mouseY = 0;
        
        this.setupPath();
    }

    setupPath() {
        const canvas = this.renderer.canvas;
        this.pathSystem = new PathSystem(canvas.width, canvas.height);
    }

    resize(width, height) {
        this.renderer.resize(width, height);
        this.setupPath();
    }

    startNewGame() {
        this.gold = CONFIG.GAME.STARTING_GOLD;
        this.lives = CONFIG.GAME.STARTING_LIVES;
        this.currentWave = 0;
        this.waveInProgress = false;
        this.waveEnemiesSpawned = 0;
        this.waveEnemiesTotal = 0;
        this.spawnTimer = 0;
        this.towers = [];
        this.enemies = [];
        this.effects = [];
        this.projectileSystem.clear();
        this.gameOver = false;
        this.victory = false;
        this.isPaused = false;
        this.enemiesKilled = 0;
        this.totalDamageDealt = 0;
        this.lastTime = 0;
        this.autoSaveTimer = 0;
        this.frameCount = 0;
        this.selectedTower = null;
        this.selectedTowerForUpgrade = null;
        this.hoveredTower = null;
        
        const slots = this.pathSystem.getTowerSlots();
        for (let i = 0, len = slots.length; i < len; i++) {
            slots[i].occupied = false;
            slots[i].tower = null;
        }
        
        storage.saveNow(this.getSaveData());
        this.spawnHero();
    }

    spawnHero() {
        const slots = this.pathSystem.getTowerSlots();
        if (slots.length > 0) {
            this.hero = new Hero(this.selectedHero, slots[0].x + 100, slots[0].y);
        }
    }

    loadGame(saveData) {
        this.gold = saveData.gold;
        this.lives = saveData.lives;
        this.currentWave = saveData.currentWave;
        this.waveInProgress = false;
        this.enemiesKilled = saveData.enemiesKilled || 0;
        this.totalDamageDealt = saveData.totalDamageDealt || 0;
        this.waveEnemiesSpawned = 0;
        this.waveEnemiesTotal = 0;
        this.spawnTimer = 0;
        this.lastTime = 0;
        this.autoSaveTimer = 0;
        this.selectedTower = null;
        this.selectedTowerForUpgrade = null;
        this.hoveredTower = null;
        
        this.towers = [];
        if (saveData.towers) {
            for (const towerData of saveData.towers) {
                try {
                    const tower = new Tower(
                        towerData.type,
                        towerData.x,
                        towerData.y,
                        towerData.slotIndex,
                        towerData.level
                    );
                    tower.totalDamage = towerData.totalDamage || 0;
                    tower.kills = towerData.kills || 0;
                    this.towers.push(tower);
                } catch (error) {
                    console.error('Error loading tower:', error);
                }
            }
        }
        
        if (saveData.towerSlots) {
            const slots = this.pathSystem.getTowerSlots();
            for (let i = 0; i < saveData.towerSlots.length && i < slots.length; i++) {
                slots[i].occupied = saveData.towerSlots[i].occupied;
            }
        }
        
        if (saveData.hero) {
            try {
                this.hero = new Hero(saveData.hero.type, saveData.hero.x, saveData.hero.y);
                this.hero.hp = saveData.hero.hp;
                this.hero.maxHp = saveData.hero.maxHp;
                this.hero.skillCooldown = saveData.hero.skillCooldown || 0;
            } catch (error) {
                console.error('Error loading hero:', error);
                this.spawnHero();
            }
        } else {
            this.spawnHero();
        }
        
        this.enemies = [];
        this.effects = [];
        this.projectileSystem.clear();
        this.gameOver = false;
        this.victory = false;
        this.isPaused = false;
    }

    getSaveData() {
        return {
            gold: this.gold,
            lives: this.lives,
            currentWave: this.currentWave,
            waveInProgress: this.waveInProgress,
            towers: this.towers.map(t => ({
                type: t.type,
                level: t.level,
                x: t.x,
                y: t.y,
                slotIndex: t.slotIndex,
                totalDamage: t.totalDamage,
                kills: t.kills
            })),
            towerSlots: this.pathSystem.getTowerSlots().map(s => ({
                occupied: s.occupied
            })),
            hero: this.hero ? {
                type: this.hero.type,
                x: this.hero.x,
                y: this.hero.y,
                hp: this.hero.hp,
                maxHp: this.hero.maxHp,
                skillCooldown: this.hero.skillCooldown
            } : null,
            enemiesKilled: this.enemiesKilled,
            totalDamageDealt: this.totalDamageDealt
        };
    }

    update(currentTime) {
        if (this.isPaused || this.gameOver || this.victory) return;
        
        if (this.lastTime === 0 || currentTime < this.lastTime) {
            this.lastTime = currentTime;
        }
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        const dt = Math.min(deltaTime * this.gameSpeed, 0.05);
        
        this.updateWave(dt);
        this.updateTowers(dt);
        this.updateEnemies(dt);
        this.updateHero(dt);
        this.updateProjectiles(dt);
        this.updateEffects(dt);
        this.checkGameEnd();
        
        this.frameCount++;
        if (this.frameCount % 60 === 0) {
            storage.autoSave(this.getSaveData());
        }
    }

    updateWave(dt) {
        if (!this.waveInProgress) return;
        
        this.spawnTimer -= dt;
        
        if (this.spawnTimer <= 0 && this.waveEnemiesSpawned < this.waveEnemiesTotal) {
            this.spawnEnemy();
            const waveConfig = CONFIG.WAVES[this.currentWave];
            if (waveConfig) {
                this.spawnTimer = waveConfig.delay / 1000;
            } else {
                this.spawnTimer = 1;
            }
        }
        
        const aliveEnemies = this.enemies.filter(e => !e.dead).length;
        if (this.waveEnemiesSpawned >= this.waveEnemiesTotal && aliveEnemies === 0) {
            this.endWave();
        }
    }

    startWave() {
        if (this.waveInProgress || this.currentWave >= this.totalWaves) {
            return;
        }
        
        this.waveInProgress = true;
        this.waveEnemiesSpawned = 0;
        this.spawnTimer = 0;
        
        const waveConfig = CONFIG.WAVES[this.currentWave];
        let total = 0;
        for (const enemyGroup of waveConfig.enemies) {
            total += enemyGroup.count;
        }
        this.waveEnemiesTotal = total;
        
        this.spawnEnemy();
        this.spawnTimer = CONFIG.WAVES[this.currentWave].delay / 1000;
        
        this.checkHeroUnlock();
    }

    checkHeroUnlock() {
        for (const [type, config] of Object.entries(CONFIG.HEROES)) {
            if (!config.unlocked && config.unlockWave && this.currentWave >= config.unlockWave) {
                config.unlocked = true;
                this.effects.push({
                    type: 'summon',
                    x: this.renderer.width / 2,
                    y: this.renderer.height / 2,
                    duration: 1,
                    maxDuration: 1
                });
            }
        }
    }

    endWave() {
        this.waveInProgress = false;
        this.currentWave++;
        this.gold += 50 + this.currentWave * 20;
        
        storage.autoSave(this.getSaveData());
    }

    spawnEnemy() {
        const waveConfig = CONFIG.WAVES[this.currentWave];
        if (!waveConfig) {
            return;
        }
        
        let spawnedCount = 0;
        
        for (const enemyGroup of waveConfig.enemies) {
            if (this.waveEnemiesSpawned < spawnedCount + enemyGroup.count) {
                try {
                    const enemy = new Enemy(enemyGroup.type, this.pathSystem);
                    if (enemy.config) {
                        this.enemies.push(enemy);
                        this.waveEnemiesSpawned++;
                        return;
                    }
                } catch (error) {
                    console.error('Error spawning enemy:', error);
                }
            }
            spawnedCount += enemyGroup.count;
        }
        
        if (waveConfig.boss && this.waveEnemiesSpawned === this.waveEnemiesTotal) {
            try {
                const boss = new Enemy(waveConfig.boss, this.pathSystem);
                if (boss.config) {
                    this.enemies.push(boss);
                    this.waveEnemiesSpawned++;
                }
            } catch (error) {
                console.error('Error spawning boss:', error);
            }
        }
        
        if (waveConfig.boss2 && this.waveEnemiesSpawned === this.waveEnemiesTotal + 1) {
            try {
                const boss = new Enemy(waveConfig.boss2, this.pathSystem);
                if (boss.config) {
                    this.enemies.push(boss);
                    this.waveEnemiesSpawned++;
                }
            } catch (error) {
                console.error('Error spawning boss2:', error);
            }
        }
    }

    updateTowers(dt) {
        const projectiles = this.projectileSystem;
        const effects = this.effects;
        const enemies = this.enemies;
        
        for (let i = 0, len = this.towers.length; i < len; i++) {
            this.towers[i].update(dt, enemies, projectiles, effects);
        }
    }

    updateEnemies(dt) {
        for (const enemy of this.enemies) {
            enemy.update(dt, this.enemies, this.towers, this.effects);
        }
        
        const aliveEnemies = [];
        for (const enemy of this.enemies) {
            if (enemy.dead) {
                if (enemy.reachedEnd) {
                    this.lives = Math.max(0, this.lives - 1);
                } else {
                    this.gold += enemy.reward;
                    this.enemiesKilled++;
                }
            } else {
                aliveEnemies.push(enemy);
            }
        }
        this.enemies = aliveEnemies;
    }

    updateHero(dt) {
        if (!this.hero) return;
        this.hero.update(dt, this.enemies, this.towers, this.effects, this.projectileSystem);
    }

    updateProjectiles(dt) {
        this.projectileSystem.update(dt, this.enemies, this.effects);
    }

    updateEffects(dt) {
        const maxEffects = 100;
        
        for (const effect of this.effects) {
            effect.duration -= dt;
        }
        this.effects = this.effects.filter(e => e.duration > 0).slice(-maxEffects);
    }

    checkGameEnd() {
        if (this.lives <= 0) {
            this.gameOver = true;
        } else if (this.currentWave >= this.totalWaves && this.enemies.length === 0 && !this.waveInProgress) {
            this.victory = true;
        }
    }

    selectTower(type) {
        this.selectedTower = type;
        this.selectedTowerForUpgrade = null;
    }

    clickTowerSlot(x, y) {
        const slot = this.pathSystem.getSlotAtPosition(x, y);
        if (!slot) return false;
        
        if (slot.occupied) {
            const tower = this.towers.find(t => t.slotIndex === slot.index);
            if (tower) {
                this.selectedTowerForUpgrade = tower;
                this.selectedTower = null;
                return true;
            }
        } else if (this.selectedTower) {
            const cost = CONFIG.TOWERS[this.selectedTower].levels[0].cost;
            if (this.gold >= cost) {
                this.buildTower(slot, this.selectedTower);
                return true;
            }
        }
        
        return false;
    }

    buildTower(slot, type) {
        const config = CONFIG.TOWERS[type].levels[0];
        this.gold -= config.cost;
        
        const tower = new Tower(type, slot.x, slot.y, slot.index, 0);
        this.towers.push(tower);
        slot.occupied = true;
        slot.tower = tower;
        
        this.selectedTower = null;
        storage.autoSave(this.getSaveData());
    }

    upgradeTower(tower) {
        if (!tower.canUpgrade()) return false;
        
        const cost = tower.getUpgradeCost();
        if (this.gold < cost) return false;
        
        this.gold -= cost;
        tower.upgrade();
        return true;
    }

    sellTower(tower) {
        const sellValue = tower.getSellValue();
        this.gold += sellValue;
        
        const slots = this.pathSystem.getTowerSlots();
        const slot = slots.find(s => s.index === tower.slotIndex);
        if (slot) {
            slot.occupied = false;
            slot.tower = null;
        }
        
        this.towers = this.towers.filter(t => t !== tower);
        this.selectedTowerForUpgrade = null;
        return true;
    }

    useHeroSkill() {
        if (!this.hero || this.hero.skillCooldown > 0) return false;
        return this.hero.useSkill(this.enemies, this.effects, this.projectileSystem);
    }

    moveHero(x, y) {
        if (this.hero) {
            this.hero.moveTo(x, y);
        }
    }

    handleCanvasClick(x, y) {
        if (this.clickTowerSlot(x, y)) return;
        this.moveHero(x, y);
    }

    render() {
        this.renderer.clear();
        this.renderer.drawPath(this.pathSystem.getPath());
        this.renderer.drawTowerSlots(
            this.pathSystem.getTowerSlots(),
            this.selectedTower,
            this.gold
        );
        this.renderer.drawTowers(this.towers, this.hoveredTower, this.selectedTowerForUpgrade);
        this.renderer.drawEnemies(this.enemies);
        this.renderer.drawHero(this.hero);
        this.renderer.drawProjectiles(this.projectileSystem.getAll());
        this.renderer.drawEffects(this.effects);
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (!this.isPaused) {
            this.lastTime = 0;
        }
    }

    setSpeed(speed) {
        this.gameSpeed = speed;
    }

    getTowerAtPosition(x, y) {
        for (const tower of this.towers) {
            const dist = Utils.distance(x, y, tower.x, tower.y);
            if (dist < 25) {
                return tower;
            }
        }
        return null;
    }
}
