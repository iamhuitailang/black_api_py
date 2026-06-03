<template>
  <div class="habitat-page">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>建造栖息地</span>
          </template>
          <el-form :model="buildForm" label-width="80px">
            <el-form-item label="栖息地类型">
              <el-select v-model="buildForm.type" placeholder="选择类型">
                <el-option label="草原" value="grassland" />
                <el-option label="森林" value="forest" />
                <el-option label="沙漠" value="desert" />
                <el-option label="湿地" value="wetland" />
                <el-option label="山地" value="mountain" />
              </el-select>
            </el-form-item>
            <el-form-item label="栖息地名称">
              <el-input v-model="buildForm.name" placeholder="给栖息地起个名字" />
            </el-form-item>
            <el-form-item label="容量">
              <el-slider v-model="buildForm.capacity" :min="1" :max="10" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="buildHabitat">
                开始建造 ({{ buildCost }} 金币)
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>我的栖息地</span>
              <el-tag type="info">共 {{ habitats.length }} 个</el-tag>
            </div>
          </template>
          <div v-if="habitats.length > 0" class="habitat-list">
            <div v-for="habitat in habitats" :key="habitat.id" class="habitat-card">
              <div class="habitat-header">
                <span class="habitat-icon">{{ getHabitatIcon(habitat.type) }}</span>
                <div class="habitat-info">
                  <h3>{{ habitat.name }}</h3>
                  <el-tag size="small">{{ getTypeText(habitat.type) }}</el-tag>
                </div>
                <el-tag type="success" size="small">Lv.{{ habitat.level }}</el-tag>
              </div>
              <div class="habitat-stats">
                <div class="stat">
                  <span>容量</span>
                  <span>{{ habitat.current_dinosaurs || 0 }}/{{ habitat.capacity }}</span>
                </div>
                <div class="stat">
                  <span>恐龙数</span>
                  <span>{{ habitat.dinosaur_count || 0 }}</span>
                </div>
                <div class="stat">
                  <span>舒适度</span>
                  <el-progress :percentage="habitat.comfort || 80" :stroke-width="8" />
                </div>
              </div>
              <div class="habitat-actions">
                <el-button size="small" type="primary" @click="upgradeHabitat(habitat)">
                  升级 ({{ habitat.level * 5000 }} 金币)
                </el-button>
                <el-button size="small" type="success">
                  分配恐龙
                </el-button>
              </div>
            </div>
          </div>
          <el-empty v-else description="还没有栖息地，快去建造吧！" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getHabitats, createHabitat, upgradeHabitat as upgradeHabitatApi } from '@/services/api'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

const habitats = ref([])
const buildForm = ref({
  type: '',
  name: '',
  capacity: 3
})

const buildCost = computed(() => {
  const baseCost = {
    grassland: 10000,
    forest: 15000,
    desert: 20000,
    wetland: 18000,
    mountain: 25000
  }
  return (baseCost[buildForm.value.type] || 10000) + (buildForm.value.capacity - 1) * 2000
})

const getHabitatIcon = (type) => {
  const icons = {
    grassland: '🌿',
    forest: '🌲',
    desert: '🏜️',
    wetland: '💧',
    mountain: '⛰️'
  }
  return icons[type] || '🏠'
}

const getTypeText = (type) => {
  const texts = {
    grassland: '草原',
    forest: '森林',
    desert: '沙漠',
    wetland: '湿地',
    mountain: '山地'
  }
  return texts[type] || type
}

const loadHabitats = async () => {
  const res = await getHabitats()
  if (res.code === 200) {
    habitats.value = res.data || []
  }
}

const buildHabitat = async () => {
  if (!buildForm.value.type || !buildForm.value.name) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  const res = await createHabitat({
    type: buildForm.value.type,
    name: buildForm.value.name,
    capacity: buildForm.value.capacity,
    cost: buildCost.value
  })
  
  if (res.code === 200) {
    ElMessage.success('栖息地建造成功！')
    buildForm.value = { type: '', name: '', capacity: 3 }
    userStore.fetchUserInfo()
    loadHabitats()
  } else {
    ElMessage.error(res.message || '建造失败')
  }
}

const upgradeHabitat = async (habitat) => {
  const res = await upgradeHabitatApi(habitat.id)
  if (res.code === 200) {
    ElMessage.success('升级成功！')
    userStore.fetchUserInfo()
    loadHabitats()
  } else {
    ElMessage.error(res.message || '升级失败')
  }
}

onMounted(() => {
  loadHabitats()
})
</script>

<style scoped>
.habitat-page {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.habitat-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.habitat-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s;
}

.habitat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.habitat-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.habitat-icon {
  font-size: 48px;
}

.habitat-info h3 {
  margin: 0 0 5px 0;
}

.habitat-stats {
  display: flex;
  gap: 30px;
  margin-bottom: 15px;
}

.stat {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}

.stat .el-progress {
  flex: 1;
}

.habitat-actions {
  display: flex;
  gap: 10px;
}
</style>
