<template>
  <div class="game-over" v-if="visible">
    <div class="overlay"></div>
    <div class="content">
      <h2>💥 飞船损毁</h2>
      <p class="subtitle">你的太空清理之旅暂时结束了...</p>
      
      <div class="stats">
        <div class="stat-item">
          <span class="stat-label">本局收益</span>
          <span class="stat-value gold">+{{ sessionScore }} 💰</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">收集碎片</span>
          <span class="stat-value">{{ debrisCollected }} 个</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">总金币</span>
          <span class="stat-value gold">{{ totalMoney }} 💰</span>
        </div>
      </div>
      
      <div class="actions">
        <button class="btn primary" @click="$emit('restart')">
          🔄 重新开始
        </button>
        <button class="btn secondary" @click="$emit('upgrade')">
          🔧 升级装备
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  sessionScore: { type: Number, default: 0 },
  debrisCollected: { type: Number, default: 0 },
  totalMoney: { type: Number, default: 0 }
})

defineEmits(['restart', 'upgrade'])
</script>

<style scoped>
.game-over {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
}

.content {
  position: relative;
  background: linear-gradient(135deg, #1a0a0a, #2a1010);
  border: 2px solid rgba(239, 68, 68, 0.5);
  border-radius: 16px;
  padding: 32px 48px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(239, 68, 68, 0.3);
}

h2 {
  margin: 0 0 8px 0;
  color: #ef4444;
  font-size: 28px;
}

.subtitle {
  margin: 0 0 24px 0;
  color: #aaa;
  font-size: 14px;
}

.stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  gap: 40px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.stat-label {
  color: #888;
  font-size: 14px;
}

.stat-value {
  color: #fff;
  font-weight: bold;
  font-size: 16px;
}

.stat-value.gold {
  color: #ffd700;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  font-size: 14px;
  transition: all 0.2s;
}

.btn.primary {
  background: linear-gradient(135deg, #4a9eff, #2a6ecc);
  color: #fff;
}

.btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 158, 255, 0.4);
}

.btn.secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn.secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
