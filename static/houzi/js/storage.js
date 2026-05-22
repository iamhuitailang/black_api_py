const Storage = {
    save(data) {
        try {
            const existingData = this.load();
            const mergedData = { ...existingData, ...data, lastSaved: Date.now() };
            localStorage.setItem(GameConfig.STORAGE_KEY, JSON.stringify(mergedData));
            return true;
        } catch (e) {
            console.error('保存游戏数据失败:', e);
            return false;
        }
    },

    load() {
        try {
            const data = localStorage.getItem(GameConfig.STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('加载游戏数据失败:', e);
            return null;
        }
    },

    hasSavedGame() {
        try {
            const savedData = localStorage.getItem(GameConfig.STORAGE_KEY);
            if (!savedData) return false;
            
            const parsed = JSON.parse(savedData);
            return parsed && parsed.gameState === GameConfig.GAME.STATE.PLAYING;
        } catch (e) {
            return false;
        }
    },

    clearGameState() {
        try {
            const data = this.load();
            if (data) {
                delete data.gameState;
                delete data.player;
                delete data.ai;
                delete data.bananas;
                delete data.obstacles;
                delete data.timeLeft;
                localStorage.setItem(GameConfig.STORAGE_KEY, JSON.stringify(data));
            }
            return true;
        } catch (e) {
            console.error('清除游戏状态失败:', e);
            return false;
        }
    },

    clear() {
        try {
            localStorage.removeItem(GameConfig.STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('清除游戏数据失败:', e);
            return false;
        }
    },

    savePlayerScore(score, characterId) {
        const data = this.load() || {};
        if (!data.highScores) data.highScores = [];
        
        data.highScores.push({
            score,
            characterId,
            date: new Date().toISOString()
        });
        
        data.highScores.sort((a, b) => b.score - a.score);
        data.highScores = data.highScores.slice(0, 10);
        
        return this.save(data);
    },

    getHighScores() {
        const data = this.load();
        return data && data.highScores ? data.highScores : [];
    },

    getSelectedCharacter() {
        const data = this.load();
        return data && data.selectedCharacter ? data.selectedCharacter : null;
    },

    saveSelectedCharacter(characterId) {
        return this.save({ selectedCharacter: characterId });
    },

    saveGameState(gameState) {
        try {
            const data = {
                gameState: GameConfig.GAME.STATE.PLAYING,
                player: gameState.player,
                ai: gameState.ai,
                bananas: gameState.bananas,
                obstacles: gameState.obstacles,
                timeLeft: gameState.timeLeft,
                lastSaved: Date.now()
            };
            
            const existingData = localStorage.getItem(GameConfig.STORAGE_KEY);
            let mergedData = data;
            if (existingData) {
                const parsed = JSON.parse(existingData);
                mergedData = { ...parsed, ...data };
            }
            localStorage.setItem(GameConfig.STORAGE_KEY, JSON.stringify(mergedData));
            return true;
        } catch (e) {
            console.error('保存游戏状态失败:', e);
            return false;
        }
    },

    loadGameState() {
        const data = this.load();
        if (!data || data.gameState !== GameConfig.GAME.STATE.PLAYING) {
            return null;
        }
        
        return {
            player: data.player,
            ai: data.ai,
            bananas: data.bananas || [],
            obstacles: data.obstacles || [],
            timeLeft: data.timeLeft || GameConfig.GAME.GAME_DURATION
        };
    }
};
