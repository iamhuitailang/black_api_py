const { createApp } = Vue;

const LoginPage = {
    template: `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <h1>🍢 夜市大排档</h1>
                    <p>欢迎来到烟火气十足的夜市！</p>
                </div>
                <form class="auth-form" @submit.prevent="handleLogin">
                    <div class="form-group">
                        <label>用户名</label>
                        <input type="text" v-model="username" placeholder="请输入用户名" required>
                    </div>
                    <div class="form-group">
                        <label>密码</label>
                        <input type="password" v-model="password" placeholder="请输入密码" required>
                    </div>
                    <button type="submit" class="auth-btn" :disabled="loading">
                        {{ loading ? '登录中...' : '登录' }}
                    </button>
                </form>
                <div class="auth-switch">
                    还没有账号？<span @click="$router.push('/register')">立即注册</span>
                </div>
            </div>
        </div>
    `,
    data() {
        return { username: '', password: '', loading: false };
    },
    methods: {
        async handleLogin() {
            if (!this.username || !this.password) return;
            this.loading = true;
            try {
                const result = await api.login(this.username, this.password);
                if (result.code === 0) {
                    storeActions.setAuthenticated(true, result.data.token);
                    storeActions.setUser(result.data.user);
                    this.$router.push('/game');
                } else {
                    storeActions.showToast(result.message, 'error');
                }
            } catch (e) {
                storeActions.showToast('登录失败', 'error');
            } finally {
                this.loading = false;
            }
        }
    }
};

const RegisterPage = {
    template: `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <h1>🍢 夜市大排档</h1>
                    <p>创建账号，开启夜市之旅！</p>
                </div>
                <form class="auth-form" @submit.prevent="handleRegister">
                    <div class="form-group">
                        <label>用户名</label>
                        <input type="text" v-model="username" placeholder="请输入用户名" required>
                    </div>
                    <div class="form-group">
                        <label>密码</label>
                        <input type="password" v-model="password" placeholder="请输入密码（至少6位）" required>
                    </div>
                    <div class="form-group">
                        <label>确认密码</label>
                        <input type="password" v-model="confirmPassword" placeholder="请再次输入密码" required>
                    </div>
                    <button type="submit" class="auth-btn" :disabled="loading">
                        {{ loading ? '注册中...' : '注册' }}
                    </button>
                </form>
                <div class="auth-switch">
                    已有账号？<span @click="$router.push('/login')">立即登录</span>
                </div>
            </div>
        </div>
    `,
    data() {
        return { username: '', password: '', confirmPassword: '', loading: false };
    },
    methods: {
        async handleRegister() {
            if (!this.username || !this.password) return;
            if (this.password.length < 6) { storeActions.showToast('密码至少6位', 'error'); return; }
            if (this.password !== this.confirmPassword) { storeActions.showToast('密码不一致', 'error'); return; }
            this.loading = true;
            try {
                const result = await api.register(this.username, this.password);
                if (result.code === 0) {
                    storeActions.setAuthenticated(true, result.data.token);
                    storeActions.setUser(result.data.user);
                    this.$router.push('/game');
                } else {
                    storeActions.showToast(result.message, 'error');
                }
            } catch (e) {
                storeActions.showToast('注册失败', 'error');
            } finally {
                this.loading = false;
            }
        }
    }
};

