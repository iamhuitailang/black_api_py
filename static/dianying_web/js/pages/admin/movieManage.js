const MovieManagePage = {
    template: `
        <div class="admin-container">
            <div class="admin-tabs">
                <button class="admin-tab" @click="$router.push('/admin')">📊 数据概览</button>
                <button class="admin-tab active">🎬 电影管理</button>
            </div>

            <div class="page-header" style="margin-bottom: 20px;">
                <h2 style="color: #333; font-size: 20px;">电影列表</h2>
                <button class="btn btn-primary" @click="showAddModal = true">+ 添加电影</button>
            </div>

            <div class="filter-bar" style="margin-bottom: 20px;">
                <div class="form-group search-group">
                    <label>搜索</label>
                    <input type="text" v-model="filters.search" placeholder="搜索电影标题..." @input="handleSearch">
                </div>
                <div class="form-group">
                    <label>类型</label>
                    <select v-model="filters.genre" @change="loadMovies">
                        <option value="">全部类型</option>
                        <option v-for="g in genres" :key="g" :value="g">{{ g }}</option>
                    </select>
                </div>
            </div>

            <div v-if="loading" class="loading">
                <div class="spinner"></div>
                <p>加载中...</p>
            </div>

            <div v-else class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>海报</th>
                            <th>标题</th>
                            <th>年份</th>
                            <th>类型</th>
                            <th>评分</th>
                            <th>评价人数</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="movie in movies" :key="movie.id">
                            <td>
                                <img :src="movie.poster" :alt="movie.title" style="width: 50px; height: 70px; object-fit: cover; border-radius: 4px;">
                            </td>
                            <td>{{ movie.title }}</td>
                            <td>{{ movie.year || '-' }}</td>
                            <td>{{ movie.genre || '-' }}</td>
                            <td class="movie-rating">⭐ {{ movie.rating }}</td>
                            <td>{{ movie.rating_count }}</td>
                            <td>
                                <div class="table-actions">
                                    <button class="btn btn-primary" @click="editMovie(movie)" style="padding: 4px 12px; font-size: 12px;">编辑</button>
                                    <button class="btn btn-danger" @click="deleteMovie(movie)" style="padding: 4px 12px; font-size: 12px;">删除</button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
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

            <div v-if="showAddModal || showEditModal" class="modal-overlay" @click.self="closeModal">
                <div class="modal" style="max-width: 600px;">
                    <h3>{{ showEditModal ? '编辑电影' : '添加电影' }}</h3>
                    <div class="modal-content">
                        <form @submit.prevent="submitForm">
                            <div class="form-group">
                                <label>标题 *</label>
                                <input type="text" v-model="form.title" required>
                            </div>
                            <div class="form-group">
                                <label>海报链接</label>
                                <input type="text" v-model="form.poster" placeholder="海报图片URL">
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                <div class="form-group">
                                    <label>年份</label>
                                    <input type="number" v-model="form.year" min="1900" max="2100">
                                </div>
                                <div class="form-group">
                                    <label>时长（分钟）</label>
                                    <input type="number" v-model="form.duration" min="1">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>类型（多个用逗号分隔）</label>
                                <input type="text" v-model="form.genre" placeholder="剧情,爱情,科幻">
                            </div>
                            <div class="form-group">
                                <label>导演</label>
                                <input type="text" v-model="form.director">
                            </div>
                            <div class="form-group">
                                <label>演员（多个用逗号分隔）</label>
                                <input type="text" v-model="form.actors">
                            </div>
                            <div class="form-group">
                                <label>国家/地区</label>
                                <input type="text" v-model="form.country">
                            </div>
                            <div class="form-group">
                                <label>预告片链接</label>
                                <input type="text" v-model="form.trailer">
                            </div>
                            <div class="form-group">
                                <label>简介</label>
                                <textarea v-model="form.description" rows="4" placeholder="电影简介..."></textarea>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" @click="closeModal">取消</button>
                                <button type="submit" class="btn btn-primary" :disabled="submitting">
                                    {{ submitting ? '提交中...' : (showEditModal ? '保存修改' : '添加') }}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            movies: [],
            genres: [],
            filters: {
                search: '',
                genre: ''
            },
            loading: false,
            submitting: false,
            currentPage: 1,
            pageSize: 10,
            total: 0,
            showAddModal: false,
            showEditModal: false,
            editingMovie: null,
            form: {
                title: '',
                poster: '',
                year: null,
                genre: '',
                director: '',
                actors: '',
                description: '',
                trailer: '',
                duration: null,
                country: ''
            }
        };
    },
    computed: {
        totalPages() {
            return Math.ceil(this.total / this.pageSize);
        }
    },
    mounted() {
        this.loadGenres();
        this.loadMovies();
    },
    methods: {
        async loadGenres() {
            try {
                this.genres = await Api.get('/api/dianying/movie/genres/get');
            } catch (error) {
                console.error('加载类型失败:', error);
            }
        },
        async loadMovies() {
            this.loading = true;
            try {
                const params = {
                    page: this.currentPage,
                    page_size: this.pageSize,
                    ...(this.filters.genre && { genre: this.filters.genre }),
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
        handleSearch() {
            clearTimeout(this._searchTimeout);
            this._searchTimeout = setTimeout(() => {
                this.currentPage = 1;
                this.loadMovies();
            }, 500);
        },
        changePage(page) {
            this.currentPage = page;
            this.loadMovies();
        },
        editMovie(movie) {
            this.editingMovie = movie;
            this.form = {
                title: movie.title,
                poster: movie.poster || '',
                year: movie.year || null,
                genre: movie.genre || '',
                director: movie.director || '',
                actors: movie.actors || '',
                description: movie.description || '',
                trailer: movie.trailer || '',
                duration: movie.duration || null,
                country: movie.country || ''
            };
            this.showEditModal = true;
        },
        async submitForm() {
            if (this.submitting) return;

            this.submitting = true;
            try {
                const formData = {};
                Object.keys(this.form).forEach(key => {
                    if (this.form[key] !== '' && this.form[key] !== null) {
                        formData[key] = this.form[key];
                    }
                });

                if (this.showEditModal && this.editingMovie) {
                    formData.id = this.editingMovie.id;
                    await Api.post('/api/dianying/movie/update', formData);
                    this.$root.showToast('修改成功', 'success');
                } else {
                    await Api.post('/api/dianying/movie/create', formData);
                    this.$root.showToast('添加成功', 'success');
                }

                this.closeModal();
                this.loadMovies();
            } catch (error) {
                this.$root.showToast(error.message, 'error');
            } finally {
                this.submitting = false;
            }
        },
        async deleteMovie(movie) {
            if (!confirm(`确定要删除电影《${movie.title}》吗？`)) return;

            try {
                await Api.get('/api/dianying/movie/delete/get', { id: movie.id });
                this.$root.showToast('删除成功', 'success');
                this.loadMovies();
            } catch (error) {
                this.$root.showToast(error.message, 'error');
            }
        },
        closeModal() {
            this.showAddModal = false;
            this.showEditModal = false;
            this.editingMovie = null;
            this.resetForm();
        },
        resetForm() {
            this.form = {
                title: '',
                poster: '',
                year: null,
                genre: '',
                director: '',
                actors: '',
                description: '',
                trailer: '',
                duration: null,
                country: ''
            };
        }
    }
};
