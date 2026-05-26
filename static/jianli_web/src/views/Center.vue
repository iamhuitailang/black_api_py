<template>
  <div class="center-page">
    <header class="page-header">
      <div class="container header-content">
        <div class="logo">
          <h1>简历在线制作平台</h1>
        </div>
        <nav class="header-nav">
          <router-link to="/templates" class="nav-link">模板中心</router-link>
          <router-link to="/center" class="nav-link active">个人中心</router-link>
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" :src="userStore.user?.avatar">
                {{ userStore.user?.nickname?.charAt(0) || userStore.user?.username?.charAt(0) }}
              </el-avatar>
              <span class="username">{{ userStore.user?.nickname || userStore.user?.username }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                <el-dropdown-item command="password">修改密码</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </nav>
      </div>
    </header>

    <div class="container page-container">
      <el-tabs v-model="activeTab" class="center-tabs">
        <el-tab-pane label="我的简历" name="resumes">
          <div class="tab-actions">
            <el-button type="primary" :icon="Plus" @click="createResume">新建简历</el-button>
          </div>

          <div class="resume-grid">
            <div v-for="item in resumeList" :key="item.id" class="resume-card">
              <div class="resume-thumb">
                <img :src="item.template_thumbnail || 'https://picsum.photos/200/280'" alt="" />
              </div>
              <div class="resume-info">
                <h3 class="resume-title ellipsis">{{ item.title }}</h3>
                <p class="resume-template">{{ item.template_name }}</p>
                <p class="resume-time">更新于 {{ item.updated_at?.split('T')[0] }}</p>
                <p class="resume-stats">
                  <span><el-icon><Download /></el-icon> {{ item.download_count }}</span>
                </p>
              </div>
              <div class="resume-actions">
                <el-button size="small" @click="editResume(item.id)">编辑</el-button>
                <el-button size="small" @click="previewResume(item.id)">预览</el-button>
                <el-button size="small" type="danger" @click="deleteResume(item.id)">删除</el-button>
              </div>
            </div>

            <div v-if="resumeList.length === 0" class="empty-wrapper">
              <el-empty description="暂无简历，点击上方按钮创建您的第一份简历" />
            </div>
          </div>

          <div class="pagination-wrapper" v-if="total > pageSize">
            <el-pagination
              v-model:current-page="page"
              v-model:page-size="pageSize"
              :total="total"
              layout="prev, pager, next"
              @current-change="loadResumes"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="个人资料" name="profile">
          <div class="profile-card">
            <h3>个人资料</h3>
            <el-form :model="profileForm" label-width="100px" class="profile-form">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="用户名">
                    <el-input v-model="profileForm.username" disabled />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="昵称">
                    <el-input v-model="profileForm.nickname" placeholder="请输入昵称" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="手机号">
                    <el-input v-model="profileForm.phone" placeholder="请输入手机号" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="邮箱">
                    <el-input v-model="profileForm.email" placeholder="请输入邮箱" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item>
                <el-button type="primary" @click="saveProfile">保存修改</el-button>
              </el-form-item>
            </el-form>
          </div>

          <div class="profile-card mt-20">
            <h3>修改密码</h3>
            <el-form :model="passwordForm" label-width="100px" class="profile-form">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="原密码">
                    <el-input v-model="passwordForm.old_password" type="password" show-password placeholder="请输入原密码" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="新密码">
                    <el-input v-model="passwordForm.new_password" type="password" show-password placeholder="请输入新密码" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="确认密码">
                    <el-input v-model="passwordForm.confirm_password" type="password" show-password placeholder="请确认新密码" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item>
                <el-button type="primary" @click="changePassword">修改密码</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download } from '@element-plus/icons-vue'
import { userApi, resumeApi, templateApi } from '@/api'
import { useUserStore } from '@/store'
import type { Resume, Template } from '@/types'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('resumes')
const page = ref(1)
const pageSize = ref(9)
const total = ref(0)
const resumeList = ref<Resume[]>([])
const templateList = ref<Template[]>([])

const profileForm = reactive({
  username: '',
  nickname: '',
  phone: '',
  email: ''
})

