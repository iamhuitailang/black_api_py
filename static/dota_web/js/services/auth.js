const AuthService = {
    isLoggedIn() {
        const token = Storage.getToken();
        return !!token;
    },

    async login(username, password) {
        try {
            const result = await DotaApi.login(username, password);

            if (result.code === 0) {
                Storage.setToken(result.data.token);
                Storage.setUser(result.data.user);
                return { success: true, data: result.data };
            } else {
                return { success: false, message: result.msg };
            }
        } catch (error) {
            return { success: false, message: error.message || '登录失败' };
        }
    },

    async register(username, password, nickname) {
        try {
            const result = await DotaApi.register(username, password, nickname);

            if (result.code === 0) {
                Storage.setToken(result.data.token);
                Storage.setUser(result.data.user);
                return { success: true, data: result.data };
            } else {
                return { success: false, message: result.msg };
            }
        } catch (error) {
            return { success: false, message: error.message || '注册失败' };
        }
    },

    async logout() {
        try {
            await DotaApi.logout();
        } catch (e) {
            console.error('Logout API error:', e);
        }

        Storage.removeToken();
        Storage.removeUser();
        Storage.removeCurrentHero();

        return { success: true };
    },

    getUser() {
        return Storage.getUser();
    },

    getToken() {
        return Storage.getToken();
    },

    async refreshUserInfo() {
        try {
            const result = await DotaApi.getUserInfo();
            if (result.code === 0) {
                Storage.setUser(result.data.user);
                return result.data;
            }
        } catch (e) {
            console.error('Refresh user info error:', e);
        }
        return null;
    },

    updateUser(user) {
        Storage.setUser(user);
    }
};
