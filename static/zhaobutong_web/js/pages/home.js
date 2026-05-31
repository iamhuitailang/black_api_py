const HomePage = {
    template: `
    <div class="page has-header">
        <div class="header">
            <span class="header-title">找不同</span>
            <span class="header-action" @click="goProfile">{{ user.nickname || '我的' }}</span>
        </div>

        <div class="home-banner">
            <div class="home-banner-title">🔥 火眼金睛挑战</div>
            <div class="home-banner-subtitle">找出两幅图片之间的所有不同</div>
        </div>

        <div class="section-title">选择主题</div>
        <div class="theme-tabs">
            <div class="theme-tab" :class="{ active: currentTheme === '' }" @click="currentTheme = ''">全部</div>
            <div class="theme-tab" :class="{ active: currentTheme === t.value }" v-for="t in themes" :key="t.value" @click="currentTheme = t.value">
                {{ t.icon }} {{ t.label }}
            </div>
        </div>

        <div class="section-title">选择难度</div>
        <div class="difficulty-tabs">
            <div class="diff-tab" :class="{ active: currentDiff === 0 }" @click="currentDiff = 0">全部</div>
            <div class="diff-tab" :class="{ active: currentDiff === 1 }" @click="currentDiff = 1">⭐ 简单</div>
            <div class="diff-tab" :class="{ active: currentDiff === 2 }" @click="currentDiff = 2">⭐⭐ 中等</div>
            <div class="diff-tab" :class="{ active: currentDiff === 3 }" @click="currentDiff = 3">⭐⭐⭐ 困难</div>
        </div>

        <div v-if="loading" class="empty-state">
            <div class="empty-state-icon">⏳</div>
            <div class="empty-state-text">加载中...</div>
        </div>

        <div v-else-if="filteredLevels.length === 0" class="empty-state">
            <div class="empty-state-icon">🎮</div>
            <div class="empty-state-text">暂无关卡</div>
        </div>

        <div v-else class="level-grid">
            <div class="level-card" v-for="level in filteredLevels" :key="level.id" @click="startGame(level)">
                <div class="level-card-theme">{{ getThemeIcon(level.theme) }}</div>
                <div class="level-card-info">
                    <div class="level-card-name">{{ level.name }}</div>
                    <div class="level-card-meta">
                        <span class="level-card-diff">{{ getDiffText(level.difficulty) }}</span>
                        <span class="level-card-count">{{ level.difference_count || level.actual_difference_count || 0 }}处不同</span>
                        <span class="level-card-time">⏱ {{ level.time_limit }}s</span>
                    </div>
                </div>
                <div class="level-card-arrow">▶</div>
            </div>
        </div>

        <div class="tabbar">
            <div class="tabbar-item active" @click="goHome">
                <div class="tabbar-icon">🏠</div>
                <div class="tabbar-text">首页</div>
            </div>
            <div class="tabbar-item" @click="goLeaderboard">
                <div class="tabbar-icon">🏆</div>
                <div class="tabbar-text">排行</div>
            </div>
            <div class="tabbar-item" @click="goAchievements">
                <div class="tabbar-icon">🎖️</div>
                <div class="tabbar-text">成就</div>
            </div>
            <div class="tabbar-item" @click="goProfile">
                <div class="tabbar-icon">👤</div>
                <div class="tabbar-text">我的</div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            user: ZbtAuth.getCurrentUser() || {},
            levels: [],
            themes: [
                { value: 'nature', label: '自然风光', icon: '🌿' },
                { value: 'city', label: '城市建筑', icon: '🏙️' },
                { value: 'food', label: '美食甜点', icon: '🍰' }
            ],
            currentTheme: '',
            currentDiff: 0,
            loading: false
        };
    },
    computed: {
        filteredLevels() {
            let list = this.levels;
            if (this.currentTheme) {
                list = list.filter(l => l.theme === this.currentTheme);
            }
            if (this.currentDiff > 0) {
                list = list.filter(l => l.difficulty === this.currentDiff);
            }
            return list;
        }
    },
    mounted() {
        this.loadLevels();
    },
    methods: {
        async loadLevels() {
            this.loading = true;
            try {
                const params = {};
                if (this.currentTheme) params.theme = this.currentTheme;
                if (this.currentDiff) params.difficulty = this.currentDiff;
                const result = await ZbtApi.get('/zbt/level/active/list/get', params);
                if (result.code === 0) {
                    this.levels = result.data;
                }
            } catch (e) {
                console.error(e);
            } finally {
                this.loading = false;
            }
        },
        getThemeIcon(theme) {
            const map = { nature: '🌿', city: '🏙️', food: '🍰' };
            return map[theme] || '🎨';
        },
        getDiffText(diff) {
            const map = { 1: '⭐ 简单', 2: '⭐⭐ 中等', 3: '⭐⭐⭐ 困难' };
            return map[diff] || '未知';
        },
        async startGame(level) {
            try {
                const result = await ZbtApi.post('/zbt/game/start', { level_id: level.id });
                if (result.code === 0) {
                    ZbtStorage.setGameData(result.data);
                    ZbtStorage.removeGameState();
                    ZbtRouter.navigate('/game');
                } else {
                    this.showToast(result.msg || '开始游戏失败');
                }
            } catch (e) {
                this.showToast('网络错误');
            }
        },
        goHome() { ZbtRouter.navigate('/home'); },
        goLeaderboard() { ZbtRouter.navigate('/leaderboard'); },
        goAchievements() { ZbtRouter.navigate('/achievements'); },
        goProfile() { ZbtRouter.navigate('/profile'); },
        showToast(msg) {
            const existing = document.querySelector('.zbt-toast');
            if (existing) existing.remove();
            const el = document.createElement('div');
            el.className = 'zbt-toast';
            el.textContent = msg;
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 2000);
        }
    },
    watch: {
        currentTheme() { this.loadLevels(); },
        currentDiff() { this.loadLevels(); }
    }
};
