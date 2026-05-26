<template>
  <div class="container" style="margin-top: 20px">
    <h1 class="page-title" style="margin-bottom: 20px">个人中心</h1>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-card>
          <div style="text-align: center">
            <el-avatar :size="80" :src="user?.avatar">
              {{ user?.nickname?.charAt(0) || 'U' }}
            </el-avatar>
            <h2 style="margin: 16px 0 8px">{{ user?.nickname || '用户' }}</h2>
            <div style="color: #909399">{{ user?.username }}</div>
            <el-tag style="margin-top: 8px" :type="user?.role === 'admin' ? 'danger' : 'primary'">
              {{ user?.role === 'admin' ? '管理员' : '普通用户' }}
            </el-tag>
          </div>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card>
          <el-tabs v-model="activeTab">
            <el-tab-pane label="基本信息" name="info">
              <el-form :model="form" label-width="100px" style="max-width: 500px">
                <el-form-item label="昵称">
                  <el-input v-model="form.nickname" />
                </el-form-item>
                <el-form-item label="邮箱">
                  <el-input v-model="form.email" />
                </el-form-item>
                <el-form-item label="手机号">
                  <el-input v-model="form.phone" />
                </el-form-item>
                <el-form-item label="头像URL">
                  <el-input v-model="form.avatar" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" :loading="saving" @click="saveProfile">保存</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <el-tab-pane label="修改密码" name="password">
              <el-form :model="passwordForm" label-width="100px" style="max-width: 500px">
                <el-form-item label="原密码">
                  <el-input v-model="passwordForm.old_password" type="password" show-password />
                </el-form-item>
                <el-form-item label="新密码">
                  <el-input v-model="passwordForm.new_password" type="password" show-password />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" :loading="changingPwd" @click="changePassword">修改密码</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <el-tab-pane label="我的评价" name="reviews">
              <div v-loading="reviewsLoading">
                <div v-for="review in reviews" :key="review.id" style="padding: 16px 0; border-bottom: 1px solid #e4e7ed">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px">
                    <strong>{{ review.movie?.title || '影片' }}</strong>
                    <el-rate :model-value="review.rating / 2" disabled size="small" />
                  </div>
                  <p style="color: #606266">{{ review.content }}</p>
                  <div style="color: #c0c4cc; font-size: 12px; margin-top: 8px">{{ review.created_at }}</div>
                </div>
                <div v-if="!reviewsLoading && reviews.length === 0" class="empty-container">
                  <el-empty description="暂无评价" />
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="退出登录" name="logout">
              <div style="text-align: center; padding: 40px">
                <el-button type="danger" size="large" @click="handleLogout">退出登录</el-button>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '@/api/request'
import { useUserStore } from '@/stores/user'
import type { User, Review, PaginatedData } from '@/types'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('info')
const saving = ref(false)
const changingPwd = ref(false)
const reviewsLoading = ref(false)
const reviews = ref<Review[]>([])

const user = ref<User | null>(userStore.user)

const form = reactive({
  nickname: user.value?.nickname || '',
  email: user.value?.email || '',
  phone: user.value?.phone || '',
  avatar: user.value?.avatar || ''
})

const passwordForm = reactive({
  old_password: '',
  new_password: ''
})

async function fetchUser() {
  try {
    const res = await api.get<User>('/movie/current/get')
    user.value = res.data
    userStore.setUser(res.data)
    form.nickname = res.data.nickname
    form.email = res.data.email
    form.phone = res.data.phone
    form.avatar = res.data.avatar
  } catch (e) {
    // handled
  }
}

async function fetchReviews() {
  reviewsLoading.value = true
  try {
    const res = await api.get<PaginatedData<Review>>('/movie/review/mine/get')
    reviews.value = res.data.items
  } catch (e) {
    // handled
  } finally {
    reviewsLoading.value = false
  }
}

async function saveProfile() {
  saving.value = true
  try {
    await api.post('/movie/profile/update', form)
    ElMessage.success('保存成功')
    fetchUser()
  } catch (e) {
    // handled
  } finally {
    saving.value = false
  }
}

async function changePassword() {
  if (!passwordForm.old_password || !passwordForm.new_password) {
    ElMessage.warning('请填写完整信息')
    return
  }
  if (passwordForm.new_password.length < 6) {
    ElMessage.warning('新密码至少6位')
    return
  }
  changingPwd.value = true
  try {
    await api.post('/movie/password/change', passwordForm)
    ElMessage.success('密码修改成功，请重新登录')
    handleLogout()
  } catch (e) {
    // handled
  } finally {
    changingPwd.value = false
  }
}

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确认退出登录？', '提示', { type: 'warning' })
    await api.post('/movie/logout')
  } catch (e: any) {
    // ignore
  }
  userStore.logout()
  router.push('/login')
}

onMounted(() => {
  fetchUser()
  fetchReviews()
})
</script>