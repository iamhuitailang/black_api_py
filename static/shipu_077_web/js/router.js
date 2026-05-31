const { createRouter, createWebHashHistory } = VueRouter;

const router = createRouter({
    history: createWebHashHistory(),
    routes: []
});

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('shipu_token');
    const adminToken = localStorage.getItem('shipu_admin_token');

    if (to.meta.requiresAuth && !token) {
        next('/login');
    } else if (to.path.startsWith('/admin/') && !adminToken) {
        next('/admin');
    } else {
        document.title = (to.meta.title || '美食食谱') + ' - 美食食谱分享平台';
        next();
    }
});
