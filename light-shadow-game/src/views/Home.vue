<template>
  <div class="home-container">
    <div class="particle-layer">
      <div v-for="i in 20" :key="i" class="floating-particle"
        :style="{
          left: Math.random() * 100 + '%',
          top: Math.random() * 100 + '%',
          animationDelay: Math.random() * 5 + 's',
          animationDuration: (3 + Math.random() * 4) + 's'
        }">
        ✨
      </div>
    </div>

    <div class="main-content">
      <div class="title-section">
        <h1 class="game-title">
          <span class="light-text">光</span>
          <span class="divider">与</span>
          <span class="shadow-text">影</span>
        </h1>
        <p class="subtitle">光影追逐之旅</p>
        <div class="character-preview">
          <span class="character-emoji" :style="{ color: gameStore.character.color }">
            {{ gameStore.character.emoji }}
          </span>
        </div>
      </div>

      <div class="menu-section">
        <button class="menu-btn primary" @click="startGame">
          <span class="btn-icon">▶</span>
          开始冒险
        </button>
        <button class="menu-btn" @click="goToLevels">
          <span class="btn-icon">🗺️</span>
          选择关卡
        </button>
        <button class="menu-btn" @click="showCharacters = true">
          <span class="btn-icon">{{ gameStore.character.emoji }}</span>
          选择角色
        </button>
        <button class="menu-btn" @click="toggleSound">
          <span class="btn-icon">{{ gameStore.soundEnabled ? '🔊' : '🔇' }}</span>
          {{ gameStore.soundEnabled ? '音效开' : '音效关' }}
        </button>
      </div>

      <div class="stats-section">
        <div class="stat-item">
          <span class="stat-icon">🌟</span>
          <span class="stat-label">光粒子</span>
          <span class="stat-value">{{ gameStore.totalLightParticles }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">✅</span>
          <span class="stat-label">完成关卡</span>
          <span class="stat-value">{{ gameStore.completedLevels.length }}/3</span>
        </div>
      </div>
    </div>

    <div v-if="showCharacters" class="character-modal" @click.self="showCharacters = false">
      <div class="modal-content">
        <h2>选择你的小伙伴</h2>
        <div class="character-list">
          <div v-for="char in gameStore.availableCharacters" :key="char.id"
            class="character-card"
            :class="{ selected: gameStore.character.emoji === char.emoji, locked: !char.unlocked }"
            @click="selectCharacter(char)">
            <span class="char-emoji" :style="{ color: char.color }">{{ char.emoji }}</span>
            <span class="char-name">{{ char.name }}</span>
            <span v-if="!char.unlocked" class="lock-icon">🔒</span>
          </div>
        </div>
        <p class="unlock-hint">收集更多光粒子解锁新角色！</p>
        <button class="close-btn" @click="showCharacters = false">确定</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'
import { playSound } from '../game/audio'

const router = useRouter()
const gameStore = useGameStore()
const showCharacters = ref(false)

const startGame = () => {
  playSound('click')
  router.push({ name: 'Game', params: { levelId: gameStore.currentLevel } })
}

const goToLevels = () => {
  playSound('click')
  router.push({ name: 'LevelSelect' })
}

const selectCharacter = (char) => {
  if (char.unlocked) {
    playSound('select')
    gameStore.selectCharacter(char.id)
  }
}

const toggleSound = () => {
  gameStore.toggleSound()
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
  background: linear-gradient(180deg, 
    #1a0a2e 0%, 
    #2d1b4e 30%, 
    #4a2c6d 60%, 
    #6b3fa0 100%);
  overflow: hidden;
}

.particle-layer {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.floating-particle {
  position: absolute;
  font-size: 16px;
  animation: floatUpDown ease-in-out infinite;
  opacity: 0.8;
}

@keyframes floatUpDown {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.6; }
  50% { transform: translateY(-30px) scale(1.2); opacity: 1; }
}

.main-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
  z-index: 10;
}

.title-section {
  text-align: center;
}

.game-title {
  font-size: 80px;
  font-weight: bold;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.light-text {
  background: linear-gradient(135deg, #FFD700, #FFA500, #FF6B35);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
  animation: glow 2s ease-in-out infinite;
}

.shadow-text {
  background: linear-gradient(135deg, #4a4a6a, #2d2d4e, #1a1a2e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 30px rgba(100, 100, 150, 0.5);
}

.divider {
  font-size: 40px;
  color: #fff;
  opacity: 0.6;
}

.subtitle {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 8px;
}

.character-preview {
  margin-top: 20px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px auto;
}

.character-emoji {
  font-size: 60px;
  animation: float 3s ease-in-out infinite;
  filter: drop-shadow(0 0 15px currentColor);
}

.menu-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 320px;
}

.menu-btn {
  padding: 16px 32px;
  font-size: 20px;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.2);
  font-weight: 600;
}

.menu-btn:hover {
  transform: translateY(-3px) scale(1.02);
  background: rgba(255, 255, 255, 0.2);
  box-shadow: 0 10px 40px rgba(255, 255, 255, 0.2);
}

.menu-btn.primary {
  background: linear-gradient(135deg, #FFD700, #FF8C00);
  color: #1a1a2e;
  border: none;
  box-shadow: 0 4px 20px rgba(255, 140, 0, 0.4);
}

.menu-btn.primary:hover {
  box-shadow: 0 8px 40px rgba(255, 140, 0, 0.6);
}

.btn-icon {
  font-size: 24px;
}

.stats-section {
  display: flex;
  gap: 40px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.05);
  padding: 16px 28px;
  border-radius: 16px;
  backdrop-filter: blur(5px);
}

.stat-icon {
  font-size: 28px;
}

.stat-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #FFD700;
}

.character-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: linear-gradient(135deg, #2d1b4e, #1a0a2e);
  padding: 40px;
  border-radius: 24px;
  text-align: center;
  border: 2px solid rgba(255, 255, 255, 0.1);
  min-width: 450px;
}

.modal-content h2 {
  color: white;
  margin-bottom: 24px;
  font-size: 28px;
}

.character-list {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 20px;
}

.character-card {
  padding: 24px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  min-width: 100px;
}

.character-card:hover:not(.locked) {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.15);
}

.character-card.selected {
  background: rgba(255, 215, 0, 0.2);
  border: 2px solid #FFD700;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
}

.character-card.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.char-emoji {
  font-size: 48px;
  display: block;
  margin-bottom: 8px;
  filter: drop-shadow(0 0 10px currentColor);
}

.char-name {
  color: white;
  font-size: 14px;
}

.lock-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 16px;
}

.unlock-hint {
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 20px;
  font-size: 14px;
}

.close-btn {
  padding: 12px 48px;
  font-size: 18px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #FFD700, #FF8C00);
  color: #1a1a2e;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.close-btn:hover {
  transform: scale(1.05);
}
</style>
