const BookingDetailPage = {
  booking: null,

  render() {
    if (!TokenStorage.isLoggedIn()) {
      Toast.error('请先登录');
      Router.navigate('/login');
      return;
    }

    const app = document.getElementById('app');
    const params = Router.getParams();
    const bookingId = params.booking_id;
    
    app.innerHTML = `
      ${this.renderNavbar()}
      <div class="page-container">
        <div class="page-header">
          <h1 class="page-title">预订详情</h1>
          <button class="btn btn-secondary" onclick="Router.navigate('/my-bookings')">返回</button>
        </div>
        
        <div id="bookingDetail">
          <div class="loading">
            <div class="spinner"></div>
          </div>
        </div>
      </div>
    `;

    this.loadBookingDetail(bookingId);
  },

  renderNavbar() {
    const user = TokenStorage.getUser();
    const isAdmin = TokenStorage.isAdmin();
    const isLoggedIn = TokenStorage.isLoggedIn();
    
    return `
      <nav class="navbar">
        <div class="navbar-container">
          <div class="navbar-logo" onclick="Router.navigate('/')">🏨 酒店预订</div>
          <div class="navbar-menu">
            <a href="javascript:;" class="navbar-link" onclick="Router.navigate('/')">首页</a>
            ${isLoggedIn ? `
              <a href="javascript:;" class="navbar-link" onclick="Router.navigate('/my-bookings')">我的预订</a>
              <a href="javascript:;" class="navbar-link" onclick="Router.navigate('/messages')">消息</a>
              <a href="javascript:;" class="navbar-link" onclick="Router.navigate('/profile')">个人中心</a>
            ` : ''}
            ${isAdmin ? `
              <a href="javascript:;" class="navbar-link" onclick="Router.navigate('/admin/dashboard')">管理后台</a>
            ` : ''}
          </div>
          <div class="navbar-user">
            ${isLoggedIn ? `
              <div class="avatar">
                ${user?.nickname?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </div>
            ` : `
              <button class="btn btn-sm btn-primary" onclick="Router.navigate('/login')">登录</button>
            `}
          </div>
        </div>
      </nav>
    `;
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

  async loadBookingDetail(bookingId) {
    const detailContainer = document.getElementById('bookingDetail');
    
    try {
      const result = await BookingApi.getDetail(bookingId);
      
      if (result.code === 0) {
        this.booking = result.data;
        this.renderBookingDetail();
      } else {
        detailContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">😕</div>
            <div class="empty-text">加载失败</div>
            <div class="empty-desc">${result.msg || '请稍后重试'}</div>
          </div>
        `;
      }
    } catch (error) {
      detailContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">😕</div>
          <div class="empty-text">网络错误</div>
          <div class="empty-desc">请检查网络连接</div>
        </div>
      `;
    }
  },

  renderBookingDetail() {
    const booking = this.booking;
    const detailContainer = document.getElementById('bookingDetail');
    const statusInfo = this.getStatusLabel(booking.status);
    const checkIn = new Date(booking.check_in_date);
    const checkOut = new Date(booking.check_out_date);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const isAdmin = TokenStorage.isAdmin();
    const room = booking.room || {};
    
    const canCancel = !isAdmin && (booking.status === 0 || booking.status === 1);
    const canConfirm = isAdmin && booking.status === 0;
    const canCheckIn = isAdmin && booking.status === 1;
    const canCheckOut = isAdmin && booking.status === 2;
    
    detailContainer.innerHTML = `
      <div class="detail-section">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px;">
          <div>
            <h2 style="font-size: 24px; font-weight: 700; color: #333; margin-bottom: 8px;">预订详情</h2>
            <p style="color: #999; margin-bottom: 8px;">预订编号：${booking.booking_no}</p>
            <span class="badge ${statusInfo.class}">${booking.status_text || statusInfo.label}</span>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 32px; font-weight: 700; color: #667eea;">¥${booking.total_price}</div>
            <div style="color: #999; font-size: 14px;">共${nights}晚</div>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h3>房间信息</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">房间类型</span>
            <span class="detail-value">${room.type_text || room.type || '-'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">房间号</span>
            <span class="detail-value">${room.room_number || '-'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">楼层</span>
            <span class="detail-value">${room.floor || '-'}楼</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">床位数</span>
            <span class="detail-value">${room.bed_count || '-'}</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h3>预订信息</h3>
        <div class="detail-grid">
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
            <span class="detail-label">联系电话</span>
            <span class="detail-value">${booking.guest_phone || '-'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">客人姓名</span>
            <span class="detail-value">${booking.guest_name || '-'}</span>
          </div>
        </div>
      </div>

      ${booking.remark ? `
        <div class="detail-section">
          <h3>备注</h3>
          <p style="color: #666; line-height: 1.8;">${booking.remark}</p>
        </div>
      ` : ''}

      ${isAdmin ? `
        <div class="detail-section">
          <h3>用户信息</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">用户名</span>
              <span class="detail-value">${booking.user?.username || '-'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">昵称</span>
              <span class="detail-value">${booking.user?.nickname || '-'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">手机号</span>
              <span class="detail-value">${booking.user?.phone || '-'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">用户ID</span>
              <span class="detail-value">${booking.user_id || '-'}</span>
            </div>
          </div>
        </div>
      ` : ''}

      <div class="detail-section">
        <h3>操作</h3>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          ${canCancel ? `
            <button class="btn btn-danger" onclick="BookingDetailPage.handleCancel()">取消预订</button>
          ` : ''}
          ${canConfirm ? `
            <button class="btn btn-success" onclick="BookingDetailPage.handleConfirm()">确认预订</button>
          ` : ''}
          ${canCheckIn ? `
            <button class="btn btn-primary" onclick="BookingDetailPage.handleCheckIn()">办理入住</button>
          ` : ''}
          ${canCheckOut ? `
            <button class="btn btn-warning" onclick="BookingDetailPage.handleCheckOut()">办理退房</button>
          ` : ''}
        </div>
      </div>

      <div class="detail-section">
        <h3>预订时间</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">创建时间</span>
            <span class="detail-value">${new Date(booking.created_at).toLocaleString()}</span>
          </div>
        </div>
      </div>
    `;
  },

  async handleCancel() {
    if (!confirm('确定要取消这个预订吗？')) {
      return;
    }

    try {
      const result = await BookingApi.cancel(this.booking.id);
      if (result.code === 0) {
        Toast.success('预订已取消');
        this.loadBookingDetail(this.booking.id);
      } else {
        Toast.error(result.msg || '操作失败');
      }
    } catch (error) {
      Toast.error('操作失败，请检查网络');
    }
  },

  async handleConfirm() {
    if (!confirm('确定要确认这个预订吗？')) {
      return;
    }

    try {
      const result = await BookingApi.confirm(this.booking.id);
      if (result.code === 0) {
        Toast.success('预订已确认');
        this.loadBookingDetail(this.booking.id);
      } else {
        Toast.error(result.msg || '操作失败');
      }
    } catch (error) {
      Toast.error('操作失败，请检查网络');
    }
  },

  async handleCheckIn() {
    if (!confirm('确定要办理入住吗？')) {
      return;
    }

    try {
      const result = await BookingApi.checkIn(this.booking.id);
      if (result.code === 0) {
        Toast.success('入住办理成功');
        this.loadBookingDetail(this.booking.id);
      } else {
        Toast.error(result.msg || '操作失败');
      }
    } catch (error) {
      Toast.error('操作失败，请检查网络');
    }
  },

  async handleCheckOut() {
    if (!confirm('确定要办理退房吗？')) {
      return;
    }

    try {
      const result = await BookingApi.checkOut(this.booking.id);
      if (result.code === 0) {
        Toast.success('退房办理成功');
        this.loadBookingDetail(this.booking.id);
      } else {
        Toast.error(result.msg || '操作失败');
      }
    } catch (error) {
      Toast.error('操作失败，请检查网络');
    }
  }
};
