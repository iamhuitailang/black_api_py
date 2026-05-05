const RidesPage = {
    currentPage: 1,
    pageSize: 10,
    type: '',
    render: async function(params) {
        this.type = params.type || '';
        const pageContent = document.getElementById('page-content');
        
        pageContent.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">🗺️ 骑行记录</h1>
                <div class="page-actions">
                    <button class="btn btn-green" data-route="create-ride">+ 记录骑行</button>
                </div>
            </div>

            <div class="filter-bar">
                <div class="filter-item">
                    <label class="form-label" style="margin: 0;">开始日期：</label>
                    <input type="date" id="filter-start-date">
                </div>
                <div class="filter-item">
                    <label class="form-label" style="margin: 0;">结束日期：</label>
                    <input type="date" id="filter-end-date">
                </div>
                <div class="filter-item">
                    <button class="btn btn-sm btn-green" id="btn-filter">查询</button>
                </div>
            </div>

            <div id="rides-list">
                ${App.renderLoading()}
            </div>

            <div id="pagination" class="mt-4 text-center">
            </div>
        `;

        this.setupEventListeners();
        this.loadRides();
    },
    setupEventListeners: function() {
        const self = this;
        
        document.getElementById('btn-filter').addEventListener('click', function() {
            self.currentPage = 1;
            self.loadRides();
        });
    },
    loadRides: async function() {
        if (!Auth.isLoggedIn()) {
            Router.go('login');
            return;
        }

        const container = document.getElementById('rides-list');
        container.innerHTML = App.renderLoading();

        try {
            const startDate = document.getElementById('filter-start-date')?.value || '';
            const endDate = document.getElementById('filter-end-date')?.value || '';

            const params = {
                page: this.currentPage,
                page_size: this.pageSize
            };
            if (startDate) {
                params.start_date = startDate;
            }
            if (endDate) {
                params.end_date = endDate;
            }

            const result = await API.get('/ride/my/list/get', params);

            if (result.code === 0 && result.data) {
                this.renderRides(result.data.list || []);
                this.renderPagination(result.data.total || 0);
            } else {
                container.innerHTML = App.renderEmpty('🗺️', '暂无骑行记录', '快来记录你的第一次骑行吧');
            }
        } catch (error) {
            console.error('Load rides error:', error);
            container.innerHTML = App.renderEmpty('❌', '加载失败', '请稍后重试');
        }
    },
    renderRides: function(rides) {
        const container = document.getElementById('rides-list');

        if (!rides || rides.length === 0) {
            container.innerHTML = App.renderEmpty('🗺️', '暂无骑行记录', '快来记录你的第一次骑行吧');
            return;
        }

        container.innerHTML = rides.map(ride => {
            const avgSpeed = ride.avg_speed ? ride.avg_speed.toFixed(1) : (ride.distance && ride.duration ? ((ride.distance / (ride.duration / 60))).toFixed(1) : '0');

            return `
                <div class="card ride-card mb-4">
                    <div class="card-body">
                        <div class="flex items-center justify-between mb-3">
                            <div>
                                <h3 class="card-title" style="margin: 0;">${ride.route_name || '未命名路线'}</h3>
                                <div class="text-muted" style="margin-top: 4px;">${ride.date || '未记录日期'}</div>
                            </div>
                            <div class="flex gap-2">
                                <button class="btn btn-sm btn-outline" data-action="edit" data-id="${ride.id}">编辑</button>
                                <button class="btn btn-sm btn-danger" data-action="delete" data-id="${ride.id}">删除</button>
                            </div>
                        </div>
                        <div class="ride-stats">
                            <div class="ride-stat">
                                <div class="ride-stat-value">${ride.distance || 0}</div>
                                <div class="ride-stat-label">距离 (km)</div>
                            </div>
                            <div class="ride-stat">
                                <div class="ride-stat-value">${ride.duration || 0}</div>
                                <div class="ride-stat-label">时长 (分钟)</div>
                            </div>
                            <div class="ride-stat">
                                <div class="ride-stat-value">${avgSpeed}</div>
                                <div class="ride-stat-label">均速 (km/h)</div>
                            </div>
                            <div class="ride-stat">
                                <div class="ride-stat-value">${ride.elevation || 0}</div>
                                <div class="ride-stat-label">爬升 (m)</div>
                            </div>
                        </div>
                        ${ride.max_speed ? `
                            <div class="divider"></div>
                            <div class="flex gap-4">
                                <span class="text-muted">最高速度：<strong class="text-primary">${ride.max_speed} km/h</strong></span>
                            </div>
                        ` : ''}
                        ${ride.notes ? `
                            <div class="divider"></div>
                            <div>
                                <div class="text-muted mb-2">骑行笔记：</div>
                                <p style="white-space: pre-wrap; line-height: 1.6;">${ride.notes}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        this.setupActionListeners();
    },
    setupActionListeners: function() {
        const self = this;

        document.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', async function() {
                const rideId = parseInt(this.dataset.id);
                if (!confirm('确定要删除这条骑行记录吗？')) {
                    return;
                }

                try {
                    const result = await API.post('/ride/delete', { ride_id: rideId });
                    
                    if (result.code === 0) {
                        App.showToast('删除成功', 'success');
                        self.loadRides();
                    } else {
                        App.showToast(result.msg || '删除失败', 'error');
                    }
                } catch (error) {
                    App.showToast('删除失败，请稍后重试', 'error');
                }
            });
        });

        document.querySelectorAll('[data-action="edit"]').forEach(btn => {
            btn.addEventListener('click', function() {
                App.showToast('编辑功能开发中', 'warning');
            });
        });
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
                self.loadRides();
            });
        });
    }
};

Router.register('rides', function(params) {
    RidesPage.render(params);
});
