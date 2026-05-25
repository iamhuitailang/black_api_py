const DashboardPage = {
    async render() {
        if (!AuthService.requireAuth()) return;
        Layout.render('<div class="loading"><div class="spinner"></div></div>', '仪表盘');
        try {
            const res = await ApiService.get('/jianshen/admin/dashboard/get');
            if (res.code === 0) {
                const d = res.data;
                Layout.renderPage(`
                    <div class="stat-grid">
                        <div class="stat-card">
                            <div class="label">用户总数</div>
                            <div class="value">${d.total_users}</div>
                            <div class="icon">👥</div>
                        </div>
                        <div class="stat-card success">
                            <div class="label">活跃用户</div>
                            <div class="value">${d.active_users}</div>
                            <div class="icon">✅</div>
                        </div>
                        <div class="stat-card warning">
                            <div class="label">累计打卡</div>
                            <div class="value">${d.total_checkins}</div>
                            <div class="icon">📝</div>
                        </div>
                        <div class="stat-card danger">
                            <div class="label">今日打卡</div>
                            <div class="value">${d.today_checkins}</div>
                            <div class="icon">🔥</div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-header">
                            <h2>📊 运营数据概览</h2>
                        </div>
                        <div style="padding: 20px; color: var(--text-secondary);">
                            <p>本月累计打卡：<strong style="color: var(--primary); font-size: 20px;">${d.month_checkins}</strong> 次</p>
                            <p style="margin-top: 8px;">健身打卡管理系统 · 数据实时更新</p>
                        </div>
                    </div>
                `, '仪表盘');
            } else {
                Toast.error(res.msg);
            }
        } catch (e) {
            console.error(e);
            Layout.renderPage('<div class="empty">加载失败</div>', '仪表盘');
        }
    }
};
