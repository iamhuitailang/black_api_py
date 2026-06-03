(function() {
const { ref, onMounted, computed, watch } = Vue;

const MainLayout = {
    name: 'MainLayout',
    props: {
        currentPage: {
            type: String,
            default: 'home'
        }
    },
    emits: ['navigate'],
    setup(props, { emit }) {
        const menuItems = [
            { id: 'home', name: '首页', icon: '🏠' },
            { id: 'skills', name: '忍术', icon: '⚡' },
            { id: 'equipment', name: '装备', icon: '⚔️' },
            { id: 'tools', name: '忍具', icon: '🎒' },
            { id: 'levels', name: '关卡', icon: '🗺️' },
            { id: 'missions', name: '任务', icon: '📜' },
            { id: 'battle', name: '对战', icon: '⚔️' },
            { id: 'profile', name: '个人中心', icon: '👤' }
        ];

        const mobileMenuOpen = ref(false);

        const user = computed(() => GameStore.state.user);
        const chakra = computed(() => GameStore.getters.chakra.value);
        const coins = computed(() => GameStore.getters.coins.value);
        const level = computed(() => GameStore.getters.level.value);

        const checkLoginStatus = () => {
            if (!AuthService.isLoggedIn()) {
                Router.navigate('login');
                return false;
            }
            return true;
        };

        const handleNavigate = (pageId) => {
            mobileMenuOpen.value = false;
            emit('navigate', pageId);
            Router.navigate(pageId);
        };

        const handleLogout = async () => {
            if (confirm('确定要退出登录吗？')) {
                await AuthService.logout();
                Router.navigate('login');
            }
        };

        const toggleMobileMenu = () => {
            mobileMenuOpen.value = !mobileMenuOpen.value;
        };

        const isActive = (pageId) => {
            return props.currentPage === pageId;
        };

        onMounted(() => {
            if (checkLoginStatus()) {
                GameStore.loadUser();
            }
        });

        watch(() => props.currentPage, () => {
            checkLoginStatus();
        });

        return {
            menuItems,
            mobileMenuOpen,
            user,
            chakra,
            coins,
            level,
            handleNavigate,
            handleLogout,
            toggleMobileMenu,
            isActive
        };
    },
    template: `
        <div class="main-layout">
            <header class="layout-header">
                <div class="header-top">
                    <div class="header-left">
                        <div class="logo">
                            <span class="logo-icon">🍥</span>
                            <span class="logo-text">忍者训练营</span>
                        </div>
                    </div>
                    <div class="header-center" v-if="user">
                        <div class="user-stats">
                            <div class="stat-item">
                                <span class="stat-icon">💫</span>
                                <span class="stat-label">查克拉</span>
                                <span class="stat-value">{{ chakra }}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-icon">💰</span>
                                <span class="stat-label">金币</span>
                                <span class="stat-value">{{ coins }}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-icon">⭐</span>
                                <span class="stat-label">等级</span>
                                <span class="stat-value">Lv.{{ level }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="header-right" v-if="user">
                        <div class="user-info" @click="handleNavigate('profile')">
                            <div class="user-avatar">{{ user.nickname?.charAt(0) || '忍' }}</div>
                            <div class="user-detail">
                                <div class="user-name">{{ user.nickname || user.username }}</div>
                                <div class="user-level">Lv.{{ level }} 忍者</div>
                            </div>
                        </div>
                        <button class="logout-btn" @click="handleLogout" title="退出登录">
                            🚪
                        </button>
                        <button class="mobile-menu-btn" @click="toggleMobileMenu">
                            {{ mobileMenuOpen ? '✕' : '☰' }}
                        </button>
                    </div>
                </div>
                <nav class="nav-menu" :class="{ 'mobile-open': mobileMenuOpen }">
                    <div class="nav-container">
                        <div 
                            v-for="item in menuItems" 
                            :key="item.id"
                            class="nav-item"
                            :class="{ active: isActive(item.id) }"
                            @click="handleNavigate(item.id)"
                        >
                            <span class="nav-icon">{{ item.icon }}</span>
                            <span class="nav-text">{{ item.name }}</span>
                        </div>
                    </div>
                </nav>
            </header>
            <main class="layout-content">
                <slot></slot>
            </main>
            <nav class="bottom-nav" v-if="user">
                <div 
                    v-for="item in menuItems.slice(0, 5)" 
                    :key="item.id"
                    class="bottom-nav-item"
                    :class="{ active: isActive(item.id) }"
                    @click="handleNavigate(item.id)"
                >
                    <span class="bottom-nav-icon">{{ item.icon }}</span>
                    <span class="bottom-nav-text">{{ item.name }}</span>
                </div>
            </nav>
        </div>
    `
};

const Layout = {
    render(page, currentPage, app) {
        return {
            render() {
                return Vue.h(MainLayout, { 
                    currentPage: currentPage,
                    onNavigate: (pageId) => {
                        Router.navigate(pageId);
                    }
                }, {
                    default: () => Vue.h(page)
                });
            }
        };
    }
};

window.MainLayout = MainLayout;
window.Layout = Layout;
})();
