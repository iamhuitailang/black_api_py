import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './store'
import { createPersistPlugin } from './store/persist'
import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()

pinia.use(createPersistPlugin())

app.use(pinia)

const authStore = useAuthStore()
const savedToken = localStorage.getItem('token')
const savedUser = localStorage.getItem('user')
if (savedToken && savedUser) {
  authStore.token = savedToken
  try {
    authStore.user = JSON.parse(savedUser)
  } catch (e) {
    console.error('Failed to parse user:', e)
  }
}

app.use(router)
app.mount('#app')
