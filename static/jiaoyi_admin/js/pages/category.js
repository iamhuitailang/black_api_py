const CategoryPage = {
    data: {
        list: [],
        total: 0,
        page: 1,
        pageSize: 20
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
                    <h3 class="card-title">分类管理</h3>
                    <button class="btn btn-primary" id="addBtn">+ 新增分类</button>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>分类名称</th>
                                    <th>排序</th>
                                    <th>状态</th>
                                    <th>创建时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="categoryTable">
                                <tr><td colspan="6" class="text-center text-secondary">加载中...</td></tr>
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

        Layout.render(content, 'category');
        this.bindEvents();
        this.loadData();
    },

    bindEvents() {
        document.getElementById('addBtn').addEventListener('click', () => {
            this.showModal();
        });
    },

    async loadData() {
        try {
            const result = await Api.get('/categories', {
                page: this.data.page,
                page_size: this.data.pageSize
            });

            if (result.code === 200) {
                this.data.list = result.data.list || result.data || [];
                this.data.total = result.data.total || this.data.list.length;
                this.renderTable();
                this.renderPagination();
            }
        } catch (error) {
            console.error('加载分类数据失败:', error);
        }
    },

    renderTable() {
        const tbody = document.getElementById('categoryTable');
        if (this.data.list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-secondary">暂无分类数据</td></tr>';
            return;
        }

        tbody.innerHTML = this.data.list.map(category => `
            <tr>
                <td>${category.id}</td>
                <td>${Layout.escapeHtml(category.name || '-')}</td>
                <td>${category.sort_order || 0}</td>
                <td>
                    <span class="badge ${category.status === 1 ? 'badge-success' : 'badge-secondary'}">
                        ${category.status === 1 ? '启用' : '禁用'}
                    </span>
                </td>
                <td>${Layout.formatDate(category.created_at)}</td>
                <td>
                    <div class="actions">
                        <button class="btn btn-outline btn-sm" onclick="CategoryPage.editCategory(${category.id})">编辑</button>
                        <button class="btn btn-danger btn-sm" onclick="CategoryPage.deleteCategory(${category.id})">删除</button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    renderPagination() {
        const totalPages = Math.ceil(this.data.total / this.data.pageSize);
        const start = (this.data.page - 1) * this.data.pageSize + 1;
        const end = Math.min(this.data.page * this.data.pageSize, this.data.total);

        document.getElementById('paginationInfo').textContent =
            `共 ${this.data.total} 条，显示 ${start}-${end} 条`;

        let buttons = '';
        buttons += `<button class="pagination-btn" ${this.data.page === 1 ? 'disabled' : ''} onclick="CategoryPage.goToPage(${this.data.page - 1})">上一页</button>`;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.data.page - 2 && i <= this.data.page + 2)) {
                buttons += `<button class="pagination-btn ${i === this.data.page ? 'active' : ''}" onclick="CategoryPage.goToPage(${i})">${i}</button>`;
            } else if (i === this.data.page - 3 || i === this.data.page + 3) {
                buttons += '<span class="pagination-btn">...</span>';
            }
        }

        buttons += `<button class="pagination-btn" ${this.data.page === totalPages ? 'disabled' : ''} onclick="CategoryPage.goToPage(${this.data.page + 1})">下一页</button>`;

        document.getElementById('paginationButtons').innerHTML = buttons;
    },

    goToPage(page) {
        this.data.page = page;
        this.loadData();
    },

    showModal(category = null) {
        const isEdit = category !== null;
        const modalHtml = `
            <div class="modal-overlay" onclick="if(event.target === this) CategoryPage.closeModal()">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">${isEdit ? '编辑分类' : '新增分类'}</h3>
                        <span class="modal-close" onclick="CategoryPage.closeModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <form id="categoryForm">
                            <div class="form-group">
                                <label class="form-label">分类名称</label>
                                <input type="text" class="form-control" id="categoryName" value="${isEdit ? Layout.escapeHtml(category.name) : ''}" placeholder="请输入分类名称">
                            </div>
                            <div class="form-group">
                                <label class="form-label">排序</label>
                                <input type="number" class="form-control" id="categorySort" value="${isEdit ? (category.sort_order || 0) : 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">状态</label>
                                <select class="form-control" id="categoryStatus">
                                    <option value="1" ${isEdit && category.status === 1 ? 'selected' : ''}>启用</option>
                                    <option value="0" ${isEdit && category.status === 0 ? 'selected' : ''}>禁用</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" onclick="CategoryPage.closeModal()">取消</button>
                        <button class="btn btn-primary" onclick="CategoryPage.saveCategory(${isEdit ? category.id : 'null'})">保存</button>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('modalContainer').innerHTML = modalHtml;
    },

    editCategory(id) {
        const category = this.data.list.find(c => c.id === id);
        if (category) {
            this.showModal(category);
        }
    },

    async saveCategory(id) {
        try {
            const data = {
                name: document.getElementById('categoryName').value,
                sort_order: parseInt(document.getElementById('categorySort').value) || 0,
                status: parseInt(document.getElementById('categoryStatus').value)
            };

            let result;
            if (id) {
                result = await Api.put(`/categories/${id}`, data);
            } else {
                result = await Api.post('/categories', data);
            }

            if (result.code === 200) {
                Toast.success('保存成功');
                this.closeModal();
                this.loadData();
            }
        } catch (error) {
            console.error('保存失败:', error);
        }
    },

    async deleteCategory(id) {
        if (!confirm('确定要删除此分类吗？')) return;

        try {
            const result = await Api.delete(`/categories/${id}`);
            if (result.code === 200) {
                Toast.success('删除成功');
                this.loadData();
            }
        } catch (error) {
            console.error('删除失败:', error);
        }
    },

    closeModal() {
        document.getElementById('modalContainer').innerHTML = '';
    }
};
