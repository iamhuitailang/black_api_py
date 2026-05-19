const Game = {
    canvas: null,
    ctx: null,
    state: 'menu',
    currentLevel: 1,
    totalLevels: 3,
    lives: 3,
    time: 0,
    lastTime: 0,
    animationId: null,
    saveInterval: null,
    
    player: null,
    level: null,
    particleSystem: null,
    starBackground: null,
    camera: { x: 0, y: 0 },
    
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        Input.init();
        UI.init();
        UI.showStart();
        
        this.particleSystem = new ParticleSystem();
        this.starBackground = new StarBackground(CONFIG.canvas.width, CONFIG.canvas.height);
        
        const savedGame = Storage.load();
        if (savedGame && savedGame.state === 'playing') {
            this.loadGame(savedGame);
        }
    },
    
    start() {
        this.currentLevel = 1;
        this.lives = CONFIG.player.initialLives;
        this.time = 0;
        this.startLevel(this.currentLevel);
        UI.showGameUI(true);
        UI.showScreen(null);
        this.state = 'playing';
        this.lastTime = performance.now();
        this.gameLoop();
        this.startAutoSave();
    },
    
    startLevel(levelNum) {
        this.level = new Level(levelNum);
        const startPos = this.level.getPlayerStart();
        this.player = new Player(startPos.x, startPos.y);
        this.player.reset();
        this.particleSystem.clear();
        UI.updateLevel(levelNum);
        UI.updateLives(this.lives);
        this.camera.x = 0;
        this.camera.y = 0;
    },
    
    pause() {
        if (this.state === 'playing') {
            this.state = 'paused';
            cancelAnimationFrame(this.animationId);
            UI.showPause();
            this.saveGame();
        }
    },
    
    resume() {
        if (this.state === 'paused') {
            this.state = 'playing';
            UI.hidePause();
            this.lastTime = performance.now();
            this.gameLoop();
        }
    },
    
    restart() {
        this.stopAutoSave();
        cancelAnimationFrame(this.animationId);
        Storage.clear();
        this.start();
    },
    
    exit() {
        this.stopAutoSave();
        cancelAnimationFrame(this.animationId);
        Storage.clear();
        this.state = 'menu';
        UI.showStart();
    },
    
    nextLevel() {
        this.currentLevel++;
        if (this.currentLevel > this.totalLevels) {
            this.victory();
        } else {
            this.startLevel(this.currentLevel);
            UI.showGameUI(true);
            UI.showScreen(null);
            this.state = 'playing';
            this.lastTime = performance.now();
            this.gameLoop();
        }
    },
    
    gameOver(reason) {
        this.lives--;
        UI.updateLives(this.lives);
        
        if (this.lives <= 0) {
            this.state = 'gameover';
            cancelAnimationFrame(this.animationId);
            this.stopAutoSave();
            Storage.clear();
            UI.showGameOver(reason + '\n所有生命已用完！');
        } else {
            this.particleSystem.emit(
                this.player.x + this.player.width / 2,
                this.player.y + this.player.height / 2,
                20,
                { color: '#ff6b6b', life: 1, size: 4 }
            );
            this.player.reset();
        }
    },
    
    levelComplete() {
        this.state = 'levelup';
        cancelAnimationFrame(this.animationId);
        
        this.particleSystem.emit(
            this.player.x + this.player.width / 2,
            this.player.y,
            30,
            { color: '#ffeaa7', life: 2, size: 5, vy: -5 }
        );
        
        if (this.currentLevel < this.totalLevels) {
            const nextLevelData = Levels[this.currentLevel + 1];
            UI.showLevelUp(this.currentLevel, nextLevelData.name);
        } else {
            this.victory();
        }
        
        this.saveGame();
    },
    
    victory() {
        this.state = 'victory';
        cancelAnimationFrame(this.animationId);
        this.stopAutoSave();
        Storage.clear();
        UI.showVictory();
    },
    
    gameLoop() {
        if (this.state !== 'playing') return;
        
        const currentTime = performance.now();
        const deltaTime = Math.min(currentTime - this.lastTime, 50);
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    },
    
    update(deltaTime) {
        this.time += deltaTime / 1000;
        UI.updateTime(this.time);
        
        if (Input.consumePause()) {
            this.pause();
            return;
        }
        
        this.level.update(deltaTime, this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
        this.player.update(deltaTime, this.level.platforms, this.level.getWidth(), this.level.getHeight());
        this.particleSystem.update(deltaTime);
        this.starBackground.update(this.time);
        
        for (const enemy of this.level.enemies) {
            if (this.player.checkEnemyCollision(enemy)) {
                this.gameOver('碰到了怪物！');
                return;
            }
        }
        
        for (const trap of this.level.traps) {
            if (this.player.checkTrapCollision(trap)) {
                this.gameOver('碰到了陷阱！');
                return;
            }
        }
        
        if (this.player.isFalling(this.level.getHeight())) {
            this.gameOver('掉入了虚空！');
            return;
        }
        
        if (this.player.checkGoal(this.level.getGoal())) {
            this.levelComplete();
            return;
        }
        
        this.updateCamera();
    },
    
    updateCamera() {
        const targetX = this.player.x + this.player.width / 2 - CONFIG.canvas.width / 2;
        const targetY = this.player.y + this.player.height / 2 - CONFIG.canvas.height / 2;
        
        this.camera.x += (targetX - this.camera.x) * 0.1;
        this.camera.y += (targetY - this.camera.y) * 0.1;
        
        this.camera.x = Math.max(0, Math.min(this.camera.x, this.level.getWidth() - CONFIG.canvas.width));
        this.camera.y = Math.max(0, Math.min(this.camera.y, this.level.getHeight() - CONFIG.canvas.height));
    },
    
    render() {
        const ctx = this.ctx;
        
        ctx.clearRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
        
        const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.canvas.height);
        gradient.addColorStop(0, '#0a0a1a');
        gradient.addColorStop(0.5, '#1a1a3a');
        gradient.addColorStop(1, '#2a1a4a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
        
        this.starBackground.render(ctx, this.time * 1000);
        
        ctx.save();
        ctx.translate(-this.camera.x, -this.camera.y);
        
        this.level.render(ctx, this.particleSystem);
        this.player.render(ctx, this.particleSystem);
        this.particleSystem.render(ctx);
        
        ctx.restore();
    },
    
    saveGame() {
        const data = {
            state: this.state,
            currentLevel: this.currentLevel,
            lives: this.lives,
            time: this.time,
            level: this.level.serialize(),
            player: {
                x: this.player.x,
                y: this.player.y,
                vx: this.player.vx,
                vy: this.player.vy,
                jumpsRemaining: this.player.jumpsRemaining,
                onGround: this.player.onGround,
                facingRight: this.player.facingRight,
                invincible: this.player.invincible,
                invincibleTimer: this.player.invincibleTimer
            },
            camera: this.camera
        };
        Storage.save(data);
    },
    
    loadGame(data) {
        this.state = data.state;
        this.currentLevel = data.currentLevel;
        this.lives = data.lives;
        this.time = data.time;
        
        this.level = Level.deserialize(data.level);
        const startPos = this.level.getPlayerStart();
        this.player = new Player(startPos.x, startPos.y);
        this.player.x = data.player.x;
        this.player.y = data.player.y;
        this.player.vx = data.player.vx;
        this.player.vy = data.player.vy;
        this.player.jumpsRemaining = data.player.jumpsRemaining;
        this.player.onGround = data.player.onGround;
        this.player.facingRight = data.player.facingRight;
        this.player.invincible = data.player.invincible;
        this.player.invincibleTimer = data.player.invincibleTimer;
        
        this.camera = data.camera || { x: 0, y: 0 };
        
        UI.updateLevel(this.currentLevel);
        UI.updateLives(this.lives);
        UI.updateTime(this.time);
        
        if (this.state === 'paused') {
            UI.showGameUI(true);
            UI.showPause();
        }
    },
    
    startAutoSave() {
        this.stopAutoSave();
        this.saveInterval = setInterval(() => {
            if (this.state === 'playing') {
                this.saveGame();
            }
        }, 5000);
    },
    
    stopAutoSave() {
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
            this.saveInterval = null;
        }
    }
};
