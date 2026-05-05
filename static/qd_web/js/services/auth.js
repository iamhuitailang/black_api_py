const AuthService = {
    isLoggedIn() {
        const token = Storage.getToken();
        return !!token;
    },

    async login(phone, password) {
        const result = await UserApi.login(phone, password);
        if (result.code === 0) {
            Storage.setToken(result.data.token);
            Storage.setUser(result.data.user);
        }
        return result;
    },

    async register(phone, password, nickname = '') {
        const result = await UserApi.register(phone, password, nickname);
        if (result.code === 0) {
            Storage.setToken(result.data.token);
            Storage.setUser(result.data.user);
        }
        return result;
    },

    async logout() {
        try {
            await UserApi.logout();
        } catch (e) {
            console.log('Logout API error:', e);
        }
        Storage.removeToken();
        Storage.removeUser();
        return { code: 0, msg: 'success', data: null };
    },

    getUser() {
        return Storage.getUser();
    },

    async refreshUser() {
        const result = await UserApi.getCurrentUser();
        if (result.code === 0) {
            Storage.setUser(result.data);
        }
        return result;
    },

    requestNotificationPermission() {
        if ('Notification' in window) {
            return Notification.requestPermission();
        }
        return Promise.resolve('denied');
    },

    scheduleNotification(time = '09:00') {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            return false;
        }

        const now = new Date();
        const [hours, minutes] = time.split(':').map(Number);
        const targetTime = new Date();
        targetTime.setHours(hours, minutes, 0, 0);

        if (targetTime <= now) {
            targetTime.setDate(targetTime.getDate() + 1);
        }

        const timeUntil = targetTime - now;
        
        setTimeout(() => {
            this.showSignNotification();
            this.scheduleNotification(time);
        }, timeUntil);

        return true;
    },

    showSignNotification() {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            return;
        }

        const notification = new Notification('每日签到提醒', {
            body: '别忘了今日签到，连续签到可获得更多奖励！',
            icon: '',
            tag: 'sign-reminder'
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    },

    checkAndShowNotification() {
        if (!Storage.getNotificationEnabled()) {
            return;
        }

        if (this.isLoggedIn()) {
            this.scheduleNotification();
        }
    }
};
