<template>
  <div class="garage-page">
    <div class="page-header">
      <h1 class="page-title">我的车库</h1>
      <p class="page-subtitle">管理和设计你的专属赛车</p>
      <el-button type="primary" class="btn-primary create-btn" @click="goToCreate">
        <el-icon><Plus /></el-icon>
        创建新车
      </el-button>
    </div>

    <div v-loading="gameStore.loading" class="cars-grid">
      <div
        v-for="car in gameStore.cars"
        :key="car.id"
        class="car-card"
        :class="{ active: car.is_active }"
      >
        <div class="car-header">
          <h3 class="car-name">{{ car.name }}</h3>
          <el-tag v-if="car.is_active" type="warning" effect="dark">当前使用</el-tag>
        </div>

        <div class="car-preview">
          <svg class="car-silhouette" viewBox="0 0 400 150" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient :id="'bodyGrad-' + car.id" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" :style="{ stopColor: car.colors?.primary || '#ff6b00' }" />
                <stop offset="100%" :style="{ stopColor: car.colors?.secondary || '#cc5500' }" />
              </linearGradient>
            </defs>
            <path
              :fill="'url(#bodyGrad-' + car.id + ')'"
              :d="getBodyShapePath(car.body_style)"
              stroke="#333"
              stroke-width="2"
            />
            <circle cx="120" cy="110" r="25" fill="#1a1a2e" stroke="#444" stroke-width="3" />
            <circle cx="120" cy="110" r="12" fill="#333" />
            <circle cx="280" cy="110" r="25" fill="#1a1a2e" stroke="#444" stroke-width="3" />
            <circle cx="280" cy="110" r="12" fill="#333" />
            <rect x="180" y="45" width="80" height="35" rx="5" :fill="car.colors?.accent || '#ff8c00'" opacity="0.8" />
          </svg>
        </div>

        <div class="car-info">
          <div class="info-row">
            <span class="info-label">车身类型</span>
            <span class="info-value">{{ getBodyStyleName(car.body_style) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">主色调</span>
            <span class="color-preview" :style="{ backgroundColor: car.colors?.primary || '#ff6b00' }"></span>
          </div>
        </div>

        <div class="car-stats">
          <div class="stat-item">
            <span class="stat-icon">⚡</span>
            <div class="stat-info">
              <span class="stat-name">动力</span>
              <div class="stat-bar">
                <div class="stat-fill" :style="{ width: (car.stats?.power || 0) + '%' }"></div>
              </div>
              <span class="stat-num">{{ car.stats?.power || 0 }}</span>
            </div>
          </div>
          <div class="stat-item">
            <span class="stat-icon">🎯</span>
            <div class="stat-info">
              <span class="stat-name">抓地力</span>
              <div class="stat-bar">
                <div class="stat-fill" :style="{ width: (car.stats?.grip || 0) + '%' }"></div>
              </div>
              <span class="stat-num">{{ car.stats?.grip || 0 }}</span>
            </div>
          </div>
          <div class="stat-item">
            <span class="stat-icon">⚖️</span>
            <div class="stat-info">
              <span class="stat-name">重量</span>
              <div class="stat-bar">
                <div class="stat-fill weight" :style="{ width: (100 - (car.stats?.weight || 0)) + '%' }"></div>
              </div>
              <span class="stat-num">{{ car.stats?.weight || 0 }}</span>
            </div>
          </div>
          <div class="stat-item">
            <span class="stat-icon">🌪️</span>
            <div class="stat-info">
              <span class="stat-name">空气动力学</span>
              <div class="stat-bar">
                <div class="stat-fill" :style="{ width: (car.stats?.aerodynamics || 0) + '%' }"></div>
              </div>
              <span class="stat-num">{{ car.stats?.aerodynamics || 0 }}</span>
            </div>
          </div>
        </div>

        <div class="car-actions">
          <el-button
            v-if="!car.is_active"
            size="small"
            type="primary"
            class="btn-primary"
            @click="handleSetActive(car.id)"
          >
            设为当前
          </el-button>
          <el-button
            size="small"
            class="btn-secondary"
            @click="goToDesign(car.id)"
          >
            <el-icon><Edit /></el-icon>
            编辑设计
          </el-button>
          <el-button size="small" class="btn-secondary" @click="viewDetails(car)">
            <el-icon><View /></el-icon>
            详情
          </el-button>
          <el-button
            size="small"
            type="danger"
            :disabled="car.is_active"
            @click="handleDelete(car)"
          >
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </div>
      </div>

      <div v-if="gameStore.cars.length === 0 && !gameStore.loading" class="empty-state">
        <div class="empty-icon">🏎️</div>
        <h3 class="empty-title">你还没有赛车</h3>
        <p class="empty-desc">快去设计一辆吧！</p>
        <el-button type="primary" class="btn-primary" @click="goToCreate">
          <el-icon><Plus /></el-icon>
          创建第一辆赛车
        </el-button>
      </div>
    </div>

    <el-dialog
      v-model="detailDialogVisible"
      title="赛车详情"
      width="600px"
      class="detail-dialog"
    >
      <div v-if="selectedCar" class="car-detail-content">
        <div class="car-preview large">
          <svg class="car-silhouette" viewBox="0 0 400 150" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="detailBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" :style="{ stopColor: selectedCar.colors?.primary || '#ff6b00' }" />
                <stop offset="100%" :style="{ stopColor: selectedCar.colors?.secondary || '#cc5500' }" />
              </linearGradient>
            </defs>
            <path
              fill="url(#detailBodyGrad)"
              :d="getBodyShapePath(selectedCar.body_style)"
              stroke="#333"
              stroke-width="2"
            />
            <circle cx="120" cy="110" r="25" fill="#1a1a2e" stroke="#444" stroke-width="3" />
            <circle cx="120" cy="110" r="12" fill="#333" />
            <circle cx="280" cy="110" r="25" fill="#1a1a2e" stroke="#444" stroke-width="3" />
            <circle cx="280" cy="110" r="12" fill="#333" />
            <rect x="180" y="45" width="80" height="35" rx="5" :fill="selectedCar.colors?.accent || '#ff8c00'" opacity="0.8" />
          </svg>
        </div>

        <el-descriptions :column="2" border class="detail-desc">
          <el-descriptions-item label="赛车名称">{{ selectedCar.name }}</el-descriptions-item>
          <el-descriptions-item label="车身类型">{{ getBodyStyleName(selectedCar.body_style) }}</el-descriptions-item>
          <el-descriptions-item label="主色调">
            <span class="color-dot" :style="{ backgroundColor: selectedCar.colors?.primary }"></span>
            {{ selectedCar.colors?.primary }}
          </el-descriptions-item>
          <el-descriptions-item label="副色调">
            <span class="color-dot" :style="{ backgroundColor: selectedCar.colors?.secondary }"></span>
            {{ selectedCar.colors?.secondary }}
          </el-descriptions-item>
          <el-descriptions-item label="强调色">
            <span class="color-dot" :style="{ backgroundColor: selectedCar.colors?.accent }"></span>
            {{ selectedCar.colors?.accent }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ selectedCar.created_at || '-' }}</el-descriptions-item>
        </el-descriptions>

        <h4 class="section-title">性能参数</h4>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ selectedCar.stats?.power || 0 }}</div>
            <div class="stat-label">动力</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ selectedCar.stats?.grip || 0 }}</div>
            <div class="stat-label">抓地力</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ selectedCar.stats?.weight || 0 }}</div>
            <div class="stat-label">重量</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ selectedCar.stats?.aerodynamics || 0 }}</div>
            <div class="stat-label">空气动力学</div>
          </div>
        </div>

        <h4 class="section-title">已装配件</h4>
        <div class="installed-parts">
          <div v-for="(part, slot) in selectedCar.parts" :key="slot" class="part-item">
            <span class="part-slot">{{ getSlotName(slot) }}</span>
            <span class="part-name">{{ part?.name || '未安装' }}</span>
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog
      v-model="deleteDialogVisible"
      title="确认删除"
      width="400px"
      class="delete-dialog"
    >
      <div class="delete-content">
        <el-icon class="warning-icon"><Warning /></el-icon>
        <p>确定要删除赛车 <strong>{{ carToDelete?.name }}</strong> 吗？</p>
        <p class="warning-text">此操作不可撤销！</p>
      </div>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmDelete">确认删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, View, Delete, Warning } from '@element-plus/icons-vue'
