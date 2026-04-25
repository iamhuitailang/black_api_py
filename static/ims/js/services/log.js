const LogService = {
    async getList(params = {}) {
        return API.get('/ims/log/list/get', params);
    },
    
    async getById(id) {
        return API.get('/ims/log/item/get', { id });
    }
};
