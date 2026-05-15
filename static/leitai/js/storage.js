const StorageManager = {
    saveGameState(gameState) {
        try {
            const stateToSave = {
                gameState: gameState.gameState,
                selectedCharIndex: gameState.selectedCharIndex,
                enemyCharIndex: gameState.enemyCharIndex,
                timer: gameState.timer,
                player: {
                    x: gameState.player.x,
                    y: gameState.player.y,
                    rage: gameState.player.rage,
                    charIndex: gameState.player.charIndex,
                    facingRight: gameState.player.facingRight
                },
                enemy: {
                    x: gameState.enemy.x,
                    y: gameState.enemy.y,
                    rage: gameState.enemy.rage,
                    charIndex: gameState.enemy.charIndex,
                    facingRight: gameState.enemy.facingRight
                },
                timestamp: Date.now()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        } catch (e) {
            console.error('保存游戏状态失败:', e);
        }
    },

    loadGameState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                const timeDiff = (Date.now() - parsed.timestamp) / 1000;
                if (timeDiff < 3600) {
                    return parsed;
                }
            }
        } catch (e) {
            console.error('加载游戏状态失败:', e);
        }
        return null;
    },

    clearGameState() {
        localStorage.removeItem(STORAGE_KEY);
    },

    saveSelectedChar(index) {
        localStorage.setItem('leitai_selected_char', index.toString());
    },

    loadSelectedChar() {
        const saved = localStorage.getItem('leitai_selected_char');
        return saved ? parseInt(saved) : 0;
    }
};