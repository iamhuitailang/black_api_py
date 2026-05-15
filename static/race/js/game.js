class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.canvas.width = GAME_CONSTANTS.CANVAS_WIDTH;
        this.canvas.height = GAME_CONSTANTS.CANVAS_HEIGHT;
        
        this.state = 'menu';
        this.difficulty = 'medium';
        
        this.track = null;
        this.player = null;
        this.aiBoats = [];
        this.particles = null;
        
        this.gameTime = 0;
        this.score = 0;
        this.startTime = 0;
        this.lastFrameTime = 0;
        
        this.keys = {
            left: false,
            right: false,
            space: false
        };
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a') this.keys.left = true;
            if (e.key === 'ArrowRight' || e.key === 'd') this.keys.right = true;
            if (e.key === ' ' && this.state === 'playing') {
                e.preventDefault();
                this.usePowerup();
            }
            if (e.key === 'Escape' && this.state === 'playing') {
                this.pause();
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a') this.keys.left = false;
            if (e.key === 'ArrowRight' || e.key === 'd') this.keys.right = false;
        });

        let touchStartX = 0;
        this.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touchX = e.touches[0].clientX;
            const diff = touchX - touchStartX;
            this.keys.left = diff < -20;
            this.keys.right = diff > 20;
        });

        this.canvas.addEventListener('touchend', () => {
            this.keys.left = false;
            this.keys.right = false;
        });
    }

    start(difficulty = 'medium') {
        this.difficulty = difficulty;
        this.state = 'playing';
        this.gameTime = 0;
        this.score = 0;
        this.startTime = Utils.now();
        
        this.track = new Track();
        this.player = new Boat(true);
        this.particles = new ParticleSystem();
        
        this.aiBoats = [];
        const aiColors = ['#4a90d9', '#9b59b6', '#2ecc71'];
        const aiDifficulties = ['easy', 'medium', 'hard'];
        
        aiDifficulties.forEach((diff, i) => {
            const ai = new AIBoat(diff, aiColors[i]);
            ai.y = GAME_CONSTANTS.CANVAS_HEIGHT - 250 - i * 80;
            ai.progress = (i + 1) * 200; // AI初始位置在玩家后面（数值更大）
            ai.x = GAME_CONSTANTS.TRACK_LEFT + 30 + i * 120;
            ai.targetLane = ai.x;
            this.aiBoats.push(ai);
        });
        
        this.updateHUD();
        this.gameLoop();
    }

    pause() {
        if (this.state === 'playing') {
            this.state = 'paused';
            this.saveGameState();
        }
    }

    resume() {
        if (this.state === 'paused') {
            this.state = 'playing';
            this.lastFrameTime = Utils.now();
            this.gameLoop();
        }
    }

    restart() {
        Storage.clearGameState();
        this.start(this.difficulty);
    }

    quit() {
        this.state = 'menu';
        Storage.clearGameState();
    }

    usePowerup() {
        if (this.state !== 'playing') return;
        
        const result = this.player.usePowerup();
        if (result) {
            this.score += result.score;
            this.particles.createPowerupCollect(
                this.player.x + this.player.width / 2,
                this.player.y + this.player.height / 2,
                result.type
            );
        }
    }

    gameLoop() {
        if (this.state !== 'playing') return;

        const now = Utils.now();
        const deltaTime = now - this.lastFrameTime;
        this.lastFrameTime = now;

        this.gameTime = now - this.startTime;

        this.update(deltaTime);
        this.render();
        this.updateHUD();

        if (this.checkFinish()) {
            this.finish();
            return;
        }

        requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        this.player.update(this.keys, this.track, deltaTime);
        
        const playerSpeed = this.player.getActualSpeed();
        this.track.playerProgress += playerSpeed;
        
        this.aiBoats.forEach(ai => {
            ai.update(this.keys, this.track, deltaTime, this.track.playerProgress);
        });
        
        const actualSpeed = this.player.getActualSpeed();
        if (actualSpeed > GAME_CONSTANTS.BASE_SPEED * 0.3) {
            const splashCount = Math.floor((actualSpeed - GAME_CONSTANTS.BASE_SPEED * 0.3) / 1) + 1;
            
            this.particles.createSplash(
                this.player.x + 10,
                this.player.y + this.player.height - 5,
                splashCount
            );
            this.particles.createSplash(
                this.player.x + this.player.width - 10,
                this.player.y + this.player.height - 5,
                splashCount
            );
            
            this.particles.createSpeedTrail(
                this.player.x + this.player.width / 2,
                this.player.y + this.player.height,
                actualSpeed
            );
        }
        
        this.particles.update();
        
        this.saveGameState();
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.track.render(this.ctx);
        
        this.aiBoats.forEach(ai => ai.render(this.ctx, this.track.playerProgress));
        
        this.player.render(this.ctx);
        
        this.particles.render(this.ctx);
    }

    checkFinish() {
        return this.track.playerProgress + this.player.y >= GAME_CONSTANTS.TRACK_LENGTH;
    }

    finish() {
        this.state = 'finished';
        
        const allBoats = [this.player, ...this.aiBoats];
        allBoats.sort((a, b) => b.worldY - a.worldY);
        const rank = allBoats.indexOf(this.player) + 1;
        
        const record = {
            time: this.gameTime,
            score: this.score,
            rank: rank,
            difficulty: this.difficulty,
            date: new Date().toLocaleDateString()
        };
        
        Storage.saveRecord(record);
        Storage.clearGameState();
        
        this.showFinishScreen(record);
    }

    showFinishScreen(record) {
        const finishMenu = document.getElementById('finish-menu');
        const finishTitle = document.getElementById('finish-title');
        
        if (record.rank === 1) {
            finishTitle.textContent = '🏆 第一名！';
        } else if (record.rank === 2) {
            finishTitle.textContent = '🥈 第二名';
        } else if (record.rank === 3) {
            finishTitle.textContent = '🥉 第三名';
        } else {
            finishTitle.textContent = `第 ${record.rank} 名`;
        }
        
        document.getElementById('finish-time').textContent = Utils.formatTime(record.time);
        document.getElementById('finish-rank').textContent = record.rank;
        document.getElementById('finish-score').textContent = record.score;
        
        finishMenu.classList.remove('hidden');
        document.getElementById('game-hud').classList.add('hidden');
    }

    updateHUD() {
        document.getElementById('hud-time').textContent = Utils.formatTime(this.gameTime);
        
        const progress = Math.min(100, ((this.track.playerProgress + this.player.y) / GAME_CONSTANTS.TRACK_LENGTH) * 100);
        document.getElementById('hud-progress').textContent = `${Math.floor(progress)}%`;
        
        document.getElementById('hud-score').textContent = this.score;
        document.getElementById('hud-speed').textContent = Math.floor(this.player.getActualSpeed() * 10);
        
        const powerupDisplay = this.player.getActivePowerupDisplay();
        const powerupSlot = document.getElementById('powerup-slot');
        
        if (powerupDisplay) {
            powerupSlot.classList.remove('hidden');
            document.getElementById('powerup-icon').textContent = powerupDisplay.icon;
            document.getElementById('powerup-timer').textContent = 
                powerupDisplay.timer !== null ? `${powerupDisplay.timer}s` : '按空格';
        } else {
            powerupSlot.classList.add('hidden');
        }
    }

    saveGameState() {
        const state = {
            difficulty: this.difficulty,
            gameTime: this.gameTime,
            score: this.score,
            playerX: this.player.x,
            playerSpeedBonus: this.player.currentSpeedBonus,
            playerSpeedRecoveryTime: this.player.speedRecoveryTime,
            playerHeldPowerup: this.player.heldPowerup,
            playerActivePowerups: this.player.activePowerups,
            trackPlayerProgress: this.track.playerProgress,
            obstacles: this.track.obstacles,
            powerups: this.track.powerups,
            aiBoats: this.aiBoats.map(ai => ({
                progress: ai.progress,
                x: ai.x,
                speedBonus: ai.currentSpeedBonus,
                speedRecoveryTime: ai.speedRecoveryTime,
                heldPowerup: ai.heldPowerup,
                activePowerups: ai.activePowerups
            })),
            savedAt: Utils.now()
        };
        
        Storage.saveGameState(state);
    }

    loadGameState(state) {
        if (!state) return false;
        
        try {
            this.difficulty = state.difficulty;
            this.gameTime = state.gameTime;
            this.score = state.score;
            this.startTime = Utils.now() - this.gameTime;
            
            this.track = new Track();
            this.track.playerProgress = state.trackPlayerProgress;
            this.track.obstacles = state.obstacles;
            this.track.powerups = state.powerups;
            
            this.player = new Boat(true);
            this.player.x = state.playerX;
            this.player.targetX = state.playerX;
            this.player.currentSpeedBonus = state.playerSpeedBonus || 0;
            this.player.speedRecoveryTime = state.playerSpeedRecoveryTime || 0;
            this.player.heldPowerup = state.playerHeldPowerup;
            this.player.activePowerups = state.playerActivePowerups || [];
            
            this.aiBoats = [];
            const aiColors = ['#4a90d9', '#9b59b6', '#2ecc71'];
            const aiDifficulties = ['easy', 'medium', 'hard'];
            
            state.aiBoats.forEach((aiState, i) => {
                const ai = new AIBoat(aiDifficulties[i], aiColors[i]);
                ai.progress = aiState.progress || 0;
                ai.x = aiState.x;
                ai.targetLane = aiState.x;
                ai.currentSpeedBonus = aiState.speedBonus || 0;
                ai.speedRecoveryTime = aiState.speedRecoveryTime || 0;
                ai.heldPowerup = aiState.heldPowerup;
                ai.activePowerups = aiState.activePowerups || [];
                ai.y = GAME_CONSTANTS.CANVAS_HEIGHT - 250 - i * 80;
                this.aiBoats.push(ai);
            });
            
            this.particles = new ParticleSystem();
            
            return true;
        } catch (e) {
            console.error('Failed to load game state:', e);
            return false;
        }
    }

    resumeFromSave(state) {
        if (this.loadGameState(state)) {
            this.state = 'playing';
            this.lastFrameTime = Utils.now();
            this.updateHUD();
            this.gameLoop();
            return true;
        }
        return false;
    }
}