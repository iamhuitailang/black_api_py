const AdminUsersPage = {
    template: `
    <div class="page has-header">
        <div class="header">
            <span class="header-back" @click="goBack">←</span>
            <span class="header-title">👥 用户管理</span>
            <span></span>
        </div>

        <div class="search-bar">
            <div class="search-input-wrapper">
                <span class="search-icon">🔍</span>
                <input type="text" class="search-input" v-model="keyword" placeholder="搜索用户名/昵称" @keyup.enter="loadUsers">
            </div>
            <button class="search-btn" @click="loadUsers">搜索</button>
        </div>

        <div v-if="loading" class="empty-state"><div class="empty-state-icon">⏳</div><div class="empty-state-text">加载中...</div></div>
        <div v-else-if="users.length === 0" class="empty-state"><div class="empty-state-icon">👥</div><div class="empty-state-text">暂无用户</div></div>
        <div v-else class="admin-list">
            <div class="admin-user-item" v-for="u in users" :key="u.id">
                <div class="admin-user-avatar">{{ (u.nickname || u.username || '?')[0] }}</div>
                <div class="admin-user-info">
                    <div class="admin-user-name">{{ u.nickname || u.username }}</div>
                    <div class="admin-user-meta">@{{ u.username }} · {{ u.role_text }} · {{ u.status_text }}</div>
                </div>
                <div class="admin-user-actions">
                    <button class="btn btn-sm" :class="u.status === 0 ? 'btn-danger' : 'btn-primary'" @click="toggleBan(u)">
                        {{ u.status === 0 ? '封号' : '解封' }}
                    </button>
                    <button class="btn btn-sm btn-danger" @click="deleteUser(u)">删除</button>
                </div>
            </div>
        </div>

        <div class="pagination" v-if="totalPages > 1">
            <button class="btn btn-sm btn-outline" :disabled="page <= 1" @click="page--">上一页</button>
            <span>{{ page }}/{{ totalPages }}</span>
            <button class="btn btn-sm btn-outline" :disabled="page >= totalPages" @click="page++">下一页</button>
        </div>
    </div>
    `,
    data() {
        return {
            users: [],
            keyword: '',
            page: 1,
            pageSize: 10,
            total: 0,
            loading: false
        };
    },
    computed: {
        totalPages() { return Math.ceil(this.total / this.pageSize) || 1; }
    },
    mounted() { this.loadUsers(); },
    methods: {
        async loadUsers() {
            this.loading = true;
            try {
                const params = { page: this.page, page_size: this.pageSize };
                if (this.keyword) params.keyword = this.keyword;
                const result = await ZbtApi.get('/zbt/admin/user/list/get', params);
                if (result.code === 0) {
                    this.users = result.data.items;
                    this.total = result.data.total;
                }
            } catch (e) { console.error(e); }
            finally { this.loading = false; }
        },
        async toggleBan(user) {
            try {
                const action = user.status === 0 ? 'ban' : 'unban';
                const result = await ZbtApi.post(`/zbt/admin/user/${action}`, { user_id: user.id });
                if (result.code === 0) {
                    this.loadUsers();
                }
            } catch (e) { console.error(e); }
        },
        async deleteUser(user) {
            if (!confirm(`确定删除用户 ${user.username}?`)) return;
            try {
                const result = await ZbtApi.post('/zbt/admin/user/delete', { user_id: user.id });
                if (result.code === 0) {
                    this.loadUsers();
                }
            } catch (e) { console.error(e); }
        },
        goBack() { ZbtRouter.navigate('/admin/dashboard'); }
    },
    watch: {
        page() { this.loadUsers(); }
    }
};
