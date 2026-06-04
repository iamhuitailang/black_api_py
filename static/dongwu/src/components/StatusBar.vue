<script setup lang="ts">
import { computed } from 'vue';
import { Sun, Cloud, CloudRain, Coins, Calendar, Clock, RotateCcw } from 'lucide-vue-next';
import { useGameStore } from '../stores/gameStore';

const store = useGameStore();

const weatherIcon = computed(() => {
  switch (store.weather) {
    case 'sunny': return Sun;
    case 'rainy': return CloudRain;
    default: return Cloud;
  }
});

const weatherText = computed(() => {
  switch (store.weather) {
    case 'sunny': return '晴天';
    case 'rainy': return '雨天';
    default: return '多云';
  }
});

const timeText = computed(() => {
  switch (store.timeOfDay) {
    case 'morning': return '上午';
    case 'afternoon': return '下午';
    default: return '傍晚';
  }
});
</script>

<template>
  <div class="status-bar">
    <div class="status-left">
      <div class="status-item">
        <Coins class="icon coin-icon" />
        <span class="coin-value">{{ store.coins }}</span>
      </div>
      <div class="status-item">
        <Calendar class="icon" />
        <span>第 {{ store.day }} 天</span>
      </div>
      <div class="status-item">
        <Clock class="icon" />
        <span>{{ timeText }}</span>
      </div>
      <div class="status-item weather" :class="store.weather">
        <component :is="weatherIcon" class="icon" />
        <span>{{ weatherText }}</span>
      </div>
    </div>
    <div class="status-right">
      <button class="btn-next" @click="store.advanceTime">
        下一个时段
      </button>
      <button class="btn-reset" @click="store.resetGame">
        <RotateCcw :size="16" />
        重置
      </button>
    </div>
  </div>
</template>

<style scoped>
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: linear-gradient(135deg, #FF9F43 0%, #FFB347 100%);
  border-radius: 16px;
  color: white;
  box-shadow: 0 4px 12px rgba(255, 159, 67, 0.3);
  margin-bottom: 20px;
}

.status-left {
  display: flex;
  gap: 20px;
  align-items: center;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  font-size: 14px;
}

.status-item .icon {
  width: 18px;
  height: 18px;
}

.coin-icon {
  color: #FFD700;
}

.weather.sunny .icon {
  color: #FFE66D;
}

.weather.rainy .icon {
  color: #74B9FF;
}

.status-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

.btn-next {
  padding: 8px 16px;
  background: white;
  color: #FF9F43;
  border: none;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
}

.btn-next:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-reset {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 20px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
}

.btn-reset:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