import { useGameStore } from '@/stores/game'
import { deleteCar, createCar } from '@/api/car'

const router = useRouter()
const gameStore = useGameStore()

const detailDialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const selectedCar = ref(null)
const carToDelete = ref(null)

const bodyStyleMap = {
  sedan: { name: '轿车', path: 'M50,100 Q60,70 100,60 L180,55 Q220,50 260,55 L340,65 Q380,75 390,100 L390,115 L50,115 Z' },
  sports: { name: '跑车', path: 'M40,105 Q50,65 120,55 L200,50 Q250,48 300,55 L360,65 Q390,80 395,105 L395,115 L40,115 Z' },
  supercar: { name: '超级跑车', path: 'M30,105 Q40,55 130,48 L220,45 Q280,42 330,50 L370,60 Q395,75 400,105 L400,115 L30,115 Z' },
  formula: { name: '方程式', path: 'M20,105 Q30,60 80,55 L150,52 Q200,48 250,52 L320,55 Q370,60 380,105 L380,115 L20,115 Z' },
  offroad: { name: '越野车', path: 'M60,95 Q70,55 120,50 L200,48 Q260,50 310,55 L350,65 Q380,75 385,95 L385,115 L60,115 Z' }
}

const slotNames = {
  engine: '引擎',
  chassis: '底盘',
  suspension: '悬挂',
  tires: '轮胎',
  body: '车身',
  aerodynamics: '空气动力学套件'
}

onMounted(() => {
  gameStore.fetchCars()
})

