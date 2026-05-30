
const LeaderboardView = Vue.defineComponent({
    name: 'LeaderboardView',
    setup() {
        const router = window.ChouchouRouter;
        
        const activeTab = Vue.ref('total_score');
        const leaderboardData = Vue.ref([]);
        const loading = Vue.ref(false);
        const myRank = Vue.ref(null);

        const tabs = [
            { id: 'total_score', name: '🏆 总排行', desc: '历史累计积分' },
            { id: 'single_game', name: '🎯 单局最高', desc: '单局最高得分' },
            { id: 'win_streak', name: '� 连胜排行', desc: '连胜场次排行' },
            { id: 'games_won', name: '👑 胜场排行', desc: '获胜场次排行' }
        ];

        const loadLeaderboard = async () => {
            loading.value = true;
            try {
                const [listData, personalData] = await Promise.all([
                    API.highScore.list(activeTab.value, 1, 50),
                    API.highScore.personal()
                ]);
                
                if (listData) {
                    leaderboardData.value = Array.isArray(listData) ? listData : (listData.items || []);
                }
                if (personalData) {
                    myRank.value = personalData.rank;
                }
            } finally {
                loading.value = false;
            }
        };

        const getRankClass = (index) => {
            if (index === 0) return 'rank-1';
            if (index === 1) return 'rank-2';
            if (index === 2) return 'rank-3';
            return 'rank-other';
        };

        const getMedalEmoji = (index) => {
            if (index === 0) return '🥇';
            if (index === 1) return '🥈';
            if (index === 2) return '🥉';
            return `${index + 1}`;
        };

        Vue.onMounted(() => {
            loadLeaderboard();
        });

        return {
            Store,
            Utils,
            activeTab,
            leaderboardData,
            loading,
            myRank,
            tabs,
            loadLeaderboard,
            getRankClass,
            getMedalEmoji
        };
    },
    template: `
        <div>
            <header class="header">
                <h1>🎪 国王游戏 - 排行榜</h1>
                <nav>
                    <router-link to="/lobby">游戏大厅</router-link>
                    <router-link to="/leaderboard">排行榜</router-link>
                    <router-link to="/profile">个人中心</router-link>
                    <router-link to="/settings">设置</router-link>
                    <button @click="Store.logout()">退出</button>
                    <ThemeSwitcher />
                </nav>
            </header>

            <div class="container">
                <div v-if="myRank" class="card" style="margin-bottom: 24px; background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); color: white;">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                        <div>
                            <h3 style="color: white; margin-bottom: 8px;">🎯 我的排名</h3>
                            <p style="opacity: 0.9;">当前在{{ tabs.find(t => t.id === activeTab)?.name }}中的排名</p>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 48px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);">
                                #{{ myRank.rank || '-' }}
                            </div>
                            <div style="opacity: 0.9;">
                                积分: {{ myRank.total_score || 0 }}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="tabs">
                    <button 
                        v-for="tab in tabs" 
                        :key="tab.id"
                        :class="['tab-btn', { active: activeTab === tab.id }]"
                        :title="tab.desc"
                        @click="activeTab = tab.id; loadLeaderboard();"
                    >
                        {{ tab.name }}
                    </button>
                </div>

                <div v-if="loading" class="loading">
                    <div class="spinner"></div>
                </div>

                <div v-else-if="leaderboardData.length === 0" class="empty-state">
                    <div class="empty-state-icon">🏆</div>
                    <div class="empty-state-text">暂无排行数据</div>
                    <p style="margin-bottom: 16px; color: var(--text-light);">快去玩游戏，争取上榜吧！</p>
                    <router-link to="/lobby" class="btn btn-primary">
                        🎮 去玩游戏
                    </router-link>
                </div>

                <div v-else class="leaderboard">
                    <div class="leaderboard-header">
                        {{ tabs.find(t => t.id === activeTab)?.name }}
                    </div>
                    <div 
                        v-for="(player, index) in leaderboardData" 
                        :key="player.user_id || player.id"
                        class="leaderboard-row"
                        :style="{ background: player.user_id === Store.user?.id ? 'rgba(var(--primary-color-rgb), 0.05)' : '' }"
                    >
                        <div :class="['rank', getRankClass(index)]">
                            <template v-if="index < 3">
                                <span style="font-size: 24px;">{{ getMedalEmoji(index) }}</span>
                            </template>
                            <template v-else>
                                {{ index + 1 }}
                            </template>
                        </div>
                        <div>
                            <div style="font-weight: bold; font-size: 16px;">
                                {{ player.nickname || player.username }}
                                <span v-if="player.user_id === Store.user?.id" class="badge badge-info" style="margin-left: 8px;">
                                    我
                                </span>
                            </div>
                            <div style="font-size: 12px; color: var(--text-light);">
                                @{{ player.username }}
                            </div>
                        </div>
                        <div>
                            <span v-if="player.role" :class="['badge', 'badge-' + player.role]">
                                {{ Utils.getRoleEmoji(player.role) }} {{ Utils.getRoleName(player.role) }}
                            </span>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: bold; font-size: 24px; color: var(--primary-color);">
                                {{ player.score || player.total_score || 0 }}
                            </div>
                            <div style="font-size: 12px; color: var(--text-light);">
                                {{ player.games_played || 0 }} 场游戏
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="leaderboardData.length > 0" style="text-align: center; margin-top: 24px;">
                    <button class="btn btn-outline" @click="loadLeaderboard" :disabled="loading">
                        🔄 刷新排行榜
                    </button>
                </div>
            </div>
        </div>
    `
});

window.LeaderboardView = LeaderboardView;
