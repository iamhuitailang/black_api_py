const { createApp, ref, reactive, computed, onMounted } = Vue;

const App = {
    setup() {
        const currentPage = ref('login');
        const currentUser = ref(null);
        const currentAdmin = ref(null);
        const isAdminMode = ref(false);

        const checkAuth = () => {
            if (AuthService.isLoggedIn()) {
                currentUser.value = AuthService.getCurrentUser();
            }
            if (AuthService.isAdmin()) {
                currentAdmin.value = AuthService.getCurrentAdmin();
            }
        };

        const handleLogout = async () => {
            if (confirm('确定要退出登录吗？')) {
                await AuthService.logout();
                currentUser.value = null;
                isAdminMode.value = false;
                Router.navigate('login');
            }
        };

        const handleAdminLogout = async () => {
            if (confirm('确定要退出管理员登录吗？')) {
                await AuthService.adminLogout();
                currentAdmin.value = null;
                isAdminMode.value = false;
                Router.navigate('login');
            }
        };

        const switchToAdmin = () => {
            if (AuthService.isAdmin()) {
                isAdminMode.value = true;
                Router.navigate('admin-dashboard');
            } else {
                Router.navigate('admin-login');
            }
        };

        const switchToUser = () => {
            isAdminMode.value = false;
            Router.navigate('home');
        };

        const registerRoutes = () => {
            const routes = ['login','register','home','hero-select','game','shop','ranking','achievement','profile','admin-login','admin-dashboard','admin-users','admin-heroes','admin-equipments','admin-statistics'];
            routes.forEach(route => {
                Router.register(route, () => {
                    currentPage.value = route;
                });
            });
        };

        const navigate = (path) => Router.navigate(path);

        onMounted(() => {
            checkAuth();
            registerRoutes();
            Router.init({ currentPage });
        });

        return {
            currentPage, currentUser, currentAdmin, isAdminMode,
            handleLogout, handleAdminLogout, switchToAdmin, switchToUser, checkAuth, navigate
        };
    },
    template: `
        <div class="app-container">
            <login-page v-if="currentPage === 'login'" @login-success="checkAuth"></login-page>
            <register-page v-else-if="currentPage === 'register'"></register-page>
            <admin-login-page v-else-if="currentPage === 'admin-login'" @admin-login-success="checkAuth"></admin-login-page>
            
            <template v-else>
                <header class="app-header" v-if="!isAdminMode">
                    <div class="header-content">
                        <div class="logo" @click="navigate('home')">
                            <span class="logo-icon">⚔️</span>
                            <span class="logo-text">王者荣耀</span>
                        </div>
                        <nav class="nav-menu" v-if="currentUser">
                            <a @click="navigate('home')" :class="{ active: currentPage === 'home' }">首页</a>
                            <a @click="navigate('hero-select')" :class="{ active: currentPage === 'hero-select' }">英雄</a>
                            <a @click="navigate('shop')" :class="{ active: currentPage === 'shop' }">装备</a>
                            <a @click="navigate('ranking')" :class="{ active: currentPage === 'ranking' }">排行</a>
                            <a @click="navigate('achievement')" :class="{ active: currentPage === 'achievement' }">成就</a>
                        </nav>
                        <div class="user-info" v-if="currentUser">
                            <span class="gold">💰 {{ currentUser.gold }}</span>
                            <span class="level">Lv.{{ currentUser.level }}</span>
                            <div class="user-avatar" @click="navigate('profile')">{{ currentUser.nickname.charAt(0) }}</div>
                            <button class="admin-btn" @click="switchToAdmin" v-if="currentAdmin">管理</button>
                            <button class="logout-btn" @click="handleLogout">退出</button>
                        </div>
                    </div>
                </header>

                <header class="app-header admin-header" v-else>
                    <div class="header-content">
                        <div class="logo" @click="navigate('admin-dashboard')">
                            <span class="logo-icon">🔧</span>
                            <span class="logo-text">王者管理后台</span>
                        </div>
                        <nav class="nav-menu" v-if="currentAdmin">
                            <a @click="navigate('admin-dashboard')" :class="{ active: currentPage === 'admin-dashboard' }">控制台</a>
                            <a @click="navigate('admin-users')" :class="{ active: currentPage === 'admin-users' }">用户管理</a>
                            <a @click="navigate('admin-heroes')" :class="{ active: currentPage === 'admin-heroes' }">英雄管理</a>
                            <a @click="navigate('admin-equipments')" :class="{ active: currentPage === 'admin-equipments' }">装备管理</a>
                            <a @click="navigate('admin-statistics')" :class="{ active: currentPage === 'admin-statistics' }">数据统计</a>
                        </nav>
                        <div class="user-info" v-if="currentAdmin">
                            <span class="admin-name">管理员: {{ currentAdmin.username }}</span>
                            <button class="user-btn" @click="switchToUser">用户端</button>
                            <button class="logout-btn" @click="handleAdminLogout">退出</button>
                        </div>
                    </div>
                </header>

                <main class="app-main">
                    <home-page v-if="currentPage === 'home'"></home-page>
                    <hero-select-page v-else-if="currentPage === 'hero-select'"></hero-select-page>
                    <game-page v-else-if="currentPage === 'game'" @game-end="checkAuth"></game-page>
                    <shop-page v-else-if="currentPage === 'shop'"></shop-page>
                    <ranking-page v-else-if="currentPage === 'ranking'"></ranking-page>
                    <achievement-page v-else-if="currentPage === 'achievement'"></achievement-page>
                    <profile-page v-else-if="currentPage === 'profile'" @update-user="checkAuth"></profile-page>
                    
                    <admin-dashboard-page v-else-if="currentPage === 'admin-dashboard'"></admin-dashboard-page>
                    <admin-users-page v-else-if="currentPage === 'admin-users'"></admin-users-page>
                    <admin-heroes-page v-else-if="currentPage === 'admin-heroes'"></admin-heroes-page>
                    <admin-equipments-page v-else-if="currentPage === 'admin-equipments'"></admin-equipments-page>
                    <admin-statistics-page v-else-if="currentPage === 'admin-statistics'"></admin-statistics-page>
                </main>
            </template>
        </div>
    `
};

