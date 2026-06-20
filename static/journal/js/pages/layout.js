const MainLayout = {
    props: ['pageTitle', 'currentPage'],
    data() {
        return {
            roleInfo: Storage.getRoleInfo() || {},
            userInfo: Storage.getUser() || {},
            sidebarOpen: true
        };
    },
    computed: {
        menuItems() {
            const role = this.roleInfo.role || 'author';
            const items = [];

            if (role === 'author' || role === 'admin') {
                items.push({ key: 'submit', icon: '📝', label: '投稿', role: 'author' });
                items.push({ key: 'submissions', icon: '📋', label: '我的投稿', role: 'author' });
            }
            if (role === 'reviewer' || role === 'admin') {
                items.push({ key: 'review-tasks', icon: '🔍', label: '审稿任务', role: 'reviewer' });
            }
            if (role === 'editor' || role === 'admin') {
                items.push({ key: 'editor-dashboard', icon: '📊', label: '编辑工作台', role: 'editor' });
                items.push({ key: 'all-manuscripts', icon: '📚', label: '全部稿件', role: 'editor' });
            }
            return items;
        }
    },
    methods: {
        navigate(page) {
            this.$root.navigateTo(page);
        },
        async handleLogout() {
            if (confirm('确定要退出登录吗？')) {
                await JournalService.logout();
                Toast.success('已退出登录');
                this.$root.navigateTo('login');
            }
        },
        async refreshRoleInfo() {
            const res = await JournalService.getRoleInfo();
            if (res.code === 0 && res.data) {
                this.roleInfo = res.data;
                Storage.setRoleInfo(res.data);
            }
        }
    },
    mounted() {
        this.refreshRoleInfo();
    },
    template: `
        <div class="app-layout">
            <aside class="app-sidebar" :class="{ open: sidebarOpen }">
                <div class="sidebar-brand">
                    <div class="sidebar-brand-icon">📚</div>
                    <div class="sidebar-brand-text">期刊审稿系统</div>
                </div>

                <nav class="sidebar-menu">
                    <div class="sidebar-menu-title">功能导航</div>
                    <div
                        v-for="item in menuItems"
                        :key="item.key"
                        class="sidebar-menu-item"
                        :class="{ active: currentPage === item.key }"
                        @click="navigate(item.key)"
                    >
                        <span class="sidebar-menu-icon">{{ item.icon }}</span>
                        <span>{{ item.label }}</span>
                    </div>
                </nav>

                <div class="sidebar-user">
                    <div class="sidebar-avatar">{{ roleInfo.real_name ? $helpers.getAvatar(roleInfo.real_name) : $helpers.getAvatar(userInfo.username) }}</div>
                    <div class="sidebar-user-info">
                        <div class="sidebar-user-name">{{ roleInfo.real_name || userInfo.username || '用户' }}</div>
                        <div class="sidebar-user-role">{{ roleInfo.role_label || '用户' }}</div>
                    </div>
                    <div class="sidebar-logout" @click="handleLogout" title="退出登录">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    </div>
                </div>
            </aside>

            <div class="app-main">
                <header class="app-header">
                    <div class="header-title">{{ pageTitle }}</div>
                    <div class="header-right">
                        <span class="header-role">{{ roleInfo.role_label || '用户' }}</span>
                        <div class="user-info">
                            <div class="user-avatar" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);">{{ roleInfo.real_name ? $helpers.getAvatar(roleInfo.real_name) : $helpers.getAvatar(userInfo.username) }}</div>
                            <span class="user-name">{{ roleInfo.real_name || userInfo.username }}</span>
                        </div>
                    </div>
                </header>

                <main class="app-content">
                    <slot></slot>
                </main>
            </div>
        </div>
    `
};

const ProgressBar = {
    props: {
        currentStep: { type: Number, default: 1 },
        totalSteps: { type: Number, default: 6 },
        stepNames: { type: Array, default: () => ['投稿', '提交', '审稿中', '审稿完成', '编辑决定', '发表/结束'] }
    },
    computed: {
        progressWidth() {
            if (this.totalSteps <= 1) return '0%';
            return `${((this.currentStep - 1) / (this.totalSteps - 1)) * 100}%`;
        }
    },
    methods: {
        getClass(index) {
            const step = index + 1;
            if (step < this.currentStep) return 'completed';
            if (step === this.currentStep) return 'current';
            if (step <= this.currentStep) return 'active';
            return '';
        },
        getIcon(index) {
            const step = index + 1;
            if (step < this.currentStep) return '✓';
            return step;
        }
    },
    template: `
        <div class="progress-container">
            <div class="progress-steps">
                <div class="progress-bar-fill" :style="{ width: progressWidth }"></div>
                <div
                    v-for="(name, idx) in stepNames"
                    :key="idx"
                    class="step-item"
                    :class="getClass(idx)"
                >
                    <div class="step-circle">{{ getIcon(idx) }}</div>
                    <div class="step-label">{{ name }}</div>
                </div>
            </div>
        </div>
    `
};
