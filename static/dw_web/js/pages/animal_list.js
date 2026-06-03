const AnimalListPage = {
    template: `
    <div>
        <div class="section-header">
            <span class="section-title">🦁 我的动物</span>
            <span class="section-action" @click="DwRouter.navigate('animal-shop')">🛒 去商店</span>
        </div>

        <div class="search-bar">
            <span style="margin-right: 8px;">🔍</span>
            <input type="text" v-model="keyword" placeholder="搜索动物名称...">
        </div>

        <div class="filter-bar">
            <button class="filter-btn" :class="{ active: filterStatus === '' }" @click="filterStatus = ''">全部</button>
            <button class="filter-btn" :class="{ active: filterStatus === 'healthy' }" @click="filterStatus = 'healthy'">💚 健康</button>
            <button class="filter-btn" :class="{ active: filterStatus === 'sick' }" @click="filterStatus = 'sick'">🤒 生病</button>
            <button class="filter-btn" :class="{ active: filterStatus === 'breeding' }" @click="filterStatus = 'breeding'">🥚 繁殖</button>
            <button class="filter-btn" :class="{ active: filterStatus === 'hungry' }" @click="filterStatus = 'hungry'">🍽️ 饥饿</button>
        </div>

        <div v-if="loading" class="loading-page">🐾</div>
        <div v-else-if="filteredAnimals.length === 0" class="empty-state">
            <div class="empty-state-icon">🦁</div>
            <div class="empty-state-text">还没有动物，去商店买一只吧！</div>
        </div>
        <div v-else class="grid grid-2">
            <div v-for="animal in filteredAnimals" :key="animal.id"
                 class="animal-card"
                 :class="{ 'animal-card-sick': animal.status === 'sick', 'animal-card-breeding': animal.status === 'breeding' }"
                 @click="goDetail(animal.id)">
                <div v-if="animal.status === 'sick'" class="animal-status-overlay">🤒</div>
                <div v-else-if="animal.status === 'breeding'" class="animal-status-overlay">🥚</div>
                <div class="animal-card-emoji">{{ animal.emoji || '🐾' }}</div>
                <div class="animal-card-name">{{ animal.nickname || animal.species_name }}</div>
                <div class="animal-card-species">
                    {{ genderEmoji(animal.gender) }} {{ animal.species_name }}
                    <span class="badge" :class="rarityColor(animal.rarity)" style="margin-left: 4px;">{{ rarityText(animal.rarity) }}</span>
                </div>
                <div style="margin-top: 6px;">
                    <div class="progress-label"><span>❤️</span><span>{{ animal.health || 0 }}%</span></div>
                    <div class="progress-bar"><div class="progress-fill" :class="healthClass(animal.health)" :style="{ width: (animal.health || 0) + '%' }"></div></div>
                </div>
                <div style="margin-top: 4px;">
                    <div class="progress-label"><span>🍖</span><span>{{ animal.hunger || 0 }}%</span></div>
                    <div class="progress-bar"><div class="progress-fill hunger" :style="{ width: (animal.hunger || 0) + '%' }"></div></div>
                </div>
                <div style="margin-top: 4px;">
                    <div class="progress-label"><span>😊</span><span>{{ animal.happiness || 0 }}%</span></div>
                    <div class="progress-bar"><div class="progress-fill happiness" :style="{ width: (animal.happiness || 0) + '%' }"></div></div>
                </div>
                <div style="margin-top: 8px; display: flex; gap: 4px;">
                    <button class="btn btn-primary btn-sm" style="flex:1;" @click.stop="feedAnimal(animal.id)">🍖</button>
                    <button class="btn btn-info btn-sm" style="flex:1;" @click.stop="petAnimal(animal.id)">🤗</button>
                </div>
            </div>
        </div>
    </div>
    `,
    setup() {
        const loading = ref(true);
        const animals = ref([]);
        const keyword = ref('');
        const filterStatus = ref('');

        const filteredAnimals = computed(() => {
            return animals.value.filter(a => {
                if (filterStatus.value && a.status !== filterStatus.value) return false;
                if (keyword.value) {
                    const k = keyword.value.toLowerCase();
                    return (a.nickname || '').toLowerCase().includes(k) || (a.species_name || '').toLowerCase().includes(k);
                }
                return true;
            });
        });

        function rarityColor(r) { return DwUtils.rarityColor(r); }
        function rarityText(r) { return DwUtils.rarityText(r); }
        function genderEmoji(g) { return DwUtils.genderEmoji(g); }
        function healthClass(v) { return v >= 50 ? 'health' : 'hunger'; }

        async function loadData() {
            loading.value = true;
            try {
                const result = await DwApi.animal.getMyAnimals();
                if (result.code === 0) animals.value = result.data || [];
            } catch (e) {
                DwUtils.showToast('加载失败', 'error');
            } finally {
                loading.value = false;
            }
        }

        async function feedAnimal(id) {
            try {
                const result = await DwApi.animal.feed(id);
                if (result.code === 0) {
                    DwUtils.showToast('喂食成功 🍖', 'success');
                    loadData();
                } else {
                    DwUtils.showToast(result.msg || '喂食失败', 'error');
                }
            } catch (e) {
                DwUtils.showToast('操作失败', 'error');
            }
        }

        async function petAnimal(id) {
            try {
                const result = await DwApi.animal.pet(id);
                if (result.code === 0) {
                    DwUtils.showToast('抚摸成功，动物很开心 😊', 'success');
                    loadData();
                } else {
                    DwUtils.showToast(result.msg || '抚摸失败', 'error');
                }
            } catch (e) {
                DwUtils.showToast('操作失败', 'error');
            }
        }

        function goDetail(id) {
            DwRouter.navigate('animal-detail', { id });
        }

        onMounted(() => { loadData(); });

        return { loading, animals, keyword, filterStatus, filteredAnimals, rarityColor, rarityText, genderEmoji, healthClass, feedAnimal, petAnimal, goDetail, DwRouter };
    }
};
