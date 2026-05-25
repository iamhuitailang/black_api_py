const NotificationsPage = {
    currentPage: 1,
    pageSize: 10,

    render() {
        const user = AuthService.getCurrentUser();
        const role = user?.role;
        const app = document.getElementById('app');
        
        const tabbarHtml = this.getTabbarHtml(role);
        
        app.className = 'page has-header';
        app.innerHTML = `
            <div class="header">
                <div class="header-back" onclick="Router.back()">←</div>
                <div class="header-title">消息通知</div>
                <div class="header-right">
                    <span style="cursor: pointer; font-size: 14px; color: var(--primary-color);" id="readAll">全部已读</span>
                </div>
            </div>
            <div id="notificationsContent"></div>
            ${tabbarHtml}
        `;

        this.bindEvents();
        this.loadNotifications();
    },

    getTabbarHtml(role) {
        if (role === 'admin') {
            return `
            <div class="tabbar tabbar-5">
                <div class="tabbar-item" data-route="home">
                    <div class="tabbar-icon">🏠</div>
                    <div class="tabbar-label">首页</div>
                </div>
                <div class="tabbar-item" data-route="orders">
                    <div class="tabbar-icon">📋</div>
                    <div class="tabbar-label">报修</div>
                </div>
                <div class="tabbar-item" data-route="users">
                    <div class="tabbar-icon">👥</div>
                    <div class="tabbar-label">用户</div>
                </div>
                <div class="tabbar-item" data-route="statistics">
                    <div class="tabbar-icon">📊</div>
                    <div class="tabbar-label">统计</div>
                </div>
                <div class="tabbar-item active" data-route="notifications">
                    <div class="tabbar-icon">🔔</div>
                    <div class="tabbar-label">消息</div>
                </div>
            </div>
            `;
        } else if (role === 'repairman') {
            return `
            <div class="tabbar">
                <div class="tabbar-item" data-route="home">
                    <div class="tabbar-icon">🏠</div>
                    <div class="tabbar-label">首页</div>
                </div>
                <div class="tabbar-item" data-route="orders">
                    <div class="tabbar-icon">📋</div>
                    <div class="tabbar-label">工单</div>
                </div>
                <div class="tabbar-item active" data-route="notifications">
                    <div class="tabbar-icon">🔔</div>
                    <div class="tabbar-label">消息</div>
                </div>
                <div class="tabbar-item" data-route="profile">
                    <div class="tabbar-icon">👤</div>
                    <div class="tabbar-label">我的</div>
                </div>
            </div>
            `;
        } else {
            return `
            <div class="tabbar">
                <div class="tabbar-item" data-route="home">
                    <div class="tabbar-icon">🏠</div>
                    <div class="tabbar-label">首页</div>
                </div>
                <div class="tabbar-item" data-route="orders">
                    <div class="tabbar-icon">📋</div>
                    <div class="tabbar-label">报修单</div>
                </div>
                <div class="tabbar-item active" data-route="notifications">
                    <div class="tabbar-icon">🔔</div>
                    <div class="tabbar-label">消息</div>
                </div>
                <div class="tabbar-item" data-route="profile">
                    <div class="tabbar-icon">👤</div>
                    <div class="tabbar-label">我的</div>
                </div>
            </div>
            `;
        }
    },

    bindEvents() {
        document.getElementById('readAll').onclick = async () => {
            try {
                const result = await ApiService.post('/baoxiu/notification/read/all');
                if (result.code === 0) {
                    Utils.showToast('已全部标记为已读');
                    this.loadNotifications();
                }
            } catch (e) {
                console.error('Read all error:', e);
            }
        };

        document.querySelectorAll('.tabbar-item').forEach(item => {
            item.onclick = () => {
                const route = item.dataset.route;
                if (route) {
                    Router.navigate(route);
                }
            };
        });
    },

    async loadNotifications() {
        const container = document.getElementById('notificationsContent');
        Utils.showLoading(container);

        try {
            const result = await ApiService.get('/baoxiu/notification/list/get', {
                page: this.currentPage,
                page_size: this.pageSize
            });
            if (result.code === 0) {
                this.renderNotifications(result.data);
            } else {
                Utils.showEmpty(container, '加载失败');
            }
        } catch (error) {
            Utils.showEmpty(container, '加载失败');
        }
    },

    renderNotifications(data) {
        const container = document.getElementById('notificationsContent');
        const items = data.items || [];

        if (items.length === 0) {
            Utils.showEmpty(container, '暂无通知');
            return;
        }

        container.innerHTML = items.map(item => `
            <div class="list-item" data-id="${item.id}" ${!item.is_read ? 'style="background-color: #f0f9ff;"' : ''}>
                <div class="list-item-content">
                    <div class="list-item-title">${item.title}</div>
                    <div class="list-item-desc">${item.content || ''}</div>
                    <div style="font-size: 12px; color: var(--text-light); margin-top: 4px;">${Utils.formatDate(item.created_at)}</div>
                </div>
                <div class="list-item-extra">
                    ${!item.is_read ? '<span class="badge badge-danger">新</span>' : ''}
                </div>
            </div>
        `).join('');

        container.querySelectorAll('.list-item').forEach(item => {
            item.onclick = async () => {
                const id = parseInt(item.dataset.id);
                try {
                    await ApiService.post(`/baoxiu/notification/read?notification_id=${id}`);
                } catch (e) {
                    console.error('Mark read error:', e);
                }
                this.loadNotifications();
            };
        });
    }
};
