<template>
  <div class="dinosaur-page">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>克隆恐龙</span>
          </template>
          <el-form :model="cloneForm" label-width="80px">
            <el-form-item label="恐龙种类">
              <el-select v-model="cloneForm.speciesId" placeholder="选择种类">
                <el-option 
                  v-for="species in speciesList" 
                  :key="species.id" 
                  :label="species.name" 
                  :value="species.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="恐龙名称">
              <el-input v-model="cloneForm.name" placeholder="给恐龙起个名字" />
            </el-form-item>
            <el-form-item>
              <el-button 
                type="primary" 
                :disabled="!canClone"
                @click="cloneDinosaur"
              >
                开始克隆 ({{ cloneCost }} 金币)
              </el-button>
            </el-form-item>
          </el-form>
          <el-alert 
            title="克隆说明" 
            type="info" 
            :closable="false"
            description="收集化石合成DNA后即可克隆恐龙。基因品质越高，恐龙属性越强！"
          />
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>我的恐龙</span>
              <el-tag type="info">共 {{ dinosaurs.length }} 只</el-tag>
            </div>
          </template>
          <div v-if="dinosaurs.length > 0" class="dino-list">
            <div v-for="dino in dinosaurs" :key="dino.id" class="dino-card">
              <div class="dino-header">
                <span class="dino-emoji">{{ getDinoEmoji(dino) }}</span>
                <span class="dino-name">{{ dino.name }}</span>
                <el-tag size="small" :type="getStatusType(dino.status)">
                  {{ getStatusText(dino.status) }}
                </el-tag>
              </div>
              <div class="dino-stats">
                <div class="stat-row">
                  <span>等级</span>
                  <span>Lv.{{ dino.level }}</span>
                </div>
                <div class="stat-row">
                  <span>生命值</span>
                  <el-progress :percentage="dino.health || 100" :stroke-width="8" />
                </div>
                <div class="stat-row">
                  <span>饱食度</span>
                  <el-progress :percentage="dino.hunger || 80" :stroke-width="8" color="#e6a23c" />
                </div>
                <div class="stat-row">
                  <span>战斗力</span>
                  <span>{{ dino.power || 100 }}</span>
                </div>
              </div>
              <div class="dino-actions">
                <el-button size="small" type="primary" @click="feedDino(dino)">
                  喂食
                </el-button>
                <el-button size="small" type="success" @click="viewDetail(dino)">
                  详情
                </el-button>
              </div>
            </div>
          </div>
          <el-empty v-else description="还没有恐龙，快去克隆一只吧！" />
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showDetail" title="恐龙详情" width="500px">
      <div v-if="selectedDino" class="dino-detail">
        <div class="detail-header">
          <span class="detail-emoji">{{ getDinoEmoji(selectedDino) }}</span>
          <div>
            <h3>{{ selectedDino.name }}</h3>
            <el-tag :type="getStatusType(selectedDino.status)">
              {{ getStatusText(selectedDino.status) }}
            </el-tag>
          </div>
        </div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="等级">Lv.{{ selectedDino.level }}</el-descriptions-item>
          <el-descriptions-item label="品质">{{ selectedDino.quality }}%</el-descriptions-item>
          <el-descriptions-item label="生命值">{{ selectedDino.health }}/100</el-descriptions-item>
          <el-descriptions-item label="饱食度">{{ selectedDino.hunger }}/100</el-descriptions-item>
          <el-descriptions-item label="战斗力" :span="2">{{ selectedDino.power }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getDinosaurs, cloneDinosaur as cloneDinosaurApi, feedDinosaur as feedDinosaurApi, getDinosaurSpecies } from '@/services/api'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

const dinosaurs = ref([])
const speciesList = ref([])

const cloneForm = ref({
  speciesId: null,
  name: ''
})

const showDetail = ref(false)
const selectedDino = ref(null)

const cloneCost = computed(() => {
  const species = speciesList.value.find(s => s.id === cloneForm.value.speciesId)
  return species ? species.clone_cost : 1000
})

const canClone = computed(() => {
  return cloneForm.value.speciesId && 
         cloneForm.value.name && 
         userStore.userInfo?.coins >= cloneCost.value
})

const getDinoEmoji = (dino) => {
  const emojis = ['🦕', '🦖', '🐊', '🦎', '🐉', '🦴']
  return emojis[(dino.id || 0) % emojis.length]
}

const getStatusText = (status) => {
  const map = {
    healthy: '健康',
    hungry: '饥饿',
    tired: '疲惫',
    sick: '生病',
    angry: '愤怒'
  }
  return map[status] || status
}

const getStatusType = (status) => {
  const map = {
    healthy: 'success',
    hungry: 'warning',
    tired: 'info',
    sick: 'danger',
    angry: 'danger'
  }
  return map[status] || ''
}

const loadDinosaurs = async () => {
  const res = await getDinosaurs()
  if (res.code === 200) {
    dinosaurs.value = res.data || []
  }
}

const loadSpecies = async () => {
  const res = await getDinosaurSpecies()
  if (res.code === 200) {
    speciesList.value = res.data || []
  }
}

const cloneDinosaur = async () => {
  const res = await cloneDinosaurApi({
    species_id: cloneForm.value.speciesId,
    name: cloneForm.value.name
  })
  
  if (res.code === 200) {
    ElMessage.success('恐龙克隆成功！')
    cloneForm.value = { speciesId: null, name: '' }
    userStore.fetchUserInfo()
    loadDinosaurs()
  } else {
    ElMessage.error(res.message || '克隆失败')
  }
}

const feedDino = async (dino) => {
  const res = await feedDinosaurApi({ dinosaur_id: dino.id })
  if (res.code === 200) {
    ElMessage.success('喂食成功！')
    loadDinosaurs()
  } else {
    ElMessage.error(res.message || '喂食失败')
  }
}

const viewDetail = (dino) => {
  selectedDino.value = dino
  showDetail.value = true
}

onMounted(() => {
  loadDinosaurs()
  loadSpecies()
})
</script>

<style scoped>
.dinosaur-page {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dino-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.dino-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 15px;
  transition: all 0.3s;
}

.dino-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.dino-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.dino-emoji {
  font-size: 36px;
}

.dino-name {
  flex: 1;
  font-weight: 600;
  font-size: 16px;
}

.dino-stats {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.stat-row .el-progress {
  flex: 1;
  margin-left: 10px;
}

.dino-actions {
  display: flex;
  gap: 10px;
}

.dino-actions .el-button {
  flex: 1;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.detail-emoji {
  font-size: 64px;
}

.detail-header h3 {
  margin: 0 0 10px 0;
}
</style>
