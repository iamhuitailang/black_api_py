const AuthService = {
    async login(username, password) {
        const result = await ApiService.post('/jianshen/auth/login', {
            username,
            password
        });

        if (result.code === 0) {
            Storage.setToken(result.data.token);
            Storage.setUser(result.data.user);
        }

        return result;
    },

    async register(username, password, nickname = '', phone = '', role = 0) {
        const result = await ApiService.post('/jianshen/auth/register', {
            username,
            password,
            nickname,
            phone,
            role
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
                await ApiService.post('/jianshen/auth/logout');
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

    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.role === 1;
    },

    async getCurrentUserInfo() {
        const result = await ApiService.get('/jianshen/auth/current/get');
        if (result.code === 0 && result.data) {
            Storage.setUser(result.data);
        }
        return result;
    },

    async changePassword(oldPassword, newPassword) {
        return await ApiService.post('/jianshen/auth/password/change', {
            old_password: oldPassword,
            new_password: newPassword
        });
    },

    async updateProfile(data) {
        const result = await ApiService.post('/jianshen/auth/profile/update', data);
        if (result.code === 0 && result.data) {
            Storage.setUser(result.data);
        }
        return result;
    }
};

window.AuthService = AuthService;
