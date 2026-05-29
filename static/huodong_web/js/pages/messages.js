const MessagesPage = {
    currentPage: 1,
    pageSize: 20,
    messages: [],

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <header class="header">
                    <span class="header-back" onclick="Router.back()">←</span>
                    <h1 class="header-title">消息通知</h1>
                    <span class="header-action" id="markAllRead">全部已读</span>
                </header>

                <div id="messageList">
                    <div class="empty-state"><div class="empty-state-icon">⏳</div><div class="empty-state-text">加载中...</div></div>
                </div>

                ${Tabbar.render('messages')}
            </div>
        `;
        this.bindEvents();
        await this.loadData();
    },

    bindEvents() {
        document.getElementById('markAllRead').addEventListener('click', async () => {
            try {
                const result = await ApiService.post('/huodong/message/mark/all/read');
                if (result.code === 0) {
                    Toast.success('已全部标记为已读');
                    this.loadData();
                }
            } catch (e) {
                Toast.error('操作失败');
            }
        });
    },

    async loadData() {
        const list = document.getElementById('messageList');
        try {
            const result = await ApiService.get('/huodong/message/list/get', {
                page: this.currentPage, page_size: this.pageSize
            });
            if (result.code === 0) {
                this.messages = result.data.items || [];
                if (this.messages.length === 0) {
                    list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💬</div><div class="empty-state-text">暂无消息</div></div>';
                    return;
                }
                list.innerHTML = this.messages.map(m => {
                    const iconMap = { system: '📢', activity: '🎉', interaction: '💬' };
                    return `
                        <div class="message-item ${m.is_read === 0 ? 'unread' : ''}" data-id="${m.id}">
                            <div class="message-icon">${iconMap[m.message_type] || '📢'}</div>
                            <div class="message-content">
                                <div class="message-title">${m.title || '系统通知'}</div>
                                <div class="message-text">${m.content}</div>
                                <div class="message-time">${Utils.formatTime(m.created_at)}</div>
                            </div>
                        </div>
                    `;
                }).join('');
                this.bindItemEvents();
            }
        } catch (e) {
            console.error('加载消息失败:', e);
        }
    },

    bindItemEvents() {
        document.querySelectorAll('.message-item').forEach(item => {
            item.addEventListener('click', async () => {
                const id = item.dataset.id;
                if (item.classList.contains('unread')) {
                    try {
                        await ApiService.post(`/huodong/message/mark/read?message_id=${id}`);
                        item.classList.remove('unread');
                    } catch (e) { }
                }
            });
        });
    }
};
