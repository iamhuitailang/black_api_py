const AuthService = {
    async login(username, password) {
        const result = await ApiService.post('/jt/user/login', {
            username,
            password
        });

        if (result.code === 0) {
            Storage.setToken(result.data.token);
            Storage.setUser(result.data.user);
        }

        return result;
    },

    async register(username, password, nickname = '') {
        const result = await ApiService.post('/jt/user/register', {
            username,
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
                await ApiService.post('/jt/user/logout');
            } catch (e) {
                console.error('Logout error:', e);
            }
        }
        Storage.removeToken();
        Storage.removeUser();
        Storage.removeGameState();
    },

    isLoggedIn() {
        return !!Storage.getToken();
    },

    getCurrentUser() {
        return Storage.getUser();
    },

    async getCurrentUserInfo() {
        const result = await ApiService.get('/jt/user/current/get');
        if (result.code === 0 && result.data) {
            Storage.setUser(result.data);
        }
        return result;
    },

    async updateProfile(data) {
        const result = await ApiService.post('/jt/user/profile/update', data);
        if (result.code === 0 && result.data) {
            Storage.setUser(result.data);
        }
        return result;
    }
};

window.AuthService = AuthService;
