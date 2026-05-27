<template>
  <Layout>
    <div class="question-detail-page page-container" v-loading="loading">
      <el-button link @click="$router.back()" class="back-btn">
        <el-icon><ArrowLeft /></el-icon> 返回列表
      </el-button>
      <div class="question-detail" v-if="question">
        <h2 class="question-title">{{ question.title }}</h2>
        <div class="question-meta">
          <div class="user-avatar">{{ question.user_nickname?.charAt(0) }}</div>
          <div class="user-info">
            <span class="username">{{ question.user_nickname }}</span>
            <span class="time">{{ formatDate(question.created_at) }}</span>
          </div>
          <div class="view-count">
            <el-icon><View /></el-icon> {{ question.view_count || 0 }} 浏览
          </div>
        </div>
        <div class="question-content">{{ question.content }}</div>
      </div>

      <div class="answer-section" v-if="question">
        <h3 class="section-title">回答 ({{ answerList.length }})</h3>
        <div class="answer-list">
          <div class="answer-card" v-for="item in answerList" :key="item.id">
            <div class="answer-header">
              <div class="user-avatar small">{{ item.user_nickname?.charAt(0) }}</div>
              <div class="user-info">
                <span class="username">{{ item.user_nickname }}</span>
                <span class="time">{{ formatDate(item.created_at) }}</span>
              </div>
            </div>
            <div class="answer-content">{{ item.content }}</div>
          </div>
        </div>
        <el-empty v-if="answerList.length === 0" description="暂无回答" :image-size="80" />

        <div class="answer-form" v-if="userStore.isLogin">
          <el-input
            v-model="newAnswer"
            type="textarea"
            :rows="4"
            placeholder="写下你的回答..."
          />
          <el-button type="primary" class="submit-btn" :loading="submitting" @click="submitAnswer">
            提交回答
          </el-button>
        </div>
        <el-alert v-else type="info" title="请先登录后再回答" show-icon class="mt-20" />
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, View } from '@element-plus/icons-vue'
import { questionApi } from '@/api'
import { useUserStore } from '@/stores/user'
import Layout from '@/components/Layout.vue'

const route = useRoute()
const userStore = useUserStore()
const question = ref(null)
const answerList = ref([])
const loading = ref(false)
const newAnswer = ref('')
const submitting = ref(false)

function formatDate(date) {
  return new Date(date).toLocaleString('zh-CN')
}

async function submitAnswer() {
  if (!newAnswer.value.trim()) {
    ElMessage.warning('请输入回答内容')
    return
  }
  submitting.value = true
  try {
    await questionApi.createAnswer(route.params.id, { content: newAnswer.value.trim() }, userStore.userId)
    ElMessage.success('回答成功')
    newAnswer.value = ''
    fetchAnswers()
  } catch (e) {
    console.error(e)
  } finally {
    submitting.value = false
  }
}

async function fetchQuestion() {
  loading.value = true
  try {
    const res = await questionApi.getById(route.params.id)
    question.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function fetchAnswers() {
  try {
    const res = await questionApi.getAnswers(route.params.id)
    answerList.value = res.data?.list || []
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchQuestion()
  fetchAnswers()
})
</script>

<style scoped>
.question-detail-page {
  padding-top: 20px;
}

.back-btn {
  margin-bottom: 20px;
}

.question-detail {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.question-title {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 16px;
}

.question-meta {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff, #67c23a);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  margin-right: 12px;
}

.user-avatar.small {
  width: 36px;
  height: 36px;
  font-size: 14px;
}

.user-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.username {
  font-weight: 600;
  color: #303133;
}

.time {
  font-size: 12px;
  color: #909399;
}

.view-count {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
  font-size: 13px;
}

.question-content {
  font-size: 15px;
  line-height: 1.8;
  color: #606266;
  white-space: pre-wrap;
}

.answer-section {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
}

.answer-card {
  padding: 16px 0;
  border-bottom: 1px solid #f2f6fc;
}

.answer-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.answer-content {
  font-size: 14px;
  line-height: 1.7;
  color: #606266;
  white-space: pre-wrap;
  padding-left: 48px;
}

.answer-form {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #ebeef5;
}

.submit-btn {
  margin-top: 12px;
}

.mt-20 {
  margin-top: 20px;
}
</style>
