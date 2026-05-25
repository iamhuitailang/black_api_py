const HomePage = {
    render() {
        const user = AuthService.getCurrentUser();
        const app = document.getElementById('app');
        const role = user?.role;
        
        const tabbarHtml = this.getTabbarHtml(role);
        
        app.className = 'page has-header';
        app.innerHTML = `
            <div class="header">
                <div class="header-title">宿舍报修系统</div>
            </div>
            <div id="homeContent"></div>
            ${tabbarHtml}
        `;

        this.loadData();
        this.bindTabbar();
    },

    getTabbarHtml(role) {
        if (role === 'admin') {
            return `
            <div class="tabbar tabbar-5">
                <div class="tabbar-item active" data-route="home">
                    <div class="tabbar-icon">🏠</div>
                    <div class="tabbar-label">首页</div>
                </div>
                <div class="tabbar-item" data-route="orders">
                    <div class="tabbar-icon">📋</div>
                    <div class="tabbar-label">报修</div>
                </div>
                <div class="tabbar-item" data-route="users">
                    <div class="tabbar-icon">👥</div>
                    <div class="tabbar-label">用户</div>
                </div>
                <div class="tabbar-item" data-route="statistics">
                    <div class="tabbar-icon">📊</div>
                    <div class="tabbar-label">统计</div>
                </div>
                <div class="tabbar-item" data-route="profile">
                    <div class="tabbar-icon">👤</div>
                    <div class="tabbar-label">我的</div>
                </div>
            </div>
            `;
        } else if (role === 'repairman') {
            return `
            <div class="tabbar">
                <div class="tabbar-item active" data-route="home">
                    <div class="tabbar-icon">🏠</div>
                    <div class="tabbar-label">首页</div>
                </div>
                <div class="tabbar-item" data-route="orders">
                    <div class="tabbar-icon">📋</div>
                    <div class="tabbar-label">工单</div>
                </div>
                <div class="tabbar-item" data-route="notifications">
                    <div class="tabbar-icon">🔔</div>
                    <div class="tabbar-label">消息</div>
                </div>
                <div class="tabbar-item" data-route="profile">
                    <div class="tabbar-icon">👤</div>
                    <div class="tabbar-label">我的</div>
                </div>
            </div>
            `;
        } else {
            return `
            <div class="tabbar">
                <div class="tabbar-item active" data-route="home">
                    <div class="tabbar-icon">🏠</div>
                    <div class="tabbar-label">首页</div>
                </div>
                <div class="tabbar-item" data-route="orders">
                    <div class="tabbar-icon">📋</div>
                    <div class="tabbar-label">报修单</div>
                </div>
                <div class="tabbar-item" data-route="notifications">
                    <div class="tabbar-icon">🔔</div>
                    <div class="tabbar-label">消息</div>
                </div>
                <div class="tabbar-item" data-route="profile">
                    <div class="tabbar-icon">👤</div>
                    <div class="tabbar-label">我的</div>
                </div>
            </div>
            `;
        }
    },

    async loadData() {
        const container = document.getElementById('homeContent');
        Utils.showLoading(container);

        try {
            const result = await ApiService.get('/baoxiu/statistics/dashboard/get');
            if (result.code === 0) {
                this.renderContent(result.data);
            } else {
                Utils.showEmpty(container, '加载失败');
            }
        } catch (error) {
            Utils.showEmpty(container, '加载失败');
        }
    },

    renderContent(data) {
        const user = AuthService.getCurrentUser();
        const role = user?.role;
        const container = document.getElementById('homeContent');

        const stats = data.order_stats || {};
        const recentOrders = data.recent_orders || [];

        let menuHtml = '';
        if (role === 'student') {
            menuHtml = `
                <div class="menu-grid">
                    <div class="menu-item" onclick="Router.navigate('createOrder')">
                        <div class="menu-icon">📝</div>
                        <div class="menu-label">提交报修</div>
                    </div>
                    <div class="menu-item" onclick="Router.navigate('orders')">
                        <div class="menu-icon">📋</div>
                        <div class="menu-label">我的报修</div>
                    </div>
                    <div class="menu-item" onclick="Router.navigate('notifications')">
                        <div class="menu-icon">🔔</div>
                        <div class="menu-label">消息通知</div>
                    </div>
                    <div class="menu-item" onclick="Router.navigate('profile')">
                        <div class="menu-icon">👤</div>
                        <div class="menu-label">个人中心</div>
                    </div>
                </div>
            `;
        } else if (role === 'repairman') {
            menuHtml = `
                <div class="menu-grid">
                    <div class="menu-item" onclick="Router.navigate('orders')">
                        <div class="menu-icon">📋</div>
                        <div class="menu-label">工单列表</div>
                        ${stats.pending_all > 0 ? `<span class="badge badge-danger" style="position:absolute;top:8px;right:8px;">${stats.pending_all}</span>` : ''}
                    </div>
                    <div class="menu-item" onclick="Router.navigate('orders?status=2')">
                        <div class="menu-icon">🔧</div>
                        <div class="menu-label">维修中</div>
                    </div>
                    <div class="menu-item" onclick="Router.navigate('notifications')">
                        <div class="menu-icon">🔔</div>
                        <div class="menu-label">消息通知</div>
                    </div>
                    <div class="menu-item" onclick="Router.navigate('profile')">
                        <div class="menu-icon">👤</div>
                        <div class="menu-label">个人中心</div>
                    </div>
                </div>
            `;
        } else if (role === 'admin') {
            menuHtml = `
                <div class="menu-grid">
                    <div class="menu-item" onclick="Router.navigate('orders')">
                        <div class="menu-icon">📋</div>
                        <div class="menu-label">报修管理</div>
                    </div>
                    <div class="menu-item" onclick="Router.navigate('users')">
                        <div class="menu-icon">👥</div>
                        <div class="menu-label">用户管理</div>
                    </div>
                    <div class="menu-item" onclick="Router.navigate('dormitories')">
                        <div class="menu-icon">🏢</div>
                        <div class="menu-label">宿舍管理</div>
                    </div>
                    <div class="menu-item" onclick="Router.navigate('statistics')">
                        <div class="menu-icon">📊</div>
                        <div class="menu-label">统计报表</div>
                    </div>
                    <div class="menu-item" onclick="Router.navigate('logs')">
                        <div class="menu-icon">📝</div>
                        <div class="menu-label">系统日志</div>
                    </div>
                    <div class="menu-item" onclick="Router.navigate('notifications')">
                        <div class="menu-icon">🔔</div>
                        <div class="menu-label">消息通知</div>
                    </div>
                </div>
            `;
        }

        const statsHtml = role === 'admin' ? `
            <div class="section-header">
                <div class="section-title">数据概览</div>
            </div>
            <div class="dashboard-grid">
                <div class="stat-card">
                    <div class="stat-card-value">${stats.total || 0}</div>
                    <div class="stat-card-label">报修总数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-value">${stats.pending || 0}</div>
                    <div class="stat-card-label">待分配</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-value">${stats.processing || 0}</div>
                    <div class="stat-card-label">维修中</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-value">${stats.completed || 0}</div>
                    <div class="stat-card-label">已完成</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-value">${data.total_students || 0}</div>
                    <div class="stat-card-label">学生总数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-value">${data.total_repairmen || 0}</div>
                    <div class="stat-card-label">维修工总数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-value">${data.total_dormitories || 0}</div>
                    <div class="stat-card-label">宿舍楼数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-value">${stats.today_count || 0}</div>
                    <div class="stat-card-label">今日新增</div>
                </div>
            </div>
        ` : role === 'repairman' ? `
            <div class="section-header">
                <div class="section-title">工单统计</div>
            </div>
            <div class="dashboard-grid">
                <div class="stat-card" onclick="Router.navigate('orders')">
                    <div class="stat-card-value">${stats.pending_all || stats.pending || 0}</div>
                    <div class="stat-card-label">待接单</div>
                </div>
                <div class="stat-card" onclick="Router.navigate('orders?status=1')">
                    <div class="stat-card-value">${stats.processing || 0}</div>
                    <div class="stat-card-label">已分配</div>
                </div>
                <div class="stat-card" onclick="Router.navigate('orders?status=2')">
                    <div class="stat-card-value">${stats.completed || 0}</div>
                    <div class="stat-card-label">维修中</div>
                </div>
                <div class="stat-card" onclick="Router.navigate('orders?status=3')">
                    <div class="stat-card-value">${stats.total || 0}</div>
                    <div class="stat-card-label">我的工单</div>
                </div>
            </div>
        ` : `
            <div class="section-header">
                <div class="section-title">我的报修</div>
            </div>
            <div class="dashboard-grid">
                <div class="stat-card" onclick="Router.navigate('orders?status=0')">
                    <div class="stat-card-value">${stats.pending || 0}</div>
                    <div class="stat-card-label">待分配</div>
                </div>
                <div class="stat-card" onclick="Router.navigate('orders?status=1')">
                    <div class="stat-card-value">${stats.processing || 0}</div>
                    <div class="stat-card-label">已分配</div>
                </div>
                <div class="stat-card" onclick="Router.navigate('orders?status=2')">
                    <div class="stat-card-value">${stats.completed || 0}</div>
                    <div class="stat-card-label">维修中</div>
                </div>
                <div class="stat-card" onclick="Router.navigate('orders?status=3')">
                    <div class="stat-card-value">${stats.total || 0}</div>
                    <div class="stat-card-label">已完成</div>
                </div>
            </div>
        `;

        const recentHtml = recentOrders.length > 0 ? `
            <div class="section-header">
                <div class="section-title">${role === 'student' ? '我的报修' : role === 'repairman' ? '我的工单' : '最近报修'}</div>
                <div class="section-more" onclick="Router.navigate('orders')">查看更多 →</div>
            </div>
            ${recentOrders.slice(0, 5).map(order => `
                <div class="list-item" onclick="Router.navigate('orderDetail', {id: ${order.id}})">
                    <div class="list-item-content">
                        <div class="list-item-title">${order.title}</div>
                        <div class="list-item-desc">${role === 'admin' ? order.student_name + ' · ' : ''}${Utils.formatDate(order.created_at)}</div>
                    </div>
                    <div class="list-item-extra">
                        <span class="status-badge ${Utils.getStatusClass(order.status)}">${Utils.getStatusText(order.status)}</span>
                    </div>
                </div>
            `).join('')}
        ` : '';

        container.innerHTML = `
            ${role === 'student' ? '<div class="fab" onclick="Router.navigate(\'createOrder\')">+</div>' : ''}
            ${statsHtml}
            ${menuHtml}
            ${recentHtml}
        `;
    },

    bindTabbar() {
        document.querySelectorAll('.tabbar-item').forEach(item => {
            item.onclick = () => {
                const route = item.dataset.route;
                if (route) {
                    Router.navigate(route);
                }
            };
        });
    }
};
