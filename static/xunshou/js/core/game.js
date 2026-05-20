class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.state = 'menu';
        this.score = 0;
        this.currentLevel = 1;
        this.levelProgress = 0;
        this.scrollX = 0;
        this.gameSpeed = 3;
        
        this.player = null;
        this.obstacles = [];
        this.fireHoops = [];
        this.particles = [];
        
        this.lastTime = 0;
        this.animationId = null;
        this.saveInterval = null;
        
        this.spawnTimer = 0;
        this.hoopTimer = 0;
        
        this.init();
    }
    
    init() {
        Renderer.init(this.canvas);
        Input.init(this.canvas);
        UIManager.init();
        
        Input.onPause = () => this.togglePause();
        
        UIManager.onStartGame = (charId, levelId) => this.startGame(charId, levelId);
        UIManager.onPause = () => this.togglePause();
        UIManager.onResume = () => this.resume();
        UIManager.onRestart = () => this.restart();
        UIManager.onQuit = () => this.quitToMenu();
        UIManager.onNextLevel = () => this.nextLevel();
        
        const savedState = Storage.loadGameState();
        if (savedState && savedState.state === 'playing') {
            if (confirm('检测到未完成的游戏，是否继续？')) {
                this.loadGameState(savedState);
            }
        }
        
        this.gameLoop = this.gameLoop.bind(this);
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
        
        this.saveInterval = setInterval(() => this.saveGameState(), 5000);
        
        window.addEventListener('beforeunload', () => {
            if (this.state === 'playing') {
                this.saveGameState();
            }
        });
    }
    
    startGame(characterId, levelId) {
        this.currentLevel = levelId;
        this.player = new Player(characterId, Renderer.height);
        this.score = 0;
        this.levelProgress = 0;
        this.scrollX = 0;
        this.obstacles = [];
        this.fireHoops = [];
        this.particles = [];
        this.spawnTimer = 0;
        this.hoopTimer = 0;
        
        const level = LEVELS[levelId];
        this.gameSpeed = level.speed;
        
        this.state = 'playing';
        Input.reset();
        
        UIManager.showHUD();
        UIManager.updateScore(0);
        UIManager.updateHealth(this.player.health, this.player.maxHealth);
        UIManager.updateLevel(levelId);
        UIManager.updateProgress(0, level.length);
    }
    
    gameLoop(currentTime) {
        const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;
        
        if (this.state === 'playing') {
            this.update(dt);
        }
        
        this.render();
        
        this.animationId = requestAnimationFrame(this.gameLoop);
    }
    
    update(dt) {
        const level = LEVELS[this.currentLevel];
        
        this.player.update(dt, Input, Renderer.width, Renderer.height);
        
        this.levelProgress += this.gameSpeed * 60 * dt;
        this.scrollX += this.gameSpeed * 60 * dt;
        
        this.spawnTimer += dt;
        if (this.spawnTimer > 1 / level.obstacleFrequency / 60) {
            if (this.canSpawnObstacle(level.minObstacleGap || 200)) {
                this.spawnObstacle();
            }
            this.spawnTimer = 0;
        }
        
        this.hoopTimer += dt;
        if (this.hoopTimer > 1 / level.fireHoopFrequency / 60) {
            if (this.canSpawnHoop(level.minObstacleGap || 200)) {
                this.spawnFireHoop();
            }
            this.hoopTimer = 0;
        }
        
        this.obstacles.forEach(obstacle => {
            obstacle.update(dt, this.gameSpeed);
        });
        
        this.fireHoops.forEach(hoop => {
            hoop.update(dt, this.gameSpeed);
        });
        
        this.obstacles = this.obstacles.filter(o => !o.isOffScreen());
        this.fireHoops = this.fireHoops.filter(h => !h.isOffScreen());
        
        this.checkCollisions();
        
        this.updateParticles(dt);
        
        UIManager.updateProgress(this.levelProgress, level.length);
        
        if (this.levelProgress >= level.length) {
            this.completeLevel();
        }
    }
    
    canSpawnObstacle(minGap) {
        const spawnX = Renderer.width + 100;
        
        for (const obstacle of this.obstacles) {
            if (spawnX - obstacle.x < minGap) {
                return false;
            }
        }
        
        for (const hoop of this.fireHoops) {
            if (spawnX - hoop.x < minGap / 2) {
                return false;
            }
        }
        
        return true;
    }
    
    canSpawnHoop(minGap) {
        const spawnX = Renderer.width + 100;
        
        for (const hoop of this.fireHoops) {
            if (spawnX - hoop.x < minGap * 1.5) {
                return false;
            }
        }
        
        return true;
    }
    
    spawnObstacle() {
        const types = ['log', 'log', 'log', 'log', 'spike', 'fireball'];
        const type = Helpers.randomChoice(types);
        const x = Renderer.width + 100;
        const obstacle = new Obstacle(type, x, Renderer.height);
        this.obstacles.push(obstacle);
    }
    
    spawnFireHoop() {
        const x = Renderer.width + 100;
        const isMoving = Math.random() < 0.2;
        const hoop = new FireHoop(x, Renderer.height, isMoving);
        this.fireHoops.push(hoop);
    }
    
    checkCollisions() {
        const playerHitbox = this.player.getHitbox();
        
        for (const obstacle of this.obstacles) {
            const obstacleHitbox = obstacle.getHitbox();
            if (Helpers.rectIntersect(playerHitbox, obstacleHitbox)) {
                this.handleObstacleHit(obstacle);
            }
        }
        
        for (const hoop of this.fireHoops) {
            if (hoop.checkPassed(this.player)) {
                this.handleHoopPassed(hoop);
            }
        }
    }
    
    handleObstacleHit(obstacle) {
        const isDead = this.player.takeDamage(obstacle.damage);
        
        this.createHitParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
        
        UIManager.updateHealth(Math.max(0, this.player.health), this.player.maxHealth);
        
        if (isDead) {
            this.gameOver();
        }
    }
    
    handleHoopPassed(hoop) {
        const baseScore = 100;
        const earnedScore = Math.floor(baseScore * this.player.scoreMultiplier);
        this.score += earnedScore;
        
        UIManager.updateScore(this.score);
        
        this.createScoreParticles(hoop.x + hoop.width / 2, hoop.y + hoop.height / 2, earnedScore);
    }
    
    createHitParticles(x, y) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: Helpers.random(-5, 5),
                vy: Helpers.random(-5, 5),
                size: Helpers.random(3, 8),
                color: '#FF6B6B',
                alpha: 1,
                life: 0.5
            });
        }
    }
    
    createScoreParticles(x, y, score) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: Helpers.random(-3, 3),
                vy: Helpers.random(-8, -2),
                size: Helpers.random(2, 5),
                color: '#FFD700',
                alpha: 1,
                life: 0.8
            });
        }
    }
    
    updateParticles(dt) {
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 10 * dt;
            p.life -= dt;
            p.alpha = Math.max(0, p.life * 2);
        });
        
        this.particles = this.particles.filter(p => p.life > 0);
    }
    
    render() {
        Renderer.clear();
        
        if (this.state === 'playing' || this.state === 'paused') {
            const level = LEVELS[this.currentLevel];
            
            Renderer.drawBackground(level, this.scrollX);
            Renderer.drawGround(level, this.scrollX);
            
            const finishX = level.length - this.scrollX + 100;
            if (finishX < Renderer.width + 200) {
                Renderer.drawFinishLine(finishX, level.length);
            }
            
            this.obstacles.forEach(obstacle => {
                obstacle.draw(this.ctx, Renderer);
            });
            
            this.fireHoops.forEach(hoop => {
                hoop.draw(this.ctx, Renderer);
            });
            
            this.player.draw(this.ctx, Renderer);
            
            Renderer.drawParticles(this.particles);
        }
    }
    
    togglePause() {
        if (this.state === 'playing') {
            this.pause();
        } else if (this.state === 'paused') {
            this.resume();
        }
    }
    
    pause() {
        this.state = 'paused';
        UIManager.showPauseMenu();
    }
    
    resume() {
        this.state = 'playing';
        UIManager.hidePauseMenu();
        Input.reset();
    }
    
    restart() {
        this.startGame(this.player.character, this.currentLevel);
    }
    
    quitToMenu() {
        this.state = 'menu';
        this.player = null;
        this.obstacles = [];
        this.fireHoops = [];
        this.particles = [];
        Storage.clearGameState();
        UIManager.showMenu();
    }
    
    gameOver() {
        this.state = 'gameOver';
        
        const isNewRecord = Storage.setHighScore(this.score);
        Storage.setLevelScore(this.currentLevel, this.score);
        Storage.clearGameState();
        
        UIManager.showGameOver(this.score, isNewRecord, '生命值耗尽了！');
    }
    
    completeLevel() {
        this.state = 'levelComplete';
        
        Storage.setHighScore(this.score);
        Storage.setLevelScore(this.currentLevel, this.score);
        
        if (this.currentLevel < LEVEL_LIST.length) {
            Storage.unlockLevel(this.currentLevel + 1);
        }
        
        Storage.clearGameState();
        
        UIManager.showLevelComplete(this.currentLevel, this.score);
    }
    
    nextLevel() {
        if (this.currentLevel < LEVEL_LIST.length) {
            this.startGame(this.player.character, this.currentLevel + 1);
        }
    }
    
    saveGameState() {
        if (this.state !== 'playing') return;
        
        const state = {
            state: this.state,
            score: this.score,
            currentLevel: this.currentLevel,
            levelProgress: this.levelProgress,
            scrollX: this.scrollX,
            gameSpeed: this.gameSpeed,
            player: {
                character: this.player.character,
                x: this.player.x,
                y: this.player.y,
                health: this.player.health,
                velocityX: this.player.velocityX,
                velocityY: this.player.velocityY,
                isGrounded: this.player.isGrounded,
                isJumping: this.player.isJumping,
                isDucking: this.player.isDucking,
                hasDoubleJumped: this.player.hasDoubleJumped,
                invincible: this.player.invincible,
                invincibleTimer: this.player.invincibleTimer
            },
            obstacles: this.obstacles.map(o => ({
                type: o.type,
                x: o.x,
                y: o.y,
                phase: o.phase
            })),
            fireHoops: this.fireHoops.map(h => ({
                x: h.x,
                y: h.y,
                passed: h.passed,
                phase: h.phase,
                isMoving: h.isMoving
            })),
            timestamp: Date.now()
        };
        
        Storage.saveGameState(state);
    }
    
    loadGameState(state) {
        if (!state || state.state !== 'playing') return;
        
        this.currentLevel = state.currentLevel;
        this.score = state.score;
        this.levelProgress = state.levelProgress;
        this.scrollX = state.scrollX;
        this.gameSpeed = state.gameSpeed;
        
        this.player = new Player(state.player.character, Renderer.height);
        this.player.x = state.player.x;
        this.player.y = state.player.y;
        this.player.health = state.player.health;
        this.player.velocityX = state.player.velocityX;
        this.player.velocityY = state.player.velocityY;
        this.player.isGrounded = state.player.isGrounded;
        this.player.isJumping = state.player.isJumping;
        this.player.isDucking = state.player.isDucking;
        this.player.hasDoubleJumped = state.player.hasDoubleJumped;
        this.player.invincible = state.player.invincible;
        this.player.invincibleTimer = state.player.invincibleTimer;
        
        this.obstacles = state.obstacles.map(o => {
            const obstacle = new Obstacle(o.type, o.x, Renderer.height);
            obstacle.y = o.y;
            obstacle.phase = o.phase;
            return obstacle;
        });
        
        this.fireHoops = state.fireHoops.map(h => {
            const hoop = new FireHoop(h.x, Renderer.height, h.isMoving);
            hoop.y = h.y;
            hoop.passed = h.passed;
            hoop.phase = h.phase;
            return hoop;
        });
        
        this.particles = [];
        this.state = 'playing';
        
        const level = LEVELS[this.currentLevel];
        UIManager.showHUD();
        UIManager.updateScore(this.score);
        UIManager.updateHealth(this.player.health, this.player.maxHealth);
        UIManager.updateLevel(this.currentLevel);
        UIManager.updateProgress(this.levelProgress, level.length);
    }
}
