const AdminUsersPage = {
    props: ['user', 'isAdmin'],
    template: `
    <div>
        <div class="page-header">
            <h2 class="page-title">👥 用户管理</h2>
        </div>
        <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;">
            <input v-model="searchKeyword" placeholder="搜索用户名/昵称" style="padding:8px 14px;background:var(--bg-input);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);width:250px;">
            <select v-model="filterStatus" style="padding:8px 14px;background:var(--bg-input);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);">
                <option :value="null">全部状态</option>
                <option :value="0">正常</option>
                <option :value="1">封号</option>
            </select>
            <select v-model="filterRole" style="padding:8px 14px;background:var(--bg-input);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);">
                <option :value="null">全部角色</option>
                <option :value="0">玩家</option>
                <option :value="1">管理员</option>
            </select>
            <button class="btn btn-primary btn-sm" @click="loadData(1)">搜索</button>
        </div>
        <div class="card">
            <div class="table-container">
                <table>
                    <thead><tr><th>ID</th><th>用户名</th><th>昵称</th><th>角色</th><th>累计分</th><th>最高分</th><th>局数</th><th>状态</th><th>操作</th></tr></thead>
                    <tbody>
                        <tr v-for="u in users" :key="u.id">
                            <td>{{ u.id }}</td>
                            <td>{{ u.username }}</td>
                            <td>{{ u.nickname }}</td>
                            <td><span :class="u.role === 1 ? 'badge badge-danger' : 'badge badge-info'">{{ u.role_text }}</span></td>
                            <td class="text-gold">{{ u.total_score }}</td>
                            <td>{{ u.best_score }}</td>
                            <td>{{ u.total_games }}</td>
                            <td><span :class="u.status === 0 ? 'badge badge-success' : 'badge badge-danger'">{{ u.status_text }}</span></td>
                            <td>
                                <div style="display:flex;gap:4px;flex-wrap:wrap;">
                                    <button v-if="u.status === 0" class="btn btn-danger btn-sm" @click="banUser(u.id)">封号</button>
                                    <button v-if="u.status === 1" class="btn btn-success btn-sm" @click="unbanUser(u.id)">解封</button>
                                    <button v-if="u.role === 0" class="btn btn-info btn-sm" @click="setRole(u.id, 1)">设管理员</button>
                                    <button v-if="u.role === 1 && u.username !== 'admin'" class="btn btn-warning btn-sm" @click="setRole(u.id, 0)">取消管理员</button>
                                    <button class="btn btn-secondary btn-sm" @click="resetPassword(u.id)">重置密码</button>
                                    <button v-if="u.username !== 'admin'" class="btn btn-danger btn-sm" @click="deleteUser(u.id)">删除</button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="pagination">
                <button :disabled="page <= 1" @click="loadData(page - 1)">上一页</button>
                <span class="page-info">{{ page }} / {{ totalPages || 1 }}</span>
                <button :disabled="page >= totalPages" @click="loadData(page + 1)">下一页</button>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            users: [],
            page: 1,
            totalPages: 1,
            searchKeyword: '',
            filterStatus: null,
            filterRole: null
        };
    },
    async mounted() {
        await this.loadData(1);
    },
    methods: {
        async loadData(p) {
            this.page = p;
            const result = await Api.admin.getUserList(p, 10, this.filterStatus, this.filterRole, this.searchKeyword || null);
            if (result.code === 0 && result.data) {
                this.users = result.data.items || [];
                this.totalPages = result.data.total_pages || 1;
            }
        },
        async banUser(userId) {
            if (!confirm('确定封号？')) return;
            const result = await Api.admin.banUser(userId);
            if (result.code === 0) await this.loadData(this.page);
            else alert(result.msg || '操作失败');
        },
        async unbanUser(userId) {
            const result = await Api.admin.unbanUser(userId);
            if (result.code === 0) await this.loadData(this.page);
            else alert(result.msg || '操作失败');
        },
        async setRole(userId, role) {
            const msg = role === 1 ? '确定设为管理员？' : '确定取消管理员？';
            if (!confirm(msg)) return;
            const result = await Api.admin.setUserRole(userId, role);
            if (result.code === 0) await this.loadData(this.page);
            else alert(result.msg || '操作失败');
        },
        async resetPassword(userId) {
            const pwd = prompt('请输入新密码（至少6位）：');
            if (!pwd || pwd.length < 6) { alert('密码至少6位'); return; }
            const result = await Api.admin.resetPassword(userId, pwd);
            if (result.code === 0) alert('密码重置成功');
            else alert(result.msg || '操作失败');
        },
        async deleteUser(userId) {
            if (!confirm('确定删除该用户？此操作不可恢复！')) return;
            const result = await Api.admin.deleteUser(userId);
            if (result.code === 0) await this.loadData(this.page);
            else alert(result.msg || '操作失败');
        }
    }
};
