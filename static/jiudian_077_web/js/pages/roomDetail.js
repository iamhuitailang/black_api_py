const RoomDetailPage = {
  room: null,

  render() {
    const app = document.getElementById('app');
    const params = Router.getParams();
    const roomId = params.room_id;

    app.innerHTML = `
      ${this.renderNavbar()}
      <div class="page-container">
        <div class="page-header">
          <h1 class="page-title">房间详情</h1>
          <button class="btn btn-secondary" onclick="Router.navigate('/')">返回列表</button>
        </div>
        
        <div id="roomDetail">
          <div class="loading">
            <div class="spinner"></div>
          </div>
        </div>
      </div>
    `;

    this.loadRoomDetail(roomId);
  },

  renderNavbar() {
    const user = TokenStorage.getUser();
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

  async loadRoomDetail(roomId) {
    const detailContainer = document.getElementById('roomDetail');
    
    try {
      const result = await RoomApi.getDetail(roomId);
      
      if (result.code === 0) {
        this.room = result.data;
        this.renderRoomDetail();
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

  renderRoomDetail() {
    const room = this.room;
    const detailContainer = document.getElementById('roomDetail');
    const features = Array.isArray(room.facilities) ? room.facilities : [];
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const user = TokenStorage.getUser();
    const isLoggedIn = TokenStorage.isLoggedIn();
    const defaultName = user?.nickname || user?.username || '';

    const canBook = room.status === 0;
    const statusBadge = canBook
      ? '<span class="badge badge-success">可预订</span>'
      : '<span class="badge badge-warning">暂不可预订</span>';

    detailContainer.innerHTML = `
      <div class="detail-section">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px;">
          <div>
            <h2 style="font-size: 24px; font-weight: 700; color: #333; margin-bottom: 8px;">${room.type_text || room.type}</h2>
            <p style="color: #999; margin-bottom: 8px;">${room.room_number} · ${room.floor}楼 · 约${room.area}㎡</p>
            ${statusBadge}
          </div>
          <div style="text-align: right;">
            <div style="font-size: 32px; font-weight: 700; color: #667eea;">¥${room.price}</div>
            <div style="color: #999; font-size: 14px;">每晚</div>
          </div>
        </div>

        <div class="image-gallery">
          ${Array(4).fill(0).map((_, i) => `<div class="gallery-item">🛏️</div>`).join('')}
        </div>
      </div>

      <div class="detail-section">
        <h3>房间描述</h3>
        <p style="color: #666; line-height: 1.8;">${room.description || '暂无描述'}</p>
      </div>

      <div class="detail-section">
        <h3>房间设施</h3>
        <div class="facility-tags">
          ${features.map(f => `
            <div class="facility-tag">
              <span>✓</span>
              <span>${f}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="detail-section">
        <h3>预订信息</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">床位数</span>
            <span class="detail-value">${room.bed_count ?? '-'}床</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">可住人数</span>
            <span class="detail-value">${room.max_guests ?? 2}人</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h3>立即预订</h3>
        ${isLoggedIn ? `
          <form id="bookingForm">
            <div class="detail-grid">
              <div class="form-group">
                <label class="form-label">入住日期 *</label>
                <input type="date" class="form-input" id="checkInDate" value="${today}" min="${today}" required>
              </div>
              <div class="form-group">
                <label class="form-label">离店日期 *</label>
                <input type="date" class="form-input" id="checkOutDate" value="${tomorrow}" min="${today}" required>
              </div>
              <div class="form-group">
                <label class="form-label">入住人姓名 *</label>
                <input type="text" class="form-input" id="guestName" value="${defaultName}" placeholder="请输入入住人姓名" required>
              </div>
              <div class="form-group">
                <label class="form-label">联系电话 *</label>
                <input type="tel" class="form-input" id="contactPhone" placeholder="请输入联系电话" required>
              </div>
              <div class="form-group">
                <label class="form-label">入住人数</label>
                <input type="number" class="form-input" id="guests" value="1" min="1" max="${room.max_guests || 10}" required>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">备注（选填）</label>
              <textarea class="form-textarea" id="specialRequest" placeholder="如有特殊要求请在此说明..."></textarea>
            </div>
            <div id="availabilityMsg" style="display:none; padding: 12px; border-radius: 8px; margin-bottom: 16px;"></div>
            <div id="pricePreview" style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #666;">共 <span id="nightCount">1</span> 晚</span>
                <span style="font-size: 24px; font-weight: 700; color: #667eea;">¥<span id="totalPrice">${room.price}</span></span>
              </div>
            </div>
            <button type="submit" class="btn btn-primary btn-block" id="bookBtn" ${!canBook ? 'disabled' : ''}>
              ${canBook ? '立即预订' : '该房间暂不可预订'}
            </button>
          </form>
        ` : `
          <div style="text-align: center; padding: 30px; background: #f8f9fa; border-radius: 8px;">
            <p style="color: #666; margin-bottom: 16px;">请先登录后再进行预订</p>
            <button class="btn btn-primary" onclick="Router.navigate('/login')">去登录</button>
          </div>
        `}
      </div>
    `;

    if (isLoggedIn) {
      this.bindFormEvents();
    }
  },

  bindFormEvents() {
    const checkInDate = document.getElementById('checkInDate');
    const checkOutDate = document.getElementById('checkOutDate');
    const guests = document.getElementById('guests');
    const bookingForm = document.getElementById('bookingForm');

    if (!checkInDate || !checkOutDate || !guests || !bookingForm) return;

    const updatePrice = () => {
      const checkIn = new Date(checkInDate.value);
      const checkOut = new Date(checkOutDate.value);
      const nights = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
      const total = nights * this.room.price;
      
      const nightCountEl = document.getElementById('nightCount');
      const totalPriceEl = document.getElementById('totalPrice');
      if (nightCountEl) nightCountEl.textContent = nights;
      if (totalPriceEl) totalPriceEl.textContent = total;
    };

    checkInDate.addEventListener('change', updatePrice);
    checkOutDate.addEventListener('change', updatePrice);

    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleBooking();
    });
  },

  mounted() {
  },

  async handleBooking() {
    if (!TokenStorage.isLoggedIn()) {
      Toast.error('请先登录');
      Router.navigate('/login');
      return;
    }

    const checkInDateEl = document.getElementById('checkInDate');
    const checkOutDateEl = document.getElementById('checkOutDate');
    const guestsEl = document.getElementById('guests');
    const contactPhoneEl = document.getElementById('contactPhone');
    const guestNameEl = document.getElementById('guestName');
    const specialRequestEl = document.getElementById('specialRequest');
    const bookBtn = document.getElementById('bookBtn');

    if (!checkInDateEl || !checkOutDateEl || !guestsEl || !contactPhoneEl || !guestNameEl) {
      Toast.error('页面加载异常，请刷新重试');
      return;
    }

    const checkInDate = checkInDateEl.value;
    const checkOutDate = checkOutDateEl.value;
    const guestsCount = parseInt(guestsEl.value);
    const guestPhone = contactPhoneEl.value.trim();
    const guestName = guestNameEl.value.trim();
    const remark = specialRequestEl ? specialRequestEl.value.trim() : '';

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    if (checkOut <= checkIn) {
      Toast.error('离店日期必须晚于入住日期');
      return;
    }

    if (!guestName) {
      Toast.error('请输入入住人姓名');
      return;
    }

    if (!guestPhone) {
      Toast.error('请输入联系电话');
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(guestPhone)) {
      Toast.error('请输入正确的手机号');
      return;
    }

    bookBtn.disabled = true;
    bookBtn.textContent = '预订中...';

    try {
      const result = await BookingApi.create({
        room_id: this.room.id,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        guests_count: guestsCount,
        guest_name: guestName,
        guest_phone: guestPhone,
        remark: remark
      });

      if (result.code === 0) {
        Toast.success('预订成功！');
        Router.navigate('/my-bookings');
      } else {
        Toast.error(result.msg || '预订失败');
      }
    } catch (error) {
      Toast.error('预订失败，请检查网络');
    } finally {
      if (bookBtn) {
        bookBtn.disabled = false;
        bookBtn.textContent = '立即预订';
      }
    }
  }
};
