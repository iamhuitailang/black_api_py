class StorageManager {
    constructor() {
        this.storageKey = CONFIG.STORAGE_KEY;
        this.saveTimeout = null;
        this.lastSaveState = null;
    }

    saveGame(gameState) {
        try {
            const saveData = {
                version: 1,
                timestamp: Date.now(),
                gold: gameState.gold,
                lives: gameState.lives,
                currentWave: gameState.currentWave,
                waveInProgress: gameState.waveInProgress,
                towers: this.serializeTowers(gameState.towers),
                towerSlots: gameState.towerSlots,
                hero: this.serializeHero(gameState.hero),
                enemiesKilled: gameState.enemiesKilled,
                totalDamageDealt: gameState.totalDamageDealt
            };
            
            localStorage.setItem(this.storageKey, JSON.stringify(saveData));
            return true;
        } catch (error) {
            console.error('保存游戏失败:', error);
            return false;
        }
    }

    loadGame() {
        try {
            const saveData = localStorage.getItem(this.storageKey);
            if (!saveData) return null;

            const parsed = JSON.parse(saveData);
            return {
                gold: parsed.gold,
                lives: parsed.lives,
                currentWave: parsed.currentWave,
                waveInProgress: parsed.waveInProgress,
                towers: parsed.towers,
                towerSlots: parsed.towerSlots,
                hero: parsed.hero,
                enemiesKilled: parsed.enemiesKilled || 0,
                totalDamageDealt: parsed.totalDamageDealt || 0
            };
        } catch (error) {
            console.error('加载游戏失败:', error);
            return null;
        }
    }

    hasSaveData() {
        return localStorage.getItem(this.storageKey) !== null;
    }

    clearSave() {
        localStorage.removeItem(this.storageKey);
    }

    serializeTowers(towers) {
        return towers.map(tower => ({
            type: tower.type,
            level: tower.level,
            x: tower.x,
            y: tower.y,
            slotIndex: tower.slotIndex,
            totalDamage: tower.totalDamage || 0,
            kills: tower.kills || 0
        }));
    }

    serializeHero(hero) {
        if (!hero) return null;
        return {
            type: hero.type,
            x: hero.x,
            y: hero.y,
            hp: hero.hp,
            maxHp: hero.maxHp,
            skillCooldown: hero.skillCooldown || 0
        };
    }

    autoSave(gameState) {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        
        this.saveTimeout = setTimeout(() => {
            this.saveGame(gameState);
            this.saveTimeout = null;
        }, 2000);
    }
    
    saveNow(gameState) {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
            this.saveTimeout = null;
        }
        this.saveGame(gameState);
    }
}

const storage = new StorageManager();
