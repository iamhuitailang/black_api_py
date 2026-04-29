const AuthService = {
    async login(username, password) {
        const result = await ApiService.post('/jn/admin/login', { username, password });
        
        if (result.code === 0 && result.data) {
            Storage.setToken(result.data.token);
            Storage.setUser(result.data.admin);
        }
        
        return result;
    },

    async logout() {
        try {
            await ApiService.post('/jn/admin/logout');
        } catch (e) {
            console.log('Logout API call failed, but proceeding with local logout');
        }
        
        Storage.removeToken();
        Storage.removeUser();
        
        return { code: 0, msg: '退出成功', data: null };
    },

    isLoggedIn() {
        return !!Storage.getToken();
    },

    getCurrentUser() {
        return Storage.getUser();
    },

    getToken() {
        return Storage.getToken();
    }
};

window.AuthService = AuthService;
