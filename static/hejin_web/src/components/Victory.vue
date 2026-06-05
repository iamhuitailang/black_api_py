<template>
  <div class="victory">
    <div class="victory-bg"></div>
    <div class="victory-content">
      <h1 class="victory-title">🏆 任务完成！</h1>
      <div class="trophy">🎖️</div>
      <div class="victory-stats">
        <div class="stat-item">
          <span class="stat-label">最终得分</span>
          <span class="stat-value">{{ score }}</span>
        </div>
      </div>
      <p class="victory-message">祖国和人民为你骄傲！</p>
      <button class="btn btn-primary" @click="$emit('menu')">
        🏠 返回主菜单
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  score: { type: Number, required: true }
})

defineEmits(['menu'])
</script>

<style scoped>
.victory {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.victory-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a472a 0%, #2d6a4f 50%, #1b4332 100%);
  z-index: 0;
}

.victory-content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 60px;
}

.victory-title {
  font-size: 56px;
  color: #fdcb6e;
  margin-bottom: 20px;
  text-shadow: 0 0 30px rgba(253, 203, 110, 0.8);
}

.trophy {
  font-size: 120px;
  margin: 30px 0;
  animation: bounce 1s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.victory-stats {
  background: rgba(0, 0, 0, 0.5);
  border-radius: 16px;
  padding: 30px 50px;
  margin-bottom: 30px;
  display: inline-block;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  min-width: 300px;
}

.stat-label {
  font-size: 18px;
  color: #b2bec3;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #fdcb6e;
}

.victory-message {
  font-size: 24px;
  color: #81ecec;
  margin-bottom: 40px;
  letter-spacing: 2px;
}
</style>
