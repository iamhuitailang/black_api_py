<script setup lang="ts">
import { computed } from 'vue';
import { X, Play, Moon, Heart, Zap } from 'lucide-vue-next';
import { useGameStore } from '../stores/gameStore';
import ProgressBar from './ProgressBar.vue';
import { getFoodById } from '../data/foods';

const store = useGameStore();

const animal = computed(() => store.selectedAnimal);

const favoriteFood = computed(() => {
  if (!animal.value) return null;
  return getFoodById(animal.value.favoriteFood);
});

function close() {
  store.selectAnimal(null);
}

function play() {
  if (animal.value) {
    store.playWithAnimal(animal.value.id);
  }
}

function sleep() {
  if (animal.value) {
    store.putAnimalToSleep(animal.value.id);
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="animal" class="modal-overlay" @click.self="close">
        <div class="modal-content">
          <button class="close-btn" @click="close">
            <X :size="20" />
          </button>
          
          <div class="animal-header">
            <div class="animal-big-emoji">{{ animal.emoji }}</div>
            <div class="animal-info">
              <h2 class="animal-name">{{ animal.name }}</h2>
              <div class="animal-badges">
                <span class="badge level">Lv.{{ animal.level }}</span>
                <span class="badge personality">{{ animal.personality }}</span>
                <span class="badge talent">{{ animal.talent }}天赋</span>
              </div>
            </div>
          </div>

          <div class="stats-section">
            <h3 class="section-title">成长属性</h3>
            <div class="stats-list">
              <div class="stat-row">
                <span class="stat-label">
                  <Heart :size="16" color="#FF6B6B" /> 心情
                </span>
                <ProgressBar :value="animal.happiness" color="#FF6B6B" />
                <span class="stat-value">{{ animal.happiness }}%</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">
                  🧠 智力
                </span>
                <ProgressBar :value="animal.intelligence" color="#74B9FF" />
                <span class="stat-value">{{ animal.intelligence }}%</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">
                  <Zap :size="16" color="#FDCB6E" /> 精力
                </span>
                <ProgressBar :value="animal.energy" color="#FDCB6E" />
                <span class="stat-value">{{ animal.energy }}%</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">
                  🍪 饱腹
                </span>
                <ProgressBar :value="animal.hunger" color="#A29BFE" />
                <span class="stat-value">{{ animal.hunger }}%</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">
                  💖 好感度
                </span>
                <ProgressBar :value="animal.affection" color="#FF9FF3" />
                <span class="stat-value">{{ animal.affection }}%</span>
              </div>
            </div>
          </div>

          <div class="exp-section">
            <div class="exp-header">
              <span>经验值</span>
              <span>{{ animal.exp }} / {{ animal.maxExp }}</span>
            </div>
            <ProgressBar :value="animal.exp" :max="animal.maxExp" color="#00CEC9" size="lg" />
          </div>

          <div class="info-section">
            <div class="info-item">
              <span class="info-label">最喜欢的食物</span>
              <span class="info-value">
                {{ favoriteFood?.emoji }} {{ favoriteFood?.name || '未知' }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">已学会的动作</span>
              <span class="info-value">{{ animal.actions.join('、') }}</span>
            </div>
          </div>

          <div class="action-buttons">
            <button 
              class="action-btn play" 
              @click="play"
              :disabled="animal.isSleeping || animal.energy < 10"
            >
              <Play :size="18" />
              玩耍
            </button>
            <button 
              class="action-btn sleep" 
              @click="sleep"
              :disabled="animal.isSleeping"
            >
              <Moon :size="18" />
              {{ animal.isSleeping ? '睡眠中...' : '休息' }}
            </button>
          </div>

          <div v-if="animal.isGraduated" class="graduated-banner">
            🎓 已毕业
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 24px;
  padding: 28px;
  width: 90%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #F1F2F6;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #636E72;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #E5E7EB;
  color: #2D3436;
}

.animal-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.animal-big-emoji {
  font-size: 72px;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.animal-name {
  font-size: 28px;
  font-weight: 700;
  color: #2D3436;
  margin: 0 0 8px 0;
}

.animal-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.badge.level {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: white;
}

.badge.personality {
  background: #E8F5E9;
  color: #4CAF50;
}

.badge.talent {
  background: #FFF3E0;
  color: #FF9800;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #2D3436;
  margin: 0 0 16px 0;
}

.stats-section {
  margin-bottom: 20px;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-label {
  width: 80px;
  font-size: 13px;
  color: #636E72;
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-row .progress-bar {
  flex: 1;
}

.stat-value {
  width: 45px;
  text-align: right;
  font-size: 13px;
  font-weight: 600;
  color: #2D3436;
}

.exp-section {
  background: #F8F9FA;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 20px;
}

.exp-header {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #636E72;
  margin-bottom: 8px;
}

.info-section {
  background: #F0FFF4;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.info-item + .info-item {
  border-top: 1px dashed #C8F7D4;
}

.info-label {
  font-size: 13px;
  color: #636E72;
}

.info-value {
  font-size: 14px;
  font-weight: 500;
  color: #2D3436;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.play {
  background: linear-gradient(135deg, #5FCD9C 0%, #4ECDC4 100%);
  color: white;
}

.action-btn.play:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(95, 205, 156, 0.4);
}

.action-btn.sleep {
  background: linear-gradient(135deg, #A29BFE 0%, #6C5CE7 100%);
  color: white;
}

.action-btn.sleep:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(162, 155, 254, 0.4);
}

.graduated-banner {
  margin-top: 16px;
  padding: 12px;
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: white;
  text-align: center;
  border-radius: 12px;
  font-weight: 600;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9);
}
</style>
