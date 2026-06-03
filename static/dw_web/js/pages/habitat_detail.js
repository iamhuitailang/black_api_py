const HabitatDetailPage = {
    template: `
    <div>
        <div class="back-btn" @click="DwRouter.navigate('habitats')">← 返回栖息地列表</div>

        <div v-if="loading" class="loading-page">🏡</div>
        <div v-else-if="habitat">
            <div class="detail-header" style="background: linear-gradient(135deg, #065f46, #059669, #34d399);">
                <div class="detail-emoji">{{ habitatEmoji(habitat.type) }}</div>
                <div class="detail-name">{{ habitat.name }}</div>
                <div class="detail-subtitle">{{ habitatTypeName(habitat.type) }} · 等级 {{ habitat.level || 1 }}</div>
                <div class="detail-subtitle" style="margin-top: 4px;">
                    🐾 {{ habitat.animal_count || 0 }}/{{ habitat.capacity || 0 }} 只动物
                    <span v-if="habitat.temperature"> · 🌡️ {{ habitat.temperature }}°C</span>
                </div>
            </div>

            <div class="card" style="margin-bottom: 12px;">
                <div class="card-body">
                    <div class="progress-label"><span>🧹 清洁度</span><span>{{ habitat.cleanliness || 0 }}%</span></div>
                    <div class="progress-bar progress-lg"><div class="progress-fill clean" :style="{ width: (habitat.cleanliness || 0) + '%' }"></div></div>

                    <div class="progress-label" style="margin-top: 12px;"><span>🛋️ 舒适度</span><span>{{ habitat.comfort || 0 }}%</span></div>
                    <div class="progress-bar progress-lg"><div class="progress-fill comfort" :style="{ width: (habitat.comfort || 0) + '%' }"></div></div>
                </div>
            </div>

            <div class="card" style="margin-bottom: 12px;">
                <div class="card-header">
                    <span class="card-title">🌡️ 温度调节</span>
                    <span style="font-weight: 600;">{{ temperature }}°C</span>
                </div>
                <div class="card-body">
                    <input type="range" class="temp-slider" min="-10" max="50" v-model.number="temperature" @change="adjustTemp">
                    <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-light); margin-top: 4px;">
                        <span>❄️ -10°C</span>
                        <span>☀️ 50°C</span>
                    </div>
                </div>
            </div>

            <div class="action-bar">
                <button class="btn btn-primary" @click="upgradeHabitat">⬆️ 升级</button>
                <button class="btn btn-info" @click="cleanHabitat">🧹 清洁</button>
            </div>

            <div class="section-header" style="margin-top: 8px;">
                <span class="section-title">🐾 栖息地动物</span>
            </div>
            <div v-if="animals.length === 0" class="empty-state" style="padding: 20px;">
                <div class="empty-state-icon" style="font-size: 32px;">🐾</div>
                <div class="empty-state-text">这里还没有动物</div>
            </div>
            <div v-else class="grid grid-3">
                <div v-for="a in animals" :key="a.id" class="animal-card" @click="goAnimalDetail(a.id)">
                    <div class="animal-card-emoji" style="font-size: 28px;">{{ a.emoji || '🐾' }}</div>
                    <div class="animal-card-name" style="font-size: 12px;">{{ a.nickname || a.species_name }}</div>
                    <div style="font-size: 10px; color: var(--text-secondary);">{{ genderEmoji(a.gender) }} {{ statusEmoji(a.status) }}</div>
                </div>
            </div>
        </div>
    </div>
    `,
    setup() {
        const loading = ref(true);
        const habitat = ref(null);
        const animals = ref([]);
        const temperature = ref(25);

        function habitatTypeName(t) { return DwUtils.habitatTypeName(t); }
        function habitatEmoji(t) { return DwUtils.habitatTypeEmoji(t); }
        function genderEmoji(g) { return DwUtils.genderEmoji(g); }
        function statusEmoji(s) { return DwUtils.statusEmoji(s); }

        async function loadData() {
            loading.value = true;
            const id = DwRouter.getParams().id;
            if (!id) { DwRouter.navigate('habitats'); return; }
            try {
                const result = await DwApi.habitat.getDetail(id);
                if (result.code === 0) {
                    habitat.value = result.data;
                    animals.value = result.data?.animals || [];
                    temperature.value = result.data?.temperature || 25;
                }
            } catch (e) {
                DwUtils.showToast('加载失败', 'error');
            } finally {
                loading.value = false;
            }
        }

        async function upgradeHabitat() {
            if (!habitat.value) return;
            try {
                const result = await DwApi.habitat.upgrade(habitat.value.id);
                if (result.code === 0) {
                    DwUtils.showToast('升级成功！容量增加了 🎉', 'success');
                    loadData();
                } else {
                    DwUtils.showToast(result.msg || '升级失败', 'error');
                }
            } catch (e) { DwUtils.showToast('操作失败', 'error'); }
        }

        async function cleanHabitat() {
            if (!habitat.value) return;
            try {
                const result = await DwApi.habitat.clean(habitat.value.id);
                if (result.code === 0) {
                    DwUtils.showToast('清洁完成！环境焕然一新 ✨', 'success');
                    loadData();
                } else {
                    DwUtils.showToast(result.msg || '清洁失败', 'error');
                }
            } catch (e) { DwUtils.showToast('操作失败', 'error'); }
        }

        async function adjustTemp() {
            if (!habitat.value) return;
            try {
                const result = await DwApi.habitat.adjustTemp(habitat.value.id, { temperature: temperature.value });
                if (result.code === 0) {
                    DwUtils.showToast(`温度已调至 ${temperature.value}°C 🌡️`, 'info');
                } else {
                    DwUtils.showToast(result.msg || '调节失败', 'error');
                }
            } catch (e) { DwUtils.showToast('操作失败', 'error'); }
        }

        function goAnimalDetail(id) {
            DwRouter.navigate('animal-detail', { id });
        }

        onMounted(() => { loadData(); });

        return { loading, habitat, animals, temperature, habitatTypeName, habitatEmoji, genderEmoji, statusEmoji, upgradeHabitat, cleanHabitat, adjustTemp, goAnimalDetail, DwRouter };
    }
};
