const AdminLoginPage = {
    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page no-tabbar no-header">
                <div class="hero-section" style="text-align: center; padding: 60px 20px 40px;">
                    <div style="font-size: 64px; margin-bottom: 16px;">🔐</div>
                    <h1 class="hero-title">管理员登录</h1>
                    <p class="hero-subtitle">校园失物招领平台管理后台</p>
                </div>
                <main class="container">
                    <div class="card">
                        <form id="adminLoginForm">
                            <div class="form-group">
                                <label class="form-label">用户名 <span class="required">*</span></label>
                                <input type="text" class="form-input" id="adminUsername" placeholder="请输入管理员用户名">
                            </div>
                            <div class="form-group">
                                <label class="form-label">密码 <span class="required">*</span></label>
                                <input type="password" class="form-input" id="adminPassword" placeholder="请输入密码">
                            </div>
                            <button type="submit" class="btn btn-primary btn-block btn-lg" id="adminLoginBtn">登录</button>
                        </form>
                        <div style="margin-top: 16px; text-align: center;">
                            <a href="javascript:;" onclick="Router.navigate('login')" style="color: var(--text-secondary); font-size: 13px;">返回用户登录</a>
                        </div>
                    </div>
                </main>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
    },

    async handleLogin() {
        const username = document.getElementById('adminUsername').value.trim();
        const password = document.getElementById('adminPassword').value;
        const loginBtn = document.getElementById('adminLoginBtn');

        if (!username) {
            Toast.error('请输入用户名');
            return;
        }

        if (!password) {
            Toast.error('请输入密码');
            return;
        }

        loginBtn.disabled = true;
        loginBtn.innerHTML = '<div class="loading-spinner" style="width:20px;height:20px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px;"></div> 登录中...';

        try {
            const result = await AuthService.adminLogin(username, password);

            if (result.code === 0) {
                Toast.success('登录成功');
                Router.navigate('admin');
            } else {
                Toast.error(result.msg || '登录失败');
            }
        } catch (error) {
            Toast.error('登录失败，请检查网络');
        } finally {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '登录';
        }
    }
};

