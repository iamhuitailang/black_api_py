const CategoryPage = {
    categories: [],
    editingCategory: null,

    render() {
        const app = document.getElementById('app');
        const user = AuthService.getCurrentUser();
        
        app.innerHTML = this.layout(user);
        
        this.bindEvents();
        this.loadCategories();
    },

    layout(user) {
        return `
            <div class="admin-layout">
                <div class="sidebar">
                    <div class="sidebar-header">
                        <div class="sidebar-logo">
                            <div class="sidebar-logo-icon">🔄</div>
                            <div class="sidebar-logo-text">
                                <span class="sidebar-title">易技圈管理</span>
                                <span class="sidebar-subtitle">技能交换平台</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="sidebar-nav">
                        <div class="nav-section">
                            <div class="nav-section-title">主菜单</div>
                            <div class="nav-item" data-route="dashboard">
                                <span class="nav-icon">📊</span>
                                <span class="nav-text">数据概览</span>
                            </div>
                            <div class="nav-item" data-route="user">
                                <span class="nav-icon">👥</span>
                                <span class="nav-text">用户管理</span>
                            </div>
                            <div class="nav-item active" data-route="category">
                                <span class="nav-icon">📁</span>
                                <span class="nav-text">分类管理</span>
                            </div>
                            <div class="nav-item" data-route="exchange">
                                <span class="nav-icon">🔄</span>
                                <span class="nav-text">交换订单</span>
                            </div>
                            <div class="nav-item" data-route="statistics">
                                <span class="nav-icon">📈</span>
                                <span class="nav-text">数据统计</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="sidebar-footer">
                        <div class="sidebar-user">
                            <div class="sidebar-user-avatar">${user?.real_name?.charAt(0) || 'A'}</div>
                            <div class="sidebar-user-info">
                                <div class="sidebar-user-name">${user?.real_name || '管理员'}</div>
                                <div class="sidebar-user-role">${user?.username || 'admin'}</div>
                            </div>
                        </div>
                        <div class="sidebar-logout" id="logoutBtn">
                            <span>🚪</span>
                            <span>退出登录</span>
                        </div>
                    </div>
                </div>
                
                <div class="main-wrapper">
                    <div class="header">
                        <div class="header-left">
                            <h1 class="header-title">分类管理</h1>
                        </div>
                        <div class="header-right">
                            <button class="btn btn-primary" id="addCategoryBtn">+ 添加分类</button>
                        </div>
                    </div>
                    
                    <div class="main-content">
                        <div class="page-header">
                            <h2 class="page-title">技能分类管理</h2>
                            <p class="page-subtitle">管理技能分类，支持二级分类</p>
                        </div>
                        
                        <div class="card">
                            <div class="table-container">
                                <table class="table" id="categoryTable">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>编码</th>
                                            <th>分类名称</th>
                                            <th>父分类</th>
                                            <th>排序</th>
                                            <th>状态</th>
                                            <th>操作</th>
                                        </tr>
                                    </thead>
                                    <tbody id="categoryTableBody">
                                        <tr><td colspan="7" class="text-center"><span class="loading"></span> 加载中...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="modal-overlay" id="categoryModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title" id="categoryModalTitle">添加分类</h3>
                        <button class="modal-close" data-close="categoryModal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="categoryForm">
                            <div class="form-group">
                                <label class="form-label">分类编码 <span class="required">*</span></label>
                                <input type="text" class="form-control" id="categoryCode" placeholder="例如: programming">
                            </div>
                            <div class="form-group">
                                <label class="form-label">分类名称 <span class="required">*</span></label>
                                <input type="text" class="form-control" id="categoryName" placeholder="例如: 编程">
                            </div>
                            <div class="form-group">
                                <label class="form-label">父分类</label>
                                <select class="form-control" id="parentCode">
                                    <option value="">无（一级分类）</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">描述</label>
                                <textarea class="form-control" id="categoryDesc" placeholder="分类描述..."></textarea>
                            </div>
                            <div class="form-group">
                                <label class="form-label">排序</label>
                                <input type="number" class="form-control" id="sortOrder" value="0" min="0">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" data-close="categoryModal">取消</button>
                        <button class="btn btn-primary" id="saveCategoryBtn">保存</button>
                    </div>
                </div>
            </div>
        `;
    },

    bindEvents() {
        document.querySelectorAll('.nav-item[data-route]').forEach(item => {
            item.addEventListener('click', () => {
                const route = item.dataset.route;
                Router.navigate(route);
            });
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        document.querySelectorAll('[data-close]').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.dataset.close;
                document.getElementById(modalId).classList.remove('show');
            });
        });

        document.getElementById('addCategoryBtn').addEventListener('click', () => {
            this.editingCategory = null;
            document.getElementById('categoryModalTitle').textContent = '添加分类';
            document.getElementById('categoryForm').reset();
            document.getElementById('parentCode').innerHTML = '<option value="">无（一级分类）</option>';
            this.loadParentOptions();
            document.getElementById('categoryModal').classList.add('show');
        });

        document.getElementById('saveCategoryBtn').addEventListener('click', () => {
            this.saveCategory();
        });
    },

    async loadCategories() {
        const tbody = document.getElementById('categoryTableBody');
        
        try {
            const result = await ApiService.get('/jn/category/admin/tree/get');
            
            if (result.code === 0 && result.data) {
                this.categories = result.data;
                this.renderTable();
            } else {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">加载失败</td></tr>';
            }
        } catch (error) {
            console.error('加载分类失败:', error);
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">加载失败</td></tr>';
        }
    },

    renderTable() {
        const tbody = document.getElementById('categoryTableBody');
        
        if (!this.categories || this.categories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center"><div class="empty-state"><div class="empty-state-icon">📁</div><p>暂无分类数据</p></div></td></tr>';
            return;
        }

        let html = '';
        
        this.categories.forEach(parent => {
            const statusClass = parent.is_active ? 'badge-success' : 'badge-secondary';
            
            html += `
                <tr style="background: rgba(99, 102, 241, 0.05);">
                    <td>${parent.id}</td>
                    <td><code>${parent.code}</code></td>
                    <td><strong>${parent.name}</strong></td>
                    <td>-</td>
                    <td>${parent.sort_order}</td>
                    <td><span class="badge ${statusClass}">${parent.is_active ? '启用' : '禁用'}</span></td>
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-sm btn-secondary" onclick="CategoryPage.toggleStatus(${parent.id}, ${parent.is_active ? 0 : 1})">${parent.is_active ? '禁用' : '启用'}</button>
                        </div>
                    </td>
                </tr>
            `;

            if (parent.children && parent.children.length > 0) {
                parent.children.forEach(child => {
                    const childStatusClass = child.is_active ? 'badge-success' : 'badge-secondary';
                    html += `
                        <tr>
                            <td>${child.id}</td>
                            <td><code>${child.code}</code></td>
                            <td style="padding-left: 36px;">└ ${child.name}</td>
                            <td>${parent.name}</td>
                            <td>${child.sort_order}</td>
                            <td><span class="badge ${childStatusClass}">${child.is_active ? '启用' : '禁用'}</span></td>
                            <td>
                                <div class="table-actions">
                                    <button class="btn btn-sm btn-secondary" onclick="CategoryPage.toggleStatus(${child.id}, ${child.is_active ? 0 : 1})">${child.is_active ? '禁用' : '启用'}</button>
                                </div>
                            </td>
                        </tr>
                    `;
                });
            }
        });

        tbody.innerHTML = html;
    },

    async loadParentOptions() {
        const select = document.getElementById('parentCode');
        
        try {
            const result = await ApiService.get('/jn/category/parents/get');
            
            if (result.code === 0 && result.data) {
                result.data.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.code;
                    option.textContent = cat.name;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('加载父分类失败:', error);
        }
    },

    async toggleStatus(categoryId, isActive) {
        try {
            const result = await ApiService.post(`/jn/category/update?category_id=${categoryId}`, { 
                is_active: isActive 
            });
            
            if (result.code === 0) {
                Toast.success(isActive ? '已启用' : '已禁用');
                this.loadCategories();
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (error) {
            Toast.error('操作失败');
        }
    },

    async saveCategory() {
        const code = document.getElementById('categoryCode').value.trim();
        const name = document.getElementById('categoryName').value.trim();
        const parentCode = document.getElementById('parentCode').value;
        const description = document.getElementById('categoryDesc').value.trim();
        const sortOrder = parseInt(document.getElementById('sortOrder').value) || 0;

        if (!code || !name) {
            Toast.warning('请填写分类编码和名称');
            return;
        }

        try {
            const result = await ApiService.post('/jn/category/create', {
                code,
                name,
                parent_code: parentCode,
                description,
                sort_order: sortOrder
            });

            if (result.code === 0) {
                Toast.success('创建成功');
                document.getElementById('categoryModal').classList.remove('show');
                this.loadCategories();
            } else {
                Toast.error(result.msg || '创建失败');
            }
        } catch (error) {
            Toast.error('创建失败');
        }
    },

    async handleLogout() {
        try {
            await AuthService.logout();
            Toast.success('已退出登录');
            Router.navigate('login');
        } catch (error) {
            Toast.error(error.message || '退出失败');
        }
    }
};

window.CategoryPage = CategoryPage;
