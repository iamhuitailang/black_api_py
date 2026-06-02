const ProfilePage = {
    template: `
        <div class="profile-page">
            <div class="profile-header">
                <div class="profile-avatar">
                    {{ user?.nickname?.charAt(0) || user?.username?.charAt(0) || 'P' }}
                </div>
                <div class="profile-info">
                    <h1 class="profile-name">{{ user?.nickname || user?.username }}</h1>
                    <p style="color: var(--text-secondary);">@{{ user?.username }}</p>
                    <div class="profile-stats">
                        <div class="profile-stat-item">
                            <div class="profile-stat-value">{{ user?.games_played || 0 }}</div>
                            <div class="profile-stat-label">游戏次数</div>
                        </div>
                        <div class="profile-stat-item">
                            <div class="profile-stat-value">{{ (user?.highest_score || 0).toLocaleString() }}</div>
                            <div class="profile-stat-label">最高得分</div>
                        </div>
                        <div class="profile-stat-item">
                            <div class="profile-stat-value">{{ (user?.total_score || 0).toLocaleString() }}</div>
                            <div class="profile-stat-label">总得分</div>
                        </div>
                        <div class="profile-stat-item">
                            <div class="profile-stat-value">{{ user?.combo_max || 0 }}</div>
                            <div class="profile-stat-label">最大连击</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="tabs">
                <button :class="['tab', {active: tab === 'history'}]" @click="tab = 'history'">
                    游戏历史
                </button>
                <button :class="['tab', {active: tab === 'achievements'}]" @click="tab = 'achievements'">
                    我的成就
                </button>
            </div>

            <div v-if="tab === 'history'" class="card">
                <div class="card-header">
                    <h3 class="card-title">📜 游戏历史</h3>
                </div>
                <div class="data-table">
                    <table>
                        <thead>
                            <tr>
                                <th>时间</th>
                                <th>得分</th>
                                <th>最大连击</th>
                                <th>碰撞次数</th>
                                <th>游戏时长</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="record in gameHistory" :key="record.id">
                                <td>{{ formatDate(record.created_at) }}</td>
                                <td style="color: var(--primary-color); font-weight: 600;">
                                    {{ (record.score || 0).toLocaleString() }}
                                </td>
                                <td>{{ record.combo_max || 0 }}</td>
                                <td>{{ record.hit_count || 0 }}</td>
                                <td>{{ formatTime(record.play_duration) }}</td>
                            </tr>
                            <tr v-if="gameHistory.length === 0">
                                <td colspan="5">
                                    <div class="empty-state" style="padding: 40px;">
                                        <div class="empty-icon">📜</div>
                                        <div class="empty-text">暂无游戏记录</div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
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

            <div v-if="tab === 'achievements'" class="achievements-grid">
                <div v-for="achievement in myAchievements" :key="achievement.id"
                     :class="['achievement-card', {unlocked: achievement.unlocked}]">
                    <div class="achievement-badge" :class="achievement.unlocked ? 'badge-unlocked' : 'badge-locked'">
                        {{ achievement.unlocked ? '✓' : '🔒' }}
                    </div>
                    <div class="achievement-icon">
                        {{ getAchievementIcon(achievement.type) }}
                    </div>
                    <div class="achievement-name">{{ achievement.name }}</div>
                    <div class="achievement-desc">{{ achievement.description }}</div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            user: null,
            tab: 'history',
            gameHistory: [],
            myAchievements: [],
            page: 1,
            pageSize: 10,
            total: 0
        };
    },
    computed: {
        totalPages() {
            return Math.ceil(this.total / this.pageSize);
        }
    },
    async mounted() {
        this.user = Auth.getUser();
        if (!this.user) {
            Router.navigate('/login');
            return;
        }
        await this.loadGameHistory();
        await this.loadMyAchievements();
    },
    methods: {
        async loadGameHistory() {
            try {
                const result = await API.game.getHistory({
                    page: this.page,
                    page_size: this.pageSize
                });
                if (result.code === 0 && result.data) {
                    this.gameHistory = result.data.items || [];
                    this.total = result.data.total || 0;
                }
            } catch (e) {
                console.error(e);
            }
        },
        async loadMyAchievements() {
            try {
                const result = await API.achievement.getUser();
                if (result.code === 0 && result.data) {
                    this.myAchievements = (result.data.items || []).filter(a => a.unlocked);
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
            return date.toLocaleString('zh-CN');
        },
        formatTime(seconds) {
            if (!seconds) return '0:00';
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        },
        prevPage() {
            if (this.page > 1) {
                this.page--;
                this.loadGameHistory();
            }
        },
        nextPage() {
            if (this.page < this.totalPages) {
                this.page++;
                this.loadGameHistory();
            }
        },
        goToPage(p) {
            this.page = p;
            this.loadGameHistory();
        }
    }
};
