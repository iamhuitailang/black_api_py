const AuthService = {
    async login(phone, password) {
        const result = await ApiService.post('/ts/user/login', {
            phone,
            password
        });

        if (result.code === 0) {
            Storage.setToken(result.data.token);
            Storage.setUser(result.data.user);
        }

        return result;
    },

    async register(phone, password, nickname = '') {
        const result = await ApiService.post('/ts/user/register', {
            phone,
            password,
            nickname
        });

        if (result.code === 0) {
            Storage.setToken(result.data.token);
            Storage.setUser(result.data.user);
        }

        return result;
    },

    async logout() {
        const token = Storage.getToken();
        if (token) {
            try {
                await ApiService.post('/ts/user/logout');
            } catch (e) {
                console.error('Logout error:', e);
            }
        }
        Storage.removeToken();
        Storage.removeUser();
    },

    isLoggedIn() {
        return !!Storage.getToken();
    },

    getCurrentUser() {
        return Storage.getUser();
    },

    async getCurrentUserInfo() {
        const result = await ApiService.get('/ts/user/current/get');
        if (result.code === 0 && result.data) {
            Storage.setUser(result.data);
        }
        return result;
    },

    async changePassword(oldPassword, newPassword) {
        return await ApiService.post('/ts/user/password/change', {
            old_password: oldPassword,
            new_password: newPassword
        });
    },

    async updateProfile(data) {
        const result = await ApiService.post('/ts/user/profile/update', data);
        if (result.code === 0 && result.data) {
            Storage.setUser(result.data);
        }
        return result;
    },

    async updateDailyGoal(dailyGoal) {
        const result = await ApiService.post('/ts/user/goal/update', {
            daily_goal: dailyGoal
        });
        if (result.code === 0 && result.data) {
            Storage.setUser(result.data);
            Storage.setDailyGoal(dailyGoal);
        }
        return result;
    },

    async getUserStats() {
        return await ApiService.get('/ts/user/stats/get');
    }
};
