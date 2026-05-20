const Game = {
    state: GAME_STATE.MENU,
    currentLevel: 1,
    score: 0,
    totalScore: 0,
    elapsedTime: 0,
    missCount: 0,
    chargeLevel: 0,
    isCharging: false,
    
    player: null,
    level: null,
    currentSwingIndex: 0,
    
    lastTime: 0,
    animationId: null,
    
    init() {
        LevelSystem.init();
        Effects.init();
        Input.init();
    },
    
    startNewGame() {
        this.currentLevel = 1;
        this.totalScore = 0;
        this.loadLevel(this.currentLevel);
        this.state = GAME_STATE.PLAYING;
        UI.showMenu('playing');
        this.startGameLoop();
    },
    
    continueGame() {
        const saveData = Storage.load();
        if (saveData) {
            this.currentLevel = saveData.currentLevel || 1;
            this.totalScore = saveData.totalScore || 0;
            this.loadLevel(this.currentLevel);
            
            if (saveData.player && saveData.level) {
                this.player = saveData.player;
                this.level = saveData.level;
                this.score = saveData.score || 0;
                this.elapsedTime = saveData.elapsedTime || 0;
                this.missCount = saveData.missCount || 0;
                this.currentSwingIndex = saveData.currentSwingIndex || 0;
            }
            
            this.state = GAME_STATE.PLAYING;
            UI.showMenu('playing');
            this.startGameLoop();
        }
    },
    
    loadLevel(levelId) {
        this.level = JSON.parse(JSON.stringify(LevelSystem.getLevel(levelId)));
        this.score = 0;
        this.elapsedTime = 0;
        this.missCount = 0;
        this.chargeLevel = 0;
        this.isCharging = false;
        this.currentSwingIndex = 0;
        
        const startSwing = this.level.swings[0];
        const startPos = Physics.calculateSwingPosition(startSwing);
        
        this.player = {
            x: startPos.x,
            y: startPos.y,
            vx: 0,
            vy: 0,
            state: PLAYER_STATE.SWINGING,
            hoverTime: CONFIG.AIR.HOVER_DURATION,
            onSwing: 0
        };
        
        Effects.generateBackgroundClouds(this.level.width);
    },
    
    startGameLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.lastTime = performance.now();
        this.gameLoop();
    },
    
    gameLoop() {
        const currentTime = performance.now();
        const dt = Math.min((currentTime - this.lastTime) / 16.67, 2);
        this.lastTime = currentTime;
        
        if (this.state === GAME_STATE.PLAYING) {
            this.update(dt);
            this.saveState();
        }
        
        Renderer.render(this);
        UI.updateHUD(this);
        
        Input.update();
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    },
    
    update(dt) {
        this.elapsedTime += dt / 60;
        
        if (this.elapsedTime > CONFIG.FAIL.TIME_LIMIT) {
            this.gameOver('超时未抵达终点');
            return;
        }
        
        if (Input.isPausePressed()) {
            this.pause();
            return;
        }
        
        LevelSystem.updateObstacles(this.level.obstacles, dt);
        Effects.update();
        
        this.level.swings.forEach(swing => {
            if (swing.id !== this.player.onSwing) {
                Physics.updateSwing(swing, dt);
            }
        });
        
        this.level.obstacles.forEach(obs => {
            if (obs.type === OBSTACLE_TYPE.WIND) {
                Effects.createWindParticles(obs);
            }
        });
        
        switch (this.player.state) {
            case PLAYER_STATE.SWINGING:
                this.updateSwinging(dt);
                break;
            case PLAYER_STATE.CHARGING:
                this.updateCharging(dt);
                break;
            case PLAYER_STATE.AIRBORNE:
                this.updateAirborne(dt);
                break;
        }
        
        if (this.player.state === PLAYER_STATE.AIRBORNE) {
            Effects.createTrail(this.player.x, this.player.y, 'rgba(255, 215, 0, 0.4)');
        }
        
        this.checkCollisions();
        this.checkVictory();
    },
    
    updateSwinging(dt) {
        const swing = this.level.swings[this.player.onSwing];
        
        const direction = Input.getSwingDirection();
        if (direction !== 0) {
            Physics.applySwingInput(swing, direction);
        }
        
        Physics.updateSwing(swing, dt);
        
        const pos = Physics.calculateSwingPosition(swing);
        this.player.x = pos.x;
        this.player.y = pos.y;
        
        if (Input.isSpacePressed()) {
            this.player.state = PLAYER_STATE.CHARGING;
            this.chargeLevel = 0;
            this.isCharging = true;
        }
    },
    
    updateCharging(dt) {
        if (this.isCharging) {
            this.chargeLevel = Math.min(this.chargeLevel + CONFIG.CHARGE.CHARGE_RATE * dt, CONFIG.CHARGE.MAX_CHARGE);
        }
        
        const swing = this.level.swings[this.player.onSwing];
        Physics.updateSwing(swing, dt);
        const pos = Physics.calculateSwingPosition(swing);
        this.player.x = pos.x;
        this.player.y = pos.y;
        
        if (!Input.isSpace() && this.chargeLevel >= CONFIG.CHARGE.MIN_RELEASE) {
            this.releasePlayer();
        }
    },
    
    releasePlayer() {
        const swing = this.level.swings[this.player.onSwing];
        const velocity = Physics.calculateReleaseVelocity(swing, this.chargeLevel);
        
        this.player.vx = velocity.x;
        this.player.vy = velocity.y;
        this.player.state = PLAYER_STATE.AIRBORNE;
        this.player.onSwing = -1;
        this.player.hoverTime = CONFIG.AIR.HOVER_DURATION;
        this.isCharging = false;
        this.chargeLevel = 0;
    },
    
    updateAirborne(dt) {
        const airInput = Input.getAirInput();
        Physics.updateAirborne(this.player, airInput, dt);
        
        if (this.player.y > this.level.height + 100 || 
            this.player.x < -100 || 
            this.player.x > this.level.width + 100) {
            this.handleMiss('掉出赛道范围');
        }
    },
    
    checkCollisions() {
        if (this.player.state !== PLAYER_STATE.AIRBORNE) return;
        
        for (let i = 0; i < this.level.swings.length; i++) {
            const swing = this.level.swings[i];
            if (swing.id === this.player.onSwing) continue;
            
            const result = Physics.checkSwingCatch(this.player, swing);
            if (result.caught) {
                this.catchSwing(swing, i, result.perfect);
                return;
            }
        }
        
        for (const obs of this.level.obstacles) {
            if (Physics.checkObstacleCollision(this.player, obs)) {
                this.handleObstacleCollision(obs);
            }
        }
    },
    
    catchSwing(swing, index, isPerfect) {
        this.player.onSwing = swing.id;
        this.player.state = PLAYER_STATE.SWINGING;
        this.currentSwingIndex = index;
        
        const pos = Physics.calculateSwingPosition(swing);
        this.player.x = pos.x;
        this.player.y = pos.y;
        
        if (isPerfect) {
            this.score += CONFIG.SCORE.PERFECT_CATCH;
            Effects.createPerfectCatchEffect(pos.x, pos.y);
        } else {
            this.score += CONFIG.SCORE.NORMAL_CATCH;
            Effects.createNormalCatchEffect(pos.x, pos.y);
        }
        
        swing.angularVelocity = this.player.vx / swing.ropeLength * 0.5;
        this.player.vx = 0;
        this.player.vy = 0;
    },
    
    handleObstacleCollision(obs) {
        switch (obs.type) {
            case OBSTACLE_TYPE.CLOUD:
                Physics.applyCloudEffect(this.player);
                break;
            case OBSTACLE_TYPE.ROPE:
                this.gameOver('撞击到致命障碍物');
                break;
            case OBSTACLE_TYPE.WIND:
                Physics.applyWindEffect(this.player, obs);
                break;
        }
    },
    
    handleMiss(reason) {
        this.missCount++;
        
        if (this.missCount >= CONFIG.FAIL.MAX_MISSES) {
            this.gameOver(`连续${CONFIG.FAIL.MAX_MISSES}次错失接力点位`);
        } else {
            this.respawn();
        }
    },
    
    respawn() {
        const swing = this.level.swings[this.currentSwingIndex];
        const pos = Physics.calculateSwingPosition(swing);
        
        this.player.x = pos.x;
        this.player.y = pos.y;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.state = PLAYER_STATE.SWINGING;
        this.player.onSwing = swing.id;
        this.player.hoverTime = CONFIG.AIR.HOVER_DURATION;
    },
    
    checkVictory() {
        const endSwing = this.level.swings[this.level.swings.length - 1];
        if (this.player.onSwing === endSwing.id) {
            this.victory();
        }
    },
    
    victory() {
        this.state = GAME_STATE.VICTORY;
        cancelAnimationFrame(this.animationId);
        
        const timeBonus = Math.max(0, (CONFIG.FAIL.TIME_LIMIT - this.elapsedTime) * CONFIG.SCORE.TIME_BONUS_PER_SECOND);
        this.score += CONFIG.SCORE.LEVEL_CLEAR + Math.floor(timeBonus);
        this.totalScore += this.score;
        
        let rating = 'S';
        if (this.elapsedTime > 60) rating = 'A';
        if (this.elapsedTime > 90) rating = 'B';
        if (this.elapsedTime > 120) rating = 'C';
        
        Storage.clear();
        UI.showVictory(this.score, this.elapsedTime, rating);
    },
    
    gameOver(reason) {
        this.state = GAME_STATE.GAMEOVER;
        cancelAnimationFrame(this.animationId);
        this.totalScore += this.score;
        Storage.clear();
        UI.showGameOver(reason, this.score, this.elapsedTime);
    },
    
    pause() {
        if (this.state === GAME_STATE.PLAYING) {
            this.state = GAME_STATE.PAUSED;
            UI.showMenu('pause');
        }
    },
    
    resume() {
        if (this.state === GAME_STATE.PAUSED) {
            this.state = GAME_STATE.PLAYING;
            UI.showMenu('playing');
            this.lastTime = performance.now();
        }
    },
    
    restartLevel() {
        this.loadLevel(this.currentLevel);
        this.state = GAME_STATE.PLAYING;
        UI.showMenu('playing');
        this.lastTime = performance.now();
    },
    
    nextLevel() {
        const nextLevelId = this.currentLevel + 1;
        if (nextLevelId <= LevelSystem.getTotalLevels()) {
            this.currentLevel = nextLevelId;
            this.loadLevel(this.currentLevel);
            this.state = GAME_STATE.PLAYING;
            UI.showMenu('playing');
            this.startGameLoop();
        } else {
            this.quitToMenu();
        }
    },
    
    quitToMenu() {
        cancelAnimationFrame(this.animationId);
        this.state = GAME_STATE.MENU;
        Storage.clear();
        UI.showMenu('start');
    },
    
    saveState() {
        const saveData = {
            currentLevel: this.currentLevel,
            totalScore: this.totalScore,
            score: this.score,
            elapsedTime: this.elapsedTime,
            missCount: this.missCount,
            currentSwingIndex: this.currentSwingIndex,
            player: this.player,
            level: this.level,
            timestamp: Date.now()
        };
        Storage.save(saveData);
    }
};
