<template>
  <div class="home-container">
    <div class="background-animation"></div>
    
    <div class="content">
      <h1 class="game-title">背叛大炮飞人</h1>
      <p class="game-subtitle">操控飞人，蓄力发射，精准炮击，决出胜负！</p>
      
      <div class="player-setup">
        <div class="input-group">
          <label>玩家名称</label>
          <input 
            v-model="playerName" 
            type="text" 
            placeholder="请输入你的名字"
            maxlength="12"
          />
        </div>
      </div>
      
      <div class="mode-selection">
        <h3>选择游戏模式</h3>
        <div class="mode-buttons">
          <button 
            class="mode-btn" 
            :class="{ active: gameMode === 'single' }"
            @click="selectMode('single')"
          >
            <span class="mode-icon">🎮</span>
            <span class="mode-name">单人模式</span>
            <span class="mode-desc">挑战AI敌人</span>
          </button>
          <button 
            class="mode-btn" 
            :class="{ active: gameMode === 'double' }"
            @click="selectMode('double')"
          >
            <span class="mode-icon">👥</span>
            <span class="mode-name">双人对战</span>
            <span class="mode-desc">与好友对决</span>
          </button>
        </div>
      </div>
      
      <div class="scene-selection">
        <h3>选择战场场景</h3>
        <div class="scene-buttons">
          <button 
            v-for="scene in scenes" 
            :key="scene.name"
            class="scene-btn" 
            :class="{ active: currentScene === scene.name }"
            :style="{ '--accent-color': scene.accentColor }"
            @click="selectScene(scene.name)"
          >
            <span class="scene-preview" :style="{ background: `linear-gradient(135deg, ${scene.backgroundColor}, ${scene.groundColor})` }"></span>
            <span class="scene-name">{{ scene.displayName }}</span>
          </button>
        </div>
      </div>
      
      <button class="start-btn" @click="startGame">
        <span>开始游戏</span>
        <span class="arrow">→</span>
      </button>
      
      <div class="controls-info">
        <h4>操作说明</h4>
        <div class="controls-grid">
          <div class="control-item">
            <span class="key">←→</span>
            <span class="desc">左右移动</span>
          </div>
          <div class="control-item">
            <span class="key">↑↓</span>
            <span class="desc">调整高度</span>
          </div>
          <div class="control-item">
            <span class="key">空格/鼠标</span>
            <span class="desc">蓄力发射</span>
          </div>
          <div class="control-item">
            <span class="key">双击</span>
            <span class="desc">追踪飞弹</span>
          </div>
          <div class="control-item">
            <span class="key">ESC</span>
            <span class="desc">暂停游戏</span>
          </div>
        </div>
        <div v-if="gameMode === 'double'" class="player2-controls">
          <h5>玩家2操作</h5>
          <div class="controls-grid">
            <div class="control-item">
              <span class="key">A/D</span>
              <span class="desc">左右移动</span>
            </div>
            <div class="control-item">
              <span class="key">W/S</span>
              <span class="desc">调整高度</span>
            </div>
            <div class="control-item">
              <span class="key">J</span>
              <span class="desc">蓄力发射</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'
import { SCENE_CONFIGS } from '../game/constants'
import { playerApi } from '../services/api'

const router = useRouter()
const gameStore = useGameStore()

const playerName = ref(gameStore.playerName || '玩家')
const gameMode = ref(gameStore.gameMode || 'single')
const currentScene = ref(gameStore.currentScene || 'space')
const scenes = Object.values(SCENE_CONFIGS)

function selectMode(mode) {
  gameMode.value = mode
}

function selectScene(scene) {
  currentScene.value = scene
}

async function startGame() {
  if (!playerName.value.trim()) {
    playerName.value = '玩家'
  }
  
  gameStore.setPlayerName(playerName.value.trim())
  gameStore.setGameMode(gameMode.value)
  gameStore.setCurrentScene(currentScene.value)
  gameStore.resetGame()
  
  try {
    localStorage.removeItem('bet_game_state_' + (gameStore.playerId || ''))
  } catch (e) {
    console.log('清除旧存档失败')
  }
  
  try {
    const player = await playerApi.create(playerName.value.trim())
    if (player && player.id) {
      gameStore.setPlayerId(player.id)
    }
  } catch (e) {
    console.log('使用默认玩家ID')
  }
  
  router.push('/game')
}
</script>

<style scoped>
.home-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0a0a1a 100%);
  overflow-x: hidden;
  overflow-y: auto;
  padding: 20px 0;
}

