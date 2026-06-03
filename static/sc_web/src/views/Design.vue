<template>
  <div class="design-page">
    <div class="page-header">
      <h1 class="page-title">{{ isEdit ? '编辑赛车' : '设计新赛车' }}</h1>
      <p class="page-subtitle">{{ isEdit ? '改装你的现有赛车' : '创造你的专属赛车' }}</p>
      <el-button class="btn-secondary back-btn" @click="goBack">
        <el-icon><Monitor /></el-icon>
        返回车库
      </el-button>
    </div>

    <div v-loading="loading" class="design-layout">
      <div class="left-panel">
        <div class="card">
          <h3 class="section-title">赛车预览</h3>
          <div class="car-preview-large">
            <svg class="car-silhouette-large" viewBox="0 0 500 200" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="designBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" :style="{ stopColor: carForm.colors.primary }" />
                  <stop offset="100%" :style="{ stopColor: carForm.colors.secondary }" />
                </linearGradient>
                <filter id="carGlow">
                  <feDropShadow dx="0" dy="4" stdDeviation="8" :style="{ floodColor: carForm.colors.primary, floodOpacity: 0.4 }" />
                </filter>
              </defs>
              <path
                fill="url(#designBodyGrad)"
                :d="getBodyShapePath(carForm.body_style)"
                stroke="#333"
                stroke-width="2"
                filter="url(#carGlow)"
                class="car-body-path"
              />
              <circle cx="150" cy="150" r="32" fill="#1a1a2e" stroke="#444" stroke-width="4" />
              <circle cx="150" cy="150" r="16" fill="#333" />
              <circle cx="150" cy="150" r="6" fill="#555" />
              <circle cx="350" cy="150" r="32" fill="#1a1a2e" stroke="#444" stroke-width="4" />
              <circle cx="350" cy="150" r="16" fill="#333" />
              <circle cx="350" cy="150" r="6" fill="#555" />
              <rect x="225" y="60" width="100" height="45" rx="6" :fill="carForm.colors.accent" opacity="0.9" />
              <rect x="235" y="70" width="80" height="25" rx="4" fill="rgba(255,255,255,0.1)" />
              <ellipse cx="100" cy="115" rx="15" ry="10" :fill="carForm.colors.accent" opacity="0.7" />
              <ellipse cx="400" cy="115" rx="15" ry="10" :fill="carForm.colors.accent" opacity="0.7" />
              <rect x="420" y="100" width="15" height="30" rx="3" fill="rgba(255,100,100,0.8)" />
            </svg>
          </div>

          <div class="live-stats">
            <h4 class="stats-title">实时性能</h4>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-icon-large">⚡</div>
                <div class="stat-value">{{ calculatedStats.power }}</div>
                <div class="stat-label">动力</div>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: calculatedStats.power + '%' }"></div>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon-large">🎯</div>
                <div class="stat-value">{{ calculatedStats.grip }}</div>
                <div class="stat-label">抓地力</div>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: calculatedStats.grip + '%' }"></div>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon-large">⚖️</div>
                <div class="stat-value">{{ calculatedStats.weight }}</div>
                <div class="stat-label">重量</div>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: (100 - calculatedStats.weight) + '%', background: 'linear-gradient(90deg, #4ade80 0%, #22c55e 100%)' }"></div>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon-large">🌪️</div>
                <div class="stat-value">{{ calculatedStats.aerodynamics }}</div>
                <div class="stat-label">空气动力学</div>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: calculatedStats.aerodynamics + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="right-panel">
        <div class="card">
          <h3 class="section-title">基本信息</h3>
          <el-form :model="carForm" label-width="100px" class="design-form">
            <el-form-item label="赛车名称">
              <el-input v-model="carForm.name" placeholder="给你的赛车起个名字" maxlength="20" show-word-limit />
            </el-form-item>
            <el-form-item label="车身类型">
              <el-radio-group v-model="carForm.body_style" class="body-style-group">
                <el-radio-button v-for="style in bodyStyles" :key="style.value" :value="style.value">
                  <span class="style-icon">{{ style.icon }}</span>
                  <span class="style-name">{{ style.label }}</span>
                </el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </div>

        <div class="card">
          <h3 class="section-title">颜色配置</h3>
          <div class="color-pickers">
            <div class="color-picker-item">
              <div class="color-label">
                <span class="color-dot-large" :style="{ backgroundColor: carForm.colors.primary }"></span>
                <span>主色调</span>
              </div>
              <el-color-picker
                v-model="carForm.colors.primary"
                show-alpha
                size="large"
                popper-class="dark-picker"
              />
            </div>
            <div class="color-picker-item">
              <div class="color-label">
                <span class="color-dot-large" :style="{ backgroundColor: carForm.colors.secondary }"></span>
                <span>副色调</span>
              </div>
              <el-color-picker
                v-model="carForm.colors.secondary"
                show-alpha
                size="large"
                popper-class="dark-picker"
              />
            </div>
            <div class="color-picker-item">
              <div class="color-label">
                <span class="color-dot-large" :style="{ backgroundColor: carForm.colors.accent }"></span>
                <span>强调色</span>
              </div>
              <el-color-picker
                v-model="carForm.colors.accent"
                show-alpha
                size="large"
                popper-class="dark-picker"
              />
            </div>
          </div>
          <div class="preset-colors">
            <span class="preset-label">预设方案：</span>
            <div class="preset-buttons">
              <el-button
                v-for="(preset, index) in colorPresets"
                :key="index"
                size="small"
                class="preset-btn"
                @click="applyColorPreset(preset)"
              >
                <span class="preset-colors-preview">
                  <span class="preset-color" :style="{ backgroundColor: preset.primary }"></span>
                  <span class="preset-color" :style="{ backgroundColor: preset.secondary }"></span>
                  <span class="preset-color" :style="{ backgroundColor: preset.accent }"></span>
                </span>
                {{ preset.name }}
              </el-button>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="section-title">零件安装</h3>
          <div class="part-slots">
            <div
              v-for="slot in partSlots"
              :key="slot.type"
              class="part-slot-card"
              :class="{ 'has-part': carForm.parts[slot.type] }"
            >
              <div class="slot-header">
                <span class="slot-icon">{{ slot.icon }}</span>
                <span class="slot-name">{{ slot.name }}</span>
              </div>
              
              <div v-if="carForm.parts[slot.type]" class="installed-part">
                <div class="part-info">
                  <div class="part-header">
                    <span class="part-name">{{ carForm.parts[slot.type].name }}</span>
                    <span :class="['tier-badge', 'tier-' + carForm.parts[slot.type].tier]">
                      T{{ carForm.parts[slot.type].tier }}
                    </span>
                  </div>
                  <div class="part-stats">
                    <span v-if="carForm.parts[slot.type].stats?.power" class="part-stat">
                      ⚡ +{{ carForm.parts[slot.type].stats.power }}
                    </span>
                    <span v-if="carForm.parts[slot.type].stats?.grip" class="part-stat">
                      🎯 +{{ carForm.parts[slot.type].stats.grip }}
                    </span>
                    <span v-if="carForm.parts[slot.type].stats?.weight" class="part-stat">
                      ⚖️ {{ carForm.parts[slot.type].stats.weight > 0 ? '+' : '' }}{{ carForm.parts[slot.type].stats.weight }}
                    </span>
                    <span v-if="carForm.parts[slot.type].stats?.aerodynamics" class="part-stat">
                      🌪️ +{{ carForm.parts[slot.type].stats.aerodynamics }}
                    </span>
                  </div>
                </div>
                <el-button
                  size="small"
                  type="danger"
                  text
                  @click="uninstallPart(slot.type)"
                >
                  卸载
                </el-button>
              </div>
              
              <div v-else class="empty-slot">
                <el-icon class="empty-icon"><Edit /></el-icon>
                <span>未安装零件</span>
              </div>

              <el-select
                v-model="selectedPartForSlot[slot.type]"
                placeholder="选择零件安装"
                class="part-select"
                size="small"
                @change="(val) => installPartToSlot(slot.type, val)"
              >
                <el-option
                  v-for="part in getAvailableParts(slot.type)"
                  :key="part.id"
                  :value="part.id"
                  :label="part.name"
                >
                  <div class="option-content">
                    <span>{{ part.name }}</span>
                    <span :class="['tier-badge', 'tier-' + part.tier]">T{{ part.tier }}</span>
                  </div>
                </el-option>
              </el-select>
            </div>
          </div>
        </div>

        <div class="save-section">
          <el-button size="large" class="btn-secondary" @click="goBack">取消</el-button>
          <el-button
            size="large"
            type="primary"
            class="btn-primary save-btn"
            :disabled="!canSave || loading"
            @click="saveDesign"
          >
            <el-icon><Aim /></el-icon>
            {{ isEdit ? '保存修改' : '创建赛车' }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Monitor, Edit, Aim } from '@element-plus/icons-vue'
