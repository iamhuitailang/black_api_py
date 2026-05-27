<template>
  <div class="admin-reports">
    <h2 class="page-title">举报管理</h2>
    <el-card>
      <el-table :data="reportList" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="type" label="举报类型">
          <template #default="{ row }">
            <el-tag>{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="target_id" label="目标ID" width="100" />
        <el-table-column prop="reporter_nickname" label="举报人" />
        <el-table-column prop="content" label="举报内容" show-overflow-tooltip />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 'pending' ? 'warning' : row.status === 'handled' ? 'success' : 'info'">
              {{ row.status === 'pending' ? '待处理' : row.status === 'handled' ? '已处理' : '已忽略' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="举报时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240">
          <template #default="{ row }">
            <el-button type="success" link v-if="row.status === 'pending'" @click="handleReport(row)">处理</el-button>
            <el-button type="info" link v-if="row.status === 'pending'" @click="ignoreReport(row)">忽略</el-button>
            <el-button type="danger" link @click="deleteReport(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { reportApi } from '@/api'

const reportList = ref([])
const loading = ref(false)

function formatDate(date) {
  return new Date(date).toLocaleString('zh-CN')
}

async function handleReport(row) {
  try {
    await ElMessageBox.confirm('确定标记为已处理吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    })
    await reportApi.update(row.id, { status: 'handled' })
    ElMessage.success('已处理')
    fetchData()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

async function ignoreReport(row) {
  try {
    await ElMessageBox.confirm('确定忽略该举报吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    await reportApi.update(row.id, { status: 'ignored' })
    ElMessage.success('已忽略')
    fetchData()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

async function deleteReport(row) {
  try {
    await ElMessageBox.confirm('确定删除该举报吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await reportApi.delete(row.id)
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
    const res = await reportApi.getList({ page_size: 100 })
    reportList.value = res.data?.list || []
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
.admin-reports {
  padding: 20px;
}

.page-title {
  font-size: 24px;
  margin-bottom: 20px;
  color: #303133;
}
</style>
