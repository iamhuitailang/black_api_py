const { createRouter, createWebHashHistory } = VueRouter;

const routes = [
    {
        path: '/',
        name: 'home',
        component: window.HomePage,
        meta: { title: '首页' }
    },
    {
        path: '/search',
        name: 'search',
        component: window.SearchPage,
        meta: { title: '搜索' }
    },
    {
        path: '/detail/:id',
        name: 'detail',
        component: window.DetailPage,
        meta: { title: '详情' }
    },
    {
        path: '/login',
        name: 'login',
        component: window.LoginPage,
        meta: { title: '登录' }
    },
    {
        path: '/register',
        name: 'register',
        component: window.RegisterPage,
        meta: { title: '注册' }
    },
    {
        path: '/upload',
        name: 'upload',
        component: window.UploadPage,
        meta: { title: '上传表情包', requiresAuth: true }
    },
    {
        path: '/profile',
        name: 'profile',
        component: window.ProfilePage,
        meta: { title: '个人中心', requiresAuth: true }
    },
    {
        path: '/favorites',
        name: 'favorites',
        component: window.FavoritesPage,
        meta: { title: '我的收藏', requiresAuth: true }
    },
    {
        path: '/my-uploads',
        name: 'my-uploads',
        component: window.UploadsPage,
        meta: { title: '我的上传', requiresAuth: true }
    },
    {
        path: '/downloads',
        name: 'downloads',
        component: window.DownloadsPage,
        meta: { title: '下载记录', requiresAuth: true }
    },
    {
        path: '/messages',
        name: 'messages',
        component: window.MessagesPage,
        meta: { title: '消息中心', requiresAuth: true }
    },
    {
        path: '/activities',
        name: 'activities',
        component: window.ActivitiesPage,
        meta: { title: '活动中心' }
    },
    {
        path: '/admin-login',
        name: 'admin-login',
        component: window.AdminLoginPage,
        meta: { title: '管理员登录' }
    },
    {
        path: '/admin',
        name: 'admin',
        component: window.AdminPage,
        meta: { title: '管理后台', requiresAdmin: true }
    }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    if (to.meta.title) {
        document.title = to.meta.title + ' - 表情包合集';
    }

    if (to.meta.requiresAuth) {
        const token = Storage.getToken();
        if (!token) {
            Utils.showToast('请先登录', 'warning');
            next({ name: 'login', query: { redirect: to.fullPath } });
            return;
        }
    }

    if (to.meta.requiresAdmin) {
        const adminToken = Storage.getAdminToken();
        if (!adminToken) {
            Utils.showToast('请先登录管理员账号', 'warning');
            next({ name: 'admin-login', query: { redirect: to.fullPath } });
            return;
        }
    }

    next();
});

window.router = router;
