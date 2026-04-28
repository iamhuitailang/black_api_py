const BoothPage = {
    currentPage: 1,
    pageSize: 10,
    total: 0,
    items: [],
    
    render() {
        const content = `
            <div class="page-header">
                <h1 class="page-title">摊位管理</h1>
                <p class="page-subtitle">管理摊主入驻申请和摊位信息</p>
            </div>
            
            <div class="card">
                <div class="card-header flex-between">
                    <h3 class="card-title">摊位列表</h3>
                    <button class="btn btn-primary" onclick="BoothPage.showPendingModal()">
                        待审核申请
                    </button>
                </div>
                <div class="card-body">
                    <div class="toolbar">
                        <div class="toolbar-left">
                            <select class="form-control" id="applyStatusFilter" style="width: 120px;" onchange="BoothPage.handleFilter()">
                                <option value="">全部状态</option>
                                <option value="1">已通过</option>
                                <option value="0">待审核</option>
                                <option value="2">已拒绝</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>摊主姓名</th>
                                    <th>联系电话</th>
                                    <th>主营品类</th>
                                    <th>摊位位置</th>
                                    <th>评分</th>
                                    <th>认证状态</th>
                                    <th>申请状态</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="boothTableBody">
                                <tr>
                                    <td colspan="9" class="text-center">加载中...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="pagination" id="pagination"></div>
                </div>
            </div>
        `;
        
        Layout.render(content);
        this.loadData();
    },
    
    async loadData() {
        try {
            const applyStatusFilter = document.getElementById('applyStatusFilter')?.value;
            const applyStatus = applyStatusFilter === '' ? null : parseInt(applyStatusFilter);
            
            const result = await BoothService.getList(this.currentPage, this.pageSize, null, null, applyStatus);
            
            if (result.code === 0) {
                this.items = result.data.items || [];
                this.total = result.data.total || 0;
                this.renderTable();
                this.renderPagination();
            } else {
                Toast.error(result.msg || '加载失败');
            }
        } catch (error) {
            Toast.error('网络错误');
        }
    },
    
    renderTable() {
        const tbody = document.getElementById('boothTableBody');
        if (!tbody) return;
        
        if (this.items.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center">
                        <div class="empty-state">
                            <div class="icon">📭</div>
                            <p>暂无数据</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        const applyStatusMap = {
            0: { text: '待审核', class: 'badge-warning' },
            1: { text: '已通过', class: 'badge-success' },
            2: { text: '已拒绝', class: 'badge-danger' }
        };
        
        tbody.innerHTML = this.items.map(item => `
            <tr>
                <td>${item.id}</td>
                <td>${item.vendor_name || '-'}</td>
                <td>${item.phone || '-'}</td>
                <td>${item.categories || '-'}</td>
                <td>${item.location_desc || '-'}</td>
                <td>${item.rating || 0}</td>
                <td><span class="badge ${item.is_verified ? 'badge-success' : 'badge-secondary'}">${item.is_verified ? '已认证' : '未认证'}</span></td>
                <td><span class="badge ${applyStatusMap[item.apply_status]?.class || 'badge-secondary'}">${applyStatusMap[item.apply_status]?.text || '未知'}</span></td>
                <td>
                    <div class="table-actions">
                        ${item.apply_status === 0 ? `<button class="btn btn-sm btn-primary" onclick="BoothPage.verify(${item.id}, 1)">通过</button><button class="btn btn-sm btn-danger" onclick="BoothPage.verify(${item.id}, 2)">拒绝</button>` : ''}
                        <button class="btn btn-sm btn-danger" onclick="BoothPage.confirmDelete(${item.id})">删除</button>
                    </div>
                </td>
            </tr>
        `).join('');
    },
    
    renderPagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;
        
        const totalPages = Math.ceil(this.total / this.pageSize);
        
        if (totalPages <= 1) {
            pagination.innerHTML = `<span class="pagination-info">共 ${this.total} 条记录</span>`;
            return;
        }
        
        let html = `<span class="pagination-info">共 ${this.total} 条记录</span>`;
        
        html += `<button class="pagination-btn" onclick="BoothPage.goPage(1)" ${this.currentPage <= 1 ? 'disabled' : ''}>«</button>`;
        html += `<button class="pagination-btn" onclick="BoothPage.goPage(${this.currentPage - 1})" ${this.currentPage <= 1 ? 'disabled' : ''}>‹</button>`;
        
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" onclick="BoothPage.goPage(${i})">${i}</button>`;
        }
        
        html += `<button class="pagination-btn" onclick="BoothPage.goPage(${this.currentPage + 1})" ${this.currentPage >= totalPages ? 'disabled' : ''}>›</button>`;
        html += `<button class="pagination-btn" onclick="BoothPage.goPage(${totalPages})" ${this.currentPage >= totalPages ? 'disabled' : ''}>»</button>`;
        
        pagination.innerHTML = html;
    },
    
    goPage(page) {
        this.currentPage = page;
        this.loadData();
    },
    
    handleFilter() {
        this.currentPage = 1;
        this.loadData();
    },
    
    async showPendingModal() {
        try {
            const result = await BoothService.getPending();
            
            if (result.code !== 0) {
                Toast.error('获取待审核列表失败');
                return;
            }
            
            const items = result.data || [];
            
            const modalHtml = `
                <div class="modal-overlay show" id="pendingModal">
                    <div class="modal modal-lg">
                        <div class="modal-header">
                            <h3 class="modal-title">待审核摊位申请</h3>
                            <button class="modal-close" data-close="pendingModal">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="table-container">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>摊主姓名</th>
                                            <th>联系电话</th>
                                            <th>主营品类</th>
                                            <th>摊位位置</th>
                                            <th>申请时间</th>
                                            <th>操作</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${items.length === 0 ? `
                                            <tr><td colspan="7" class="text-center">暂无待审核申请</td></tr>
                                        ` : items.map(item => `
                                            <tr>
                                                <td>${item.id}</td>
                                                <td>${item.vendor_name || '-'}</td>
                                                <td>${item.phone || '-'}</td>
                                                <td>${item.categories || '-'}</td>
                                                <td>${item.location_desc || '-'}</td>
                                                <td>${item.created_at || '-'}</td>
                                                <td>
                                                    <button class="btn btn-sm btn-primary" onclick="BoothPage.verifyAndRefresh(${item.id}, 1)">通过</button>
                                                    <button class="btn btn-sm btn-danger" onclick="BoothPage.verifyAndRefresh(${item.id}, 2)">拒绝</button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" data-close="pendingModal">关闭</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            const modal = document.getElementById('pendingModal');
            modal.querySelectorAll('[data-close="pendingModal"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    modal.classList.remove('show');
                    setTimeout(() => modal.remove(), 200);
                });
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                    setTimeout(() => modal.remove(), 200);
                }
            });
        } catch (error) {
            Toast.error('网络错误');
        }
    },
    
    async verify(boothId, isVerified) {
        const action = isVerified === 1 ? '通过' : '拒绝';
        if (!confirm(`确定要${action}这个摊位申请吗？`)) {
            return;
        }
        
        try {
            const result = await BoothService.verify(boothId, isVerified);
            if (result.code === 0) {
                Toast.success(`已${action}`);
                this.loadData();
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (error) {
            Toast.error('网络错误');
        }
    },
    
    async verifyAndRefresh(boothId, isVerified) {
        const modal = document.getElementById('pendingModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 200);
        }
        
        await this.verify(boothId, isVerified);
    },
    
    confirmDelete(boothId) {
        if (confirm('确定要删除这个摊位吗？')) {
            this.handleDelete(boothId);
        }
    },
    
    async handleDelete(boothId) {
        try {
            const result = await BoothService.delete(boothId);
            if (result.code === 0) {
                Toast.success('删除成功');
                this.loadData();
            } else {
                Toast.error(result.msg || '删除失败');
            }
        } catch (error) {
            Toast.error('网络错误');
        }
    }
};

const PricePage = {
    currentPage: 1,
    pageSize: 10,
    total: 0,
    items: [],
    
    render() {
        const content = `
            <div class="page-header">
                <h1 class="page-title">价格审核</h1>
                <p class="page-subtitle">审核用户上报的价格信息</p>
            </div>
            
            <div class="card">
                <div class="card-header flex-between">
                    <h3 class="card-title">价格上报列表</h3>
                    <button class="btn btn-primary" onclick="PricePage.showPendingModal()">
                        待审核列表
                    </button>
                </div>
                <div class="card-body">
                    <div class="toolbar">
                        <div class="toolbar-left">
                            <select class="form-control" id="reportStatusFilter" style="width: 120px;" onchange="PricePage.handleFilter()">
                                <option value="">全部状态</option>
                                <option value="1">已通过</option>
                                <option value="0">待审核</option>
                                <option value="2">已拒绝</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>集市</th>
                                    <th>物品名称</th>
                                    <th>价格区间</th>
                                    <th>单位</th>
                                    <th>上报时间</th>
                                    <th>审核状态</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="priceTableBody">
                                <tr>
                                    <td colspan="8" class="text-center">加载中...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="pagination" id="pagination"></div>
                </div>
            </div>
        `;
        
        Layout.render(content);
        this.loadData();
    },
    
    async loadData() {
        try {
            const reportStatusFilter = document.getElementById('reportStatusFilter')?.value;
            const reportStatus = reportStatusFilter === '' ? null : parseInt(reportStatusFilter);
            
            const result = await PriceService.getList(this.currentPage, this.pageSize, null, reportStatus);
            
            if (result.code === 0) {
                this.items = result.data.items || [];
                this.total = result.data.total || 0;
                this.renderTable();
                this.renderPagination();
            } else {
                Toast.error(result.msg || '加载失败');
            }
        } catch (error) {
            Toast.error('网络错误');
        }
    },
    
    renderTable() {
        const tbody = document.getElementById('priceTableBody');
        if (!tbody) return;
        
        if (this.items.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        <div class="empty-state">
                            <div class="icon">📭</div>
                            <p>暂无数据</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        const reportStatusMap = {
            0: { text: '待审核', class: 'badge-warning' },
            1: { text: '已通过', class: 'badge-success' },
            2: { text: '已拒绝', class: 'badge-danger' }
        };
        
        tbody.innerHTML = this.items.map(item => `
            <tr>
                <td>${item.id}</td>
                <td>${item.market_name || '-'}</td>
                <td>${item.item_name || '-'}</td>
                <td>¥${item.min_price || 0} - ¥${item.max_price || 0}</td>
                <td>${item.unit || '斤'}</td>
                <td>${item.created_at || '-'}</td>
                <td><span class="badge ${reportStatusMap[item.report_status]?.class || 'badge-secondary'}">${reportStatusMap[item.report_status]?.text || '未知'}</span></td>
                <td>
                    <div class="table-actions">
                        ${item.report_status === 0 ? `<button class="btn btn-sm btn-primary" onclick="PricePage.audit(${item.id}, 1)">通过</button><button class="btn btn-sm btn-danger" onclick="PricePage.audit(${item.id}, 2)">拒绝</button>` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    },
    
    renderPagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;
        
        const totalPages = Math.ceil(this.total / this.pageSize);
        
        if (totalPages <= 1) {
            pagination.innerHTML = `<span class="pagination-info">共 ${this.total} 条记录</span>`;
            return;
        }
        
        let html = `<span class="pagination-info">共 ${this.total} 条记录</span>`;
        
        html += `<button class="pagination-btn" onclick="PricePage.goPage(1)" ${this.currentPage <= 1 ? 'disabled' : ''}>«</button>`;
        html += `<button class="pagination-btn" onclick="PricePage.goPage(${this.currentPage - 1})" ${this.currentPage <= 1 ? 'disabled' : ''}>‹</button>`;
        
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" onclick="PricePage.goPage(${i})">${i}</button>`;
        }
        
        html += `<button class="pagination-btn" onclick="PricePage.goPage(${this.currentPage + 1})" ${this.currentPage >= totalPages ? 'disabled' : ''}>›</button>`;
        html += `<button class="pagination-btn" onclick="PricePage.goPage(${totalPages})" ${this.currentPage >= totalPages ? 'disabled' : ''}>»</button>`;
        
        pagination.innerHTML = html;
    },
    
    goPage(page) {
        this.currentPage = page;
        this.loadData();
    },
    
    handleFilter() {
        this.currentPage = 1;
        this.loadData();
    },
    
    async showPendingModal() {
        try {
            const result = await PriceService.getPending();
            
            if (result.code !== 0) {
                Toast.error('获取待审核列表失败');
                return;
            }
            
            const items = result.data || [];
            
            const modalHtml = `
                <div class="modal-overlay show" id="pendingModal">
                    <div class="modal modal-lg">
                        <div class="modal-header">
                            <h3 class="modal-title">待审核价格上报</h3>
                            <button class="modal-close" data-close="pendingModal">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="table-container">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>集市</th>
                                            <th>物品名称</th>
                                            <th>价格区间</th>
                                            <th>单位</th>
                                            <th>上报时间</th>
                                            <th>操作</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${items.length === 0 ? `
                                            <tr><td colspan="7" class="text-center">暂无待审核记录</td></tr>
                                        ` : items.map(item => `
                                            <tr>
                                                <td>${item.id}</td>
                                                <td>${item.market_name || '-'}</td>
                                                <td>${item.item_name || '-'}</td>
                                                <td>¥${item.min_price || 0} - ¥${item.max_price || 0}</td>
                                                <td>${item.unit || '斤'}</td>
                                                <td>${item.created_at || '-'}</td>
                                                <td>
                                                    <button class="btn btn-sm btn-primary" onclick="PricePage.auditAndRefresh(${item.id}, 1)">通过</button>
                                                    <button class="btn btn-sm btn-danger" onclick="PricePage.auditAndRefresh(${item.id}, 2)">拒绝</button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" data-close="pendingModal">关闭</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            const modal = document.getElementById('pendingModal');
            modal.querySelectorAll('[data-close="pendingModal"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    modal.classList.remove('show');
                    setTimeout(() => modal.remove(), 200);
                });
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                    setTimeout(() => modal.remove(), 200);
                }
            });
        } catch (error) {
            Toast.error('网络错误');
        }
    },
    
    async audit(priceId, reportStatus) {
        const action = reportStatus === 1 ? '通过' : '拒绝';
        if (!confirm(`确定要${action}这个价格上报吗？`)) {
            return;
        }
        
        try {
            const result = await PriceService.audit(priceId, reportStatus);
            if (result.code === 0) {
                Toast.success(`已${action}`);
                this.loadData();
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (error) {
            Toast.error('网络错误');
        }
    },
    
    async auditAndRefresh(priceId, reportStatus) {
        const modal = document.getElementById('pendingModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 200);
        }
        
        await this.audit(priceId, reportStatus);
    }
};

const UserPage = {
    currentPage: 1,
    pageSize: 10,
    total: 0,
    items: [],
    
    render() {
        const content = `
            <div class="page-header">
                <h1 class="page-title">用户管理</h1>
                <p class="page-subtitle">管理平台用户</p>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">用户列表</h3>
                </div>
                <div class="card-body">
                    <div class="toolbar">
                        <div class="toolbar-left">
                            <select class="form-control" id="userStatusFilter" style="width: 120px;" onchange="UserPage.handleFilter()">
                                <option value="">全部状态</option>
                                <option value="1">正常</option>
                                <option value="2">禁用</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>手机号</th>
                                    <th>昵称</th>
                                    <th>是否摊主</th>
                                    <th>状态</th>
                                    <th>注册时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="userTableBody">
                                <tr>
                                    <td colspan="7" class="text-center">加载中...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="pagination" id="pagination"></div>
                </div>
            </div>
        `;
        
        Layout.render(content);
        this.loadData();
    },
    
    async loadData() {
        try {
            const statusFilter = document.getElementById('userStatusFilter')?.value;
            const status = statusFilter === '' ? null : parseInt(statusFilter);
            
            const result = await UserService.getList(this.currentPage, this.pageSize, status);
            
            if (result.code === 0) {
                this.items = result.data.items || [];
                this.total = result.data.total || 0;
                this.renderTable();
                this.renderPagination();
            } else {
                Toast.error(result.msg || '加载失败');
            }
        } catch (error) {
            Toast.error('网络错误');
        }
    },
    
    renderTable() {
        const tbody = document.getElementById('userTableBody');
        if (!tbody) return;
        
        if (this.items.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <div class="empty-state">
                            <div class="icon">📭</div>
                            <p>暂无数据</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        const statusMap = {
            1: { text: '正常', class: 'badge-success' },
            2: { text: '禁用', class: 'badge-danger' }
        };
        
        tbody.innerHTML = this.items.map(item => `
            <tr>
                <td>${item.id}</td>
                <td>${item.phone || '-'}</td>
                <td>${item.nickname || '-'}</td>
                <td><span class="badge ${item.is_vendor ? 'badge-success' : 'badge-secondary'}">${item.is_vendor ? '是' : '否'}</span></td>
                <td><span class="badge ${statusMap[item.status]?.class || 'badge-secondary'}">${statusMap[item.status]?.text || '未知'}</span></td>
                <td>${item.created_at || '-'}</td>
                <td>
                    <div class="table-actions">
                        ${item.status === 1 ? `<button class="btn btn-sm btn-danger" onclick="UserPage.updateStatus(${item.id}, 2)">禁用</button>` : `<button class="btn btn-sm btn-primary" onclick="UserPage.updateStatus(${item.id}, 1)">启用</button>`}
                    </div>
                </td>
            </tr>
        `).join('');
    },
    
    renderPagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;
        
        const totalPages = Math.ceil(this.total / this.pageSize);
        
        if (totalPages <= 1) {
            pagination.innerHTML = `<span class="pagination-info">共 ${this.total} 条记录</span>`;
            return;
        }
        
        let html = `<span class="pagination-info">共 ${this.total} 条记录</span>`;
        
        html += `<button class="pagination-btn" onclick="UserPage.goPage(1)" ${this.currentPage <= 1 ? 'disabled' : ''}>«</button>`;
        html += `<button class="pagination-btn" onclick="UserPage.goPage(${this.currentPage - 1})" ${this.currentPage <= 1 ? 'disabled' : ''}>‹</button>`;
        
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" onclick="UserPage.goPage(${i})">${i}</button>`;
        }
        
        html += `<button class="pagination-btn" onclick="UserPage.goPage(${this.currentPage + 1})" ${this.currentPage >= totalPages ? 'disabled' : ''}>›</button>`;
        html += `<button class="pagination-btn" onclick="UserPage.goPage(${totalPages})" ${this.currentPage >= totalPages ? 'disabled' : ''}>»</button>`;
        
        pagination.innerHTML = html;
    },
    
    goPage(page) {
        this.currentPage = page;
        this.loadData();
    },
    
    handleFilter() {
        this.currentPage = 1;
        this.loadData();
    },
    
    async updateStatus(userId, status) {
        const action = status === 1 ? '启用' : '禁用';
        if (!confirm(`确定要${action}这个用户吗？`)) {
            return;
        }
        
        try {
            const result = await UserService.updateStatus(userId, status);
            if (result.code === 0) {
                Toast.success(`已${action}`);
                this.loadData();
            } else {
                Toast.error(result.msg || '操作失败');
            }
        } catch (error) {
            Toast.error('网络错误');
        }
    }
};
