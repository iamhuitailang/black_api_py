const HomePage = {
  rooms: [],
  roomTypes: [],
  filter: {
    room_type: '',
    min_price: '',
    max_price: '',
    check_in_date: '',
    check_out_date: '',
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
    const app = document.getElementById('app');
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    app.innerHTML = `
      ${this.renderNavbar()}
      <div class="page-container">
        <div class="page-header">
          <h1 class="page-title">🏨 房间列表</h1>
        </div>
        
        <div class="filter-bar">
          <div class="filter-item">
            <label class="form-label">房间类型</label>
            <select class="form-select" id="filterRoomType">
              <option value="">全部类型</option>
              ${this.roomTypes.map(type => `<option value="${type.key}" ${this.filter.room_type === type.key ? 'selected' : ''}>${type.label}</option>`).join('')}
            </select>
          </div>
          <div class="filter-item">
            <label class="form-label">入住日期</label>
            <input type="date" class="form-input" id="filterCheckIn" value="${this.filter.check_in_date || today}" min="${today}">
          </div>
          <div class="filter-item">
            <label class="form-label">离店日期</label>
            <input type="date" class="form-input" id="filterCheckOut" value="${this.filter.check_out_date || tomorrow}" min="${today}">
          </div>
          <div class="filter-item">
            <label class="form-label">最低价格</label>
            <input type="number" class="form-input" id="filterMinPrice" placeholder="最低价" value="${this.filter.min_price}" min="0">
          </div>
          <div class="filter-item">
            <label class="form-label">最高价格</label>
            <input type="number" class="form-input" id="filterMaxPrice" placeholder="最高价" value="${this.filter.max_price}" min="0">
          </div>
          <div class="filter-item">
            <button class="btn btn-primary" id="searchBtn">搜索</button>
          </div>
        </div>
        
        <div id="roomList">
          <div class="loading">
            <div class="spinner"></div>
          </div>
        </div>
        
        <div id="pagination" class="pagination"></div>
      </div>
    `;
    
    this.bindEvents();
    this.loadRoomTypes();
    this.loadRooms();
  },

  renderNavbar() {
    const user = TokenStorage.getUser();
    const isLoggedIn = TokenStorage.isLoggedIn();
    
    return `
      <nav class="navbar">
        <div class="navbar-container">
          <div class="navbar-logo" onclick="Router.navigate('/')">🏨 酒店预订</div>
          <div class="navbar-menu">
            <a href="javascript:;" class="navbar-link active" onclick="Router.navigate('/')">首页</a>
            ${isLoggedIn ? `
              <a href="javascript:;" class="navbar-link" onclick="Router.navigate('/my-bookings')">我的预订</a>
              <a href="javascript:;" class="navbar-link" onclick="Router.navigate('/messages')">消息</a>
              <a href="javascript:;" class="navbar-link" onclick="Router.navigate('/profile')">个人中心</a>
            ` : ''}
          </div>
          <div class="navbar-user">
            ${isLoggedIn ? `
              <div class="dropdown">
                <div class="avatar" onclick="this.nextElementSibling.classList.toggle('show')">
                  ${user?.nickname?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </div>
                <div class="dropdown-menu">
                  <div class="dropdown-item" onclick="Router.navigate('/profile')">个人资料</div>
                  <div class="dropdown-item" onclick="HomePage.handleLogout()">退出登录</div>
                </div>
              </div>
            ` : `
              <button class="btn btn-sm btn-primary" onclick="Router.navigate('/login')">登录</button>
              <button class="btn btn-sm btn-secondary" onclick="Router.navigate('/register')">注册</button>
            `}
          </div>
        </div>
      </nav>
    `;
  },

  bindEvents() {
    document.getElementById('searchBtn').addEventListener('click', () => this.applyFilters());
    document.getElementById('filterRoomType').addEventListener('change', () => {
      this.filter.room_type = document.getElementById('filterRoomType').value;
    });
    document.getElementById('filterCheckIn').addEventListener('change', () => {
      this.filter.check_in_date = document.getElementById('filterCheckIn').value;
    });
    document.getElementById('filterCheckOut').addEventListener('change', () => {
      this.filter.check_out_date = document.getElementById('filterCheckOut').value;
    });
    document.getElementById('filterMinPrice').addEventListener('change', () => {
      this.filter.min_price = document.getElementById('filterMinPrice').value;
    });
    document.getElementById('filterMaxPrice').addEventListener('change', () => {
      this.filter.max_price = document.getElementById('filterMaxPrice').value;
    });
    
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
          menu.classList.remove('show');
        });
      }
    });
  },

  async loadRoomTypes() {
    try {
      const result = await RoomApi.getTypes();
      if (result.code === 0 && result.data) {
        this.roomTypes = result.data;
        const select = document.getElementById('filterRoomType');
        if (select) {
          const currentValue = select.value;
          select.innerHTML = `<option value="">全部类型</option>` + 
            this.roomTypes.map(type => `<option value="${type.key}">${type.label}</option>`).join('');
          select.value = currentValue;
        }
      }
    } catch (error) {
      console.error('加载房间类型失败:', error);
    }
  },

  async loadRooms() {
    const roomList = document.getElementById('roomList');
    roomList.innerHTML = `
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

      const result = await RoomApi.getAvailable(params);
      
      if (result.code === 0) {
        this.rooms = result.data.items || [];
        this.pagination = {
          total: result.data.total || 0,
          page: result.data.page || 1,
          page_size: result.data.page_size || 10,
          total_pages: Math.ceil((result.data.total || 0) / (result.data.page_size || 10))
        };
        this.renderRooms();
        this.renderPagination();
      } else {
        roomList.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">😕</div>
            <div class="empty-text">加载失败</div>
            <div class="empty-desc">${result.msg || '请稍后重试'}</div>
          </div>
        `;
      }
    } catch (error) {
      roomList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">😕</div>
          <div class="empty-text">网络错误</div>
          <div class="empty-desc">请检查网络连接</div>
        </div>
      `;
    }
  },

  renderRooms() {
    const roomList = document.getElementById('roomList');
    
    if (this.rooms.length === 0) {
      roomList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🏠</div>
          <div class="empty-text">暂无可用房间</div>
          <div class="empty-desc">请尝试调整筛选条件</div>
        </div>
      `;
      return;
    }

    roomList.innerHTML = `
      <div class="room-grid">
        ${this.rooms.map(room => this.renderRoomCard(room)).join('')}
      </div>
    `;
    
    document.querySelectorAll('.room-card').forEach(card => {
      card.addEventListener('click', () => {
        const roomId = card.dataset.roomId;
        Router.navigate('/room/detail', { room_id: roomId });
      });
    });
  },

  renderRoomCard(room) {
    const facilities = Array.isArray(room.facilities) ? room.facilities.slice(0, 4) : [];
    const statusBadge = room.status === 0
      ? '<span class="badge badge-success">可预订</span>'
      : '<span class="badge badge-warning">已满房</span>';
    
    return `
      <div class="room-card" data-room-id="${room.id}">
        <div class="room-image">🛏️</div>
        <div class="room-info">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div>
              <div class="room-type">${room.type_text || room.type}</div>
              <div class="room-number">${room.room_number} · ${room.floor}楼</div>
            </div>
            ${statusBadge}
          </div>
          <div class="room-features">
            ${facilities.map(f => `<span class="room-feature">${f}</span>`).join('')}
          </div>
          <div class="room-price">¥${room.price} <span>/ 晚</span></div>
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
    
    html += `<button class="page-btn" ${page <= 1 ? 'disabled' : ''} onclick="HomePage.goToPage(${page - 1})">上一页</button>`;
    
    for (let i = 1; i <= total_pages; i++) {
      if (i === 1 || i === total_pages || (i >= page - 2 && i <= page + 2)) {
        html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="HomePage.goToPage(${i})">${i}</button>`;
      } else if (i === page - 3 || i === page + 3) {
        html += `<span style="padding: 8px;">...</span>`;
      }
    }
    
    html += `<button class="page-btn" ${page >= total_pages ? 'disabled' : ''} onclick="HomePage.goToPage(${page + 1})">下一页</button>`;
    
    pagination.innerHTML = html;
  },

  applyFilters() {
    this.filter.room_type = document.getElementById('filterRoomType').value;
    this.filter.check_in_date = document.getElementById('filterCheckIn').value;
    this.filter.check_out_date = document.getElementById('filterCheckOut').value;
    this.filter.min_price = document.getElementById('filterMinPrice').value;
    this.filter.max_price = document.getElementById('filterMaxPrice').value;
    this.filter.page = 1;
    this.loadRooms();
  },

  goToPage(page) {
    if (page < 1 || page > this.pagination.total_pages) return;
    this.filter.page = page;
    this.loadRooms();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
