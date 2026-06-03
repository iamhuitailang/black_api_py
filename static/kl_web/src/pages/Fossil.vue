<template>
  <div class="fossil-page">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="excavation-card">
          <template #header>
            <span>化石发掘</span>
          </template>
          <div class="excavation-area">
            <div class="dig-site" @click="excavate">
              <div class="dig-icon">🔍</div>
              <div class="dig-text">点击发掘</div>
              <div class="dig-cost">消耗: {{ excavateCost }} 金币</div>
            </div>
            <el-progress 
              style="margin-top: 20px"
              :percentage="excavationProgress" 
              :status="excavationStatus"
            />
          </div>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>我的化石</span>
              <el-button 
                type="primary" 
                size="small" 
                :disabled="selectedFossils.length < 3"
                @click="combineFossils"
              >
                合成 DNA ({{ selectedFossils.length }}/3)
              </el-button>
            </div>
          </template>
          <div v-if="fossils.length > 0" class="fossil-grid">
            <div 
              v-for="fossil in fossils" 
              :key="fossil.id" 
              class="fossil-item"
              :class="{ selected: selectedFossils.includes(fossil.id) }"
              @click="toggleSelect(fossil.id)"
            >
              <div class="fossil-icon">🦴</div>
              <div class="fossil-name">{{ fossil.name }}</div>
              <div class="fossil-rarity" :class="fossil.rarity">
                {{ getRarityText(fossil.rarity) }}
              </div>
              <div class="fossil-quality">品质: {{ fossil.quality }}%</div>
            </div>
          </div>
          <el-empty v-else description="还没有化石，快去发掘吧！" />
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 20px">
      <template #header>
        <span>化石图鉴</span>
      </template>
      <el-table :data="fossilCatalog" stripe>
        <el-table-column prop="name" label="化石名称" />
        <el-table-column prop="dinosaur" label="对应恐龙" />
        <el-table-column prop="rarity" label="稀有度">
          <template #default="{ row }">
            <el-tag :type="getRarityType(row.rarity)">
              {{ getRarityText(row.rarity) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="chance" label="获得概率" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getFossils, excavateFossil, combineFossils as combineFossilsApi } from '@/services/api'

const fossils = ref([])
const selectedFossils = ref([])
const excavating = ref(false)
const excavationProgress = ref(0)

const excavateCost = 100

const excavationStatus = computed(() => {
  if (excavating.value) return 'success'
  return null
})

const fossilCatalog = [
  { name: '霸王龙牙', dinosaur: '霸王龙', rarity: 'legendary', chance: '5%' },
  { name: '三角龙头骨', dinosaur: '三角龙', rarity: 'epic', chance: '10%' },
  { name: '迅猛龙爪', dinosaur: '迅猛龙', rarity: 'rare', chance: '15%' },
  { name: '腕龙脊椎', dinosaur: '腕龙', rarity: 'uncommon', chance: '20%' },
  { name: '剑龙背板', dinosaur: '剑龙', rarity: 'common', chance: '50%' },
]

const getRarityText = (rarity) => {
  const map = {
    common: '普通',
    uncommon: '优秀',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说'
  }
  return map[rarity] || rarity
}

const getRarityType = (rarity) => {
  const map = {
    common: 'info',
    uncommon: '',
    rare: 'success',
    epic: 'warning',
    legendary: 'danger'
  }
  return map[rarity] || ''
}

const loadFossils = async () => {
  const res = await getFossils()
  if (res.code === 200) {
    fossils.value = res.data || []
  }
}

const excavate = async () => {
  if (excavating.value) return
  excavating.value = true
  excavationProgress.value = 0
  
  const interval = setInterval(() => {
    excavationProgress.value += 10
    if (excavationProgress.value >= 100) {
      clearInterval(interval)
    }
  }, 200)
  
  try {
    const res = await excavateFossil({ cost: excavateCost })
    clearInterval(interval)
    excavationProgress.value = 100
    
    if (res.code === 200) {
      ElMessage.success('发掘成功！获得新化石！')
      loadFossils()
    } else {
      ElMessage.error(res.message || '发掘失败')
    }
  } catch (e) {
    ElMessage.error('发掘失败')
  } finally {
    setTimeout(() => {
      excavating.value = false
      excavationProgress.value = 0
    }, 500)
  }
}

const toggleSelect = (id) => {
  const index = selectedFossils.value.indexOf(id)
  if (index > -1) {
    selectedFossils.value.splice(index, 1)
  } else if (selectedFossils.value.length < 3) {
    selectedFossils.value.push(id)
  }
}

const combineFossils = async () => {
  if (selectedFossils.value.length < 3) {
    ElMessage.warning('请选择3个化石')
    return
  }
  
  const res = await combineFossilsApi(selectedFossils.value)
  if (res.code === 200) {
    ElMessage.success('合成成功！获得恐龙DNA！')
    selectedFossils.value = []
    loadFossils()
  } else {
    ElMessage.error(res.message || '合成失败')
  }
}

onMounted(() => {
  loadFossils()
})
</script>

<style scoped>
.fossil-page {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.excavation-card {
  height: 100%;
}

.excavation-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.dig-site {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 8px 25px rgba(139, 69, 19, 0.4);
}

.dig-site:hover {
  transform: scale(1.05);
  box-shadow: 0 12px 35px rgba(139, 69, 19, 0.5);
}

.dig-site:active {
  transform: scale(0.95);
}

.dig-icon {
  font-size: 48px;
}

.dig-text {
  color: white;
  font-size: 18px;
  font-weight: 600;
  margin-top: 10px;
}

.dig-cost {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  margin-top: 5px;
}

.fossil-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.fossil-item {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.fossil-item:hover {
  background: #e9ecef;
  transform: translateY(-3px);
}

.fossil-item.selected {
  border-color: #667eea;
  background: #e8ecff;
}

.fossil-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.fossil-name {
  font-weight: 600;
  margin-bottom: 5px;
}

.fossil-rarity {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  display: inline-block;
  margin-bottom: 5px;
}

.fossil-rarity.legendary {
  background: #fef0f0;
  color: #f56c6c;
}

.fossil-rarity.epic {
  background: #fdf6ec;
  color: #e6a23c;
}

.fossil-rarity.rare {
  background: #f0f9eb;
  color: #67c23a;
}

.fossil-rarity.uncommon {
  background: #ecf5ff;
  color: #409eff;
}

.fossil-quality {
  font-size: 12px;
  color: #666;
}
</style>
