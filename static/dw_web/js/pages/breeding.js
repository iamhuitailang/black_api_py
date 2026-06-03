const BreedingPage = {
    template: `
    <div>
        <div class="section-header">
            <span class="section-title">🥚 繁殖中心</span>
            <span class="section-action" @click="showStartModal">➕ 开始繁殖</span>
        </div>

        <div v-if="loading" class="loading-page">🥚</div>
        <div v-else>
            <div v-if="activeBreedings.length > 0">
                <div class="section-header">
                    <span class="section-title">🔄 进行中</span>
                </div>
                <div v-for="b in activeBreedings" :key="b.id" class="breeding-card">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 28px;">{{ b.male_emoji || '🐾' }}</span>
                        <span style="font-size: 20px;">❤️</span>
                        <span style="font-size: 28px;">{{ b.female_emoji || '🐾' }}</span>
                        <div style="flex: 1; margin-left: 8px;">
                            <div style="font-weight: 600;">{{ b.species_name }}</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">{{ b.male_name }} × {{ b.female_name }}</div>
                        </div>
                    </div>
                    <div class="breeding-progress">
                        <div class="progress-bar progress-lg">
                            <div class="progress-fill" style="background: linear-gradient(90deg, #3b82f6, #8b5cf6);" :style="{ width: b.progress + '%' }"></div>
                        </div>
                    </div>
                    <div class="breeding-timer">{{ formatTime(b.remaining_seconds || 0) }}</div>
                    <div style="text-align: center; font-size: 12px; color: var(--text-secondary);">
                        进度 {{ b.progress || 0 }}%
                    </div>
                </div>
            </div>

            <div v-if="activeBreedings.length === 0" class="empty-state" style="padding: 30px;">
                <div class="empty-state-icon" style="font-size: 48px;">🥚</div>
                <div class="empty-state-text">没有正在进行的繁殖</div>
                <button class="btn btn-primary btn-sm" style="margin-top: 12px;" @click="showStartModal">➕ 开始繁殖</button>
            </div>

            <div class="section-header" style="margin-top: 16px;">
                <span class="section-title">📜 繁殖记录</span>
            </div>
            <div v-if="records.length === 0" class="empty-state" style="padding: 20px;">
                <div class="empty-state-text">暂无繁殖记录</div>
            </div>
            <div v-else>
                <div v-for="r in records" :key="r.id" class="card" style="margin-bottom: 8px;">
                    <div class="card-body" style="padding: 12px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 20px;">{{ r.male_emoji || '🐾' }}</span>
                            <span>❤️</span>
                            <span style="font-size: 20px;">{{ r.female_emoji || '🐾' }}</span>
                        </div>
                        <div style="margin-top: 6px; font-size: 13px;">
                            <span :class="r.success ? 'badge badge-success' : 'badge badge-danger'">{{ r.success ? '✅ 成功' : '❌ 失败' }}</span>
                            <span style="margin-left: 8px; color: var(--text-secondary);">{{ formatDate(r.created_at) }}</span>
                        </div>
                        <div v-if="r.success && r.baby_name" style="margin-top: 4px; font-size: 13px;">
                            🎉 新生宝宝: {{ r.baby_emoji || '🐾' }} {{ r.baby_name }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    setup() {
        const loading = ref(true);
        const activeBreedings = ref([]);
        const records = ref([]);
        const myAnimals = ref([]);
        let timer = null;

        function formatTime(s) { return DwUtils.formatTime(s); }
        function formatDate(d) { return DwUtils.formatDate(d); }

        async function loadData() {
            loading.value = true;
            try {
                const [breedRes, recordRes] = await Promise.all([
                    DwApi.breed.check(),
                    DwApi.breed.getRecords({ page: 1, page_size: 20 })
                ]);
                if (breedRes.code === 0) activeBreedings.value = breedRes.data?.active || [];
                if (recordRes.code === 0) records.value = recordRes.data?.items || recordRes.data || [];
            } catch (e) {
                DwUtils.showToast('加载失败', 'error');
            } finally {
                loading.value = false;
            }
        }

        async function loadAnimals() {
            try {
                const result = await DwApi.animal.getMyAnimals();
                if (result.code === 0) myAnimals.value = result.data || [];
            } catch (e) { /* ignore */ }
        }

        function showStartModal() {
            loadAnimals();
            const males = myAnimals.value.filter(a => a.gender === 'male' && a.status === 'healthy');
            const females = myAnimals.value.filter(a => a.gender === 'female' && a.status === 'healthy');

            const maleOptions = males.map(a => `<option value="${a.id}">${a.emoji || '🐾'} ${a.nickname || a.species_name}</option>`).join('');
            const femaleOptions = females.map(a => `<option value="${a.id}">${a.emoji || '🐾'} ${a.nickname || a.species_name}</option>`).join('');

            if (!maleOptions || !femaleOptions) {
                DwUtils.showToast('需要健康的成年雄性和雌性动物才能繁殖', 'warning');
                return;
            }

            const body = `
                <div class="form-group">
                    <label class="form-label">♂️ 选择雄性</label>
                    <select id="breedMale" class="form-control"><option value="">请选择</option>${maleOptions}</select>
                </div>
                <div class="form-group">
                    <label class="form-label">♀️ 选择雌性</label>
                    <select id="breedFemale" class="form-control"><option value="">请选择</option>${femaleOptions}</select>
                </div>
                <div style="font-size: 12px; color: var(--text-secondary);">💡 需要同物种的雌雄配对</div>`;

            DwUI.showModal('🥚 开始繁殖', body, () => {
                const maleId = document.getElementById('breedMale')?.value;
                const femaleId = document.getElementById('breedFemale')?.value;
                if (!maleId || !femaleId) { DwUtils.showToast('请选择配对动物', 'warning'); return; }
                DwApi.breed.start({ male_id: maleId, female_id: femaleId }).then(result => {
                    if (result.code === 0) {
                        DwUtils.showToast('繁殖开始！期待新生命的到来 🥚', 'success');
                        loadData();
                    } else {
                        DwUtils.showToast(result.msg || '繁殖失败', 'error');
                    }
                }).catch(() => DwUtils.showToast('操作失败', 'error'));
            });
        }

        function startTimer() {
            timer = setInterval(() => {
                activeBreedings.value.forEach(b => {
                    if (b.remaining_seconds > 0) {
                        b.remaining_seconds--;
                        b.progress = Math.min(100, b.progress + (100 / (b.total_seconds || 300)));
                    }
                });
            }, 1000);
        }

        onMounted(() => {
            loadData();
            startTimer();
        });

        onUnmounted(() => {
            if (timer) clearInterval(timer);
        });

        return { loading, activeBreedings, records, formatTime, formatDate, showStartModal };
    }
};
