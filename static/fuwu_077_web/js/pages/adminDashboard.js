const AdminDashboardPage = {
    stats: null,
    orderStats: [],

    async render() {
        const app = document.getElementById('app');
        const admin = AuthService.getCurrentUser();

        app.innerHTML = `
            <div class="admin-container">
                <aside class="admin-sidebar">
                    <div class="admin-logo">🏠 家政管理</div>
                    <nav class="admin-menu">
                        <a href="#admin/dashboard" class="menu-item active">
                            <span class="menu-icon">📊</span>
                            <span class="menu-text">数据概览</span>
                        </a>
                        <a href="#admin/services" class="menu-item">
                            <span class="menu-icon">🛠️</span>
                            <span class="menu-text">服务管理</span>
                        </a>
                        <a href="#admin/orders" class="menu-item">
                            <span class="menu-icon">📋</span>
                            <span class="menu-text">订单管理</span>
                        </a>
                        <a href="#admin/staff" class="menu-item">
                            <span class="menu-icon">👥</span>
                            <span class="menu-text">人员管理</span>
                        </a>
                    </nav>
                    <div class="admin-user">
                        <span class="admin-avatar">${admin?.name?.charAt(0) || 'A'}</span>
                        <div class="admin-info">
                            <p class="admin-name">${admin?.name || '管理员'}</p>
                            <a href="#" class="logout-link" id="adminLogout">退出登录</a>
                        </div>
                    </div>
                </aside>

                <main class="admin-main">
                    <header class="admin-header">
                        <h1>数据概览</h1>
                    </header>

                    <div class="dashboard-content" id="dashboardContent">
                        <div class="loading">加载中...</div>
                    </div>
                </main>
            </div>
        `;

        await this.loadData();
        this.bindEvents();
    },

    async loadData() {
        try {
            const result = await StatisticsApi.full();

            if (result.code === 0) {
                this.stats = result.data.overview || {};
                this.orderStats = this.buildOrderStats(result.data.overview || {});
                this.upcomingOrders = result.data.upcoming_orders || [];
                this.topStaff = result.data.top_staff || [];
                this.serviceStats = result.data.service_stats || [];
            }

            this.renderDashboard();
        } catch (error) {
            console.error('Dashboard load error:', error);
            document.getElementById('dashboardContent').innerHTML = '<div class="empty">加载失败</div>';
        }
    },

    buildOrderStats(overview) {
        return [
            { status: 0, status_text: '待派单', count: overview.pending_orders || 0 },
            { status: 1, status_text: '已派单', count: overview.assigned_orders || 0 },
            { status: 2, status_text: '进行中', count: overview.confirmed_orders || 0 },
            { status: 3, status_text: '已完成', count: overview.completed_orders || 0 },
            { status: 4, status_text: '已取消', count: overview.cancelled_orders || 0 }
        ];
    },

    renderDashboard() {
        const container = document.getElementById('dashboardContent');
        const stats = this.stats || {};

        container.innerHTML = `
            <div class="stats-cards">
                <div class="stat-card">
                    <div class="stat-icon blue">📋</div>
                    <div class="stat-info">
                        <p class="stat-value">${stats.total_orders || 0}</p>
                        <p class="stat-label">总订单数</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green">✅</div>
                    <div class="stat-info">
                        <p class="stat-value">${stats.completed_orders || 0}</p>
                        <p class="stat-label">已完成订单</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon yellow">⏳</div>
                    <div class="stat-info">
                        <p class="stat-value">${stats.pending_orders || 0}</p>
                        <p class="stat-label">待处理订单</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon purple">👥</div>
                    <div class="stat-info">
                        <p class="stat-value">${stats.total_users || 0}</p>
                        <p class="stat-label">注册用户</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon orange">💰</div>
                    <div class="stat-info">
                        <p class="stat-value">${Utils.formatPrice(stats.total_revenue || 0)}</p>
                        <p class="stat-label">总收入</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon pink">🛠️</div>
                    <div class="stat-info">
                        <p class="stat-value">${stats.total_services || 0}</p>
                        <p class="stat-label">服务项目</p>
                    </div>
                </div>
            </div>

            <div class="charts-section">
                <div class="chart-card">
                    <h3>订单状态分布</h3>
                    <div class="status-chart" id="statusChart">
                        ${this.renderStatusChart()}
                    </div>
                </div>
            </div>

            <div class="quick-actions">
                <h3>快捷操作</h3>
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="Router.navigate('admin/services')">
                        管理服务项目
                    </button>
                    <button class="btn btn-primary" onclick="Router.navigate('admin/orders')">
                        查看订单列表
                    </button>
                    <button class="btn btn-primary" onclick="Router.navigate('admin/staff')">
                        管理服务人员
                    </button>
                </div>
            </div>
        `;
    },

    renderStatusChart() {
        if (this.orderStats.length === 0) {
            return '<div class="empty">暂无数据</div>';
        }

        let html = '<div class="status-bars">';
        this.orderStats.forEach(item => {
            const label = item.status_text || Utils.getStatusText(item.status);
            const count = item.count || 0;
            const percentage = this.stats?.total_orders ? (count / this.stats.total_orders * 100) : 0;

            html += `
                <div class="status-bar-item">
                    <div class="bar-header">
                        <span>${label}</span>
                        <span>${count} (${percentage.toFixed(1)}%)</span>
                    </div>
                    <div class="bar-track">
                        <div class="bar-fill ${Utils.getStatusClass(item.status)}" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        });
        html += '</div>';

        return html;
    },

    bindEvents() {
        document.getElementById('adminLogout').addEventListener('click', async (e) => {
            e.preventDefault();
            const confirmed = await Utils.confirm('确认退出登录吗？');
            if (!confirmed) return;

            await AuthService.logout();
            Utils.showToast('已退出登录');
            Router.navigate('login');
        });
    }
};
