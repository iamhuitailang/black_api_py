<script setup lang="ts">
import { useGameStore } from '../stores/gameStore';

const gameStore = useGameStore();

function getNotificationClass(type: string) {
  const classes = ['notification'];
  switch (type) {
    case 'success':
      classes.push('success');
      break;
    case 'error':
      classes.push('error');
      break;
    case 'warning':
      classes.push('warning');
      break;
    default:
      classes.push('info');
  }
  return classes.join(' ');
}
</script>

<template>
  <div class="notifications-container">
    <TransitionGroup name="notification">
      <div
        v-for="notification in gameStore.notifications"
        :key="notification.id"
        :class="getNotificationClass(notification.type)"
      >
        {{ notification.message }}
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.notifications-container {
  position: fixed;
  top: 80px;
  right: 320px;
  z-index: 999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 300px;
}

.notification {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
}

.notification.info {
  background: rgba(59, 130, 246, 0.9);
  color: white;
}

.notification.success {
  background: rgba(34, 197, 94, 0.9);
  color: white;
}

.notification.error {
  background: rgba(239, 68, 68, 0.9);
  color: white;
}

.notification.warning {
  background: rgba(245, 158, 11, 0.9);
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
</style>