const LoginPage = {
    emits: ['login-success'],
    setup(props, { emit }) {
        const form = reactive({ username: '', password: '' });
        const loading = ref(false);

        const handleLogin = async () => {
            if (!form.username || !form.password) { Toast.error('请输入用户名和密码'); return; }
            loading.value = true;
            try {
                const result = await AuthService.login(form.username, form.password);
                if (result.code === 0) {
                    Toast.success('登录成功');
                    emit('login-success');
                    Router.navigate('home');
                } else { Toast.error(result.msg || '登录失败'); }
            } catch (e) { Toast.error('网络错误'); }
            finally { loading.value = false; }
        };

        const goToRegister = () => Router.navigate('register');
        const goToAdminLogin = () => Router.navigate('admin-login');

        return { form, loading, handleLogin, goToRegister, goToAdminLogin };
    },
    template: `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-logo"><span class="logo-icon">⚔️</span><h1>王者荣耀</h1><p class="subtitle">5v5团队公平竞技游戏</p></div>
                <form class="auth-form" @submit.prevent="handleLogin">
                    <div class="form-group"><input type="text" v-model="form.username" placeholder="用户名" required></div>
                    <div class="form-group"><input type="password" v-model="form.password" placeholder="密码" required></div>
                    <button type="submit" class="btn-primary" :disabled="loading">{{ loading ? '登录中...' : '登录' }}</button>
                </form>
                <div class="auth-footer">
                    <a @click="goToRegister">还没有账号？立即注册</a>
                    <a @click="goToAdminLogin">管理员登录</a>
                </div>
            </div>
        </div>
    `
};

const RegisterPage = {
    setup() {
        const form = reactive({ username: '', nickname: '', password: '', confirmPassword: '' });
        const loading = ref(false);

        const handleRegister = async () => {
            if (!form.username || !form.password || !form.nickname) { Toast.error('请填写完整信息'); return; }
            if (form.password !== form.confirmPassword) { Toast.error('两次密码输入不一致'); return; }
            if (form.password.length < 6) { Toast.error('密码长度至少6位'); return; }
            loading.value = true;
            try {
                const result = await AuthService.register(form.username, form.password, form.nickname);
                if (result.code === 0) { Toast.success('注册成功，请登录'); Router.navigate('login'); }
                else { Toast.error(result.msg || '注册失败'); }
            } catch (e) { Toast.error('网络错误'); }
            finally { loading.value = false; }
        };

        const goToLogin = () => Router.navigate('login');

        return { form, loading, handleRegister, goToLogin };
    },
    template: `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-logo"><span class="logo-icon">⚔️</span><h1>用户注册</h1><p class="subtitle">加入王者峡谷，开启你的传奇</p></div>
                <form class="auth-form" @submit.prevent="handleRegister">
                    <div class="form-group"><input type="text" v-model="form.username" placeholder="用户名" required></div>
                    <div class="form-group"><input type="text" v-model="form.nickname" placeholder="昵称" required></div>
                    <div class="form-group"><input type="password" v-model="form.password" placeholder="密码（至少6位）" required></div>
                    <div class="form-group"><input type="password" v-model="form.confirmPassword" placeholder="确认密码" required></div>
                    <button type="submit" class="btn-primary" :disabled="loading">{{ loading ? '注册中...' : '注册' }}</button>
                </form>
                <div class="auth-footer"><a @click="goToLogin">已有账号？立即登录</a></div>
            </div>
        </div>
    `
};

const AdminLoginPage = {
    emits: ['admin-login-success'],
    setup(props, { emit }) {
        const form = reactive({ username: '', password: '' });
        const loading = ref(false);

        const handleLogin = async () => {
            if (!form.username || !form.password) { Toast.error('请输入用户名和密码'); return; }
            loading.value = true;
            try {
                const result = await AuthService.adminLogin(form.username, form.password);
                if (result.code === 0) {
                    Toast.success('管理员登录成功');
                    emit('admin-login-success');
                    Router.navigate('admin-dashboard');
                } else { Toast.error(result.msg || '登录失败'); }
            } catch (e) { Toast.error('网络错误'); }
            finally { loading.value = false; }
        };

        const goToUserLogin = () => Router.navigate('login');

        return { form, loading, handleLogin, goToUserLogin };
    },
    template: `
        <div class="auth-container">
            <div class="auth-card admin-card">
                <div class="auth-logo"><span class="logo-icon">🔧</span><h1>管理员登录</h1><p class="subtitle">王者荣耀管理后台</p></div>
                <form class="auth-form" @submit.prevent="handleLogin">
                    <div class="form-group"><input type="text" v-model="form.username" placeholder="管理员账号" required></div>
                    <div class="form-group"><input type="password" v-model="form.password" placeholder="密码" required></div>
                    <button type="submit" class="btn-primary btn-admin" :disabled="loading">{{ loading ? '登录中...' : '登录' }}</button>
                </form>
                <div class="auth-footer"><a @click="goToUserLogin">返回用户登录</a></div>
                <p class="tip">默认账号: admin / admin123</p>
            </div>
        </div>
    `
};

const HomePage = {
    setup() {
        const user = ref(null);
        const stats = ref(null);
        const loading = ref(true);

        const loadData = async () => {
            user.value = AuthService.getCurrentUser();
            try {
                const result = await ApiService.game.getStatistics();
                if (result.code === 0) stats.value = result.data;
            } catch (e) { console.error(e); }
            finally { loading.value = false; }
        };

        const goToHeroSelect = (mode) => Router.navigate('hero-select', { mode });
        const goToShop = () => Router.navigate('shop');
        const goToRanking = () => Router.navigate('ranking');
        const goToAchievement = () => Router.navigate('achievement');

        onMounted(() => loadData());

        return { user, stats, loading, goToHeroSelect, goToShop, goToRanking, goToAchievement };
    },
    template: `
        <div class="home-page">
            <div class="hero-banner">
                <div class="banner-content">
                    <h1>欢迎来到王者峡谷</h1>
                    <p class="subtitle">{{ user?.nickname }}，准备好迎接挑战了吗？</p>
                    <div class="banner-stats" v-if="stats">
                        <div class="stat-item"><span class="stat-value">{{ stats.total_games || 0 }}</span><span class="stat-label">总场次</span></div>
                        <div class="stat-item"><span class="stat-value">{{ stats.win_rate || 0 }}%</span><span class="stat-label">胜率</span></div>
                        <div class="stat-item"><span class="stat-value">{{ stats.total_kills || 0 }}</span><span class="stat-label">总击杀</span></div>
                        <div class="stat-item"><span class="stat-value">{{ stats.mvp_count || 0 }}</span><span class="stat-label">MVP次数</span></div>
                    </div>
                </div>
            </div>

            <div class="game-modes">
                <h2 class="section-title">选择游戏模式</h2>
                <div class="mode-cards">
                    <div class="mode-card" @click="goToHeroSelect('5v5')">
                        <div class="mode-icon">🏆</div><h3>5v5 王者峡谷</h3><p>经典5v5对战，三路推塔</p>
                        <button class="btn-primary">开始匹配</button>
                    </div>
                    <div class="mode-card" @click="goToHeroSelect('3v3')">
                        <div class="mode-icon">⚔️</div><h3>3v3 长平攻防</h3><p>快节奏3v3对战</p>
                        <button class="btn-primary">开始匹配</button>
                    </div>
                    <div class="mode-card" @click="goToHeroSelect('1v1')">
                        <div class="mode-icon">🎯</div><h3>1v1 墨家机关</h3><p>单挑对决，实力说话</p>
                        <button class="btn-primary">开始匹配</button>
                    </div>
                </div>
            </div>

            <div class="quick-actions">
                <h2 class="section-title">快捷入口</h2>
                <div class="action-grid">
                    <div class="action-item" @click="goToHeroSelect()"><span class="action-icon">🦸</span><span>英雄</span></div>
                    <div class="action-item" @click="goToShop"><span class="action-icon">🛡️</span><span>装备</span></div>
                    <div class="action-item" @click="goToRanking"><span class="action-icon">🏅</span><span>排行</span></div>
                    <div class="action-item" @click="goToAchievement"><span class="action-icon">🎖️</span><span>成就</span></div>
                </div>
            </div>
        </div>
    `
};

