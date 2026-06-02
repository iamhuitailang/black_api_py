import { api } from './api.js';
import { ZumaGame } from './game.js';

const { createApp, ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } = Vue;

const App = {
    setup() {
        const currentPage = ref('home');
        const user = ref(null);
        const loading = ref(false);
        const toast = reactive({
            show: false,
            message: '',
            type: 'success'
        });
        const achievementNotification = reactive({
            show: false,
            name: '',
            icon: ''
        });

        const showToast = (message, type = 'success') => {
            toast.message = message;
            toast.type = type;
            toast.show = true;
            setTimeout(() => {
                toast.show = false;
            }, 3000);
        };

        const showAchievementNotification = (name, icon) => {
            achievementNotification.name = name;
            achievementNotification.icon = icon;
            achievementNotification.show = true;
            setTimeout(() => {
                achievementNotification.show = false;
            }, 3000);
        };

        const checkAuth = async () => {
            const token = localStorage.getItem('zuma_token');
            if (token) {
                try {
                    const result = await api.getCurrentUser();
                    if (result.code === 0 && result.data) {
                        user.value = result.data;
                    } else {
                        api.clearToken();
                    }
                } catch (e) {
                    api.clearToken();
                }
            }
        };

        const handleLogout = async () => {
            await api.logout();
            user.value = null;
            currentPage.value = 'home';
            showToast('已退出登录');
        };

        const navigateTo = (page) => {
            currentPage.value = page;
        };

        onMounted(() => {
            checkAuth();
        });

        return {
            currentPage,
            user,
            loading,
            toast,
            achievementNotification,
            showToast,
            showAchievementNotification,
            handleLogout,
            navigateTo,
            checkAuth
        };
    },
    template: `
        <div v-if="currentPage === 'login' || currentPage === 'register'">
            <auth-page 
                :page="currentPage" 
                @login-success="user = $event.user; currentPage = 'home'"
                @navigate="currentPage = $event"
            />
        </div>
        <div v-else>
            <div class="app-container">
                <nav class="navbar">
                    <div class="navbar-brand" @click="currentPage = 'home'" style="cursor: pointer">
                        🎮 祖玛游戏
                    </div>
                    <div class="navbar-menu">
                        <span class="nav-link" :class="{ active: currentPage === 'home' }" @click="currentPage = 'home'">游戏</span>
                        <span class="nav-link" :class="{ active: currentPage === 'ranking' }" @click="currentPage = 'ranking'">排行榜</span>
                        <span class="nav-link" :class="{ active: currentPage === 'achievement' }" @click="currentPage = 'achievement'">成就</span>
                        <span class="nav-link" :class="{ active: currentPage === 'shop' }" @click="currentPage = 'shop'">商店</span>
                        <template v-if="user">
                            <span class="nav-link" :class="{ active: currentPage === 'profile' }" @click="currentPage = 'profile'">个人中心</span>
                            <span class="coins-badge">🪙 {{ user.coins }}</span>
                            <div class="user-avatar" @click="currentPage = 'profile'" style="cursor: pointer">
                                {{ user.nickname.charAt(0) }}
                            </div>
                        </template>
                        <template v-else>
                            <button class="btn btn-primary" @click="currentPage = 'login'">登录</button>
                        </template>
                    </div>
                </nav>

                <game-page 
                    v-if="currentPage === 'home'" 
                    :user="user"
                    @navigate="currentPage = $event"
                />
                <ranking-page v-else-if="currentPage === 'ranking'" />
                <achievement-page v-else-if="currentPage === 'achievement'" :user="user" />
                <shop-page v-else-if="currentPage === 'shop'" :user="user" @update-user="user = $event" />
                <profile-page v-else-if="currentPage === 'profile'" 
                    :user="user" 
                    @logout="handleLogout"
                    @update-user="user = $event"
                />
            </div>
        </div>

        <div v-if="toast.show" class="toast" :class="toast.type">
            {{ toast.message }}
        </div>

        <div v-if="achievementNotification.show" class="achievement-notification">
            <span class="achievement-notification-icon">{{ achievementNotification.icon }}</span>
            <div class="achievement-notification-text">
                <div class="achievement-notification-title">🎉 成就解锁！</div>
                <div class="achievement-notification-name">{{ achievementNotification.name }}</div>
            </div>
        </div>
    `
};

