(function() {
const { ref, computed, onMounted } = Vue;

const ToolsPage = {
    name: 'ToolsPage',
    setup() {
        const loading = ref(true);
        const activeTab = ref('shop');
        const selectedTool = ref(null);
        const buyQuantity = ref(1);

        const user = computed(() => GameStore.state.user);
        const coins = computed(() => GameStore.getters.coins.value);
        const allTools = computed(() => GameStore.getAllTools());
        const myTools = computed(() => GameStore.state.tools);
        const toolTypes = computed(() => GameStore.getToolTypes());

        const shopToolsByType = computed(() => {
            return toolTypes.value.map(type => ({
                ...type,
                items: allTools.value.filter(t => t.type === type.code)
            }));
        });

        const myToolsByType = computed(() => {
            return toolTypes.value.map(type => ({
                ...type,
                items: myTools.value.filter(t => t.type === type.code)
            }));
        });

        const isOwned = (toolId) => {
            return myTools.value.some(t => t.id === toolId);
        };

        const getOwnedTool = (toolId) => {
            return myTools.value.find(t => t.id === toolId);
        };

        const getToolQuantity = (toolId) => {
            const tool = getOwnedTool(toolId);
            return tool ? tool.quantity : 0;
        };

        const getTotalCost = (tool) => {
            return tool.price * buyQuantity.value;
        };

        const handleBuyTools = (toolId) => {
            GameStore.buyTools(toolId, buyQuantity.value);
            buyQuantity.value = 1;
        };

        const handleUseTool = (toolId) => {
            GameStore.useTool(toolId);
        };

        const showToolDetail = (tool) => {
            selectedTool.value = tool;
            buyQuantity.value = 1;
        };

        const closeToolDetail = () => {
            selectedTool.value = null;
            buyQuantity.value = 1;
        };

        const increaseQuantity = () => {
            if (buyQuantity.value < 99) {
                buyQuantity.value++;
            }
        };

        const decreaseQuantity = () => {
            if (buyQuantity.value > 1) {
                buyQuantity.value--;
            }
        };

        const getTypeName = (typeCode) => {
            const type = toolTypes.value.find(t => t.code === typeCode);
            return type ? type.name : typeCode;
        };

        const getTypeIcon = (typeCode) => {
            const type = toolTypes.value.find(t => t.code === typeCode);
            return type ? type.icon : '📦';
        };

        const getTypeColor = (typeCode) => {
            const colors = {
                attack: '#ff6b6b',
                support: '#4ecdc4',
                heal: '#a8e6cf',
                trap: '#ffeaa7'
            };
            return colors[typeCode] || '#666';
        };

        onMounted(async () => {
            try {
                await GameStore.loadUserTools();
            } catch (error) {
                console.error('加载忍具数据失败:', error);
            } finally {
                loading.value = false;
            }
        });

        return {
            loading,
            activeTab,
            selectedTool,
            buyQuantity,
            user,
            coins,
            allTools,
            myTools,
            toolTypes,
            shopToolsByType,
            myToolsByType,
            isOwned,
            getOwnedTool,
            getToolQuantity,
            getTotalCost,
            handleBuyTools,
            handleUseTool,
            showToolDetail,
            closeToolDetail,
            increaseQuantity,
            decreaseQuantity,
            getTypeName,
            getTypeIcon,
            getTypeColor
        };
    },
    template: `
        <div class="tools-page">
            <div class="page-header">
                <h2 class="page-title">🎒 忍具系统</h2>
                <p class="page-subtitle">购买和使用忍具，在战斗中获得优势</p>
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
                    <span class="stat-icon">📦</span>
                    <div class="stat-info">
                        <div class="stat-label">忍具种类</div>
                        <div class="stat-value">{{ myTools.length }}/{{ allTools.length }}</div>
                    </div>
                </div>
                <div class="stat-item">
                    <span class="stat-icon">🎯</span>
                    <div class="stat-info">
                        <div class="stat-label">总数量</div>
                        <div class="stat-value">{{ myTools.reduce((sum, t) => sum + t.quantity, 0) }}</div>
                    </div>
                </div>
                <div class="stat-item">
                    <span class="stat-icon">🏷️</span>
                    <div class="stat-info">
                        <div class="stat-label">忍具类型</div>
                        <div class="stat-value">{{ toolTypes.length }}</div>
                    </div>
                </div>
            </div>

            <div class="page-tabs">
                <div
                    class="tab-item"
                    :class="{ active: activeTab === 'shop' }"
                    @click="activeTab = 'shop'"
                >
                    🛒 忍具商店
                </div>
                <div
                    class="tab-item"
                    :class="{ active: activeTab === 'inventory' }"
                    @click="activeTab = 'inventory'"
                >
                    🎒 我的忍具
                </div>
            </div>

            <div class="shop-section" v-if="activeTab === 'shop' && !loading">
                <div
                    v-for="typeGroup in shopToolsByType"
                    :key="typeGroup.code"
                    class="tool-type-section"
                >
                    <h4 class="type-title">
                        <span class="type-icon">{{ typeGroup.icon }}</span>
                        {{ typeGroup.name }}
                    </h4>
                    <div class="tools-grid">
                        <div
                            v-for="tool in typeGroup.items"
                            :key="tool.id"
                            class="tool-card"
                            :class="{ owned: isOwned(tool.id) }"
                            @click="showToolDetail(tool)"
                        >
                            <div class="tool-icon" :style="{ backgroundColor: getTypeColor(tool.type) }">
                                {{ tool.icon }}
                            </div>
                            <div class="tool-name">{{ tool.name }}</div>
                            <div class="tool-stats">
                                <span v-if="tool.damage > 0" class="stat">💥 {{ tool.damage }}</span>
                                <span v-if="tool.heal > 0" class="stat">💚 {{ tool.heal }}</span>
                                <span v-if="tool.duration > 0" class="stat">⏱️ {{ tool.duration }}s</span>
                            </div>
                            <div class="tool-footer">
                                <span class="price">💰 {{ tool.price }}</span>
                                <span v-if="isOwned(tool.id)" class="quantity">x{{ getToolQuantity(tool.id) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="inventory-section" v-if="activeTab === 'inventory' && !loading">
                <div
                    v-for="typeGroup in myToolsByType"
                    :key="typeGroup.code"
                    class="tool-type-section"
                >
                    <h4 class="type-title">
                        <span class="type-icon">{{ typeGroup.icon }}</span>
                        {{ typeGroup.name }}
                        <span class="type-count">({{ typeGroup.items.reduce((sum, t) => sum + t.quantity, 0) }})</span>
                    </h4>
                    <div class="tools-grid" v-if="typeGroup.items.length > 0">
                        <div
                            v-for="tool in typeGroup.items"
                            :key="tool.id"
                            class="tool-card owned"
                            @click="showToolDetail(tool)"
                        >
                            <div class="tool-icon" :style="{ backgroundColor: getTypeColor(tool.type) }">
                                {{ tool.icon }}
                            </div>
                            <div class="tool-name">{{ tool.name }}</div>
                            <div class="tool-quantity">x{{ tool.quantity }}</div>
                            <div class="tool-stats">
                                <span v-if="tool.damage > 0" class="stat">💥 {{ tool.damage }}</span>
                                <span v-if="tool.heal > 0" class="stat">💚 {{ tool.heal }}</span>
                                <span v-if="tool.duration > 0" class="stat">⏱️ {{ tool.duration }}s</span>
                            </div>
                            <div class="tool-footer">
                                <button class="btn btn-sm btn-primary" @click.stop="handleUseTool(tool.id)">
                                    使用
                                </button>
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

            <div class="tool-detail-modal" v-if="selectedTool" @click.self="closeToolDetail">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="tool-icon-large" :style="{ backgroundColor: getTypeColor(selectedTool.type) }">
                            {{ selectedTool.icon }}
                        </div>
                        <h3 class="modal-title">{{ selectedTool.name }}</h3>
                        <button class="close-btn" @click="closeToolDetail">✕</button>
                    </div>

                    <div class="modal-body">
                        <div class="tool-type-badge">
                            {{ getTypeIcon(selectedTool.type) }} {{ getTypeName(selectedTool.type) }}
                        </div>
                        <p class="tool-description">{{ selectedTool.description }}</p>

                        <div class="detail-stats">
                            <div class="detail-stat" v-if="isOwned(selectedTool.id)">
                                <span class="detail-label">拥有数量</span>
                                <span class="detail-value">{{ getToolQuantity(selectedTool.id) }}</span>
                            </div>
                            <div class="detail-stat" v-if="selectedTool.damage > 0">
                                <span class="detail-label">伤害</span>
                                <span class="detail-value">{{ selectedTool.damage }}</span>
                            </div>
                            <div class="detail-stat" v-if="selectedTool.heal > 0">
                                <span class="detail-label">恢复</span>
                                <span class="detail-value">{{ selectedTool.heal }}</span>
                            </div>
                            <div class="detail-stat" v-if="selectedTool.duration > 0">
                                <span class="detail-label">持续时间</span>
                                <span class="detail-value">{{ selectedTool.duration }} 秒</span>
                            </div>
                            <div class="detail-stat">
                                <span class="detail-label">单价</span>
                                <span class="detail-value">💰 {{ selectedTool.price }}</span>
                            </div>
                        </div>

                        <div class="quantity-selector" v-if="activeTab === 'shop'">
                            <span class="selector-label">购买数量:</span>
                            <div class="quantity-controls">
                                <button class="quantity-btn" @click="decreaseQuantity">-</button>
                                <span class="quantity-value">{{ buyQuantity }}</span>
                                <button class="quantity-btn" @click="increaseQuantity">+</button>
                            </div>
                            <span class="total-cost">总计: 💰 {{ getTotalCost(selectedTool) }}</span>
                        </div>

                        <div class="modal-actions">
                            <button
                                v-if="activeTab === 'shop'"
                                class="btn btn-primary"
                                @click="handleBuyTools(selectedTool.id)"
                                :disabled="coins < getTotalCost(selectedTool)"
                            >
                                购买 (💰 {{ getTotalCost(selectedTool) }})
                            </button>
                            <button
                                v-if="activeTab === 'inventory' && isOwned(selectedTool.id)"
                                class="btn btn-primary"
                                @click="handleUseTool(selectedTool.id)"
                                :disabled="getToolQuantity(selectedTool.id) <= 0"
                            >
                                使用
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};

const ToolsPageWrapper = {
    render() {
        return Vue.h(MainLayout, {
            currentPage: 'tools',
            onNavigate: (pageId) => {
                Router.navigate(pageId);
            }
        }, {
            default: () => Vue.h(ToolsPage)
        });
    }
};

window.ToolsPage = ToolsPage;
window.ToolsPageWrapper = ToolsPageWrapper;
})();
