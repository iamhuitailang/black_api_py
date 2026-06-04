<script setup lang="ts">
import { computed } from 'vue';
import { PartyPopper, Users, Award } from 'lucide-vue-next';
import { useGameStore } from '../stores/gameStore';
import { activities, decorations } from '../data/decorations';
import AnimalCard from '../components/AnimalCard.vue';

const store = useGameStore();

const sortedAnimals = computed(() => {
  return [...store.activeAnimals].sort((a, b) => {
    if (a.isSleeping && !b.isSleeping) return 1;
    if (!a.isSleeping && b.isSleeping) return -1;
    return 0;
  });
});

async function startActivity(activityId: string) {
  if (store.isDoingActivity) return;
  await store.holdActivity(activityId);
}
</script>

<template>
  <div class="main-park">
    <div class="park-header">
      <div class="park-title">
        <h1>🏡 欢乐园区</h1>
        <p class="subtitle">照顾可爱的小动物们，让它们快乐成长~</p>
      </div>
      <div class="park-stats">
        <div class="stat-card">
          <Users :size="20" color="#5FCD9C" />
          <span>{{ store.activeAnimals.length }} 只在读</span>
        </div>
        <div class="stat-card">
          <Award :size="20" color="#FFD700" />
          <span>{{ store.totalGraduated }} 只毕业</span>
        </div>
      </div>
    </div>

    <div v-if="store.weather === 'rainy'" class="weather-tip rainy">
      🌧️ 今天下雨啦，幼儿园里特别温馨治愈~ 小动物们心情都很好呢！
    </div>
    <div v-else-if="store.weather === 'sunny'" class="weather-tip sunny">
      ☀️ 今天天气晴朗！小动物们活力满满，上课效果更好哦~
    </div>

    <div class="activities-section">
      <h2 class="section-title">
        <PartyPopper :size="20" />
        主题活动
      </h2>
      <div class="activities-grid">
        <button 
          v-for="activity in activities" 
          :key="activity.id"
          class="activity-card"
          :class="{ active: store.currentActivity === activity.id }"
          :disabled="store.isDoingActivity"
          @click="startActivity(activity.id)"
        >
          <span class="activity-emoji">{{ activity.emoji }}</span>
          <div class="activity-info">
            <h3>{{ activity.name }}</h3>
            <p>{{ activity.description }}</p>
            <div class="activity-reward">
              <span>💰 +{{ activity.coinReward }}</span>
              <span>😊 +{{ activity.happinessBonus }}</span>
            </div>
          </div>
        </button>
      </div>
    </div>

    <div class="animals-section">
      <h2 class="section-title">🐾 小动物们</h2>
      <div class="animals-grid">
        <AnimalCard 
          v-for="animal in sortedAnimals" 
          :key="animal.id"
          :animal="animal"
        />
      </div>
      
      <div v-if="store.graduatedAnimals.length > 0" class="graduated-section">
        <h3 class="graduated-title">🎓 已毕业的小动物</h3>
        <div class="graduated-list">
          <div 
            v-for="animal in store.graduatedAnimals" 
            :key="animal.id"
            class="graduated-item"
          >
            <span class="graduated-emoji">{{ animal.emoji }}</span>
            <span class="graduated-name">{{ animal.name }}</span>
            <span class="graduated-level">Lv.{{ animal.level }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="store.decorations.length > 0" class="decorations-section">
      <h3 class="decorations-title">✨ 园区装饰</h3>
      <div class="decorations-display">
        <span 
          v-for="decId in store.decorations" 
          :key="decId"
          class="decoration-item"
        >
          {{ decorations.find(d => d.id === decId)?.emoji }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-park {
  padding: 20px 0;
}

.park-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 20px;
}

.park-title h1 {
  font-size: 28px;
  font-weight: 700;
  color: #2D3436;
  margin: 0 0 4px 0;
}

.subtitle {
  font-size: 14px;
  color: #636E72;
  margin: 0;
}

.park-stats {
  display: flex;
  gap: 12px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  font-size: 14px;
  font-weight: 500;
  color: #2D3436;
}

.weather-tip {
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 14px;
  margin-bottom: 24px;
  font-weight: 500;
}

.weather-tip.rainy {
  background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
  color: #1565C0;
}

.weather-tip.sunny {
  background: linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%);
  color: #FF8F00;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
  color: #2D3436;
  margin: 0 0 16px 0;
}

.activities-section {
  margin-bottom: 28px;
}

.activities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.activity-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border: 2px solid transparent;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.activity-card:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: #FF9F43;
  box-shadow: 0 6px 20px rgba(255, 159, 67, 0.2);
}

.activity-card:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.activity-card.active {
  border-color: #5FCD9C;
  background: linear-gradient(135deg, #F0FFF4 0%, #C6F6D5 100%);
}

.activity-emoji {
  font-size: 36px;
}

.activity-info h3 {
  font-size: 15px;
  font-weight: 600;
  color: #2D3436;
  margin: 0 0 4px 0;
}

.activity-info p {
  font-size: 12px;
  color: #636E72;
  margin: 0 0 6px 0;
}

.activity-reward {
  display: flex;
  gap: 12px;
  font-size: 12px;
  font-weight: 500;
}

.animals-section {
  margin-bottom: 28px;
}

.animals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.graduated-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 2px dashed #E5E7EB;
}

.graduated-title {
  font-size: 16px;
  font-weight: 600;
  color: #636E72;
  margin: 0 0 12px 0;
}

.graduated-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.graduated-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%);
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: #FF8F00;
}

.graduated-emoji {
  font-size: 20px;
}

.graduated-level {
  font-size: 11px;
  opacity: 0.8;
}

.decorations-section {
  padding: 16px;
  background: #F8F9FA;
  border-radius: 16px;
}

.decorations-title {
  font-size: 14px;
  font-weight: 600;
  color: #636E72;
  margin: 0 0 12px 0;
}

.decorations-display {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.decoration-item {
  font-size: 32px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.decoration-item:nth-child(2n) {
  animation-delay: 0.5s;
}

.decoration-item:nth-child(3n) {
  animation-delay: 1s;
}
</style>
