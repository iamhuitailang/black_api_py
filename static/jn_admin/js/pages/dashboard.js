const DashboardPage = {
    stats: {},
    hotSkills: [],
    categoryStats: [],

    render() {
        const app = document.getElementById('app');
        const user = AuthService.getCurrentUser();
        
        app.innerHTML = this.layout(user);
        
        this.bindEvents();
        this.loadData();
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
                            <div class="nav-item active" data-route="dashboard">
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
                            <h1 class="header-title">数据概览</h1>
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
                            <h2 class="page-title">数据概览</h2>
                            <p class="page-subtitle">技能交换平台核心数据指标</p>
                        </div>
                        
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-card-header">
                                    <span class="stat-card-title">用户总数</span>
                                    <span class="stat-card-icon primary">👥</span>
                                </div>
                                <div class="stat-card-value" id="stat-users">--</div>
                                <div class="stat-card-change">注册用户数</div>
                            </div>
                            
                            <div class="stat-card">
                                <div class="stat-card-header">
                                    <span class="stat-card-title">技能总数</span>
                                    <span class="stat-card-icon warning">💡</span>
                                </div>
                                <div class="stat-card-value" id="stat-skills">--</div>
                                <div class="stat-card-change">发布的技能数</div>
                            </div>
                            
                            <div class="stat-card">
                                <div class="stat-card-header">
                                    <span class="stat-card-title">交换订单</span>
                                    <span class="stat-card-icon success">🔄</span>
                                </div>
                                <div class="stat-card-value" id="stat-exchanges">--</div>
                                <div class="stat-card-change">总交换订单数</div>
                            </div>
                            
                            <div class="stat-card">
                                <div class="stat-card-header">
                                    <span class="stat-card-title">完成率</span>
                                    <span class="stat-card-icon danger">✨</span>
                                </div>
                                <div class="stat-card-value" id="stat-rate">--%</div>
                                <div class="stat-card-change">交换成功比例</div>
                            </div>
                        </div>
                        
                        <div class="stats-grid" style="grid-template-columns: repeat(2, 1fr);">
                            <div class="card">
                                <div class="card-header">
                                    <h3 class="card-title">🔥 热门技能</h3>
                                </div>
                                <div class="card-body" id="hot-skills-container">
                                    <div class="empty-state">
                                        <div class="empty-state-icon">📊</div>
                                        <p>加载中...</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="card">
                                <div class="card-header">
                                    <h3 class="card-title">📁 分类统计</h3>
                                </div>
                                <div class="card-body" id="category-stats-container">
                                    <div class="empty-state">
                                        <div class="empty-state-icon">📁</div>
                                        <p>加载中...</p>
                                    </div>
                                </div>
                            </div>
                        </div>
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
    },

    async loadData() {
        try {
            const result = await ApiService.get('/jn/statistics/dashboard/get');
            
            if (result.code === 0 && result.data) {
                const data = result.data;
                this.updateStats(data);
                this.renderHotSkills(data.hot_skills);
                this.renderCategoryStats(data.category_stats);
            }
        } catch (error) {
            console.error('加载数据失败:', error);
        }
    },

    updateStats(data) {
        document.getElementById('stat-users').textContent = data.total_users || 0;
        document.getElementById('stat-skills').textContent = data.total_skills || 0;
        document.getElementById('stat-exchanges').textContent = data.total_exchanges || 0;
        document.getElementById('stat-rate').textContent = (data.success_rate || 0) + '%';
    },

    renderHotSkills(skills) {
        const container = document.getElementById('hot-skills-container');
        
        if (!skills || skills.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📊</div>
                    <p>暂无热门技能数据</p>
                </div>
            `;
            return;
        }

        let html = '<table class="table"><thead><tr><th>技能名</th><th>分类</th><th>类型</th><th>数量</th></tr></thead><tbody>';
        
        skills.forEach(skill => {
            html += `
                <tr>
                    <td><span class="skill-tag">${skill.name}</span></td>
                    <td>${skill.category_name || skill.category}</td>
                    <td><span class="badge ${skill.type === 'offer' ? 'badge-success' : 'badge-info'}">${skill.type_text}</span></td>
                    <td><strong>${skill.count}</strong></td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    },

    renderCategoryStats(categories) {
        const container = document.getElementById('category-stats-container');
        
        if (!categories || categories.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📁</div>
                    <p>暂无分类数据</p>
                </div>
            `;
            return;
        }

        let html = '<table class="table"><thead><tr><th>分类</th><th>提供</th><th>需求</th><th>总计</th></tr></thead><tbody>';
        
        categories.forEach(cat => {
            const total = (cat.offer_count || 0) + (cat.need_count || 0);
            html += `
                <tr>
                    <td><strong>${cat.name}</strong></td>
                    <td><span class="badge badge-success">${cat.offer_count || 0}</span></td>
                    <td><span class="badge badge-info">${cat.need_count || 0}</span></td>
                    <td><strong>${total}</strong></td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
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

window.DashboardPage = DashboardPage;
