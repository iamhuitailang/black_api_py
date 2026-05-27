const AuthService = {
    isLoggedIn() {
        return !!Storage.getToken();
    },

    async login(username, password) {
        const result = await ApiService.user.login({ username, password });
        if (result.code === 0) {
            Storage.setToken(result.data.token);
            Storage.setUser(result.data.user);
        }
        return result;
    },

    async register(data) {
        return await ApiService.user.register(data);
    },

    async logout() {
        try {
            await ApiService.user.logout();
        } catch (e) {
            console.log('Logout API error:', e);
        }
        Storage.removeToken();
        Storage.removeUser();
        Router.navigate('login');
    },

    getUser() {
        return Storage.getUser();
    },

    setUser(user) {
        Storage.setUser(user);
    },

    getToken() {
        return Storage.getToken();
    },

    async refreshProfile() {
        try {
            const result = await ApiService.user.getProfile();
            if (result.code === 0) {
                Storage.setUser(result.data);
                return result.data;
            }
        } catch (e) {
            console.log('Refresh profile error:', e);
        }
        return null;
    },

    canPublish() {
        const user = this.getUser();
        if (!user) return false;
        return user.role === 'seller' || user.role === 'both';
    }
};

window.AuthService = AuthService;
