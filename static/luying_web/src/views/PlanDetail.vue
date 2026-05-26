<template>
  <div class="plan-detail" v-loading="loading">
    <el-page-header @back="$router.back()" :title="plan?.title || '计划详情'" class="page-header" />

    <div v-if="plan" class="detail-content">
      <div class="plan-header">
        <div class="plan-cover">
          <img :src="plan.cover_image || placeholderImage" alt="" />
        </div>
        <div class="plan-basic">
          <h1>{{ plan.title }}</h1>
          <div class="plan-meta">
            <span v-if="plan.destination"><el-icon><Location /></el-icon> {{ plan.destination }}</span>
            <span v-if="plan.start_date"><el-icon><Calendar /></el-icon> {{ plan.start_date }} ~ {{ plan.end_date }}</span>
          </div>
          <p v-if="plan.description" class="plan-description">{{ plan.description }}</p>
          <div class="plan-actions">
            <el-button type="primary" @click="$router.push(`/packing-list/${plan.id}`)">
              <el-icon><List /></el-icon>
              查看打包清单
            </el-button>
            <el-button type="danger" @click="handleDelete">
              <el-icon><Delete /></el-icon>
              删除计划
            </el-button>
          </div>
        </div>
      </div>

      <div class="plan-items">
        <h2 class="section-title">装备清单</h2>
        <div class="items-container" v-if="plan.items.length > 0">
          <div v-for="(item, index) in plan.items" :key="item.id" class="item-card">
            <el-checkbox :model-value="item.is_checked" @change="toggleItem(index, $event)" />
            <div class="item-info">
              <span class="item-name">{{ item.name }}</span>
              <el-tag v-if="item.category" size="small" type="info">{{ item.category }}</el-tag>
              <span class="item-qty">x{{ item.quantity }}</span>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无装备" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPlanDetail, deletePlan, updatePlanItem } from '@/api/plan'
import type { CampingPlan } from '@/types'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const plan = ref<CampingPlan | null>(null)
const placeholderImage = 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&h=300&fit=crop'

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

const toggleItem = async (index: number, checked: boolean) => {
  if (!plan.value) return
  const item = plan.value.items[index]
  try {
    await updatePlanItem(item.id, { is_checked: checked })
    item.is_checked = checked
  } catch (error) {
    console.error(error)
  }
}

const handleDelete = () => {
  ElMessageBox.confirm('确定要删除这个计划吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deletePlan(plan.value!.id)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        router.push('/plans')
      }
    } catch (error) {
      console.error(error)
    }
  }).catch(() => {})
}

onMounted(fetchDetail)
</script>

<style scoped>
.plan-detail {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.detail-content {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.plan-header {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}

.plan-cover {
  width: 300px;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
}

.plan-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.plan-basic {
  flex: 1;
}

.plan-basic h1 {
  font-size: 24px;
  margin-bottom: 12px;
}

.plan-meta {
  display: flex;
  gap: 20px;
  color: #909399;
  margin-bottom: 12px;
}

.plan-description {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 20px;
}

.plan-actions {
  display: flex;
  gap: 12px;
}

.items-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.item-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-qty {
  color: #909399;
  font-size: 14px;
}

@media (max-width: 768px) {
  .plan-header {
    flex-direction: column;
  }
  .plan-cover {
    width: 100%;
  }
  .items-container {
    grid-template-columns: 1fr;
  }
}
</style>
