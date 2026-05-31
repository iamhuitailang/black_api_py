const AdminStatsPage = {
    template: `
    <div class="page has-header">
        <div class="header">
            <span class="header-back" @click="goBack">←</span>
            <span class="header-title">📊 数据统计</span>
            <span></span>
        </div>

        <div v-if="stats" class="stats-grid">
            <div class="stats-card">
                <div class="stats-card-icon">🎮</div>
                <div class="stats-card-value">{{ stats.total_games || 0 }}</div>
                <div class="stats-card-label">总游戏次数</div>
            </div>
            <div class="stats-card">
                <div class="stats-card-icon">✅</div>
                <div class="stats-card-value">{{ stats.completed_games || 0 }}</div>
                <div class="stats-card-label">通关次数</div>
            </div>
            <div class="stats-card">
                <div class="stats-card-icon">❌</div>
                <div class="stats-card-value">{{ stats.failed_games || 0 }}</div>
                <div class="stats-card-label">失败次数</div>
            </div>
            <div class="stats-card">
                <div class="stats-card-icon">⏱️</div>
                <div class="stats-card-value">{{ stats.avg_time || 0 }}s</div>
                <div class="stats-card-label">平均用时</div>
            </div>
            <div class="stats-card">
                <div class="stats-card-icon">👥</div>
                <div class="stats-card-value">{{ stats.total_players || 0 }}</div>
                <div class="stats-card-label">玩家总数</div>
            </div>
            <div class="stats-card">
                <div class="stats-card-icon">🗺️</div>
                <div class="stats-card-value">{{ stats.total_levels || 0 }}</div>
                <div class="stats-card-label">关卡总数</div>
            </div>
        </div>

        <div class="section-title">通关率</div>
        <div class="progress-bar-lg" v-if="stats">
            <div class="progress-fill-lg success" :style="{ width: completionRate + '%' }"></div>
            <span class="progress-text-lg">{{ completionRate }}%</span>
        </div>

        <div class="section-title">最近游戏记录</div>
        <div v-if="recentGames.length === 0" class="empty-state"><div class="empty-state-text">暂无记录</div></div>
        <div v-else class="admin-list">
            <div class="recent-item" v-for="g in recentGames" :key="g.id">
                <div class="recent-info">
                    <span class="recent-name">{{ g.nickname || '匿名' }}</span>
                    <span class="recent-level">{{ g.level_name || '关卡' + g.level_id }}</span>
                </div>
                <div class="recent-result" :class="{ success: g.status === 1 }">
                    {{ g.status === 1 ? '✅ ' + g.time_used + 's 提示' + g.hints_used + '次' : '❌ 找到' + g.differences_found + '处' }}
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            stats: null,
            recentGames: []
        };
    },
    computed: {
        completionRate() {
            if (!this.stats || !this.stats.total_games) return 0;
            return Math.round(this.stats.completed_games / this.stats.total_games * 100);
        }
    },
    mounted() { this.loadData(); },
    methods: {
        async loadData() {
            try {
                const [statsResult, recentResult] = await Promise.all([
                    ZbtApi.get('/zbt/admin/stats/get'),
                    ZbtApi.get('/zbt/admin/recent/games/get', { limit: 30 })
                ]);
                if (statsResult.code === 0) this.stats = statsResult.data;
                if (recentResult.code === 0) this.recentGames = recentResult.data;
            } catch (e) { console.error(e); }
        },
        goBack() { ZbtRouter.navigate('/admin/dashboard'); }
    }
};
