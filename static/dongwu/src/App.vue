<script setup lang="ts">
import { RouterView } from 'vue-router';
import NavBar from './components/NavBar.vue';
import StatusBar from './components/StatusBar.vue';
import AnimalDetail from './components/AnimalDetail.vue';
import Notification from './components/Notification.vue';
</script>

<template>
  <div class="app">
    <NavBar />
    <main class="main-content">
      <div class="container">
        <StatusBar />
        <RouterView />
      </div>
    </main>
    <AnimalDetail />
    <Notification />
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  background: linear-gradient(180deg, #FFF8E7 0%, #FFE4E1 50%, #E8F5E9 100%);
}

.main-content {
  padding: 20px 0 40px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}
</style>
