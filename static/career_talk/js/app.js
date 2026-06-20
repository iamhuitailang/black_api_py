(function() {
    const createApp = Vue.createApp;
    const ref = Vue.ref;
    const computed = Vue.computed;
    const onMounted = Vue.onMounted;
    const watch = Vue.watch;
    const reactive = Vue.reactive;
    const provide = Vue.provide;

    const App = {
        components: {
            TalkList,
            TalkDetail,
            CheckinPage,
            FeedbackPage,
            AdminPage,
            LoginPage
        },
        setup() {
            const currentPage = ref('list');
            const selectedTalkId = ref(null);
            const currentUser = ref(null);
            const isLoggedIn = ref(false);
            const isAdmin = ref(false);

            const initAuth = () => {
                const user = AuthStore.getUser();
                const token = AuthStore.getToken();
                if (user && token) {
                    currentUser.value = user;
                    isLoggedIn.value = true;
                    isAdmin.value = user.role === 'admin';
                } else {
                    currentUser.value = null;
                    isLoggedIn.value = false;
                    isAdmin.value = false;
                }
            };

            const navTabs = computed(() => {
                const tabs = [
                    { path: 'list', name: '宣讲会列表', icon: '📋', auth: false },
                    { path: 'checkin', name: '签到', icon: '✅', auth: true },
                    { path: 'feedback', name: '反馈', icon: '💬', auth: true }
                ];
                if (isAdmin.value) {
                    tabs.push({ path: 'admin', name: '管理后台', icon: '⚙️', auth: true, adminOnly: true });
                }
                return tabs;
            });

            const navigateTo = (path) => {
                const tab = navTabs.value.find(t => t.path === path);
                
                if (tab && tab.auth && !isLoggedIn.value) {
                    Toast.warning('请先登录');
                    currentPage.value = 'login';
                    return;
                }
                
                if (tab && tab.adminOnly && !isAdmin.value) {
                    Toast.error('权限不足');
                    return;
                }

                currentPage.value = path;
                selectedTalkId.value = null;
                window.location.hash = path;
            };

            const viewDetail = (id) => {
                selectedTalkId.value = id;
                currentPage.value = 'detail';
                window.location.hash = `detail/${id}`;
            };

            const goBack = () => {
                currentPage.value = 'list';
                selectedTalkId.value = null;
                window.location.hash = 'list';
            };

            const handleLoginSuccess = (user) => {
                currentUser.value = user;
                isLoggedIn.value = true;
                isAdmin.value = user.role === 'admin';
                currentPage.value = 'list';
                window.location.hash = 'list';
            };

            const handleLogout = async () => {
                try {
                    await CareerTalkApi.logout();
                } catch (e) {}
                AuthStore.logout();
                currentUser.value = null;
                isLoggedIn.value = false;
                isAdmin.value = false;
                currentPage.value = 'list';
                window.location.hash = 'list';
                Toast.success('已退出登录');
            };

            const goToLogin = () => {
                currentPage.value = 'login';
                window.location.hash = 'login';
            };

            const parseHash = () => {
                const hash = window.location.hash.slice(1);
                if (!hash) {
                    currentPage.value = isLoggedIn.value ? 'list' : 'list';
                    return;
                }

                const parts = hash.split('/');
                const page = parts[0];
                const param = parts[1];

                if (page === 'detail' && param) {
                    selectedTalkId.value = parseInt(param);
                    currentPage.value = 'detail';
                } else if (page === 'login') {
                    currentPage.value = 'login';
                } else if (['list', 'checkin', 'feedback', 'admin'].includes(page)) {
                    navigateTo(page);
                } else {
                    currentPage.value = 'list';
                }
            };

            onMounted(() => {
                initAuth();
                parseHash();
                window.addEventListener('hashchange', parseHash);
            });

            window.router = {
                navigate: (path) => navigateTo(path)
            };

            return {
                currentPage,
                selectedTalkId,
                currentUser,
                isLoggedIn,
                isAdmin,
                navTabs,
                navigateTo,
                viewDetail,
                goBack,
                handleLoginSuccess,
                handleLogout,
                goToLogin
            };
        },
        template: `
            <login-page v-if="currentPage === 'login'" @login-success="handleLoginSuccess"></login-page>
            
            <template v-else>
                <header class="header">
                    <div class="container header-inner">
                        <div class="header-left">
                            <h1 class="logo" @click="navigateTo('list')" style="cursor:pointer;">🎓 校园宣讲会</h1>
                        </div>
                        <nav class="nav-tabs">
                            <div 
                                v-for="tab in navTabs" 
                                :key="tab.path"
                                class="nav-tab" 
                                :class="{ active: currentPage === tab.path }"
                                @click="navigateTo(tab.path)"
                            >
                                <span class="tab-icon">{{ tab.icon }}</span>
                                <span>{{ tab.name }}</span>
                            </div>
                        </nav>
                        <div class="header-right">
                            <template v-if="isLoggedIn">
                                <div class="user-info">
                                    <span class="user-avatar">{{ (currentUser.real_name || currentUser.username || '?').charAt(0) }}</span>
                                    <div class="user-detail">
                                        <span class="user-name">{{ currentUser.real_name || currentUser.username }}</span>
                                        <span class="user-role" v-if="isAdmin">管理员</span>
                                        <span class="user-role" v-else>学生</span>
                                    </div>
                                </div>
                                <button class="btn btn-ghost" @click="handleLogout">退出</button>
                            </template>
                            <template v-else>
                                <button class="btn btn-primary" @click="goToLogin">登录 / 注册</button>
                            </template>
                        </div>
                    </div>
                </header>

                <main class="container main-content">
                    <talk-list 
                        v-if="currentPage === 'list'" 
                        @view-detail="viewDetail"
                    ></talk-list>
                    
                    <talk-detail 
                        v-else-if="currentPage === 'detail'" 
                        :talk-id="selectedTalkId" 
                        :is-logged-in="isLoggedIn"
                        :is-admin="isAdmin"
                        :current-user="currentUser"
                        @back="goBack"
                    ></talk-detail>
                    
                    <checkin-page 
                        v-else-if="currentPage === 'checkin'"
                        :is-logged-in="isLoggedIn"
                        :current-user="currentUser"
                        @go-login="goToLogin"
                    ></checkin-page>
                    
                    <feedback-page 
                        v-else-if="currentPage === 'feedback'" 
                        :talk-id="selectedTalkId"
                        :is-logged-in="isLoggedIn"
                        :current-user="currentUser"
                        @go-login="goToLogin"
                        @back="goBack"
                    ></feedback-page>
                    
                    <admin-page 
                        v-else-if="currentPage === 'admin'"
                        :is-admin="isAdmin"
                    ></admin-page>
                </main>

                <footer class="footer">
                    <div class="container">
                        <p>校园宣讲会管理系统 © 2024</p>
                    </div>
                </footer>
            </template>
        `
    };

    const app = createApp(App);
    app.mount('#app');
})();
