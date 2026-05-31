const Storage = {
    set(key, value) {
        if (typeof value === 'object') {
            value = JSON.stringify(value)
        }
        localStorage.setItem(key, value)
    },

    get(key) {
        const value = localStorage.getItem(key)
        if (!value) return null
        try {
            return JSON.parse(value)
        } catch (e) {
            return value
        }
    },

    remove(key) {
        localStorage.removeItem(key)
    },

    clear() {
        localStorage.clear()
    },

    getToken() {
        return this.get('llk_user_token')
    },

    setToken(token) {
        this.set('llk_user_token', token)
    },

    removeToken() {
        this.remove('llk_user_token')
    },

    getUser() {
        return this.get('llk_user')
    },

    setUser(user) {
        this.set('llk_user', user)
    },

    removeUser() {
        this.remove('llk_user')
    },

    getAdminToken() {
        return this.get('llk_admin_token')
    },

    setAdminToken(token) {
        this.set('llk_admin_token', token)
    },

    removeAdminToken() {
        this.remove('llk_admin_token')
    },

    getAdmin() {
        return this.get('llk_admin')
    },

    setAdmin(admin) {
        this.set('llk_admin', admin)
    },

    removeAdmin() {
        this.remove('llk_admin')
    }
}
