<template>
  <div class="home-container">
    <div class="cloud cloud1"></div>
    <div class="cloud cloud2"></div>
    <div class="cloud cloud3"></div>
    
    <div class="floating-elements">
      <div class="floating-block block1"></div>
      <div class="floating-block block2"></div>
      <div class="floating-block block3"></div>
    </div>

    <div class="content">
      <div class="title-section">
        <h1 class="title rainbow-glow">🎠 平衡积木乐园 🎠</h1>
        <p class="subtitle">搭建你的梦想城堡，抵御风雨的考验！</p>
      </div>
      
      <div class="menu-buttons">
        <button class="btn btn-primary float-animation" @click="startGame" style="animation-delay: 0s">
          🎮 开始游戏
        </button>
        <button class="btn btn-secondary float-animation" @click="goLevels" style="animation-delay: 0.2s">
          🗺️ 选择关卡
        </button>
        <button class="btn btn-success float-animation" @click="goRanking" style="animation-delay: 0.4s">
          🏆 排行榜
        </button>
      </div>

      <div class="tips-card card">
        <h3>💡 游戏小贴士</h3>
        <ul>
          <li>🎯 从工具栏拖拽建材到搭建区</li>
          <li>✋ 按住已放置的方块可以拖动调整</li>
          <li>🔄 点击方块可以旋转或删除</li>
          <li>⚖️ 注意控制重心，保持结构平衡</li>
          <li>🌬️ 高级关卡会有风压挑战</li>
          <li>🏗️ 达到目标高度即可过关胜利</li>
        </ul>
      </div>

      <div class="block-showcase">
        <div class="showcase-item">
          <div class="showcase-block red"></div>
          <span>实心方块</span>
        </div>
        <div class="showcase-item">
          <div class="showcase-block cyan"></div>
          <span>空心框架</span>
        </div>
        <div class="showcase-item">
          <div class="showcase-block yellow"></div>
          <span>斜角支架</span>
        </div>
        <div class="showcase-item">
          <div class="showcase-block green"></div>
          <span>长条横梁</span>
        </div>
        <div class="showcase-item">
          <div class="showcase-block purple"></div>
          <span>配重铁块</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function startGame() {
  router.push('/game/1')
}

function goLevels() {
  router.push('/levels')
}

function goRanking() {
  router.push('/ranking')
}
</script>

<style scoped>
.home-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: linear-gradient(180deg, #87CEEB 0%, #B8E6FF 20%, #E0F7E0 60%, #90EE90 100%);
  overflow-y: auto;
  overflow-x: hidden;
}

.floating-elements {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.floating-block {
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  opacity: 0.4;
  animation: floatBlock 6s ease-in-out infinite;
}

.floating-block::after {
  content: '';
  position: absolute;
  top: 15%;
  left: 15%;
  width: 30%;
  height: 30%;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
}

.block1 {
  top: 15%;
  left: 20%;
  background: linear-gradient(135deg, #FF9A9E 0%, #FF6B9D 100%);
  animation-delay: 0s;
  transform: rotate(-15deg);
}

.block2 {
  top: 60%;
  right: 15%;
  background: linear-gradient(135deg, #98E4E9 0%, #4ECDC4 100%);
  animation-delay: -2s;
  width: 35px;
  height: 35px;
  transform: rotate(10deg);
}

.block3 {
  bottom: 25%;
  left: 10%;
  background: linear-gradient(135deg, #FFF6B7 0%, #FFE66D 100%);
  animation-delay: -4s;
  width: 45px;
  height: 30px;
  transform: rotate(-5deg);
}

@keyframes floatBlock {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-20px) rotate(5deg); }
  50% { transform: translateY(0) rotate(0deg); }
  75% { transform: translateY(15px) rotate(-5deg); }
}

.content {
  text-align: center;
  z-index: 10;
  padding: 30px;
}

.title-section {
  margin-bottom: 40px;
}

.title {
  font-size: 60px;
  margin-bottom: 20px;
}

.subtitle {
  font-size: 22px;
  color: #666;
  margin-bottom: 40px;
}

.menu-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

.btn {
  padding: 20px 45px;
  font-size: 20px;
  border-radius: 35px;
}

.tips-card {
  max-width: 500px;
  margin: 0 auto 40px;
  text-align: left;
}

.tips-card h3 {
  color: #FF6B9D;
  margin-bottom: 15px;
  text-align: center;
  font-size: 20px;
}

.tips-card ul {
  list-style: none;
}

.tips-card li {
  padding: 10px 0;
  color: #555;
  border-bottom: 2px dashed #FFE4E9;
  font-size: 15px;
}

.tips-card li:last-child {
  border-bottom: none;
}

.block-showcase {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-top: 30px;
  flex-wrap: wrap;
}

.showcase-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.showcase-block {
  width: 45px;
  height: 45px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.15), inset -3px -3px 8px rgba(0,0,0,0.1), inset 3px 3px 8px rgba(255,255,255,0.3);
  position: relative;
  overflow: hidden;
}

.showcase-block::after {
  content: '';
  position: absolute;
  top: 15%;
  left: 15%;
  width: 35%;
  height: 35%;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  filter: blur(2px);
}

.showcase-block.red {
  background: linear-gradient(135deg, #FF9A9E 0%, #FF6B9D 100%);
}

.showcase-block.cyan {
  background: linear-gradient(135deg, #98E4E9 0%, #4ECDC4 100%);
}

.showcase-block.yellow {
  background: linear-gradient(135deg, #FFF6B7 0%, #FFE66D 100%);
}

.showcase-block.green {
  background: linear-gradient(135deg, #C1F5E3 0%, #95E1D3 100%);
  height: 25px;
}

.showcase-block.purple {
  background: linear-gradient(135deg, #A89DB4 0%, #6C5B7B 100%);
}

.showcase-item span {
  font-size: 11px;
  color: #888;
}
</style>
