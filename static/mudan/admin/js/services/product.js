const ProductService = {
    async getList() {
        return ApiService.get('/mudan/commercial/products/get');
    },
    
    async getById(id) {
        return ApiService.get('/mudan/commercial/product/get', { id });
    },
    
    async add(data) {
        return ApiService.post('/mudan/commercial/product/add', {
            name: data.name,
            price: data.price || 0,
            quantity: data.quantity || 0,
            description: data.description || '',
            image_url: data.image_url || ''
        });
    },
    
    async update(id, data) {
        const payload = { id };
        if (data.name !== undefined) payload.name = data.name;
        if (data.price !== undefined) payload.price = data.price;
        if (data.quantity !== undefined) payload.quantity = data.quantity;
        if (data.description !== undefined) payload.description = data.description;
        if (data.image_url !== undefined) payload.image_url = data.image_url;
        return ApiService.post('/mudan/commercial/product/update', payload);
    },
    
    async delete(id) {
        return ApiService.delete('/mudan/commercial/product/delete', { id });
    }
};
