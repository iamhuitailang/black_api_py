const ProfilePage = {
  render() {
    return `
      <div class="page-container">
        <div class="page-header">
          <h2>个人中心</h2>
        </div>

        <div class="profile-layout">
          <div class="profile-sidebar">
            <div class="avatar-section">
              <div class="avatar">${this.getInitial()}</div>
              <div class="user-info" id="user-info">
                <h3 id="user-nickname">加载中...</h3>
                <p id="user-role"></p>
              </div>
            </div>
            <nav class="profile-nav">
              <button class="nav-btn active" data-tab="info">基本信息</button>
              <button class="nav-btn" data-tab="password">修改密码</button>
              <button class="nav-btn" data-tab="stats">我的统计</button>
            </nav>
          </div>

          <div class="profile-content">
            <div class="tab-content active" id="tab-info">
              <form id="profile-form">
                <div class="form-group">
                  <label>昵称</label>
                  <input type="text" id="profile-nickname" placeholder="请输入昵称">
                </div>
                <div class="form-group">
                  <label>手机号</label>
                  <input type="text" id="profile-phone" readonly>
                </div>
                <div class="form-group">
                  <label>邮箱</label>
                  <input type="email" id="profile-email" placeholder="请输入邮箱（可选）">
                </div>
                <button type="submit" class="btn btn-primary">保存修改</button>
              </form>
            </div>

            <div class="tab-content" id="tab-password">
              <form id="password-form">
                <div class="form-group">
                  <label>当前密码</label>
                  <input type="password" id="old-password" required placeholder="请输入当前密码">
                </div>
                <div class="form-group">
                  <label>新密码</label>
                  <input type="password" id="new-password" required placeholder="请输入新密码（至少6位）">
                </div>
                <div class="form-group">
                  <label>确认新密码</label>
                  <input type="password" id="confirm-password" required placeholder="请再次输入新密码">
                </div>
                <button type="submit" class="btn btn-primary">修改密码</button>
              </form>
            </div>

            <div class="tab-content" id="tab-stats">
              <div class="stats-grid" id="stats-grid">
                <div class="loading">加载中...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  getInitial() {
    const user = Storage.getUser();
    if (user && user.nickname) {
      return user.nickname.charAt(0).toUpperCase();
    }
    return 'U';
  },

  data() {
    return {
      user: null
    };
  },

  async mount() {
    await this.loadUserProfile();
    this.bindTabEvents();
    this.bindFormEvents();
    this.loadStats();
  },

  async loadUserProfile() {
    const result = await AuthService.getCurrentUser();
    if (result.code === 0 && result.data) {
      this.user = result.data;
      document.getElementById('user-nickname').textContent = this.user.nickname || this.user.phone;
      document.getElementById('user-role').textContent = this.user.role === 'admin' ? '管理员' : '普通用户';
      document.getElementById('profile-nickname').value = this.user.nickname || '';
      document.getElementById('profile-phone').value = this.user.phone || '';
      document.getElementById('profile-email').value = this.user.email || '';
    }
  },

  bindTabEvents() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
      });
    });
  },

  bindFormEvents() {
    document.getElementById('profile-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        nickname: document.getElementById('profile-nickname').value,
        email: document.getElementById('profile-email').value
      };
      const result = await AuthService.updateProfile(data);
      if (result.code === 0) {
        Toast.success('资料更新成功');
        this.user.nickname = data.nickname;
        Storage.setUser(this.user);
        document.getElementById('user-nickname').textContent = data.nickname || this.user.phone;
      } else {
        Toast.error(result.msg);
      }
    });

    document.getElementById('password-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const oldPassword = document.getElementById('old-password').value;
      const newPassword = document.getElementById('new-password').value;
      const confirmPassword = document.getElementById('confirm-password').value;

      if (!oldPassword) {
        Toast.error('请输入当前密码');
        return;
      }
      if (newPassword !== confirmPassword) {
        Toast.error('两次输入的新密码不一致');
        return;
      }
      if (newPassword.length < 6) {
        Toast.error('新密码长度至少6位');
        return;
      }
      if (oldPassword === newPassword) {
        Toast.error('新密码不能与旧密码相同');
        return;
      }

      const result = await AuthService.changePassword(oldPassword, newPassword);
      if (result.code === 0) {
        Toast.success('密码修改成功');
        document.getElementById('password-form').reset();
      } else {
        Toast.error(result.msg);
      }
    });
  },

  async loadStats() {
    const result = await BorrowService.getMyBorrows({ page: 1, page_size: 1000 });
    if (result.code === 0 && result.data) {
      const borrows = result.data.items;
      const stats = {
        total: borrows.length,
        borrowing: borrows.filter(b => ['borrowing', 'overdue'].includes(b.status)).length,
        returned: borrows.filter(b => b.status === 'returned').length,
        overdue: borrows.filter(b => b.status === 'overdue').length
      };
      this.renderStats(stats);
    }
  },

  renderStats(stats) {
    const grid = document.getElementById('stats-grid');
    grid.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon">📚</div>
        <div class="stat-info">
          <span class="stat-value">${stats.total}</span>
          <span class="stat-label">总借用次数</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔄</div>
        <div class="stat-info">
          <span class="stat-value">${stats.borrowing}</span>
          <span class="stat-label">借用中</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <span class="stat-value">${stats.returned}</span>
          <span class="stat-label">已归还</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⚠️</div>
        <div class="stat-info">
          <span class="stat-value">${stats.overdue}</span>
          <span class="stat-label">已逾期</span>
        </div>
      </div>
    `;
  }
};

window.ProfilePage = ProfilePage;