function getBodyStyleName(style) {
  return bodyStyleMap[style]?.name || style
}

function getBodyShapePath(style) {
  return bodyStyleMap[style]?.path || bodyStyleMap.sedan.path
}

function getSlotName(slot) {
  return slotNames[slot] || slot
}

function goToCreate() {
  router.push('/design')
}

function goToDesign(carId) {
  router.push({ path: '/design', query: { carId } })
}

function viewDetails(car) {
  selectedCar.value = car
  detailDialogVisible.value = true
}

function handleSetActive(carId) {
  gameStore.setActiveCar(carId)
}

function handleDelete(car) {
  carToDelete.value = car
  deleteDialogVisible.value = true
}

async function confirmDelete() {
  if (!carToDelete.value) return
  
  try {
    const res = await deleteCar(carToDelete.value.id)
    if (res.code === 0 || res.code === 200) {
      ElMessage.success('删除成功')
      gameStore.cars = gameStore.cars.filter(c => c.id !== carToDelete.value.id)
      if (gameStore.activeCar?.id === carToDelete.value.id) {
        gameStore.activeCar = gameStore.cars[0] || null
      }
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch (error) {
    ElMessage.error('删除失败')
  } finally {
    deleteDialogVisible.value = false
    carToDelete.value = null
  }
}
</script>

<style scoped>
.garage-page {
  padding: 24px;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 32px;
  position: relative;
}

.page-title {
  margin-right: 24px;
  margin-bottom: 0;
}

.page-subtitle {
  flex-basis: 100%;
  margin-top: 8px;
  margin-bottom: 0;
}

.create-btn {
  margin-left: auto;
}

.cars-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
}

.car-card {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #2a2a4a;
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s ease;
  animation: slideUp 0.5s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.car-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
}

.car-card.active {
  border-color: #ff6b00;
  box-shadow: 0 0 30px rgba(255, 107, 0, 0.3);
}

.car-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.car-name {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.car-preview {
  aspect-ratio: 16/9;
  background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  position: relative;
  overflow: hidden;
}

.car-preview::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 50% 50%, rgba(255, 107, 0, 0.1) 0%, transparent 70%);
}

.car-preview.large {
  aspect-ratio: 16/7;
  margin-bottom: 24px;
}

.car-silhouette {
  width: 85%;
  height: auto;
  filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.5));
  transition: transform 0.3s ease;
}

.car-card:hover .car-silhouette {
  transform: scale(1.05);
}

.car-info {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #2a2a4a;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  font-size: 13px;
  color: #888;
}

.info-value {
  font-size: 13px;
  color: #fff;
  font-weight: 500;
}

.color-preview {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #3a3a5e;
}

.car-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-icon {
  font-size: 18px;
}

.stat-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-name {
  font-size: 11px;
  color: #888;
}

.stat-bar {
  height: 6px;
  background: #2a2a4a;
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}

.stat-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b00 0%, #ff8c00 100%);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.stat-fill.weight {
  background: linear-gradient(90deg, #4ade80 0%, #22c55e 100%);
}

.stat-num {
  font-size: 11px;
  color: #ff6b00;
  font-weight: 600;
  position: absolute;
  right: 0;
  top: -1px;
}

.stat-info {
  position: relative;
}

.car-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.car-actions .el-button {
  width: 100%;
  justify-content: center;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-title {
  font-size: 24px;
  color: #fff;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 14px;
  color: #888;
  margin-bottom: 24px;
}

.car-detail-content {
  color: #fff;
}

.detail-desc {
  margin-bottom: 24px;
}

.detail-desc :deep(.el-descriptions__label),
.detail-desc :deep(.el-descriptions__content) {
  color: #fff;
}

.detail-desc :deep(.el-descriptions__label) {
  background: rgba(255, 255, 255, 0.02);
  color: #888;
}

.detail-desc :deep(.el-descriptions__body) {
  background: transparent;
}

.detail-desc :deep(.el-descriptions__cell) {
  border-color: #2a2a4a;
}

.color-dot {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  margin-right: 8px;
  vertical-align: middle;
  border: 1px solid #3a3a5e;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin: 24px 0 16px;
  padding-left: 12px;
  border-left: 3px solid #ff6b00;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.installed-parts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.part-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid #2a2a4a;
  border-radius: 8px;
}

.part-slot {
  color: #888;
  font-size: 13px;
}

.part-name {
  color: #fff;
  font-size: 13px;
  font-weight: 500;
}

.delete-content {
  text-align: center;
  padding: 20px 0;
  color: #fff;
}

.warning-icon {
  font-size: 48px;
  color: #ff6b00;
  margin-bottom: 16px;
}

.warning-text {
  color: #f56c6c;
  margin-top: 8px;
}

@media (max-width: 768px) {
  .cars-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .installed-parts {
    grid-template-columns: 1fr;
  }
  
  .create-btn {
    margin-left: 0;
    margin-top: 16px;
    width: 100%;
  }
}
</style>
