<template>
  <div class="upgrade-panel" v-if="visible">
    <div class="panel-overlay" @click="$emit('close')"></div>
    <div class="panel-content">
      <div class="panel-header">
        <h2>🔧 升级商店</h2>
        <div class="money-display">💰 {{ money }} 金币</div>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>
      
      <div class="upgrade-list">
        <div 
          v-for="upgrade in upgrades" 
          :key="upgrade.id"
          class="upgrade-item"
          :class="{ 
            'max-level': getLevel(upgrade.id) >= upgrade.maxLevel,
            'can-afford': canAfford(upgrade.id)
          }"
        >
          <div class="upgrade-icon">{{ getUpgradeIcon(upgrade.id) }}</div>
          <div class="upgrade-info">
            <div class="upgrade-name">{{ upgrade.name }}</div>
            <div class="upgrade-desc">{{ upgrade.description }}</div>
            <div class="upgrade-effect">{{ upgrade.effect }}</div>
            <div class="upgrade-level">
              等级: 
              <span v-for="i in upgrade.maxLevel" :key="i" class="level-dot"
                :class="{ filled: i <= getLevel(upgrade.id) }">●</span>
              ({{ getLevel(upgrade.id) }}/{{ upgrade.maxLevel }})
            </div>
          </div>
          <div class="upgrade-action">
            <button 
              v-if="getLevel(upgrade.id) < upgrade.maxLevel"
              class="buy-btn"
              :disabled="!canAfford(upgrade.id)"
              @click="$emit('buy', upgrade.id)"
            >
              {{ getCost(upgrade.id) }} 💰
            </button>
            <div v-else class="max-label">已满级</div>
          </div>
        </div>
      </div>
      
      <div class="panel-footer">
        <div class="hint">提示：升级后立即生效</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { UPGRADE_LIST, getUpgradeCost } from '../constants/upgrades.js'

const props = defineProps({
  visible: { type: Boolean, default: false },
  money: { type: Number, default: 0 },
  levels: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['close', 'buy'])

const upgrades = UPGRADE_LIST

function getLevel(upgradeId) {
  return props.levels[upgradeId] || 0
}

function getCost(upgradeId) {
  const upgrade = upgrades.find(u => u.id === upgradeId)
  if (!upgrade) return 0
  return getUpgradeCost(upgrade, getLevel(upgradeId))
}

function canAfford(upgradeId) {
  return props.money >= getCost(upgradeId)
}

function getUpgradeIcon(id) {
  const icons = {
    engine: '🚀',
    fuel_tank: '⛽',
    armor: '🛡️',
    pick_radius: '🧲'
  }
  return icons[id] || '⚙️'
}
</script>

<style scoped>
.upgrade-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.panel-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
}

.panel-content {
  position: relative;
  width: 560px;
  max-height: 80vh;
  background: linear-gradient(135deg, #0a1628, #0f172a);
  border: 2px solid rgba(74, 158, 255, 0.5);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(74, 158, 255, 0.3);
}

.panel-header h2 {
  margin: 0;
  color: #4a9eff;
  font-size: 24px;
  flex: 1;
}

.money-display {
  font-size: 18px;
  font-weight: bold;
  color: #ffd700;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.upgrade-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 50vh;
  overflow-y: auto;
  padding-right: 8px;
}

.upgrade-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(74, 158, 255, 0.2);
  border-radius: 12px;
  transition: all 0.2s;
}

.upgrade-item.can-afford {
  border-color: rgba(74, 222, 128, 0.5);
}

.upgrade-item.max-level {
  opacity: 0.6;
}

.upgrade-icon {
  font-size: 36px;
  width: 60px;
  text-align: center;
}

.upgrade-info {
  flex: 1;
}

.upgrade-name {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 4px;
}

.upgrade-desc {
  font-size: 12px;
  color: #aaa;
  margin-bottom: 4px;
}

.upgrade-effect {
  font-size: 11px;
  color: #4ade80;
  margin-bottom: 6px;
}

.upgrade-level {
  font-size: 12px;
  color: #888;
}

.level-dot {
  color: #333;
  font-size: 10px;
  margin: 0 1px;
}

.level-dot.filled {
  color: #4a9eff;
}

.upgrade-action {
  min-width: 100px;
  text-align: center;
}

.buy-btn {
  padding: 10px 16px;
  background: linear-gradient(135deg, #4a9eff, #2a6ecc);
  border: none;
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  font-size: 14px;
  transition: all 0.2s;
}

.buy-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 158, 255, 0.4);
}

.buy-btn:disabled {
  background: #333;
  color: #666;
  cursor: not-allowed;
}

.max-label {
  color: #ffd700;
  font-weight: bold;
  font-size: 14px;
}

.panel-footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(74, 158, 255, 0.2);
  text-align: center;
}

.hint {
  font-size: 12px;
  color: #666;
}

.upgrade-list::-webkit-scrollbar {
  width: 6px;
}

.upgrade-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.upgrade-list::-webkit-scrollbar-thumb {
  background: rgba(74, 158, 255, 0.3);
  border-radius: 3px;
}
</style>
