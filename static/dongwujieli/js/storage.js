const Storage = {
    KEYS: {
        GAME_STATE: 'animal_relay_game_state',
        LEVEL_PROGRESS: 'animal_relay_level_progress',
        BEST_TIMES: 'animal_relay_best_times',
        SETTINGS: 'animal_relay_settings'
    },

    saveGameState(state) {
        try {
            localStorage.setItem(this.KEYS.GAME_STATE, JSON.stringify(state));
            return true;
        } catch (e) {
            console.error('Failed to save game state:', e);
            return false;
        }
    },

    loadGameState() {
        try {
            const data = localStorage.getItem(this.KEYS.GAME_STATE);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Failed to load game state:', e);
            return null;
        }
    },

    clearGameState() {
        localStorage.removeItem(this.KEYS.GAME_STATE);
    },

    saveLevelProgress(level, stars, time, score) {
        try {
            const progress = this.loadAllLevelProgress();
            const existing = progress[level] || { stars: 0, bestTime: Infinity, bestScore: 0 };

            if (stars > existing.stars) {
                existing.stars = stars;
            }
            if (time < existing.bestTime) {
                existing.bestTime = time;
            }
            if (score > existing.bestScore) {
                existing.bestScore = score;
            }

            progress[level] = existing;
            localStorage.setItem(this.KEYS.LEVEL_PROGRESS, JSON.stringify(progress));
            return true;
        } catch (e) {
            console.error('Failed to save level progress:', e);
            return false;
        }
    },

    loadLevelProgress(level) {
        const progress = this.loadAllLevelProgress();
        return progress[level] || { stars: 0, bestTime: Infinity, bestScore: 0 };
    },

    loadAllLevelProgress() {
        try {
            const data = localStorage.getItem(this.KEYS.LEVEL_PROGRESS);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('Failed to load level progress:', e);
            return {};
        }
    },

    saveBestTime(level, time) {
        try {
            const times = this.loadAllBestTimes();
            if (!times[level] || time < times[level]) {
                times[level] = time;
                localStorage.setItem(this.KEYS.BEST_TIMES, JSON.stringify(times));
            }
            return true;
        } catch (e) {
            console.error('Failed to save best time:', e);
            return false;
        }
    },

    loadBestTime(level) {
        const times = this.loadAllBestTimes();
        return times[level] || null;
    },

    loadAllBestTimes() {
        try {
            const data = localStorage.getItem(this.KEYS.BEST_TIMES);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('Failed to load best times:', e);
            return {};
        }
    },

    saveSettings(settings) {
        try {
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (e) {
            console.error('Failed to save settings:', e);
            return false;
        }
    },

    loadSettings() {
        try {
            const data = localStorage.getItem(this.KEYS.SETTINGS);
            return data ? JSON.parse(data) : {
                soundEnabled: true,
                musicEnabled: true,
                showTutorial: true
            };
        } catch (e) {
            console.error('Failed to load settings:', e);
            return {
                soundEnabled: true,
                musicEnabled: true,
                showTutorial: true
            };
        }
    },

    clearAll() {
        Object.values(this.KEYS).forEach(key => localStorage.removeItem(key));
    }
};