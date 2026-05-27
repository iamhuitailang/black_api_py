<template>
  <div class="admin-dashboard">
    <h2 class="page-title">数据概览</h2>
    <el-row :gutter="20">
      <el-col :span="6" v-for="stat in stats" :key="stat.title">
        <el-card class="stat-card">
          <div class="stat-icon" :style="{ background: stat.color }">
            <el-icon><component :is="stat.icon" /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-title">{{ stat.title }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <el-row :gutter="20" class="mt-20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>最近注册用户</span>
          </template>
          <el-table :data="recentUsers" size="small">
            <el-table-column prop="nickname" label="用户名" />
            <el-table-column prop="phone" label="手机号" />
            <el-table-column prop="created_at" label="注册时间">
              <template #default="{ row }">
                {{ formatDate(row.created_at) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>最近发布宠物</span>
          </template>
          <el-table :data="recentPets" size="small">
            <el-table-column prop="name" label="宠物名称" />
            <el-table-column prop="breed" label="品种" />
            <el-table-column prop="status" label="状态">
              <template #default="{ row }">
                <el-tag size="small" :type="getStatusType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { User, Pets, Document, Message } from '@element-plus/icons-vue'
import { userApi, petApi, adoptionApi, messageApi } from '@/api'

const stats = ref([])
const recentUsers = ref([])
const recentPets = ref([])

const statusMap = {
  pending: { text: '待审核', type: 'warning' },
  available: { text: '可领养', type: 'success' },
  adopted: { text: '已领养', type: 'info' },
  rejected: { text: '已拒绝', type: 'danger' }
}

function getStatusText(status) {
  return statusMap[status]?.text || status
}

function getStatusType(status) {
  return statusMap[status]?.type || 'info'
}

function formatDate(date) {
  return new Date(date).toLocaleString('zh-CN')
}

async function fetchStats() {
  try {
    const [userRes, petRes, adoptionRes, messageRes] = await Promise.all([
      userApi.getList({ page_size: 1 }),
      petApi.getList({ page_size: 1 }),
      adoptionApi.getApplicationList({ page_size: 1 }),
      messageApi.getList({ page_size: 1 })
    ])
    stats.value = [
      { title: '用户总数', value: userRes.data?.total || 0, color: '#409eff', icon: User },
      { title: '宠物总数', value: petRes.data?.total || 0, color: '#67c23a', icon: Pets },
      { title: '领养申请', value: adoptionRes.data?.total || 0, color: '#e6a23c', icon: Document },
      { title: '消息总数', value: messageRes.data?.total || 0, color: '#f56c6c', icon: Message }
    ]
  } catch (e) {
    console.error(e)
  }
}

async function fetchRecentData() {
  try {
    const [userRes, petRes] = await Promise.all([
      userApi.getList({ page_size: 5 }),
      petApi.getList({ page_size: 5 })
    ])
    recentUsers.value = userRes.data?.list || []
    recentPets.value = petRes.data?.list || []
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchStats()
  fetchRecentData()
})
</script>

<style scoped>
.admin-dashboard {
  padding: 20px;
}

.page-title {
  font-size: 24px;
  margin-bottom: 20px;
  color: #303133;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 28px;
  margin-right: 20px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.stat-title {
  font-size: 14px;
  color: #909399;
}

.mt-20 {
  margin-top: 20px;
}
</style>
