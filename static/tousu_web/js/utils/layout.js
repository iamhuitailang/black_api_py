const Layout = {
    renderHeader(title, showBack = false, actionText = '', actionHandler = null) {
        const backBtn = showBack ? '<div class="header-back" onclick="Router.back()">←</div>' : '';
        const actionBtn = actionText ? `<div class="header-action" id="headerAction">${actionText}</div>` : '';

        return `
            <header class="header">
                ${backBtn}
                <h1 class="header-title">${title}</h1>
                ${actionBtn}
            </header>
        `;
    },

    renderTabbar(activeRoute) {
        const user = Storage.getUser();
        const role = user?.role || 'student';

        let tabs = [];

        if (role === 'admin') {
            tabs = [
                { route: 'admin', icon: '📊', text: '管理' },
                { route: 'notification', icon: '🔔', text: '通知' },
                { route: 'profile', icon: '👤', text: '我的' }
            ];
        } else if (role === 'staff') {
            tabs = [
                { route: 'home', icon: '🏠', text: '首页' },
                { route: 'handle', icon: '📋', text: '处理' },
                { route: 'notification', icon: '🔔', text: '通知' },
                { route: 'profile', icon: '👤', text: '我的' }
            ];
        } else {
            tabs = [
                { route: 'home', icon: '🏠', text: '首页' },
                { route: 'complaint', icon: '📝', text: '提交' },
                { route: 'myComplaints', icon: '📋', text: '列表' },
                { route: 'profile', icon: '👤', text: '我的' }
            ];
        }

        return `
            <nav class="tabbar">
                ${tabs.map(tab => `
                    <div class="tabbar-item ${activeRoute === tab.route ? 'active' : ''}" 
                         onclick="Router.navigate('${tab.route}')">
                        <span class="tabbar-icon">${tab.icon}</span>
                        <span class="tabbar-text">${tab.text}</span>
                    </div>
                `).join('')}
            </nav>
        `;
    },

    renderSidebar(activeRoute) {
        const menuItems = [
            { route: 'admin', icon: '📊', text: '仪表盘' },
            { route: 'adminUsers', icon: '👥', text: '用户管理' },
            { route: 'adminCategories', icon: '📂', text: '分类管理' },
            { route: 'adminDepartments', icon: '🏢', text: '部门管理' },
            { route: 'adminAnnouncements', icon: '📢', text: '公告管理' },
            { route: 'adminLogs', icon: '📝', text: '操作日志' },
            { route: 'settings', icon: '⚙️', text: '系统设置' }
        ];

        return `
            <aside class="sidebar">
                <div class="sidebar-logo">
                    <h1>投诉建议系统</h1>
                </div>
                <nav class="sidebar-menu">
                    ${menuItems.map(item => `
                        <div class="sidebar-item ${activeRoute === item.route ? 'active' : ''}"
                             onclick="Router.navigate('${item.route}')">
                            <span class="sidebar-icon">${item.icon}</span>
                            <span class="sidebar-text">${item.text}</span>
                        </div>
                    `).join('')}
                </nav>
            </aside>
        `;
    }
};

window.Layout = Layout;