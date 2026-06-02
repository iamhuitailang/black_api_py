const AchievementsPage = {
    props: ['user', 'isAdmin'],
    template: `
    <div>
        <div class="page-header">
            <h2 class="page-title">🎖️ 成就系统</h2>
            <div v-if="stats" class="text-secondary">
                已解锁 {{ stats.unlocked_count || 0 }} / {{ stats.total_count || 0 }}
            </div>
        </div>
        <div v-if="loading" style="text-align:center;padding:40px;color:var(--text-secondary);">加载中...</div>
        <div v-else-if="achievements.length === 0" class="empty-state">
            <div class="empty-state-icon">🎖️</div>
            <p>暂无成就</p>
        </div>
        <div v-else class="achievement-grid">
            <div v-for="ach in achievements" :key="ach.id"
                 class="achievement-card" :class="ach.unlocked ? 'unlocked' : 'locked'">
                <div class="achievement-icon" :style="{backgroundColor: ach.badge_color + '30', color: ach.badge_color}">
                    {{ getIcon(ach.condition_type) }}
                </div>
                <div class="achievement-info">
                    <div class="achievement-name" :style="{color: ach.unlocked ? ach.badge_color : 'var(--text-primary)'}">{{ ach.name }}</div>
                    <div class="achievement-desc">{{ ach.description }}</div>
                    <div class="achievement-time" v-if="ach.unlocked">✅ {{ ach.unlocked_at }}</div>
                    <div class="achievement-time" v-else>🔒 未解锁</div>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            achievements: [],
            stats: null,
            loading: false
        };
    },
    async mounted() {
        await this.loadData();
    },
    methods: {
        async loadData() {
            this.loading = true;
            const result = await Api.achievement.getUserAchievements();
            if (result.code === 0 && result.data) {
                this.achievements = result.data.items || [];
                this.stats = {
                    unlocked_count: result.data.unlocked_count,
                    total_count: result.data.total_count
                };
            }
            this.loading = false;
        },
        getIcon(type) {
            const icons = { score: '💰', games: '🎮', ore: '💎', special: '⭐' };
            return icons[type] || '🎖️';
        }
    }
};
