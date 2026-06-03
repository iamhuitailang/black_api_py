<template>
  <div class="app">
    <Navbar v-if="!['/login', '/register'].includes($route.path)" />
    <router-view />
    <ToastComponent />
  </div>
</template>

<script setup>
import Navbar from './components/Navbar.vue'
import ToastComponent from './components/Toast.vue'
import { useAuthStore } from './store'
import { onMounted } from 'vue'

const authStore = useAuthStore()

onMounted(async () => {
  if (authStore.isLoggedIn) {
    try {
      await authStore.fetchUser()
      await authStore.fetchGameState()
    } catch (e) {
      authStore.logout()
    }
  }
})
</script>

<style scoped>
.app {
  min-height: 100vh;
}
</style>
