const AppLayout = {
    tabs: [
        { name: 'home', label: '首页', icon: '🏠' },
        { name: 'checkin', label: '打卡', icon: '📝' },
        { name: 'statistics', label: '统计', icon: '📊' },
        { name: 'plans', label: '计划', icon: '🎯' },
        { name: 'profile', label: '我的', icon: '👤' },
    ],

    render(content, title) {
        const app = document.getElementById('app');
        const user = Storage.getUser() || {};
        const initial = (user.nickname || user.username || 'U').charAt(0).toUpperCase();
        const isTabRoute = Router.isTabRoute(Router.current);
        const showHeader = isTabRoute;
        const showTabBar = isTabRoute;
        const showSubHeader = !isTabRoute && Router.current !== 'login' && Router.current !== 'register';

        app.innerHTML = `
            ${showHeader ? `
                <div class="app-header">
                    <h1>${title || '健身打卡'}</h1>
                    <div class="avatar" onclick="Router.navigate('profile')">${initial}</div>
                </div>
            ` : ''}
            ${showSubHeader ? `
                <div class="app-sub-header">
                    <button class="back-btn" onclick="history.back()">‹</button>
                    <h1>${title || ''}</h1>
                </div>
            ` : ''}
            ${content || ''}
            ${showTabBar ? this.renderTabBar() : ''}
        `;
        if (showTabBar) {
            document.querySelectorAll('.tab-item').forEach(el => {
                el.addEventListener('click', () => Router.navigate(el.dataset.route));
            });
        }
    },

    renderTabBar() {
        return `
            <div class="bottom-tab">
                ${this.tabs.map(t => `
                    <div class="tab-item ${Router.current === t.name ? 'active' : ''}" data-route="${t.name}">
                        <div class="icon">${t.icon}</div>
                        <div>${t.label}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }
};
