<template>
  <div class="ending-view" :class="endingType">
    <div class="ending-bg"></div>
    
    <div class="ending-content">
      <div class="ending-type-badge" :class="endingType">
        {{ getTypeLabel() }}
      </div>
      
      <h1 class="ending-title">{{ ending?.title }}</h1>
      <p class="ending-subtitle">{{ ending?.description }}</p>
      
      <div class="ending-card">
        <div class="ending-text">
          <p v-for="(paragraph, index) in endingParagraphs" :key="index">
            {{ paragraph }}
          </p>
        </div>
      </div>
      
      <div class="epilogue-section" v-if="ending?.epilogue">
        <h3 class="epilogue-title">✧ 后记 ✧</h3>
        <p class="epilogue-text">{{ ending.epilogue }}</p>
      </div>
      
      <div class="ending-stats">
        <div class="stat-box">
          <span class="stat-label">收集记忆</span>
          <span class="stat-value">{{ collectedMemoriesCount }}/{{ totalMemoriesCount }}</span>
        </div>
        <div class="stat-box">
          <span class="stat-label">解开谜题</span>
          <span class="stat-value">{{ solvedPuzzlesCount }}/{{ totalPuzzlesCount }}</span>
        </div>
        <div class="stat-box">
          <span class="stat-label">最终信任</span>
          <span class="stat-value trust">{{ finalTrust }}%</span>
        </div>
        <div class="stat-box">
          <span class="stat-label">最终恐惧</span>
          <span class="stat-value fear">{{ finalFear }}%</span>
        </div>
      </div>
      
      <div class="ending-actions">
        <button class="btn btn-primary" @click="replayDream">
          再次进入梦境
        </button>
        <button class="btn btn-secondary" @click="backToPatients">
          返回患者列表
        </button>
        <button class="btn btn-secondary" @click="backToHome">
          返回主页
        </button>
      </div>
    </div>
    
    <div class="particles">
      <div v-for="i in 30" :key="i" class="particle" :style="getParticleStyle(i)"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '@/store/gameStore'
import { getEndingById } from '@/data/endings'
import { getMemoriesByPatient } from '@/data/memories'
import { getPuzzlesByPatient } from '@/data/puzzles'
import { getPatientById } from '@/data/patients'

const router = useRouter()
const route = useRoute()
const gameStore = useGameStore()

const patientId = computed(() => route.params.patientId)
const endingId = computed(() => route.params.endingId)

const ending = computed(() => getEndingById(patientId.value, endingId.value))
const patient = computed(() => getPatientById(patientId.value))

const endingType = computed(() => ending.value?.type || 'neutral')

const endingParagraphs = computed(() => {
  if (!ending.value?.content) return []
  return ending.value.content
    .split('\n')
    .map(p => p.trim())
    .filter(p => p.length > 0)
})

const collectedMemoriesCount = computed(() => 
  gameStore.getCollectedMemories(patientId.value).length
)

const totalMemoriesCount = computed(() => 
  getMemoriesByPatient(patientId.value).length
)

const solvedPuzzlesCount = computed(() => 
  gameStore.getSolvedPuzzles(patientId.value).length
)

const totalPuzzlesCount = computed(() => 
  getPuzzlesByPatient(patientId.value).length
)

const progress = computed(() => gameStore.getPatientProgress(patientId.value))

const finalTrust = computed(() => progress.value?.trustLevel || 0)
const finalFear = computed(() => progress.value?.fearLevel || 50)

onMounted(() => {
  gameStore.saveGame()
})

const getTypeLabel = () => {
  const labels = {
    good: '✧ 治愈结局 ✧',
    neutral: '✧ 和解结局 ✧',
    bad: '✧ 沉沦结局 ✧'
  }
  return labels[endingType.value] || '✧ 结局 ✧'
}

const getParticleStyle = (index) => {
  const colors = endingType.value === 'good' 
    ? ['rgba(251, 191, 36, 0.6)', 'rgba(52, 211, 153, 0.6)', 'rgba(167, 139, 250, 0.6)']
    : endingType.value === 'bad'
    ? ['rgba(239, 68, 68, 0.6)', 'rgba(139, 92, 246, 0.4)', 'rgba(0, 0, 0, 0.6)']
    : ['rgba(167, 139, 250, 0.6)', 'rgba(96, 165, 250, 0.6)', 'rgba(251, 191, 36, 0.4)']
  
  return {
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    background: colors[index % colors.length],
    animationDelay: `${Math.random() * 3}s`,
    animationDuration: `${3 + Math.random() * 4}s`
  }
}

