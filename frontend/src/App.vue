<template>
  <div id="app-layout">
    <aside class="sidebar">
      <div class="logo">
        <span class="logo-icon">📊</span>
        <span class="logo-text">KPI 管理系统</span>
      </div>
      <nav class="nav-menu">
        <router-link to="/" class="nav-item" exact>
          <span class="nav-icon">🏠</span><span>工作台</span>
        </router-link>
        <router-link to="/cycles" class="nav-item">
          <span class="nav-icon">📅</span><span>考核周期管理</span>
        </router-link>
        <router-link to="/self-review" class="nav-item">
          <span class="nav-icon">✍️</span><span>员工自评</span>
        </router-link>
        <router-link to="/supervisor-review" class="nav-item">
          <span class="nav-icon">✅</span><span>上级评分</span>
        </router-link>
        <router-link to="/statistics" class="nav-item">
          <span class="nav-icon">📈</span><span>统计分析</span>
        </router-link>
        <router-link to="/my-history" class="nav-item">
          <span class="nav-icon">📜</span><span>我的历史</span>
        </router-link>
      </nav>
    </aside>
    <main class="main-content">
      <header class="top-bar">
        <div class="breadcrumb">
          <span>{{ currentPageTitle }}</span>
        </div>
        <div class="user-info">
          <select v-model="currentUserId" class="user-select" @change="onUserChange">
            <option v-for="u in users" :key="u.user_id" :value="u.user_id">
              {{ u.name }} - {{ u.department }} ({{ u.role === 'admin' ? '管理员' : u.role === 'manager' ? '组长' : '员工' }})
            </option>
          </select>
        </div>
      </header>
      <div class="content-area">
        <router-view v-if="currentUser" :key="$route.fullPath" :user="currentUser" />
        <div v-else class="loading-box">加载中...</div>
      </div>
    </main>
  </div>
</template>

<script setup>import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from './utils/api';
const route = useRoute();
const users = ref([]);
const currentUserId = ref(4);
const currentUser = ref(null);
const pageTitles = {
 '/': '工作台',
 '/cycles': '考核周期管理',
 '/self-review': '员工自评',
 '/supervisor-review': '上级评分',
 '/statistics': '统计分析',
 '/my-history': '我的历史绩效'
};
const currentPageTitle = computed(() => {
 return pageTitles[route.path] || '绩效考核系统';
});
onMounted(async () => {
 try {
 const res = await api.getEmployees();
 users.value = res.data || [];
 if (users.value.length > 0) {
 const user4 = users.value.find(u => u.user_id === 4);
 if (user4)
 currentUserId.value = 4;
 else
 currentUserId.value = users.value[0].user_id;
 await loadCurrentUser();
 }
 }
 catch (e) {
 console.error('加载用户列表失败', e);
 }
});
const loadCurrentUser = async () => {
 try {
 const res = await api.getEmployeeByUser(currentUserId.value);
 currentUser.value = res.data || null;
 }
 catch (e) {
 console.error('加载当前用户失败', e);
 }
};
const onUserChange = () => {
 loadCurrentUser();
};
</script>