const passwordForm = reactive({
  old_password: '',
  new_password: '',
  confirm_password: ''
})

const loadUserInfo = async () => {
  try {
    const res = await userApi.getCurrentUser()
    profileForm.username = res.username
    profileForm.nickname = res.nickname || ''
    profileForm.phone = res.phone || ''
    profileForm.email = res.email || ''
  } catch (error) {
    console.error('Load user info error:', error)
  }
}

const loadResumes = async () => {
  try {
    const res = await resumeApi.getResumeList({
      page: page.value,
      page_size: pageSize.value
    })
    resumeList.value = res.items
    total.value = res.total
  } catch (error) {
    console.error('Load resumes error:', error)
  }
}

const createResume = async () => {
  try {
    const res = await templateApi.getTemplateList({ page: 1, page_size: 100, status: 1 })
    const defaultTemplate = res.items[0]
    const resume = await resumeApi.createResume({
      title: '我的简历',
      template_id: defaultTemplate?.id || 1
    })
    router.push(`/resume/edit/${resume.id}`)
  } catch (error) {
    console.error('Create resume error:', error)
  }
}

const editResume = (id: number) => {
  router.push(`/resume/edit/${id}`)
}

const previewResume = (id: number) => {
  router.push(`/resume/preview/${id}`)
}

const deleteResume = async (id: number) => {
  ElMessageBox.confirm('确定要删除这份简历吗？删除后无法恢复。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await resumeApi.deleteResume({ resume_id: id })
      ElMessage.success('删除成功')
      loadResumes()
    } catch (error) {
      console.error('Delete resume error:', error)
    }
  }).catch(() => {})
}

const saveProfile = async () => {
  try {
    await userApi.updateProfile(profileForm)
    ElMessage.success('保存成功')
    loadUserInfo()
  } catch (error) {
    console.error('Save profile error:', error)
  }
}

const changePassword = async () => {
  if (passwordForm.new_password !== passwordForm.confirm_password) {
    ElMessage.error('两次输入的密码不一致')
    return
  }
  if (passwordForm.new_password.length < 6) {
    ElMessage.error('新密码长度不能少于6位')
    return
  }

  try {
    await userApi.changePassword({
      old_password: passwordForm.old_password,
      new_password: passwordForm.new_password
    })
    ElMessage.success('密码修改成功')
    passwordForm.old_password = ''
    passwordForm.new_password = ''
    passwordForm.confirm_password = ''
  } catch (error) {
    console.error('Change password error:', error)
  }
}

const handleCommand = (command: string) => {
  if (command === 'profile') {
    activeTab.value = 'profile'
  } else if (command === 'password') {
    activeTab.value = 'profile'
  } else if (command === 'logout') {
    userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  }
}

onMounted(() => {
  loadUserInfo()
  loadResumes()
})
</script>

<style scoped>
.center-page {
  min-height: 100vh;
}

.page-header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
}

.logo h1 {
  font-size: 20px;
  color: #409eff;
  margin: 0;
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 24px;
}

.nav-link {
  color: #666;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s;
}

.nav-link:hover,
.nav-link.active {
  color: #409eff;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.username {
  font-size: 14px;
  color: #333;
}

.center-tabs {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}

.tab-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.resume-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.resume-card {
  background: #f9fafb;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #ebeef5;
  transition: all 0.3s;
}

.resume-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.resume-thumb {
  height: 180px;
  overflow: hidden;
  background: #f0f0f0;
}

.resume-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.resume-info {
  padding: 16px;
}

.resume-title {
  font-size: 16px;
  color: #333;
  margin-bottom: 6px;
  font-weight: 500;
}

.resume-template {
  font-size: 13px;
  color: #409eff;
  margin-bottom: 4px;
}

.resume-time {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.resume-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #999;
}

.resume-stats span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.resume-actions {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
}

.resume-actions .el-button {
  flex: 1;
}

.empty-wrapper {
  grid-column: 1 / -1;
  padding: 60px 0;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

.profile-card {
  background: #f9fafb;
  border-radius: 8px;
  padding: 24px;
  border: 1px solid #ebeef5;
}

.profile-card h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.profile-form {
  max-width: 800px;
}
</style>
