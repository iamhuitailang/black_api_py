const SjAuth = {
    async login(username, password) {
        const result = await SjApi.user.login(username, password)
        if (result.code === 0) {
            SjStorage.setToken(result.data.token)
            SjStorage.setUser(result.data.user)
            return { success: true, data: result.data }
        }
        return { success: false, msg: result.msg }
    },

    async register(username, password, nickname) {
        const result = await SjApi.user.register(username, password, nickname)
        if (result.code === 0) {
            SjStorage.setToken(result.data.token)
            SjStorage.setUser(result.data.user)
            return { success: true, data: result.data }
        }
        return { success: false, msg: result.msg }
    },

    async logout() {
        await SjApi.user.logout()
        SjStorage.clearAll()
    },

    async checkAuth() {
        const token = SjStorage.getToken()
        if (!token) return false
        const result = await SjApi.user.getCurrent()
        if (result.code === 0) {
            SjStorage.setUser(result.data)
            return true
        }
        SjStorage.clearAll()
        return false
    },

    isLoggedIn() {
        return !!SjStorage.getToken()
    },

    getUser() {
        return SjStorage.getUser()
    },

    getToken() {
        return SjStorage.getToken()
    }
}
