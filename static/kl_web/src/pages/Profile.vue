<template>
  <div class="profile-page">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="profile-card">
          <div class="profile-header">
            <el-avatar :size="80" class="profile-avatar">
              {{ userStore.userInfo?.username?.charAt(0)?.toUpperCase() }}
            </el-avatar>
            <h2>{{ userStore.userInfo?.username }}</h2>
            <el-tag type="primary" size="large">Lv.{{ userStore.userInfo?.level || 1 }}</el-tag>
          </div>
          <div class="profile-stats">
            <div class="stat-item">
              <div class="stat-value">{{ userStore.userInfo?.coins?.toLocaleString() || 0 }}</div>
              <div class="stat-label">💰 金币</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ userStore.userInfo?.diamonds?.toLocaleString() || 0 }}</div>
              <div class="stat-label">💎 钻石</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ userStore.userInfo?.experience || 0 }}</div>
              <div class="stat-label">⭐ 经验</div>
            </div>
          </div>
          <div class="level-progress">
            <div class="progress-label">
              <span>升级进度</span>
              <span>{{ userStore.userInfo?.experience || 0 }} / {{ nextLevelExp }}</span>
            </div>
            <el-progress :percentage="levelPercentage" :stroke-width="12" />
          </div>
        </el-card>
        
        <el-card style="margin-top: 20px">
          <template #header>
            <span>账户设置</span>
          </template>
          <el-menu class="setting-menu" :default-active="activeMenu" @select="handleMenuSelect">
            <el-menu-item index="profile">
              <el-icon><User /></el-icon>
              <span>基本信息</span>
            </el-menu-item>
            <el-menu-item index="password">
              <el-icon><Lock /></el-icon>
              <span>修改密码</span>
            </el-menu-item>
            <el-menu-item index="notify">
              <el-icon><Bell /></el-icon>
              <span>通知设置</span>
            </el-menu-item>
            <el-menu-item index="privacy">
              <el-icon><Warning /></el-icon>
              <span>隐私设置</span>
            </el-menu-item>
          </el-menu>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card v-if="activeMenu === 'profile'">
          <template #header>
            <span>编辑资料</span>
          </template>
          <el-form :model="profileForm" :rules="rules" ref="formRef" label-width="100px">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="profileForm.username" placeholder="请输入用户名" />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="profileForm.email" placeholder="请输入邮箱" />
            </el-form-item>
            <el-form-item label="个人简介">
              <el-input 
                v-model="profileForm.bio" 
                type="textarea" 
                :rows="4"
                placeholder="介绍一下自己..."
              />
            </el-form-item>
            <el-form-item label="所在地区">
              <el-cascader 
                v-model="profileForm.region" 
                :options="regionOptions" 
                placeholder="选择地区"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveProfile" :loading="saving">
                保存修改
              </el-button>
              <el-button @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card v-if="activeMenu === 'password'">
          <template #header>
            <span>修改密码</span>
          </template>
          <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px">
            <el-form-item label="旧密码" prop="old_password">
              <el-input v-model="passwordForm.old_password" type="password" placeholder="请输入旧密码" />
            </el-form-item>
            <el-form-item label="新密码" prop="new_password">
              <el-input v-model="passwordForm.new_password" type="password" placeholder="请输入新密码" />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirm_password">
              <el-input v-model="passwordForm.confirm_password" type="password" placeholder="请再次输入新密码" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="savePassword" :loading="passwordSaving">
                修改密码
              </el-button>
              <el-button @click="resetPasswordForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
        
        <el-row :gutter="20" style="margin-top: 20px">
          <el-col :span="12">
            <el-card>
              <template #header>
                <span>游戏成就</span>
              </template>
              <div class="achievement-list">
                <div v-for="achievement in achievements" :key="achievement.id" class="achievement-item">
                  <span class="achievement-icon">{{ achievement.icon }}</span>
                  <div class="achievement-info">
                    <div class="achievement-name">{{ achievement.name }}</div>
                    <div class="achievement-desc">{{ achievement.desc }}</div>
                  </div>
                  <el-tag v-if="achievement.unlocked" type="success">已解锁</el-tag>
                  <el-tag v-else type="info">未解锁</el-tag>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header>
                <span>游戏统计</span>
              </template>
              <el-descriptions :column="1" border>
                <el-descriptions-item label="公园数量">
                  {{ stats.parkCount || 0 }}
                </el-descriptions-item>
                <el-descriptions-item label="恐龙总数">
                  {{ stats.dinosaurCount || 0 }}
                </el-descriptions-item>
                <el-descriptions-item label="栖息地数量">
                  {{ stats.habitatCount || 0 }}
                </el-descriptions-item>
                <el-descriptions-item label="设施数量">
                  {{ stats.facilityCount || 0 }}
                </el-descriptions-item>
                <el-descriptions-item label="好友数量">
                  {{ stats.friendCount || 0 }}
                </el-descriptions-item>
                <el-descriptions-item label="游戏天数">
                  {{ stats.playDays || 1 }} 天
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>
        </el-row>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { updateUserInfo, changePassword } from '@/services/api'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const formRef = ref(null)
