const NotificationsPage = {
    notifications: [],

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page-container">
                <header class="header">
                    <div class="header-content">
                        <button class="back-btn" onclick="Router.navigate('home')">←</button>
                        <h1 class="header-title">消息通知</h1>
                        <div style="width:40px;"></div>
                    </div>
                </header>

                <div class="notification-list" id="notificationList">
                    <div class="loading">加载中...</div>
                </div>

                <nav class="bottom-nav">
                    <a href="#home" class="nav-item">
                        <span class="nav-icon">🏠</span>
                        <span class="nav-text">首页</span>
                    </a>
                    <a href="#myOrders" class="nav-item">
                        <span class="nav-icon">📋</span>
                        <span class="nav-text">订单</span>
                    </a>
                    <a href="#notifications" class="nav-item active">
                        <span class="nav-icon">🔔</span>
                        <span class="nav-text">消息</span>
                    </a>
                    <a href="#profile" class="nav-item">
                        <span class="nav-icon">👤</span>
                        <span class="nav-text">我的</span>
                    </a>
                </nav>
            </div>
        `;

        await this.loadNotifications();
    },

    async loadNotifications() {
        try {
            const result = await NotificationApi.list();
            if (result.code === 0) {
                this.notifications = result.data.items || [];
                this.renderNotifications();
            } else {
                document.getElementById('notificationList').innerHTML = '<div class="empty">加载失败</div>';
            }
        } catch (error) {
            document.getElementById('notificationList').innerHTML = '<div class="empty">加载失败</div>';
        }
    },

    renderNotifications() {
        const container = document.getElementById('notificationList');

        if (this.notifications.length === 0) {
            container.innerHTML = '<div class="empty">暂无消息</div>';
            return;
        }

        let html = '';
        this.notifications.forEach(notification => {
            const iconMap = {
                'order': '📋',
                'system': '🔔',
                'reminder': '⏰'
            };
            const icon = iconMap[notification.type] || '🔔';
            const unreadClass = notification.is_read ? '' : 'unread';

            html += `
                <div class="notification-card ${unreadClass}" data-id="${notification.id}">
                    <div class="notification-icon">${icon}</div>
                    <div class="notification-content">
                        <h3 class="notification-title">${notification.title}</h3>
                        <p class="notification-body">${notification.content}</p>
                        <p class="notification-time">${Utils.formatDate(notification.created_at)}</p>
                    </div>
                    ${!notification.is_read ? '<span class="unread-dot"></span>' : ''}
                </div>
            `;
        });

        container.innerHTML = html;

        container.querySelectorAll('.notification-card').forEach(card => {
            card.addEventListener('click', async () => {
                const id = card.dataset.id;
                try {
                    await NotificationApi.read(id);
                    card.classList.remove('unread');
                    const dot = card.querySelector('.unread-dot');
                    if (dot) dot.remove();
                } catch (e) {
                    console.log('Mark as read error:', e);
                }
            });
        });
    }
};
