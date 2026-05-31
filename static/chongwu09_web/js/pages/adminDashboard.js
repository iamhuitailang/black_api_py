const AdminDashboardPage = {
    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div style="display:flex;min-height:100vh">
                ${this.renderSidebar('dashboard')}
                <div class="admin-main">
                    <div class="admin-header">
                        <h2 class="admin-page-title">数据概览</h2>
                    </div>
                    <div class="stat-cards" id="statCards"><div class="text-center" style="padding:40px">加载中...</div></div>
                </div>
            </div>
        `;
        this.bindSidebar();
        await this.loadStats();
    },

    renderSidebar(active) {
        const items = [
            { route: 'adminDashboard', icon: '📊', name: '数据概览' },
            { route: 'adminServices', icon: '🛎️', name: '服务管理' },
            { route: 'adminBookings', icon: '📋', name: '预约管理' },
            { route: 'adminPets', icon: '🐾', name: '宠物管理' },
            { route: 'adminOrders', icon: '💰', name: '订单管理' },
            { route: 'adminProfile', icon: '👤', name: '个人设置' }
        ];
        return `
            <div class="admin-sidebar">
                <div class="admin-sidebar-logo">🐾 宠托帮管理</div>
                ${items.map(item => `<div class="admin-nav-item ${active === item.route.replace('admin', '').toLowerCase() ? 'active' : ''}" data-route="${item.route}"><span class="admin-nav-icon">${item.icon}</span>${item.name}</div>`).join('')}
                <div class="admin-nav-item" data-logout style="margin-top:auto;color:#ef4444"><span class="admin-nav-icon">🚪</span>退出登录</div>
            </div>
        `;
    },

    bindSidebar() {
        document.querySelectorAll('.admin-nav-item[data-route]').forEach(item => {
            item.addEventListener('click', () => Router.navigate(item.dataset.route));
        });
        document.querySelector('[data-logout]')?.addEventListener('click', async () => {
            await AuthService.adminLogout();
            Toast.success('已退出');
            Router.navigate('adminLogin');
        });
    },

    async loadStats() {
        try {
            const result = await ApiService.get('/chongwu09/statistics/dashboard/get');
            if (result.code === 0) {
                const d = result.data;
                document.getElementById('statCards').innerHTML = `
                    <div class="stat-card"><div class="stat-card-label">服务总数</div><div class="stat-card-value">${d.service_total}</div></div>
                    <div class="stat-card"><div class="stat-card-label">活跃服务</div><div class="stat-card-value">${d.service_active}</div></div>
                    <div class="stat-card"><div class="stat-card-label">预约总数</div><div class="stat-card-value">${d.booking_total}</div></div>
                    <div class="stat-card"><div class="stat-card-label">待确认预约</div><div class="stat-card-value" style="color:var(--warning-color)">${d.booking_pending}</div></div>
                    <div class="stat-card"><div class="stat-card-label">寄养中</div><div class="stat-card-value" style="color:var(--primary-color)">${d.booking_active}</div></div>
                    <div class="stat-card"><div class="stat-card-label">已完成</div><div class="stat-card-value" style="color:var(--success-color)">${d.booking_completed}</div></div>
                    <div class="stat-card"><div class="stat-card-label">订单总数</div><div class="stat-card-value">${d.order_total}</div></div>
                    <div class="stat-card"><div class="stat-card-label">总收入</div><div class="stat-card-value" style="color:var(--primary-color)">¥${d.total_revenue}</div></div>
                    <div class="stat-card"><div class="stat-card-label">用户总数</div><div class="stat-card-value">${d.user_total}</div></div>
                    <div class="stat-card"><div class="stat-card-label">宠物总数</div><div class="stat-card-value">${d.pet_total}</div></div>
                `;
            }
        } catch (e) { document.getElementById('statCards').innerHTML = '<div class="text-center">加载失败</div>'; }
    }
};
