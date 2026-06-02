const { createApp, ref, reactive, computed, onMounted, watch } = Vue;

const App = {
    components: {
        'header-component': HeaderComponent,
        'game-lane': GameLane,
        'login-page': LoginPage,
        'register-page': RegisterPage,
        'home-page': HomePage,
        'instrument-select-page': InstrumentSelectPage,
        'difficulty-select-page': DifficultySelectPage,
        'game-page': GamePage,
        'results-page': ResultsPage,
        'leaderboard-page': LeaderboardPage,
        'achievements-page': AchievementsPage,
        'profile-page': ProfilePage,
        'admin-page': AdminPage
    },
    setup() {
        const currentUser = ref(null);
        const token = ref(null);
        const isAdmin = ref(false);
        const currentRoute = ref('login');
        const routeParams = ref({});
        
        const toast = reactive({
            show: false,
            message: '',
            type: 'info'
        });
        
        const pageComponents = {
            'login': 'login-page',
            'register': 'register-page',
            'home': 'home-page',
            'instrument-select': 'instrument-select-page',
            'difficulty-select': 'difficulty-select-page',
            'game': 'game-page',
            'results': 'results-page',
            'leaderboard': 'leaderboard-page',
            'achievements': 'achievements-page',
            'profile': 'profile-page',
            'admin': 'admin-page'
        };
        
        const currentPage = computed(() => {
            return pageComponents[currentRoute.value] || 'login-page';
        });
        
        const showToast = (message, type = 'info') => {
            toast.message = message;
            toast.type = type;
            toast.show = true;
            setTimeout(() => {
                toast.show = false;
            }, 3000);
        };
        
        const navigate = (route) => {
            const protectedRoutes = ['home', 'instrument-select', 'difficulty-select', 'game', 'results', 'leaderboard', 'achievements', 'profile', 'admin'];
            
            if (protectedRoutes.includes(route) && !currentUser.value) {
                Router.navigate('login');
                return;
            }
            
            if (route === 'admin' && !isAdmin.value) {
                showToast('没有权限访问管理面板', 'error');
                Router.navigate('home');
                return;
            }
            
            Router.navigate(route);
        };
        
        const handleRouteChange = (route, params) => {
            currentRoute.value = route;
            routeParams.value = params || {};
            
            const publicRoutes = ['login', 'register'];
            if (!publicRoutes.includes(route) && !currentUser.value) {
                Router.navigate('login');
                return;
            }
            
            if (route === 'admin' && !isAdmin.value) {
                showToast('没有权限访问管理面板', 'error');
                Router.navigate('home');
                return;
            }
        };
        
        const handleLogin = (user) => {
            currentUser.value = user;
            token.value = Storage.get('token');
            isAdmin.value = !!(user && user.is_admin);
            Storage.save('user', user);
            showToast('登录成功！欢迎回来，' + (user.nickname || user.username), 'success');
        };
        
        const handleLogout = () => {
            AuthService.logout();
            currentUser.value = null;
            token.value = null;
            isAdmin.value = false;
            showToast('已退出登录', 'info');
            navigate('login');
        };
        
        const handleGameComplete = (results) => {
            if (currentUser.value && results) {
                const expEarned = results.score > 0 ? Math.floor(results.score / 1000) : 0;
                const coinsEarned = results.rank === 'S' ? 100 : results.rank === 'A' ? 50 : results.rank === 'B' ? 30 : 10;
                
                if (currentUser.value.exp === undefined) currentUser.value.exp = 0;
                if (currentUser.value.coins === undefined) currentUser.value.coins = 0;
                
                currentUser.value.exp += expEarned;
                currentUser.value.coins += coinsEarned;
                
                const expForNextLevel = (currentUser.value.level + 1) * 1000;
                const expForCurrentLevel = currentUser.value.level * 1000;
                if (currentUser.value.exp >= expForNextLevel) {
                    currentUser.value.level = (currentUser.value.level || 1) + 1;
                    showToast('恭喜升级！当前等级: Lv.' + currentUser.value.level, 'success');
                }
                
                Storage.save('user', currentUser.value);
            }
        };
        
        const isSessionRestored = ref(false);
        
        const restoreSession = async () => {
            const storedToken = Storage.get('token');
            const storedUser = Storage.get('user');
            
            if (storedToken && storedUser) {
                try {
                    const result = await AuthService.verifyToken();
                    if (result && result.code === 0 && result.data) {
                        currentUser.value = result.data;
                        token.value = storedToken;
                        isAdmin.value = !!(result.data && result.data.is_admin);
                        Storage.save('user', result.data);
                        isSessionRestored.value = true;
                        
                        const hash = window.location.hash.slice(1);
                        if (!hash || hash === 'login' || hash === 'register') {
                            navigate('home');
                        }
                        return;
                    }
                } catch (e) {
                    console.error('Session restore error:', e);
                }
                
                Storage.remove('token');
                Storage.remove('user');
            }
            
            isSessionRestored.value = true;
            
            const hash = window.location.hash.slice(1);
            if (!hash || hash === 'login' || hash === 'register') {
                navigate('login');
            }
        };
        
        Router.register('login', () => handleRouteChange('login'));
        Router.register('register', () => handleRouteChange('register'));
        Router.register('home', () => handleRouteChange('home'));
        Router.register('instrument-select', () => handleRouteChange('instrument-select'));
        Router.register('difficulty-select', () => handleRouteChange('difficulty-select'));
        Router.register('game', () => handleRouteChange('game'));
        Router.register('results', () => handleRouteChange('results'));
        Router.register('leaderboard', () => handleRouteChange('leaderboard'));
        Router.register('achievements', () => handleRouteChange('achievements'));
        Router.register('profile', () => handleRouteChange('profile'));
        Router.register('admin', () => handleRouteChange('admin'));
        
        onMounted(() => {
            Router.init((route, params) => {
                handleRouteChange(route, params);
            }, false);
            restoreSession().then(() => {
                Router.handleRouteChange();
            });
        });
        
        return {
            currentUser,
            token,
            isAdmin,
            currentPage,
            currentRoute,
            toast,
            navigate,
            handleLogin,
            handleLogout,
            handleGameComplete
        };
    }
};

createApp(App).mount('#app');
