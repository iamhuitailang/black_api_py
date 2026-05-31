const ProfilePage = {
  user: null,

  render() {
    if (!TokenStorage.isLoggedIn()) {
      Toast.error('请先登录');
      Router.navigate('/login');
      return;
    }

    const app = document.getElementById('app');
    this.user = TokenStorage.getUser();
    
    app.innerHTML = `
      ${this.renderNavbar()}
      <div class="page-container">
        <div class="page-header">
          <h1 class="page-title">👤 个人中心</h1>
        </div>
        
        <div class="detail-section">
          <h3>个人资料</h3>
          <form id="profileForm">
            <div class="detail-grid">
              <div class="form-group">
                <label class="form-label">用户名</label>
                <input type="text" class="form-input" id="username" value="${this.user?.username || ''}" disabled>
              </div>
              <div class="form-group">
                <label class="form-label">昵称</label>
                <input type="text" class="form-input" id="nickname" value="${this.user?.nickname || ''}" placeholder="请输入昵称">
              </div>
              <div class="form-group">
                <label class="form-label">手机号</label>
                <input type="tel" class="form-input" id="phone" value="${this.user?.phone || ''}" placeholder="请输入手机号">
              </div>
              <div class="form-group">
                <label class="form-label">角色</label>
                <input type="text" class="form-input" value="${this.user?.role === 'admin' ? '管理员' : '普通用户'}" disabled>
              </div>
            </div>
            <button type="submit" class="btn btn-primary" id="saveProfileBtn">保存修改</button>
          </form>
        </div>
        
        <div class="detail-section">
          <h3>修改密码</h3>
          <form id="passwordForm">
            <div class="form-group">
              <label class="form-label">原密码</label>
              <input type="password" class="form-input" id="oldPassword" placeholder="请输入原密码">
            </div>
            <div class="form-group">
              <label class="form-label">新密码</label>
              <input type="password" class="form-input" id="newPassword" placeholder="请输入新密码（至少6位）">
            </div>
            <div class="form-group">
              <label class="form-label">确认新密码</label>
              <input type="password" class="form-input" id="confirmNewPassword" placeholder="请再次输入新密码">
            </div>
            <button type="submit" class="btn btn-warning" id="changePasswordBtn">修改密码</button>
          </form>
        </div>
        
        ${this.user?.role === 'admin' ? `
          <div class="detail-section">
            <h3>管理员功能</h3>
            <p style="color: #666; margin-bottom: 16px;">您是管理员，可以进入管理后台进行房间管理、预订管理等操作。</p>
            <button class="btn btn-success" onclick="Router.navigate('/admin/dashboard')">进入管理后台</button>
          </div>
        ` : ''}
        
        <div class="detail-section">
          <h3>账户操作</h3>
          <button class="btn btn-danger" id="logoutBtn">退出登录</button>
        </div>
      </div>
    `;

    this.bindEvents();
    this.loadUserInfo();
  },

  renderNavbar() {
    const user = TokenStorage.getUser();
    
    return `
      <nav class="navbar">
        <div class="navbar-container">
          <div class="navbar-logo" onclick="Router.navigate('/')">🏨 酒店预订</div>
          <div class="navbar-menu">
            <a href="javascript:;" class="navbar-link" onclick="Router.navigate('/')">首页</a>
            <a href="javascript:;" class="navbar-link" onclick="Router.navigate('/my-bookings')">我的预订</a>
            <a href="javascript:;" class="navbar-link" onclick="Router.navigate('/messages')">消息</a>
            <a href="javascript:;" class="navbar-link active" onclick="Router.navigate('/profile')">个人中心</a>
          </div>
          <div class="navbar-user">
            <div class="avatar">
              ${user?.nickname?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </div>
          </div>
        </div>
      </nav>
    `;
  },

  bindEvents() {
    document.getElementById('profileForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleUpdateProfile();
    });

    document.getElementById('passwordForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleChangePassword();
    });

    document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());
  },

  async loadUserInfo() {
    try {
      const result = await UserApi.getCurrent();
      if (result.code === 0) {
        this.user = result.data;
        TokenStorage.setUser(result.data);
        document.getElementById('nickname').value = result.data.nickname || '';
        document.getElementById('phone').value = result.data.phone || '';
      }
    } catch (error) {
      console.error('加载用户信息失败:', error);
    }
  },

  async handleUpdateProfile() {
    const nickname = document.getElementById('nickname').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const saveBtn = document.getElementById('saveProfileBtn');

    if (!nickname) {
      Toast.error('请输入昵称');
      return;
    }

    if (!phone) {
      Toast.error('请输入手机号');
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      Toast.error('请输入正确的手机号');
      return;
    }

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner" style="width: 16px; height: 16px; border-width: 2px; margin-right: 8px; display: inline-block; vertical-align: middle;"></span> 保存中...';

    try {
      const result = await UserApi.updateProfile({ nickname, phone });

      if (result.code === 0) {
        Toast.success('资料更新成功');
        this.user = { ...this.user, nickname, phone };
        TokenStorage.setUser(this.user);
      } else {
        Toast.error(result.msg || '更新失败');
      }
    } catch (error) {
      Toast.error('更新失败，请检查网络');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '保存修改';
    }
  },

  async handleChangePassword() {
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    const changeBtn = document.getElementById('changePasswordBtn');

    if (!oldPassword) {
      Toast.error('请输入原密码');
      return;
    }

    if (!newPassword) {
      Toast.error('请输入新密码');
      return;
    }

    if (newPassword.length < 6) {
      Toast.error('新密码至少6位');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Toast.error('两次密码输入不一致');
      return;
    }

    changeBtn.disabled = true;
    changeBtn.innerHTML = '<span class="spinner" style="width: 16px; height: 16px; border-width: 2px; margin-right: 8px; display: inline-block; vertical-align: middle;"></span> 修改中...';

    try {
      const result = await UserApi.changePassword({
        old_password: oldPassword,
        new_password: newPassword
      });

      if (result.code === 0) {
        Toast.success('密码修改成功');
        document.getElementById('oldPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmNewPassword').value = '';
      } else {
        Toast.error(result.msg || '修改失败');
      }
    } catch (error) {
      Toast.error('修改失败，请检查网络');
    } finally {
      changeBtn.disabled = false;
      changeBtn.innerHTML = '修改密码';
    }
  },

  async handleLogout() {
    if (!confirm('确定要退出登录吗？')) {
      return;
    }

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
