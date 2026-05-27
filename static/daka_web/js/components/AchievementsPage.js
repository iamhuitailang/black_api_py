(function() {
const { ref, onMounted, computed } = Vue;

const AchievementsPage = {
    template: `
        <div class="achievements-page">
            <div class="card">
                <div class="card-title">
                    我的成就 
                    <span style="font-size: 14px; font-weight: normal; color: #999;">
                        ({{ unlockedCount }}/{{ totalCount }})
                    </span>
                </div>
                <div class="achievement-category-tabs">
                    <div 
                        v-for="cat in categories" 
                        :key="cat.value"
                        class="achievement-category-tab"
                        :class="{ active: activeCategory === cat.value }"
                        @click="activeCategory = cat.value"
                    >
                        {{ cat.icon }} {{ cat.label }}
                    </div>
                </div>
                
                <div v-if="loading" class="empty-state">
                    <div class="empty-icon">⏳</div>
                    <div class="empty-text">加载中...</div>
                </div>
                
                <div v-else class="achievement-grid">
                    <div 
                        v-for="ach in filteredAchievements" 
                        :key="ach.id"
                        class="achievement-card"
                        :class="{ unlocked: ach.is_unlocked, locked: !ach.is_unlocked }"
                    >
                        <div class="achievement-icon">{{ ach.is_unlocked ? ach.icon : '🔒' }}</div>
                        <div class="achievement-name">{{ ach.name }}</div>
                        <div class="achievement-points">+{{ ach.points_reward }}积分</div>
                    </div>
                </div>
            </div>

            <div v-if="userAchievements.length" class="card">
                <div class="card-title">最近解锁</div>
                <div v-for="ua in userAchievements.slice(0, 5)" :key="ua.id" class="history-record">
                    <div class="history-icon">{{ ua.achievement_icon }}</div>
                    <div class="history-content">
                        <div class="history-task-name">{{ ua.achievement_name }}</div>
                        <div class="history-meta">
                            {{ formatDate(ua.unlocked_at) }} · +{{ ua.points_reward }}积分
                        </div>
                    </div>
                    <div class="history-status completed">已解锁</div>
                </div>
            </div>
        </div>
    `,
    setup() {
        const categories = ref([
            { value: 'all', label: '全部', icon: '🏆' },
            { value: 'streak', label: '连续打卡', icon: '🔥' },
            { value: 'completion', label: '完成次数', icon: '✅' },
            { value: 'points', label: '积分成就', icon: '💎' },
            { value: 'special', label: '特殊成就', icon: '🌟' }
        ]);
        
        const activeCategory = ref('all');
        const allAchievements = ref([]);
        const userAchievements = ref([]);
        const loading = ref(true);

        const totalCount = computed(() => allAchievements.value.length);
        const unlockedCount = computed(() => 
            allAchievements.value.filter(a => a.is_unlocked).length
        );

        const filteredAchievements = computed(() => {
            if (activeCategory.value === 'all') {
                return allAchievements.value;
            }
            return allAchievements.value.filter(a => a.category === activeCategory.value);
        });

        const loadAchievements = async () => {
            loading.value = true;
            try {
                const [allResult, userResult] = await Promise.all([
                    Api.achievement.getList(),
                    Api.achievement.getUserList()
                ]);
                
                if (allResult.code === 0) {
                    allAchievements.value = allResult.data;
                }
                if (userResult.code === 0) {
                    userAchievements.value = userResult.data.items || [];
                }
            } catch (e) {
                console.error(e);
            } finally {
                loading.value = false;
            }
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            const now = new Date();
            const diff = now - date;
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            
            if (days === 0) return '今天';
            if (days === 1) return '昨天';
            if (days < 7) return `${days}天前`;
            return `${date.getMonth() + 1}/${date.getDate()}`;
        };

        onMounted(() => {
            loadAchievements();
        });

        return {
            categories,
            activeCategory,
            allAchievements,
            userAchievements,
            loading,
            totalCount,
            unlockedCount,
            filteredAchievements,
            formatDate
        };
    }
};

window.AchievementsPage = AchievementsPage;
})();
