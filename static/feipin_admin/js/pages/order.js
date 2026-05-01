const OrdersPage = {
    currentPage: 1,
    pageSize: 10,
    keyword: '',
    status: '',

    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="admin-layout">
                ${this.renderSidebar()}
                <div class="main-wrapper">
                    ${this.renderHeader('订单管理')}
                    <div class="main-content">
                        <div class="page-header">
                            <h1 class="page-title">订单管理</h1>
                            <p class="page-subtitle">查看和管理所有废品回收订单</p>
                        </div>
                        
                        <div class="card">
                            <div class="card-header">
                                <h2 class="card-title">订单列表</h2>
                            </div>
                            <div class="card-body">
                                <div class="toolbar">
                                    <div class="toolbar-left">
                                        <div class="search-box">
                                            <span class="search-icon">🔍</span>
                                            <input type="text" class="form-control" id="searchInput" placeholder="搜索地址、联系人...">
                                        </div>
                                        <select class="form-control" id="statusFilter" style="min-width: 140px;">
                                            <option value="">全部状态</option>
                                            <option value="pending">待接单</option>
                                            <option value="accepted">已接单</option>
                                            <option value="completed">已完成</option>
                                            <option value="cancelled">已取消</option>
                                        </select>
                                        <button class="btn btn-primary" id="searchBtn">
                                            <span>🔍</span>
                                            <span>搜索</span>
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="table-container">
                                    <table class="table">
                                        <thead>
                                            <tr>
                                                <th>订单ID</th>
                                                <th>用户</th>
                                                <th>废品种类</th>
                                                <th>预估重量</th>
                                                <th>预估价格</th>
                                                <th>状态</th>
                                                <th>下单时间</th>
                                                <th>操作</th>
                                            </tr>
                                        </thead>
                                        <tbody id="ordersTableBody">
                                            <tr>
                                                <td colspan="8" class="text-center">加载中...</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div class="pagination" id="pagination">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="modal-overlay" id="orderDetailModal">
                <div class="modal modal-lg">
                    <div class="modal-header">
                        <h3 class="modal-title">订单详情</h3>
                        <button class="modal-close" id="closeDetailModal">&times;</button>
                    </div>
                    <div class="modal-body" id="orderDetailContent">
                        <div class="text-center py-8">加载中...</div>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
        this.loadOrders();
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
                    <div class="nav-item active" data-page="orders">
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
                    <div class="nav-item" data-page="categories">
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

        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.keyword = document.getElementById('searchInput').value.trim();
                this.status = document.getElementById('statusFilter').value;
                this.currentPage = 1;
                this.loadOrders();
            });
        }

        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.keyword = searchInput.value.trim();
                    this.status = document.getElementById('statusFilter').value;
                    this.currentPage = 1;
                    this.loadOrders();
                }
            });
        }

        const closeDetailModal = document.getElementById('closeDetailModal');
        if (closeDetailModal) {
            closeDetailModal.addEventListener('click', () => this.hideDetailModal());
        }
    },

    async loadOrders() {
        const tbody = document.getElementById('ordersTableBody');
        if (!tbody) return;

        try {
            const params = {
                page: this.currentPage,
                page_size: this.pageSize
            };
            if (this.keyword) params.keyword = this.keyword;
            if (this.status) params.status = this.status;

            const result = await ApiService.get('/feipin/order/list/get', params);
            
            if (result.code === 0 && result.data) {
                const data = result.data;
                this.renderTable(data.items);
                this.renderPagination(data);
            } else {
                tbody.innerHTML = `<tr><td colspan="8" class="text-center">${result.msg || '加载失败'}</td></tr>`;
            }
        } catch (error) {
            console.error('加载订单列表失败:', error);
            tbody.innerHTML = `<tr><td colspan="8" class="text-center">加载失败，请重试</td></tr>`;
        }
    },

    getStatusBadge(status) {
        const statusMap = {
            'pending': { class: 'badge-warning', text: '待接单' },
            'accepted': { class: 'badge-info', text: '已接单' },
            'completed': { class: 'badge-success', text: '已完成' },
            'cancelled': { class: 'badge-danger', text: '已取消' }
        };
        const info = statusMap[status] || { class: 'badge-secondary', text: status };
        return `<span class="badge ${info.class}">${info.text}</span>`;
    },

    renderTable(orders) {
        const tbody = document.getElementById('ordersTableBody');
        if (!tbody) return;

        if (!orders || orders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8">
                        <div class="empty-state">
                            <div class="empty-state-icon">📋</div>
                            <div class="empty-state-title">暂无订单数据</div>
                            <div class="empty-state-text">用户下单后将显示在这里</div>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>#${order.id}</td>
                <td>
                    <div class="flex items-center gap-2">
                        <div class="avatar-sm">${order.user && order.user.nickname ? order.user.nickname.charAt(0) : '用'}</div>
                        <div>
                            <div class="font-semibold">${order.user && order.user.nickname ? order.user.nickname : '用户'}</div>
                            <div class="text-sm text-gray-500">${order.contact_phone || (order.user && order.user.phone) || '-'}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="flex items-center gap-2">
                        <span>${order.category && order.category.icon ? order.category.icon : ''}</span>
                        <span>${order.category && order.category.name ? order.category.name : '-'}</span>
                    </div>
                </td>
                <td>${order.weight} 公斤</td>
                <td>¥${order.total_price.toFixed(2)}</td>
                <td>${this.getStatusBadge(order.status)}</td>
                <td>${order.created_at ? new Date(order.created_at).toLocaleString() : '-'}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-secondary" onclick="OrdersPage.showOrderDetail(${order.id})">详情</button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    renderPagination(data) {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;

        const totalPages = data.total_pages || 1;
        const currentPage = data.page || 1;

        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let html = `<span class="pagination-info">共 ${data.total} 条，第 ${currentPage}/${totalPages} 页</span>`;
        
        html += `<button class="pagination-btn" onclick="OrdersPage.goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>‹</button>`;
        
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);
        
        if (startPage > 1) {
            html += `<button class="pagination-btn" onclick="OrdersPage.goToPage(1)">1</button>`;
            if (startPage > 2) {
                html += `<span class="pagination-info">...</span>`;
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="OrdersPage.goToPage(${i})">${i}</button>`;
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += `<span class="pagination-info">...</span>`;
            }
            html += `<button class="pagination-btn" onclick="OrdersPage.goToPage(${totalPages})">${totalPages}</button>`;
        }
        
        html += `<button class="pagination-btn" onclick="OrdersPage.goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>›</button>`;
        
        pagination.innerHTML = html;
    },

    goToPage(page) {
        this.currentPage = page;
        this.loadOrders();
    },

    async showOrderDetail(orderId) {
        const modal = document.getElementById('orderDetailModal');
        const content = document.getElementById('orderDetailContent');
        
        if (!modal || !content) return;

        content.innerHTML = `<div class="text-center py-8"><div class="loading"></div></div>`;
        modal.classList.add('show');

        try {
            const result = await ApiService.get('/feipin/order/detail/get', { order_id: orderId });
            if (result.code === 0 && result.data) {
                const order = result.data;
                content.innerHTML = this.renderOrderDetail(order);
            } else {
                content.innerHTML = `<div class="text-center py-8 text-red-500">加载失败：${result.msg || '未知错误'}</div>`;
            }
        } catch (error) {
            content.innerHTML = `<div class="text-center py-8 text-red-500">加载失败，请重试</div>`;
        }
    },

    renderOrderDetail(order) {
        return `
            <div class="grid grid-cols-2 gap-4">
                <div class="form-group">
                    <label class="form-label">订单编号</label>
                    <div class="p-3 bg-gray-50 rounded-lg font-semibold">#${order.id}</div>
                </div>
                <div class="form-group">
                    <label class="form-label">订单状态</label>
                    <div class="p-3 bg-gray-50 rounded-lg">${this.getStatusBadge(order.status)}</div>
                </div>
            </div>
            
            <div class="border-t border-gray-200 my-4"></div>
            
            <h4 class="font-semibold mb-3">用户信息</h4>
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="form-group">
                    <label class="form-label">用户昵称</label>
                    <div class="p-3 bg-gray-50 rounded-lg">${order.user && order.user.nickname ? order.user.nickname : '-'}</div>
                </div>
                <div class="form-group">
                    <label class="form-label">联系电话</label>
                    <div class="p-3 bg-gray-50 rounded-lg">${order.contact_phone || (order.user && order.user.phone) || '-'}</div>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">详细地址</label>
                <div class="p-3 bg-gray-50 rounded-lg">${order.address || '-'}</div>
            </div>
            
            <div class="border-t border-gray-200 my-4"></div>
            
            <h4 class="font-semibold mb-3">废品信息</h4>
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="form-group">
                    <label class="form-label">废品种类</label>
                    <div class="p-3 bg-gray-50 rounded-lg flex items-center gap-2">
                        <span>${order.category && order.category.icon ? order.category.icon : ''}</span>
                        <span>${order.category && order.category.name ? order.category.name : '-'}</span>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">预估重量</label>
                    <div class="p-3 bg-gray-50 rounded-lg">${order.weight} 公斤</div>
                </div>
                <div class="form-group">
                    <label class="form-label">参考单价</label>
                    <div class="p-3 bg-gray-50 rounded-lg">¥${order.category && order.category.price ? order.category.price.toFixed(2) : 0}/公斤</div>
                </div>
                <div class="form-group">
                    <label class="form-label">预估总价</label>
                    <div class="p-3 bg-gray-50 rounded-lg font-semibold text-primary">¥${order.total_price.toFixed(2)}</div>
                </div>
            </div>
            
            ${order.collector ? `
            <div class="border-t border-gray-200 my-4"></div>
            
            <h4 class="font-semibold mb-3">回收员信息</h4>
            <div class="grid grid-cols-2 gap-4">
                <div class="form-group">
                    <label class="form-label">回收员</label>
                    <div class="p-3 bg-gray-50 rounded-lg flex items-center gap-2">
                        <div class="avatar-sm">${order.collector.nickname ? order.collector.nickname.charAt(0) : '回'}</div>
                        <span>${order.collector.nickname || '回收员'}</span>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">联系电话</label>
                    <div class="p-3 bg-gray-50 rounded-lg">${order.collector.phone || '-'}</div>
                </div>
            </div>
            ` : ''}
            
            <div class="border-t border-gray-200 my-4"></div>
            
            <h4 class="font-semibold mb-3">时间信息</h4>
            <div class="grid grid-cols-2 gap-4">
                <div class="form-group">
                    <label class="form-label">下单时间</label>
                    <div class="p-3 bg-gray-50 rounded-lg">${order.created_at ? new Date(order.created_at).toLocaleString() : '-'}</div>
                </div>
                <div class="form-group">
                    <label class="form-label">接单时间</label>
                    <div class="p-3 bg-gray-50 rounded-lg">${order.accepted_at ? new Date(order.accepted_at).toLocaleString() : '-'}</div>
                </div>
                <div class="form-group">
                    <label class="form-label">完成时间</label>
                    <div class="p-3 bg-gray-50 rounded-lg">${order.completed_at ? new Date(order.completed_at).toLocaleString() : '-'}</div>
                </div>
                ${order.actual_price ? `
                <div class="form-group">
                    <label class="form-label">实际结算金额</label>
                    <div class="p-3 bg-gray-50 rounded-lg font-semibold text-primary">¥${order.actual_price.toFixed(2)}</div>
                </div>
                ` : ''}
            </div>
            
            ${order.note ? `
            <div class="border-t border-gray-200 my-4"></div>
            <div class="form-group">
                <label class="form-label">备注</label>
                <div class="p-3 bg-gray-50 rounded-lg">${order.note}</div>
            </div>
            ` : ''}
        `;
    },

    hideDetailModal() {
        const modal = document.getElementById('orderDetailModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }
};

window.OrdersPage = OrdersPage;
