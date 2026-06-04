<script setup lang="ts">
import { ref, computed } from 'vue';
import { GraduationCap, Clock, Zap, Star, Brain } from 'lucide-vue-next';
import { useGameStore } from '../stores/gameStore';
import { courses } from '../data/courses';
import AnimalCard from '../components/AnimalCard.vue';
import type { Animal } from '../types';

const store = useGameStore();
const selectedCourse = ref<string | null>(null);

const learningAnimal = computed(() => {
  if (store.pendingActivity?.type === 'class' && store.pendingActivity.animalId) {
    return store.pendingActivity.animalId;
  }
  return null;
});

function selectCourse(courseId: string) {
  selectedCourse.value = selectedCourse.value === courseId ? null : courseId;
}

async function startClass(animal: Animal) {
  if (!selectedCourse.value || store.isDoingActivity) return;
  
  await store.attendClass(animal.id, selectedCourse.value);
}

function getCourseTypeColor(type: string) {
  const colors: Record<string, string> = {
    painting: '#FF6B6B',
    music: '#74B9FF',
    sports: '#55EFC4',
    cognition: '#A29BFE',
  };
  return colors[type] || '#636E72';
}

function getCourseTypeName(type: string) {
  const names: Record<string, string> = {
    painting: '绘画',
    music: '音乐',
    sports: '运动',
    cognition: '认知',
  };
  return names[type] || type;
}
</script>

<template>
  <div class="class-room">
    <div class="page-header">
      <h1>📚 课堂教室</h1>
      <p class="subtitle">为小动物安排课程，提升它们的智力和能力~</p>
    </div>

    <div class="courses-section">
      <h2 class="section-title">
        <GraduationCap :size="20" />
        选择课程
      </h2>
      <div class="courses-grid">
        <div 
          v-for="course in courses" 
          :key="course.id"
          class="course-card"
          :class="{ selected: selectedCourse === course.id }"
          :style="{ borderColor: selectedCourse === course.id ? getCourseTypeColor(course.type) : 'transparent' }"
          @click="selectCourse(course.id)"
        >
          <div class="course-header">
            <span class="course-emoji">{{ course.emoji }}</span>
            <span 
              class="course-type-badge"
              :style="{ backgroundColor: getCourseTypeColor(course.type) + '20', color: getCourseTypeColor(course.type) }"
            >
              {{ getCourseTypeName(course.type) }}
            </span>
          </div>
          <h3 class="course-name">{{ course.name }}</h3>
          
          <div class="course-stats">
            <div class="stat">
              <Clock :size="14" />
              <span>{{ course.duration / 1000 }}秒</span>
            </div>
            <div class="stat">
              <Zap :size="14" />
              <span>精力 -{{ course.energyCost }}</span>
            </div>
            <div class="stat">
              <Star :size="14" />
              <span>需要 Lv.{{ course.minLevel }}</span>
            </div>
          </div>

          <div class="course-benefits">
            <div class="benefit">
              <Brain :size="14" color="#74B9FF" />
              <span>智力 +{{ course.intelligenceGain }}</span>
            </div>
            <div class="benefit">
              <Star :size="14" color="#FFD700" />
              <span>经验 +{{ course.expGain }}</span>
            </div>
            <div class="benefit">
              <span :class="course.happinessChange >= 0 ? 'positive' : 'negative'">
                心情 {{ course.happinessChange >= 0 ? '+' : '' }}{{ course.happinessChange }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="animals-section">
      <h2 class="section-title">🐾 选择小动物上课</h2>
      <p v-if="!selectedCourse" class="hint">👆 请先选择一门课程</p>
      
      <div v-else class="animals-grid">
        <div 
          v-for="animal in store.activeAnimals" 
          :key="animal.id"
          class="animal-wrapper"
          :class="{ 
            disabled: animal.energy < courses.find(c => c.id === selectedCourse)?.energyCost! || 
                     animal.level < courses.find(c => c.id === selectedCourse)?.minLevel! ||
                     animal.isSleeping,
            learning: learningAnimal === animal.id
          }"
        >
          <AnimalCard :animal="animal" :selectable="false" />
          <button 
            v-if="!animal.isGraduated"
            class="start-btn"
            :disabled="animal.energy < courses.find(c => c.id === selectedCourse)?.energyCost! || 
                       animal.level < courses.find(c => c.id === selectedCourse)?.minLevel! ||
                       animal.isSleeping ||
                       store.isDoingActivity ||
                       learningAnimal !== null"
            @click="startClass(animal)"
          >
            {{ learningAnimal === animal.id ? '⏳ 学习中...' : '开始上课' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="store.isDoingActivity" class="activity-overlay">
      <div class="activity-indicator">
        <div class="spinner"></div>
        <p>正在进行活动中...</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.class-room {
  padding: 20px 0;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
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

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
  color: #2D3436;
  margin: 0 0 16px 0;
}

.courses-section {
  margin-bottom: 32px;
}

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.course-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 3px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
}

.course-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.course-card.selected {
  transform: translateY(-3px);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.15);
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.course-emoji {
  font-size: 36px;
}

.course-type-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.course-name {
  font-size: 16px;
  font-weight: 600;
  color: #2D3436;
  margin: 0 0 12px 0;
}

.course-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #E5E7EB;
}

.stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #636E72;
}

.course-benefits {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.benefit {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #2D3436;
}

.benefit .positive {
  color: #5FCD9C;
}

.benefit .negative {
  color: #FF6B6B;
}

.hint {
  padding: 16px;
  background: #F8F9FA;
  border-radius: 12px;
  text-align: center;
  color: #636E72;
  font-size: 14px;
}

.animals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.animal-wrapper {
  position: relative;
  transition: all 0.3s ease;
}

.animal-wrapper.disabled {
  opacity: 0.6;
}

.animal-wrapper.learning {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.start-btn {
  width: 100%;
  margin-top: 10px;
  padding: 12px;
  background: linear-gradient(135deg, #5FCD9C 0%, #4ECDC4 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.start-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(95, 205, 156, 0.4);
}

.start-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.activity-overlay {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.activity-indicator {
  text-align: center;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #E5E7EB;
  border-top-color: #FF9F43;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.activity-indicator p {
  font-size: 16px;
  font-weight: 500;
  color: #2D3436;
  margin: 0;
}
</style>
