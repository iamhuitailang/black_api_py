<script setup lang="ts">
defineProps<{
  value: number;
  max?: number;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}>();
</script>

<template>
  <div class="progress-bar" :class="[size || 'md']">
    <div 
      class="progress-fill" 
      :style="{ 
        width: `${Math.min(100, (value / (max || 100)) * 100)}%`,
        backgroundColor: color || '#5FCD9C'
      }"
    />
  </div>
</template>

<style scoped>
.progress-bar {
  background: #E5E7EB;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-bar.sm {
  height: 6px;
}

.progress-bar.md {
  height: 10px;
}

.progress-bar.lg {
  height: 14px;
}

.progress-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.5s ease;
}
</style>
