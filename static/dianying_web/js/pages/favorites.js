const FavoritesPage = {
    template: `
        <div>
            <div class="page-header">
                <h2>📋 想看列表</h2>
            </div>

            <div v-if="loading" class="loading">
                <div class="spinner"></div>
                <p>加载中...</p>
            </div>

            <div v-else-if="movies.length === 0" class="empty-state">
                <div class="empty-state-icon">📋</div>
                <p>还没有收藏任何电影</p>
                <p style="margin-top: 8px;">去首页发现喜欢的电影吧！</p>
                <router-link to="/" class="btn btn-primary" style="margin-top: 16px;">去浏览</router-link>
            </div>

            <div v-else class="movie-grid">
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

            <MovieDetailModal
                v-if="showDetail"
                :movie="selectedMovie"
                :favorite-ids="favoriteIds"
                @close="showDetail = false"
                @refresh="loadFavorites"
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
        this.loadFavorites();
    },
    methods: {
        async loadFavorites() {
            this.loading = true;
            try {
                this.movies = await Api.get('/api/dianying/favorite/list/get');
                this.favoriteIds = await Api.get('/api/dianying/favorite/ids/get');
            } catch (error) {
                this.$root.showToast('加载收藏失败', 'error');
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
