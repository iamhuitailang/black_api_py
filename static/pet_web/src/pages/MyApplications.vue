<template>
  <Layout>
    <div class="my-applications-page page-container">
      <h2 class="page-title">我的申请</h2>
      <el-table :data="applicationList" v-loading="loading" class="applications-table">
        <el-table-column prop="pet_name" label="宠物名称" />
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
        <el-table-column label="操作">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row)">查看详情</el-button>
            <el-button type="primary" link v-if="row.status === 'approved'" @click="submitFeedback(row)">提交反馈</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="applicationList.length === 0 && !loading" description="暂无申请记录" />
    </div>

    <el-dialog v-model="detailDialogVisible" title="申请详情" width="600px">
      <el-descriptions :column="1" border v-if="currentApplication">
        <el-descriptions-item label="宠物名称">{{ currentApplication.pet_name }}</el-descriptions-item>
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

    <el-dialog v-model="feedbackDialogVisible" title="提交领养反馈" width="500px">
      <el-form :model="feedbackForm" label-width="80px">
        <el-form-item label="评分">
          <el-rate v-model="feedbackForm.rating" />
        </el-form-item>
        <el-form-item label="反馈内容">
          <el-input v-model="feedbackForm.content" type="textarea" :rows="4" placeholder="请输入领养后的反馈" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="feedbackDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="feedbackLoading" @click="handleSubmitFeedback">提交</el-button>
      </template>
    </el-dialog>
  </Layout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adoptionApi } from '@/api'
import { useUserStore } from '@/stores/user'
import Layout from '@/components/Layout.vue'

const userStore = useUserStore()
const applicationList = ref([])
const loading = ref(false)
const detailDialogVisible = ref(false)
const feedbackDialogVisible = ref(false)
const feedbackLoading = ref(false)
const currentApplication = ref(null)

const feedbackForm = reactive({
  application_id: null,
  pet_id: null,
  content: '',
  rating: 5
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

function submitFeedback(row) {
  feedbackForm.application_id = row.id
  feedbackForm.pet_id = row.pet_id
  feedbackDialogVisible.value = true
}

async function handleSubmitFeedback() {
  if (!feedbackForm.content) {
    ElMessage.warning('请输入反馈内容')
    return
  }
  feedbackLoading.value = true
  try {
    await adoptionApi.createFeedback(feedbackForm, userStore.userId)
    ElMessage.success('反馈提交成功')
    feedbackDialogVisible.value = false
    fetchData()
  } catch (e) {
    console.error(e)
  } finally {
    feedbackLoading.value = false
  }
}

async function fetchData() {
  loading.value = true
  try {
    const res = await adoptionApi.getApplicationList({ applicant_id: userStore.userId, page_size: 100 })
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
.my-applications-page {
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
