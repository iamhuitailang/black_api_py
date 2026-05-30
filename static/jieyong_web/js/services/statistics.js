const StatisticsService = {
  async getDashboard() {
    return await Api.get('/statistics/dashboard/get');
  },

  async getTrend(days = 30) {
    return await Api.get('/statistics/trend/get', { days });
  },

  async getCategoryDistribution() {
    return await Api.get('/statistics/category/get');
  },

  async getHotItems(limit = 10) {
    return await Api.get('/statistics/hot/items/get', { limit });
  },

  async getActiveUsers(limit = 10) {
    return await Api.get('/statistics/active/users/get', { limit });
  },

  async getOverdueStats() {
    return await Api.get('/statistics/overdue/get');
  },

  async exportRecords(params = {}) {
    return await Api.get('/statistics/export/get', params);
  }
};

window.StatisticsService = StatisticsService;
