<template>
  <div class="toast-container">
    <div
      v-for="msg in toastStore.messages"
      :key="msg.id"
      class="toast"
      :class="'toast-' + msg.type"
    >
      {{ msg.message }}
    </div>
  </div>
</template>

<script setup>
import { useToastStore } from '../store'

const toastStore = useToastStore()
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toast {
  padding: 12px 20px;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast-success {
  background: #22c55e;
}

.toast-error {
  background: #ef4444;
}

.toast-warning {
  background: #f59e0b;
}

.toast-info {
  background: #3b82f6;
}
</style>
