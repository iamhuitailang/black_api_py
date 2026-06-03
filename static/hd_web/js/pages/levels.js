(function() {
const { ref, computed, onMounted } = Vue;

const LevelsPage = {
    name: 'LevelsPage',
    setup() {
        const loading = ref(true);
        const selectedCategory = ref('all');

        const user = computed(() => GameStore.state.user);
        const level = computed(() => GameStore.getters.level.value);
        const userLevels = computed(() => GameStore.state.levels || []);

        const levelCategories = [
            { code: 'all', name: '全部', icon: '📋' },
            ...GameStore.getLevelTypes()
        ];

        const allLevels = computed(() => {
            return GameStore.getAllLevels().map(levelItem => {
                const userLevel = userLevels.value.find(l => l.id === levelItem.id);
                const stars = userLevel ? userLevel.stars : 0;
                const completed = userLevel ? userLevel.completed : false;
                const unlocked = GameStore.isLevelUnlocked(levelItem);
                return {
                    ...levelItem,
                    stars,
                    completed,
                    unlocked
                };
            });
        });

        const filteredLevels = computed(() => {
            if (selectedCategory.value === 'all') {
                return allLevels.value;
            }
            return allLevels.value.filter(l => l.type === selectedCategory.value);
        });

        const selectCategory = (categoryCode) => {
            selectedCategory.value = categoryCode;
        };

        const getDifficultyStars = (difficulty) => {
            return '⭐'.repeat(difficulty);
        };

        const getTypeIcon = (type) => {
            const typeInfo = GameStore.getLevelTypes().find(t => t.code === type);
            return typeInfo ? typeInfo.icon : '🎮';
        };

        const getTypeName = (type) => {
            const typeInfo = GameStore.getLevelTypes().find(t => t.code === type);
            return typeInfo ? typeInfo.name : '未知';
        };

        const startLevel = (levelItem) => {
            if (!levelItem.unlocked) {
                Toast.error(`需要等级 ${levelItem.unlockLevel} 才能解锁此关卡`);
                return;
            }
            Router.navigate('game', { id: levelItem.id, type: levelItem.type });
        };

        onMounted(async () => {
            try {
                await GameStore.loadAllData();
            } catch (error) {
                console.error('加载关卡数据失败:', error);
            } finally {
                loading.value = false;
            }
        });

        return {
            loading,
            user,
            level,
            levelCategories,
            selectedCategory,
            filteredLevels,
            selectCategory,
            getDifficultyStars,
            getTypeIcon,
            getTypeName,
            startLevel
        };
    },
    template: `
        <div class="levels-page">
            <div class="levels-header" v-if="user">
                <div class="levels-title">
                    <h2>关卡挑战</h2>
                    <p>选择关卡，开始你的忍者冒险</p>
                </div>
                <div class="levels-stats">
                    <div class="stat-badge">
                        <span class="stat-icon">🎯</span>
                        <span class="stat-text">Lv.{{ level }}</span>
                    </div>
                </div>
            </div>

            <div class="category-tabs">
                <div 
                    v-for="category in levelCategories" 
                    :key="category.code"
                    class="category-tab"
                    :class="{ active: selectedCategory === category.code }"
                    @click="selectCategory(category.code)"
                >
                    <span class="category-icon">{{ category.icon }}</span>
                    <span class="category-name">{{ category.name }}</span>
                </div>
            </div>

            <div class="levels-list" v-if="!loading">
                <div 
                    v-for="levelItem in filteredLevels" 
                    :key="levelItem.id"
                    class="level-card"
                    :class="{ 
                        locked: !levelItem.unlocked, 
                        completed: levelItem.completed 
                    }"
                >
                    <div class="level-header">
                        <div class="level-type-icon">
                            {{ getTypeIcon(levelItem.type) }}
                        </div>
                        <div class="level-info">
                            <div class="level-name">{{ levelItem.name }}</div>
                            <div class="level-type">{{ getTypeName(levelItem.type) }}</div>
                        </div>
                        <div class="level-difficulty">
                            {{ getDifficultyStars(levelItem.difficulty) }}
                        </div>
                    </div>

                    <div class="level-description">
                        {{ levelItem.description }}
                    </div>

                    <div class="level-meta">
                        <div class="meta-item" v-if="levelItem.timeLimit">
                            <span class="meta-icon">⏱️</span>
                            <span class="meta-text">{{ levelItem.timeLimit }}秒</span>
                        </div>
                        <div class="meta-item" v-if="levelItem.enemyLevel">
                            <span class="meta-icon">👹</span>
                            <span class="meta-text">敌人Lv.{{ levelItem.enemyLevel }}</span>
                        </div>
                        <div class="meta-item" v-if="levelItem.detectionLimit">
                            <span class="meta-icon">👁️</span>
                            <span class="meta-text">被发现{{ levelItem.detectionLimit }}次</span>
                        </div>
                        <div class="meta-item" v-if="levelItem.targetHp">
                            <span class="meta-icon">❤️</span>
                            <span class="meta-text">目标HP {{ levelItem.targetHp }}</span>
                        </div>
                    </div>

                    <div class="level-reward">
                        <span class="reward-label">奖励:</span>
                        <span class="reward-item">⭐ {{ levelItem.reward.exp }}</span>
                        <span class="reward-item">💰 {{ levelItem.reward.gold }}</span>
                    </div>

                    <div class="level-unlock" v-if="!levelItem.unlocked">
                        <span class="lock-icon">🔒</span>
                        <span class="lock-text">需要等级 {{ levelItem.unlockLevel }}</span>
                    </div>

                    <div class="level-stars" v-if="levelItem.completed">
                        <span class="stars-label">已通关:</span>
                        <span class="stars-value">{{ '⭐'.repeat(levelItem.stars) }}{{ '☆'.repeat(3 - levelItem.stars) }}</span>
                    </div>

                    <button 
                        class="btn btn-primary btn-block level-start-btn"
                        :disabled="!levelItem.unlocked"
                        @click="startLevel(levelItem)"
                    >
                        <span v-if="levelItem.unlocked">{{ levelItem.completed ? '再次挑战' : '开始挑战' }}</span>
                        <span v-else>🔒 未解锁</span>
                    </button>
                </div>
            </div>

            <div class="loading-state" v-else>
                <div class="loading-spinner"></div>
                <p>加载中...</p>
            </div>

            <div class="empty-state" v-if="!loading && filteredLevels.length === 0">
                <div style="font-size: 64px; margin-bottom: 16px;">🗺️</div>
                <h2 style="margin-bottom: 8px;">暂无关卡</h2>
                <p>该分类下暂无关卡</p>
            </div>
        </div>
    `
};

const LevelsPageWrapper = {
    render() {
        return Vue.h(MainLayout, { 
            currentPage: 'levels',
            onNavigate: (pageId) => {
                Router.navigate(pageId);
            }
        }, {
            default: () => Vue.h(LevelsPage)
        });
    }
};

window.LevelsPage = LevelsPage;
window.LevelsPageWrapper = LevelsPageWrapper;
})();
