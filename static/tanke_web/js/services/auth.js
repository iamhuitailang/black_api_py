const AuthService = {
    async login(username, password) {
        try {
            const result = await TankeApi.login(username, password);
            
            if (result.code === 0) {
                Storage.setToken(result.data.token);
                Storage.setUser(result.data.user);
                Storage.setTank(result.data.tank);
            }
            
            return result;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    async register(username, password, nickname = '') {
        try {
            const result = await TankeApi.register(username, password, nickname);
            
            if (result.code === 0) {
                Storage.setToken(result.data.token);
                Storage.setUser(result.data.user);
                Storage.setTank(result.data.tank);
            }
            
            return result;
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    },

    async logout() {
        try {
            await TankeApi.logout();
        } catch (e) {
            console.error('Logout error:', e);
        }
        
        Storage.removeToken();
        Storage.removeUser();
        Storage.removeTank();
    },

    isLoggedIn() {
        return !!Storage.getToken();
    },

    getCurrentUser() {
        return Storage.getUser();
    },

    getCurrentTank() {
        return Storage.getTank();
    },

    async refreshUserInfo() {
        try {
            const result = await TankeApi.getCurrentUser();
            if (result.code === 0 && result.data) {
                Storage.setUser(result.data.user);
                Storage.setTank(result.data.tank);
            }
            return result;
        } catch (error) {
            console.error('Refresh user info error:', error);
            throw error;
        }
    }
};

window.Auth = AuthService;
