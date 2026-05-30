
const routes = [
    {
        path: '/',
        redirect: '/login'
    },
    {
        path: '/login',
        component: LoginView,
        meta: { guest: true }
    },
    {
        path: '/register',
        component: RegisterView,
        meta: { guest: true }
    },
    {
        path: '/lobby',
        component: LobbyView,
        meta: { requiresAuth: true }
    },
    {
        path: '/game/:id',
        component: GameView,
        meta: { requiresAuth: true }
    },
    {
        path: '/profile',
        component: ProfileView,
        meta: { requiresAuth: true }
    },
    {
        path: '/settings',
        component: SettingsView,
        meta: { requiresAuth: true }
    },
    {
        path: '/leaderboard',
        component: LeaderboardView,
        meta: { requiresAuth: true }
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/login'
    }
];

const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes
});

router.beforeEach(async (to, from, next) => {
    const isLoggedIn = Store.isLoggedIn;

    if (to.meta.requiresAuth && !isLoggedIn) {
        next('/login');
        return;
    }

    if (to.meta.guest && isLoggedIn) {
        next('/lobby');
        return;
    }

    next();
});

window.ChouchouRouter = router;
