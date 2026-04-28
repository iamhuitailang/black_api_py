var ExchangesPage = {
    currentPage: 1,
    pageSize: 10,
    statusFilter: '',
    
    render: function() {
        if (!Auth.checkAuth()) return;
        
        var content = `
            <div class="page-header">
                <h2 class="page-title">交换记录</h2>
                <p class="page-subtitle">查看平台所有交换记录</p>
            </div>
            <div class="toolbar">
                <div class="toolbar-left">
                    <select class="form-control" id="statusFilter" style="min-width: 150px;">
                        <option value="">全部状态</option>
                        <option value="1">待处理</option>
                        <option value="2">已同意</option>
                        <option value="3">已完成</option>
                        <option value="4">已拒绝</option>
                        <option value="5">已取消</option>
                    </select>
                    <button class="btn btn-primary" id="searchBtn">筛选</button>
                </div>
            </div>
            <div class="card">
                <div class="card-body">
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>交换ID</th>
                                    <th>发起方</th>
                                    <th>接收方</th>
                                    <th>发起物品</th>
                                    <th>接收物品</th>
                                    <th>状态</th>
                                    <th>发起时间</th>
                                    <th>完成时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="exchangeTableBody">
                                <tr>
                                    <td colspan="9" class="text-center">
                                        <span class="loading"></span> 加载中...
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="pagination" id="pagination"></div>
                </div>
            </div>
            
            <div class="modal-overlay" id="exchangeDetailModal">
                <div class="modal modal-lg">
                    <div class="modal-header">
                        <h3 class="modal-title">交换详情</h3>
                        <button class="modal-close" onclick="ExchangesPage.closeDetailModal()">&times;</button>
                    </div>
                    <div class="modal-body" id="exchangeDetailContent">
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="ExchangesPage.closeDetailModal()">关闭</button>
                    </div>
                </div>
            </div>
        `;
        
        Layout.render('/exchanges', content);
        Layout.setPageTitle('交换记录');
        
        this.bindEvents();
        this.loadExchanges();
    },
    
    bindEvents: function() {
        var self = this;
        
        document.getElementById('searchBtn').addEventListener('click', function() {
            self.statusFilter = document.getElementById('statusFilter').value;
            self.currentPage = 1;
            self.loadExchanges();
        });
    },
    
    loadExchanges: function() {
        var self = this;
        var url = '/ex/admin/exchange/list/get?page=' + this.currentPage + '&limit=' + this.pageSize;
        
        if (this.statusFilter) {
            url += '&status=' + this.statusFilter;
        }
        
        API.get(url)
            .then(function(response) {
                var data = response.data;
                var exchanges = data.list || data;
                var total = data.total || exchanges.length;
                
                self.renderTable(exchanges);
                self.renderPagination(total);
            })
            .catch(function(error) {
                console.error('加载交换记录失败:', error);
                var tbody = document.getElementById('exchangeTableBody');
                tbody.innerHTML = `
                    <tr>
                        <td colspan="9" class="text-center">
                            <div class="empty-state">
                                <div class="icon">❌</div>
                                <p>加载失败: ` + (error.message || '未知错误') + `</p>
                            </div>
                        </td>
                    </tr>
                `;
            });
    },
    
    renderTable: function(exchanges) {
        var tbody = document.getElementById('exchangeTableBody');
        
        if (!exchanges || exchanges.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center">
                        <div class="empty-state">
                            <div class="icon">🔄</div>
                            <p>暂无交换记录</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        var statusMap = {
            1: { text: '待处理', class: 'badge-warning' },
            2: { text: '已同意', class: 'badge-info' },
            3: { text: '已完成', class: 'badge-success' },
            4: { text: '已拒绝', class: 'badge-danger' },
            5: { text: '已取消', class: 'badge-secondary' }
        };
        
        var html = '';
        exchanges.forEach(function(exchange) {
            var status = statusMap[exchange.status] || { text: '未知', class: 'badge-warning' };
            
            html += `
                <tr>
                    <td>#` + exchange.id + `</td>
                    <td>` + (exchange.initiator_nickname || exchange.initiator_phone || '-') + `</td>
                    <td>` + (exchange.receiver_nickname || exchange.receiver_phone || '-') + `</td>
                    <td>` + (exchange.initiator_item_title || '-') + `</td>
                    <td>` + (exchange.receiver_item_title || '-') + `</td>
                    <td><span class="badge ` + status.class + `">` + status.text + `</span></td>
                    <td>` + (exchange.created_at || '-') + `</td>
                    <td>` + (exchange.completed_at || '-') + `</td>
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-sm btn-info" onclick="ExchangesPage.viewDetail(` + exchange.id + `)">详情</button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    },
    
    renderPagination: function(total) {
        var container = document.getElementById('pagination');
        var totalPages = Math.ceil(total / this.pageSize);
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }
        
        var self = this;
        var html = '';
        
        html += '<button class="pagination-btn" onclick="ExchangesPage.goToPage(' + (this.currentPage - 1) + ')" ' + (this.currentPage === 1 ? 'disabled' : '') + '>‹</button>';
        
        var startPage = Math.max(1, this.currentPage - 2);
        var endPage = Math.min(totalPages, startPage + 4);
        
        if (startPage > 1) {
            html += '<button class="pagination-btn" onclick="ExchangesPage.goToPage(1)">1</button>';
            if (startPage > 2) {
                html += '<span class="pagination-info">...</span>';
            }
        }
        
        for (var i = startPage; i <= endPage; i++) {
            html += '<button class="pagination-btn ' + (i === this.currentPage ? 'active' : '') + '" onclick="ExchangesPage.goToPage(' + i + ')">' + i + '</button>';
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += '<span class="pagination-info">...</span>';
            }
            html += '<button class="pagination-btn" onclick="ExchangesPage.goToPage(' + totalPages + ')">' + totalPages + '</button>';
        }
        
        html += '<button class="pagination-btn" onclick="ExchangesPage.goToPage(' + (this.currentPage + 1) + ')" ' + (this.currentPage === totalPages ? 'disabled' : '') + '>›</button>';
        html += '<span class="pagination-info">共 ' + total + ' 条</span>';
        
        container.innerHTML = html;
    },
    
    goToPage: function(page) {
        this.currentPage = page;
        this.loadExchanges();
    },
    
    viewDetail: function(exchangeId) {
        var modal = document.getElementById('exchangeDetailModal');
        var content = document.getElementById('exchangeDetailContent');
        
        content.innerHTML = '<div class="text-center"><span class="loading"></span> 加载中...</div>';
        modal.classList.add('show');
        
        API.get('/ex/exchange/detail/get?id=' + exchangeId)
            .then(function(response) {
                var exchange = response.data;
                
                var statusMap = {
                    1: '待处理',
                    2: '已同意',
                    3: '已完成',
                    4: '已拒绝',
                    5: '已取消'
                };
                
                content.innerHTML = `
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">交换ID</label>
                            <div style="padding:8px 0;">#` + exchange.id + `</div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">状态</label>
                            <div style="padding:8px 0;">` + (statusMap[exchange.status] || '未知') + `</div>
                        </div>
                    </div>
                    <div style="display:flex;gap:20px;margin-bottom:20px;">
                        <div style="flex:1;padding:16px;background:var(--primary-light);border-radius:var(--radius-md);">
                            <h4 style="margin-bottom:12px;color:var(--primary-color);">发起方</h4>
                            <p><strong>用户：</strong>` + (exchange.initiator_nickname || exchange.initiator_phone || '-') + `</p>
                            <p><strong>物品：</strong>` + (exchange.initiator_item_title || '-') + `</p>
                        </div>
                        <div style="display:flex;align-items:center;font-size:24px;color:var(--primary-color);">⇄</div>
                        <div style="flex:1;padding:16px;background:#dbeafe;border-radius:var(--radius-md);">
                            <h4 style="margin-bottom:12px;color:var(--info-color);">接收方</h4>
                            <p><strong>用户：</strong>` + (exchange.receiver_nickname || exchange.receiver_phone || '-') + `</p>
                            <p><strong>物品：</strong>` + (exchange.receiver_item_title || '-') + `</p>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">附言</label>
                        <div style="padding:8px 0;white-space:pre-wrap;">` + (exchange.message || '无') + `</div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">发起时间</label>
                            <div style="padding:8px 0;">` + (exchange.created_at || '-') + `</div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">完成时间</label>
                            <div style="padding:8px 0;">` + (exchange.completed_at || '-') + `</div>
                        </div>
                    </div>
                `;
            })
            .catch(function(error) {
                content.innerHTML = '<div class="text-center text-danger">加载失败: ' + (error.message || '未知错误') + '</div>';
            });
    },
    
    closeDetailModal: function() {
        document.getElementById('exchangeDetailModal').classList.remove('show');
    }
};
