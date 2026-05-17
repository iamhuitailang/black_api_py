class Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.plantManager = null;
        this.zombieManager = null;
        
        this.state = {
            phase: 'menu',
            difficulty: 'normal',
            sun: CONFIG.GAME.INITIAL_SUN,
            currentWave: 1,
            killCount: 0,
            score: 0,
            selectedPlant: null,
            hoverCol: -1,
            hoverRow: -1,
            projectiles: [],
            suns: [],
            lastSunDropTime: 0,
            waveStartTime: 0,
            wavePrepTime: 0,
            isPaused: false,
            isGameOver: false,
            isVictory: false
        };
        
        this.lastTime = 0;
        this.animationId = null;
    }

    init() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        UI.init();
        
        this.loadDifficulty();
        this.updatePreviewStats();
        this.bindEvents();
        
        const savedGame = Storage.loadGameState();
        if (savedGame) {
            const confirmResume = confirm('检测到未完成的游戏，是否继续？');
            if (confirmResume) {
                this.loadGameState();
            } else {
                Storage.clearGameState();
            }
        }
    }

    loadDifficulty() {
        const savedDiff = Storage.getDifficulty();
        this.state.difficulty = savedDiff || 'normal';
        
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.difficulty === this.state.difficulty) {
                btn.classList.add('active');
            }
        });
    }

    updatePreviewStats() {
        const stats = Storage.getStats();
        UI.updatePreviewStats(stats);
    }

    bindEvents() {
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.state.difficulty = btn.dataset.difficulty;
                document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                Storage.setDifficulty(this.state.difficulty);
            });
        });
        
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('resume-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('overlay-restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('next-wave-btn').addEventListener('click', () => this.skipToNextWave());
        
        document.getElementById('quit-btn').addEventListener('click', () => this.quitToMenu());
        document.getElementById('gameover-quit-btn').addEventListener('click', () => this.quitToMenu());
        document.getElementById('victory-quit-btn').addEventListener('click', () => this.quitToMenu());
        document.getElementById('gameover-restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('victory-restart-btn').addEventListener('click', () => this.restartGame());
        
        document.querySelectorAll('.plant-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.stopPropagation();
                const plantType = card.dataset.plant;
                this.selectPlant(plantType);
            });
        });
        
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mouseleave', () => {
            this.state.hoverCol = -1;
            this.state.hoverRow = -1;
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.state.phase === 'playing') {
                    this.togglePause();
                }
            } else if (e.key === '1') {
                this.selectPlant('sunflower');
            } else if (e.key === '2') {
                this.selectPlant('peashooter');
            } else if (e.key === '3') {
                this.selectPlant('iceshooter');
            } else if (e.key === '4') {
                this.selectPlant('wallnut');
            }
        });
        
        window.addEventListener('beforeunload', () => {
            if (this.state.phase === 'playing' && !this.state.isGameOver && !this.state.isVictory) {
                this.saveGameState();
            }
        });
    }

    startGame() {
        Storage.clearGameState();
        
        this.plantManager = new PlantManager();
        this.zombieManager = new ZombieManager(this.state.difficulty);
        this.zombieManager.waveStarted = false;
        
        cancelAnimationFrame(this.animationId);
        
        this.state = {
            phase: 'playing',
            difficulty: this.state.difficulty,
            sun: CONFIG.GAME.INITIAL_SUN,
            currentWave: 1,
            killCount: 0,
            score: 0,
            selectedPlant: null,
            hoverCol: -1,
            hoverRow: -1,
            projectiles: [],
            suns: [],
            lastSunDropTime: Date.now(),
            waveStartTime: Date.now(),
            wavePrepTime: CONFIG.GAME.WAVE_PREP_TIME,
            isPaused: false,
            isGameOver: false,
            isVictory: false
        };
        
        const stats = Storage.getStats();
        UI.updateHighestWave(stats.highestWave);
        UI.updateStats(this.state);
        UI.updatePlantCards(this.state.sun);
        UI.updateWaveStatus('准备中...');
        UI.clearSelectedPlant();
        UI.hideAllOverlays();
        UI.showScreen('game');
        
        this.lastTime = performance.now();
        this.gameLoop();
        
        setTimeout(() => {
            if (this.state.phase === 'playing' && !this.state.isPaused) {
                this.startWave();
            }
        }, CONFIG.GAME.WAVE_PREP_TIME);
    }

    startWave() {
        this.zombieManager.spawnWave(this.state.currentWave - 1);
        UI.updateWaveStatus(`第 ${this.state.currentWave} 波进行中`);
    }

    selectPlant(plantType) {
        const cost = CONFIG.PLANTS[plantType].cost;
        if (this.state.sun < cost) {
            return;
        }
        
        if (this.state.selectedPlant === plantType) {
            this.state.selectedPlant = null;
            UI.clearSelectedPlant();
        } else {
            this.state.selectedPlant = plantType;
            UI.setSelectedPlant(plantType);
        }
    }

    handleMouseMove(e) {
        if (this.state.phase !== 'playing' || this.state.isPaused) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        const grid = Utils.pixelToGrid(x, y);
        this.state.hoverCol = grid.col;
        this.state.hoverRow = grid.row;
    }

    handleClick(e) {
        if (this.state.phase !== 'playing' || this.state.isPaused) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        for (let i = this.state.suns.length - 1; i >= 0; i--) {
            const sun = this.state.suns[i];
            if (!sun.collected && Utils.getDistance(x, y, sun.x, sun.y) < 25) {
                this.collectSun(sun);
                return;
            }
        }
        
        if (this.state.selectedPlant) {
            const grid = Utils.pixelToGrid(x, y);
            if (Utils.isValidGrid(grid.col, grid.row)) {
                this.tryPlant(grid.col, grid.row);
            }
        }
    }

    tryPlant(col, row) {
        if (!this.state.selectedPlant) return;
        
        const cost = CONFIG.PLANTS[this.state.selectedPlant].cost;
        if (this.state.sun < cost) return;
        
        if (!this.plantManager.canPlant(col, row)) return;
        
        this.plantManager.plant(this.state.selectedPlant, col, row);
        this.state.sun -= cost;
        
        UI.updateStats(this.state);
        UI.updatePlantCards(this.state.sun);
        
        this.state.selectedPlant = null;
        UI.clearSelectedPlant();
    }

    collectSun(sun) {
        sun.collected = true;
        this.state.sun += sun.amount;
        UI.updateStats(this.state);
        UI.updatePlantCards(this.state.sun);
    }

    update(deltaTime) {
        if (this.state.phase !== 'playing' || this.state.isPaused) return;
        
        const gameState = {
            ...this.state,
            zombies: this.zombieManager.zombies,
            plants: this.plantManager.plants
        };
        
        this.plantManager.update(deltaTime, gameState);
        
        const zombieResult = this.zombieManager.update(deltaTime, this.plantManager);
        if (zombieResult === 'house_reached') {
            this.gameOver();
            return;
        }
        
        this.updateProjectiles(deltaTime);
        this.updateSuns(deltaTime);
        this.checkWaveComplete();
        this.autoDropSun();
        this.updateKillCount();
        
        if (Math.random() < 0.02) {
            this.saveGameState();
        }
    }

    updateProjectiles(deltaTime) {
        for (let i = this.state.projectiles.length - 1; i >= 0; i--) {
            const proj = this.state.projectiles[i];
            proj.x += proj.speed;
            
            if (proj.x > CONFIG.CANVAS.WIDTH) {
                this.state.projectiles.splice(i, 1);
                continue;
            }
            
            for (const zombie of this.zombieManager.zombies) {
                if (zombie.row === proj.targetRow) {
                    if (Math.abs(zombie.x - proj.x) < 30 && Math.abs(zombie.y - proj.y) < 30) {
                        const killed = zombie.takeDamage(proj.damage, proj.slowEffect, proj.slowDuration);
                        this.state.projectiles.splice(i, 1);
                        
                        if (killed) {
                            this.state.killCount++;
                            this.state.score += CONFIG.GAME.SCORE_PER_KILL;
                            UI.updateStats(this.state);
                        }
                        break;
                    }
                }
            }
        }
    }

    updateSuns(deltaTime) {
        for (let i = this.state.suns.length - 1; i >= 0; i--) {
            const sun = this.state.suns[i];
            
            if (sun.collected) {
                sun.fadeTimer += deltaTime;
                sun.y -= 0.5;
                if (sun.fadeTimer > 500) {
                    this.state.suns.splice(i, 1);
                }
                continue;
            }
            
            if (sun.rising) {
                sun.y -= 1;
                if (sun.y <= sun.targetY) {
                    sun.rising = false;
                }
            }
            
            sun.fadeTimer += deltaTime;
            if (sun.fadeTimer > 10000) {
                this.state.suns.splice(i, 1);
            }
        }
    }

    autoDropSun() {
        const diffMult = CONFIG.DIFFICULTY[this.state.difficulty].sunProductionMultiplier;
        const interval = CONFIG.GAME.SUN_DROP_INTERVAL / diffMult;
        
        if (Date.now() - this.state.lastSunDropTime >= interval) {
            const sun = {
                x: Utils.randomInt(CONFIG.CANVAS.GRID_OFFSET_X + 50, CONFIG.CANVAS.WIDTH - 50),
                y: -30,
                targetY: Utils.randomInt(CONFIG.CANVAS.GRID_OFFSET_Y + 50, CONFIG.CANVAS.HEIGHT - 100),
                amount: CONFIG.GAME.SUN_DROP_AMOUNT,
                collected: false,
                fadeTimer: 0,
                rising: false
            };
            this.state.suns.push(sun);
            this.state.lastSunDropTime = Date.now();
        }
    }

    updateKillCount() {
        const actualKills = this.state.killCount;
        const expectedZombies = this.getTotalZombiesInWave(this.state.currentWave - 1);
        const remaining = this.zombieManager.getZombieCount();
    }

    getTotalZombiesInWave(waveIndex) {
        if (waveIndex >= CONFIG.WAVES.length) return 0;
        const wave = CONFIG.WAVES[waveIndex];
        return wave.zombies.reduce((sum, z) => sum + z.count, 0);
    }

    checkWaveComplete() {
        if (!this.zombieManager.waveStarted) return;
        
        if (this.zombieManager.isWaveComplete() && this.state.phase === 'playing') {
            this.zombieManager.waveStarted = false;
            
            if (this.state.currentWave >= CONFIG.GAME.TOTAL_WAVES) {
                this.victory();
            } else {
                this.state.currentWave++;
                this.state.score += CONFIG.GAME.SCORE_PER_WAVE;
                UI.updateStats(this.state);
                UI.updateWaveStatus(`准备第 ${this.state.currentWave} 波...`);
                
                setTimeout(() => {
                    if (this.state.phase === 'playing' && !this.state.isPaused) {
                        this.startWave();
                    }
                }, CONFIG.GAME.WAVE_PREP_TIME);
            }
        }
    }

    skipToNextWave() {
        if (this.state.phase !== 'playing' || this.state.isPaused) return;
        if (this.zombieManager.spawnQueue.length > 0) {
            this.zombieManager.spawnDelay = 100;
        }
    }

    togglePause() {
        if (this.state.phase !== 'playing') return;
        
        this.state.isPaused = !this.state.isPaused;
        
        if (this.state.isPaused) {
            UI.showPauseOverlay();
        } else {
            UI.hidePauseOverlay();
            this.lastTime = performance.now();
            this.gameLoop();
        }
    }

    gameOver() {
        this.state.phase = 'gameover';
        this.state.isGameOver = true;
        
        Storage.updateStats({
            wave: this.state.currentWave,
            kills: this.state.killCount,
            score: this.state.score
        });
        
        Storage.clearGameState();
        
        cancelAnimationFrame(this.animationId);
        UI.showGameOver(this.state);
    }

    victory() {
        this.state.phase = 'victory';
        this.state.isVictory = true;
        
        Storage.updateStats({
            wave: this.state.currentWave,
            kills: this.state.killCount,
            score: this.state.score
        });
        
        Storage.clearGameState();
        
        cancelAnimationFrame(this.animationId);
        UI.showVictory(this.state);
    }

    restartGame() {
        cancelAnimationFrame(this.animationId);
        Storage.clearGameState();
        this.startGame();
    }

    quitToMenu() {
        cancelAnimationFrame(this.animationId);
        this.state.phase = 'menu';
        Storage.clearGameState();
        UI.hideAllOverlays();
        UI.showScreen('start');
        this.updatePreviewStats();
    }

    saveGameState() {
        if (this.state.phase !== 'playing' || this.state.isGameOver || this.state.isVictory) return;
        
        const saveData = {
            state: {
                ...this.state,
                projectiles: this.state.projectiles.map(p => ({
                    x: p.x,
                    y: p.y,
                    targetRow: p.targetRow,
                    speed: p.speed,
                    damage: p.damage,
                    type: p.type,
                    slowEffect: p.slowEffect,
                    slowDuration: p.slowDuration
                })),
                suns: this.state.suns.map(s => ({
                    x: s.x,
                    y: s.y,
                    targetY: s.targetY,
                    amount: s.amount,
                    fadeTimer: s.fadeTimer,
                    rising: s.rising
                }))
            },
            plants: this.plantManager.serialize(),
            zombies: this.zombieManager.serialize(),
            savedAt: Date.now()
        };
        
        Storage.saveGameState(saveData);
    }

    loadGameState() {
        const saved = Storage.loadGameState();
        if (!saved) return false;
        
        try {
            this.plantManager = new PlantManager();
            this.plantManager.deserialize(saved.plants);
            
            this.zombieManager = new ZombieManager(saved.state.difficulty);
            this.zombieManager.deserialize(saved.zombies);
            
            this.state = saved.state;
            this.state.phase = 'playing';
            this.state.isPaused = false;
            
            const stats = Storage.getStats();
            UI.updateHighestWave(stats.highestWave);
            UI.updateStats(this.state);
            UI.updatePlantCards(this.state.sun);
            UI.clearSelectedPlant();
            UI.hideAllOverlays();
            UI.showScreen('game');
            
            UI.updateWaveStatus(`第 ${this.state.currentWave} 波进行中`);
            
            this.lastTime = performance.now();
            this.gameLoop();
            
            return true;
        } catch (e) {
            console.error('Failed to load game state:', e);
            return false;
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, CONFIG.CANVAS.WIDTH, CONFIG.CANVAS.HEIGHT);
        
        UI.drawBackground(this.ctx);
        
        if (this.state.selectedPlant && this.state.hoverCol >= 0 && this.state.hoverRow >= 0) {
            const canPlace = this.plantManager.canPlant(this.state.hoverCol, this.state.hoverRow);
            UI.drawPlacementPreview(this.ctx, this.state.hoverCol, this.state.hoverRow, this.state.selectedPlant, canPlace);
        }
        
        this.plantManager.draw(this.ctx);
        UI.drawProjectiles(this.ctx, this.state.projectiles);
        this.zombieManager.draw(this.ctx);
        UI.drawSuns(this.ctx, this.state.suns);
    }

    gameLoop(currentTime = performance.now()) {
        if (this.state.phase !== 'playing' || this.state.isPaused) {
            return;
        }
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.draw();
        
        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init();
    window.game = game;
});