const AuthPage = {
    props: ['page'],
    emits: ['login-success', 'navigate'],
    setup(props, { emit }) {
        const form = reactive({
            username: '',
            password: '',
            confirmPassword: '',
            nickname: ''
        });
        const loading = ref(false);

        const handleSubmit = async () => {
            if (!form.username || !form.password) {
                alert('请填写用户名和密码');
                return;
            }

            if (props.page === 'register' && form.password !== form.confirmPassword) {
                alert('两次密码不一致');
                return;
            }

            loading.value = true;
            try {
                let result;
                if (props.page === 'register') {
                    result = await api.register(form.username, form.password, form.nickname);
                } else {
                    result = await api.login(form.username, form.password);
                }

                if (result.code === 0) {
                    api.setToken(result.data.token);
                    emit('login-success', result.data);
                } else {
                    alert(result.msg);
                }
            } catch (e) {
                alert('操作失败，请重试');
            } finally {
                loading.value = false;
            }
        };

        return {
            form,
            loading,
            handleSubmit
        };
    },
    template: `
        <div class="auth-container">
            <div class="card auth-card">
                <div class="auth-header">
                    <div class="auth-logo">🎮 祖玛</div>
                    <div class="auth-subtitle">{{ page === 'login' ? '登录你的账户' : '创建新账户' }}</div>
                </div>

                <div class="form-group">
                    <label class="form-label">用户名</label>
                    <input type="text" class="form-input" v-model="form.username" placeholder="请输入用户名">
                </div>

                <div class="form-group">
                    <label class="form-label">密码</label>
                    <input type="password" class="form-input" v-model="form.password" placeholder="请输入密码">
                </div>

                <div v-if="page === 'register'" class="form-group">
                    <label class="form-label">确认密码</label>
                    <input type="password" class="form-input" v-model="form.confirmPassword" placeholder="请再次输入密码">
                </div>

                <div v-if="page === 'register'" class="form-group">
                    <label class="form-label">昵称（可选）</label>
                    <input type="text" class="form-input" v-model="form.nickname" placeholder="请输入昵称">
                </div>

                <button class="btn btn-primary btn-block" @click="handleSubmit" :disabled="loading">
                    {{ loading ? '处理中...' : (page === 'login' ? '登录' : '注册') }}
                </button>

                <div class="auth-footer">
                    <span v-if="page === 'login'">
                        还没有账户？
                        <span class="auth-link" @click="$emit('navigate', 'register')">立即注册</span>
                    </span>
                    <span v-else>
                        已有账户？
                        <span class="auth-link" @click="$emit('navigate', 'login')">立即登录</span>
                    </span>
                </div>
            </div>
        </div>
    `
};

