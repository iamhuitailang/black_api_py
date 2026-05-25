const StatisticsPage = {
    async render() {
        const app = document.getElementById('app');
        const currentTeam = AuthService.getCurrentTeam();

        if (!currentTeam) {
            app.innerHTML = Layout.render(`
                <div class="empty-state">
                    <div class="empty-state-icon">📈</div>
                    <p>请先创建或加入小组</p>
                </div>
            `, { title: '统计报表' });
            return;
        }

        app.innerHTML = Layout.render(`
            <div id="statsContent">
                <div class="empty-state"><p>加载中...</p></div>
            </div>
        `, { title: '统计报表' });

        await this.loadStatistics();
    },

    async loadStatistics() {
        const currentTeam = AuthService.getCurrentTeam();

        const [workloadResult, trendResult, priorityResult] = await Promise.all([
            ApiService.get(`/xz/stats/workload/get?team_id=${currentTeam.team_id}`),
            ApiService.get(`/xz/stats/trend/get?team_id=${currentTeam.team_id}&days=7`),
            ApiService.get(`/xz/stats/priority/get?team_id=${currentTeam.team_id}`)
        ]);

        const workload = workloadResult.code === 0 ? workloadResult.data || [] : [];
        const trend = trendResult.code === 0 ? trendResult.data || [] : [];
        const priority = priorityResult.code === 0 ? priorityResult.data || {} : {};

        document.getElementById('statsContent').innerHTML = `
            <div class="card">
                <div class="card-header">
                    <span class="card-title">成员工作量</span>
                </div>
                ${this.renderWorkloadChart(workload)}
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">任务完成趋势 (近7天)</span>
                    </div>
                    ${this.renderTrendChart(trend)}
                </div>
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">优先级分布</span>
                    </div>
                    ${this.renderPriorityChart(priority)}
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                        <span class="card-title">成员工作量表</span>
                        <button class="btn btn-primary btn-sm" onclick="StatisticsPage.exportCSV()">导出CSV</button>
                </div>
                ${this.renderWorkloadTable(workload)}
            </div>
        `;
    },

    renderWorkloadChart(data) {
        if (data.length === 0) {
            return '<div class="empty-state"><p>暂无数据</p></div>';
        }

        const maxHours = Math.max(...data.map(d => d.total_hours || d.task_count || 1));

        return `
            <div style="padding: 16px 0;">
                ${data.map(d => `
                    <div style="margin-bottom: 16px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <span style="font-weight: 500;">${d.username}</span>
                            <span style="color: var(--text-secondary);">${d.total_hours}h / ${d.task_count}个任务</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-bar-fill" style="width: ${(d.total_hours / maxHours * 100)}%; background: var(--primary-color);"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderTrendChart(data) {
        if (data.length === 0) {
            return '<div class="empty-state"><p>暂无数据</p></div>';
        }

        const maxCount = Math.max(...data.map(d => d.completed || 1));

        return `
            <div style="display: flex; align-items: flex-end; gap: 8px; height: 150px; padding: 16px 0;">
                ${data.map(d => `
                    <div style="flex: 1; text-align: center;">
                        <div style="background: var(--primary-color); width: 100%; height: ${(d.completed / maxCount * 100)}%; border-radius: 4px 4px 0 0; margin-bottom: 4px;"></div>
                        <div style="font-size: 11px; color: var(--text-secondary);">${d.date ? d.date.substring(5) : ''}</div>
                        <div style="font-size: 12px; font-weight: 500;">${d.completed || 0}</div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderPriorityChart(data) {
        const priorities = [
            { key: 'high', label: '高', count: data.high || 0, color: '#ea4335' },
            { key: 'medium', label: '中', count: data.medium || 0, color: '#fbbc04' },
            { key: 'low', label: '低', count: data.low || 0, color: '#34a853' }
        ];
        const total = priorities.reduce((sum, p) => sum + p.count, 0);

        return `
            <div style="padding: 16px 0;">
                ${total === 0 ? '<div class="empty-state"><p>暂无任务</p></div>' : `
                    <div style="display: flex; height: 24px; border-radius: 12px; overflow: hidden; margin-bottom: 16px;">
                        ${priorities.map(p => `
                            <div style="width: ${(p.count / total * 100)}%; background: ${p.color};"></div>
                        `).join('')}
                    </div>
                    ${priorities.map(p => `
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <div style="width: 12px; height: 12px; border-radius: 50%; background: ${p.color};"></div>
                            <span>${p.label}优先级</span>
                            <span style="color: var(--text-secondary);">${p.count} (${total > 0 ? Math.round(p.count / total * 100) : 0}%)</span>
                        </div>
                    `).join('')}
                `}
            </div>
        `;
    },

    renderWorkloadTable(data) {
        if (data.length === 0) {
            return '<div class="empty-state"><p>暂无数据</p></div>';
        }

        return `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>成员</th>
                        <th>角色</th>
                        <th>任务数</th>
                        <th>总工时</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(d => `
                        <tr>
                            <td>
                            <div class="avatar avatar-sm" style="display: inline-flex; vertical-align: middle; margin-right: 8px;">${(d.username || 'U').charAt(0).toUpperCase()}</div>
                            ${d.username}
                            </td>
                            <td><span class="badge ${d.role === 'owner' ? 'badge-primary' : d.role === 'admin' ? 'badge-warning' : 'badge-secondary'}">${this.getRoleText(d.role)}</span></td>
                            <td>${d.task_count}</td>
                            <td>${d.total_hours}h</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    getRoleText(role) {
        const map = { owner: '组长', admin: '管理员', member: '成员' };
        return map[role] || role;
    },

    async exportCSV() {
        const currentTeam = AuthService.getCurrentTeam();
        const result = await ApiService.get(`/xz/stats/export/get?team_id=${currentTeam.team_id}`);

        if (result.code === 0 && result.data) {
            const blob = new Blob([result.data.content], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = result.data.filename;
            a.click();
            URL.revokeObjectURL(url);
            Toast.success('导出成功');
        } else {
            Toast.error(result.msg || '导出失败');
        }
    }
};

window.StatisticsPage = StatisticsPage;
