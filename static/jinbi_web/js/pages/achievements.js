const AchievementsPage = {
    template: `
        <div class="achievements-page">
            <nav class="game-nav">
                <div class="nav-left">
                    <span class="user-avatar">{{ gameState.user?.avatar || '😊' }}</span>
                    <span class="user-name">{{ gameState.user?.nickname || '玩家' }}</span>
                </div>
                <div class="nav-center">
                    <h2 class="page-title">🎖️ 成就系统</h2>
                </div>
                <div class="nav-right">
                    <span class="coin-display">💰 {{ gameState.coins }}</span>
                </div>
            </nav>

            <div class="achievements-content">
                <div class="achievements-stats">
                    <div class="stat-box">
                        <div class="stat-number">{{ unlockedCount }}</div>
                        <div class="stat-label">已解锁</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number">{{ totalCount }}</div>
                        <div class="stat-label">总成就</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number">{{ completionRate }}%</div>
                        <div class="stat-label">完成度</div>
                    </div>
                </div>

                <div class="achievements-list">
                    <div 
                        v-for="achievement in achievements" 
                        :key="achievement.id"
                        class="achievement-card"
                        :class="{ 'unlocked': achievement.unlocked, 'locked': !achievement.unlocked }"
                    >
                        <div class="achievement-icon">
                            {{ achievement.unlocked ? achievement.icon : '🔒' }}
                        </div>
                        <div class="achievement-info">
                            <div class="achievement-name">{{ achievement.name }}</div>
                            <div class="achievement-desc">{{ achievement.desc }}</div>
                            <div class="achievement-progress-bar">
                                <div 
                                    class="achievement-progress-fill"
                                    :style="{ width: getProgressPercent(achievement) + '%' }"
                                ></div>
                            </div>
                            <div class="achievement-progress-text">
                                {{ achievement.progress }} / {{ achievement.target }}
                            </div>
                        </div>
                        <div class="achievement-reward" v-if="achievement.unlocked">
                            <span class="reward-badge">+50💰</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bottom-nav">
                <div class="nav-item" :class="{ active: currentRoute === 'game' }" @click="navigateTo('game')">
                    <span class="nav-icon">🎮</span>
                    <span class="nav-text">游戏</span>
                </div>
                <div class="nav-item" :class="{ active: currentRoute === 'leaderboard' }" @click="navigateTo('leaderboard')">
                    <span class="nav-icon">🏆</span>
                    <span class="nav-text">排行</span>
                </div>
                <div class="nav-item" :class="{ active: currentRoute === 'achievements' }" @click="navigateTo('achievements')">
                    <span class="nav-icon">🎖️</span>
                    <span class="nav-text">成就</span>
                </div>
                <div class="nav-item" :class="{ active: currentRoute === 'profile' }" @click="navigateTo('profile')">
                    <span class="nav-icon">👤</span>
                    <span class="nav-text">我的</span>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            currentRoute: 'achievements'
        };
    },
    computed: {
        gameState() {
            if (!GameStore.state) {
                GameStore.ensureState();
            }
            return GameStore.state || {};
        },
        achievements() {
            return this.gameState.achievements || [];
        },
        unlockedCount() {
            return this.achievements.filter(a => a.unlocked).length;
        },
        totalCount() {
            return this.achievements.length;
        },
        completionRate() {
            if (this.totalCount === 0) return 0;
            return Math.round((this.unlockedCount / this.totalCount) * 100);
        }
    },
    mounted() {
        this.currentRoute = Router.getCurrentRoute();
    },
    methods: {
        getProgressPercent(achievement) {
            return Math.min((achievement.progress / achievement.target) * 100, 100);
        },
        navigateTo(route) {
            Router.navigate(route);
        }
    }
};

window.AchievementsPage = AchievementsPage;
