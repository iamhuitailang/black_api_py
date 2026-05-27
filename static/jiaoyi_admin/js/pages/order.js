const OrderPage = {
    data: {
        list: [],
        total: 0,
        page: 1,
        pageSize: 10,
        keyword: '',
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
                    <h3 class="card-title">订单管理</h3>
                </div>
                <div class="card-body">
                    <div class="filter-row">
                        <div class="filter-item">
                            <label>关键词:</label>
                            <input type="text" class="form-control" id="searchInput" placeholder="订单编号/教材名称" style="width: 200px;">
                        </div>
                        <div class="filter-item">
                            <label>状态:</label>
                            <select class="form-control" id="statusFilter" style="width: 120px;">
                                <option value="">全部</option>
                                <option value="pending">待支付</option>
                                <option value="paid">已支付</option>
                                <option value="shipped">已发货</option>
                                <option value="completed">已完成</option>
                                <option value="cancelled">已取消</option>
                            </select>
                        </div>
                        <button class="btn btn-primary" id="searchBtn">搜索</button>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>订单编号</th>
                                    <th>教材名称</th>
                                    <th>买家</th>
                                    <th>卖家</th>
                                    <th>金额</th>
                                    <th>状态</th>
                                    <th>创建时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="orderTable">
                                <tr><td colspan="8" class="text-center text-secondary">加载中...</td></tr>
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

        Layout.render(content, 'order');
        this.bindEvents();
        this.loadData();
    },

    bindEvents() {
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.data.keyword = document.getElementById('searchInput').value;
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
            if (this.data.keyword) params.keyword = this.data.keyword;
            if (this.data.status) params.status = this.data.status;

            const result = await Api.get('/orders', params);

            if (result.code === 200) {
                this.data.list = result.data.list || [];
                this.data.total = result.data.total || 0;
                this.renderTable();
                this.renderPagination();
            }
        } catch (error) {
            console.error('加载订单数据失败:', error);
        }
    },

    renderTable() {
        const tbody = document.getElementById('orderTable');
        if (this.data.list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-secondary">暂无订单数据</td></tr>';
            return;
        }

        const statusMap = {
            pending: { text: '待支付', class: 'badge-warning' },
            paid: { text: '已支付', class: 'badge-info' },
            shipped: { text: '已发货', class: 'badge-primary' },
            completed: { text: '已完成', class: 'badge-success' },
            cancelled: { text: '已取消', class: 'badge-secondary' }
        };

        tbody.innerHTML = this.data.list.map(order => {
            const status = statusMap[order.status] || { text: order.status, class: 'badge-secondary' };
            return `
                <tr>
                    <td>${order.order_no || '-'}</td>
                    <td>${Layout.escapeHtml(order.book_title || '-')}</td>
                    <td>${Layout.escapeHtml(order.buyer_name || '-')}</td>
                    <td>${Layout.escapeHtml(order.seller_name || '-')}</td>
                    <td>¥${(order.price || 0).toFixed(2)}</td>
                    <td><span class="badge ${status.class}">${status.text}</span></td>
                    <td>${Layout.formatDate(order.created_at)}</td>
                    <td>
                        <div class="actions">
                            <button class="btn btn-outline btn-sm" onclick="OrderPage.viewDetail(${order.id})">详情</button>
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
        buttons += `<button class="pagination-btn" ${this.data.page === 1 ? 'disabled' : ''} onclick="OrderPage.goToPage(${this.data.page - 1})">上一页</button>`;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.data.page - 2 && i <= this.data.page + 2)) {
                buttons += `<button class="pagination-btn ${i === this.data.page ? 'active' : ''}" onclick="OrderPage.goToPage(${i})">${i}</button>`;
            } else if (i === this.data.page - 3 || i === this.data.page + 3) {
                buttons += '<span class="pagination-btn">...</span>';
            }
        }

        buttons += `<button class="pagination-btn" ${this.data.page === totalPages ? 'disabled' : ''} onclick="OrderPage.goToPage(${this.data.page + 1})">下一页</button>`;

        document.getElementById('paginationButtons').innerHTML = buttons;
    },

    goToPage(page) {
        this.data.page = page;
        this.loadData();
    },

    async viewDetail(id) {
        try {
            const result = await Api.get(`/orders/${id}`);
            if (result.code === 200) {
                const order = result.data;
                const statusMap = {
                    pending: '待支付',
                    paid: '已支付',
                    shipped: '已发货',
                    completed: '已完成',
                    cancelled: '已取消'
                };

                const modalHtml = `
                    <div class="modal-overlay" onclick="if(event.target === this) OrderPage.closeModal()">
                        <div class="modal" style="max-width: 600px;">
                            <div class="modal-header">
                                <h3 class="modal-title">订单详情</h3>
                                <span class="modal-close" onclick="OrderPage.closeModal()">&times;</span>
                            </div>
                            <div class="modal-body">
                                <div class="form-group">
                                    <label class="form-label">订单编号</label>
                                    <p>${order.order_no || '-'}</p>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">教材名称</label>
                                    <p>${Layout.escapeHtml(order.book_title || '-')}</p>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label class="form-label">买家</label>
                                        <p>${Layout.escapeHtml(order.buyer_name || '-')}</p>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">卖家</label>
                                        <p>${Layout.escapeHtml(order.seller_name || '-')}</p>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label class="form-label">金额</label>
                                        <p>¥${(order.price || 0).toFixed(2)}</p>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">状态</label>
                                        <p>${statusMap[order.status] || order.status}</p>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">收货地址</label>
                                    <p>${Layout.escapeHtml(order.address || '-')}</p>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">创建时间</label>
                                    <p>${Layout.formatDate(order.created_at)}</p>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button class="btn btn-outline" onclick="OrderPage.closeModal()">关闭</button>
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

    closeModal() {
        document.getElementById('modalContainer').innerHTML = '';
    }
};
