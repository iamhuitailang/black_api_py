const Auth = {
    STORAGE_KEY_TOKEN: 'dd_token',
    STORAGE_KEY_USER: 'dd_user',

    getToken() {
        return Utils.storage.get(this.STORAGE_KEY_TOKEN, '');
    },

    setToken(token) {
        Utils.storage.set(this.STORAGE_KEY_TOKEN, token);
    },

    removeToken() {
        Utils.storage.remove(this.STORAGE_KEY_TOKEN);
    },

    getUser() {
        return Utils.storage.get(this.STORAGE_KEY_USER, null);
    },

    setUser(user) {
        Utils.storage.set(this.STORAGE_KEY_USER, user);
    },

    removeUser() {
        Utils.storage.remove(this.STORAGE_KEY_USER);
    },

    isLoggedIn() {
        const token = this.getToken();
        return !!token;
    },

    async login(phone, password) {
        const result = await Api.user.login(phone, password);
        if (result.data) {
            this.setToken(result.data.token);
            this.setUser(result.data.user);
        }
        return result;
    },

    async register(phone, password) {
        const result = await Api.user.register(phone, password);
        if (result.data) {
            this.setToken(result.data.token);
            this.setUser(result.data.user);
        }
        return result;
    },

    async logout() {
        try {
            if (this.getToken()) {
                await Api.user.logout();
            }
        } catch (e) {
            console.error('Logout error:', e);
        } finally {
            this.removeToken();
            this.removeUser();
        }
    },

    async refreshUser() {
        try {
            const result = await Api.user.getCurrent();
            if (result.data) {
                this.setUser(result.data);
            }
            return result;
        } catch (e) {
            console.error('Refresh user error:', e);
            throw e;
        }
    },

    updateProfile(updates) {
        const user = this.getUser();
        if (user) {
            const updatedUser = { ...user, ...updates };
            this.setUser(updatedUser);
        }
    },

    getUserId() {
        const user = this.getUser();
        return user ? user.id : null;
    },

    getNickname() {
        const user = this.getUser();
        return user ? (user.nickname || user.phone) : '';
    },

    getAvatarUrl() {
        const user = this.getUser();
        return user ? (user.avatar_url || '') : '';
    },

    getCreditScore() {
        const user = this.getUser();
        return user ? (user.credit_score || 0) : 0;
    },

    isVerified() {
        const user = this.getUser();
        return user ? !!user.is_verified : false;
    },

    requireAuth(redirect = 'login') {
        if (!this.isLoggedIn()) {
            Router.navigate(redirect);
            return false;
        }
        return true;
    }
};

window.Auth = Auth;
