<template>
  <Layout>
    <div class="applications-page page-container">
      <h2 class="page-title">领养申请管理</h2>
      <el-table :data="applicationList" v-loading="loading" class="applications-table">
        <el-table-column prop="pet_name" label="宠物名称" />
        <el-table-column prop="applicant_nickname" label="申请人" />
        <el-table-column prop="applicant_phone" label="联系电话" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="申请时间">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row)">查看详情</el-button>
            <el-button type="success" link v-if="row.status === 'pending'" @click="approveApplication(row)">通过</el-button>
            <el-button type="danger" link v-if="row.status === 'pending'" @click="rejectApplication(row)">拒绝</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="applicationList.length === 0 && !loading" description="暂无申请记录" />
    </div>

    <el-dialog v-model="detailDialogVisible" title="申请详情" width="600px">
      <el-descriptions :column="1" border v-if="currentApplication">
        <el-descriptions-item label="宠物名称">{{ currentApplication.pet_name }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ currentApplication.applicant_nickname }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentApplication.applicant_phone }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentApplication.status)">{{ getStatusText(currentApplication.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="领养理由">{{ currentApplication.reason }}</el-descriptions-item>
        <el-descriptions-item label="养宠经验">{{ currentApplication.experience }}</el-descriptions-item>
        <el-descriptions-item label="居住条件">{{ currentApplication.living_condition }}</el-descriptions-item>
        <el-descriptions-item label="工作情况">{{ currentApplication.work_situation || '未填写' }}</el-descriptions-item>
        <el-descriptions-item label="家庭成员">{{ currentApplication.family_members || '未填写' }}</el-descriptions-item>
        <el-descriptions-item label="是否有其他宠物">{{ currentApplication.has_other_pets ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item label="申请时间">{{ formatDate(currentApplication.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="拒绝理由" v-if="currentApplication.status === 'rejected'">
          {{ currentApplication.reject_reason || '无' }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer v-if="currentApplication?.status === 'pending'">
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="success" @click="approveApplication(currentApplication)">通过申请</el-button>
        <el-button type="danger" @click="showRejectDialog">拒绝申请</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rejectDialogVisible" title="拒绝申请" width="500px">
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
  </Layout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adoptionApi } from '@/api'
import { useUserStore } from '@/stores/user'
import Layout from '@/components/Layout.vue'

const userStore = useUserStore()
const applicationList = ref([])
const loading = ref(false)
const detailDialogVisible = ref(false)
const rejectDialogVisible = ref(false)
const rejectLoading = ref(false)
const currentApplication = ref(null)

const rejectForm = reactive({
  status: 'rejected',
  reject_reason: ''
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

function viewDetail(row) {
  currentApplication.value = row
  detailDialogVisible.value = true
}

async function approveApplication(row) {
  try {
    await ElMessageBox.confirm('确定通过该申请吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    })
    await adoptionApi.updateApplicationStatus(row.id, { status: 'approved' })
    ElMessage.success('已通过申请')
    fetchData()
    detailDialogVisible.value = false
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

function showRejectDialog() {
  detailDialogVisible.value = false
  rejectDialogVisible.value = true
}

async function handleReject() {
  if (!rejectForm.reject_reason) {
    ElMessage.warning('请输入拒绝理由')
    return
  }
  rejectLoading.value = true
  try {
    await adoptionApi.updateApplicationStatus(currentApplication.value.id, rejectForm)
    ElMessage.success('已拒绝申请')
    rejectDialogVisible.value = false
    rejectForm.reject_reason = ''
    fetchData()
  } catch (e) {
    console.error(e)
  } finally {
    rejectLoading.value = false
  }
}

async function fetchData() {
  loading.value = true
  try {
    const res = await adoptionApi.getApplicationList({ sender_id: userStore.userId, page_size: 100 })
    applicationList.value = res.data?.list || []
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
.applications-page {
  padding-top: 20px;
}

.page-title {
  font-size: 24px;
  margin-bottom: 20px;
  color: #303133;
}

.applications-table {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}
</style>
