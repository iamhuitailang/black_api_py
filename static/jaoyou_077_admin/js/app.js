const App = {
    data() {
        return {
            isLoading: true,
            currentAdmin: null
        };
    },
    created() {
        this.initApp();
    },
    computed: {
        showSidebar() {
            const path = this.$route.path;
            return path !== '/login';
        }
    },
    methods: {
        async initApp() {
            if (AdminAuthService.isLoggedIn()) {
                const result = await AdminAuthService.getCurrentAdmin();
                if (result.code === 0) {
                    this.currentAdmin = result.data;
                    Storage.setUser(result.data);
                } else {
                    Storage.clear();
                    this.currentAdmin = null;
                    if (this.$route.path !== '/login') {
                        this.$router.push('/login');
                    }
                }
            }
            this.isLoading = false;
        },
        async logout() {
            if (confirm('确定要退出登录吗？')) {
                await AdminAuthService.logout();
                this.currentAdmin = null;
                this.$router.push('/login');
            }
        },
        isActive(path) {
            return this.$route.path === path;
        }
    },
    template: `
        <div>
            <div v-if="isLoading" class="loading">加载中...</div>
            <template v-else>
                <template v-if="showSidebar">
                    <div class="admin-layout">
                        <aside class="sidebar">
                            <div class="sidebar-header">
                                <div class="sidebar-title">💑 相亲交友</div>
                                <div class="sidebar-subtitle">管理后台</div>
                            </div>
                            <nav class="sidebar-nav">
                                <router-link to="/" class="nav-item" :class="{ active: isActive('/') }">
                                    <span>📊</span>
                                    <span>数据统计</span>
                                </router-link>
                                <router-link to="/user" class="nav-item" :class="{ active: isActive('/user') }">
                                    <span>👥</span>
                                    <span>用户管理</span>
                                </router-link>
                                <router-link to="/match" class="nav-item" :class="{ active: isActive('/match') }">
                                    <span>💕</span>
                                    <span>匹配管理</span>
                                </router-link>
                                <router-link to="/date" class="nav-item" :class="{ active: isActive('/date') }">
                                    <span>📅</span>
                                    <span>约会管理</span>
                                </router-link>
                                <router-link to="/complaint" class="nav-item" :class="{ active: isActive('/complaint') }">
                                    <span>⚠️</span>
                                    <span>投诉管理</span>
                                </router-link>
                            </nav>
                            <div class="sidebar-footer">
                                <button class="logout-btn" @click="logout">退出登录</button>
                            </div>
                        </aside>
                        <main class="main-content">
                            <router-view></router-view>
                        </main>
                    </div>
                </template>
                <template v-else>
                    <router-view></router-view>
                </template>
            </template>
        </div>
    `
};

const app = Vue.createApp(App);
app.use(router);
app.mount('#app');
