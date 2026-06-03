const HabitatListPage = {
    template: `
    <div>
        <div class="section-header">
            <span class="section-title">🏡 我的栖息地</span>
            <span class="section-action" @click="showBuildModal">🔨 建造新栖息地</span>
        </div>

        <div v-if="loading" class="loading-page">🏡</div>
        <div v-else-if="habitats.length === 0" class="empty-state">
            <div class="empty-state-icon">🏡</div>
            <div class="empty-state-text">还没有栖息地，建造一个吧！</div>
            <button class="btn btn-primary" style="margin-top: 16px;" @click="showBuildModal">🔨 建造栖息地</button>
        </div>
        <div v-else class="grid grid-2">
            <div v-for="hab in habitats" :key="hab.id" class="habitat-card" @click="goDetail(hab.id)">
                <div class="habitat-icon">{{ habitatEmoji(hab.type) }}</div>
                <div class="habitat-name">{{ hab.name }}</div>
                <div class="habitat-meta">{{ habitatTypeName(hab.type) }} · Lv.{{ hab.level || 1 }}</div>
                <div style="margin-top: 8px;">
                    <div class="progress-label"><span>🧹 清洁度</span><span>{{ hab.cleanliness || 0 }}%</span></div>
                    <div class="progress-bar"><div class="progress-fill clean" :style="{ width: (hab.cleanliness || 0) + '%' }"></div></div>
                </div>
                <div style="margin-top: 4px;">
                    <div class="progress-label"><span>🛋️ 舒适度</span><span>{{ hab.comfort || 0 }}%</span></div>
                    <div class="progress-bar"><div class="progress-fill comfort" :style="{ width: (hab.comfort || 0) + '%' }"></div></div>
                </div>
                <div style="margin-top: 6px; font-size: 12px; color: var(--text-secondary); text-align: center;">
                    🐾 {{ hab.animal_count || 0 }}/{{ hab.capacity || 0 }}
                    <span v-if="hab.temperature"> · 🌡️ {{ hab.temperature }}°C</span>
                </div>
            </div>
        </div>
    </div>
    `,
    setup() {
        const loading = ref(true);
        const habitats = ref([]);

        function habitatTypeName(t) { return DwUtils.habitatTypeName(t); }
        function habitatEmoji(t) { return DwUtils.habitatTypeEmoji(t); }

        async function loadData() {
            loading.value = true;
            try {
                const result = await DwApi.habitat.getMyHabitats();
                if (result.code === 0) habitats.value = result.data || [];
            } catch (e) {
                DwUtils.showToast('加载失败', 'error');
            } finally {
                loading.value = false;
            }
        }

        function showBuildModal() {
            const types = [
                { value: 'forest', label: '🌲 森林' },
                { value: 'savanna', label: '🌾 草原' },
                { value: 'ocean', label: '🌊 海洋' },
                { value: 'desert', label: '🏜️ 沙漠' },
                { value: 'arctic', label: '❄️ 极地' },
                { value: 'wetland', label: '🐊 湿地' },
                { value: 'mountain', label: '⛰️ 山地' },
                { value: 'rainforest', label: '🌴 热带雨林' }
            ];
            const options = types.map(t => `<option value="${t.value}">${t.label}</option>`).join('');
            const body = `
                <div class="form-group">
                    <label class="form-label">栖息地名称</label>
                    <input id="buildName" class="form-control" placeholder="给栖息地取个名字">
                </div>
                <div class="form-group">
                    <label class="form-label">栖息地类型</label>
                    <select id="buildType" class="form-control">${options}</select>
                </div>`;
            DwUI.showModal('🔨 建造新栖息地', body, () => {
                const name = document.getElementById('buildName')?.value;
                const type = document.getElementById('buildType')?.value;
                if (!name) { DwUtils.showToast('请输入名称', 'warning'); return; }
                DwApi.habitat.build({ name, type }).then(result => {
                    if (result.code === 0) {
                        DwUtils.showToast('建造成功！新的栖息地已就绪 🎉', 'success');
                        loadData();
                    } else {
                        DwUtils.showToast(result.msg || '建造失败', 'error');
                    }
                }).catch(() => DwUtils.showToast('操作失败', 'error'));
            });
        }

        function goDetail(id) {
            DwRouter.navigate('habitat-detail', { id });
        }

        onMounted(() => { loadData(); });

        return { loading, habitats, habitatTypeName, habitatEmoji, showBuildModal, goDetail };
    }
};