const HeroSelectPage = {
    setup() {
        const heroes = ref([]);
        const selectedHero = ref(null);
        const loading = ref(true);
        const gameMode = ref('5v5');
        const selectedEquipments = ref([]);
        const equipments = ref([]);

        const loadData = async () => {
            const params = Router.getParams();
            if (params.mode) gameMode.value = params.mode;
            try {
                const [mh, e] = await Promise.all([
                    ApiService.hero.getMyHeroes(), ApiService.equipment.getList()
                ]);
                if (mh.code === 0) heroes.value = mh.data || [];
                if (e.code === 0) equipments.value = e.data.items || e.data.list || [];
            } catch (e) { Toast.error('加载数据失败'); }
            finally { loading.value = false; }
        };

        const isMyHero = (heroId) => {
            const hero = heroes.value.find(h => h.id === heroId);
            return hero && hero.owned === true;
        };
        const selectHero = (hero) => {
            if (!isMyHero(hero.id)) { Toast.warning('请先购买该英雄'); return; }
            selectedHero.value = hero;
        };
        const toggleEquipment = (equip) => {
            const idx = selectedEquipments.value.findIndex(e => e.id === equip.id);
            if (idx >= 0) selectedEquipments.value.splice(idx, 1);
            else if (selectedEquipments.value.length < 6) selectedEquipments.value.push(equip);
            else Toast.warning('最多选择6件装备');
        };
        const buyHero = async (hero) => {
            if (!confirm(`确定花费 ${hero.price} 金币购买 ${hero.name} 吗？`)) return;
            try {
                const result = await ApiService.hero.buy(hero.id);
                if (result.code === 0) {
                    Toast.success('购买成功');
                    await loadData();
                } else Toast.error(result.msg || '购买失败');
            } catch (e) { Toast.error('网络错误'); }
        };
        const startGame = async () => {
            if (!selectedHero.value) { Toast.error('请选择英雄'); return; }
            Router.navigate('game', {
                heroId: selectedHero.value.id,
                heroName: selectedHero.value.name,
                mode: gameMode.value
            });
        };

        onMounted(() => loadData());

        return { heroes, selectedHero, loading, gameMode, selectedEquipments, equipments,
            isMyHero, selectHero, toggleEquipment, buyHero, startGame };
    },
    template: `
        <div class="hero-select-page">
            <div class="page-header"><h1>选择英雄</h1><div class="mode-selector"><span class="mode-badge">{{ gameMode }} 模式</span></div></div>
            <div class="hero-select-content" v-if="!loading">
                <div class="hero-list-section">
                    <h3>选择你的英雄</h3>
                    <div class="hero-grid">
                        <div v-for="hero in heroes" :key="hero.id" class="hero-card"
                            :class="{ selected: selectedHero?.id === hero.id, owned: isMyHero(hero.id), locked: !isMyHero(hero.id) }"
                            @click="selectHero(hero)">
                            <div class="hero-avatar">{{ hero.name.charAt(0) }}</div>
                            <div class="hero-name">{{ hero.name }}</div>
                            <div class="hero-title">{{ hero.title }}</div>
                            <div class="hero-type">{{ hero.position_text }}</div>
                            <div class="hero-price" v-if="!isMyHero(hero.id)">💰 {{ hero.price }}
                                <button class="buy-btn" @click.stop="buyHero(hero)">购买</button>
                            </div>
                            <div class="hero-owned" v-else>已拥有</div>
                        </div>
                    </div>
                </div>
                <div class="equipment-section">
                    <h3>选择装备 ({{ selectedEquipments.length }}/6)</h3>
                    <div class="equipment-grid">
                        <div v-for="equip in equipments" :key="equip.id" class="equipment-card"
                            :class="{ selected: selectedEquipments.some(e => e.id === equip.id) }"
                            @click="toggleEquipment(equip)">
                            <div class="equip-icon">🛡️</div>
                            <div class="equip-name">{{ equip.name }}</div>
                            <div class="equip-type">{{ equip.type_text }}</div>
                            <div class="equip-price">💰 {{ equip.price }}</div>
                        </div>
                    </div>
                </div>
                <div class="selected-info">
                    <div class="selected-hero" v-if="selectedHero">
                        <h3>已选择英雄</h3>
                        <div class="hero-detail">
                            <div class="hero-avatar-large">{{ selectedHero.name.charAt(0) }}</div>
                            <div class="hero-info">
                                <h4>{{ selectedHero.name }} - {{ selectedHero.title }}</h4>
                                <div class="hero-stats">
                                    <span>⚔️ {{ selectedHero.attack }}</span>
                                    <span>🛡️ {{ selectedHero.defense }}</span>
                                    <span>❤️ {{ selectedHero.hp }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button class="btn-primary btn-large" @click="startGame">开始游戏</button>
                </div>
            </div>
            <div class="loading" v-else>加载中...</div>
        </div>
    `
};

