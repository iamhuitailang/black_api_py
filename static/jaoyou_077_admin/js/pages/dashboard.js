const AdminDashboardPage = {
    template: `
        <div>
            <div class="page-header">
                <h1 class="page-title">数据统计</h1>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">👥</div>
                    <div class="stat-value">{{ statistics.total_users || 0 }}</div>
                    <div class="stat-label">总用户数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">✅</div>
                    <div class="stat-value">{{ statistics.active_users || 0 }}</div>
                    <div class="stat-label">活跃用户</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">💕</div>
                    <div class="stat-value">{{ statistics.total_matches || 0 }}</div>
                    <div class="stat-label">总匹配数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">📅</div>
                    <div class="stat-value">{{ statistics.total_dates || 0 }}</div>
                    <div class="stat-label">总约会数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">💌</div>
                    <div class="stat-value">{{ statistics.total_hearts || 0 }}</div>
                    <div class="stat-label">心动总数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⚠️</div>
                    <div class="stat-value">{{ statistics.pending_complaints || 0 }}</div>
                    <div class="stat-label">待处理投诉</div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">用户性别分布</div>
                </div>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">👨</div>
                        <div class="stat-value">{{ statistics.male_users || 0 }}</div>
                        <div class="stat-label">男性用户</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">👩</div>
                        <div class="stat-value">{{ statistics.female_users || 0 }}</div>
                        <div class="stat-label">女性用户</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">待审核用户</div>
                </div>
                <div v-if="statistics.pending_users === 0" class="empty-state">
                    <div class="empty-state-icon">🎉</div>
                    <p>暂无待审核用户</p>
                </div>
                <div v-else class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>用户</th>
                                <th>性别</th>
                                <th>注册时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="user in pendingUsers" :key="user.id">
                                <td>
                                    <div class="user-info-cell">
                                        <div class="user-avatar">{{ user.nickname.charAt(0) }}</div>
                                        <div>
                                            <div>{{ user.nickname }}</div>
                                            <div style="color:#888;font-size:12px;">{{ user.phone }}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span :class="['gender-badge', user.gender === 1 ? 'gender-male' : 'gender-female']">
                                        {{ user.gender === 1 ? '男' : '女' }}
                                    </span>
                                </td>
                                <td>{{ user.created_at }}</td>
                                <td>
                                    <button class="btn-small btn-info" @click="goToUserManage">去审核</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            statistics: {},
            pendingUsers: []
        };
    },
    mounted() {
        this.loadStatistics();
    },
    methods: {
        async loadStatistics() {
            const result = await Api.get('/jaoyou/admin/statistics/get');
            if (result.code === 0) {
                this.statistics = result.data.statistics || {};
                this.pendingUsers = result.data.pending_users || [];
            }
        },
        goToUserManage() {
            this.$router.push('/user');
        }
    }
};
