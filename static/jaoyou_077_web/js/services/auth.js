const AuthService = {
    async login(phone, password) {
        return await Api.post('/jaoyou/user/login', { phone, password });
    },

    async register(phone, password, nickname, gender) {
        return await Api.post('/jaoyou/user/register', { phone, password, nickname, gender });
    },

    async logout() {
        const result = await Api.post('/jaoyou/user/logout');
        Storage.clear();
        return result;
    },

    async getCurrentUser() {
        return await Api.get('/jaoyou/user/current/get');
    },

    isLoggedIn() {
        return !!Storage.getToken();
    }
};
