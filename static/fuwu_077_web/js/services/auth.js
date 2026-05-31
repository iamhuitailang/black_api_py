const AuthService = {
    async userLogin(phone, password) {
        try {
            const result = await UserApi.login({ phone, password });
            if (result.code === 0) {
                Storage.setUserToken(result.data.token);
                Storage.setUser(result.data.user);
                Storage.setRole('user');
                return result;
            }
            throw new Error(result.msg || '登录失败');
        } catch (error) {
            throw error;
        }
    },

    async adminLogin(phone, password) {
        try {
            const result = await AdminApi.login({ phone, password });
            if (result.code === 0) {
                Storage.setAdminToken(result.data.token);
                Storage.setAdmin(result.data.user);
                Storage.setRole('admin');
                return result;
            }
            throw new Error(result.msg || '登录失败');
        } catch (error) {
            throw error;
        }
    },

    async register(phone, password, nickname, address) {
        try {
            const result = await UserApi.register({ phone, password, nickname, address });
            if (result.code === 0) {
                Storage.setUserToken(result.data.token);
                Storage.setUser(result.data.user);
                Storage.setRole('user');
                return result;
            }
            throw new Error(result.msg || '注册失败');
        } catch (error) {
            throw error;
        }
    },

    async logout() {
        const role = Storage.getRole();
        try {
            if (role === 'admin') {
                await AdminApi.logout();
            } else {
                await UserApi.logout();
            }
        } catch (e) {
            console.log('Logout api error:', e);
        }
        Storage.removeUserToken();
        Storage.removeAdminToken();
        Storage.removeUser();
        Storage.removeAdmin();
        Storage.removeRole();
    },

    isLoggedIn() {
        const role = Storage.getRole();
        if (role === 'admin') {
            return !!Storage.getAdminToken();
        }
        return !!Storage.getUserToken();
    },

    isAdmin() {
        return Storage.getRole() === 'admin';
    },

    isUser() {
        return Storage.getRole() === 'user';
    },

    getCurrentUser() {
        const role = Storage.getRole();
        if (role === 'admin') {
            return Storage.getAdmin();
        }
        return Storage.getUser();
    }
};

window.AuthService = AuthService;
