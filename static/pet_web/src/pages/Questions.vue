<template>
  <Layout>
    <div class="questions-page page-container">
      <div class="flex-between mb-20">
        <h2 class="page-title">问答社区</h2>
        <el-button type="primary" @click="showAskDialog = true" v-if="userStore.isLogin">
          发起提问
        </el-button>
      </div>
      <div class="question-list">
        <div class="question-card" v-for="item in questionList" :key="item.id" @click="viewDetail(item.id)">
          <div class="question-header">
            <div class="user-avatar">{{ item.user_nickname?.charAt(0) }}</div>
            <div class="user-info">
              <span class="username">{{ item.user_nickname }}</span>
              <span class="time">{{ formatDate(item.created_at) }}</span>
            </div>
          </div>
          <h3 class="question-title">{{ item.title }}</h3>
          <p class="question-content">{{ item.content }}</p>
          <div class="question-footer">
            <span><el-icon><View /></el-icon> {{ item.view_count || 0 }}</span>
            <span><el-icon><ChatDotRound /></el-icon> {{ item.answer_count || 0 }}</span>
          </div>
        </div>
      </div>
      <el-empty v-if="questionList.length === 0 && !loading" description="暂无问题" />
    </div>

    <el-dialog v-model="showAskDialog" title="发起提问" width="600px">
      <el-form :model="askForm" label-width="80px">
        <el-form-item label="问题标题">
          <el-input v-model="askForm.title" placeholder="请输入问题标题" />
        </el-form-item>
        <el-form-item label="问题描述">
          <el-input v-model="askForm.content" type="textarea" :rows="6" placeholder="请详细描述你的问题" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAskDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitQuestion">提交</el-button>
      </template>
    </el-dialog>
  </Layout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { View, ChatDotRound } from '@element-plus/icons-vue'
import { questionApi } from '@/api'
import { useUserStore } from '@/stores/user'
import Layout from '@/components/Layout.vue'

const router = useRouter()
const userStore = useUserStore()
const questionList = ref([])
const loading = ref(false)
const showAskDialog = ref(false)
const submitting = ref(false)

const askForm = reactive({
  title: '',
  content: ''
})

function formatDate(date) {
  return new Date(date).toLocaleString('zh-CN')
}

function viewDetail(id) {
  router.push(`/question/${id}`)
}

async function submitQuestion() {
  if (!askForm.title || !askForm.content) {
    ElMessage.warning('请填写完整信息')
    return
  }
  submitting.value = true
  try {
    await questionApi.create(askForm, userStore.userId)
    ElMessage.success('提问成功')
    showAskDialog.value = false
    askForm.title = ''
    askForm.content = ''
    fetchData()
  } catch (e) {
    console.error(e)
  } finally {
    submitting.value = false
  }
}

async function fetchData() {
  loading.value = true
  try {
    const res = await questionApi.getList({ page_size: 50 })
    questionList.value = res.data?.list || []
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
.questions-page {
  padding-top: 20px;
}

.page-title {
  font-size: 24px;
  color: #303133;
}

.mb-20 {
  margin-bottom: 20px;
}

.question-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: box-shadow 0.3s;
}

.question-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.question-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff, #67c23a);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  margin-right: 12px;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 600;
  color: #303133;
}

.time {
  font-size: 12px;
  color: #909399;
}

.question-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.question-content {
  color: #606266;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.question-footer {
  display: flex;
  gap: 20px;
  color: #909399;
  font-size: 13px;
}

.question-footer span {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
