<template>
  <Layout>
    <div class="pet-detail-page page-container" v-if="petDetail">
      <el-breadcrumb separator="/" class="breadcrumb">
        <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/pets' }">宠物列表</el-breadcrumb-item>
        <el-breadcrumb-item>{{ petDetail.name }}</el-breadcrumb-item>
      </el-breadcrumb>

      <el-row :gutter="30">
        <el-col :span="14">
          <div class="pet-images card">
            <img
              :src="getFirstImage(petDetail.images)"
              class="main-image"
              alt="宠物图片"
            />
          </div>

          <div class="pet-description card">
            <h3>宠物描述</h3>
            <p>{{ petDetail.description }}</p>
          </div>

          <div class="pet-reviews card">
            <h3>用户评价</h3>
            <div v-if="reviewList.length > 0">
              <div class="review-item" v-for="review in reviewList" :key="review.id">
                <div class="review-header">
                  <el-avatar :src="review.user_avatar">
                    {{ review.user_nickname?.charAt(0) }}
                  </el-avatar>
                  <div class="review-info">
                    <span class="review-user">{{ review.user_nickname }}</span>
                    <el-rate v-model="review.rating" disabled />
                  </div>
                </div>
                <p class="review-content">{{ review.content }}</p>
              </div>
            </div>
            <el-empty v-else description="暂无评价" />
          </div>
        </el-col>

        <el-col :span="10">
          <div class="pet-info card">
            <div class="pet-header">
              <h2>{{ petDetail.name }}</h2>
              <span :class="['status-tag', `status-${petDetail.status}`]">{{ getStatusText(petDetail.status) }}</span>
            </div>
            <div class="pet-basic-info">
              <div class="info-item">
                <span class="label">品种</span>
                <span class="value">{{ petDetail.breed }}</span>
              </div>
              <div class="info-item">
                <span class="label">类型</span>
                <span class="value">{{ getTypeText(petDetail.type) }}</span>
              </div>
              <div class="info-item">
                <span class="label">年龄</span>
                <span class="value">{{ petDetail.age }}个月</span>
              </div>
              <div class="info-item">
                <span class="label">性别</span>
                <span class="value">{{ petDetail.gender === 'male' ? '公' : '母' }}</span>
              </div>
              <div class="info-item">
                <span class="label">体重</span>
                <span class="value">{{ petDetail.weight }}kg</span>
              </div>
              <div class="info-item">
                <span class="label">颜色</span>
                <span class="value">{{ petDetail.color }}</span>
              </div>
            </div>
            <div class="pet-tags">
              <el-tag v-if="petDetail.vaccinated" type="success">已接种疫苗</el-tag>
              <el-tag v-if="petDetail.sterilized" type="primary">已绝育</el-tag>
              <el-tag v-if="petDetail.dewormed" type="warning">已驱虫</el-tag>
            </div>
            <div class="pet-address">
              <el-icon size="16"><Location /></el-icon>
              {{ petDetail.address }}
            </div>
            <div class="pet-owner">
              <el-avatar :src="petDetail.owner_avatar">
                {{ petDetail.owner_nickname?.charAt(0) }}
              </el-avatar>
              <div>
                <p class="owner-name">送养人：{{ petDetail.owner_nickname }}</p>
                <p class="view-count">浏览次数：{{ petDetail.view_count }}</p>
              </div>
            </div>
            <div class="pet-actions">
              <el-button
                v-if="userStore.isLogin && petDetail.status === 'available'"
                type="primary"
                size="large"
                class="action-btn"
                @click="showApplyDialog = true"
              >
                <el-icon><Edit /></el-icon>
                申请领养
              </el-button>
              <el-button
                v-if="userStore.isLogin"
                :type="isFavorited ? 'danger' : ''"
                size="large"
                class="action-btn"
                @click="toggleFavorite"
              >
                <el-icon><Star :fill="isFavorited" /></el-icon>
                {{ isFavorited ? '取消收藏' : '收藏' }}
              </el-button>
              <el-button
                v-if="userStore.isLogin && petDetail.user_id !== userStore.userId"
                size="large"
                class="action-btn"
                @click="showMessageDialog = true"
              >
                <el-icon><Message /></el-icon>
                联系送养人
              </el-button>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-dialog v-model="showApplyDialog" title="申请领养" width="600px">
        <el-form ref="applyFormRef" :model="applyForm" :rules="applyRules" label-width="100px">
          <el-form-item label="领养理由" prop="reason">
            <el-input v-model="applyForm.reason" type="textarea" :rows="3" placeholder="请输入领养理由" />
          </el-form-item>
          <el-form-item label="养宠经验" prop="experience">
            <el-input v-model="applyForm.experience" type="textarea" :rows="3" placeholder="请描述您的养宠经验" />
          </el-form-item>
          <el-form-item label="居住条件" prop="living_condition">
            <el-input v-model="applyForm.living_condition" type="textarea" :rows="3" placeholder="请描述您的居住条件" />
          </el-form-item>
          <el-form-item label="工作情况">
            <el-input v-model="applyForm.work_situation" type="textarea" :rows="2" placeholder="请描述您的工作情况" />
          </el-form-item>
          <el-form-item label="家庭成员">
            <el-input v-model="applyForm.family_members" placeholder="请输入家庭成员情况" />
          </el-form-item>
          <el-form-item label="是否有其他宠物">
            <el-switch v-model="applyForm.has_other_pets" />
          </el-form-item>
          <el-form-item label="同意协议" prop="agreement">
            <el-checkbox v-model="applyForm.agreement">
              我已阅读并同意<a href="/guide" target="_blank">《领养协议》</a>
            </el-checkbox>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showApplyDialog = false">取消</el-button>
          <el-button type="primary" :loading="applyLoading" @click="handleApply">提交申请</el-button>
        </template>
      </el-dialog>

      <el-dialog v-model="showMessageDialog" title="联系送养人" width="500px">
        <el-form :model="messageForm" label-width="80px">
          <el-form-item label="消息内容">
            <el-input v-model="messageForm.content" type="textarea" :rows="4" placeholder="请输入消息内容" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showMessageDialog = false">取消</el-button>
          <el-button type="primary" :loading="messageLoading" @click="sendMessage">发送</el-button>
        </template>
      </el-dialog>
    </div>
  </Layout>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { petApi, adoptionApi, favoriteApi, messageApi, reviewApi } from '@/api'
