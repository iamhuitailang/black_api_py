<template>
  <div class="templates-page">
    <header class="page-header">
      <div class="container header-content">
        <div class="logo">
          <h1>简历在线制作平台</h1>
        </div>
        <nav class="header-nav">
          <router-link to="/templates" class="nav-link active">模板中心</router-link>
          <router-link to="/center" class="nav-link">个人中心</router-link>
          <template v-if="userStore.isLoggedIn">
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                <el-avatar :size="32" :src="userStore.user?.avatar">
                  {{ userStore.user?.nickname?.charAt(0) || userStore.user?.username?.charAt(0) }}
                </el-avatar>
                <span class="username">{{ userStore.user?.nickname || userStore.user?.username }}</span>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="center">个人中心</el-dropdown-item>
                  <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <router-link to="/login" class="nav-link">登录</router-link>
            <router-link to="/register" class="nav-link register-btn">注册</router-link>
          </template>
        </nav>
      </div>
    </header>

    <div class="container page-container">
      <div class="page-title">
        <h2>选择简历模板</h2>
        <p>多种精美模板，总有一款适合你</p>
      </div>

      <div class="category-tabs">
        <el-tabs v-model="activeCategory" @tab-change="handleCategoryChange">
          <el-tab-pane label="全部模板" name="all" />
          <el-tab-pane 
            v-for="cat in categories" 
            :key="cat.id" 
            :label="cat.name" 
            :name="cat.code" 
          />
        </el-tabs>
      </div>

      <div class="template-grid">
        <div 
          v-for="template in templates" 
          :key="template.id" 
          class="template-card"
          @click="handleTemplateClick(template)"
        >
          <div class="template-thumb">
            <img 
              :src="template.thumbnail || 'https://picsum.photos/300/400'" 
              :alt="template.name"
              @error="handleImageError($event)"
            />
            <div class="template-overlay">
              <el-button type="primary" size="small">使用此模板</el-button>
            </div>
          </div>
          <div class="template-info">
            <h3 class="template-name">{{ template.name }}</h3>
            <p class="template-desc ellipsis-2">{{ template.description }}</p>
            <div class="template-meta">
              <span class="use-count"><el-icon><View /></el-icon> {{ template.use_count }} 人使用</span>
            </div>
          </div>
        </div>
      </div>

      <div class="pagination-wrapper" v-if="total > pageSize">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="loadTemplates"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { View } from '@element-plus/icons-vue'
import { templateApi, resumeApi } from '@/api'
import { useUserStore } from '@/store'
import type { Template, TemplateCategory } from '@/types'

const router = useRouter()
const userStore = useUserStore()

const categories = ref<TemplateCategory[]>([])
const templates = ref<Template[]>([])
const activeCategory = ref('all')
const page = ref(1)
const pageSize = ref(12)
const total = ref(0)

const loadCategories = async () => {
  try {
    const res = await templateApi.getAllCategories()
    categories.value = res
  } catch (error) {
    console.error('Load categories error:', error)
  }
}

const loadTemplates = async () => {
  try {
    const params: any = {
      page: page.value,
      page_size: pageSize.value,
      status: 1
    }
    if (activeCategory.value !== 'all') {
      params.category_code = activeCategory.value
    }
    const res = await templateApi.getTemplateList(params)
    templates.value = res.items
    total.value = res.total
  } catch (error) {
    console.error('Load templates error:', error)
  }
}

const handleCategoryChange = () => {
  page.value = 1
  loadTemplates()
}

const handleTemplateClick = async (template: Template) => {
  if (!userStore.isLoggedIn) {
    ElMessageBox.confirm('请先登录后再创建简历', '提示', {
      confirmButtonText: '去登录',
      cancelButtonText: '取消',
      type: 'info'
    }).then(() => {
      router.push('/login')
    }).catch(() => {})
    return
  }

  try {
    const res = await resumeApi.createResume({
      title: `${template.name} - 我的简历`,
      template_id: template.id
    })
    ElMessage.success('简历创建成功，开始编辑吧')
    router.push(`/resume/edit/${res.id}`)
  } catch (error) {
    console.error('Create resume error:', error)
  }
}

const handleCommand = (command: string) => {
  if (command === 'center') {
    router.push('/center')
  } else if (command === 'logout') {
    userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  }
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.src = 'https://picsum.photos/300/400'
}

onMounted(() => {
  loadCategories()
  loadTemplates()
})
</script>

<style scoped>
.templates-page {
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

.register-btn {
  background: #409eff;
  color: #fff;
  padding: 6px 16px;
  border-radius: 4px;
}

.register-btn:hover {
  background: #66b1ff;
  color: #fff;
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

.page-title {
  text-align: center;
  margin-bottom: 30px;
}

.page-title h2 {
  font-size: 28px;
  color: #333;
  margin-bottom: 8px;
}

.page-title p {
  color: #999;
  font-size: 14px;
}

.category-tabs {
  margin-bottom: 30px;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 24px;
}

.template-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s;
}

.template-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.template-thumb {
  position: relative;
  padding-top: 140%;
  overflow: hidden;
}

.template-thumb img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.template-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.template-card:hover .template-overlay {
  opacity: 1;
}

.template-info {
  padding: 16px;
}

.template-name {
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 500;
}

.template-desc {
  font-size: 13px;
  color: #999;
  margin-bottom: 12px;
  line-height: 1.5;
}

.template-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.use-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}
</style>
