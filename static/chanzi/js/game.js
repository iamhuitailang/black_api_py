const Game = {
    canvas: null,
    ctx: null,
    width: 800,
    height: 600,
    
    running: false,
    paused: false,
    gameOver: false,
    victory: false,
    
    currentLevel: 1,
    maxLevel: 5,
    score: 0,
    
    player: null,
    level: null,
    enemies: [],
    traps: [],
    collectibles: [],
    magicSystem: null,
    camera: null,
    particles: null,
    
    lastTime: 0,
    deltaTime: 0,
    animationId: null,
    
    autoSaveInterval: null,
    
    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        AudioSystem.init();
        Input.init();
        UI.init();
        Storage.init();
        
        this.particles = new ParticleSystem();
        this.magicSystem = new MagicSystem();
        
        UI.showStartScreen();
        
        window.addEventListener('resize', () => this.handleResize());
        this.handleResize();
        
        this.setupAutoSave();
    },
    
    handleResize() {
        const container = document.getElementById('game-container');
        const maxWidth = Math.min(window.innerWidth - 40, 800);
        const maxHeight = Math.min(window.innerHeight - 40, 600);
        
        const scaleX = maxWidth / 800;
        const scaleY = maxHeight / 600;
        const scale = Math.min(scaleX, scaleY, 1);
        
        this.canvas.style.width = (800 * scale) + 'px';
        this.canvas.style.height = (600 * scale) + 'px';
    },
    
    startGame() {
        AudioSystem.resume();
        UI.hideAllScreens();
        UI.showHUD();
        
        const hasSavedState = Storage.hasSavedProgress();
        let savedPlayerState = null;
        
        if (hasSavedState) {
            this.currentLevel = Storage.getCurrentLevel() || 1;
            this.score = Storage.getTotalScore() || 0;
            savedPlayerState = Storage.getPlayerState();
        } else {
            this.currentLevel = 1;
            this.score = 0;
        }
        
        this.loadLevel(this.currentLevel, true, savedPlayerState);
        
        this.running = true;
        this.paused = false;
        this.gameOver = false;
        this.victory = false;
        
        this.lastTime = performance.now();
        this.gameLoop();
    },
    
    loadLevel(levelNum, withTransition = false, savedPlayerState = null) {
        const startLevel = () => {
            this.level = loadLevel(levelNum);
            
            if (savedPlayerState) {
                this.player = new Player(savedPlayerState.x, savedPlayerState.y);
                this.player.restoreState(savedPlayerState);
            } else {
                const spawn = this.level.getPlayerSpawn();
                this.player = new Player(spawn.x, spawn.y);
            }
            
            const levelData = LevelData[levelNum];
            this.enemies = levelData.enemies.map(e => new Enemy(e.x, e.y, e.type));
            this.traps = levelData.traps.map(t => new Trap(t.x, t.y, t.type, t));
            this.collectibles = levelData.collectibles.map(c => new Collectible(c.x, c.y, c.type));
            
            this.camera = new Camera(this.width, this.height, this.level.width, this.level.height);
            this.camera.follow(this.player);
            
            this.magicSystem.clear();
            
            UI.updateLevel(levelNum, this.level.name);
            UI.updateScore(this.score);
            UI.updateHealth(this.player.health, this.player.maxHealth);
            UI.updateMana(this.player.mana, this.player.maxMana);
            
            this.gameOver = false;
            this.victory = false;
            this.paused = false;
        };
        
        if (withTransition) {
            UI.showLevelTransition(levelNum, startLevel);
        } else {
            startLevel();
        }
    },
    
    pauseGame() {
        if (!this.running || this.gameOver || this.victory) return;
        this.paused = true;
        UI.showPauseScreen();
    },
    
    resumeGame() {
        this.paused = false;
        UI.hidePauseScreen();
    },
    
    restartLevel() {
        Storage.clearProgress();
        UI.hideAllScreens();
        this.gameOver = false;
        this.victory = false;
        this.paused = false;
        this.loadLevel(this.currentLevel, true);
    },
    
    nextLevel() {
        if (this.currentLevel >= this.maxLevel) {
            this.quitToMenu();
            return;
        }
        
        this.currentLevel++;
        Storage.clearProgress();
        
        UI.hideAllScreens();
        this.gameOver = false;
        this.victory = false;
        this.loadLevel(this.currentLevel, true);
    },
    
    quitToMenu() {
        this.running = false;
        this.gameOver = false;
        this.victory = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        Storage.clearProgress();
        UI.hideHUD();
        UI.showStartScreen();
    },
    
    triggerGameOver() {
        this.gameOver = true;
        AudioSystem.playerDeath();
        UI.hideHUD();
        UI.showGameOverScreen(this.score);
        Storage.clearProgress();
    },
    
    triggerVictory() {
        this.victory = true;
        const healthBonus = Math.floor(this.player.health * 50);
        const manaBonus = Math.floor(this.player.mana);
        const totalBonus = healthBonus + manaBonus;
        this.score += totalBonus;
        
        AudioSystem.levelComplete();
        Storage.saveHighScore(this.currentLevel, this.score);
        
        UI.hideHUD();
        UI.showVictoryScreen(this.score, totalBonus);
        Storage.clearProgress();
    },
    
    gameLoop(currentTime = 0) {
        if (!this.running) return;
        
        this.deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;
        
        if (!this.paused && !this.gameOver && !this.victory && this.level && this.player) {
            this.update();
        } else {
            Input.update();
        }
        
        this.render();
        
        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    },
    
    update() {
        if (Input.pause()) {
            this.pauseGame();
            return;
        }
        
        this.player.update(this.level, this.enemies, this.traps, this.collectibles);
        
        this.enemies.forEach(enemy => {
            if (!enemy.dead) {
                enemy.update(this.player, this.level);
            }
        });
        
        this.traps.forEach(trap => {
            trap.update(this.player, this.level);
        });
        
        this.collectibles.forEach(item => {
            if (!item.collected) {
                item.update();
            }
        });
        
        if (Input.magicJustPressed() && this.player.mana >= 25) {
            const direction = this.player.facingRight ? 1 : -1;
            this.magicSystem.castSpell(this.player, direction);
        }
        
        this.magicSystem.update(this.player, this.enemies, this.level);
        
        this.camera.update();
        this.particles.update();
        
        this.checkVictory();
        
        UI.updateHealth(this.player.health, this.player.maxHealth);
        UI.updateMana(this.player.mana, this.player.maxMana);
        
        Input.update();
    },
    
    checkVictory() {
        const finish = this.level.getFinishPosition();
        const playerRect = {
            x: this.player.x,
            y: this.player.y,
            width: this.player.width,
            height: this.player.height
        };
        const finishRect = {
            x: finish.x,
            y: finish.y,
            width: 32,
            height: 32
        };
        
        if (Utils.rectCollision(playerRect, finishRect)) {
            this.triggerVictory();
        }
    },
    
    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        if (!this.level || !this.player) {
            this.ctx.fillStyle = '#0a0a1a';
            this.ctx.fillRect(0, 0, this.width, this.height);
            
            this.ctx.fillStyle = '#00ffff';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('加载中...', this.width / 2, this.height / 2);
            return;
        }
        
        this.ctx.save();
        this.camera.apply(this.ctx);
        
        this.level.draw(this.ctx, this.camera);
        
        this.collectibles.forEach(item => {
            if (!item.collected) {
                item.draw(this.ctx);
            }
        });
        
        this.traps.forEach(trap => {
            trap.draw(this.ctx);
        });
        
        this.enemies.forEach(enemy => {
            if (!enemy.dead) {
                enemy.draw(this.ctx);
            }
        });
        
        this.magicSystem.draw(this.ctx);
        
        this.player.draw(this.ctx, this.camera);
        this.player.drawAttack(this.ctx);
        
        this.particles.draw(this.ctx);
        
        this.ctx.restore();
        
        if (this.paused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
    },
    
    addScore(points) {
        this.score += points;
        UI.updateScore(this.score);
    },
    
    spawnMana(x, y) {
        this.collectibles.push(new Collectible(x, y, 'mana'));
    },
    
    spawnFire(x, y, right) {
        this.collectibles.push(new FireProjectile(x, y, right));
    },
    
    setupAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            if (this.running && !this.paused && !this.gameOver && !this.victory) {
                this.saveGameState();
            }
        }, 30000);
    },
    
    saveGameState() {
        if (!this.player || !this.level || this.gameOver || this.victory) return;
        
        const playerState = this.player.getState();
        const levelState = {
            levelNum: this.currentLevel
        };
        
        Storage.saveProgress(this.currentLevel, this.score, playerState, levelState);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});

window.addEventListener('beforeunload', () => {
    if (Game.running && !Game.gameOver && !Game.victory) {
        Game.saveGameState();
    }
});
