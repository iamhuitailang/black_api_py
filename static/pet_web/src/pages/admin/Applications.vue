<template>
  <div class="admin-applications">
    <h2 class="page-title">领养管理</h2>
    <el-card>
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="待审核" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已拒绝" value="rejected" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="adoptionList" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="pet_name" label="宠物名称" />
        <el-table-column prop="applicant_nickname" label="申请人" />
        <el-table-column prop="sender_nickname" label="送养人" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="申请时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row)">查看详情</el-button>
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

    <el-dialog v-model="detailDialogVisible" title="申请详情" width="600px">
      <el-descriptions :column="1" border v-if="currentApplication">
        <el-descriptions-item label="宠物名称">{{ currentApplication.pet_name }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ currentApplication.applicant_nickname }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentApplication.applicant_phone }}</el-descriptions-item>
        <el-descriptions-item label="送养人">{{ currentApplication.sender_nickname }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentApplication.status)">{{ getStatusText(currentApplication.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="领养理由">{{ currentApplication.reason }}</el-descriptions-item>
        <el-descriptions-item label="养宠经验">{{ currentApplication.experience }}</el-descriptions-item>
        <el-descriptions-item label="居住条件">{{ currentApplication.living_condition }}</el-descriptions-item>
        <el-descriptions-item label="申请时间">{{ formatDate(currentApplication.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="拒绝理由" v-if="currentApplication.status === 'rejected'">
          {{ currentApplication.reject_reason || '无' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { adoptionApi } from '@/api'

const adoptionList = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const detailDialogVisible = ref(false)
const currentApplication = ref(null)

const searchForm = reactive({
  status: ''
})

const statusMap = {
  pending: { text: '待审核', type: 'warning' },
  approved: { text: '已通过', type: 'success' },
  rejected: { text: '已拒绝', type: 'danger' },
  completed: { text: '已完成', type: 'info' }
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
  searchForm.status = ''
  page.value = 1
  fetchData()
}

function viewDetail(row) {
  currentApplication.value = row
  detailDialogVisible.value = true
}

async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      page_size: pageSize.value,
      ...(searchForm.status && { status: searchForm.status })
    }
    const res = await adoptionApi.getApplicationList(params)
    adoptionList.value = res.data?.list || []
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
.admin-applications {
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
