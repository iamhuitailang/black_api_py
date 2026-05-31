const MessagesPage = {
  messages: [],
  filter: {
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
          <h1 class="page-title">🔔 消息中心</h1>
          <button class="btn btn-sm btn-secondary" id="markAllReadBtn">全部标为已读</button>
        </div>
        
        <div id="messageList">
          <div class="loading">
            <div class="spinner"></div>
          </div>
        </div>
        
        <div id="pagination" class="pagination"></div>
      </div>
    `;

    this.bindEvents();
    this.loadMessages();
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
            <a href="javascript:;" class="navbar-link active" onclick="Router.navigate('/messages')">消息</a>
            <a href="javascript:;" class="navbar-link" onclick="Router.navigate('/profile')">个人中心</a>
          </div>
          <div class="navbar-user">
            <div class="dropdown">
              <div class="avatar" onclick="this.nextElementSibling.classList.toggle('show')">
                ${user?.nickname?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </div>
              <div class="dropdown-menu">
                <div class="dropdown-item" onclick="Router.navigate('/profile')">个人资料</div>
                <div class="dropdown-item" onclick="MessagesPage.handleLogout()">退出登录</div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    `;
  },

  bindEvents() {
    document.getElementById('markAllReadBtn').addEventListener('click', () => this.handleMarkAllRead());
    
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
          menu.classList.remove('show');
        });
      }
    });
  },

  getTypeLabel(type) {
    const typeMap = {
      'booking': '预订通知',
      'system': '系统通知',
      'promotion': '促销活动',
      'reminder': '提醒'
    };
    return typeMap[type] || type;
  },

  async loadMessages() {
    const messageList = document.getElementById('messageList');
    messageList.innerHTML = `
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

      const result = await MessageApi.getMy(params);
      
      if (result.code === 0) {
        this.messages = result.data.items || [];
        this.pagination = {
          total: result.data.total || 0,
          page: result.data.page || 1,
          page_size: result.data.page_size || 10,
          total_pages: Math.ceil((result.data.total || 0) / (result.data.page_size || 10))
        };
        this.renderMessages();
        this.renderPagination();
      } else {
        messageList.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">😕</div>
            <div class="empty-text">加载失败</div>
            <div class="empty-desc">${result.msg || '请稍后重试'}</div>
          </div>
        `;
      }
    } catch (error) {
      messageList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">😕</div>
          <div class="empty-text">网络错误</div>
          <div class="empty-desc">请检查网络连接</div>
        </div>
      `;
    }
  },

  renderMessages() {
    const messageList = document.getElementById('messageList');
    
    if (this.messages.length === 0) {
      messageList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔔</div>
          <div class="empty-text">暂无消息</div>
          <div class="empty-desc">您的消息将显示在这里</div>
        </div>
      `;
      return;
    }

    messageList.innerHTML = `
      <div class="message-list">
        ${this.messages.map(message => this.renderMessageItem(message)).join('')}
      </div>
    `;
    
    document.querySelectorAll('.message-item').forEach(item => {
      item.addEventListener('click', () => {
        const messageId = item.dataset.messageId;
        this.handleMessageClick(messageId);
      });
    });
  },

  renderMessageItem(message) {
    const isUnread = !message.is_read;
    const typeLabel = this.getTypeLabel(message.type);
    
    return `
      <div class="message-item ${isUnread ? 'unread' : ''}" data-message-id="${message.id}">
        <div class="message-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="message-type">${typeLabel}</span>
            <span class="message-title">${message.title}</span>
          </div>
          <span class="message-time">${this.formatTime(message.created_at)}</span>
        </div>
        <div class="message-content">${message.content}</div>
      </div>
    `;
  },

  formatTime(timeStr) {
    const date = new Date(timeStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) {
      return '刚刚';
    } else if (diff < 3600000) {
      return Math.floor(diff / 60000) + '分钟前';
    } else if (diff < 86400000) {
      return Math.floor(diff / 3600000) + '小时前';
    } else if (diff < 604800000) {
      return Math.floor(diff / 86400000) + '天前';
    } else {
      return date.toLocaleDateString();
    }
  },

  async handleMessageClick(messageId) {
    try {
      await MessageApi.markAsRead(messageId);
      const message = this.messages.find(m => m.id === messageId);
      if (message) {
        message.is_read = true;
        this.renderMessages();
      }
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  },

  async handleMarkAllRead() {
    try {
      const result = await MessageApi.markAllAsRead();
      if (result.code === 0) {
        Toast.success('已全部标记为已读');
        this.messages.forEach(m => m.is_read = true);
        this.renderMessages();
      } else {
        Toast.error(result.msg || '操作失败');
      }
    } catch (error) {
      Toast.error('操作失败，请检查网络');
    }
  },

  renderPagination() {
    const pagination = document.getElementById('pagination');
    const { page, total_pages } = this.pagination;
    
    if (total_pages <= 1) {
      pagination.innerHTML = '';
      return;
    }

    let html = '';
    
    html += `<button class="page-btn" ${page <= 1 ? 'disabled' : ''} onclick="MessagesPage.goToPage(${page - 1})">上一页</button>`;
    
    for (let i = 1; i <= total_pages; i++) {
      if (i === 1 || i === total_pages || (i >= page - 2 && i <= page + 2)) {
        html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="MessagesPage.goToPage(${i})">${i}</button>`;
      } else if (i === page - 3 || i === page + 3) {
        html += `<span style="padding: 8px;">...</span>`;
      }
    }
    
    html += `<button class="page-btn" ${page >= total_pages ? 'disabled' : ''} onclick="MessagesPage.goToPage(${page + 1})">下一页</button>`;
    
    pagination.innerHTML = html;
  },

  goToPage(page) {
    if (page < 1 || page > this.pagination.total_pages) return;
    this.filter.page = page;
    this.loadMessages();
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
