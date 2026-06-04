<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGameStore } from '../stores/gameStore';
import { useUiStore } from '../stores/uiStore';
import { BUILDING_TYPES, LANDMARKS } from '../utils/constants';
import { BarChart3, Users, TrendingUp, Building2 } from 'lucide-vue-next';

const gameStore = useGameStore();
const uiStore = useUiStore();

const activeTab = ref('overview');

const tabs = [
  { id: 'overview', name: '概览', icon: BarChart3 },
  { id: 'population', name: '人口', icon: Users },
  { id: 'economy', name: '经济', icon: TrendingUp },
  { id: 'landmarks', name: '地标', icon: Building2 }
];

const selectedTileInfo = computed(() => {
  if (!uiStore.selectedTile) return null;
  const { x, y } = uiStore.selectedTile;
  const tile = gameStore.map[y][x];
  if (tile.building) {
    return BUILDING_TYPES[tile.building];
  }
  return null;
});

const buildingCount = computed(() => {
  const count: Record<string, number> = {};
  for (let y = 0; y < 20; y++) {
    for (let x = 0; x < 20; x++) {
      const tile = gameStore.map[y][x];
      if (tile.building) {
        count[tile.building] = (count[tile.building] || 0) + 1;
      }
    }
  }
  return count;
});

const builtLandmarks = computed(() => {
  return gameStore.landmarks.map(key => ({
    key,
    ...LANDMARKS[key]
  }));
});
</script>

