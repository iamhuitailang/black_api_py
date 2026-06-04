<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../stores/gameStore';
import { useUiStore } from '../stores/uiStore';
import { BUILDING_TYPES } from '../utils/constants';
import { Hammer, Trash2, Sparkles } from 'lucide-vue-next';

const gameStore = useGameStore();
const uiStore = useUiStore();

const buildingCategories = computed(() => {
  const categories: Record<string, Array<{ key: string; name: string; icon: string; cost: number; unlocked: boolean }>> = {
    infrastructure: [],
    zone: [],
    service: []
  };

  Object.entries(BUILDING_TYPES).forEach(([key, building]) => {
    const category = building.category || 'other';
    if (!categories[category]) categories[category] = [];
    categories[category].push({
      key,
      name: building.name,
      icon: building.icon,
      cost: building.cost,
      unlocked: gameStore.unlockedBuildings.includes(key)
    });
  });

  return categories;
});

const categoryNames: Record<string, string> = {
  infrastructure: '🏗️ 基础设施',
  zone: '🏘️ 区域规划',
  service: '🏥 公共服务'
};

function isToolActive(tool: string) {
  return uiStore.selectedTool === tool;
}

function selectTool(tool: string) {
  uiStore.selectTool(tool);
}
</script>

<template>
  <div class="toolbar">
    <div class="toolbar-header">
      <Hammer class="w-5 h-5" />
      <span>建造工具</span>
    </div>

    <div class="tool-group">
      <button
        class="tool-btn demolish"
        :class="{ active: isToolActive('demolish') }"
        @click="selectTool('demolish')"
        title="拆除建筑（返还50%金币）"
      >
        <Trash2 class="w-5 h-5" />
        <span>拆除</span>
      </button>
    </div>

    <div v-for="(buildings, category) in buildingCategories" :key="category" class="tool-group">
      <div class="group-title">{{ categoryNames[category] || category }}</div>
      <div class="tool-grid">
        <button
          v-for="building in buildings"
          :key="building.key"
          class="tool-btn building"
          :class="{
            active: isToolActive(building.key),
            locked: !building.unlocked,
            disabled: gameStore.resources.money < building.cost
          }"
          :disabled="!building.unlocked"
          @click="selectTool(building.key)"
          :title="`${building.name} - 💰${building.cost}`"
        >
          <span class="building-icon">{{ building.icon }}</span>
          <span class="building-name">{{ building.name }}</span>
          <span class="building-cost">💰{{ building.cost }}</span>
          <span v-if="!building.unlocked" class="lock-icon">🔒</span>
        </button>
      </div>
    </div>

    <div class="toolbar-footer">
      <button
        class="landmark-btn"
        @click="uiStore.openLandmarkModal()"
      >
        <Sparkles class="w-5 h-5" />
        <span>地标建筑</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  width: 220px;
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.toolbar-header {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-weight: 600;
  font-size: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.tool-group {
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.group-title {
  color: #94a3b8;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.tool-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
  gap: 2px;
}

.tool-btn:hover:not(.disabled):not(.locked) {
  background: rgba(74, 144, 217, 0.3);
  border-color: rgba(74, 144, 217, 0.5);
  transform: translateY(-1px);
}

.tool-btn.active {
  background: rgba(74, 144, 217, 0.4);
  border-color: #4A90D9;
  box-shadow: 0 0 12px rgba(74, 144, 217, 0.4);
}

.tool-btn.demolish {
  width: 100%;
  flex-direction: row;
  justify-content: center;
  gap: 6px;
  padding: 10px;
}

.tool-btn.demolish.active {
  background: rgba(239, 68, 68, 0.4);
  border-color: #ef4444;
  box-shadow: 0 0 12px rgba(239, 68, 68, 0.4);
}

.tool-btn.locked {
  opacity: 0.4;
  cursor: not-allowed;
}

.tool-btn.disabled {
  opacity: 0.5;
}

.building-icon {
  font-size: 20px;
}

.building-name {
  font-size: 10px;
  text-align: center;
}

.building-cost {
  font-size: 9px;
  color: #fbbf24;
}

.lock-icon {
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 10px;
}

.toolbar-footer {
  padding: 12px;
  margin-top: auto;
}

.landmark-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  border: none;
  border-radius: 8px;
  color: #1e293b;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.landmark-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
}
</style>
