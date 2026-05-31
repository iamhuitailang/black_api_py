const NotificationsPage = {
    template: `
    <div>
        <div class="page-header flex-between">
            <h1 class="page-title">🔔 消息通知</h1>
            <button class="btn btn-outline btn-sm" @click="markAllRead">全部已读</button>
        </div>
        <div class="card">
            <div v-if="loading" class="text-center" style="padding:40px"><span class="loading-spinner"></span></div>
            <div v-else-if="notifications.length===0" class="empty-state"><div class="empty-state-icon">🔕</div><div class="empty-state-text">暂无通知</div></div>
            <div v-else>
                <div v-for="n in notifications" :key="n.id" class="notification-item" :class="{unread:!n.is_read}" @click="markRead(n)">
                    <div class="notification-dot" :class="{read:!!n.is_read}"></div>
                    <div class="notification-content">
                        <div class="notification-title">{{ n.title }}</div>
                        <div class="notification-text">{{ n.content }}</div>
                        <div class="notification-time">{{ Utils.formatTime(n.created_at) }}</div>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="notifications.length>0" class="pagination">
            <button class="pagination-btn" :disabled="page<=1" @click="page--;loadNotifications()">上一页</button>
            <span style="font-size:13px;color:var(--text-secondary)">{{ page }} / {{ totalPages||1 }}</span>
            <button class="pagination-btn" :disabled="page>=totalPages" @click="page++;loadNotifications()">下一页</button>
        </div>
    </div>
    `,
    data() {
        return { notifications: [], loading: false, page: 1, pageSize: 20, totalPages: 0, Utils: Utils };
    },
    async mounted() { await this.loadNotifications(); },
    methods: {
        async loadNotifications() {
            this.loading = true;
            try {
                const result = await NotificationService.getList({ page: this.page, page_size: this.pageSize });
                if (result.code === 0) {
                    this.notifications = result.data.items || [];
                    this.totalPages = result.data.total_pages || 0;
                } else {
                    this.notifications = [];
                    this.$root.showToast(result.msg || '加载通知失败', 'error');
                }
            } catch (e) {
                this.notifications = [];
                this.$root.showToast('加载通知失败', 'error');
            } finally { this.loading = false; }
        },
        async markRead(n) {
            if (!n.is_read) { await NotificationService.markAsRead(n.id); n.is_read = 1; }
        },
        async markAllRead() {
            await NotificationService.markAllAsRead();
            this.notifications.forEach(n => n.is_read = 1);
            this.$root.showToast('已全部标记为已读', 'success');
        }
    }
};
