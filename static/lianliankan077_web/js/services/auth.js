const AuthService = {
    async login(username, password) {
        const result = await ApiService.post('/llk/user/login', { username, password })
        if (result.code === 0) {
            Storage.setToken(result.data.token)
            Storage.setUser(result.data.user)
        }
        return result
    },

    async register(username, password, nickname = '') {
        const result = await ApiService.post('/llk/user/register', { username, password, nickname })
        if (result.code === 0) {
            Storage.setToken(result.data.token)
            Storage.setUser(result.data.user)
        }
        return result
    },

    async logout() {
        try {
            await ApiService.post('/llk/user/logout')
        } catch (e) {
            console.error('Logout error:', e)
        }
        Storage.removeToken()
        Storage.removeUser()
    },

    isLoggedIn() {
        return !!Storage.getToken()
    },

    getCurrentUser() {
        return Storage.getUser()
    },

    async getCurrentUserInfo() {
        const result = await ApiService.get('/llk/user/current/get')
        if (result.code === 0 && result.data) {
            Storage.setUser(result.data)
        }
        return result
    },

    async changePassword(oldPassword, newPassword) {
        return await ApiService.post('/llk/user/password/change', {
            old_password: oldPassword,
            new_password: newPassword
        })
    },

    async updateProfile(data) {
        const result = await ApiService.post('/llk/user/profile/update', data)
        if (result.code === 0 && result.data) {
            Storage.setUser(result.data)
        }
        return result
    }
}

const AdminAuthService = {
    async login(username, password) {
        const result = await ApiService.post('/llk/admin/login', { username, password })
        if (result.code === 0) {
            Storage.setAdminToken(result.data.token)
            Storage.setAdmin(result.data.admin)
        }
        return result
    },

    async logout() {
        try {
            await ApiService.post('/llk/admin/logout')
        } catch (e) {
            console.error('Logout error:', e)
        }
        Storage.removeAdminToken()
        Storage.removeAdmin()
    },

    isLoggedIn() {
        return !!Storage.getAdminToken()
    },

    getCurrentAdmin() {
        return Storage.getAdmin()
    }
}
