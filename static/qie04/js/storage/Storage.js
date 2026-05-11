export class Storage {
    constructor() {
        this.key = 'penguin_game_save';
        this.autoSaveInterval = 5000;
        this.autoSaveTimer = null;
    }

    save(data) {
        try {
            const saveData = {
                timestamp: Date.now(),
                version: '1.0',
                ...data
            };
            localStorage.setItem(this.key, JSON.stringify(saveData));
            return true;
        } catch (e) {
            console.error('保存失败:', e);
            return false;
        }
    }

    load() {
        try {
            const data = localStorage.getItem(this.key);
            if (!data) return null;
            
            const saveData = JSON.parse(data);
            return saveData;
        } catch (e) {
            console.error('加载失败:', e);
            return null;
        }
    }

    hasSaveData() {
        return localStorage.getItem(this.key) !== null;
    }

    clear() {
        localStorage.removeItem(this.key);
    }

    startAutoSave(callback) {
        if (this.autoSaveTimer) {
            this.stopAutoSave();
        }
        
        this.autoSaveTimer = setInterval(() => {
            if (callback) {
                const data = callback();
                if (data) {
                    this.save(data);
                }
            }
        }, this.autoSaveInterval);
    }

    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    saveGameState(game) {
        const state = {
            type: 'game_state',
            level: game.currentLevel,
            score: game.score,
            highScore: game.highScore,
            pushes: game.pushes,
            gameTime: game.gameTime,
            isPlaying: game.isPlaying,
            isPaused: game.isPaused,
            penguin: game.penguin.getState(),
            levelData: game.levelData,
            collectedItems: game.collectedItems || [],
            activeCheckpoints: game.activeCheckpoints || []
        };
        
        return this.save(state);
    }

    loadGameState(game) {
        const saveData = this.load();
        if (!saveData || saveData.type !== 'game_state') {
            return false;
        }
        
        game.currentLevel = saveData.level || 1;
        game.score = saveData.score || 0;
        game.highScore = saveData.highScore || 0;
        game.pushes = saveData.pushes || 0;
        game.gameTime = saveData.gameTime || 0;
        game.levelData = saveData.levelData || null;
        game.collectedItems = saveData.collectedItems || [];
        game.activeCheckpoints = saveData.activeCheckpoints || [];
        
        if (saveData.penguin) {
            game.penguin.loadState(saveData.penguin);
        }
        
        return true;
    }

    saveHighScore(score) {
        try {
            const current = this.load();
            const newHighScore = Math.max(score, current?.highScore || 0);
            localStorage.setItem(this.key + '_highscore', newHighScore.toString());
            return newHighScore;
        } catch (e) {
            console.error('保存高分失败:', e);
            return score;
        }
    }

    loadHighScore() {
        try {
            const score = localStorage.getItem(this.key + '_highscore');
            return score ? parseInt(score, 10) : 0;
        } catch (e) {
            return 0;
        }
    }

    saveUnlockedLevels(levels) {
        try {
            localStorage.setItem(this.key + '_unlocked', JSON.stringify(levels));
            return true;
        } catch (e) {
            return false;
        }
    }

    loadUnlockedLevels() {
        try {
            const data = localStorage.getItem(this.key + '_unlocked');
            return data ? JSON.parse(data) : [1];
        } catch (e) {
            return [1];
        }
    }

    saveSettings(settings) {
        try {
            localStorage.setItem(this.key + '_settings', JSON.stringify(settings));
            return true;
        } catch (e) {
            return false;
        }
    }

    loadSettings() {
        try {
            const data = localStorage.getItem(this.key + '_settings');
            return data ? JSON.parse(data) : {
                soundEnabled: true,
                musicEnabled: true
            };
        } catch (e) {
            return {
                soundEnabled: true,
                musicEnabled: true
            };
        }
    }
}
