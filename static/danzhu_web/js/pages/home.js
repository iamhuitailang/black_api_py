const HomePage = {
    template: `
        <div class="home-page">
            <div class="hero">
                <h1 class="hero-title">🎱 经典弹珠台</h1>
                <p class="hero-subtitle">重温童年经典，挑战最高分！</p>
                <div class="hero-actions">
                    <button class="btn btn-primary btn-lg" @click="goToGame">
                        <span>🎮</span> 开始游戏
                    </button>
                    <button class="btn btn-outline btn-lg" @click="goToLeaderboard">
                        <span>🏆</span> 排行榜
                    </button>
                </div>
            </div>

            <div class="features">
                <div class="feature-card">
                    <div class="feature-icon">🎯</div>
                    <div class="feature-title">经典玩法</div>
                    <div class="feature-desc">还原经典弹珠台游戏体验</div>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">⚡</div>
                    <div class="feature-title">多种机关</div>
                    <div class="feature-desc">弹射器、靶心、旋转器等</div>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🔥</div>
                    <div class="feature-title">连击系统</div>
                    <div class="feature-desc">连续命中获得额外分数</div>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🏆</div>
                    <div class="feature-title">成就挑战</div>
                    <div class="feature-desc">解锁各种成就获得奖励</div>
                </div>
            </div>

            <div class="card" style="margin-top: 40px;">
                <div class="card-header">
                    <h2 class="card-title">🏆 今日顶尖玩家</h2>
                </div>
                <div class="leaderboard-list">
                    <div v-for="(player, index) in topPlayers" :key="player.id" 
                         class="leaderboard-item">
                        <div :class="['leaderboard-rank', 'rank-' + (index + 1)]">
                            {{ index + 1 }}
                        </div>
                        <div class="leaderboard-avatar">
                            {{ player.nickname?.charAt(0) || 'P' }}
                        </div>
                        <div class="leaderboard-info">
                            <div class="leaderboard-name">{{ player.nickname || player.username }}</div>
                            <div class="leaderboard-stats">
                                最高分: {{ player.highest_score?.toLocaleString() || 0 }}
                            </div>
                        </div>
                        <div class="leaderboard-score">
                            {{ player.highest_score?.toLocaleString() || 0 }}
                        </div>
                    </div>
                    <div v-if="topPlayers.length === 0" class="empty-state">
                        <div class="empty-icon">🏆</div>
                        <div class="empty-text">暂无数据</div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            topPlayers: []
        };
    },
    async mounted() {
        await this.loadTopPlayers();
    },
    methods: {
        async loadTopPlayers() {
            try {
                const result = await API.statistics.getTopPlayers(5);
                if (result.code === 0 && result.data) {
                    this.topPlayers = result.data;
                }
            } catch (e) {
                console.error(e);
            }
        },
        goToGame() {
            if (Auth.isLoggedIn()) {
                Router.navigate('/game');
            } else {
                Router.navigate('/login');
            }
        },
        goToLeaderboard() {
            Router.navigate('/leaderboard');
        }
    }
};
