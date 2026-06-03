(function() {
const { ref, computed, onMounted, reactive } = Vue;

const BattlePage = {
    name: 'BattlePage',
    setup() {
        const loading = ref(true);
        const selectedMode = ref('match');
        const isMatching = ref(false);
        const matchProgress = ref(0);
        const showBattleResult = ref(false);

        const user = computed(() => GameStore.state.user);
        const level = computed(() => GameStore.getters.level.value);
        const coins = computed(() => GameStore.getters.coins.value);
        const recentBattles = computed(() => GameStore.getters.recentBattles.value);

        const battleModes = [
            { id: 'ranked', name: '排位赛', icon: '🏆', description: '竞技排位，提升段位', color: '#ff6b35' },
            { id: 'match', name: '匹配赛', icon: '⚔️', description: '休闲匹配，轻松对战', color: '#4ecdc4' },
            { id: 'training', name: '训练模式', icon: '🎯', description: '练习技能，提升实力', color: '#a8e6cf' }
        ];

        const battleResult = reactive({
            win: true,
            opponent: null,
            rewards: { exp: 50, gold: 100 }
        });

        const onlinePlayers = ref([
            { id: 1, name: '火影忍者', level: 15, avatar: '火', winRate: 65, online: true },
            { id: 2, name: '宇智波佐助', level: 12, avatar: '佐', winRate: 58, online: true },
            { id: 3, name: '漩涡鸣人', level: 14, avatar: '鸣', winRate: 72, online: true },
            { id: 4, name: '春野樱', level: 10, avatar: '樱', winRate: 45, online: true },
            { id: 5, name: '旗木卡卡西', level: 18, avatar: '卡', winRate: 80, online: true },
            { id: 6, name: '奈良鹿丸', level: 11, avatar: '鹿', winRate: 55, online: false },
            { id: 7, name: '日向雏田', level: 9, avatar: '雏', winRate: 48, online: true },
            { id: 8, name: '秋道丁次', level: 8, avatar: '丁', winRate: 40, online: true }
        ]);

        const battleRecords = ref([
            { id: 1, opponent: '宇智波佐助', result: 'win', time: '10分钟前', mode: '排位赛', rewards: { exp: 80, gold: 150 } },
            { id: 2, opponent: '漩涡鸣人', result: 'lose', time: '30分钟前', mode: '匹配赛', rewards: { exp: 20, gold: 30 } },
            { id: 3, opponent: '旗木卡卡西', result: 'lose', time: '1小时前', mode: '排位赛', rewards: { exp: 25, gold: 40 } },
            { id: 4, opponent: '春野樱', result: 'win', time: '2小时前', mode: '训练模式', rewards: { exp: 40, gold: 80 } },
            { id: 5, opponent: '奈良鹿丸', result: 'win', time: '3小时前', mode: '匹配赛', rewards: { exp: 60, gold: 120 } }
        ]);

        const battleStats = reactive({
            totalBattles: 128,
            wins: 72,
            winRate: 56.25,
            totalTime: '42小时'
        });

        const leaderboard = ref([
            { rank: 1, name: '旗木卡卡西', level: 18, avatar: '卡', winRate: 80, battles: 256 },
            { rank: 2, name: '漩涡鸣人', level: 14, avatar: '鸣', winRate: 72, battles: 189 },
            { rank: 3, name: '火影忍者', level: 15, avatar: '火', winRate: 65, battles: 203 },
            { rank: 4, name: '宇智波佐助', level: 12, avatar: '佐', winRate: 58, battles: 167 },
            { rank: 5, name: '奈良鹿丸', level: 11, avatar: '鹿', winRate: 55, battles: 145 },
            { rank: 6, name: '日向雏田', level: 9, avatar: '雏', winRate: 48, battles: 98 },
            { rank: 7, name: '春野樱', level: 10, avatar: '樱', winRate: 45, battles: 112 },
            { rank: 8, name: '秋道丁次', level: 8, avatar: '丁', winRate: 40, battles: 76 }
        ]);

        const currentUser = computed(() => {
            return user.value || { nickname: '忍者', username: 'ninja' };
        });

        const userRank = computed(() => {
            const name = currentUser.value.nickname || currentUser.value.username;
            const rank = leaderboard.value.findIndex(p => p.name === name);
            return rank > -1 ? rank + 1 : '-';
        });

        const selectMode = (modeId) => {
            selectedMode.value = modeId;
        };

        const startQuickMatch = () => {
            if (isMatching.value) return;
            
            isMatching.value = true;
            matchProgress.value = 0;
            
            const interval = setInterval(() => {
                matchProgress.value += Math.random() * 15;
                if (matchProgress.value >= 100) {
                    clearInterval(interval);
                    matchProgress.value = 100;
                    setTimeout(() => {
                        isMatching.value = false;
                        simulateBattle();
                    }, 500);
                }
            }, 300);
        };

        const cancelMatch = () => {
            isMatching.value = false;
            matchProgress.value = 0;
        };

        const simulateBattle = () => {
            const availableOpponents = onlinePlayers.value.filter(p => p.online);
            const opponent = availableOpponents[Math.floor(Math.random() * availableOpponents.length)];
            
            const win = Math.random() > 0.4;
            const mode = battleModes.find(m => m.id === selectedMode.value);
            
            battleResult.win = win;
            battleResult.opponent = opponent;
            battleResult.rewards = {
                exp: win ? (selectedMode.value === 'ranked' ? 100 : selectedMode.value === 'match' ? 60 : 40) : (selectedMode.value === 'ranked' ? 30 : selectedMode.value === 'match' ? 20 : 15),
                gold: win ? (selectedMode.value === 'ranked' ? 200 : selectedMode.value === 'match' ? 120 : 80) : (selectedMode.value === 'ranked' ? 50 : selectedMode.value === 'match' ? 30 : 20)
            };

            const newRecord = {
                id: Date.now(),
                opponent: opponent.name,
                result: win ? 'win' : 'lose',
                time: '刚刚',
                mode: mode.name,
                rewards: battleResult.rewards
            };
            
            battleRecords.value.unshift(newRecord);
            
            battleStats.totalBattles++;
            if (win) {
                battleStats.wins++;
            }
            battleStats.winRate = Math.round((battleStats.wins / battleStats.totalBattles) * 100);

            GameStore.addExp(battleResult.rewards.exp);
            GameStore.addGold(battleResult.rewards.gold);

            showBattleResult.value = true;
        };

        const closeBattleResult = () => {
            showBattleResult.value = false;
            matchProgress.value = 0;
        };

        const startBattleWithPlayer = (player) => {
            if (isMatching.value) return;
            
            const win = Math.random() > 0.5;
            const mode = battleModes.find(m => m.id === selectedMode.value);
            
            battleResult.win = win;
            battleResult.opponent = player;
            battleResult.rewards = {
                exp: win ? 80 : 25,
                gold: win ? 150 : 40
            };

            const newRecord = {
                id: Date.now(),
                opponent: player.name,
                result: win ? 'win' : 'lose',
                time: '刚刚',
                mode: mode.name,
                rewards: battleResult.rewards
            };
            
            battleRecords.value.unshift(newRecord);
            
            battleStats.totalBattles++;
            if (win) {
                battleStats.wins++;
            }
            battleStats.winRate = Math.round((battleStats.wins / battleStats.totalBattles) * 100);

            GameStore.addExp(battleResult.rewards.exp);
            GameStore.addGold(battleResult.rewards.gold);

            showBattleResult.value = true;
        };

        const formatBattleTime = (time) => {
            return time;
        };

        const getBattleResultClass = (result) => {
            return result === 'win' ? 'result-win' : 'result-lose';
        };

        const getBattleResultText = (result) => {
            return result === 'win' ? '胜利' : '失败';
        };

        onMounted(async () => {
            try {
                await GameStore.loadAllData();
            } catch (error) {
                console.error('加载对战数据失败:', error);
            } finally {
                loading.value = false;
            }
        });

        return {
            loading,
            user,
            level,
            coins,
            recentBattles,
            battleModes,
            selectedMode,
            isMatching,
            matchProgress,
            showBattleResult,
            battleResult,
            onlinePlayers,
            battleRecords,
            battleStats,
            leaderboard,
            currentUser,
            userRank,
            selectMode,
            startQuickMatch,
            cancelMatch,
            closeBattleResult,
            startBattleWithPlayer,
            formatBattleTime,
            getBattleResultClass,
            getBattleResultText
        };
    },
    template: `
        <div class="battle-page">
            <div class="battle-header" v-if="user">
                <div class="battle-title">
                    <h2>对战中心</h2>
                    <p>与其他忍者一决高下</p>
                </div>
                <div class="battle-stats-header">
                    <div class="stat-badge">
                        <span class="stat-icon">🎯</span>
                        <span class="stat-text">Lv.{{ level }}</span>
                    </div>
                    <div class="stat-badge">
                        <span class="stat-icon">💰</span>
                        <span class="stat-text">{{ coins }}</span>
                    </div>
                </div>
            </div>

            <div class="battle-modes-section">
                <div class="section-title">选择对战模式</div>
                <div class="battle-modes-grid">
                    <div 
                        v-for="mode in battleModes" 
                        :key="mode.id"
                        class="battle-mode-card"
                        :class="{ active: selectedMode === mode.id }"
                        :style="{ borderColor: selectedMode === mode.id ? mode.color : 'transparent' }"
                        @click="selectMode(mode.id)"
                    >
                        <div class="mode-icon" :style="{ backgroundColor: mode.color + '20', color: mode.color }">{{ mode.icon }}</div>
                        <div class="mode-name">{{ mode.name }}</div>
                        <div class="mode-desc">{{ mode.description }}</div>
                    </div>
                </div>
            </div>

            <div class="quick-match-section">
                <button 
                    class="btn btn-primary btn-lg btn-block quick-match-btn"
                    :disabled="isMatching"
                    @click="isMatching ? cancelMatch() : startQuickMatch()"
                >
                    <span v-if="isMatching">取消匹配</span>
                    <span v-else>⚡ 快速匹配</span>
                </button>
                <div v-if="isMatching" class="matching-progress">
                    <div class="matching-text">正在寻找对手...</div>
                    <div class="progress-bar">
                        <div class="progress-fill" :style="{ width: matchProgress + '%' }"></div>
                    </div>
                </div>
            </div>

            <div class="stats-section">
                <div class="section-title">我的对战统计</div>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon" style="background-color: rgba(255, 107, 53, 0.1);">📊</div>
                        <div class="stat-info">
                            <div class="stat-value">{{ battleStats.totalBattles }}</div>
                            <div class="stat-label">总场次</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="background-color: rgba(40, 167, 69, 0.1);">🏆</div>
                        <div class="stat-info">
                            <div class="stat-value">{{ battleStats.wins }}</div>
                            <div class="stat-label">胜利场次</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="background-color: rgba(78, 205, 196, 0.1);">📈</div>
                        <div class="stat-info">
                            <div class="stat-value">{{ battleStats.winRate }}%</div>
                            <div class="stat-label">胜率</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon" style="background-color: rgba(255, 193, 7, 0.1);">⏱️</div>
                        <div class="stat-info">
                            <div class="stat-value">{{ battleStats.totalTime }}</div>
                            <div class="stat-label">总时长</div>
                        </div>
                    </div>
                </div>
                <div class="user-rank-badge">
                    <span>我的排名：#{{ userRank }}</span>
                </div>
            </div>

            <div class="online-players-section">
                <div class="section-header">
                    <div class="section-title">在线玩家</div>
                    <div class="section-subtitle">{{ onlinePlayers.filter(p => p.online).length }} 人在线</div>
                </div>
                <div class="online-players-list">
                    <div 
                        v-for="player in onlinePlayers" 
                        :key="player.id"
                        class="player-item"
                        :class="{ offline: !player.online }"
                    >
                        <div class="player-avatar">{{ player.avatar }}</div>
                        <div class="player-info">
                            <div class="player-name">
                                {{ player.name }}
                                <span class="online-status" :class="{ online: player.online }"></span>
                            </div>
                            <div class="player-level">Lv.{{ player.level }} · 胜率 {{ player.winRate }}%</div>
                        </div>
                        <button 
                            v-if="player.online"
                            class="btn btn-primary btn-sm"
                            @click="startBattleWithPlayer(player)"
                        >
                            挑战
                        </button>
                    </div>
                </div>
            </div>

            <div class="leaderboard-section">
                <div class="section-title">🏆 排行榜</div>
                <div class="leaderboard-list">
                    <div 
                        v-for="player in leaderboard" 
                        :key="player.rank"
                        class="leaderboard-item"
                    >
                        <div class="rank-badge" :class="'rank-' + player.rank">{{ player.rank }}</div>
                        <div class="player-avatar">{{ player.avatar }}</div>
                        <div class="player-info">
                            <div class="player-name">{{ player.name }}</div>
                            <div class="player-level">Lv.{{ player.level }} · {{ player.battles }} 场</div>
                        </div>
                        <div class="win-rate">{{ player.winRate }}%</div>
                    </div>
                </div>
            </div>

            <div class="battle-records-section">
                <div class="section-title">对战记录</div>
                <div class="battle-records-list">
                    <div 
                        v-for="record in battleRecords" 
                        :key="record.id"
                        class="battle-record-item"
                    >
                        <div class="record-result" :class="record.result">
                            {{ record.result === 'win' ? '胜' : '负' }}
                        </div>
                        <div class="record-info">
                            <div class="record-opponent">vs {{ record.opponent }}</div>
                            <div class="record-meta">{{ record.mode }} · {{ formatBattleTime(record.time) }}</div>
                        </div>
                        <div class="record-rewards">
                            <div class="reward-item">
                                <span>⭐</span>
                                <span>{{ record.rewards.exp }}</span>
                            </div>
                            <div class="reward-item">
                                <span>💰</span>
                                <span>{{ record.rewards.gold }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="showBattleResult" class="battle-result-modal">
                <div class="modal-overlay" @click="closeBattleResult"></div>
                <div class="modal-content">
                    <div class="result-header" :class="battleResult.win ? 'win' : 'lose'">
                        <div class="result-icon">{{ battleResult.win ? '🎉' : '😔' }}</div>
                        <div class="result-title">{{ battleResult.win ? '战斗胜利！' : '战斗失败' }}</div>
                    </div>
                    <div class="result-body">
                        <div class="result-opponent">
                            <div class="opponent-avatar">{{ battleResult.opponent?.avatar }}</div>
                            <div class="vs-text">VS</div>
                            <div class="player-avatar">{{ currentUser.nickname?.charAt(0) || '忍' }}</div>
                        </div>
                        <div class="result-opponent-name">{{ battleResult.opponent?.name }}</div>
                    </div>
                    <div class="result-rewards">
                        <div class="reward-title">获得奖励</div>
                        <div class="reward-items">
                            <div class="reward-item-large">
                                <span class="reward-icon">⭐</span>
                                <span class="reward-value">+{{ battleResult.rewards.exp }}</span>
                                <span class="reward-label">经验</span>
                            </div>
                            <div class="reward-item-large">
                                <span class="reward-icon">💰</span>
                                <span class="reward-value">+{{ battleResult.rewards.gold }}</span>
                                <span class="reward-label">金币</span>
                            </div>
                        </div>
                    </div>
                    <button class="btn btn-primary btn-block" @click="closeBattleResult">确定</button>
                </div>
            </div>

            <div class="loading-state" v-if="loading">
                <div class="loading-spinner"></div>
                <p>加载中...</p>
            </div>
        </div>
    `
};

const BattlePageWrapper = {
    render() {
        return Vue.h(MainLayout, { 
            currentPage: 'battle',
            onNavigate: (pageId) => {
                Router.navigate(pageId);
            }
        }, {
            default: () => Vue.h(BattlePage)
        });
    }
};

window.BattlePage = BattlePage;
window.BattlePageWrapper = BattlePageWrapper;
})();
