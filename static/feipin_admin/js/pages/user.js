const UsersPage = {
    currentPage: 1,
    pageSize: 10,
    keyword: '',
    role: '',

    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="admin-layout">
                ${this.renderSidebar()}
                <div class="main-wrapper">
                    ${this.renderHeader('用户管理')}
                    <div class="main-content">
                        <div class="page-header">
                            <h1 class="page-title">用户管理</h1>
                            <p class="page-subtitle">管理平台所有用户和回收员</p>
                        </div>
                        
                        <div class="card">
                            <div class="card-header">
                                <h2 class="card-title">用户列表</h2>
                            </div>
                            <div class="card-body">
                                <div class="toolbar">
                                    <div class="toolbar-left">
                                        <div class="search-box">
                                            <span class="search-icon">🔍</span>
                                            <input type="text" class="form-control" id="searchInput" placeholder="搜索手机号、昵称...">
                                        </div>
                                        <select class="form-control" id="roleFilter" style="min-width: 140px;">
                                            <option value="">全部角色</option>
                                            <option value="user">普通用户</option>
                                            <option value="collector">回收员</option>
                                        </select>
                                        <button class="btn btn-primary" id="searchBtn">
                                            <span>🔍</span>
                                            <span>搜索</span>
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="table-container">
                                    <table class="table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>用户信息</th>
                                                <th>手机号</th>
                                                <th>角色</th>
                                                <th>余额</th>
                                                <th>状态</th>
                                                <th>注册时间</th>
                                                <th>操作</th>
                                            </tr>
                                        </thead>
                                        <tbody id="usersTableBody">
                                            <tr>
                                                <td colspan="8" class="text-center">加载中...</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div class="pagination" id="pagination">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
        this.loadUsers();
    },

    renderSidebar() {
        const user = AuthService.getCurrentUser();
        const userInitial = user && user.real_name ? user.real_name.charAt(0) : (user && user.username ? user.username.charAt(0) : 'A');
        
        return `
            <div class="sidebar">
                <div class="sidebar-header">
                    <div class="sidebar-logo">
                        <div class="sidebar-logo-icon">♻️</div>
                        <div class="sidebar-logo-text">
                            <span class="sidebar-title">回收宝</span>
                            <span class="sidebar-subtitle">废品回收平台</span>
                        </div>
                    </div>
                </div>
                <div class="sidebar-nav">
                    <div class="sidebar-nav-title">工作台</div>
                    <div class="nav-item" data-page="dashboard">
                        <span class="nav-icon">📊</span>
                        <span class="nav-text">数据看板</span>
                    </div>
                    <div class="sidebar-nav-title">订单管理</div>
                    <div class="nav-item" data-page="orders">
                        <span class="nav-icon">📋</span>
                        <span class="nav-text">订单列表</span>
                    </div>
                    <div class="sidebar-nav-title">用户管理</div>
                    <div class="nav-item active" data-page="users">
                        <span class="nav-icon">👥</span>
                        <span class="nav-text">用户管理</span>
                    </div>
                    <div class="nav-item" data-page="collectors">
                        <span class="nav-icon">🚚</span>
                        <span class="nav-text">回收员审核</span>
                    </div>
                    <div class="sidebar-nav-title">系统管理</div>
                    <div class="nav-item" data-page="categories">
                        <span class="nav-icon">🏷️</span>
                        <span class="nav-text">分类管理</span>
                    </div>
                </div>
                <div class="sidebar-footer">
                    <div class="sidebar-user">
                        <div class="sidebar-user-avatar">${userInitial}</div>
                        <div class="sidebar-user-info">
                            <div class="sidebar-user-name">${user && user.real_name ? user.real_name : (user && user.username ? user.username : '管理员')}</div>
                            <div class="sidebar-user-role">系统管理员</div>
                        </div>
                    </div>
                    <div class="sidebar-logout" id="logoutBtn">
                        <span>🚪</span>
                        <span>退出登录</span>
                    </div>
                </div>
            </div>
        `;
    },

    renderHeader(title) {
        return `
            <div class="header">
                <div class="header-left">
                    <h1 class="header-title">${title}</h1>
                </div>
                <div class="header-right">
                    <div class="user-info" id="userDropdown">
                        <div class="user-avatar">A</div>
                        <div>
                            <div class="user-name">管理员</div>
                            <div class="user-role">系统管理</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    bindEvents() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                if (page) {
                    Router.navigate(page);
                }
            });
        });

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await AuthService.logout();
                Toast.success('已退出登录');
                Router.navigate('login');
            });
        }

        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.keyword = document.getElementById('searchInput').value.trim();
                this.role = document.getElementById('roleFilter').value;
                this.currentPage = 1;
                this.loadUsers();
            });
        }

        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.keyword = searchInput.value.trim();
                    this.role = document.getElementById('roleFilter').value;
                    this.currentPage = 1;
                    this.loadUsers();
                }
            });
        }
    },

    async loadUsers() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        try {
            const params = {
                page: this.currentPage,
                page_size: this.pageSize
            };
            if (this.keyword) params.keyword = this.keyword;
            if (this.role) params.role = this.role;

            const result = await ApiService.get('/feipin/user/list/get', params);
            
            if (result.code === 0 && result.data) {
                const data = result.data;
                this.renderTable(data.items);
                this.renderPagination(data);
            } else {
                tbody.innerHTML = `<tr><td colspan="8" class="text-center">${result.msg || '加载失败'}</td></tr>`;
            }
        } catch (error) {
            console.error('加载用户列表失败:', error);
            tbody.innerHTML = `<tr><td colspan="8" class="text-center">加载失败，请重试</td></tr>`;
        }
    },

    renderTable(users) {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        if (!users || users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8">
                        <div class="empty-state">
                            <div class="empty-state-icon">👥</div>
                            <div class="empty-state-title">暂无用户数据</div>
                            <div class="empty-state-text">用户注册后将显示在这里</div>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>
                    <div class="flex items-center gap-2">
                        <div class="avatar-md">${user.nickname ? user.nickname.charAt(0) : '用'}</div>
                        <div>
                            <div class="font-semibold">${user.nickname || '用户' + user.id}</div>
                        </div>
                    </div>
                </td>
                <td>${user.phone}</td>
                <td>
                    <span class="badge ${user.role === 'collector' ? 'badge-info' : 'badge-secondary'}">
                        ${user.role_text || user.role}
                    </span>
                </td>
                <td>¥${(user.balance || 0).toFixed(2)}</td>
                <td>
                    <span class="badge ${user.status === 0 ? 'badge-success' : user.status === 1 ? 'badge-warning' : 'badge-danger'}">
                        ${user.status_text || '未知'}
                    </span>
                </td>
                <td>${user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</td>
                <td>
                    <div class="table-actions">
                        ${user.status !== 2 ? `
                            <button class="btn btn-sm btn-danger" onclick="UsersPage.banUser(${user.id})">禁用</button>
                        ` : `
                            <button class="btn btn-sm btn-success" onclick="UsersPage.unbanUser(${user.id})">启用</button>
                        `}
                    </div>
                </td>
            </tr>
        `).join('');
    },

    renderPagination(data) {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;

        const totalPages = data.total_pages || 1;
        const currentPage = data.page || 1;

        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let html = `<span class="pagination-info">共 ${data.total} 条，第 ${currentPage}/${totalPages} 页</span>`;
        
        html += `<button class="pagination-btn" onclick="UsersPage.goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>‹</button>`;
        
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);
        
        if (startPage > 1) {
            html += `<button class="pagination-btn" onclick="UsersPage.goToPage(1)">1</button>`;
            if (startPage > 2) {
                html += `<span class="pagination-info">...</span>`;
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="UsersPage.goToPage(${i})">${i}</button>`;
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += `<span class="pagination-info">...</span>`;
            }
            html += `<button class="pagination-btn" onclick="UsersPage.goToPage(${totalPages})">${totalPages}</button>`;
        }
        
        html += `<button class="pagination-btn" onclick="UsersPage.goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>›</button>`;
        
        pagination.innerHTML = html;
    },

    goToPage(page) {
        this.currentPage = page;
        this.loadUsers();
    },

    async banUser(userId) {
        try {
            const result = await ApiService.post('/feipin/user/ban', {}, { user_id: userId });
            if (result.code === 0) {
                Toast.success('禁用成功');
                this.loadUsers();
            } else {
                Toast.error(result.msg || '禁用失败');
            }
        } catch (error) {
            Toast.error('禁用失败，请重试');
        }
    },

    async unbanUser(userId) {
        try {
            const result = await ApiService.post('/feipin/user/unban', {}, { user_id: userId });
            if (result.code === 0) {
                Toast.success('启用成功');
                this.loadUsers();
            } else {
                Toast.error(result.msg || '启用失败');
            }
        } catch (error) {
            Toast.error('启用失败，请重试');
        }
    }
};

window.UsersPage = UsersPage;
