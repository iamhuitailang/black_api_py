<script setup lang="ts">
import { useGameStore } from '../stores/gameStore';
import { useUiStore } from '../stores/uiStore';
import { POLICIES } from '../utils/constants';
import { X } from 'lucide-vue-next';

const gameStore = useGameStore();
const uiStore = useUiStore();

function isActive(policyKey: string) {
  return gameStore.activePolicies.includes(policyKey);
}

function togglePolicy(key: string) {
  gameStore.togglePolicy(key);
}
</script>

<template>
  <div v-if="uiStore.showPolicyModal" class="modal-overlay" @click.self="uiStore.closeAllModals()">
    <div class="modal">
      <div class="modal-header">
        <h2>📋 政策管理</h2>
        <button class="close-btn" @click="uiStore.closeAllModals()">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="modal-content">
        <p class="modal-description">
          制定政策来影响城市的发展方向，不同政策有不同的效果和成本
        </p>

        <div class="policies-list">
          <div
            v-for="(policy, key) in POLICIES"
            :key="key"
            class="policy-card"
            :class="{ active: isActive(key) }"
          >
            <div class="policy-info">
              <h3>{{ policy.name }}</h3>
              <p class="description">{{ policy.description }}</p>
              <div class="policy-cost">
                <span v-if="policy.cost > 0">启用成本: 💰 {{ policy.cost }}</span>
                <span v-else class="free">免费政策</span>
              </div>
            </div>
            <div class="policy-toggle">
              <button
                class="toggle-btn"
                :class="{ active: isActive(key) }"
                @click="togglePolicy(key)"
                :disabled="!isActive(key) && gameStore.resources.money < policy.cost"
              >
                {{ isActive(key) ? '已启用' : '启用' }}
              </button>
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
  max-width: 600px;
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

.policies-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.policy-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.policy-card:hover {
  border-color: rgba(74, 144, 217, 0.4);
}

.policy-card.active {
  border-color: rgba(74, 144, 217, 0.6);
  background: rgba(74, 144, 217, 0.1);
}

.policy-info h3 {
  color: white;
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 6px 0;
}

.policy-info .description {
  color: #94a3b8;
  font-size: 12px;
  margin: 0 0 8px 0;
}

.policy-cost {
  font-size: 12px;
}

.policy-cost .free {
  color: #4ade80;
}

.policy-cost span:not(.free) {
  color: #fbbf24;
}

.toggle-btn {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #94a3b8;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.toggle-btn:hover:not(:disabled) {
  background: rgba(74, 144, 217, 0.2);
  border-color: rgba(74, 144, 217, 0.5);
  color: white;
}

.toggle-btn.active {
  background: rgba(74, 144, 217, 0.3);
  border-color: #4A90D9;
  color: #4A90D9;
}

.toggle-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
