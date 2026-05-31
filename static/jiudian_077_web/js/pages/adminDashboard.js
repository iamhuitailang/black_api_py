const AdminDashboardPage = {
  dashboard: null,
  bookingStats: [],

  render() {
    if (!TokenStorage.isLoggedIn()) {
      Toast.error('请先登录');
      Router.navigate('/login');
      return;
    }

    if (!TokenStorage.isAdmin()) {
      Toast.error('无权访问管理后台');
      Router.navigate('/');
      return;
    }

    const app = document.getElementById('app');
    
    app.innerHTML = `
      ${this.renderNavbar('dashboard')}
      <div class="page-container">
        <div class="page-header">
          <h1 class="page-title">📊 数据统计</h1>
        </div>
        
        <div id="statsGrid" class="stats-grid">
          <div class="loading">
            <div class="spinner"></div>
          </div>
        </div>
        
        <div class="detail-section">
          <h3>预订趋势</h3>
          <div id="bookingStats">
            <div class="loading">
              <div class="spinner"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.loadDashboard();
    this.loadBookingStats();
  },

  renderNavbar(activeMenu) {
    const user = TokenStorage.getUser();
    
    return `
      <nav class="navbar">
        <div class="navbar-container">
          <div class="navbar-logo" onclick="Router.navigate('/admin/dashboard')">🏨 酒店管理后台</div>
          <div class="navbar-menu">
            <a href="javascript:;" class="navbar-link ${activeMenu === 'dashboard' ? 'active' : ''}" onclick="Router.navigate('/admin/dashboard')">数据统计</a>
            <a href="javascript:;" class="navbar-link ${activeMenu === 'rooms' ? 'active' : ''}" onclick="Router.navigate('/admin/rooms')">房间管理</a>
            <a href="javascript:;" class="navbar-link ${activeMenu === 'bookings' ? 'active' : ''}" onclick="Router.navigate('/admin/bookings')">预订管理</a>
            <a href="javascript:;" class="navbar-link ${activeMenu === 'checkin' ? 'active' : ''}" onclick="Router.navigate('/admin/checkin')">入住退房</a>
            <a href="javascript:;" class="navbar-link" onclick="Router.navigate('/')">返回前台</a>
          </div>
          <div class="navbar-user">
            <div class="dropdown">
              <div class="avatar" onclick="this.nextElementSibling.classList.toggle('show')">
                ${user?.nickname?.charAt(0) || user?.username?.charAt(0) || 'A'}
              </div>
              <div class="dropdown-menu">
                <div class="dropdown-item" onclick="Router.navigate('/profile')">个人资料</div>
                <div class="dropdown-item" onclick="AdminDashboardPage.handleLogout()">退出登录</div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    `;
  },

  async loadDashboard() {
    const statsGrid = document.getElementById('statsGrid');
    
    try {
      const result = await AdminApi.getDashboard();
      
      if (result.code === 0) {
        this.dashboard = result.data;
        this.renderStats();
      } else {
        statsGrid.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">😕</div>
            <div class="empty-text">加载失败</div>
            <div class="empty-desc">${result.msg || '请稍后重试'}</div>
          </div>
        `;
      }
    } catch (error) {
      statsGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">😕</div>
          <div class="empty-text">网络错误</div>
          <div class="empty-desc">请检查网络连接</div>
        </div>
      `;
    }
  },

  renderStats() {
    const statsGrid = document.getElementById('statsGrid');
    const data = this.dashboard;
    
    statsGrid.innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${data.total_rooms || 0}</div>
        <div class="stat-label">房间总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.available_rooms || 0}</div>
        <div class="stat-label">可用房间</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.total_bookings || 0}</div>
        <div class="stat-label">预订总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.confirmed_bookings || 0}</div>
        <div class="stat-label">待确认预订</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.occupied_rooms || 0}</div>
        <div class="stat-label">当前入住</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">¥${data.total_revenue || 0}</div>
        <div class="stat-label">总收入</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.total_users || 0}</div>
        <div class="stat-label">注册用户</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.today_bookings || 0}</div>
        <div class="stat-label">今日预订</div>
      </div>
    `;
  },

  async loadBookingStats() {
    const bookingStats = document.getElementById('bookingStats');
    
    try {
      const result = await AdminApi.getDashboard();
      
      if (result.code === 0) {
        this.bookingStats = result.data?.daily_stats || [];
        this.renderBookingStats();
      } else {
        bookingStats.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">😕</div>
            <div class="empty-text">加载失败</div>
          </div>
        `;
      }
    } catch (error) {
      bookingStats.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">😕</div>
          <div class="empty-text">网络错误</div>
        </div>
      `;
    }
  },

  renderBookingStats() {
    const bookingStats = document.getElementById('bookingStats');
    
    if (this.bookingStats.length === 0) {
      bookingStats.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📊</div>
          <div class="empty-text">暂无统计数据</div>
        </div>
      `;
      return;
    }

    const maxCount = Math.max(...this.bookingStats.map(s => s.count || 0), 1);
    
    bookingStats.innerHTML = `
      <div style="display: flex; gap: 16px; align-items: flex-end; height: 200px;">
        ${this.bookingStats.map(stat => `
          <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <div style="font-size: 14px; font-weight: 600; color: #667eea;">${stat.count || 0}</div>
            <div style="width: 100%; background: #f0f0f0; border-radius: 4px 4px 0 0; overflow: hidden;">
              <div style="height: ${(stat.count || 0) / maxCount * 160}px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>
            </div>
            <div style="font-size: 12px; color: #999;">${stat.date || ''}</div>
          </div>
        `).join('')}
      </div>
    `;
  },

  async handleLogout() {
    try {
      await UserApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    TokenStorage.clear();
    Toast.success('已退出登录');
    Router.navigate('/login');
  }
};
