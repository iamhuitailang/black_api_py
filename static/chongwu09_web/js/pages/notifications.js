const NotificationsPage = {
    currentPage: 1, pageSize: 20,

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <header class="header">
                    <h1 class="header-title">消息提醒</h1>
                    <div class="header-action" id="markAllRead">全部已读</div>
                </header>
                <div id="notificationList"><div class="empty-state"><div class="empty-state-icon">🔔</div><div class="empty-state-text">加载中...</div></div></div>
                ${Tabbar.render('notifications')}
            </div>
        `;
        document.getElementById('markAllRead').addEventListener('click', async () => {
            try {
                await ApiService.post('/chongwu09/notification/read/all');
                Toast.success('已全部标记已读');
                this.currentPage = 1;
                this.loadNotifications();
            } catch (e) {}
        });
        await this.loadNotifications();
    },

    async loadNotifications() {
        const list = document.getElementById('notificationList');
        try {
            const result = await ApiService.get('/chongwu09/notification/list/get', { page: this.currentPage, page_size: this.pageSize });
            if (result.code === 0) {
                const items = result.data.items || [];
                if (items.length === 0) {
                    list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">暂无消息</div></div>';
                    return;
                }
                list.innerHTML = items.map(n => {
                    const icons = { booking: '📋', order: '💰', system: '📢', reminder: '⏰' };
                    const icon = icons[n.notification_type] || '📢';
                    return `
                        <div class="notification-item ${n.is_read ? '' : 'unread'}" data-id="${n.id}">
                            <div class="notification-icon">${icon}</div>
                            <div class="notification-content">
                                <div class="notification-title">${n.title}</div>
                                <div class="notification-text">${n.content}</div>
                                <div class="notification-time">${Utils.formatTime(n.created_at)}</div>
                            </div>
                        </div>
                    `;
                }).join('');
                document.querySelectorAll('.notification-item.unread').forEach(item => {
                    item.addEventListener('click', async () => {
                        try {
                            await ApiService.post('/chongwu09/notification/read', { notification_id: parseInt(item.dataset.id) });
                            item.classList.remove('unread');
                        } catch (e) {}
                    });
                });
            }
        } catch (e) { list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">❌</div><div class="empty-state-text">加载失败</div></div>'; }
    }
};
