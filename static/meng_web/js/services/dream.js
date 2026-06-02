const DreamService = {
    async getMyDreams(page = 1, pageSize = 10) {
        return await ApiService.get('/meng/dream/my/get', {
            page,
            page_size: pageSize
        });
    },

    async getPublicDreams(params = {}) {
        const {
            page = 1,
            pageSize = 10,
            keyword = '',
            weather = null,
            timeOfDay = null
        } = params;

        const queryParams = {
            page,
            page_size: pageSize
        };

        if (keyword) queryParams.keyword = keyword;
        if (weather) queryParams.weather = weather;
        if (timeOfDay) queryParams.time_of_day = timeOfDay;

        return await ApiService.get('/meng/dream/public/get', queryParams);
    },

    async getDreamDetail(dreamId) {
        return await ApiService.get('/meng/dream/detail/get', {
            dream_id: dreamId
        });
    },

    async createDream(name, description = '') {
        return await ApiService.post('/meng/dream/create', {
            name,
            description
        });
    },

    async updateDream(dreamId, data = {}) {
        return await ApiService.post(`/meng/dream/update?dream_id=${dreamId}`, data);
    },

    async deleteDream(dreamId) {
        return await ApiService.post(`/meng/dream/delete?dream_id=${dreamId}`);
    },

    async togglePublic(dreamId) {
        return await ApiService.post(`/meng/dream/public/toggle?dream_id=${dreamId}`);
    },

    async likeDream(dreamId) {
        return await ApiService.post(`/meng/dream/like?dream_id=${dreamId}`);
    },

    async updateSettings(dreamId, data = {}) {
        return await ApiService.post('/meng/dream/settings/update', {
            dream_id: dreamId,
            ...data
        });
    },

    async getStatistics() {
        return await ApiService.get('/meng/dream/statistics/get');
    }
};
