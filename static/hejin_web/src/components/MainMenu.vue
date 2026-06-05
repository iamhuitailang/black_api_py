<template>
  <div class="main-menu">
    <div class="menu-bg"></div>
    <div class="menu-content">
      <h1 class="game-title">
        <span class="title-cn">合金弹头</span>
        <span class="title-en">METAL SLUG</span>
      </h1>
      <div class="soldier-icon">🎖️</div>
      <p class="subtitle">解放军战士 - 保家卫国</p>
      <div class="menu-buttons">
        <button class="btn btn-primary" @click="$emit('start')">
          🎮 开始游戏
        </button>
        <button class="btn btn-secondary" @click="$emit('shop')">
          🛒 武器商店
        </button>
      </div>
      <div class="controls-info">
        <h3>操作说明</h3>
        <div class="controls-grid">
          <div class="control-item">
            <span class="key">A/D</span>
            <span class="desc">左右移动</span>
          </div>
          <div class="control-item">
            <span class="key">W/S</span>
            <span class="desc">上下瞄准</span>
          </div>
          <div class="control-item">
            <span class="key">空格</span>
            <span class="desc">跳跃</span>
          </div>
          <div class="control-item">
            <span class="key">J</span>
            <span class="desc">射击</span>
          </div>
          <div class="control-item">
            <span class="key">K</span>
            <span class="desc">手榴弹</span>
          </div>
          <div class="control-item">
            <span class="key">Q</span>
            <span class="desc">切换武器</span>
          </div>
          <div class="control-item">
            <span class="key">E</span>
            <span class="desc">进入/离开载具</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['start', 'shop'])
</script>

<style scoped>
.main-menu {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  z-index: 0;
}

.menu-bg::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(circle at 20% 80%, rgba(255, 107, 53, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(9, 132, 227, 0.3) 0%, transparent 50%);
}

.menu-content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 40px;
}

.game-title {
  margin-bottom: 20px;
}

.title-cn {
  display: block;
  font-size: 72px;
  font-weight: 900;
  background: linear-gradient(180deg, #ff6b35 0%, #d63031 50%, #e17055 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 40px rgba(255, 107, 53, 0.5);
  letter-spacing: 8px;
}

.title-en {
  display: block;
  font-size: 24px;
  color: #fdcb6e;
  letter-spacing: 12px;
  margin-top: 10px;
}

.soldier-icon {
  font-size: 80px;
  margin: 20px 0;
  animation: salute 2s ease-in-out infinite;
}

@keyframes salute {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
}

.subtitle {
  font-size: 20px;
  color: #81ecec;
  margin-bottom: 40px;
  letter-spacing: 4px;
}

.menu-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 50px;
}

.controls-info {
  background: rgba(0, 0, 0, 0.5);
  border-radius: 16px;
  padding: 24px 32px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.controls-info h3 {
  color: #fdcb6e;
  margin-bottom: 20px;
  font-size: 18px;
}

.controls-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px 32px;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.key {
  background: linear-gradient(180deg, #636e72 0%, #2d3436 100%);
  padding: 6px 12px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 14px;
  font-weight: bold;
  color: #fff;
  min-width: 50px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.desc {
  color: #b2bec3;
  font-size: 14px;
}
</style>