const GamePage = {
    props: ['user'],
    emits: ['navigate'],
    setup(props, { emit }) {
        const game = ref(null);
        const score = ref(0);
        const combo = ref(0);
        const showGameOver = ref(false);
        const gameOverData = ref(null);
        const isPaused = ref(false);
        const showCombo = ref(false);
        const userItems = ref([]);

        const canvasRef = ref(null);

        const loadUserItems = async () => {
            if (props.user) {
                const result = await api.getMyItems();
                if (result.code === 0) {
                    userItems.value = result.data || [];
                }
            }
        };

        const getItemCount = (itemType) => {
            const item = userItems.value.find(i => i.item_type === itemType);
            return item ? item.quantity : 0;
        };

        const onGameOver = async (data) => {
            showGameOver.value = true;
            gameOverData.value = data;

            if (props.user) {
                await api.submitScore(
                    data.score,
                    1,
                    data.maxCombo,
                    data.duration,
                    data.ballsFired,
                    data.ballsMatched
                );
                await api.clearGameState();
                loadUserItems();
            }
        };

        const onScoreUpdate = (newScore) => {
            score.value = newScore;
        };

        const onComboUpdate = (newCombo) => {
            combo.value = newCombo;
            if (newCombo >= 3) {
                showCombo.value = true;
                setTimeout(() => {
                    showCombo.value = false;
                }, 500);
            }
        };

        const startGame = () => {
            score.value = 0;
            combo.value = 0;
            showGameOver.value = false;
            isPaused.value = false;

            if (canvasRef.value) {
                game.value = new ZumaGame(
                    canvasRef.value,
                    onGameOver,
                    onScoreUpdate,
                    onComboUpdate
                );
                game.value.start();
            }
        };

        const useItem = async (itemType) => {
            if (!props.user) {
                emit('navigate', 'login');
                return;
            }

            if (getItemCount(itemType) <= 0) {
                return;
            }

            const result = await api.useItem(itemType);
            if (result.code === 0) {
                if (game.value) {
                    switch (itemType) {
                        case 'slow_time':
                            game.value.useSlowTime();
                            break;
                        case 'backward':
                            game.value.useBackward();
                            break;
                        case 'aim':
                            game.value.useAim();
                            break;
                        case 'bomb':
                            game.value.useBomb();
                            break;
                        case 'color_change':
                            game.value.useColorChange();
                            break;
                    }
                }
                loadUserItems();
            }
        };

        const togglePause = () => {
            if (game.value) {
                if (isPaused.value) {
                    game.value.resume();
                } else {
                    game.value.pause();
                }
                isPaused.value = !isPaused.value;
            }
        };

        const restartGame = () => {
            if (game.value) {
                game.value.gameRunning = false;
            }
            startGame();
        };

        onMounted(() => {
            loadUserItems();
            nextTick(() => {
                startGame();
            });
        });

        onUnmounted(() => {
            if (game.value) {
                game.value.gameRunning = false;
            }
        });

        return {
            game,
            score,
            combo,
            showGameOver,
            gameOverData,
            isPaused,
            showCombo,
            userItems,
            canvasRef,
            startGame,
            useItem,
            getItemCount,
            togglePause,
            restartGame
        };
    },
    template: `
        <div class="game-container">
            <div v-if="!user" class="login-required">
                <div class="login-required-icon">🔒</div>
                <div class="login-required-title">请先登录</div>
                <div class="login-required-text">登录后即可开始游戏，记录你的分数和成就！</div>
                <button class="btn btn-primary btn-lg" @click="$emit('navigate', 'login')">立即登录</button>
            </div>
            <div v-else>
                <div class="game-header">
                    <div class="game-stats">
                        <div class="stat-item">
                            <div class="stat-value">{{ score }}</div>
                            <div class="stat-label">分数</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">{{ combo }}</div>
                            <div class="stat-label">连击</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px">
                        <button class="btn btn-secondary" @click="togglePause">
                            {{ isPaused ? '继续' : '暂停' }}
                        </button>
                        <button class="btn btn-secondary" @click="restartGame">重新开始</button>
                    </div>
                </div>

                <div class="game-tips">
                    <span class="tip">💡 鼠标移动瞄准，左键射击，右键交换珠子</span>
                </div>

                <div class="game-canvas-wrapper">
                    <canvas ref="canvasRef" id="gameCanvas" width="700" height="600"></canvas>
                    
                    <div v-if="showCombo" class="combo-display">
                        {{ combo }} 连击!
                    </div>

                    <div v-if="isPaused" class="pause-menu">
                        <div class="pause-title">游戏暂停</div>
                        <button class="btn btn-primary" @click="togglePause">继续游戏</button>
                        <button class="btn btn-secondary" @click="restartGame">重新开始</button>
                    </div>
                </div>

                <div class="game-items">
                    <button class="item-btn" 
                        :disabled="getItemCount('slow_time') <= 0"
                        @click="useItem('slow_time')">
                        <span class="item-icon">⏱️</span>
                        <span class="item-count">{{ getItemCount('slow_time') }}</span>
                    </button>
                    <button class="item-btn" 
                        :disabled="getItemCount('backward') <= 0"
                        @click="useItem('backward')">
                    <span class="item-icon">⏪</span>
                    <span class="item-count">{{ getItemCount('backward') }}</span>
                </button>
                <button class="item-btn" 
                    :disabled="getItemCount('aim') <= 0"
                    @click="useItem('aim')">
                    <span class="item-icon">🎯</span>
                    <span class="item-count">{{ getItemCount('aim') }}</span>
                </button>
                <button class="item-btn" 
                    :disabled="getItemCount('bomb') <= 0"
                    @click="useItem('bomb')">
                    <span class="item-icon">💣</span>
                    <span class="item-count">{{ getItemCount('bomb') }}</span>
                </button>
                <button class="item-btn" 
                    :disabled="getItemCount('color_change') <= 0"
                    @click="useItem('color_change')">
                    <span class="item-icon">🎨</span>
                    <span class="item-count">{{ getItemCount('color_change') }}</span>
                </button>
            </div>

            <div v-if="showGameOver" class="game-over-overlay">
            <div class="game-over-card">
                <div class="game-over-title">游戏结束</div>
                <div class="final-score">{{ gameOverData?.score }}</div>
                <div class="final-score-label">最终得分</div>
                <div style="display: flex; gap: 20px; justify-content: center; margin-bottom: 30px">
                    <div>
                        <div style="font-size: 24px; font-weight: bold; color: #f59e0b">{{ gameOverData?.maxCombo }}</div>
                        <div style="font-size: 12px; color: #6b7280">最大连击</div>
                    </div>
                    <div>
                        <div style="font-size: 24px; font-weight: bold; color: #10b981">{{ gameOverData?.ballsMatched }}</div>
                        <div style="font-size: 12px; color: #6b7280">消除珠子</div>
                    </div>
                    <div>
                        <div style="font-size: 24px; font-weight: bold; color: #3b82f6">{{ gameOverData?.duration }}s</div>
                        <div style="font-size: 12px; color: #6b7280">游戏时长</div>
                    </div>
                </div>
                <div style="display: flex; gap: 15px; justify-content: center">
                    <button class="btn btn-primary" @click="startGame">再来一局</button>
                    <button class="btn btn-secondary" @click="$emit('navigate', 'shop')">去商店</button>
                </div>
            </div>
            </div>
        </div>
    `
};

