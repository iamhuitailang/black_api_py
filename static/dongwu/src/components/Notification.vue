<script setup lang="ts">
import { useGameStore } from '../stores/gameStore';

const store = useGameStore();
</script>

<template>
  <div class="notification-container">
    <TransitionGroup name="notification">
      <div 
        v-for="notification in store.notifications" 
        :key="notification.id"
        class="notification"
        :class="notification.type"
      >
        {{ notification.message }}
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.notification-container {
  position: fixed;
  top: 100px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notification {
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease;
}

.notification.success {
  background: linear-gradient(135deg, #5FCD9C 0%, #4ECDC4 100%);
  color: white;
}

.notification.info {
  background: linear-gradient(135deg, #74B9FF 0%, #0984E3 100%);
  color: white;
}

.notification.warning {
  background: linear-gradient(135deg, #FDCB6E 0%, #E17055 100%);
  color: white;
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100px);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100px);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
