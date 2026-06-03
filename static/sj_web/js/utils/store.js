const SjStore = Vue.reactive({
    user: SjStorage.getUser(),
    token: SjStorage.getToken(),
    characterId: SjStorage.getCharacterId(),
    character: null,
    currentFloor: null,
    battleState: null,
    eventState: null,
    isLoading: false,
    toasts: [],

    setUser(user) {
        this.user = user
        SjStorage.setUser(user)
    },

    setToken(token) {
        this.token = token
        SjStorage.setToken(token)
    },

    setCharacterId(id) {
        this.characterId = id
        SjStorage.setCharacterId(id)
    },

    setCharacter(character) {
        this.character = character
    },

    setCurrentFloor(floor) {
        this.currentFloor = floor
    },

    setBattleState(state) {
        this.battleState = state
    },

    setEventState(state) {
        this.eventState = state
    },

    clearGame() {
        this.character = null
        this.currentFloor = null
        this.battleState = null
        this.eventState = null
    },

    clearAll() {
        this.user = null
        this.token = ''
        this.characterId = ''
        this.clearGame()
        SjStorage.clearAll()
    },

    showToast(msg, type = 'info', duration = 3000) {
        const id = Date.now()
        this.toasts.push({ id, msg, type })
        setTimeout(() => {
            this.toasts = this.toasts.filter(t => t.id !== id)
        }, duration)
    },

    removeToast(id) {
        this.toasts = this.toasts.filter(t => t.id !== id)
    }
})
