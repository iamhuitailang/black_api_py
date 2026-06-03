<template>
  <div class="park-page">
    <el-card class="park-header">
      <div class="park-header-content">
        <div>
          <h2 v-if="currentPark">{{ currentPark.name }}</h2>
          <p v-if="currentPark" class="park-desc">{{ currentPark.description }}</p>
          <el-button v-if="!currentPark" type="primary" @click="showCreateDialog = true">
            创建公园
          </el-button>
        </div>
        <div v-if="currentPark" class="park-stats-bar">
          <div class="stat-item">
            <span class="stat-icon">⭐</span>
            <span class="stat-value">Lv.{{ currentPark.level }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">👥</span>
            <span class="stat-value">{{ currentPark.visitor_count }} 访客</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">💰</span>
            <span class="stat-value">{{ currentPark.income?.toLocaleString() }} 收入</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">❤️</span>
            <span class="stat-value">{{ currentPark.rating?.toFixed(1) }} 评分</span>
          </div>
        </div>
      </div>
    </el-card>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>公园升级</span>
          </template>
          <div v-if="currentPark" class="upgrade-section">
            <div class="level-info">
              <div class="level-bar">
                <div class="level-progress" :style="{ width: levelProgress + '%' }"></div>
              </div>
              <span>经验: {{ currentPark.experience || 0 }} / {{ nextLevelExp }}</span>
            </div>
            <el-button type="primary" :disabled="!canUpgrade" @click="upgradePark">
              升级公园 ({{ upgradeCost }} 金币)
            </el-button>
          </div>
          <el-empty v-else description="请先创建公园" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>公园安全</span>
          </template>
          <div v-if="currentPark" class="safety-section">
            <el-progress 
              :percentage="safetyLevel" 
              :color="safetyColor"
              :stroke-width="20"
            />
            <div class="safety-tips">
              <el-alert 
                v-if="safetyLevel < 50" 
                title="安全警告" 
                type="error" 
                :closable="false"
                description="公园安全等级较低，建议增加安保设施！"
              />
              <el-alert 
                v-else-if="safetyLevel < 80" 
                title="注意安全" 
                type="warning"
                :closable="false"
                description="公园安全等级一般，可继续提升安全设施。"
              />
              <el-alert 
                v-else 
                title="安全良好" 
                type="success"
                :closable="false"
                description="公园安全状况良好！"
              />
            </div>
          </div>
          <el-empty v-else description="请先创建公园" />
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showCreateDialog" title="创建公园" width="500px">
      <el-form :model="createForm" label-width="80px">
        <el-form-item label="公园名称">
          <el-input v-model="createForm.name" placeholder="请输入公园名称" />
        </el-form-item>
        <el-form-item label="公园描述">
          <el-input 
            v-model="createForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入公园描述" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createPark">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getParks, createPark as createParkApi } from '@/services/api'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

const parks = ref([])
const currentPark = ref(null)
const showCreateDialog = ref(false)
const createForm = ref({
  name: '',
  description: ''
})

const levelProgress = computed(() => {
  if (!currentPark.value) return 0
  const currentExp = currentPark.value.experience || 0
  const nextExp = (currentPark.value.level || 1) * 1000
  return Math.min((currentExp / nextExp) * 100, 100)
})

const nextLevelExp = computed(() => {
  return ((currentPark.value?.level || 1) + 1) * 1000
})

const upgradeCost = computed(() => {
  return (currentPark.value?.level || 1) * 10000
})

const canUpgrade = computed(() => {
  return userStore.userInfo?.coins >= upgradeCost.value
})

const safetyLevel = computed(() => {
  if (!currentPark.value) return 0
  const level = currentPark.value.level || 1
  return Math.min(level * 10, 100)
})

const safetyColor = computed(() => {
  if (safetyLevel.value < 50) return '#f56c6c'
  if (safetyLevel.value < 80) return '#e6a23c'
  return '#67c23a'
})

const loadParks = async () => {
  const res = await getParks()
  if (res.code === 200) {
    parks.value = res.data || []
    if (parks.value.length > 0) {
      currentPark.value = parks.value[0]
    }
  }
}

const createPark = async () => {
  if (!createForm.value.name) {
    ElMessage.warning('请输入公园名称')
    return
  }
  const res = await createParkApi(createForm.value)
  if (res.code === 200) {
    ElMessage.success('公园创建成功！')
    showCreateDialog.value = false
    createForm.value = { name: '', description: '' }
    loadParks()
  } else {
    ElMessage.error(res.message || '创建失败')
  }
}

const upgradePark = async () => {
  ElMessage.info('公园升级功能开发中...')
}

onMounted(() => {
  loadParks()
})
</script>

<style scoped>
.park-page {
  padding: 0;
}

.park-header {
  margin-bottom: 20px;
}

.park-header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.park-header h2 {
  margin: 0 0 10px 0;
  color: #333;
}

.park-desc {
  color: #666;
  margin: 0;
}

.park-stats-bar {
  display: flex;
  gap: 30px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.stat-icon {
  font-size: 24px;
}

.stat-value {
  font-weight: 600;
  color: #333;
}

.upgrade-section,
.safety-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.level-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.level-bar {
  height: 20px;
  background: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
}

.level-progress {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  transition: width 0.5s ease;
}
</style>