import { useUserStore } from '@/stores/user'
import Layout from '@/components/Layout.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const petDetail = ref(null)
const reviewList = ref([])
const showApplyDialog = ref(false)
const showMessageDialog = ref(false)
const applyLoading = ref(false)
const messageLoading = ref(false)
const isFavorited = ref(false)
const favoriteId = ref(null)

const applyFormRef = ref(null)
const applyForm = reactive({
  pet_id: route.params.id,
  reason: '',
  experience: '',
  living_condition: '',
  work_situation: '',
  family_members: '',
  has_other_pets: 0,
  agreement: false
})

const messageForm = reactive({
  receiver_id: 0,
  content: ''
})

const applyRules = {
  reason: [{ required: true, message: '请输入领养理由', trigger: 'blur' }],
  experience: [{ required: true, message: '请描述养宠经验', trigger: 'blur' }],
  living_condition: [{ required: true, message: '请描述居住条件', trigger: 'blur' }],
  agreement: [{ required: true, message: '请同意领养协议', trigger: 'change' }]
}

const statusMap = {
  pending: '待审核',
  available: '可领养',
  adopted: '已领养',
  rejected: '已拒绝'
}

const typeMap = {
  dog: '狗狗',
  cat: '猫咪',
  other: '其他'
}

function getStatusText(status) {
  return statusMap[status] || status
}

function getTypeText(type) {
  return typeMap[type] || type
}

function getFirstImage(images) {
  if (!images) return 'https://placehold.co/600x400?text=No+Image'
  return images.split(',')[0]
}

function getImageList(images) {
  if (!images) return ['https://placehold.co/600x400?text=No+Image']
  return images.split(',')
}

