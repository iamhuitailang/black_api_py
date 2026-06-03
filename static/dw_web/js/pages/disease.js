const DiseasePage = {
    template: `
    <div>
        <div class="section-header">
            <span class="section-title">🏥 医疗中心</span>
            <span class="section-action" @click="randomCheck">🔍 全员体检</span>
        </div>

        <div v-if="loading" class="loading-page">🏥</div>
        <div v-else>
            <div class="section-header">
                <span class="section-title">🤒 生病动物</span>
            </div>
            <div v-if="sickAnimals.length === 0" class="empty-state" style="padding: 20px;">
                <div class="empty-state-icon" style="font-size: 32px;">💚</div>
                <div class="empty-state-text">所有动物都很健康！</div>
            </div>
            <div v-else>
                <div v-for="animal in sickAnimals" :key="animal.id" class="disease-card">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="disease-icon">{{ animal.emoji || '🐾' }}</div>
                        <div style="flex: 1;">
                            <div style="font-weight: 600;">{{ animal.nickname || animal.species_name }}</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">{{ animal.disease_name || '未知疾病' }}</div>
                            <div style="font-size: 12px; color: var(--danger-color);">❤️ {{ animal.health || 0 }}%</div>
                        </div>
                        <button class="btn btn-danger btn-sm" @click="cureAnimal(animal.id)">💊 治疗</button>
                    </div>
                    <div v-if="animal.disease_description" style="margin-top: 8px; font-size: 12px; color: var(--text-secondary); padding-left: 44px;">
                        {{ animal.disease_description }}
                    </div>
                    <div v-if="animal.cure_cost" style="margin-top: 4px; font-size: 12px; padding-left: 44px;">
                        治疗费用: <span class="coins-display">🪙 {{ formatNumber(animal.cure_cost) }}</span>
                    </div>
                </div>
            </div>

            <div class="section-header" style="margin-top: 16px;">
                <span class="section-title">📖 疾病百科</span>
            </div>
            <div v-if="diseases.length === 0" class="empty-state" style="padding: 20px;">
                <div class="empty-state-text">暂无疾病信息</div>
            </div>
            <div v-else class="grid grid-2">
                <div v-for="d in diseases" :key="d.id || d.name" class="card" style="margin-bottom: 0;">
                    <div class="card-body" style="padding: 12px;">
                        <div style="font-size: 20px; margin-bottom: 4px;">{{ d.icon || '🦠' }}</div>
                        <div style="font-weight: 600; font-size: 13px;">{{ d.name }}</div>
                        <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">{{ d.description }}</div>
                        <div style="margin-top: 4px; font-size: 11px;">
                            <span class="coins-display">🪙 {{ formatNumber(d.cure_cost || 0) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    setup() {
        const loading = ref(true);
        const sickAnimals = ref([]);
        const diseases = ref([]);

        function formatNumber(n) { return DwUtils.formatNumber(n); }

        async function loadData() {
            loading.value = true;
            try {
                const [sickRes, diseaseRes] = await Promise.all([
                    DwApi.disease.getSick(),
                    DwApi.disease.getList()
                ]);
                if (sickRes.code === 0) sickAnimals.value = sickRes.data || [];
                if (diseaseRes.code === 0) diseases.value = diseaseRes.data || [];
            } catch (e) {
                DwUtils.showToast('加载失败', 'error');
            } finally {
                loading.value = false;
            }
        }

        async function cureAnimal(id) {
            try {
                const result = await DwApi.disease.cure(id);
                if (result.code === 0) {
                    DwUtils.showToast('治疗成功！动物恢复了健康 💚', 'success');
                    loadData();
                } else {
                    DwUtils.showToast(result.msg || '治疗失败', 'error');
                }
            } catch (e) {
                DwUtils.showToast('治疗失败', 'error');
            }
        }

        async function randomCheck() {
            try {
                const result = await DwApi.disease.randomCheck();
                if (result.code === 0) {
                    const sickCount = result.data?.sickCount || 0;
                    if (sickCount > 0) {
                        DwUtils.showToast(`体检发现 ${sickCount} 只动物生病了！`, 'warning');
                    } else {
                        DwUtils.showToast('体检完毕，所有动物都很健康 💚', 'success');
                    }
                    loadData();
                } else {
                    DwUtils.showToast(result.msg || '体检失败', 'error');
                }
            } catch (e) {
                DwUtils.showToast('体检失败', 'error');
            }
        }

        onMounted(() => { loadData(); });

        return { loading, sickAnimals, diseases, formatNumber, cureAnimal, randomCheck };
    }
};
