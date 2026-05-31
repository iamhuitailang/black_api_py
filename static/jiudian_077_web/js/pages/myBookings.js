const MyBookingsPage = {
  bookings: [],
  statusList: [],
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

    const app = document.getElementById('app');
    
    app.innerHTML = `
      ${this.renderNavbar()}
      <div class="page-container">
        <div class="page-header">
          <h1 class="page-title">📋 我的预订</h1>
        </div>
        
        <div class="filter-bar">
          <div class="filter-item">
            <label class="form-label">预订状态</label>
            <select class="form-select" id="filterStatus">
              <option value="">全部状态</option>
              ${this.statusList.map(s => `<option value="${s.key}" ${this.filter.status == s.key ? 'selected' : ''}>${s.label}</option>`).join('')}
            </select>
          </div>
          <div class="filter-item">
            <button class="btn btn-primary" id="searchBtn">搜索</button>
          </div>
        </div>
        
        <div id="bookingList">
          <div class="loading">
            <div class="spinner"></div>
          </div>
        </div>
        
        <div id="pagination" class="pagination"></div>
      </div>
    `;

    this.bindEvents();
    this.loadStatusList();
    this.loadBookings();
  },

  renderNavbar() {
    const user = TokenStorage.getUser();
    
    return `
      <nav class="navbar">
        <div class="navbar-container">
          <div class="navbar-logo" onclick="Router.navigate('/')">🏨 酒店预订</div>
          <div class="navbar-menu">
            <a href="javascript:;" class="navbar-link" onclick="Router.navigate('/')">首页</a>
            <a href="javascript:;" class="navbar-link active" onclick="Router.navigate('/my-bookings')">我的预订</a>
            <a href="javascript:;" class="navbar-link" onclick="Router.navigate('/messages')">消息</a>
            <a href="javascript:;" class="navbar-link" onclick="Router.navigate('/profile')">个人中心</a>
          </div>
          <div class="navbar-user">
            <div class="dropdown">
              <div class="avatar" onclick="this.nextElementSibling.classList.toggle('show')">
                ${user?.nickname?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </div>
              <div class="dropdown-menu">
                <div class="dropdown-item" onclick="Router.navigate('/profile')">个人资料</div>
                <div class="dropdown-item" onclick="MyBookingsPage.handleLogout()">退出登录</div>
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
      1: { label: '已确认', class: 'badge-info' },
      2: { label: '已入住', class: 'badge-success' },
      3: { label: '已退房', class: 'badge-secondary' },
      4: { label: '已取消', class: 'badge-danger' }
    };
    return statusMap[status] || { label: status, class: 'badge-secondary' };
  },

  async loadStatusList() {
    try {
      const result = await BookingApi.getStatusList();
      if (result.code === 0 && result.data) {
        this.statusList = result.data;
        const select = document.getElementById('filterStatus');
        if (select) {
          const currentValue = select.value;
          select.innerHTML = '<option value="">全部状态</option>' + 
            this.statusList.map(s => `<option value="${s.key}">${s.label}</option>`).join('');
          select.value = currentValue;
        }
      }
    } catch (error) {
      console.error('加载状态列表失败:', error);
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
        ...this.filter,
        page: this.filter.page,
        page_size: this.filter.page_size
      };
      
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const result = await BookingApi.getMy(params);
      
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
          <div class="empty-icon">📋</div>
          <div class="empty-text">暂无预订记录</div>
          <div class="empty-desc">
            <button class="btn btn-primary" onclick="Router.navigate('/')" style="margin-top: 16px;">去预订房间</button>
          </div>
        </div>
      `;
      return;
    }

    bookingList.innerHTML = `
      <div class="message-list">
        ${this.bookings.map(booking => this.renderBookingCard(booking)).join('')}
      </div>
    `;
    
    document.querySelectorAll('.cancel-booking-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const bookingId = btn.dataset.bookingId;
        this.handleCancelBooking(bookingId);
      });
    });
  },

  renderBookingCard(booking) {
    const statusInfo = this.getStatusLabel(booking.status);
    const checkIn = new Date(booking.check_in_date);
    const checkOut = new Date(booking.check_out_date);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const canCancel = booking.status === 0 || booking.status === 1;
    const room = booking.room || {};
    
    return `
      <div class="detail-section" style="cursor: pointer;" onclick="Router.navigate('/booking/detail', { booking_id: ${booking.id} })">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
          <div>
            <h3 style="margin-bottom: 8px;">${room.type_text || room.type || '房间'} · ${room.room_number || ''}</h3>
            <span class="badge ${statusInfo.class}">${booking.status_text || statusInfo.label}</span>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 20px; font-weight: 700; color: #667eea;">¥${booking.total_price}</div>
            <div style="color: #999; font-size: 12px;">共${nights}晚</div>
          </div>
        </div>
        
        <div class="detail-grid" style="margin-bottom: 16px;">
          <div class="detail-item">
            <span class="detail-label">入住日期</span>
            <span class="detail-value">${booking.check_in_date}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">离店日期</span>
            <span class="detail-value">${booking.check_out_date}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">入住人数</span>
            <span class="detail-value">${booking.guests_count || '-'}人</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">预订编号</span>
            <span class="detail-value" style="font-size: 12px;">${booking.booking_no}</span>
          </div>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="color: #999; font-size: 12px;">
            预订时间：${new Date(booking.created_at).toLocaleString()}
          </div>
          <div>
            ${canCancel ? `
              <button class="btn btn-sm btn-danger cancel-booking-btn" data-booking-id="${booking.id}" onclick="event.stopPropagation();">
                取消预订
              </button>
            ` : ''}
          </div>
        </div>
      </div>
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
    
    html += `<button class="page-btn" ${page <= 1 ? 'disabled' : ''} onclick="MyBookingsPage.goToPage(${page - 1})">上一页</button>`;
    
    for (let i = 1; i <= total_pages; i++) {
      if (i === 1 || i === total_pages || (i >= page - 2 && i <= page + 2)) {
        html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="MyBookingsPage.goToPage(${i})">${i}</button>`;
      } else if (i === page - 3 || i === page + 3) {
        html += `<span style="padding: 8px;">...</span>`;
      }
    }
    
    html += `<button class="page-btn" ${page >= total_pages ? 'disabled' : ''} onclick="MyBookingsPage.goToPage(${page + 1})">下一页</button>`;
    
    pagination.innerHTML = html;
  },

  applyFilters() {
    this.filter.status = document.getElementById('filterStatus').value;
    this.filter.page = 1;
    this.loadBookings();
  },

  goToPage(page) {
    if (page < 1 || page > this.pagination.total_pages) return;
    this.filter.page = page;
    this.loadBookings();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  async handleCancelBooking(bookingId) {
    if (!confirm('确定要取消这个预订吗？')) {
      return;
    }

    try {
      const result = await BookingApi.cancel(bookingId);
      if (result.code === 0) {
        Toast.success('预订已取消');
        this.loadBookings();
      } else {
        Toast.error(result.msg || '取消失败');
      }
    } catch (error) {
      Toast.error('取消失败，请检查网络');
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
