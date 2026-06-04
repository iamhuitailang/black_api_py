<script setup lang="ts">
import { useGameStore } from '../stores/gameStore';
import { Coins, Users, Smile, Zap, Droplets, Calendar } from 'lucide-vue-next';

const gameStore = useGameStore();

function getHappinessColor(happiness: number) {
  if (happiness >= 70) return 'text-green-400';
  if (happiness >= 40) return 'text-yellow-400';
  return 'text-red-400';
}

function getResourceColor(current: number, max: number) {
  if (max === 0) return 'text-gray-400';
  const ratio = current / max;
  if (ratio >= 0.8) return 'text-green-400';
  if (ratio >= 0.5) return 'text-yellow-400';
  return 'text-red-400';
}
</script>

<template>
  <div class="status-bar">
    <div class="city-info">
      <span class="city-name">{{ gameStore.cityName }}</span>
      <span class="stage-badge" :style="{ backgroundColor: gameStore.currentStage.color }">
        {{ gameStore.currentStage.name }}
      </span>
    </div>

    <div class="resources">
      <div class="resource-item" title="金币">
        <Coins class="w-4 h-4 text-yellow-400" />
        <span class="resource-value">{{ gameStore.resources.money.toLocaleString() }}</span>
      </div>

      <div class="resource-item" title="人口">
        <Users class="w-4 h-4 text-blue-400" />
        <span class="resource-value">
          {{ gameStore.resources.population.toLocaleString() }}
          <span class="resource-max">/ {{ gameStore.currentStage.maxPopulation.toLocaleString() }}</span>
        </span>
      </div>

      <div class="resource-item" title="幸福度">
        <Smile class="w-4 h-4" :class="getHappinessColor(gameStore.resources.happiness)" />
        <span class="resource-value" :class="getHappinessColor(gameStore.resources.happiness)">
          {{ Math.round(gameStore.resources.happiness) }}%
        </span>
      </div>

      <div class="resource-item" title="电力供应">
        <Zap class="w-4 h-4" :class="getResourceColor(gameStore.resources.electricity, gameStore.resources.maxElectricity)" />
        <span class="resource-value" :class="getResourceColor(gameStore.resources.electricity, gameStore.resources.maxElectricity)">
          {{ gameStore.resources.maxElectricity }}
        </span>
      </div>

      <div class="resource-item" title="水资源供应">
        <Droplets class="w-4 h-4" :class="getResourceColor(gameStore.resources.water, gameStore.resources.maxWater)" />
        <span class="resource-value" :class="getResourceColor(gameStore.resources.water, gameStore.resources.maxWater)">
          {{ gameStore.resources.maxWater }}
        </span>
      </div>

      <div class="resource-item day" title="游戏天数">
        <Calendar class="w-4 h-4 text-purple-400" />
        <span class="resource-value">第 {{ gameStore.day }} 天</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.status-bar {
  height: 56px;
  background: linear-gradient(90deg, #1e293b 0%, #0f172a 50%, #1e293b 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.city-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.city-name {
  color: white;
  font-size: 18px;
  font-weight: 600;
}

.stage-badge {
  padding: 4px 12px;
  border-radius: 20px;
  color: white;
  font-size: 12px;
  font-weight: 600;
}

.resources {
  display: flex;
  align-items: center;
  gap: 20px;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #e2e8f0;
}

.resource-value {
  font-size: 14px;
  font-weight: 500;
}

.resource-max {
  color: #64748b;
  font-size: 12px;
}

.resource-item.day {
  padding-left: 16px;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
