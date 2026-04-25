const SaleService = {
    async getList(params = {}) {
        return API.get('/ims/sale/list/get', params);
    },
    
    async getById(id) {
        return API.get('/ims/sale/item/get', { id });
    },
    
    async add(data) {
        return API.post('/ims/sale/add', data);
    },
    
    async update(data) {
        return API.post('/ims/sale/update', data);
    },
    
    async delete(id) {
        return API.delete('/ims/sale/delete', { id });
    }
};
