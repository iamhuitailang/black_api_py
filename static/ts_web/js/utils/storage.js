const Storage = {
    set(key, value) {
        if (typeof value === 'object') {
            value = JSON.stringify(value);
        }
        localStorage.setItem(key, value);
    },

    get(key) {
        const value = localStorage.getItem(key);
        if (!value) return null;
        try {
            return JSON.parse(value);
        } catch (e) {
            return value;
        }
    },

    remove(key) {
        localStorage.removeItem(key);
    },

    clear() {
        localStorage.clear();
    },

    getToken() {
        return this.get('ts_user_token');
    },

    setToken(token) {
        this.set('ts_user_token', token);
    },

    removeToken() {
        this.remove('ts_user_token');
    },

    getUser() {
        return this.get('ts_user');
    },

    setUser(user) {
        this.set('ts_user', user);
    },

    removeUser() {
        this.remove('ts_user');
    },

    getDailyGoal() {
        return this.get('ts_daily_goal') || 1000;
    },

    setDailyGoal(goal) {
        this.set('ts_daily_goal', goal);
    },

    getReminderSetting() {
        return this.get('ts_reminder') || { enabled: false, time: '18:00' };
    },

    setReminderSetting(setting) {
        this.set('ts_reminder', setting);
    }
};
