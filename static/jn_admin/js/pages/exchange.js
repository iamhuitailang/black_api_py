const ExchangePage = {
    currentPage: 1,
    pageSize: 10,
    total: 0,
    exchanges: [],
    status: null,
    keyword: '',

    render() {
        const app = document.getElementById('app');
        const user = AuthService.getCurrentUser();
        
        app.innerHTML = this.layout(user);
        
        this.bindEvents();
        this.loadExchanges();
    },

    layout(user) {
        return `
            <div class="admin-layout">
                <div class="sidebar">
                    <div class="sidebar-header">
                        <div class="sidebar-logo">
                            <div class="sidebar-logo-icon">🔄</div>
                            <div class="sidebar-logo-text">
                                <span class="sidebar-title">易技圈管理</span>
                                <span class="sidebar-subtitle">技能交换平台</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="sidebar-nav">
                        <div class="nav-section">
                            <div class="nav-section-title">主菜单</div>
                            <div class="nav-item" data-route="dashboard">
                                <span class="nav-icon">📊</span>
                                <span class="nav-text">数据概览</span>
                            </div>
                            <div class="nav-item" data-route="user">
                                <span class="nav-icon">👥</span>
                                <span class="nav-text">用户管理</span>
                            </div>
                            <div class="nav-item" data-route="category">
                                <span class="nav-icon">📁</span>
                                <span class="nav-text">分类管理</span>
                            </div>
                            <div class="nav-item active" data-route="exchange">
                                <span class="nav-icon">🔄</span>
                                <span class="nav-text">交换订单</span>
                            </div>
                            <div class="nav-item" data-route="statistics">
                                <span class="nav-icon">📈</span>
                                <span class="nav-text">数据统计</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="sidebar-footer">
                        <div class="sidebar-user">
                            <div class="sidebar-user-avatar">${user?.real_name?.charAt(0) || 'A'}</div>
                            <div class="sidebar-user-info">
                                <div class="sidebar-user-name">${user?.real_name || '管理员'}</div>
                                <div class="sidebar-user-role">${user?.username || 'admin'}</div>
                            </div>
                        </div>
                        <div class="sidebar-logout" id="logoutBtn">
                            <span>🚪</span>
                            <span>退出登录</span>
                        </div>
                    </div>
                </div>
                
                <div class="main-wrapper">
                    <div class="header">
                        <div class="header-left">
                            <h1 class="header-title">交换订单管理</h1>
                        </div>
                        <div class="header-right">
                            <div class="user-info">
                                <div class="user-avatar">${user?.real_name?.charAt(0) || 'A'}</div>
                                <span class="user-name">${user?.real_name || '管理员'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="main-content">
                        <div class="page-header">
                            <h2 class="page-title">交换订单管理</h2>
                            <p class="page-subtitle">处理异常订单，查看交换记录</p>
                        </div>
                        
                        <div class="toolbar">
                            <div class="toolbar-left">
                                <div class="search-box">
                                    <span class="search-icon">🔍</span>
                                    <input type="text" class="form-control" id="searchKeyword" placeholder="搜索留言...">
                                </div>
                                <select class="form-control" id="statusFilter" style="width: 160px;">
                                    <option value="">全部状态</option>
                                    <option value="待确认">待确认</option>
                                    <option value="已接受">已接受</option>
                                    <option value="进行中">进行中</option>
                                    <option value="已完成">已完成</option>
                                    <option value="已拒绝">已拒绝</option>
                                    <option value="已取消">已取消</option>
                                </select>
                                <button class="btn btn-primary" id="searchBtn">搜索</button>
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="table-container">
                                <table class="table" id="exchangeTable">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>发起方</th>
                                            <th>接收方</th>
                                            <th>提供技能</th>
                                            <th>需求技能</th>
                                            <th>状态</th>
                                            <th>创建时间</th>
                                            <th>操作</th>
                                        </tr>
                                    </thead>
                                    <tbody id="exchangeTableBody">
                                        <tr><td colspan="8" class="text-center"><span class="loading"></span> 加载中...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                            
                            <div class="card-footer" id="paginationContainer">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="modal-overlay" id="exchangeModal">
                <div class="modal modal-lg">
                    <div class="modal-header">
                        <h3 class="modal-title">订单详情</h3>
                        <button class="modal-close" data-close="exchangeModal">&times;</button>
                    </div>
                    <div class="modal-body" id="exchangeModalBody">
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" data-close="exchangeModal">关闭</button>
                    </div>
                </div>
            </div>
            
            <div class="modal-overlay" id="confirmModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title" id="confirmTitle">确认操作</h3>
                        <button class="modal-close" data-close="confirmModal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p class="confirm-text" id="confirmMessage">确认执行此操作吗？</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" data-close="confirmModal">取消</button>
                        <button class="btn btn-primary" id="confirmAction">确认</button>
                    </div>
                </div>
            </div>
        `;
    },

    bindEvents() {
        document.querySelectorAll('.nav-item[data-route]').forEach(item => {
            item.addEventListener('click', () => {
                const route = item.dataset.route;
                Router.navigate(route);
            });
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        document.getElementById('searchBtn').addEventListener('click', () => {
            this.keyword = document.getElementById('searchKeyword').value.trim();
            this.status = document.getElementById('statusFilter').value || null;
            this.currentPage = 1;
            this.loadExchanges();
        });

        document.querySelectorAll('[data-close]').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.dataset.close;
                document.getElementById(modalId).classList.remove('show');
            });
        });
    },

    async loadExchanges() {
        const tbody = document.getElementById('exchangeTableBody');
        tbody.innerHTML = '<tr><td colspan="8" class="text-center"><span class="loading"></span> 加载中...</td></tr>';

        try {
            const params = {
                page: this.currentPage,
                page_size: this.pageSize
            };

            if (this.keyword) {
                params.keyword = this.keyword;
            }

            if (this.status) {
                params.status = this.status;
            }

            const result = await ApiService.get('/jn/admin/exchange/list/get', params);
            
            if (result.code === 0 && result.data) {
                this.exchanges = result.data.items || [];
                this.total = result.data.total || 0;
                this.renderTable();
                this.renderPagination();
            } else {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">加载失败</td></tr>';
            }
        } catch (error) {
            console.error('加载订单失败:', error);
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">加载失败</td></tr>';
        }
    },

    getStatusBadgeClass(status) {
        const statusMap = {
            '待确认': 'badge-warning',
            '已接受': 'badge-info',
            '进行中': 'badge-primary',
            '已完成': 'badge-success',
            '已拒绝': 'badge-danger',
            '已取消': 'badge-secondary'
        };
        return statusMap[status] || 'badge-secondary';
    },

    renderTable() {
        const tbody = document.getElementById('exchangeTableBody');
        
        if (this.exchanges.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center"><div class="empty-state"><div class="empty-state-icon">🔄</div><p>暂无订单数据</p></div></td></tr>';
            return;
        }

        let html = '';
        this.exchanges.forEach(ex => {
            const statusClass = this.getStatusBadgeClass(ex.status);
            
            html += `
                <tr>
                    <td>${ex.id}</td>
                    <td>
                        ${ex.from_user_info ? `
                            <div class="flex-center" style="gap: 8px; justify-content: flex-start;">
                                <div class="user-avatar-small">${ex.from_user_info.nickname?.charAt(0) || 'U'}</div>
                                <span>${ex.from_user_info.nickname}</span>
                            </div>
                        ` : ex.from_user}
                    </td>
                    <td>
                        ${ex.to_user_info ? `
                            <div class="flex-center" style="gap: 8px; justify-content: flex-start;">
                                <div class="user-avatar-small">${ex.to_user_info.nickname?.charAt(0) || 'U'}</div>
                                <span>${ex.to_user_info.nickname}</span>
                            </div>
                        ` : ex.to_user}
                    </td>
                    <td><span class="skill-tag">${ex.offer_skill_info?.name || ex.offer_skill_id}</span></td>
                    <td><span class="skill-tag" style="background: rgba(6, 182, 212, 0.1); border-color: rgba(6, 182, 212, 0.2); color: var(--secondary-color);">${ex.need_skill_info?.name || ex.need_skill_id}</span></td>
                    <td><span class="badge ${statusClass}">${ex.status}</span></td>
                    <td>${ex.created_at?.split('T')[0] || '-'}</td>
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-sm btn-secondary" onclick="ExchangePage.viewDetail(${ex.id})">详情</button>
                            ${ex.status !== '已完成' && ex.status !== '已拒绝' && ex.status !== '已取消' 
                                ? `<button class="btn btn-sm btn-danger" onclick="ExchangePage.cancelExchange(${ex.id})">取消</button>`
                                : ''
                            }
                        </div>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    },

    renderPagination() {
        const container = document.getElementById('paginationContainer');
        const totalPages = Math.ceil(this.total / this.pageSize);

        if (totalPages <= 1) {
            container.innerHTML = `<div class="pagination-info">共 ${this.total} 条记录</div>`;
            return;
        }

        let html = `
            <div class="pagination">
                <span class="pagination-info">共 ${this.total} 条记录</span>
                <button class="pagination-btn" onclick="ExchangePage.goToPage(${this.currentPage - 1})" ${this.currentPage <= 1 ? 'disabled' : ''}>‹</button>
        `;

        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, startPage + 4);

        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" onclick="ExchangePage.goToPage(${i})">${i}</button>`;
        }

        html += `
                <button class="pagination-btn" onclick="ExchangePage.goToPage(${this.currentPage + 1})" ${this.currentPage >= totalPages ? 'disabled' : ''}>›</button>
            </div>
        `;

        container.innerHTML = html;
    },

    goToPage(page) {
        const totalPages = Math.ceil(this.total / this.pageSize);
        if (page < 1 || page > totalPages) return;
        this.currentPage = page;
        this.loadExchanges();
    },

    async viewDetail(exchangeId) {
        try {
            const result = await ApiService.get('/jn/admin/exchange/detail/get', { exchange_id: exchangeId });
            
            if (result.code === 0 && result.data) {
                const ex = result.data;
                const statusClass = this.getStatusBadgeClass(ex.status);
                
                const body = document.getElementById('exchangeModalBody');
                body.innerHTML = `
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">订单ID</label>
                            <div class="form-control" style="background: var(--bg-primary);">${ex.id}</div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">状态</label>
                            <div><span class="badge ${statusClass}" style="padding: 8px 16px; font-size: 14px;">${ex.status}</span></div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">发起方</label>
                        <div class="card" style="padding: 12px; display: flex; align-items: center; gap: 12px; margin-top: 8px;">
                            <div class="user-avatar-small" style="width: 40px; height: 40px; font-size: 16px;">${ex.from_user_info?.nickname?.charAt(0) || 'U'}</div>
                            <div>
                                <div style="font-weight: 600;">${ex.from_user_info?.nickname || '未知'}</div>
                                <div style="color: var(--text-secondary); font-size: 13px;">${ex.from_user_info?.phone || ''}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">接收方</label>
                        <div class="card" style="padding: 12px; display: flex; align-items: center; gap: 12px; margin-top: 8px;">
                            <div class="user-avatar-small" style="width: 40px; height: 40px; font-size: 16px;">${ex.to_user_info?.nickname?.charAt(0) || 'U'}</div>
                            <div>
                                <div style="font-weight: 600;">${ex.to_user_info?.nickname || '未知'}</div>
                                <div style="color: var(--text-secondary); font-size: 13px;">${ex.to_user_info?.phone || ''}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">提供的技能</label>
                            <div class="form-control" style="background: var(--bg-primary);">${ex.offer_skill_info?.name || '未知'}</div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">需求的技能</label>
                            <div class="form-control" style="background: var(--bg-primary);">${ex.need_skill_info?.name || '未知'}</div>
                        </div>
                    </div>
                    
                    ${ex.message ? `
                        <div class="form-group">
                            <label class="form-label">邀请留言</label>
                            <div class="form-control" style="background: var(--bg-primary); min-height: 80px; white-space: pre-wrap;">${ex.message}</div>
                        </div>
                    ` : ''}
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">创建时间</label>
                            <div class="form-control" style="background: var(--bg-primary);">${ex.created_at || '-'}</div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">更新时间</label>
                            <div class="form-control" style="background: var(--bg-primary);">${ex.updated_at || '-'}</div>
                        </div>
                    </div>
                `;

                document.getElementById('exchangeModal').classList.add('show');
            } else {
                Toast.error(result.msg || '获取订单详情失败');
            }
        } catch (error) {
            Toast.error('获取订单详情失败');
        }
    },

    showConfirm(title, message, callback) {
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        document.getElementById('confirmModal').classList.add('show');

        const btn = document.getElementById('confirmAction');
        btn.onclick = async () => {
            document.getElementById('confirmModal').classList.remove('show');
            try {
                await callback();
            } catch (error) {
                Toast.error(error.message || '操作失败');
            }
        };
    },

    async cancelExchange(exchangeId) {
        this.showConfirm('取消订单确认', '确定要取消该订单吗？此操作不可恢复。', async () => {
            const result = await ApiService.post('/jn/admin/exchange/cancel', { exchange_id: exchangeId });
            if (result.code === 0) {
                Toast.success('订单已取消');
                this.loadExchanges();
            } else {
                Toast.error(result.msg || '操作失败');
            }
        });
    },

    async handleLogout() {
        try {
            await AuthService.logout();
            Toast.success('已退出登录');
            Router.navigate('login');
        } catch (error) {
            Toast.error(error.message || '退出失败');
        }
    }
};

window.ExchangePage = ExchangePage;