import { useGameStore } from '@/stores/game'
import { createCar, updateCar, getCarDetail, installPartToCar, uninstallPartFromCar } from '@/api/car'

const router = useRouter()
const route = useRoute()
const gameStore = useGameStore()

const loading = ref(false)
const isEdit = computed(() => !!route.query.carId)
const selectedPartForSlot = reactive({})

const carForm = reactive({
  name: '',
  body_style: 'sports',
  colors: {
    primary: '#ff6b00',
    secondary: '#cc5500',
    accent: '#ff8c00'
  },
  parts: {},
  stats: {
    power: 50,
    grip: 50,
    weight: 50,
    aerodynamics: 50
  }
})

const baseStats = {
  sedan: { power: 40, grip: 50, weight: 60, aerodynamics: 45 },
  sports: { power: 60, grip: 65, weight: 45, aerodynamics: 60 },
  supercar: { power: 80, grip: 75, weight: 35, aerodynamics: 75 },
  formula: { power: 90, grip: 85, weight: 25, aerodynamics: 90 },
  offroad: { power: 55, grip: 80, weight: 70, aerodynamics: 35 }
}

const bodyStyles = [
  { value: 'sedan', label: '轿车', icon: '🚗' },
  { value: 'sports', label: '跑车', icon: '🏎️' },
  { value: 'supercar', label: '超跑', icon: '🚀' },
  { value: 'formula', label: '方程式', icon: '🏁' },
  { value: 'offroad', label: '越野车', icon: '🚙' }
]

