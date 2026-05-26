<template>
  <div class="plans-page">
    <div class="page-header flex-between">
      <h1 class="page-title">露营计划</h1>
      <el-button type="primary" @click="$router.push('/plan/create')" :disabled="!userStore.isLoggedIn">
        <el-icon><Plus /></el-icon>
        创建计划
      </el-button>
    </div>

    <el-alert
      v-if="!userStore.isLoggedIn"
      title="请先登录后创建计划"
      type="warning"
      show-icon
      :closable="false"
      style="margin-bottom: 20px"
    >
      <template #default>
        <el-button size="small" type="primary" @click="$router.push('/login')">去登录</el-button>
      </template>
    </el-alert>

    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="我的计划" name="my">
        <div class="plan-list" v-loading="loading">
          <div v-for="plan in myPlans" :key="plan.id" class="plan-card pointer" @click="goDetail(plan.id)">
            <div class="plan-cover">
              <img :src="plan.cover_image || placeholderImage" alt="" />
              <div class="plan-status">
                <el-tag :type="plan.status === 1 ? 'success' : 'info'" size="small">
                  {{ plan.status === 1 ? '进行中' : '待出发' }}
                </el-tag>
              </div>
            </div>
            <div class="plan-info">
              <h3 class="text-ellipsis">{{ plan.title }}</h3>
              <p v-if="plan.destination" class="plan-meta">
                <el-icon><Location /></el-icon> {{ plan.destination }}
              </p>
              <p v-if="plan.start_date" class="plan-meta">
                <el-icon><Calendar /></el-icon> {{ plan.start_date }} ~ {{ plan.end_date }}
              </p>
              <p class="plan-stats">
                <el-icon><Goods /></el-icon> {{ plan.items?.length || 0 }} 项装备
              </p>
            </div>
          </div>
        </div>
        <el-empty v-if="!loading && myPlans.length === 0" description="暂无计划" />
      </el-tab-pane>

      <el-tab-pane label="计划模板" name="templates">
        <div class="plan-list" v-loading="templateLoading">
          <div v-for="plan in templates" :key="plan.id" class="plan-card pointer" @click="useTemplate(plan)">
            <div class="plan-cover">
              <img :src="plan.cover_image || placeholderImage" alt="" />
            </div>
            <div class="plan-info">
              <h3 class="text-ellipsis">{{ plan.title }}</h3>
              <p v-if="plan.description" class="plan-desc text-ellipsis">{{ plan.description }}</p>
              <p class="plan-stats">
                <el-icon><Goods /></el-icon> {{ plan.items?.length || 0 }} 项装备
              </p>
              <el-button type="primary" size="small" @click.stop="useTemplate(plan)">使用模板</el-button>
            </div>
          </div>
        </div>
        <el-empty v-if="!templateLoading && templates.length === 0" description="暂无模板" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getPlanList, getTemplates, createPlan } from '@/api/plan'
import { useUserStore } from '@/stores/user'
import type { CampingPlan } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const templateLoading = ref(false)
const activeTab = ref('my')
const myPlans = ref<CampingPlan[]>([])
const templates = ref<CampingPlan[]>([])

const placeholderImage = 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=200&fit=crop'

const fetchMyPlans = async () => {
  if (!userStore.isLoggedIn) return
  loading.value = true
  try {
    const res = await getPlanList(userStore.userInfo!.id)
    if (res.code === 200) {
      myPlans.value = res.data.items
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const fetchTemplates = async () => {
  templateLoading.value = true
  try {
    const res = await getTemplates()
    if (res.code === 200) {
      templates.value = res.data.items
    }
  } catch (error) {
    console.error(error)
  } finally {
    templateLoading.value = false
  }
}

const handleTabChange = (tab: string) => {
  if (tab === 'templates') {
    fetchTemplates()
  }
}

const goDetail = (id: number) => {
  router.push(`/plan/${id}`)
}

const useTemplate = async (plan: CampingPlan) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  try {
    const res = await createPlan(userStore.userInfo!.id, {
      title: plan.title + ' (副本)',
      destination: plan.destination,
      description: plan.description,
      items: plan.items?.map(item => ({
        name: item.name,
        category: item.category,
        quantity: item.quantity
      }))
    })
    if (res.code === 200) {
      ElMessage.success('已根据模板创建计划')
      router.push(`/plan/${res.data.id}`)
    }
  } catch (error) {
    console.error(error)
  }
}

onMounted(fetchMyPlans)
</script>

<style scoped>
.plans-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.plan-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.plan-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s;
}

.plan-card:hover {
  transform: translateY(-4px);
}

.plan-cover {
  position: relative;
  height: 160px;
  overflow: hidden;
}

.plan-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.plan-status {
  position: absolute;
  top: 10px;
  right: 10px;
}

.plan-info {
  padding: 16px;
}

.plan-info h3 {
  font-size: 16px;
  margin-bottom: 8px;
}

.plan-meta {
  color: #909399;
  font-size: 14px;
  margin-bottom: 4px;
}

.plan-desc {
  color: #606266;
  font-size: 14px;
  margin-bottom: 8px;
}

.plan-stats {
  color: #909399;
  font-size: 14px;
  margin-bottom: 12px;
}

@media (max-width: 768px) {
  .plan-list {
    grid-template-columns: 1fr;
  }
}
</style>
