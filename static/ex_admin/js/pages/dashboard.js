var Layout = {
    menuItems: [
        { path: '/dashboard', icon: '📊', label: '数据概览' },
        { path: '/users', icon: '👥', label: '用户管理' },
        { path: '/items', icon: '📦', label: '物品审核' },
        { path: '/exchanges', icon: '🔄', label: '交换记录' },
        { path: '/reports', icon: '⚠️', label: '举报处理' }
    ],
    
    render: function(activePath, content) {
        var user = Auth.getCurrentUser();
        var userName = user ? (user.nickname || user.phone || '管理员') : '管理员';
        var initial = userName.charAt(0).toUpperCase();
        
        var menuHtml = this.menuItems.map(function(item) {
            var activeClass = activePath === item.path ? 'active' : '';
            return '<div class="menu-item ' + activeClass + '" data-path="' + item.path + '">' +
                   '<span class="icon">' + item.icon + '</span>' +
                   '<span>' + item.label + '</span>' +
                   '</div>';
        }).join('');
        
        var app = document.getElementById('app');
        app.innerHTML = `
            <div class="layout">
                <aside class="sidebar">
                    <div class="sidebar-header">
                        <div class="sidebar-logo">
                            <span class="logo-icon">🔄</span>
                            <span>换享管理</span>
                        </div>
                    </div>
                    <div class="sidebar-menu">
                        ` + menuHtml + `
                    </div>
                </aside>
                <div class="main-wrapper">
                    <header class="header">
                        <div class="header-left">
                            <h1 class="header-title" id="pageTitle">数据概览</h1>
                        </div>
                        <div class="header-right">
                            <div class="dropdown">
                                <div class="user-info" id="userInfo">
                                    <div class="user-avatar">` + initial + `</div>
                                    <span class="user-name">` + userName + `</span>
                                </div>
                                <div class="dropdown-menu" id="dropdownMenu">
                                    <div class="dropdown-item" id="logoutBtn">
                                        <span>🚪</span>
                                        <span>退出登录</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>
                    <main class="main-content" id="mainContent">
                        ` + content + `
                    </main>
                </div>
            </div>
        `;
        
        this.bindEvents();
    },
    
    bindEvents: function() {
        var self = this;
        
        document.querySelectorAll('.menu-item').forEach(function(item) {
            item.addEventListener('click', function() {
                var path = this.getAttribute('data-path');
                Router.navigate(path);
            });
        });
        
        var userInfo = document.getElementById('userInfo');
        var dropdownMenu = document.getElementById('dropdownMenu');
        
        userInfo.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });
        
        document.addEventListener('click', function() {
            dropdownMenu.classList.remove('show');
        });
        
        var logoutBtn = document.getElementById('logoutBtn');
        logoutBtn.addEventListener('click', function() {
            Auth.logout();
            Toast.success('已退出登录');
            Router.navigate('/login');
        });
    },
    
    setPageTitle: function(title) {
        var pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = title;
        }
    }
};

var DashboardPage = {
    render: function() {
        if (!Auth.checkAuth()) return;
        
        var content = `
            <div class="page-header">
                <h2 class="page-title">数据概览</h2>
                <p class="page-subtitle">平台运营数据一览</p>
            </div>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon primary">
                        <span>👥</span>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value" id="userCount">--</div>
                        <div class="stat-label">用户总数</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon info">
                        <span>📦</span>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value" id="itemCount">--</div>
                        <div class="stat-label">物品总数</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon warning">
                        <span>🔄</span>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value" id="exchangeCount">--</div>
                        <div class="stat-label">交换总数</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon danger">
                        <span>⚠️</span>
                    </div>
                    <div class="stat-info">
                        <div class="stat-value" id="pendingReportCount">--</div>
                        <div class="stat-label">待处理举报</div>
                    </div>
                </div>
            </div>
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">最近交换记录</h3>
                </div>
                <div class="card-body" id="recentExchanges">
                    <div class="empty-state">
                        <div class="icon">📋</div>
                        <p>暂无交换记录</p>
                    </div>
                </div>
            </div>
        `;
        
        Layout.render('/dashboard', content);
        Layout.setPageTitle('数据概览');
        
        this.loadData();
    },
    
    loadData: function() {
        var self = this;
        
        API.get('/ex/admin/dashboard/get')
            .then(function(response) {
                var data = response.data;
                if (data && data.stats) {
                    var stats = data.stats;
                    self.updateStats(stats);
                }
            })
            .catch(function(error) {
                console.error('加载统计数据失败:', error);
            });
        
        self.loadRecentExchanges();
    },
    
    updateStats: function(stats) {
        var userCount = document.getElementById('userCount');
        var itemCount = document.getElementById('itemCount');
        var exchangeCount = document.getElementById('exchangeCount');
        var pendingReportCount = document.getElementById('pendingReportCount');
        
        if (userCount) userCount.textContent = stats.total_users || 0;
        if (itemCount) itemCount.textContent = stats.total_items || 0;
        if (exchangeCount) exchangeCount.textContent = stats.total_exchanges || 0;
        if (pendingReportCount) pendingReportCount.textContent = stats.pending_reports || 0;
    },
    
    loadRecentExchanges: function() {
        var container = document.getElementById('recentExchanges');
        
        API.get('/ex/admin/exchange/list/get?limit=10')
            .then(function(response) {
                var data = response.data;
                var exchanges = data.list || data;
                
                if (!exchanges || exchanges.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <div class="icon">📋</div>
                            <p>暂无交换记录</p>
                        </div>
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
                
                var tableHtml = `
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>交换ID</th>
                                    <th>发起方</th>
                                    <th>接收方</th>
                                    <th>状态</th>
                                    <th>发起时间</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                
                exchanges.forEach(function(exchange) {
                    var status = statusMap[exchange.status] || { text: '未知', class: 'badge-secondary' };
                    var initiatorPhone = exchange.initiator_phone || exchange.initiator_nickname || '-';
                    var receiverPhone = exchange.receiver_phone || exchange.receiver_nickname || '-';
                    
                    tableHtml += `
                        <tr>
                            <td>#` + exchange.id + `</td>
                            <td>` + initiatorPhone + `</td>
                            <td>` + receiverPhone + `</td>
                            <td><span class="badge ` + status.class + `">` + status.text + `</span></td>
                            <td>` + (exchange.created_at || '-') + `</td>
                        </tr>
                    `;
                });
                
                tableHtml += `
                            </tbody>
                        </table>
                    </div>
                `;
                
                container.innerHTML = tableHtml;
            })
            .catch(function(error) {
                console.error('加载交换记录失败:', error);
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">❌</div>
                        <p>加载失败: ` + (error.message || '未知错误') + `</p>
                    </div>
                `;
            });
    }
};
