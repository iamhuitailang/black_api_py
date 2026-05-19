const Storage = {
    STORAGE_KEY: 'jintian_opera_battle_save',
    
    save(data) {
        try {
            const saveData = {
                timestamp: Date.now(),
                ...data
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saveData));
            return true;
        } catch (e) {
            console.error('保存游戏数据失败:', e);
            return false;
        }
    },
    
    load() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                return parsed;
            }
            return null;
        } catch (e) {
            console.error('加载游戏数据失败:', e);
            return null;
        }
    },
    
    clear() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('清除游戏数据失败:', e);
            return false;
        }
    },
    
    saveGameState(game) {
        const state = {
            gameState: game.state,
            selectedCharacter: game.selectedCharacter,
            round: game.round,
            playerWins: game.playerWins,
            enemyWins: game.enemyWins,
            timer: game.timer,
            player: game.player ? game.player.serialize() : null,
            enemy: game.enemy ? game.enemy.serialize() : null
        };
        return this.save(state);
    },
    
    loadGameState() {
        return this.load();
    },
    
    hasSavedGame() {
        return this.load() !== null;
    }
};
