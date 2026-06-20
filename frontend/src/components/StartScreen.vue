<template>
  <div class="start-screen">
    <div class="background-effects">
      <div v-for="i in 20" :key="i" class="ember" :style="emberStyle(i)"></div>
    </div>

    <div class="content">
      <div class="title-container">
        <h1 class="game-title">🔥 火龙峡谷 🔥</h1>
        <p class="game-subtitle">Dragon Canyon Shooter</p>
      </div>

      <div class="dragon-icon">
        <svg viewBox="0 0 100 100" class="dragon-svg">
          <ellipse cx="50" cy="55" rx="30" ry="20" fill="#ff4500" />
          <ellipse cx="50" cy="55" rx="25" ry="16" fill="#ff6347" />
          <polygon points="80,55 95,45 90,60" fill="#ff4500" />
          <polygon points="80,55 95,65 90,50" fill="#cc3700" />
          <circle cx="72" cy="48" r="4" fill="#fff" />
          <circle cx="72" cy="48" r="2" fill="#111" />
          <polygon points="55,40 60,20 65,42" fill="#ff6347" />
          <polygon points="45,40 40,18 35,42" fill="#ff4500" />
          <polygon points="30,55 10,40 20,55" fill="#ff6347" />
          <polygon points="30,55 10,70 20,55" fill="#ff4500" />
          <circle cx="20" cy="55" r="8" fill="#ff8c00" opacity="0.8" />
          <circle cx="10" cy="55" r="5" fill="#ffd700" opacity="0.9" />
        </svg>
      </div>

      <div class="input-group">
        <label for="playerName">玩家名称</label>
        <input
          id="playerName"
          type="text"
          :value="playerName"
          @input="$emit('update:playerName', $event.target.value)"
          placeholder="输入你的名字"
          maxlength="20"
        />
      </div>

      <button class="start-btn" @click="$emit('start')">
        <span>开始冒险</span>
        <span class="btn-glow"></span>
      </button>

      <div class="instructions">
        <h3>操作说明</h3>
        <div class="instructions-grid">
          <div class="instruction-item">
            <span class="key">W A S D</span>
            <span class="desc">移动龙</span>
          </div>
          <div class="instruction-item">
            <span class="key">空格</span>
            <span class="desc">喷火（按住蓄力）</span>
          </div>
          <div class="instruction-item">
            <span class="key">Shift</span>
            <span class="desc">冲锋撞击</span>
          </div>
          <div class="instruction-item">
            <span class="key">E</span>
            <span class="desc">升级龙焰（消耗精华）</span>
          </div>
        </div>
      </div>

      <div class="enemy-info">
        <h3>敌人图鉴</h3>
        <div class="enemies">
          <div class="enemy-item">
            <div class="enemy-avatar stone"></div>
            <div class="enemy-detail">
              <span class="enemy-name">石像兵</span>
              <span class="enemy-hp">HP: 40 | 慢速近战</span>
            </div>
          </div>
          <div class="enemy-item">
            <div class="enemy-avatar hawk"></div>
            <div class="enemy-detail">
              <span class="enemy-name">飞鹰射手</span>
              <span class="enemy-hp">HP: 20 | 远程攻击</span>
            </div>
          </div>
          <div class="enemy-item">
            <div class="enemy-avatar rock"></div>
            <div class="enemy-detail">
              <span class="enemy-name">巨岩投手</span>
              <span class="enemy-hp">HP: 80 | 投掷巨石</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  playerName: {
    type: String,
    default: 'DragonRider'
  }
})
defineEmits(['start', 'update:playerName'])

const emberStyle = (i) => {
  const left = Math.random() * 100
  const delay = Math.random() * 5
  const duration = 3 + Math.random() * 4
  const size = 2 + Math.random() * 4
  return {
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
    width: `${size}px`,
    height: `${size}px`
  }
}
</script>

