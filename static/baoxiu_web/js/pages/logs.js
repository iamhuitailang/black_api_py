const LogsPage = {
    currentPage: 1,
    pageSize: 10,

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
                <div class="header-title">系统日志</div>
            </div>
            <div id="logsContent"></div>
        `;

        this.loadLogs();
    },

    async loadLogs() {
        const container = document.getElementById('logsContent');
        Utils.showLoading(container);

        try {
            const result = await ApiService.get('/baoxiu/log/list/get', {
                page: this.currentPage,
                page_size: this.pageSize
            });
            if (result.code === 0) {
                this.renderLogs(result.data);
            } else {
                Utils.showEmpty(container, '加载失败');
            }
        } catch (error) {
            Utils.showEmpty(container, '加载失败');
        }
    },

    renderLogs(data) {
        const container = document.getElementById('logsContent');
        const items = data.items || [];

        if (items.length === 0) {
            Utils.showEmpty(container, '暂无日志');
            return;
        }

        container.innerHTML = `
            <div class="section-header">
                <div class="section-title">日志列表</div>
            </div>
            ${items.map(log => `
                <div class="list-item">
                    <div class="list-item-content">
                        <div class="list-item-title">${log.action_text || log.action}</div>
                        <div class="list-item-desc">${log.detail || ''} · 用户ID: ${log.user_id}</div>
                        <div style="font-size: 12px; color: var(--text-light); margin-top: 4px;">${Utils.formatDate(log.created_at)}</div>
                    </div>
                    <div class="list-item-extra">
                        <span class="badge badge-secondary">${log.target_type || '系统'}</span>
                    </div>
                </div>
            `).join('')}
        `;
    }
};
