<template>
  <div class="gameover">
    <div class="gameover-bg"></div>
    <div class="gameover-content">
      <h1 class="gameover-title">💀 任务失败</h1>
      <div class="gameover-stats">
        <div class="stat-item">
          <span class="stat-label">到达关卡</span>
          <span class="stat-value">第 {{ level }} 关</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">最终得分</span>
          <span class="stat-value">{{ score }}</span>
        </div>
      </div>
      <p class="gameover-message">战士倒下了，但使命永不终结！</p>
      <div class="gameover-buttons">
        <button class="btn btn-primary" @click="$emit('restart')">
          🔄 重新开始
        </button>
        <button class="btn btn-secondary" @click="$emit('menu')">
          🏠 返回主菜单
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  score: { type: Number, required: true },
  level: { type: Number, required: true }
})

defineEmits(['restart', 'menu'])
</script>

<style scoped>
.gameover {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gameover-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #2d1b1b 0%, #4a1c1c 50%, #1a0a0a 100%);
  z-index: 0;
}

.gameover-content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 60px;
}

.gameover-title {
  font-size: 56px;
  color: #d63031;
  margin-bottom: 40px;
  text-shadow: 0 0 30px rgba(214, 48, 49, 0.8);
}

.gameover-stats {
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 300px;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  font-size: 18px;
  color: #b2bec3;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #fdcb6e;
}

.gameover-message {
  font-size: 20px;
  color: #81ecec;
  margin-bottom: 40px;
  letter-spacing: 2px;
}

.gameover-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
}
</style>
