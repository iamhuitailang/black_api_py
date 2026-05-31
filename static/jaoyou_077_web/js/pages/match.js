const MatchPage = {
    template: `
        <div class="container">
            <h1 class="page-title">我的匹配</h1>
            
            <div class="tabs">
                <div :class="['tab', activeTab === 'matches' ? 'active' : '']" @click="activeTab = 'matches'">
                    匹配列表
                </div>
                <div :class="['tab', activeTab === 'sent' ? 'active' : '']" @click="activeTab = 'sent'">
                    我发出的心动
                </div>
                <div :class="['tab', activeTab === 'received' ? 'active' : '']" @click="activeTab = 'received'">
                    收到的心动
                </div>
            </div>

            <div v-if="activeTab === 'matches'">
                <div v-if="matches.length === 0 && !loading" class="empty-state">
                    <div class="empty-state-icon">💕</div>
                    <p>暂无匹配用户，快去发现心动吧！</p>
                </div>
                <div v-else>
                    <div v-for="match in matches" :key="match.id" class="match-card" @click="viewUser(match.matched_user.id)">
                        <div class="grid-avatar">
                            {{ match.matched_user.nickname.charAt(0) }}
                        </div>
                        <div class="match-info">
                            <div class="match-name">
                                {{ match.matched_user.nickname }}
                                <span :class="['gender-badge', match.matched_user.gender === 1 ? 'gender-male' : 'gender-female']">
                                    {{ match.matched_user.gender_text }}
                                </span>
                            </div>
                            <div class="match-time">
                                匹配时间: {{ match.created_at }}
                            </div>
                        </div>
                        <button class="btn-small btn-heart" @click.stop="sendDate(match.matched_user)">
                            发起约会
                        </button>
                    </div>
                </div>
            </div>

            <div v-if="activeTab === 'sent'">
                <div v-if="sentHearts.length === 0 && !loading" class="empty-state">
                    <div class="empty-state-icon">💌</div>
                    <p>还没有发出过心动</p>
                </div>
                <div v-else>
                    <div v-for="heart in sentHearts" :key="heart.id" class="user-card">
                        <div class="user-avatar-large">
                            {{ heart.to_user.nickname.charAt(0) }}
                        </div>
                        <div class="user-info">
                            <div class="user-name">
                                {{ heart.to_user.nickname }}
                                <span :class="['status-pending', 'date-status']">{{ heart.status_text }}</span>
                            </div>
                            <div class="user-meta">
                                发送时间: {{ heart.created_at }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="activeTab === 'received'">
                <div v-if="receivedHearts.length === 0 && !loading" class="empty-state">
                    <div class="empty-state-icon">💝</div>
                    <p>还没有收到心动</p>
                </div>
                <div v-else>
                    <div v-for="heart in receivedHearts" :key="heart.id" class="user-card">
                        <div class="user-avatar-large">
                            {{ heart.from_user.nickname.charAt(0) }}
                        </div>
                        <div class="user-info">
                            <div class="user-name">
                                {{ heart.from_user.nickname }}
                                <span :class="['gender-badge', heart.from_user.gender === 1 ? 'gender-male' : 'gender-female']">
                                    {{ heart.from_user.gender_text }}
                                </span>
                            </div>
                            <div class="user-meta">
                                发送时间: {{ heart.created_at }}
                            </div>
                        </div>
                        <div class="user-actions" v-if="heart.status === 0">
                            <button class="btn-small btn-heart" @click="respondHeart(heart.id, true)">
                                接受
                            </button>
                            <button class="btn-small btn-message" @click="respondHeart(heart.id, false)">
                                拒绝
                            </button>
                        </div>
                        <span v-else :class="['date-status', heart.status === 1 ? 'status-accepted' : 'status-rejected']">
                            {{ heart.status_text }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            activeTab: 'matches',
            matches: [],
            sentHearts: [],
            receivedHearts: [],
            loading: false
        };
    },
    watch: {
        activeTab() {
            this.loadData();
        }
    },
    mounted() {
        this.loadData();
    },
    methods: {
        loadData() {
            if (this.activeTab === 'matches') {
                this.loadMatches();
            } else if (this.activeTab === 'sent') {
                this.loadSentHearts();
            } else if (this.activeTab === 'received') {
                this.loadReceivedHearts();
            }
        },
        async loadMatches() {
            this.loading = true;
            const result = await Api.get('/jaoyou/match/list/get');
            this.loading = false;
            if (result.code === 0) {
                this.matches = result.data.items;
            }
        },
        async loadSentHearts() {
            this.loading = true;
            const result = await Api.get('/jaoyou/heart/sent/get');
            this.loading = false;
            if (result.code === 0) {
                this.sentHearts = result.data.items;
            }
        },
        async loadReceivedHearts() {
            this.loading = true;
            const result = await Api.get('/jaoyou/heart/received/get');
            this.loading = false;
            if (result.code === 0) {
                this.receivedHearts = result.data.items;
            }
        },
        async respondHeart(heartId, accepted) {
            const result = await Api.post('/jaoyou/heart/respond', {
                heart_id: heartId,
                accepted: accepted
            });
            if (result.code === 0) {
                alert(accepted ? '已接受心动！' : '已拒绝心动');
                this.loadReceivedHearts();
            } else {
                alert(result.msg);
            }
        },
        viewUser(userId) {
            this.$router.push(`/user/${userId}`);
        },
        sendDate(user) {
            if (confirm(`确定要向 ${user.nickname} 发起约会吗？`)) {
                this.$router.push(`/date?to_user_id=${user.id}&to_user_name=${encodeURIComponent(user.nickname)}`);
            }
        }
    }
};
