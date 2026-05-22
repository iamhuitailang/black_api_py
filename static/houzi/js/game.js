class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.canvas.width = GameConfig.CANVAS.WIDTH;
        this.canvas.height = GameConfig.CANVAS.HEIGHT;
        
        this.state = GameConfig.GAME.STATE.START;
        this.isPaused = false;
        this.running = false;
        this.lastTime = 0;
        this.saveTimer = 0;
        
        this.player = null;
        this.ai = null;
        this.bananaManager = null;
        this.obstacleManager = null;
        this.effectManager = new EffectManager();
        this.skillManager = null;
        this.uiManager = null;
        
        this.timeLeft = GameConfig.GAME.GAME_DURATION;
        
        this.bindCanvasSize();
    }

    bindCanvasSize() {
        const resize = () => {
            const container = this.canvas.parentElement;
            const rect = container.getBoundingClientRect();
            
            const scale = Math.min(
                rect.width / GameConfig.CANVAS.WIDTH,
                rect.height / GameConfig.CANVAS.HEIGHT
            );
            
            this.canvas.style.width = (GameConfig.CANVAS.WIDTH * scale) + 'px';
            this.canvas.style.height = (GameConfig.CANVAS.HEIGHT * scale) + 'px';
        };
        
        window.addEventListener('resize', resize);
        resize();
    }

    init(character, savedState = null) {
        window.currentGame = this;
        
        if (savedState) {
            const savedCharacter = GameConfig.CHARACTERS.find(c => c.id === savedState.player.characterId);
            character = savedCharacter || character;
            
            this.player = Player.fromJSON(savedState.player, character);
            this.ai = AIPlayer.fromJSON(savedState.ai);
            this.timeLeft = savedState.timeLeft || GameConfig.GAME.GAME_DURATION;
        } else {
            this.player = new Player(character, 150, GameConfig.CANVAS.GROUND_Y - 30);
            this.ai = new AIPlayer(
                { id: 'enemy', emoji: '🙊', color: '#5A5A5A', stats: { speed: 1, jump: 1, hp: 1 } },
                GameConfig.CANVAS.WIDTH - 150,
                GameConfig.CANVAS.GROUND_Y - 30
            );
            this.timeLeft = GameConfig.GAME.GAME_DURATION;
        }
        
        this.lastTime = 0;
        this.bananaManager = new BananaManager();
        this.bananaManager.init(savedState ? savedState.bananas : []);
        
        this.obstacleManager = new ObstacleManager();
        this.obstacleManager.init(savedState ? savedState.obstacles : []);
        
        this.skillManager = new SkillManager(this.player);
        
        if (!this.uiManager) {
            this.uiManager = new UIManager();
            this.uiManager.init();
        }
        
        this.state = GameConfig.GAME.STATE.PLAYING;
        this.uiManager.show();
        
        this.saveGame();
    }

    update(deltaTime) {
        if (this.effectManager) {
            this.effectManager.update(deltaTime);
        }
        
        if (this.state !== GameConfig.GAME.STATE.PLAYING || this.isPaused) {
            return;
        }
        
        if (!this.player || !this.ai) {
            return;
        }
        
        this.timeLeft -= deltaTime;
        
        if (this.timeLeft <= 0) {
            this.endGame();
            return;
        }
        
        this.player.update(deltaTime);
        this.ai.update(deltaTime, this);
        
        this.skillManager.update(deltaTime);
        this.bananaManager.update(deltaTime);
        this.obstacleManager.update(deltaTime);
        
        const playerBananas = this.bananaManager.checkPickup(this.player);
        if (playerBananas > 0) {
            this.player.addBanana(playerBananas);
            this.effectManager.addBananaCollectEffect(this.player.x, this.player.y);
        }
        
        const aiBananas = this.bananaManager.checkPickup(this.ai);
        if (aiBananas > 0) {
            this.ai.addBanana(aiBananas);
            this.effectManager.addBananaCollectEffect(this.ai.x, this.ai.y);
        }
        
        if (this.player.character.skill === 'grab' && Input.wasPressed('space')) {
            if (this.skillManager.useQuickGrab()) {
                const grabbed = this.bananaManager.grabAll('player');
                this.player.addBanana(grabbed);
            }
        }
        
        const playerDamage = this.obstacleManager.checkCollision(this.player);
        if (playerDamage > 0) {
            if (this.player.takeDamage(playerDamage)) {
                this.effectManager.addDamageEffect(this.player.x, this.player.y);
            }
        }
        
        const aiDamage = this.obstacleManager.checkCollision(this.ai);
        if (aiDamage > 0) {
            if (this.ai.takeDamage(aiDamage)) {
                this.effectManager.addDamageEffect(this.ai.x, this.ai.y);
            }
        }
        
        if (this.player.isDead()) {
            this.endGame('lose');
            return;
        }
        
        if (this.ai.isDead()) {
            this.endGame('win');
            return;
        }
        
        if (this.player.bananaCount >= GameConfig.GAME.TARGET_BANANAS) {
            this.endGame('win');
            return;
        }
        
        if (this.ai.bananaCount >= GameConfig.GAME.TARGET_BANANAS) {
            this.endGame('lose');
            return;
        }
        
        this.uiManager.update(this);
        
        this.saveTimer += deltaTime;
        if (this.saveTimer >= 500) {
            this.saveTimer = 0;
            this.saveGame();
        }
    }

    draw() {
        const ctx = this.ctx;
        
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.effectManager) {
            this.effectManager.draw(ctx);
        }
        
        if (this.bananaManager) {
            this.bananaManager.draw(ctx);
        }
        
        if (this.obstacleManager) {
            this.obstacleManager.draw(ctx);
        }
        
        if (this.skillManager) {
            this.skillManager.draw(ctx);
        }
        
        if (this.player) {
            this.player.draw(ctx);
        }
        
        if (this.ai) {
            this.ai.draw(ctx);
        }
    }

    gameLoop(currentTime) {
        if (!this.running) return;
        
        if (this.lastTime === 0) {
            this.lastTime = currentTime;
        }
        
        const deltaTime = Math.min(currentTime - this.lastTime, 100);
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.draw();
        
        Input.clear();
        
        if (this.running) {
            requestAnimationFrame((time) => this.gameLoop(time));
        }
    }

    start() {
        this.running = true;
        this.lastTime = 0;
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    pause() {
        this.isPaused = true;
        if (this.uiManager) {
            this.uiManager.showPauseOverlay();
        }
    }

    resume() {
        this.isPaused = false;
        if (this.uiManager) {
            this.uiManager.hidePauseOverlay();
        }
        this.lastTime = 0;
    }

    togglePause() {
        if (this.isPaused) {
            this.resume();
        } else {
            this.pause();
        }
    }

    endGame(result = null) {
        this.state = GameConfig.GAME.STATE.GAME_OVER;
        
        if (!result) {
            if (this.player.bananaCount > this.ai.bananaCount) {
                result = 'win';
            } else if (this.player.bananaCount < this.ai.bananaCount) {
                result = 'lose';
            } else {
                result = 'draw';
            }
        }
        
        Storage.savePlayerScore(this.player.bananaCount, this.player.character.id);
        
        this.saveGame();
        
        if (this.uiManager) {
            this.uiManager.hide();
        }
        
        App.showGameOver(result, this);
    }

    saveGame() {
        if (!this.player || !this.ai) return;
        
        try {
            const gameState = {
                gameState: this.state,
                player: this.player.toJSON(),
                ai: this.ai.toJSON(),
                bananas: this.bananaManager ? this.bananaManager.toJSON() : [],
                obstacles: this.obstacleManager ? this.obstacleManager.toJSON() : [],
                timeLeft: this.timeLeft,
                lastSaved: Date.now()
            };
            
            const existingData = localStorage.getItem(GameConfig.STORAGE_KEY);
            let mergedData = gameState;
            if (existingData) {
                const parsed = JSON.parse(existingData);
                mergedData = { ...parsed, ...gameState };
            }
            localStorage.setItem(GameConfig.STORAGE_KEY, JSON.stringify(mergedData));
            console.log('Game saved:', gameState.gameState, 'timeLeft:', gameState.timeLeft);
        } catch (e) {
            console.error('保存游戏状态失败:', e);
        }
    }

    reset() {
        this.state = GameConfig.GAME.STATE.START;
        this.isPaused = false;
        this.player = null;
        this.ai = null;
        this.bananaManager = null;
        this.obstacleManager = null;
        this.skillManager = null;
        this.effectManager = new EffectManager();
        this.timeLeft = GameConfig.GAME.GAME_DURATION;
        this.saveTimer = 0;
        
        if (this.uiManager) {
            this.uiManager.hide();
        }
    }

    get bananas() {
        return this.bananaManager ? this.bananaManager.bananas : [];
    }

    get obstacles() {
        return this.obstacleManager ? this.obstacleManager.obstacles : [];
    }
}