const passwordFormRef = ref(null)
const saving = ref(false)
const passwordSaving = ref(false)
const activeMenu = ref('profile')

const profileForm = reactive({
  username: '',
  email: '',
  bio: '',
  region: []
})

const passwordForm = reactive({
  old_password: '',
  new_password: '',
  confirm_password: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== passwordForm.new_password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

const passwordRules = {
  old_password: [
    { required: true, message: '请输入旧密码', trigger: 'blur' }
  ],
  new_password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  confirm_password: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const stats = ref({
  parkCount: 1,
  dinosaurCount: 0,
  habitatCount: 0,
  facilityCount: 0,
  friendCount: 0,
  playDays: 1
})

const achievements = ref([
  { id: 1, name: '初来乍到', icon: '🎉', desc: '完成注册', unlocked: true },
  { id: 2, name: '公园创始人', icon: '🏗️', desc: '创建第一个公园', unlocked: true },
  { id: 3, name: '化石猎人', icon: '🦴', desc: '发掘第一块化石', unlocked: false },
  { id: 4, name: '克隆专家', icon: '🧬', desc: '克隆第一只恐龙', unlocked: false },
  { id: 5, name: '建筑师', icon: '🏠', desc: '建造5个栖息地', unlocked: false },
  { id: 6, name: '商业大亨', icon: '💰', desc: '累计收入100万金币', unlocked: false },
  { id: 7, name: '社交达人', icon: '👥', desc: '添加10位好友', unlocked: false },
  { id: 8, name: '驯龙高手', icon: '🦖', desc: '拥有10只恐龙', unlocked: false },
])

const regionOptions = [
  {
    value: 'beijing',
    label: '北京',
    children: [{ value: 'chaoyang', label: '朝阳区' }]
  },
  {
    value: 'shanghai',
    label: '上海',
    children: [{ value: 'pudong', label: '浦东新区' }]
  },
  {
    value: 'guangzhou',
    label: '广州',
    children: [{ value: 'tianhe', label: '天河区' }]
  }
]

const nextLevelExp = computed(() => {
  return ((userStore.userInfo?.level || 1) + 1) * 1000
})

const levelPercentage = computed(() => {
  const currentExp = userStore.userInfo?.experience || 0
  return Math.min((currentExp / nextLevelExp.value) * 100, 100)
})

const handleMenuSelect = (key) => {
  activeMenu.value = key
}

const saveProfile = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      saving.value = true
      const res = await updateUserInfo(profileForm)
      saving.value = false
      
      if (res.code === 200) {
        ElMessage.success('保存成功！')
        userStore.fetchUserInfo()
      } else {
        ElMessage.error(res.message || '保存失败')
      }
    }
  })
}

const savePassword = async () => {
  if (!passwordFormRef.value) return
  
  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      passwordSaving.value = true
      const res = await changePassword({
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password
      })
      passwordSaving.value = false
      
      if (res.code === 200) {
        ElMessage.success('密码修改成功！')
        resetPasswordForm()
      } else {
        ElMessage.error(res.message || '修改失败')
      }
    }
  })
}

const resetForm = () => {
  profileForm.username = userStore.userInfo?.username || ''
  profileForm.email = userStore.userInfo?.email || ''
  profileForm.bio = ''
  profileForm.region = []
}

const resetPasswordForm = () => {
  passwordForm.old_password = ''
  passwordForm.new_password = ''
  passwordForm.confirm_password = ''
}

onMounted(() => {
  if (userStore.userInfo) {
    profileForm.username = userStore.userInfo.username
    profileForm.email = userStore.userInfo.email || ''
  }
})
</script>

<style scoped>
.profile-page {
  padding: 0;
}

.profile-card {
  text-align: center;
}

.profile-header {
  margin-bottom: 20px;
}

.profile-avatar {
  font-size: 32px;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin-bottom: 15px;
}

.profile-header h2 {
  margin: 0 0 10px 0;
}

.profile-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.level-progress {
  text-align: left;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 14px;
}

.setting-menu {
  border: none;
}

.setting-menu .el-menu-item {
  border-radius: 8px;
  margin: 5px 0;
}

.achievement-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.achievement-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
}

.achievement-icon {
  font-size: 28px;
}

.achievement-info {
  flex: 1;
}

.achievement-name {
  font-weight: 600;
  margin-bottom: 2px;
}

.achievement-desc {
  font-size: 12px;
  color: #666;
}
</style>
