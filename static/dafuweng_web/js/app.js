import { createApp, computed, ref } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import Store from './store.js'
import Api from './api.js'

import Home from './pages/Home.js'
import Login from './pages/Login.js'
import Register from './pages/Register.js'
import Game from './pages/Game.js'
import GameList from './pages/GameList.js'
import Rank from './pages/Rank.js'
import Achievement from './pages/Achievement.js'
import Profile from './pages/Profile.js'
import AdminLogin from './pages/admin/AdminLogin.js'
import Dashboard from './pages/admin/Dashboard.js'
import UserManager from './pages/admin/UserManager.js'
import MapManager from './pages/admin/MapManager.js'
import ItemManager from './pages/admin/ItemManager.js'
import Stats from './pages/admin/Stats.js'

const routes = [
  { path: '/', component: Home },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/game/list', component: GameList, meta: { requiresAuth: true } },
  { path: '/game/:id', component: Game, meta: { requiresAuth: true } },
  { path: '/rank', component: Rank },
  { path: '/achievement', component: Achievement, meta: { requiresAuth: true } },
  { path: '/profile', component: Profile, meta: { requiresAuth: true } },
  { path: '/admin/login', component: AdminLogin },
  { path: '/admin/dashboard', component: Dashboard, meta: { requiresAdmin: true } },
  { path: '/admin/users', component: UserManager, meta: { requiresAdmin: true } },
  { path: '/admin/map', component: MapManager, meta: { requiresAdmin: true } },
  { path: '/admin/items', component: ItemManager, meta: { requiresAdmin: true } },
  { path: '/admin/stats', component: Stats, meta: { requiresAdmin: true } }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth && !Store.isLoggedIn) {
    next('/login')
  } else if (to.meta.requiresAdmin && !Store.isAdminLoggedIn) {
    next('/admin/login')
  } else {
    next()
  }
})

Store.loadFromStorage()

if (Store.isLoggedIn && !Store.state.user) {
  Api.getCurrentUser().then(res => {
    Store.setUser(res.data)
  }).catch(() => {
    Store.clearUser()
  })
}

if (Store.isAdminLoggedIn && !Store.state.admin) {
  Api.getCurrentAdmin().then(res => {
    Store.setAdmin(res.data)
  }).catch(() => {
    Store.clearAdmin()
  })
}

const Navbar = {
  setup() {
    const isLoggedIn = computed(() => Store.isLoggedIn)
    const isAdminLoggedIn = computed(() => Store.isAdminLoggedIn)
    const user = computed(() => Store.state.user)
    const showMobileMenu = ref(false)

    async function handleLogout() {
      try { await Api.logout() } catch (e) {}
      Store.clearUser()
      window.location.hash = '#/'
    }

    async function handleAdminLogout() {
      try { await Api.adminLogout() } catch (e) {}
      Store.clearAdmin()
      window.location.hash = '#/admin/login'
    }

    return { isLoggedIn, isAdminLoggedIn, user, showMobileMenu, handleLogout, handleAdminLogout }
  },
  template: `
    <nav class="navbar">
      <div class="navbar-inner">
        <router-link to="/" class="navbar-brand">🏰 大富翁</router-link>
        <button class="mobile-toggle" @click="showMobileMenu = !showMobileMenu">☰</button>
        <div :class="['navbar-menu', { open: showMobileMenu }]">
          <div class="navbar-left">
            <router-link to="/" class="nav-link">首页</router-link>
            <router-link v-if="isLoggedIn" to="/game/list" class="nav-link">游戏大厅</router-link>
            <router-link to="/rank" class="nav-link">排行榜</router-link>
            <router-link v-if="isLoggedIn" to="/achievement" class="nav-link">成就</router-link>
          </div>
          <div class="navbar-right">
            <template v-if="isLoggedIn">
              <router-link to="/profile" class="nav-link">{{ user ? user.nickname || user.username : '我的' }}</router-link>
              <a href="#" class="nav-link" @click.prevent="handleLogout">退出</a>
            </template>
            <template v-else>
              <router-link to="/login" class="nav-link">登录</router-link>
              <router-link to="/register" class="nav-link">注册</router-link>
            </template>
            <span class="nav-divider">|</span>
            <template v-if="isAdminLoggedIn">
              <router-link to="/admin/dashboard" class="nav-link admin-link">管理后台</router-link>
              <a href="#" class="nav-link" @click.prevent="handleAdminLogout">管理退出</a>
            </template>
            <template v-else>
              <router-link to="/admin/login" class="nav-link admin-link">管理后台</router-link>
            </template>
          </div>
        </div>
      </div>
    </nav>
  `
}

const app = createApp({
  components: { Navbar },
  template: `
    <Navbar />
    <main class="main-content">
      <router-view></router-view>
    </main>
  `
})

app.use(router)
app.mount('#app')
