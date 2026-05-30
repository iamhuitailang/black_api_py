const App = {
  currentPage: null,
  pageInstance: null,
  unreadCount: 0,

  init() {
    this.renderLayout();
    this.initRouter();
    this.checkAuth();
    this.startUnreadPolling();
  },

  renderLayout() {
    const isAuthPage = window.location.hash.startsWith('#login') || window.location.hash.startsWith('#register');
    
    if (isAuthPage) {
      document.body.innerHTML = `
        <div class="app-container">
          <div id="page-container"></div>
        </div>
      `;
    } else {
      document.body.innerHTML = `
        <div class="app-container">
          <header class="header" id="header">
            <div class="logo" onclick="Router.navigate('home')">📦 物品借用系统</div>
            <nav class="nav-menu" id="nav-menu"></nav>
            <div class="user-section" id="user-section">
              <span style="cursor: pointer" onclick="Router.navigate('login')">登录/注册</span>
            </div>
          </header>
          <main class="main-content" id="page-container"></main>
        </div>
      `;
    }
  },

  initRouter() {
    const routes = {
      'login': { component: (p) => this.renderPage(LoginPage, p) },
      'register': { component: (p) => this.renderPage(LoginPage, p) },
      'home': { component: (p) => this.renderPage(HomePage, p) },
      'item': { component: (p) => this.renderPage(ItemDetailPage, p) },
      'my-borrows': { auth: true, component: (p) => this.renderPage(MyBorrowsPage, p) },
      'borrow-detail': { auth: true, component: (p) => this.renderPage(BorrowDetailPage, p) },
      'messages': { auth: true, component: (p) => this.renderPage(MessagesPage, p) },
      'profile': { auth: true, component: (p) => this.renderPage(ProfilePage, p) },
      'admin': { auth: true, admin: true, component: (p) => this.renderPage(AdminDashboardPage, p) },
      'admin/items': { auth: true, admin: true, component: (p) => this.renderPage(AdminItemsPage, p) },
      'admin/categories': { auth: true, admin: true, component: (p) => this.renderPage(AdminCategoriesPage, p) },
      'admin/borrows': { auth: true, admin: true, component: (p) => this.renderPage(AdminBorrowsPage, p) },
      'admin/overdue': { auth: true, admin: true, component: (p) => this.renderPage(AdminOverduePage, p) }
    };

    Router.init(routes, 'home');
  },

  renderPage(PageClass, ...params) {
    if (!PageClass) return;
    
    this.currentPage = PageClass.name || 'Page';
    
    if (typeof PageClass === 'function') {
      this.pageInstance = new PageClass();
    } else {
      this.pageInstance = Object.create(PageClass);
    }
    
    if (this.pageInstance.data && typeof this.pageInstance.data === 'function') {
      const data = this.pageInstance.data();
      Object.assign(this.pageInstance, data);
    }
    
    const container = document.getElementById('page-container');
    container.innerHTML = this.pageInstance.render();
    
    this.updateNavigation();
    this.updateUserInfo();
    
    if (this.pageInstance.mount && typeof this.pageInstance.mount === 'function') {
      this.pageInstance.mount(...params, this);
    }
  },

  updateNavigation() {
    const navMenu = document.getElementById('nav-menu');
    if (!navMenu) return;

    const isAdmin = Storage.isAdmin();
    const isLoggedIn = Storage.isLoggedIn();
    
    let navItems = `
      <a class="nav-item ${Router.getCurrentRoute() === 'home' ? 'active' : ''}" onclick="Router.navigate('home')">物品列表</a>
    `;

    if (isLoggedIn) {
      navItems += `
        <a class="nav-item ${Router.getCurrentRoute().startsWith('my-borrows') ? 'active' : ''}" onclick="Router.navigate('my-borrows')">我的借用</a>
        <a class="nav-item ${Router.getCurrentRoute().startsWith('messages') ? 'active' : ''}" onclick="Router.navigate('messages')">
          消息中心
          <span id="unread-badge" class="unread-badge" style="display:none; background:#ff4d4f; color:white; padding:2px 6px; border-radius:10px; font-size:11px; margin-left:4px;"></span>
        </a>
      `;

      if (isAdmin) {
        navItems += `
          <a class="nav-item ${Router.getCurrentRoute().startsWith('admin') ? 'active' : ''}" onclick="Router.navigate('admin')">管理后台</a>
        `;
      }
    }

    navMenu.innerHTML = navItems;
    this.updateUnreadBadge();
  },

  updateUserInfo() {
    const userSection = document.getElementById('user-section');
    if (!userSection) return;

    const user = Storage.getUser();
    if (user) {
      const initial = user.nickname ? user.nickname.charAt(0).toUpperCase() : 'U';
      const isAdmin = user.role === 'admin';
      
      let adminMenu = '';
      if (isAdmin) {
        adminMenu = `
          <div class="dropdown-item" onclick="Router.navigate('admin')">管理仪表盘</div>
          <div class="dropdown-item" onclick="Router.navigate('admin/items')">物品管理</div>
          <div class="dropdown-item" onclick="Router.navigate('admin/categories')">分类管理</div>
          <div class="dropdown-item" onclick="Router.navigate('admin/borrows')">借用记录</div>
          <div class="dropdown-item" onclick="Router.navigate('admin/overdue')">逾期管理</div>
        `;
      }

      userSection.innerHTML = `
        <div class="dropdown">
          <div class="user-avatar" id="user-dropdown-toggle">${initial}</div>
          <div class="dropdown-menu" id="user-dropdown-menu">
            <div class="dropdown-item" onclick="Router.navigate('profile')">个人中心</div>
            ${adminMenu}
            <div class="dropdown-item" onclick="Router.navigate('my-borrows')">我的借用</div>
            <div class="dropdown-item" onclick="Router.navigate('messages')">消息中心</div>
            <div class="dropdown-item danger" onclick="App.logout()">退出登录</div>
          </div>
        </div>
      `;

      const toggle = document.getElementById('user-dropdown-toggle');
      const menu = document.getElementById('user-dropdown-menu');
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('show');
      });
      document.addEventListener('click', () => {
        menu.classList.remove('show');
      });
    } else {
      userSection.innerHTML = `
        <span style="cursor: pointer" onclick="Router.navigate('login')">登录/注册</span>
      `;
    }
  },

  async logout() {
    if (confirm('确认退出登录？')) {
      await AuthService.logout();
      Storage.clear();
      this.renderLayout();
      Router.navigate('home');
    }
  },

  checkAuth() {
    const token = Storage.getToken();
    if (token) {
      AuthService.getCurrentUser().then(result => {
        if (result.code !== 0) {
          Storage.clear();
          this.updateUserInfo();
          this.updateNavigation();
        }
      });
    }
  },

  async startUnreadPolling() {
    const updateUnread = async () => {
      if (Storage.isLoggedIn()) {
        const result = await MessageService.getUnreadCount();
        if (result.code === 0) {
          this.unreadCount = result.data?.count || 0;
          this.updateUnreadBadge();
        }
      }
    };
    updateUnread();
    setInterval(updateUnread, 60000);
  },

  updateUnreadBadge() {
    const badge = document.getElementById('unread-badge');
    if (badge) {
      if (this.unreadCount > 0) {
        badge.style.display = 'inline-block';
        badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
      } else {
        badge.style.display = 'none';
      }
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

window.App = App;
