const HomePage = {
    template: `
        <div>
            <div class="filter-bar">
                <div class="form-group search-group">
                    <label>搜索电影</label>
                    <input type="text" v-model="filters.search" placeholder="搜索电影标题、演员、导演..." @input="handleSearch">
                </div>
                <div class="form-group">
                    <label>类型</label>
                    <select v-model="filters.genre" @change="loadMovies">
                        <option value="">全部类型</option>
                        <option v-for="g in genres" :key="g" :value="g">{{ g }}</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>年份</label>
                    <select v-model="filters.year" @change="loadMovies">
                        <option value="">全部年份</option>
                        <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>最低评分</label>
                    <select v-model="filters.min_rating" @change="loadMovies">
                        <option value="">不限</option>
                        <option value="9">9分以上</option>
                        <option value="8">8分以上</option>
                        <option value="7">7分以上</option>
                        <option value="6">6分以上</option>
                    </select>
                </div>
            </div>

            <div class="genre-filter">
                <span
                    class="genre-chip"
                    :class="{ active: selectedGenre === '' }"
                    @click="selectGenre('')"
                >全部</span>
                <span
                    v-for="g in popularGenres"
                    :key="g"
                    class="genre-chip"
                    :class="{ active: selectedGenre === g }"
                    @click="selectGenre(g)"
                >{{ g }}</span>
            </div>

            <div v-if="loading" class="loading">
                <div class="spinner"></div>
                <p>加载中...</p>
            </div>

            <div v-else-if="movies.length === 0" class="empty-state">
                <div class="empty-state-icon">🎬</div>
                <p>没有找到相关电影</p>
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

            <div v-if="total > 0" class="pagination">
                <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1">上一页</button>
                <button
                    v-for="p in totalPages"
                    :key="p"
                    :class="{ active: p === currentPage }"
                    @click="changePage(p)"
                >{{ p }}</button>
                <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages">下一页</button>
            </div>

            <MovieDetailModal
                v-if="showDetail"
                :movie="selectedMovie"
                :favorite-ids="favoriteIds"
                @close="showDetail = false"
                @refresh="onRefresh"
            />
        </div>
    `,
    data() {
        return {
            movies: [],
            genres: [],
            years: [],
            filters: {
                search: '',
                genre: '',
                year: '',
                min_rating: ''
            },
            selectedGenre: '',
            popularGenres: ['剧情', '爱情', '动作', '科幻', '动画', '犯罪'],
            loading: false,
            currentPage: 1,
            pageSize: 12,
            total: 0,
            showDetail: false,
            selectedMovie: null,
            favoriteIds: [],
            searchTimeout: null
        };
    },
    computed: {
        totalPages() {
            return Math.ceil(this.total / this.pageSize);
        }
    },
    mounted() {
        this.loadGenres();
        this.loadYears();
        this.loadMovies();
        this.loadFavoriteIds();
    },
    methods: {
        async loadGenres() {
            try {
                this.genres = await Api.get('/api/dianying/movie/genres/get');
            } catch (error) {
                console.error('加载类型失败:', error);
            }
        },
        async loadYears() {
            try {
                this.years = await Api.get('/api/dianying/movie/years/get');
            } catch (error) {
                console.error('加载年份失败:', error);
            }
        },
        async loadMovies() {
            this.loading = true;
            try {
                const params = {
                    page: this.currentPage,
                    page_size: this.pageSize,
                    ...(this.filters.genre && { genre: this.filters.genre }),
                    ...(this.filters.year && { year: this.filters.year }),
                    ...(this.filters.min_rating && { min_rating: this.filters.min_rating }),
                    ...(this.filters.search && { search: this.filters.search })
                };
                const data = await Api.get('/api/dianying/movie/list/get', params);
                this.movies = data.list;
                this.total = data.total;
            } catch (error) {
                this.$root.showToast('加载电影失败', 'error');
            } finally {
                this.loading = false;
            }
        },
        async loadFavoriteIds() {
            try {
                this.favoriteIds = await Api.get('/api/dianying/favorite/ids/get');
            } catch (error) {
                console.error('加载收藏失败:', error);
            }
        },
        handleSearch() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.currentPage = 1;
                this.loadMovies();
            }, 500);
        },
        selectGenre(genre) {
            this.selectedGenre = genre;
            this.filters.genre = genre;
            this.currentPage = 1;
            this.loadMovies();
        },
        changePage(page) {
            this.currentPage = page;
            this.loadMovies();
        },
        showMovieDetail(movie) {
            this.selectedMovie = movie;
            this.showDetail = true;
        },
        onRefresh() {
            this.loadMovies();
            this.loadFavoriteIds();
        },
        handleImageError(event) {
            event.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><rect fill="%23667eea" width="300" height="400"/><text x="50%" y="50%" fill="white" font-size="24" text-anchor="middle" dy=".3em">🎬</text></svg>';
        }
    }
};
