const GameRecordsPage = {
    data: {
        records: [],
        total: 0,
        page: 1,
        pageSize: 20,
        filters: {
            username: '',
            ai_difficulty: '',
            result: '',
            start_date: '',
            end_date: ''
        }
    },

    render() {
        if (!AuthService.requireAuth()) return;

        const content = `
            <div class="page-header">
                <h2>📋 游戏记录管理</h2>
            </div>

            <div class="table-card">
                <div class="filter-bar">
                    <div class="filter-item">
                        <label>用户名</label>
                        <input type="text" id="filterUsername" placeholder="请输入用户名" value="${this.data.filters.username}" />
                    </div>
                    <div class="filter-item">
                        <label>AI难度</label>
                        <select id="filterDifficulty">
                            <option value="">全部</option>
                            <option value="0" ${this.data.filters.ai_difficulty === '0' ? 'selected' : ''}>简单</option>
                            <option value="1" ${this.data.filters.ai_difficulty === '1' ? 'selected' : ''}>普通</option>
                            <option value="2" ${this.data.filters.ai_difficulty === '2' ? 'selected' : ''}>困难</option>
                        </select>
                    </div>
                    <div class="filter-item">
                        <label>游戏结果</label>
                        <select id="filterResult">
                            <option value="">全部</option>
                            <option value="1" ${this.data.filters.result === '1' ? 'selected' : ''}>胜利</option>
                            <option value="0" ${this.data.filters.result === '0' ? 'selected' : ''}>失败</option>
                        </select>
                    </div>
                    <div class="filter-item">
                        <label>开始日期</label>
                        <input type="date" id="filterStartDate" value="${this.data.filters.start_date}" />
                    </div>
                    <div class="filter-item">
                        <label>结束日期</label>
                        <input type="date" id="filterEndDate" value="${this.data.filters.end_date}" />
                    </div>
                    <div class="filter-item">
                        <button class="btn btn-primary" id="searchBtn">搜索</button>
                    </div>
                    <div class="filter-item">
                        <button class="btn btn-outline" id="resetBtn">重置</button>
                    </div>
                </div>

                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>用户</th>
                                <th>难度</th>
                                <th>角色</th>
                                <th>结果</th>
                                <th>得分</th>
                                <th>金币变化</th>
                                <th>炸弹数</th>
                                <th>游戏时长</th>
                                <th>时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="recordsTable">
                            <tr><td colspan="11"><div class="loading">加载中...</div></td></tr>
                        </tbody>
                    </table>
                </div>

                <div class="pagination" id="pagination"></div>
            </div>
        `;

        const app = document.getElementById('app');
        app.innerHTML = Layout.render(content);
        Layout.setPageTitle('📋 游戏记录管理');
        Layout.init();

        this.bindEvents();
        this.loadRecords();
    },

    bindEvents() {
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.data.filters.username = document.getElementById('filterUsername').value;
            this.data.filters.ai_difficulty = document.getElementById('filterDifficulty').value;
            this.data.filters.result = document.getElementById('filterResult').value;
            this.data.filters.start_date = document.getElementById('filterStartDate').value;
            this.data.filters.end_date = document.getElementById('filterEndDate').value;
            this.data.page = 1;
            this.loadRecords();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.data.filters = {
                username: '',
                ai_difficulty: '',
                result: '',
                start_date: '',
                end_date: ''
            };
            this.data.page = 1;
            document.getElementById('filterUsername').value = '';
            document.getElementById('filterDifficulty').value = '';
            document.getElementById('filterResult').value = '';
            document.getElementById('filterStartDate').value = '';
            document.getElementById('filterEndDate').value = '';
            this.loadRecords();
        });
    },

    async loadRecords() {
        try {
            const params = {
                page: this.data.page,
                page_size: this.data.pageSize
            };

            if (this.data.filters.username) {
                params.username = this.data.filters.username;
            }
            if (this.data.filters.ai_difficulty !== '') {
                params.ai_difficulty = parseInt(this.data.filters.ai_difficulty);
            }
            if (this.data.filters.result !== '') {
                params.result = parseInt(this.data.filters.result);
            }
            if (this.data.filters.start_date) {
                params.start_date = this.data.filters.start_date;
            }
            if (this.data.filters.end_date) {
                params.end_date = this.data.filters.end_date;
            }

            const result = await Api.get('/admin/game/records/get', params);

            if (result.code === 0 && result.data) {
                this.data.records = result.data.items || [];
                this.data.total = result.data.total || 0;
                this.renderTable();
                this.renderPagination();
            } else {
                document.getElementById('recordsTable').innerHTML = '<tr><td colspan="11"><div class="empty">加载失败</div></td></tr>';
            }
        } catch (error) {
            console.error('Load records error:', error);
            document.getElementById('recordsTable').innerHTML = '<tr><td colspan="11"><div class="empty">加载失败</div></td></tr>';
        }
    },

    renderTable() {
        const tbody = document.getElementById('recordsTable');
        const records = this.data.records;

        if (!records || records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="11"><div class="empty">暂无数据</div></td></tr>';
            return;
        }

        const difficultyMap = { 0: '简单', 1: '普通', 2: '困难' };

        tbody.innerHTML = records.map(r => `
            <tr>
                <td>${r.id}</td>
                <td>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <div class="user-avatar-small">${(r.username || 'U').charAt(0).toUpperCase()}</div>
                        <span>${r.username || '-'}</span>
                    </div>
                </td>
                <td><span class="badge badge-info">${difficultyMap[r.ai_difficulty] || '普通'}</span></td>
                <td>${r.is_landlord === 1 ? '👑 地主' : '👨‍🌾 农民'}</td>
                <td>
                    <span class="badge ${r.result === 1 ? 'badge-success' : 'badge-danger'}">
                        ${r.result === 1 ? '胜' : '负'}
                    </span>
                </td>
                <td>${r.score || 0}</td>
                <td class="${r.coins_change >= 0 ? 'text-green' : 'text-red'}">
                    ${r.coins_change >= 0 ? '+' : ''}${r.coins_change || 0}
                </td>
                <td>${r.bomb_count || 0}</td>
                <td>${this.formatDuration(r.duration_seconds || 0)}</td>
                <td>${new Date(r.created_at).toLocaleString()}</td>
                <td>
                    <button class="btn btn-outline btn-small" onclick="GameRecordsPage.viewDetail(${r.id})">详情</button>
                    ${AuthService.isSuperAdmin() ? `
                        <button class="btn btn-danger btn-small" onclick="GameRecordsPage.deleteRecord(${r.id})">删除</button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    },

    formatDuration(seconds) {
        if (!seconds) return '-';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}分${secs}秒`;
    },

    renderPagination() {
        const totalPages = Math.ceil(this.data.total / this.data.pageSize);
        const container = document.getElementById('pagination');

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = `
            <button ${this.data.page <= 1 ? 'disabled' : ''} onclick="GameRecordsPage.changePage(${this.data.page - 1})">上一页</button>
        `;

        const startPage = Math.max(1, this.data.page - 2);
        const endPage = Math.min(totalPages, startPage + 4);

        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button class="${i === this.data.page ? 'active' : ''}" onclick="GameRecordsPage.changePage(${i})">${i}</button>
            `;
        }

        html += `
            <button ${this.data.page >= totalPages ? 'disabled' : ''} onclick="GameRecordsPage.changePage(${this.data.page + 1})">下一页</button>
            <span>共 ${this.data.total} 条，第 ${this.data.page}/${totalPages} 页</span>
        `;

        container.innerHTML = html;
    },

    changePage(page) {
        this.data.page = page;
        this.loadRecords();
    },

    async viewDetail(id) {
        try {
            const result = await Api.get('/admin/game/record/get', { id });
            if (result.code === 0 && result.data) {
                const r = result.data;
                const difficultyMap = { 0: '简单', 1: '普通', 2: '困难' };
                
                const modalHtml = `
                    <div class="modal-overlay" id="detailModal">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h3>游戏记录详情 #${r.id}</h3>
                                <button class="btn-close" onclick="GameRecordsPage.closeModal()">×</button>
                            </div>
                            <div class="modal-body">
                                <div class="stats-grid-2" style="margin-bottom:20px;">
                                    <div class="stat-item">
                                        <div class="stat-item-value">${r.username || '-'}</div>
                                        <div class="stat-item-label">用户</div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-item-value">${difficultyMap[r.ai_difficulty] || '普通'}</div>
                                        <div class="stat-item-label">AI难度</div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-item-value">${r.is_landlord === 1 ? '👑 地主' : '👨‍🌾 农民'}</div>
                                        <div class="stat-item-label">角色</div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-item-value ${r.result === 1 ? 'text-green' : 'text-red'}">${r.result === 1 ? '胜利' : '失败'}</div>
                                        <div class="stat-item-label">结果</div>
                                    </div>
                                </div>
                                <div class="stats-grid-3">
                                    <div class="stat-item">
                                        <div class="stat-item-value">${r.score || 0}</div>
                                        <div class="stat-item-label">得分</div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-item-value ${r.coins_change >= 0 ? 'text-green' : 'text-red'}">${r.coins_change >= 0 ? '+' : ''}${r.coins_change || 0}</div>
                                        <div class="stat-item-label">金币变化</div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-item-value">${r.bomb_count || 0}</div>
                                        <div class="stat-item-label">炸弹数</div>
                                    </div>
                                </div>
                                <div style="margin-top:20px;padding:16px;background:#f8f9fa;border-radius:8px;">
                                    <div style="margin-bottom:8px;"><strong>游戏时长：</strong>${this.formatDuration(r.duration_seconds || 0)}</div>
                                    <div style="margin-bottom:8px;"><strong>创建时间：</strong>${new Date(r.created_at).toLocaleString()}</div>
                                    <div><strong>更新时间：</strong>${new Date(r.updated_at).toLocaleString()}</div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button class="btn btn-outline" onclick="GameRecordsPage.closeModal()">关闭</button>
                            </div>
                        </div>
                    </div>
                `;
                
                document.body.insertAdjacentHTML('beforeend', modalHtml);
            } else {
                Toast.error(result.msg || '获取详情失败');
            }
        } catch (error) {
            console.error('View detail error:', error);
            Toast.error('获取详情失败');
        }
    },

    async deleteRecord(id) {
        if (!confirm('确定要删除这条游戏记录吗？此操作不可撤销。')) return;

        try {
            const result = await Api.post('/admin/game/record/delete', { id });
            if (result.code === 0) {
                Toast.success('删除成功');
                this.loadRecords();
            } else {
                Toast.error(result.msg || '删除失败');
            }
        } catch (error) {
            console.error('Delete record error:', error);
            Toast.error('删除失败');
        }
    },

    closeModal() {
        const modal = document.getElementById('detailModal');
        if (modal) {
            modal.remove();
        }
    }
};
