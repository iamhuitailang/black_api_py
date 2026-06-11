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
    </aside>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
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

.main-content {
  flex: 1;
  margin-left: 220px;
  padding: 24px;
}
</style>
