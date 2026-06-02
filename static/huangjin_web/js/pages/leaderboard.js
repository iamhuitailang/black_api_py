const LeaderboardPage = {
    props: ['user', 'isAdmin'],
    template: `
    <div>
        <div class="page-header">
            <h2 class="page-title">🏆 排行榜</h2>
        </div>
        <div v-if="loading" style="text-align:center;padding:40px;color:var(--text-secondary);">加载中...</div>
        <div v-else-if="items.length === 0" class="empty-state">
            <div class="empty-state-icon">🏆</div>
            <p>暂无排行数据</p>
        </div>
        <div v-else>
            <div v-for="item in items" :key="item.id" class="leaderboard-item">
                <div class="leaderboard-rank" :class="item.rank <= 3 ? 'top' + item.rank : 'normal'">
                    {{ item.rank <= 3 ? ['🥇','🥈','🥉'][item.rank - 1] : item.rank }}
                </div>
                <div class="leaderboard-info">
                    <div class="leaderboard-name">{{ item.nickname || item.username }}</div>
                    <div class="leaderboard-stats">最高分: {{ item.best_score || 0 }} | 游戏局数: {{ item.total_games || 0 }}</div>
                </div>
                <div class="leaderboard-score">{{ item.total_score || 0 }}</div>
            </div>
            <div class="pagination">
                <button :disabled="page <= 1" @click="loadPage(page - 1)">上一页</button>
                <span class="page-info">{{ page }} / {{ totalPages || 1 }}</span>
                <button :disabled="page >= totalPages" @click="loadPage(page + 1)">下一页</button>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            items: [],
            page: 1,
            totalPages: 1,
            loading: false
        };
    },
    async mounted() {
        await this.loadPage(1);
    },
    methods: {
        async loadPage(p) {
            this.loading = true;
            const result = await Api.game.getLeaderboard(p, 10);
            if (result.code === 0 && result.data) {
                this.items = result.data.items || [];
                this.page = result.data.page || 1;
                this.totalPages = result.data.total_pages || 1;
            }
            this.loading = false;
        }
    }
};
