<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <div class="stat-card primary">
          <div class="stat-icon">🦕</div>
          <div class="stat-content">
            <div class="stat-value">{{ dinosaurCount }}</div>
            <div class="stat-label">恐龙数量</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card success">
          <div class="stat-icon">🏠</div>
          <div class="stat-content">
            <div class="stat-value">{{ habitatCount }}</div>
            <div class="stat-label">栖息地</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card warning">
          <div class="stat-icon">🏗️</div>
          <div class="stat-content">
            <div class="stat-value">{{ facilityCount }}</div>
            <div class="stat-label">设施数量</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card danger">
          <div class="stat-icon">⚠️</div>
          <div class="stat-content">
            <div class="stat-value">{{ eventCount }}</div>
            <div class="stat-label">待处理事件</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="16">
        <el-card class="content-card">
          <template #header>
            <div class="card-header">
              <span>我的恐龙</span>
              <el-button type="primary" size="small" @click="$router.push('/dinosaur')">
              查看全部
            </el-button>
            </div>
          </template>
          <div v-if="dinosaurs.length > 0" class="dino-grid">
            <div v-for="dino in dinosaurs.slice(0, 4)" :key="dino.id" class="dino-item">
              <div class="dino-avatar">{{ getDinoEmoji(dino) }}</div>
              <div class="dino-name">{{ dino.name }}</div>
              <div class="dino-status" :class="dino.status">
                {{ getStatusText(dino.status) }}</div>
            </div>
          </div>
          <el-empty v-else description="暂无恐龙，快去发掘化石克隆恐龙吧！" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="content-card">
          <template #header>
            <div class="card-header">
              <span>快速操作</span>
            </div>
          </template>
          <div class="quick-actions">
            <el-button type="primary" class="action-btn" @click="$router.push('/fossil')">
              <el-icon><Search /></el-icon>
              发掘化石
            </el-button>
            <el-button type="success" class="action-btn" @click="$router.push('/habitat')">
              <el-icon><House /></el-icon>
              建造栖息地
            </el-button>
            <el-button type="warning" class="action-btn" @click="$router.push('/facility')">
              <el-icon><Setting /></el-icon>
              建设设施
            </el-button>
            <el-button type="danger" class="action-btn" @click="handleGenerateEvent">
              <el-icon><Warning /></el-icon>
              触发事件
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card class="content-card">
          <template #header>
            <div class="card-header">
              <span>我的公园</span>
            </div>
          </template>
          <div v-if="parks.length > 0" class="park-list">
            <div v-for="park in parks" :key="park.id" class="park-item">
              <div class="park-info">
                <div class="park-name">{{ park.name }}</div>
                <div class="park-desc">{{ park.description }}</div>
                <div class="park-stats">
                  <span>等级: Lv.{{ park.level }}</span>
                  <span>访客: {{ park.visitor_count }}</span>
                  <span>评分: {{ park.rating.toFixed(1) }}</span>
                </div>
              </div>
              <div class="park-actions">
                <el-button type="primary" size="small" @click="$router.push('/park')">
                  管理
                </el-button>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无公园" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getDinosaurs, getHabitats, getFacilities, getUnresolvedEvents, getParks, generateEvent } from '@/services/api'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

const dinosaurs = ref([])
const habitats = ref([])
const facilities = ref([])
const events = ref([])
const parks = ref([])

const dinosaurCount = ref(0)
const habitatCount = ref(0)
const facilityCount = ref(0)
const eventCount = ref(0)

const getDinoEmoji = (dino) => {
  const emojis = ['🦕', '🦖', '🐊', '🦎']
  return emojis[dino.id % emojis.length]
}

const getStatusText = (status) => {
  const statusMap = {
    healthy: '健康',
    hungry: '饥饿',
    tired: '疲惫',
    sick: '生病'
  }
  return statusMap[status] || status
}

const loadData = async () => {
  const [dinoRes, habRes, facRes, evtRes, parkRes] = await Promise.all([
    getDinosaurs(),
    getHabitats(),
    getFacilities(),
    getUnresolvedEvents(),
    getParks()
  ])
  
  if (dinoRes.code === 200) {
    dinosaurs.value = dinoRes.data || []
    dinosaurCount.value = dinosaurs.value.length
  }
  if (habRes.code === 200) {
    habitats.value = habRes.data || []
    habitatCount.value = habitats.value.length
  }
  if (facRes.code === 200) {
    facilities.value = facRes.data || []
    facilityCount.value = facilities.value.length
  }
  if (evtRes.code === 200) {
    events.value = evtRes.data || []
    eventCount.value = events.value.length
  }
  if (parkRes.code === 200) {
    parks.value = parkRes.data || []
  }
}

const handleGenerateEvent = async () => {
  if (parks.value.length === 0) {
    ElMessage.warning('请先创建公园')
    return
  }
  const res = await generateEvent(parks.value[0].id)
  if (res.code === 200) {
    ElMessage.success('新事件发生！')
    loadData()
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 24px;
  border-radius: 12px;
  color: white;
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-card.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-card.success {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.stat-card.warning {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-card.danger {
  background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
}

.stat-icon {
  font-size: 48px;
  margin-right: 20px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.content-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.dino-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.dino-item {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  transition: all 0.3s;
}

.dino-item:hover {
  background: #e9ecef;
  transform: scale(1.05);
}

.dino-avatar {
  font-size: 48px;
  margin-bottom: 10px;
}

.dino-name {
  font-weight: 600;
  margin-bottom: 5px;
}

.dino-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  display: inline-block;
}

.dino-status.healthy {
  background: #d4edda;
  color: #155724;
}

.dino-status.hungry {
  background: #fff3cd;
  color: #856404;
}

.dino-status.tired {
  background: #cce5ff;
  color: #004085;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-btn {
  width: 100%;
  justify-content: flex-start;
  padding: 15px 20px;
}

.park-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.park-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
}

.park-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 5px;
}

.park-desc {
  color: #666;
  margin-bottom: 10px;
}

.park-stats {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #666;
}
</style>
