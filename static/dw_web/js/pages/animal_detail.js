const AnimalDetailPage = {
    template: `
    <div>
        <div class="back-btn" @click="DwRouter.navigate('animals')">← 返回动物列表</div>

        <div v-if="loading" class="loading-page">🐾</div>
        <div v-else-if="animal">
            <div class="detail-header">
                <div class="detail-emoji" :class="{ 'animal-card-sick': animal.status === 'sick', 'animal-card-breeding': animal.status === 'breeding' }">{{ animal.emoji || '🐾' }}</div>
                <div class="detail-name">{{ animal.nickname || animal.species_name }}</div>
                <div class="detail-subtitle">
                    {{ genderText(animal.gender) }} · {{ animal.species_name }}
                    <span class="badge" :class="rarityColor(animal.rarity)">{{ rarityText(animal.rarity) }}</span>
                </div>
                <div class="detail-subtitle" style="margin-top: 4px;">
                    {{ statusEmoji(animal.status) }} {{ statusText(animal.status) }}
                    <span v-if="animal.habitat_name">· 🏡 {{ animal.habitat_name }}</span>
                </div>
            </div>

            <div class="detail-stats">
                <div class="detail-stat">
                    <div class="detail-stat-icon">❤️</div>
                    <div class="detail-stat-value" :style="{ color: barColor(animal.health) }">{{ animal.health || 0 }}%</div>
                    <div class="detail-stat-label">健康</div>
                </div>
                <div class="detail-stat">
                    <div class="detail-stat-icon">🍖</div>
                    <div class="detail-stat-value" :style="{ color: barColor(animal.hunger) }">{{ animal.hunger || 0 }}%</div>
                    <div class="detail-stat-label">饱食</div>
                </div>
                <div class="detail-stat">
                    <div class="detail-stat-icon">😊</div>
                    <div class="detail-stat-value" :style="{ color: barColor(animal.happiness) }">{{ animal.happiness || 0 }}%</div>
                    <div class="detail-stat-label">心情</div>
                </div>
            </div>

            <div class="card" style="margin-bottom: 12px;">
                <div class="card-body">
                    <div class="progress-label"><span>❤️ 生命值</span><span>{{ animal.health || 0 }}%</span></div>
                    <div class="progress-bar progress-lg"><div class="progress-fill" :class="healthClass(animal.health)" :style="{ width: (animal.health || 0) + '%' }"></div></div>

                    <div class="progress-label" style="margin-top: 12px;"><span>🍖 饱食度</span><span>{{ animal.hunger || 0 }}%</span></div>
                    <div class="progress-bar progress-lg"><div class="progress-fill hunger" :style="{ width: (animal.hunger || 0) + '%' }"></div></div>

                    <div class="progress-label" style="margin-top: 12px;"><span>😊 心情值</span><span>{{ animal.happiness || 0 }}%</span></div>
                    <div class="progress-bar progress-lg"><div class="progress-fill happiness" :style="{ width: (animal.happiness || 0) + '%' }"></div></div>
                </div>
            </div>

            <div v-if="animal.status === 'sick' && animal.disease" class="card" style="margin-bottom: 12px; border: 2px solid #ef4444;">
                <div class="card-header" style="background: #fee2e2;">
                    <span class="card-title">🤒 疾病信息</span>
                </div>
                <div class="card-body">
                    <p><strong>{{ animal.disease.name }}</strong></p>
                    <p style="font-size: 13px; color: var(--text-secondary);">{{ animal.disease.description }}</p>
                    <p style="margin-top: 8px;">治疗费用: <span class="coins-display">🪙 {{ formatNumber(animal.disease.cure_cost || 0) }}</span></p>
                    <button class="btn btn-danger btn-sm" style="margin-top: 8px;" @click="cureAnimal">💊 治疗</button>
                </div>
            </div>

            <div v-if="animal.status === 'breeding' && animal.breeding" class="card" style="margin-bottom: 12px; border: 2px solid #3b82f6;">
                <div class="card-header" style="background: #dbeafe;">
                    <span class="card-title">🥚 繁殖中</span>
                </div>
                <div class="card-body">
                    <p>预计剩余: {{ formatTime(animal.breeding.remaining_seconds || 0) }}</p>
                    <div class="progress-bar progress-lg" style="margin-top: 8px;">
                        <div class="progress-fill" style="background: linear-gradient(90deg, #3b82f6, #60a5fa); width: 50%;"></div>
                    </div>
                </div>
            </div>

            <div class="card" style="margin-bottom: 12px;">
                <div class="card-header">
                    <span class="card-title">📊 详细属性</span>
                </div>
                <div class="card-body" style="font-size: 13px;">
                    <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border-color);">
                        <span style="color: var(--text-secondary);">种类</span><span>{{ categoryText(animal.category) }}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border-color);">
                        <span style="color: var(--text-secondary);">年龄</span><span>{{ animal.age || 0 }} 岁</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border-color);">
                        <span style="color: var(--text-secondary);">稀有度</span><span class="badge" :class="rarityColor(animal.rarity)">{{ rarityText(animal.rarity) }}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 6px 0;">
                        <span style="color: var(--text-secondary);">售价</span><span class="coins-display">🪙 {{ formatNumber(animal.sell_price || 0) }}</span>
                    </div>
                </div>
            </div>

            <div class="action-bar">
                <button class="btn btn-primary" @click="feedAnimal">🍖 喂食</button>
                <button class="btn btn-info" @click="petAnimal">🤗 抚摸</button>
                <button class="btn btn-warning" @click="showMoveModal">🏡 移动</button>
                <button class="btn btn-danger" @click="confirmSell">💰 出售</button>
            </div>
        </div>
    </div>
    `,
    setup(props) {
        const loading = ref(true);
        const animal = ref(null);
        const habitats = ref([]);

        function rarityColor(r) { return DwUtils.rarityColor(r); }
        function rarityText(r) { return DwUtils.rarityText(r); }
        function statusText(s) { return DwUtils.statusText(s); }
        function statusEmoji(s) { return DwUtils.statusEmoji(s); }
        function genderText(g) { return DwUtils.genderText(g); }
        function categoryText(c) { return DwUtils.categoryText(c); }
        function formatNumber(n) { return DwUtils.formatNumber(n); }
        function formatTime(s) { return DwUtils.formatTime(s); }
        function barColor(v) { return DwUtils.barColor(v); }
        function healthClass(v) { return v >= 50 ? 'health' : 'hunger'; }

        async function loadData() {
            loading.value = true;
            const id = DwRouter.getParams().id;
            if (!id) { DwRouter.navigate('animals'); return; }
            try {
                const [animalRes, habitatRes] = await Promise.all([
                    DwApi.animal.getDetail(id),
                    DwApi.habitat.getMyHabitats()
                ]);
                if (animalRes.code === 0) animal.value = animalRes.data;
                if (habitatRes.code === 0) habitats.value = habitatRes.data || [];
            } catch (e) {
                DwUtils.showToast('加载失败', 'error');
            } finally {
                loading.value = false;
            }
        }

        async function feedAnimal() {
            if (!animal.value) return;
            try {
                const result = await DwApi.animal.feed(animal.value.id);
                if (result.code === 0) {
                    DwUtils.showToast('喂食成功 🍖', 'success');
                    loadData();
                } else {
                    DwUtils.showToast(result.msg || '喂食失败', 'error');
                }
            } catch (e) { DwUtils.showToast('操作失败', 'error'); }
        }

        async function petAnimal() {
            if (!animal.value) return;
            try {
                const result = await DwApi.animal.pet(animal.value.id);
                if (result.code === 0) {
                    DwUtils.showToast('抚摸成功 😊', 'success');
                    loadData();
                } else {
                    DwUtils.showToast(result.msg || '抚摸失败', 'error');
                }
            } catch (e) { DwUtils.showToast('操作失败', 'error'); }
        }

        async function cureAnimal() {
            if (!animal.value || !animal.value.disease) return;
            try {
                const result = await DwApi.disease.cure(animal.value.id);
                if (result.code === 0) {
                    DwUtils.showToast('治疗成功！动物恢复了健康 💚', 'success');
                    loadData();
                } else {
                    DwUtils.showToast(result.msg || '治疗失败', 'error');
                }
            } catch (e) { DwUtils.showToast('操作失败', 'error'); }
        }

        function showMoveModal() {
            if (!animal.value) return;
            const options = habitats.value.map(h => `<option value="${h.id}">${DwUtils.habitatTypeEmoji(h.type)} ${h.name} (${h.animal_count || 0}/${h.capacity || 0})</option>`).join('');
            const body = `<div class="form-group"><label class="form-label">选择栖息地</label><select id="moveHabitatSelect" class="form-control"><option value="">请选择</option>${options}</select></div>`;
            DwUI.showModal('移动动物', body, () => {
                const select = document.getElementById('moveHabitatSelect');
                const habitatId = select ? select.value : '';
                if (habitatId) {
                    DwApi.animal.move(animal.value.id, { habitat_id: habitatId }).then(result => {
                        if (result.code === 0) {
                            DwUtils.showToast('移动成功 🏡', 'success');
                            loadData();
                        } else {
                            DwUtils.showToast(result.msg || '移动失败', 'error');
                        }
                    }).catch(() => DwUtils.showToast('操作失败', 'error'));
                }
            });
        }

        function confirmSell() {
            if (!animal.value) return;
            const body = `<p style="text-align:center;">确定要出售 <strong>${animal.value.nickname || animal.value.species_name}</strong> 吗？</p><p style="text-align:center; margin-top:8px;">将获得 <span class="coins-display">🪙 ${formatNumber(animal.value.sell_price || 0)}</span></p>`;
            DwUI.showModal('确认出售', body, () => {
                DwApi.animal.sell(animal.value.id).then(result => {
                    if (result.code === 0) {
                        DwUtils.showToast('出售成功 💰', 'success');
                        DwRouter.navigate('animals');
                    } else {
                        DwUtils.showToast(result.msg || '出售失败', 'error');
                    }
                }).catch(() => DwUtils.showToast('操作失败', 'error'));
            });
        }

        onMounted(() => { loadData(); });

        return {
            loading, animal, habitats, rarityColor, rarityText, statusText, statusEmoji,
            genderText, categoryText, formatNumber, formatTime, barColor, healthClass,
            feedAnimal, petAnimal, cureAnimal, showMoveModal, confirmSell, DwRouter
        };
    }
};
