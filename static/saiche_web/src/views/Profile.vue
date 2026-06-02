<template>
  <div class="min-h-screen p-8">
    <nav class="flex justify-between items-center mb-8">
      <div class="flex items-center gap-4">
        <router-link to="/lobby" class="text-white/60 hover:text-white">← 返回大厅</router-link>
        <h1 class="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
          👤 个人中心
        </h1>
      </div>
    </nav>

    <div class="max-w-2xl mx-auto space-y-6">
      <div class="card p-6">
        <div class="flex items-center gap-6 mb-6">
          <div class="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-4xl">
            🏎️
          </div>
          <div>
            <h2 class="text-2xl font-bold">{{ userStore.user?.nickname || '玩家' }}</h2>
            <p class="text-white/60 mt-1">{{ userStore.user?.phone }}</p>
            <div class="flex items-center gap-4 mt-2">
              <span class="text-blue-400">⭐ Lv.{{ userStore.user?.level || 1 }}</span>
              <span class="text-yellow-400">💰 {{ userStore.user?.coins || 0 }}</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="bg-white/5 p-4 rounded-xl text-center">
            <div class="text-2xl font-bold text-orange-400">{{ stats?.total_races || 0 }}</div>
            <div class="text-sm text-white/60">总场次</div>
          </div>
          <div class="bg-white/5 p-4 rounded-xl text-center">
            <div class="text-2xl font-bold text-green-400">{{ stats?.win_count || 0 }}</div>
            <div class="text-sm text-white/60">胜利场次</div>
          </div>
          <div class="bg-white/5 p-4 rounded-xl text-center">
            <div class="text-2xl font-bold text-blue-400">{{ stats?.win_rate || 0 }}%</div>
            <div class="text-sm text-white/60">胜率</div>
          </div>
          <div class="bg-white/5 p-4 rounded-xl text-center">
            <div class="text-2xl font-bold text-yellow-400">{{ stats?.total_coins_earned || 0 }}</div>
            <div class="text-sm text-white/60">累计金币</div>
          </div>
        </div>
      </div>

      <div class="card p-6">
        <h3 class="text-xl font-bold mb-4">修改资料</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm mb-2 text-white/70">昵称</label>
            <input
              v-model="profileForm.nickname"
              type="text"
              class="input-field"
              placeholder="请输入新昵称"
            />
          </div>
          <button @click="updateProfile" :disabled="updating" class="btn-secondary w-full">
            {{ updating ? '更新中...' : '保存修改' }}
          </button>
        </div>
      </div>

      <div class="card p-6">
        <h3 class="text-xl font-bold mb-4">修改密码</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm mb-2 text-white/70">原密码</label>
            <input
              v-model="passwordForm.old_password"
              type="password"
              class="input-field"
              placeholder="请输入原密码"
            />
          </div>
          <div>
            <label class="block text-sm mb-2 text-white/70">新密码</label>
            <input
              v-model="passwordForm.new_password"
              type="password"
              class="input-field"
              placeholder="请输入新密码（至少6位）"
            />
          </div>
          <div>
            <label class="block text-sm mb-2 text-white/70">确认新密码</label>
            <input
              v-model="passwordForm.confirm_password"
              type="password"
              class="input-field"
              placeholder="请再次输入新密码"
            />
          </div>
          <div v-if="errorMessage" class="text-red-400 text-sm">
            {{ errorMessage }}
          </div>
          <button @click="changePassword" :disabled="changingPassword" class="btn-primary w-full">
            {{ changingPassword ? '修改中...' : '修改密码' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import api from '@/utils/api'

const router = useRouter()
const userStore = useUserStore()
const stats = ref(null)
const updating = ref(false)
const changingPassword = ref(false)
const errorMessage = ref('')

const profileForm = reactive({
  nickname: ''
})

const passwordForm = reactive({
  old_password: '',
  new_password: '',
  confirm_password: ''
})

onMounted(async () => {
  profileForm.nickname = userStore.user?.nickname || ''
  await loadStats()
})

async function loadStats() {
  const response = await api.get('/saiche/race/user/stats/get')
  if (response.code === 0) {
    stats.value = response.data
  }
}

async function updateProfile() {
  updating.value = true
  const response = await api.post('/saiche/user/profile/update', {
    nickname: profileForm.nickname
  })
  if (response.code === 0) {
    await userStore.updateUser()
    alert('修改成功')
  } else {
    alert(response.msg)
  }
  updating.value = false
}

async function changePassword() {
  if (passwordForm.new_password !== passwordForm.confirm_password) {
    errorMessage.value = '两次输入的新密码不一致'
    return
  }

  if (passwordForm.new_password.length < 6) {
    errorMessage.value = '密码长度至少6位'
    return
  }

  changingPassword.value = true
  errorMessage.value = ''

  const response = await api.post('/saiche/user/password/change', {
    old_password: passwordForm.old_password,
    new_password: passwordForm.new_password
  })

  if (response.code === 0) {
    alert('密码修改成功，请重新登录')
    userStore.logout()
    router.push('/login')
  } else {
    errorMessage.value = response.msg
  }

  changingPassword.value = false
}
</script>
