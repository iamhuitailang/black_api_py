var UsersPage = {
    currentPage: 1,
    pageSize: 10,
    searchKeyword: '',
    statusFilter: '',
    
    render: function() {
        if (!Auth.checkAuth()) return;
        
        var content = `
            <div class="page-header">
                <h2 class="page-title">用户管理</h2>
                <p class="page-subtitle">管理平台用户，支持封禁/解封操作</p>
            </div>
            <div class="toolbar">
                <div class="toolbar-left">
                    <div class="search-box">
                        <span class="search-icon">🔍</span>
                        <input type="text" class="form-control" id="searchInput" placeholder="搜索手机号/昵称...">
                    </div>
                    <select class="form-control" id="statusFilter" style="min-width: 120px;">
                        <option value="">全部状态</option>
                        <option value="0">正常</option>
                        <option value="1">已封禁</option>
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
                                    <th>用户ID</th>
                                    <th>头像</th>
                                    <th>昵称</th>
                                    <th>手机号</th>
                                    <th>信用分</th>
                                    <th>城市</th>
                                    <th>状态</th>
                                    <th>注册时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="userTableBody">
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
        `;
        
        Layout.render('/users', content);
        Layout.setPageTitle('用户管理');
        
        this.bindEvents();
        this.loadUsers();
    },
    
    bindEvents: function() {
        var self = this;
        
        document.getElementById('searchBtn').addEventListener('click', function() {
            self.searchKeyword = document.getElementById('searchInput').value.trim();
            self.statusFilter = document.getElementById('statusFilter').value;
            self.currentPage = 1;
            self.loadUsers();
        });
        
        document.getElementById('searchInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                self.searchKeyword = this.value.trim();
                self.statusFilter = document.getElementById('statusFilter').value;
                self.currentPage = 1;
                self.loadUsers();
            }
        });
    },
    
    loadUsers: function() {
        var self = this;
        var url = '/ex/admin/user/list/get?page=' + this.currentPage + '&limit=' + this.pageSize;
        
        if (this.searchKeyword) {
            url += '&keyword=' + encodeURIComponent(this.searchKeyword);
        }
        if (this.statusFilter !== '') {
            url += '&is_banned=' + this.statusFilter;
        }
        
        API.get(url)
            .then(function(response) {
                var data = response.data;
                var users = data.list || data;
                var total = data.total || users.length;
                
                self.renderTable(users);
                self.renderPagination(total);
            })
            .catch(function(error) {
                console.error('加载用户列表失败:', error);
                var tbody = document.getElementById('userTableBody');
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
    
    renderTable: function(users) {
        var tbody = document.getElementById('userTableBody');
        
        if (!users || users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center">
                        <div class="empty-state">
                            <div class="icon">👥</div>
                            <p>暂无用户数据</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        var html = '';
        users.forEach(function(user) {
            var statusBadge = user.is_banned 
                ? '<span class="badge badge-danger">已封禁</span>'
                : '<span class="badge badge-success">正常</span>';
            
            var avatarHtml = user.avatar 
                ? '<img src="' + user.avatar + '" class="avatar-sm" alt="' + (user.nickname || '') + '">'
                : '<div class="avatar-sm">' + (user.nickname ? user.nickname.charAt(0).toUpperCase() : '?') + '</div>';
            
            var actionBtn = user.is_banned
                ? '<button class="btn btn-sm btn-primary" onclick="UsersPage.unbanUser(' + user.id + ')">解封</button>'
                : '<button class="btn btn-sm btn-danger" onclick="UsersPage.banUser(' + user.id + ')">封禁</button>';
            
            html += `
                <tr>
                    <td>#` + user.id + `</td>
                    <td>` + avatarHtml + `</td>
                    <td>` + (user.nickname || '-') + `</td>
                    <td>` + (user.phone || '-') + `</td>
                    <td><span style="color: var(--primary-color); font-weight: 500;">` + (user.credit_score || 0) + `</span></td>
                    <td>` + (user.city || '-') + `</td>
                    <td>` + statusBadge + `</td>
                    <td>` + (user.created_at || '-') + `</td>
                    <td>
                        <div class="table-actions">
                            ` + actionBtn + `
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
        
        html += '<button class="pagination-btn" onclick="UsersPage.goToPage(' + (this.currentPage - 1) + ')" ' + (this.currentPage === 1 ? 'disabled' : '') + '>‹</button>';
        
        var startPage = Math.max(1, this.currentPage - 2);
        var endPage = Math.min(totalPages, startPage + 4);
        
        if (startPage > 1) {
            html += '<button class="pagination-btn" onclick="UsersPage.goToPage(1)">1</button>';
            if (startPage > 2) {
                html += '<span class="pagination-info">...</span>';
            }
        }
        
        for (var i = startPage; i <= endPage; i++) {
            html += '<button class="pagination-btn ' + (i === this.currentPage ? 'active' : '') + '" onclick="UsersPage.goToPage(' + i + ')">' + i + '</button>';
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += '<span class="pagination-info">...</span>';
            }
            html += '<button class="pagination-btn" onclick="UsersPage.goToPage(' + totalPages + ')">' + totalPages + '</button>';
        }
        
        html += '<button class="pagination-btn" onclick="UsersPage.goToPage(' + (this.currentPage + 1) + ')" ' + (this.currentPage === totalPages ? 'disabled' : '') + '>›</button>';
        html += '<span class="pagination-info">共 ' + total + ' 条</span>';
        
        container.innerHTML = html;
    },
    
    goToPage: function(page) {
        this.currentPage = page;
        this.loadUsers();
    },
    
    banUser: function(userId) {
        if (!confirm('确定要封禁该用户吗？')) return;
        
        API.post('/ex/admin/user/ban', { user_id: userId })
            .then(function() {
                Toast.success('封禁成功');
                UsersPage.loadUsers();
            })
            .catch(function(error) {
                Toast.error(error.message || '操作失败');
            });
    },
    
    unbanUser: function(userId) {
        if (!confirm('确定要解封该用户吗？')) return;
        
        API.post('/ex/admin/user/unban', { user_id: userId })
            .then(function() {
                Toast.success('解封成功');
                UsersPage.loadUsers();
            })
            .catch(function(error) {
                Toast.error(error.message || '操作失败');
            });
    }
};
