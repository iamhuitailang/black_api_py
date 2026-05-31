const MessagePage = {
    template: `
        <div class="container">
            <h1 class="page-title">消息</h1>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div class="tabs" style="flex: 1; margin-right: 20px;">
                    <div :class="['tab', msgType === null ? 'active' : '']" @click="msgType = null">
                        全部
                    </div>
                    <div :class="['tab', msgType === 1 ? 'active' : '']" @click="msgType = 1">
                        系统消息
                    </div>
                    <div :class="['tab', msgType === 2 ? 'active' : '']" @click="msgType = 2">
                        心动提醒
                    </div>
                    <div :class="['tab', msgType === 3 ? 'active' : '']" @click="msgType = 3">
                        匹配通知
                    </div>
                    <div :class="['tab', msgType === 4 ? 'active' : '']" @click="msgType = 4">
                        约会邀请
                    </div>
                </div>
                <button class="btn-small btn-secondary" @click="markAllRead">全部已读</button>
            </div>

            <div v-if="messages.length === 0 && !loading" class="empty-state">
                <div class="empty-state-icon">📬</div>
                <p>暂无消息</p>
            </div>

            <div v-else>
                <div v-for="msg in messages" :key="msg.id" 
                     :class="['message-item', msg.status === 0 ? 'message-unread' : '']"
                     @click="readMessage(msg)">
                    <div class="message-content">
                        <div class="message-title">
                            <span v-if="msg.status === 0" class="badge">NEW</span>
                            {{ msg.title }}
                        </div>
                        <div class="message-text">{{ msg.content }}</div>
                    </div>
                    <div class="message-time">{{ msg.created_at }}</div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            messages: [],
            msgType: null,
            loading: false
        };
    },
    mounted() {
        this.loadMessages();
    },
    watch: {
        msgType() {
            this.loadMessages();
        }
    },
    methods: {
        async loadMessages() {
            this.loading = true;
            const params = {};
            if (this.msgType !== null) {
                params.msg_type = this.msgType;
            }
            const result = await Api.get('/jaoyou/message/list/get', params);
            this.loading = false;
            if (result.code === 0) {
                this.messages = result.data.items;
            }
        },
        async readMessage(msg) {
            if (msg.status === 0) {
                await Api.post('/jaoyou/message/read', { message_id: msg.id });
                msg.status = 1;
            }
        },
        async markAllRead() {
            const result = await Api.post('/jaoyou/message/read/all');
            if (result.code === 0) {
                alert('已全部标记为已读');
                this.loadMessages();
            }
        }
    }
};
