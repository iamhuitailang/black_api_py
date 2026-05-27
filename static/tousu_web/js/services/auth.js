const AuthService = {
    async login(username, password) {
        try {
            const result = await ApiService.post('/tousu/user/login', { username, password });
            if (result.code === 0) {
                Storage.setToken(result.data.token);
                Storage.setUser(result.data.user);
            }
            return result;
        } catch (error) {
            return { code: 1, msg: error.message, data: null };
        }
    },

    async register(userData) {
        try {
            const result = await ApiService.post('/tousu/user/register', userData);
            if (result.code === 0) {
                Storage.setToken(result.data.token);
                Storage.setUser(result.data.user);
            }
            return result;
        } catch (error) {
            return { code: 1, msg: error.message, data: null };
        }
    },

    async logout() {
        try {
            const result = await ApiService.post('/tousu/user/logout');
            Storage.removeToken();
            Storage.removeUser();
            return result;
        } catch (error) {
            Storage.removeToken();
            Storage.removeUser();
            return { code: 0, msg: 'success', data: null };
        }
    },

    isLoggedIn() {
        const token = Storage.getToken();
        return !!token;
    },

    getUser() {
        return Storage.getUser();
    },

    getRole() {
        const user = this.getUser();
        return user?.role || 'student';
    },

    isAdmin() {
        return this.getRole() === 'admin';
    },

    isStaff() {
        return this.getRole() === 'staff';
    },

    isStudent() {
        return this.getRole() === 'student';
    }
};