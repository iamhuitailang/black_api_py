const routes = [
    { path: '/login', component: AdminLoginPage, meta: { requiresAuth: false } },
    { path: '/', component: AdminDashboardPage, meta: { requiresAuth: true } },
    { path: '/user', component: AdminUserPage, meta: { requiresAuth: true } },
    { path: '/match', component: AdminMatchPage, meta: { requiresAuth: true } },
    { path: '/date', component: AdminDatePage, meta: { requiresAuth: true } },
    { path: '/complaint', component: AdminComplaintPage, meta: { requiresAuth: true } }
];

const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    const isLoggedIn = AdminAuthService.isLoggedIn();
    
    if (to.meta.requiresAuth && !isLoggedIn) {
        next('/login');
    } else if (to.path === '/login' && isLoggedIn) {
        next('/');
    } else {
        next();
    }
});
