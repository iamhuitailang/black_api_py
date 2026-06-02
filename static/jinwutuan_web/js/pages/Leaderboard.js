const LeaderboardPage = {
    template: `
        <div class="leaderboard-container">
            <div class="page-header">
                <h1 class="page-title">排行榜</h1>
                <p class="page-subtitle">查看全球玩家排名</p>
            </div>
            
            <div class="leaderboard-tabs">
                <button 
                    v-for="tab in tabs" 
                    :key="tab.id"
                    class="leaderboard-tab"
                    :class="{ active: currentTab === tab.id }"
                    @click="currentTab = tab.id"
                >
                    {{ tab.name }}
                </button>
            </div>
            
            <div v-if="loading" class="loading">
                <div class="loading-spinner"></div>
            </div>
            
            <div v-else class="leaderboard-list">
                <div 
                    v-for="(entry, index) in leaderboardData" 
                    :key="entry.id || index"
                    class="leaderboard-item"
                    :class="{ 'current-user': entry.isCurrentUser }"
                >
                    <div class="leaderboard-rank" :class="getRankClass(index + 1)">
                        {{ index + 1 }}
                    </div>
                    <div style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, var(--neon-purple), var(--neon-pink)); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px;">
                        {{ entry.avatar }}
                    </div>
                    <div class="leaderboard-user">
                        <div class="leaderboard-nickname">
                            {{ entry.nickname }}
                            <span v-if="entry.isCurrentUser" style="color: var(--neon-yellow); font-size: 12px;"> (你)</span>
                        </div>
                        <div class="leaderboard-username">Lv.{{ entry.level }}</div>
                    </div>
                    <div class="leaderboard-score">
                        <div class="leaderboard-score-value">{{ formatValue(entry.value) }}</div>
                        <div class="leaderboard-score-label">{{ currentTabLabel }}</div>
                    </div>
                </div>
            </div>
            
            <div v-if="!loading && leaderboardData.length === 0" class="empty-state">
                <div class="empty-state-icon">🏆</div>
                <div class="empty-state-text">暂无排行数据</div>
            </div>
        </div>
    `,
    props: {
        user: {
            type: Object,
            default: () => ({})
        }
    },
    emits: ['navigate'],
    setup(props) {
        const { ref, computed, onMounted, watch } = Vue;
        
        const currentTab = ref('total_score');
        const loading = ref(true);
        const leaderboardData = ref([]);
        
        const tabs = [
            { id: 'total_score', name: '总分榜', label: '总分' },
            { id: 'max_combo', name: '连击榜', label: '最大连击' },
            { id: 'total_games', name: '场次榜', label: '游戏场次' }
        ];
        
        const currentTabLabel = computed(() => {
            const tab = tabs.find(t => t.id === currentTab.value);
            return tab?.label || '分数';
        });
        
        const getRankClass = (rank) => {
            if (rank === 1) return 'rank-1';
            if (rank === 2) return 'rank-2';
            if (rank === 3) return 'rank-3';
            return 'other';
        };
        
        const formatValue = (value) => {
            return value.toLocaleString();
        };
        
        const generateDemoData = () => {
            const names = ['音乐达人', '节奏大师', '钢琴王子', '吉他英雄', '鼓神', '小提琴手', '贝斯手', '键盘手', '摇滚青年', '古典爱好者', '电子先锋', '动漫迷', '游戏玩家', '流行歌手', '民谣诗人'];
            const data = [];
            
            for (let i = 0; i < 15; i++) {
                let value;
                switch (currentTab.value) {
                    case 'total_score':
                        value = Math.floor(1000000 / (i + 1) + Math.random() * 50000);
                        break;
                    case 'max_combo':
                        value = Math.floor(1000 / (i + 1) + Math.random() * 100);
                        break;
                    case 'total_games':
                        value = Math.floor(500 / (i + 1) + Math.random() * 50);
                        break;
                    default:
                        value = 0;
                }
                
                data.push({
                    id: i + 1,
                    nickname: names[i % names.length],
                    level: Math.floor(Math.random() * 50) + 10,
                    avatar: names[i % names.length].charAt(0),
                    value: value,
                    isCurrentUser: props.user && i === 5
                });
            }
            
            if (props.user) {
                const userEntry = data.find(d => d.isCurrentUser);
                if (userEntry) {
                    userEntry.nickname = props.user.nickname || props.user.username;
                    userEntry.level = props.user.level || 1;
                    userEntry.avatar = (props.user.nickname || props.user.username || 'U').charAt(0).toUpperCase();
                }
            }
            
            return data;
        };
        
        const loadLeaderboard = async () => {
            loading.value = true;
            try {
                const result = await ApiService.get('/jinwutuan/stats/leaderboard/get', { sort_by: currentTab.value });
                if (result && result.code === 0 && result.data && result.data.items && result.data.items.length > 0) {
                    leaderboardData.value = result.data.items.map((entry, i) => ({
                        ...entry,
                        avatar: (entry.nickname || entry.username || 'U').charAt(0).toUpperCase(),
                        value: entry[currentTab.value] || entry.total_score || 0,
                        isCurrentUser: entry.id === props.user?.id
                    }));
                } else {
                    leaderboardData.value = generateDemoData();
                }
            } catch (e) {
                leaderboardData.value = generateDemoData();
            } finally {
                loading.value = false;
            }
        };
        
        watch(currentTab, () => {
            loadLeaderboard();
        });
        
        onMounted(() => {
            loadLeaderboard();
        });
        
        return {
            currentTab,
            tabs,
            loading,
            leaderboardData,
            currentTabLabel,
            getRankClass,
            formatValue
        };
    }
};