const RankingPage = {
    setup() {
        const rankings = ref([]);
        const loading = ref(true);

        const loadRankings = async () => {
            loading.value = true;
            const result = await api.getRankings(100);
            if (result.code === 0) {
                rankings.value = result.data || [];
            }
            loading.value = false;
        };

        const getRankClass = (index) => {
            if (index === 0) return 'rank-1';
            if (index === 1) return 'rank-2';
            if (index === 2) return 'rank-3';
            return '';
        };

        onMounted(() => {
            loadRankings();
        });

        return {
            rankings,
            loading,
            getRankClass
        };
    },
    template: `
        <div class="card">
            <h2 class="card-title">🏆 排行榜</h2>
            
            <div v-if="loading" class="loading">
                <div class="spinner"></div>
            </div>

            <div v-else class="ranking-list">
                <div v-for="(user, index) in rankings" :key="user.id" class="ranking-item">
                    <div class="ranking-rank" :class="getRankClass(index)">
                        {{ index + 1 }}
                    </div>
                    <div class="ranking-avatar">
                        {{ user.nickname?.charAt(0) || user.username?.charAt(0) }}
                    </div>
                    <div class="ranking-info">
                        <div class="ranking-name">{{ user.nickname || user.username }}</div>
                        <div class="ranking-level">Lv.{{ user.level }} · {{ user.total_games }} 场游戏</div>
                    </div>
                    <div class="ranking-score">{{ user.high_score }}</div>
                </div>
            </div>

            <div v-if="!loading && rankings.length === 0" style="text-align: center; padding: 40px; color: #6b7280">
                暂无排行数据
            </div>
        </div>
    `
};

