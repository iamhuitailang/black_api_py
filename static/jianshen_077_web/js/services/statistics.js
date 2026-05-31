const StatisticsService = {
    async getDashboard() {
        return await ApiService.get('/jianshen/statistics/dashboard/get');
    },

    async getCourseStats() {
        return await ApiService.get('/jianshen/statistics/course/get');
    },

    async getMemberStats() {
        return await ApiService.get('/jianshen/statistics/member/get');
    }
};

window.StatisticsService = StatisticsService;
