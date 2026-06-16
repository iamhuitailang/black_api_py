<template>
  <div class="menu-buttons">
    <button class="menu-btn" @click="$emit('upgrade')" title="升级商店">
      <span class="btn-icon">🔧</span>
      <span class="btn-text">升级</span>
    </button>
    <button class="menu-btn" @click="$emit('mission')" title="任务星图">
      <span class="btn-icon">🗺️</span>
      <span class="btn-text">星图</span>
    </button>
    <button class="menu-btn" @click="$emit('restart')" title="重新开始">
      <span class="btn-icon">🔄</span>
      <span class="btn-text">重开</span>
    </button>
    <button class="menu-btn" @click="$emit('sound')" :class="{ muted: !soundEnabled }" title="音效开关">
      <span class="btn-icon">{{ soundEnabled ? '🔊' : '🔇' }}</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  soundEnabled: { type: Boolean, default: true }
})

defineEmits(['upgrade', 'mission', 'restart', 'sound'])
</script>

<style scoped>
.menu-buttons {
  position: absolute;
  top: 15px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 10;
}

.menu-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 14px;
  background: rgba(0, 20, 40, 0.8);
  border: 1px solid rgba(74, 158, 255, 0.5);
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s;
  backdrop-filter: blur(5px);
}

.menu-btn:hover {
  background: rgba(74, 158, 255, 0.2);
  border-color: #4a9eff;
  transform: translateY(-2px);
}

.btn-icon {
  font-size: 20px;
}

.btn-text {
  font-size: 10px;
}

.menu-btn.muted {
  opacity: 0.5;
}
</style>
