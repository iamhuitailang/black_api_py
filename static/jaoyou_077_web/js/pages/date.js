const DatePage = {
    template: `
        <div class="container">
            <h1 class="page-title">约会</h1>
            
            <div class="tabs">
                <div :class="['tab', activeTab === 'received' ? 'active' : '']" @click="activeTab = 'received'">
                    收到的邀请
                </div>
                <div :class="['tab', activeTab === 'sent' ? 'active' : '']" @click="activeTab = 'sent'">
                    我发出的
                </div>
                <div :class="['tab', activeTab === 'create' ? 'active' : '']" @click="activeTab = 'create'">
                    发起约会
                </div>
            </div>

            <div v-if="activeTab === 'create'">
                <div class="card">
                    <h3 style="margin-bottom: 20px;">发起约会邀请</h3>
                    <form @submit.prevent="sendDate">
                        <div class="form-group">
                            <label>对方用户</label>
                            <select v-model="form.to_user_id" required>
                                <option value="">请选择匹配用户</option>
                                <option v-for="match in matches" :key="match.matched_user.id" :value="match.matched_user.id">
                                    {{ match.matched_user.nickname }}
                                </option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>约会标题</label>
                            <input type="text" v-model="form.title" placeholder="例如：周末一起喝咖啡？" required>
                        </div>
                        <div class="form-group">
                            <label>约会描述</label>
                            <textarea v-model="form.description" rows="3" placeholder="描述一下你的想法..."></textarea>
                        </div>
                        <div class="form-group">
                            <label>约会地点</label>
                            <input type="text" v-model="form.location" placeholder="例如：星巴克(国贸店)">
                        </div>
                        <div class="form-group">
                            <label>约会时间</label>
                            <input type="datetime-local" v-model="form.date_time" required>
                        </div>
                        <button type="submit" class="btn btn-primary" :disabled="sending">
                            {{ sending ? '发送中...' : '发送约会邀请' }}
                        </button>
                    </form>
                </div>
            </div>

            <div v-if="activeTab === 'received'">
                <div v-if="receivedDates.length === 0 && !loading" class="empty-state">
                    <div class="empty-state-icon">📅</div>
                    <p>暂无约会邀请</p>
                </div>
                <div v-else>
                    <div v-for="date in receivedDates" :key="date.id" class="date-card">
                        <div class="date-header">
                            <div class="date-title">{{ date.title }}</div>
                            <span :class="['date-status', 'status-' + ['pending', 'accepted', 'rejected', 'cancelled', 'completed'][date.status]]">
                                {{ date.status_text }}
                            </span>
                        </div>
                        <div style="margin-bottom: 10px;">
                            <strong>发起人:</strong> {{ date.from_user.nickname }}
                        </div>
                        <div style="margin-bottom: 10px;" v-if="date.description">
                            <strong>描述:</strong> {{ date.description }}
                        </div>
                        <div style="margin-bottom: 10px;" v-if="date.location">
                            <strong>地点:</strong> {{ date.location }}
                        </div>
                        <div style="margin-bottom: 15px;">
                            <strong>时间:</strong> {{ date.date_time }}
                        </div>
                        <div v-if="date.status === 0" style="display: flex; gap: 10px;">
                            <button class="btn-small btn-heart" @click="respondDate(date.id, true)">
                                接受
                            </button>
                            <button class="btn-small btn-message" @click="respondDate(date.id, false)">
                                拒绝
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="activeTab === 'sent'">
                <div v-if="sentDates.length === 0 && !loading" class="empty-state">
                    <div class="empty-state-icon">📨</div>
                    <p>还没有发出约会邀请</p>
                </div>
                <div v-else>
                    <div v-for="date in sentDates" :key="date.id" class="date-card">
                        <div class="date-header">
                            <div class="date-title">{{ date.title }}</div>
                            <span :class="['date-status', 'status-' + ['pending', 'accepted', 'rejected', 'cancelled', 'completed'][date.status]]">
                                {{ date.status_text }}
                            </span>
                        </div>
                        <div style="margin-bottom: 10px;">
                            <strong>对方:</strong> {{ date.to_user.nickname }}
                        </div>
                        <div style="margin-bottom: 10px;" v-if="date.description">
                            <strong>描述:</strong> {{ date.description }}
                        </div>
                        <div style="margin-bottom: 10px;" v-if="date.location">
                            <strong>地点:</strong> {{ date.location }}
                        </div>
                        <div style="margin-bottom: 15px;">
                            <strong>时间:</strong> {{ date.date_time }}
                        </div>
                        <button v-if="date.status === 0" class="btn-small btn-message" @click="cancelDate(date.id)">
                            取消约会
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            activeTab: 'received',
            form: {
                to_user_id: '',
                title: '',
                description: '',
                location: '',
                date_time: ''
            },
            matches: [],
            receivedDates: [],
            sentDates: [],
            loading: false,
            sending: false
        };
    },
    mounted() {
        this.loadMatches();
        this.loadDates();
        
        const toUserId = this.$route.query.to_user_id;
        if (toUserId) {
            this.activeTab = 'create';
            this.form.to_user_id = toUserId;
        }
    },
    watch: {
        activeTab() {
            this.loadDates();
        }
    },
    methods: {
        async loadMatches() {
            try {
                const result = await Api.get('/jaoyou/match/list/get');
                if (result.code === 0 && result.data && result.data.items) {
                    this.matches = result.data.items.filter(item => item.matched_user);
                }
            } catch (e) {
                console.error('加载匹配列表失败:', e);
                this.matches = [];
            }
        },
        loadDates() {
            if (this.activeTab === 'received') {
                this.loadReceivedDates();
            } else if (this.activeTab === 'sent') {
                this.loadSentDates();
            }
        },
        async loadReceivedDates() {
            this.loading = true;
            const result = await Api.get('/jaoyou/date/received/get');
            this.loading = false;
            if (result.code === 0) {
                this.receivedDates = result.data.items;
            }
        },
        async loadSentDates() {
            this.loading = true;
            const result = await Api.get('/jaoyou/date/sent/get');
            this.loading = false;
            if (result.code === 0) {
                this.sentDates = result.data.items;
            }
        },
        async sendDate() {
            if (!this.form.to_user_id) {
                alert('请选择对方用户');
                return;
            }
            this.sending = true;
            const result = await Api.post('/jaoyou/date/send', this.form);
            this.sending = false;

            if (result.code === 0) {
                alert('约会邀请发送成功！');
                this.form = {
                    to_user_id: '',
                    title: '',
                    description: '',
                    location: '',
                    date_time: ''
                };
                this.activeTab = 'sent';
            } else {
                alert(result.msg);
            }
        },
        async respondDate(dateId, accepted) {
            const result = await Api.post('/jaoyou/date/respond', {
                date_id: dateId,
                accepted: accepted
            });
            if (result.code === 0) {
                alert(accepted ? '已接受约会！' : '已拒绝约会');
                this.loadReceivedDates();
            } else {
                alert(result.msg);
            }
        },
        async cancelDate(dateId) {
            if (!confirm('确定要取消这个约会吗？')) {
                return;
            }
            const result = await Api.post('/jaoyou/date/cancel', { date_id: dateId });
            if (result.code === 0) {
                alert('约会已取消');
                this.loadSentDates();
            } else {
                alert(result.msg);
            }
        }
    }
};
