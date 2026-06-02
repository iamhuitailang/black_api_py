const AdminDashboardPage = {
    props: ['user', 'isAdmin'],
    template: `
    <div>
        <div class="page-header">
            <h2 class="page-title">📊 管理仪表盘</h2>
        </div>
        <div v-if="loading" style="text-align:center;padding:40px;color:var(--text-secondary);">加载中...</div>
        <template v-else>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">{{ stats.total_users || 0 }}</div>
                    <div class="stat-label">总用户数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{{ stats.total_games || 0 }}</div>
                    <div class="stat-label">总游戏局数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{{ stats.total_score || 0 }}</div>
                    <div class="stat-label">总积分</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{{ stats.max_score || 0 }}</div>
                    <div class="stat-label">最高单局分</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{{ stats.today_games || 0 }}</div>
                    <div class="stat-label">今日对局</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{{ stats.today_score || 0 }}</div>
                    <div class="stat-label">今日积分</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{{ stats.total_ores || 0 }}</div>
                    <div class="stat-label">矿石种类</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{{ stats.total_achievements || 0 }}</div>
                    <div class="stat-label">成就数量</div>
                </div>
            </div>
            <div class="card mt-24">
                <h3 class="card-title">最近游戏记录</h3>
                <div v-if="stats.recent_records && stats.recent_records.length > 0" class="table-container">
                    <table>
                        <thead><tr><th>玩家</th><th>得分</th><th>矿石数</th><th>时间</th></tr></thead>
                        <tbody>
                            <tr v-for="r in stats.recent_records" :key="r.id">
                                <td>{{ r.nickname || r.username }}</td>
                                <td class="text-gold">{{ r.score }}</td>
                                <td>{{ r.ore_count }}</td>
                                <td class="text-secondary">{{ formatDate(r.created_at) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-else class="empty-state"><p>暂无游戏记录</p></div>
            </div>
        </template>
    </div>
    `,
    data() {
        return {
            stats: {},
            loading: false
        };
    },
    async mounted() {
        await this.loadData();
    },
    methods: {
        async loadData() {
            this.loading = true;
            const result = await Api.admin.getDashboard();
            if (result.code === 0 && result.data) {
                this.stats = result.data;
            }
            this.loading = false;
        },
        formatDate(d) {
            if (!d) return '';
            return d.substring(0, 19).replace('T', ' ');
        }
    }
};
