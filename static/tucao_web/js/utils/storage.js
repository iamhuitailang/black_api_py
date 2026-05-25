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
        return this.get('tucao_user_token');
    },

    setToken(token) {
        this.set('tucao_user_token', token);
    },

    removeToken() {
        this.remove('tucao_user_token');
    },

    getUser() {
        return this.get('tucao_user_info');
    },

    setUser(user) {
        this.set('tucao_user_info', user);
    },

    removeUser() {
        this.remove('tucao_user_info');
    },

    getDeviceId() {
        let deviceId = this.get('tucao_device_id');
        if (!deviceId) {
            deviceId = 'dev_' + Math.random().toString(36).substr(2) + Date.now().toString(36);
            this.set('tucao_device_id', deviceId);
        }
        return deviceId;
    }
};
