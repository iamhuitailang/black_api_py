<template>
  <div class="patients-view">
    <div class="dream-bg"></div>
    
    <div class="header">
      <button class="btn back-btn" @click="goBack">
        ← 返回
      </button>
      <h1 class="page-title">梦境入口</h1>
      <div class="header-spacer"></div>
    </div>
    
    <div class="patients-container">
      <div class="patient-card" v-for="patient in patients" :key="patient.id">
        <div class="card-inner">
          <div class="patient-avatar">{{ patient.avatar }}</div>
          <div class="patient-info">
            <h2 class="patient-name">{{ patient.name }}</h2>
            <p class="patient-title">{{ patient.title }}</p>
            <div class="patient-meta">
              <span class="meta-item">年龄: {{ patient.age }}</span>
              <span class="meta-item">症状: {{ patient.symptom }}</span>
            </div>
            <p class="patient-description">{{ patient.description }}</p>
            
            <div class="difficulty-bar">
              <span class="difficulty-label">难度:</span>
              <div class="difficulty-stars">
                <span v-for="i in 3" :key="i" 
                      class="star" 
                      :class="{ active: i <= patient.difficulty }">
                  ★
                </span>
              </div>
            </div>
            
            <div class="progress-info">
              <span>预计时间: {{ patient.estimatedTime }}</span>
              <span v-if="hasProgress(patient.id)" class="progress-text">
                进度: {{ getProgress(patient.id) }}%
              </span>
            </div>
            
            <div class="btn-group">
              <button class="btn enter-btn" @click="enterDream(patient.id)">
                {{ hasProgress(patient.id) ? '继续梦境' : '进入梦境' }} ✧
              </button>
              <button v-if="hasProgress(patient.id)" class="btn reset-btn" @click="resetDream(patient.id)">
                重新开始
              </button>
            </div>
          </div>
        </div>
        
        <div class="card-background" :style="{ background: getCardGradient(patient.id) }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/store/gameStore'
import { patients } from '@/data/patients'
import { getMemoriesByPatient } from '@/data/memories'

const router = useRouter()
const gameStore = useGameStore()

const goBack = () => {
  router.push('/')
}

const enterDream = (patientId) => {
  gameStore.enterDream(patientId)
  router.push(`/dream/${patientId}`)
}

const resetDream = (patientId) => {
  gameStore.resetDream(patientId)
  router.push(`/dream/${patientId}`)
}

const hasAnyProgress = (patientId) => {
  const progress = gameStore.getPatientProgress(patientId)
  const memories = gameStore.getCollectedMemories(patientId)
  const puzzles = gameStore.getSolvedPuzzles(patientId)
  return progress || memories.length > 0 || puzzles.length > 0
}

const getProgressPercent = (patientId) => {
  const totalMemories = getMemoriesByPatient(patientId).length
  const collectedMemories = gameStore.getCollectedMemories(patientId).length
  return Math.round((collectedMemories / totalMemories) * 100)
}

const patientProgressMap = computed(() => {
  const map = {}
  patients.forEach(p => {
    map[p.id] = {
      hasProgress: hasAnyProgress(p.id),
      percent: getProgressPercent(p.id)
    }
  })
  return map
})

const getProgress = (patientId) => {
  return patientProgressMap.value[patientId]?.percent || 0
}

const hasProgress = (patientId) => {
  return patientProgressMap.value[patientId]?.hasProgress || false
}

const getCardGradient = (patientId) => {
  const gradients = {
    patient_001: 'linear-gradient(135deg, rgba(30, 60, 100, 0.3), rgba(50, 80, 120, 0.2))',
    patient_002: 'linear-gradient(135deg, rgba(60, 40, 50, 0.3), rgba(80, 50, 60, 0.2))',
    patient_003: 'linear-gradient(135deg, rgba(40, 50, 80, 0.3), rgba(60, 70, 100, 0.2))',
    patient_004: 'linear-gradient(135deg, rgba(30, 50, 80, 0.3), rgba(40, 60, 90, 0.2))',
    patient_005: 'linear-gradient(135deg, rgba(80, 70, 40, 0.3), rgba(100, 90, 50, 0.2))'
  }
  return gradients[patientId] || gradients.patient_001
}
</script>

<style scoped>
.patients-view {
  width: 100%;
  min-height: 100vh;
  position: relative;
  overflow-y: auto;
}

.header {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30px 50px;
  margin-bottom: 20px;
}

.back-btn {
  padding: 10px 24px;
  font-size: 14px;
}

.header-spacer {
  width: 100px;
}

.page-title {
  font-size: 36px;
  color: #c8a2e8;
  letter-spacing: 4px;
}

.patients-container {
  position: relative;
  z-index: 10;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 40px;
  padding: 20px 50px 50px;
}

.patient-card {
  position: relative;
  width: 380px;
  cursor: pointer;
  transition: all 0.4s ease;
}

.patient-card:hover {
  transform: translateY(-10px);
}

.card-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 16px;
  z-index: 0;
}

.card-inner {
  position: relative;
  z-index: 1;
  background: linear-gradient(145deg, rgba(40, 30, 60, 0.85), rgba(25, 18, 45, 0.9));
  border: 1px solid rgba(100, 80, 150, 0.3);
  border-radius: 16px;
  padding: 30px;
  backdrop-filter: blur(10px);
  height: 100%;
}

.patient-avatar {
  font-size: 64px;
  text-align: center;
  margin-bottom: 20px;
  filter: drop-shadow(0 0 20px rgba(200, 162, 232, 0.4));
}

.patient-info {
  text-align: center;
}

.patient-name {
  font-size: 28px;
  color: #e8e8f0;
  margin-bottom: 8px;
  letter-spacing: 2px;
}

.patient-title {
  font-size: 16px;
  color: #c8a2e8;
  margin-bottom: 16px;
  letter-spacing: 1px;
}

.patient-meta {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 16px;
}

.meta-item {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.patient-description {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.6;
  margin-bottom: 20px;
  min-height: 45px;
}

.difficulty-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}

.difficulty-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.difficulty-stars {
  display: flex;
  gap: 4px;
}

.star {
  color: rgba(255, 255, 255, 0.2);
  font-size: 18px;
  transition: all 0.3s ease;
}

.star.active {
  color: #fbbf24;
  text-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 20px;
}

.progress-text {
  color: #8b5cf6;
}

.enter-btn {
  flex: 1;
  padding: 14px;
  font-size: 16px;
}

.btn-group {
  display: flex;
  gap: 10px;
  width: 100%;
}

.reset-btn {
  padding: 14px 20px;
  font-size: 14px;
  background: linear-gradient(135deg, rgba(100, 40, 40, 0.8), rgba(80, 30, 30, 0.9));
  border-color: rgba(200, 100, 100, 0.5);
  white-space: nowrap;
}

.reset-btn:hover {
  background: linear-gradient(135deg, rgba(130, 50, 50, 0.9), rgba(100, 40, 40, 0.95));
  border-color: rgba(230, 120, 120, 0.8);
}
</style>