const replayDream = () => {
  gameStore.enterDream(patientId.value)
  router.push(`/dream/${patientId.value}`)
}

const backToPatients = () => {
  gameStore.exitDream()
  router.push('/patients')
}

const backToHome = () => {
  gameStore.exitDream()
  router.push('/')
}
</script>

<style scoped>
.ending-view {
  width: 100%;
  min-height: 100vh;
  position: relative;
  overflow-y: auto;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 20px;
}

.ending-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.ending-view.good .ending-bg {
  background: radial-gradient(ellipse at center, rgba(251, 191, 36, 0.15) 0%, rgba(20, 15, 30, 1) 100%);
}

.ending-view.neutral .ending-bg {
  background: radial-gradient(ellipse at center, rgba(139, 92, 246, 0.15) 0%, rgba(15, 10, 25, 1) 100%);
}

.ending-view.bad .ending-bg {
  background: radial-gradient(ellipse at center, rgba(100, 0, 50, 0.2) 0%, rgba(10, 5, 15, 1) 100%);
}

.ending-content {
  position: relative;
  z-index: 10;
  max-width: 800px;
  width: 100%;
  padding: 40px;
  text-align: center;
}

.ending-type-badge {
  display: inline-block;
  padding: 10px 30px;
  border-radius: 30px;
  font-size: 18px;
  letter-spacing: 2px;
  margin-bottom: 30px;
}

.ending-type-badge.good {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(52, 211, 153, 0.3));
  border: 1px solid rgba(251, 191, 36, 0.5);
  color: #fbbf24;
}

.ending-type-badge.neutral {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(96, 165, 250, 0.3));
  border: 1px solid rgba(139, 92, 246, 0.5);
  color: #a78bfa;
}

.ending-type-badge.bad {
  background: linear-gradient(135deg, rgba(100, 0, 50, 0.4), rgba(50, 0, 30, 0.4));
  border: 1px solid rgba(150, 50, 100, 0.5);
  color: #f87171;
}

.ending-title {
  font-size: 48px;
  letter-spacing: 4px;
  margin-bottom: 10px;
}

.ending-view.good .ending-title {
  color: #fbbf24;
  text-shadow: 0 0 30px rgba(251, 191, 36, 0.5);
}

.ending-view.neutral .ending-title {
  color: #a78bfa;
  text-shadow: 0 0 30px rgba(167, 139, 250, 0.5);
}

.ending-view.bad .ending-title {
  color: #f87171;
  text-shadow: 0 0 30px rgba(248, 113, 113, 0.5);
}

.ending-subtitle {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 40px;
}

.ending-card {
  background: linear-gradient(145deg, rgba(40, 30, 60, 0.8), rgba(25, 18, 45, 0.9));
  border: 1px solid rgba(100, 80, 150, 0.4);
  border-radius: 16px;
  padding: 40px;
  margin-bottom: 30px;
  text-align: left;
}

.ending-text p {
  color: rgba(255, 255, 255, 0.85);
  line-height: 2;
  margin-bottom: 15px;
  text-indent: 2em;
}

.epilogue-section {
  margin-bottom: 40px;
  padding: 30px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border-left: 3px solid;
}

.ending-view.good .epilogue-section {
  border-color: #fbbf24;
}

.ending-view.neutral .epilogue-section {
  border-color: #a78bfa;
}

.ending-view.bad .epilogue-section {
  border-color: #f87171;
}

.epilogue-title {
  color: #c8a2e8;
  font-size: 18px;
  letter-spacing: 2px;
  margin-bottom: 15px;
}

.epilogue-text {
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.8;
  font-style: italic;
}

.ending-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 40px;
}

.stat-box {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #e8e8f0;
}

.stat-value.trust {
  color: #34d399;
}

.stat-value.fear {
  color: #f87171;
}

.ending-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.btn-primary {
  background: linear-gradient(135deg, #7c3aed, #5b21b6);
}

.btn-secondary {
  background: linear-gradient(135deg, rgba(80, 60, 120, 0.8), rgba(60, 40, 100, 0.9));
}

.particles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: 5;
}

.particle {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  animation: float-up 6s ease-in-out infinite;
}

@keyframes float-up {
  0%, 100% {
    transform: translateY(0) scale(1);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100vh) scale(0.5);
    opacity: 0;
  }
}
</style>