<template>
  <div class="info-panel">
    <div class="panel-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-btn"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <component :is="tab.icon" class="w-4 h-4" />
        <span>{{ tab.name }}</span>
      </button>
    </div>

    <div class="panel-content">
      <div v-if="activeTab === 'overview'" class="tab-content">
        <div v-if="selectedTileInfo" class="tile-info">
          <div class="tile-info-header">
            <span class="tile-icon">{{ selectedTileInfo.icon }}</span>
            <div>
              <h3>{{ selectedTileInfo.name }}</h3>
              <p class="text-sm text-gray-400">{{ selectedTileInfo.description }}</p>
            </div>
          </div>
          <div class="tile-stats">
            <div v-if="selectedTileInfo.populationCapacity" class="stat">
              <span class="label">人口容量</span>
              <span class="value">{{ selectedTileInfo.populationCapacity }}</span>
            </div>
            <div v-if="selectedTileInfo.taxIncome" class="stat">
              <span class="label">税收收入</span>
              <span class="value text-yellow-400">+{{ selectedTileInfo.taxIncome }}/天</span>
            </div>
            <div v-if="selectedTileInfo.maintenanceCost" class="stat">
              <span class="label">维护成本</span>
              <span class="value text-red-400">-{{ selectedTileInfo.maintenanceCost }}/天</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-tile">
          <p>点击地图上的建筑查看详情</p>
        </div>

        <div class="quick-stats">
          <h4>城市统计</h4>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">建筑总数</span>
              <span class="stat-value">{{ Object.values(buildingCount).reduce((a, b) => a + b, 0) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">地标建筑</span>
              <span class="stat-value">{{ builtLandmarks.length }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'population'" class="tab-content">
        <h3 class="section-title">人口统计</h3>
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">当前人口</span>
            <span class="stat-card-value text-blue-400">{{ gameStore.resources.population.toLocaleString() }}</span>
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill bg-blue-500"
              :style="{ width: `${(gameStore.resources.population / gameStore.currentStage.maxPopulation) * 100}%` }"
            ></div>
          </div>
          <p class="text-xs text-gray-400 mt-2">上限: {{ gameStore.currentStage.maxPopulation.toLocaleString() }}</p>
        </div>

        <div class="stat-card mt-4">
          <div class="stat-card-header">
            <span class="stat-card-title">市民幸福度</span>
            <span class="stat-card-value" :class="gameStore.resources.happiness >= 70 ? 'text-green-400' : gameStore.resources.happiness >= 40 ? 'text-yellow-400' : 'text-red-400'">
              {{ Math.round(gameStore.resources.happiness) }}%
            </span>
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill"
              :class="gameStore.resources.happiness >= 70 ? 'bg-green-500' : gameStore.resources.happiness >= 40 ? 'bg-yellow-500' : 'bg-red-500'"
              :style="{ width: `${gameStore.resources.happiness}%` }"
            ></div>
          </div>
        </div>

        <div class="hint-box mt-4">
          <p class="text-sm">💡 建造更多服务设施（医院、学校、公园）可以提升幸福度</p>
        </div>
      </div>

      <div v-if="activeTab === 'economy'" class="tab-content">
        <h3 class="section-title">经济状况</h3>
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-card-title">当前资金</span>
            <span class="stat-card-value text-yellow-400">💰 {{ gameStore.resources.money.toLocaleString() }}</span>
          </div>
        </div>

        <div class="building-list mt-4">
          <h4 class="mb-2">建筑收支明细</h4>
          <div
            v-for="(count, key) in buildingCount"
            :key="key"
            class="building-item"
          >
            <span class="building-name">
              {{ BUILDING_TYPES[key]?.icon }} {{ BUILDING_TYPES[key]?.name }} ({{ count }})
            </span>
            <span class="building-income">
              {{ ((BUILDING_TYPES[key]?.taxIncome || 0) - (BUILDING_TYPES[key]?.maintenanceCost || 0)) * count >= 0 ? '+' : '' }}
              {{ ((BUILDING_TYPES[key]?.taxIncome || 0) - (BUILDING_TYPES[key]?.maintenanceCost || 0)) * count }}/天
            </span>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'landmarks'" class="tab-content">
        <h3 class="section-title">已建造地标</h3>
        <div v-if="builtLandmarks.length > 0" class="landmarks-list">
          <div
            v-for="landmark in builtLandmarks"
            :key="landmark.key"
            class="landmark-card"
          >
            <span class="landmark-icon">{{ landmark.icon }}</span>
            <div class="landmark-info">
              <h4>{{ landmark.name }}</h4>
              <p class="text-xs text-gray-400">{{ landmark.description }}</p>
              <div class="landmark-effects">
                <span class="effect-tag">幸福度 +{{ landmark.happinessEffect }}</span>
                <span v-if="landmark.taxBonus" class="effect-tag">收入 +{{ landmark.taxBonus }}</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <p class="text-gray-400">还没有建造地标</p>
          <button
            class="btn-primary mt-4"
            @click="uiStore.openLandmarkModal()"
          >
            建造地标
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.info-panel {
  width: 300px;
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
}

.panel-tabs {
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.tab-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 11px;
}

.tab-btn:hover {
  color: #94a3b8;
}

.tab-btn.active {
  color: #4A90D9;
  border-bottom: 2px solid #4A90D9;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.tab-content {
  color: #e2e8f0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
}

.tile-info {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.tile-info-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.tile-icon {
  font-size: 32px;
}

.tile-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat .label {
  font-size: 11px;
  color: #64748b;
}

.stat .value {
  font-size: 14px;
  font-weight: 600;
}

.empty-tile {
  text-align: center;
  padding: 32px 16px;
  color: #64748b;
}

.quick-stats h4 {
  font-size: 14px;
  margin-bottom: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stat-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 11px;
  color: #64748b;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 16px;
}

.stat-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.stat-card-title {
  font-size: 14px;
  color: #94a3b8;
}

.stat-card-value {
  font-size: 20px;
  font-weight: 700;
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.hint-box {
  background: rgba(74, 144, 217, 0.1);
  border: 1px solid rgba(74, 144, 217, 0.3);
  border-radius: 8px;
  padding: 12px;
  color: #94a3b8;
}

.building-list h4 {
  font-size: 14px;
  color: #94a3b8;
}

.building-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.building-name {
  font-size: 13px;
}

.building-income {
  font-size: 13px;
  font-weight: 600;
  color: #4ade80;
}

.landmarks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.landmark-card {
  display: flex;
  gap: 12px;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 8px;
  padding: 12px;
}

.landmark-icon {
  font-size: 32px;
}

.landmark-info h4 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}

.landmark-effects {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.effect-tag {
  font-size: 10px;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.empty-state {
  text-align: center;
  padding: 32px 16px;
}

.btn-primary {
  padding: 10px 20px;
  background: linear-gradient(135deg, #4A90D9 0%, #3b82f6 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 144, 217, 0.4);
}
</style>