const GamePage = {
    emits: ['game-end'],
    setup(props, { emit }) {
        const gameId = ref(null);
        const game = ref(null);
        const gameResult = ref(null);
        const gameState = ref('loading');
        const countdown = ref(5);
        const battleLog = ref([]);
        const playerHero = ref(null);
        const enemyHero = ref(null);
        const heroInfo = ref(null);
        const gameMode = ref('1v1');

        const loadGame = async () => {
            const params = Router.getParams();
            const heroId = params.heroId;
            heroInfo.value = { id: heroId, name: params.heroName || '英雄' };
            gameMode.value = params.mode || '1v1';
            if (!heroId) { Toast.error('请先选择英雄'); Router.navigate('hero-select'); return; }
            startCountdown();
        };

        const startCountdown = () => {
            gameState.value = 'countdown';
            battleLog.value = ['⚔️ 准备战斗...'];
            const timer = setInterval(() => {
                countdown.value--;
                battleLog.value.unshift(`游戏将在 ${countdown.value} 秒后开始...`);
                if (countdown.value <= 0) { clearInterval(timer); startBattle(); }
            }, 1000);
        };

        const startBattle = async () => {
            gameState.value = 'playing';
            battleLog.value = ['⚔️ 战斗开始！'];
            try {
                const result = await ApiService.game.quickStart({
                    hero_id: heroInfo.value.id,
                    mode: gameMode.value,
                    game_type: 'casual'
                });
                if (result.code === 0) {
                    gameId.value = result.data.game_id;
                    simulateBattle(result.data);
                } else {
                    Toast.error(result.msg || '开始游戏失败');
                    Router.navigate('hero-select');
                }
            } catch (e) { Toast.error('开始游戏失败'); Router.navigate('hero-select'); }
        };

        const simulateBattle = (serverResult) => {
            let round = 1;
            let playerHp = 3000;
            let enemyHp = 3000;
            const playerAtk = 120;
            const enemyAtk = 110;
            const totalRounds = 15;

            const battleTimer = setInterval(() => {
                const pDmg = Math.floor(playerAtk * (0.8 + Math.random() * 0.4));
                const eDmg = Math.floor(enemyAtk * (0.8 + Math.random() * 0.4));
                enemyHp -= pDmg; playerHp -= eDmg;
                battleLog.value.push(`回合 ${round}:`);
                battleLog.value.push(`  我方造成 ${pDmg} 点伤害`);
                battleLog.value.push(`  敌方造成 ${eDmg} 点伤害`);
                battleLog.value.push(`  剩余: 我方 ${Math.max(0, playerHp)} / 敌方 ${Math.max(0, enemyHp)}`);
                if (round >= totalRounds || playerHp <= 0 || enemyHp <= 0) {
                    clearInterval(battleTimer);
                    endGame(serverResult);
                }
                round++;
            }, 600);
        };

        const endGame = (serverResult) => {
            gameState.value = 'finished';
            gameResult.value = serverResult;
            const isWin = serverResult.is_win;
            battleLog.value.push('');
            battleLog.value.push(`📊 战斗统计:`);
            battleLog.value.push(`  击杀: ${serverResult.player_stats?.kills || 0}`);
            battleLog.value.push(`  死亡: ${serverResult.player_stats?.deaths || 0}`);
            battleLog.value.push(`  助攻: ${serverResult.player_stats?.assists || 0}`);
            battleLog.value.push(`  经济: ${serverResult.player_stats?.gold || 0}`);
            battleLog.value.push('');
            battleLog.value.push(isWin ? '🎉 胜利！获得 100 金币 + 50 经验' : '💀 失败...获得 50 金币 + 25 经验');
            emit('game-end');
            AuthService.refreshUser();
        };

        const goToHome = () => Router.navigate('home');

        onMounted(() => loadGame());

        return { gameId, game, gameResult, gameState, countdown, battleLog, playerHero, enemyHero, heroInfo, gameMode, goToHome };
    },
    template: `
        <div class="game-page">
            <div class="game-map">
                <div class="map-header">
                    <div class="team-info blue-team">
                        <span class="team-name">蓝色方</span>
                        <div class="hero-info" v-if="heroInfo">
                            <span class="hero-avatar">{{ heroInfo.name?.charAt(0) }}</span>
                            <span>{{ heroInfo.name }}</span>
                        </div>
                    </div>
                    <div class="vs-badge">VS</div>
                    <div class="team-info red-team">
                        <span class="team-name">红色方</span>
                        <div class="hero-info">
                            <span class="hero-avatar">AI</span>
                            <span>AI对手</span>
                        </div>
                    </div>
                </div>
                <div class="battle-arena">
                    <div class="countdown" v-if="gameState === 'countdown'">
                        <div class="countdown-number">{{ countdown }}</div><p>准备战斗...</p>
                    </div>
                    <div class="battle-animation" v-if="gameState === 'playing'">
                        <div class="fighter player"><div class="fighter-avatar">{{ heroInfo?.name?.charAt(0) }}</div></div>
                        <div class="vs-text">⚔️</div>
                        <div class="fighter enemy"><div class="fighter-avatar">AI</div></div>
                    </div>
                    <div class="result-panel" v-if="gameState === 'finished' && gameResult">
                        <div class="result-title" :class="{ win: gameResult.is_win, lose: !gameResult.is_win }">
                            {{ gameResult.is_win ? '🎉 胜利！' : '💀 失败' }}
                        </div>
                        <div class="result-stats">
                            <div class="stat-row"><span>击杀</span><span>{{ gameResult.player_stats?.kills || 0 }}</span></div>
                            <div class="stat-row"><span>死亡</span><span>{{ gameResult.player_stats?.deaths || 0 }}</span></div>
                            <div class="stat-row"><span>助攻</span><span>{{ gameResult.player_stats?.assists || 0 }}</span></div>
                            <div class="stat-row"><span>经济</span><span>💰 {{ gameResult.player_stats?.gold || 0 }}</span></div>
                        </div>
                        <div class="rewards">
                            <h4>获得奖励</h4>
                            <span>💰 +{{ gameResult.is_win ? 100 : 50 }}</span>
                            <span>✨ +{{ gameResult.is_win ? 50 : 25 }}</span>
                        </div>
                        <button class="btn-primary" @click="goToHome">返回大厅</button>
                    </div>
                </div>
                <div class="battle-log">
                    <h4>战斗日志</h4>
                    <div class="log-content"><p v-for="(log, i) in battleLog" :key="i">{{ log }}</p></div>
                </div>
            </div>
        </div>
    `
};

const ShopPage = {
    setup() {
        const equipments = ref([]);
        const loading = ref(true);
        const activeTab = ref('all');
        const user = ref(null);

        const tabs = [
            { key: 'all', name: '全部' },
            { key: 'attack', name: '攻击' },
            { key: 'magic', name: '法术' },
            { key: 'defense', name: '防御' },
            { key: 'move', name: '移动' },
            { key: 'common', name: '通用' }
        ];

        const filteredEquipments = computed(() => {
            if (activeTab.value === 'all') return equipments.value;
            return equipments.value.filter(e => e.type === activeTab.value);
        });

        const loadData = async () => {
            user.value = AuthService.getCurrentUser();
            try {
                const result = await ApiService.equipment.getList();
                if (result.code === 0) equipments.value = result.data.items || result.data.list || [];
            } catch (e) { Toast.error('加载失败'); }
            finally { loading.value = false; }
        };

        onMounted(() => loadData());

        return { equipments, loading, activeTab, user, filteredEquipments, tabs };
    },
    template: `
        <div class="shop-page">
            <div class="page-header"><h1>装备商店</h1><div class="user-gold">💰 {{ user?.gold || 0 }}</div></div>
            <div class="tabs">
                <button v-for="tab in tabs" :key="tab.key" class="tab-btn" :class="{ active: activeTab === tab.key }"
                    @click="activeTab = tab.key">{{ tab.name }}</button>
            </div>
            <div class="equipment-grid large" v-if="!loading">
                <div v-for="equip in filteredEquipments" :key="equip.id" class="equipment-card large">
                    <div class="equip-icon-large">🛡️</div>
                    <div class="equip-info">
                        <h4>{{ equip.name }}</h4>
                        <p class="equip-desc">{{ equip.description }}</p>
                        <div class="equip-stats">
                            <span v-if="equip.attack_bonus">⚔️ +{{ equip.attack_bonus }}</span>
                            <span v-if="equip.defense_bonus">🛡️ +{{ equip.defense_bonus }}</span>
                            <span v-if="equip.hp_bonus">❤️ +{{ equip.hp_bonus }}</span>
                        </div>
                    </div>
                    <div class="equip-footer">
                        <span class="price">💰 {{ equip.price }}</span>
                    </div>
                </div>
            </div>
            <div class="loading" v-else>加载中...</div>
        </div>
    `
};

