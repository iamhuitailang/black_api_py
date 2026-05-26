<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElTabs, ElMessage, ElMessageBox } from 'element-plus'
import type { TabPaneName } from 'element-plus'
import { User, Setting, EditPen, Lock, Link, Collection, Share } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores'
import { authApi, type UserInfo } from '@/api/auth'
import { postApi, type Post } from '@/api/blog'
import PostCard from '@/components/PostCard.vue'
import { shareApi } from '@/api/blog'

const userStore = useUserStore()
const activeTab = ref<string>('profile')

const profile = ref<UserInfo | null>(null)
const posts = ref<Post[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(8)

const passwordForm = ref({ old_password: '', new_password: '', confirm: '' })
const profileForm = ref({ nickname: '', email: '', bio: '', avatar: '', site_url: '', github: '' })
const shareLink = ref('')

const loadProfile = async () => {
  const res = await authApi.currentUser()
  profile.value = res.data
  profileForm.value = {
    nickname: (res.data as any).nickname || '',
    email: (res.data as any).email || '',
    bio: (res.data as any).bio || '',
    avatar: (res.data as any).avatar || '',
    site_url: (res.data as any).site_url || '',
    github: (res.data as any).github || ''
  }
}

const loadMyPosts = async () => {
  const res = await postApi.list({ page: page.value, page_size: pageSize.value, user_id: userStore.user?.id })
  posts.value = res.data.items || []
  total.value = res.data.total || 0
}

const handleTabChange = (name: TabPaneName) => {
  const tabName = String(name)
  activeTab.value = tabName
  if (tabName === 'posts') loadMyPosts()
}

const saveProfile = async () => {
  const res = await authApi.updateProfile(profileForm.value)
  userStore.setProfile(res.data)
  ElMessage.success('已保存个人信息')
}

const changePassword = async () => {
  if (!passwordForm.value.old_password) {
    ElMessage.warning('请输入原密码')
    return
  }
  if (!passwordForm.value.new_password || passwordForm.value.new_password.length < 6) {
    ElMessage.warning('新密码至少 6 位')
    return
  }
  if (passwordForm.value.old_password === passwordForm.value.new_password) {
    ElMessage.warning('新密码不能与原密码相同')
    return
  }
  if (passwordForm.value.new_password !== passwordForm.value.confirm) {
    ElMessage.warning('两次输入的新密码不一致')
    return
  }
  await authApi.changePassword(passwordForm.value.old_password, passwordForm.value.new_password)
  ElMessage.success('密码修改成功，请重新登录')
  userStore.logout()
  window.location.href = '/#/login'
}

const generateShare = async (type: string) => {
  const res = await shareApi.generate({ type, id: userStore.user?.id })
  shareLink.value = (res.data as any).url || ''
  try {
    await navigator.clipboard.writeText(shareLink.value)
    ElMessage.success('分享链接已复制到剪贴板')
  } catch {
    ElMessage.info(`分享链接: ${shareLink.value}`)
  }
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', { type: 'warning' })
    await authApi.logout()
    userStore.logout()
    window.location.href = '/#/login'
  } catch {}
}

onMounted(() => {
  loadProfile()
  loadMyPosts()
})
</script>