const bodyStylePaths = {
  sedan: 'M60,130 Q75,90 130,75 L240,68 Q290,62 340,70 L430,85 Q475,95 485,130 L485,150 L60,150 Z',
  sports: 'M45,135 Q60,80 150,68 L250,62 Q315,58 375,68 L450,82 Q485,95 495,135 L495,150 L45,150 Z',
  supercar: 'M35,135 Q45,68 160,58 L275,52 Q350,48 410,58 L460,72 Q495,90 500,135 L500,150 L35,150 Z',
  formula: 'M25,135 Q35,75 100,68 L185,62 Q250,58 310,62 L395,68 Q460,75 475,135 L475,150 L25,150 Z',
  offroad: 'M75,120 Q85,70 150,62 L250,58 Q325,60 385,68 L435,82 Q470,92 475,120 L475,150 L75,150 Z'
}

const partSlots = [
  { type: 'engine', name: '引擎', icon: '⚙️' },
  { type: 'chassis', name: '底盘', icon: '🔩' },
  { type: 'suspension', name: '悬挂', icon: '🔧' },
  { type: 'tires', name: '轮胎', icon: '🛞' },
  { type: 'body', name: '车身', icon: '🚘' },
  { type: 'aerodynamics', name: '空力套件', icon: '🌬️' }
]

const colorPresets = [
  { name: '烈焰橙', primary: '#ff6b00', secondary: '#cc5500', accent: '#ff8c00' },
  { name: '深海蓝', primary: '#1e40af', secondary: '#1e3a8a', accent: '#3b82f6' },
  { name: '竞速红', primary: '#dc2626', secondary: '#991b1b', accent: '#ef4444' },
  { name: '暗夜黑', primary: '#1f2937', secondary: '#111827', accent: '#4b5563' },
  { name: '翠绿', primary: '#059669', secondary: '#047857', accent: '#10b981' },
  { name: '皇家紫', primary: '#7c3aed', secondary: '#5b21b6', accent: '#8b5cf6' }
]

const canSave = computed(() => {
  return !!carForm.name && carForm.name.trim().length > 0
})

