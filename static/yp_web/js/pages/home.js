const HomePage = {
    data() {
        return {
            user: null,
            stats: null,
            recentScores: [],
            expProgress: 0
        };
    },
    template: `
        <div class="main-layout">
            <header class="header">
                <div class="header-left">
                    <div class="header-logo">🎵 YP</div>
                    <div class="exp-bar" v-if="user">
                        <div class="exp-text">
                            <span>Lv.{{ user.level }}</span>
                            <span>{{ user.exp }} / {{ levelExp }}</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" :style="{ width: expProgress + '%' }"></div>
                        </div>
                    </div>
                </div>
                <div class="user-info">
                    <div class="user-coins">💰 {{ user ? user.coins : 0 }}</div>
                    <div class="user-avatar">{{ user ? user.nickname.charAt(0).toUpperCase() : 'U' }}</div>
                </div>
            </header>

            <div class="content">
                <h1 class="page-title">欢迎回来，{{ user ? user.nickname : '玩家' }}</h1>

                <div class="grid grid-4" style="margin-bottom: 24px;">
                    <div class="card stats-card">
                        <div class="stats-value">{{ stats ? Utils.formatNumber(stats.total_score) : 0 }}</div>
                        <div class="stats-label">总分数</div>
                    </div>
                    <div class="card stats-card">
                        <div class="stats-value">{{ stats ? Utils.formatNumber(stats.highest_score) : 0 }}</div>
                        <div class="stats-label">最高纪录</div>
                    </div>
                    <div class="card stats-card">
                        <div class="stats-value">{{ stats ? stats.games_played : 0 }}</div>
                        <div class="stats-label">游戏次数</div>
                    </div>
                    <div class="card stats-card">
                        <div class="stats-value">{{ stats ? stats.total_combo : 0 }}</div>
                        <div class="stats-label">最大连击</div>
                    </div>
                </div>

                <div class="card" style="margin-bottom: 24px; cursor: pointer;" @click="startGame">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div>
                            <h2 style="font-size: 24px; margin-bottom: 8px;">🚀 开始游戏</h2>
                            <p style="color: var(--text-secondary);">选择音乐，跟随节奏开始你的跑酷之旅</p>
                        </div>
                        <button class="btn btn-primary" style="font-size: 18px; padding: 18px 36px;">
                            开始
                        </button>
                    </div>
                </div>

                <div class="grid grid-2" style="margin-bottom: 24px;">
                    <div class="card" @click="goToMusic" style="cursor: pointer;">
                        <h3 style="font-size: 18px; margin-bottom: 8px;">🎵 音乐选择</h3>
                        <p style="color: var(--text-secondary); font-size: 14px;">浏览和选择不同的音乐曲目</p>
                    </div>
                    <div class="card" @click="goToCharacter" style="cursor: pointer;">
                        <h3 style="font-size: 18px; margin-bottom: 8px;">👤 角色商店</h3>
                        <p style="color: var(--text-secondary); font-size: 14px;">解锁和切换不同的游戏角色</p>
                    </div>
                    <div class="card" @click="goToSkill" style="cursor: pointer;">
                        <h3 style="font-size: 18px; margin-bottom: 8px;">⚡ 技能树</h3>
                        <p style="color: var(--text-secondary); font-size: 14px;">升级技能，提升游戏能力</p>
                    </div>
                    <div class="card" @click="goToLeaderboard" style="cursor: pointer;">
                        <h3 style="font-size: 18px; margin-bottom: 8px;">🏆 排行榜</h3>
                        <p style="color: var(--text-secondary); font-size: 14px;">查看好友和全球玩家排名</p>
                    </div>
                </div>

                <h2 class="section-title">最近记录</h2>
                <div class="card">
                    <div v-if="recentScores.length === 0" class="empty-state">
                        <div class="empty-icon">📝</div>
                        <div class="empty-text">暂无游戏记录</div>
                    </div>
                    <div v-else>
                        <div 
                            v-for="score in recentScores" 
                            :key="score.id"
                            class="leaderboard-item"
                        >
                            <div class="leaderboard-rank rank-other">#</div>
                            <div class="leaderboard-user">
                                <div class="leaderboard-name">{{ score.music_name || '未知音乐' }}</div>
                                <div class="leaderboard-level">{{ Utils.formatDate(score.created_at) }}</div>
                            </div>
                            <div class="leaderboard-score">
                                <div class="leaderboard-score-value">{{ Utils.formatNumber(score.score) }}</div>
                                <div style="font-size: 12px; color: var(--text-secondary);">
                                    连击 {{ score.max_combo }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <nav class="nav-bar">
                <div class="nav-item active" @click="goToHome">
                    <div class="nav-icon">🏠</div>
                    <div class="nav-label">首页</div>
                </div>
                <div class="nav-item" @click="goToMusic">
                    <div class="nav-icon">🎵</div>
                    <div class="nav-label">音乐</div>
                </div>
                <div class="nav-item" @click="startGame">
                    <div class="nav-icon">🎮</div>
                    <div class="nav-label">游戏</div>
                </div>
                <div class="nav-item" @click="goToLeaderboard">
                    <div class="nav-icon">🏆</div>
                    <div class="nav-label">排行</div>
                </div>
                <div class="nav-item" @click="goToSettings">
                    <div class="nav-icon">⚙️</div>
                    <div class="nav-label">设置</div>
                </div>
            </nav>
        </div>
    `,
    computed: {
        levelExp() {
            if (!this.user) return 0;
            return Utils.getLevelExp(this.user.level);
        }
    },
    methods: {
        async loadData() {
            this.user = Auth.getUser();
            if (this.user) {
                this.expProgress = Utils.calculateExpProgress(this.user.exp, this.user.level);
            }

            const [statsRes, scoresRes] = await Promise.all([
                YpAPI.user.profile(),
                YpAPI.score.my({ page: 1, page_size: 5 })
            ]);

            if (statsRes.code === 0 && statsRes.data) {
                this.stats = statsRes.data.stats;
                this.user = statsRes.data;
                Auth.setUser(statsRes.data);
                this.expProgress = Utils.calculateExpProgress(this.user.exp, this.user.level);
            }

            if (scoresRes.code === 0 && scoresRes.data) {
                this.recentScores = scoresRes.data.items || [];
            }
        },
        startGame() {
            Router.navigate('music');
        },
        goToHome() {},
        goToMusic() {
            Router.navigate('music');
        },
        goToCharacter() {
            Router.navigate('character');
        },
        goToSkill() {
            Router.navigate('skill');
        },
        goToLeaderboard() {
            Router.navigate('leaderboard');
        },
        goToSettings() {
            Router.navigate('settings');
        }
    },
    mounted() {
        this.loadData();
    }
};
