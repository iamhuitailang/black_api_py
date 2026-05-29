const { createRouter, createWebHashHistory } = VueRouter;

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: LoginPage,
        meta: { requiresAuth: false }
    },
    {
        path: '/register',
        name: 'Register',
        component: RegisterPage,
        meta: { requiresAuth: false }
    },
    {
        path: '/',
        name: 'Home',
        component: HomePage,
        meta: { requiresAuth: true }
    },
    {
        path: '/favorites',
        name: 'Favorites',
        component: FavoritesPage,
        meta: { requiresAuth: true }
    },
    {
        path: '/recommend',
        name: 'Recommend',
        component: RecommendPage,
        meta: { requiresAuth: true }
    },
    {
        path: '/admin',
        name: 'Admin',
        component: AdminDashboard,
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/admin/movies',
        name: 'AdminMovies',
        component: MovieManagePage,
        meta: { requiresAuth: true, requiresAdmin: true }
    }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    const isLoggedIn = AuthService.isLoggedIn();
    const isAdmin = AuthService.isAdmin();

    if (to.meta.requiresAuth && !isLoggedIn) {
        next('/login');
    } else if (to.meta.requiresAdmin && !isAdmin) {
        next('/');
    } else if ((to.path === '/login' || to.path === '/register') && isLoggedIn) {
        next('/');
    } else {
        next();
    }
});
