const Layout = {
    menu: [
        { name: 'dashboard', label: '仪表盘', icon: '📊' },
        { name: 'user', label: '用户管理', icon: '👥' },
        { name: 'checkin', label: '打卡记录', icon: '📝' },
        { name: 'quote', label: '每日语录', icon: '💬' },
    ],

    render(content, title) {
        const user = Storage.getUser();
        const app = document.getElementById('app');
        const initial = (user?.real_name || user?.username || 'A').charAt(0).toUpperCase();
        app.innerHTML = `
            <div class="layout">
                <aside class="sidebar">
                    <div class="sidebar-brand">
                        <div class="logo">💪</div>
                        <h2>健身打卡</h2>
                    </div>
                    <nav class="sidebar-menu">
                        ${this.menu.map(item => `
                            <div class="menu-item ${Router.current === item.name ? 'active' : ''}" data-route="${item.name}">
                                <span class="icon">${item.icon}</span>
                                <span>${item.label}</span>
                            </div>
                        `).join('')}
                    </nav>
                    <div class="sidebar-footer">
                        <div class="sidebar-user">
                            <div class="avatar">${initial}</div>
                            <div class="info">
                                <div class="name">${user?.real_name || user?.username || '管理员'}</div>
                                <div class="role">超级管理员</div>
                            </div>
                        </div>
                        <button class="logout-btn" id="logout-btn">退出登录</button>
                    </div>
                </aside>
                <div class="main">
                    <div class="header">
                        <h1>${title || '管理后台'}</h1>
                        <div class="header-right">
                            <span style="color: var(--text-secondary); font-size: 13px;">
                                ${new Date().toLocaleDateString('zh-CN')}
                            </span>
                        </div>
                    </div>
                    <div class="content" id="page-content">
                        ${content}
                    </div>
                </div>
            </div>
        `;
        document.querySelectorAll('.menu-item').forEach(el => {
            el.addEventListener('click', () => {
                Router.navigate(el.dataset.route);
            });
        });
        document.getElementById('logout-btn').addEventListener('click', () => {
            AuthService.logout();
        });
    },

    renderPage(content, title) {
        const pageContent = document.getElementById('page-content');
        if (pageContent) {
            pageContent.innerHTML = content;
        } else {
            this.render(content, title);
        }
        const headerTitle = document.querySelector('.header h1');
        if (headerTitle) headerTitle.textContent = title || '管理后台';
        document.querySelectorAll('.menu-item').forEach(el => {
            el.classList.toggle('active', el.dataset.route === Router.current);
        });
    }
};