const RankingPage = {
    setup() {
        const rankings = ref([]);
        const myRanking = ref(null);
        const tierList = ref([]);
        const loading = ref(true);
        const activeTab = ref('all');

        const tabs = [
            { key: 'all', name: '全服排行' },
            { key: 'tier', name: '段位说明' }
        ];

        const getRankIcon = (rank) => {
            if (rank === 1) return '🥇';
            if (rank === 2) return '🥈';
            if (rank === 3) return '🥉';
            return rank;
        };

        const loadData = async () => {
            try {
                const [r, mr, t] = await Promise.all([
                    ApiService.ranking.getList(),
                    ApiService.ranking.getMyRanking(),
                    ApiService.ranking.getTierList()
                ]);
                if (r.code === 0) rankings.value = r.data.list || [];
                if (mr.code === 0) myRanking.value = mr.data;
                if (t.code === 0) tierList.value = t.data || [];
            } catch (e) { Toast.error('加载失败'); }
            finally { loading.value = false; }
        };

        onMounted(() => loadData());

        return { rankings, myRanking, tierList, loading, activeTab, getRankIcon, tabs };
    },
    template: `
        <div class="ranking-page">
            <div class="page-header"><h1>排行榜</h1></div>
            <div class="tabs">
                <button v-for="tab in tabs" :key="tab.key" class="tab-btn" :class="{ active: activeTab === tab.key }"
                    @click="activeTab = tab.key">{{ tab.name }}</button>
            </div>
            <div class="my-ranking" v-if="myRanking && activeTab === 'all'">
                <h3>我的排名</h3>
                <div class="my-rank-card">
                    <span class="rank-number">{{ myRanking.rank || '未上榜' }}</span>
                    <span class="tier-badge">{{ myRanking.tier_text || '青铜' }}</span>
                    <span class="points">{{ myRanking.ranking_points || 0 }} 积分</span>
                </div>
            </div>
            <div class="ranking-list" v-if="activeTab === 'all' && !loading">
                <div class="ranking-header">
                    <span class="col-rank">排名</span>
                    <span class="col-player">玩家</span>
                    <span class="col-tier">段位</span>
                    <span class="col-points">积分</span>
                </div>
                <div v-for="(item, index) in rankings" :key="item.id" class="ranking-item" :class="{ top3: index < 3 }">
                    <span class="col-rank">{{ getRankIcon(index + 1) }}</span>
                    <span class="col-player">
                        <span class="player-avatar">{{ item.nickname?.charAt(0) }}</span>
                        <span>{{ item.nickname }}</span>
                    </span>
                    <span class="col-tier"><span class="tier-badge">{{ item.tier_text }}</span></span>
                    <span class="col-points">{{ item.ranking_points }}</span>
                </div>
            </div>
            <div class="tier-list" v-if="activeTab === 'tier' && !loading">
                <h3>段位说明</h3>
                <div class="tier-grid">
                    <div v-for="tier in tierList" :key="tier.name" class="tier-card">
                        <h4>{{ tier.tier_text }}</h4>
                        <p>{{ tier.min_points }} - {{ tier.max_points }} 积分</p>
                    </div>
                </div>
            </div>
            <div class="loading" v-else-if="loading">加载中...</div>
        </div>
    `
};

const AchievementPage = {
    setup() {
        const achievements = ref([]);
        const myAchievements = ref([]);
        const loading = ref(true);
        const activeTab = ref('all');
        const unclaimedCount = ref(0);

        const tabs = [
            { key: 'all', name: '全部' },
            { key: 'completed', name: '已完成' },
            { key: 'uncompleted', name: '未完成' }
        ];

        const getMyProgress = (aid) => myAchievements.value.find(a => a.achievement_id === aid);
        const isCompleted = (aid) => {
            const p = getMyProgress(aid);
            return p && p.progress >= (p.target_value || 1);
        };
        const isClaimed = (aid) => {
            const p = getMyProgress(aid);
            return p && p.claimed;
        };
        const canClaim = (aid) => isCompleted(aid) && !isClaimed(aid);

        const filteredAchievements = computed(() => {
            if (activeTab.value === 'all') return achievements.value;
            return achievements.value.filter(a => {
                if (activeTab.value === 'completed') return isCompleted(a.id);
                if (activeTab.value === 'uncompleted') return !isCompleted(a.id);
                return true;
            });
        });

        const loadData = async () => {
            try {
                const [a, ma, uc] = await Promise.all([
                    ApiService.achievement.getList(),
                    ApiService.achievement.getMyAchievements(),
                    ApiService.achievement.getUnclaimedCount()
                ]);
                if (a.code === 0) achievements.value = a.data.list || [];
                if (ma.code === 0) myAchievements.value = ma.data || [];
                if (uc.code === 0) unclaimedCount.value = uc.data.count || 0;
            } catch (e) { Toast.error('加载失败'); }
            finally { loading.value = false; }
        };

        const claimReward = async (aid) => {
            try {
                const result = await ApiService.achievement.claim(aid);
                if (result.code === 0) {
                    Toast.success('领取成功');
                    await loadData();
                    AuthService.updateUser(result.data.user);
                } else Toast.error(result.msg || '领取失败');
            } catch (e) { Toast.error('网络错误'); }
        };

        onMounted(() => loadData());

        return { achievements, myAchievements, loading, activeTab, unclaimedCount,
            getMyProgress, isCompleted, isClaimed, canClaim, claimReward, filteredAchievements, tabs };
    },
    template: `
        <div class="achievement-page">
            <div class="page-header">
                <h1>成就系统</h1>
                <div class="unclaimed-badge" v-if="unclaimedCount > 0">{{ unclaimedCount }} 个可领取</div>
            </div>
            <div class="tabs">
                <button v-for="tab in tabs" :key="tab.key" class="tab-btn" :class="{ active: activeTab === tab.key }"
                    @click="activeTab = tab.key">{{ tab.name }}</button>
            </div>
            <div class="achievement-grid" v-if="!loading">
                <div v-for="a in filteredAchievements" :key="a.id" class="achievement-card"
                    :class="{ completed: isCompleted(a.id), claimed: isClaimed(a.id), claimable: canClaim(a.id) }">
                    <div class="achievement-icon">🏆</div>
                    <div class="achievement-info">
                        <h4>{{ a.name }}</h4>
                        <p class="achievement-desc">{{ a.description }}</p>
                        <div class="progress-bar">
                            <div class="progress-fill"
                                :style="{ width: Math.min(100, ((getMyProgress(a.id)?.progress || 0) / a.target_value) * 100) + '%' }">
                            </div>
                            <span class="progress-text">{{ getMyProgress(a.id)?.progress || 0 }} / {{ a.target_value }}</span>
                        </div>
                    </div>
                    <div class="achievement-action">
                        <span v-if="isClaimed(a.id)">已领取</span>
                        <button class="btn-primary btn-small" v-else-if="canClaim(a.id)" @click="claimReward(a.id)">领取</button>
                        <span v-else-if="isCompleted(a.id)">可领取</span>
                        <span v-else>未完成</span>
                    </div>
                </div>
            </div>
            <div class="loading" v-else>加载中...</div>
        </div>
    `
};

