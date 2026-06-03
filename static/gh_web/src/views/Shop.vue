<template>
  <div class="shop container">
    <h1 class="mb-20">🏪 灵异装备商店</h1>

    <div class="shop-header card mb-20">
      <div class="header-content">
        <div class="coins-display">
          <span class="coins-icon">💰</span>
          <span class="coins-amount">{{ authStore.user?.coins || 0 }}</span>
          <span class="coins-label">金币</span>
        </div>
      </div>
    </div>

    <div class="filter-tabs mb-20">
      <button 
        class="btn" 
        :class="activeFilter === 'all' ? 'btn-primary' : 'btn-outline'"
        @click="activeFilter = 'all'"
      >
        全部
      </button>
      <button 
        class="btn" 
        :class="activeFilter === 'detector' ? 'btn-primary' : 'btn-outline'"
        @click="activeFilter = 'detector'"
      >
        📡 探测设备
      </button>
      <button 
        class="btn" 
        :class="activeFilter === 'weapon' ? 'btn-primary' : 'btn-outline'"
        @click="activeFilter = 'weapon'"
      >
        ⚔️ 驱魔法器
      </button>
      <button 
        class="btn" 
        :class="activeFilter === 'trap' ? 'btn-primary' : 'btn-outline'"
        @click="activeFilter = 'trap'"
      >
        🪤 陷阱
      </button>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else class="shop-grid">
      <div
        v-for="item in filteredEquipments"
        :key="item.id"
        class="shop-item card"
        :class="{ owned: isOwned(item.id) }"
      >
        <div class="item-icon">{{ getEquipmentIcon(item.type) }}</div>
        <div class="item-info">
          <h3>{{ item.name }}</h3>
          <p class="item-desc">{{ item.description }}</p>
          
          <div class="item-specs">
            <div class="spec-row">
              <span>类型:</span>
              <span class="badge badge-primary">{{ getTypeName(item.type) }}</span>
            </div>
            <div class="spec-row">
              <span>威力:</span>
              <span class="power">⚡ {{ item.power }}</span>
            </div>
            <div class="spec-row">
              <span>等级上限:</span>
              <span>Lv.{{ item.max_level }}</span>
            </div>
          </div>

          <div class="item-effect mt-20">
            <span class="effect-label">效果:</span>
            <span class="effect-text">{{ item.effect }}</span>
          </div>
        </div>

        <div class="item-footer mt-20">
          <div class="price" v-if="!isOwned(item.id)">
            <span class="price-icon">💰</span>
            <span class="price-amount">{{ item.price }}</span>
          </div>
          <div class="owned-badge" v-else>
            <span class="badge badge-success">已拥有</span>
          </div>
          
          <button 
            v-if="!isOwned(item.id)"
            class="btn btn-primary"
            @click="buyEquipment(item.id)"
            :disabled="buyingId === item.id || (authStore.user?.coins || 0) < item.price"
          >
            {{ buyingId === item.id ? '购买中...' : '购买' }}
          </button>
          <button v-else class="btn btn-outline" disabled>
            已拥有
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore, useToastStore } from '../store'
import { equipmentAPI, gameAPI } from '../services/api'

const authStore = useAuthStore()
const toastStore = useToastStore()

const equipments = ref([])
const userInventory = ref([])
const activeFilter = ref('all')
const loading = ref(true)
const buyingId = ref(null)

const filteredEquipments = computed(() => {
  if (activeFilter.value === 'all') return equipments.value
  return equipments.value.filter(e => e.type === activeFilter.value)
})

const isOwned = (equipmentId) => {
  return userInventory.value.some(i => i.equipment_id === equipmentId)
}

const getEquipmentIcon = (type) => {
  const icons = {
    detector: '📡',
    weapon: '⚔️',
    trap: '🪤'
  }
  return icons[type] || '🔧'
}

const getTypeName = (type) => {
  const names = {
    detector: '探测',
    weapon: '法器',
    trap: '陷阱'
  }
  return names[type] || type
}

const buyEquipment = async (equipmentId) => {
  buyingId.value = equipmentId
  try {
    const res = await gameAPI.buyEquipment(equipmentId)
    if (res.code === 200) {
      toastStore.success('购买成功！')
      authStore.user.coins = res.data.user?.coins || authStore.user.coins
      await loadInventory()
    } else {
      toastStore.error(res.message)
    }
  } catch (e) {
    toastStore.error('购买失败')
  } finally {
    buyingId.value = null
  }
}

const loadEquipments = async () => {
  const res = await equipmentAPI.getAll()
  if (res.code === 200) {
    equipments.value = res.data
  }
}

const loadInventory = async () => {
  const res = await gameAPI.getInventory()
  if (res.code === 200) {
    userInventory.value = res.data
  }
}

const loadData = async () => {
  loading.value = true
  try {
    await Promise.all([loadEquipments(), loadInventory()])
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.shop-header {
  padding: 20px;
}

.header-content {
  display: flex;
  justify-content: center;
}

.coins-display {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 30px;
  background: var(--bg-secondary);
  border-radius: 30px;
}

.coins-icon {
  font-size: 28px;
}

.coins-amount {
  font-size: 24px;
  font-weight: bold;
  color: var(--accent-warning);
}

.coins-label {
  color: var(--text-secondary);
}

.filter-tabs {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.shop-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.shop-item {
  display: flex;
  flex-direction: column;
  transition: all 0.3s;
}

.shop-item.owned {
  opacity: 0.8;
}

.item-icon {
  font-size: 56px;
  text-align: center;
  margin-bottom: 15px;
}

.item-info h3 {
  color: var(--text-primary);
  margin-bottom: 10px;
  text-align: center;
}

.item-desc {
  color: var(--text-secondary);
  font-size: 13px;
  margin-bottom: 15px;
  line-height: 1.5;
}

.item-specs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.spec-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.spec-row span:first-child {
  color: var(--text-secondary);
}

.power {
  color: var(--accent-warning);
  font-weight: 500;
}

.item-effect {
  padding: 10px;
  background: var(--bg-secondary);
  border-radius: 6px;
  font-size: 12px;
}

.effect-label {
  color: var(--accent-primary);
  font-weight: 500;
}

.effect-text {
  color: var(--text-secondary);
}

.item-footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid var(--border-color);
}

.price {
  display: flex;
  align-items: center;
  gap: 5px;
}

.price-icon {
  font-size: 20px;
}

.price-amount {
  font-size: 20px;
  font-weight: bold;
  color: var(--accent-warning);
}

.owned-badge {
  display: flex;
  align-items: center;
}
</style>
