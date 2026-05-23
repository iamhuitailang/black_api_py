class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvasWidth = GameConfig.canvasWidth;
        this.canvasHeight = GameConfig.canvasHeight;
        
        this.state = GameConfig.gameStates.MENU;
        this.player = null;
        this.platforms = [];
        this.background = null;
        this.particles = null;
        this.ui = null;
        this.physics = null;
        this.input = null;
        this.storage = null;
        
        this.selectedDifficulty = 'normal';
        this.selectedTheme = 'sunny';
        
        this.survivalTime = 0;
        this.level = 1;
        this.targetSurviveTime = GameConfig.difficultyLevels.normal.surviveTime;
        this.brokenPlatforms = 0;
        this.lastPlatformSpawn = 0;
        this.spawnInterval = GameConfig.difficultyLevels.normal.spawnInterval;
        
        this.lastFrameTime = 0;
        this.gameStartTime = 0;
        this.animationId = null;
        
        this.saveInterval = 5000;
        this.lastSaveTime = 0;
        
        this.init();
    }
    
    init() {
        this.physics = new PhysicsEngine();
        this.input = new InputManager();
        this.storage = new StorageManager();
        this.particles = new ParticleSystem();
        this.ui = new UI(this.canvasWidth, this.canvasHeight);
        this.background = new Background(this.selectedTheme, this.canvasWidth, this.canvasHeight);
        
        this.setupInputHandlers();
        this.setupCanvasEvents();
        
        this.startMenu();
        this.gameLoop(performance.now());
    }
    
    setupInputHandlers() {
        this.input.onJump = () => this.handleJump(false);
        this.input.onChargeJump = () => this.handleJump(true);
        this.input.onPause = () => this.togglePause();
        this.input.onRestart = () => this.restartGame();
    }
    
    setupCanvasEvents() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
    }
    
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvasWidth / rect.width;
        const scaleY = this.canvasHeight / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        if (this.state === GameConfig.gameStates.MENU) {
            this.handleMenuClick(x, y);
        }
    }
    
    handleMenuClick(x, y) {
        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;
        
        const difficulties = ['easy', 'normal', 'hard'];
        difficulties.forEach((diff, index) => {
            const btnX = centerX - 200 + index * 140;
            const btnY = centerY - 90;
            if (x >= btnX && x <= btnX + 130 && y >= btnY && y <= btnY + 48) {
                this.selectedDifficulty = diff;
            }
        });
        
        const themes = ['sunny', 'sunset', 'dusk'];
        themes.forEach((theme, index) => {
            const btnX = centerX - 200 + index * 140;
            const btnY = centerY + 25;
            if (x >= btnX && x <= btnX + 130 && y >= btnY && y <= btnY + 48) {
                this.selectedTheme = theme;
                this.background.setTheme(theme);
            }
        });
        
        const hasSavedGame = this.storage.hasSavedGame();
        let buttonY = centerY + 110;
        
        if (hasSavedGame) {
            if (x >= centerX - 70 && x <= centerX + 70 && y >= buttonY && y <= buttonY + 40) {
                this.loadGame();
                return;
            }
            buttonY += 50;
        }
        
        if (x >= centerX - 70 && x <= centerX + 70 && y >= buttonY && y <= buttonY + 40) {
            this.startNewGame();
        }
    }
    
    startMenu() {
        this.state = GameConfig.gameStates.MENU;
        this.player = new Player(this.canvasWidth / 2 - 18, this.canvasHeight - 150);
        this.platforms = [];
        this.survivalTime = 0;
        this.level = 1;
        this.brokenPlatforms = 0;
    }
    
    startNewGame() {
        const difficulty = GameConfig.difficultyLevels[this.selectedDifficulty];
        this.targetSurviveTime = difficulty.surviveTime;
        this.spawnInterval = difficulty.spawnInterval;
        
        this.player = new Player(this.canvasWidth / 2 - 18, 100);
        this.platforms = [];
        this.survivalTime = 0;
        this.level = 1;
        this.brokenPlatforms = 0;
        this.gameStartTime = Date.now();
        this.lastPlatformSpawn = 0;
        
        this.generateInitialPlatforms();
        
        this.state = GameConfig.gameStates.PLAYING;
        this.storage.clearGameState();
        
        this.particles.clear();
    }
    
    generateInitialPlatforms() {
        const difficulty = GameConfig.difficultyLevels[this.selectedDifficulty];
        const types = difficulty.types;
        const count = difficulty.platformCount;
        
        for (let i = 0; i < count; i++) {
            const type = types[i % types.length];
            const x = Utils.random(50, this.canvasWidth - 150);
            const y = Utils.random(150, this.canvasHeight - 200);
            this.platforms.push(new Platform(type, x, y, this.canvasWidth));
        }
        
        const startPlatform = new Platform('iron', 
            this.canvasWidth / 2 - 60, 
            this.canvasHeight - 100, 
            this.canvasWidth);
        this.platforms.push(startPlatform);
    }
    
    spawnNewPlatform() {
        const difficulty = GameConfig.difficultyLevels[this.selectedDifficulty];
        const types = difficulty.types;
        const type = Utils.randomChoice(types);
        
        let x, y;
        let validPosition = false;
        let attempts = 0;
        
        while (!validPosition && attempts < 10) {
            x = Utils.random(50, this.canvasWidth - 150);
            y = Utils.random(100, this.canvasHeight - 200);
            
            validPosition = true;
            for (const platform of this.platforms) {
                if (!platform.isBroken) {
                    const distance = Utils.distance(x, y, platform.x, platform.y);
                    if (distance < 100) {
                        validPosition = false;
                        break;
                    }
                }
            }
            attempts++;
        }
        
        if (validPosition) {
            this.platforms.push(new Platform(type, x, y, this.canvasWidth));
        }
    }
    
    handleJump(isCharged) {
        if (this.state !== GameConfig.gameStates.PLAYING) return;
        
        const result = this.player.jump(isCharged);
        if (result) {
            this.particles.emitJumpParticles(
                this.player.x + this.player.width / 2, 
                this.player.y + this.player.height
            );
            
            if (result.isCharged) {
                this.particles.emitStarParticles(
                    this.player.x + this.player.width / 2, 
                    this.player.y
                );
            }
            
            this.player.lastJumpCharged = isCharged;
        }
    }
    
    togglePause() {
        if (this.state === GameConfig.gameStates.PLAYING) {
            this.state = GameConfig.gameStates.PAUSED;
        } else if (this.state === GameConfig.gameStates.PAUSED) {
            this.state = GameConfig.gameStates.PLAYING;
        }
    }
    
    restartGame() {
        if (this.state === GameConfig.gameStates.PAUSED || 
            this.state === GameConfig.gameStates.GAMEOVER ||
            this.state === GameConfig.gameStates.VICTORY) {
            this.startNewGame();
        }
    }
    
    returnToMenu() {
        this.startMenu();
    }
    
    update(deltaTime) {
        if (this.state !== GameConfig.gameStates.PLAYING) {
            this.background.update();
            return;
        }
        
        const now = Date.now();
        this.survivalTime = (now - this.gameStartTime) / 1000;
        
        if (now - this.lastPlatformSpawn > this.spawnInterval) {
            this.spawnNewPlatform();
            this.lastPlatformSpawn = now;
        }
        
        if (this.survivalTime >= this.targetSurviveTime) {
            this.levelUp();
        }
        
        this.player.update(this.input, this.canvasWidth, this.canvasHeight);
        
        this.physics.applyGravity(this.player);
        this.physics.updatePosition(this.player);
        this.physics.checkBoundaries(this.player, this.canvasWidth, this.canvasHeight);
        
        if (!this.player.isOnGround && this.player.velocityY > 0) {
            this.player.wasInAir = true;
        }
        
        this.player.isOnGround = false;
        this.platforms.forEach(platform => {
            platform.update();
            
            if (!platform.isBroken && this.physics.checkPlatformCollision(this.player, platform)) {
                this.physics.resolveCollision(this.player, platform);
                this.player.jumpCount = 0;
                
                if (this.player.wasInAir) {
                    const damage = this.player.lastJumpCharged ? 
                        platform.config.damageOnCharge : platform.config.damageOnNormal;
                    
                    if (platform.takeDamage(damage)) {
                        this.brokenPlatforms++;
                        this.particles.emitBreakParticles(
                            platform.x + platform.width / 2,
                            platform.y + platform.height / 2,
                            platform.config.color
                        );
                        this.player.currentPlatform = null;
                    }
                    
                    this.player.lastJumpCharged = false;
                    this.player.wasInAir = false;
                    
                    this.particles.emitLandParticles(
                        this.player.x + this.player.width / 2,
                        this.player.y + this.player.height
                    );
                }
            }
        });
        
        if (this.physics.isOutOfBounds(this.player, this.canvasWidth, this.canvasHeight)) {
            this.playerTakeDamage();
        }
        
        this.platforms = this.platforms.filter(p => !p.shouldRemove());
        
        if (this.input.isSpacePressed() && this.player.isOnGround) {
            const holdTime = this.input.getSpaceHoldTime();
            if (holdTime > 100 && holdTime % 100 < 20) {
                this.particles.emitChargeParticles(
                    this.player.x + this.player.width / 2,
                    this.player.y
                );
            }
        }
        
        this.particles.update();
        this.background.update();
        
        if (now - this.lastSaveTime > this.saveInterval) {
            this.saveGame();
            this.lastSaveTime = now;
        }
        
        if (!this.player.isAlive()) {
            this.gameOver();
        }
        
        const activePlatforms = this.platforms.filter(p => !p.isBroken);
        if (this.survivalTime > 10 && activePlatforms.length <= 1) {
            this.victory();
        }
    }
    
    playerTakeDamage() {
        if (this.player.takeDamage()) {
            const nearestPlatform = this.findNearestPlatform();
            if (nearestPlatform) {
                this.player.x = nearestPlatform.x + nearestPlatform.width / 2 - this.player.width / 2;
                this.player.y = nearestPlatform.y - this.player.height - 50;
                this.player.velocityY = 0;
                this.player.velocityX = 0;
            } else {
                this.player.x = this.canvasWidth / 2 - this.player.width / 2;
                this.player.y = 100;
                this.player.velocityY = 0;
                this.player.velocityX = 0;
            }
            
            this.particles.emitBreakParticles(
                this.player.x + this.player.width / 2,
                this.player.y + this.player.height,
                '#FF6B6B'
            );
        }
    }
    
    findNearestPlatform() {
        let nearest = null;
        let minDistance = Infinity;
        
        this.platforms.forEach(platform => {
            if (!platform.isBroken) {
                const distance = Utils.distance(
                    this.player.x, this.player.y,
                    platform.x, platform.y
                );
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = platform;
                }
            }
        });
        
        return nearest;
    }
    
    levelUp() {
        this.level++;
        this.targetSurviveTime += GameConfig.difficultyLevels[this.selectedDifficulty].surviveTime;
        this.spawnInterval = Math.max(2000, this.spawnInterval - 500);
        
        this.particles.emitStarParticles(
            this.player.x + this.player.width / 2,
            this.player.y
        );
    }
    
    gameOver() {
        this.state = GameConfig.gameStates.GAMEOVER;
        
        const record = this.storage.saveBestRecord({
            longestSurvival: this.survivalTime,
            highestLevel: this.level
        });
        
        this.endGameStats = {
            survivalTime: this.survivalTime,
            brokenPlatforms: this.brokenPlatforms,
            level: this.level,
            isNewRecord: this.survivalTime >= record.longestSurvival
        };
        
        this.storage.clearGameState();
    }
    
    victory() {
        this.state = GameConfig.gameStates.VICTORY;
        
        const record = this.storage.saveBestRecord({
            longestSurvival: this.survivalTime,
            highestLevel: this.level
        });
        
        this.endGameStats = {
            survivalTime: this.survivalTime,
            brokenPlatforms: this.brokenPlatforms,
            level: this.level,
            isNewRecord: this.survivalTime >= record.longestSurvival
        };
        
        this.storage.clearGameState();
    }
    
    saveGame() {
        if (this.state !== GameConfig.gameStates.PLAYING) return;
        
        const gameState = {
            player: this.player.toJSON(),
            platforms: this.platforms.map(p => p.toJSON()),
            survivalTime: this.survivalTime,
            level: this.level,
            targetSurviveTime: this.targetSurviveTime,
            brokenPlatforms: this.brokenPlatforms,
            selectedDifficulty: this.selectedDifficulty,
            selectedTheme: this.selectedTheme,
            gameStartTime: this.gameStartTime,
            spawnInterval: this.spawnInterval
        };
        
        this.storage.saveGameState(gameState);
    }
    
    loadGame() {
        const gameState = this.storage.loadGameState();
        if (!gameState) return;
        
        this.selectedDifficulty = gameState.selectedDifficulty || 'normal';
        this.selectedTheme = gameState.selectedTheme || 'sunny';
        this.background.setTheme(this.selectedTheme);
        
        this.player = new Player(gameState.player.x, gameState.player.y);
        this.player.fromJSON(gameState.player);
        
        this.platforms = gameState.platforms.map(pData => {
            const platform = new Platform(pData.type, pData.x, pData.y, this.canvasWidth);
            platform.fromJSON(pData);
            return platform;
        });
        
        this.survivalTime = gameState.survivalTime;
        this.level = gameState.level;
        this.targetSurviveTime = gameState.targetSurviveTime;
        this.brokenPlatforms = gameState.brokenPlatforms;
        this.gameStartTime = gameState.gameStartTime;
        this.spawnInterval = gameState.spawnInterval;
        this.lastPlatformSpawn = Date.now();
        this.lastSaveTime = Date.now();
        
        this.state = GameConfig.gameStates.PLAYING;
        this.particles.clear();
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        this.background.draw(this.ctx);
        
        if (this.state === GameConfig.gameStates.MENU) {
            this.ui.drawMenu(
                this.ctx, 
                this.selectedDifficulty, 
                this.selectedTheme,
                this.storage.hasSavedGame()
            );
            return;
        }
        
        this.platforms.forEach(platform => platform.draw(this.ctx));
        this.player.draw(this.ctx);
        this.particles.draw(this.ctx);
        
        this.ui.drawGameUI(this.ctx, this);
        
        if (this.state === GameConfig.gameStates.PAUSED) {
            this.ui.drawPauseOverlay(this.ctx);
        } else if (this.state === GameConfig.gameStates.GAMEOVER || 
                   this.state === GameConfig.gameStates.VICTORY) {
            this.ui.drawGameOverOverlay(
                this.ctx, 
                this.state === GameConfig.gameStates.VICTORY,
                this.endGameStats
            );
        }
    }
    
    gameLoop(currentTime) {
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        this.update(deltaTime);
        this.draw();
        
        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.saveGame();
    }
}

window.Game = Game;
