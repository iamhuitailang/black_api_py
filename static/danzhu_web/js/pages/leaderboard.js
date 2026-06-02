const LeaderboardPage = {
    template: `
        <div class="leaderboard-page">
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">🏆 排行榜</h2>
                    <div class="tabs" style="width: auto; margin-bottom: 0;">
                        <button :class="['tab', {active: tab === 'score'}]" @click="switchTab('score')">
                            总分数
                        </button>
                        <button :class="['tab', {active: tab === 'combo'}]" @click="switchTab('combo')">
                            连击数
                        </button>
                    </div>
                </div>

                <div class="leaderboard">
                    <div class="leaderboard-header">
                        <h3 class="leaderboard-title">
                            {{ tab === 'score' ? '🎯 最高分数排行' : '🔥 最大连击排行' }}
                        </h3>
                    </div>
                    <div class="leaderboard-list">
                        <div v-for="(player, index) in leaderboard" :key="player.id"
                             class="leaderboard-item">
                            <div :class="['leaderboard-rank', 'rank-' + (index + 1)]" v-if="index < 3">
                                {{ index + 1 }}
                            </div>
                            <div class="leaderboard-rank" v-else>
                                {{ index + 1 }}
                            </div>
                            <div class="leaderboard-avatar">
                                {{ player.nickname?.charAt(0) || player.username?.charAt(0) || 'P' }}
                            </div>
                            <div class="leaderboard-info">
                                <div class="leaderboard-name">
                                    {{ player.nickname || player.username }}
                                </div>
                                <div class="leaderboard-desc">
                                    游戏 {{ player.games_played || 0 }} 局
                                </div>
                            </div>
                            <div class="leaderboard-score">
                                {{ (tab === 'score' ? player.highest_score : player.combo_max)?.toLocaleString() || 0 }}
                            </div>
                        </div>
                        <div v-if="leaderboard.length === 0" class="empty-state">
                            <div class="empty-icon">🏆</div>
                            <div class="empty-text">暂无排行数据</div>
                        </div>
                    </div>
                </div>

                <div class="pagination" v-if="totalPages > 1">
                    <button class="pagination-btn" :disabled="page === 1" @click="prevPage">
                        上一页
                    </button>
                    <span v-for="p in totalPages" :key="p"
                          :class="['pagination-btn', {active: p === page}]"
                          @click="goToPage(p)">
                        {{ p }}
                    </span>
                    <button class="pagination-btn" :disabled="page === totalPages" @click="nextPage">
                        下一页
                    </button>
                </div>
            </div>

            <div class="card" style="margin-top: 24px;" v-if="currentUser">
                <div class="card-header">
                    <h3 class="card-title">📊 我的排名</h3>
                </div>
                <div class="leaderboard-item" style="background: var(--bg-card-hover); border-radius: 12px;">
                    <div class="leaderboard-rank" style="background: var(--gradient-primary);">
                        {{ myRank }}
                    </div>
                    <div class="leaderboard-avatar">
                        {{ currentUser.nickname?.charAt(0) || currentUser.username?.charAt(0) || 'P' }}
                    </div>
                    <div class="leaderboard-info">
                        <div class="leaderboard-name">
                            {{ currentUser.nickname || currentUser.username }}
                        </div>
                    </div>
                    <div class="leaderboard-score">
                        {{ (tab === 'score' ? currentUser.highest_score : currentUser.combo_max)?.toLocaleString() || 0 }}
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            tab: 'score',
            leaderboard: [],
            page: 1,
            pageSize: 10,
            total: 0,
            myRank: 0,
            currentUser: null
        };
    },
    computed: {
        totalPages() {
            return Math.ceil(this.total / this.pageSize);
        }
    },
    async mounted() {
        this.currentUser = Auth.getUser();
        await this.loadLeaderboard();
        if (this.currentUser) {
            await this.loadMyRank();
        }
    },
    methods: {
        switchTab(tab) {
            this.tab = tab;
            this.page = 1;
            this.loadLeaderboard();
        },
        async loadLeaderboard() {
            try {
                const result = await API.score.getTop({
                    page: this.page,
                    page_size: this.pageSize
                });

                if (result.code === 0 && result.data) {
                    this.leaderboard = result.data.items || [];
                    this.total = result.data.total || 0;

                    if (this.tab === 'combo') {
                        this.leaderboard.sort((a, b) => (b.combo_max || 0) - (a.combo_max || 0));
                    }
                }
            } catch (e) {
                console.error(e);
            }
        },
        async loadMyRank() {
            try {
                const result = await API.score.getRank();
                if (result.code === 0 && result.data) {
                    this.myRank = result.data.rank || 0;
                }
            } catch (e) {
                console.error(e);
            }
        },
        prevPage() {
            if (this.page > 1) {
                this.page--;
                this.loadLeaderboard();
            }
        },
        nextPage() {
            if (this.page < this.totalPages) {
                this.page++;
                this.loadLeaderboard();
            }
        },
        goToPage(p) {
            this.page = p;
            this.loadLeaderboard();
        }
    }
};
