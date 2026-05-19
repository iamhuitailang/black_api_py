import { GameState } from './modules/gameState.js';
import { Renderer } from './modules/renderer.js';
import { MiningSystem } from './modules/mining.js';
import { UpgradeSystem } from './modules/upgrade.js';
import { AutoSellSystem } from './modules/autoSell.js';
import { UIManager } from './modules/ui.js';
import { OfflineReward } from './modules/offline.js';
import { Storage } from './modules/storage.js';
import { GAME_STATUS } from './modules/config.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.state = null;
        this.renderer = null;
        this.miningSystem = new MiningSystem();
        this.upgradeSystem = new UpgradeSystem();
        this.autoSellSystem = new AutoSellSystem();
        this.uiManager = null;
        this.offlineReward = null;
        
        this.lastTime = 0;
        this.saveTimer = 0;
        this.saveInterval = 5000;
        this.holdMineTimer = 0;
        this.holdMineInterval = 150;
        this.isMining = false;
        
        this.init();
    }
    
    init() {
        this.renderer = new Renderer(this.canvas);
        this.lastTime = performance.now();
        
        console.log('Loading game state...');
        const savedState = GameState.load();
        if (savedState) {
            this.state = savedState;
            console.log('Loaded saved state:', savedState);
            console.log('Status:', savedState.status);
            console.log('Gold:', savedState.gold);
            console.log('Upgrades:', savedState.upgrades);
            
            const lastSaveTime = Storage.getLastSaveTime();
            if (lastSaveTime > 0) {
                const reward = OfflineReward.calculate(this.state, lastSaveTime, Date.now());
                if (reward) {
                    this.offlineReward = reward;
                }
            }
        } else {
            this.state = new GameState();
            console.log('No saved state found, starting new game');
        }
        
        this.uiManager = new UIManager(this);
        
        if (this.state.status === GAME_STATUS.PLAYING) {
            const startScreen = document.getElementById('start-screen');
            if (startScreen) {
                startScreen.style.display = 'none';
                console.log('Start screen hidden, game resumed');
            }
        }
        
        if (this.offlineReward && this.state.status === GAME_STATUS.PLAYING) {
            this.uiManager.showOfflineReward(this.offlineReward);
        }
        
        this.gameLoop();
    }
    
    start() {
        this.lastTime = performance.now();
    }
    
    reset() {
        Storage.clear();
        this.state = new GameState();
        this.miningSystem = new MiningSystem();
        this.autoSellSystem = new AutoSellSystem();
    }
    
    gameLoop() {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        if (this.state.status === GAME_STATUS.PLAYING) {
            this.update(deltaTime);
        }
        
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update(deltaTime) {
        this.state.playTime += deltaTime;
        
        if (this.isMining) {
            this.holdMineTimer += deltaTime;
            if (this.holdMineTimer >= this.holdMineInterval) {
                this.holdMineTimer = 0;
                this.miningSystem.manualMine(this.state);
            }
        } else {
            this.holdMineTimer = 0;
        }
        
        this.miningSystem.updateAutoMine(this.state, deltaTime);
        this.autoSellSystem.update(this.state, deltaTime);
        this.state.updateParticles();
        
        this.saveTimer += deltaTime;
        if (this.saveTimer >= this.saveInterval) {
            this.saveTimer = 0;
            this.state.save();
        }
    }
    
    render() {
        this.renderer.render(this.state);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
