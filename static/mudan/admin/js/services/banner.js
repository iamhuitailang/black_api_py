const BannerService = {
    async getList() {
        return ApiService.get('/mudan/banner/get');
    },
    
    async getById(id) {
        return ApiService.get('/mudan/banner/item/get', { id });
    },
    
    async add(imageUrl, jumpUrl = '') {
        return ApiService.post('/mudan/banner/item/add', {
            image_url: imageUrl,
            jump_url: jumpUrl
        });
    },
    
    async update(id, imageUrl, jumpUrl) {
        const data = { id };
        if (imageUrl !== undefined) data.image_url = imageUrl;
        if (jumpUrl !== undefined) data.jump_url = jumpUrl;
        return ApiService.post('/mudan/banner/item/update', data);
    },
    
    async delete(id) {
        return ApiService.delete('/mudan/banner/delete', { id });
    },
    
    async setAll(banners) {
        return ApiService.post('/mudan/banner/set', {
            banners: banners.map(b => ({
                image_url: b.image_url,
                jump_url: b.jump_url
            }))
        });
    },
    
    async getConfig() {
        return ApiService.get('/mudan/banner/config/get');
    },
    
    async setConfig(config) {
        return ApiService.post('/mudan/banner/config/set', config);
    }
};
