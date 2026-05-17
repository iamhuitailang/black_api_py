class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = new Renderer(canvas);
        this.state = 'loading';
        this.subState = null;
        
        this.players = [];
        this.currentLevel = 1;
        this.level = null;
        this.mode = 'single';
        this.difficulty = 'normal';
        this.selectedCharacter = 'qiqi';
        
        this.score = 0;
        this.killCount = 0;
        this.levelTime = 0;
        this.totalTime = 0;
        this.lastTime = 0;
        this.deltaTime = 0;
        
        this.cameraX = 0;
        this.autosaveTimer = 0;
        
        this.lastKillCount = 0;
    }

    init() {
        Audio.init();
        this.loadingProgress = 0;
        this.autoRestoreState();
        this.startLoading();
    }

    autoRestoreState() {
        const savedState = Storage.loadGameState();
        if (savedState) {
            this.mode = savedState.mode || 'single';
            this.difficulty = savedState.difficulty || 'normal';
            this.currentLevel = savedState.currentLevel || 1;
            this.score = savedState.score || 0;
            this.killCount = savedState.killCount || 0;
            this.totalTime = savedState.totalTime || 0;
            this.selectedCharacter = savedState.selectedCharacter || 'qiqi';
            
            this.savedPlayers = savedState.players || [];
            this.hasSavedGame = true;
        }
    }

    startLoading() {
        const loadInterval = setInterval(() => {
            this.loadingProgress += 0.05;
            if (this.loadingProgress >= 1) {
                this.loadingProgress = 1;
                clearInterval(loadInterval);
                setTimeout(() => {
                    this.state = 'menu';
                    UI.showScreen('menu');
                    UI.updateContinueButton();
                    UI.hideHUD();
                    Audio.startMusic();
                }, 300);
            }
        }, 50);
    }

    startNewGame() {
        Audio.playStart();
        this.score = 0;
        this.killCount = 0;
        this.totalTime = 0;
        this.currentLevel = 1;
        this.createPlayers();
        this.loadLevel(this.currentLevel);
        this.state = 'playing';
        this.subState = null;
        UI.hideAllScreens();
        UI.showHUD();
    }

    continueGame() {
        const savedState = Storage.loadGameState();
        if (savedState) {
            this.mode = savedState.mode || 'single';
            this.difficulty = savedState.difficulty || 'normal';
            this.currentLevel = savedState.currentLevel || 1;
            this.score = savedState.score || 0;
            this.killCount = savedState.killCount || 0;
            this.totalTime = savedState.totalTime || 0;
            this.selectedCharacter = savedState.selectedCharacter || 'qiqi';
            
            this.createPlayers();
            if (savedState.players) {
                savedState.players.forEach((p, i) => {
                    if (this.players[i]) {
                        this.players[i].health = p.health;
                        this.players[i].lives = p.lives;
                        this.players[i].flowerCount = p.flowerCount || 0;
                        this.players[i].starCount = p.starCount || 0;
                    }
                });
            }
            
            this.loadLevel(this.currentLevel);
            this.state = 'playing';
            this.subState = null;
            UI.hideAllScreens();
            UI.showHUD();
            Audio.playStart();
        } else {
            this.startNewGame();
        }
    }

    createPlayers() {
        this.players = [];
        const player1 = new Player(100, 300, this.selectedCharacter, 1);
        this.players.push(player1);
        
        if (this.mode === 'coop') {
            const secondChar = this.selectedCharacter === 'qiqi' ? 'didi' : 'qiqi';
            const player2 = new Player(150, 300, secondChar, 2);
            this.players.push(player2);
        }
    }

    loadLevel(levelId) {
        this.level = createLevel(levelId);
        if (!this.level) {
            this.victory();
            return;
        }
        
        this.level.init(this.players, this.difficulty);
        this.levelTime = 0;
        this.lastKillCount = this.killCount;
        this.cameraX = 0;
        this.renderer.cameraX = 0;
        this.renderer.startTransition('fade', 500);
    }

    update(timestamp) {
        if (this.lastTime === 0) {
            this.lastTime = timestamp;
        }
        
        this.deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        const dt = Math.min(this.deltaTime, 50);

        switch (this.state) {
            case 'loading':
                this.renderer.drawLoadingScreen(this.loadingProgress);
                break;
                
            case 'menu':
            case 'character_select':
            case 'level_select':
                break;
                
            case 'playing':
                this.updateGame(dt);
                break;
                
            case 'paused':
                this.updateGame(0);
                this.renderer.drawPauseOverlay();
                break;
                
            case 'gameover':
                this.updateGame(0);
                this.renderer.drawGameOverScreen(this);
                break;
                
            case 'level_complete':
                this.updateGame(0);
                this.renderer.drawLevelCompleteScreen(this);
                break;
                
            case 'victory':
                this.updateGame(0);
                this.renderer.drawVictoryScreen(this);
                break;
        }

        Input.update();
    }

    updateGame(dt) {
        if (dt > 0 && this.state === 'playing') {
            this.levelTime += dt / 1000;
            this.totalTime += dt / 1000;
            
            this.level.update(dt);
            this.updateCamera();
            this.checkCollisions();
            this.checkGoal();
            this.checkGameOver();
            this.autosave(dt);
        }

        this.renderer.clear();
        
        if (this.level) {
            this.renderer.drawLevel(this.level);
        }

        if (this.state === 'playing' || this.state === 'paused') {
            UI.updateHUD(this);
            
            if (this.level && this.level.isBossLevel && this.level.boss) {
                this.renderer.drawBossHealthBar(this.level.boss);
            }
        }

        if (this.renderer.transitionType) {
            const midTransition = this.renderer.updateTransition();
            if (midTransition && this.pendingLevel) {
                this.completeLevelTransition();
            }
        }
    }

    updateCamera() {
        const activePlayer = this.players.find(p => p.active) || this.players[0];
        if (activePlayer) {
            this.renderer.setCamera(activePlayer.x + activePlayer.width / 2, 0, this.level.width);
        }
    }

    checkCollisions() {
        for (const enemy of this.level.enemies) {
            if (enemy.isDead && !enemy.counted) {
                enemy.counted = true;
                this.killCount++;
                this.score += enemy.score;
                this.renderer.triggerShake(3, 150);
            }
        }
    }

    checkGoal() {
        for (const player of this.players) {
            if (player.active && this.level.checkGoal(player)) {
                this.levelComplete();
                break;
            }
        }
    }

    checkGameOver() {
        const allDead = this.players.every(p => !p.active);
        if (allDead) {
            this.gameOver();
        }
    }

    levelComplete() {
        if (this.subState === 'level_complete') return;
        
        this.subState = 'level_complete';
        Audio.playLevelComplete();
        
        const timeBonus = Math.max(0, (300 - this.levelTime) * 10);
        const killBonus = (this.killCount - this.lastKillCount) * 50;
        this.score += timeBonus + killBonus + CONFIG.SCORE.LEVEL_COMPLETE;
        
        const rank = Utils.calculateRank(this.score, this.levelTime, this.killCount - this.lastKillCount);
        Storage.completeLevel(this.currentLevel, this.score, this.levelTime, rank);
        Storage.updateHighScore(this.score);
        Storage.clearGameState();
        
        this.state = 'level_complete';
        UI.showLevelComplete(this);
    }

    nextLevel() {
        this.currentLevel++;
        if (this.currentLevel > LEVELS.length) {
            this.victory();
        } else {
            this.pendingLevel = this.currentLevel;
            this.renderer.startTransition('fade', 500);
            UI.hideAllScreens();
            this.state = 'playing';
            this.subState = null;
        }
    }

    completeLevelTransition() {
        this.players.forEach((player, index) => {
            const spawn = this.level.spawnPoints[index] || this.level.spawnPoints[0];
            player.x = spawn.x;
            player.y = spawn.y;
            player.vx = 0;
            player.vy = 0;
            player.isInvincible = true;
            player.invincibleTimer = 2000;
            player.heldItem = null;
            player.isHolding = false;
        });
        
        this.loadLevel(this.pendingLevel);
        this.pendingLevel = null;
    }

    gameOver() {
        if (this.state === 'gameover') return;
        
        this.state = 'gameover';
        Audio.playGameOver();
        Audio.stopMusic();
        
        Storage.updateHighScore(this.score);
        Storage.clearGameState();
        
        UI.updateHighScore();
        UI.showGameOver(this);
    }

    victory() {
        this.state = 'victory';
        Audio.playLevelComplete();
        Audio.stopMusic();
        
        Storage.updateHighScore(this.score);
        Storage.clearGameState();
        
        UI.updateHighScore();
    }

    pause() {
        if (this.state !== 'playing') return;
        this.state = 'paused';
        UI.showPauseMenu();
    }

    resume() {
        if (this.state !== 'paused') return;
        this.state = 'playing';
        UI.hideAllScreens();
    }

    restart() {
        Storage.clearGameState();
        this.score = 0;
        this.killCount = 0;
        this.levelTime = 0;
        this.totalTime = 0;
        this.currentLevel = 1;
        this.createPlayers();
        this.loadLevel(this.currentLevel);
        this.state = 'playing';
        this.subState = null;
        UI.hideAllScreens();
        UI.showHUD();
    }

    restartLevel() {
        this.players.forEach(player => {
            player.health = CONFIG.PLAYER.MAX_HEALTH;
            if (player.lives <= 0) player.lives = 1;
            player.active = true;
            player.heldItem = null;
            player.isHolding = false;
        });
        this.loadLevel(this.currentLevel);
        this.state = 'playing';
        this.subState = null;
        UI.hideAllScreens();
        UI.showHUD();
    }

    quitToMenu() {
        Storage.clearGameState();
        this.state = 'menu';
        this.level = null;
        this.players = [];
        UI.showScreen('menu');
        UI.updateHighScore();
        UI.updateContinueButton();
        UI.hideHUD();
        Audio.startMusic();
    }

    autosave(dt) {
        this.autosaveTimer += dt;
        if (this.autosaveTimer >= CONFIG.AUTOSAVE_INTERVAL) {
            this.autosaveTimer = 0;
            this.saveGame();
        }
    }

    saveGame() {
        const gameState = {
            mode: this.mode,
            difficulty: this.difficulty,
            currentLevel: this.currentLevel,
            score: this.score,
            killCount: this.killCount,
            totalTime: this.totalTime,
            selectedCharacter: this.selectedCharacter,
            players: this.players.map(p => ({
                health: p.health,
                lives: p.lives,
                flowerCount: p.flowerCount,
                starCount: p.starCount
            }))
        };
        Storage.saveGameState(gameState);
    }

    handleKeyPress(key) {
        switch (this.state) {
            case 'playing':
                if (key === 'PAUSE') {
                    this.pause();
                } else if (key === 'RESTART') {
                    this.restartLevel();
                }
                break;
                
            case 'paused':
                if (key === 'PAUSE') {
                    this.resume();
                } else if (key === 'RESTART') {
                    this.restartLevel();
                }
                break;
                
            case 'gameover':
                if (key === 'PAUSE') {
                    this.restart();
                }
                break;
                
            case 'level_complete':
                if (key === 'PAUSE') {
                    this.nextLevel();
                }
                break;
                
            case 'victory':
                if (key === 'PAUSE') {
                    this.quitToMenu();
                }
                break;
        }
    }

    handleGlobalInput() {
        if (Input.wasPressed('PAUSE')) {
            this.handleKeyPress('PAUSE');
        }
        if (Input.wasPressed('RESTART')) {
            this.handleKeyPress('RESTART');
        }
    }

    gameLoop(timestamp) {
        if (this.state === 'playing' || this.state === 'paused') {
            this.handleGlobalInput();
        }
        
        this.update(timestamp);
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    start() {
        this.init();
        requestAnimationFrame((t) => this.gameLoop(t));
    }
}
