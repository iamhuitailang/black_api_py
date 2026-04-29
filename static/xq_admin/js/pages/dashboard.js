const DashboardPage = {
    async render() {
        Layout.render(`
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-card-header">
                        <span class="stat-card-title">总发布数</span>
                        <div class="stat-card-icon primary">📝</div>
                    </div>
                    <div class="stat-card-value" id="statTotal">-</div>
                    <div class="stat-card-change">累计发布的求助/帮助</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-header">
                        <span class="stat-card-title">进行中</span>
                        <div class="stat-card-icon warning">⏳</div>
                    </div>
                    <div class="stat-card-value" id="statPending">-</div>
                    <div class="stat-card-change">待接单或进行中的任务</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-header">
                        <span class="stat-card-title">已完成</span>
                        <div class="stat-card-icon success">✅</div>
                    </div>
                    <div class="stat-card-value" id="statCompleted">-</div>
                    <div class="stat-card-change">已完成的任务</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-header">
                        <span class="stat-card-title">完成率</span>
                        <div class="stat-card-icon danger">📈</div>
                    </div>
                    <div class="stat-card-value" id="statRate">-</div>
                    <div class="stat-card-change">任务完成率</div>
                </div>
            </div>

            <div class="chart-container">
                <div class="chart-title">最近动态</div>
                <div id="recentPosts" class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>标题</th>
                                <th>类型</th>
                                <th>分类</th>
                                <th>状态</th>
                                <th>发布时间</th>
                            </tr>
                        </thead>
                        <tbody id="recentPostsBody">
                            <tr><td colspan="5" class="text-center">加载中...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `, 'dashboard');

        await this.loadData();
    },

    async loadData() {
        try {
            const statsResult = await ApiService.get('/xq/post/statistics/get');
            if (statsResult.code === 0) {
                const data = statsResult.data;
                document.getElementById('statTotal').textContent = data.total || 0;
                document.getElementById('statPending').textContent = data.pending || 0;
                document.getElementById('statCompleted').textContent = data.completed || 0;
                document.getElementById('statRate').textContent = (data.complete_rate || 0) + '%';
            }

            const postsResult = await ApiService.get('/xq/post/admin/list/get', {
                page: 1,
                page_size: 10
            });

            const tbody = document.getElementById('recentPostsBody');
            if (postsResult.code === 0 && postsResult.data.items.length > 0) {
                tbody.innerHTML = postsResult.data.items.map(post => `
                    <tr>
                        <td>${post.title}</td>
                        <td><span class="badge ${post.type === 'need' ? 'badge-warning' : 'badge-info'}">${post.type_text}</span></td>
                        <td>${post.category_name}</td>
                        <td><span class="badge ${this.getStatusBadge(post.status)}">${post.status_text}</span></td>
                        <td>${this.formatTime(post.created_at)}</td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center">暂无数据</td></tr>';
            }
        } catch (error) {
            console.error('加载数据失败:', error);
            Toast.error('加载数据失败');
        }
    },

    getStatusBadge(status) {
        const badges = {
            0: 'badge-warning',
            1: 'badge-info',
            2: 'badge-success',
            3: 'badge-secondary'
        };
        return badges[status] || 'badge-secondary';
    },

    formatTime(time) {
        if (!time) return '-';
        const date = new Date(time);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
};
