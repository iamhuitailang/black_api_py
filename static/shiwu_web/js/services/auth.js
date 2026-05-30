const AuthService = {
    async login(phone, password) {
        const result = await ApiService.post('/shiwu/user/login', {
            phone,
            password
        });

        if (result.code === 0) {
            Storage.setToken(result.data.token);
            Storage.setUser(result.data.user);
        }

        return result;
    },

    async register(data) {
        const result = await ApiService.post('/shiwu/user/register', data);

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
                await ApiService.post('/shiwu/user/logout');
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

    async getCurrentUserInfo() {
        const result = await ApiService.get('/shiwu/user/current/get');
        if (result.code === 0 && result.data) {
            Storage.setUser(result.data);
        }
        return result;
    },

    async changePassword(oldPassword, newPassword) {
        return await ApiService.post('/shiwu/user/password/change', {
            old_password: oldPassword,
            new_password: newPassword
        });
    },

    async updateProfile(data) {
        const result = await ApiService.post('/shiwu/user/profile/update', data);
        if (result.code === 0 && result.data) {
            Storage.setUser(result.data);
        }
        return result;
    },

    async adminLogin(username, password) {
        const result = await ApiService.post('/shiwu/admin/login', {
            username,
            password
        }, { useAdminToken: true });

        if (result.code === 0) {
            Storage.setAdminToken(result.data.token);
            Storage.setAdmin(result.data.admin);
        }

        return result;
    },

    async adminLogout() {
        const token = Storage.getAdminToken();
        if (token) {
            try {
                await ApiService.post('/shiwu/admin/logout', {}, { useAdminToken: true });
            } catch (e) {
                console.error('Admin logout error:', e);
            }
        }
        Storage.removeAdminToken();
        Storage.removeAdmin();
    },

    isAdminLoggedIn() {
        return !!Storage.getAdminToken();
    },

    getCurrentAdmin() {
        return Storage.getAdmin();
    }
};

window.AuthService = AuthService;
