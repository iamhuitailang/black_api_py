const AnimalShopPage = {
    template: `
    <div>
        <div class="back-btn" @click="DwRouter.navigate('animals')">← 返回我的动物</div>
        <div class="section-header">
            <span class="section-title">🛒 动物商店</span>
            <span class="coins-display">🪙 {{ formatNumber(coins) }}</span>
        </div>

        <div class="filter-bar">
            <button class="filter-btn" :class="{ active: filterCategory === '' }" @click="filterCategory = ''">全部</button>
            <button class="filter-btn" :class="{ active: filterCategory === 'mammal' }" @click="filterCategory = 'mammal'">🦁 哺乳</button>
            <button class="filter-btn" :class="{ active: filterCategory === 'bird' }" @click="filterCategory = 'bird'">🦅 鸟类</button>
            <button class="filter-btn" :class="{ active: filterCategory === 'reptile' }" @click="filterCategory = 'reptile'">🐊 爬行</button>
            <button class="filter-btn" :class="{ active: filterCategory === 'fish' }" @click="filterCategory = 'fish'">🐠 鱼类</button>
        </div>

        <div class="filter-bar">
            <button class="filter-btn" :class="{ active: filterRarity === '' }" @click="filterRarity = ''">全部稀有度</button>
            <button class="filter-btn badge-common" :class="{ active: filterRarity === 'common' }" @click="filterRarity = 'common'">普通</button>
            <button class="filter-btn badge-uncommon" :class="{ active: filterRarity === 'uncommon' }" @click="filterRarity = 'uncommon'">优秀</button>
            <button class="filter-btn badge-rare" :class="{ active: filterRarity === 'rare' }" @click="filterRarity = 'rare'">稀有</button>
            <button class="filter-btn badge-epic" :class="{ active: filterRarity === 'epic' }" @click="filterRarity = 'epic'">史诗</button>
            <button class="filter-btn badge-legendary" :class="{ active: filterRarity === 'legendary' }" @click="filterRarity = 'legendary'">传说</button>
        </div>

        <div v-if="loading" class="loading-page">🐾</div>
        <div v-else-if="filteredSpecies.length === 0" class="empty-state">
            <div class="empty-state-icon">🏪</div>
            <div class="empty-state-text">暂无符合条件的物种</div>
        </div>
        <div v-else class="grid grid-2">
            <div v-for="sp in filteredSpecies" :key="sp.id" class="species-card" :class="{ 'rarity-glow-legendary': sp.rarity === 'legendary', 'rarity-glow-epic': sp.rarity === 'epic' }">
                <div class="species-emoji">{{ sp.emoji || '🐾' }}</div>
                <div class="species-name">{{ sp.name }}</div>
                <div class="species-category">{{ categoryText(sp.category) }}</div>
                <div class="species-price">🪙 {{ formatNumber(sp.price) }}</div>
                <span class="badge" :class="rarityColor(sp.rarity)">{{ rarityText(sp.rarity) }}</span>
                <div style="margin-top: 8px; display: flex; gap: 4px;">
                    <button class="btn btn-primary btn-sm" style="flex:1;" @click="buyAnimal(sp.id, 'male')">♂️</button>
                    <button class="btn btn-info btn-sm" style="flex:1;" @click="buyAnimal(sp.id, 'female')">♀️</button>
                </div>
            </div>
        </div>
    </div>
    `,
    setup() {
        const loading = ref(true);
        const species = ref([]);
        const coins = ref(0);
        const filterCategory = ref('');
        const filterRarity = ref('');

        const filteredSpecies = computed(() => {
            return species.value.filter(sp => {
                if (filterCategory.value && sp.category !== filterCategory.value) return false;
                if (filterRarity.value && sp.rarity !== filterRarity.value) return false;
                return true;
            });
        });

        function formatNumber(n) { return DwUtils.formatNumber(n); }
        function categoryText(c) { return DwUtils.categoryText(c); }
        function rarityColor(r) { return DwUtils.rarityColor(r); }
        function rarityText(r) { return DwUtils.rarityText(r); }

        async function loadData() {
            loading.value = true;
            try {
                const [speciesRes, zooRes] = await Promise.all([
                    DwApi.animal.getSpecies(),
                    DwApi.zoo.getInfo()
                ]);
                if (speciesRes.code === 0) species.value = speciesRes.data || [];
                if (zooRes.code === 0 && zooRes.data) coins.value = zooRes.data.coins || 0;
            } catch (e) {
                DwUtils.showToast('加载失败', 'error');
            } finally {
                loading.value = false;
            }
        }

        async function buyAnimal(speciesId, gender) {
            try {
                const result = await DwApi.animal.buyAnimal({ species_id: speciesId, gender });
                if (result.code === 0) {
                    DwUtils.showToast(`购买成功！新伙伴加入了动物园 🎉`, 'success');
                    const zooRes = await DwApi.zoo.getInfo();
                    if (zooRes.code === 0 && zooRes.data) coins.value = zooRes.data.coins || 0;
                } else {
                    DwUtils.showToast(result.msg || '购买失败', 'error');
                }
            } catch (e) {
                DwUtils.showToast('购买失败', 'error');
            }
        }

        onMounted(() => { loadData(); });

        return { loading, species, coins, filterCategory, filterRarity, filteredSpecies, formatNumber, categoryText, rarityColor, rarityText, buyAnimal, DwRouter };
    }
};
