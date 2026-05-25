const StatisticsPage = {
    render() {
        const user = AuthService.getCurrentUser();
        if (user?.role !== 'admin') {
            Router.navigate('home');
            return;
        }

        const app = document.getElementById('app');
        app.className = 'page has-header no-tabbar';
        app.innerHTML = `
            <div class="header">
                <div class="header-back" onclick="Router.back()">←</div>
                <div class="header-title">统计报表</div>
            </div>
            <div id="statisticsContent"></div>
        `;

        this.loadData();
    },

    async loadData() {
        const container = document.getElementById('statisticsContent');
        Utils.showLoading(container);

        try {
            const result = await ApiService.get('/baoxiu/statistics/order/get');
            if (result.code === 0) {
                this.renderStatistics(result.data);
            } else {
                Utils.showEmpty(container, '加载失败');
            }
        } catch (error) {
            Utils.showEmpty(container, '加载失败');
        }
    },

    renderStatistics(data) {
        const container = document.getElementById('statisticsContent');
        const stats = data.order_stats || {};
        const statusStats = data.status_stats || [];
        const urgencyStats = data.urgency_stats || [];
        const dailyStats = data.daily_stats || [];

        container.innerHTML = `
            <div class="section-header">
                <div class="section-title">报修统计概览</div>
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
                    <div class="stat-card-value">${stats.cancelled || 0}</div>
                    <div class="stat-card-label">已取消</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-value">${stats.today_count || 0}</div>
                    <div class="stat-card-label">今日新增</div>
                </div>
            </div>

            <div class="section-header">
                <div class="section-title">状态分布</div>
            </div>
            <div class="card">
                ${statusStats.map(s => `
                    <div class="detail-row">
                        <div class="detail-label">${s.status_text}</div>
                        <div class="detail-value">
                            <div style="display: flex; align-items: center;">
                                <div style="flex: 1; height: 8px; background-color: #e5e7eb; border-radius: 4px; margin-right: 12px; overflow: hidden;">
                                    <div style="width: ${stats.total ? (s.count / stats.total * 100) : 0}%; height: 100%; background-color: var(--primary-color);"></div>
                                </div>
                                <span>${s.count} (${stats.total ? Math.round(s.count / stats.total * 100) : 0}%)</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="section-header">
                <div class="section-title">紧急程度分布</div>
            </div>
            <div class="card">
                ${urgencyStats.map(u => `
                    <div class="detail-row">
                        <div class="detail-label">${u.urgency_text}</div>
                        <div class="detail-value">
                            <div style="display: flex; align-items: center;">
                                <div style="flex: 1; height: 8px; background-color: #e5e7eb; border-radius: 4px; margin-right: 12px; overflow: hidden;">
                                    <div style="width: ${stats.total ? (u.count / stats.total * 100) : 0}%; height: 100%; background-color: var(--warning-color);"></div>
                                </div>
                                <span>${u.count} (${stats.total ? Math.round(u.count / stats.total * 100) : 0}%)</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="section-header">
                <div class="section-title">近30天趋势</div>
            </div>
            <div class="card">
                ${dailyStats.length > 0 ? dailyStats.slice(0, 10).map(d => `
                    <div class="detail-row">
                        <div class="detail-label">${d.date}</div>
                        <div class="detail-value">
                            <div style="display: flex; align-items: center;">
                                <div style="flex: 1; height: 8px; background-color: #e5e7eb; border-radius: 4px; margin-right: 12px; overflow: hidden;">
                                    <div style="width: ${d.count ? (d.count / Math.max(...dailyStats.map(x => x.count)) * 100) : 0}%; height: 100%; background-color: var(--success-color);"></div>
                                </div>
                                <span>${d.count} 条 (完成: ${d.completed || 0})</span>
                            </div>
                        </div>
                    </div>
                `).join('') : '<div style="text-align: center; color: var(--text-secondary); padding: 16px;">暂无数据</div>'}
            </div>

            ${stats.category_stats && stats.category_stats.length > 0 ? `
                <div class="section-header">
                    <div class="section-title">类别分布</div>
                </div>
                <div class="card">
                    ${stats.category_stats.map(c => `
                        <div class="detail-row">
                            <div class="detail-label">${c.category || '未分类'}</div>
                            <div class="detail-value">
                                <div style="display: flex; align-items: center;">
                                    <div style="flex: 1; height: 8px; background-color: #e5e7eb; border-radius: 4px; margin-right: 12px; overflow: hidden;">
                                        <div style="width: ${stats.total ? (c.count / stats.total * 100) : 0}%; height: 100%; background-color: var(--info-color);"></div>
                                    </div>
                                    <span>${c.count} (${stats.total ? Math.round(c.count / stats.total * 100) : 0}%)</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;
    }
};
