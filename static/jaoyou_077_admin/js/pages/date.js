const AdminDatePage = {
    template: `
        <div>
            <div class="page-header">
                <h1 class="page-title">约会管理</h1>
            </div>

            <div class="card">
                <div class="filter-bar">
                    <select v-model="filterStatus" @change="loadDates">
                        <option value="">全部状态</option>
                        <option value="0">待确认</option>
                        <option value="1">已接受</option>
                        <option value="2">已拒绝</option>
                        <option value="3">已取消</option>
                    </select>
                    <button class="btn-small btn-info" @click="loadDates">刷新</button>
                </div>

                <div v-if="dates.length === 0 && !loading" class="empty-state">
                    <div class="empty-state-icon">📅</div>
                    <p>暂无约会记录</p>
                </div>

                <div v-else class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>发起方</th>
                                <th>接收方</th>
                                <th>约会标题</th>
                                <th>约会时间</th>
                                <th>地点</th>
                                <th>状态</th>
                                <th>创建时间</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="date in dates" :key="date.id">
                                <td>{{ date.id }}</td>
                                <td>
                                    <div class="user-info-cell">
                                        <div class="user-avatar">{{ date.from_user_nickname ? date.from_user_nickname.charAt(0) : '?' }}</div>
                                        <div>
                                            <div>{{ date.from_user_nickname || '-' }}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div class="user-info-cell">
                                        <div class="user-avatar">{{ date.to_user_nickname ? date.to_user_nickname.charAt(0) : '?' }}</div>
                                        <div>
                                            <div>{{ date.to_user_nickname || '-' }}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>{{ date.title }}</td>
                                <td>{{ date.date_time }}</td>
                                <td>{{ date.location || '-' }}</td>
                                <td>
                                    <span :class="['status-badge', getStatusClass(date.status)]">
                                        {{ getStatusText(date.status) }}
                                    </span>
                                </td>
                                <td>{{ date.created_at }}</td>
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
            dates: [],
            page: 1,
            pageSize: 10,
            total: 0,
            totalPages: 0,
            filterStatus: '',
            loading: false
        };
    },
    mounted() {
        this.loadDates();
    },
    methods: {
        async loadDates() {
            this.loading = true;
            const params = {
                page: this.page,
                page_size: this.pageSize
            };
            if (this.filterStatus !== '') params.status = this.filterStatus;

            const result = await Api.get('/jaoyou/admin/date/list/get', params);
            this.loading = false;

            if (result.code === 0) {
                this.dates = result.data.items;
                this.total = result.data.total;
                this.totalPages = result.data.total_pages;
            }
        },
        changePage(newPage) {
            if (newPage >= 1 && newPage <= this.totalPages) {
                this.page = newPage;
                this.loadDates();
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
                0: '待确认',
                1: '已接受',
                2: '已拒绝',
                3: '已取消'
            };
            return texts[status] || '未知';
        }
    }
};
