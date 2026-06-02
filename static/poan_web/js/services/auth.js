const AuthService = {
    async login(username, password) {
        const result = await PoanApi.login(username, password);

        if (result.code === 0) {
            Storage.setToken(result.data.token);
            Storage.setUser(result.data.user);
        }

        return result;
    },

    async register(username, password, nickname) {
        const result = await PoanApi.register(username, password, nickname);

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
                await PoanApi.logout();
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

    async refreshUserInfo() {
        const result = await PoanApi.getCurrentUser();
        if (result.code === 0 && result.data) {
            Storage.setUser(result.data);
        }
        return result;
    },

    async updateProfile(data) {
        const result = await PoanApi.updateProfile(data);
        if (result.code === 0 && result.data) {
            Storage.setUser(result.data);
        }
        return result;
    },

    async changePassword(oldPassword, newPassword) {
        return await PoanApi.changePassword(oldPassword, newPassword);
    }
};

window.AuthService = AuthService;
