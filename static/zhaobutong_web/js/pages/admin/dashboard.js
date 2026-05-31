const AdminDashboardPage = {
    template: `
    <div class="page has-header">
        <div class="header">
            <span class="header-back" @click="goHome">←</span>
            <span class="header-title">⚙️ 管理后台</span>
            <span></span>
        </div>

        <div class="admin-stats" v-if="stats">
            <div class="stat-card">
                <div class="stat-icon">🎮</div>
                <div class="stat-value">{{ stats.total_games || 0 }}</div>
                <div class="stat-label">总游戏数</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">✅</div>
                <div class="stat-value">{{ stats.completed_games || 0 }}</div>
                <div class="stat-label">通关数</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">👥</div>
                <div class="stat-value">{{ stats.total_players || 0 }}</div>
                <div class="stat-label">玩家数</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🗺️</div>
                <div class="stat-value">{{ stats.total_levels || 0 }}</div>
                <div class="stat-label">关卡数</div>
            </div>
        </div>

        <div class="list">
            <div class="list-item" @click="goUsers">
                <div class="list-item-content"><div class="list-item-title">👥 用户管理</div></div>
                <div class="list-item-arrow">→</div>
            </div>
            <div class="list-item" @click="goLevels">
                <div class="list-item-content"><div class="list-item-title">🗺️ 关卡管理</div></div>
                <div class="list-item-arrow">→</div>
            </div>
            <div class="list-item" @click="goImages">
                <div class="list-item-content"><div class="list-item-title">🖼️ 图片管理</div></div>
                <div class="list-item-arrow">→</div>
            </div>
            <div class="list-item" @click="goStats">
                <div class="list-item-content"><div class="list-item-title">📊 数据统计</div></div>
                <div class="list-item-arrow">→</div>
            </div>
        </div>

        <div class="section-title">最近游戏记录</div>
        <div class="recent-list" v-if="recentGames.length > 0">
            <div class="recent-item" v-for="g in recentGames" :key="g.id">
                <div class="recent-info">
                    <span class="recent-name">{{ g.nickname || '匿名' }}</span>
                    <span class="recent-level">{{ g.level_name || '关卡' + g.level_id }}</span>
                </div>
                <div class="recent-result" :class="{ 'success': g.status === 1 }">
                    {{ g.status === 1 ? '✅ ' + g.time_used + 's' : '❌ 失败' }}
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
    mounted() {
        this.loadData();
    },
    methods: {
        async loadData() {
            try {
                const [statsResult, recentResult] = await Promise.all([
                    ZbtApi.get('/zbt/admin/stats/get'),
                    ZbtApi.get('/zbt/admin/recent/games/get', { limit: 10 })
                ]);
                if (statsResult.code === 0) this.stats = statsResult.data;
                if (recentResult.code === 0) this.recentGames = recentResult.data;
            } catch (e) { console.error(e); }
        },
        goHome() { ZbtRouter.navigate('/home'); },
        goUsers() { ZbtRouter.navigate('/admin/users'); },
        goLevels() { ZbtRouter.navigate('/admin/levels'); },
        goImages() { ZbtRouter.navigate('/admin/images'); },
        goStats() { ZbtRouter.navigate('/admin/stats'); }
    }
};