const GamePage = {
    template: `
        <div class="game-container">
            <header class="game-header">
                <div class="user-info">
                    <div class="user-avatar">👨‍🍳</div>
                    <div class="user-details">
                        <h3>{{ gameUser?.username || '摊主' }}</h3>
                        <span class="level">Lv.{{ gameUser?.level || 1 }}</span>
                    </div>
                </div>
                <div class="stats-bar">
                    <div class="stat-item gold">
                        <span class="icon">💰</span>
                        <span class="value">{{ gameUser?.gold || 0 }}</span>
                    </div>
                    <div class="stat-item reputation">
                        <span class="icon">⭐</span>
                        <span class="value">{{ gameUser?.reputation || 0 }}</span>
                    </div>
                </div>
                <div class="weather-display" v-if="weather">
                    <span class="icon">{{ weather.icon }}</span>
                    <span>{{ weather.name }}</span>
                </div>
                <div class="game-nav">
                    <button class="nav-btn" @click="showUnlockModal = true">🔓 解锁</button>
                    <button class="nav-btn" @click="showUpgradeModal = true">⬆️ 升级</button>
                    <button class="nav-btn logout" @click="handleLogout">退出</button>
                </div>
            </header>

            <main class="game-main">
                <div class="stall-area">
                    <div class="stall-header">
                        <h2>🏪 我的大排档</h2>
                        <button class="btn" :class="isPlaying ? 'btn-secondary' : 'btn-primary'" @click="toggleSession">
                            {{ isPlaying ? '⏹️ 打烊' : '▶️ 营业' }}
                        </button>
                    </div>

                    <div class="customers-area" v-if="isPlaying">
                        <h3>👥 等待的客人 ({{ guests.length }}/{{ maxCustomers }})</h3>
                        <div class="customers-list" v-if="guests.length > 0">
                            <div
                                class="customer-card"
                                v-for="guest in guests"
                                :key="guest.id"
                                :class="{ selected: selectedGuest && selectedGuest.id === guest.id }"
                                @click="selectGuest(guest)"
                            >
                                <div class="customer-avatar">{{ guest.icon || '🧑' }}</div>
                                <div class="customer-name">{{ guest.name }}</div>
                                <div class="customer-desired-food" v-if="guest.desired_food">
                                    {{ guest.desired_food.icon }} {{ guest.desired_food.name }}
                                </div>
                                <div class="customer-patience">
                                    <div class="bar" :class="{ low: guest.patience_percent < 30 }" :style="{ width: guest.patience_percent + '%' }"></div>
                                </div>
                                <div class="customer-special" v-if="guest.special_request">
                                    💬 {{ guest.special_request.text }}
                                </div>
                            </div>
                        </div>
                        <div class="empty-state" v-else>
                            <p>🕐 等待客人光临...</p>
                        </div>
                    </div>

                    <div class="orders-area">
                        <h3>📋 订单 ({{ pendingOrders.length }})</h3>
                        <div class="orders-list" v-if="pendingOrders.length > 0">
                            <div class="order-card" v-for="order in pendingOrders" :key="order.id" :class="{ cooking: order.status === 'cooking' }">
                                <div class="order-food">{{ order.food_icon || '🍽️' }}</div>
                                <div class="order-info">
                                    <div class="order-food-name">{{ order.food_name }}</div>
                                    <div class="order-price">💰 {{ order.base_price }}</div>
                                    <div class="order-guest" v-if="order.guest_name">👤 {{ order.guest_name }}</div>
                                </div>
                                <div class="order-progress" v-if="order.status === 'cooking'">
                                    <div class="bar" :style="{ width: (order.progress || 0) + '%' }"></div>
                                </div>
                                <div class="order-actions">
                                    <button class="btn btn-small btn-primary" v-if="order.status === 'pending'" @click="startCooking(order)">🍳 烹饪</button>
                                    <button class="btn btn-small btn-secondary" v-if="order.status === 'cooking' && (order.progress || 0) >= 100" @click="finishCooking(order)">✅ 出餐</button>
                                </div>
                            </div>
                        </div>
                        <div class="empty-state" v-else>
                            <p>📝 暂无订单</p>
                        </div>
                    </div>
                </div>

                <div class="sidebar">
                    <div class="sidebar-panel" style="flex:1; min-height:0;">
                        <h3>🍳 菜单</h3>
                        <div class="food-grid">
                            <div class="food-item" v-for="food in unlockedFoods" :key="food.id"
                                :class="{ selected: selectedFood && selectedFood.id === food.id }"
                                @click="selectFood(food)">
                                <div class="food-item-icon">{{ food.icon }}</div>
                                <div class="food-item-name">{{ food.name }}</div>
                                <div class="food-item-price">💰{{ food.base_price }}</div>
                            </div>
                        </div>
                    </div>
                    <div class="sidebar-panel" v-if="isPlaying" style="flex-shrink:0;">
                        <h3>⚡ 操作</h3>
                        <button class="btn btn-primary" style="width:100%;margin-bottom:8px;" @click="generateGuest" :disabled="guests.length >= maxCustomers">
                            🔔 招徕客人
                        </button>
                        <button class="btn btn-secondary" style="width:100%;" @click="quickOrder" :disabled="!selectedGuest || !selectedFood">
                            📝 下单 ({{ selectedGuest ? selectedGuest.name : '选客人' }} → {{ selectedFood ? selectedFood.name : '选菜' }})
                        </button>
                    </div>
                </div>
            </main>

            <div class="modal-overlay" v-if="showUnlockModal" @click.self="showUnlockModal = false">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>🔓 解锁新菜品</h2>
                        <button class="modal-close" @click="showUnlockModal = false">&times;</button>
                    </div>
                    <div class="food-grid" style="grid-template-columns:repeat(3,1fr);">
                        <div class="food-item" v-for="food in unlockableFoods" :key="food.id"
                            :class="{ locked: !food.can_afford }" @click="unlockFood(food)">
                            <div class="food-item-icon">{{ food.icon }}</div>
                            <div class="food-item-name">{{ food.name }}</div>
                            <div class="food-item-price">{{ food.can_afford ? '💰' : '🔒' }} {{ food.unlock_cost }}</div>
                        </div>
                    </div>
                    <div class="empty-state" v-if="unlockableFoods.length === 0"><p>🎉 所有菜品已解锁！</p></div>
                </div>
            </div>

            <div class="modal-overlay" v-if="showUpgradeModal" @click.self="showUpgradeModal = false">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>⬆️ 摊位升级</h2>
                        <button class="modal-close" @click="showUpgradeModal = false">&times;</button>
                    </div>
                    <div class="upgrade-list">
                        <div class="upgrade-item" v-for="upgrade in availableUpgrades" :key="upgrade.id"
                            :class="{ maxed: upgrade.is_maxed }" @click="purchaseUpgrade(upgrade)">
                            <div class="upgrade-icon">{{ upgrade.icon }}</div>
                            <div class="upgrade-info">
                                <div class="upgrade-name">{{ upgrade.name }}</div>
                                <div class="upgrade-level">Lv.{{ upgrade.current_level || 0 }}/{{ upgrade.max_level }}</div>
                            </div>
                            <div class="upgrade-cost">{{ upgrade.is_maxed ? '已满级' : '💰 ' + upgrade.next_cost }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="toast" v-for="toast in toasts" :key="toast.id" :class="toast.type">{{ toast.message }}</div>
        </div>
    `,
    data() {
        return {
            isPlaying: false,
            selectedFood: null,
            selectedGuest: null,
            showUnlockModal: false,
            showUpgradeModal: false,
            guestTimer: null,
            cookingTimers: {}
        };
    },
    computed: {
        gameUser() {
            return store.gameUser?.user || store.gameUser;
        },
        weather() {
            return store.weather;
        },
        unlockedFoods() {
            return store.unlockedFoods || [];
        },
        unlockableFoods() {
            return store.unlockableFoods || [];
        },
        availableUpgrades() {
            return store.availableUpgrades || [];
        },
        pendingOrders() {
            return store.pendingOrders || [];
        },
        guests() {
            return (store.activeGuests || []).map(g => ({
                ...g,
                patience_percent: g.patience > 0 ? Math.min(100, Math.round((g.current_patience / g.patience) * 100)) : 0
            }));
        },
        maxCustomers() {
            return this.gameUser?.max_customers || 3;
        },
        toasts() {
            return store.toasts;
        }
    },
    async mounted() {
        if (!store.isAuthenticated) return;

        try {
            await storeActions.loadGameData();
        } catch (e) {
            console.error('loadGameData error', e);
        }

        try {
            const sessionResult = await api.getSession();
            if (sessionResult.code === 0 && sessionResult.data) {
                const session = sessionResult.data.session;
                const weather = sessionResult.data.weather;
                if (session && session.status === 'active') {
                    this.isPlaying = true;
                    this.startGuestTimer();
                }
                if (weather) {
                    storeActions.setWeather(weather);
                }
            }
        } catch (e) {
            console.error('getSession error', e);
        }
    },
    beforeUnmount() {
        this.stopGuestTimer();
        Object.values(this.cookingTimers).forEach(t => clearInterval(t));
    },
    methods: {
        async toggleSession() {
            if (this.isPlaying) {
                await this.endSession();
            } else {
                await this.startSession();
            }
        },

        async startSession() {
            const result = await api.startGame();
            if (result.code === 0) {
                this.isPlaying = true;
                storeActions.setCurrentSession(result.data.session);
                if (result.data.weather) {
                    storeActions.setWeather(result.data.weather);
                }
                storeActions.showToast('开始营业！欢迎光临~', 'success');
                this.startGuestTimer();
            } else {
                storeActions.showToast(result.message, 'error');
            }
        },

        async endSession() {
            const result = await api.endGame();
            if (result.code === 0) {
                this.isPlaying = false;
                this.stopGuestTimer();
                storeActions.setCurrentSession(null);
                storeActions.setActiveGuests([]);
                storeActions.showToast('打烊了！今天辛苦了~', 'success');
            } else {
                storeActions.showToast(result.message, 'error');
            }
        },

        startGuestTimer() {
            this.stopGuestTimer();
            this.guestTimer = setInterval(() => {
                if (!this.isPlaying) return;
                if (this.guests.length < this.maxCustomers && Math.random() < 0.15) {
                    this.generateGuest();
                }
                this.decreaseGuestPatience();
            }, 5000);
        },

        stopGuestTimer() {
            if (this.guestTimer) {
                clearInterval(this.guestTimer);
                this.guestTimer = null;
            }
        },

        async generateGuest() {
            if (this.guests.length >= this.maxCustomers) return;
            const result = await api.generateGuest();
            if (result.code === 0) {
                storeActions.addActiveGuest(result.data);
            } else {
                storeActions.showToast(result.message, 'warning');
            }
        },

        decreaseGuestPatience() {
            const updated = store.activeGuests.map(g => ({
                ...g,
                current_patience: Math.max(0, g.current_patience - 3)
            })).filter(g => g.current_patience > 0);
            store.activeGuests = updated;
        },

        selectFood(food) {
            this.selectedFood = food;
        },

        selectGuest(guest) {
            this.selectedGuest = guest;
            if (guest.desired_food) {
                const food = store.unlockedFoods.find(f => f.id === guest.desired_food.id);
                if (food) this.selectedFood = food;
            }
        },

        async quickOrder() {
            if (!this.selectedGuest) {
                storeActions.showToast('请先点击选择一位客人', 'warning');
                return;
            }
            if (!this.selectedFood) {
                storeActions.showToast('请先选择菜品', 'warning');
                return;
            }

            const result = await api.createOrder(this.selectedFood.id, this.selectedGuest.id);
            if (result.code === 0) {
                storeActions.addPendingOrder(result.data);
                storeActions.showToast(`${this.selectedFood.name} → ${this.selectedGuest.name}`, 'success');
                storeActions.removeActiveGuest(this.selectedGuest.id);
                this.selectedGuest = null;
                this.selectedFood = null;
            } else {
                storeActions.showToast(result.message, 'error');
            }
        },

        startCooking(order) {
            storeActions.updatePendingOrder(order.id, { status: 'cooking', progress: 0 });
            const cookTime = order.cook_time || 5;
            let progress = 0;
            this.cookingTimers[order.id] = setInterval(() => {
                progress += 100 / (cookTime * 2);
                if (progress >= 100) {
                    clearInterval(this.cookingTimers[order.id]);
                    delete this.cookingTimers[order.id];
                    storeActions.updatePendingOrder(order.id, { progress: 100 });
                } else {
                    storeActions.updatePendingOrder(order.id, { progress });
                }
            }, 500);
        },

        async finishCooking(order) {
            if (this.cookingTimers[order.id]) {
                clearInterval(this.cookingTimers[order.id]);
                delete this.cookingTimers[order.id];
            }
            const quality = Math.floor(Math.random() * 30) + 70;
            const timeSpent = Math.floor(Math.random() * 10);
            const result = await api.completeOrder(order.id, true, quality, timeSpent);
            if (result.code === 0) {
                storeActions.removePendingOrder(order.id);
                storeActions.showToast(`${order.food_name} 完成！+${result.data.gold_earned}💰`, 'success');
                storeActions.refreshGameUser();
            } else {
                storeActions.showToast(result.message, 'error');
            }
        },

        async unlockFood(food) {
            if (!food.can_afford) { storeActions.showToast('金币不足', 'error'); return; }
            const result = await api.unlockFood(food.id);
            if (result.code === 0) {
                storeActions.showToast(`解锁：${food.name}！`, 'success');
                storeActions.refreshFoods();
                storeActions.refreshGameUser();
            } else {
                storeActions.showToast(result.message, 'error');
            }
        },

        async purchaseUpgrade(upgrade) {
            if (upgrade.is_maxed) { storeActions.showToast('已满级', 'warning'); return; }
            if (!upgrade.can_afford) { storeActions.showToast('金币不足', 'error'); return; }
            const result = await api.purchaseUpgrade(upgrade.id);
            if (result.code === 0) {
                storeActions.showToast(`${upgrade.name} 升级成功！`, 'success');
                storeActions.refreshUpgrades();
                storeActions.refreshGameUser();
            } else {
                storeActions.showToast(result.message, 'error');
            }
        },

        async handleLogout() {
            await api.logout();
            storeActions.setAuthenticated(false);
            storeActions.setGameUser(null);
            storeActions.setActiveGuests([]);
            storeActions.setPendingOrders([]);
            this.isPlaying = false;
            this.stopGuestTimer();
            this.$router.push('/login');
        }
    }
};

const app = createApp({
    data() { return {}; }
});

const { createRouter, createWebHashHistory } = VueRouter;
const routes = [
    { path: '/', redirect: '/game' },
    { path: '/login', name: 'Login', component: LoginPage, meta: { requiresAuth: false } },
    { path: '/register', name: 'Register', component: RegisterPage, meta: { requiresAuth: false } },
    { path: '/game', name: 'Game', component: GamePage, meta: { requiresAuth: true } }
];
const router = createRouter({ history: createWebHashHistory(), routes });
router.beforeEach((to, from, next) => {
    if (to.meta.requiresAuth && !store.isAuthenticated) next('/login');
    else if (!to.meta.requiresAuth && store.isAuthenticated && (to.path === '/login' || to.path === '/register')) next('/game');
    else next();
});
app.use(router);
app.mount('#app');
