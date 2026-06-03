(function() {
const { ref, computed, onMounted } = Vue;

const MissionsPage = {
    name: 'MissionsPage',
    setup() {
        const loading = ref(true);
        const selectedCategory = ref('daily');

        const user = computed(() => GameStore.state.user);
        const missions = computed(() => GameStore.state.missions || []);

        const missionCategories = [
            { code: 'daily', name: '日常', icon: '📅' },
            { code: 'main', name: '主线', icon: '📜' },
            { code: 'achievement', name: '成就', icon: '🏆' }
        ];

        const allMissions = computed(() => {
            return GameStore.getMissions().map(mission => {
                const progress = mission.progress || 0;
                const target = mission.target || 1;
                const percent = target > 0 ? Math.min(100, (progress / target) * 100) : 0;
                const canClaim = !mission.claimed && progress >= target;
                return {
                    ...mission,
                    percent,
                    canClaim
                };
            });
        });

        const filteredMissions = computed(() => {
            return allMissions.value.filter(m => m.type === selectedCategory.value);
        });

        const categoryStats = computed(() => {
            const stats = {};
            missionCategories.forEach(cat => {
                const catMissions = allMissions.value.filter(m => m.type === cat.code);
                const completed = catMissions.filter(m => m.claimed || (m.progress >= m.target)).length;
                stats[cat.code] = {
                    total: catMissions.length,
                    completed
                };
            });
            return stats;
        });

        const selectCategory = (categoryCode) => {
            selectedCategory.value = categoryCode;
        };

        const getCategoryIcon = (type) => {
            const category = missionCategories.find(c => c.code === type);
            return category ? category.icon : '📋';
        };

        const claimReward = (missionId) => {
            GameStore.claimReward(missionId);
        };

        const refreshDailyMissions = () => {
            GameStore.refreshDailyMissions();
        };

        onMounted(async () => {
            try {
                await GameStore.loadAllData();
                GameStore.refreshDailyMissions();
            } catch (error) {
                console.error('加载任务数据失败:', error);
            } finally {
                loading.value = false;
            }
        });

        return {
            loading,
            user,
            missionCategories,
            selectedCategory,
            filteredMissions,
            categoryStats,
            selectCategory,
            getCategoryIcon,
            claimReward,
            refreshDailyMissions
        };
    },
    template: `
        <div class="missions-page">
            <div class="missions-header" v-if="user">
                <div class="missions-title">
                    <h2>任务中心</h2>
                    <p>完成任务获取丰厚奖励</p>
                </div>
                <button 
                    class="btn btn-secondary btn-sm refresh-btn"
                    @click="refreshDailyMissions"
                >
                    🔄 刷新每日
                </button>
            </div>

            <div class="category-tabs">
                <div 
                    v-for="category in missionCategories" 
                    :key="category.code"
                    class="category-tab"
                    :class="{ active: selectedCategory === category.code }"
                    @click="selectCategory(category.code)"
                >
                    <span class="category-icon">{{ category.icon }}</span>
                    <span class="category-name">{{ category.name }}</span>
                    <span class="category-count">
                        {{ categoryStats[category.code]?.completed || 0 }}/{{ categoryStats[category.code]?.total || 0 }}
                    </span>
                </div>
            </div>

            <div class="missions-list" v-if="!loading">
                <div 
                    v-for="mission in filteredMissions" 
                    :key="mission.id"
                    class="mission-card"
                    :class="{ 
                        completed: mission.claimed,
                        claimable: mission.canClaim
                    }"
                >
                    <div class="mission-header">
                        <div class="mission-type-icon">
                            {{ getCategoryIcon(mission.type) }}
                        </div>
                        <div class="mission-info">
                            <div class="mission-name">{{ mission.name }}</div>
                            <div class="mission-description">{{ mission.description }}</div>
                        </div>
                        <div class="mission-status" v-if="mission.claimed">
                            <span class="status-badge claimed">已领取</span>
                        </div>
                        <div class="mission-status" v-else-if="mission.canClaim">
                            <span class="status-badge claimable">可领取</span>
                        </div>
                    </div>

                    <div class="mission-progress-section">
                        <div class="progress-header">
                            <span class="progress-label">任务进度</span>
                            <span class="progress-value">{{ mission.progress || 0 }}/{{ mission.target || 1 }}</span>
                        </div>
                        <div class="progress-bar">
                            <div 
                                class="progress-fill" 
                                :class="{ success: mission.canClaim }"
                                :style="{ width: mission.percent + '%' }"
                            ></div>
                        </div>
                    </div>

                    <div class="mission-reward">
                        <span class="reward-label">奖励:</span>
                        <span class="reward-item">
                            <span class="reward-icon">⭐</span>
                            <span class="reward-value">{{ mission.reward?.exp || 0 }}</span>
                        </span>
                        <span class="reward-item">
                            <span class="reward-icon">💰</span>
                            <span class="reward-value">{{ mission.reward?.gold || 0 }}</span>
                        </span>
                    </div>

                    <button 
                        class="btn btn-primary btn-block claim-btn"
                        :disabled="!mission.canClaim || mission.claimed"
                        @click="claimReward(mission.id)"
                    >
                        <span v-if="mission.claimed">✓ 已领取</span>
                        <span v-else-if="mission.canClaim">🎁 领取奖励</span>
                        <span v-else>进行中...</span>
                    </button>
                </div>
            </div>

            <div class="loading-state" v-else>
                <div class="loading-spinner"></div>
                <p>加载中...</p>
            </div>

            <div class="empty-state" v-if="!loading && filteredMissions.length === 0">
                <div style="font-size: 64px; margin-bottom: 16px;">📜</div>
                <h2 style="margin-bottom: 8px;">暂无任务</h2>
                <p>该分类下暂无任务</p>
            </div>
        </div>
    `
};

const MissionsPageWrapper = {
    render() {
        return Vue.h(MainLayout, { 
            currentPage: 'missions',
            onNavigate: (pageId) => {
                Router.navigate(pageId);
            }
        }, {
            default: () => Vue.h(MissionsPage)
        });
    }
};

window.MissionsPage = MissionsPage;
window.MissionsPageWrapper = MissionsPageWrapper;
})();
