const NavbarComponent = {
    props: ['user', 'userGame', 'currentPage'],
    emits: ['logout'],
    setup(props, { emit }) {
        const navItems = [
            { key: 'dashboard', label: '首页', icon: '🏠' },
            { key: 'train_shop', label: '火车商店', icon: '🚂' },
            { key: 'route_select', label: '选择线路', icon: '🗺️' },
            { key: 'history', label: '历史记录', icon: '📊' }
        ];

        const navigateTo = (page) => {
            Router.navigate(page);
        };

        const handleLogout = () => {
            emit('logout');
        };

        return {
            navItems,
            navigateTo,
            handleLogout
        };
    },
    template: `
        <nav class="navbar">
            <div class="navbar-brand">
                <span class="icon">🚂</span>
                <span>火车司机</span>
            </div>
            <div class="navbar-nav">
                <div 
                    v-for="item in navItems" 
                    :key="item.key"
                    :class="['nav-item', { active: currentPage === item.key }]"
                    @click="navigateTo(item.key)"
                >
                    {{ item.icon }} {{ item.label }}
                </div>
            </div>
            <div class="user-info">
                <div class="user-stats" v-if="userGame">
                    <div class="stat-badge level">
                        ⭐ LV.{{ userGame.level }}
                    </div>
                    <div class="stat-badge coin">
                        💰 {{ userGame.coins }}
                    </div>
                    <div class="stat-badge exp">
                        ✨ {{ userGame.experience }} EXP
                    </div>
                </div>
                <span v-if="user">{{ user.username }}</span>
                <button class="logout-btn" @click="handleLogout">退出</button>
            </div>
        </nav>
    `
};
