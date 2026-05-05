const ActivitiesPage = {
    currentPage: 1,
    pageSize: 10,
    status: '',
    type: '',
    render: async function(params) {
        this.type = params.type || '';
        const pageContent = document.getElementById('page-content');
        pageContent.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">🚴 骑行活动</h1>
                <div class="page-actions">
                    <button class="btn btn-green" data-route="create-activity">+ 发布活动</button>
                </div>
            </div>

            <div class="filter-bar">
                <div class="filter-item">
                    <select id="filter-status">
                        <option value="">全部状态</option>
                        <option value="招募中">招募中</option>
                        <option value="已满">已满</option>
                        <option value="进行中">进行中</option>
                        <option value="已结束">已结束</option>
                    </select>
                </div>
                <div class="filter-item">
                    <select id="filter-difficulty">
                        <option value="">全部难度</option>
                        <option value="初级">初级</option>
                        <option value="中级">中级</option>
                        <option value="高级">高级</option>
                        <option value="挑战">挑战</option>
                    </select>
                </div>
            </div>

            <div id="activities-list">
                ${App.renderLoading()}
            </div>

            <div id="pagination" class="mt-4 text-center">
            </div>
        `;

        this.setupEventListeners();
        this.loadActivities();
    },
    setupEventListeners: function() {
        const self = this;
        
        document.getElementById('filter-status').addEventListener('change', function() {
            self.status = this.value;
            self.currentPage = 1;
            self.loadActivities();
        });
    },
    loadActivities: async function() {
        const container = document.getElementById('activities-list');
        container.innerHTML = App.renderLoading();

        try {
            let result;
            
            if (this.type === 'my') {
                if (!Auth.isLoggedIn()) {
                    Router.go('login');
                    return;
                }
                result = await API.get('/activity/my/list/get', {
                    page: this.currentPage,
                    page_size: this.pageSize
                });
            } else {
                const params = {
                    page: this.currentPage,
                    page_size: this.pageSize
                };
                if (this.status) {
                    params.status = this.status;
                }
                result = await API.get('/activity/list/get', params);
            }

            if (result.code === 0 && result.data) {
                this.renderActivities(result.data.list || []);
                this.renderPagination(result.data.total || 0);
            } else {
                container.innerHTML = App.renderEmpty('🚴', '暂无活动', '快来发布第一个活动吧');
            }
        } catch (error) {
            console.error('Load activities error:', error);
            container.innerHTML = App.renderEmpty('❌', '加载失败', '请稍后重试');
        }
    },
    renderActivities: function(activities) {
        const container = document.getElementById('activities-list');

        if (!activities || activities.length === 0) {
            container.innerHTML = App.renderEmpty('🚴', '暂无活动', '快来发布第一个活动吧');
            return;
        }

        container.innerHTML = activities.map(activity => {
            const statusClass = this.getStatusClass(activity.status);
            const difficultyClass = this.getDifficultyClass(activity.difficulty);
            const progress = activity.max_people ? (activity.current_people / activity.max_people) * 100 : 0;

            return `
                <div class="card activity-card mb-4" data-route="activity-detail" data-id="${activity.id}">
                    <div class="card-body">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="card-title">${activity.title}</h3>
                            <div class="flex items-center gap-2">
                                <span class="activity-status status-${statusClass}">${activity.status}</span>
                                <span class="activity-difficulty difficulty-${difficultyClass}">${activity.difficulty || '初级'}</span>
                            </div>
                        </div>
                        <div class="activity-info">
                            <div class="activity-info-item">
                                <span>🗺️</span>
                                <span>${activity.route || '未指定路线'}</span>
                            </div>
                            <div class="activity-info-item">
                                <span>📏</span>
                                <span>${activity.distance || 0} km</span>
                            </div>
                            <div class="activity-info-item">
                                <span>⛰️</span>
                                <span>${activity.elevation || 0} m</span>
                            </div>
                            <div class="activity-info-item">
                                <span>⏰</span>
                                <span>${activity.pace || '待定'}</span>
                            </div>
                            <div class="activity-info-item">
                                <span>📍</span>
                                <span>${activity.meeting_point || '待定'}</span>
                            </div>
                            <div class="activity-info-item">
                                <span>📅</span>
                                <span>${activity.meeting_time || '待定'}</span>
                            </div>
                        </div>
                        <div class="activity-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progress}%"></div>
                            </div>
                            <div class="progress-text">
                                <span>已报名 ${activity.current_people || 0} 人</span>
                                <span>上限 ${activity.max_people || 0} 人</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },
    renderPagination: function(total) {
        const pagination = document.getElementById('pagination');
        const totalPages = Math.ceil(total / this.pageSize);

        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let html = '<div class="flex justify-center items-center gap-2">';
        
        if (this.currentPage > 1) {
            html += `<button class="btn btn-sm btn-outline" data-page="${this.currentPage - 1}">上一页</button>`;
        }

        for (let i = 1; i <= totalPages; i++) {
            if (i === this.currentPage) {
                html += `<button class="btn btn-sm btn-green" data-page="${i}">${i}</button>`;
            } else {
                html += `<button class="btn btn-sm btn-outline" data-page="${i}">${i}</button>`;
            }
        }

        if (this.currentPage < totalPages) {
            html += `<button class="btn btn-sm btn-outline" data-page="${this.currentPage + 1}">下一页</button>`;
        }

        html += '</div>';
        pagination.innerHTML = html;

        const self = this;
        pagination.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', function() {
                self.currentPage = parseInt(this.dataset.page);
                self.loadActivities();
            });
        });
    },
    getStatusClass: function(status) {
        const map = {
            '招募中': 'recruiting',
            '已满': 'full',
            '进行中': 'ongoing',
            '已结束': 'ended'
        };
        return map[status] || 'recruiting';
    },
    getDifficultyClass: function(difficulty) {
        const map = {
            '初级': 'easy',
            '中级': 'medium',
            '高级': 'hard',
            '挑战': 'challenge'
        };
        return map[difficulty] || 'easy';
    }
};

Router.register('activities', function(params) {
    ActivitiesPage.render(params);
});
