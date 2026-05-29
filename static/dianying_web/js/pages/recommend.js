const RecommendPage = {
    template: `
        <div>
            <div class="page-header">
                <h2>🎯 为你推荐</h2>
                <p style="color: rgba(255,255,255,0.6);">基于你的评分记录，为你推荐相似类型的电影</p>
            </div>

            <div v-if="loading" class="loading">
                <div class="spinner"></div>
                <p>加载中...</p>
            </div>

            <div v-else-if="movies.length === 0" class="empty-state">
                <div class="empty-state-icon">🎯</div>
                <p>暂无推荐</p>
                <p style="margin-top: 8px;">给更多电影评分，获取个性化推荐</p>
                <router-link to="/" class="btn btn-primary" style="margin-top: 16px;">去评分</router-link>
            </div>

            <div v-else>
                <div class="chart-container" style="margin-bottom: 24px; background: rgba(255,255,255,0.1);">
                    <h3 style="color: #333;">💡 推荐说明</h3>
                    <p style="color: #666; margin-top: 8px;">
                        系统根据你评分过的电影类型，为你推荐以下相似类型的高分电影。
                        评分越多，推荐越精准！
                    </p>
                </div>

                <div class="movie-grid">
                    <div
                        v-for="movie in movies"
                        :key="movie.id"
                        class="movie-card"
                        @click="showMovieDetail(movie)"
                    >
                        <img :src="movie.poster" :alt="movie.title" class="movie-poster" @error="handleImageError($event)">
                        <div class="movie-info">
                            <h3 class="movie-title">{{ movie.title }}</h3>
                            <div class="movie-meta">
                                <span>{{ movie.year }}</span>
                                <span class="movie-rating">⭐ {{ movie.rating }}</span>
                            </div>
                            <p class="movie-genre">{{ movie.genre }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <MovieDetailModal
                v-if="showDetail"
                :movie="selectedMovie"
                :favorite-ids="favoriteIds"
                @close="showDetail = false"
                @refresh="loadRecommendations"
            />
        </div>
    `,
    data() {
        return {
            movies: [],
            loading: false,
            showDetail: false,
            selectedMovie: null,
            favoriteIds: []
        };
    },
    mounted() {
        this.loadRecommendations();
    },
    methods: {
        async loadRecommendations() {
            this.loading = true;
            try {
                this.movies = await Api.get('/api/dianying/movie/recommend/get', { limit: 12 });
                this.favoriteIds = await Api.get('/api/dianying/favorite/ids/get');
            } catch (error) {
                this.$root.showToast('加载推荐失败', 'error');
            } finally {
                this.loading = false;
            }
        },
        showMovieDetail(movie) {
            this.selectedMovie = movie;
            this.showDetail = true;
        },
        handleImageError(event) {
            event.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><rect fill="%23667eea" width="300" height="400"/><text x="50%" y="50%" fill="white" font-size="24" text-anchor="middle" dy=".3em">🎬</text></svg>';
        }
    }
};
