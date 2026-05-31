const AdminMatchPage = {
    template: `
        <div>
            <div class="page-header">
                <h1 class="page-title">匹配管理</h1>
            </div>

            <div class="card">
                <div class="filter-bar">
                    <select v-model="filterStatus" @change="loadMatches">
                        <option value="">全部状态</option>
                        <option value="1">正常</option>
                        <option value="2">已取消</option>
                    </select>
                    <button class="btn-small btn-info" @click="loadMatches">刷新</button>
                </div>

                <div v-if="matches.length === 0 && !loading" class="empty-state">
                    <div class="empty-state-icon">💔</div>
                    <p>暂无匹配记录</p>
                </div>

                <div v-else class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>用户A</th>
                                <th>用户B</th>
                                <th>状态</th>
                                <th>匹配时间</th>
                                <th>取消时间</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="match in matches" :key="match.id">
                                <td>{{ match.id }}</td>
                                <td>
                                    <div class="user-info-cell">
                                        <div class="user-avatar">{{ match.user_a_nickname ? match.user_a_nickname.charAt(0) : '?' }}</div>
                                        <div>
                                            <div>{{ match.user_a_nickname || '-' }}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div class="user-info-cell">
                                        <div class="user-avatar">{{ match.user_b_nickname ? match.user_b_nickname.charAt(0) : '?' }}</div>
                                        <div>
                                            <div>{{ match.user_b_nickname || '-' }}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span :class="['status-badge', match.status === 1 ? 'status-active' : 'status-rejected']">
                                        {{ match.status === 1 ? '正常' : '已取消' }}
                                    </span>
                                </td>
                                <td>{{ match.created_at }}</td>
                                <td>{{ match.cancelled_at || '-' }}</td>
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
            matches: [],
            page: 1,
            pageSize: 10,
            total: 0,
            totalPages: 0,
            filterStatus: '',
            loading: false
        };
    },
    mounted() {
        this.loadMatches();
    },
    methods: {
        async loadMatches() {
            this.loading = true;
            const params = {
                page: this.page,
                page_size: this.pageSize
            };
            if (this.filterStatus !== '') params.status = this.filterStatus;

            const result = await Api.get('/jaoyou/admin/match/list/get', params);
            this.loading = false;

            if (result.code === 0) {
                this.matches = result.data.items;
                this.total = result.data.total;
                this.totalPages = result.data.total_pages;
            }
        },
        changePage(newPage) {
            if (newPage >= 1 && newPage <= this.totalPages) {
                this.page = newPage;
                this.loadMatches();
            }
        }
    }
};
