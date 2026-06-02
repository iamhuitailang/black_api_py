const app = Vue.createApp({
  template: `
    <div id="xiangqi-app">
      <nav class="navbar" v-if="showNav">
        <div class="nav-brand" @click="navigate('/hall')">中国象棋</div>
        <div class="nav-menu">
          <template v-if="isLoggedIn">
            <a class="nav-link" :class="{ active: currentRoute === '/hall' }" @click="navigate('/hall')">大厅</a>
            <a class="nav-link" :class="{ active: currentRoute === '/leaderboard' }" @click="navigate('/leaderboard')">排行榜</a>
            <a class="nav-link" :class="{ active: currentRoute === '/spectator' }" @click="navigate('/spectator')">观战</a>
            <a class="nav-link" :class="{ active: currentRoute === '/profile' }" @click="navigate('/profile')">个人中心</a>
            <a class="nav-link" @click="handleLogout">退出</a>
          </template>
          <template v-else-if="isAdminLoggedIn">
            <a class="nav-link" :class="{ active: currentRoute === '/admin/dashboard' }" @click="navigate('/admin/dashboard')">仪表盘</a>
            <a class="nav-link" :class="{ active: currentRoute === '/admin/users' }" @click="navigate('/admin/users')">用户管理</a>
            <a class="nav-link" :class="{ active: currentRoute === '/admin/ai' }" @click="navigate('/admin/ai')">AI管理</a>
            <a class="nav-link" :class="{ active: currentRoute === '/admin/games' }" @click="navigate('/admin/games')">对局管理</a>
            <a class="nav-link" :class="{ active: currentRoute === '/admin/leaderboard' }" @click="navigate('/admin/leaderboard')">排行榜</a>
            <a class="nav-link" :class="{ active: currentRoute === '/admin/stats' }" @click="navigate('/admin/stats')">统计</a>
            <a class="nav-link" @click="handleAdminLogout">退出管理</a>
          </template>
        </div>
      </nav>

      <main class="main-content">
        <component :is="currentComponent" v-if="currentComponent"></component>
      </main>

      <div class="toast-container" v-if="toast.show">
        <div class="toast" :class="toast.type">{{ toast.message }}</div>
      </div>
    </div>
  `,
  setup() {
    const currentUser = Vue.ref(XiangqiAuth.getUser());
    const currentAdmin = Vue.ref(XiangqiAuth.getAdmin());
    const isLoggedIn = Vue.computed(() => !!currentUser.value && XiangqiAuth.isAuthenticated());
    const isAdminLoggedIn = Vue.computed(() => !!currentAdmin.value && XiangqiAuth.isAdminAuthenticated());
    const currentRoute = Vue.ref('');
    const currentComponent = Vue.ref(null);
    const toast = Vue.reactive({ show: false, message: '', type: 'info' });

    const showNav = Vue.computed(() => {
      return isLoggedIn.value || isAdminLoggedIn.value;
    });

    const routeMap = {
      '/login': LoginPage,
      '/register': RegisterPage,
      '/hall': HallPage,
      '/game': GamePage,
      '/spectator': SpectatorPage,
      '/leaderboard': LeaderboardPage,
      '/profile': ProfilePage,
      '/admin/login': AdminLoginPage,
      '/admin/dashboard': AdminDashboardPage,
      '/admin/users': AdminUsersPage,
      '/admin/ai': AdminAIPage,
      '/admin/leaderboard': AdminLeaderboardPage,
      '/admin/stats': AdminStatsPage,
      '/admin/games': AdminGamesPage
    };

    function resolveRoute() {
      const hash = window.location.hash.slice(1) || '/hall';
      const path = hash.split('?')[0];
      currentRoute.value = path;

      if (path.startsWith('/admin')) {
        if (!isAdminLoggedIn.value && path !== '/admin/login') {
          window.location.hash = '#/admin/login';
          return;
        }
      } else if (!path.startsWith('/login') && !path.startsWith('/register')) {
        if (!isLoggedIn.value) {
          window.location.hash = '#/login';
          return;
        }
      }

      const component = routeMap[path];
      if (component) {
        currentComponent.value = component;
      } else {
        currentComponent.value = isLoggedIn.value ? HallPage : LoginPage;
      }
    }

    function navigate(path) {
      window.location.hash = '#' + path;
    }

    function handleLogout() {
      XiangqiApi.logout().catch(() => {});
      XiangqiAuth.removeToken();
      XiangqiAuth.removeUser();
      currentUser.value = null;
      window.location.hash = '#/login';
    }

    function handleAdminLogout() {
      XiangqiApi.adminLogout().catch(() => {});
      XiangqiAuth.removeAdminToken();
      XiangqiAuth.removeAdmin();
      currentAdmin.value = null;
      window.location.hash = '#/admin/login';
    }

    function showToast(message, type = 'info') {
      toast.message = message;
      toast.type = type;
      toast.show = true;
      setTimeout(() => { toast.show = false; }, 3000);
    }

    Vue.onMounted(() => {
      window.addEventListener('hashchange', resolveRoute);
      resolveRoute();
    });

    Vue.onUnmounted(() => {
      window.removeEventListener('hashchange', resolveRoute);
    });

    return {
      currentUser, currentAdmin, isLoggedIn, isAdminLoggedIn,
      currentRoute, currentComponent, showNav, toast,
      navigate, handleLogout, handleAdminLogout, showToast
    };
  }
});

app.mount('#app');

window.XiangqiApp = app;
