<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { Home, GraduationCap, Utensils, ShoppingBag } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();

const navItems = [
  { path: '/', name: '园区', icon: Home },
  { path: '/class', name: '上课', icon: GraduationCap },
  { path: '/feed', name: '喂食', icon: Utensils },
  { path: '/shop', name: '商店', icon: ShoppingBag },
];
</script>

<template>
  <nav class="navbar">
    <div class="nav-container">
      <div class="logo">
        <span class="logo-emoji">🏫</span>
        <span class="logo-text">动物幼儿园</span>
      </div>
      <div class="nav-links">
        <button 
          v-for="item in navItems" 
          :key="item.path"
          class="nav-item"
          :class="{ active: route.path === item.path }"
          @click="router.push(item.path)"
        >
          <component :is="item.icon" :size="20" />
          <span>{{ item.name }}</span>
        </button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-emoji {
  font-size: 28px;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #FF9F43 0%, #FF6B6B 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-links {
  display: flex;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  background: transparent;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #636E72;
  transition: all 0.2s;
}

.nav-item:hover {
  background: #F8F9FA;
  color: #2D3436;
}

.nav-item.active {
  background: linear-gradient(135deg, #FF9F43 0%, #FFB347 100%);
  color: white;
}
</style>
