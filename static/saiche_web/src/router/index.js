import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/test',
    name: 'Test',
    component: () => import('@/views/Test.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue')
  },
  {
    path: '/lobby',
    name: 'Lobby',
    component: () => import('@/views/Lobby.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/game/:trackId',
    name: 'Game',
    component: () => import('@/views/Game.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/garage',
    name: 'Garage',
    component: () => import('@/views/Garage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/tracks',
    name: 'Tracks',
    component: () => import('@/views/Tracks.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/ranking',
    name: 'Ranking',
    component: () => import('@/views/Ranking.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/achievements',
    name: 'Achievements',
    component: () => import('@/views/Achievements.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/admin/AdminLayout.vue'),
    meta: { requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue')
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/Users.vue')
      },
      {
        path: 'tracks',
        name: 'AdminTracks',
        component: () => import('@/views/admin/Tracks.vue')
      },
      {
        path: 'cars',
        name: 'AdminCars',
        component: () => import('@/views/admin/Cars.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

//#region debug-point router-before-each
const __DBG_ROUTER = {
  sessionId: 'saiche-login-register-bug',
  runId: Date.now(),
  report: (data) => {
    try {
      fetch('http://127.0.0.1:7777/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(() => {})
    } catch (e) {}
  }
}
//#endregion debug-point router-before-each

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  userStore.loadFromStorage()

  //#region debug-point router-before-each
  __DBG_ROUTER.report({
    sessionId: __DBG_ROUTER.sessionId,
    runId: __DBG_ROUTER.runId,
    hypothesisId: 'H4',
    location: 'router/index.js:beforeEach',
    type: 'info',
    data: {
      from: from.path,
      to: to.path,
      requiresAuth: to.meta.requiresAuth,
      requiresAdmin: to.meta.requiresAdmin,
      isLoggedIn: userStore.isLoggedIn,
      isAdmin: userStore.isAdmin,
      isLoaded: userStore.isLoaded,
      hasToken: !!userStore.token,
      hasUser: !!userStore.user
    }
  })
  //#endregion debug-point router-before-each

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    //#region debug-point router-before-each
    __DBG_ROUTER.report({
      sessionId: __DBG_ROUTER.sessionId,
      runId: __DBG_ROUTER.runId,
      hypothesisId: 'H4',
      location: 'router/index.js:beforeEach:redirect-login',
      type: 'info',
      data: { reason: 'requiresAuth but not logged in' }
    })
    //#endregion debug-point router-before-each
    next('/login')
  } else if (to.meta.requiresAdmin && !userStore.isAdmin) {
    //#region debug-point router-before-each
    __DBG_ROUTER.report({
      sessionId: __DBG_ROUTER.sessionId,
      runId: __DBG_ROUTER.runId,
      hypothesisId: 'H4',
      location: 'router/index.js:beforeEach:redirect-home',
      type: 'info',
      data: { reason: 'requiresAdmin but not admin' }
    })
    //#endregion debug-point router-before-each
    next('/')
  } else {
    //#region debug-point router-before-each
    __DBG_ROUTER.report({
      sessionId: __DBG_ROUTER.sessionId,
      runId: __DBG_ROUTER.runId,
      hypothesisId: 'H4',
      location: 'router/index.js:beforeEach:allow',
      type: 'info',
      data: { reason: 'allowed' }
    })
    //#endregion debug-point router-before-each
    next()
  }
})

export default router
