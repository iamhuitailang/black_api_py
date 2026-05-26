import { defineStore } from 'pinia'
import { ref } from 'vue'
import storage from '@/utils/storage'

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref<'light' | 'dark'>('light')

  const initTheme = () => {
    const saved = storage.getTheme() as 'light' | 'dark' | ''
    if (saved === 'light' || saved === 'dark') {
      currentTheme.value = saved
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      currentTheme.value = prefersDark ? 'dark' : 'light'
    }
    applyTheme(currentTheme.value)
  }

  const toggleTheme = () => {
    const next = currentTheme.value === 'light' ? 'dark' : 'light'
    setTheme(next)
  }

  const setTheme = (theme: 'light' | 'dark') => {
    currentTheme.value = theme
    storage.setTheme(theme)
    applyTheme(theme)
  }

  const applyTheme = (theme: string) => {
    document.documentElement.setAttribute('data-theme', theme)
  }

  return { currentTheme, initTheme, toggleTheme, setTheme }
})
