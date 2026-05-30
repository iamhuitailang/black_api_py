const ItemService = {
  async getList(params = {}) {
    return await Api.get('/item/list/get', params);
  },

  async getDetail(item_id) {
    return await Api.get('/item/detail/get', { item_id });
  },

  async getHot(limit = 10) {
    return await Api.get('/item/hot/get', { limit });
  },

  async getAvailability(item_id, quantity = 1) {
    return await Api.get('/item/availability/get', { item_id, quantity });
  },

  async create(data) {
    return await Api.post('/item/create', data);
  },

  async update(data) {
    return await Api.post('/item/update', data);
  },

  async delete(item_id) {
    return await Api.post('/item/delete', { item_id });
  },

  async getCategories() {
    return await Api.get('/category/all/get');
  },

  async getCategoryList(params = {}) {
    return await Api.get('/category/list/get', params);
  },

  async createCategory(data) {
    return await Api.post('/category/create', data);
  },

  async updateCategory(data) {
    return await Api.post('/category/update', data);
  },

  async deleteCategory(category_id) {
    return await Api.post('/category/delete', { category_id });
  }
};

window.ItemService = ItemService;
