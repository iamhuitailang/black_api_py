<template>
  <div class="profile-page">
    <div class="profile-header">
      <el-avatar :size="80" :src="userStore.userInfo?.avatar">
        {{ userStore.userInfo?.nickname?.[0] || 'U' }}
      </el-avatar>
      <div class="user-info">
        <h1>{{ userStore.userInfo?.nickname }}</h1>
        <p class="username">@{{ userStore.userInfo?.username }}</p>
        <p v-if="userStore.userInfo?.bio" class="bio">{{ userStore.userInfo.bio }}</p>
      </div>
    </div>

    <div class="profile-content">
      <div class="card">
        <h2 class="card-title">个人信息</h2>
        <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
          <el-form-item label="昵称" prop="nickname">
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
          <el-form-item label="个人简介">
            <el-input v-model="form.bio" type="textarea" :rows="3" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="loading" @click="handleUpdate">保存</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="card">
        <h2 class="card-title">快捷入口</h2>
        <div class="quick-links">
          <div class="link-item pointer" @click="$router.push('/plans')">
            <el-icon :size="32"><Document /></el-icon>
            <span>我的计划</span>
          </div>
          <div class="link-item pointer" @click="$router.push('/equipments')">
            <el-icon :size="32"><Goods /></el-icon>
            <span>装备库</span>
          </div>
          <div class="link-item pointer" @click="$router.push('/my-posts')">
            <el-icon :size="32"><Edit /></el-icon>
            <span>我的帖子</span>
          </div>
          <div class="link-item pointer" @click="$router.push('/my-favorites')">
            <el-icon :size="32"><Star /></el-icon>
            <span>我的收藏</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { updateUser } from '@/api/user'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  nickname: '',
  email: '',
  phone: '',
  avatar: '',
  bio: ''
})

const rules: FormRules = {
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }]
}

const initForm = () => {
  if (userStore.userInfo) {
    form.nickname = userStore.userInfo.nickname || ''
    form.email = userStore.userInfo.email || ''
    form.phone = userStore.userInfo.phone || ''
    form.avatar = userStore.userInfo.avatar || ''
    form.bio = userStore.userInfo.bio || ''
  }
}

const handleUpdate = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const res = await updateUser(userStore.userInfo!.id, form)
    if (res.code === 200) {
      ElMessage.success('更新成功')
      userStore.setUserInfo(res.data)
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

onMounted(initForm)
</script>

<style scoped>
.profile-page {
  padding: 20px;
}

.profile-header {
  background: #fff;
  border-radius: 12px;
  padding: 30px;
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.user-info h1 {
  font-size: 24px;
  margin-bottom: 4px;
}

.user-info .username {
  color: #909399;
  margin-bottom: 8px;
}

.user-info .bio {
  color: #606266;
  line-height: 1.6;
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #303133;
}

.quick-links {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.link-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 12px;
  transition: all 0.3s;
}

.link-item:hover {
  background: #409eff;
  color: #fff;
}

@media (max-width: 768px) {
  .quick-links {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
