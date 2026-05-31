const AdminRoomsPage = {
  rooms: [],
  roomTypes: [],
  filter: {
    status: '',
    room_type: '',
    page: 1,
    page_size: 10
  },
  pagination: {
    total: 0,
    page: 1,
    page_size: 10,
    total_pages: 0
  },
  currentRoom: null,
  modalMode: 'create',

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
      ${this.renderNavbar('rooms')}
      <div class="page-container">
        <div class="page-header">
          <h1 class="page-title">🏠 房间管理</h1>
          <button class="btn btn-primary" id="addRoomBtn">+ 添加房间</button>
        </div>
        
        <div class="filter-bar">
          <div class="filter-item">
            <label class="form-label">房间类型</label>
            <select class="form-select" id="filterRoomType">
              <option value="">全部类型</option>
              ${this.roomTypes.map(type => `<option value="${type.key}">${type.label}</option>`).join('')}
            </select>
          </div>
          <div class="filter-item">
            <label class="form-label">房间状态</label>
            <select class="form-select" id="filterStatus">
              <option value="">全部状态</option>
              <option value="0">空闲</option>
              <option value="1">已入住</option>
              <option value="2">维护中</option>
              <option value="3">清洁中</option>
            </select>
          </div>
          <div class="filter-item">
            <button class="btn btn-primary" id="searchBtn">搜索</button>
          </div>
        </div>
        
        <div class="card">
          <div class="card-body" id="roomList">
            <div class="loading">
              <div class="spinner"></div>
            </div>
          </div>
        </div>
        
        <div id="pagination" class="pagination"></div>
      </div>
      
      <div class="modal-overlay" id="roomModal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title" id="modalTitle">添加房间</h3>
            <button class="modal-close" onclick="AdminRoomsPage.closeModal()">×</button>
          </div>
          <div class="modal-body">
            <form id="roomForm">
              <div class="form-group">
                <label class="form-label">房间号 *</label>
                <input type="text" class="form-input" id="roomNumber" placeholder="如：101">
              </div>
              <div class="form-group">
                <label class="form-label">房间类型 *</label>
                <select class="form-select" id="roomType">
                  <option value="">请选择房间类型</option>
                  <option value="single">单人间</option>
                  <option value="double">双人间</option>
                  <option value="twin">标准间</option>
                  <option value="suite">套房</option>
                  <option value="family">家庭房</option>
                  <option value="deluxe">豪华间</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">楼层</label>
                <input type="number" class="form-input" id="floor" placeholder="如：1">
              </div>
              <div class="form-group">
                <label class="form-label">面积 (㎡)</label>
                <input type="number" class="form-input" id="area" placeholder="如：25">
              </div>
              <div class="form-group">
                <label class="form-label">价格 (元/晚) *</label>
                <input type="number" class="form-input" id="price" placeholder="如：199">
              </div>
              <div class="form-group">
                <label class="form-label">可住人数</label>
                <input type="number" class="form-input" id="maxGuests" placeholder="如：2" value="2">
              </div>
              <div class="form-group">
                <label class="form-label">床位数</label>
                <input type="number" class="form-input" id="bedType" placeholder="如：1" value="1">
              </div>
              <div class="form-group">
                <label class="form-label">房间设施（用逗号分隔）</label>
                <input type="text" class="form-input" id="features" placeholder="如：WiFi,空调,电视,独立卫浴">
              </div>
              <div class="form-group">
                <label class="form-label">房间描述</label>
                <textarea class="form-textarea" id="description" placeholder="请输入房间描述"></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">房间状态</label>
                <select class="form-select" id="roomStatus">
                  <option value="0">可预订</option>
                  <option value="1">已占用</option>
                  <option value="2">维护中</option>
                  <option value="3">清洁中</option>
                </select>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="AdminRoomsPage.closeModal()">取消</button>
            <button class="btn btn-primary" id="saveRoomBtn">保存</button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.loadRoomTypes();
    this.loadRooms();
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
                <div class="dropdown-item" onclick="AdminRoomsPage.handleLogout()">退出登录</div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    `;
  },

  bindEvents() {
    document.getElementById('addRoomBtn').addEventListener('click', () => this.openCreateModal());
    document.getElementById('searchBtn').addEventListener('click', () => this.applyFilters());
    document.getElementById('saveRoomBtn').addEventListener('click', () => this.handleSaveRoom());
    
    document.getElementById('filterRoomType').addEventListener('change', () => {
      this.filter.room_type = document.getElementById('filterRoomType').value;
    });
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

  async loadRoomTypes() {
    try {
      const result = await RoomApi.getTypes();
      if (result.code === 0 && result.data) {
        this.roomTypes = result.data;
        const select = document.getElementById('filterRoomType');
        if (select) {
          select.innerHTML = '<option value="">全部类型</option>' + 
            this.roomTypes.map(type => `<option value="${type.key}">${type.label}</option>`).join('');
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

      const result = await RoomApi.getList(params);
      
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

  getStatusLabel(status) {
    const statusMap = {
      0: { label: '空闲', class: 'badge-success' },
      1: { label: '已入住', class: 'badge-warning' },
      2: { label: '维护中', class: 'badge-danger' },
      3: { label: '清洁中', class: 'badge-info' }
    };
    return statusMap[status] || { label: status, class: 'badge-secondary' };
  },

  renderRooms() {
    const roomList = document.getElementById('roomList');
    
    if (this.rooms.length === 0) {
      roomList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🏠</div>
          <div class="empty-text">暂无房间</div>
          <div class="empty-desc">点击上方按钮添加房间</div>
        </div>
      `;
      return;
    }

    roomList.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>房间号</th>
            <th>房间类型</th>
            <th>楼层</th>
            <th>面积</th>
            <th>价格</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${this.rooms.map(room => {
            const statusInfo = this.getStatusLabel(room.status);
            return `
              <tr>
                <td>${room.room_number}</td>
                <td>${room.type_text || room.type}</td>
                <td>${room.floor}楼</td>
                <td>${room.area || '-'}㎡</td>
                <td>¥${room.price}/晚</td>
                <td><span class="badge ${statusInfo.class}">${statusInfo.label}</span></td>
                <td>
                  <button class="btn btn-sm btn-primary" onclick="AdminRoomsPage.openEditModal(${room.id})">编辑</button>
                  <button class="btn btn-sm btn-danger" onclick="AdminRoomsPage.handleDeleteRoom(${room.id})">删除</button>
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
    
    html += `<button class="page-btn" ${page <= 1 ? 'disabled' : ''} onclick="AdminRoomsPage.goToPage(${page - 1})">上一页</button>`;
    
    for (let i = 1; i <= total_pages; i++) {
      if (i === 1 || i === total_pages || (i >= page - 2 && i <= page + 2)) {
        html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="AdminRoomsPage.goToPage(${i})">${i}</button>`;
      } else if (i === page - 3 || i === page + 3) {
        html += `<span style="padding: 8px;">...</span>`;
      }
    }
    
    html += `<button class="page-btn" ${page >= total_pages ? 'disabled' : ''} onclick="AdminRoomsPage.goToPage(${page + 1})">下一页</button>`;
    
    pagination.innerHTML = html;
  },

  applyFilters() {
    this.filter.room_type = document.getElementById('filterRoomType').value;
    this.filter.status = document.getElementById('filterStatus').value;
    this.filter.page = 1;
    this.loadRooms();
  },

  goToPage(page) {
    if (page < 1 || page > this.pagination.total_pages) return;
    this.filter.page = page;
    this.loadRooms();
  },

  openCreateModal() {
    this.modalMode = 'create';
    this.currentRoom = null;
    document.getElementById('modalTitle').textContent = '添加房间';
    document.getElementById('roomForm').reset();
    document.getElementById('maxGuests').value = 2;
    document.getElementById('bedType').value = 1;
    document.getElementById('roomStatus').value = '0';
    document.getElementById('roomModal').classList.add('show');
  },

  openEditModal(roomId) {
    const room = this.rooms.find(r => r.id === roomId);
    if (!room) return;

    this.modalMode = 'edit';
    this.currentRoom = room;
    document.getElementById('modalTitle').textContent = '编辑房间';
    
    document.getElementById('roomNumber').value = room.room_number || '';
    document.getElementById('roomType').value = room.type || '';
    document.getElementById('floor').value = room.floor ?? '';
    document.getElementById('area').value = room.area ?? '';
    document.getElementById('price').value = room.price ?? '';
    document.getElementById('maxGuests').value = room.max_guests ?? 2;
    document.getElementById('bedType').value = room.bed_count ?? 1;
    const facilities = Array.isArray(room.facilities) ? room.facilities : (room.facilities ? room.facilities.split(',') : []);
    document.getElementById('features').value = facilities.join(',');
    document.getElementById('description').value = room.description || '';
    document.getElementById('roomStatus').value = String(room.status ?? 0);
    
    document.getElementById('roomModal').classList.add('show');
  },

  closeModal() {
    document.getElementById('roomModal').classList.remove('show');
  },

  async handleSaveRoom() {
    const roomNumberEl = document.getElementById('roomNumber');
    const roomTypeEl = document.getElementById('roomType');
    const floorEl = document.getElementById('floor');
    const areaEl = document.getElementById('area');
    const priceEl = document.getElementById('price');
    const maxGuestsEl = document.getElementById('maxGuests');
    const bedTypeEl = document.getElementById('bedType');
    const featuresEl = document.getElementById('features');
    const descriptionEl = document.getElementById('description');
    const roomStatusEl = document.getElementById('roomStatus');

    if (!roomNumberEl || !roomTypeEl || !priceEl) {
      Toast.error('页面加载异常，请刷新重试');
      return;
    }

    const data = {
      room_number: roomNumberEl.value.trim(),
      type: roomTypeEl.value.trim(),
      floor: parseInt(floorEl?.value) || 1,
      area: parseFloat(areaEl?.value) || 0,
      price: parseFloat(priceEl.value) || 0,
      max_guests: parseInt(maxGuestsEl?.value) || 2,
      bed_count: parseInt(bedTypeEl?.value) || 1,
      facilities: featuresEl?.value.split(',').map(f => f.trim()).filter(f => f) || [],
      description: descriptionEl?.value.trim() || '',
      status: parseInt(roomStatusEl?.value) ?? 0
    };

    if (!data.room_number) {
      Toast.error('请输入房间号');
      return;
    }

    if (!data.type) {
      Toast.error('请输入房间类型');
      return;
    }

    if (!data.price || data.price <= 0) {
      Toast.error('请输入有效的价格');
      return;
    }

    const saveBtn = document.getElementById('saveRoomBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner" style="width: 16px; height: 16px; border-width: 2px; margin-right: 8px; display: inline-block; vertical-align: middle;"></span> 保存中...';

    try {
      let result;
      if (this.modalMode === 'create') {
        result = await RoomApi.create(data);
      } else {
        result = await RoomApi.update(this.currentRoom.id, data);
      }

      if (result.code === 0) {
        Toast.success(this.modalMode === 'create' ? '添加成功' : '修改成功');
        this.closeModal();
        this.loadRoomTypes();
        this.loadRooms();
      } else {
        Toast.error(result.msg || '保存失败');
      }
    } catch (error) {
      Toast.error('保存失败，请检查网络');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '保存';
    }
  },

  async handleDeleteRoom(roomId) {
    if (!confirm('确定要删除这个房间吗？')) {
      return;
    }

    try {
      const result = await RoomApi.delete(roomId);
      if (result.code === 0) {
        Toast.success('删除成功');
        this.loadRooms();
      } else {
        Toast.error(result.msg || '删除失败');
      }
    } catch (error) {
      Toast.error('删除失败，请检查网络');
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
