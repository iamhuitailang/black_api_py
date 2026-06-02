import { ref, onMounted } from 'vue'
import Api from '../../api.js'

export default {
  setup() {
    const users = ref([])
    const search = ref('')
    const loading = ref(false)
    const error = ref('')

    async function loadUsers() {
      loading.value = true
      try {
        const res = await Api.getAdminUserList(search.value ? 'keyword=' + search.value : '')
        users.value = res.data || []
      } catch (e) {
        error.value = e.message
      } finally {
        loading.value = false
      }
    }

    async function toggleStatus(user) {
      try {
        await Api.updateUserStatus({ userId: user.id, status: user.status === 'active' ? 'disabled' : 'active' })
        await loadUsers()
      } catch (e) {
        error.value = e.message
      }
    }

    function statusText(status) {
      return status === 'active' ? '正常' : status === 'disabled' ? '禁用' : status
    }

    onMounted(loadUsers)

    return { users, search, loading, error, loadUsers, toggleStatus, statusText }
  },
  template: `
    <div class="admin-page">
      <h2 class="page-title">👥 用户管理</h2>
      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div class="search-bar">
        <input v-model="search" type="text" placeholder="搜索用户..." @keyup.enter="loadUsers" />
        <button class="btn btn-primary" @click="loadUsers">搜索</button>
      </div>
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>用户名</th>
              <th>昵称</th>
              <th>金币</th>
              <th>状态</th>
              <th>注册时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.id }}</td>
              <td>{{ user.username }}</td>
              <td>{{ user.nickname }}</td>
              <td>{{ user.coins }}</td>
              <td><span :class="['status-badge', user.status === 'active' ? 'status-active' : 'status-disabled']">{{ statusText(user.status) }}</span></td>
              <td>{{ user.createdAt }}</td>
              <td>
                <button class="btn btn-sm" :class="user.status === 'active' ? 'btn-danger' : 'btn-primary'" @click="toggleStatus(user)">
                  {{ user.status === 'active' ? '禁用' : '启用' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="users.length === 0" class="empty">暂无用户数据</div>
      </div>
    </div>
  `
}
