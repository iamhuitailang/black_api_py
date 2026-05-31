const App = {
    data() {
        return {
            isLoading: true,
            currentUser: null,
            showDropdown: false,
            unreadCount: 0
        };
    },
    created() {
        this.initApp();
    },
    computed: {
        showNavbar() {
            const path = this.$route.path;
            return path !== '/login' && path !== '/register';
        }
    },
    methods: {
        async initApp() {
            if (AuthService.isLoggedIn()) {
                const result = await AuthService.getCurrentUser();
                if (result.code === 0) {
                    this.currentUser = result.data;
                    Storage.setUser(result.data);
                    await this.loadUnreadCount();
                } else {
                    Storage.clear();
                    this.currentUser = null;
                    if (this.$route.path !== '/login' && this.$route.path !== '/register') {
                        this.$router.push('/login');
                    }
                }
            }
            this.isLoading = false;
        },
        async loadUnreadCount() {
            const result = await Api.get('/jaoyou/message/unread/count/get');
            if (result.code === 0) {
                this.unreadCount = result.data.count;
            }
        },
        async logout() {
            if (confirm('确定要退出登录吗？')) {
                await AuthService.logout();
                this.currentUser = null;
                this.showDropdown = false;
                this.$router.push('/login');
            }
        }
    },
    template: `
        <div>
            <div v-if="isLoading" class="loading">加载中...</div>
            <template v-else>
                <nav v-if="showNavbar" class="navbar">
                    <div class="navbar-brand">💑 相亲交友</div>
                    <div class="navbar-nav">
                        <router-link to="/" class="nav-link" :class="{ active: $route.path === '/' }">发现</router-link>
                        <router-link to="/match" class="nav-link" :class="{ active: $route.path === '/match' }">匹配</router-link>
                        <router-link to="/date" class="nav-link" :class="{ active: $route.path === '/date' }">约会</router-link>
                        <router-link to="/message" class="nav-link" :class="{ active: $route.path === '/message' }">
                            消息
                            <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
                        </router-link>
                        <div class="dropdown" @click="showDropdown = !showDropdown">
                            <div class="user-avatar">{{ currentUser ? currentUser.nickname.charAt(0) : '?' }}</div>
                            <div v-if="showDropdown" class="dropdown-menu">
                                <div class="dropdown-item" @click="$router.push('/profile')">个人资料</div>
                                <div class="dropdown-item" @click="logout">退出登录</div>
                            </div>
                        </div>
                    </div>
                </nav>
                <router-view></router-view>
            </template>
        </div>
    `
};

const app = Vue.createApp(App);
app.use(router);
app.mount('#app');
