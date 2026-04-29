const StatisticsPage = {
    stats: null,
    exchangeStats: null,

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
                            <div class="nav-item" data-route="exchange">
                                <span class="nav-icon">🔄</span>
                                <span class="nav-text">交换订单</span>
                            </div>
                            <div class="nav-item active" data-route="statistics">
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
                            <h1 class="header-title">数据统计</h1>
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
                            <h2 class="page-title">数据统计分析</h2>
                            <p class="page-subtitle">平台运营数据一览</p>
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
                                    <span class="stat-card-title">已完成交换</span>
                                    <span class="stat-card-icon success">✅</span>
                                </div>
                                <div class="stat-card-value" id="stat-completed">--</div>
                                <div class="stat-card-change">成功完成的交换</div>
                            </div>
                            
                            <div class="stat-card">
                                <div class="stat-card-header">
                                    <span class="stat-card-title">成功率</span>
                                    <span class="stat-card-icon danger">✨</span>
                                </div>
                                <div class="stat-card-value" id="stat-rate">--%</div>
                                <div class="stat-card-change">交换成功比例</div>
                            </div>
                        </div>
                        
                        <div class="stats-grid" style="grid-template-columns: repeat(2, 1fr);">
                            <div class="card">
                                <div class="card-header">
                                    <h3 class="card-title">🔥 热门技能排名</h3>
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
                                    <h3 class="card-title">📊 交换状态分布</h3>
                                </div>
                                <div class="card-body" id="exchange-stats-container">
                                    <div class="empty-state">
                                        <div class="empty-state-icon">📈</div>
                                        <p>加载中...</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">📁 分类技能分布</h3>
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
            const dashboardResult = await ApiService.get('/jn/statistics/dashboard/get');
            
            if (dashboardResult.code === 0 && dashboardResult.data) {
                this.stats = dashboardResult.data;
                this.updateStats();
                this.renderHotSkills(this.stats.hot_skills);
                this.renderCategoryStats(this.stats.category_stats);
            }

            const exchangeResult = await ApiService.get('/jn/statistics/exchange/get');
            if (exchangeResult.code === 0 && exchangeResult.data) {
                this.exchangeStats = exchangeResult.data;
                this.renderExchangeStats(this.exchangeStats.status_stats);
            }
        } catch (error) {
            console.error('加载统计数据失败:', error);
        }
    },

    updateStats() {
        document.getElementById('stat-users').textContent = this.stats.total_users || 0;
        document.getElementById('stat-skills').textContent = this.stats.total_skills || 0;
        document.getElementById('stat-completed').textContent = this.stats.completed_exchanges || 0;
        document.getElementById('stat-rate').textContent = (this.stats.success_rate || 0) + '%';
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

        const maxCount = Math.max(...skills.map(s => s.count));
        let html = '';

        skills.forEach((skill, index) => {
            const percentage = (skill.count / maxCount) * 100;
            html += `
                <div style="margin-bottom: 16px;">
                    <div class="flex-between" style="margin-bottom: 6px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span class="skill-tag">${skill.name}</span>
                            <span style="color: var(--text-muted); font-size: 13px;">${skill.category_name || skill.category}</span>
                        </div>
                        <strong style="color: var(--primary-color);">${skill.count}</strong>
                    </div>
                    <div style="height: 8px; background: var(--bg-primary); border-radius: 4px; overflow: hidden;">
                        <div style="height: 100%; background: var(--gradient-primary); border-radius: 4px; width: ${percentage}%; transition: width 0.5s ease;"></div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    renderExchangeStats(statusStats) {
        const container = document.getElementById('exchange-stats-container');
        
        if (!statusStats || statusStats.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📈</div>
                    <p>暂无交换状态数据</p>
                </div>
            `;
            return;
        }

        const total = statusStats.reduce((sum, s) => sum + (s.count || 0), 0);
        
        if (total === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📈</div>
                    <p>暂无交换数据</p>
                </div>
            `;
            return;
        }

        const getStatusBadgeClass = (status) => {
            const statusMap = {
                '待确认': 'badge-warning',
                '已接受': 'badge-info',
                '进行中': 'badge-primary',
                '已完成': 'badge-success',
                '已拒绝': 'badge-danger',
                '已取消': 'badge-secondary'
            };
            return statusMap[status] || 'badge-secondary';
        };

        let html = '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">';

        statusStats.forEach(stat => {
            const percentage = ((stat.count || 0) / total * 100).toFixed(1);
            const badgeClass = getStatusBadgeClass(stat.status);
            
            html += `
                <div style="text-align: center; padding: 16px; background: var(--bg-primary); border-radius: var(--radius-md);">
                    <div class="badge ${badgeClass}" style="padding: 6px 12px; margin-bottom: 8px;">${stat.status}</div>
                    <div style="font-size: 28px; font-weight: 700; color: var(--text-primary);">${stat.count || 0}</div>
                    <div style="color: var(--text-muted); font-size: 13px;">${percentage}%</div>
                </div>
            `;
        });

        html += '</div>';
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

        const maxTotal = Math.max(...categories.map(c => c.total_count || 0));
        
        let html = `
            <table class="table">
                <thead>
                    <tr>
                        <th>分类</th>
                        <th>提供</th>
                        <th>需求</th>
                        <th>总计</th>
                        <th>占比</th>
                    </tr>
                </thead>
                <tbody>
        `;

        categories.forEach(cat => {
            const total = cat.total_count || 0;
            const percentage = maxTotal > 0 ? ((total / maxTotal) * 100) : 0;
            
            html += `
                <tr>
                    <td><strong>${cat.name}</strong></td>
                    <td><span class="badge badge-success">${cat.offer_count || 0}</span></td>
                    <td><span class="badge badge-info">${cat.need_count || 0}</span></td>
                    <td><strong>${total}</strong></td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="flex: 1; max-width: 150px; height: 8px; background: var(--bg-primary); border-radius: 4px; overflow: hidden;">
                                <div style="height: 100%; background: var(--gradient-primary); border-radius: 4px; width: ${percentage}%;"></div>
                            </div>
                            <span style="font-size: 13px; color: var(--text-muted); min-width: 45px;">${percentage.toFixed(1)}%</span>
                        </div>
                    </td>
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

window.StatisticsPage = StatisticsPage;
