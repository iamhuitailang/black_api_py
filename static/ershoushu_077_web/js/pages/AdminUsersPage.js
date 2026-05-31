const AdminUsersPage = {
    template: `
    <div>
        <div class="page-header"><h1 class="page-title">👥 用户管理</h1></div>
        <div class="toolbar">
            <div class="toolbar-left">
                <div class="search-box"><span class="search-icon">🔍</span><input v-model="keyword" @keyup.enter="page=1;loadUsers()" placeholder="搜索用户名、昵称..."></div>
            </div>
            <div class="toolbar-right">
                <select v-model="currentRole" @change="page=1;loadUsers()" style="width:120px;padding:8px">
                    <option value="">全部角色</option>
                    <option value="user">普通用户</option>
                    <option value="admin">管理员</option>
                </select>
            </div>
        </div>
        <div class="card">
            <div class="table-container">
                <table class="table">
                    <thead><tr><th>ID</th><th>用户名</th><th>昵称</th><th>角色</th><th>状态</th><th>注册时间</th><th>操作</th></tr></thead>
                    <tbody>
                        <tr v-for="u in users" :key="u.id">
                            <td>{{ u.id }}</td>
                            <td>{{ u.username }}</td>
                            <td>{{ u.nickname || '-' }}</td>
                            <td><span class="badge" :class="u.role==='admin'?'badge-primary':'badge-secondary'">{{ u.role_text }}</span></td>
                            <td><span class="badge" :class="u.status===0?'badge-success':u.status===1?'badge-warning':'badge-danger'">{{ u.status_text }}</span></td>
                            <td>{{ Utils.formatDateTime(u.created_at) }}</td>
                            <td><div class="table-actions">
                                <button v-if="u.role!=='admin'" class="btn btn-sm" :class="u.status===0?'btn-warning':'btn-success'" @click="toggleStatus(u)">{{ u.status===0?'禁言':u.status===1?'解禁':'解封' }}</button>
                                <button v-if="u.role!=='admin' && u.status!==2" class="btn btn-danger btn-sm" @click="banUser(u.id)">封号</button>
                                <button v-if="u.role!=='admin' && u.status===2" class="btn btn-success btn-sm" @click="unbanUser(u.id)">解封</button>
                            </div></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div class="pagination">
            <button class="pagination-btn" :disabled="page<=1" @click="page--;loadUsers()">上一页</button>
            <span style="font-size:13px;color:var(--text-secondary)">{{ page }} / {{ totalPages||1 }}</span>
            <button class="pagination-btn" :disabled="page>=totalPages" @click="page++;loadUsers()">下一页</button>
        </div>
    </div>
    `,
    data() {
        return { users: [], keyword: '', currentRole: '', page: 1, pageSize: 10, totalPages: 0, Utils: Utils };
    },
    async mounted() { await this.loadUsers(); },
    methods: {
        async loadUsers() {
            const params = { page: this.page, page_size: this.pageSize, keyword: this.keyword || undefined, role: this.currentRole || undefined };
            const result = await ApiService.get('/ershoushu/user/list/get', params);
            if (result.code === 0) { this.users = result.data.items; this.totalPages = result.data.total_pages; }
        },
        async toggleStatus(u) {
            if (u.status === 0) {
                const result = await ApiService.post('/ershoushu/user/mute', { user_id: u.id });
                if (result.code === 0) { this.$root.showToast('已禁言', 'success'); await this.loadUsers(); }
            } else if (u.status === 1) {
                const result = await ApiService.post('/ershoushu/user/unban', { user_id: u.id });
                if (result.code === 0) { this.$root.showToast('已解禁', 'success'); await this.loadUsers(); }
            }
        },
        async banUser(userId) {
            if (!confirm('确定封号？')) return;
            const result = await ApiService.post('/ershoushu/user/ban', { user_id: userId });
            if (result.code === 0) { this.$root.showToast('已封号', 'success'); await this.loadUsers(); }
        },
        async unbanUser(userId) {
            const result = await ApiService.post('/ershoushu/user/unban', { user_id: userId });
            if (result.code === 0) { this.$root.showToast('已解封', 'success'); await this.loadUsers(); }
        }
    }
};
