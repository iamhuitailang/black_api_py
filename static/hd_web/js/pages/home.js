(function() {
const { ref, computed, onMounted } = Vue;

const HomePage = {
    name: 'HomePage',
    setup() {
        const loading = ref(true);

        const user = computed(() => GameStore.state.user);
        const level = computed(() => GameStore.getters.level.value);
        const exp = computed(() => GameStore.getters.exp.value);
        const expToNextLevel = computed(() => GameStore.getters.expToNextLevel.value);
        const expProgress = computed(() => GameStore.getters.expProgress.value);
        const chakra = computed(() => GameStore.getters.chakra.value);
        const coins = computed(() => GameStore.getters.coins.value);
        const learnedSkillCount = computed(() => GameStore.getters.learnedSkillCount.value);
        const totalSkillCount = computed(() => GameStore.getters.totalSkillCount.value);
        const completedLevels = computed(() => GameStore.getters.completedLevels.value);
        const totalLevels = computed(() => GameStore.getters.totalLevels.value);
        const dailyMissions = computed(() => GameStore.getters.dailyMissions.value);
        const completedDailyMissions = computed(() => GameStore.getters.completedDailyMissions.value);
        const recentBattles = computed(() => GameStore.getters.recentBattles.value);

        const quickEntries = [
            { id: 'skills', name: '忍术训练', icon: '⚡', desc: '学习强大忍术', color: 'primary' },
            { id: 'levels', name: '关卡挑战', icon: '🗺️', desc: '挑战各种关卡', color: 'success' },
            { id: 'battle', name: '对战模式', icon: '⚔️', desc: '与其他忍者对战', color: 'danger' }
        ];

        const activities = ref([
            { id: 1, type: 'mission', title: '完成每日任务', time: '10分钟前', reward: '+50金币' },
            { id: 2, type: 'level', title: '通关第3关', time: '2小时前', reward: '+100经验' },
            { id: 3, type: 'skill', title: '学会螺旋丸', time: '1天前', reward: '新忍术' },
            { id: 4, type: 'battle', title: '对战胜利', time: '2天前', reward: '+200金币' }
        ]);

        const handleQuickEntry = (entryId) => {
            Router.navigate(entryId);
        };

        const formatBattleTime = (time) => {
            if (!time) return '未知';
            const date = new Date(time);
            return date.toLocaleDateString('zh-CN');
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
                console.error('加载首页数据失败:', error);
            } finally {
                loading.value = false;
            }
        });

        return {
            loading,
            user,
            level,
            exp,
            expToNextLevel,
            expProgress,
            chakra,
            coins,
            learnedSkillCount,
            totalSkillCount,
            completedLevels,
            totalLevels,
            dailyMissions,
            completedDailyMissions,
            recentBattles,
            quickEntries,
            activities,
            handleQuickEntry,
            formatBattleTime,
            getBattleResultClass,
            getBattleResultText
        };
    },
    template: `
        <div class="home-page">
            <div class="welcome-section" v-if="user">
                <div class="welcome-content">
                    <h2 class="welcome-title">
                        欢迎回来，{{ user.nickname || user.username }}！
                    </h2>
                    <p class="welcome-subtitle">今天也要努力成为更强的忍者哦～</p>
                </div>
                <div class="welcome-avatar">
                    {{ user.nickname?.charAt(0) || '忍' }}
                </div>
            </div>

            <div class="stats-card">
                <div class="stats-header">
                    <h3 class="stats-title">忍者概览</h3>
                </div>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon level">⭐</div>
                        <div class="stat-info">
                            <div class="stat-value">Lv.{{ level }}</div>
                            <div class="stat-label">忍者等级</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon exp">📈</div>
                        <div class="stat-info">
                            <div class="stat-value">{{ exp }}/{{ expToNextLevel }}</div>
                            <div class="stat-label">经验值</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon chakra">💫</div>
                        <div class="stat-info">
                            <div class="stat-value">{{ chakra }}</div>
                            <div class="stat-label">查克拉</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon coins">💰</div>
                        <div class="stat-info">
                            <div class="stat-value">{{ coins }}</div>
                            <div class="stat-label">金币</div>
                        </div>
                    </div>
                </div>

                <div class="level-progress-section">
                    <div class="level-progress-header">
                        <span class="level-label">忍者等级进度</span>
                        <span class="level-percent">{{ expProgress.toFixed(1) }}%</span>
                    </div>
                    <div class="level-progress-bar">
                        <div class="level-progress-fill" :style="{ width: expProgress + '%' }"></div>
                    </div>
                    <div class="level-progress-text">
                        距离 Lv.{{ level + 1 }} 还需 {{ expToNextLevel - exp }} 经验
                    </div>
                </div>
            </div>

            <div class="quick-entry-section">
                <h3 class="section-title">快速入口</h3>
                <div class="quick-entry-grid">
                    <div 
                        v-for="entry in quickEntries" 
                        :key="entry.id"
                        class="quick-entry-card"
                        :class="'entry-' + entry.color"
                        @click="handleQuickEntry(entry.id)"
                    >
                        <div class="entry-icon">{{ entry.icon }}</div>
                        <div class="entry-content">
                            <div class="entry-name">{{ entry.name }}</div>
                            <div class="entry-desc">{{ entry.desc }}</div>
                        </div>
                        <div class="entry-arrow">→</div>
                    </div>
                </div>
            </div>

            <div class="progress-section">
                <div class="progress-grid">
                    <div class="progress-card">
                        <div class="progress-header">
                            <span class="progress-icon">⚡</span>
                            <span class="progress-title">忍术学习</span>
                        </div>
                        <div class="progress-value">{{ learnedSkillCount }}/{{ totalSkillCount }}</div>
                        <div class="progress-bar">
                            <div 
                                class="progress-fill" 
                                :style="{ width: totalSkillCount > 0 ? (learnedSkillCount / totalSkillCount * 100) + '%' : '0%' }"
                            ></div>
                        </div>
                    </div>
                    <div class="progress-card">
                        <div class="progress-header">
                            <span class="progress-icon">🗺️</span>
                            <span class="progress-title">关卡通关</span>
                        </div>
                        <div class="progress-value">{{ completedLevels }}/{{ totalLevels }}</div>
                        <div class="progress-bar">
                            <div 
                                class="progress-fill success" 
                                :style="{ width: totalLevels > 0 ? (completedLevels / totalLevels * 100) + '%' : '0%' }"
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="daily-mission-section">
                <div class="section-header">
                    <h3 class="section-title">每日任务</h3>
                    <span class="mission-count">{{ completedDailyMissions }}/{{ dailyMissions.length }}</span>
                </div>
                <div class="mission-list" v-if="dailyMissions.length > 0">
                    <div 
                        v-for="mission in dailyMissions" 
                        :key="mission.id"
                        class="mission-item"
                        :class="{ completed: mission.status === 'completed' }"
                    >
                        <div class="mission-check">
                            {{ mission.status === 'completed' ? '✓' : '○' }}
                        </div>
                        <div class="mission-info">
                            <div class="mission-name">{{ mission.name || '完成3次忍术训练' }}</div>
                            <div class="mission-reward">奖励: {{ mission.reward || '+50金币' }}</div>
                        </div>
                        <div class="mission-status">
                            {{ mission.status === 'completed' ? '已完成' : '进行中' }}
                        </div>
                    </div>
                </div>
                <div class="empty-state" v-else>
                    <p>暂无每日任务</p>
                </div>
            </div>

            <div class="recent-activity-section">
                <h3 class="section-title">最近活动</h3>
                <div class="activity-list">
                    <div 
                        v-for="activity in activities" 
                        :key="activity.id"
                        class="activity-item"
                    >
                        <div class="activity-icon" :class="'activity-' + activity.type">
                            {{ activity.type === 'mission' ? '📜' : activity.type === 'level' ? '🗺️' : activity.type === 'skill' ? '⚡' : '⚔️' }}
                        </div>
                        <div class="activity-info">
                            <div class="activity-title">{{ activity.title }}</div>
                            <div class="activity-time">{{ activity.time }}</div>
                        </div>
                        <div class="activity-reward">{{ activity.reward }}</div>
                    </div>
                </div>
            </div>

            <div class="recent-battles-section" v-if="recentBattles.length > 0">
                <h3 class="section-title">最近对战</h3>
                <div class="battle-list">
                    <div 
                        v-for="battle in recentBattles" 
                        :key="battle.id"
                        class="battle-item"
                    >
                        <div class="battle-opponent">
                            <div class="opponent-avatar">{{ battle.opponent_name?.charAt(0) || '?' }}</div>
                            <div class="opponent-info">
                                <div class="opponent-name">{{ battle.opponent_name || '神秘忍者' }}</div>
                                <div class="battle-time">{{ formatBattleTime(battle.created_at) }}</div>
                            </div>
                        </div>
                        <div class="battle-result" :class="getBattleResultClass(battle.result)">
                            {{ getBattleResultText(battle.result) }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};

const HomePageWrapper = {
    render() {
        return Vue.h(MainLayout, { 
            currentPage: 'home',
            onNavigate: (pageId) => {
                Router.navigate(pageId);
            }
        }, {
            default: () => Vue.h(HomePage)
        });
    }
};

window.HomePage = HomePage;
window.HomePageWrapper = HomePageWrapper;
})();
