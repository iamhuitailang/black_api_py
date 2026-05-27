const BookPage = {
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
                    <h3 class="card-title">教材审核</h3>
                </div>
                <div class="card-body">
                    <div class="filter-row">
                        <div class="filter-item">
                            <label>关键词:</label>
                            <input type="text" class="form-control" id="searchInput" placeholder="教材名称/作者" style="width: 200px;">
                        </div>
                        <div class="filter-item">
                            <label>状态:</label>
                            <select class="form-control" id="statusFilter" style="width: 120px;">
                                <option value="">全部</option>
                                <option value="pending">待审核</option>
                                <option value="approved">已通过</option>
                                <option value="rejected">已拒绝</option>
                                <option value="shelved">已下架</option>
                            </select>
                        </div>
                        <button class="btn btn-primary" id="searchBtn">搜索</button>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>教材名称</th>
                                    <th>分类</th>
                                    <th>卖家</th>
                                    <th>价格</th>
                                    <th>状态</th>
                                    <th>发布时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="bookTable">
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

        Layout.render(content, 'book');
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

            const result = await Api.get('/books', params);

            if (result.code === 200) {
                this.data.list = result.data.list || [];
                this.data.total = result.data.total || 0;
                this.renderTable();
                this.renderPagination();
            }
        } catch (error) {
            console.error('加载教材数据失败:', error);
        }
    },

    renderTable() {
        const tbody = document.getElementById('bookTable');
        if (this.data.list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-secondary">暂无教材数据</td></tr>';
            return;
        }

        const statusMap = {
            pending: { text: '待审核', class: 'badge-warning' },
            approved: { text: '已通过', class: 'badge-success' },
            rejected: { text: '已拒绝', class: 'badge-danger' },
            shelved: { text: '已下架', class: 'badge-secondary' }
        };

        tbody.innerHTML = this.data.list.map(book => {
            const status = statusMap[book.status] || { text: book.status, class: 'badge-secondary' };
            return `
                <tr>
                    <td>${book.id}</td>
                    <td>${Layout.escapeHtml(book.title || '-')}</td>
                    <td>${Layout.escapeHtml(book.category_name || '-')}</td>
                    <td>${Layout.escapeHtml(book.seller_name || '-')}</td>
                    <td>¥${(book.price || 0).toFixed(2)}</td>
                    <td><span class="badge ${status.class}">${status.text}</span></td>
                    <td>${Layout.formatDate(book.created_at)}</td>
                    <td>
                        <div class="actions">
                            <button class="btn btn-outline btn-sm" onclick="BookPage.viewDetail(${book.id})">详情</button>
                            ${book.status === 'pending' ? `
                                <button class="btn btn-success btn-sm" onclick="BookPage.approve(${book.id})">通过</button>
                                <button class="btn btn-danger btn-sm" onclick="BookPage.reject(${book.id})">拒绝</button>
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
        buttons += `<button class="pagination-btn" ${this.data.page === 1 ? 'disabled' : ''} onclick="BookPage.goToPage(${this.data.page - 1})">上一页</button>`;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.data.page - 2 && i <= this.data.page + 2)) {
                buttons += `<button class="pagination-btn ${i === this.data.page ? 'active' : ''}" onclick="BookPage.goToPage(${i})">${i}</button>`;
            } else if (i === this.data.page - 3 || i === this.data.page + 3) {
                buttons += '<span class="pagination-btn">...</span>';
            }
        }

        buttons += `<button class="pagination-btn" ${this.data.page === totalPages ? 'disabled' : ''} onclick="BookPage.goToPage(${this.data.page + 1})">下一页</button>`;

        document.getElementById('paginationButtons').innerHTML = buttons;
    },

    goToPage(page) {
        this.data.page = page;
        this.loadData();
    },

    async viewDetail(id) {
        try {
            const result = await Api.get(`/books/${id}`);
            if (result.code === 200) {
                const book = result.data;
                const modalHtml = `
                    <div class="modal-overlay" onclick="if(event.target === this) BookPage.closeModal()">
                        <div class="modal" style="max-width: 600px;">
                            <div class="modal-header">
                                <h3 class="modal-title">教材详情</h3>
                                <span class="modal-close" onclick="BookPage.closeModal()">&times;</span>
                            </div>
                            <div class="modal-body">
                                <div class="form-group">
                                    <label class="form-label">教材名称</label>
                                    <p>${Layout.escapeHtml(book.title || '-')}</p>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label class="form-label">分类</label>
                                        <p>${Layout.escapeHtml(book.category_name || '-')}</p>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">价格</label>
                                        <p>¥${(book.price || 0).toFixed(2)}</p>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label class="form-label">作者</label>
                                        <p>${Layout.escapeHtml(book.author || '-')}</p>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">出版社</label>
                                        <p>${Layout.escapeHtml(book.publisher || '-')}</p>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">成色</label>
                                    <p>${Layout.escapeHtml(book.condition || '-')}</p>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">描述</label>
                                    <p>${Layout.escapeHtml(book.description || '-')}</p>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">卖家</label>
                                    <p>${Layout.escapeHtml(book.seller_name || '-')}</p>
                                </div>
                            </div>
                            <div class="modal-footer">
                                ${book.status === 'pending' ? `
                                    <button class="btn btn-danger" onclick="BookPage.reject(${book.id})">拒绝</button>
                                    <button class="btn btn-success" onclick="BookPage.approve(${book.id})">通过</button>
                                ` : ''}
                                <button class="btn btn-outline" onclick="BookPage.closeModal()">关闭</button>
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

    async approve(id) {
        try {
            const result = await Api.put(`/books/${id}/approve`);
            if (result.code === 200) {
                Toast.success('审核通过');
                this.closeModal();
                this.loadData();
            }
        } catch (error) {
            console.error('审核失败:', error);
        }
    },

    async reject(id) {
        try {
            const reason = prompt('请输入拒绝理由:');
            if (reason === null) return;

            const result = await Api.put(`/books/${id}/reject`, { reason: reason || '' });
            if (result.code === 200) {
                Toast.success('已拒绝');
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
