const CategoriesPage = {
    currentPage: 1,
    pageSize: 20,
    categories: [],

    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="admin-layout">
                ${this.renderSidebar()}
                <div class="main-wrapper">
                    ${this.renderHeader('分类管理')}
                    <div class="main-content">
                        <div class="page-header">
                            <h1 class="page-title">分类管理</h1>
                            <p class="page-subtitle">管理废品种类和参考价格</p>
                        </div>
                        
                        <div class="card">
                            <div class="card-header">
                                <h2 class="card-title">分类列表</h2>
                                <button class="btn btn-primary" id="addCategoryBtn">
                                    <span>+</span>
                                    <span>添加分类</span>
                                </button>
                            </div>
                            <div class="card-body">
                                <div class="table-container">
                                    <table class="table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>图标</th>
                                                <th>分类名称</th>
                                                <th>参考价格</th>
                                                <th>排序</th>
                                                <th>状态</th>
                                                <th>操作</th>
                                            </tr>
                                        </thead>
                                        <tbody id="categoriesTableBody">
                                            <tr>
                                                <td colspan="7" class="text-center">加载中...</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="modal-overlay" id="categoryModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title" id="categoryModalTitle">添加分类</h3>
                        <button class="modal-close" id="closeCategoryModal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="categoryForm">
                            <input type="hidden" id="categoryId">
                            <div class="form-group">
                                <label class="form-label">分类名称 <span class="required">*</span></label>
                                <input type="text" class="form-control" id="categoryName" placeholder="请输入分类名称" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">图标</label>
                                <input type="text" class="form-control" id="categoryIcon" placeholder="请输入图标（如：📦）">
                            </div>
                            <div class="form-group">
                                <label class="form-label">参考价格（元/公斤） <span class="required">*</span></label>
                                <input type="number" step="0.01" class="form-control" id="categoryPrice" placeholder="请输入参考价格" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">描述</label>
                                <textarea class="form-control" id="categoryDescription" placeholder="请输入分类描述" rows="2"></textarea>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">排序</label>
                                    <input type="number" class="form-control" id="categorySortOrder" placeholder="数字越小越靠前">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">状态</label>
                                    <select class="form-control" id="categoryStatus">
                                        <option value="1">启用</option>
                                        <option value="0">禁用</option>
                                    </select>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="cancelCategory">取消</button>
                        <button class="btn btn-primary" id="saveCategory">保存</button>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
        this.loadCategories();
    },

    renderSidebar() {
        const user = AuthService.getCurrentUser();
        const userInitial = user && user.real_name ? user.real_name.charAt(0) : (user && user.username ? user.username.charAt(0) : 'A');
        
        return `
            <div class="sidebar">
                <div class="sidebar-header">
                    <div class="sidebar-logo">
                        <div class="sidebar-logo-icon">♻️</div>
                        <div class="sidebar-logo-text">
                            <span class="sidebar-title">回收宝</span>
                            <span class="sidebar-subtitle">废品回收平台</span>
                        </div>
                    </div>
                </div>
                <div class="sidebar-nav">
                    <div class="sidebar-nav-title">工作台</div>
                    <div class="nav-item" data-page="dashboard">
                        <span class="nav-icon">📊</span>
                        <span class="nav-text">数据看板</span>
                    </div>
                    <div class="sidebar-nav-title">订单管理</div>
                    <div class="nav-item" data-page="orders">
                        <span class="nav-icon">📋</span>
                        <span class="nav-text">订单列表</span>
                    </div>
                    <div class="sidebar-nav-title">用户管理</div>
                    <div class="nav-item" data-page="users">
                        <span class="nav-icon">👥</span>
                        <span class="nav-text">用户管理</span>
                    </div>
                    <div class="nav-item" data-page="collectors">
                        <span class="nav-icon">🚚</span>
                        <span class="nav-text">回收员审核</span>
                    </div>
                    <div class="sidebar-nav-title">系统管理</div>
                    <div class="nav-item active" data-page="categories">
                        <span class="nav-icon">🏷️</span>
                        <span class="nav-text">分类管理</span>
                    </div>
                </div>
                <div class="sidebar-footer">
                    <div class="sidebar-user">
                        <div class="sidebar-user-avatar">${userInitial}</div>
                        <div class="sidebar-user-info">
                            <div class="sidebar-user-name">${user && user.real_name ? user.real_name : (user && user.username ? user.username : '管理员')}</div>
                            <div class="sidebar-user-role">系统管理员</div>
                        </div>
                    </div>
                    <div class="sidebar-logout" id="logoutBtn">
                        <span>🚪</span>
                        <span>退出登录</span>
                    </div>
                </div>
            </div>
        `;
    },

    renderHeader(title) {
        return `
            <div class="header">
                <div class="header-left">
                    <h1 class="header-title">${title}</h1>
                </div>
                <div class="header-right">
                    <div class="user-info" id="userDropdown">
                        <div class="user-avatar">A</div>
                        <div>
                            <div class="user-name">管理员</div>
                            <div class="user-role">系统管理</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    bindEvents() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                if (page) {
                    Router.navigate(page);
                }
            });
        });

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await AuthService.logout();
                Toast.success('已退出登录');
                Router.navigate('login');
            });
        }

        const addCategoryBtn = document.getElementById('addCategoryBtn');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', () => this.showAddModal());
        }

        const closeCategoryModal = document.getElementById('closeCategoryModal');
        const cancelCategory = document.getElementById('cancelCategory');
        if (closeCategoryModal) {
            closeCategoryModal.addEventListener('click', () => this.hideModal());
        }
        if (cancelCategory) {
            cancelCategory.addEventListener('click', () => this.hideModal());
        }

        const saveCategory = document.getElementById('saveCategory');
        if (saveCategory) {
            saveCategory.addEventListener('click', () => this.saveCategory());
        }
    },

    async loadCategories() {
        const tbody = document.getElementById('categoriesTableBody');
        if (!tbody) return;

        try {
            const result = await ApiService.get('/feipin/category/list/get');
            
            if (result.code === 0 && result.data) {
                this.categories = result.data;
                this.renderTable(result.data);
            } else {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center">${result.msg || '加载失败'}</td></tr>`;
            }
        } catch (error) {
            console.error('加载分类列表失败:', error);
            tbody.innerHTML = `<tr><td colspan="7" class="text-center">加载失败，请重试</td></tr>`;
        }
    },

    renderTable(categories) {
        const tbody = document.getElementById('categoriesTableBody');
        if (!tbody) return;

        if (!categories || categories.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="empty-state">
                            <div class="empty-state-icon">🏷️</div>
                            <div class="empty-state-title">暂无分类数据</div>
                            <div class="empty-state-text">点击添加分类按钮创建新分类</div>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = categories.map(cat => `
            <tr>
                <td>${cat.id}</td>
                <td><span class="text-2xl">${cat.icon || '-'}</span></td>
                <td>
                    <div class="font-semibold">${cat.name}</div>
                    ${cat.description ? `<div class="text-sm text-gray-500">${cat.description}</div>` : ''}
                </td>
                <td>¥${cat.price.toFixed(2)}/公斤</td>
                <td>${cat.sort_order || 0}</td>
                <td>
                    <span class="badge ${cat.is_active === 1 ? 'badge-success' : 'badge-secondary'}">
                        ${cat.is_active === 1 ? '启用' : '禁用'}
                    </span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-secondary" onclick="CategoriesPage.editCategory(${cat.id})">编辑</button>
                        <button class="btn btn-sm btn-danger" onclick="CategoriesPage.deleteCategory(${cat.id})">删除</button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    showAddModal() {
        document.getElementById('categoryModalTitle').textContent = '添加分类';
        document.getElementById('categoryId').value = '';
        document.getElementById('categoryName').value = '';
        document.getElementById('categoryIcon').value = '';
        document.getElementById('categoryPrice').value = '';
        document.getElementById('categoryDescription').value = '';
        document.getElementById('categorySortOrder').value = '';
        document.getElementById('categoryStatus').value = '1';
        
        document.getElementById('categoryModal').classList.add('show');
    },

    async editCategory(id) {
        const category = this.categories.find(c => c.id === id);
        if (!category) return;

        document.getElementById('categoryModalTitle').textContent = '编辑分类';
        document.getElementById('categoryId').value = category.id;
        document.getElementById('categoryName').value = category.name || '';
        document.getElementById('categoryIcon').value = category.icon || '';
        document.getElementById('categoryPrice').value = category.price || 0;
        document.getElementById('categoryDescription').value = category.description || '';
        document.getElementById('categorySortOrder').value = category.sort_order || 0;
        document.getElementById('categoryStatus').value = category.is_active ? '1' : '0';
        
        document.getElementById('categoryModal').classList.add('show');
    },

    hideModal() {
        document.getElementById('categoryModal').classList.remove('show');
    },

    async saveCategory() {
        const id = document.getElementById('categoryId').value;
        const name = document.getElementById('categoryName').value.trim();
        const icon = document.getElementById('categoryIcon').value.trim();
        const price = parseFloat(document.getElementById('categoryPrice').value) || 0;
        const description = document.getElementById('categoryDescription').value.trim();
        const sort_order = parseInt(document.getElementById('categorySortOrder').value) || 0;
        const is_active = parseInt(document.getElementById('categoryStatus').value) || 1;

        if (!name) {
            Toast.error('请输入分类名称');
            return;
        }

        try {
            let result;
            const data = {
                name: name,
                icon: icon,
                price: price,
                description: description,
                sort_order: sort_order,
                is_active: is_active
            };

            if (id) {
                result = await ApiService.post('/feipin/category/update', data, { category_id: id });
            } else {
                result = await ApiService.post('/feipin/category/create', data);
            }

            if (result.code === 0) {
                Toast.success(id ? '更新成功' : '添加成功');
                this.hideModal();
                this.loadCategories();
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (error) {
            Toast.error('操作失败，请重试');
        }
    },

    async deleteCategory(id) {
        if (!confirm('确定要删除这个分类吗？删除后无法恢复。')) {
            return;
        }

        try {
            const result = await ApiService.post('/feipin/category/delete', {}, { category_id: id });
            if (result.code === 0) {
                Toast.success('删除成功');
                this.loadCategories();
            } else {
                Toast.error(result.msg || '删除失败');
            }
        } catch (error) {
            Toast.error('删除失败，请重试');
        }
    }
};

window.CategoriesPage = CategoriesPage;
