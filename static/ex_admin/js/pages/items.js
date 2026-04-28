var ItemsPage = {
    currentPage: 1,
    pageSize: 10,
    searchKeyword: '',
    categoryFilter: '',
    statusFilter: '',
    
    categories: ['全部', '数码', '图书', '家居', '服饰', '美妆', '运动', '母婴', '其他'],
    
    render: function() {
        if (!Auth.checkAuth()) return;
        
        var categoryOptions = this.categories.map(function(cat, index) {
            return '<option value="' + (index === 0 ? '' : cat) + '">' + cat + '</option>';
        }).join('');
        
        var content = `
            <div class="page-header">
                <h2 class="page-title">物品审核</h2>
                <p class="page-subtitle">管理平台物品，支持下架违规物品</p>
            </div>
            <div class="toolbar">
                <div class="toolbar-left">
                    <div class="search-box">
                        <span class="search-icon">🔍</span>
                        <input type="text" class="form-control" id="searchInput" placeholder="搜索标题/描述...">
                    </div>
                    <select class="form-control" id="categoryFilter" style="min-width: 100px;">
                        ` + categoryOptions + `
                    </select>
                    <select class="form-control" id="statusFilter" style="min-width: 120px;">
                        <option value="">全部状态</option>
                        <option value="1">上架中</option>
                        <option value="2">已交换</option>
                        <option value="3">已下架</option>
                    </select>
                    <button class="btn btn-primary" id="searchBtn">搜索</button>
                </div>
            </div>
            <div class="card">
                <div class="card-body">
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>物品ID</th>
                                    <th>图片</th>
                                    <th>标题</th>
                                    <th>分类</th>
                                    <th>发布者</th>
                                    <th>状态</th>
                                    <th>发布时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="itemTableBody">
                                <tr>
                                    <td colspan="8" class="text-center">
                                        <span class="loading"></span> 加载中...
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="pagination" id="pagination"></div>
                </div>
            </div>
            
            <div class="modal-overlay" id="itemDetailModal">
                <div class="modal modal-lg">
                    <div class="modal-header">
                        <h3 class="modal-title">物品详情</h3>
                        <button class="modal-close" onclick="ItemsPage.closeDetailModal()">&times;</button>
                    </div>
                    <div class="modal-body" id="itemDetailContent">
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="ItemsPage.closeDetailModal()">关闭</button>
                    </div>
                </div>
            </div>
        `;
        
        Layout.render('/items', content);
        Layout.setPageTitle('物品审核');
        
        this.bindEvents();
        this.loadItems();
    },
    
    bindEvents: function() {
        var self = this;
        
        document.getElementById('searchBtn').addEventListener('click', function() {
            self.searchKeyword = document.getElementById('searchInput').value.trim();
            self.categoryFilter = document.getElementById('categoryFilter').value;
            self.statusFilter = document.getElementById('statusFilter').value;
            self.currentPage = 1;
            self.loadItems();
        });
        
        document.getElementById('searchInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                self.searchKeyword = this.value.trim();
                self.categoryFilter = document.getElementById('categoryFilter').value;
                self.statusFilter = document.getElementById('statusFilter').value;
                self.currentPage = 1;
                self.loadItems();
            }
        });
    },
    
    loadItems: function() {
        var self = this;
        var url = '/ex/admin/item/list/get?page=' + this.currentPage + '&limit=' + this.pageSize;
        
        if (this.searchKeyword) {
            url += '&keyword=' + encodeURIComponent(this.searchKeyword);
        }
        if (this.categoryFilter) {
            url += '&category=' + encodeURIComponent(this.categoryFilter);
        }
        if (this.statusFilter) {
            url += '&status=' + this.statusFilter;
        }
        
        API.get(url)
            .then(function(response) {
                var data = response.data;
                var items = data.list || data;
                var total = data.total || items.length;
                
                self.renderTable(items);
                self.renderPagination(total);
            })
            .catch(function(error) {
                console.error('加载物品列表失败:', error);
                var tbody = document.getElementById('itemTableBody');
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center">
                            <div class="empty-state">
                                <div class="icon">❌</div>
                                <p>加载失败: ` + (error.message || '未知错误') + `</p>
                            </div>
                        </td>
                    </tr>
                `;
            });
    },
    
    renderTable: function(items) {
        var tbody = document.getElementById('itemTableBody');
        
        if (!items || items.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        <div class="empty-state">
                            <div class="icon">📦</div>
                            <p>暂无物品数据</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        var statusMap = {
            1: { text: '上架中', class: 'badge-success' },
            2: { text: '已交换', class: 'badge-info' },
            3: { text: '已下架', class: 'badge-secondary' }
        };
        
        var html = '';
        items.forEach(function(item) {
            var status = statusMap[item.status] || { text: '未知', class: 'badge-warning' };
            
            var imagesHtml = '';
            if (item.images && item.images.length > 0) {
                imagesHtml = '<div class="item-images">';
                for (var i = 0; i < Math.min(item.images.length, 3); i++) {
                    imagesHtml += '<img src="' + item.images[i] + '" class="item-image" alt="">';
                }
                imagesHtml += '</div>';
            } else {
                imagesHtml = '<div class="item-images"><div class="item-image" style="display:flex;align-items:center;justify-content:center;background:var(--bg-color);">📷</div></div>';
            }
            
            var actionBtns = '<button class="btn btn-sm btn-info" onclick="ItemsPage.viewDetail(' + item.id + ')">详情</button>';
            if (item.status === 1) {
                actionBtns += '<button class="btn btn-sm btn-danger" onclick="ItemsPage.offShelf(' + item.id + ')">下架</button>';
            }
            
            html += `
                <tr>
                    <td>#` + item.id + `</td>
                    <td>` + imagesHtml + `</td>
                    <td>` + (item.title || '-') + `</td>
                    <td>` + (item.category || '-') + `</td>
                    <td>` + (item.publisher_nickname || item.publisher_phone || '-') + `</td>
                    <td><span class="badge ` + status.class + `">` + status.text + `</span></td>
                    <td>` + (item.created_at || '-') + `</td>
                    <td>
                        <div class="table-actions">
                            ` + actionBtns + `
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
        
        html += '<button class="pagination-btn" onclick="ItemsPage.goToPage(' + (this.currentPage - 1) + ')" ' + (this.currentPage === 1 ? 'disabled' : '') + '>‹</button>';
        
        var startPage = Math.max(1, this.currentPage - 2);
        var endPage = Math.min(totalPages, startPage + 4);
        
        if (startPage > 1) {
            html += '<button class="pagination-btn" onclick="ItemsPage.goToPage(1)">1</button>';
            if (startPage > 2) {
                html += '<span class="pagination-info">...</span>';
            }
        }
        
        for (var i = startPage; i <= endPage; i++) {
            html += '<button class="pagination-btn ' + (i === this.currentPage ? 'active' : '') + '" onclick="ItemsPage.goToPage(' + i + ')">' + i + '</button>';
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += '<span class="pagination-info">...</span>';
            }
            html += '<button class="pagination-btn" onclick="ItemsPage.goToPage(' + totalPages + ')">' + totalPages + '</button>';
        }
        
        html += '<button class="pagination-btn" onclick="ItemsPage.goToPage(' + (this.currentPage + 1) + ')" ' + (this.currentPage === totalPages ? 'disabled' : '') + '>›</button>';
        html += '<span class="pagination-info">共 ' + total + ' 条</span>';
        
        container.innerHTML = html;
    },
    
    goToPage: function(page) {
        this.currentPage = page;
        this.loadItems();
    },
    
    viewDetail: function(itemId) {
        var modal = document.getElementById('itemDetailModal');
        var content = document.getElementById('itemDetailContent');
        
        content.innerHTML = '<div class="text-center"><span class="loading"></span> 加载中...</div>';
        modal.classList.add('show');
        
        API.get('/ex/item/detail/get?id=' + itemId)
            .then(function(response) {
                var item = response.data;
                
                var conditionMap = { 1: '全新', 2: '几乎全新', 3: '轻微使用', 4: '明显使用' };
                
                var imagesHtml = '';
                if (item.images && item.images.length > 0) {
                    imagesHtml = '<div style="display:flex;flex-wrap:wrap;gap:10px;">';
                    item.images.forEach(function(img) {
                        imagesHtml += '<img src="' + img + '" style="width:120px;height:90px;object-fit:cover;border-radius:var(--radius-sm);">';
                    });
                    imagesHtml += '</div>';
                }
                
                content.innerHTML = `
                    <div class="form-row">
                        <div class="form-group" style="flex:1;">
                            <label class="form-label">标题</label>
                            <div style="padding:8px 0;">` + (item.title || '-') + `</div>
                        </div>
                        <div class="form-group" style="flex:0 0 150px;">
                            <label class="form-label">分类</label>
                            <div style="padding:8px 0;">` + (item.category || '-') + `</div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">描述</label>
                        <div style="padding:8px 0;white-space:pre-wrap;">` + (item.description || '-') + `</div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">图片</label>
                        <div style="padding:8px 0;">` + (imagesHtml || '<span class="text-secondary">无图片</span>') + `</div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">新旧程度</label>
                            <div style="padding:8px 0;">` + (conditionMap[item.condition] || '-') + `</div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">期望交换品类</label>
                            <div style="padding:8px 0;">` + (item.exchange_category || '-') + `</div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">所在地区</label>
                            <div style="padding:8px 0;">` + (item.location || '-') + `</div>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">发布者</label>
                            <div style="padding:8px 0;">` + (item.publisher_nickname || item.publisher_phone || '-') + `</div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">发布时间</label>
                            <div style="padding:8px 0;">` + (item.created_at || '-') + `</div>
                        </div>
                    </div>
                `;
            })
            .catch(function(error) {
                content.innerHTML = '<div class="text-center text-danger">加载失败: ' + (error.message || '未知错误') + '</div>';
            });
    },
    
    closeDetailModal: function() {
        document.getElementById('itemDetailModal').classList.remove('show');
    },
    
    offShelf: function(itemId) {
        if (!confirm('确定要下架该物品吗？')) return;
        
        API.post('/ex/admin/item/off-shelf', { item_id: itemId })
            .then(function() {
                Toast.success('下架成功');
                ItemsPage.loadItems();
            })
            .catch(function(error) {
                Toast.error(error.message || '操作失败');
            });
    }
};