async function fetchData() {
  try {
    const petId = route.params.id
    const [petRes, reviewRes] = await Promise.all([
      petApi.getDetail(petId),
      reviewApi.getList({ pet_id: petId })
    ])
    petDetail.value = petRes.data
    reviewList.value = reviewRes.data?.list || []
    messageForm.receiver_id = petDetail.value.user_id
    if (userStore.isLogin) {
      checkFavorite()
    }
  } catch (e) {
    console.error(e)
  }
}

async function checkFavorite() {
  try {
    const res = await favoriteApi.check({ user_id: userStore.userId, pet_id: route.params.id })
    isFavorited.value = res.data?.is_favorite || false
    favoriteId.value = res.data?.favorite_id || null
  } catch (e) {
    console.error(e)
  }
}

async function toggleFavorite() {
  if (!userStore.isLogin) {
    router.push('/login')
    return
  }
  try {
    if (isFavorited.value && favoriteId.value) {
      await favoriteApi.delete(favoriteId.value, userStore.userId)
      isFavorited.value = false
      favoriteId.value = null
      ElMessage.success('已取消收藏')
    } else {
      const res = await favoriteApi.create({ pet_id: route.params.id }, userStore.userId)
      isFavorited.value = true
      favoriteId.value = res.data?.id
      ElMessage.success('收藏成功')
    }
  } catch (e) {
    console.error(e)
  }
}

async function handleApply() {
  if (!applyFormRef.value) return
  await applyFormRef.value.validate(async (valid) => {
    if (valid) {
      applyLoading.value = true
      try {
        await adoptionApi.createApplication(applyForm, userStore.userId)
        ElMessage.success('申请提交成功')
        showApplyDialog.value = false
      } catch (e) {
        console.error(e)
      } finally {
        applyLoading.value = false
      }
    }
  })
}

async function sendMessage() {
  if (!messageForm.content) {
    ElMessage.warning('请输入消息内容')
    return
  }
  messageLoading.value = true
  try {
    await messageApi.send(messageForm, userStore.userId)
    ElMessage.success('消息发送成功')
    showMessageDialog.value = false
    messageForm.content = ''
  } catch (e) {
    console.error(e)
  } finally {
    messageLoading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.pet-detail-page {
  padding-top: 20px;
}

.breadcrumb {
  margin-bottom: 20px;
}

.pet-images {
  margin-bottom: 20px;
}

.main-image {
  width: 100%;
  height: 400px;
  border-radius: 8px;
}

.pet-description {
  margin-bottom: 20px;
}

.pet-description h3 {
  font-size: 18px;
  margin-bottom: 12px;
  color: #303133;
}

.pet-description p {
  line-height: 1.8;
  color: #606266;
}

.pet-reviews h3 {
  font-size: 18px;
  margin-bottom: 16px;
  color: #303133;
}

.review-item {
  padding: 16px 0;
  border-bottom: 1px solid #ebeef5;
}

.review-item:last-child {
  border-bottom: none;
}

.review-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.review-info {
  margin-left: 12px;
  flex: 1;
}

.review-user {
  display: block;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.review-content {
  color: #606266;
  line-height: 1.6;
}

.pet-info {
  position: sticky;
  top: 84px;
}

.pet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.pet-header h2 {
  font-size: 28px;
  color: #303133;
}

.status-tag {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  color: #fff;
}

.status-pending {
  background: #e6a23c;
}

.status-available {
  background: #67c23a;
}

.status-adopted {
  background: #909399;
}

.status-rejected {
  background: #f56c6c;
}

.pet-basic-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f5f7fa;
}

.info-item .label {
  color: #909399;
}

.info-item .value {
  color: #303133;
  font-weight: 500;
}

.pet-tags {
  margin-bottom: 16px;
}

.pet-tags .el-tag {
  margin-right: 8px;
}

.pet-address {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
  margin-bottom: 20px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.pet-owner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.owner-name {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.view-count {
  font-size: 13px;
  color: #909399;
}

.pet-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  width: 100%;
}
</style>
