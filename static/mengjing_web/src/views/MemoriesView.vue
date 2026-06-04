<template>
  <div class="memories-view">
    <div class="dream-bg"></div>
    
    <div class="header">
      <button class="btn back-btn" @click="goBack">
        ← 返回
      </button>
      <h1 class="page-title">记忆收藏</h1>
      <div class="header-spacer"></div>
    </div>
    
    <div class="content">
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-icon">📜</span>
          <span class="stat-value">{{ totalCollected }}/{{ totalMemories }}</span>
          <span class="stat-label">记忆碎片</span>
        </div>
      </div>
      
      <div class="patient-tabs">
        <button v-for="patient in patients" :key="patient.id"
                class="tab-btn"
                :class="{ active: selectedPatient === patient.id }"
                @click="selectedPatient = patient.id">
          <span class="tab-avatar">{{ patient.avatar }}</span>
          <span class="tab-name">{{ patient.name }}</span>
          <span class="tab-count">
            {{ getCollectedCount(patient.id) }}/{{ getTotalCount(patient.id) }}
          </span>
        </button>
      </div>
      
      <div class="memories-gallery">
        <div v-for="memory in currentPatientMemories" :key="memory.id"
             class="memory-item"
             :class="{ collected: isCollected(memory.id) }"
             @click="viewMemory(memory)">
          <div class="memory-cover">
            <span v-if="!isCollected(memory.id)" class="locked-icon">🔒</span>
            <span v-else class="memory-emoji">{{ memory.image }}</span>
          </div>
          <div class="memory-info">
            <h4 class="memory-title">{{ isCollected(memory.id) ? memory.title : '???' }}</h4>
            <span v-if="isCollected(memory.id)" 
                  class="memory-emotion" 
                  :class="'emotion-' + memory.emotion">
              {{ getEmotionLabel(memory.emotion) }}
            </span>
            <span v-else class="memory-locked">未解锁</span>
          </div>
          <div class="memory-importance">
            <span v-for="i in 5" :key="i" 
                  class="star"
                  :class="{ filled: i <= memory.importance && isCollected(memory.id) }">
              ★
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="showDetail && selectedMemory" class="modal-overlay" @click.self="closeDetail">
      <div class="modal-content detail-modal">
        <div class="detail-header">
          <span class="detail-emoji">{{ selectedMemory.image }}</span>
          <h2 class="detail-title">{{ selectedMemory.title }}</h2>
        </div>
        
        <div class="detail-meta">
          <span class="meta-badge" :class="'emotion-' + selectedMemory.emotion">
            {{ getEmotionLabel(selectedMemory.emotion) }}
          </span>
          <span class="meta-badge importance">
            重要度: {{ '★'.repeat(selectedMemory.importance) }}
          </span>
        </div>
        
        <div class="detail-content">
          <p>{{ selectedMemory.content }}</p>
        </div>
        
        <button class="btn close-detail-btn" @click="closeDetail">
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/store/gameStore'
import { patients } from '@/data/patients'
import { getMemoriesByPatient } from '@/data/memories'

const router = useRouter()
const gameStore = useGameStore()

const selectedPatient = ref('patient_001')
const showDetail = ref(false)
const selectedMemory = ref(null)

const currentPatientMemories = computed(() => {
  return getMemoriesByPatient(selectedPatient.value)
})

const totalCollected = computed(() => {
  let count = 0
  patients.forEach(p => {
    count += gameStore.getCollectedMemories(p.id).length
  })
  return count
})

const totalMemories = computed(() => {
  let count = 0
  patients.forEach(p => {
    count += getMemoriesByPatient(p.id).length
  })
  return count
})

const getCollectedCount = (patientId) => {
  return gameStore.getCollectedMemories(patientId).length
}

const getTotalCount = (patientId) => {
  return getMemoriesByPatient(patientId).length
}

const isCollected = (memoryId) => {
  return gameStore.isMemoryCollected(selectedPatient.value, memoryId)
}

