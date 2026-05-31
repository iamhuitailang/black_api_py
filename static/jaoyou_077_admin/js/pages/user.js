const AdminUserPage = {
    template: `
        <div>
            <div class="page-header">
                <h1 class="page-title">用户管理</h1>
            </div>

            <div class="card">
                <div class="filter-bar">
                    <select v-model="filterStatus" @change="loadUsers">
                        <option value="">全部状态</option>
                        <option value="0">待审核</option>
                        <option value="1">已通过</option>
                        <option value="2">已拒绝</option>
                        <option value="3">已封禁</option>
                    </select>
                    <select v-model="filterGender" @change="loadUsers">
                        <option value="">全部性别</option>
                        <option value="1">男</option>
                        <option value="2">女</option>
                    </select>
                    <input type="text" v-model="keyword" placeholder="搜索昵称、手机号..." @keyup.enter="searchUsers">
                    <button class="btn-small btn-info" @click="searchUsers">搜索</button>
                </div>

                <div v-if="users.length === 0 && !loading" class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <p>暂无用户数据</p>
                </div>

                <div v-else class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>用户</th>
                                <th>性别</th>
                                <th>年龄</th>
                                <th>城市</th>
                                <th>状态</th>
                                <th>注册时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="user in users" :key="user.id">
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
                                <td>{{ user.age || '-' }}</td>
                                <td>{{ user.city || '-' }}</td>
                                <td>
                                    <span :class="['status-badge', getStatusClass(user.status)]">
                                        {{ getStatusText(user.status) }}
                                    </span>
                                </td>
                                <td>{{ user.created_at }}</td>
                                <td>
                                    <div class="action-buttons">
                                        <button v-if="user.status === 0" class="btn-small btn-success" @click="reviewUser(user.id, 1)">通过</button>
                                        <button v-if="user.status === 0" class="btn-small btn-danger" @click="reviewUser(user.id, 2)">拒绝</button>
                                        <button v-if="user.status === 1" class="btn-small btn-warning" @click="reviewUser(user.id, 3)">封禁</button>
                                        <button v-if="user.status === 3" class="btn-small btn-success" @click="reviewUser(user.id, 1)">解封</button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="pagination" v-if="totalPages > 1">
                    <button @click="changePage(page - 1)" :disabled="page <= 1">上一页</button>
                    <button v-for="p in totalPages" :key="p" 
                            :class="{ active: p === page }"
                            @click="changePage(p)">{{ p }}</button>
                    <button @click="changePage(page + 1)" :disabled="page >= totalPages">下一页</button>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            users: [],
            page: 1,
            pageSize: 10,
            total: 0,
            totalPages: 0,
            keyword: '',
            filterStatus: '',
            filterGender: '',
            loading: false
        };
    },
    mounted() {
        this.loadUsers();
    },
    methods: {
        async loadUsers() {
            this.loading = true;
            const params = {
                page: this.page,
                page_size: this.pageSize
            };
            if (this.keyword) params.keyword = this.keyword;
            if (this.filterStatus !== '') params.status = this.filterStatus;
            if (this.filterGender !== '') params.gender = this.filterGender;

            const result = await Api.get('/jaoyou/admin/user/list/get', params);
            this.loading = false;

            if (result.code === 0) {
                this.users = result.data.items;
                this.total = result.data.total;
                this.totalPages = result.data.total_pages;
            }
        },
        searchUsers() {
            this.page = 1;
            this.loadUsers();
        },
        changePage(newPage) {
            if (newPage >= 1 && newPage <= this.totalPages) {
                this.page = newPage;
                this.loadUsers();
            }
        },
        getStatusClass(status) {
            const classes = {
                0: 'status-pending',
                1: 'status-active',
                2: 'status-rejected',
                3: 'status-banned'
            };
            return classes[status] || '';
        },
        getStatusText(status) {
            const texts = {
                0: '待审核',
                1: '已通过',
                2: '已拒绝',
                3: '已封禁'
            };
            return texts[status] || '未知';
        },
        async reviewUser(userId, status) {
            const statusText = this.getStatusText(status);
            if (!confirm(`确定要将该用户状态修改为「${statusText}」吗？`)) {
                return;
            }

            const result = await Api.post('/jaoyou/admin/user/review', {
                user_id: userId,
                status: status
            });

            if (result.code === 0) {
                alert('操作成功');
                this.loadUsers();
            } else {
                alert(result.msg);
            }
        }
    }
};
