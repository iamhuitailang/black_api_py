const AdminMemberManage = {
    template: `
        <div class="admin-layout">
            <div class="admin-sidebar">
                <div class="admin-sidebar-header">
                    <div class="admin-sidebar-title">💪 FitLife</div>
                    <div class="admin-sidebar-subtitle">管理后台</div>
                </div>
                <router-link to="/admin/courses" class="admin-menu-item"><span class="admin-menu-icon">🏋️</span>课程管理</router-link>
                <router-link to="/admin/bookings" class="admin-menu-item"><span class="admin-menu-icon">📋</span>预约管理</router-link>
                <router-link to="/admin/members" class="admin-menu-item active"><span class="admin-menu-icon">👥</span>会员管理</router-link>
                <router-link to="/admin/checkins" class="admin-menu-item"><span class="admin-menu-icon">✅</span>签到管理</router-link>
                <router-link to="/admin/statistics" class="admin-menu-item"><span class="admin-menu-icon">📊</span>数据统计</router-link>
                <div style="border-top: 1px solid var(--border-color); margin-top: 20px;"></div>
                <router-link to="/profile" class="admin-menu-item"><span class="admin-menu-icon">👤</span>返回前端</router-link>
            </div>

            <div class="admin-main">
                <div class="admin-header">
                    <h2 class="admin-page-title">会员管理</h2>
                </div>

                <div class="search-bar" style="margin: 0 0 16px; border-radius: var(--radius-md);">
                    <div class="search-input-wrapper">
                        <span class="search-icon">🔍</span>
                        <input class="search-input" v-model="keyword" placeholder="搜索用户" @keyup.enter="loadUsers">
                    </div>
                    <select class="form-control" style="width: 120px; padding: 8px;" v-model="filterStatus" @change="loadUsers">
                        <option :value="null">全部状态</option>
                        <option :value="0">正常</option>
                        <option :value="1">禁用</option>
                    </select>
                </div>

                <div class="data-table">
                    <div class="data-table-header">
                        <div class="data-table-col" style="width: 8%;">ID</div>
                        <div class="data-table-col" style="width: 15%;">用户名</div>
                        <div class="data-table-col" style="width: 15%;">昵称</div>
                        <div class="data-table-col" style="width: 15%;">手机号</div>
                        <div class="data-table-col" style="width: 10%;">角色</div>
                        <div class="data-table-col" style="width: 10%;">状态</div>
                        <div class="data-table-col" style="width: 12%;">注册时间</div>
                        <div class="data-table-col" style="width: 15%;">操作</div>
                    </div>
                    <div class="data-table-row" v-for="user in users" :key="user.id">
                        <div class="data-table-col" style="width: 8%;">{{ user.id }}</div>
                        <div class="data-table-col" style="width: 15%;">{{ user.username }}</div>
                        <div class="data-table-col" style="width: 15%;">{{ user.nickname || '-' }}</div>
                        <div class="data-table-col" style="width: 15%;">{{ user.phone || '-' }}</div>
                        <div class="data-table-col" style="width: 10%;"><span class="badge" :class="user.role === 1 ? 'badge-primary' : 'badge-secondary'">{{ user.role_text }}</span></div>
                        <div class="data-table-col" style="width: 10%;"><span class="badge" :class="user.status === 0 ? 'badge-success' : 'badge-danger'">{{ user.status_text }}</span></div>
                        <div class="data-table-col" style="width: 12%; font-size: 12px;">{{ formatDate(user.created_at) }}</div>
                        <div class="data-table-col" style="width: 15%;">
                            <div class="flex gap-1">
                                <button v-if="user.status === 0" class="btn btn-sm btn-warning" @click="toggleStatus(user.id, 1)">禁用</button>
                                <button v-else class="btn btn-sm btn-success" @click="toggleStatus(user.id, 0)">启用</button>
                            </div>
                        </div>
                    </div>
                    <div v-if="users.length === 0" class="empty-state" style="padding: 30px;">
                        <div class="empty-state-text">暂无用户</div>
                    </div>
                </div>

                <div class="pagination" v-if="totalPages > 1">
                    <button class="pagination-btn" :disabled="page <= 1" @click="page--; loadUsers()">上一页</button>
                    <span style="font-size: 13px; color: var(--text-secondary);">{{ page }} / {{ totalPages }}</span>
                    <button class="pagination-btn" :disabled="page >= totalPages" @click="page++; loadUsers()">下一页</button>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            users: [],
            keyword: '',
            filterStatus: null,
            page: 1,
            totalPages: 1
        };
    },
    methods: {
        async loadUsers() {
            try {
                const params = { page: this.page, page_size: 10, role: 0 };
                if (this.keyword) params.keyword = this.keyword;
                if (this.filterStatus !== null) params.status = this.filterStatus;
                const result = await ApiService.get('/jianshen/auth/user/list/get', params);
                if (result.code === 0) {
                    this.users = result.data.items;
                    this.totalPages = result.data.total_pages;
                }
            } catch (e) {
                Toast.error('加载失败');
            }
        },
        async toggleStatus(userId, status) {
            try {
                const result = await ApiService.post('/jianshen/auth/user/status/update', { user_id: userId, status });
                if (result.code === 0) {
                    Toast.success('操作成功');
                    this.loadUsers();
                } else {
                    Toast.error(result.msg || '操作失败');
                }
            } catch (e) {
                Toast.error('操作失败');
            }
        },
        formatDate(time) {
            if (!time) return '-';
            const d = new Date(time);
            return `${d.getMonth() + 1}/${d.getDate()}`;
        }
    },
    mounted() {
        this.loadUsers();
    }
};

window.AdminMemberManage = AdminMemberManage;
