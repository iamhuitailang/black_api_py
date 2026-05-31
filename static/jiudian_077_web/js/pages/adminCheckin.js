const AdminCheckinPage = {
  bookings: [],
  filter: {
    status: '',
    page: 1,
    page_size: 10
  },
  pagination: {
    total: 0,
    page: 1,
    page_size: 10,
    total_pages: 0
  },

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
      ${this.renderNavbar('checkin')}
      <div class="page-container">
        <div class="page-header">
          <h1 class="page-title">🔑 入住退房管理</h1>
        </div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value" id="todayCheckin">0</div>
            <div class="stat-label">今日入住</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="todayCheckout">0</div>
            <div class="stat-label">今日退房</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="currentGuests">0</div>
            <div class="stat-label">当前在住</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="pendingCheckin">0</div>
            <div class="stat-label">待入住</div>
          </div>
        </div>
        
        <div class="filter-bar">
          <div class="filter-item">
            <label class="form-label">操作类型</label>
            <select class="form-select" id="filterStatus">
              <option value="">全部</option>
              <option value="1">待入住</option>
              <option value="2">已入住</option>
            </select>
          </div>
          <div class="filter-item">
            <label class="form-label">关键词搜索</label>
            <input type="text" class="form-input" id="filterKeyword" placeholder="预订号/用户名/房间号/手机号">
          </div>
          <div class="filter-item">
            <button class="btn btn-primary" id="searchBtn">搜索</button>
          </div>
        </div>
        
        <div class="card">
          <div class="card-body" id="bookingList">
            <div class="loading">
              <div class="spinner"></div>
            </div>
          </div>
        </div>
        
        <div id="pagination" class="pagination"></div>
      </div>
    `;

    this.bindEvents();
    this.loadStats();
    this.loadBookings();
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
                <div class="dropdown-item" onclick="AdminCheckinPage.handleLogout()">退出登录</div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    `;
  },

  bindEvents() {
    document.getElementById('searchBtn').addEventListener('click', () => this.applyFilters());
    
    document.getElementById('filterStatus').addEventListener('change', () => {
      this.filter.status = document.getElementById('filterStatus').value;
    });
    
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
          menu.classList.remove('show');
        });
      }
    });
  },

  getStatusLabel(status) {
    const statusMap = {
      0: { label: '待确认', class: 'badge-warning' },
      1: { label: '待入住', class: 'badge-info' },
      2: { label: '已入住', class: 'badge-success' },
      3: { label: '已退房', class: 'badge-secondary' },
      4: { label: '已取消', class: 'badge-danger' }
    };
    return statusMap[status] || { label: status, class: 'badge-secondary' };
  },

  async loadStats() {
    try {
      const result = await AdminApi.getDashboard();
      if (result.code === 0) {
        const data = result.data || {};
        const todayCheckinEl = document.getElementById('todayCheckin');
        const todayCheckoutEl = document.getElementById('todayCheckout');
        const currentGuestsEl = document.getElementById('currentGuests');
        const pendingCheckinEl = document.getElementById('pendingCheckin');
        
        if (todayCheckinEl) todayCheckinEl.textContent = data.today_check_ins ?? 0;
        if (todayCheckoutEl) todayCheckoutEl.textContent = data.today_check_outs ?? 0;
        if (currentGuestsEl) currentGuestsEl.textContent = data.occupied_rooms ?? 0;
        if (pendingCheckinEl) pendingCheckinEl.textContent = data.confirmed_bookings ?? 0;
      }
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  },

  async loadBookings() {
    const bookingList = document.getElementById('bookingList');
    bookingList.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
      </div>
    `;

    try {
      const params = {
        keyword: this.filter.keyword,
        page: this.filter.page,
        page_size: this.filter.page_size
      };
      
      if (this.filter.status) {
        params.status = parseInt(this.filter.status);
      }
      
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const result = await BookingApi.getList(params);
      
      if (result.code === 0) {
        this.bookings = result.data.items || [];
        this.pagination = {
          total: result.data.total || 0,
          page: result.data.page || 1,
          page_size: result.data.page_size || 10,
          total_pages: Math.ceil((result.data.total || 0) / (result.data.page_size || 10))
        };
        this.renderBookings();
        this.renderPagination();
      } else {
        bookingList.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">😕</div>
            <div class="empty-text">加载失败</div>
            <div class="empty-desc">${result.msg || '请稍后重试'}</div>
          </div>
        `;
      }
    } catch (error) {
      bookingList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">😕</div>
          <div class="empty-text">网络错误</div>
          <div class="empty-desc">请检查网络连接</div>
        </div>
      `;
    }
  },

  renderBookings() {
    const bookingList = document.getElementById('bookingList');
    
    if (this.bookings.length === 0) {
      bookingList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔑</div>
          <div class="empty-text">暂无相关预订</div>
        </div>
      `;
      return;
    }

    bookingList.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>预订编号</th>
            <th>用户信息</th>
            <th>房间</th>
            <th>入住日期</th>
            <th>离店日期</th>
            <th>联系电话</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${this.bookings.map(booking => {
            const statusInfo = this.getStatusLabel(booking.status);
            const isToday = booking.check_in_date === new Date().toISOString().split('T')[0];
            const canCheckIn = booking.status === 1;
            const canCheckOut = booking.status === 2;
            const room = booking.room || {};
            const user = booking.user || {};
            
            return `
              <tr>
                <td style="font-size: 12px;">${booking.booking_no}</td>
                <td>
                  <div>${user.username || '-'}</div>
                  <div style="font-size: 12px; color: #999;">${user.nickname || ''}</div>
                </td>
                <td>${room.type_text || room.type || '-'} ${room.room_number || ''}</td>
                <td>
                  ${booking.check_in_date}
                  ${isToday ? '<span class="badge badge-warning" style="margin-left: 4px;">今日</span>' : ''}
                </td>
                <td>${booking.check_out_date}</td>
                <td>${booking.guest_phone || '-'}</td>
                <td><span class="badge ${statusInfo.class}">${booking.status_text || statusInfo.label}</span></td>
                <td>
                  ${canCheckIn ? `<button class="btn btn-sm btn-success" onclick="AdminCheckinPage.handleCheckIn(${booking.id})">办理入住</button>` : ''}
                  ${canCheckOut ? `<button class="btn btn-sm btn-warning" onclick="AdminCheckinPage.handleCheckOut(${booking.id})">办理退房</button>` : ''}
                  <button class="btn btn-sm btn-secondary" onclick="Router.navigate('/booking/detail', { booking_id: ${booking.id} })">详情</button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  },

  renderPagination() {
    const pagination = document.getElementById('pagination');
    const { page, total_pages } = this.pagination;
    
    if (total_pages <= 1) {
      pagination.innerHTML = '';
      return;
    }

    let html = '';
    
    html += `<button class="page-btn" ${page <= 1 ? 'disabled' : ''} onclick="AdminCheckinPage.goToPage(${page - 1})">上一页</button>`;
    
    for (let i = 1; i <= total_pages; i++) {
      if (i === 1 || i === total_pages || (i >= page - 2 && i <= page + 2)) {
        html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="AdminCheckinPage.goToPage(${i})">${i}</button>`;
      } else if (i === page - 3 || i === page + 3) {
        html += `<span style="padding: 8px;">...</span>`;
      }
    }
    
    html += `<button class="page-btn" ${page >= total_pages ? 'disabled' : ''} onclick="AdminCheckinPage.goToPage(${page + 1})">下一页</button>`;
    
    pagination.innerHTML = html;
  },

  applyFilters() {
    this.filter.status = document.getElementById('filterStatus').value;
    this.filter.keyword = document.getElementById('filterKeyword').value.trim();
    this.filter.page = 1;
    this.loadBookings();
  },

  goToPage(page) {
    if (page < 1 || page > this.pagination.total_pages) return;
    this.filter.page = page;
    this.loadBookings();
  },

  async handleCheckIn(bookingId) {
    if (!confirm('确定要为该预订办理入住吗？')) {
      return;
    }

    try {
      const result = await BookingApi.checkIn(bookingId);
      if (result.code === 0) {
        Toast.success('入住办理成功');
        this.loadStats();
        this.loadBookings();
      } else {
        Toast.error(result.msg || '操作失败');
      }
    } catch (error) {
      Toast.error('操作失败，请检查网络');
    }
  },

  async handleCheckOut(bookingId) {
    if (!confirm('确定要为该预订办理退房吗？')) {
      return;
    }

    try {
      const result = await BookingApi.checkOut(bookingId);
      if (result.code === 0) {
        Toast.success('退房办理成功');
        this.loadStats();
        this.loadBookings();
      } else {
        Toast.error(result.msg || '操作失败');
      }
    } catch (error) {
      Toast.error('操作失败，请检查网络');
    }
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
