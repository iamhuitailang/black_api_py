(function() {
const { createApp, ref, onMounted, computed, h } = Vue;
const { createRouter, createWebHashHistory, RouterView, RouterLink } = VueRouter;

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        { path: '/', component: HomePage },
        { path: '/history', component: HistoryPage },
        { path: '/achievements', component: AchievementsPage },
        { path: '/statistics', component: StatisticsPage },
        { path: '/profile', component: ProfilePage },
        { path: '/task-detail', component: TaskDetailPage },
        { path: '/create-task', component: CreateTaskPage }
    ]
});

const App = {
    setup() {
        const isLoggedIn = ref(false);
        const userInfo = ref(null);

        const userPoints = computed(() => {
            return userInfo.value ? userInfo.value.points || 0 : 0;
        });

        const userLevel = computed(() => {
            return userInfo.value ? userInfo.value.level || 1 : 1;
        });

        const checkLogin = () => {
            const token = Storage.getToken();
            const user = Storage.getUser();
            if (token && user) {
                isLoggedIn.value = true;
                userInfo.value = user;
            } else {
                isLoggedIn.value = false;
                userInfo.value = null;
            }
        };

        const loadCurrentUser = async () => {
            if (!isLoggedIn.value) return;
            
            try {
                const result = await Api.user.getCurrent();
                if (result.code === 0) {
                    userInfo.value = result.data;
                    Storage.setUser(result.data);
                } else {
                    Storage.clear();
                    isLoggedIn.value = false;
                    userInfo.value = null;
                }
            } catch (e) {
                console.error(e);
            }
        };

        const onLoginSuccess = (user) => {
            isLoggedIn.value = true;
            userInfo.value = user;
        };

        const handleLogout = () => {
            Storage.clear();
            isLoggedIn.value = false;
            userInfo.value = null;
        };

        const handleUserUpdated = () => {
            loadCurrentUser();
        };

        const goHome = () => {
            router.push('/');
        };

        onMounted(() => {
            checkLogin();
            if (isLoggedIn.value) {
                loadCurrentUser();
            }
        });

        return {
            isLoggedIn,
            userInfo,
            userPoints,
            userLevel,
            onLoginSuccess,
            handleLogout,
            handleUserUpdated,
            goHome
        };
    },
    render() {
        if (!this.isLoggedIn) {
            return h('div', [
                h(LoginPage, {
                    onLoginSuccess: this.onLoginSuccess
                })
            ]);
        }

        return h('div', { class: 'app-container' }, [
            h('header', { class: 'app-header' }, [
                h('div', { class: 'header-left', onClick: this.goHome }, [
                    h('span', { class: 'logo' }, '🌱'),
                    h('span', { class: 'app-title' }, '每日打卡')
                ]),
                h('div', { class: 'header-right' }, [
                    h('span', { class: 'user-points' }, '💰 ' + this.userPoints),
                    h('span', { class: 'user-level' }, 'Lv.' + this.userLevel)
                ])
            ]),
            h('main', { class: 'app-main' }, [
                h(RouterView, {
                    userInfo: this.userInfo,
                    onLogout: this.handleLogout,
                    onUserUpdated: this.handleUserUpdated
                })
            ]),
            h('nav', { class: 'app-tabbar' }, [
                h(RouterLink, { to: '/', class: 'tab-item', exactActiveClass: 'active' }, [
                    h('span', { class: 'tab-icon' }, '☀️'),
                    h('span', { class: 'tab-label' }, '今日')
                ]),
                h(RouterLink, { to: '/history', class: 'tab-item', activeClass: 'active' }, [
                    h('span', { class: 'tab-icon' }, '📅'),
                    h('span', { class: 'tab-label' }, '历史')
                ]),
                h(RouterLink, { to: '/achievements', class: 'tab-item', activeClass: 'active' }, [
                    h('span', { class: 'tab-icon' }, '🏆'),
                    h('span', { class: 'tab-label' }, '成就')
                ]),
                h(RouterLink, { to: '/statistics', class: 'tab-item', activeClass: 'active' }, [
                    h('span', { class: 'tab-icon' }, '📊'),
                    h('span', { class: 'tab-label' }, '统计')
                ]),
                h(RouterLink, { to: '/profile', class: 'tab-item', activeClass: 'active' }, [
                    h('span', { class: 'tab-icon' }, '👤'),
                    h('span', { class: 'tab-label' }, '我的')
                ])
            ])
        ]);
    }
};

const app = createApp(App);
app.component('login-page', LoginPage);
app.component('home-page', HomePage);
app.component('history-page', HistoryPage);
app.component('achievements-page', AchievementsPage);
app.component('statistics-page', StatisticsPage);
app.component('profile-page', ProfilePage);
app.component('task-detail-page', TaskDetailPage);
app.component('create-task-page', CreateTaskPage);
app.use(router);
app.mount('#app');
})();
