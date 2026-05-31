const routes = [
    { path: '/login', component: LoginPage, meta: { requiresAuth: false } },
    { path: '/register', component: RegisterPage, meta: { requiresAuth: false } },
    { path: '/', component: HomePage, meta: { requiresAuth: true } },
    { path: '/profile', component: ProfilePage, meta: { requiresAuth: true } },
    { path: '/match', component: MatchPage, meta: { requiresAuth: true } },
    { path: '/date', component: DatePage, meta: { requiresAuth: true } },
    { path: '/message', component: MessagePage, meta: { requiresAuth: true } },
    { path: '/user/:id', component: UserDetailPage, meta: { requiresAuth: true } }
];

const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    const isLoggedIn = AuthService.isLoggedIn();
    
    if (to.meta.requiresAuth && !isLoggedIn) {
        next('/login');
    } else if ((to.path === '/login' || to.path === '/register') && isLoggedIn) {
        next('/');
    } else {
        next();
    }
});
