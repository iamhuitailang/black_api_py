const DashboardPage = {
    render() {
        if (!AuthService.requireAuth()) return;

        const content = `
            <div class="dashboard-container">
                <div class="stats-grid">
                    <div class="stat-card stat-blue">
                        <div class="stat-icon">👥</div>
                        <div class="stat-info">
                            <div class="stat-value" id="totalUsers">--</div>
                            <div class="stat-label">总用户数</div>
                        </div>
                    </div>
                    <div class="stat-card stat-green">
                        <div class="stat-icon">🎮</div>
                        <div class="stat-info">
                            <div class="stat-value" id="totalGames">--</div>
                            <div class="stat-label">总对局数</div>
                        </div>
                    </div>
                    <div class="stat-card stat-orange">
                        <div class="stat-icon">💰</div>
                        <div class="stat-info">
                            <div class="stat-value" id="totalCoins">--</div>
                            <div class="stat-label">总金币流通</div>
                        </div>
                    </div>
                    <div class="stat-card stat-purple">
                        <div class="stat-icon">🏆</div>
                        <div class="stat-info">
                            <div class="stat-value" id="totalAchievements">--</div>
                            <div class="stat-label">成就总数</div>
                        </div>
                    </div>
                </div>

                <div class="dashboard-row">
                    <div class="chart-card">
                        <h3>每日新增用户</h3>
                        <div class="chart-placeholder" id="dailyUsersChart">
                            <div class="loading">加载中...</div>
                        </div>
                    </div>
                    <div class="chart-card">
                        <h3>每日对局数</h3>
                        <div class="chart-placeholder" id="dailyGamesChart">
                            <div class="loading">加载中...</div>
                        </div>
                    </div>
                </div>

                <div class="dashboard-row">
                    <div class="chart-card">
                        <h3>难度分布</h3>
                        <div class="chart-placeholder" id="difficultyChart">
                            <div class="loading">加载中...</div>
                        </div>
                    </div>
                    <div class="chart-card">
                        <h3>角色胜率</h3>
                        <div class="chart-placeholder" id="roleChart">
                            <div class="loading">加载中...</div>
                        </div>
                    </div>
                </div>

                <div class="table-card">
                    <div class="table-header">
                        <h3>最近游戏记录</h3>
                        <a href="#/game-records" class="btn btn-outline btn-small">查看全部</a>
                    </div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>用户</th>
                                    <th>难度</th>
                                    <th>角色</th>
                                    <th>结果</th>
                                    <th>得分</th>
                                    <th>金币</th>
                                    <th>时间</th>
                                </tr>
                            </thead>
                            <tbody id="recentRecords">
                                <tr><td colspan="8"><div class="loading">加载中...</div></td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        const app = document.getElementById('app');
        app.innerHTML = Layout.render(content);
        Layout.setPageTitle('📊 数据概览');
        Layout.init();

        this.loadData();
    },

    async loadData() {
        try {
            const [overallResult, difficultyResult, roleResult, recordsResult] = await Promise.all([
                Api.get('/admin/stats/overall/get'),
                Api.get('/admin/stats/difficulty/get'),
                Api.get('/admin/stats/role/get'),
                Api.get('/admin/game/records/get', { page_size: 10 })
            ]);

            if (overallResult.code === 0 && overallResult.data) {
                const data = overallResult.data;
                document.getElementById('totalUsers').textContent = data.total_users || 0;
                document.getElementById('totalGames').textContent = data.total_games || 0;
                document.getElementById('totalCoins').textContent = data.total_coins_flow || 0;
                document.getElementById('totalAchievements').textContent = data.total_achievements || 0;

                this.renderDailyUsersChart(data.daily_users || []);
                this.renderDailyGamesChart(data.daily_games || []);
            }

            if (difficultyResult.code === 0) {
                this.renderDifficultyChart(difficultyResult.data || []);
            }

            if (roleResult.code === 0) {
                this.renderRoleChart(roleResult.data || []);
            }

            if (recordsResult.code === 0 && recordsResult.data) {
                this.renderRecentRecords(recordsResult.data.items || []);
            }
        } catch (error) {
            console.error('Dashboard load error:', error);
        }
    },

    renderDailyUsersChart(data) {
        const container = document.getElementById('dailyUsersChart');
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="empty">暂无数据</div>';
            return;
        }

        const max = Math.max(...data.map(d => d.count || 0), 1);
        container.innerHTML = `
            <div class="bar-chart">
                ${data.slice(-7).map(d => `
                    <div class="bar-item">
                        <div class="bar-fill" style="height: ${((d.count || 0) / max) * 100}%"></div>
                        <div class="bar-label">${d.count || 0}</div>
                        <div class="bar-date">${(d.date || '').slice(5)}</div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderDailyGamesChart(data) {
        const container = document.getElementById('dailyGamesChart');
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="empty">暂无数据</div>';
            return;
        }

        const max = Math.max(...data.map(d => d.count || 0), 1);
        container.innerHTML = `
            <div class="bar-chart">
                ${data.slice(-7).map(d => `
                    <div class="bar-item">
                        <div class="bar-fill bar-green" style="height: ${((d.count || 0) / max) * 100}%"></div>
                        <div class="bar-label">${d.count || 0}</div>
                        <div class="bar-date">${(d.date || '').slice(5)}</div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderDifficultyChart(data) {
        const container = document.getElementById('difficultyChart');
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="empty">暂无数据</div>';
            return;
        }

        const difficultyMap = { 0: '简单', 1: '普通', 2: '困难' };
        const total = data.reduce((sum, d) => sum + (d.count || 0), 0);

        container.innerHTML = `
            <div class="pie-chart-placeholder">
                ${data.map(d => {
                    const percent = total > 0 ? Math.round((d.count / total) * 100) : 0;
                    return `
                        <div class="pie-item">
                            <div class="pie-dot pie-${d.difficulty || 0}"></div>
                            <span>${difficultyMap[d.difficulty] || '未知'}</span>
                            <span class="pie-value">${d.count || 0} (${percent}%)</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    renderRoleChart(data) {
        const container = document.getElementById('roleChart');
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="empty">暂无数据</div>';
            return;
        }

        const roleMap = { 0: '地主胜', 1: '地主负', 2: '农民胜', 3: '农民负' };

        container.innerHTML = `
            <div class="role-stats">
                ${data.map(d => {
                    const total = (d.wins || 0) + (d.losses || 0);
                    const winRate = total > 0 ? Math.round((d.wins / total) * 100) : 0;
                    return `
                        <div class="role-stat-item">
                            <div class="role-name">${d.role === 0 ? '地主' : '农民'}</div>
                            <div class="role-win-rate">胜率: ${winRate}%</div>
                            <div class="role-detail">${d.wins || 0}胜 / ${d.losses || 0}负</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    renderRecentRecords(records) {
        const tbody = document.getElementById('recentRecords');
        if (!records || records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8"><div class="empty">暂无数据</div></td></tr>';
            return;
        }

        const difficultyMap = { 0: '简单', 1: '普通', 2: '困难' };
        tbody.innerHTML = records.map(r => `
            <tr>
                <td>${r.id}</td>
                <td>${r.username || '-'}</td>
                <td>${difficultyMap[r.ai_difficulty] || '普通'}</td>
                <td>${r.is_landlord === 1 ? '👑 地主' : '👨‍🌾 农民'}</td>
                <td>
                    <span class="badge ${r.result === 1 ? 'badge-success' : 'badge-danger'}">
                        ${r.result === 1 ? '胜' : '负'}
                    </span>
                </td>
                <td>${r.score || 0}</td>
                <td class="${r.coins_change >= 0 ? 'text-green' : 'text-red'}">
                    ${r.coins_change >= 0 ? '+' : ''}${r.coins_change || 0}
                </td>
                <td>${new Date(r.created_at).toLocaleString()}</td>
            </tr>
        `).join('');
    }
};
