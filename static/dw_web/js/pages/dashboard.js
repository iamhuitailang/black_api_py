const DashboardPage = {
    template: `
    <div>
        <div v-if="loading" class="loading-page">🐾</div>
        <div v-else>
            <div class="dashboard-banner">
                <h2>🏕️ {{ zoo.name || '我的动物园' }}</h2>
                <p>等级 {{ zoo.level || 1 }} · 面积 {{ zoo.area || 100 }}㎡</p>
                <div style="margin-top: 8px; font-size: 18px; font-weight: 700;">🪙 {{ formatNumber(zoo.coins || 0) }}</div>
            </div>

            <div class="dashboard-stats">
                <div class="dashboard-stat">
                    <div class="dashboard-stat-icon">🦁</div>
                    <div class="dashboard-stat-value">{{ stats.animalCount || 0 }}</div>
                    <div class="dashboard-stat-label">动物数量</div>
                </div>
                <div class="dashboard-stat">
                    <div class="dashboard-stat-icon">🏡</div>
                    <div class="dashboard-stat-value">{{ stats.habitatCount || 0 }}</div>
                    <div class="dashboard-stat-label">栖息地</div>
                </div>
                <div class="dashboard-stat">
                    <div class="dashboard-stat-icon">👥</div>
                    <div class="dashboard-stat-value">{{ stats.visitorToday || 0 }}</div>
                    <div class="dashboard-stat-label">今日游客</div>
                </div>
                <div class="dashboard-stat">
                    <div class="dashboard-stat-icon">⭐</div>
                    <div class="dashboard-stat-value">{{ stats.satisfaction || 0 }}%</div>
                    <div class="dashboard-stat-label">满意度</div>
                </div>
            </div>

            <div class="action-bar">
                <button class="btn btn-primary btn-sm" @click="expandZoo">📐 扩建 (🪙{{ formatNumber(expandCost) }})</button>
                <button class="btn btn-warning btn-sm" @click="upgradeZoo">⬆️ 升级 (🪙{{ formatNumber(upgradeCost) }})</button>
                <button class="btn btn-info btn-sm" @click="goShop">🛒 动物商店</button>
            </div>

            <div class="card" style="margin-bottom: 16px;">
                <div class="card-header">
                    <span class="card-title">📋 最近动态</span>
                </div>
                <div class="card-body">
                    <div v-if="activities.length === 0" class="empty-state" style="padding: 20px;">
                        <div class="empty-state-icon" style="font-size: 32px;">📭</div>
                        <div class="empty-state-text">暂无动态</div>
                    </div>
                    <div v-for="act in activities" :key="act.id" class="activity-item">
                        <div class="activity-icon">{{ act.icon }}</div>
                        <div class="activity-text">{{ act.text }}</div>
                        <div class="activity-time">{{ formatDate(act.time) }}</div>
                    </div>
                </div>
            </div>

            <div class="section-header">
                <span class="section-title">⚠️ 需要关注</span>
            </div>
            <div class="grid grid-2">
                <div class="stat-card" style="cursor: pointer;" @click="DwRouter.navigate('disease')">
                    <div class="stat-icon">🤒</div>
                    <div class="stat-value" style="color: #ef4444;">{{ stats.sickCount || 0 }}</div>
                    <div class="stat-label">生病动物</div>
                </div>
                <div class="stat-card" style="cursor: pointer;" @click="DwRouter.navigate('breeding')">
                    <div class="stat-icon">🥚</div>
                    <div class="stat-value" style="color: #3b82f6;">{{ stats.breedingCount || 0 }}</div>
                    <div class="stat-label">繁殖中</div>
                </div>
            </div>
        </div>
    </div>
    `,
    setup() {
        const loading = ref(true);
        const zoo = reactive({ name: '', level: 1, area: 100, coins: 0 });
        const stats = reactive({ animalCount: 0, habitatCount: 0, visitorToday: 0, satisfaction: 0, sickCount: 0, breedingCount: 0 });
        const activities = ref([]);
        const expandCost = ref(500);
        const upgradeCost = ref(1000);

        function formatNumber(n) { return DwUtils.formatNumber(n); }
        function formatDate(d) { return DwUtils.formatDate(d); }

        async function loadData() {
            loading.value = true;
            try {
                const result = await DwApi.zoo.getDashboard();
                if (result.code === 0 && result.data) {
                    const d = result.data;
                    zoo.name = d.zoo?.name || '';
                    zoo.level = d.zoo?.level || 1;
                    zoo.area = d.zoo?.area || 100;
                    zoo.coins = d.zoo?.coins || 0;
                    stats.animalCount = d.animalCount || 0;
                    stats.habitatCount = d.habitatCount || 0;
                    stats.visitorToday = d.visitorToday || 0;
                    stats.satisfaction = d.satisfaction || 0;
                    stats.sickCount = d.sickCount || 0;
                    stats.breedingCount = d.breedingCount || 0;
                    expandCost.value = d.expandCost || 500;
                    upgradeCost.value = d.upgradeCost || 1000;
                    activities.value = d.activities || [];
                }
            } catch (e) {
                DwUtils.showToast('加载数据失败', 'error');
            } finally {
                loading.value = false;
            }
        }

        async function expandZoo() {
            try {
                const result = await DwApi.zoo.expand();
                if (result.code === 0) {
                    DwUtils.showToast('扩建成功！面积增加了 🎉', 'success');
                    loadData();
                } else {
                    DwUtils.showToast(result.msg || '扩建失败', 'error');
                }
            } catch (e) {
                DwUtils.showToast('操作失败', 'error');
            }
        }

        async function upgradeZoo() {
            try {
                const result = await DwApi.zoo.upgrade();
                if (result.code === 0) {
                    DwUtils.showToast('升级成功！等级提升 🎉', 'success');
                    loadData();
                } else {
                    DwUtils.showToast(result.msg || '升级失败', 'error');
                }
            } catch (e) {
                DwUtils.showToast('操作失败', 'error');
            }
        }

        function goShop() {
            DwRouter.navigate('animal-shop');
        }

        onMounted(() => { loadData(); });

        return { loading, zoo, stats, activities, expandCost, upgradeCost, formatNumber, formatDate, expandZoo, upgradeZoo, goShop, DwRouter };
    }
};
