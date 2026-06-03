const SjStorage = {
    getToken() {
        return localStorage.getItem('sj_token') || ''
    },
    setToken(token) {
        localStorage.setItem('sj_token', token)
    },
    removeToken() {
        localStorage.removeItem('sj_token')
    },
    getUser() {
        const data = localStorage.getItem('sj_user')
        return data ? JSON.parse(data) : null
    },
    setUser(user) {
        localStorage.setItem('sj_user', JSON.stringify(user))
    },
    removeUser() {
        localStorage.removeItem('sj_user')
    },
    getCharacterId() {
        return localStorage.getItem('sj_character_id') || ''
    },
    setCharacterId(id) {
        localStorage.setItem('sj_character_id', String(id))
    },
    removeCharacterId() {
        localStorage.removeItem('sj_character_id')
    },
    clearAll() {
        this.removeToken()
        this.removeUser()
        this.removeCharacterId()
    }
}
