const Storage = {
    KEYS: {
        DOG_PROFILE: 'dog_profile',
        SCHEDULE: 'dog_schedule',
        CHECKINS: 'dog_checkins',
        APP_STATE: 'dog_app_state'
    },

    save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('保存数据失败:', e);
            return false;
        }
    },

    load(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('加载数据失败:', e);
            return defaultValue;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('删除数据失败:', e);
            return false;
        }
    },

    saveProfile(profile) {
        return this.save(this.KEYS.DOG_PROFILE, profile);
    },

    loadProfile() {
        return this.load(this.KEYS.DOG_PROFILE, {
            name: '',
            breed: '',
            age: '',
            weight: '',
            poopHabits: '',
            peeHabits: '',
            avatar: '🐕'
        });
    },

    saveSchedule(schedule) {
        return this.save(this.KEYS.SCHEDULE, schedule);
    },

    loadSchedule() {
        const defaultSchedule = {
            morning: { enabled: true, time: '07:00', duration: 25, name: '早晨', icon: '🌞' },
            noon: { enabled: true, time: '12:00', duration: 15, name: '中午', icon: '☀️' },
            evening: { enabled: true, time: '18:00', duration: 30, name: '傍晚', icon: '🌙' },
            night: { enabled: true, time: '21:00', duration: 15, name: '夜间', icon: '🌟' }
        };
        return this.load(this.KEYS.SCHEDULE, defaultSchedule);
    },

    saveCheckins(checkins) {
        return this.save(this.KEYS.CHECKINS, checkins);
    },

    loadCheckins() {
        return this.load(this.KEYS.CHECKINS, []);
    },

    addCheckin(checkin) {
        const checkins = this.loadCheckins();
        checkin.id = Date.now();
        checkin.timestamp = new Date().toISOString();
        checkins.unshift(checkin);
        return this.saveCheckins(checkins);
    },

    getCheckinsByDate(dateStr) {
        const checkins = this.loadCheckins();
        return checkins.filter(c => c.timestamp.startsWith(dateStr));
    },

    saveAppState(state) {
        return this.save(this.KEYS.APP_STATE, state);
    },

    loadAppState() {
        return this.load(this.KEYS.APP_STATE, {
            currentPage: 'profile',
            lastVisit: new Date().toISOString()
        });
    },

    exportAll() {
        return {
            profile: this.loadProfile(),
            schedule: this.loadSchedule(),
            checkins: this.loadCheckins(),
            appState: this.loadAppState()
        };
    },

    importAll(data) {
        try {
            if (data.profile) this.saveProfile(data.profile);
            if (data.schedule) this.saveSchedule(data.schedule);
            if (data.checkins) this.saveCheckins(data.checkins);
            if (data.appState) this.saveAppState(data.appState);
            return true;
        } catch (e) {
            console.error('导入数据失败:', e);
            return false;
        }
    },

    clearAll() {
        Object.values(this.KEYS).forEach(key => this.remove(key));
    }
};