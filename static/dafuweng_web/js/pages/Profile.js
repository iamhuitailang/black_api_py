import { ref, computed, onMounted } from 'vue'
import Api from '../api.js'
import Store from '../store.js'

export default {
  setup() {
    const user = computed(() => Store.state.user)
    const nickname = ref('')
    const oldPassword = ref('')
    const newPassword = ref('')
    const confirmPassword = ref('')
    const message = ref('')
    const error = ref('')
    const loading = ref(false)

    onMounted(async () => {
      if (Store.isLoggedIn && !Store.state.user) {
        try {
          const res = await Api.getCurrentUser()
          Store.setUser(res.data)
        } catch (e) {
          console.error(e)
        }
      }
      if (Store.state.user) {
        nickname.value = Store.state.user.nickname || ''
      }
    })

    async function updateProfile() {
      error.value = ''
      message.value = ''
      loading.value = true
      try {
        await Api.updateProfile({ nickname: nickname.value })
        const res = await Api.getCurrentUser()
        Store.setUser(res.data)
        message.value = '更新成功'
      } catch (e) {
        error.value = e.message
      } finally {
        loading.value = false
      }
    }

    async function changePassword() {
      error.value = ''
      message.value = ''
      if (newPassword.value !== confirmPassword.value) {
        error.value = '两次密码不一致'
        return
      }
      loading.value = true
      try {
        await Api.changePassword({ oldPassword: oldPassword.value, newPassword: newPassword.value })
        message.value = '密码修改成功'
        oldPassword.value = ''
        newPassword.value = ''
        confirmPassword.value = ''
      } catch (e) {
        error.value = e.message
      } finally {
        loading.value = false
      }
    }

    return { user, nickname, oldPassword, newPassword, confirmPassword, message, error, loading, updateProfile, changePassword }
  },
  template: `
    <div class="profile-page">
      <h2 class="page-title">👤 个人中心</h2>
      <div v-if="user" class="profile-content">
        <div class="profile-card">
          <h3>基本信息</h3>
          <div v-if="message" class="alert alert-success">{{ message }}</div>
          <div v-if="error" class="alert alert-error">{{ error }}</div>
          <div class="form-group">
            <label>用户名</label>
            <input :value="user.username" disabled />
          </div>
          <div class="form-group">
            <label>昵称</label>
            <input v-model="nickname" type="text" placeholder="请输入昵称" />
          </div>
          <div class="form-group">
            <label>金币</label>
            <input :value="user.coins || 0" disabled />
          </div>
          <button class="btn btn-primary" @click="updateProfile" :disabled="loading">保存修改</button>
        </div>
        <div class="profile-card">
          <h3>修改密码</h3>
          <div class="form-group">
            <label>旧密码</label>
            <input v-model="oldPassword" type="password" placeholder="请输入旧密码" />
          </div>
          <div class="form-group">
            <label>新密码</label>
            <input v-model="newPassword" type="password" placeholder="请输入新密码" />
          </div>
          <div class="form-group">
            <label>确认新密码</label>
            <input v-model="confirmPassword" type="password" placeholder="请再次输入新密码" />
          </div>
          <button class="btn btn-primary" @click="changePassword" :disabled="loading">修改密码</button>
        </div>
      </div>
    </div>
  `
}
