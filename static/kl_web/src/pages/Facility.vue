<template>
  <div class="facility-page">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>设施商店</span>
          </template>
          <div class="facility-shop">
            <div 
              v-for="item in facilityShop" 
              :key="item.type" 
              class="shop-item"
              @click="selectFacility(item)"
              :class="{ selected: selectedFacility?.type === item.type }"
            >
              <span class="shop-icon">{{ item.icon }}</span>
              <div class="shop-info">
                <div class="shop-name">{{ item.name }}</div>
                <div class="shop-desc">{{ item.desc }}</div>
                <div class="shop-price">💰 {{ item.price.toLocaleString() }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>我的设施</span>
              <el-button type="primary" size="small" :disabled="!selectedFacility" @click="buildFacility">
                建造选中设施
              </el-button>
            </div>
          </template>
          <div v-if="facilities.length > 0" class="facility-grid">
            <div v-for="facility in facilities" :key="facility.id" class="facility-card">
              <div class="facility-header">
                <span class="facility-icon">{{ getFacilityIcon(facility.type) }}</span>
                <div class="facility-info">
                  <h4>{{ facility.name }}</h4>
                  <el-tag size="small" type="success">Lv.{{ facility.level }}</el-tag>
                </div>
              </div>
              <div class="facility-stats">
                <div class="stat-row">
                  <span>收入</span>
                  <span class="income">+{{ facility.income_per_hour || 100 }}/小时</span>
                </div>
                <div class="stat-row">
                  <span>容量</span>
                  <span>{{ facility.capacity || 50 }} 人</span>
                </div>
                <div class="stat-row">
                  <span>待收集</span>
                  <span class="pending">{{ facility.pending_income || 0 }} 💰</span>
                </div>
              </div>
              <div class="facility-actions">
                <el-button 
                  size="small" 
                  type="success" 
                  :disabled="!facility.pending_income"
                  @click="collectIncome(facility)"
                >
                  收集
                </el-button>
                <el-button size="small" type="primary" @click="upgradeFacility(facility)">
                  升级
                </el-button>
              </div>
            </div>
          </div>
          <el-empty v-else description="还没有设施，从左边选择建造吧！" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getFacilities, createFacility, upgradeFacility as upgradeFacilityApi, collectIncome as collectIncomeApi } from '@/services/api'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

const facilities = ref([])
const selectedFacility = ref(null)

const facilityShop = [
  { type: 'restaurant', name: '餐厅', desc: '提供美食，增加收入', icon: '🍽️', price: 5000 },
  { type: 'gift_shop', name: '礼品店', desc: '售卖纪念品', icon: '🎁', price: 8000 },
  { type: 'hotel', name: '酒店', desc: '提供住宿服务', icon: '🏨', price: 20000 },
  { type: 'museum', name: '博物馆', desc: '展示恐龙知识', icon: '🏛️', price: 15000 },
  { type: 'playground', name: '游乐场', desc: '儿童游乐设施', icon: '🎠', price: 10000 },
  { type: 'security', name: '安保中心', desc: '提升公园安全', icon: '🛡️', price: 12000 },
]

const getFacilityIcon = (type) => {
  const item = facilityShop.find(f => f.type === type)
  return item?.icon || '🏢'
}

const selectFacility = (item) => {
  selectedFacility.value = item
}

const loadFacilities = async () => {
  const res = await getFacilities()
  if (res.code === 200) {
    facilities.value = res.data || []
  }
}

const buildFacility = async () => {
  if (!selectedFacility.value) {
    ElMessage.warning('请先选择要建造的设施')
    return
  }
  
  const res = await createFacility({
    type: selectedFacility.value.type,
    name: selectedFacility.value.name,
    cost: selectedFacility.value.price
  })
  
  if (res.code === 200) {
    ElMessage.success('设施建造成功！')
    selectedFacility.value = null
    userStore.fetchUserInfo()
    loadFacilities()
  } else {
    ElMessage.error(res.message || '建造失败')
  }
}

const collectIncome = async (facility) => {
  const res = await collectIncomeApi(facility.id)
  if (res.code === 200) {
    ElMessage.success(`收集了 ${facility.pending_income} 金币！`)
    userStore.fetchUserInfo()
    loadFacilities()
  } else {
    ElMessage.error(res.message || '收集失败')
  }
}

const upgradeFacility = async (facility) => {
  const res = await upgradeFacilityApi(facility.id)
  if (res.code === 200) {
    ElMessage.success('升级成功！')
    userStore.fetchUserInfo()
    loadFacilities()
  } else {
    ElMessage.error(res.message || '升级失败')
  }
}

onMounted(() => {
  loadFacilities()
})
</script>

<style scoped>
.facility-page {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.facility-shop {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.shop-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.shop-item:hover {
  background: #e9ecef;
}

.shop-item.selected {
  border-color: #667eea;
  background: #e8ecff;
}

.shop-icon {
  font-size: 32px;
}

.shop-info {
  flex: 1;
}

.shop-name {
  font-weight: 600;
  margin-bottom: 2px;
}

.shop-desc {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.shop-price {
  font-size: 14px;
  color: #f56c6c;
  font-weight: 500;
}

.facility-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.facility-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 15px;
  transition: all 0.3s;
}

.facility-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.facility-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.facility-icon {
  font-size: 36px;
}

.facility-info h4 {
  margin: 0 0 5px 0;
}

.facility-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 15px;
  font-size: 14px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
}

.income {
  color: #67c23a;
  font-weight: 500;
}

.pending {
  color: #e6a23c;
  font-weight: 500;
}

.facility-actions {
  display: flex;
  gap: 10px;
}

.facility-actions .el-button {
  flex: 1;
}
</style>
