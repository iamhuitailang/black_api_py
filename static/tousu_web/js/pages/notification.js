const NotificationPage = {
    notifications: [],

    async render() {
        const app = document.getElementById('app');

        app.innerHTML = `
            <div class="page has-header">
                ${Layout.renderHeader('消息通知', true, '全部已读', () => this.markAllRead())}

                <div class="notification-list" id="notificationList">
                    <div class="empty-state">
                        <div class="empty-state-icon">🔔</div>
                        <div class="empty-state-text">加载中...</div>
                    </div>
                </div>

                ${Layout.renderTabbar('notification')}
            </div>
        `;

        await this.loadNotifications();
    },

    async loadNotifications() {
        const listEl = document.getElementById('notificationList');

        try {
            const result = await ApiService.get('/tousu/notification/list/get', {
                page: 1,
                page_size: 50
            });

            if (result.code === 0) {
                this.notifications = result.data.items || [];

                if (this.notifications.length === 0) {
                    listEl.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-state-icon">🔔</div>
                            <div class="empty-state-text">暂无通知</div>
                        </div>
                    `;
                    return;
                }

                listEl.innerHTML = this.notifications.map(n => `
                    <div class="notification-item ${n.is_read === 0 ? 'unread' : ''}" data-id="${n.id}">
                        <div class="notification-header">
                            <span class="notification-title">${n.title}</span>
                            <span class="notification-time">${n.created_at || ''}</span>
                        </div>
                        <div class="notification-content">${n.content || ''}</div>
                    </div>
                `).join('');

                this.bindEvents();
            } else {
                Toast.error(result.msg || '加载失败');
            }
        } catch (error) {
            console.error('加载通知失败:', error);
            listEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">❌</div>
                    <div class="empty-state-text">加载失败</div>
                </div>
            `;
        }
    },

    bindEvents() {
        document.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', async () => {
                const id = item.dataset.id;
                await this.markAsRead(id);
            });
        });
    },

    async markAsRead(id) {
        try {
            await ApiService.post('/tousu/notification/read', { notification_id: id });
        } catch (error) {
            console.error('标记已读失败:', error);
        }
    },

    async markAllRead() {
        try {
            const result = await ApiService.post('/tousu/notification/read/all');
            if (result.code === 0) {
                Toast.success('已全部标记为已读');
                this.loadNotifications();
            }
        } catch (error) {
            Toast.error('操作失败');
        }
    }
};

window.NotificationPage = NotificationPage;