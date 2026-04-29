const UserPage = {
    currentPage: 1,
    pageSize: 10,
    total: 0,
    users: [],
    keyword: '',
    status: null,

    render() {
        const app = document.getElementById('app');
        const user = AuthService.getCurrentUser();
        
        app.innerHTML = this.layout(user);
        
        this.bindEvents();
        this.loadUsers();
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
                            <div class="nav-item active" data-route="user">
                                <span class="nav-icon">👥</span>
                                <span class="nav-text">用户管理</span>
                            </div>
                            <div class="nav-item" data-route="category">
                                <span class="nav-icon">📁</span>
                                <span class="nav-text">分类管理</span>
                            </div>
                            <div class="nav-item" data-route="exchange">
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
                            <h1 class="header-title">用户管理</h1>
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
                            <h2 class="page-title">用户管理</h2>
                            <p class="page-subtitle">审核、封号、重置信用分</p>
                        </div>
                        
                        <div class="toolbar">
                            <div class="toolbar-left">
                                <div class="search-box">
                                    <span class="search-icon">🔍</span>
                                    <input type="text" class="form-control" id="searchKeyword" 
                                           placeholder="搜索手机号/昵称/城市...">
                                </div>
                                <select class="form-control" id="statusFilter" style="width: 140px;">
                                    <option value="">全部状态</option>
                                    <option value="0">正常</option>
                                    <option value="2">封号</option>
                                </select>
                                <button class="btn btn-primary" id="searchBtn">搜索</button>
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="table-container">
                                <table class="table" id="userTable">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>用户</th>
                                            <th>手机号</th>
                                            <th>信用分</th>
                                            <th>城市</th>
                                            <th>状态</th>
                                            <th>注册时间</th>
                                            <th>操作</th>
                                        </tr>
                                    </thead>
                                    <tbody id="userTableBody">
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
            
            <div class="modal-overlay" id="userModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">用户详情</h3>
                        <button class="modal-close" data-close="userModal">&times;</button>
                    </div>
                    <div class="modal-body" id="userModalBody">
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" data-close="userModal">关闭</button>
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
            const statusVal = document.getElementById('statusFilter').value;
            this.status = statusVal === '' ? null : parseInt(statusVal);
            this.currentPage = 1;
            this.loadUsers();
        });

        document.getElementById('searchKeyword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('searchBtn').click();
            }
        });

        document.querySelectorAll('[data-close]').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.dataset.close;
                document.getElementById(modalId).classList.remove('show');
            });
        });

        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('show');
                }
            });
        });
    },

    async loadUsers() {
        const tbody = document.getElementById('userTableBody');
        tbody.innerHTML = '<tr><td colspan="8" class="text-center"><span class="loading"></span> 加载中...</td></tr>';

        try {
            const params = {
                page: this.currentPage,
                page_size: this.pageSize
            };

            if (this.keyword) {
                params.keyword = this.keyword;
            }

            if (this.status !== null) {
                params.status = this.status;
            }

            const result = await ApiService.get('/jn/admin/user/list/get', params);
            
            if (result.code === 0 && result.data) {
                this.users = result.data.items || [];
                this.total = result.data.total || 0;
                this.renderTable();
                this.renderPagination();
            } else {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">加载失败</td></tr>';
            }
        } catch (error) {
            console.error('加载用户列表失败:', error);
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">加载失败</td></tr>';
        }
    },

    renderTable() {
        const tbody = document.getElementById('userTableBody');
        
        if (this.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center"><div class="empty-state"><div class="empty-state-icon">👥</div><p>暂无用户数据</p></div></td></tr>';
            return;
        }

        let html = '';
        this.users.forEach(user => {
            const statusClass = user.status === 2 ? 'badge-danger' : 'badge-success';
            const creditClass = user.credit >= 80 ? 'high' : (user.credit >= 50 ? 'medium' : 'low');
            
            html += `
                <tr>
                    <td>${user.id}</td>
                    <td>
                        <div class="flex-center" style="gap: 10px; justify-content: flex-start;">
                            <div class="user-avatar-small">${user.nickname?.charAt(0) || 'U'}</div>
                            <span>${user.nickname}</span>
                        </div>
                    </td>
                    <td>${user.phone}</td>
                    <td>
                        <div class="flex-center" style="gap: 8px; justify-content: flex-start;">
                            <div class="credit-bar">
                                <div class="credit-bar-fill ${creditClass}" style="width: ${user.credit}%;"></div>
                            </div>
                            <span class="badge ${creditClass === 'high' ? 'badge-success' : creditClass === 'medium' ? 'badge-warning' : 'badge-danger'}">${user.credit}</span>
                        </div>
                    </td>
                    <td>${user.location || '-'}</td>
                    <td><span class="badge ${statusClass}">${user.status_text}</span></td>
                    <td>${user.created_at?.split('T')[0] || '-'}</td>
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-sm btn-secondary" onclick="UserPage.viewUser(${user.id})">查看</button>
                            ${user.status === 2 
                                ? `<button class="btn btn-sm btn-success" onclick="UserPage.unbanUser(${user.id})">解封</button>`
                                : `<button class="btn btn-sm btn-danger" onclick="UserPage.banUser(${user.id})">封号</button>`
                            }
                            <button class="btn btn-sm btn-warning" onclick="UserPage.resetCredit(${user.id})">重置信用</button>
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
                <button class="pagination-btn" onclick="UserPage.goToPage(${this.currentPage - 1})" ${this.currentPage <= 1 ? 'disabled' : ''}>‹</button>
        `;

        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, startPage + 4);

        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" onclick="UserPage.goToPage(${i})">${i}</button>`;
        }

        html += `
                <button class="pagination-btn" onclick="UserPage.goToPage(${this.currentPage + 1})" ${this.currentPage >= totalPages ? 'disabled' : ''}>›</button>
            </div>
        `;

        container.innerHTML = html;
    },

    goToPage(page) {
        const totalPages = Math.ceil(this.total / this.pageSize);
        if (page < 1 || page > totalPages) return;
        this.currentPage = page;
        this.loadUsers();
    },

    async viewUser(userId) {
        try {
            const result = await ApiService.get('/jn/admin/user/detail/get', { user_id: userId });
            
            if (result.code === 0 && result.data) {
                const user = result.data;
                const statusClass = user.status === 2 ? 'badge-danger' : 'badge-success';
                
                const skillsResult = await ApiService.get('/jn/admin/user/skills/get', { user_id: userId });
                const skills = skillsResult.code === 0 ? skillsResult.data || [] : [];
                
                const offerSkills = skills.filter(s => s.type === 'offer');
                const needSkills = skills.filter(s => s.type === 'need');

                const body = document.getElementById('userModalBody');
                body.innerHTML = `
                    <div class="form-group">
                        <label class="form-label">基本信息</label>
                        <div class="card" style="padding: 16px; margin-top: 8px;">
                            <div class="flex-between" style="margin-bottom: 12px;">
                                <div class="flex-center" style="gap: 12px;">
                                    <div class="user-avatar-small" style="width: 48px; height: 48px; font-size: 20px;">${user.nickname?.charAt(0) || 'U'}</div>
                                    <div>
                                        <div style="font-weight: 600; font-size: 16px;">${user.nickname}</div>
                                        <div style="color: var(--text-secondary); font-size: 13px;">${user.phone}</div>
                                    </div>
                                </div>
                                <span class="badge ${statusClass}">${user.status_text}</span>
                            </div>
                            <div class="form-row">
                                <div class="form-group" style="margin-bottom: 0;">
                                    <label class="form-label">信用分</label>
                                    <div style="font-weight: 600; font-size: 20px; color: var(--primary-color);">${user.credit}</div>
                                </div>
                                <div class="form-group" style="margin-bottom: 0;">
                                    <label class="form-label">城市</label>
                                    <div>${user.location || '未填写'}</div>
                                </div>
                                <div class="form-group" style="margin-bottom: 0;">
                                    <label class="form-label">注册时间</label>
                                    <div>${user.created_at?.split('T')[0] || '-'}</div>
                                </div>
                            </div>
                            ${user.bio ? `<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color);">
                                <label class="form-label">个人简介</label>
                                <p style="color: var(--text-secondary); margin-top: 4px;">${user.bio}</p>
                            </div>` : ''}
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">提供的技能 (${offerSkills.length})</label>
                        ${offerSkills.length > 0 
                            ? `<div style="margin-top: 8px;">${offerSkills.map(s => `<span class="skill-tag">${s.name}</span>`).join('')}</div>`
                            : '<p style="color: var(--text-muted); margin-top: 8px;">暂无</p>'
                        }
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">想学的技能 (${needSkills.length})</label>
                        ${needSkills.length > 0 
                            ? `<div style="margin-top: 8px;">${needSkills.map(s => `<span class="skill-tag" style="background: rgba(6, 182, 212, 0.1); border-color: rgba(6, 182, 212, 0.2); color: var(--secondary-color);">${s.name}</span>`).join('')}</div>`
                            : '<p style="color: var(--text-muted); margin-top: 8px;">暂无</p>'
                        }
                    </div>
                `;

                document.getElementById('userModal').classList.add('show');
            } else {
                Toast.error(result.msg || '获取用户信息失败');
            }
        } catch (error) {
            Toast.error('获取用户信息失败');
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

    async banUser(userId) {
        this.showConfirm('封号确认', '确定要将该用户封号吗？封号后用户将无法登录。', async () => {
            const result = await ApiService.post('/jn/admin/user/ban', { user_id: userId });
            if (result.code === 0) {
                Toast.success('封号成功');
                this.loadUsers();
            } else {
                Toast.error(result.msg || '操作失败');
            }
        });
    },

    async unbanUser(userId) {
        this.showConfirm('解封确认', '确定要解封该用户吗？', async () => {
            const result = await ApiService.post('/jn/admin/user/unban', { user_id: userId });
            if (result.code === 0) {
                Toast.success('解封成功');
                this.loadUsers();
            } else {
                Toast.error(result.msg || '操作失败');
            }
        });
    },

    async resetCredit(userId) {
        this.showConfirm('重置信用分确认', '确定要将该用户的信用分重置为100吗？', async () => {
            const result = await ApiService.post('/jn/admin/user/credit/reset', { user_id: userId });
            if (result.code === 0) {
                Toast.success('信用分重置成功');
                this.loadUsers();
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

window.UserPage = UserPage;
