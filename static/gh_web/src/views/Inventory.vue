<template>
  <div class="inventory container">
    <h1 class="mb-20">🎒 我的背包</h1>

    <div class="inventory-stats card mb-20">
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-icon">💰</span>
          <span class="stat-value">{{ authStore.user?.coins || 0 }} 金币</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">📦</span>
          <span class="stat-value">{{ inventory.length }} 件装备</span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-else class="inventory-grid">
      <div
        v-for="item in inventoryWithDetails"
        :key="item.id"
        class="item-card card"
      >
        <div class="item-icon">{{ getEquipmentIcon(item.equipment_type) }}</div>
        <div class="item-info">
          <h3>{{ item.name }}</h3>
          <p class="item-desc">{{ item.description }}</p>
          <div class="item-stats">
            <span class="badge badge-primary">Lv.{{ item.level }}/{{ item.max_level }}</span>
            <span class="item-power">⚡ 威力: {{ item.power }}</span>
          </div>
        </div>
        <div class="item-actions">
          <button 
            v-if="item.level < item.max_level"
            class="btn btn-primary"
            @click="upgradeEquipment(item.id)"
            :disabled="upgradingId === item.id"
          >
            {{ upgradingId === item.id ? '升级中...' : `升级 (${item.upgrade_cost * item.level}💰)` }}
          </button>
          <button v-else class="btn btn-outline" disabled>
            已满级
          </button>
        </div>
      </div>

      <div v-if="inventory.length === 0" class="text-center card" style="color: var(--text-secondary)">
        背包为空，去商店购买装备吧！
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore, useToastStore } from '../store'
import { gameAPI, equipmentAPI } from '../services/api'

const authStore = useAuthStore()
const toastStore = useToastStore()

const inventory = ref([])
const allEquipments = ref([])
const loading = ref(true)
const upgradingId = ref(null)

const inventoryWithDetails = computed(() => {
  return inventory.value.map(inv => {
    const eq = allEquipments.value.find(e => e.id === inv.equipment_id)
    return {
      ...inv,
      ...eq,
      inventory_id: inv.id
    }
  })
})

const getEquipmentIcon = (type) => {
  const icons = {
    detector: '📡',
    weapon: '⚔️',
    trap: '🪤'
  }
  return icons[type] || '🔧'
}

const upgradeEquipment = async (inventoryId) => {
  upgradingId.value = inventoryId
  try {
    const res = await gameAPI.upgradeEquipment(inventoryId)
    if (res.code === 200) {
      toastStore.success('升级成功！')
      authStore.user.coins = res.data.user?.coins || authStore.user.coins
      await loadInventory()
    } else {
      toastStore.error(res.message)
    }
  } catch (e) {
    toastStore.error('升级失败')
  } finally {
    upgradingId.value = null
  }
}

const loadInventory = async () => {
  const res = await gameAPI.getInventory()
  if (res.code === 200) {
    inventory.value = res.data
  }
}

const loadEquipments = async () => {
  const res = await equipmentAPI.getAll()
  if (res.code === 200) {
    allEquipments.value = res.data
  }
}

const loadData = async () => {
  loading.value = true
  try {
    await Promise.all([loadInventory(), loadEquipments()])
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.inventory-stats {
  padding: 20px;
}

.stats-row {
  display: flex;
  gap: 40px;
  justify-content: center;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
}

.stat-icon {
  font-size: 24px;
}

.stat-value {
  font-weight: 600;
}

.inventory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.item-card {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.item-icon {
  font-size: 48px;
  text-align: center;
}

.item-info h3 {
  color: var(--text-primary);
  margin-bottom: 8px;
}

.item-desc {
  color: var(--text-secondary);
  font-size: 13px;
  margin-bottom: 10px;
}

.item-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-power {
  font-size: 14px;
  color: var(--accent-warning);
}

.item-actions {
  margin-top: auto;
}

.item-actions .btn {
  width: 100%;
}
</style>
