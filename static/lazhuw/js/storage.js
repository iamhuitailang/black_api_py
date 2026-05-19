const STORAGE_KEYS = {
    CANDLES: 'candle_timer_candles',
    HISTORY: 'candle_timer_history',
    SETTINGS: 'candle_timer_settings',
    STATS: 'candle_timer_stats'
};

const DEFAULT_SETTINGS = {
    flickerSpeed: 'normal',
    burnSpeed: 'normal',
    bgBrightness: 100,
    waxDrip: true,
    ambientSound: true,
    keepAwake: true,
    vibration: true,
    whiteNoise: 'none'
};

const DEFAULT_STATS = {
    totalSessions: 0,
    totalMinutes: 0,
    streakDays: 0,
    lastActiveDate: null,
    unlockedCandles: ['classic']
};

class StorageManager {
    static save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Storage save error:', e);
            return false;
        }
    }

    static load(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('Storage load error:', e);
            return defaultValue;
        }
    }

    static remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    }

    static saveCandles(candles) {
        const candleData = candles.map(c => c.toJSON());
        return this.save(STORAGE_KEYS.CANDLES, candleData);
    }

    static loadCandles() {
        return this.load(STORAGE_KEYS.CANDLES, []);
    }

    static saveHistory(history) {
        return this.save(STORAGE_KEYS.HISTORY, history);
    }

    static loadHistory() {
        return this.load(STORAGE_KEYS.HISTORY, []);
    }

    static addHistoryEntry(entry) {
        const history = this.loadHistory();
        history.unshift(entry);
        if (history.length > 100) {
            history.length = 100;
        }
        this.saveHistory(history);
    }

    static clearHistory() {
        return this.remove(STORAGE_KEYS.HISTORY);
    }

    static saveSettings(settings) {
        return this.save(STORAGE_KEYS.SETTINGS, settings);
    }

    static loadSettings() {
        const saved = this.load(STORAGE_KEYS.SETTINGS, {});
        const settings = { ...DEFAULT_SETTINGS, ...saved };
        if (settings.bgBrightness !== undefined) {
            settings.bgBrightness = Math.max(20, settings.bgBrightness);
        }
        return settings;
    }

    static saveStats(stats) {
        return this.save(STORAGE_KEYS.STATS, stats);
    }

    static loadStats() {
        const saved = this.load(STORAGE_KEYS.STATS, {});
        return { ...DEFAULT_STATS, ...saved };
    }

    static updateStats(sessionMinutes) {
        const stats = this.loadStats();
        stats.totalSessions += 1;
        stats.totalMinutes += sessionMinutes;
        
        const today = new Date().toDateString();
        if (stats.lastActiveDate) {
            const lastDate = new Date(stats.lastActiveDate);
            const todayDate = new Date(today);
            const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                stats.streakDays += 1;
            } else if (diffDays > 1) {
                stats.streakDays = 1;
            }
        } else {
            stats.streakDays = 1;
        }
        
        stats.lastActiveDate = today;
        this.saveStats(stats);
        return stats;
    }

    static unlockCandle(candleType) {
        const stats = this.loadStats();
        if (!stats.unlockedCandles.includes(candleType)) {
            stats.unlockedCandles.push(candleType);
            this.saveStats(stats);
            return true;
        }
        return false;
    }

    static checkUnlocks() {
        const stats = this.loadStats();
        const unlocks = [];
        
        if (stats.totalSessions >= 10 && !stats.unlockedCandles.includes('purple')) {
            unlocks.push('purple');
        }
        if (stats.totalSessions >= 50 && !stats.unlockedCandles.includes('festival')) {
            unlocks.push('festival');
        }
        if (stats.streakDays >= 7 && !stats.unlockedCandles.includes('forest')) {
            unlocks.push('forest');
        }
        
        const today = new Date();
        const isHalloween = today.getMonth() === 9 && today.getDate() >= 25 && today.getDate() <= 31;
        if (isHalloween && !stats.unlockedCandles.includes('pumpkin')) {
            unlocks.push('pumpkin');
        }
        
        unlocks.forEach(type => this.unlockCandle(type));
        
        return unlocks;
    }
}

export { StorageManager, STORAGE_KEYS, DEFAULT_SETTINGS, DEFAULT_STATS };
