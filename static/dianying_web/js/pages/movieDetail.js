const MovieDetailModal = {
    props: ['movie', 'favoriteIds'],
    template: `
        <div class="modal-overlay" @click.self="$emit('close')">
            <div class="modal">
                <div class="modal-content">
                    <div class="movie-detail-header">
                        <img :src="movie.poster" :alt="movie.title" class="movie-detail-poster" @error="handleImageError($event)">
                        <div class="movie-detail-info">
                            <h2>{{ movie.title }}</h2>
                            <div class="movie-detail-rating">
                                <span class="rating-score">{{ movie.rating }}</span>
                                <span class="rating-count">{{ movie.rating_count }}人评价</span>
                            </div>
                            <div class="movie-detail-meta">
                                <span class="meta-tag">{{ movie.year }}</span>
                                <span class="meta-tag" v-if="movie.country">{{ movie.country }}</span>
                                <span class="meta-tag" v-if="movie.duration">{{ movie.duration }}分钟</span>
                            </div>
                            <div class="movie-detail-meta">
                                <span class="meta-tag" v-for="g in movie.genre.split(',')" :key="g">{{ g.trim() }}</span>
                            </div>
                            <div v-if="movie.director" style="margin-bottom: 8px;">
                                <strong>导演：</strong>{{ movie.director }}
                            </div>
                            <div v-if="movie.actors" style="margin-bottom: 8px;">
                                <strong>演员：</strong>{{ movie.actors }}
                            </div>
                            <div class="movie-detail-actions">
                                <button
                                    class="btn favorite-btn"
                                    :class="{ active: isFavorited }"
                                    @click.stop="toggleFavorite"
                                >
                                    {{ isFavorited ? '❤️ 已收藏' : '🤍 加入想看' }}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div v-if="movie.description">
                        <h3 style="margin-bottom: 12px;">剧情简介</h3>
                        <p style="line-height: 1.8; color: #555;">{{ movie.description }}</p>
                    </div>

                    <div class="rating-section">
                        <h4>给这部电影评分</h4>
                        <div class="star-rating">
                            <span
                                v-for="i in 10"
                                :key="i"
                                class="star"
                                :class="{ active: i <= userRating }"
                                @click.stop="setRating(i)"
                                @mouseenter.stop="hoverRating = i"
                                @mouseleave.stop="hoverRating = 0"
                            >{{ i <= (hoverRating || userRating) ? '★' : '☆' }}</span>
                        </div>
                        <div class="rating-value">
                            当前评分：{{ hoverRating || userRating || '未评分' }}分
                        </div>
                        <button
                            class="btn btn-primary"
                            style="margin-top: 16px;"
                            @click.stop="submitRating"
                            :disabled="ratingLoading"
                        >
                            {{ ratingLoading ? '提交中...' : '提交评分' }}
                        </button>
                    </div>

                    <div class="form-actions" style="margin-top: 24px;">
                        <button class="btn btn-secondary" @click.stop="$emit('close')">关闭</button>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            userRating: 0,
            hoverRating: 0,
            ratingLoading: false
        };
    },
    computed: {
        isFavorited() {
            return this.favoriteIds && this.favoriteIds.includes(this.movie.id);
        }
    },
    mounted() {
        this.loadUserRating();
    },
    methods: {
        async loadUserRating() {
            try {
                const data = await Api.get('/api/dianying/rating/get/get', { movie_id: this.movie.id });
                if (data) {
                    this.userRating = data.score;
                }
            } catch (error) {
                console.error('加载评分失败:', error);
            }
        },
        setRating(score) {
            this.userRating = score;
        },
        async submitRating() {
            if (this.ratingLoading) return;
            if (!this.userRating) {
                this.$root.showToast('请先选择评分', 'error');
                return;
            }

            this.ratingLoading = true;
            try {
                await Api.post('/api/dianying/rating/set', {
                    movie_id: this.movie.id,
                    score: this.userRating
                });
                this.$root.showToast('评分成功', 'success');
                this.$emit('refresh');
                this.$emit('close');
            } catch (error) {
                this.$root.showToast(error.message, 'error');
            } finally {
                this.ratingLoading = false;
            }
        },
        async toggleFavorite() {
            try {
                await Api.post('/api/dianying/favorite/toggle', { movie_id: this.movie.id });
                this.$root.showToast('操作成功', 'success');
                this.$emit('refresh');
            } catch (error) {
                this.$root.showToast(error.message, 'error');
            }
        },
        handleImageError(event) {
            event.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><rect fill="%23667eea" width="300" height="400"/><text x="50%" y="50%" fill="white" font-size="48" text-anchor="middle" dy=".3em">🎬</text></svg>';
        }
    }
};
