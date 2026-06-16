<template>
  <div class="mission-panel" v-if="visible">
    <div class="panel-overlay" @click="$emit('close')"></div>
    <div class="panel-content">
      <div class="panel-header">
        <h2>🗺️ 星图任务</h2>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>
      
      <div class="systems-tabs">
        <button 
          v-for="system in systems" 
          :key="system.id"
          class="system-tab"
          :class="{ 
            active: activeSystem === system.id,
            locked: !isSystemUnlocked(system.id)
          }"
          @click="selectSystem(system.id)"
        >
          <span class="tab-icon">{{ getSystemIcon(system.id) }}</span>
          <span class="tab-name">{{ system.name }}</span>
          <span v-if="!isSystemUnlocked(system.id)" class="lock-icon">🔒</span>
        </button>
      </div>
      
      <div class="system-info">
        <h3>{{ currentSystem?.name }}</h3>
        <p>{{ currentSystem?.description }}</p>
      </div>
      
      <div class="zones-list">
        <div 
          v-for="zone in currentSystem?.zones" 
          :key="zone.id"
          class="zone-item"
          :class="{ 
            completed: isZoneCompleted(currentSystem.id, zone.id),
            current: isCurrentZone(currentSystem.id, zone.id),
            locked: !isZoneUnlocked(currentSystem.id, zone.id)
          }"
          @click="selectZone(currentSystem.id, zone.id)"
        >
          <div class="zone-status">
            <span v-if="isZoneCompleted(currentSystem.id, zone.id)" class="status-icon done">✓</span>
            <span v-else-if="isZoneUnlocked(currentSystem.id, zone.id)" class="status-icon todo">○</span>
            <span v-else class="status-icon locked">🔒</span>
          </div>
          <div class="zone-info">
            <div class="zone-name">{{ zone.name }}</div>
            <div class="zone-stats">
              <span>🪨 {{ zone.debrisCount }} 碎片</span>
              <span>⚠️ 危险度 {{ Math.round(zone.dangerLevel * 100) }}%</span>
              <span>🎯 {{ zone.requiredValue }} 金目标</span>
            </div>
          </div>
          <div v-if="isCurrentZone(currentSystem.id, zone.id)" class="current-badge">当前</div>
        </div>
      </div>
      
      <div class="panel-footer">
        <div class="hint">完成当前星系所有任务解锁下一星系</div>
        <button 
          class="start-btn" 
          :disabled="!canStart"
          @click="confirmSelect"
        >
          开始任务
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { SYSTEMS } from '../constants/systems.js'

const props = defineProps({
  visible: { type: Boolean, default: false },
  currentSystemId: { type: Number, default: 0 },
  currentZoneId: { type: Number, default: 0 },
  zoneCompleted: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'select'])

const systems = SYSTEMS
const activeSystem = ref(props.currentSystemId)
const selectedZone = ref(props.currentZoneId)

const currentSystem = computed(() => systems[activeSystem.value])

const canStart = computed(() => {
  return isZoneUnlocked(activeSystem.value, selectedZone.value)
})

function isSystemUnlocked(systemId) {
  if (systemId === 0) return true
  const prevZones = props.zoneCompleted[systemId - 1]
  if (!prevZones) return false
  return prevZones.every(completed => completed)
}

function isZoneUnlocked(systemId, zoneId) {
  if (!isSystemUnlocked(systemId)) return false
  if (zoneId === 0) return true
  return props.zoneCompleted[systemId]?.[zoneId - 1] === true
}

function isZoneCompleted(systemId, zoneId) {
  return props.zoneCompleted[systemId]?.[zoneId] === true
}

function isCurrentZone(systemId, zoneId) {
  return systemId === props.currentSystemId && zoneId === props.currentZoneId
}

function selectSystem(systemId) {
  if (!isSystemUnlocked(systemId)) return
  activeSystem.value = systemId
  selectedZone.value = 0
}

function selectZone(systemId, zoneId) {
  if (!isZoneUnlocked(systemId, zoneId)) return
  activeSystem.value = systemId
  selectedZone.value = zoneId
}

function confirmSelect() {
  if (!canStart.value) return
  emit('select', { systemId: activeSystem.value, zoneId: selectedZone.value })
}

function getSystemIcon(id) {
  const icons = ['🌍', '🪨', '🌌']
  return icons[id] || '⭐'
}
</script>

<style scoped>
.mission-panel {
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
  width: 600px;
  max-height: 85vh;
  background: linear-gradient(135deg, #0a1628, #0f172a);
  border: 2px solid rgba(74, 158, 255, 0.5);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(74, 158, 255, 0.3);
}

.panel-header h2 {
  margin: 0;
  color: #4a9eff;
  font-size: 22px;
  flex: 1;
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

.systems-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.system-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(74, 158, 255, 0.2);
  border-radius: 10px;
  color: #888;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.system-tab:hover:not(.locked) {
  background: rgba(74, 158, 255, 0.1);
  border-color: rgba(74, 158, 255, 0.4);
}

.system-tab.active {
  background: rgba(74, 158, 255, 0.15);
  border-color: #4a9eff;
  color: #fff;
}

.system-tab.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.tab-icon {
  font-size: 24px;
}

.tab-name {
  font-size: 12px;
  font-weight: bold;
}

.lock-icon {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 12px;
}

.system-info {
  margin-bottom: 16px;
  padding: 12px 16px;
  background: rgba(74, 158, 255, 0.1);
  border-radius: 8px;
}

.system-info h3 {
  margin: 0 0 4px 0;
  color: #4a9eff;
  font-size: 18px;
}

.system-info p {
  margin: 0;
  font-size: 12px;
  color: #aaa;
}

.zones-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  padding-right: 4px;
}

.zone-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(74, 158, 255, 0.15);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.zone-item:hover:not(.locked) {
  background: rgba(74, 158, 255, 0.08);
  border-color: rgba(74, 158, 255, 0.4);
}

.zone-item.completed {
  border-color: rgba(74, 222, 128, 0.4);
}

.zone-item.current {
  border-color: #ffd700;
  background: rgba(255, 215, 0, 0.05);
}

.zone-item.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.zone-status {
  width: 28px;
  text-align: center;
}

.status-icon {
  font-size: 18px;
}

.status-icon.done {
  color: #4ade80;
}

.status-icon.todo {
  color: #4a9eff;
}

.status-icon.locked {
  font-size: 14px;
}

.zone-info {
  flex: 1;
}

.zone-name {
  font-size: 15px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 4px;
}

.zone-stats {
  display: flex;
  gap: 16px;
  font-size: 11px;
  color: #888;
}

.current-badge {
  padding: 4px 10px;
  background: #ffd700;
  color: #000;
  border-radius: 12px;
  font-size: 11px;
  font-weight: bold;
}

.panel-footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(74, 158, 255, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hint {
  font-size: 12px;
  color: #666;
}

.start-btn {
  padding: 12px 32px;
  background: linear-gradient(135deg, #4ade80, #22c55e);
  border: none;
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  font-size: 15px;
  transition: all 0.2s;
}

.start-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 222, 128, 0.4);
}

.start-btn:disabled {
  background: #333;
  color: #666;
  cursor: not-allowed;
}

.zones-list::-webkit-scrollbar {
  width: 6px;
}

.zones-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.zones-list::-webkit-scrollbar-thumb {
  background: rgba(74, 158, 255, 0.3);
  border-radius: 3px;
}
</style>
