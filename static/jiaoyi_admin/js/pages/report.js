const ReportPage = {
    data: {
        list: [],
        total: 0,
        page: 1,
        pageSize: 10,
        status: ''
    },

    render() {
        const token = Storage.getToken();
        if (!token) {
            Router.navigate('login');
            return;
        }

        const content = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">举报处理</h3>
                </div>
                <div class="card-body">
                    <div class="filter-row">
                        <div class="filter-item">
                            <label>状态:</label>
                            <select class="form-control" id="statusFilter" style="width: 120px;">
                                <option value="">全部</option>
                                <option value="pending">待处理</option>
                                <option value="processing">处理中</option>
                                <option value="resolved">已解决</option>
                                <option value="dismissed">已驳回</option>
                            </select>
                        </div>
                        <button class="btn btn-primary" id="filterBtn">筛选</button>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>举报类型</th>
                                    <th>举报人</th>
                                    <th>被举报人</th>
                                    <th>状态</th>
                                    <th>举报时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="reportTable">
                                <tr><td colspan="7" class="text-center text-secondary">加载中...</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="pagination">
                        <div class="pagination-info" id="paginationInfo"></div>
                        <div class="pagination-buttons" id="paginationButtons"></div>
                    </div>
                </div>
            </div>

            <div id="modalContainer"></div>
        `;

        Layout.render(content, 'report');
        this.bindEvents();
        this.loadData();
    },

    bindEvents() {
        document.getElementById('filterBtn').addEventListener('click', () => {
            this.data.status = document.getElementById('statusFilter').value;
            this.data.page = 1;
            this.loadData();
        });
    },

    async loadData() {
        try {
            const params = {
                page: this.data.page,
                page_size: this.data.pageSize
            };
            if (this.data.status) params.status = this.data.status;

            const result = await Api.get('/reports', params);

            if (result.code === 200) {
                this.data.list = result.data.list || result.data || [];
                this.data.total = result.data.total || this.data.list.length;
                this.renderTable();
                this.renderPagination();
            }
        } catch (error) {
            console.error('加载举报数据失败:', error);
        }
    },

    renderTable() {
        const tbody = document.getElementById('reportTable');
        if (this.data.list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-secondary">暂无举报数据</td></tr>';
            return;
        }

        const typeMap = {
            book: '教材',
            user: '用户',
            order: '订单',
            other: '其他'
        };

        const statusMap = {
            pending: { text: '待处理', class: 'badge-warning' },
            processing: { text: '处理中', class: 'badge-info' },
            resolved: { text: '已解决', class: 'badge-success' },
            dismissed: { text: '已驳回', class: 'badge-secondary' }
        };

        tbody.innerHTML = this.data.list.map(report => {
            const status = statusMap[report.status] || { text: report.status, class: 'badge-secondary' };
            return `
                <tr>
                    <td>${report.id}</td>
                    <td>${typeMap[report.type] || report.type}</td>
                    <td>${Layout.escapeHtml(report.reporter_name || '-')}</td>
                    <td>${Layout.escapeHtml(report.reported_name || '-')}</td>
                    <td><span class="badge ${status.class}">${status.text}</span></td>
                    <td>${Layout.formatDate(report.created_at)}</td>
                    <td>
                        <div class="actions">
                            <button class="btn btn-outline btn-sm" onclick="ReportPage.viewDetail(${report.id})">详情</button>
                            ${report.status === 'pending' || report.status === 'processing' ? `
                                <button class="btn btn-success btn-sm" onclick="ReportPage.resolve(${report.id})">解决</button>
                                <button class="btn btn-warning btn-sm" onclick="ReportPage.dismiss(${report.id})">驳回</button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    renderPagination() {
        const totalPages = Math.ceil(this.data.total / this.data.pageSize);
        const start = (this.data.page - 1) * this.data.pageSize + 1;
        const end = Math.min(this.data.page * this.data.pageSize, this.data.total);

        document.getElementById('paginationInfo').textContent =
            `共 ${this.data.total} 条，显示 ${start}-${end} 条`;

        let buttons = '';
        buttons += `<button class="pagination-btn" ${this.data.page === 1 ? 'disabled' : ''} onclick="ReportPage.goToPage(${this.data.page - 1})">上一页</button>`;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.data.page - 2 && i <= this.data.page + 2)) {
                buttons += `<button class="pagination-btn ${i === this.data.page ? 'active' : ''}" onclick="ReportPage.goToPage(${i})">${i}</button>`;
            } else if (i === this.data.page - 3 || i === this.data.page + 3) {
                buttons += '<span class="pagination-btn">...</span>';
            }
        }

        buttons += `<button class="pagination-btn" ${this.data.page === totalPages ? 'disabled' : ''} onclick="ReportPage.goToPage(${this.data.page + 1})">下一页</button>`;

        document.getElementById('paginationButtons').innerHTML = buttons;
    },

    goToPage(page) {
        this.data.page = page;
        this.loadData();
    },

    async viewDetail(id) {
        try {
            const result = await Api.get(`/reports/${id}`);
            if (result.code === 200) {
                const report = result.data;
                const typeMap = {
                    book: '教材',
                    user: '用户',
                    order: '订单',
                    other: '其他'
                };

                const modalHtml = `
                    <div class="modal-overlay" onclick="if(event.target === this) ReportPage.closeModal()">
                        <div class="modal" style="max-width: 600px;">
                            <div class="modal-header">
                                <h3 class="modal-title">举报详情</h3>
                                <span class="modal-close" onclick="ReportPage.closeModal()">&times;</span>
                            </div>
                            <div class="modal-body">
                                <div class="form-group">
                                    <label class="form-label">举报类型</label>
                                    <p>${typeMap[report.type] || report.type}</p>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label class="form-label">举报人</label>
                                        <p>${Layout.escapeHtml(report.reporter_name || '-')}</p>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">被举报人</label>
                                        <p>${Layout.escapeHtml(report.reported_name || '-')}</p>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">举报原因</label>
                                    <p>${Layout.escapeHtml(report.reason || '-')}</p>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">详细描述</label>
                                    <p>${Layout.escapeHtml(report.description || '-')}</p>
                                </div>
                                ${report.admin_reply ? `
                                    <div class="form-group">
                                        <label class="form-label">处理回复</label>
                                        <p>${Layout.escapeHtml(report.admin_reply || '-')}</p>
                                    </div>
                                ` : ''}
                            </div>
                            <div class="modal-footer">
                                ${report.status === 'pending' || report.status === 'processing' ? `
                                    <button class="btn btn-warning" onclick="ReportPage.dismiss(${report.id})">驳回</button>
                                    <button class="btn btn-success" onclick="ReportPage.resolve(${report.id})">解决</button>
                                ` : ''}
                                <button class="btn btn-outline" onclick="ReportPage.closeModal()">关闭</button>
                            </div>
                        </div>
                    </div>
                `;
                document.getElementById('modalContainer').innerHTML = modalHtml;
            }
        } catch (error) {
            console.error('获取详情失败:', error);
        }
    },

    async resolve(id) {
        try {
            const reply = prompt('请输入处理回复:');
            if (reply === null) return;

            const result = await Api.put(`/reports/${id}/resolve`, {
                admin_reply: reply || ''
            });

            if (result.code === 200) {
                Toast.success('已标记为已解决');
                this.closeModal();
                this.loadData();
            }
        } catch (error) {
            console.error('操作失败:', error);
        }
    },

    async dismiss(id) {
        try {
            const reply = prompt('请输入驳回理由:');
            if (reply === null) return;

            const result = await Api.put(`/reports/${id}/dismiss`, {
                admin_reply: reply || ''
            });

            if (result.code === 200) {
                Toast.success('已驳回');
                this.closeModal();
                this.loadData();
            }
        } catch (error) {
            console.error('操作失败:', error);
        }
    },

    closeModal() {
        document.getElementById('modalContainer').innerHTML = '';
    }
};