const AdminPage = {
    currentMenu: 'dashboard',
    stats: {},
    posts: [],
    users: [],

    render() {
        if (!AuthService.isAdminLoggedIn()) {
            Router.navigate('adminLogin');
            return;
        }

        const app = document.getElementById('app');
        const admin = AuthService.getCurrentAdmin() || {};

        app.innerHTML = `
            <div style="min-height: 100vh; background: var(--bg-color);">
                <aside class="admin-sidebar">
                    <div class="admin-logo">🔍 失物招领管理</div>
                    <div class="admin-menu-item ${this.currentMenu === 'dashboard' ? 'active' : ''}" onclick="AdminPage.switchMenu('dashboard')">
                        <span class="icon">📊</span>
                        <span>数据概览</span>
                    </div>
                    <div class="admin-menu-item ${this.currentMenu === 'posts' ? 'active' : ''}" onclick="AdminPage.switchMenu('posts')">
                        <span class="icon">📝</span>
                        <span>信息管理</span>
                    </div>
                    <div class="admin-menu-item ${this.currentMenu === 'users' ? 'active' : ''}" onclick="AdminPage.switchMenu('users')">
                        <span class="icon">👥</span>
                        <span>用户管理</span>
                    </div>
                    <div class="admin-menu-item ${this.currentMenu === 'claims' ? 'active' : ''}" onclick="AdminPage.switchMenu('claims')">
                        <span class="icon">📋</span>
                        <span>认领审核</span>
                    </div>
                    <div class="admin-menu-item" onclick="AdminPage.logout()" style="margin-top: auto;">
                        <span class="icon">🚪</span>
                        <span>退出登录</span>
                    </div>
                </aside>

                <main class="admin-content">
                    <div class="admin-header">
                        <h1 class="admin-title">${this.getMenuTitle()}</h1>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span style="color: var(--text-secondary);">管理员：${admin.username || 'Admin'}</span>
                        </div>
                    </div>
                    <div id="adminContent">
                        <div class="loading">
                            <div class="loading-spinner"></div>
                        </div>
                    </div>
                </main>
            </div>
        `;

        this.loadContent();
    },

    getMenuTitle() {
        const titles = {
            'dashboard': '数据概览',
            'posts': '信息管理',
            'users': '用户管理',
            'claims': '认领审核'
        };
        return titles[this.currentMenu] || '管理后台';
    },

    async switchMenu(menu) {
        this.currentMenu = menu;
        this.render();
    },

    async loadContent() {
        const content = document.getElementById('adminContent');
        
        switch (this.currentMenu) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'posts':
                await this.loadPosts();
                break;
            case 'users':
                await this.loadUsers();
                break;
            case 'claims':
                await this.loadClaims();
                break;
        }
    },

    async loadDashboard() {
        const content = document.getElementById('adminContent');
        try {
            const [lostResult, foundResult, claimedResult, usersResult] = await Promise.all([
                ApiService.get('/shiwu/post/list/get', { post_type: 'lost', page_size: 1 }, { useAdminToken: true }),
                ApiService.get('/shiwu/post/list/get', { post_type: 'found', page_size: 1 }, { useAdminToken: true }),
                ApiService.get('/shiwu/post/list/get', { status: 'claimed', page_size: 1 }, { useAdminToken: true }),
                ApiService.get('/shiwu/admin/user/list/get', { page_size: 1 }, { useAdminToken: true })
            ]);

            this.stats = {
                lost: lostResult.data?.total || 0,
                found: foundResult.data?.total || 0,
                claimed: claimedResult.data?.total || 0,
                users: usersResult.data?.total || 0
            };

            content.innerHTML = `
                <div class="admin-stats-grid">
                    <div class="stat-card">
                        <div class="number">${this.stats.users}</div>
                        <div class="label">用户总数</div>
                    </div>
                    <div class="stat-card">
                        <div class="number">${this.stats.lost}</div>
                        <div class="label">寻物启事</div>
                    </div>
                    <div class="stat-card">
                        <div class="number">${this.stats.found}</div>
                        <div class="label">招领启事</div>
                    </div>
                    <div class="stat-card">
                        <div class="number">${this.stats.claimed}</div>
                        <div class="label">已认领</div>
                    </div>
                </div>

                <div class="card" style="margin-top: 24px;">
                    <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 16px;">最近发布</h3>
                    <div id="recentPosts">
                        <div class="loading">
                            <div class="loading-spinner"></div>
                        </div>
                    </div>
                </div>
            `;

            await this.loadRecentPosts();
        } catch (error) {
            console.error('加载数据概览失败:', error);
            content.innerHTML = `
                <div class="empty">
                    <div class="empty-icon">❌</div>
                    <div class="empty-text">加载失败</div>
                </div>
            `;
        }
    },

    async loadRecentPosts() {
        const container = document.getElementById('recentPosts');
        try {
            const result = await ApiService.get('/shiwu/post/list/get', { page_size: 5 }, { useAdminToken: true });
            if (result.code === 0) {
                const posts = result.data.items || [];
                if (posts.length === 0) {
                    container.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">暂无数据</div>';
                    return;
                }
                container.innerHTML = posts.map(post => `
                    <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-color);">
                        <div style="flex: 1;">
                            <div style="font-weight: 500; margin-bottom: 4px;">${post.title}</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">
                                ${post.post_type === 'lost' ? '🔍 寻物' : '🫴 招领'} · 
                                ${Utils.getCategoryName(post.category_code)} · 
                                ${Utils.formatTime(post.created_at)}
                            </div>
                        </div>
                        <span class="admin-badge ${post.status === 'claimed' ? 'approved' : 'pending'}">
                            ${Utils.getPostStatusText(post.status)}
                        </span>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('加载最近发布失败:', error);
        }
    },

    async loadPosts() {
        const content = document.getElementById('adminContent');
        try {
            const result = await ApiService.get('/shiwu/post/list/get', { page_size: 20 }, { useAdminToken: true });
            if (result.code === 0) {
                this.posts = result.data.items || [];
                this.renderPosts();
            }
        } catch (error) {
            console.error('加载信息列表失败:', error);
            content.innerHTML = `
                <div class="empty">
                    <div class="empty-icon">❌</div>
                    <div class="empty-text">加载失败</div>
                </div>
            `;
        }
    },

    renderPosts() {
        const content = document.getElementById('adminContent');
        content.innerHTML = `
            <div class="admin-table">
                <div class="admin-table-header">
                    <div style="flex: 2;">标题</div>
                    <div style="flex: 1;">类型</div>
                    <div style="flex: 1;">分类</div>
                    <div style="flex: 1;">状态</div>
                    <div style="flex: 1;">发布时间</div>
                    <div style="flex: 1;">操作</div>
                </div>
                ${this.posts.map(post => `
                    <div class="admin-table-row">
                        <div class="admin-table-cell" style="flex: 2; font-weight: 500;">${post.title}</div>
                        <div class="admin-table-cell" style="flex: 1;">
                            ${post.post_type === 'lost' ? '🔍 寻物' : '🫴 招领'}
                        </div>
                        <div class="admin-table-cell" style="flex: 1;">${Utils.getCategoryName(post.category_code)}</div>
                        <div class="admin-table-cell" style="flex: 1;">
                            <span class="admin-badge ${post.status === 'claimed' ? 'approved' : post.status === 'expired' ? 'rejected' : 'pending'}">
                                ${Utils.getPostStatusText(post.status)}
                            </span>
                        </div>
                        <div class="admin-table-cell" style="flex: 1;">${Utils.formatTime(post.created_at)}</div>
                        <div class="admin-table-cell" style="flex: 1;">
                            <div class="admin-table-actions">
                                ${post.status !== 'claimed' ? `
                                    <button class="btn btn-success btn-sm" onclick="AdminPage.verifyPost(${post.id}, 'approved')">通过</button>
                                ` : ''}
                                ${!post.is_top ? `
                                    <button class="btn btn-outline btn-sm" onclick="AdminPage.setTop(${post.id})">置顶</button>
                                ` : `
                                    <button class="btn btn-outline btn-sm" onclick="AdminPage.cancelTop(${post.id})">取消置顶</button>
                                `}
                                <button class="btn btn-danger btn-sm" onclick="AdminPage.deletePost(${post.id})">删除</button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    async loadUsers() {
        const content = document.getElementById('adminContent');
        try {
            const result = await ApiService.get('/shiwu/admin/user/list/get', { page_size: 20 }, { useAdminToken: true });
            if (result.code === 0) {
                this.users = result.data.items || [];
                this.renderUsers();
            }
        } catch (error) {
            console.error('加载用户列表失败:', error);
            content.innerHTML = `
                <div class="empty">
                    <div class="empty-icon">❌</div>
                    <div class="empty-text">加载失败</div>
                </div>
            `;
        }
    },

    renderUsers() {
        const content = document.getElementById('adminContent');
        content.innerHTML = `
            <div class="admin-table">
                <div class="admin-table-header">
                    <div style="flex: 1;">用户</div>
                    <div style="flex: 1;">手机号</div>
                    <div style="flex: 1;">学号</div>
                    <div style="flex: 1;">学院</div>
                    <div style="flex: 1;">注册时间</div>
                    <div style="flex: 1;">状态</div>
                </div>
                ${this.users.map(user => `
                    <div class="admin-table-row">
                        <div class="admin-table-cell" style="flex: 1; display: flex; align-items: center; gap: 8px;">
                            <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-green) 100%); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 500;">
                                ${Utils.getInitial(user.nickname)}
                            </div>
                            <span>${user.nickname || '用户' + (user.phone?.slice(-4) || '')}</span>
                        </div>
                        <div class="admin-table-cell" style="flex: 1;">${user.phone || '-'}</div>
                        <div class="admin-table-cell" style="flex: 1;">${user.student_id || '-'}</div>
                        <div class="admin-table-cell" style="flex: 1;">${user.college || '-'}</div>
                        <div class="admin-table-cell" style="flex: 1;">${Utils.formatTime(user.created_at)}</div>
                        <div class="admin-table-cell" style="flex: 1;">
                            <span class="admin-badge ${user.status === 'active' ? 'approved' : 'rejected'}">
                                ${user.status === 'active' ? '正常' : '禁用'}
                            </span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    async loadClaims() {
        const content = document.getElementById('adminContent');
        try {
            const result = await ApiService.get('/shiwu/admin/claim/list/get', { page_size: 20 }, { useAdminToken: true });
            if (result.code === 0) {
                this.claims = result.data.items || [];
                this.renderClaims();
            }
        } catch (error) {
            console.error('加载认领列表失败:', error);
            content.innerHTML = `
                <div class="empty">
                    <div class="empty-icon">❌</div>
                    <div class="empty-text">加载失败</div>
                </div>
            `;
        }
    },

    renderClaims() {
        const content = document.getElementById('adminContent');
        content.innerHTML = `
            <div class="admin-table">
                <div class="admin-table-header">
                    <div style="flex: 2;">物品名称</div>
                    <div style="flex: 1;">认领人</div>
                    <div style="flex: 1;">状态</div>
                    <div style="flex: 1;">申请时间</div>
                    <div style="flex: 1;">操作</div>
                </div>
                ${this.claims.map(claim => `
                    <div class="admin-table-row">
                        <div class="admin-table-cell" style="flex: 2; font-weight: 500;">${claim.post?.title || '-'}</div>
                        <div class="admin-table-cell" style="flex: 1;">${claim.user?.nickname || '-'}</div>
                        <div class="admin-table-cell" style="flex: 1;">
                            <span class="admin-badge ${claim.status === 'approved' ? 'approved' : claim.status === 'rejected' ? 'rejected' : 'pending'}">
                                ${Utils.getClaimStatusText(claim.status)}
                            </span>
                        </div>
                        <div class="admin-table-cell" style="flex: 1;">${Utils.formatTime(claim.created_at)}</div>
                        <div class="admin-table-cell" style="flex: 1;">
                            <div class="admin-table-actions">
                                <button class="btn btn-primary btn-sm" onclick="Router.navigate('detail', { post_id: ${claim.post_id} })">查看</button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    async verifyPost(postId, status) {
        try {
            const result = await ApiService.post(`/shiwu/admin/post/verify?post_id=${postId}&verify_status=${status}`, {}, { useAdminToken: true });

            if (result.code === 0) {
                Toast.success('操作成功');
                this.loadPosts();
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (error) {
            Toast.error('操作失败，请检查网络');
        }
    },

    async setTop(postId) {
        try {
            const result = await ApiService.post(`/shiwu/admin/post/top/set?post_id=${postId}&is_top=1`, {}, { useAdminToken: true });

            if (result.code === 0) {
                Toast.success('已置顶');
                this.loadPosts();
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (error) {
            Toast.error('操作失败，请检查网络');
        }
    },

    async cancelTop(postId) {
        try {
            const result = await ApiService.post(`/shiwu/admin/post/top/set?post_id=${postId}&is_top=0`, {}, { useAdminToken: true });

            if (result.code === 0) {
                Toast.success('已取消置顶');
                this.loadPosts();
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (error) {
            Toast.error('操作失败，请检查网络');
        }
    },

    async deletePost(postId) {
        if (!confirm('确定要删除这条信息吗？')) return;

        try {
            const result = await ApiService.post(`/shiwu/admin/post/delete?post_id=${postId}`, {}, { useAdminToken: true });

            if (result.code === 0) {
                Toast.success('已删除');
                this.loadPosts();
            } else {
                Toast.error(result.msg || '删除失败');
            }
        } catch (error) {
            Toast.error('删除失败，请检查网络');
        }
    },

    async logout() {
        if (!confirm('确定要退出登录吗？')) return;

        try {
            await AuthService.adminLogout();
            Toast.success('已退出登录');
            Router.navigate('adminLogin');
        } catch (error) {
            Storage.removeAdminToken();
            Storage.removeAdmin();
            Router.navigate('adminLogin');
        }
    }
};

window.AdminLoginPage = AdminLoginPage;
window.AdminPage = AdminPage;
