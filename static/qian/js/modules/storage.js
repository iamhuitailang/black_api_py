const Storage = {
    STORAGE_KEY: 'fortune_lottery',
    
    getTodayString() {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    },

    getDateSeed(dateStr) {
        let hash = 0;
        for (let i = 0; i < dateStr.length; i++) {
            const char = dateStr.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    },

    saveFortune(fortuneData, isManual = false) {
        const today = this.getTodayString();
        const data = {
            date: today,
            fortune: fortuneData,
            isManual: isManual,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
            return false;
        }
    },

    loadFortune() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.error('Failed to load from localStorage:', e);
        }
        return null;
    },

    isTodayFortune() {
        const saved = this.loadFortune();
        if (!saved) return false;
        return saved.date === this.getTodayString();
    },

    hasManualFortuneToday() {
        const saved = this.loadFortune();
        if (!saved) return false;
        return saved.date === this.getTodayString() && saved.isManual === true;
    },

    clearStorage() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('Failed to clear localStorage:', e);
            return false;
        }
    },

    saveHistory(fortuneData) {
        const HISTORY_KEY = 'fortune_history';
        try {
            let history = [];
            const savedHistory = localStorage.getItem(HISTORY_KEY);
            if (savedHistory) {
                history = JSON.parse(savedHistory);
            }
            
            history.unshift({
                date: this.getTodayString(),
                fortune: fortuneData,
                timestamp: Date.now()
            });
            
            if (history.length > 30) {
                history = history.slice(0, 30);
            }
            
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
            return true;
        } catch (e) {
            console.error('Failed to save history:', e);
            return false;
        }
    },

    getHistory() {
        const HISTORY_KEY = 'fortune_history';
        try {
            const data = localStorage.getItem(HISTORY_KEY);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.error('Failed to load history:', e);
        }
        return [];
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
}
