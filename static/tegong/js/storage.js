const STORAGE_KEY = 'tegong_shooter_save';
const GAME_STATE_KEY = 'tegong_shooter_state';

const StorageManager = {
    defaultSaveData: {
        highScore: 0,
        unlockedWeapons: ['pistol'],
        credits: 0,
        totalGames: 0
    },
    
    defaultGameState: {
        isPlaying: false,
        isPaused: false,
        score: 0,
        health: 10,
        timeLeft: 60,
        combo: 1,
        currentWeapon: 'pistol',
        ammo: {
            pistol: 6,
            sniper: 6
        },
        maxAmmo: {
            pistol: 6,
            sniper: 6
        },
        wave: 1,
        background: null,
        enemies: [],
        effects: [],
        damageIndicators: [],
        lastEnemySpawn: 0,
        lastEnemyShot: 0,
        enemyShotCooldown: 2000
    },
    
    save(saveData) {
        try {
            const dataToSave = {
                ...this.defaultSaveData,
                ...saveData,
                lastSaved: Date.now()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
            return true;
        } catch (e) {
            console.error('保存游戏数据失败:', e);
            return false;
        }
    },
    
    load() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                return {
                    ...this.defaultSaveData,
                    ...parsed
                };
            }
        } catch (e) {
            console.error('读取游戏数据失败:', e);
        }
        return { ...this.defaultSaveData };
    },
    
    saveGameState(gameState) {
        try {
            const stateToSave = {
                ...this.defaultGameState,
                ...gameState,
                lastSaved: Date.now()
            };
            localStorage.setItem(GAME_STATE_KEY, JSON.stringify(stateToSave));
            return true;
        } catch (e) {
            console.error('保存游戏状态失败:', e);
            return false;
        }
    },
    
    loadGameState() {
        try {
            const saved = localStorage.getItem(GAME_STATE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                return {
                    ...this.defaultGameState,
                    ...parsed
                };
            }
        } catch (e) {
            console.error('读取游戏状态失败:', e);
        }
        return null;
    },
    
    clearGameState() {
        try {
            localStorage.removeItem(GAME_STATE_KEY);
            return true;
        } catch (e) {
            console.error('清除游戏状态失败:', e);
            return false;
        }
    },
    
    updateHighScore(score) {
        const data = this.load();
        if (score > data.highScore) {
            data.highScore = score;
            this.save(data);
            return true;
        }
        return false;
    },
    
    addCredits(amount) {
        const data = this.load();
        data.credits += amount;
        this.save(data);
        return data.credits;
    },
    
    unlockWeapon(weaponId) {
        const data = this.load();
        if (!data.unlockedWeapons.includes(weaponId)) {
            data.unlockedWeapons.push(weaponId);
            this.save(data);
            return true;
        }
        return false;
    },
    
    isWeaponUnlocked(weaponId) {
        const data = this.load();
        return data.unlockedWeapons.includes(weaponId);
    },
    
    canBuySniper() {
        const data = this.load();
        return data.credits >= 100 && !data.unlockedWeapons.includes('sniper');
    },
    
    buySniper() {
        const data = this.load();
        if (data.credits >= 100 && !data.unlockedWeapons.includes('sniper')) {
            data.credits -= 100;
            data.unlockedWeapons.push('sniper');
            this.save(data);
            return true;
        }
        return false;
    },
    
    incrementGamesPlayed() {
        const data = this.load();
        data.totalGames += 1;
        this.save(data);
    }
};

window.StorageManager = StorageManager;