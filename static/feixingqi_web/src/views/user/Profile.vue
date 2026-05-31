<template>
  <div class="page-container">
    <div class="header game-card">
      <div class="header-left">
        <el-button @click="goBack"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
        <h1 class="title">个人中心</h1>
      </div>
    </div>

    <div class="main-content">
      <div class="profile-card game-card">
        <div class="avatar-section">
          <div class="avatar">{{ user?.nickname?.charAt(0) }}</div>
          <div class="user-info">
            <h2>{{ user?.nickname }}</h2>
            <p>@{{ user?.username }}</p>
            <div class="stats">
              <div class="stat-item">
                <span class="stat-value">{{ user?.level }}</span>
                <span class="stat-label">等级</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ user?.score }}</span>
                <span class="stat-label">积分</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ user?.wins }}</span>
                <span class="stat-label">胜利</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ user?.losses }}</span>
                <span class="stat-label">失败</span>
              </div>
            </div>
            <el-progress :percentage="expPercent" class="exp-bar" />
          </div>
        </div>
      </div>

      <div class="content-grid">
        <div class="items-section game-card">
          <h3>道具背包</h3>
          <div class="items-grid">
            <div v-for="item in items" :key="item.id" class="item-card" :class="'rarity-' + item.rarity">
              <span class="item-icon">{{ item.item_icon }}</span>
              <div class="item-details">
                <div class="item-name">{{ item.item_name }}</div>
                <div class="item-desc">{{ item.description }}</div>
                <div class="item-rarity">{{ rarityNames[item.rarity] || item.rarity }}</div>
              </div>
              <span class="item-count">x{{ item.quantity }}</span>
            </div>
            <div v-if="!items?.length" class="empty">
              暂无道具
            </div>
          </div>
        </div>

        <div class="settings-section game-card">
          <h3>账号设置</h3>
          <el-form :model="profileForm" label-width="100px">
            <el-form-item label="昵称">
              <el-input v-model="profileForm.nickname" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="updateProfile" :loading="updating">保存修改</el-button>
            </el-form-item>
          </el-form>

          <el-divider />

          <h3>修改密码</h3>
          <el-form :model="passwordForm" label-width="100px">
            <el-form-item label="原密码">
              <el-input v-model="passwordForm.old_password" type="password" show-password />
            </el-form-item>
            <el-form-item label="新密码">
              <el-input v-model="passwordForm.new_password" type="password" show-password />
            </el-form-item>
            <el-form-item label="确认密码">
              <el-input v-model="passwordForm.confirm_password" type="password" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleUpdatePassword" :loading="changingPwd">修改密码</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getUser, updateUser, updatePassword as updatePasswordApi, getUserItems } from '@/api'
import { getUser as getStoredUser, setUser } from '@/utils/storage'

const router = useRouter()
const storedUser = getStoredUser()
const user = ref(null)
const items = ref([])
const updating = ref(false)
const changingPwd = ref(false)

const profileForm = reactive({
  user_id: storedUser?.id,
  nickname: ''
})

const passwordForm = reactive({
  user_id: storedUser?.id,
  old_password: '',
  new_password: '',
  confirm_password: ''
})

const rarityNames = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说'
}

const expPercent = computed(() => {
  if (!user.value) return 0
  return Math.min(100, Math.floor((user.value.exp / (user.value.level * 100)) * 100))
})

const loadProfile = async () => {
  try {
    user.value = await getUser(storedUser.id)
    profileForm.nickname = user.value.nickname
  } catch (e) {}
}

const loadItems = async () => {
  try {
    items.value = await getUserItems(storedUser.id)
  } catch (e) {}
}

const updateProfile = async () => {
  if (!profileForm.nickname) {
    ElMessage.warning('请输入昵称')
    return
  }
  updating.value = true
  try {
    const updated = await updateUser(profileForm)
    const merged = { ...storedUser, ...updated }
    setUser(merged)
    user.value = merged
    ElMessage.success('修改成功')
  } finally {
    updating.value = false
  }
}

const handleUpdatePassword = async () => {
  if (!passwordForm.old_password || !passwordForm.new_password || !passwordForm.confirm_password) {
    ElMessage.warning('请填写完整')
    return
  }
  if (passwordForm.new_password === passwordForm.old_password) {
    ElMessage.warning('新密码不能与原密码相同')
    return
  }
  if (passwordForm.new_password !== passwordForm.confirm_password) {
    ElMessage.warning('两次密码不一致')
    return
  }
  if (passwordForm.new_password.length < 6) {
    ElMessage.warning('新密码至少6位')
    return
  }
  changingPwd.value = true
  try {
    await updatePasswordApi({
      user_id: storedUser.id,
      old_password: passwordForm.old_password,
      new_password: passwordForm.new_password
    })
    ElMessage.success('密码修改成功')
    passwordForm.old_password = ''
    passwordForm.new_password = ''
    passwordForm.confirm_password = ''
  } finally {
    changingPwd.value = false
  }
}

const goBack = () => router.push('/')

onMounted(() => {
  loadProfile()
  loadItems()
})
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  margin-bottom: 20px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.title {
  margin: 0;
  font-size: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.main-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.profile-card {
  padding: 30px;
}
.avatar-section {
  display: flex;
  gap: 30px;
  align-items: center;
}
.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: bold;
}
.user-info {
  flex: 1;
}
.user-info h2 {
  margin: 0 0 8px 0;
  font-size: 28px;
  color: #333;
}
.user-info p {
  color: #999;
  margin-bottom: 16px;
}
.stats {
  display: flex;
  gap: 30px;
  margin-bottom: 20px;
}
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #667eea;
}
.stat-label {
  font-size: 12px;
  color: #999;
}
.exp-bar {
  max-width: 300px;
}
.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}
.items-section, .settings-section {
  padding: 24px;
}
.items-section h3, .settings-section h3 {
  margin-bottom: 20px;
  color: #333;
}
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
}
.item-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 12px;
  border: 2px solid transparent;
  transition: all 0.3s;
}
.item-card:hover {
  transform: translateY(-2px);
  border-color: #667eea;
}
.item-icon {
  font-size: 32px;
}
.item-details {
  flex: 1;
  min-width: 0;
}
.item-name {
  font-weight: bold;
  margin-bottom: 4px;
}
.item-desc {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}
.item-rarity {
  font-size: 11px;
  color: #667eea;
}
.item-count {
  font-weight: bold;
  color: #667eea;
  font-size: 18px;
}
.empty {
  grid-column: 1 / -1;
  text-align: center;
  color: #999;
  padding: 40px;
}
.rarity-common { border-left: 4px solid #909399; }
.rarity-rare { border-left: 4px solid #409eff; }
.rarity-epic { border-left: 4px solid #9c27b0; }
.rarity-legendary { border-left: 4px solid #ff9800; }
</style>
