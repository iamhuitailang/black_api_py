const Auth = {
    async init() {
        const token = Storage.getToken();
        if (token) {
            const result = await Api.auth.getCurrent();
            if (result.code === 0 && result.data) {
                Storage.setUser(result.data);
                return result.data;
            } else {
                Storage.clear();
                return null;
            }
        }
        return null;
    },

    async login(username, password) {
        const result = await Api.auth.login(username, password);
        if (result.code === 0 && result.data) {
            Storage.setToken(result.data.token);
            Storage.setUser(result.data.user);
            return { success: true, user: result.data.user };
        }
        return { success: false, msg: result.msg || '登录失败' };
    },

    async register(username, password, nickname) {
        const result = await Api.auth.register(username, password, nickname);
        if (result.code === 0 && result.data) {
            Storage.setToken(result.data.token);
            Storage.setUser(result.data.user);
            return { success: true, user: result.data.user };
        }
        return { success: false, msg: result.msg || '注册失败' };
    },

    async logout() {
        await Api.auth.logout();
        Storage.clear();
    },

    async refreshUser() {
        const result = await Api.auth.getCurrent();
        if (result.code === 0 && result.data) {
            Storage.setUser(result.data);
            return result.data;
        }
        return null;
    },

    isLoggedIn() {
        return !!Storage.getToken() && !!Storage.getUser();
    },

    isAdmin() {
        const user = Storage.getUser();
        return user && user.role === 1;
    },

    getCurrentUser() {
        return Storage.getUser();
    }
};
