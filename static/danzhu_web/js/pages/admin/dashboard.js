const AdminDashboardPage = {
    template: `
        <div class="admin-dashboard">
            <h1 style="margin-bottom: 24px;">📊 数据统计</h1>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-card-header">
                        <span class="stat-card-title">总用户数</span>
                        <span class="stat-card-icon">👥</span>
                    </div>
                    <div class="stat-card-value">{{ overview.total_users?.toLocaleString() || 0 }}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-header">
                        <span class="stat-card-title">总游戏次数</span>
                        <span class="stat-card-icon">🎮</span>
                    </div>
                    <div class="stat-card-value">{{ overview.total_games?.toLocaleString() || 0 }}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-header">
                        <span class="stat-card-title">总得分</span>
                        <span class="stat-card-icon">🏆</span>
                    </div>
                    <div class="stat-card-value">{{ overview.total_score?.toLocaleString() || 0 }}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-header">
                        <span class="stat-card-title">最高分</span>
                        <span class="stat-card-icon">⭐</span>
                    </div>
                    <div class="stat-card-value">{{ overview.max_score?.toLocaleString() || 0 }}</div>
                </div>
            </div>

            <div class="chart-container">
                <h3 class="chart-title">📈 近7日游戏趋势</h3>
                <div class="chart-bars">
                    <div v-for="(day, index) in dailyTrend" :key="index" 
                         class="chart-bar-wrapper" style="flex: 1;">
                        <div class="chart-bar" :style="{ height: getBarHeight(day.games) + '%' }">
                            <span class="chart-bar-value" v-if="day.games > 0">{{ day.games }}</span>
                        </div>
                        <div class="chart-bar-label">{{ formatDate(day.date) }}</div>
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">🎯 关卡统计</h3>
                    </div>
                    <div class="data-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>关卡</th>
                                    <th>难度</th>
                                    <th>游戏次数</th>
                                    <th>平均分</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="level in levelStats" :key="level.id">
                                    <td>{{ level.name }}</td>
                                    <td>
                                        <span :class="['badge', getDifficultyBadge(level.difficulty)]">
                                            {{ level.difficulty_text || level.difficulty }}
                                        </span>
                                    </td>
                                    <td>{{ level.play_count || level.game_count || 0 }}</td>
                                    <td>{{ Math.round(level.avg_score || 0) }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">🏆 顶尖玩家</h3>
                    </div>
                    <div class="leaderboard-list" style="padding: 0;">
                        <div v-for="(player, index) in topPlayers" :key="player.id"
                             class="leaderboard-item" style="padding: 12px 16px;">
                            <div :class="['leaderboard-rank', 'rank-' + (index + 1)]" style="width: 32px; height: 32px; font-size: 12px;">
                                {{ index + 1 }}
                            </div>
                            <div class="leaderboard-avatar" style="width: 36px; height: 36px; font-size: 14px;">
                                {{ player.nickname?.charAt(0) || 'P' }}
                            </div>
                            <div class="leaderboard-info">
                                <div class="leaderboard-name" style="font-size: 14px;">
                                    {{ player.nickname || player.username }}
                                </div>
                            </div>
                            <div class="leaderboard-score" style="font-size: 18px;">
                                {{ (player.highest_score || 0).toLocaleString() }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card" style="margin-top: 24px;">
                <div class="card-header">
                    <h3 class="card-title">📊 游戏统计详情</h3>
                </div>
                <div class="stats-grid" style="grid-template-columns: repeat(4, 1fr);">
                    <div class="stat-card" style="box-shadow: none;">
                        <div class="stat-card-header">
                            <span class="stat-card-title">活跃玩家</span>
                        </div>
                        <div class="stat-card-value">{{ overview.total_players || 0 }}</div>
                    </div>
                    <div class="stat-card" style="box-shadow: none;">
                        <div class="stat-card-header">
                            <span class="stat-card-title">平均得分</span>
                        </div>
                        <div class="stat-card-value">{{ Math.round(overview.avg_score || 0) }}</div>
                    </div>
                    <div class="stat-card" style="box-shadow: none;">
                        <div class="stat-card-header">
                            <span class="stat-card-title">已发布关卡</span>
                        </div>
                        <div class="stat-card-value">{{ overview.published_levels || 0 }}</div>
                    </div>
                    <div class="stat-card" style="box-shadow: none;">
                        <div class="stat-card-header">
                            <span class="stat-card-title">总连击数</span>
                        </div>
                        <div class="stat-card-value">{{ overview.total_combo?.toLocaleString() || 0 }}</div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            overview: {},
            dailyTrend: [],
            levelStats: [],
            topPlayers: []
        };
    },
    async mounted() {
        const admin = Auth.getAdmin();
        if (!admin) {
            Router.navigate('/login');
            return;
        }

        await this.loadOverview();
        await this.loadDailyTrend();
        await this.loadLevelStats();
        await this.loadTopPlayers();
    },
    methods: {
        async loadOverview() {
            try {
                const result = await API.statistics.getOverview();
                if (result.code === 0 && result.data) {
                    this.overview = result.data;
                }
            } catch (e) {
                console.error(e);
            }
        },
        async loadDailyTrend() {
            try {
                const result = await API.statistics.getDaily(7);
                if (result.code === 0 && result.data) {
                    this.dailyTrend = result.data;
                }
            } catch (e) {
                console.error(e);
            }
        },
        async loadLevelStats() {
            try {
                const result = await API.statistics.getLevel();
                if (result.code === 0 && result.data) {
                    this.levelStats = result.data;
                }
            } catch (e) {
                console.error(e);
            }
        },
        async loadTopPlayers() {
            try {
                const result = await API.statistics.getTopPlayers(5);
                if (result.code === 0 && result.data) {
                    this.topPlayers = result.data;
                }
            } catch (e) {
                console.error(e);
            }
        },
        getBarHeight(value) {
            const max = Math.max(...this.dailyTrend.map(d => d.games || 0));
            if (max === 0) return 0;
            return (value || 0) / max * 100;
        },
        formatDate(dateStr) {
            if (!dateStr) return '';
            const parts = dateStr.split('-');
            return `${parts[1]}/${parts[2]}`;
        },
        getDifficultyBadge(difficulty) {
            const badges = {
                easy: 'badge-success',
                normal: 'badge-primary',
                hard: 'badge-danger'
            };
            return badges[difficulty] || 'badge-warning';
        }
    }
};
