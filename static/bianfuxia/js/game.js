const Game = {
    canvas: null,
    player: null,
    currentLevel: 0,
    score: 0,
    isPlaying: false,
    isPaused: false,
    unlockedLevels: [true, false, false, false],
    enemiesDefeated: 0,
    lastSaveTime: 0,
    animationId: null,
    
    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.resizeCanvas();
        
        window.addEventListener('resize', () => this.resizeCanvas());
        
        InputManager.init();
        Renderer.init(this.canvas);
        UI.init();
        
        if (StorageManager.hasSave()) {
            setTimeout(() => {
                this.continueGame();
            }, 100);
        }
        
        this.gameLoop();
    },
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },
    
    startNewGame() {
        this.currentLevel = 0;
        this.score = 0;
        this.enemiesDefeated = 0;
        this.unlockedLevels = [true, false, false, false];
        CombatManager.resetCombo();
        this.loadLevel(this.currentLevel);
        this.isPlaying = true;
        this.isPaused = false;
        UI.showScreen('none');
    },
    
    continueGame() {
        const savedData = StorageManager.load();
        if (savedData) {
            this.currentLevel = savedData.currentLevel;
            this.score = savedData.score;
            this.unlockedLevels = savedData.unlockedLevels || [true, false, false, false];
            this.enemiesDefeated = savedData.enemiesDefeated || 0;
            
            this.loadLevel(this.currentLevel);
            
            if (savedData.playerX && savedData.playerY) {
                this.player.x = Math.max(50, Math.min(this.canvas.width - 50, savedData.playerX));
                this.player.y = Math.max(50, Math.min(this.canvas.height - 100, savedData.playerY));
            }
            this.player.health = savedData.playerHealth || CONFIG.PLAYER_MAX_HEALTH;
            this.player.vx = 0;
            this.player.vy = 0;
            this.player.grapple.active = false;
            
            CombatManager.combo = savedData.combo || 0;
            
            this.isPlaying = true;
            this.isPaused = false;
            UI.showScreen('none');
            UI.updateHealth(this.player.health, this.player.maxHealth);
            UI.updateLevel(this.currentLevel);
            UI.updateScore(this.score);
            UI.updateCombo(CombatManager.combo);
        }
    },
    
    loadLevel(levelIndex) {
        LevelManager.generateLevel(levelIndex);
        
        this.player = new Player(100, this.canvas.height - 100);
        
        const levelConfig = CONFIG.LEVELS[levelIndex];
        UI.updateLevel(levelIndex);
        UI.updateAbilities(levelConfig);
        UI.updateHealth(this.player.health, this.player.maxHealth);
        UI.updateScore(this.score);
        CombatManager.resetCombo();
    },
    
    togglePause() {
        if (!this.isPlaying) return;
        
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            UI.showScreen('pause');
        } else {
            UI.showScreen('none');
        }
    },
    
    gameOver() {
        this.isPlaying = false;
        UI.showGameOver(this.score);
        StorageManager.clear();
    },
    
    victory() {
        if (this.currentLevel < CONFIG.LEVELS.length - 1) {
            this.unlockedLevels[this.currentLevel + 1] = true;
            UI.showVictory(this.score);
        } else {
            this.score += 1000;
            UI.showVictory(this.score);
            document.getElementById('nextLevelBtn').textContent = '返回主菜单';
        }
        
        this.saveGame();
    },
    
    nextLevel() {
        if (this.currentLevel < CONFIG.LEVELS.length - 1) {
            this.currentLevel++;
            this.loadLevel(this.currentLevel);
            UI.showScreen('none');
        } else {
            UI.showScreen('start');
        }
    },
    
    onEnemyDefeated(enemy) {
        this.enemiesDefeated++;
        
        const baseScore = enemy.type === 'ELITE' ? 100 : enemy.type === 'GUNNER' ? 75 : 50;
        this.score += baseScore + CombatManager.getComboScore();
        UI.updateScore(this.score);
        
        const aliveEnemies = LevelManager.enemies.filter(e => e.health > 0).length;
        if (aliveEnemies === 0) {
            this.victory();
        }
    },
    
    createProjectile(fromX, fromY, toX, toY, damage) {
        const angle = Math.atan2(toY - fromY, toX - fromX);
        const speed = 8;
        
        LevelManager.projectiles.push({
            x: fromX,
            y: fromY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            damage: damage
        });
    },
    
    saveGame() {
        const gameState = {
            currentLevel: this.currentLevel,
            score: this.score,
            player: this.player,
            unlockedLevels: this.unlockedLevels,
            enemiesDefeated: this.enemiesDefeated,
            combat: CombatManager
        };
        StorageManager.save(gameState);
    },
    
    autoSave() {
        const now = Date.now();
        if (now - this.lastSaveTime > 30000) {
            this.saveGame();
            this.lastSaveTime = now;
        }
    },
    
    update() {
        if (!this.isPlaying || this.isPaused) return;
        
        this.player.update(LevelManager.platforms, LevelManager.enemies);
        
        if (isNaN(this.player.x) || isNaN(this.player.y) || 
            isNaN(this.player.vx) || isNaN(this.player.vy)) {
            this.player.x = 100;
            this.player.y = this.canvas.height - 150;
            this.player.vx = 0;
            this.player.vy = 0;
            this.player.grapple.active = false;
        }
        
        this.player.x = Math.max(50, Math.min(this.canvas.width - 50, this.player.x));
        this.player.y = Math.max(-100, Math.min(this.canvas.height + 50, this.player.y));
        
        if (Math.abs(this.player.vx) > 30 || Math.abs(this.player.vy) > 30) {
            this.player.vx *= 0.5;
            this.player.vy *= 0.5;
        }
        
        for (const enemy of LevelManager.enemies) {
            enemy.update(this.player, LevelManager.platforms);
        }
        
        LevelManager.update();
        CombatManager.update();
        
        UI.updateHealth(this.player.health, this.player.maxHealth);
        
        this.autoSave();
        
        InputManager.update();
    },
    
    gameLoop() {
        this.update();
        
        if (this.isPlaying) {
            Renderer.render();
        }
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
};