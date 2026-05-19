const Storage = {
    getSaveData() {
        try {
            const data = localStorage.getItem(GameConfig.STORAGE_KEY);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.error('读取存档失败:', e);
        }
        return this.getDefaultData();
    },

    saveData(data) {
        try {
            localStorage.setItem(GameConfig.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('保存存档失败:', e);
            return false;
        }
    },

    getDefaultData() {
        return {
            bestTime: null,
            totalScore: 0,
            selectedBoat: 'green',
            unlockedBoats: ['green'],
            gameState: null
        };
    },

    saveGameState(gameState) {
        const data = this.getSaveData();
        data.gameState = gameState;
        this.saveData(data);
    },

    loadGameState() {
        const data = this.getSaveData();
        return data.gameState;
    },

    clearGameState() {
        const data = this.getSaveData();
        data.gameState = null;
        this.saveData(data);
    },

    updateBestTime(time) {
        const data = this.getSaveData();
        if (!data.bestTime || time < data.bestTime) {
            data.bestTime = time;
            this.saveData(data);
            return true;
        }
        return false;
    },

    addScore(score) {
        const data = this.getSaveData();
        data.totalScore += score;
        this.saveData(data);
        return data.totalScore;
    },

    getBestTime() {
        const data = this.getSaveData();
        return data.bestTime;
    },

    getTotalScore() {
        const data = this.getSaveData();
        return data.totalScore;
    },

    setSelectedBoat(boatType) {
        const data = this.getSaveData();
        data.selectedBoat = boatType;
        this.saveData(data);
    },

    getSelectedBoat() {
        const data = this.getSaveData();
        return data.selectedBoat || 'green';
    },

    unlockBoat(boatType) {
        const data = this.getSaveData();
        if (!data.unlockedBoats.includes(boatType)) {
            data.unlockedBoats.push(boatType);
            this.saveData(data);
            return true;
        }
        return false;
    },

    isBoatUnlocked(boatType) {
        const data = this.getSaveData();
        return data.unlockedBoats.includes(boatType);
    },

    formatTime(ms) {
        if (ms === null || ms === undefined) return '--:--:--';
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const milliseconds = Math.floor((ms % 1000) / 10);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(milliseconds).padStart(2, '0')}`;
    }
};
