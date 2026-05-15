const Storage = {
    GAME_KEY: 'wrestling_club_game',
    SETTINGS_KEY: 'wrestling_club_settings',
    
    saveGame(data) {
        try {
            const saveData = {
                timestamp: Date.now(),
                ...data
            };
            localStorage.setItem(this.GAME_KEY, JSON.stringify(saveData));
            return true;
        } catch (e) {
            console.error('保存失败:', e);
            return false;
        }
    },
    
    loadGame() {
        try {
            const data = localStorage.getItem(this.GAME_KEY);
            if (data) {
                return JSON.parse(data);
            }
            return null;
        } catch (e) {
            console.error('加载失败:', e);
            return null;
        }
    },
    
    clearGame() {
        localStorage.removeItem(this.GAME_KEY);
    },
    
    hasGameSave() {
        return localStorage.getItem(this.GAME_KEY) !== null;
    },
    
    saveSettings(settings) {
        try {
            localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
            return true;
        } catch (e) {
            console.error('设置保存失败:', e);
            return false;
        }
    },
    
    loadSettings() {
        try {
            const data = localStorage.getItem(this.SETTINGS_KEY);
            if (data) {
                return JSON.parse(data);
            }
            return { selectedCharacter: 'tiger' };
        } catch (e) {
            console.error('设置加载失败:', e);
            return { selectedCharacter: 'tiger' };
        }
    },
    
    saveGameState(game) {
        if (!game.player || !game.enemy) return false;
        
        return this.saveGame({
            type: 'game_state',
            selectedCharacter: game.selectedCharacter,
            playerHealth: game.player.health,
            enemyHealth: game.enemy.health,
            playerPinCount: game.playerPinCount,
            enemyPinCount: game.enemyPinCount,
            timeRemaining: game.timeRemaining,
            playerState: game.player.state,
            enemyState: game.enemy.state,
            playerX: game.player.x,
            enemyX: game.enemy.x,
            isPinned: game.isPinned,
            pinningPlayer: game.pinningPlayer,
            pinTimer: game.pinTimer
        });
    },
    
    load() {
        return this.loadGame();
    },
    
    hasSave() {
        return this.hasGameSave();
    },
    
    clear() {
        this.clearGame();
    },
    
    save(data) {
        if (data.type === 'game_state') {
            return this.saveGame(data);
        }
        return false;
    }
};