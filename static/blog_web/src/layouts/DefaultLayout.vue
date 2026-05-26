<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElDropdown } from 'element-plus'
import { Search, Moon, Sunny, Plus, User, EditPen, Setting, SwitchButton, Top } from '@element-plus/icons-vue'
import { useThemeStore, useUserStore } from '@/stores'
import BlogHeader from '@/components/BlogHeader.vue'
import BlogFooter from '@/components/BlogFooter.vue'

const themeStore = useThemeStore()
const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

const showScrollTop = ref(false)
const searchKeyword = ref('')

const handleScroll = () => {
  showScrollTop.value = window.scrollY > 400
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push({ name: 'Search', query: { q: searchKeyword.value.trim() } })
  } else {
    router.push({ name: 'Search' })
  }
}

const handleUserCommand = (command: string | number) => {
  if (command === 'editor') {
    router.push({ name: 'Editor' })
  } else if (command === 'profile') {
    router.push({ name: 'Profile' })
  } else if (command === 'logout') {
    userStore.logout()
    router.push({ name: 'Home' })
  }
}

const userMenuItems = [
  { label: '写文章', command: 'editor', icon: EditPen },
  { label: '个人中心', command: 'profile', icon: Setting },
  { divided: true, label: '退出登录', command: 'logout', icon: SwitchButton }
]

const goHome = () => router.push('/')
const goLogin = () => router.push('/login')
</script>

<template>
  <div class="default-layout">
    <header class="site-header">
      <div class="container header-inner">
        <div class="brand" @click="goHome">
          <span class="logo">B</span>
          <span class="brand-name">个人博客</span>
        </div>
        <nav class="nav">
          <RouterLink to="/" :class="{ active: route.name === 'Home' }">首页</RouterLink>
          <RouterLink to="/categories" :class="{ active: route.name === 'Categories' }">分类</RouterLink>
          <RouterLink to="/search" :class="{ active: route.name === 'Search' }">发现</RouterLink>
        </nav>
        <div class="header-actions">
          <div class="search-bar">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索文章..."
              :prefix-icon="Search"
              clearable
              size="default"
              @keyup.enter="handleSearch"
            />
          </div>
          <el-button
            class="theme-toggle"
            :icon="themeStore.currentTheme === 'dark' ? Sunny : Moon"
            circle
            @click="themeStore.toggleTheme()"
          />
          <el-button
            v-if="userStore.user"
            class="write-btn"
            type="primary"
            :icon="Plus"
            @click="router.push({ name: 'Editor' })"
          >
            写文章
          </el-button>
          <el-dropdown v-if="userStore.user" @command="handleUserCommand" trigger="click">
            <div class="avatar-wrap">
              <el-avatar :size="34" :src="userStore.user?.avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="item in userMenuItems" :key="item.command" :command="item.command" :divided="item.divided">
                  <el-icon style="margin-right: 6px"><component :is="item.icon" /></el-icon>
                  {{ item.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button v-else type="primary" plain @click="goLogin">登录</el-button>
        </div>
      </div>
    </header>

    <main class="site-main">
      <div class="container main-inner">
        <RouterView v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </RouterView>
      </div>
    </main>

    <BlogFooter />

    <div class="scroll-top-btn" :class="{ show: showScrollTop }" @click="scrollToTop">
      <el-button type="primary" circle :icon="Top" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.default-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.site-header {
  position: sticky;
  top: 0;
  z-index: 30;
  background: color-mix(in srgb, var(--color-bg) 92%, transparent);
  backdrop-filter: saturate(180%) blur(12px);
  border-bottom: 1px solid var(--color-border-soft);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  height: 68px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;

  .logo {
    width: 36px;
    height: 36px;
    background: var(--color-primary);
    color: #fff;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-family: Georgia, serif;
    font-size: 20px;
    box-shadow: var(--shadow-sm);
  }

  .brand-name {
    font-family: var(--font-serif);
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text);
  }
}

.nav {
  display: flex;
  gap: 8px;

  a {
    padding: 6px 14px;
    border-radius: 8px;
    color: var(--color-text-soft);
    font-weight: 500;
    transition: background 0.2s ease, color 0.2s ease;

    &:hover {
      color: var(--color-text);
      background: var(--color-bg-soft);
    }

    &.active {
      color: var(--color-primary);
      background: var(--color-primary-soft);
    }
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;

  .search-bar {
    width: 260px;
  }

  .theme-toggle {
    border: 1px solid var(--color-border);
    background: var(--color-bg-elevated);
  }

  .avatar-wrap {
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 2px;
    border-radius: 50%;
    border: 1px solid var(--color-border-soft);
  }
}

.site-main {
  flex: 1;
  padding: 32px 0 48px;
}

.main-inner {
  display: block;
}

@media (max-width: 900px) {
  .nav {
    display: none;
  }
  .search-bar {
    display: none;
  }
}
</style>
