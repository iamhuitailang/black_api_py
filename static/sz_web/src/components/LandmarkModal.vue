<script setup lang="ts">
import { useGameStore } from '../stores/gameStore';
import { useUiStore } from '../stores/uiStore';
import { LANDMARKS } from '../utils/constants';
import { X, Lock } from 'lucide-vue-next';

const gameStore = useGameStore();
const uiStore = useUiStore();

function isUnlocked(landmark: typeof LANDMARKS[string]) {
  return gameStore.unlockedLandmarks.includes(
    Object.keys(LANDMARKS).find(key => LANDMARKS[key] === landmark) || ''
  );
}

function isBuilt(landmarkKey: string) {
  return gameStore.landmarks.includes(landmarkKey);
}

function buildLandmark(key: string) {
  gameStore.buildLandmark(key);
}
</script>

<template>
  <div v-if="uiStore.showLandmarkModal" class="modal-overlay" @click.self="uiStore.closeAllModals()">
    <div class="modal">
      <div class="modal-header">
        <h2>🏛️ 地标建筑</h2>
        <button class="close-btn" @click="uiStore.closeAllModals()">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="modal-content">
        <p class="modal-description">
          建造地标建筑可以大幅提升城市形象和市民幸福度
        </p>

        <div class="landmarks-grid">
          <div
            v-for="(landmark, key) in LANDMARKS"
            :key="key"
            class="landmark-card"
            :class="{
              locked: !isUnlocked(landmark),
              built: isBuilt(key)
            }"
          >
            <div class="landmark-icon">{{ landmark.icon }}</div>
            <div class="landmark-content">
              <h3>{{ landmark.name }}</h3>
              <p class="description">{{ landmark.description }}</p>

              <div class="effects">
                <span class="effect-tag">幸福度 +{{ landmark.happinessEffect }}</span>
                <span v-if="landmark.taxBonus" class="effect-tag">收入 +{{ landmark.taxBonus }}/天</span>
              </div>

              <div class="cost-row">
                <span class="cost">💰 {{ landmark.cost.toLocaleString() }}</span>
              </div>

              <div v-if="!isUnlocked(landmark)" class="lock-overlay">
                <Lock class="w-6 h-6" />
                <span>需要「{{ landmark.unlockStage === 'town' ? '小镇' : landmark.unlockStage === 'city' ? '城市' : landmark.unlockStage === 'metropolis' ? '大都市' : '村庄' }}」等级解锁</span>
              </div>

              <button
                v-else-if="!isBuilt(key)"
                class="build-btn"
                :class="{ disabled: gameStore.resources.money < landmark.cost }"
                :disabled="gameStore.resources.money < landmark.cost"
                @click="buildLandmark(key)"
              >
                {{ gameStore.resources.money >= landmark.cost ? '建造' : '金币不足' }}
              </button>

              <div v-else class="built-badge">
                ✓ 已建造
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal {
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  border-radius: 16px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h2 {
  color: white;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.modal-content {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-description {
  color: #94a3b8;
  margin-bottom: 24px;
  font-size: 14px;
}

.landmarks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.landmark-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  position: relative;
  transition: all 0.2s ease;
}

.landmark-card:hover:not(.locked):not(.built) {
  border-color: rgba(251, 191, 36, 0.5);
  background: rgba(251, 191, 36, 0.05);
}

.landmark-card.locked {
  opacity: 0.5;
}

.landmark-card.built {
  border-color: rgba(74, 222, 128, 0.5);
  background: rgba(74, 222, 128, 0.05);
}

.landmark-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 12px;
}

.landmark-content h3 {
  color: white;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  text-align: center;
}

.landmark-content .description {
  color: #94a3b8;
  font-size: 12px;
  margin: 0 0 12px 0;
  text-align: center;
}

.effects {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin-bottom: 12px;
}

.effect-tag {
  font-size: 11px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #e2e8f0;
}

.cost-row {
  text-align: center;
  margin-bottom: 12px;
}

.cost {
  color: #fbbf24;
  font-weight: 600;
  font-size: 14px;
}

.build-btn {
  width: 100%;
  padding: 10px;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  border: none;
  border-radius: 8px;
  color: #1e293b;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.build-btn:hover:not(.disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
}

.build-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.lock-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #94a3b8;
  font-size: 12px;
  text-align: center;
  padding: 16px;
}

.built-badge {
  width: 100%;
  padding: 10px;
  background: rgba(74, 222, 128, 0.2);
  border: 1px solid rgba(74, 222, 128, 0.5);
  border-radius: 8px;
  color: #4ade80;
  font-weight: 600;
  text-align: center;
}
</style>
