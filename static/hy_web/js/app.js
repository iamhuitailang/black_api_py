import { apiService } from './services/api.js';
import { gameStorage } from './utils/storage.js';
import { toast } from './utils/toast.js';

import LoginPage from './pages/login.js';
import RegisterPage from './pages/register.js';
import GamePage from './pages/game.js';
import ShopPage from './pages/shop.js';
import CollectionPage from './pages/collection.js';
import RuinsPage from './pages/ruins.js';
import ProfilePage from './pages/profile.js';

const { createApp, ref, reactive, onMounted, provide } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

const GAME_STATE_KEY = 'hy_game_state';

const routes = [
    { path: '/', redirect: '/login' },
    { path: '/login', component: LoginPage },
    { path: '/register', component: RegisterPage },
    { path: '/game', component: GamePage, meta: { requiresAuth: true } },
    { path: '/shop', component: ShopPage, meta: { requiresAuth: true } },
    { path: '/collection', component: CollectionPage, meta: { requiresAuth: true } },
    { path: '/ruins', component: RuinsPage, meta: { requiresAuth: true } },
    { path: '/profile', component: ProfilePage, meta: { requiresAuth: true } }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

function loadGlobalGameState() {
    try {
        const saved = localStorage.getItem(GAME_STATE_KEY);
        if (saved) {
            const state = JSON.parse(saved);
            console.log('【全局】加载游戏状态:', state);
            return state;
        }
    } catch (e) {
        console.error('【全局】加载游戏状态失败:', e);
    }
    return null;
}

function saveGlobalGameState(state) {
    try {
        const toSave = { ...state, savedAt: Date.now() };
        localStorage.setItem(GAME_STATE_KEY, JSON.stringify(toSave));
        console.log('【全局】保存游戏状态:', toSave);
    } catch (e) {
        console.error('【全局】保存游戏状态失败:', e);
    }
}

const initialState = loadGlobalGameState() || {
    submarineX: 400,
    submarineY: 300,
    currentDepth: 0,
    coins: 0,
    collected: 0,
    health: 100
};

const app = createApp({
    setup() {
        const isLoggedIn = ref(false);
        const user = ref(null);
        
        const gameState = reactive({
            submarineX: initialState.submarineX,
            submarineY: initialState.submarineY,
            currentDepth: initialState.currentDepth,
            coins: initialState.coins,
            collected: initialState.collected,
            health: initialState.health
        });

        const updateGameState = (updates) => {
            Object.assign(gameState, updates);
            saveGlobalGameState(gameState);
        };

        const resetGameState = () => {
            gameState.submarineX = 400;
            gameState.submarineY = 300;
            gameState.currentDepth = 0;
            gameState.coins = 0;
            gameState.collected = 0;
            gameState.health = 100;
            saveGlobalGameState(gameState);
        };

        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            const savedUser = gameStorage.getUser();
            
            if (token && savedUser) {
                try {
                    apiService.setToken(token);
                    const response = await apiService.getCurrentUser();
                    if (response.code === 200) {
                        user.value = response.data;
                        isLoggedIn.value = true;
                        gameStorage.setUser(response.data);
                    } else {
                        logout();
                    }
                } catch (error) {
                    console.error('验证失败:', error);
                    logout();
                }
            }
        };

        const logout = () => {
            apiService.clearToken();
            gameStorage.clearUser();
            user.value = null;
            isLoggedIn.value = false;
            router.push('/login');
            toast.info('已退出登录');
        };

        const updateUser = async () => {
            try {
                const response = await apiService.getCurrentUser();
                if (response.code === 200) {
                    user.value = response.data;
                    gameStorage.setUser(response.data);
                }
            } catch (error) {
                console.error('更新用户信息失败:', error);
            }
        };

        onMounted(() => {
            checkAuth();
            window.addEventListener('pagehide', () => saveGlobalGameState(gameState));
            window.addEventListener('beforeunload', () => saveGlobalGameState(gameState));
        });

        provide('gameState', gameState);
        provide('updateGameState', updateGameState);
        provide('resetGameState', resetGameState);

        return {
            isLoggedIn,
            user,
            logout,
            updateUser,
            gameState
        };
    }
});

router.beforeEach(async (to, from, next) => {
    const token = localStorage.getItem('token');
    
    if (to.meta.requiresAuth && !token) {
        next('/login');
    } else if ((to.path === '/login' || to.path === '/register') && token) {
        next('/game');
    } else {
        next();
    }
});

app.use(router);
app.mount('#app');
