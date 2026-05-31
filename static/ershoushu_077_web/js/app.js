const { createApp, ref, reactive, onMounted, computed, watch, nextTick } = Vue;

const app = createApp({
    setup() {
        const currentPage = ref('login');
        const pageParams = ref({});
        const toasts = ref([]);
        const unreadCount = ref(0);
        const user = ref(null);

        const navigate = (page, params = {}) => {
            currentPage.value = page;
            pageParams.value = params;
            window.location.hash = page;
        };

        const back = () => {
            window.history.back();
        };

        const showToast = (message, type = 'info') => {
            const id = Date.now();
            toasts.value.push({ id, message, type });
            setTimeout(() => {
                toasts.value = toasts.value.filter(t => t.id !== id);
            }, 3000);
        };

        const loadUnreadCount = async () => {
            if (!AuthService.isLoggedIn()) return;
            try {
                const result = await NotificationService.getUnreadCount();
                if (result.code === 0) unreadCount.value = result.data.count;
            } catch (e) {}
        };

        const handleLogout = async () => {
            if (!confirm('确定退出登录？')) return;
            await AuthService.logout();
            user.value = null;
            navigate('login');
        };

        const handleHashChange = () => {
            const hash = window.location.hash.slice(1) || 'login';
            if (['login', 'register'].includes(hash)) {
                if (AuthService.isLoggedIn()) {
                    const u = AuthService.getCurrentUser();
                    if (u && u.role === 'admin') navigate('admin-dashboard');
                    else navigate('home');
                    return;
                }
            } else {
                if (!AuthService.isLoggedIn()) {
                    navigate('login');
                    return;
                }
            }
            currentPage.value = hash;
            user.value = AuthService.getCurrentUser();
        };

        onMounted(() => {
            window.addEventListener('hashchange', handleHashChange);
            handleHashChange();
            loadUnreadCount();
            setInterval(loadUnreadCount, 30000);
        });

        const isAdmin = computed(() => user.value && user.value.role === 'admin');

        const userNavItems = [
            { key: 'home', icon: '🏠', label: '书籍浏览' },
            { key: 'publish', icon: '📖', label: '发布书籍' },
            { key: 'my-books', icon: '📕', label: '我的书籍' },
            { key: 'my-trades', icon: '🔄', label: '我的交易' },
            { key: 'my-complaints', icon: '📢', label: '我的投诉' },
            { key: 'notifications', icon: '🔔', label: '消息通知' },
            { key: 'profile', icon: '👤', label: '个人中心' }
        ];

        const adminNavItems = [
            { key: 'admin-dashboard', icon: '📊', label: '数据统计' },
            { key: 'admin-books', icon: '📚', label: '书籍管理' },
            { key: 'admin-trades', icon: '🔄', label: '交易管理' },
            { key: 'admin-users', icon: '👥', label: '用户管理' },
            { key: 'admin-complaints', icon: '📢', label: '投诉处理' }
        ];

        const pageTitle = computed(() => {
            const titles = {
                'home': '📚 二手书交易',
                'publish': '📖 发布书籍',
                'my-books': '📕 我的书籍',
                'my-trades': '🔄 我的交易',
                'my-complaints': '📢 我的投诉',
                'notifications': '🔔 消息通知',
                'profile': '👤 个人中心',
                'book-detail': '📘 书籍详情',
                'admin-dashboard': '📊 数据统计',
                'admin-books': '📚 书籍管理',
                'admin-trades': '🔄 交易管理',
                'admin-users': '👥 用户管理',
                'admin-complaints': '📢 投诉处理'
            };
            return titles[currentPage.value] || '二手书交易系统';
        });

        return {
            currentPage, pageParams, toasts, unreadCount, user, isAdmin,
            navigate, back, showToast, handleLogout,
            userNavItems, adminNavItems, pageTitle
        };
    },
    template: `
    <div>
        <div v-if="currentPage==='login' || currentPage==='register'">
            <component :is="currentPage==='login'?'login-page':'register-page'" @navigate="navigate"></component>
        </div>
        <div v-else class="app-layout">
            <aside class="sidebar">
                <div class="sidebar-header">
                    <div class="sidebar-logo">
                        <span class="sidebar-logo-icon">📚</span>
                        <div>
                            <div class="sidebar-title">二手书交易</div>
                            <div class="sidebar-subtitle">让好书找到新主人</div>
                        </div>
                    </div>
                </div>
                <nav class="sidebar-nav">
                    <template v-if="isAdmin">
                        <div class="nav-section">管理员</div>
                        <div v-for="item in adminNavItems" :key="item.key" class="nav-item" :class="{active: currentPage===item.key}" @click="navigate(item.key)">
                            <span class="nav-item-icon">{{ item.icon }}</span>
                            <span>{{ item.label }}</span>
                        </div>
                        <div class="nav-section" style="margin-top:8px">用户功能</div>
                    </template>
                    <div v-for="item in userNavItems" :key="item.key" class="nav-item" :class="{active: currentPage===item.key}" @click="navigate(item.key)">
                        <span class="nav-item-icon">{{ item.icon }}</span>
                        <span>{{ item.label }}</span>
                        <span v-if="item.key==='notifications' && unreadCount>0" class="nav-badge">{{ unreadCount }}</span>
                    </div>
                </nav>
                <div class="sidebar-footer">
                    <div class="sidebar-user">
                        <div class="sidebar-avatar">{{ (user?.nickname||'U').charAt(0) }}</div>
                        <div class="sidebar-user-info">
                            <div class="sidebar-user-name">{{ user?.nickname || '用户' }}</div>
                            <div class="sidebar-user-role">{{ user?.role==='admin'?'管理员':'普通用户' }}</div>
                        </div>
                    </div>
                    <button class="sidebar-logout" @click="handleLogout">🚪 退出登录</button>
                </div>
            </aside>
            <div class="main-wrapper">
                <header class="main-header">
                    <h1 class="main-header-title" v-html="pageTitle"></h1>
                    <div class="main-header-right"></div>
                </header>
                <main class="main-content">
                    <home-page v-if="currentPage==='home'" :key="'home'"></home-page>
                    <book-detail-page v-else-if="currentPage==='book-detail'" :key="'detail-'+pageParams.book_id"></book-detail-page>
                    <publish-page v-else-if="currentPage==='publish'"></publish-page>
                    <my-books-page v-else-if="currentPage==='my-books'"></my-books-page>
                    <my-trades-page v-else-if="currentPage==='my-trades'"></my-trades-page>
                    <my-complaints-page v-else-if="currentPage==='my-complaints'"></my-complaints-page>
                    <notifications-page v-else-if="currentPage==='notifications'"></notifications-page>
                    <profile-page v-else-if="currentPage==='profile'"></profile-page>
                    <admin-dashboard-page v-else-if="currentPage==='admin-dashboard'"></admin-dashboard-page>
                    <admin-books-page v-else-if="currentPage==='admin-books'"></admin-books-page>
                    <admin-trades-page v-else-if="currentPage==='admin-trades'"></admin-trades-page>
                    <admin-users-page v-else-if="currentPage==='admin-users'"></admin-users-page>
                    <admin-complaints-page v-else-if="currentPage==='admin-complaints'"></admin-complaints-page>
                </main>
            </div>
        </div>
        <div class="toast-container">
            <div v-for="toast in toasts" :key="toast.id" class="toast" :class="'toast-'+toast.type">
                {{ toast.message }}
            </div>
        </div>
    </div>
    `
});

app.component('login-page', LoginPage);
app.component('register-page', RegisterPage);
app.component('home-page', HomePage);
app.component('book-detail-page', BookDetailPage);
app.component('publish-page', PublishPage);
app.component('my-books-page', MyBooksPage);
app.component('my-trades-page', MyTradesPage);
app.component('my-complaints-page', MyComplaintsPage);
app.component('notifications-page', NotificationsPage);
app.component('profile-page', ProfilePage);
app.component('admin-dashboard-page', AdminDashboardPage);
app.component('admin-books-page', AdminBooksPage);
app.component('admin-trades-page', AdminTradesPage);
app.component('admin-users-page', AdminUsersPage);
app.component('admin-complaints-page', AdminComplaintsPage);

const vm = app.mount('#app');
window.appInstance = vm;
