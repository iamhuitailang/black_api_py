const Layout = {
    render(content, activeMenu = 'dashboard') {
        const user = Storage.getUser();
        const menuItems = [
            { id: 'dashboard', name: '数据概览', icon: '📊' },
            { id: 'user', name: '用户管理', icon: '👥' },
            { id: 'book', name: '教材审核', icon: '📚' },
            { id: 'category', name: '分类管理', icon: '🏷️' },
            { id: 'order', name: '订单管理', icon: '📋' },
            { id: 'announcement', name: '公告管理', icon: '📢' },
            { id: 'report', name: '举报处理', icon: '🚨' }
        ];

        const menuHtml = menuItems.map(item => `
            <div class="sidebar-item ${activeMenu === item.id ? 'active' : ''}" onclick="Router.navigate('${item.id}')">
                <span class="sidebar-item-icon">${item.icon}</span>
                <span>${item.name}</span>
            </div>
        `).join('');

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="admin-layout">
                <aside class="sidebar">
                    <div class="sidebar-header">
                        <div class="sidebar-logo">
                            <span>📚</span>
                            <span>二手教材管理</span>
                        </div>
                    </div>
                    <div class="sidebar-menu">
                        ${menuHtml}
                    </div>
                </aside>
                <main class="main-content">
                    <header class="header">
                        <div class="header-title">${this.getPageTitle(activeMenu)}</div>
                        <div class="header-user">
                            <span class="header-user-name">${user ? user.username : '管理员'}</span>
                            <button class="btn btn-outline btn-sm" onclick="Layout.logout()">退出</button>
                        </div>
                    </header>
                    <div class="page-content">
                        ${content}
                    </div>
                </main>
            </div>
        `;
    },

    getPageTitle(activeMenu) {
        const titles = {
            dashboard: '数据概览',
            user: '用户管理',
            book: '教材审核',
            category: '分类管理',
            order: '订单管理',
            announcement: '公告管理',
            report: '举报处理'
        };
        return titles[activeMenu] || '管理后台';
    },

    logout() {
        Storage.removeToken();
        Storage.removeUser();
        Router.navigate('login');
    },

    showLoading() {
        const loading = document.createElement('div');
        loading.className = 'loading-mask';
        loading.id = 'loading-mask';
        loading.innerHTML = '<div class="loading-spinner"></div>';
        document.body.appendChild(loading);
    },

    hideLoading() {
        const loading = document.getElementById('loading-mask');
        if (loading) loading.remove();
    },

    formatDate(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};
