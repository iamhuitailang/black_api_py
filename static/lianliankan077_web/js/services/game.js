const GameService = {
    async getThemes() {
        return await ApiService.get('/llk/theme/list/get')
    },

    async getThemeDetail(themeId) {
        return await ApiService.get('/llk/theme/detail/get', { theme_id: themeId })
    },

    async getProps() {
        return await ApiService.get('/llk/prop/list/get')
    },

    async getUserProps() {
        return await ApiService.get('/llk/prop/user/list/get')
    },

    async buyProp(propId, quantity = 1) {
        return await ApiService.post('/llk/prop/buy', { prop_id: propId, quantity })
    },

    async useProp(propId) {
        return await ApiService.post('/llk/prop/use', { prop_id: propId })
    },

    async saveRecord(data) {
        return await ApiService.post('/llk/game/record/save', data)
    },

    async getRecords(page = 1, pageSize = 10) {
        return await ApiService.get('/llk/game/record/list/get', { page, page_size: pageSize })
    },

    async getLeaderboard(themeId = null, page = 1, pageSize = 20) {
        const params = { page, page_size: pageSize }
        if (themeId) params.theme_id = themeId
        return await ApiService.get('/llk/game/leaderboard/get', params)
    },

    async getScoreLeaderboard(page = 1, pageSize = 20) {
        return await ApiService.get('/llk/game/score/leaderboard/get', { page, page_size: pageSize })
    }
}

const AdminService = {
    async getUsers(page = 1, pageSize = 10, status = null, keyword = null) {
        const params = { page, page_size: pageSize }
        if (status !== null) params.status = status
        if (keyword) params.keyword = keyword
        return await ApiService.get('/llk/admin/user/list/get', params)
    },

    async banUser(userId) {
        return await ApiService.post('/llk/admin/user/ban', {}, { user_id: userId })
    },

    async unbanUser(userId) {
        return await ApiService.post('/llk/admin/user/unban', {}, { user_id: userId })
    },

    async deleteUser(userId) {
        return await ApiService.post('/llk/admin/user/delete', {}, { user_id: userId })
    },

    async getAllThemes(page = 1, pageSize = 10, status = null) {
        const params = { page, page_size: pageSize }
        if (status !== null) params.status = status
        return await ApiService.get('/llk/theme/all/get', params)
    },

    async createTheme(data) {
        return await ApiService.post('/llk/theme/create', data)
    },

    async updateTheme(themeId, data) {
        return await ApiService.post('/llk/theme/update', data)
    },

    async updateThemeStatus(themeId, status) {
        return await ApiService.post('/llk/theme/status/update', {}, { theme_id: themeId, status })
    },

    async deleteTheme(themeId) {
        return await ApiService.post('/llk/theme/delete', {}, { theme_id: themeId })
    },

    async getAllProps(page = 1, pageSize = 10, status = null) {
        const params = { page, page_size: pageSize }
        if (status !== null) params.status = status
        return await ApiService.get('/llk/prop/all/get', params)
    },

    async createProp(data) {
        return await ApiService.post('/llk/prop/create', data)
    },

    async updateProp(propId, data) {
        return await ApiService.post('/llk/prop/update', data)
    },

    async updatePropStatus(propId, status) {
        return await ApiService.post('/llk/prop/status/update', {}, { prop_id: propId, status })
    },

    async deleteProp(propId) {
        return await ApiService.post('/llk/prop/delete', {}, { prop_id: propId })
    },

    async getStatistics() {
        return await ApiService.get('/llk/game/statistics/get')
    }
}
