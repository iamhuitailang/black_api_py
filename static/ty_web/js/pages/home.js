const HomePage = {
    template: `
        <div class="page-container">
            <div class="page-header">
                <h1 class="page-title">🎨 涂鸦战士</h1>
                <div class="nav-tabs">
                    <div class="nav-tab" @click="handleLogout">退出</div>
                </div>
            </div>

            <div class="user-info-bar mb-4">
                <div class="user-avatar">{{ userInitial }}</div>
                <div class="user-stats">
                    <div class="stat-item gold">
                        <span>💰</span>
                        <span>{{ userResources.gold || 0 }}</span>
                    </div>
                    <div class="stat-item diamond">
                        <span>💎</span>
                        <span>{{ userResources.diamond || 0 }}</span>
                    </div>
                    <div class="stat-item paint">
                        <span>🎨</span>
                        <span>{{ userResources.paint || 0 }}</span>
                    </div>
                    <div class="stat-item canvas">
                        <span>🖼️</span>
                        <span>{{ userResources.canvas || 0 }}</span>
                    </div>
                </div>
            </div>

            <div class="grid grid-5 mb-4">
                <div class="item-card text-center" @click="navigateTo('doodle')">
                    <div style="font-size: 48px; margin-bottom: 8px;">✏️</div>
                    <div class="font-bold">涂鸦</div>
                    <div class="text-sm text-gray-500">创造武器</div>
                </div>
                <div class="item-card text-center" @click="navigateTo('battle')">
                    <div style="font-size: 48px; margin-bottom: 8px;">⚔️</div>
                    <div class="font-bold">对战</div>
                    <div class="text-sm text-gray-500">开始战斗</div>
                </div>
                <div class="item-card text-center" @click="navigateTo('backpack')">
                    <div style="font-size: 48px; margin-bottom: 8px;">🎒</div>
                    <div class="font-bold">背包</div>
                    <div class="text-sm text-gray-500">我的物品</div>
                </div>
                <div class="item-card text-center" @click="navigateTo('skill')">
                    <div style="font-size: 48px; margin-bottom: 8px;">✨</div>
                    <div class="font-bold">技能</div>
                    <div class="text-sm text-gray-500">技能管理</div>
                </div>
                <div class="item-card text-center" @click="navigateTo('workshop')">
                    <div style="font-size: 48px; margin-bottom: 8px;">🏭</div>
                    <div class="font-bold">工坊</div>
                    <div class="text-sm text-gray-500">社区分享</div>
                </div>
            </div>

            <div class="card">
                <h2 class="text-lg font-bold mb-4">🗡️ 我的武器</h2>
                <div v-if="loading" class="loading">
                    <div class="loading-spinner"></div>
                </div>
                <div v-else-if="weapons.length === 0" class="empty-state">
                    <div class="empty-state-icon">🗡️</div>
                    <div class="empty-state-text">还没有武器，去涂鸦创造一把吧！</div>
                    <button class="btn btn-primary mt-4" @click="navigateTo('doodle')">开始涂鸦</button>
                </div>
                <div v-else class="grid grid-3">
                    <div 
                        v-for="weapon in weapons" 
                        :key="weapon.id" 
                        class="item-card"
                        :class="'rarity-' + weapon.rarity"
                    >
                        <div class="weapon-preview">
                            <img :src="weapon.image" :alt="weapon.name" />
                        </div>
                        <div class="flex justify-between items-center mb-2">
                            <div class="font-bold">{{ weapon.name }}</div>
                            <span class="rarity-badge" :class="weapon.rarity">{{ getRarityText(weapon.rarity) }}</span>
                        </div>
                        <div class="stats-grid">
                            <div class="stat-box">
                                <div class="stat-box-label">攻击</div>
                                <div class="stat-box-value text-danger">{{ weapon.attack }}</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-box-label">防御</div>
                                <div class="stat-box-value text-primary">{{ weapon.defense }}</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-box-label">速度</div>
                                <div class="stat-box-value text-success">{{ weapon.speed }}</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-box-label">风格</div>
                                <div class="stat-box-value">{{ getStyleText(weapon.style) }}</div>
                            </div>
                        </div>
                        <div class="text-sm text-gray-500 mt-2">
                            耐久度: {{ weapon.durability }}/{{ weapon.max_durability }}
                        </div>
                        <div class="progress-bar mt-2">
                            <div class="progress-fill" :style="{ width: (weapon.durability / weapon.max_durability * 100) + '%' }"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            user: null,
            userResources: {
                gold: 0,
                diamond: 0,
                paint: 0,
                canvas: 0
            },
            weapons: [],
            loading: true
        };
    },
    computed: {
        userInitial() {
            if (!this.user || !this.user.nickname) return 'U';
            return this.user.nickname.charAt(0).toUpperCase();
        }
    },
    mounted() {
        this.checkAuth();
    },
    methods: {
        checkAuth() {
            if (!AuthService.isLoggedIn()) {
                Router.navigate('login');
                return;
            }
            this.user = AuthService.getUser();
            this.loadData();
        },

        async loadData() {
            this.loading = true;
            try {
                await Promise.all([
                    this.loadResources(),
                    this.loadWeapons()
                ]);
            } catch (error) {
                console.error('加载数据失败:', error);
            } finally {
                this.loading = false;
            }
        },

        async loadResources() {
            try {
                const result = await API.resource.getMyResources({ page_size: 100 });
                if (result.code === 0 && result.data) {
                    const items = result.data.items || [];
                    const resMap = {};
                    items.forEach(item => {
                        resMap[item.resource_type] = (resMap[item.resource_type] || 0) + (item.quantity || 0);
                    });
                    this.userResources.gold = this.user.gold || 0;
                    this.userResources.diamond = this.user.diamond || 0;
                    this.userResources.paint = resMap.paint || this.user.paint_count || 0;
                    this.userResources.canvas = resMap.canvas || this.user.canvas_count || 0;
                }
            } catch (error) {
                console.error('加载资源失败:', error);
                this.userResources.gold = this.user.gold || 0;
                this.userResources.diamond = this.user.diamond || 0;
                this.userResources.paint = this.user.paint_count || 0;
                this.userResources.canvas = this.user.canvas_count || 0;
            }
        },

        async loadWeapons() {
            try {
                const result = await API.weapon.getMyList({ page_size: 20 });
                if (result.code === 0 && result.data && result.data.items) {
                    this.weapons = result.data.items;
                }
            } catch (error) {
                console.error('加载武器列表失败:', error);
            }
        },

        navigateTo(page) {
            Router.navigate(page);
        },

        async handleLogout() {
            try {
                await AuthService.logout();
            } catch (e) {
                console.error('logout error:', e);
            }
            Router.navigate('login');
        },

        getRarityText(rarity) {
            const map = {
                common: '普通',
                rare: '稀有',
                epic: '史诗',
                legendary: '传说'
            };
            return map[rarity] || '普通';
        },

        getStyleText(style) {
            const map = {
                normal: '⚪ 普通',
                fire: '🔥 火焰',
                ice: '❄️ 冰霜',
                lightning: '⚡ 雷电',
                poison: '☠️ 毒素',
                holy: '✨ 神圣',
                shadow: '🌑 暗影'
            };
            return map[style] || '普通';
        }
    }
};
