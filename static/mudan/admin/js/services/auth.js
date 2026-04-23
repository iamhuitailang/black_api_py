const AuthService = {
    async login(username, password) {
        const result = await ApiService.post('/auth/login', {
            username,
            password
        });
        
        if (result.code === 0 && result.data) {
            Storage.setToken(result.data.token);
            Storage.setUser(result.data.user);
        }
        
        return result;
    },
    
    async logout() {
        try {
            await ApiService.post('/auth/logout', {});
        } catch (e) {
            console.error('Logout API error:', e);
        }
        Storage.removeToken();
        Storage.removeUser();
    },
    
    async getCurrentUser() {
        return ApiService.get('/auth/current/user/get');
    },
    
    async changePassword(oldPassword, newPassword) {
        return ApiService.post('/auth/password/change', {
            old_password: oldPassword,
            new_password: newPassword
        });
    },
    
    isLoggedIn() {
        return !!Storage.getToken();
    },
    
    getUser() {
        return Storage.getUser();
    }
};