const ProfilePage = {
    emits: ['update-user'],
    setup(props, { emit }) {
        const user = ref(null);
        const loading = ref(true);
        const activeTab = ref('info');
        const gameHistory = ref([]);
        const editMode = ref(false);
        const editForm = reactive({ nickname: '' });
        const passwordForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' });

        const tabs = [
            { key: 'info', name: '个人信息' },
            { key: 'history', name: '对战记录' },
            { key: 'password', name: '修改密码' }
        ];

        const loadData = async () => {
            user.value = AuthService.getCurrentUser();
            try {
                const result = await ApiService.game.getHistory({ page_size: 10 });
                if (result.code === 0) gameHistory.value = result.data.list || [];
            } catch (e) { console.error(e); }
            finally { loading.value = false; }
        };

        const startEdit = () => { editForm.nickname = user.value.nickname; editMode.value = true; };
        const saveProfile = async () => {
            if (!editForm.nickname) { Toast.error('昵称不能为空'); return; }
            try {
                const result = await ApiService.user.updateProfile({ nickname: editForm.nickname });
                if (result.code === 0) {
                    Toast.success('保存成功');
                    user.value = AuthService.updateUser(result.data);
                    emit('update-user');
                    editMode.value = false;
                } else Toast.error(result.msg || '保存失败');
            } catch (e) { Toast.error('网络错误'); }
        };
        const changePassword = async () => {
            if (!passwordForm.oldPassword || !passwordForm.newPassword) { Toast.error('请填写完整'); return; }
            if (passwordForm.newPassword !== passwordForm.confirmPassword) { Toast.error('密码不一致'); return; }
            if (passwordForm.newPassword.length < 6) { Toast.error('密码至少6位'); return; }
            try {
                const result = await ApiService.user.changePassword({
                    old_password: passwordForm.oldPassword, new_password: passwordForm.newPassword
                });
                if (result.code === 0) {
                    Toast.success('修改成功');
                    passwordForm.oldPassword = passwordForm.newPassword = passwordForm.confirmPassword = '';
                } else Toast.error(result.msg || '修改失败');
            } catch (e) { Toast.error('网络错误'); }
        };

        onMounted(() => loadData());

        return { user, loading, activeTab, gameHistory, editMode, editForm, passwordForm,
            startEdit, saveProfile, changePassword, tabs };
    },
    template: `
        <div class="profile-page">
            <div class="page-header"><h1>个人中心</h1></div>
            <div class="profile-content" v-if="user && !loading">
                <div class="user-card">
                    <div class="user-avatar-large">{{ user.nickname.charAt(0) }}</div>
                    <div class="user-info">
                        <h2>{{ user.nickname }}</h2>
                        <p>@{{ user.username }}</p>
                        <div class="user-stats-row">
                            <span class="level-badge">Lv.{{ user.level }}</span>
                            <span>💰 {{ user.gold }}</span>
                            <span>💎 {{ user.diamonds }}</span>
                        </div>
                    </div>
                </div>
                <div class="tabs">
                    <button v-for="tab in tabs" :key="tab.key" class="tab-btn" :class="{ active: activeTab === tab.key }"
                        @click="activeTab = tab.key">{{ tab.name }}</button>
                </div>
                <div class="tab-content">
                    <div v-if="activeTab === 'info'">
                        <div class="info-form" v-if="!editMode">
                            <div class="form-row"><label>用户名</label><span>{{ user.username }}</span></div>
                            <div class="form-row"><label>昵称</label><span>{{ user.nickname }}</span></div>
                            <div class="form-row"><label>等级</label><span>Lv.{{ user.level }}</span></div>
                            <button class="btn-primary" @click="startEdit">编辑资料</button>
                        </div>
                        <div class="info-form" v-else>
                            <div class="form-row"><label>昵称</label>
                                <input type="text" v-model="editForm.nickname">
                            </div>
                            <div class="form-actions">
                                <button class="btn-secondary" @click="editMode = false">取消</button>
                                <button class="btn-primary" @click="saveProfile">保存</button>
                            </div>
                        </div>
                    </div>
                    <div v-if="activeTab === 'history'">
                        <div class="history-list">
                            <div class="history-item" v-for="g in gameHistory" :key="g.id">
                                <div class="game-result" :class="g.is_win ? 'win' : 'lose'">{{ g.is_win ? '胜利' : '失败' }}</div>
                                <div class="game-info">
                                    <span>{{ g.mode_text }}</span>
                                    <span>{{ g.hero_name }}</span>
                                    <span>{{ g.kills }}/{{ g.deaths }}/{{ g.assists }}</span>
                                </div>
                            </div>
                            <div class="empty-state" v-if="gameHistory.length === 0">暂无记录</div>
                        </div>
                    </div>
                    <div v-if="activeTab === 'password'">
                        <div class="password-form">
                            <div class="form-group"><label>原密码</label>
                                <input type="password" v-model="passwordForm.oldPassword">
                            </div>
                            <div class="form-group"><label>新密码</label>
                                <input type="password" v-model="passwordForm.newPassword">
                            </div>
                            <div class="form-group"><label>确认新密码</label>
                                <input type="password" v-model="passwordForm.confirmPassword">
                            </div>
                            <button class="btn-primary" @click="changePassword">修改密码</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="loading" v-else>加载中...</div>
        </div>
    `
};

const AdminDashboardPage = {
    setup() {
        const stats = ref(null);
        const loading = ref(true);

        const loadData = async () => {
            try {
                const result = await ApiService.admin.getStatistics();
                if (result.code === 0) stats.value = result.data;
            } catch (e) { Toast.error('加载失败'); }
            finally { loading.value = false; }
        };

        onMounted(() => loadData());

        return { stats, loading };
    },
    template: `
        <div class="admin-page">
            <div class="page-header"><h1>控制台</h1></div>
            <div class="stats-grid" v-if="stats && !loading">
                <div class="stat-card">
                    <div class="stat-icon">👥</div>
                    <div class="stat-info">
                        <div class="stat-value">{{ stats.total_users || 0 }}</div>
                        <div class="stat-label">总用户数</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🎮</div>
                    <div class="stat-info">
                        <div class="stat-value">{{ stats.total_games || 0 }}</div>
                        <div class="stat-label">总游戏数</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🦸</div>
                    <div class="stat-info">
                        <div class="stat-value">{{ stats.total_heroes || 0 }}</div>
                        <div class="stat-label">英雄数量</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🛡️</div>
                    <div class="stat-info">
                        <div class="stat-value">{{ stats.total_equipments || 0 }}</div>
                        <div class="stat-label">装备数量</div>
                    </div>
                </div>
            </div>
            <div class="loading" v-else>加载中...</div>
        </div>
    `
};

