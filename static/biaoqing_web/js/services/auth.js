const Auth = {
    async login(username, password) {
        try {
            const result = await API.user.login(username, password);
            if (result.code === 0 && result.data) {
                Storage.setToken(result.data.token);
                Storage.setUser(result.data.user);
            }
            return result;
        } catch (error) {
            throw error;
        }
    },

    async register(username, email, password, nickname = '', phone = '') {
        try {
            const result = await API.user.register(username, email, password, nickname, phone);
            if (result.code === 0 && result.data) {
                Storage.setToken(result.data.token);
                Storage.setUser(result.data.user);
            }
            return result;
        } catch (error) {
            throw error;
        }
    },

    async logout() {
        try {
            await API.user.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            Storage.removeToken();
            Storage.removeUser();
        }
    },

    async adminLogin(username, password) {
        try {
            const result = await API.admin.login(username, password);
            if (result.code === 0 && result.data) {
                Storage.setAdminToken(result.data.token);
                Storage.setAdmin(result.data.admin);
            }
            return result;
        } catch (error) {
            throw error;
        }
    },

    async adminLogout() {
        try {
            await API.admin.logout();
        } catch (error) {
            console.error('Admin logout error:', error);
        } finally {
            Storage.removeAdminToken();
            Storage.removeAdmin();
        }
    },

    isLoggedIn() {
        return !!Storage.getToken();
    },

    isAdminLoggedIn() {
        return !!Storage.getAdminToken();
    },

    getCurrentUser() {
        return Storage.getUser();
    },

    getCurrentAdmin() {
        return Storage.getAdmin();
    },

    updateUser(user) {
        Storage.setUser(user);
    },

    async fetchCurrentUser() {
        try {
            const result = await API.user.getCurrentUser();
            if (result.code === 0 && result.data) {
                Storage.setUser(result.data);
                return result.data;
            }
            return null;
        } catch (error) {
            Storage.removeToken();
            Storage.removeUser();
            return null;
        }
    },

    async fetchCurrentAdmin() {
        try {
            const result = await API.admin.getCurrentAdmin();
            if (result.code === 0 && result.data) {
                Storage.setAdmin(result.data);
                return result.data;
            }
            return null;
        } catch (error) {
            Storage.removeAdminToken();
            Storage.removeAdmin();
            return null;
        }
    }
};

window.Auth = Auth;
