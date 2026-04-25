const VarietyService = {
    async getList(params = {}) {
        return API.get('/ims/variety/list/get', params);
    },
    
    async getAll() {
        return API.get('/ims/variety/all/get');
    },
    
    async getById(id) {
        return API.get('/ims/variety/item/get', { id });
    },
    
    async add(data) {
        return API.post('/ims/variety/add', data);
    },
    
    async update(data) {
        return API.post('/ims/variety/update', data);
    },
    
    async delete(id) {
        return API.delete('/ims/variety/delete', { id });
    }
};
