class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = 0;
        this.height = 0;
        
        this.state = CONSTANTS.GAME.STATES.MENU;
        this.mode = CONSTANTS.GAME.MODES.ENDLESS;
        
        this.score = 0;
        this.towerHeight = 0;
        this.bestScore = 0;
        this.timeRemaining = CONSTANTS.GAME.TIMED_DURATION;
        
        this.balloons = [];
        this.clown = null;
        this.obstacles = [];
        this.effects = new Effects();
        
        this.cameraY = 0;
        this.targetCameraY = 0;
        
        this.isPointerDown = false;
        this.pointerStartTime = 0;
        this.lastPointerX = 0;
        this.isDragging = false;
        
        this.lastSaveTime = 0;
        this.explodedBalloons = new Set();
        
        this.resize();
        this.init();
    }

    init() {
        this.resize();
        Physics.init(this.width, this.height);
        
        this.clown = new Clown(this.width / 2, this.height - 120);
        
        this.loadHighScore();
        
        this.setupEventListeners();
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
        
        this.canvas.width = this.width * window.devicePixelRatio;
        this.canvas.height = this.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        
        Physics.init(this.width, this.height);
        
        if (this.clown) {
            this.clown.x = this.width / 2;
            this.clown.y = this.height - 120;
        }
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resize());
    }

    bindGameEvents(container) {
        const isButtonClick = (e) => {
            if (!e.target) return false;
            if (e.target.tagName === 'BUTTON') return true;
            if (e.target.closest && e.target.closest('button')) return true;
            return false;
        };
        
        const handleStart = (e) => {
            if (isButtonClick(e)) return;
            this.onPointerDown(e);
        };
        
        const handleMove = (e) => {
            if (!this.isPointerDown) return;
            this.onPointerMove(e);
        };
        
        const handleEnd = (e) => {
            if (isButtonClick(e)) {
                if (this.isPointerDown) {
                    this.isPointerDown = false;
                    UI.hidePowerIndicator();
                }
                return;
            }
            this.onPointerUp(e);
        };
        
        document.addEventListener('mousedown', handleStart);
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
        
        document.addEventListener('touchstart', handleStart, { passive: false });
        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('touchend', handleEnd, { passive: false });
    }

    getEventPosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        let clientX, clientY;
        
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if (e.changedTouches && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    onPointerDown(e) {
        if (this.state !== CONSTANTS.GAME.STATES.PLAYING) return;
        
        if (e.target && e.target.tagName === 'BUTTON') return;
        
        const pos = this.getEventPosition(e);
        
        const targetAngle = this.calculateAngleFromPosition(pos.x);
        this.clown.setAngle(targetAngle);
        
        this.isPointerDown = true;
        this.pointerStartTime = Date.now();
        this.lastPointerX = pos.x;
        this.hasDragged = false;
        this.dragThreshold = 10;
        this.totalDrag = 0;
        this.hasLaunched = false;
        
        this.clown.startCharge();
        UI.showPowerIndicator();
    }

    onPointerMove(e) {
        if (this.state !== CONSTANTS.GAME.STATES.PLAYING || !this.isPointerDown) return;
        
        const pos = this.getEventPosition(e);
        
        const deltaX = pos.x - this.lastPointerX;
        this.totalDrag += Math.abs(deltaX);
        
        if (this.totalDrag > this.dragThreshold) {
            this.hasDragged = true;
            const angleDelta = -deltaX * CONSTANTS.LAUNCH.ANGLE_SPEED * 0.15;
            this.clown.adjustAngle(angleDelta);
        }
        
        this.lastPointerX = pos.x;
    }

    onPointerUp(e) {
        if (this.state !== CONSTANTS.GAME.STATES.PLAYING || !this.isPointerDown) return;
        
        if (e.target && e.target.tagName === 'BUTTON') {
            this.isPointerDown = false;
            UI.hidePowerIndicator();
            return;
        }
        
        this.isPointerDown = false;
        UI.hidePowerIndicator();
        
        if (!this.hasLaunched) {
            this.hasLaunched = true;
            const balloon = this.clown.launchBalloon();
            this.balloons.push(balloon);
            
            this.effects.spawnSparkles(balloon.x, balloon.y, 8, balloon.color);
        }
    }

    calculateAngleFromPosition(x) {
        const centerX = this.width / 2;
        const relativeX = x - centerX;
        const maxAngle = CONSTANTS.LAUNCH.ANGLE_MAX;
        const angle = (relativeX / (this.width / 2)) * maxAngle;
        return Utils.clamp(angle, -maxAngle, maxAngle);
    }

    startGame(mode = null) {
        if (mode) {
            this.mode = mode;
        }
        
        this.resetGame();
        
        if (this.mode === CONSTANTS.GAME.MODES.OBSTACLE) {
            this.obstacles = Obstacle.generateObstacles(this.width, this.height, 1);
        }
        
        this.state = CONSTANTS.GAME.STATES.PLAYING;
        UI.showGameUI(this.mode);
        
        this.loadHighScore();
    }

    resetGame() {
        this.score = 0;
        this.towerHeight = 0;
        this.timeRemaining = CONSTANTS.GAME.TIMED_DURATION;
        this.balloons = [];
        this.obstacles = [];
        this.cameraY = 0;
        this.targetCameraY = 0;
        this.explodedBalloons.clear();
        
        this.clown = new Clown(this.width / 2, this.height - 120);
        this.effects.clear();
    }

    pauseGame() {
        if (this.state === CONSTANTS.GAME.STATES.PLAYING) {
            this.state = CONSTANTS.GAME.STATES.PAUSED;
            UI.showPauseScreen();
            this.saveState();
        }
    }

    resumeGame() {
        if (this.state === CONSTANTS.GAME.STATES.PAUSED) {
            this.state = CONSTANTS.GAME.STATES.PLAYING;
            UI.hidePauseScreen();
        }
    }

    restartGame() {
        this.startGame(this.mode);
    }

    quitToMenu() {
        this.state = CONSTANTS.GAME.STATES.MENU;
        this.resetGame();
        UI.showStartScreen();
        Storage.clearGameState();
    }

    gameOver() {
        this.state = CONSTANTS.GAME.STATES.GAMEOVER;
        
        const isNewHighScore = Storage.saveHighScore(this.mode, this.score, this.towerHeight);
        this.loadHighScore();
        
        UI.showGameoverScreen(this.score, this.towerHeight, this.bestScore);
        
        Storage.clearGameState();
    }

    loadHighScore() {
        const highScore = Storage.getHighScore(this.mode);
        this.bestScore = highScore.score || 0;
    }

    update(dt = 1) {
        if (this.state !== CONSTANTS.GAME.STATES.PLAYING) return;
        
        if (this.mode === CONSTANTS.GAME.MODES.TIMED) {
            this.timeRemaining -= dt / 60;
            UI.updateTimer(this.timeRemaining);
            
            if (this.timeRemaining <= 0) {
                this.gameOver();
                return;
            }
        }
        
        this.clown.update(dt);
        
        if (this.clown.isCharging) {
            UI.updatePower(this.clown.getChargeProgress());
        }
        
        for (const obstacle of this.obstacles) {
            obstacle.update(dt);
        }
        
        Physics.updateAllBalloons(this.balloons, this.obstacles, dt);
        
        this.checkBombExplosions();
        
        if (this.isPointerDown) {
            const chargeProgress = this.clown.getChargeProgress();
            UI.updatePower(chargeProgress);
        }
        
        this.updateTowerStats();
        
        this.updateCamera(dt);
        
        this.effects.update(dt, this.width);
        
        if (Physics.checkTowerFall(this.balloons)) {
            this.gameOver();
            return;
        }
        
        this.autoSave();
    }

    checkBombExplosions() {
        for (const balloon of this.balloons) {
            if (balloon.type.special === 'explode' && balloon.isLanded && !this.explodedBalloons.has(balloon.id)) {
                this.explodedBalloons.add(balloon.id);
                
                Physics.handleExplosion(balloon, this.balloons);
                this.effects.spawnExplosion(balloon.x, balloon.y, 40);
                
                this.addScore(balloon.type.score, balloon.x, balloon.y);
                
                setTimeout(() => {
                    const index = this.balloons.indexOf(balloon);
                    if (index > -1) {
                        this.balloons.splice(index, 1);
                    }
                }, 500);
            }
        }
    }

    updateTowerStats() {
        const stats = Physics.calculateTowerStats(this.balloons);
        
        const newHeight = stats.height;
        if (newHeight > this.towerHeight + 10) {
            const diff = newHeight - this.towerHeight;
            const heightBonus = Math.floor(diff / 50) * 5;
            this.towerHeight = newHeight;
        }
        
        let landedCount = 0;
        for (const balloon of this.balloons) {
            if (balloon.isLanded && !balloon.scoreAdded) {
                balloon.scoreAdded = true;
                this.addScore(balloon.type.score, balloon.x, balloon.y);
                landedCount++;
            }
        }
        
        UI.updateScore(this.score, this.towerHeight, this.bestScore);
    }

    addScore(points, x, y) {
        this.score += points;
        
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
        }
        
        this.effects.spawnScorePopup(x, y - this.cameraY, points, this.cameraY);
    }

    updateCamera(dt) {
        const stats = Physics.calculateTowerStats(this.balloons);
        
        const minCameraHeight = this.height * 0.5;
        if (stats.height > minCameraHeight) {
            this.targetCameraY = -(stats.height - minCameraHeight);
        } else {
            this.targetCameraY = 0;
        }
        
        this.targetCameraY = Math.min(0, this.targetCameraY);
        this.cameraY = Utils.lerp(this.cameraY, this.targetCameraY, 0.1 * dt);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.drawBackground();
        
        this.effects.draw(this.ctx, this.cameraY);
        
        for (const obstacle of this.obstacles) {
            obstacle.draw(this.ctx, this.cameraY);
        }
        
        this.drawGround();
        
        for (const balloon of this.balloons) {
            balloon.draw(this.ctx, this.cameraY);
        }
        
        this.clown.draw(this.ctx, this.cameraY);
        
        this.effects.draw(this.ctx, this.cameraY);
    }

    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, CONSTANTS.COLORS.SKY_TOP);
        gradient.addColorStop(0.5, CONSTANTS.COLORS.SKY_MIDDLE);
        gradient.addColorStop(1, CONSTANTS.COLORS.SKY_BOTTOM);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.drawDecorations();
    }

    drawDecorations() {
        const decorations = ['🎠', '🎪', '🎡', '🎢', '🎯'];
        const positions = [
            { x: 50, y: this.height - 70 },
            { x: this.width - 50, y: this.height - 70 },
            { x: 100, y: this.height - 60 },
            { x: this.width - 100, y: this.height - 60 }
        ];
        
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        for (let i = 0; i < positions.length; i++) {
            const pos = positions[i];
            const deco = decorations[i % decorations.length];
            this.ctx.fillText(deco, pos.x, pos.y - this.cameraY * 0.1);
        }
    }

    drawGround() {
        const groundY = this.height - 50 - this.cameraY;
        
        const gradient = this.ctx.createLinearGradient(0, groundY, 0, this.height);
        gradient.addColorStop(0, '#90EE90');
        gradient.addColorStop(0.3, '#32CD32');
        gradient.addColorStop(1, '#228B22');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, groundY, this.width, 50 + this.cameraY);
        
        this.ctx.strokeStyle = '#228B22';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, groundY);
        this.ctx.lineTo(this.width, groundY);
        this.ctx.stroke();
        
        this.ctx.strokeStyle = '#7CFC00';
        this.ctx.lineWidth = 2;
        for (let x = 10; x < this.width; x += 20) {
            const grassHeight = 8 + Math.sin(x * 0.1 + Date.now() * 0.002) * 3;
            this.ctx.beginPath();
            this.ctx.moveTo(x, groundY);
            this.ctx.quadraticCurveTo(x + 2, groundY - grassHeight / 2, x + 4, groundY - grassHeight);
            this.ctx.stroke();
        }
    }

    autoSave() {
        const now = Date.now();
        if (now - this.lastSaveTime >= CONSTANTS.GAME.SAVE_INTERVAL) {
            this.saveState();
            this.lastSaveTime = now;
        }
    }

    saveState() {
        const state = {
            state: this.state,
            mode: this.mode,
            score: this.score,
            towerHeight: this.towerHeight,
            timeRemaining: this.timeRemaining,
            cameraY: this.cameraY,
            targetCameraY: this.targetCameraY,
            clown: this.clown.serialize(),
            balloons: this.balloons.map(b => b.serialize()),
            obstacles: this.obstacles.map(o => o.serialize()),
            explodedBalloons: Array.from(this.explodedBalloons)
        };
        
        Storage.saveGameState(state);
    }

    loadState() {
        const savedState = Storage.loadGameState();
        if (!savedState) return false;
        
        try {
            this.state = savedState.state;
            this.mode = savedState.mode;
            this.score = savedState.score;
            this.towerHeight = savedState.towerHeight;
            this.timeRemaining = savedState.timeRemaining || CONSTANTS.GAME.TIMED_DURATION;
            this.cameraY = savedState.cameraY || 0;
            this.targetCameraY = savedState.targetCameraY || 0;
            
            if (savedState.clown) {
                this.clown = Clown.deserialize(savedState.clown);
            }
            
            if (savedState.balloons) {
                this.balloons = savedState.balloons.map(bData => Balloon.deserialize(bData));
            }
            
            if (savedState.obstacles) {
                this.obstacles = savedState.obstacles.map(oData => Obstacle.deserialize(oData));
            }
            
            if (savedState.explodedBalloons) {
                this.explodedBalloons = new Set(savedState.explodedBalloons);
            }
            
            this.loadHighScore();
            
            return true;
        } catch (e) {
            console.error('恢复游戏状态失败:', e);
            return false;
        }
    }

    hasSavedState() {
        const saved = Storage.loadGameState();
        return saved !== null && saved.state === CONSTANTS.GAME.STATES.PLAYING;
    }
}