const LeaderboardPage = {
    data() {
        return {
            user: null,
            activeTab: 'global',
            globalLeaderboard: [],
            friendsLeaderboard: [],
            loading: false,
            myRank: null
        };
    },
    template: `
        <div class="main-layout">
            <header class="header">
                <div class="header-left">
                    <div class="header-logo">🏆 排行榜</div>
                </div>
                <div class="user-info">
                    <div class="user-coins">💰 {{ user ? user.coins : 0 }}</div>
                    <div class="user-avatar">{{ user ? user.nickname.charAt(0).toUpperCase() : 'U' }}</div>
                </div>
            </header>

            <div class="content">
                <h1 class="page-title">排行榜</h1>

                <div class="tabs">
                    <div 
                        class="tab" 
                        :class="{ active: activeTab === 'global' }"
                        @click="activeTab = 'global'"
                    >
                        全球排行
                    </div>
                    <div 
                        class="tab" 
                        :class="{ active: activeTab === 'friends' }"
                        @click="activeTab = 'friends'"
                    >
                        好友排行
                    </div>
                    <div 
                        class="tab" 
                        :class="{ active: activeTab === 'music' }"
                        @click="activeTab = 'music'"
                    >
                        单曲排行
                    </div>
                </div>

                <div v-if="loading" class="empty-state">
                    <div class="empty-icon">⏳</div>
                    <div class="empty-text">加载中...</div>
                </div>
                <div v-else-if="currentList.length === 0" class="empty-state">
                    <div class="empty-icon">🏆</div>
                    <div class="empty-text">暂无排行数据</div>
                </div>
                <div v-else class="card">
                    <div 
                        v-for="(player, index) in currentList" 
                        :key="player.id || player.user_id"
                        class="leaderboard-item"
                    >
                        <div 
                            class="leaderboard-rank"
                            :class="[
                                index === 0 ? 'rank-1' : 
                                index === 1 ? 'rank-2' : 
                                index === 2 ? 'rank-3' : 'rank-other'
                            ]"
                        >
                            {{ index + 1 }}
                        </div>
                        <div class="leaderboard-user">
                            <div class="leaderboard-name">
                                {{ player.nickname || player.username || '匿名玩家' }}
                            </div>
                            <div class="leaderboard-level">
                                Lv.{{ player.level || 1 }} 
                                <span v-if="player.music_name" style="margin-left: 8px;">
                                    🎵 {{ player.music_name }}
                                </span>
                            </div>
                        </div>
                        <div class="leaderboard-score">
                            <div class="leaderboard-score-value">
                                {{ Utils.formatNumber(player.score || player.highest_score || 0) }}
                            </div>
                            <div style="font-size: 12px; color: var(--text-secondary);">
                                连击 {{ player.max_combo || 0 }}
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="myRank" class="card" style="margin-top: 16px;">
                    <div class="leaderboard-item" style="background: rgba(99, 102, 241, 0.1);">
                        <div class="leaderboard-rank rank-other">
                            #{{ myRank.rank }}
                        </div>
                        <div class="leaderboard-user">
                            <div class="leaderboard-name">
                                {{ user ? user.nickname : '我' }}
                            </div>
                            <div class="leaderboard-level">
                                Lv.{{ user ? user.level : 1 }}
                            </div>
                        </div>
                        <div class="leaderboard-score">
                            <div class="leaderboard-score-value">
                                {{ Utils.formatNumber(myRank.score || 0) }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <nav class="nav-bar">
                <div class="nav-item" @click="goToHome">
                    <div class="nav-icon">🏠</div>
                    <div class="nav-label">首页</div>
                </div>
                <div class="nav-item" @click="goToMusic">
                    <div class="nav-icon">🎵</div>
                    <div class="nav-label">音乐</div>
                </div>
                <div class="nav-item" @click="goToGame">
                    <div class="nav-icon">🎮</div>
                    <div class="nav-label">游戏</div>
                </div>
                <div class="nav-item active" @click="goToLeaderboard">
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
        currentList() {
            if (this.activeTab === 'global' || this.activeTab === 'friends') {
                return this.globalLeaderboard;
            }
            return this.globalLeaderboard;
        }
    },
    methods: {
        async loadData() {
            this.user = Auth.getUser();
            this.loading = true;

            const globalRes = await YpAPI.user.leaderboard({ page: 1, page_size: 20 });
            const scoreRes = await YpAPI.score.leaderboard({ page: 1, page_size: 20 });

            this.loading = false;

            if (globalRes.code === 0 && globalRes.data) {
                this.globalLeaderboard = globalRes.data.items || globalRes.data || [];
                if (globalRes.data.my_rank) {
                    this.myRank = globalRes.data.my_rank;
                }
            }

            if (scoreRes.code === 0 && scoreRes.data) {
                this.friendsLeaderboard = scoreRes.data.items || scoreRes.data || [];
            }
        },
        goToHome() {
            Router.navigate('home');
        },
        goToMusic() {
            Router.navigate('music');
        },
        goToGame() {
            Router.navigate('game');
        },
        goToLeaderboard() {},
        goToSettings() {
            Router.navigate('settings');
        }
    },
    mounted() {
        this.loadData();
    }
};
