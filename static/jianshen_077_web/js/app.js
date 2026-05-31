const { createApp } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

const routes = [
    { path: '/', redirect: '/courses' },
    { path: '/login', component: LoginPage },
    { path: '/register', component: RegisterPage },
    { path: '/courses', component: CourseListPage },
    { path: '/course/:id', component: CourseDetailPage },
    { path: '/my-courses', component: MyCoursesPage },
    { path: '/checkin', component: CheckinPage },
    { path: '/notifications', component: NotificationsPage },
    { path: '/profile', component: ProfilePage },
    { path: '/admin/courses', component: AdminCourseManage },
    { path: '/admin/bookings', component: AdminBookingManage },
    { path: '/admin/members', component: AdminMemberManage },
    { path: '/admin/checkins', component: AdminCheckinManage },
    { path: '/admin/statistics', component: AdminStatistics }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    const publicPages = ['/login', '/register'];
    const authRequired = !publicPages.includes(to.path);

    if (authRequired && !AuthService.isLoggedIn()) {
        return next('/login');
    }

    if (publicPages.includes(to.path) && AuthService.isLoggedIn()) {
        const user = AuthService.getCurrentUser();
        if (user && user.role === 1) {
            return next('/admin/courses');
        }
        return next('/courses');
    }

    const adminPages = ['/admin/courses', '/admin/bookings', '/admin/members', '/admin/checkins', '/admin/statistics'];
    if (adminPages.includes(to.path)) {
        const user = AuthService.getCurrentUser();
        if (!user || user.role !== 1) {
            return next('/courses');
        }
    }

    next();
});

const app = createApp({});
app.use(router);
app.mount('#app');

window.vueRouter = router;
