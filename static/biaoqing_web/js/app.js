(function() {
    const { createApp, ref, computed, onMounted, watch } = Vue;
    
    const App = {
        template: `
            <div class="app-wrapper" :class="{ 'admin-layout': isAdminRoute }">
                <header class="app-header" v-if="!isAdminRoute">
                    <div class="header-content">
                        <div class="logo" @click="goHome">
                            <span class="logo-icon">😆</span>
                            <span class="logo-text">表情包合集</span>
                        </div>
    
                        <div class="search-bar">
                            <input 
                                type="text" 
                                class="search-input" 
                                v-model="searchKeyword"
                                @keyup.enter="doSearch"
                                placeholder="搜索表情包..."
                            >
                            <button class="search-btn" @click="doSearch">
                                🔍
                            </button>
                        </div>
    
                        <nav class="nav-menu">
                            <router-link :to="{ name: 'home' }" class="nav-item" active-class="active">
                                🏠 首页
                            </router-link>
                            <router-link :to="{ name: 'activities' }" class="nav-item" active-class="active">
                                🎉 活动
                            </router-link>
                            <router-link :to="{ name: 'upload' }" class="nav-item upload-btn" active-class="active">
                                ➕ 上传
                            </router-link>
    
                            <template v-if="isLoggedIn">
                                <div class="user-menu">
                                    <div class="user-avatar">{{ userAvatar }}</div>
                                    <div class="user-dropdown">
                                        <div class="dropdown-header">
                                            <span class="dropdown-name">{{ userName }}</span>
                                            <span class="dropdown-points">⭐ {{ userPoints }} 积分</span>
                                        </div>
                                        <router-link :to="{ name: 'profile' }" class="dropdown-item">
                                            👤 个人中心
                                        </router-link>
                                        <router-link :to="{ name: 'favorites' }" class="dropdown-item">
                                            ❤️ 我的收藏
                                        </router-link>
                                        <router-link :to="{ name: 'my-uploads' }" class="dropdown-item">
                                            📤 我的上传
                                        </router-link>
                                        <router-link :to="{ name: 'downloads' }" class="dropdown-item">
                                            📥 下载记录
                                        </router-link>
                                        <router-link :to="{ name: 'messages' }" class="dropdown-item">
                                            💬 消息中心
                                            <span class="badge" v-if="unreadCount > 0">{{ unreadCount }}</span>
                                        </router-link>
                                        <div class="dropdown-divider"></div>
                                        <div class="dropdown-item logout" @click="handleLogout">
                                            🚪 退出登录
                                        </div>
                                    </div>
                                </div>
                            </template>
    
                            <template v-else>
                                <router-link :to="{ name: 'login' }" class="nav-item nav-login">
                                    登录
                                </router-link>
                                <router-link :to="{ name: 'register' }" class="nav-item nav-register">
                                    注册
                                </router-link>
                            </template>
                        </nav>
                    </div>
                </header>
    
                <main class="app-main">
                    <router-view />
                </main>
    
                <footer class="app-footer" v-if="!isAdminRoute">
                    <div class="footer-content">
                        <div class="footer-links">
                            <a href="#">关于我们</a>
                            <a href="#">用户协议</a>
                            <a href="#">隐私政策</a>
                            <a href="#">联系我们</a>
                            <a href="#">意见反馈</a>
                        </div>
                        <div class="footer-copyright">
                            © 2024 表情包合集. All rights reserved.
                        </div>
                    </div>
                </footer>
    
                <div class="back-to-top" v-if="showBackToTop" @click="scrollToTop">
                    ↑
                </div>
            </div>
        `,
        setup() {
            const router = VueRouter.useRouter();
            const route = VueRouter.useRoute();
    
            const searchKeyword = ref('');
            const showBackToTop = ref(false);
            const unreadCount = ref(0);
            const loggedIn = ref(Auth.isLoggedIn());
    
            const isLoggedIn = computed(() => loggedIn.value);
    
            const refreshAuthState = () => {
                const wasLoggedIn = loggedIn.value;
                loggedIn.value = Auth.isLoggedIn();
                if (!wasLoggedIn && loggedIn.value) {
                    loadUnreadCount();
                }
            };
    
            const isAdminRoute = computed(() => {
                return route.name === 'admin' || route.name === 'admin-login';
            });
    
            const userAvatar = computed(() => {
                const user = Auth.getCurrentUser();
                if (user && user.nickname) {
                    return user.nickname.charAt(0).toUpperCase();
                }
                if (user && user.username) {
                    return user.username.charAt(0).toUpperCase();
                }
                return 'U';
            });
    
            const userName = computed(() => {
                const user = Auth.getCurrentUser();
                if (user) {
                    return user.nickname || user.username;
                }
                return '';
            });
    
            const userPoints = computed(() => {
                const user = Auth.getCurrentUser();
                if (user) {
                    return user.points || 0;
                }
                return 0;
            });
    
            const goHome = () => {
                router.push({ name: 'home' });
            };
    
            const doSearch = () => {
                if (searchKeyword.value.trim()) {
                    router.push({ 
                        name: 'search', 
                        query: { keyword: searchKeyword.value } 
                    });
                }
            };
    
            const handleLogout = async () => {
                if (confirm('确定要退出登录吗？')) {
                    await Auth.logout();
                    refreshAuthState();
                    Utils.showToast('已退出登录', 'success');
                    router.push({ name: 'home' });
                }
            };
    
            const loadUnreadCount = async () => {
                if (!isLoggedIn.value) return;
                
                try {
                    const result = await API.message.getUnreadCount();
                    if (result.code === 0 && result.data) {
                        unreadCount.value = result.data.count || 0;
                    }
                } catch (error) {
                    console.error('Load unread count error:', error);
                }
            };
    
            const scrollToTop = () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };
    
            const handleScroll = () => {
                showBackToTop.value = window.scrollY > 300;
            };
    
            watch(() => route.name, (newName) => {
                refreshAuthState();
                if (newName === 'search') {
                    searchKeyword.value = route.query.keyword || '';
                } else {
                    searchKeyword.value = '';
                }
            });
    
            onMounted(() => {
                window.addEventListener('scroll', handleScroll);
                refreshAuthState();
                
                if (isLoggedIn.value) {
                    loadUnreadCount();
                }
                setInterval(() => {
                    if (Auth.isLoggedIn()) {
                        loadUnreadCount();
                    }
                }, 60000);
            });
    
            return {
                searchKeyword,
                showBackToTop,
                unreadCount,
                isLoggedIn,
                isAdminRoute,
                userAvatar,
                userName,
                userPoints,
                goHome,
                doSearch,
                handleLogout,
                scrollToTop,
                refreshAuthState,
                Utils
            };
        }
    };
    
    const app = createApp(App);
    
    app.use(router);
    app.use(ElementPlus);
    
    try {
    const Icons = window.ElementPlusIconsVue || window['@element-plus/icons-vue'];
    if (Icons) {
        for (const [key, component] of Object.entries(Icons)) {
            app.component(key, component);
        }
    }
} catch (e) {
    console.warn('图标库加载失败，部分图标可能不显示', e);
}

app.config.errorHandler = function(err, vm, info) {
    console.error('Vue 错误:', err, info);
};

app.mount('#app');
})();
