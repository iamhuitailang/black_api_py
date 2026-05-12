class StorageManager {
    constructor() {
        this.storageKey = 'sonic_game_save';
        this.currentData = this.load();
    }

    getDefaultData() {
        return {
            gameMode: null,
            currentLevel: 1,
            unlockedLevels: [1],
            chaosEmeralds: 0,
            totalScore: 0,
            totalTime: 0,
            lives: 3,
            levelProgress: {},
            lastSaveTime: null,
            inGameState: null
        };
    }

    load() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                const parsed = JSON.parse(data);
                return { ...this.getDefaultData(), ...parsed };
            }
        } catch (e) {
            console.error('加载存档失败:', e);
        }
        return this.getDefaultData();
    }

    save(data) {
        try {
            this.currentData = { ...this.currentData, ...data, lastSaveTime: Date.now() };
            localStorage.setItem(this.storageKey, JSON.stringify(this.currentData));
            return true;
        } catch (e) {
            console.error('保存存档失败:', e);
            return false;
        }
    }

    saveGameState(gameState) {
        const stateToSave = {
            inGameState: {
                player: {
                    x: gameState.player.x,
                    y: gameState.player.y,
                    vx: gameState.player.vx,
                    vy: gameState.player.vy,
                    rings: gameState.player.rings,
                    lives: gameState.player.lives,
                    score: gameState.player.score,
                    isSuper: gameState.player.isSuper,
                    hasShield: gameState.player.hasShield,
                    shieldType: gameState.player.shieldType
                },
                level: {
                    id: gameState.level.id,
                    time: gameState.level.time,
                    cameraX: gameState.level.cameraX,
                    collectedRings: gameState.level.collectedRings,
                    defeatedEnemies: gameState.level.defeatedEnemies
                },
                timestamp: Date.now()
            }
        };
        return this.save(stateToSave);
    }

    hasSavedGame() {
        return this.currentData.lastSaveTime !== null;
    }

    unlockLevel(levelId) {
        if (!this.currentData.unlockedLevels.includes(levelId)) {
            this.currentData.unlockedLevels.push(levelId);
            this.save(this.currentData);
        }
    }

    collectEmerald() {
        if (this.currentData.chaosEmeralds < 7) {
            this.currentData.chaosEmeralds++;
            this.save(this.currentData);
        }
    }

    addScore(score) {
        this.currentData.totalScore += score;
        this.save(this.currentData);
    }

    addTime(time) {
        this.currentData.totalTime += time;
        this.save(this.currentData);
    }

    setLives(lives) {
        this.currentData.lives = lives;
        this.save(this.currentData);
    }

    setLevelProgress(levelId, progress) {
        this.currentData.levelProgress[levelId] = progress;
        this.save(this.currentData);
    }

    getLevelProgress(levelId) {
        return this.currentData.levelProgress[levelId] || null;
    }

    reset() {
        this.currentData = this.getDefaultData();
        localStorage.removeItem(this.storageKey);
    }

    clearInGameState() {
        this.currentData.inGameState = null;
        this.save(this.currentData);
    }
}

const storage = new StorageManager();
