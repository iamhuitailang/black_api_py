const ReportPage = {
    currentPage: 1,
    pageSize: 10,
    status: null,

    async render() {
        Layout.render(`
            <div class="page-header">
                <h2>举报处理</h2>
            </div>

            <div class="search-bar">
                <select id="searchStatus" onchange="ReportPage.search()">
                    <option value="">全部状态</option>
                    <option value="0">待处理</option>
                    <option value="1">已处理</option>
                    <option value="2">已驳回</option>
                </select>
                <button class="btn btn-primary" onclick="ReportPage.search()">筛选</button>
            </div>

            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>举报类型</th>
                            <th>目标类型</th>
                            <th>目标ID</th>
                            <th>描述</th>
                            <th>状态</th>
                            <th>举报时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="reportTableBody">
                        <tr><td colspan="8" class="text-center">加载中...</td></tr>
                    </tbody>
                </table>
            </div>

            <div class="pagination" id="pagination"></div>
        `, 'report');

        await this.loadData();
    },

    search() {
        const statusVal = document.getElementById('searchStatus').value;
        this.status = statusVal !== '' ? parseInt(statusVal) : null;
        this.currentPage = 1;
        this.loadData();
    },

    async loadData() {
        try {
            const params = {
                page: this.currentPage,
                page_size: this.pageSize
            };
            if (this.status !== null) params.status = this.status;

            const result = await ApiService.get('/tucao/admin/report/list/get', params);

            const tbody = document.getElementById('reportTableBody');
            if (result.code === 0 && result.data.items.length > 0) {
                tbody.innerHTML = result.data.items.map(report => `
                    <tr>
                        <td>${report.id}</td>
                        <td>${report.report_type}</td>
                        <td>${report.target_type}</td>
                        <td>${report.target_id}</td>
                        <td class="text-truncate" style="max-width: 200px;">${report.description || '-'}</td>
                        <td><span class="badge ${this.getStatusBadge(report.status)}">${report.status_text}</span></td>
                        <td>${this.formatTime(report.created_at)}</td>
                        <td>
                            ${report.status === 0 ? `
                                <button class="btn btn-sm btn-success" onclick="ReportPage.resolve(${report.id})">通过</button>
                                <button class="btn btn-sm btn-secondary" onclick="ReportPage.reject(${report.id})">驳回</button>
                            ` : '-'}
                        </td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center">暂无数据</td></tr>';
            }

            this.renderPagination(result.data);
        } catch (error) {
            console.error('加载数据失败:', error);
            Toast.error('加载数据失败');
        }
    },

    async resolve(id) {
        if (!confirm('确定要处理此举报吗？相关内容将被删除。')) return;

        try {
            const result = await ApiService.post(`/tucao/admin/report/handle?report_id=${id}&status=1`);
            if (result.code === 0) {
                Toast.success('处理成功');
                this.loadData();
            } else {
                Toast.error(result.msg || '处理失败');
            }
        } catch (error) {
            Toast.error('处理失败');
        }
    },

    async reject(id) {
        if (!confirm('确定要驳回此举报吗？')) return;

        try {
            const result = await ApiService.post(`/tucao/admin/report/handle?report_id=${id}&status=2`);
            if (result.code === 0) {
                Toast.success('已驳回');
                this.loadData();
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (error) {
            Toast.error('操作失败');
        }
    },

    renderPagination(data) {
        const pagination = document.getElementById('pagination');
        const { total, page, total_pages } = data;

        if (total_pages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let html = `<span>共 ${total} 条，第 ${page}/${total_pages} 页</span>`;
        html += `<button class="btn btn-sm ${page <= 1 ? 'disabled' : ''}" onclick="ReportPage.goPage(${page - 1})" ${page <= 1 ? 'disabled' : ''}>上一页</button>`;

        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(total_pages, page + 2);

        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="btn btn-sm ${i === page ? 'active' : ''}" onclick="ReportPage.goPage(${i})">${i}</button>`;
        }

        html += `<button class="btn btn-sm ${page >= total_pages ? 'disabled' : ''}" onclick="ReportPage.goPage(${page + 1})" ${page >= total_pages ? 'disabled' : ''}>下一页</button>`;

        pagination.innerHTML = html;
    },

    goPage(page) {
        this.currentPage = page;
        this.loadData();
    },

    getStatusBadge(status) {
        const badges = {
            0: 'badge-warning',
            1: 'badge-success',
            2: 'badge-secondary'
        };
        return badges[status] || 'badge-secondary';
    },

    formatTime(time) {
        if (!time) return '-';
        const date = new Date(time);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
};
