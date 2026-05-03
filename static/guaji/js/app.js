const Game = {
    state: null,
    canvas: null,
    offlineData: null,
    lastUpdateTime: 0,
    isRunning: false,
    animationFrameId: null,
    
    init() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('Canvas 元素未找到');
            return;
        }
        
        this.state = GameLogic.createInitialState();
        
        this.loadGame();
        
        Renderer.init(this.canvas);
        
        InputHandler.init(this.canvas, this.state, (newState) => {
            this.state = newState;
            this.saveGame();
            this.render();
        });
        
        this.isRunning = true;
        this.lastUpdateTime = Date.now();
        
        this.startGameLoop();
        
        Storage.autoSave(this.state, 10000);
        
        window.addEventListener('beforeunload', () => {
            this.saveGame();
        });
        
        console.log('闲置大亨游戏初始化完成！');
    },
    
    loadGame() {
        const savedData = Storage.load();
        if (savedData && savedData.state) {
            Object.assign(this.state, savedData.state);
            
            const currentTime = Date.now();
            this.offlineData = OfflineManager.checkAndProcessOffline(this.state, savedData.timestamp);
            
            if (this.offlineData && this.offlineData.hasOffline) {
                console.log(`检测到离线收益: ${this.offlineData.formattedEarnings}，离线时间: ${this.offlineData.formattedTime}`);
            }
        }
    },
    
    saveGame() {
        this.state.lastSaveTime = Date.now();
        Storage.save(this.state);
    },
    
    startGameLoop() {
        const gameLoop = () => {
            if (!this.isRunning) return;
            
            const currentTime = Date.now();
            const deltaTime = currentTime - this.lastUpdateTime;
            
            if (!this.state.isPaused && this.state.gameStarted && (!this.offlineData || !this.offlineData.hasOffline)) {
                this.update(deltaTime);
            }
            
            this.lastUpdateTime = currentTime;
            
            this.render();
            
            this.animationFrameId = requestAnimationFrame(gameLoop);
        };
        
        gameLoop();
    },
    
    update(deltaTime) {
        GameLogic.updateCycleProgress(this.state, deltaTime);
        
        GameLogic.processAutoUpgrades(this.state);
    },
    
    render() {
        const renderInfo = Renderer.draw(this.state, this.offlineData);
        
        InputHandler.setGameState(this.state);
        InputHandler.setRenderInfo(renderInfo);
        InputHandler.setOfflineData(this.offlineData);
    },
    
    pause() {
        this.state.isPaused = true;
        this.saveGame();
    },
    
    resume() {
        this.state.isPaused = false;
        this.lastUpdateTime = Date.now();
    },
    
    stop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.saveGame();
    },
    
    reset() {
        this.stop();
        
        Storage.clear();
        
        this.state = GameLogic.createInitialState();
        this.state.gameStarted = true;
        this.offlineData = null;
        this.lastUpdateTime = Date.now();
        
        InputHandler.setGameState(this.state);
        
        this.isRunning = true;
        this.startGameLoop();
        
        Storage.autoSave(this.state, 10000);
        
        console.log('游戏已重置');
    },
    
    getState() {
        return { ...this.state };
    },
    
    getStats() {
        return {
            money: this.state.money,
            prestigePoints: this.state.prestigePoints,
            totalEarnings: this.state.totalEarnings,
            businessesOwned: this.state.businesses.filter(b => b.owned).length,
            managersHired: this.state.managers.filter(m => m.hired).length,
            totalClicks: this.state.stats.totalClicks,
            totalPrestigeCount: this.state.stats.totalPrestigeCount,
            isPaused: this.state.isPaused
        };
    },
    
    exportSave() {
        return Storage.exportSave();
    },
    
    importSave(encodedData) {
        const success = Storage.importSave(encodedData);
        if (success) {
            this.loadGame();
            this.render();
        }
        return success;
    },
    
    createBackup() {
        return Storage.createBackup();
    },
    
    listBackups() {
        return Storage.listBackups();
    },
    
    restoreBackup(backupKey) {
        const success = Storage.restoreBackup(backupKey);
        if (success) {
            this.loadGame();
            this.render();
        }
        return success;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});

window.Game = Game;
