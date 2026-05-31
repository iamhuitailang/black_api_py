const AchievementsPage = {
    template: `
    <div class="page has-header">
        <div class="header">
            <span class="header-back" @click="goBack">←</span>
            <span class="header-title">🎖️ 成就</span>
            <span></span>
        </div>

        <div class="achievement-progress" v-if="achievements.length > 0">
            <div class="progress-bar">
                <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
            </div>
            <div class="progress-text">{{ unlockedCount }}/{{ achievements.length }} 已解锁</div>
        </div>

        <div v-if="loading" class="empty-state">
            <div class="empty-state-icon">⏳</div>
            <div class="empty-state-text">加载中...</div>
        </div>

        <div v-else-if="achievements.length === 0" class="empty-state">
            <div class="empty-state-icon">🎖️</div>
            <div class="empty-state-text">暂无成就</div>
        </div>

        <div v-else class="achievement-list">
            <div class="achievement-item" v-for="ach in achievements" :key="ach.id"
                 :class="{ unlocked: ach.unlocked, locked: !ach.unlocked }">
                <div class="achievement-icon">{{ ach.icon || '🏆' }}</div>
                <div class="achievement-info">
                    <div class="achievement-title">{{ ach.unlocked ? ach.title : '???' }}</div>
                    <div class="achievement-desc">{{ ach.unlocked ? ach.description : '继续探索来解锁' }}</div>
                </div>
                <div class="achievement-status">
                    <span v-if="ach.unlocked">✅</span>
                    <span v-else>🔒</span>
                </div>
            </div>
        </div>

        <div class="tabbar">
            <div class="tabbar-item" @click="goHome"><div class="tabbar-icon">🏠</div><div class="tabbar-text">首页</div></div>
            <div class="tabbar-item" @click="goLeaderboard"><div class="tabbar-icon">🏆</div><div class="tabbar-text">排行</div></div>
            <div class="tabbar-item active" @click="goAchievements"><div class="tabbar-icon">🎖️</div><div class="tabbar-text">成就</div></div>
            <div class="tabbar-item" @click="goProfile"><div class="tabbar-icon">👤</div><div class="tabbar-text">我的</div></div>
        </div>
    </div>
    `,
    data() {
        return {
            achievements: [],
            loading: false
        };
    },
    computed: {
        unlockedCount() {
            return this.achievements.filter(a => a.unlocked).length;
        },
        progressPercent() {
            if (this.achievements.length === 0) return 0;
            return Math.round(this.unlockedCount / this.achievements.length * 100);
        }
    },
    mounted() {
        this.loadAchievements();
    },
    methods: {
        async loadAchievements() {
            this.loading = true;
            try {
                const result = await ZbtApi.get('/zbt/achievement/list/get');
                if (result.code === 0) {
                    this.achievements = result.data;
                }
            } catch (e) { console.error(e); }
            finally { this.loading = false; }
        },
        goBack() { ZbtRouter.navigate('/home'); },
        goHome() { ZbtRouter.navigate('/home'); },
        goLeaderboard() { ZbtRouter.navigate('/leaderboard'); },
        goAchievements() { ZbtRouter.navigate('/achievements'); },
        goProfile() { ZbtRouter.navigate('/profile'); }
    }
};