<style scoped>
.start-screen {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.background-effects {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.ember {
  position: absolute;
  bottom: -10px;
  background: radial-gradient(circle, #ffd700, #ff6347);
  border-radius: 50%;
  opacity: 0;
  animation: floatUp linear infinite;
  filter: blur(1px);
}

@keyframes floatUp {
  0% { transform: translateY(0) translateX(0); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 0.8; }
  100% { transform: translateY(-100vh) translateX(50px); opacity: 0; }
}

.content {
  position: relative;
  z-index: 10;
  text-align: center;
  padding: 40px;
  max-width: 600px;
  max-height: 95vh;
  overflow-y: auto;
}

.title-container {
  margin-bottom: 20px;
}

.game-title {
  font-size: 3rem;
  color: #ff6347;
  text-shadow: 0 0 20px #ff4500, 0 0 40px #ff4500, 0 0 60px #ff8c00;
  letter-spacing: 8px;
  animation: titleGlow 2s ease-in-out infinite alternate;
}

@keyframes titleGlow {
  from { text-shadow: 0 0 20px #ff4500, 0 0 40px #ff4500; }
  to { text-shadow: 0 0 30px #ff4500, 0 0 60px #ff4500, 0 0 80px #ff8c00; }
}

.game-subtitle {
  font-size: 1rem;
  color: #ffa07a;
  letter-spacing: 4px;
  margin-top: 8px;
  opacity: 0.8;
}

.dragon-icon {
  margin: 30px 0;
}

.dragon-svg {
  width: 140px;
  height: 140px;
  filter: drop-shadow(0 0 15px #ff4500);
  animation: dragonFloat 3s ease-in-out infinite;
}

@keyframes dragonFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

.input-group {
  margin-bottom: 25px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.input-group label {
  color: #ffa07a;
  font-size: 0.9rem;
  letter-spacing: 2px;
}

.input-group input {
  width: 280px;
  padding: 12px 20px;
  font-size: 1.1rem;
  border: 2px solid #ff6347;
  border-radius: 8px;
  background: rgba(20, 10, 30, 0.9);
  color: #fff;
  text-align: center;
  outline: none;
  transition: all 0.3s;
}

.input-group input:focus {
  border-color: #ffd700;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
}

.start-btn {
  position: relative;
  padding: 18px 60px;
  font-size: 1.4rem;
  font-weight: bold;
  color: #fff;
  background: linear-gradient(135deg, #ff4500, #ff6347);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  letter-spacing: 4px;
  overflow: hidden;
  transition: all 0.3s;
  box-shadow: 0 5px 30px rgba(255, 69, 0, 0.5);
}

.start-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 40px rgba(255, 69, 0, 0.7);
}

.start-btn:active {
  transform: translateY(0);
}

.btn-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transform: rotate(45deg);
  animation: btnShine 3s infinite;
}

@keyframes btnShine {
  0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
  100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
}

.instructions {
  margin-top: 35px;
  padding: 20px;
  background: rgba(20, 10, 30, 0.85);
  border-radius: 12px;
  border: 1px solid rgba(255, 99, 71, 0.3);
}

.instructions h3,
.enemy-info h3 {
  color: #ffd700;
  margin-bottom: 15px;
  letter-spacing: 2px;
}

.instructions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.instruction-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(255, 99, 71, 0.1);
  border-radius: 6px;
}

.key {
  display: inline-block;
  padding: 4px 10px;
  background: linear-gradient(135deg, #2a2a4a, #1a1a2a);
  border: 1px solid #ff6347;
  border-radius: 4px;
  color: #ffd700;
  font-size: 0.8rem;
  font-family: monospace;
}

.desc {
  color: #ffa07a;
  font-size: 0.85rem;
}

.enemy-info {
  margin-top: 25px;
  padding: 20px;
  background: rgba(20, 10, 30, 0.85);
  border-radius: 12px;
  border: 1px solid rgba(255, 99, 71, 0.3);
}

.enemies {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.enemy-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.enemy-avatar {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  flex-shrink: 0;
}

.enemy-avatar.stone {
  background: linear-gradient(135deg, #708090, #4a5568);
  box-shadow: inset 2px 2px 4px rgba(255, 255, 255, 0.2);
}

.enemy-avatar.hawk {
  background: linear-gradient(135deg, #8b4513, #654321);
  border-radius: 50%;
}

.enemy-avatar.rock {
  background: linear-gradient(135deg, #556b2f, #3d4a1f);
  border-radius: 40% 60% 50% 50%;
}

.enemy-detail {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.enemy-name {
  color: #fff;
  font-weight: bold;
  font-size: 0.95rem;
}

.enemy-hp {
  color: #888;
  font-size: 0.8rem;
}
</style>
