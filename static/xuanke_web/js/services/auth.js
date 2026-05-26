const Auth = {
    async login(username, password) {
        const response = await API.user.login({ username, password });
        if (response.code === 0) {
            Storage.setToken(response.data.token);
            Storage.setUser(response.data.user);
        }
        return response;
    },

    async register(userData) {
        const response = await API.user.register(userData);
        if (response.code === 0) {
            Storage.setToken(response.data.token);
            Storage.setUser(response.data.user);
        }
        return response;
    },

    async logout() {
        try {
            await API.user.logout();
        } catch (e) {
            console.error('Logout error:', e);
        }
        Storage.clear();
    },

    isLoggedIn() {
        return !!Storage.getToken() && !!Storage.getUser();
    },

    getCurrentUser() {
        return Storage.getUser();
    },

    getToken() {
        return Storage.getToken();
    },

    async refreshUser() {
        const response = await API.user.getCurrent();
        if (response.code === 0 && response.data) {
            Storage.setUser(response.data);
            return response.data;
        }
        return null;
    },

    hasRole(role) {
        const user = this.getCurrentUser();
        if (!user) return false;
        return user.role === role;
    },

    isStudent() {
        return this.hasRole('student');
    },

    isTeacher() {
        return this.hasRole('teacher');
    },

    isAdmin() {
        return this.hasRole('admin');
    },

    requireAuth() {
        if (!this.isLoggedIn()) {
            Router.navigate('/login');
            return false;
        }
        return true;
    },

    requireRole(role) {
        if (!this.requireAuth()) return false;
        if (!this.hasRole(role)) {
            Toast.error('无权限访问');
            return false;
        }
        return true;
    }
};
