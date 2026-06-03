const RareCollectionPage = {
    template: `
    <div>
        <div class="section-header">
            <span class="section-title">💎 珍稀收藏</span>
        </div>

        <div v-if="loading" class="loading-page">💎</div>
        <div v-else>
            <div class="completion-bar">
                <div class="completion-text">
                    <span>📊 收集进度</span>
                    <span>{{ discoveredCount }}/{{ totalCount }} ({{ completionPercent }}%)</span>
                </div>
                <div class="progress-bar progress-lg">
                    <div class="progress-fill" style="background: linear-gradient(90deg, #8b5cf6, #f59e0b);" :style="{ width: completionPercent + '%' }"></div>
                </div>
            </div>

            <div class="filter-bar">
                <button class="filter-btn" :class="{ active: filterRarity === '' }" @click="filterRarity = ''">全部</button>
                <button class="filter-btn badge-common" :class="{ active: filterRarity === 'rare' }" @click="filterRarity = 'rare'">稀有</button>
                <button class="filter-btn badge-epic" :class="{ active: filterRarity === 'epic' }" @click="filterRarity = 'epic'">史诗</button>
                <button class="filter-btn badge-legendary" :class="{ active: filterRarity === 'legendary' }" @click="filterRarity = 'legendary'">传说</button>
            </div>

            <div class="dashboard-stats" style="margin-bottom: 16px;">
                <div class="dashboard-stat">
                    <div class="dashboard-stat-icon" style="color: var(--rarity-rare);">💙</div>
                    <div class="dashboard-stat-value">{{ stats.rare || 0 }}</div>
                    <div class="dashboard-stat-label">稀有</div>
                </div>
                <div class="dashboard-stat">
                    <div class="dashboard-stat-icon" style="color: var(--rarity-epic);">💜</div>
                    <div class="dashboard-stat-value">{{ stats.epic || 0 }}</div>
                    <div class="dashboard-stat-label">史诗</div>
                </div>
                <div class="dashboard-stat">
                    <div class="dashboard-stat-icon" style="color: var(--rarity-legendary);">💛</div>
                    <div class="dashboard-stat-value">{{ stats.legendary || 0 }}</div>
                    <div class="dashboard-stat-label">传说</div>
                </div>
                <div class="dashboard-stat">
                    <div class="dashboard-stat-icon">🏆</div>
                    <div class="dashboard-stat-value">{{ discoveredCount }}</div>
                    <div class="dashboard-stat-label">已发现</div>
                </div>
            </div>

            <div class="collection-grid">
                <div v-for="sp in filteredCollection" :key="sp.id"
                     class="collection-item"
                     :class="{ discovered: sp.discovered, undiscovered: !sp.discovered, 'rarity-glow-legendary': sp.discovered && sp.rarity === 'legendary', 'rarity-glow-epic': sp.discovered && sp.rarity === 'epic' }">
                    <div v-if="sp.discovered" class="collection-emoji">{{ sp.emoji || '🐾' }}</div>
                    <div v-else class="collection-unknown">❓</div>
                    <div class="collection-name" v-if="sp.discovered">{{ sp.name }}</div>
                    <div class="collection-name" v-else>???</div>
                    <div v-if="sp.discovered" style="margin-top: 4px;">
                        <span class="badge" :class="rarityColor(sp.rarity)">{{ rarityText(sp.rarity) }}</span>
                    </div>
                </div>
            </div>

            <div v-if="filteredCollection.length === 0" class="empty-state">
                <div class="empty-state-icon">💎</div>
                <div class="empty-state-text">暂无珍稀物种</div>
            </div>
        </div>
    </div>
    `,
    setup() {
        const loading = ref(true);
        const collection = ref([]);
        const stats = reactive({ rare: 0, epic: 0, legendary: 0 });
        const filterRarity = ref('');

        const discoveredCount = computed(() => collection.value.filter(s => s.discovered).length);
        const totalCount = computed(() => collection.value.length);
        const completionPercent = computed(() => {
            if (totalCount.value === 0) return 0;
            return Math.round((discoveredCount.value / totalCount.value) * 100);
        });

        const filteredCollection = computed(() => {
            if (!filterRarity.value) return collection.value;
            return collection.value.filter(s => s.rarity === filterRarity.value);
        });

        function rarityColor(r) { return DwUtils.rarityColor(r); }
        function rarityText(r) { return DwUtils.rarityText(r); }

        async function loadData() {
            loading.value = true;
            try {
                const [colRes, statsRes] = await Promise.all([
                    DwApi.rare.getCollection(),
                    DwApi.rare.getStats()
                ]);
                if (colRes.code === 0) collection.value = colRes.data || [];
                if (statsRes.code === 0 && statsRes.data) {
                    stats.rare = statsRes.data.rare || 0;
                    stats.epic = statsRes.data.epic || 0;
                    stats.legendary = statsRes.data.legendary || 0;
                }
            } catch (e) {
                DwUtils.showToast('加载失败', 'error');
            } finally {
                loading.value = false;
            }
        }

        onMounted(() => { loadData(); });

        return { loading, collection, stats, filterRarity, discoveredCount, totalCount, completionPercent, filteredCollection, rarityColor, rarityText };
    }
};
