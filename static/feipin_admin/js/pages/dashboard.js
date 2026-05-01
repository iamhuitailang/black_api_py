const DashboardPage = {
    stats: {},
    orders: [],

    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="admin-layout">
                ${this.renderSidebar()}
                <div class="main-wrapper">
                    ${this.renderHeader('数据看板')}
                    <div class="main-content">
                        <div class="page-header">
                            <h1 class="page-title">数据看板</h1>
                            <p class="page-subtitle">回收宝平台运营数据概览</p>
                        </div>
                        
                        <div class="stats-grid" id="statsGrid">
                            <div class="stat-card">
                                <div class="stat-card-header">
                                    <span class="stat-card-title">总订单数</span>
                                    <span class="stat-card-icon primary">📋</span>
                                </div>
                                <div class="stat-card-value" id="totalOrders">-</div>
                                <div class="stat-card-change">
                                    <span>累计订单总量</span>
                                </div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-card-header">
                                    <span class="stat-card-title">待处理订单</span>
                                    <span class="stat-card-icon warning">⏳</span>
                                </div>
                                <div class="stat-card-value" id="pendingOrders">-</div>
                                <div class="stat-card-change">
                                    <span>等待回收员接单</span>
                                </div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-card-header">
                                    <span class="stat-card-title">已完成订单</span>
                                    <span class="stat-card-icon success">✅</span>
                                </div>
                                <div class="stat-card-value" id="completedOrders">-</div>
                                <div class="stat-card-change">
                                    <span>已完成回收</span>
                                </div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-card-header">
                                    <span class="stat-card-title">总交易额</span>
                                    <span class="stat-card-icon danger">💰</span>
                                </div>
                                <div class="stat-card-value" id="totalIncome">-</div>
                                <div class="stat-card-change">
                                    <span>平台累计交易额</span>
                                </div>
                            </div>
                        </div>

                        <div class="card">
                            <div class="card-header">
                                <h2 class="card-title">订单统计</h2>
                            </div>
                            <div class="card-body">
                                <div class="chart-placeholder">
                                    📊 图表区域（可集成 ECharts 等图表库）
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
        this.loadData();
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
                    <div class="nav-item active" data-page="dashboard">
                        <span class="nav-icon">📊</span>
                        <span class="nav-text">数据看板</span>
                    </div>
                    <div class="sidebar-nav-title">订单管理</div>
                    <div class="nav-item" data-page="orders">
                        <span class="nav-icon">📋</span>
                        <span class="nav-text">订单列表</span>
                    </div>
                    <div class="sidebar-nav-title">用户管理</div>
                    <div class="nav-item" data-page="users">
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
    },

    async loadData() {
        try {
            const result = await ApiService.get('/feipin/order/statistics/get');
            if (result.code === 0 && result.data) {
                const stats = result.data;
                this.updateStats(stats);
            }
        } catch (error) {
            console.error('加载统计数据失败:', error);
        }
    },

    updateStats(stats) {
        const totalOrdersEl = document.getElementById('totalOrders');
        const pendingOrdersEl = document.getElementById('pendingOrders');
        const completedOrdersEl = document.getElementById('completedOrders');
        const totalIncomeEl = document.getElementById('totalIncome');

        if (totalOrdersEl) totalOrdersEl.textContent = stats.total_orders || 0;
        if (pendingOrdersEl) pendingOrdersEl.textContent = stats.pending_orders || 0;
        if (completedOrdersEl) completedOrdersEl.textContent = stats.completed_orders || 0;
        if (totalIncomeEl) totalIncomeEl.textContent = `¥${(stats.total_income || 0).toFixed(2)}`;
    }
};

window.DashboardPage = DashboardPage;
