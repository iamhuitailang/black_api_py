<template>
  <div class="packing-list" v-loading="loading">
    <el-page-header @back="$router.back()" :title="plan?.title || '打包清单'" class="page-header" />

    <div v-if="plan" class="list-content">
      <div class="list-header">
        <el-progress :percentage="progress" :status="progress === 100 ? 'success' : ''" />
        <span class="progress-text">{{ checkedCount }} / {{ plan.items.length }} 已准备</span>
      </div>

      <div class="items-grouped" v-if="plan.items.length > 0">
        <div v-for="(groupItems, category) in groupedItems" :key="category" class="category-group">
          <h3 class="category-title">{{ category || '其他' }}</h3>
          <div class="items-list">
            <div v-for="item in groupItems" :key="item.id" class="item-row" :class="{ checked: item.is_checked }">
              <el-checkbox :model-value="item.is_checked" @change="toggleItem(item.id, $event)" />
              <span class="item-name">{{ item.name }}</span>
              <span class="item-qty">x{{ item.quantity }}</span>
            </div>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无装备" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getPlanDetail, updatePlanItem } from '@/api/plan'
import type { CampingPlan } from '@/types'

const route = useRoute()
const loading = ref(false)
const plan = ref<CampingPlan | null>(null)

const fetchDetail = async () => {
  loading.value = true
  try {
    const id = Number(route.params.id)
    const res = await getPlanDetail(id)
    if (res.code === 200) {
      plan.value = res.data
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const checkedCount = computed(() => {
  return plan.value?.items.filter(item => item.is_checked).length || 0
})

const progress = computed(() => {
  if (!plan.value || plan.value.items.length === 0) return 0
  return Math.round((checkedCount.value / plan.value.items.length) * 100)
})

const groupedItems = computed(() => {
  if (!plan.value) return {}
  const groups: Record<string, any[]> = {}
  plan.value.items.forEach(item => {
    const cat = item.category || '其他'
    if (!groups[cat]) {
      groups[cat] = []
    }
    groups[cat].push(item)
  })
  return groups
})

const toggleItem = async (itemId: number, checked: boolean) => {
  try {
    await updatePlanItem(itemId, { is_checked: checked })
    if (plan.value) {
      const item = plan.value.items.find(i => i.id === itemId)
      if (item) {
        item.is_checked = checked
      }
    }
  } catch (error) {
    console.error(error)
  }
}

onMounted(fetchDetail)
</script>

<style scoped>
.packing-list {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.list-content {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.list-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.progress-text {
  color: #909399;
  font-size: 14px;
  white-space: nowrap;
}

.category-group {
  margin-bottom: 24px;
}

.category-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #303133;
  padding-bottom: 8px;
  border-bottom: 2px solid #409eff;
  display: inline-block;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
  transition: all 0.3s;
}

.item-row.checked {
  background: #f0f9eb;
  opacity: 0.7;
}

.item-row.checked .item-name {
  text-decoration: line-through;
}

.item-name {
  flex: 1;
}

.item-qty {
  color: #909399;
  font-size: 14px;
}
</style>
