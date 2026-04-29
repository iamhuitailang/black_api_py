const CategoryPage = {
    currentPage: 1,
    pageSize: 20,

    async render() {
        Layout.render(`
            <div class="page-header">
                <h1 class="page-title">分类管理</h1>
                <p class="page-subtitle">管理求助/帮助的分类类型</p>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="toolbar">
                        <div class="toolbar-left">
                            <span>预设分类：工具借用、跑腿帮忙、维修、照顾、学习、生活</span>
                        </div>
                        <div class="toolbar-right">
                            <button class="btn btn-primary" id="addCategoryBtn">添加分类</button>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>分类代码</th>
                                    <th>分类名称</th>
                                    <th>描述</th>
                                    <th>排序</th>
                                    <th>状态</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="categoryTableBody">
                                <tr><td colspan="7" class="text-center">加载中...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="modal-overlay" id="categoryModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title" id="categoryModalTitle">添加分类</h3>
                        <button class="modal-close" onclick="CategoryPage.closeModal()">&times;</button>
                    </div>
                    <form id="categoryForm">
                        <div class="modal-body">
                            <input type="hidden" id="editCategoryId">
                            <div class="form-group">
                                <label class="form-label">分类代码 <span class="required">*</span></label>
                                <input type="text" class="form-control" id="categoryCode" placeholder="例如: tools, errand" required>
                                <div class="form-error" id="codeError"></div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">分类名称 <span class="required">*</span></label>
                                <input type="text" class="form-control" id="categoryName" placeholder="例如: 工具借用" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">分类描述</label>
                                <input type="text" class="form-control" id="categoryDesc" placeholder="例如: 维修工具、户外装备">
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">排序</label>
                                    <input type="number" class="form-control" id="categorySort" value="0" min="0">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">状态</label>
                                    <select class="form-control" id="categoryStatus">
                                        <option value="1">启用</option>
                                        <option value="0">禁用</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="CategoryPage.closeModal()">取消</button>
                            <button type="submit" class="btn btn-primary" id="saveCategoryBtn">保存</button>
                        </div>
                    </form>
                </div>
            </div>
        `, 'category');

        this.bindEvents();
        await this.loadCategories();
    },

    bindEvents() {
        document.getElementById('addCategoryBtn').addEventListener('click', () => {
            this.showAddModal();
        });

        document.getElementById('categoryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCategory();
        });
    },

    async loadCategories() {
        try {
            const result = await ApiService.get('/xq/category/list/get', { only_active: 0 });

            const tbody = document.getElementById('categoryTableBody');
            if (result.code === 0 && result.data.length > 0) {
                tbody.innerHTML = result.data.map(cat => `
                    <tr>
                        <td>${cat.id}</td>
                        <td><code>${cat.code}</code></td>
                        <td>${cat.name}</td>
                        <td>${cat.description || '-'}</td>
                        <td>${cat.sort_order || 0}</td>
                        <td><span class="badge ${cat.is_active === 1 ? 'badge-success' : 'badge-secondary'}">${cat.is_active === 1 ? '启用' : '禁用'}</span></td>
                        <td>
                            <div class="table-actions">
                                <button class="btn btn-sm btn-secondary" onclick="CategoryPage.editCategory(${cat.id})">编辑</button>
                                <button class="btn btn-sm btn-danger" onclick="CategoryPage.deleteCategory(${cat.id})">删除</button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center">暂无数据</td></tr>';
            }
        } catch (error) {
            console.error('加载分类列表失败:', error);
            Toast.error('加载分类列表失败');
        }
    },

    showAddModal() {
        document.getElementById('categoryModalTitle').textContent = '添加分类';
        document.getElementById('editCategoryId').value = '';
        document.getElementById('categoryForm').reset();
        document.getElementById('categoryCode').disabled = false;
        document.getElementById('categoryModal').classList.add('show');
    },

    async editCategory(categoryId) {
        try {
            const result = await ApiService.get('/xq/category/detail/get', { category_id: categoryId });

            if (result.code === 0) {
                const cat = result.data;
                document.getElementById('categoryModalTitle').textContent = '编辑分类';
                document.getElementById('editCategoryId').value = cat.id;
                document.getElementById('categoryCode').value = cat.code;
                document.getElementById('categoryCode').disabled = true;
                document.getElementById('categoryName').value = cat.name;
                document.getElementById('categoryDesc').value = cat.description || '';
                document.getElementById('categorySort').value = cat.sort_order || 0;
                document.getElementById('categoryStatus').value = cat.is_active;
                document.getElementById('categoryModal').classList.add('show');
            } else {
                Toast.error(result.msg || '获取分类信息失败');
            }
        } catch (error) {
            console.error('获取分类信息失败:', error);
            Toast.error('获取分类信息失败');
        }
    },

    closeModal() {
        document.getElementById('categoryModal').classList.remove('show');
    },

    async saveCategory() {
        const editId = document.getElementById('editCategoryId').value;
        const code = document.getElementById('categoryCode').value.trim();
        const name = document.getElementById('categoryName').value.trim();
        const description = document.getElementById('categoryDesc').value.trim();
        const sort_order = parseInt(document.getElementById('categorySort').value) || 0;
        const is_active = parseInt(document.getElementById('categoryStatus').value);

        if (!code || code.length < 2) {
            document.getElementById('codeError').textContent = '分类代码至少2个字符';
            return;
        }

        if (!name || name.length < 2) {
            Toast.error('分类名称至少2个字符');
            return;
        }

        const saveBtn = document.getElementById('saveCategoryBtn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="loading"></span> 保存中...';

        try {
            let result;
            if (editId) {
                const data = {
                    name: name,
                    description: description,
                    sort_order: sort_order,
                    is_active: is_active
                };
                const formData = new FormData();
                Object.keys(data).forEach(key => formData.append(key, data[key]));

                result = await ApiService.post(`/xq/category/update?category_id=${editId}`, data);
            } else {
                const data = {
                    code: code,
                    name: name,
                    description: description,
                    sort_order: sort_order
                };
                result = await ApiService.post('/xq/category/create', data);
            }

            if (result.code === 0) {
                Toast.success(editId ? '更新成功' : '创建成功');
                this.closeModal();
                this.loadCategories();
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (error) {
            console.error('保存分类失败:', error);
            Toast.error('操作失败');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '保存';
        }
    },

    async deleteCategory(categoryId) {
        if (!confirm('确定要删除该分类吗？')) return;

        try {
            const result = await ApiService.post(`/xq/category/delete?category_id=${categoryId}`);

            if (result.code === 0) {
                Toast.success('删除成功');
                this.loadCategories();
            } else {
                Toast.error(result.msg || '删除失败');
            }
        } catch (error) {
            console.error('删除分类失败:', error);
            Toast.error('删除失败');
        }
    }
};
