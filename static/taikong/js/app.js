class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.setupCanvas();
        this.setupEventListeners();
        
        this.gameState = GAME_STATE.MENU;
        this.score = 0;
        this.level = 1;
        this.lives = CONFIG.PLAYER.INITIAL_LIVES;
        this.highScore = storageManager.getHighScore();
        this.lastExtraLifeScore = 0;
        this.lastShootTime = 0;
        this.lastAutoSave = 0;
        
        this.stars = Utils.generateStars(this.canvas);
        this.player = new Player(this.canvas);
        this.invaders = new InvaderManager(this.canvas, this.level);
        this.bunkers = new BunkerManager(this.canvas);
        this.ufo = new UFO(this.canvas);
        this.playerBullets = new BulletManager();
        this.invaderBullets = new BulletManager();
        
        this.pauseKeyPressed = false;
        this.restartKeyPressed = false;
        
        this.updateUI();
        this.checkSavedGame();
        
        this.gameLoop = this.gameLoop.bind(this);
        this.gameLoop();
    }

    setupCanvas() {
        this.canvas.width = CONFIG.CANVAS.WIDTH;
        this.canvas.height = CONFIG.CANVAS.HEIGHT;
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.handleResize());
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('continueBtn').addEventListener('click', () => this.resumeGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('quitBtn').addEventListener('click', () => this.quitGame());
        document.getElementById('playAgainBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('backToMenuBtn').addEventListener('click', () => this.quitGame());
        document.getElementById('nextLevelBtn').addEventListener('click', () => this.nextLevel());
    }

    handleResize() {
    }

    checkSavedGame() {
        const resumeBtn = document.getElementById('resumeBtn');
        const startBtn = document.getElementById('startBtn');
        
        if (storageManager.hasSavedGame()) {
            resumeBtn.style.display = 'block';
            resumeBtn.addEventListener('click', () => this.loadGame());
            
            const savedData = storageManager.loadGame();
            if (savedData && savedData.score > 0) {
                startBtn.textContent = '重新开始';
            }
        } else {
            resumeBtn.style.display = 'none';
        }
    }

    startGame() {
        this.resetGame();
        this.gameState = GAME_STATE.PLAYING;
        this.hideAllOverlays();
    }

    resumeGame() {
        this.gameState = GAME_STATE.PLAYING;
        this.hideAllOverlays();
    }

    pauseGame() {
        if (this.gameState === GAME_STATE.PLAYING) {
            this.gameState = GAME_STATE.PAUSED;
            document.getElementById('pauseScreen').classList.add('active');
            this.saveGame();
        }
    }

    restartGame() {
        this.resetGame();
        this.gameState = GAME_STATE.PLAYING;
        this.hideAllOverlays();
    }

    quitGame() {
        this.gameState = GAME_STATE.MENU;
        this.hideAllOverlays();
        document.getElementById('startScreen').classList.add('active');
        storageManager.clearSave();
        this.checkSavedGame();
    }

    gameOver() {
        this.gameState = GAME_STATE.GAME_OVER;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalLevel').textContent = this.level;
        document.getElementById('gameOverScreen').classList.add('active');
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            storageManager.setHighScore(this.highScore);
            this.updateUI();
        }
        
        storageManager.clearSave();
    }

    levelComplete() {
        this.gameState = GAME_STATE.LEVEL_UP;
        document.getElementById('nextLevel').textContent = this.level + 1;
        document.getElementById('levelScore').textContent = this.score;
        
        const bonusPoints = this.level * 100;
        this.score += bonusPoints;
        document.getElementById('levelBonus').textContent = bonusPoints;
        
        document.getElementById('levelUpScreen').classList.add('active');
    }

    nextLevel() {
        this.level++;
        this.invaders = new InvaderManager(this.canvas, this.level);
        this.player.reset();
        this.playerBullets.clear();
        this.invaderBullets.clear();
        
        const lifeBonus = Math.floor(this.level / 3);
        if (lifeBonus > 0 && this.lives < CONFIG.PLAYER.MAX_LIVES) {
            this.lives = Math.min(CONFIG.PLAYER.MAX_LIVES, this.lives + 1);
        }
        
        this.bunkers.reset();
        
        this.gameState = GAME_STATE.PLAYING;
        this.hideAllOverlays();
        this.updateUI();
    }

    resetGame() {
        this.score = 0;
        this.level = 1;
        this.lives = CONFIG.PLAYER.INITIAL_LIVES;
        this.lastExtraLifeScore = 0;
        
        this.player = new Player(this.canvas);
        this.invaders = new InvaderManager(this.canvas, this.level);
        this.bunkers.reset();
        this.ufo = new UFO(this.canvas);
        this.playerBullets.clear();
        this.invaderBullets.clear();
        
        this.updateUI();
    }

    hideAllOverlays() {
        document.querySelectorAll('.overlay').forEach(overlay => {
            overlay.classList.remove('active');
        });
    }

    loadGame() {
        const savedData = storageManager.loadGame();
        if (savedData) {
            this.score = savedData.score || 0;
            this.level = savedData.level || 1;
            this.lives = savedData.lives || CONFIG.PLAYER.INITIAL_LIVES;
            this.lastExtraLifeScore = savedData.lastExtraLifeScore || 0;
            
            if (savedData.player) {
                this.player.x = savedData.player.x;
                this.player.y = savedData.player.y;
            }
            
            if (savedData.invaders) {
                const restoredInvaders = storageManager.deserializeInvaders(savedData.invaders, this.canvas);
                if (restoredInvaders) {
                    this.invaders = restoredInvaders;
                }
            }
            
            if (savedData.bunkers) {
                const restoredBunkers = storageManager.deserializeBunkers(savedData.bunkers, this.canvas);
                if (restoredBunkers) {
                    this.bunkers = restoredBunkers;
                }
            }
            
            if (savedData.ufo) {
                const restoredUfo = storageManager.deserializeUFO(savedData.ufo, this.canvas);
                if (restoredUfo) {
                    this.ufo = restoredUfo;
                }
            }
            
            if (savedData.playerBullets) {
                const restoredPBullets = storageManager.deserializeBullets(savedData.playerBullets);
                if (restoredPBullets) {
                    this.playerBullets = restoredPBullets;
                }
            }
            
            if (savedData.invaderBullets) {
                const restoredIBullets = storageManager.deserializeBullets(savedData.invaderBullets);
                if (restoredIBullets) {
                    this.invaderBullets = restoredIBullets;
                }
            }
            
            this.gameState = GAME_STATE.PLAYING;
            this.hideAllOverlays();
            this.updateUI();
            this.lastAutoSave = Date.now();
        }
    }

    saveGame() {
        const gameState = {
            score: this.score,
            level: this.level,
            lives: this.lives,
            highScore: this.highScore,
            lastExtraLifeScore: this.lastExtraLifeScore,
            player: {
                x: this.player.x,
                y: this.player.y
            },
            invaders: this.invaders,
            bunkers: this.bunkers,
            ufo: this.ufo,
            playerBullets: this.playerBullets,
            invaderBullets: this.invaderBullets
        };
        storageManager.saveGame(gameState);
    }

    handleInput() {
        if (inputManager.isPause() && !this.pauseKeyPressed) {
            this.pauseKeyPressed = true;
            if (this.gameState === GAME_STATE.PLAYING) {
                this.pauseGame();
            } else if (this.gameState === GAME_STATE.PAUSED) {
                this.resumeGame();
            }
        }
        if (!inputManager.isPause()) {
            this.pauseKeyPressed = false;
        }

        if (inputManager.isRestart() && !this.restartKeyPressed) {
            this.restartKeyPressed = true;
            if (this.gameState === GAME_STATE.PLAYING || this.gameState === GAME_STATE.PAUSED) {
                this.restartGame();
            }
        }
        if (!inputManager.isRestart()) {
            this.restartKeyPressed = false;
        }

        if (this.gameState === GAME_STATE.PLAYING) {
            const now = Date.now();
            if (inputManager.isShoot() && now - this.lastShootTime > 200) {
                this.lastShootTime = now;
                this.playerBullets.addBullet(
                    this.player.x + this.player.width / 2 - 2,
                    this.player.y,
                    CONFIG.PLAYER.BULLET_SPEED,
                    CONFIG.PLAYER.BULLET_COLOR,
                    true
                );
            }
        }
    }

    update() {
        if (this.gameState !== GAME_STATE.PLAYING) return;

        Utils.updateStars(this.stars);

        this.player.update();

        const newBullet = this.invaders.update();
        if (newBullet) {
            this.invaderBullets.addBullet(newBullet.x, newBullet.y, newBullet.speed, newBullet.color, false);
        }

        this.ufo.update();

        this.playerBullets.update(this.canvas);
        this.invaderBullets.update(this.canvas);

        this.checkCollisions();

        this.checkExtraLife();

        if (this.invaders.allDead()) {
            this.levelComplete();
        }

        if (this.invaders.hasReachedBottom()) {
            this.gameOver();
        }

        const now = Date.now();
        if (now - this.lastAutoSave > CONFIG.STORAGE.AUTO_SAVE_INTERVAL) {
            this.saveGame();
            this.lastAutoSave = now;
        }
    }

    checkCollisions() {
        for (let i = this.playerBullets.bullets.length - 1; i >= 0; i--) {
            const bullet = this.playerBullets.bullets[i];
            
            const hitInvader = this.invaders.checkCollision(bullet);
            if (hitInvader) {
                this.score += hitInvader.points;
                this.playerBullets.removeBullet(i);
                Utils.showScorePopup(hitInvader.points, hitInvader.x, hitInvader.y, this.canvas);
                this.updateUI();
                continue;
            }

            const ufoPoints = this.ufo.checkCollision(bullet);
            if (ufoPoints) {
                this.score += ufoPoints;
                this.playerBullets.removeBullet(i);
                Utils.showScorePopup(ufoPoints, this.ufo.x, this.ufo.y, this.canvas);
                this.updateUI();
                continue;
            }

            if (this.bunkers.checkCollision(bullet)) {
                this.playerBullets.removeBullet(i);
            }
        }

        for (let i = this.invaderBullets.bullets.length - 1; i >= 0; i--) {
            const bullet = this.invaderBullets.bullets[i];
            
            if (Utils.checkCollision(bullet, this.player.getRect())) {
                if (this.player.takeDamage()) {
                    this.lives--;
                    this.invaderBullets.removeBullet(i);
                    this.updateUI();
                    
                    if (this.lives <= 0) {
                        this.gameOver();
                    }
                }
                continue;
            }

            if (this.bunkers.checkCollision(bullet)) {
                this.invaderBullets.removeBullet(i);
            }
        }

        if (this.invaders.checkPlayerCollision(this.player.getRect())) {
            if (this.player.takeDamage()) {
                this.lives--;
                this.updateUI();
                if (this.lives <= 0) {
                    this.gameOver();
                }
            }
        }
    }

    checkExtraLife() {
        const extraLifeThreshold = Math.floor(this.score / CONFIG.GAME.EXTRA_LIFE_SCORE);
        const lastThreshold = Math.floor(this.lastExtraLifeScore / CONFIG.GAME.EXTRA_LIFE_SCORE);
        
        if (extraLifeThreshold > lastThreshold && this.lives < CONFIG.PLAYER.MAX_LIVES) {
            this.lives++;
            this.lastExtraLifeScore = this.score;
            this.updateUI();
        }
    }

    draw() {
        this.ctx.fillStyle = COLORS.BACKGROUND;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        Utils.drawStars(this.ctx, this.canvas, this.stars);

        this.bunkers.draw(this.ctx);

        this.ufo.draw(this.ctx);

        this.invaders.draw(this.ctx);

        this.player.draw(this.ctx);

        this.playerBullets.draw(this.ctx);
        this.invaderBullets.draw(this.ctx);
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lives').textContent = '❤️'.repeat(this.lives);
        document.getElementById('highScore').textContent = this.highScore;
    }

    gameLoop() {
        this.handleInput();
        this.update();
        this.draw();
        requestAnimationFrame(this.gameLoop);
    }
}

window.addEventListener('load', () => {
    new Game();
});
