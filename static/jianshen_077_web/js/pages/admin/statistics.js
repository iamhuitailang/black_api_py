const AdminStatistics = {
    template: `
        <div class="admin-layout">
            <div class="admin-sidebar">
                <div class="admin-sidebar-header">
                    <div class="admin-sidebar-title">💪 FitLife</div>
                    <div class="admin-sidebar-subtitle">管理后台</div>
                </div>
                <router-link to="/admin/courses" class="admin-menu-item"><span class="admin-menu-icon">🏋️</span>课程管理</router-link>
                <router-link to="/admin/bookings" class="admin-menu-item"><span class="admin-menu-icon">📋</span>预约管理</router-link>
                <router-link to="/admin/members" class="admin-menu-item"><span class="admin-menu-icon">👥</span>会员管理</router-link>
                <router-link to="/admin/checkins" class="admin-menu-item"><span class="admin-menu-icon">✅</span>签到管理</router-link>
                <router-link to="/admin/statistics" class="admin-menu-item active"><span class="admin-menu-icon">📊</span>数据统计</router-link>
                <div style="border-top: 1px solid var(--border-color); margin-top: 20px;"></div>
                <router-link to="/profile" class="admin-menu-item"><span class="admin-menu-icon">👤</span>返回前端</router-link>
            </div>

            <div class="admin-main">
                <div class="admin-header">
                    <h2 class="admin-page-title">数据统计</h2>
                </div>

                <div class="stat-cards" v-if="dashboard">
                    <div class="stat-card">
                        <div class="stat-card-icon">👥</div>
                        <div class="stat-card-value">{{ dashboard.total_users }}</div>
                        <div class="stat-card-label">总会员数</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-icon">🏋️</div>
                        <div class="stat-card-value">{{ dashboard.total_courses }}</div>
                        <div class="stat-card-label">总课程数</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-icon">📋</div>
                        <div class="stat-card-value">{{ dashboard.confirmed_bookings }}</div>
                        <div class="stat-card-label">有效预约</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-card-icon">✅</div>
                        <div class="stat-card-value">{{ dashboard.total_checkins }}</div>
                        <div class="stat-card-label">签到总数</div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div class="card">
                        <div class="card-header">
                            <span class="card-title">课程预约排行</span>
                        </div>
                        <div class="card-body">
                            <div v-if="courseStats && courseStats.booking_ranking">
                                <div v-for="(item, index) in courseStats.booking_ranking" :key="item.id"
                                     style="display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                                    <span style="width: 24px; font-weight: 600; color: var(--primary-color);">{{ index + 1 }}</span>
                                    <div style="flex: 1;">
                                        <div style="font-size: 14px;">{{ item.title }}</div>
                                        <div style="font-size: 12px; color: var(--text-secondary);">{{ item.coach }} · {{ item.category_name }}</div>
                                    </div>
                                    <span class="badge badge-primary">{{ item.current_booking }}人</span>
                                </div>
                            </div>
                            <div v-else class="empty-state" style="padding: 20px;">
                                <div class="empty-state-text">暂无数据</div>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <span class="card-title">会员签到排行</span>
                        </div>
                        <div class="card-body">
                            <div v-if="memberStats && memberStats.checkin_ranking">
                                <div v-for="(item, index) in memberStats.checkin_ranking" :key="item.id"
                                     style="display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                                    <span style="width: 24px; font-weight: 600; color: var(--primary-color);">{{ index + 1 }}</span>
                                    <div style="flex: 1;">
                                        <div style="font-size: 14px;">{{ item.nickname || item.username }}</div>
                                    </div>
                                    <span class="badge badge-success">{{ item.checkin_count }}次</span>
                                </div>
                            </div>
                            <div v-else class="empty-state" style="padding: 20px;">
                                <div class="empty-state-text">暂无数据</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            dashboard: null,
            courseStats: null,
            memberStats: null
        };
    },
    methods: {
        async loadDashboard() {
            try {
                const result = await StatisticsService.getDashboard();
                if (result.code === 0) this.dashboard = result.data;
            } catch (e) {}
        },
        async loadCourseStats() {
            try {
                const result = await StatisticsService.getCourseStats();
                if (result.code === 0) this.courseStats = result.data;
            } catch (e) {}
        },
        async loadMemberStats() {
            try {
                const result = await StatisticsService.getMemberStats();
                if (result.code === 0) this.memberStats = result.data;
            } catch (e) {}
        }
    },
    async mounted() {
        await this.loadDashboard();
        await this.loadCourseStats();
        await this.loadMemberStats();
    }
};

window.AdminStatistics = AdminStatistics;
