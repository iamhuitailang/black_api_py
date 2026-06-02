const AdminUsersPage = {
    template: `
        <div class="admin-users">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h1 style="font-size: 24px;">👥 用户管理</h1>
                <div class="search-box" style="display: flex; gap: 12px;">
                    <input type="text" class="form-input" v-model="keyword" 
                           placeholder="搜索用户名/昵称" style="width: 200px;"
                           @keyup.enter="search">
                    <button class="btn btn-primary" @click="search">搜索</button>
                </div>
            </div>

            <div class="card">
                <div class="data-table">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>用户名</th>
                                <th>昵称</th>
                                <th>角色</th>
                                <th>最高得分</th>
                                <th>游戏次数</th>
                                <th>状态</th>
                                <th>注册时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="user in users" :key="user.id">
                                <td>{{ user.id }}</td>
                                <td>{{ user.username }}</td>
                                <td>{{ user.nickname || '-' }}</td>
                                <td>
                                    <span :class="['badge', user.role === 'admin' ? 'badge-primary' : 'badge-success']">
                                        {{ user.role === 'admin' ? '管理员' : '普通用户' }}
                                    </span>
                                </td>
                                <td>{{ (user.highest_score || 0).toLocaleString() }}</td>
                                <td>{{ user.games_played || 0 }}</td>
                                <td>
                                    <span :class="['badge', getStatusBadge(user.status)]">
                                        {{ user.status_text || '正常' }}
                                    </span>
                                </td>
                                <td>{{ formatDate(user.created_at) }}</td>
                                <td>
                                    <div style="display: flex; gap: 8px;">
                                        <button v-if="user.role !== 'admin'" 
                                                class="btn btn-sm"
                                                :class="user.status === 0 ? 'btn-danger' : 'btn-success'"
                                                @click="toggleUserStatus(user)">
                                            {{ user.status === 0 ? '封禁' : '解封' }}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="users.length === 0">
                                <td colspan="9">
                                    <div class="empty-state" style="padding: 40px;">
                                        <div class="empty-icon">👥</div>
                                        <div class="empty-text">暂无用户数据</div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="pagination" v-if="totalPages > 1">
                    <button class="pagination-btn" :disabled="page === 1" @click="prevPage">
                        上一页
                    </button>
                    <span v-for="p in totalPages" :key="p"
                          :class="['pagination-btn', {active: p === page}]"
                          @click="goToPage(p)">
                        {{ p }}
                    </span>
                    <button class="pagination-btn" :disabled="page === totalPages" @click="nextPage">
                        下一页
                    </button>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            users: [],
            keyword: '',
            page: 1,
            pageSize: 10,
            total: 0
        };
    },
    computed: {
        totalPages() {
            return Math.ceil(this.total / this.pageSize);
        }
    },
    async mounted() {
        const admin = Auth.getAdmin();
        if (!admin) {
            Router.navigate('/login');
            return;
        }
        await this.loadUsers();
    },
    methods: {
        async loadUsers() {
            try {
                const result = await API.user.getList({
                    page: this.page,
                    page_size: this.pageSize,
                    keyword: this.keyword
                });
                if (result.code === 0 && result.data) {
                    this.users = result.data.items || [];
                    this.total = result.data.total || 0;
                }
            } catch (e) {
                console.error(e);
            }
        },
        search() {
            this.page = 1;
            this.loadUsers();
        },
        async toggleUserStatus(user) {
            const newStatus = user.status === 0 ? 2 : 0;
            try {
                const result = await API.user.updateStatus({
                    user_id: user.id,
                    status: newStatus
                });
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
        getStatusBadge(status) {
            const badges = {
                0: 'badge-success',
                1: 'badge-warning',
                2: 'badge-danger'
            };
            return badges[status] || 'badge-warning';
        },
        formatDate(dateStr) {
            if (!dateStr) return '-';
            const date = new Date(dateStr);
            return date.toLocaleDateString('zh-CN');
        },
        prevPage() {
            if (this.page > 1) {
                this.page--;
                this.loadUsers();
            }
        },
        nextPage() {
            if (this.page < this.totalPages) {
                this.page++;
                this.loadUsers();
            }
        },
        goToPage(p) {
            this.page = p;
            this.loadUsers();
        }
    }
};
