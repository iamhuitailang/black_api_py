const AdminDashboard = {
    template: `
        <div class="admin-container">
            <div class="admin-tabs">
                <button class="admin-tab active">📊 数据概览</button>
                <button class="admin-tab" @click="$router.push('/admin/movies')">🎬 电影管理</button>
            </div>

            <div v-if="loading" class="loading">
                <div class="spinner"></div>
                <p>加载中...</p>
            </div>

            <div v-else>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">{{ stats.total_movies }}</div>
                        <div class="stat-label">电影总数</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">{{ stats.total_users }}</div>
                        <div class="stat-label">注册用户</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">{{ stats.total_ratings }}</div>
                        <div class="stat-label">评分总数</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">{{ stats.total_favorites }}</div>
                        <div class="stat-label">收藏总数</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">{{ stats.avg_rating }}</div>
                        <div class="stat-label">平均评分</div>
                    </div>
                </div>

                <div class="chart-container">
                    <h3>📈 评分分布</h3>
                    <div class="bar-chart">
                        <div v-for="item in ratingDistribution" :key="item.score" class="bar-item">
                            <div class="bar" :style="{ height: getBarHeight(item.count) + '%' }"></div>
                            <span class="bar-label">{{ item.score }}分</span>
                            <span class="bar-value">{{ item.count }}</span>
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                    <div class="chart-container">
                        <h3>🏆 热门电影 TOP 10</h3>
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>排名</th>
                                        <th>电影</th>
                                        <th>评分</th>
                                        <th>评价人数</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(movie, index) in topMovies" :key="movie.id">
                                        <td><strong>{{ index + 1 }}</strong></td>
                                        <td>{{ movie.title }}</td>
                                        <td class="movie-rating">⭐ {{ movie.rating }}</td>
                                        <td>{{ movie.rating_count }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="chart-container">
                        <h3>🎭 类型分布</h3>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <div v-for="item in genreDistribution" :key="item.genre" style="display: flex; align-items: center; gap: 8px;">
                                <span style="width: 80px; text-align: right; font-size: 13px; color: #555;">{{ item.genre }}</span>
                                <div style="flex: 1; background: #e9ecef; border-radius: 4px; height: 24px; position: relative;">
                                    <div style="height: 100%; border-radius: 4px; background: linear-gradient(90deg, #667eea, #764ba2);" :style="{ width: getBarWidth(item.count) + '%' }"></div>
                                </div>
                                <span style="font-size: 12px; color: #888; min-width: 24px;">{{ item.count }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="chart-container">
                    <h3>📅 年份分布</h3>
                    <div class="bar-chart">
                        <div v-for="item in yearDistribution.slice(0, 10)" :key="item.year" class="bar-item">
                            <div class="bar" :style="{ height: getBarHeight(item.count, maxYearCount) + '%' }"></div>
                            <span class="bar-label">{{ item.year }}</span>
                            <span class="bar-value">{{ item.count }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            loading: false,
            stats: {
                total_movies: 0,
                total_users: 0,
                total_ratings: 0,
                total_favorites: 0,
                avg_rating: 0
            },
            ratingDistribution: [],
            topMovies: [],
            genreDistribution: [],
            yearDistribution: [],
            maxRatingCount: 1,
            maxGenreCount: 1,
            maxYearCount: 1
        };
    },
    mounted() {
        this.loadData();
    },
    methods: {
        async loadData() {
            this.loading = true;
            try {
                const [stats, ratingDist, topMovies, genreDist, yearDist] = await Promise.all([
                    Api.get('/api/dianying/stats/dashboard/get'),
                    Api.get('/api/dianying/stats/rating/distribution/get'),
                    Api.get('/api/dianying/stats/top/movies/get', { limit: 10 }),
                    Api.get('/api/dianying/stats/genre/distribution/get'),
                    Api.get('/api/dianying/stats/year/distribution/get')
                ]);

                this.stats = stats;
                this.ratingDistribution = ratingDist;
                this.topMovies = topMovies;
                this.genreDistribution = genreDist.slice(0, 8);
                this.yearDistribution = yearDist;

                this.maxRatingCount = Math.max(...ratingDist.map(i => i.count), 1);
                this.maxGenreCount = Math.max(...genreDist.map(i => i.count), 1);
                this.maxYearCount = Math.max(...yearDist.map(i => i.count), 1);
            } catch (error) {
                this.$root.showToast('加载数据失败', 'error');
            } finally {
                this.loading = false;
            }
        },
        getBarHeight(count, max) {
            max = max || this.maxRatingCount;
            return max > 0 ? (count / max) * 100 : 0;
        },
        getBarWidth(count) {
            return this.maxGenreCount > 0 ? (count / this.maxGenreCount) * 100 : 0;
        }
    }
};