const AdminUsersPage = {
    setup() {
        const users = ref([]);
        const loading = ref(true);
        const page = ref(1);
        const pageSize = ref(20);
        const total = ref(0);

        const loadData = async () => {
            try {
                const result = await ApiService.admin.getUserList({ page: page.value, page_size: pageSize.value });
                if (result.code === 0) {
                    users.value = result.data.list || [];
                    total.value = result.data.total || 0;
                }
            } catch (e) { Toast.error('加载失败'); }
            finally { loading.value = false; }
        };

        const toggleStatus = async (user) => {
            const newStatus = user.status === 0 ? 1 : 0;
            try {
                const result = await ApiService.admin.updateUserStatus({ user_id: user.id, status: newStatus });
                if (result.code === 0) {
                    Toast.success('操作成功');
                    await loadData();
                } else Toast.error(result.msg || '操作失败');
            } catch (e) { Toast.error('网络错误'); }
        };

        onMounted(() => loadData());

        return { users, loading, page, pageSize, total, loadData, toggleStatus };
    },
    template: `
        <div class="admin-page">
            <div class="page-header"><h1>用户管理</h1></div>
            <div class="admin-table" v-if="!loading">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th><th>用户名</th><th>昵称</th><th>等级</th><th>金币</th>
                            <th>胜/负</th><th>状态</th><th>注册时间</th><th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="user in users" :key="user.id">
                            <td>{{ user.id }}</td>
                            <td>{{ user.username }}</td>
                            <td>{{ user.nickname }}</td>
                            <td>Lv.{{ user.level }}</td>
                            <td>{{ user.gold }}</td>
                            <td>{{ user.win_count }}/{{ user.lose_count }}</td>
                            <td><span :class="user.status === 0 ? 'status-active' : 'status-disabled'">
                                {{ user.status === 0 ? '正常' : '禁用' }}
                            </span></td>
                            <td>{{ user.created_at }}</td>
                            <td>
                                <button class="btn-small" @click="toggleStatus(user)">
                                    {{ user.status === 0 ? '禁用' : '启用' }}
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="loading" v-else>加载中...</div>
        </div>
    `
};

const AdminHeroesPage = {
    setup() {
        const heroes = ref([]);
        const loading = ref(true);
        const showModal = ref(false);
        const editHero = ref(null);
        const form = reactive({
            name: '', title: '', type: 'warrior', price: 6300,
            attack: 100, defense: 50, hp: 3000, mp: 1000, speed: 350, description: ''
        });

        const loadData = async () => {
            try {
                const result = await ApiService.admin.getHeroList();
                if (result.code === 0) heroes.value = result.data.list || [];
            } catch (e) { Toast.error('加载失败'); }
            finally { loading.value = false; }
        };

        const openAdd = () => {
            editHero.value = null;
            Object.assign(form, { name: '', title: '', type: 'warrior', price: 6300,
                attack: 100, defense: 50, hp: 3000, mp: 1000, speed: 350, description: '' });
            showModal.value = true;
        };

        const openEdit = (hero) => {
            editHero.value = hero;
            Object.assign(form, hero);
            showModal.value = true;
        };

        const handleSave = async () => {
            if (!form.name) { Toast.error('请输入英雄名称'); return; }
            try {
                let result;
                if (editHero.value) {
                    result = await ApiService.admin.updateHero({ id: editHero.value.id, ...form });
                } else {
                    result = await ApiService.admin.createHero(form);
                }
                if (result.code === 0) {
                    Toast.success(editHero.value ? '更新成功' : '创建成功');
                    showModal.value = false;
                    await loadData();
                } else Toast.error(result.msg || '操作失败');
            } catch (e) { Toast.error('网络错误'); }
        };

        const handleDelete = async (hero) => {
            if (!confirm(`确定删除英雄 ${hero.name} 吗？`)) return;
            try {
                const result = await ApiService.admin.deleteHero(hero.id);
                if (result.code === 0) { Toast.success('删除成功'); await loadData(); }
                else Toast.error(result.msg || '删除失败');
            } catch (e) { Toast.error('网络错误'); }
        };

        onMounted(() => loadData());

        return { heroes, loading, showModal, editHero, form, openAdd, openEdit, handleSave, handleDelete, loadData };
    },
    template: `
        <div class="admin-page">
            <div class="page-header">
                <h1>英雄管理</h1>
                <button class="btn-primary" @click="openAdd">添加英雄</button>
            </div>
            <div class="admin-table" v-if="!loading">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th><th>名称</th><th>称号</th><th>类型</th>
                            <th>价格</th><th>攻击</th><th>防御</th><th>生命</th><th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="hero in heroes" :key="hero.id">
                            <td>{{ hero.id }}</td>
                            <td>{{ hero.name }}</td>
                            <td>{{ hero.title }}</td>
                            <td>{{ hero.position_text }}</td>
                            <td>{{ hero.price }}</td>
                            <td>{{ hero.attack }}</td>
                            <td>{{ hero.defense }}</td>
                            <td>{{ hero.hp }}</td>
                            <td>
                                <button class="btn-small" @click="openEdit(hero)">编辑</button>
                                <button class="btn-small btn-danger" @click="handleDelete(hero)">删除</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="modal" v-if="showModal">
                <div class="modal-content">
                    <h3>{{ editHero ? '编辑英雄' : '添加英雄' }}</h3>
                    <div class="form-group"><label>名称</label><input type="text" v-model="form.name"></div>
                    <div class="form-group"><label>称号</label><input type="text" v-model="form.title"></div>
                    <div class="form-group"><label>类型</label>
                        <select v-model="form.type">
                            <option value="warrior">战士</option>
                            <option value="mage">法师</option>
                            <option value="archer">射手</option>
                            <option value="tank">坦克</option>
                            <option value="assassin">刺客</option>
                            <option value="support">辅助</option>
                        </select>
                    </div>
                    <div class="form-group"><label>价格</label><input type="number" v-model="form.price"></div>
                    <div class="form-group"><label>攻击</label><input type="number" v-model="form.attack"></div>
                    <div class="form-group"><label>防御</label><input type="number" v-model="form.defense"></div>
                    <div class="form-group"><label>生命</label><input type="number" v-model="form.hp"></div>
                    <div class="form-actions">
                        <button class="btn-secondary" @click="showModal = false">取消</button>
                        <button class="btn-primary" @click="handleSave">保存</button>
                    </div>
                </div>
            </div>
            <div class="loading" v-else>加载中...</div>
        </div>
    `
};

