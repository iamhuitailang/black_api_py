import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

pinia.use(({ store }) => {
  const initialState = JSON.parse(JSON.stringify(store.$state))
  const savedState = localStorage.getItem(`game-state-${store.$id}`)
  if (savedState) {
    try {
      store.$patch(JSON.parse(savedState))
    } catch (e) {
      console.warn('Failed to restore state:', e)
    }
  }
  store.$subscribe((mutation, state) => {
    localStorage.setItem(`game-state-${store.$id}`, JSON.stringify(state))
  })
})

app.use(pinia)
app.use(router)
app.mount('#app')
