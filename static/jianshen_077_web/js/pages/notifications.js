const NotificationsPage = {
    template: `
        <div class="page has-header">
            <header class="header">
                <h1 class="header-title">消息通知</h1>
                <div class="header-action" v-if="notifications.length > 0" @click="markAllRead">全部已读</div>
            </header>

            <div class="list">
                <div v-if="loading" class="empty-state">
                    <div class="empty-state-icon">⏳</div>
                    <div class="empty-state-text">加载中...</div>
                </div>
                <div v-else-if="notifications.length === 0" class="empty-state">
                    <div class="empty-state-icon">🔔</div>
                    <div class="empty-state-text">暂无消息</div>
                </div>
                <div v-else>
                    <div class="notification-item" v-for="item in notifications" :key="item.id"
                         :class="{ unread: !item.is_read }" @click="handleRead(item)">
                        <div class="notification-dot" :class="{ read: item.is_read }"></div>
                        <div class="notification-content">
                            <div class="notification-title">{{ item.title }}</div>
                            <div class="notification-text">{{ item.content }}</div>
                            <div class="notification-time">{{ formatTime(item.created_at) }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="tabbar">
                <router-link to="/courses" class="tabbar-item">
                    <span class="tabbar-icon">🏋️</span>
                    <span class="tabbar-text">课程</span>
                </router-link>
                <router-link to="/my-courses" class="tabbar-item">
                    <span class="tabbar-icon">📋</span>
                    <span class="tabbar-text">我的</span>
                </router-link>
                <router-link to="/notifications" class="tabbar-item active">
                    <span class="tabbar-icon">🔔</span>
                    <span class="tabbar-text">消息</span>
                </router-link>
                <router-link to="/profile" class="tabbar-item">
                    <span class="tabbar-icon">👤</span>
                    <span class="tabbar-text">我的</span>
                </router-link>
            </div>
        </div>
    `,
    data() {
        return {
            notifications: [],
            loading: false,
            page: 1
        };
    },
    methods: {
        async loadNotifications() {
            this.loading = true;
            try {
                const result = await NotificationService.getMyList({ page: this.page, page_size: 50 });
                if (result.code === 0) {
                    this.notifications = result.data.items;
                }
            } catch (e) {
                Toast.error('加载失败');
            } finally {
                this.loading = false;
            }
        },
        async handleRead(item) {
            if (!item.is_read) {
                try {
                    await NotificationService.markAsRead(item.id);
                    item.is_read = 1;
                } catch (e) {}
            }
        },
        async markAllRead() {
            try {
                const result = await NotificationService.markAllAsRead();
                if (result.code === 0) {
                    Toast.success('已全部标记为已读');
                    this.notifications.forEach(n => n.is_read = 1);
                }
            } catch (e) {
                Toast.error('操作失败');
            }
        },
        formatTime(time) {
            if (!time) return '';
            const d = new Date(time);
            const now = new Date();
            const diff = now - d;
            if (diff < 60000) return '刚刚';
            if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
            if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
            return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
        }
    },
    mounted() {
        this.loadNotifications();
    }
};

window.NotificationsPage = NotificationsPage;
