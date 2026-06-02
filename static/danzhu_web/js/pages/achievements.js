const AchievementsPage = {
    template: `
        <div class="achievements-page">
            <div class="card" style="margin-bottom: 24px;">
                <div class="card-header">
                    <h2 class="card-title">⭐ 成就系统</h2>
                    <div class="achievement-progress">
                        已解锁 {{ unlockedCount }} / {{ totalCount }}
                    </div>
                </div>
                <div style="margin-bottom: 16px;">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <span>累计积分奖励: {{ totalRewards }}</span>
                        <span>完成度: {{ Math.round(unlockedCount / totalCount * 100) || 0 }}%</span>
                    </div>
                </div>
            </div>

            <div class="tabs" style="margin-bottom: 24px;">
                <button :class="['tab', {active: filter === 'all'}]" @click="filter = 'all'">
                    全部
                </button>
                <button :class="['tab', {active: filter === 'unlocked'}]" @click="filter = 'unlocked'">
                    已解锁
                </button>
                <button :class="['tab', {active: filter === 'locked'}]" @click="filter = 'locked'">
                    未解锁
                </button>
            </div>

            <div class="achievements-grid">
                <div v-for="achievement in filteredAchievements" :key="achievement.id"
                     :class="['achievement-card', {unlocked: achievement.unlocked, locked: !achievement.unlocked}]">
                    <div class="achievement-badge" :class="achievement.unlocked ? 'badge-unlocked' : 'badge-locked'">
                        {{ achievement.unlocked ? '✓' : '🔒' }}
                    </div>
                    <div class="achievement-icon">
                        {{ getAchievementIcon(achievement.type) }}
                    </div>
                    <div class="achievement-name">{{ achievement.name }}</div>
                    <div class="achievement-desc">{{ achievement.description }}</div>
                    <div style="margin-top: 12px; font-size: 12px; color: var(--primary-color);">
                        +{{ achievement.reward_points }} 积分
                    </div>
                    <div v-if="achievement.unlocked && achievement.unlocked_at" 
                         style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">
                        {{ formatDate(achievement.unlocked_at) }}
                    </div>
                </div>
            </div>

            <div v-if="filteredAchievements.length === 0" class="empty-state">
                <div class="empty-icon">⭐</div>
                <div class="empty-text">暂无成就</div>
            </div>
        </div>
    `,
    data() {
        return {
            achievements: [],
            filter: 'all',
            currentUser: null
        };
    },
    computed: {
        filteredAchievements() {
            if (this.filter === 'unlocked') {
                return this.achievements.filter(a => a.unlocked);
            } else if (this.filter === 'locked') {
                return this.achievements.filter(a => !a.unlocked);
            }
            return this.achievements;
        },
        unlockedCount() {
            return this.achievements.filter(a => a.unlocked).length;
        },
        totalCount() {
            return this.achievements.length;
        },
        totalRewards() {
            return this.achievements
                .filter(a => a.unlocked)
                .reduce((sum, a) => sum + (a.reward_points || 0), 0);
        }
    },
    async mounted() {
        this.currentUser = Auth.getUser();
        if (!this.currentUser) {
            Router.navigate('/login');
            return;
        }
        await this.loadAchievements();
    },
    methods: {
        async loadAchievements() {
            try {
                const result = await API.achievement.getUser();
                if (result.code === 0 && result.data) {
                    this.achievements = result.data.items || [];
                }
            } catch (e) {
                console.error(e);
            }
        },
        getAchievementIcon(type) {
            const icons = {
                score: '🎯',
                combo: '🔥',
                games: '🎮',
                special: '🌟'
            };
            return icons[type] || '🏆';
        },
        formatDate(dateStr) {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            return date.toLocaleDateString('zh-CN');
        }
    }
};
