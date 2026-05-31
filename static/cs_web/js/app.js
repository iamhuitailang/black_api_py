const { createApp, ref, reactive, onMounted, computed } = Vue;
const { createRouter, createWebHashHistory, useRouter, useRoute } = VueRouter;

window.Vue = Vue;
window.useRouter = useRouter;
window.useRoute = useRoute;
window.ref = ref;
window.reactive = reactive;
window.onMounted = onMounted;
window.computed = computed;

window.initApp = function() {
    const routes = [
        { path: '/', redirect: '/home' },
        { path: '/login', component: LoginPage },
        { path: '/register', component: RegisterPage },
        { path: '/home', component: HomePage, meta: { requiresAuth: true } },
        { path: '/game', component: GamePage, meta: { requiresAuth: true } },
        { path: '/profile', component: ProfilePage, meta: { requiresAuth: true } },
        { path: '/leaderboard', component: LeaderboardPage, meta: { requiresAuth: true } },
        { path: '/achievements', component: AchievementsPage, meta: { requiresAuth: true } },
        { path: '/admin', component: AdminDashboard, meta: { requiresAuth: true, requiresAdmin: true } },
        { path: '/admin/users', component: AdminUsers, meta: { requiresAuth: true, requiresAdmin: true } },
        { path: '/admin/weapons', component: AdminWeapons, meta: { requiresAuth: true, requiresAdmin: true } },
        { path: '/admin/maps', component: AdminMaps, meta: { requiresAuth: true, requiresAdmin: true } },
        { path: '/admin/statistics', component: AdminStatistics, meta: { requiresAuth: true, requiresAdmin: true } }
    ];

    const router = createRouter({
        history: createWebHashHistory(),
        routes
    });

    router.beforeEach((to, from, next) => {
        const user = Storage.getUser();
        const token = Storage.getToken();
        const isAuthenticated = user && token;

        if (to.meta.requiresAuth && !isAuthenticated) {
            next('/login');
        } else if (to.meta.requiresAdmin && user && user.role !== 'admin') {
            next('/home');
        } else if ((to.path === '/login' || to.path === '/register') && isAuthenticated) {
            next('/home');
        } else {
            next();
        }
    });

    const app = createApp({
        setup() {
            const loading = ref(true);

            onMounted(() => {
                setTimeout(() => {
                    loading.value = false;
                }, 500);
            });

            return { loading };
        }
    });

    app.use(router);
    app.mount('#app');
};
