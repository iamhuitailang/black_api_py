(function() {
    const { ref, computed, onMounted } = Vue;
    
    window.MessagesPage = {
        name: 'MessagesPage',
        template: `
            <div class="messages-container">
                <div class="page-header">
                    <h1>💬 消息中心</h1>
                    <div class="message-actions">
                        <span class="unread-count">未读：{{ unreadCount }}</span>
                        <button class="btn-link" @click="markAllAsRead" v-if="unreadCount > 0">
                            全部标为已读
                        </button>
                    </div>
                </div>
    
                <div class="message-tabs">
                    <span 
                        class="message-tab" 
                        :class="{ active: typeFilter === 'all' }"
                        @click="typeFilter = 'all'; loadMessages(true)">
                        全部消息
                    </span>
                    <span 
                        class="message-tab" 
                        :class="{ active: typeFilter === 'system' }"
                        @click="typeFilter = 'system'; loadMessages(true)">
                        系统通知
                    </span>
                    <span 
                        class="message-tab" 
                        :class="{ active: typeFilter === 'activity' }"
                        @click="typeFilter = 'activity'; loadMessages(true)">
                        活动通知
                    </span>
                    <span 
                        class="message-tab" 
                        :class="{ active: typeFilter === 'review' }"
                        @click="typeFilter = 'review'; loadMessages(true)">
                        审核通知
                    </span>
                </div>
    
                <div class="empty-state" v-if="!loading && messages.length === 0">
                    <div class="empty-icon">📭</div>
                    <div class="empty-text">暂无消息</div>
                </div>
    
                <div class="messages-list" v-if="messages.length > 0">
                    <div 
                        class="message-item" 
                        v-for="item in messages" 
                        :key="item.id"
                        :class="{ unread: !item.is_read }"
                        @click="readMessage(item)">
                        <div class="message-icon">
                            {{ getTypeIcon(item.type) }}
                        </div>
                        <div class="message-content">
                            <div class="message-header">
                                <span class="message-title">{{ item.title }}</span>
                                <span class="message-time">{{ Utils.formatTime(item.created_at) }}</span>
                            </div>
                            <div class="message-body">{{ item.content }}</div>
                        </div>
                        <div class="message-status">
                            <span class="unread-dot" v-if="!item.is_read"></span>
                        </div>
                    </div>
                </div>
    
                <div class="load-more" v-if="loading">
                    <span class="loading-spinner"></span> 加载中...
                </div>
    
                <div class="load-more-btn" v-if="!loading && hasMore && messages.length > 0" @click="loadMore">
                    加载更多
                </div>
    
                <div class="no-more" v-if="!loading && !hasMore && messages.length > 0">
                    已加载全部内容
                </div>
            </div>
        `,
        setup() {
            const router = VueRouter.useRouter();
    
            const messages = ref([]);
            const loading = ref(false);
            const page = ref(1);
            const pageSize = ref(20);
            const total = ref(0);
            const hasMore = ref(true);
            const unreadCount = ref(0);
            const typeFilter = ref('all');
    
            const isLoggedIn = computed(() => Auth.isLoggedIn());
    
            const getTypeIcon = (type) => {
                const iconMap = {
                    system: '🔔',
                    activity: '🎉',
                    review: '📝',
                    point: '⭐'
                };
                return iconMap[type] || '💬';
            };
    
            const loadUnreadCount = async () => {
                try {
                    const result = await API.message.getUnreadCount();
                    if (result.code === 0 && result.data) {
                        unreadCount.value = result.data.count || 0;
                    }
                } catch (error) {
                    console.error('Load unread count error:', error);
                }
            };
    
            const loadMessages = async (reset = false) => {
                if (reset) {
                    page.value = 1;
                    messages.value = [];
                    hasMore.value = true;
                }
    
                loading.value = true;
                try {
                    const type = typeFilter.value === 'all' ? null : typeFilter.value;
                    const result = await API.message.getList(page.value, pageSize.value, type);
                    if (result.code === 0 && result.data) {
                        const items = result.data.items || result.data || [];
                        messages.value = reset ? items : [...messages.value, ...items];
                        total.value = result.data.total || 0;
                        hasMore.value = messages.value.length < total.value;
                    }
                } catch (error) {
                    console.error('Load messages error:', error);
                } finally {
                    loading.value = false;
                }
            };
    
            const loadMore = () => {
                page.value++;
                loadMessages(false);
            };
    
            const readMessage = async (item) => {
                if (!item.is_read) {
                    try {
                        await API.message.markAsRead(item.id);
                        item.is_read = 1;
                        unreadCount.value = Math.max(0, unreadCount.value - 1);
                    } catch (error) {
                        console.error('Mark as read error:', error);
                    }
                }
            };
    
            const markAllAsRead = async () => {
                try {
                    const result = await API.message.markAllAsRead();
                    if (result.code === 0) {
                        messages.value.forEach(msg => msg.is_read = 1);
                        unreadCount.value = 0;
                        Utils.showToast('已全部标为已读', 'success');
                    }
                } catch (error) {
                    console.error('Mark all as read error:', error);
                }
            };
    
            onMounted(() => {
                if (!isLoggedIn.value) {
                    Utils.showToast('请先登录', 'warning');
                    router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } });
                    return;
                }
                loadUnreadCount();
                loadMessages(true);
            });
    
            return {
                messages,
                loading,
                total,
                hasMore,
                unreadCount,
                typeFilter,
                isLoggedIn,
                getTypeIcon,
                loadMessages,
                loadMore,
                readMessage,
                markAllAsRead,
                Utils
            };
        }
    };
})();
