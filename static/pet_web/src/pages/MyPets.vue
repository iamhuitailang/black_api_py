<template>
  <Layout>
    <div class="my-pets-page page-container">
      <div class="page-header flex-between">
        <h2 class="page-title">我的宠物</h2>
        <el-button type="primary" @click="$router.push('/pet/publish')">
          <el-icon><Plus /></el-icon>
          发布宠物
        </el-button>
      </div>
      <el-table :data="petList" v-loading="loading" class="pets-table">
        <el-table-column prop="name" label="宠物名称" />
        <el-table-column prop="breed" label="品种" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="view_count" label="浏览次数" />
        <el-table-column prop="created_at" label="发布时间">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row.id)">查看</el-button>
            <el-button type="primary" link @click="editPet(row)">编辑</el-button>
            <el-button type="danger" link @click="deletePet(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="petList.length === 0 && !loading" description="暂无发布的宠物" />
    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { petApi } from '@/api'
import { useUserStore } from '@/stores/user'
import Layout from '@/components/Layout.vue'

const router = useRouter()
const userStore = useUserStore()
const petList = ref([])
const loading = ref(false)

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

function viewDetail(id) {
  router.push(`/pet/${id}`)
}

function editPet(row) {
  router.push(`/pet/edit/${row.id}`)
}

async function deletePet(row) {
  try {
    await ElMessageBox.confirm(`确定要删除"${row.name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await petApi.delete(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

async function fetchData() {
  loading.value = true
  try {
    const res = await petApi.getList({ user_id: userStore.userId, page_size: 100 })
    petList.value = res.data?.list || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.my-pets-page {
  padding-top: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  color: #303133;
}

.pets-table {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}
</style>
