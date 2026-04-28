const MarketPage = {
    currentPage: 1,
    pageSize: 10,
    total: 0,
    items: [],
    
    render() {
        const content = `
            <div class="page-header">
                <h1 class="page-title">集市管理</h1>
                <p class="page-subtitle">管理集市基本信息</p>
            </div>
            
            <div class="card">
                <div class="card-header flex-between">
                    <h3 class="card-title">集市列表</h3>
                    <button class="btn btn-primary" onclick="MarketPage.showCreateModal()">
                        + 新增集市
                    </button>
                </div>
                <div class="card-body">
                    <div class="toolbar">
                        <div class="toolbar-left">
                            <div class="search-box">
                                <span class="search-icon">🔍</span>
                                <input type="text" class="form-control" id="searchKeyword" placeholder="搜索集市名称" onkeyup="MarketPage.handleSearch(event)">
                            </div>
                            <select class="form-control" id="statusFilter" style="width: 120px;" onchange="MarketPage.handleFilter()">
                                <option value="">全部状态</option>
                                <option value="1">正常</option>
                                <option value="2">暂停</option>
                                <option value="3">关闭</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="table-container">
                        <table class="table" id="marketTable">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>集市名称</th>
                                    <th>地点</th>
                                    <th>开市时间</th>
                                    <th>规模</th>
                                    <th>热度</th>
                                    <th>评分</th>
                                    <th>状态</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="marketTableBody">
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
            const keyword = document.getElementById('searchKeyword')?.value || '';
            const statusFilter = document.getElementById('statusFilter')?.value;
            const status = statusFilter === '' ? null : parseInt(statusFilter);
            
            const result = await MarketService.getList(this.currentPage, this.pageSize, status, keyword);
            
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
        const tbody = document.getElementById('marketTableBody');
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
        
        const statusMap = {
            1: { text: '正常', class: 'badge-success' },
            2: { text: '暂停', class: 'badge-warning' },
            3: { text: '关闭', class: 'badge-danger' }
        };
        
        tbody.innerHTML = this.items.map(item => `
            <tr>
                <td>${item.id}</td>
                <td>${item.name || '-'}</td>
                <td>${item.location || '-'}</td>
                <td>${item.open_time || '-'}</td>
                <td>${item.scale || '-'}</td>
                <td>${item.hot || 0}</td>
                <td>${item.rating || 0}</td>
                <td><span class="badge ${statusMap[item.status]?.class || 'badge-secondary'}">${statusMap[item.status]?.text || '未知'}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-secondary" onclick="MarketPage.showEditModal(${item.id})">编辑</button>
                        <button class="btn btn-sm btn-danger" onclick="MarketPage.confirmDelete(${item.id})">删除</button>
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
        
        html += `<button class="pagination-btn" onclick="MarketPage.goPage(1)" ${this.currentPage <= 1 ? 'disabled' : ''}>«</button>`;
        html += `<button class="pagination-btn" onclick="MarketPage.goPage(${this.currentPage - 1})" ${this.currentPage <= 1 ? 'disabled' : ''}>‹</button>`;
        
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" onclick="MarketPage.goPage(${i})">${i}</button>`;
        }
        
        html += `<button class="pagination-btn" onclick="MarketPage.goPage(${this.currentPage + 1})" ${this.currentPage >= totalPages ? 'disabled' : ''}>›</button>`;
        html += `<button class="pagination-btn" onclick="MarketPage.goPage(${totalPages})" ${this.currentPage >= totalPages ? 'disabled' : ''}>»</button>`;
        
        pagination.innerHTML = html;
    },
    
    goPage(page) {
        this.currentPage = page;
        this.loadData();
    },
    
    handleSearch(event) {
        if (event.key === 'Enter') {
            this.currentPage = 1;
            this.loadData();
        }
    },
    
    handleFilter() {
        this.currentPage = 1;
        this.loadData();
    },
    
    showCreateModal() {
        const modalHtml = `
            <div class="modal-overlay show" id="marketModal">
                <div class="modal modal-lg">
                    <div class="modal-header">
                        <h3 class="modal-title">新增集市</h3>
                        <button class="modal-close" data-close="marketModal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="marketForm">
                            <div class="form-group">
                                <label class="form-label">集市名称<span class="required">*</span></label>
                                <input type="text" id="marketName" class="form-control" placeholder="请输入集市名称">
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">开市时间</label>
                                    <input type="text" id="marketOpenTime" class="form-control" placeholder="例如: 08:00">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">闭市时间</label>
                                    <input type="text" id="marketCloseTime" class="form-control" placeholder="例如: 18:00">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">农历日期</label>
                                    <input type="text" id="marketLunarDates" class="form-control" placeholder="例如: 每月逢2、5、8">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">公历日期</label>
                                    <input type="text" id="marketSolarDates" class="form-control" placeholder="例如: 每周六、日">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">详细地址</label>
                                <input type="text" id="marketLocation" class="form-control" placeholder="请输入详细地址">
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">规模</label>
                                    <input type="text" id="marketScale" class="form-control" placeholder="例如: 大型、中型、小型">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">摊位数量</label>
                                    <input type="number" id="marketBoothCount" class="form-control" placeholder="约数">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">集市管理办电话</label>
                                <input type="text" id="marketAdminPhone" class="form-control" placeholder="投诉建议联系方式">
                            </div>
                            <div class="form-group">
                                <label class="form-label">集市简介</label>
                                <textarea id="marketDescription" class="form-control" rows="3" placeholder="集市介绍"></textarea>
                            </div>
                            <div class="form-group">
                                <label class="form-label">状态</label>
                                <select id="marketStatus" class="form-control">
                                    <option value="1">正常</option>
                                    <option value="2">暂停</option>
                                    <option value="3">关闭</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" data-close="marketModal">取消</button>
                        <button class="btn btn-primary" id="submitMarket">确认提交</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.bindModalEvents();
        
        document.getElementById('submitMarket').addEventListener('click', () => {
            this.handleCreate();
        });
    },
    
    async showEditModal(marketId) {
        try {
            const result = await MarketService.getDetail(marketId);
            if (result.code !== 0) {
                Toast.error('获取集市详情失败');
                return;
            }
            
            const item = result.data;
            
            const modalHtml = `
                <div class="modal-overlay show" id="marketModal">
                    <div class="modal modal-lg">
                        <div class="modal-header">
                            <h3 class="modal-title">编辑集市</h3>
                            <button class="modal-close" data-close="marketModal">&times;</button>
                        </div>
                        <div class="modal-body">
                            <form id="marketForm">
                                <input type="hidden" id="marketId" value="${item.id}">
                                <div class="form-group">
                                    <label class="form-label">集市名称<span class="required">*</span></label>
                                    <input type="text" id="marketName" class="form-control" value="${item.name || ''}">
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label class="form-label">开市时间</label>
                                        <input type="text" id="marketOpenTime" class="form-control" value="${item.open_time || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">闭市时间</label>
                                        <input type="text" id="marketCloseTime" class="form-control" value="${item.close_time || ''}">
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label class="form-label">农历日期</label>
                                        <input type="text" id="marketLunarDates" class="form-control" value="${item.lunar_dates || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">公历日期</label>
                                        <input type="text" id="marketSolarDates" class="form-control" value="${item.solar_dates || ''}">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">详细地址</label>
                                    <input type="text" id="marketLocation" class="form-control" value="${item.location || ''}">
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label class="form-label">规模</label>
                                        <input type="text" id="marketScale" class="form-control" value="${item.scale || ''}">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">摊位数量</label>
                                        <input type="number" id="marketBoothCount" class="form-control" value="${item.booth_count || 0}">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">集市管理办电话</label>
                                    <input type="text" id="marketAdminPhone" class="form-control" value="${item.admin_phone || ''}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">集市简介</label>
                                    <textarea id="marketDescription" class="form-control" rows="3">${item.description || ''}</textarea>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">状态</label>
                                    <select id="marketStatus" class="form-control">
                                        <option value="1" ${item.status === 1 ? 'selected' : ''}>正常</option>
                                        <option value="2" ${item.status === 2 ? 'selected' : ''}>暂停</option>
                                        <option value="3" ${item.status === 3 ? 'selected' : ''}>关闭</option>
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" data-close="marketModal">取消</button>
                            <button class="btn btn-primary" id="submitMarket">确认修改</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            this.bindModalEvents();
            
            document.getElementById('submitMarket').addEventListener('click', () => {
                this.handleEdit();
            });
        } catch (error) {
            Toast.error('网络错误');
        }
    },
    
    bindModalEvents() {
        const modal = document.getElementById('marketModal');
        
        modal.querySelectorAll('[data-close="marketModal"]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal();
            });
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
    },
    
    closeModal() {
        const modal = document.getElementById('marketModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 200);
        }
    },
    
    async handleCreate() {
        const name = document.getElementById('marketName').value.trim();
        if (!name) {
            Toast.error('请输入集市名称');
            return;
        }
        
        const data = {
            name,
            location: document.getElementById('marketLocation').value.trim(),
            open_time: document.getElementById('marketOpenTime').value.trim(),
            close_time: document.getElementById('marketCloseTime').value.trim(),
            lunar_dates: document.getElementById('marketLunarDates').value.trim(),
            solar_dates: document.getElementById('marketSolarDates').value.trim(),
            scale: document.getElementById('marketScale').value.trim(),
            booth_count: parseInt(document.getElementById('marketBoothCount').value) || 0,
            admin_phone: document.getElementById('marketAdminPhone').value.trim(),
            description: document.getElementById('marketDescription').value.trim(),
            status: parseInt(document.getElementById('marketStatus').value)
        };
        
        try {
            const result = await MarketService.create(data);
            if (result.code === 0) {
                Toast.success('创建成功');
                this.closeModal();
                this.loadData();
            } else {
                Toast.error(result.msg || '创建失败');
            }
        } catch (error) {
            Toast.error('网络错误');
        }
    },
    
    async handleEdit() {
        const marketId = parseInt(document.getElementById('marketId').value);
        const name = document.getElementById('marketName').value.trim();
        if (!name) {
            Toast.error('请输入集市名称');
            return;
        }
        
        const data = {
            name,
            location: document.getElementById('marketLocation').value.trim(),
            open_time: document.getElementById('marketOpenTime').value.trim(),
            close_time: document.getElementById('marketCloseTime').value.trim(),
            lunar_dates: document.getElementById('marketLunarDates').value.trim(),
            solar_dates: document.getElementById('marketSolarDates').value.trim(),
            scale: document.getElementById('marketScale').value.trim(),
            booth_count: parseInt(document.getElementById('marketBoothCount').value) || 0,
            admin_phone: document.getElementById('marketAdminPhone').value.trim(),
            description: document.getElementById('marketDescription').value.trim(),
            status: parseInt(document.getElementById('marketStatus').value)
        };
        
        try {
            const result = await MarketService.update(marketId, data);
            if (result.code === 0) {
                Toast.success('修改成功');
                this.closeModal();
                this.loadData();
            } else {
                Toast.error(result.msg || '修改失败');
            }
        } catch (error) {
            Toast.error('网络错误');
        }
    },
    
    confirmDelete(marketId) {
        if (confirm('确定要删除这个集市吗？')) {
            this.handleDelete(marketId);
        }
    },
    
    async handleDelete(marketId) {
        try {
            const result = await MarketService.delete(marketId);
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
