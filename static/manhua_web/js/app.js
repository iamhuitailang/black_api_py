const App = {
  components: { ThemeSwitch },
  template: `
    <div>
      <template v-if="!isReaderPage">
        <header class="app-header">
          <div class="logo" @click="Router.navigate('/home')">
            <span class="logo-icon">📚</span>
            <span class="logo-text">漫画屋</span>
          </div>

          <div class="header-search">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索漫画、作者..."
              :prefix-icon="'Search'"
              @keyup.enter="doSearch"
              clearable
              @clear="searchKeyword = ''"
            />
          </div>

          <div class="header-actions">
            <theme-switch />
            <el-icon
              :size="22"
              style="cursor: pointer;"
              @click="Router.navigate('/search')"
            >
              <search />
            </el-icon>
            <el-dropdown v-if="isLoggedIn" @command="handleUserCommand">
              <div
                class="user-avatar"
                style="background: linear-gradient(135deg, var(--primary-color), var(--accent-color)); color: white;"
              >
                {{ userInitial }}
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                  <el-dropdown-item command="settings">阅读设置</el-dropdown-item>
                  <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button
              v-else
              size="small"
              type="primary"
              @click="Router.navigate('/login')"
            >登录</el-button>
          </div>
        </header>

        <main class="app-main" :class="{ 'has-tabbar': showTabbar }">
          <transition name="fade" mode="out-in">
            <component :is="currentComponent" :key="routeKey" />
          </transition>
        </main>

        <nav v-if="showTabbar" class="tabbar">
          <div
            v-for="tab in tabs"
            :key="tab.path"
            class="tabbar-item"
            :class="{ active: currentPath === tab.path }"
            @click="Router.navigate(tab.path)"
          >
            <span class="tabbar-icon">{{ tab.icon }}</span>
            <span>{{ tab.label }}</span>
          </div>
        </nav>
      </template>

      <reader-page v-else />
    </div>
  `,
  data() {
    return {
      currentPath: '/home',
      currentComponent: null,
      searchKeyword: '',
      isLoggedIn: false,
      tabs: [
        { path: '/home', label: '首页', icon: '🏠' },
        { path: '/shelf', label: '书架', icon: '📚' },
        { path: '/history', label: '历史', icon: '🕐' },
        { path: '/settings', label: '设置', icon: '⚙️' }
      ]
    };
  },
  computed: {
    isReaderPage() {
      return this.currentPath.startsWith('/reader');
    },
    showTabbar() {
      return ['/home', '/shelf', '/history', '/settings'].includes(this.currentPath);
    },
    userInitial() {
      const user = Storage.getUser();
      if (user && user.nickname) return user.nickname[0];
      if (user && user.username) return user.username[0];
      return '?';
    },
    routeKey() {
      return this.currentPath + JSON.stringify(Router.params);
    },
    Router() { return Router; },
    Storage() { return Storage; },
    ApiService() { return ApiService; },
    ShareService() { return ShareService; }
  },
  created() {
    this.initTheme();
    this.isLoggedIn = !!Storage.getToken();

    Router.register('/home', () => {
      this.currentPath = '/home';
      this.currentComponent = HomePage;
    });

    Router.register('/detail/:id', () => {
      this.currentPath = '/detail';
      this.currentComponent = DetailPage;
    });

    Router.register('/reader/:comicId/:chapterNo', () => {
      this.currentPath = '/reader';
      this.currentComponent = ReaderPage;
    });

    Router.register('/shelf', () => {
      this.currentPath = '/shelf';
      this.currentComponent = ShelfPage;
    });

    Router.register('/history', () => {
      this.currentPath = '/history';
      this.currentComponent = HistoryPage;
    });

    Router.register('/search', () => {
      this.currentPath = '/search';
      this.currentComponent = SearchPage;
    });

    Router.register('/settings', () => {
      this.currentPath = '/settings';
      this.currentComponent = SettingsPage;
    });

    Router.register('/login', () => {
      this.currentPath = '/login';
      this.currentComponent = LoginPage;
    });

    Router.register('/register', () => {
      this.currentPath = '/register';
      this.currentComponent = RegisterPage;
    });

    Router.register('/profile', () => {
      this.currentPath = '/profile';
      this.currentComponent = ProfilePage;
    });

    Router.init();

    Router.onChange((path) => {
      this.currentPath = path.split('?')[0];
      this.isLoggedIn = !!Storage.getToken();
    });
  },
  methods: {
    initTheme() {
      const theme = Storage.getTheme() || 'dark';
      document.body.className = `theme-${theme}`;
      document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#1a1a2e' : '#ffffff';
    },
    doSearch() {
      if (this.searchKeyword.trim()) {
        Router.navigate('/search', { q: encodeURIComponent(this.searchKeyword.trim()) });
      }
    },
    async handleUserCommand(command) {
      switch (command) {
        case 'profile':
          Router.navigate('/profile');
          break;
        case 'settings':
          Router.navigate('/settings');
          break;
        case 'logout':
          try {
            await ElementPlus.ElMessageBox.confirm('确定要退出登录吗？', '提示', {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning'
            });
            await ApiService.logout();
            Storage.removeToken();
            Storage.removeUser();
            this.isLoggedIn = false;
            ElementPlus.ElMessage.success('已退出登录');
            Router.navigate('/home');
          } catch (e) {}
          break;
      }
    }
  }
};

const app = Vue.createApp(App);

app.config.globalProperties.Router = Router;
app.config.globalProperties.Storage = Storage;
app.config.globalProperties.ApiService = ApiService;
app.config.globalProperties.ShareService = ShareService;
app.config.globalProperties.ElementPlus = ElementPlus;

app.use(ElementPlus, { locale: ElementPlusLocaleZhCn });

for (const [key, component] of Object.entries(window.ElementPlusIconsVue || {})) {
  app.component(key, component);
}

app.component('home-page', HomePage);
app.component('detail-page', DetailPage);
app.component('reader-page', ReaderPage);
app.component('shelf-page', ShelfPage);
app.component('history-page', HistoryPage);
app.component('search-page', SearchPage);
app.component('settings-page', SettingsPage);
app.component('login-page', LoginPage);
app.component('register-page', RegisterPage);
app.component('profile-page', ProfilePage);
app.component('comic-card', ComicCard);
app.component('theme-switch', ThemeSwitch);

app.mount('#app');