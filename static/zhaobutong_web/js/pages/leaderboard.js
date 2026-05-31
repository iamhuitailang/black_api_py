const LeaderboardPage = {
    template: `
    <div class="page has-header">
        <div class="header">
            <span class="header-back" @click="goBack">←</span>
            <span class="header-title">🏆 排行榜</span>
            <span></span>
        </div>

        <div class="lb-filter">
            <div class="lb-filter-item" :class="{ active: selectedLevel === 0 }" @click="selectedLevel = 0">总排行</div>
            <div class="lb-filter-item" v-for="level in levels" :key="level.id"
                 :class="{ active: selectedLevel === level.id }" @click="selectedLevel = level.id">
                {{ level.name }}
            </div>
        </div>

        <div v-if="loading" class="empty-state">
            <div class="empty-state-icon">⏳</div>
            <div class="empty-state-text">加载中...</div>
        </div>

        <div v-else-if="records.length === 0" class="empty-state">
            <div class="empty-state-icon">🏆</div>
            <div class="empty-state-text">暂无记录</div>
        </div>

        <div v-else class="lb-list">
            <div class="lb-item" v-for="(record, idx) in records" :key="idx"
                 :class="{ 'lb-top1': idx === 0, 'lb-top2': idx === 1, 'lb-top3': idx === 2 }">
                <div class="lb-rank">{{ idx < 3 ? ['🥇','🥈','🥉'][idx] : idx + 1 }}</div>
                <div class="lb-avatar">{{ (record.nickname || '?')[0] }}</div>
                <div class="lb-info">
                    <div class="lb-name">{{ record.nickname || '匿名玩家' }}</div>
                    <div class="lb-level" v-if="record.level_name">{{ record.level_name }}</div>
                </div>
                <div class="lb-time">{{ formatTime(record.time_used) }}</div>
            </div>
        </div>

        <div class="tabbar">
            <div class="tabbar-item" @click="goHome"><div class="tabbar-icon">🏠</div><div class="tabbar-text">首页</div></div>
            <div class="tabbar-item active" @click="goLeaderboard"><div class="tabbar-icon">🏆</div><div class="tabbar-text">排行</div></div>
            <div class="tabbar-item" @click="goAchievements"><div class="tabbar-icon">🎖️</div><div class="tabbar-text">成就</div></div>
            <div class="tabbar-item" @click="goProfile"><div class="tabbar-icon">👤</div><div class="tabbar-text">我的</div></div>
        </div>
    </div>
    `,
    data() {
        return {
            records: [],
            levels: [],
            selectedLevel: 0,
            loading: false
        };
    },
    mounted() {
        this.loadLevels();
        this.loadLeaderboard();
    },
    methods: {
        async loadLevels() {
            try {
                const result = await ZbtApi.get('/zbt/level/active/list/get');
                if (result.code === 0) {
                    this.levels = result.data;
                }
            } catch (e) { console.error(e); }
        },
        async loadLeaderboard() {
            this.loading = true;
            try {
                const params = { limit: 50 };
                if (this.selectedLevel > 0) params.level_id = this.selectedLevel;
                const result = await ZbtApi.get('/zbt/game/leaderboard/get', params);
                if (result.code === 0) {
                    this.records = result.data;
                }
            } catch (e) { console.error(e); }
            finally { this.loading = false; }
        },
        formatTime(seconds) {
            if (!seconds) return '--:--';
            const m = Math.floor(seconds / 60);
            const s = seconds % 60;
            return `${m}:${s.toString().padStart(2, '0')}`;
        },
        goBack() { ZbtRouter.navigate('/home'); },
        goHome() { ZbtRouter.navigate('/home'); },
        goLeaderboard() { ZbtRouter.navigate('/leaderboard'); },
        goAchievements() { ZbtRouter.navigate('/achievements'); },
        goProfile() { ZbtRouter.navigate('/profile'); }
    },
    watch: {
        selectedLevel() { this.loadLeaderboard(); }
    }
};
