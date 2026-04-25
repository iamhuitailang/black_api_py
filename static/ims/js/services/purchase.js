const PurchaseService = {
    async getList(params = {}) {
        return API.get('/ims/purchase/list/get', params);
    },
    
    async getById(id) {
        return API.get('/ims/purchase/item/get', { id });
    },
    
    async add(data) {
        return API.post('/ims/purchase/add', data);
    },
    
    async update(data) {
        return API.post('/ims/purchase/update', data);
    },
    
    async delete(id) {
        return API.delete('/ims/purchase/delete', { id });
    }
};
