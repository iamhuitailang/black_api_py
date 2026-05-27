<template>
  <div class="admin-pets">
    <h2 class="page-title">宠物管理</h2>
    <el-card>
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="宠物名称">
          <el-input v-model="searchForm.keyword" placeholder="请输入宠物名称" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="待审核" value="pending" />
            <el-option label="可领养" value="available" />
            <el-option label="已领养" value="adopted" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="petList" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="宠物名称" />
        <el-table-column prop="type" label="类型" />
        <el-table-column prop="breed" label="品种" />
        <el-table-column prop="owner_nickname" label="送养人" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="view_count" label="浏览量" width="100" />
        <el-table-column prop="created_at" label="发布时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row.id)">查看</el-button>
            <el-button type="success" link v-if="row.status === 'pending'" @click="approvePet(row)">审核通过</el-button>
            <el-button type="danger" link v-if="row.status === 'pending'" @click="rejectPet(row)">审核拒绝</el-button>
            <el-button type="danger" link @click="deletePet(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="fetchData"
          @size-change="fetchData"
        />
      </div>
    </el-card>

    <el-dialog v-model="rejectDialogVisible" title="拒绝审核" width="500px">
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="拒绝理由">
          <el-input v-model="rejectForm.reject_reason" type="textarea" :rows="4" placeholder="请输入拒绝理由" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="rejectLoading" @click="handleReject">确认拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { petApi } from '@/api'

const router = useRouter()
const petList = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const rejectDialogVisible = ref(false)
const rejectLoading = ref(false)
const currentPetId = ref(null)

const searchForm = reactive({
  keyword: '',
  status: ''
})

const rejectForm = reactive({
  status: 'rejected',
  reject_reason: ''
})

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

function resetSearch() {
  searchForm.keyword = ''
  searchForm.status = ''
  page.value = 1
  fetchData()
}

function viewDetail(id) {
  router.push(`/pet/${id}`)
}

async function approvePet(row) {
  try {
    await ElMessageBox.confirm(`确定通过"${row.name}"的审核吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    })
    await petApi.update(row.id, { status: 'available' })
    ElMessage.success('审核通过')
    fetchData()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

function rejectPet(row) {
  currentPetId.value = row.id
  rejectDialogVisible.value = true
}

async function handleReject() {
  if (!rejectForm.reject_reason) {
    ElMessage.warning('请输入拒绝理由')
    return
  }
  rejectLoading.value = true
  try {
    await petApi.update(currentPetId.value, rejectForm)
    ElMessage.success('已拒绝')
    rejectDialogVisible.value = false
    rejectForm.reject_reason = ''
    fetchData()
  } catch (e) {
    console.error(e)
  } finally {
    rejectLoading.value = false
  }
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
    const params = {
      page: page.value,
      page_size: pageSize.value,
      ...(searchForm.keyword && { keyword: searchForm.keyword }),
      ...(searchForm.status && { status: searchForm.status })
    }
    const res = await petApi.getList(params)
    petList.value = res.data?.list || []
    total.value = res.data?.total || 0
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
.admin-pets {
  padding: 20px;
}

.page-title {
  font-size: 24px;
  margin-bottom: 20px;
  color: #303133;
}

.search-form {
  margin-bottom: 20px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