const calculatedStats = computed(() => {
  const base = baseStats[carForm.body_style] || baseStats.sports
  const stats = { ...base }
  
  Object.values(carForm.parts).forEach(part => {
    if (part?.stats) {
      if (part.stats.power) stats.power += part.stats.power
      if (part.stats.grip) stats.grip += part.stats.grip
      if (part.stats.weight) stats.weight += part.stats.weight
      if (part.stats.aerodynamics) stats.aerodynamics += part.stats.aerodynamics
    }
  })
  
  return {
    power: Math.min(100, Math.max(0, stats.power)),
    grip: Math.min(100, Math.max(0, stats.grip)),
    weight: Math.min(100, Math.max(0, stats.weight)),
    aerodynamics: Math.min(100, Math.max(0, stats.aerodynamics))
  }
})

onMounted(async () => {
  await gameStore.fetchUserParts()
  
  if (isEdit.value) {
    await loadCarData(route.query.carId)
  }
})

async function loadCarData(carId) {
  loading.value = true
  try {
    const res = await getCarDetail(carId)
    if (res.code === 0 || res.code === 200) {
      const car = res.data
      carForm.name = car.name
      carForm.body_style = car.body_style
      carForm.colors = { ...car.colors }
      carForm.parts = { ...car.parts }
      carForm.stats = { ...car.stats }
    }
  } catch (error) {
    ElMessage.error('加载车辆数据失败')
  } finally {
    loading.value = false
  }
}

function getBodyShapePath(style) {
  return bodyStylePaths[style] || bodyStylePaths.sports
}

function getAvailableParts(slotType) {
  const installedPartIds = Object.values(carForm.parts).filter(p => p).map(p => p.id)
  return gameStore.userParts.filter(part => 
    part.type === slotType && !installedPartIds.includes(part.id)
  )
}

function applyColorPreset(preset) {
  carForm.colors.primary = preset.primary
  carForm.colors.secondary = preset.secondary
  carForm.colors.accent = preset.accent
}

async function installPartToSlot(slotType, partId) {
  const part = gameStore.getPartById(partId)
  if (!part) return
  
  if (isEdit.value) {
    try {
      const res = await installPartToCar(route.query.carId, partId, slotType)
      if (res.code === 0 || res.code === 200) {
        carForm.parts[slotType] = part
        ElMessage.success('零件安装成功')
      } else {
        ElMessage.error(res.msg || '安装失败')
      }
    } catch (error) {
      ElMessage.error('安装失败')
    }
  } else {
    carForm.parts[slotType] = part
  }
  
  selectedPartForSlot[slotType] = null
}

async function uninstallPart(slotType) {
  if (isEdit.value) {
    try {
      const carPartId = carForm.parts[slotType]?.car_part_id || carForm.parts[slotType]?.id
      const res = await uninstallPartFromCar(route.query.carId, carPartId)
      if (res.code === 0 || res.code === 200) {
        delete carForm.parts[slotType]
        ElMessage.success('零件已卸载')
      } else {
        ElMessage.error(res.msg || '卸载失败')
      }
    } catch (error) {
      ElMessage.error('卸载失败')
    }
  } else {
    delete carForm.parts[slotType]
  }
}

async function saveDesign() {
  if (!canSave.value) return
  
  loading.value = true
  try {
    const carData = {
      name: carForm.name,
      body_style: carForm.body_style,
      primary_color: carForm.colors.primary,
      secondary_color: carForm.colors.secondary,
      accent_color: carForm.colors.accent,
      description: carForm.name + ' - ' + carForm.body_style
    }
    
    let res
    let carId
    if (isEdit.value) {
      carData.car_id = route.query.carId
      res = await updateCar(carData)
      carId = route.query.carId
    } else {
      res = await createCar(carData)
      carId = res.data?.id
    }
    
    if (res.code === 0 || res.code === 200) {
      ElMessage.success(isEdit.value ? '保存成功' : '创建成功')
      
      if (carId && Object.keys(carForm.parts).length > 0) {
        for (const [slotType, part] of Object.entries(carForm.parts)) {
          if (part?.id) {
            try {
              await installPartToCar(carId, part.id, slotType)
            } catch (e) {
              console.error('安装零件失败', slotType, e)
            }
          }
        }
      }
      
      await gameStore.fetchCars()
      router.push('/garage')
    } else {
      ElMessage.error(res.msg || (isEdit.value ? '保存失败' : '创建失败'))
    }
  } catch (error) {
    ElMessage.error(isEdit.value ? '保存失败' : '创建失败')
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/garage')
}
</script>

<style scoped>
.design-page {
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

.back-btn {
  margin-left: auto;
}

.design-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
}

.left-panel,
.right-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid #2a2a4a;
  border-radius: 16px;
  padding: 24px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 20px;
  padding-left: 12px;
  border-left: 3px solid #ff6b00;
}