const AchievementPage = {
    props: ['user'],
    setup(props) {
        const achievements = ref([]);
        const loading = ref(true);

        const loadAchievements = async () => {
            loading.value = true;
            const result = await api.getAllAchievements();
            if (result.code === 0) {
                achievements.value = result.data || [];
            }
            loading.value = false;
        };

        const unlockedCount = computed(() => {
            return achievements.value.filter(a => a.unlocked).length;
        });

        onMounted(() => {
            loadAchievements();
        });

        return {
            achievements,
            loading,
            unlockedCount
        };
    },
    template: `
        <div class="card">
            <h2 class="card-title">🎖️ 成就系统</h2>
            <div style="margin-bottom: 20px; color: #6b7280">
                已解锁 {{ unlockedCount }} / {{ achievements.length }} 个成就
            </div>
            
            <div v-if="loading" class="loading">
                <div class="spinner"></div>
            </div>

            <div v-else class="achievement-grid">
                <div v-for="ach in achievements" :key="ach.id" 
                    class="achievement-card" 
                    :class="{ unlocked: ach.unlocked }">
                    <div class="achievement-header">
                        <span class="achievement-icon">{{ ach.icon }}</span>
                        <div>
                            <div class="achievement-name">{{ ach.name }}</div>
                            <span class="achievement-reward">🪙 +{{ ach.reward_coins }}</span>
                        </div>
                    </div>
                    <div class="achievement-description">{{ ach.description }}</div>
                    <div class="achievement-status" :class="{ unlocked: ach.unlocked, locked: !ach.unlocked }">
                        {{ ach.unlocked ? '✅ 已解锁' : '🔒 未解锁' }}
                    </div>
                </div>
            </div>
        </div>
    `
};

const ShopPage = {
    props: ['user'],
    emits: ['update-user'],
    setup(props, { emit }) {
        const items = ref([]);
        const userItems = ref([]);
        const loading = ref(true);

        const loadData = async () => {
            loading.value = true;
            
            const [itemsResult, userItemsResult] = await Promise.all([
                api.getAllItems(),
                props.user ? api.getMyItems() : Promise.resolve({ data: [] })
            ]);

            if (itemsResult.code === 0) {
                items.value = itemsResult.data || [];
            }
            if (userItemsResult.code === 0) {
                userItems.value = userItemsResult.data || [];
            }
            
            loading.value = false;
        };

        const getUserItemCount = (itemType) => {
            const item = userItems.value.find(i => i.item_type === itemType);
            return item ? item.quantity : 0;
        };

        const buyItem = async (itemType, price) => {
            if (!props.user) {
                alert('请先登录');
                return;
            }

            if (props.user.coins < price) {
                alert('金币不足');
                return;
            }

            const result = await api.buyItem(itemType);
            if (result.code === 0) {
                emit('update-user', result.data.user);
                loadData();
            } else {
                alert(result.msg);
            }
        };

        onMounted(() => {
            loadData();
        });

        return {
            items,
            userItems,
            loading,
            getUserItemCount,
            buyItem
        };
    },
    template: `
        <div class="card">
            <h2 class="card-title">🛒 道具商店</h2>
            
            <div v-if="loading" class="loading">
                <div class="spinner"></div>
            </div>

            <div v-else class="shop-grid">
                <div v-for="item in items" :key="item.item_type" class="shop-item">
                    <div class="shop-item-icon">{{ item.icon }}</div>
                    <div class="shop-item-name">{{ item.name }}</div>
                    <div class="shop-item-desc">{{ item.description }}</div>
                    <div class="shop-item-price">🪙 {{ item.price }}</div>
                    <div style="margin-bottom: 10px; font-size: 12px; color: #6b7280">
                        拥有: {{ getUserItemCount(item.item_type) }}
                    </div>
                    <button class="btn btn-primary btn-block" 
                        @click="buyItem(item.item_type, item.price)">
                        购买
                    </button>
                </div>
            </div>
        </div>
    `
};