<template>
  <div class="profile-page">
    <div class="profile-header card">
      <div class="avatar-wrap">
        <el-avatar :size="72" :src="profile?.avatar">
          <el-icon :size="36"><User /></el-icon>
        </el-avatar>
      </div>
      <div class="info">
        <h2 class="name">{{ profile?.nickname || profile?.username }}</h2>
        <p class="bio soft" v-if="profile?.bio">{{ profile?.bio }}</p>
        <div class="meta">
          <span v-if="profile?.email" class="meta-item muted">{{ profile.email }}</span>
          <a v-if="profile?.site_url" :href="profile.site_url" target="_blank" class="meta-item">{{ profile.site_url }}</a>
        </div>
      </div>
      <div class="actions">
        <el-button type="primary" :icon="EditPen" @click="activeTab = 'settings'">编辑资料</el-button>
        <el-dropdown trigger="click" @command="generateShare">
          <el-button :icon="Share">分享主页</el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">复制个人主页链接</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button text type="danger" @click="handleLogout">退出登录</el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" @tab-change="handleTabChange" class="main-tabs">
      <el-tab-pane label="个人信息" name="profile">
        <div class="card settings-card">
          <h3 class="section-title"><el-icon><User /></el-icon>基本信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label muted">用户名</span>
              <span class="value">{{ profile?.username }}</span>
            </div>
            <div class="info-item">
              <span class="label muted">昵称</span>
              <span class="value">{{ profile?.nickname || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label muted">邮箱</span>
              <span class="value">{{ profile?.email || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label muted">个人简介</span>
              <span class="value">{{ profile?.bio || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label muted">个人站点</span>
              <a v-if="profile?.site_url" :href="profile.site_url" target="_blank" class="value">{{ profile.site_url }}</a>
              <span v-else class="value">-</span>
            </div>
            <div class="info-item">
              <span class="label muted">GitHub</span>
              <a v-if="profile?.github" :href="`https://github.com/${profile.github}`" target="_blank" class="value">@{{ profile.github }}</a>
              <span v-else class="value">-</span>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="我的文章" name="posts">
        <PostCard v-for="post in posts" :key="post.id" :post="post" />
        <el-empty v-if="posts.length === 0" description="还没有发布文章" />
      </el-tab-pane>

      <el-tab-pane label="账号设置" name="settings">
        <div class="card settings-card">
          <h3 class="section-title"><el-icon><Setting /></el-icon>修改个人信息</h3>
          <el-form :model="profileForm" label-position="top" class="form-grid">
            <el-form-item label="昵称">
              <el-input v-model="profileForm.nickname" placeholder="请输入昵称" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="profileForm.email" placeholder="请输入邮箱" />
            </el-form-item>
            <el-form-item label="头像 URL">
              <el-input v-model="profileForm.avatar" placeholder="请输入头像图片链接" />
            </el-form-item>
            <el-form-item label="个人站点">
              <el-input v-model="profileForm.site_url" placeholder="https://..." />
            </el-form-item>
            <el-form-item label="GitHub 用户名">
              <el-input v-model="profileForm.github" placeholder="username" />
            </el-form-item>
            <el-form-item label="个人简介">
              <el-input v-model="profileForm.bio" type="textarea" :rows="3" placeholder="简单介绍一下自己" />
            </el-form-item>
          </el-form>
          <div class="form-actions">
            <el-button type="primary" @click="saveProfile">保存修改</el-button>
          </div>
        </div>

        <div class="card settings-card" style="margin-top: 20px">
          <h3 class="section-title"><el-icon><Lock /></el-icon>修改密码</h3>
          <el-form :model="passwordForm" label-position="top" class="form-grid">
            <el-form-item label="原密码">
              <el-input v-model="passwordForm.old_password" type="password" show-password placeholder="请输入原密码" />
            </el-form-item>
            <el-form-item label="新密码">
              <el-input v-model="passwordForm.new_password" type="password" show-password placeholder="至少 6 位" />
            </el-form-item>
            <el-form-item label="确认新密码">
              <el-input v-model="passwordForm.confirm" type="password" show-password placeholder="请再次输入新密码" />
            </el-form-item>
          </el-form>
          <div class="form-actions">
            <el-button type="primary" @click="changePassword">修改密码</el-button>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style lang="scss" scoped>
.profile-page {
  max-width: 920px;
  margin: 0 auto;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 28px 32px;
  margin-bottom: 24px;

  @media (max-width: 700px) {
    flex-direction: column;
    text-align: center;
  }

  .info {
    flex: 1;

    .name {
      margin: 0 0 6px;
      font-family: var(--font-serif);
      font-size: 24px;
      font-weight: 600;
    }

    .bio {
      margin: 0 0 10px;
      font-size: 14px;
    }

    .meta {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      font-size: 13px;
    }
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

.section-title {
  margin: 0 0 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border-soft);
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.settings-card {
  padding: 28px 32px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 32px;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .label {
    font-size: 12px;
  }

  .value {
    font-size: 14px;
    color: var(--color-text);
  }
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
