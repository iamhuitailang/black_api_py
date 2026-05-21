const Storage = {
    STORAGE_KEY: 'circus_game_state_v2',
    
    save(gameState) {
        try {
            if (!gameState || !gameState.player || !gameState.enemy) {
                console.warn('游戏状态不完整，跳过保存');
                return false;
            }
            
            const stateToSave = {
                timestamp: Date.now(),
                playerHealth: gameState.player.health,
                playerAtmosphere: gameState.player.atmosphere,
                playerX: gameState.player.x,
                playerY: gameState.player.y,
                playerFacing: gameState.player.facingRight,
                playerDataId: gameState.player.data.id,
                
                enemyHealth: gameState.enemy.health,
                enemyAtmosphere: gameState.enemy.atmosphere,
                enemyX: gameState.enemy.x,
                enemyY: gameState.enemy.y,
                enemyFacing: gameState.enemy.facingRight,
                enemyDataId: gameState.enemy.data.id,
                
                timer: gameState.timer
            };
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stateToSave));
            console.log('游戏状态已保存:', stateToSave);
            return true;
        } catch (e) {
            console.error('保存游戏状态失败:', e);
            return false;
        }
    },
    
    load() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (!saved) {
                console.log('没有找到保存的游戏状态');
                return null;
            }
            
            const state = JSON.parse(saved);
            console.log('加载到的保存状态:', state);
            
            const now = Date.now();
            const expireTime = 30 * 60 * 1000;
            if (now - state.timestamp > expireTime) {
                console.log('保存的游戏状态已过期');
                this.clear();
                return null;
            }
            
            return {
                player: {
                    health: state.playerHealth,
                    atmosphere: state.playerAtmosphere,
                    x: state.playerX,
                    y: state.playerY,
                    facingRight: state.playerFacing,
                    dataId: state.playerDataId
                },
                enemy: {
                    health: state.enemyHealth,
                    atmosphere: state.enemyAtmosphere,
                    x: state.enemyX,
                    y: state.enemyY,
                    facingRight: state.enemyFacing,
                    dataId: state.enemyDataId
                },
                timer: state.timer
            };
        } catch (e) {
            console.error('加载游戏状态失败:', e);
            return null;
        }
    },
    
    clear() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            console.log('游戏状态已清除');
            return true;
        } catch (e) {
            console.error('清除游戏状态失败:', e);
            return false;
        }
    },
    
    hasSavedState() {
        return localStorage.getItem(this.STORAGE_KEY) !== null;
    }
};

window.addEventListener('beforeunload', () => {
    if (window.currentGame && !window.currentGame.gameOver) {
        Storage.save(window.currentGame.serialize());
    }
});
