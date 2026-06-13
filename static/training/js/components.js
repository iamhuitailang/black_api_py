const GlobalStore = VueApi.reactive({
    currentUser: Utils.getCurrentUser(),
    currentPage: 'login'
});

const LayoutWrapper = {
    components: {},
    setup(props, { slots }) {
        const user = VueApi.computed(() => GlobalStore.currentUser);
        const currentPage = VueApi.computed(() => GlobalStore.currentPage);
        const showDropdown = VueApi.ref(false);

        const hrMenu = [
            { key: 'hr-courses', name: '课程管理', icon: '📚' },
            { key: 'hr-leaves', name: '请假审批', icon: '📋' },
            { key: 'hr-quiz', name: '测评管理', icon: '✍️' },
            { key: 'hr-statistics', name: '统计报表', icon: '📊' }
        ];

        const empMenu = [
            { key: 'emp-courses', name: '我的培训', icon: '📚' },
            { key: 'emp-checkin', name: '培训签到', icon: '✅' },
            { key: 'emp-quiz', name: '课程测评', icon: '✍️' }
        ];

        const commonMenu = [
            { key: 'profile', name: '培训档案', icon: '📁' }
        ];

        const menuItems = VueApi.computed(() => {
            const base = user.value && user.value.role === 'hr' ? hrMenu : empMenu;
            return [...base, ...commonMenu];
        });

        const pageTitles = {
            'hr-courses': '课程管理',
            'hr-leaves': '请假审批',
            'hr-quiz': '测评管理',
            'hr-statistics': '统计报表',
            'emp-courses': '我的培训',
            'emp-checkin': '培训签到',
            'emp-quiz': '课程测评',
            'profile': '培训档案'
        };

        const navigate = (key) => {
            GlobalStore.currentPage = key;
            showDropdown.value = false;
        };

        const logout = () => {
            Utils.clearCurrentUser();
            GlobalStore.currentUser = null;
            GlobalStore.currentPage = 'login';
        };

        return { user, currentPage, menuItems, pageTitles, navigate, logout, showDropdown };
    },
    template: `
        <div class="layout">
            <aside class="sidebar">
                <div class="sidebar-header">
                    <div class="sidebar-logo-icon">培</div>
                    <span class="sidebar-logo-text">培训管理系统</span>
                </div>
                <nav class="sidebar-menu">
                    <div v-for="item in menuItems" :key="item.key"
                         class="menu-item"
                         :class="{ active: currentPage === item.key }"
                         @click="navigate(item.key)">
                        <span class="menu-icon">{{ item.icon }}</span>
                        <span>{{ item.name }}</span>
                    </div>
                </nav>
                <div class="sidebar-footer">
                    <div class="user-info">
                        <div class="user-avatar">{{ user?.name?.charAt(0) || 'U' }}</div>
                        <div class="user-details">
                            <div class="user-name">{{ user?.name }}</div>
                            <div class="user-dept">{{ user?.department }} · {{ user?.role === 'hr' ? '管理员' : '员工' }}</div>
                        </div>
                        <button class="logout-btn" @click="logout">退出</button>
                    </div>
                </div>
            </aside>
            <div class="main-wrapper">
                <header class="header">
                    <h1 class="header-title">{{ pageTitles[currentPage] || '' }}</h1>
                </header>
                <main class="main-content">
                    <slot></slot>
                </main>
            </div>
        </div>
    `
};

window.LayoutWrapper = LayoutWrapper;
window.GlobalStore = GlobalStore;
