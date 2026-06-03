(function() {
const { ref, computed, onMounted } = Vue;

const EquipmentPage = {
    name: 'EquipmentPage',
    setup() {
        const loading = ref(true);
        const activeTab = ref('shop');
        const selectedEquipment = ref(null);

        const user = computed(() => GameStore.state.user);
        const coins = computed(() => GameStore.getters.coins.value);
        const allEquipment = computed(() => GameStore.getAllEquipment());
        const myEquipment = computed(() => GameStore.state.equipment);
        const equipped = computed(() => GameStore.state.equipped);
        const equipmentTypes = computed(() => GameStore.getEquipmentTypes());

        const shopEquipmentByType = computed(() => {
            return equipmentTypes.value.map(type => ({
                ...type,
                items: allEquipment.value.filter(e => e.type === type.code)
            }));
        });

        const myEquipmentByType = computed(() => {
            return equipmentTypes.value.map(type => ({
                ...type,
                items: myEquipment.value.filter(e => e.type === type.code)
            }));
        });

        const isOwned = (equipmentId) => {
            return myEquipment.value.some(e => e.id === equipmentId);
        };

        const getOwnedEquipment = (equipmentId) => {
            return myEquipment.value.find(e => e.id === equipmentId);
        };

        const isEquipped = (equipmentId) => {
            const equipment = allEquipment.value.find(e => e.id === equipmentId);
            if (!equipment) return false;
            return equipped.value[equipment.type] === equipmentId;
        };

        const getEquippedItem = (type) => {
            const equipmentId = equipped.value[type];
            if (!equipmentId) return null;
            return myEquipment.value.find(e => e.id === equipmentId);
        };

        const getUpgradeCost = (equipment) => {
            const owned = getOwnedEquipment(equipment.id);
            if (!owned) return equipment.price;
            return equipment.price * owned.level;
        };

        const handleBuyEquipment = (equipmentId) => {
            GameStore.buyEquipment(equipmentId);
        };

        const handleUpgradeEquipment = (equipmentId) => {
            GameStore.upgradeEquipment(equipmentId);
        };

        const handleEquip = (equipmentId) => {
            GameStore.equipItem(equipmentId);
        };

        const handleUnequip = (type) => {
            GameStore.unequipItem(type);
        };

        const showEquipmentDetail = (equipment) => {
            selectedEquipment.value = equipment;
        };

        const closeEquipmentDetail = () => {
            selectedEquipment.value = null;
        };

        const getTypeName = (typeCode) => {
            const type = equipmentTypes.value.find(t => t.code === typeCode);
            return type ? type.name : typeCode;
        };

        const getTypeIcon = (typeCode) => {
            const type = equipmentTypes.value.find(t => t.code === typeCode);
            return type ? type.icon : '📦';
        };

        onMounted(async () => {
            try {
                await GameStore.loadUserEquipment();
            } catch (error) {
                console.error('加载装备数据失败:', error);
            } finally {
                loading.value = false;
            }
        });

        return {
            loading,
            activeTab,
            selectedEquipment,
            user,
            coins,
            allEquipment,
            myEquipment,
            equipped,
            equipmentTypes,
            shopEquipmentByType,
            myEquipmentByType,
            isOwned,
            getOwnedEquipment,
            isEquipped,
            getEquippedItem,
            getUpgradeCost,
            handleBuyEquipment,
            handleUpgradeEquipment,
            handleEquip,
            handleUnequip,
            showEquipmentDetail,
            closeEquipmentDetail,
            getTypeName,
            getTypeIcon
        };
    },
    template: `
        <div class="equipment-page">
            <div class="page-header">
                <h2 class="page-title">⚔️ 装备系统</h2>
                <p class="page-subtitle">购买和升级装备，提升你的属性</p>
            </div>

            <div class="stats-card">
                <div class="stat-item">
                    <span class="stat-icon">💰</span>
                    <div class="stat-info">
                        <div class="stat-label">金币</div>
                        <div class="stat-value">{{ coins }}</div>
                    </div>
                </div>
                <div class="stat-item">
                    <span class="stat-icon">⚔️</span>
                    <div class="stat-info">
                        <div class="stat-label">已拥有</div>
                        <div class="stat-value">{{ myEquipment.length }}/{{ allEquipment.length }}</div>
                    </div>
                </div>
                <div class="stat-item">
                    <span class="stat-icon">🛡️</span>
                    <div class="stat-info">
                        <div class="stat-label">已装备</div>
                        <div class="stat-value">{{ Object.values(equipped).filter(Boolean).length }}/3</div>
                    </div>
                </div>
                <div class="stat-item">
                    <span class="stat-icon">📦</span>
                    <div class="stat-info">
                        <div class="stat-label">装备类型</div>
                        <div class="stat-value">{{ equipmentTypes.length }}</div>
                    </div>
                </div>
            </div>

            <div class="equipped-section">
                <h3 class="section-title">当前装备</h3>
                <div class="equipped-grid">
                    <div
                        v-for="type in equipmentTypes"
                        :key="type.code"
                        class="equipped-slot"
                    >
                        <div class="slot-label">
                            <span class="slot-icon">{{ type.icon }}</span>
                            <span>{{ type.name }}</span>
                        </div>
                        <div class="slot-content" v-if="getEquippedItem(type.code)">
                            <div class="equipped-item">
                                <span class="item-icon">{{ getEquippedItem(type.code).icon }}</span>
                                <div class="item-info">
                                    <div class="item-name">{{ getEquippedItem(type.code).name }}</div>
                                    <div class="item-level">Lv.{{ getEquippedItem(type.code).level }}</div>
                                </div>
                            </div>
                            <button class="btn btn-sm btn-secondary" @click="handleUnequip(type.code)">
                                卸下
                            </button>
                        </div>
                        <div class="slot-empty" v-else>
                            <span>未装备</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="page-tabs">
                <div
                    class="tab-item"
                    :class="{ active: activeTab === 'shop' }"
                    @click="activeTab = 'shop'"
                >
                    🛒 装备商店
                </div>
                <div
                    class="tab-item"
                    :class="{ active: activeTab === 'inventory' }"
                    @click="activeTab = 'inventory'"
                >
                    🎒 我的装备
                </div>
            </div>

            <div class="shop-section" v-if="activeTab === 'shop' && !loading">
                <div
                    v-for="typeGroup in shopEquipmentByType"
                    :key="typeGroup.code"
                    class="equipment-type-section"
                >
                    <h4 class="type-title">
                        <span class="type-icon">{{ typeGroup.icon }}</span>
                        {{ typeGroup.name }}
                    </h4>
                    <div class="equipment-grid">
                        <div
                            v-for="equipment in typeGroup.items"
                            :key="equipment.id"
                            class="equipment-card"
                            :class="{ owned: isOwned(equipment.id) }"
                            @click="showEquipmentDetail(equipment)"
                        >
                            <div class="equipment-icon">{{ equipment.icon }}</div>
                            <div class="equipment-name">{{ equipment.name }}</div>
                            <div class="equipment-stats">
                                <span v-if="equipment.attack > 0" class="stat">⚔️ +{{ equipment.attack }}</span>
                                <span v-if="equipment.defense > 0" class="stat">🛡️ +{{ equipment.defense }}</span>
                                <span v-if="equipment.hp > 0" class="stat">❤️ +{{ equipment.hp }}</span>
                                <span v-if="equipment.chakra > 0" class="stat">💫 +{{ equipment.chakra }}</span>
                            </div>
                            <div class="equipment-footer">
                                <span v-if="!isOwned(equipment.id)" class="price">
                                    💰 {{ equipment.price }}
                                </span>
                                <span v-else class="owned-tag">已拥有</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="inventory-section" v-if="activeTab === 'inventory' && !loading">
                <div
                    v-for="typeGroup in myEquipmentByType"
                    :key="typeGroup.code"
                    class="equipment-type-section"
                >
                    <h4 class="type-title">
                        <span class="type-icon">{{ typeGroup.icon }}</span>
                        {{ typeGroup.name }}
                        <span class="type-count">({{ typeGroup.items.length }})</span>
                    </h4>
                    <div class="equipment-grid" v-if="typeGroup.items.length > 0">
                        <div
                            v-for="equipment in typeGroup.items"
                            :key="equipment.id"
                            class="equipment-card owned"
                            :class="{ equipped: isEquipped(equipment.id) }"
                            @click="showEquipmentDetail(equipment)"
                        >
                            <div class="equipment-icon">{{ equipment.icon }}</div>
                            <div class="equipment-name">{{ equipment.name }}</div>
                            <div class="equipment-level">Lv.{{ equipment.level }}</div>
                            <div class="equipment-stats">
                                <span v-if="equipment.attack > 0" class="stat">⚔️ +{{ equipment.attack }}</span>
                                <span v-if="equipment.defense > 0" class="stat">🛡️ +{{ equipment.defense }}</span>
                                <span v-if="equipment.hp > 0" class="stat">❤️ +{{ equipment.hp }}</span>
                                <span v-if="equipment.chakra > 0" class="stat">💫 +{{ equipment.chakra }}</span>
                            </div>
                            <div class="equipment-footer">
                                <span v-if="isEquipped(equipment.id)" class="equipped-tag">已装备</span>
                                <span v-else class="upgrade-cost">升级: 💰 {{ getUpgradeCost(equipment) }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="empty-state" v-else>
                        <p>暂无{{ typeGroup.name }}</p>
                    </div>
                </div>
            </div>

            <div class="loading-state" v-if="loading">
                <p>加载中...</p>
            </div>

            <div class="equipment-detail-modal" v-if="selectedEquipment" @click.self="closeEquipmentDetail">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="equipment-icon-large">{{ selectedEquipment.icon }}</div>
                        <h3 class="modal-title">{{ selectedEquipment.name }}</h3>
                        <button class="close-btn" @click="closeEquipmentDetail">✕</button>
                    </div>

                    <div class="modal-body">
                        <div class="equipment-type-badge">
                            {{ getTypeIcon(selectedEquipment.type) }} {{ getTypeName(selectedEquipment.type) }}
                        </div>
                        <p class="equipment-description">{{ selectedEquipment.description }}</p>

                        <div class="detail-stats">
                            <div class="detail-stat" v-if="isOwned(selectedEquipment.id)">
                                <span class="detail-label">等级</span>
                                <span class="detail-value">Lv.{{ getOwnedEquipment(selectedEquipment.id).level }}/10</span>
                            </div>
                            <div class="detail-stat">
                                <span class="detail-label">攻击力</span>
                                <span class="detail-value">+{{ isOwned(selectedEquipment.id) ? getOwnedEquipment(selectedEquipment.id).attack : selectedEquipment.attack }}</span>
                            </div>
                            <div class="detail-stat">
                                <span class="detail-label">防御力</span>
                                <span class="detail-value">+{{ isOwned(selectedEquipment.id) ? getOwnedEquipment(selectedEquipment.id).defense : selectedEquipment.defense }}</span>
                            </div>
                            <div class="detail-stat">
                                <span class="detail-label">生命值</span>
                                <span class="detail-value">+{{ isOwned(selectedEquipment.id) ? getOwnedEquipment(selectedEquipment.id).hp : selectedEquipment.hp }}</span>
                            </div>
                            <div class="detail-stat">
                                <span class="detail-label">查克拉</span>
                                <span class="detail-value">+{{ isOwned(selectedEquipment.id) ? getOwnedEquipment(selectedEquipment.id).chakra : selectedEquipment.chakra }}</span>
                            </div>
                        </div>

                        <div class="modal-actions">
                            <button
                                v-if="!isOwned(selectedEquipment.id)"
                                class="btn btn-primary"
                                @click="handleBuyEquipment(selectedEquipment.id)"
                                :disabled="coins < selectedEquipment.price"
                            >
                                购买 (💰 {{ selectedEquipment.price }})
                            </button>
                            <template v-else>
                                <button
                                    class="btn btn-success"
                                    @click="handleUpgradeEquipment(selectedEquipment.id)"
                                    :disabled="getOwnedEquipment(selectedEquipment.id).level >= 10 || coins < getUpgradeCost(selectedEquipment)"
                                >
                                    升级 (💰 {{ getUpgradeCost(selectedEquipment) }})
                                </button>
                                <button
                                    v-if="!isEquipped(selectedEquipment.id)"
                                    class="btn btn-primary"
                                    @click="handleEquip(selectedEquipment.id)"
                                >
                                    装备
                                </button>
                                <button
                                    v-else
                                    class="btn btn-danger"
                                    @click="handleUnequip(selectedEquipment.type)"
                                >
                                    卸下
                                </button>
                            </template>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};

const EquipmentPageWrapper = {
    render() {
        return Vue.h(MainLayout, {
            currentPage: 'equipment',
            onNavigate: (pageId) => {
                Router.navigate(pageId);
            }
        }, {
            default: () => Vue.h(EquipmentPage)
        });
    }
};

window.EquipmentPage = EquipmentPage;
window.EquipmentPageWrapper = EquipmentPageWrapper;
})();
