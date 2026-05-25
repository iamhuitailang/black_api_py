const DashboardPage = {
    async render() {
        Layout.render(`
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-card-header">
                        <span class="stat-card-title">总吐槽数</span>
                        <div class="stat-card-icon primary">💬</div>
                    </div>
                    <div class="stat-card-value" id="statTotal">-</div>
                    <div class="stat-card-change">累计发布的吐槽</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-header">
                        <span class="stat-card-title">已通过</span>
                        <div class="stat-card-icon success">✅</div>
                    </div>
                    <div class="stat-card-value" id="statApproved">-</div>
                    <div class="stat-card-change">已通过审核的吐槽</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-header">
                        <span class="stat-card-title">待审核</span>
                        <div class="stat-card-icon warning">⏳</div>
                    </div>
                    <div class="stat-card-value" id="statPending">-</div>
                    <div class="stat-card-change">等待审核的吐槽</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-header">
                        <span class="stat-card-title">今日新增</span>
                        <div class="stat-card-icon danger">📈</div>
                    </div>
                    <div class="stat-card-value" id="statToday">-</div>
                    <div class="stat-card-change">今日发布的吐槽</div>
                </div>
            </div>

            <div class="chart-container">
                <div class="chart-title">最近吐槽</div>
                <div id="recentPosts" class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>匿名ID</th>
                                <th>内容</th>
                                <th>分类</th>
                                <th>点赞</th>
                                <th>回复</th>
                                <th>状态</th>
                                <th>发布时间</th>
                            </tr>
                        </thead>
                        <tbody id="recentPostsBody">
                            <tr><td colspan="7" class="text-center">加载中...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `, 'dashboard');

        await this.loadData();
    },

    async loadData() {
        try {
            const statsResult = await ApiService.get('/tucao/post/statistics/get');
            if (statsResult.code === 0) {
                const data = statsResult.data;
                document.getElementById('statTotal').textContent = data.total || 0;
                document.getElementById('statApproved').textContent = data.approved || 0;
                document.getElementById('statPending').textContent = data.pending || 0;
                document.getElementById('statToday').textContent = data.today_count || 0;
            }

            const postsResult = await ApiService.get('/tucao/admin/post/list/get', {
                page: 1,
                page_size: 10
            });

            const tbody = document.getElementById('recentPostsBody');
            if (postsResult.code === 0 && postsResult.data.items.length > 0) {
                tbody.innerHTML = postsResult.data.items.map(post => `
                    <tr>
                        <td>${post.anonymous_id}</td>
                        <td class="text-truncate" style="max-width: 200px;">${post.content}</td>
                        <td>${post.category || '-'}</td>
                        <td>${post.like_count}</td>
                        <td>${post.reply_count}</td>
                        <td><span class="badge ${this.getStatusBadge(post.status)}">${post.status_text}</span></td>
                        <td>${this.formatTime(post.created_at)}</td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center">暂无数据</td></tr>';
            }
        } catch (error) {
            console.error('加载数据失败:', error);
            Toast.error('加载数据失败');
        }
    },

    getStatusBadge(status) {
        const badges = {
            0: 'badge-warning',
            1: 'badge-success',
            2: 'badge-danger',
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
