const BackpackPage = {
    template: `
        <div class="page-container">
            <div class="page-header">
                <h1 class="page-title">🎒 背包</h1>
                <button class="btn btn-secondary" @click="goBack">返回</button>
            </div>

            <div class="card mb-4">
                <h3 class="font-bold mb-3">我的资源</h3>
                <div v-if="loading.resources" class="loading">
                    <div class="loading-spinner"></div>
                </div>
                <div v-else class="grid grid-2 grid-3">
                    <div v-for="resource in resourceList" :key="resource.type" class="item-card bg-white">
                        <div class="flex items-center gap-3">
                            <span style="font-size: 32px;">{{ resource.icon }}</span>
                            <div>
                                <div class="text-sm text-gray-500">{{ resource.name }}</div>
                                <div class="text-lg font-bold">{{ resource.amount }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="nav-tabs mb-4">
                <div 
                    class="nav-tab" 
                    :class="{ active: activeTab === 'weapons' }"
                    @click="switchTab('weapons')"
                >
                    🗡️ 我的武器
                </div>
                <div 
                    class="nav-tab" 
                    :class="{ active: activeTab === 'shop' }"
                    @click="switchTab('shop')"
                >
                    🛒 资源商店
                </div>
            </div>

            <div v-if="activeTab === 'weapons'" class="card">
                <h3 class="font-bold mb-4">武器列表 ({{ weapons.length }})</h3>
                
                <div v-if="loading.weapons" class="loading">
                    <div class="loading-spinner"></div>
                </div>

                <div v-else-if="weapons.length === 0" class="empty-state">
                    <div class="empty-state-icon">🗡️</div>
                    <div class="empty-state-text">暂无武器</div>
                    <button class="btn btn-primary mt-4" @click="navigateTo('doodle')">去制作</button>
                </div>

                <div v-else class="grid grid-2 grid-3">
                    <div 
                        v-for="weapon in weapons" 
                        :key="weapon.id"
                        class="item-card" 
                        :class="'rarity-' + getRarityClass(weapon.rarity)"
                        @click="openWeaponDetail(weapon)"
                    >
                        <div class="weapon-preview">
                            <img v-if="weapon.image" :src="weapon.image" :alt="weapon.name">
                            <span v-else style="font-size: 48px;">🗡️</span>
                        </div>
                        <div class="flex justify-between items-center mb-2">
                            <div class="font-bold">{{ weapon.name }}</div>
                            <span v-if="weapon.is_shared" style="font-size: 12px; color: var(--success-color);">已分享</span>
                        </div>
                        <span class="rarity-badge" :class="getRarityClass(weapon.rarity)">{{ getRarityText(weapon.rarity) }}</span>
                        
                        <div class="mt-3">
                            <div class="flex justify-between text-sm mb-1">
                                <span>耐久度</span>
                                <span>{{ weapon.durability }}/{{ weapon.max_durability }}</span>
                            </div>
                            <div class="progress-bar">
                                <div 
                                    class="progress-fill" 
                                    :style="{ width: getDurabilityPercent(weapon) + '%', background: getDurabilityColor(weapon) }"
                                ></div>
                            </div>
                        </div>

                        <div class="stats-grid mt-3">
                            <div class="stat-box">
                                <div class="stat-box-label">攻击</div>
                                <div class="stat-box-value">{{ weapon.attack || 0 }}</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-box-label">防御</div>
                                <div class="stat-box-value">{{ weapon.defense || 0 }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="activeTab === 'shop'" class="card">
                <h3 class="font-bold mb-4">资源商店</h3>
                
                <div v-if="loading.shop" class="loading">
                    <div class="loading-spinner"></div>
                </div>

                <div v-else-if="shopItems.length === 0" class="empty-state">
                    <div class="empty-state-icon">🛒</div>
                    <div class="empty-state-text">商店暂无商品</div>
                </div>

                <div v-else class="grid grid-2 grid-3">
                    <div 
                        v-for="item in shopItems" 
                        :key="item.id"
                        class="item-card bg-white"
                    >
                        <div class="text-center mb-3">
                            <span style="font-size: 48px;">{{ getResourceIcon(item.resource_type) }}</span>
                        </div>
                        <div class="font-bold text-center mb-1">{{ item.name || getResourceName(item.resource_type) }}</div>
                        <div class="text-center text-sm text-gray-500 mb-2">x{{ item.value || item.amount || 1 }}</div>
                        <div class="text-center mb-3">
                            <span class="text-lg font-bold" style="color: #f59e0b;">💰 {{ item.price }}</span>
                        </div>
                        <button 
                            class="btn btn-primary w-full"
                            @click.stop="buyResource(item)"
                            :disabled="myResources.gold < item.price"
                        >
                            {{ myResources.gold < item.price ? '金币不足' : '购买' }}
                        </button>
                    </div>
                </div>
            </div>

            <div v-if="showWeaponModal && selectedWeapon" class="modal-overlay" @click.self="closeWeaponModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">武器详情</h3>
                        <button class="modal-close" @click="closeWeaponModal">×</button>
                    </div>

                    <div class="weapon-preview">
                        <img v-if="selectedWeapon.image" :src="selectedWeapon.image" :alt="selectedWeapon.name">
                        <span v-else style="font-size: 80px;">🗡️</span>
                    </div>

                    <div class="text-center mb-4">
                        <h2 class="text-xl font-bold mb-2">{{ selectedWeapon.name }}</h2>
                        <span class="rarity-badge" :class="getRarityClass(selectedWeapon.rarity)">{{ getRarityText(selectedWeapon.rarity) }}</span>
                    </div>

                    <div v-if="selectedWeapon.description" class="mb-4 p-4 bg-white rounded-lg">
                        <p class="text-sm text-gray-500">{{ selectedWeapon.description }}</p>
                    </div>

                    <div class="stats-grid mb-4">
                        <div class="stat-box">
                            <div class="stat-box-label">攻击力</div>
                            <div class="stat-box-value">{{ selectedWeapon.attack || 0 }}</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-box-label">防御力</div>
                            <div class="stat-box-value">{{ selectedWeapon.defense || 0 }}</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-box-label">等级</div>
                            <div class="stat-box-value">Lv.{{ selectedWeapon.level || 1 }}</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-box-label">元素</div>
                            <div class="stat-box-value">{{ selectedWeapon.element || '无' }}</div>
                        </div>
                    </div>

                    <div class="mb-4">
                        <div class="flex justify-between mb-2">
                            <span class="font-bold">耐久度</span>
                            <span>{{ selectedWeapon.durability }}/{{ selectedWeapon.max_durability }}</span>
                        </div>
                        <div class="progress-bar">
                            <div 
                                class="progress-fill" 
                                :style="{ width: getDurabilityPercent(selectedWeapon) + '%', background: getDurabilityColor(selectedWeapon) }"
                            ></div>
                        </div>
                        <div v-if="canRepair(selectedWeapon)" class="mt-2 text-sm text-center">
                            维修费用: <span style="color: #f59e0b;">💰 {{ getRepairCost(selectedWeapon) }}</span>
                        </div>
                    </div>

                    <div class="flex gap-3 mt-4">
                        <button 
                            class="btn btn-success flex-1"
                            @click="repairWeapon(selectedWeapon.id)"
                            :disabled="!canRepair(selectedWeapon)"
                        >
                            🔧 维修
                        </button>
                        <button 
                            class="btn btn-secondary flex-1"
                            @click="shareWeapon(selectedWeapon.id)"
                            :disabled="selectedWeapon.is_shared"
                        >
                            📤 {{ selectedWeapon.is_shared ? '已分享' : '分享' }}
                        </button>
                        <button 
                            class="btn btn-danger"
                            @click="confirmDelete(selectedWeapon.id)"
                        >
                            🗑️
                        </button>
                    </div>
                </div>
            </div>

            <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="cancelDelete">
                <div class="modal-content" style="max-width: 400px;">
                    <div class="text-center">
                        <div style="font-size: 64px; margin-bottom: 16px;">⚠️</div>
                        <h3 class="modal-title mb-4">确认删除</h3>
                        <p class="text-gray-500 mb-6">确定要删除这把武器吗？此操作无法撤销。</p>
                        <div class="flex gap-3">
                            <button class="btn btn-secondary flex-1" @click="cancelDelete">取消</button>
                            <button class="btn btn-danger flex-1" @click="deleteWeapon">确认删除</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            activeTab: 'weapons',
            weapons: [],
            shopItems: [],
            myResources: {},
            loading: {
                weapons: true,
                shop: true,
                resources: true
            },
            showWeaponModal: false,
            selectedWeapon: null,
            showDeleteConfirm: false,
            deletingWeaponId: null
        };
    },
    computed: {
        resourceList() {
            const resources = [];
            const types = ['gold', 'diamond', 'paint', 'canvas', 'wood', 'iron', 'gem'];
            types.forEach(type => {
                resources.push({
                    type,
                    name: this.getResourceName(type),
                    icon: this.getResourceIcon(type),
                    amount: this.myResources[type] || 0
                });
            });
            return resources;
        }
    },
    mounted() {
        AuthService.requireAuth();
        this.loadWeapons();
        this.loadShopItems();
        this.loadMyResources();
    },
    methods: {
        getRarityClass(rarity) {
            const map = {
                1: 'common',
                2: 'rare',
                3: 'epic',
                4: 'legendary',
                'common': 'common',
                'rare': 'rare',
                'epic': 'epic',
                'legendary': 'legendary'
            };
            return map[rarity] || 'common';
        },
        getRarityText(rarity) {
            const map = {
                1: '普通',
                2: '稀有',
                3: '史诗',
                4: '传说',
                'common': '普通',
                'rare': '稀有',
                'epic': '史诗',
                'legendary': '传说'
            };
            return map[rarity] || '普通';
        },
        getResourceIcon(type) {
            const map = {
                gold: '💰',
                diamond: '💎',
                paint: '🎨',
                canvas: '📜',
                wood: '🪵',
                iron: '⚙️',
                gem: '💎'
            };
            return map[type] || '📦';
        },
        getResourceName(type) {
            const map = {
                gold: '金币',
                diamond: '钻石',
                paint: '颜料',
                canvas: '画布',
                wood: '木材',
                iron: '铁矿',
                gem: '宝石'
            };
            return map[type] || type;
        },
        async loadWeapons() {
            try {
                this.loading.weapons = true;
                const result = await API.weapon.getMyList({ page: 1, page_size: 100 });
                if (result.code === 0) {
                    this.weapons = result.data.items || [];
                }
            } catch (error) {
                console.error('加载武器失败:', error);
                Toast.error('加载武器失败');
            } finally {
                this.loading.weapons = false;
            }
        },
        async loadShopItems() {
            try {
                this.loading.shop = true;
                const result = await API.resource.getShopList({ page: 1, page_size: 100 });
                if (result.code === 0) {
                    this.shopItems = result.data.items || [];
                }
            } catch (error) {
                console.error('加载商店失败:', error);
                Toast.error('加载商店失败');
            } finally {
                this.loading.shop = false;
            }
        },
        async loadMyResources() {
            try {
                this.loading.resources = true;
                const result = await API.resource.getMyResources({ page_size: 100 });
                if (result.code === 0 && result.data) {
                    const items = result.data.items || [];
                    const resMap = {};
                    items.forEach(item => {
                        resMap[item.resource_type] = (resMap[item.resource_type] || 0) + (item.quantity || 0);
                    });
                    const user = AuthService.getUser();
                    this.myResources = {
                        gold: user?.gold || 0,
                        diamond: user?.diamond || 0,
                        paint: resMap.paint || user?.paint_count || 0,
                        canvas: resMap.canvas || user?.canvas_count || 0,
                        ...resMap
                    };
                }
            } catch (error) {
                console.error('加载资源失败:', error);
                const user = AuthService.getUser();
                this.myResources = {
                    gold: user?.gold || 0,
                    diamond: user?.diamond || 0,
                    paint: user?.paint_count || 0,
                    canvas: user?.canvas_count || 0
                };
            } finally {
                this.loading.resources = false;
            }
        },
        switchTab(tab) {
            this.activeTab = tab;
        },
        openWeaponDetail(weapon) {
            this.selectedWeapon = weapon;
            this.showWeaponModal = true;
        },
        closeWeaponModal() {
            this.showWeaponModal = false;
            this.selectedWeapon = null;
        },
        async repairWeapon(weaponId) {
            try {
                const result = await API.weapon.repair(weaponId);
                if (result.code === 0) {
                    Toast.success('维修成功！');
                    this.loadWeapons();
                    this.loadMyResources();
                    if (this.selectedWeapon && this.selectedWeapon.id === weaponId) {
                        this.selectedWeapon = result.data || this.selectedWeapon;
                    }
                }
            } catch (error) {
                console.error('维修失败:', error);
            }
        },
        async shareWeapon(weaponId) {
            try {
                const result = await API.weapon.share(weaponId);
                if (result.code === 0) {
                    Toast.success('分享成功！');
                    this.loadWeapons();
                    if (this.selectedWeapon && this.selectedWeapon.id === weaponId) {
                        this.selectedWeapon.is_shared = true;
                    }
                }
            } catch (error) {
                console.error('分享失败:', error);
            }
        },
        confirmDelete(weaponId) {
            this.deletingWeaponId = weaponId;
            this.showDeleteConfirm = true;
        },
        cancelDelete() {
            this.showDeleteConfirm = false;
            this.deletingWeaponId = null;
        },
        async deleteWeapon() {
            if (!this.deletingWeaponId) return;
            
            try {
                const result = await API.weapon.delete(this.deletingWeaponId);
                if (result.code === 0) {
                    Toast.success('删除成功！');
                    this.weapons = this.weapons.filter(w => w.id !== this.deletingWeaponId);
                    if (this.selectedWeapon && this.selectedWeapon.id === this.deletingWeaponId) {
                        this.closeWeaponModal();
                    }
                }
            } catch (error) {
                console.error('删除失败:', error);
            } finally {
                this.cancelDelete();
            }
        },
        async buyResource(item) {
            if (this.myResources.gold < item.price) {
                Toast.error('金币不足！');
                return;
            }

            try {
                const result = await API.resource.buy(item.id, 1);
                if (result.code === 0) {
                    Toast.success(`购买成功！获得 ${item.name || this.getResourceName(item.resource_type)}`);
                    this.loadMyResources();
                } else {
                    Toast.error(result.msg || '购买失败');
                }
            } catch (error) {
                console.error('购买失败:', error);
                Toast.error(error.message || '购买失败');
            }
        },
        getDurabilityPercent(weapon) {
            if (!weapon.max_durability) return 100;
            return (weapon.durability / weapon.max_durability) * 100;
        },
        getDurabilityColor(weapon) {
            const percent = this.getDurabilityPercent(weapon);
            if (percent <= 20) return '#ef4444';
            if (percent <= 50) return '#f59e0b';
            return '#10b981';
        },
        canRepair(weapon) {
            return weapon.durability < weapon.max_durability;
        },
        getRepairCost(weapon) {
            if (!weapon.max_durability) return 0;
            const damage = weapon.max_durability - weapon.durability;
            return Math.ceil(damage * 10 * (weapon.level || 1));
        },
        goBack() {
            Router.navigate('home');
        },
        navigateTo(page) {
            Router.navigate(page);
        }
    }
};
