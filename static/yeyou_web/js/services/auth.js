const AuthService = {
    isLoggedIn() {
        const token = Storage.getToken();
        return !!token;
    },

    async login(phone, password) {
        const result = await ApiService.post('/yeyou/user/login', {
            phone,
            password
        });

        if (result.code === 0 && result.data) {
            Storage.setToken(result.data.token);
            Storage.setUser(result.data.user);
        }

        return result;
    },

    async register(phone, password, nickname = '') {
        const result = await ApiService.post('/yeyou/user/register', {
            phone,
            password,
            nickname
        });

        if (result.code === 0 && result.data) {
            Storage.setToken(result.data.token);
            Storage.setUser(result.data.user);
        }

        return result;
    },

    async logout() {
        try {
            await ApiService.post('/yeyou/user/logout');
        } catch (e) {
            console.error('Logout API error:', e);
        }
        Storage.removeToken();
        Storage.removeUser();
    },

    async getCurrentUser() {
        const result = await ApiService.get('/yeyou/user/current/get');
        if (result.code === 0 && result.data) {
            Storage.setUser(result.data);
        }
        return result;
    },

    getUser() {
        return Storage.getUser();
    },

    getToken() {
        return Storage.getToken();
    }
};

window.AuthService = AuthService;
