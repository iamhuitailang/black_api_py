const LeaderboardPage = {
    template: `
        <div class="leaderboard-page">
            <nav class="game-nav">
                <div class="nav-left">
                    <span class="user-avatar">{{ gameState.user?.avatar || '😊' }}</span>
                    <span class="user-name">{{ gameState.user?.nickname || '玩家' }}</span>
                </div>
                <div class="nav-center">
                    <h2 class="page-title">🏆 排行榜</h2>
                </div>
                <div class="nav-right">
                    <span class="coin-display">💰 {{ gameState.coins }}</span>
                </div>
            </nav>

            <div class="leaderboard-content">
                <div class="podium-section">
                    <div class="podium">
                        <div class="podium-item second">
                            <div class="podium-avatar">{{ leaderboard[1]?.avatar || '🥈' }}</div>
                            <div class="podium-name">{{ leaderboard[1]?.nickname || '-' }}</div>
                            <div class="podium-coins">{{ formatNumber(leaderboard[1]?.coins || 0) }}</div>
                            <div class="podium-rank">2</div>
                            <div class="podium-platform" style="height: 100px;"></div>
                        </div>
                        <div class="podium-item first">
                            <div class="crown">👑</div>
                            <div class="podium-avatar">{{ leaderboard[0]?.avatar || '🥇' }}</div>
                            <div class="podium-name">{{ leaderboard[0]?.nickname || '-' }}</div>
                            <div class="podium-coins">{{ formatNumber(leaderboard[0]?.coins || 0) }}</div>
                            <div class="podium-rank">1</div>
                            <div class="podium-platform" style="height: 140px;"></div>
                        </div>
                        <div class="podium-item third">
                            <div class="podium-avatar">{{ leaderboard[2]?.avatar || '🥉' }}</div>
                            <div class="podium-name">{{ leaderboard[2]?.nickname || '-' }}</div>
                            <div class="podium-coins">{{ formatNumber(leaderboard[2]?.coins || 0) }}</div>
                            <div class="podium-rank">3</div>
                            <div class="podium-platform" style="height: 80px;"></div>
                        </div>
                    </div>
                </div>

                <div class="ranking-list">
                    <div class="list-header">
                        <span class="col-rank">排名</span>
                        <span class="col-user">玩家</span>
                        <span class="col-level">等级</span>
                        <span class="col-coins">金币</span>
                    </div>
                    <div 
                        v-for="(item, index) in leaderboard.slice(3)" 
                        :key="item.rank"
                        class="ranking-item"
                        :class="{ 'me': item.nickname === gameState.user?.nickname }"
                    >
                        <span class="col-rank">
                            <span class="rank-number">{{ index + 4 }}</span>
                        </span>
                        <span class="col-user">
                            <span class="user-avatar-small">{{ item.avatar }}</span>
                            <span class="user-name-small">{{ item.nickname }}</span>
                        </span>
                        <span class="col-level">
                            <span class="level-tag">Lv.{{ item.level }}</span>
                        </span>
                        <span class="col-coins">
                            <span class="coins-value">💰 {{ formatNumber(item.coins) }}</span>
                        </span>
                    </div>
                </div>

                <div class="my-rank-card" v-if="myRank">
                    <div class="my-rank-label">我的排名</div>
                    <div class="my-rank-info">
                        <span class="my-rank-number">#{{ myRank.rank }}</span>
                        <span class="my-rank-coins">💰 {{ formatNumber(myRank.coins) }}</span>
                        <span class="my-rank-level">Lv.{{ myRank.level }}</span>
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
            currentRoute: 'leaderboard'
        };
    },
    computed: {
        gameState() {
            if (!GameStore.state) {
                GameStore.ensureState();
            }
            return GameStore.state || {};
        },
        leaderboard() {
            return this.gameState.leaderboard || [];
        },
        myRank() {
            if (!this.gameState.user) return null;
            return this.leaderboard.find(item => item.nickname === this.gameState.user.nickname);
        }
    },
    mounted() {
        this.currentRoute = Router.getCurrentRoute();
        if (GameStore.state) {
            GameStore.updateLeaderboard();
        }
    },
    methods: {
        formatNumber(num) {
            if (num >= 10000) {
                return (num / 10000).toFixed(1) + '万';
            }
            return num.toLocaleString();
        },
        navigateTo(route) {
            Router.navigate(route);
        }
    }
};

window.LeaderboardPage = LeaderboardPage;
