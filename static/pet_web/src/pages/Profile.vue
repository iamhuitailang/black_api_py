<template>
  <Layout>
    <div class="profile-page page-container">
      <h2 class="page-title">个人中心</h2>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card class="user-card">
            <div class="user-info">
              <div class="user-avatar">{{ userStore.nickname?.charAt(0) }}</div>
              <div class="user-detail">
                <h3>{{ userStore.nickname }}</h3>
                <p>{{ userStore.phone }}</p>
                <el-tag :type="getRoleTagType()">
                  {{ getRoleText() }}
                </el-tag>
                <el-button 
                  v-if="userStore.userRole === 'user'" 
                  type="primary" 
                  size="small" 
                  class="upgrade-btn"
                  @click="upgradeToSender"
                >
                  升级为送养人
                </el-button>
              </div>
            </div>
          </el-card>
          <el-card class="menu-card">
            <el-menu
              :default-active="activeMenu"
              class="profile-menu"
              @select="handleMenuSelect"
            >
              <el-menu-item index="info">
                <el-icon><User /></el-icon>
                <span>个人信息</span>
              </el-menu-item>
              <el-menu-item index="favorites">
                <el-icon><Star /></el-icon>
                <span>我的收藏</span>
              </el-menu-item>
              <el-menu-item index="applications">
                <el-icon><Document /></el-icon>
                <span>我的申请</span>
              </el-menu-item>
              <el-menu-item index="pets">
                <el-icon><Pets /></el-icon>
                <span>我的宠物</span>
              </el-menu-item>
              <el-menu-item index="messages">
                <el-icon><ChatDotRound /></el-icon>
                <span>消息中心</span>
              </el-menu-item>
            </el-menu>
          </el-card>
        </el-col>
        <el-col :span="16">
          <el-card>
            <template #header>
              <span>个人信息</span>
            </template>
            <el-form :model="form" label-width="100px" class="profile-form">
              <el-form-item label="用户名">
                <el-input v-model="form.nickname" />
              </el-form-item>
              <el-form-item label="手机号">
                <el-input v-model="form.phone" disabled />
              </el-form-item>
              <el-form-item label="邮箱">
                <el-input v-model="form.email" />
              </el-form-item>
              <el-form-item label="性别">
                <el-radio-group v-model="form.gender">
                  <el-radio value="male">男</el-radio>
                  <el-radio value="female">女</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="年龄">
                <el-input-number v-model="form.age" :min="1" :max="120" />
              </el-form-item>
              <el-form-item label="地址">
                <el-input v-model="form.address" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="saving" @click="saveProfile">保存修改</el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </Layout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Star, Document, Pets, ChatDotRound } from '@element-plus/icons-vue'
import { userApi } from '@/api'
import { useUserStore } from '@/stores/user'
import Layout from '@/components/Layout.vue'

const router = useRouter()
const userStore = useUserStore()
const activeMenu = ref('info')
const saving = ref(false)

const form = reactive({
  nickname: '',
  phone: '',
  email: '',
  gender: '',
  age: null,
  address: ''
})

function getRoleText() {
  const roleMap = {
    user: '普通用户',
    sender: '送养人',
    admin: '管理员'
  }
  return roleMap[userStore.userRole] || '普通用户'
}

function getRoleTagType() {
  const typeMap = {
    user: 'primary',
    sender: 'success',
    admin: 'danger'
  }
  return typeMap[userStore.userRole] || 'primary'
}

async function upgradeToSender() {
  try {
    await userApi.update(userStore.userId, { role: 'sender' })
    userStore.setUser({ ...userStore.user, role: 'sender' })
    ElMessage.success('升级成功！现在您可以发布宠物了')
  } catch (e) {
    console.error(e)
  }
}

function handleMenuSelect(key) {
  const menuMap = {
    favorites: '/favorites',
    applications: '/my-applications',
    pets: '/my-pets',
    messages: '/messages'
  }
  if (menuMap[key]) {
    router.push(menuMap[key])
  }
}

async function saveProfile() {
  saving.value = true
  try {
    await userApi.update(userStore.userId, form)
    userStore.setNickname(form.nickname)
    ElMessage.success('保存成功')
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

async function fetchUserInfo() {
  try {
    const res = await userApi.getById(userStore.userId)
    if (res.data) {
      Object.assign(form, res.data)
    }
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchUserInfo()
})
</script>

<style scoped>
.profile-page {
  padding-top: 20px;
}

.page-title {
  font-size: 24px;
  margin-bottom: 20px;
  color: #303133;
}

.user-card {
  margin-bottom: 20px;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff, #67c23a);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 16px;
}

.user-detail {
  text-align: center;
}

.user-detail h3 {
  font-size: 20px;
  margin-bottom: 8px;
  color: #303133;
}

.user-detail p {
  color: #909399;
  margin-bottom: 12px;
}

.upgrade-btn {
  margin-top: 12px;
}

.profile-menu {
  border-right: none;
}

.profile-form {
  max-width: 500px;
}
</style>
