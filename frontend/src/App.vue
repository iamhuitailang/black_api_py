<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="logo">
        <h2>📝 会议纪要</h2>
      </div>
      <nav class="nav-menu">
        <router-link to="/meetings" class="nav-item">
          <span class="nav-icon">📋</span>
          <span>纪要列表</span>
        </router-link>
        <router-link to="/action-items" class="nav-item">
          <span class="nav-icon">✅</span>
          <span>待办事项</span>
        </router-link>
        <router-link to="/projects" class="nav-item">
          <span class="nav-icon">📁</span>
          <span>项目管理</span>
        </router-link>
        <router-link to="/stats" class="nav-item">
          <span class="nav-icon">📊</span>
          <span>统计分析</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="reminder-status" @click="handleReminderToggle">
          <span class="reminder-icon">{{ notificationEnabled ? '🔔' : '🔕' }}</span>
          <span class="reminder-text">
            {{ notificationEnabled ? '桌面提醒已开启' : '点击开启桌面提醒' }}
          </span>
        </div>
        <p class="footer-tip">
          开启后，待办到期时会弹出桌面通知
        </p>
      </div>
    </aside>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useReminder } from './composables/useReminder'

const {
  hasNotificationSupport,
  notificationEnabled,
  requestPermission,
  startChecking,
  stopChecking
} = useReminder()

const reminderStatus = ref('')

async function handleReminderToggle() {
  if (!hasNotificationSupport) {
    alert('您的浏览器不支持桌面通知功能')
    return
  }
  if (notificationEnabled.value) {
    stopChecking()
    notificationEnabled.value = false
  } else {
    const granted = await requestPermission()
    if (granted) {
      startChecking(30000)
      alert('桌面提醒已开启！待办到期时会在桌面弹出通知。\n\n提示：请保持浏览器标签页打开，提醒才能正常工作。')
    } else {
      alert('通知权限被拒绝，请在浏览器地址栏左侧的🔒图标中修改通知权限设置。')
    }
  }
}

onMounted(() => {
  if (hasNotificationSupport && Notification.permission === 'granted') {
    notificationEnabled.value = true
    startChecking(30000)
  }
})

onUnmounted(() => {
  stopChecking()
})
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 220px;
  background-color: #f9fafb;
  border-right: 1px solid #e5e7eb;
  padding: 20px 0;
  position: fixed;
  height: 100vh;
  overflow-y: auto;
}

.logo {
  padding: 0 20px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.logo h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.nav-menu {
  padding: 12px 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  color: #4b5563;
  font-size: 14px;
  transition: all 0.2s;
}

.nav-item:hover {
  background-color: #f3f4f6;
  text-decoration: none;
  color: #1f2937;
}

.nav-item.router-link-active {
  background-color: #eff6ff;
  color: #2563eb;
  font-weight: 500;
}

.nav-icon {
  font-size: 18px;
}

.sidebar-footer {
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.reminder-status {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background-color: #eff6ff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.reminder-status:hover {
  background-color: #dbeafe;
}

.reminder-icon {
  font-size: 20px;
}

.reminder-text {
  font-size: 12px;
  color: #2563eb;
  font-weight: 500;
  line-height: 1.4;
}

.footer-tip {
  margin: 8px 4px 0;
  font-size: 11px;
  color: #9ca3af;
  line-height: 1.5;
}

.main-content {
  flex: 1;
  margin-left: 220px;
  padding: 24px;
}
</style>
