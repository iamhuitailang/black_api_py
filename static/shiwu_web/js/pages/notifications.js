const NotificationsPage = {
    notifications: [],

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                ${Header.render('消息通知', true)}
                <main class="container" id="notificationsContainer">
                    <div class="loading">
                        <div class="loading-spinner"></div>
                    </div>
                </main>

                ${Tabbar.render('notifications')}
            </div>
        `;

        await this.loadNotifications();
    },

    async loadNotifications() {
        const container = document.getElementById('notificationsContainer');
        try {
            const result = await ApiService.get('/shiwu/notification/list/get', { page_size: 50 });
            if (result.code === 0) {
                this.notifications = result.data.items || [];
                this.renderNotifications();
            } else {
                Toast.error(result.msg || '加载失败');
            }
        } catch (error) {
            console.error('加载通知失败:', error);
            container.innerHTML = `
                <div class="empty">
                    <div class="empty-icon">❌</div>
                    <div class="empty-text">加载失败，点击重试</div>
                </div>
            `;
            container.querySelector('.empty').onclick = () => this.loadNotifications();
        }
    },

    renderNotifications() {
        const container = document.getElementById('notificationsContainer');
        
        if (this.notifications.length === 0) {
            container.innerHTML = `
                <div class="empty">
                    <div class="empty-icon">🔔</div>
                    <div class="empty-text">暂无消息通知</div>
                </div>
            `;
            return;
        }

        const iconClass = {
            'system': 'system',
            'claim': 'claim',
            'clue': 'clue',
            'comment': 'comment',
            'like': 'like'
        };

        const iconEmoji = {
            'system': '📢',
            'claim': '📋',
            'clue': '💡',
            'comment': '💬',
            'like': '❤️'
        };

        container.innerHTML = this.notifications.map(notification => `
            <div class="notification-item ${notification.is_read ? '' : 'unread'}" onclick="NotificationsPage.markAsRead(${notification.id}, ${notification.post_id})">
                <div class="notification-icon ${iconClass[notification.type] || 'system'}">
                    ${iconEmoji[notification.type] || '📢'}
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-body">${notification.content}</div>
                    <div class="notification-time">${Utils.formatTime(notification.created_at)}</div>
                </div>
                ${!notification.is_read ? '<span class="badge badge-danger">新</span>' : ''}
            </div>
        `).join('');
    },

    async markAsRead(id, postId) {
        try {
            await ApiService.post(`/shiwu/notification/read/mark?notification_id=${id}`);
            if (postId) {
                Router.navigate('detail', { post_id: postId });
            }
        } catch (error) {
            console.error('标记已读失败:', error);
        }
    }
};

window.NotificationsPage = NotificationsPage;
