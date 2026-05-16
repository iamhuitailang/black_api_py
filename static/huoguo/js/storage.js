const GameStorage = (function() {
    const STORAGE_KEY = 'huoguo_game_state';

    function saveGameState(gameState) {
        try {
            const state = {
                playerCharacter: gameState.playerCharacter,
                enemyCharacter: gameState.enemyCharacter,
                playerHealth: gameState.player.health,
                playerEnergy: gameState.player.energy,
                playerX: gameState.player.x,
                playerY: gameState.player.y,
                playerVelocityX: gameState.player.velocityX,
                playerVelocityY: gameState.player.velocityY,
                playerFacing: gameState.player.facing,
                playerCrouching: gameState.player.crouching,
                enemyHealth: gameState.enemy.health,
                enemyEnergy: gameState.enemy.energy,
                enemyX: gameState.enemy.x,
                enemyY: gameState.enemy.y,
                enemyVelocityX: gameState.enemy.velocityX,
                enemyVelocityY: gameState.enemy.velocityY,
                enemyFacing: gameState.enemy.facing,
                round: gameState.round,
                isPaused: gameState.isPaused,
                isGameOver: gameState.isGameOver,
                winner: gameState.winner,
                timestamp: Date.now()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.error('保存游戏状态失败:', e);
        }
    }

    function loadGameState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const state = JSON.parse(saved);
                const now = Date.now();
                if (now - state.timestamp < 24 * 60 * 60 * 1000) {
                    return state;
                }
            }
        } catch (e) {
            console.error('加载游戏状态失败:', e);
        }
        return null;
    }

    function clearGameState() {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            console.error('清除游戏状态失败:', e);
        }
    }

    function saveSettings(settings) {
        try {
            localStorage.setItem('huoguo_settings', JSON.stringify(settings));
        } catch (e) {
            console.error('保存设置失败:', e);
        }
    }

    function loadSettings() {
        try {
            const saved = localStorage.getItem('huoguo_settings');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('加载设置失败:', e);
        }
        return {
            selectedCharacter: 'spicy'
        };
    }

    return {
        saveGameState,
        loadGameState,
        clearGameState,
        saveSettings,
        loadSettings
    };
})();
