import { GAME_STATUS, MINE_LAYERS, ORE_TYPES } from './config.js';

export class UIManager {
    constructor(game) {
        this.game = game;
        this.initEventListeners();
    }
    
    initEventListeners() {
        const canvas = this.game.renderer.canvas;
        
        canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('quit-btn').addEventListener('click', () => this.quitGame());
        document.getElementById('claim-btn').addEventListener('click', () => this.claimOfflineReward());
        
        document.querySelectorAll('.character-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.character-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.game.state.selectedCharacter = parseInt(card.dataset.character);
            });
        });
        
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        window.addEventListener('beforeunload', () => {
            if (this.game.state.status === GAME_STATUS.PLAYING) {
                this.game.state.save();
            }
        });
    }
    
    handleCanvasClick(e) {
        if (this.game.state.status !== GAME_STATUS.PLAYING) return;
        
        const rect = this.game.renderer.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        console.log('Canvas clicked at:', x, y);
        
        const buttonId = this.game.renderer.getButtonAt(x, y);
        if (buttonId) {
            console.log('Button clicked:', buttonId);
            this.handleButtonClick(buttonId);
            return;
        }
        
        const upgradeId = this.game.renderer.getUpgradeAt(x, y);
        if (upgradeId) {
            console.log('Upgrade clicked:', upgradeId);
            this.game.upgradeSystem.upgrade(this.game.state, upgradeId);
            return;
        }
        
        const mineArea = this.game.renderer.mineArea;
        if (x >= mineArea.x && x <= mineArea.x + mineArea.width &&
            y >= mineArea.y && y <= mineArea.y + mineArea.height) {
            console.log('Mine area clicked');
            this.game.miningSystem.manualMine(this.game.state);
        }
    }
    
    handleMouseDown(e) {
        if (this.game.state.status !== GAME_STATUS.PLAYING) return;
        
        const rect = this.game.renderer.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const mineArea = this.game.renderer.mineArea;
        if (x >= mineArea.x && x <= mineArea.x + mineArea.width &&
            y >= mineArea.y && y <= mineArea.y + mineArea.height) {
            this.game.isMining = true;
        }
    }
    
    handleMouseUp(e) {
        this.game.isMining = false;
    }
    
    handleButtonClick(buttonId) {
        switch (buttonId) {
            case 'mine':
                this.game.miningSystem.manualMine(this.game.state);
                break;
            case 'sell':
                const earnings = this.game.state.sellAllOres();
                if (earnings > 0) {
                    this.game.state.addFloatingText(450, 300, `💰 +${Math.floor(earnings)}`, '#ffd700');
                    this.game.state.save();
                }
                break;
            case 'layer':
                this.showLayerMenu();
                break;
            case 'pause':
                this.pauseGame();
                break;
        }
    }
    
    showLayerMenu() {
        const layers = MINE_LAYERS.map((layer, index) => {
            const unlocked = this.game.state.unlockedLayers.includes(index);
            const current = this.game.state.currentLayer === index;
            return { ...layer, index, unlocked, current };
        });
        
        let menuText = '选择矿层:\n\n';
        layers.forEach(layer => {
            const status = layer.current ? '▶ ' : (layer.unlocked ? '✓ ' : '🔒 ');
            const cost = layer.unlockCost.type !== 'none' && !layer.unlocked 
                ? ` (需要 ${layer.unlockCost.amount} ${layer.unlockCost.type === 'gold' ? '金币' : ORE_TYPES[layer.unlockCost.type.toUpperCase()].name})`
                : '';
            menuText += `${status}${layer.index + 1}. ${layer.name}${cost}${layer.current ? ' (当前)' : ''}\n`;
        });
        
        const choice = prompt(menuText + '\n输入矿层编号:');
        if (choice !== null) {
            const layerIndex = parseInt(choice) - 1;
            if (!isNaN(layerIndex) && layerIndex >= 0 && layerIndex < MINE_LAYERS.length) {
                const direction = layerIndex - this.game.state.currentLayer;
                if (direction !== 0) {
                    if (direction > 0) {
                        for (let i = 0; i < direction; i++) {
                            this.game.miningSystem.changeLayer(this.game.state, 1);
                        }
                    } else {
                        for (let i = 0; i < -direction; i++) {
                            this.game.miningSystem.changeLayer(this.game.state, -1);
                        }
                    }
                }
            }
        }
    }
    
    startGame() {
        const selectedCard = document.querySelector('.character-card.selected');
        if (!selectedCard) {
            alert('请先选择一个矿工角色！');
            return;
        }
        
        this.game.state.selectedCharacter = parseInt(selectedCard.dataset.character);
        this.game.state.status = GAME_STATUS.PLAYING;
        
        const startScreen = document.getElementById('start-screen');
        if (startScreen) {
            startScreen.style.display = 'none';
        }
        
        this.game.start();
        this.game.state.save();
        
        console.log('Game started! State saved to localStorage');
    }
    
    pauseGame() {
        this.game.state.status = GAME_STATUS.PAUSED;
        document.getElementById('pause-menu').classList.remove('hidden');
    }
    
    resumeGame() {
        this.game.state.status = GAME_STATUS.PLAYING;
        document.getElementById('pause-menu').classList.add('hidden');
    }
    
    restartGame() {
        if (confirm('确定要重新开始吗？所有进度将会丢失！')) {
            this.game.reset();
            document.getElementById('pause-menu').classList.add('hidden');
            document.getElementById('start-screen').classList.remove('hidden');
        }
    }
    
    quitGame() {
        this.game.state.save();
        document.getElementById('pause-menu').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');
        this.game.state.status = GAME_STATUS.MENU;
    }
    
    claimOfflineReward() {
        if (this.game.offlineReward) {
            Object.keys(this.game.offlineReward.ores).forEach(oreId => {
                this.game.state.addOre(oreId, this.game.offlineReward.ores[oreId]);
            });
            this.game.state.gold += this.game.offlineReward.gold;
            this.game.offlineReward = null;
        }
        document.getElementById('offline-reward').classList.add('hidden');
    }
    
    showOfflineReward(reward) {
        const timeStr = this.formatTime(reward.offlineSeconds);
        document.getElementById('offline-time').textContent = `你离开了 ${timeStr}`;
        
        const itemsDiv = document.getElementById('offline-items');
        itemsDiv.innerHTML = '';
        
        Object.keys(reward.ores).forEach(oreId => {
            const ore = ORE_TYPES[oreId.toUpperCase()];
            if (ore && reward.ores[oreId] > 0) {
                const div = document.createElement('div');
                div.className = 'offline-item';
                div.innerHTML = `<span class="offline-item-name">${ore.name}</span><span class="offline-item-value">+${reward.ores[oreId]}</span>`;
                itemsDiv.appendChild(div);
            }
        });
        
        if (reward.gold > 0) {
            const div = document.createElement('div');
            div.className = 'offline-item';
            div.innerHTML = `<span class="offline-item-name">金币</span><span class="offline-item-value">+${Math.floor(reward.gold)}</span>`;
            itemsDiv.appendChild(div);
        }
        
        document.getElementById('offline-reward').classList.remove('hidden');
    }
    
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    handleKeyDown(e) {
        if (e.key === 'Escape') {
            if (this.game.state.status === GAME_STATUS.PLAYING) {
                this.pauseGame();
            } else if (this.game.state.status === GAME_STATUS.PAUSED) {
                this.resumeGame();
            }
        }
        
        if (e.key === ' ' && this.game.state.status === GAME_STATUS.PLAYING) {
            e.preventDefault();
            this.game.miningSystem.manualMine(this.game.state);
        }
    }
}