.background-animation {
  position: fixed;
  inset: 0;
  background-image: 
    radial-gradient(2px 2px at 20px 30px, #fff, transparent),
    radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.8), transparent),
    radial-gradient(1px 1px at 90px 40px, #fff, transparent),
    radial-gradient(2px 2px at 160px 120px, rgba(255,255,255,0.9), transparent),
    radial-gradient(1px 1px at 230px 80px, #fff, transparent),
    radial-gradient(2px 2px at 300px 150px, rgba(255,255,255,0.7), transparent);
  background-size: 350px 200px;
  animation: twinkle 5s ease-in-out infinite;
  pointer-events: none;
}

@keyframes twinkle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.content {
  position: relative;
  z-index: 10;
  max-width: 900px;
  width: 90%;
  padding: 30px;
  background: rgba(20, 20, 40, 0.9);
  border-radius: 20px;
  border: 1px solid rgba(74, 144, 217, 0.3);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  margin: 20px auto;
}

.game-title {
  font-size: 48px;
  font-weight: bold;
  text-align: center;
  background: linear-gradient(135deg, #4a90d9, #9b59b6, #ff6b6b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 10px;
  text-shadow: 0 0 40px rgba(74, 144, 217, 0.5);
}

.game-subtitle {
  text-align: center;
  color: #a0a0c0;
  font-size: 18px;
  margin-bottom: 30px;
}

.player-setup {
  margin-bottom: 30px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  color: #c0c0e0;
  font-size: 14px;
}

.input-group input {
  padding: 12px 16px;
  border: 2px solid rgba(74, 144, 217, 0.3);
  border-radius: 10px;
  background: rgba(30, 30, 50, 0.8);
  color: #fff;
  font-size: 16px;
  transition: all 0.3s;
}

.input-group input:focus {
  border-color: #4a90d9;
  outline: none;
  box-shadow: 0 0 20px rgba(74, 144, 217, 0.3);
}

.mode-selection, .scene-selection {
  margin-bottom: 25px;
}

.mode-selection h3, .scene-selection h3 {
  color: #e0e0ff;
  margin-bottom: 15px;
  font-size: 18px;
}

.mode-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.mode-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  background: rgba(40, 40, 70, 0.8);
  border: 2px solid rgba(74, 144, 217, 0.3);
  border-radius: 12px;
  color: #fff;
  transition: all 0.3s;
}

.mode-btn:hover {
  border-color: #4a90d9;
  transform: translateY(-2px);
}

.mode-btn.active {
  background: rgba(74, 144, 217, 0.3);
  border-color: #4a90d9;
  box-shadow: 0 0 20px rgba(74, 144, 217, 0.4);
}

.mode-icon {
  font-size: 32px;
}

.mode-name {
  font-size: 18px;
  font-weight: bold;
}

.mode-desc {
  font-size: 13px;
  color: #a0a0c0;
}

.scene-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.scene-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 15px;
  background: rgba(40, 40, 70, 0.8);
  border: 2px solid rgba(74, 144, 217, 0.3);
  border-radius: 10px;
  color: #fff;
  transition: all 0.3s;
}

.scene-btn:hover {
  border-color: var(--accent-color, #4a90d9);
  transform: translateY(-2px);
}

.scene-btn.active {
  background: rgba(74, 144, 217, 0.2);
  border-color: var(--accent-color, #4a90d9);
  box-shadow: 0 0 15px var(--accent-color, #4a90d9);
}

.scene-preview {
  width: 60px;
  height: 40px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.scene-name {
  font-size: 14px;
}

.start-btn {
  width: 100%;
  padding: 18px;
  margin-top: 10px;
  background: linear-gradient(135deg, #4a90d9, #9b59b6);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.start-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(74, 144, 217, 0.5);
}

.arrow {
  transition: transform 0.3s;
}

.start-btn:hover .arrow {
  transform: translateX(5px);
}

.controls-info {
  margin-top: 30px;
  padding: 20px;
  background: rgba(30, 30, 50, 0.6);
  border-radius: 10px;
}

.controls-info h4 {
  color: #c0c0e0;
  margin-bottom: 15px;
  font-size: 16px;
}

.controls-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.control-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.key {
  padding: 6px 12px;
  background: rgba(74, 144, 217, 0.3);
  border: 1px solid rgba(74, 144, 217, 0.5);
  border-radius: 6px;
  font-size: 13px;
  font-weight: bold;
  color: #fff;
}

.desc {
  font-size: 12px;
  color: #9090b0;
}

.player2-controls {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.player2-controls h5 {
  color: #ff6b6b;
  margin-bottom: 12px;
  font-size: 14px;
}
</style>
