const gameState = {
    car: null,
    currentLevel: null,
    levelData: null,
    gameStatus: GAME_STATE.MENU,
    startTime: 0,
    elapsedTime: 0,
    animationId: null,
    lastFrameTime: 0,
    
    init() {
        storageManager.init();
        inputManager.init();
        renderer.init('gameCanvas');
        
        this.loadState();
        this.bindEvents();
        this.updateUI();
        this.renderMenu();
        
        const savedData = storageManager.saveData;
        if (savedData.gameState === GAME_STATE.PLAYING || savedData.gameState === GAME_STATE.PAUSED) {
            this.showOverlay('游戏暂停', '检测到之前的游戏状态，点击暂停菜单选择继续或重开');
            document.getElementById('pauseModal').style.display = 'flex';
        } else {
            this.showOverlay('倒车入库', '点击开始游戏按钮开始挑战');
        }
    },
    
    loadState() {
        const savedData = storageManager.saveData;
        this.currentLevel = savedData.currentLevel || 1;
        this.initLevel(this.currentLevel);
        
        if (savedData.car) {
            this.car.x = savedData.car.x;
            this.car.y = savedData.car.y;
            this.car.angle = savedData.car.angle;
        }
        
        if (savedData.gameState === GAME_STATE.PLAYING || savedData.gameState === GAME_STATE.PAUSED) {
            this.gameStatus = GAME_STATE.PAUSED;
            this.elapsedTime = savedData.playTime || 0;
        } else {
            this.gameStatus = GAME_STATE.MENU;
            this.elapsedTime = 0;
        }
    },
    
    bindEvents() {
        window.addEventListener('beforeunload', () => this.saveCurrentState());
        
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Escape' && this.gameStatus === GAME_STATE.PLAYING) {
                this.pauseGame();
            }
        });
    },
    
    initLevel(levelId) {
        this.levelData = GAME_CONFIG.levels.find(l => l.id === levelId);
        if (!this.levelData) {
            this.levelData = GAME_CONFIG.levels[0];
        }
        
        this.car = {
            x: this.levelData.car.x,
            y: this.levelData.car.y,
            angle: this.levelData.car.angle,
            width: GAME_CONFIG.car.width,
            height: GAME_CONFIG.car.height,
            speed: 0,
            angularSpeed: 0
        };
        
        this.startTime = 0;
        this.elapsedTime = 0;
    },
    
    startGame() {
        if (this.gameStatus === GAME_STATE.PLAYING) return;
        
        if (this.gameStatus === GAME_STATE.MENU || 
            this.gameStatus === GAME_STATE.SUCCESS || 
            this.gameStatus === GAME_STATE.FAILED) {
            this.initLevel(this.currentLevel);
        }
        
        this.gameStatus = GAME_STATE.PLAYING;
        this.startTime = Date.now() - (this.elapsedTime * 1000);
        storageManager.setGameState(this.gameStatus);
        
        this.hideOverlay();
        this.startGameLoop();
    },
    
    pauseGame() {
        if (this.gameStatus !== GAME_STATE.PLAYING) return;
        
        this.gameStatus = GAME_STATE.PAUSED;
        this.stopGameLoop();
        this.saveCurrentState();
        
        document.getElementById('pauseModal').style.display = 'flex';
    },
    
    resumeGame() {
        if (this.gameStatus !== GAME_STATE.PAUSED) return;
        
        document.getElementById('pauseModal').style.display = 'none';
        this.hideOverlay();
        
        this.gameStatus = GAME_STATE.PLAYING;
        this.startTime = Date.now() - (this.elapsedTime * 1000);
        storageManager.setGameState(this.gameStatus);
        
        this.startGameLoop();
    },
    
    restartLevel() {
        this.stopGameLoop();
        document.getElementById('pauseModal').style.display = 'none';
        this.hideOverlay();
        
        this.initLevel(this.currentLevel);
        this.gameStatus = GAME_STATE.PLAYING;
        this.startTime = Date.now();
        storageManager.setGameState(this.gameStatus);
        
        this.startGameLoop();
    },
    
    exitGame() {
        this.stopGameLoop();
        document.getElementById('pauseModal').style.display = 'none';
        
        this.gameStatus = GAME_STATE.MENU;
        storageManager.saveData.car = null;
        storageManager.setGameState(this.gameStatus);
        
        this.showOverlay('倒车入库', '点击开始游戏按钮开始挑战');
    },
    
    startGameLoop() {
        this.lastFrameTime = performance.now();
        this.gameLoop();
    },
    
    stopGameLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    },
    
    gameLoop() {
        if (this.gameStatus !== GAME_STATE.PLAYING) return;
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastFrameTime) / 16.67;
        this.lastFrameTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    },
    
    update(deltaTime) {
        const carConfig = GAME_CONFIG.car;
        const input = inputManager;
        
        if (input.isSpacePressed()) {
            this.car.speed *= 0.8;
            this.car.angularSpeed *= 0.8;
        } else {
            if (input.isUpPressed()) {
                this.car.speed = Math.min(this.car.speed + 0.1 * deltaTime, carConfig.maxSpeed);
            } else if (input.isDownPressed()) {
                this.car.speed = Math.max(this.car.speed - 0.1 * deltaTime, -carConfig.reverseSpeed);
            } else {
                this.car.speed *= 0.95;
            }
            
            const turnSpeed = carConfig.turnSpeed * (Math.abs(this.car.speed) / carConfig.maxSpeed) * deltaTime;
            
            if (input.isLeftPressed()) {
                this.car.angularSpeed = -turnSpeed;
            } else if (input.isRightPressed()) {
                this.car.angularSpeed = turnSpeed;
            } else {
                this.car.angularSpeed *= 0.8;
            }
        }
        
        this.car.angle += this.car.angularSpeed;
        
        const moveX = Math.cos(this.car.angle) * this.car.speed * deltaTime;
        const moveY = Math.sin(this.car.angle) * this.car.speed * deltaTime;
        
        const newCar = {
            ...this.car,
            x: this.car.x + moveX,
            y: this.car.y + moveY
        };
        
        const collision = collisionManager.checkAllCollisions(
            newCar,
            this.levelData,
            GAME_CONFIG.canvas.width,
            GAME_CONFIG.canvas.height
        );
        
        if (collision.collision) {
            this.handleCollision(collision.type);
            return;
        }
        
        this.car.x = newCar.x;
        this.car.y = newCar.y;
        
        if (collisionManager.isCarInGarage(this.car, this.levelData.garage)) {
            this.handleSuccess();
            return;
        }
        
        this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
        this.updateTimeDisplay();
        
        if (collisionManager.isCarPartiallyInGarage(this.car, this.levelData.garage)) {
            const carAngleDeg = (this.car.angle * 180 / Math.PI).toFixed(1);
            const garageAngleDeg = (this.levelData.garage.angle * 180 / Math.PI).toFixed(1);
            console.log('车辆部分在车库内，角度:', carAngleDeg + '°', '车库角度:', garageAngleDeg + '°');
        }
        
        this.saveCurrentState();
    },
    
    handleCollision(type) {
        this.stopGameLoop();
        this.gameStatus = GAME_STATE.FAILED;
        
        storageManager.addFailed();
        storageManager.saveData.car = null;
        storageManager.setGameState(this.gameStatus);
        
        let message = '';
        switch (type) {
            case 'boundary':
                message = '车辆触碰了场景边界！';
                break;
            case 'obstacle':
                message = '车辆撞到了障碍物！';
                break;
            case 'garage':
                message = '车辆碰到了车库边缘！';
                break;
            default:
                message = '发生碰撞！';
        }
        
        this.showOverlay('💥 游戏失败', message);
        this.updateUI();
        this.renderMenu();
    },
    
    handleSuccess() {
        this.stopGameLoop();
        this.gameStatus = GAME_STATE.SUCCESS;
        
        storageManager.addSuccess();
        storageManager.updateBestTime(this.currentLevel, this.elapsedTime);
        
        const nextLevel = this.currentLevel + 1;
        const hasNextLevel = nextLevel <= GAME_CONFIG.levels.length;
        
        if (hasNextLevel) {
            this.currentLevel = nextLevel;
            storageManager.setLevel(nextLevel);
            this.initLevel(nextLevel);
        }
        
        storageManager.saveData.car = null;
        storageManager.setGameState(this.gameStatus);
        
        const timeStr = this.formatTime(this.elapsedTime);
        if (hasNextLevel) {
            this.showOverlay('🎉 入库成功！', `用时: ${timeStr}，点击开始游戏进入第${nextLevel}关`);
        } else {
            this.showOverlay('🎉 恭喜通关！', `用时: ${timeStr}，所有关卡已完成！`);
        }
        this.updateUI();
        this.renderMenu();
    },
    
    render() {
        renderer.render(this.car, this.levelData);
    },
    
    renderMenu() {
        renderer.clear();
        renderer.drawLevel(this.levelData);
        renderer.drawBoundary();
        renderer.drawCar(this.car);
    },
    
    showOverlay(title, message) {
        const overlay = document.getElementById('gameOverlay');
        const titleEl = document.getElementById('overlayTitle');
        const messageEl = document.getElementById('overlayMessage');
        
        overlay.style.display = 'flex';
        titleEl.textContent = title;
        messageEl.textContent = message;
    },
    
    hideOverlay() {
        const overlay = document.getElementById('gameOverlay');
        overlay.style.display = 'none';
    },
    
    updateTimeDisplay() {
        const timeStr = this.formatTime(this.elapsedTime);
        document.getElementById('time-display').textContent = timeStr;
        document.getElementById('nav-time-value').textContent = timeStr;
    },
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    
    updateUI() {
        document.getElementById('level-display').textContent = this.currentLevel;
        document.getElementById('nav-level-value').textContent = this.currentLevel;
        document.getElementById('success-display').textContent = storageManager.saveData.totalSuccess;
        document.getElementById('fail-display').textContent = storageManager.saveData.totalFailed;
    },
    
    saveCurrentState() {
        if (this.car) {
            storageManager.saveData.car = {
                x: this.car.x,
                y: this.car.y,
                angle: this.car.angle
            };
        }
        storageManager.saveData.playTime = this.elapsedTime;
        storageManager.setGameState(this.gameStatus);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    gameState.init();
});

window.addEventListener('beforeunload', () => {
    if (gameState.car) {
        gameState.saveCurrentState();
    }
});
