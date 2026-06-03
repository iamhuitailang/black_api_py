const API_BASE = '/api'

const SjApi = {
    async request(url, options = {}) {
        const token = SjStorage.getToken()
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        }
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        try {
            const response = await fetch(`${API_BASE}${url}`, {
                ...options,
                headers
            })
            const data = await response.json()
            return data
        } catch (error) {
            console.error('API Error:', error)
            return { code: -1, msg: '网络错误', data: null }
        }
    },

    async get(url) {
        return this.request(url, { method: 'GET' })
    },

    async post(url, body) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(body)
        })
    },

    user: {
        register: (username, password, nickname) =>
            SjApi.post('/sj/user/register', { username, password, nickname }),
        login: (username, password) =>
            SjApi.post('/sj/user/login', { username, password }),
        logout: () =>
            SjApi.post('/sj/user/logout', {}),
        getCurrent: () =>
            SjApi.get('/sj/user/current/get'),
        updateProfile: (data) =>
            SjApi.post('/sj/user/profile/update', data)
    },

    character: {
        getClasses: () =>
            SjApi.get('/sj/character/classes/get'),
        getList: () =>
            SjApi.get('/sj/character/list/get'),
        create: (name, classType) =>
            SjApi.post('/sj/character/create', { name, class_type: classType }),
        getDetail: (characterId) =>
            SjApi.get(`/sj/character/detail/get?character_id=${characterId}`),
        delete: (characterId) =>
            SjApi.post(`/sj/character/delete?character_id=${characterId}`, {}),
        getTimeAbilities: (characterId) =>
            SjApi.get(`/sj/character/time/abilities/get?character_id=${characterId}`)
    },

    game: {
        enterFloor: (characterId) =>
            SjApi.post(`/sj/game/enter/floor?character_id=${characterId}`, {}),
        battleAction: (characterId, action, skillName = '', timeAbility = '') =>
            SjApi.post('/sj/game/battle/action', {
                character_id: characterId,
                action,
                skill_name: skillName,
                time_ability: timeAbility
            }),
        getEvent: () =>
            SjApi.get('/sj/game/event/get'),
        eventChoice: (characterId, eventId, choiceIndex) =>
            SjApi.post('/sj/game/event/choice', {
                character_id: characterId,
                event_id: eventId,
                choice_index: choiceIndex
            }),
        rest: (characterId) =>
            SjApi.post(`/sj/game/rest?character_id=${characterId}`, {}),
        revive: (characterId) =>
            SjApi.post('/sj/game/revive', { character_id: characterId }),
        getEnding: (characterId) =>
            SjApi.get(`/sj/game/ending/get?character_id=${characterId}`)
    },

    inventory: {
        getList: (characterId) =>
            SjApi.get(`/sj/inventory/list/get?character_id=${characterId}`),
        getEquipped: (characterId) =>
            SjApi.get(`/sj/inventory/equipped/get?character_id=${characterId}`),
        equip: (inventoryId, characterId) =>
            SjApi.post(`/sj/inventory/equip?inventory_id=${inventoryId}&character_id=${characterId}`, {}),
        unequip: (inventoryId, characterId) =>
            SjApi.post(`/sj/inventory/unequip?inventory_id=${inventoryId}&character_id=${characterId}`, {}),
        use: (inventoryId, characterId) =>
            SjApi.post(`/sj/inventory/use?inventory_id=${inventoryId}&character_id=${characterId}`, {}),
        remove: (inventoryId, characterId) =>
            SjApi.post(`/sj/inventory/remove?inventory_id=${inventoryId}&character_id=${characterId}`, {})
    },

    save: {
        getList: () =>
            SjApi.get('/sj/save/list/get'),
        create: (characterId, saveName) =>
            SjApi.post('/sj/save/create', { character_id: characterId, save_name: saveName }),
        load: (saveId) =>
            SjApi.post('/sj/save/load', { save_id: saveId }),
        delete: (saveId) =>
            SjApi.post('/sj/save/delete', { save_id: saveId })
    }
}
