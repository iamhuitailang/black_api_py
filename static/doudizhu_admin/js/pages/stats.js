const StatsPage = {
    data: {
        overall: null,
        difficulty: [],
        role: [],
        dailyUsers: [],
        dailyGames: []
    },

    render() {
        if (!AuthService.requireAuth()) return;

        const content = `
            <div class="page-header">
                <h2>📈 数据统计</h2>
            </div>

            <div class="stats-detail-container">
                <div class="stats-section">
                    <h3>📊 总体数据概览</h3>
                    <div class="stats-grid-3" id="overviewStats">
                        <div class="stat-item">
                            <div class="stat-item-value">--</div>
                            <div class="stat-item-label">总用户数</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-item-value">--</div>
                            <div class="stat-item-label">总对局数</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-item-value">--</div>
                            <div class="stat-item-label">总金币流通</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-item-value">--</div>
                            <div class="stat-item-label">总游戏时长(分钟)</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-item-value">--</div>
                            <div class="stat-item-label">总炸弹数</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-item-value">--</div>
                            <div class="stat-item-label">成就总数</div>
                        </div>
                    </div>
                </div>

                <div class="dashboard-row">
                    <div class="chart-card">
                        <h3>📈 每日新增用户</h3>
                        <div class="chart-placeholder" id="dailyUsersChart">
                            <div class="loading">加载中...</div>
                        </div>
                    </div>
                    <div class="chart-card">
                        <h3>🎮 每日对局数</h3>
                        <div class="chart-placeholder" id="dailyGamesChart">
                            <div class="loading">加载中...</div>
                        </div>
                    </div>
                </div>

                <div class="dashboard-row">
                    <div class="chart-card">
                        <h3>🎯 难度分布统计</h3>
                        <div class="chart-placeholder" id="difficultyStats">
                            <div class="loading">加载中...</div>
                        </div>
                    </div>
                    <div class="chart-card">
                        <h3>👑 角色胜率统计</h3>
                        <div class="chart-placeholder" id="roleStats">
                            <div class="loading">加载中...</div>
                        </div>
                    </div>
                </div>

                <div class="stats-section">
                    <h3>🏆 用户排行榜TOP10</h3>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>排名</th>
                                    <th>用户</th>
                                    <th>等级</th>
                                    <th>金币</th>
                                    <th>总胜场</th>
                                    <th>总负场</th>
                                    <th>胜率</th>
                                </tr>
                            </thead>
                            <tbody id="topUsersTable">
                                <tr><td colspan="7"><div class="loading">加载中...</div></td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="stats-section">
                    <h3>💎 成就解锁统计</h3>
                    <div class="stats-grid-2" id="achievementStats">
                        <div class="stat-item">
                            <div class="stat-item-value">--</div>
                            <div class="stat-item-label">已解锁成就次数</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-item-value">--</div>
                            <div class="stat-item-label">已发放金币奖励</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-item-value">--</div>
                            <div class="stat-item-label">已发放经验奖励</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-item-value">--</div>
                            <div class="stat-item-label">解锁成就用户数</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const app = document.getElementById('app');
        app.innerHTML = Layout.render(content);
        Layout.setPageTitle('📈 数据统计');
        Layout.init();

        this.loadAllData();
    },

    async loadAllData() {
        try {
            const [overallResult, difficultyResult, roleResult, rankingResult, achievementResult] = await Promise.all([
                Api.get('/admin/stats/overall/get'),
                Api.get('/admin/stats/difficulty/get'),
                Api.get('/admin/stats/role/get'),
                Api.get('/admin/stats/ranking/get', { limit: 10 }),
                Api.get('/admin/stats/achievements/get')
            ]);

            if (overallResult.code === 0 && overallResult.data) {
                this.data.overall = overallResult.data;
                this.renderOverview(overallResult.data);
                this.renderDailyUsersChart(overallResult.data.daily_users || []);
                this.renderDailyGamesChart(overallResult.data.daily_games || []);
            }

            if (difficultyResult.code === 0) {
                this.data.difficulty = difficultyResult.data || [];
                this.renderDifficultyStats(difficultyResult.data || []);
            }

            if (roleResult.code === 0) {
                this.data.role = roleResult.data || [];
                this.renderRoleStats(roleResult.data || []);
            }

            if (rankingResult.code === 0) {
                this.renderTopUsers(rankingResult.data || []);
            }

            if (achievementResult.code === 0 && achievementResult.data) {
                this.renderAchievementStats(achievementResult.data);
            }
        } catch (error) {
            console.error('Load stats error:', error);
        }
    },

    renderOverview(data) {
        const container = document.getElementById('overviewStats');
        container.innerHTML = `
            <div class="stat-item">
                <div class="stat-item-value">${data.total_users || 0}</div>
                <div class="stat-item-label">总用户数</div>
            </div>
            <div class="stat-item">
                <div class="stat-item-value">${data.total_games || 0}</div>
                <div class="stat-item-label">总对局数</div>
            </div>
            <div class="stat-item">
                <div class="stat-item-value">${data.total_coins_flow || 0}</div>
                <div class="stat-item-label">总金币流通</div>
            </div>
            <div class="stat-item">
                <div class="stat-item-value">${Math.round((data.total_duration || 0) / 60)}</div>
                <div class="stat-item-label">总游戏时长(分钟)</div>
            </div>
            <div class="stat-item">
                <div class="stat-item-value">${data.total_bombs || 0}</div>
                <div class="stat-item-label">总炸弹数</div>
            </div>
            <div class="stat-item">
                <div class="stat-item-value">${data.total_achievements || 0}</div>
                <div class="stat-item-label">成就总数</div>
            </div>
        `;
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
                ${data.slice(-14).map(d => `
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
                ${data.slice(-14).map(d => `
                    <div class="bar-item">
                        <div class="bar-fill bar-green" style="height: ${((d.count || 0) / max) * 100}%"></div>
                        <div class="bar-label">${d.count || 0}</div>
                        <div class="bar-date">${(d.date || '').slice(5)}</div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderDifficultyStats(data) {
        const container = document.getElementById('difficultyStats');
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
                    const winRate = ((d.wins || 0) + (d.losses || 0)) > 0 
                        ? Math.round((d.wins / ((d.wins || 0) + (d.losses || 0))) * 100) 
                        : 0;
                    return `
                        <div class="pie-item">
                            <div class="pie-dot pie-${d.difficulty || 0}"></div>
                            <span>${difficultyMap[d.difficulty] || '未知'}</span>
                            <span class="pie-value">${d.count || 0}局 (${percent}%)</span>
                            <span class="text-orange">胜率: ${winRate}%</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    renderRoleStats(data) {
        const container = document.getElementById('roleStats');
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="empty">暂无数据</div>';
            return;
        }

        container.innerHTML = `
            <div class="role-stats">
                ${data.map(d => {
                    const total = (d.wins || 0) + (d.losses || 0);
                    const winRate = total > 0 ? Math.round((d.wins / total) * 100) : 0;
                    return `
                        <div class="role-stat-item">
                            <div class="role-name">${d.role === 0 ? '👑 地主' : '👨‍🌾 农民'}</div>
                            <div class="role-win-rate">胜率: ${winRate}%</div>
                            <div class="role-detail">${d.wins || 0}胜 / ${d.losses || 0}负 / 共${total}局</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    renderTopUsers(users) {
        const tbody = document.getElementById('topUsersTable');
        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7"><div class="empty">暂无数据</div></td></tr>';
            return;
        }

        const rankBadges = ['🥇', '🥈', '🥉'];

        tbody.innerHTML = users.map((u, index) => {
            const totalGames = (u.wins || 0) + (u.losses || 0);
            const winRate = totalGames > 0 ? Math.round((u.wins / totalGames) * 100) : 0;
            
            return `
                <tr>
                    <td>${rankBadges[index] || (index + 1)}</td>
                    <td>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <div class="user-avatar-small">${(u.username || 'U').charAt(0).toUpperCase()}</div>
                            <span>${u.username || '-'}</span>
                        </div>
                    </td>
                    <td><span class="badge badge-info">Lv.${u.level || 1}</span></td>
                    <td class="text-orange">${u.coins || 0}</td>
                    <td class="text-green">${u.wins || 0}</td>
                    <td class="text-red">${u.losses || 0}</td>
                    <td>${winRate}%</td>
                </tr>
            `;
        }).join('');
    },

    renderAchievementStats(data) {
        const container = document.getElementById('achievementStats');
        container.innerHTML = `
            <div class="stat-item">
                <div class="stat-item-value">${data.total_unlocks || 0}</div>
                <div class="stat-item-label">已解锁成就次数</div>
            </div>
            <div class="stat-item">
                <div class="stat-item-value">${data.total_coins_reward || 0}</div>
                <div class="stat-item-label">已发放金币奖励</div>
            </div>
            <div class="stat-item">
                <div class="stat-item-value">${data.total_exp_reward || 0}</div>
                <div class="stat-item-label">已发放经验奖励</div>
            </div>
            <div class="stat-item">
                <div class="stat-item-value">${data.unique_users || 0}</div>
                <div class="stat-item-label">解锁成就用户数</div>
            </div>
        `;
    }
};