.car-preview-large {
  aspect-ratio: 16/7;
  background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
}

.car-preview-large::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 50% 50%, rgba(255, 107, 0, 0.15) 0%, transparent 70%);
}

.car-silhouette-large {
  width: 85%;
  height: auto;
  filter: drop-shadow(0 12px 32px rgba(0, 0, 0, 0.6));
}

.car-body-path {
  transition: d 0.5s ease;
}

.live-stats {
  padding-top: 20px;
  border-top: 1px solid #2a2a4a;
}

.stats-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-card {
  background: rgba(255, 107, 0, 0.05);
  border: 1px solid rgba(255, 107, 0, 0.2);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(255, 107, 0, 0.2);
}

.stat-icon-large {
  font-size: 24px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #ff6b00;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #888;
  margin-bottom: 8px;
}

.progress-bar {
  height: 6px;
  background: #2a2a4a;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b00 0%, #ff8c00 100%);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.design-form {
  color: #fff;
}

.body-style-group {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.body-style-group :deep(.el-radio-button__inner) {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid #2a2a4a;
  color: #888;
  transition: all 0.3s ease;
}

.body-style-group :deep(.el-radio-button__inner:hover) {
  border-color: #ff6b00;
  color: #ff6b00;
}

.body-style-group :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: linear-gradient(135deg, #ff6b00 0%, #ff8c00 100%);
  border-color: #ff6b00;
  color: #fff;
}

.style-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.style-name {
  font-size: 12px;
}

.color-pickers {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.color-picker-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid #2a2a4a;
  border-radius: 8px;
}

.color-label {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #fff;
  font-weight: 500;
}

.color-dot-large {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #3a3a5e;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.preset-colors {
  padding-top: 16px;
  border-top: 1px solid #2a2a4a;
}

.preset-label {
  color: #888;
  font-size: 13px;
  margin-right: 12px;
}

.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.preset-btn {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preset-colors-preview {
  display: flex;
  gap: 2px;
}

.preset-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.part-slots {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.part-slot-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid #2a2a4a;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
}

.part-slot-card:hover {
  border-color: #3a3a5e;
}

.part-slot-card.has-part {
  border-color: rgba(255, 107, 0, 0.3);
  background: rgba(255, 107, 0, 0.05);
}

.slot-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.slot-icon {
  font-size: 20px;
}

.slot-name {
  color: #fff;
  font-weight: 600;
  font-size: 14px;
}

.installed-part {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.part-info {
  flex: 1;
}

.part-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.part-name {
  color: #fff;
  font-weight: 500;
  font-size: 13px;
}

.part-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.part-stat {
  font-size: 11px;
  color: #888;
  background: rgba(0, 0, 0, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
}

.empty-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #555;
  margin-bottom: 12px;
}

.empty-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.part-select {
  width: 100%;
}

.option-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.save-section {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  padding: 24px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid #2a2a4a;
  border-radius: 16px;
}

.save-btn {
  min-width: 160px;
}

.tier-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.tier-1 { background: rgba(128, 128, 128, 0.2); color: #aaa; }
.tier-2 { background: rgba(0, 255, 0, 0.2); color: #4ade80; }
.tier-3 { background: rgba(0, 112, 255, 0.2); color: #60a5fa; }
.tier-4 { background: rgba(147, 51, 234, 0.2); color: #c084fc; }
.tier-5 { background: rgba(255, 215, 0, 0.2); color: #fbbf24; }

@media (max-width: 1200px) {
  .design-layout {
    grid-template-columns: 1fr;
  }
  
  .part-slots {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .body-style-group {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .save-section {
    flex-direction: column;
  }
  
  .save-btn {
    width: 100%;
  }
}
</style>