const ProfilePage = {
    props: ['user'],
    emits: ['logout', 'update-user'],
    setup(props, { emit }) {
        const activeTab = ref('info');
        const showPasswordModal = ref(false);
        const passwordForm = reactive({
            old_password: '',
            new_password: '',
            confirm_password: ''
        });

        const handleChangePassword = async () => {
            if (!passwordForm.old_password || !passwordForm.new_password) {
                alert('请填写完整信息');
                return;
            }

            if (passwordForm.new_password !== passwordForm.confirm_password) {
                alert('两次密码不一致');
                return;
            }

            const result = await api.changePassword(
                passwordForm.old_password,
                passwordForm.new_password
            );

            if (result.code === 0) {
                alert('密码修改成功，请重新登录');
                emit('logout');
            } else {
                alert(result.msg);
            }
        };

        return {
            activeTab,
            showPasswordModal,
            passwordForm,
            handleChangePassword
        };
    },
    template: `
        <div class="card">
            <div class="profile-header">
                <div class="profile-avatar">
                    {{ user?.nickname?.charAt(0) || user?.username?.charAt(0) }}
                </div>
                <div class="profile-info">
                    <div class="profile-name">{{ user?.nickname || user?.username }}</div>
                    <div class="profile-username">@{{ user?.username }}</div>
                    <div class="profile-stats">
                        <div class="profile-stat">
                            <div class="profile-stat-value">{{ user?.level }}</div>
                            <div class="profile-stat-label">等级</div>
                        </div>
                        <div class="profile-stat">
                            <div class="profile-stat-value">{{ user?.coins }}</div>
                            <div class="profile-stat-label">金币</div>
                        </div>
                        <div class="profile-stat">
                            <div class="profile-stat-value">{{ user?.high_score }}</div>
                            <div class="profile-stat-label">最高分</div>
                        </div>
                        <div class="profile-stat">
                            <div class="profile-stat-value">{{ user?.total_games }}</div>
                            <div class="profile-stat-label">游戏场数</div>
                        </div>
                        <div class="profile-stat">
                            <div class="profile-stat-value">{{ user?.max_combo }}</div>
                            <div class="profile-stat-label">最大连击</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="tabs">
                <button class="tab-btn" :class="{ active: activeTab === 'info' }" @click="activeTab = 'info'">
                    基本信息
                </button>
                <button class="tab-btn" :class="{ active: activeTab === 'security' }" @click="activeTab = 'security'">
                    安全设置
                </button>
            </div>

            <div v-if="activeTab === 'info'">
                <h3 class="section-title">基本信息</h3>
                <div class="form-group">
                    <label class="form-label">用户名</label>
                    <input type="text" class="form-input" :value="user?.username" disabled>
                </div>
                <div class="form-group">
                    <label class="form-label">昵称</label>
                    <input type="text" class="form-input" :value="user?.nickname" disabled>
                </div>
            </div>

            <div v-if="activeTab === 'security'">
                <h3 class="section-title">安全设置</h3>
                <button class="btn btn-secondary" @click="showPasswordModal = true">
                    修改密码
                </button>
                <div style="margin-top: 20px">
                    <button class="btn btn-danger" @click="$emit('logout')">
                        退出登录
                    </button>
                </div>
            </div>
        </div>

        <div v-if="showPasswordModal" class="modal-overlay" @click.self="showPasswordModal = false">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">修改密码</h3>
                    <button class="modal-close" @click="showPasswordModal = false">&times;</button>
                </div>
                <div class="form-group">
                    <label class="form-label">原密码</label>
                    <input type="password" class="form-input" v-model="passwordForm.old_password">
                </div>
                <div class="form-group">
                    <label class="form-label">新密码</label>
                    <input type="password" class="form-input" v-model="passwordForm.new_password">
                </div>
                <div class="form-group">
                    <label class="form-label">确认新密码</label>
                    <input type="password" class="form-input" v-model="passwordForm.confirm_password">
                </div>
                <button class="btn btn-primary btn-block" @click="handleChangePassword">
                    确认修改
                </button>
            </div>
        </div>
    `
};

const app = createApp(App);
app.component('auth-page', AuthPage);
app.component('game-page', GamePage);
app.component('ranking-page', RankingPage);
app.component('achievement-page', AchievementPage);
app.component('shop-page', ShopPage);
app.component('profile-page', ProfilePage);
app.mount('#app');
