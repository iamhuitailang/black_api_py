const CategoryService = {
    categories: [
        { id: 1, name: '蔬菜水果', icon: '🍎', color: '#4CAF50' },
        { id: 2, name: '肉禽蛋奶', icon: '🥩', color: '#f44336' },
        { id: 3, name: '水产海鲜', icon: '🐟', color: '#2196F3' },
        { id: 4, name: '粮油干货', icon: '🌾', color: '#FF9800' },
        { id: 5, name: '服装鞋帽', icon: '👕', color: '#9C27B0' },
        { id: 6, name: '日用百货', icon: '🧴', color: '#00BCD4' },
        { id: 7, name: '手工艺品', icon: '🎨', color: '#E91E63' },
        { id: 8, name: '小吃美食', icon: '🍜', color: '#FF5722' },
        { id: 9, name: '苗木花卉', icon: '🌸', color: '#8BC34A' },
        { id: 10, name: '其他', icon: '📦', color: '#607D8B' }
    ],
    
    getAll() {
        return this.categories;
    },
    
    getById(id) {
        return this.categories.find(c => c.id === id) || null;
    },
    
    getNames() {
        return this.categories.map(c => c.name);
    },
    
    async getListFromApi() {
        return ApiService.get('/dj/category/list');
    },
    
    async getDetail(categoryId) {
        return ApiService.get('/dj/category/detail', { category_id: categoryId });
    }
};
