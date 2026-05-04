const Storage = {
    PREFIX: 'shuati_',

    set(key, value) {
        try {
            const data = typeof value === 'object' ? JSON.stringify(value) : value;
            localStorage.setItem(this.PREFIX + key, data);
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    },

    get(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(this.PREFIX + key);
            if (!data) return defaultValue;
            
            try {
                return JSON.parse(data);
            } catch {
                return data;
            }
        } catch (e) {
            console.error('Storage get error:', e);
            return defaultValue;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(this.PREFIX + key);
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    },

    clear() {
        try {
            const keys = this.getAllKeys();
            keys.forEach(key => {
                localStorage.removeItem(this.PREFIX + key);
            });
            return true;
        } catch (e) {
            console.error('Storage clear error:', e);
            return false;
        }
    },

    getAllKeys() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.PREFIX)) {
                keys.push(key.replace(this.PREFIX, ''));
            }
        }
        return keys;
    },

    getSettings() {
        return this.get('settings', {
            darkMode: false,
            fontSize: 'normal',
            notifications: true,
            autoNext: true,
            showAnswerAfterSelect: true
        });
    },

    saveSettings(settings) {
        return this.set('settings', settings);
    },

    getDailyPlan() {
        return this.get('dailyPlan', {
            dailyNewQuestions: 20,
            dailyReviewQuestions: 30,
            enabled: true
        });
    },

    saveDailyPlan(plan) {
        return this.set('dailyPlan', plan);
    },

    getStudyState() {
        return this.get('studyState', {
            currentRoute: 'home',
            currentBankId: null,
            currentQuestionIndex: 0,
            studyMode: 'sequential',
            answeredQuestions: [],
            markedQuestions: []
        });
    },

    saveStudyState(state) {
        return this.set('studyState', state);
    },

    getTodayStudy(date = new Date().toDateString()) {
        const dailyRecords = this.get('dailyRecords', {});
        return dailyRecords[date] || {
            date: date,
            newQuestions: 0,
            reviewQuestions: 0,
            correctCount: 0,
            wrongCount: 0,
            studyTime: 0
        };
    },

    saveTodayStudy(record, date = new Date().toDateString()) {
        const dailyRecords = this.get('dailyRecords', {});
        dailyRecords[date] = { ...record, date };
        return this.set('dailyRecords', dailyRecords);
    },

    updateTodayStudy(updates, date = new Date().toDateString()) {
        const record = this.getTodayStudy(date);
        Object.assign(record, updates);
        return this.saveTodayStudy(record, date);
    }
};

window.Storage = Storage;
