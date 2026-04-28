const ReviewPage = {
    currentPage: 1,
    pageSize: 10,
    total: 0,
    items: [],
    
    render() {
        const content = `
            <div class="page-header">
                <h1 class="page-title">评价管理</h1>
                <p class="page-subtitle">管理用户评价内容</p>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">评价列表</h3>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>集市/摊位</th>
                                    <th>评分</th>
                                    <th>评价内容</th>
                                    <th>是否回复</th>
                                    <th>状态</th>
                                    <th>评价时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="reviewTableBody">
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
            const result = await ReviewService.getList(this.currentPage, this.pageSize);
            
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
        const tbody = document.getElementById('reviewTableBody');
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
        
        const statusMap = {
            1: { text: '正常', class: 'badge-success' },
            2: { text: '已处理', class: 'badge-secondary' }
        };
        
        tbody.innerHTML = this.items.map(item => `
            <tr>
                <td>${item.id}</td>
                <td>${item.market_name || item.vendor_name || '-'}</td>
                <td><span style="color: var(--warning-color);">${'★'.repeat(item.rating)}${'☆'.repeat(5 - item.rating)}</span></td>
                <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${item.content || ''}">${item.content || '-'}</td>
                <td><span class="badge ${item.is_replied ? 'badge-success' : 'badge-secondary'}">${item.is_replied ? '是' : '否'}</span></td>
                <td><span class="badge ${statusMap[item.status]?.class || 'badge-secondary'}">${statusMap[item.status]?.text || '未知'}</span></td>
                <td>${item.created_at || '-'}</td>
                <td>
                    <div class="table-actions">
                        ${item.status === 1 ? `<button class="btn btn-sm btn-danger" onclick="ReviewPage.updateStatus(${item.id}, 2)">下架</button>` : `<button class="btn btn-sm btn-primary" onclick="ReviewPage.updateStatus(${item.id}, 1)">恢复</button>`}
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
        
        html += `<button class="pagination-btn" onclick="ReviewPage.goPage(1)" ${this.currentPage <= 1 ? 'disabled' : ''}>«</button>`;
        html += `<button class="pagination-btn" onclick="ReviewPage.goPage(${this.currentPage - 1})" ${this.currentPage <= 1 ? 'disabled' : ''}>‹</button>`;
        
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" onclick="ReviewPage.goPage(${i})">${i}</button>`;
        }
        
        html += `<button class="pagination-btn" onclick="ReviewPage.goPage(${this.currentPage + 1})" ${this.currentPage >= totalPages ? 'disabled' : ''}>›</button>`;
        html += `<button class="pagination-btn" onclick="ReviewPage.goPage(${totalPages})" ${this.currentPage >= totalPages ? 'disabled' : ''}>»</button>`;
        
        pagination.innerHTML = html;
    },
    
    goPage(page) {
        this.currentPage = page;
        this.loadData();
    },
    
    async updateStatus(reviewId, status) {
        const action = status === 1 ? '恢复' : '下架';
        if (!confirm(`确定要${action}这个评价吗？`)) {
            return;
        }
        
        try {
            const result = await ReviewService.updateStatus(reviewId, status);
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

const QAPage = {
    currentPage: 1,
    pageSize: 10,
    total: 0,
    items: [],
    
    render() {
        const content = `
            <div class="page-header">
                <h1 class="page-title">问答管理</h1>
                <p class="page-subtitle">管理用户求助问答</p>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">问答列表</h3>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>集市</th>
                                    <th>问题内容</th>
                                    <th>是否回答</th>
                                    <th>状态</th>
                                    <th>提问时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="qaTableBody">
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
            const result = await QAService.getList(this.currentPage, this.pageSize);
            
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
        const tbody = document.getElementById('qaTableBody');
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
            2: { text: '已处理', class: 'badge-secondary' }
        };
        
        tbody.innerHTML = this.items.map(item => `
            <tr>
                <td>${item.id}</td>
                <td>${item.market_name || '-'}</td>
                <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${item.question || ''}">${item.question || '-'}</td>
                <td><span class="badge ${item.is_answered ? 'badge-success' : 'badge-warning'}">${item.is_answered ? '已回答' : '待回答'}</span></td>
                <td><span class="badge ${statusMap[item.status]?.class || 'badge-secondary'}">${statusMap[item.status]?.text || '未知'}</span></td>
                <td>${item.created_at || '-'}</td>
                <td>
                    <div class="table-actions">
                        ${item.status === 1 ? `<button class="btn btn-sm btn-danger" onclick="QAPage.updateStatus(${item.id}, 2)">下架</button>` : `<button class="btn btn-sm btn-primary" onclick="QAPage.updateStatus(${item.id}, 1)">恢复</button>`}
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
        
        html += `<button class="pagination-btn" onclick="QAPage.goPage(1)" ${this.currentPage <= 1 ? 'disabled' : ''}>«</button>`;
        html += `<button class="pagination-btn" onclick="QAPage.goPage(${this.currentPage - 1})" ${this.currentPage <= 1 ? 'disabled' : ''}>‹</button>`;
        
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" onclick="QAPage.goPage(${i})">${i}</button>`;
        }
        
        html += `<button class="pagination-btn" onclick="QAPage.goPage(${this.currentPage + 1})" ${this.currentPage >= totalPages ? 'disabled' : ''}>›</button>`;
        html += `<button class="pagination-btn" onclick="QAPage.goPage(${totalPages})" ${this.currentPage >= totalPages ? 'disabled' : ''}>»</button>`;
        
        pagination.innerHTML = html;
    },
    
    goPage(page) {
        this.currentPage = page;
        this.loadData();
    },
    
    async updateStatus(qaId, status) {
        const action = status === 1 ? '恢复' : '下架';
        if (!confirm(`确定要${action}这个问答吗？`)) {
            return;
        }
        
        try {
            const result = await QAService.updateStatus(qaId, status);
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