const AdminEquipmentsPage = {
    setup() {
        const equipments = ref([]);
        const loading = ref(true);
        const showModal = ref(false);
        const editEquip = ref(null);
        const form = reactive({
            name: '', type: 'attack', price: 2000,
            attack_bonus: 0, defense_bonus: 0, hp_bonus: 0, mp_bonus: 0,
            speed_bonus: 0, crit_bonus: 0, description: ''
        });

        const loadData = async () => {
            try {
                const result = await ApiService.admin.getEquipmentList();
                if (result.code === 0) equipments.value = result.data.list || [];
            } catch (e) { Toast.error('加载失败'); }
            finally { loading.value = false; }
        };

        const openAdd = () => {
            editEquip.value = null;
            Object.assign(form, { name: '', type: 'attack', price: 2000,
                attack_bonus: 0, defense_bonus: 0, hp_bonus: 0, mp_bonus: 0,
                speed_bonus: 0, crit_bonus: 0, description: '' });
            showModal.value = true;
        };

        const openEdit = (equip) => {
            editEquip.value = equip;
            Object.assign(form, equip);
            showModal.value = true;
        };

        const handleSave = async () => {
            if (!form.name) { Toast.error('请输入装备名称'); return; }
            try {
                let result;
                if (editEquip.value) {
                    result = await ApiService.admin.updateEquipment({ id: editEquip.value.id, ...form });
                } else {
                    result = await ApiService.admin.createEquipment(form);
                }
                if (result.code === 0) {
                    Toast.success(editEquip.value ? '更新成功' : '创建成功');
                    showModal.value = false;
                    await loadData();
                } else Toast.error(result.msg || '操作失败');
            } catch (e) { Toast.error('网络错误'); }
        };

        const handleDelete = async (equip) => {
            if (!confirm(`确定删除装备 ${equip.name} 吗？`)) return;
            try {
                const result = await ApiService.admin.deleteEquipment(equip.id);
                if (result.code === 0) { Toast.success('删除成功'); await loadData(); }
                else Toast.error(result.msg || '删除失败');
            } catch (e) { Toast.error('网络错误'); }
        };

        onMounted(() => loadData());

        return { equipments, loading, showModal, editEquip, form, openAdd, openEdit, handleSave, handleDelete };
    },
    template: `
        <div class="admin-page">
            <div class="page-header">
                <h1>装备管理</h1>
                <button class="btn-primary" @click="openAdd">添加装备</button>
            </div>
            <div class="admin-table" v-if="!loading">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th><th>名称</th><th>类型</th><th>价格</th>
                            <th>攻击</th><th>防御</th><th>生命</th><th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="equip in equipments" :key="equip.id">
                            <td>{{ equip.id }}</td>
                            <td>{{ equip.name }}</td>
                            <td>{{ equip.type_text }}</td>
                            <td>{{ equip.price }}</td>
                            <td>{{ equip.attack_bonus || 0 }}</td>
                            <td>{{ equip.defense_bonus || 0 }}</td>
                            <td>{{ equip.hp_bonus || 0 }}</td>
                            <td>
                                <button class="btn-small" @click="openEdit(equip)">编辑</button>
                                <button class="btn-small btn-danger" @click="handleDelete(equip)">删除</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="modal" v-if="showModal">
                <div class="modal-content">
                    <h3>{{ editEquip ? '编辑装备' : '添加装备' }}</h3>
                    <div class="form-group"><label>名称</label><input type="text" v-model="form.name"></div>
                    <div class="form-group"><label>类型</label>
                        <select v-model="form.type">
                            <option value="attack">攻击</option>
                            <option value="magic">法术</option>
                            <option value="defense">防御</option>
                            <option value="move">移动</option>
                            <option value="common">通用</option>
                        </select>
                    </div>
                    <div class="form-group"><label>价格</label><input type="number" v-model="form.price"></div>
                    <div class="form-group"><label>攻击加成</label><input type="number" v-model="form.attack_bonus"></div>
                    <div class="form-group"><label>防御加成</label><input type="number" v-model="form.defense_bonus"></div>
                    <div class="form-group"><label>生命加成</label><input type="number" v-model="form.hp_bonus"></div>
                    <div class="form-actions">
                        <button class="btn-secondary" @click="showModal = false">取消</button>
                        <button class="btn-primary" @click="handleSave">保存</button>
                    </div>
                </div>
            </div>
            <div class="loading" v-else>加载中...</div>
        </div>
    `
};

const AdminStatisticsPage = {
    setup() {
        const stats = ref(null);
        const loading = ref(true);

        const loadData = async () => {
            try {
                const result = await ApiService.admin.getStatistics();
                if (result.code === 0) stats.value = result.data;
            } catch (e) { Toast.error('加载失败'); }
            finally { loading.value = false; }
        };

        onMounted(() => loadData());

        return { stats, loading };
    },
    template: `
        <div class="admin-page">
            <div class="page-header"><h1>数据统计</h1></div>
            <div class="stats-detail" v-if="stats && !loading">
                <div class="stats-section">
                    <h3>用户统计</h3>
                    <div class="stats-grid">
                        <div class="stat-item"><span class="label">总用户数</span><span class="value">{{ stats.total_users || 0 }}</span></div>
                        <div class="stat-item"><span class="label">今日新增</span><span class="value">{{ stats.today_users || 0 }}</span></div>
                        <div class="stat-item"><span class="label">活跃用户</span><span class="value">{{ stats.active_users || 0 }}</span></div>
                    </div>
                </div>
                <div class="stats-section">
                    <h3>游戏统计</h3>
                    <div class="stats-grid">
                        <div class="stat-item"><span class="label">总游戏数</span><span class="value">{{ stats.total_games || 0 }}</span></div>
                        <div class="stat-item"><span class="label">今日游戏</span><span class="value">{{ stats.today_games || 0 }}</span></div>
                        <div class="stat-item"><span class="label">平均胜率</span><span class="value">{{ stats.avg_win_rate || 0 }}%</span></div>
                        <div class="stat-item"><span class="label">总击杀数</span><span class="value">{{ stats.total_kills || 0 }}</span></div>
                    </div>
                </div>
            </div>
            <div class="loading" v-else>加载中...</div>
        </div>
    `
};

const app = createApp(App);

app.component('login-page', LoginPage);
app.component('register-page', RegisterPage);
app.component('admin-login-page', AdminLoginPage);
app.component('home-page', HomePage);
app.component('hero-select-page', HeroSelectPage);
app.component('game-page', GamePage);
app.component('shop-page', ShopPage);
app.component('ranking-page', RankingPage);
app.component('achievement-page', AchievementPage);
app.component('profile-page', ProfilePage);
app.component('admin-dashboard-page', AdminDashboardPage);
app.component('admin-users-page', AdminUsersPage);
app.component('admin-heroes-page', AdminHeroesPage);
app.component('admin-equipments-page', AdminEquipmentsPage);
app.component('admin-statistics-page', AdminStatisticsPage);

app.mount('#app');