const viewMemory = (memory) => {
  if (!isCollected(memory.id)) return
  selectedMemory.value = memory
  showDetail.value = true
}

const closeDetail = () => {
  showDetail.value = false
  selectedMemory.value = null
}

const getEmotionLabel = (emotion) => {
  const labels = {
    sweet: '甜蜜',
    painful: '痛苦',
    bittersweet: '苦乐参半',
    trauma: '创伤',
    mystery: '谜团',
    horror: '恐惧'
  }
  return labels[emotion] || emotion
}

const goBack = () => {
  router.push('/')
}
</script>

<style scoped>
.memories-view {
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

.content {
  position: relative;
  z-index: 10;
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 50px 50px;
}

.stats-bar {
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 40px;
  background: linear-gradient(145deg, rgba(60, 40, 30, 0.6), rgba(45, 30, 20, 0.7));
  border: 1px solid rgba(200, 160, 100, 0.3);
  border-radius: 12px;
}

.stat-icon {
  font-size: 32px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #fbbf24;
}

.stat-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.patient-tabs {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 40px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  background: rgba(40, 30, 60, 0.5);
  border: 1px solid rgba(100, 80, 150, 0.3);
  border-radius: 30px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  background: rgba(60, 40, 80, 0.7);
}

.tab-btn.active {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(59, 130, 246, 0.4));
  border-color: rgba(139, 92, 246, 0.6);
  color: #e8e8f0;
}

.tab-avatar {
  font-size: 20px;
}

.tab-name {
  font-size: 14px;
}

.tab-count {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.memories-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.memory-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: linear-gradient(145deg, rgba(40, 30, 60, 0.6), rgba(25, 18, 45, 0.7));
  border: 1px solid rgba(100, 80, 150, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.memory-item:hover:not(.collected) {
  cursor: not-allowed;
}

.memory-item.collected:hover {
  transform: translateY(-3px);
  border-color: rgba(200, 160, 100, 0.6);
  box-shadow: 0 10px 30px rgba(255, 200, 100, 0.15);
}

.memory-cover {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  font-size: 28px;
  flex-shrink: 0;
}

.locked-icon {
  font-size: 20px;
  opacity: 0.5;
}

.memory-info {
  flex: 1;
  min-width: 0;
}

.memory-title {
  font-size: 15px;
  color: #e8e8f0;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.memory-emotion {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

.memory-locked {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.memory-importance {
  display: flex;
  gap: 2px;
}

.memory-importance .star {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.2);
}

.memory-importance .star.filled {
  color: #fbbf24;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: linear-gradient(145deg, rgba(40, 30, 60, 0.95), rgba(25, 18, 45, 0.98));
  border: 1px solid rgba(100, 80, 150, 0.4);
  border-radius: 16px;
  padding: 40px;
  max-width: 550px;
  width: 90%;
}

.detail-modal {
  text-align: center;
}

.detail-header {
  margin-bottom: 20px;
}

.detail-emoji {
  font-size: 72px;
  display: block;
  margin-bottom: 15px;
}

.detail-title {
  font-size: 28px;
  color: #fbbf24;
  letter-spacing: 2px;
}

.detail-meta {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 30px;
}

.meta-badge {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
}

.meta-badge.importance {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.detail-content {
  margin-bottom: 30px;
}

.detail-content p {
  color: rgba(255, 255, 255, 0.85);
  line-height: 2;
  font-size: 16px;
  text-align: left;
}

.close-detail-btn {
  padding: 12px 40px;
}

.emotion-sweet { color: #f472b6; background: rgba(244, 114, 182, 0.2); }
.emotion-painful { color: #f87171; background: rgba(248, 113, 113, 0.2); }
.emotion-bittersweet { color: #fbbf24; background: rgba(251, 191, 36, 0.2); }
.emotion-trauma { color: #a78bfa; background: rgba(167, 139, 250, 0.2); }
.emotion-mystery { color: #60a5fa; background: rgba(96, 165, 250, 0.2); }
.emotion-horror { color: #f97316; background: rgba(249, 115, 22, 0.2); }
</style>
