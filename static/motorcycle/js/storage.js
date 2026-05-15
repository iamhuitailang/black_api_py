class StorageManager {
    constructor() {
        this.defaultData = {
            highScore: 0,
            currentLevel: 1,
            totalScore: 0,
            tricksCompleted: 0,
            bestCombo: 0,
            unlockedMotorcycles: ['offroad'],
            motorcycle: 'offroad',
            gameState: null
        };
    }

    load() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                return { ...this.defaultData, ...JSON.parse(data) };
            }
        } catch (e) {
            console.error('Failed to load game data:', e);
        }
        return { ...this.defaultData };
    }

    save(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Failed to save game data:', e);
            return false;
        }
    }

    saveGameState(gameState) {
        const data = this.load();
        data.gameState = gameState;
        return this.save(data);
    }

    loadGameState() {
        const data = this.load();
        return data.gameState;
    }

    clearGameState() {
        const data = this.load();
        data.gameState = null;
        return this.save(data);
    }

    updateScore(score) {
        const data = this.load();
        data.totalScore += score;
        if (score > data.highScore) {
            data.highScore = score;
        }
        return this.save(data);
    }

    unlockMotorcycle(motorcycleId) {
        const data = this.load();
        if (!data.unlockedMotorcycles.includes(motorcycleId)) {
            data.unlockedMotorcycles.push(motorcycleId);
            return this.save(data);
        }
        return false;
    }

    setCurrentMotorcycle(motorcycleId) {
        const data = this.load();
        data.motorcycle = motorcycleId;
        return this.save(data);
    }

    setLevel(level) {
        const data = this.load();
        data.currentLevel = level;
        return this.save(data);
    }

    updateStats(tricksCount, maxCombo) {
        const data = this.load();
        data.tricksCompleted += tricksCount;
        if (maxCombo > data.bestCombo) {
            data.bestCombo = maxCombo;
        }
        return this.save(data);
    }

    checkUnlocks(score, level) {
        const data = this.load();
        const unlocks = [];

        for (const [id, moto] of Object.entries(CONFIG.MOTORCYCLES)) {
            if (data.unlockedMotorcycles.includes(id)) continue;
            
            if (moto.unlockScore && score >= moto.unlockScore) {
                unlocks.push(id);
            }
            if (moto.unlockLevel && level >= moto.unlockLevel) {
                unlocks.push(id);
            }
        }

        unlocks.forEach(id => this.unlockMotorcycle(id));
        return unlocks;
    }
}

const storage = new StorageManager();