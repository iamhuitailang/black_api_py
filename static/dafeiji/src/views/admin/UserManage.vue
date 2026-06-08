<template>
  <div class="user-manage">
    <div class="toolbar">
      <div class="search-box">
        <input v-model="searchKeyword" type="text" class="input" placeholder="搜索用户..." />
      </div>
    </div>

    <div class="panel">
      <div class="panel-body">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>用户名</th>
              <th>角色</th>
              <th>状态</th>
              <th>总分数</th>
              <th>最高波次</th>
              <th>注册时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.id }}</td>
              <td>{{ user.username }}</td>
              <td>
                <span class="badge" :class="user.role === 'admin' ? 'badge-admin' : 'badge-user'">
                  {{ user.role === 'admin' ? '管理员' : '用户' }}
                </span>
              </td>
              <td>
                <span :class="['status-dot', user.status === 1 ? 'active' : 'disabled']"></span>
                {{ user.status === 1 ? '正常' : '禁用' }}
              </td>
              <td>{{ formatNumber(user.total_score) }}</td>
              <td>{{ user.highest_wave }}</td>
              <td>{{ formatDate(user.created_at) }}</td>
              <td>
                <button class="btn btn-xs" @click="toggleRole(user)">
                  {{ user.role === 'admin' ? '降为用户' : '设为管理员' }}
                </button>
                <button class="btn btn-xs" :class="user.status === 1 ? 'btn-warning' : 'btn-success'" @click="toggleStatus(user)">
                  {{ user.status === 1 ? '禁用' : '启用' }}
                </button>
                <button class="btn btn-xs btn-danger" @click="deleteUser(user)">
                  删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="pagination">
          <button class="btn btn-sm" :disabled="page === 1" @click="prevPage">上一页</button>
          <span class="page-info">第 {{ page }} 页 / 共 {{ totalPages }} 页</span>
          <button class="btn btn-sm" :disabled="page >= totalPages" @click="nextPage">下一页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { adminApi } from '@/api/admin'

const users = ref<any[]>([])
const searchKeyword = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

onMounted(() => {
  loadUsers()
})

const loadUsers = async () => {
  try {
    const res = await adminApi.getUsers(page.value, pageSize.value)
    if (res.code === 0 && res.data) {
      users.value = res.data.items
      total.value = res.data.total
    }
  } catch (e) {
    console.error('加载用户列表失败', e)
  }
}

const toggleRole = async (user: any) => {
  const newRole = user.role === 'admin' ? 'user' : 'admin'
  try {
    const res = await adminApi.updateUserRole(user.id, newRole)
    if (res.code === 0) {
      user.role = newRole
    }
  } catch (e) {
    console.error('修改角色失败', e)
  }
}

const toggleStatus = async (user: any) => {
  const newStatus = user.status === 1 ? 0 : 1
  try {
    const res = await adminApi.updateUserStatus(user.id, newStatus)
    if (res.code === 0) {
      user.status = newStatus
    }
  } catch (e) {
    console.error('修改状态失败', e)
  }
}

const deleteUser = async (user: any) => {
  if (!confirm(`确定要删除用户 ${user.username} 吗？`)) return
  
  try {
    const res = await adminApi.deleteUser(user.id)
    if (res.code === 0) {
      loadUsers()
    }
  } catch (e) {
    console.error('删除用户失败', e)
  }
}

const prevPage = () => {
  if (page.value > 1) {
    page.value--
    loadUsers()
  }
}

const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++
    loadUsers()
  }
}

const formatNumber = (num: number) => {
  if (!num) return '0'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return dateStr.substring(0, 10)
}
</script>

<style scoped>
.user-manage {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-box {
  width: 250px;
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}

.status-dot.active {
  background: var(--color-neon-green);
  box-shadow: 0 0 5px var(--color-neon-green);
}

.status-dot.disabled {
  background: var(--color-text-muted);
}

.btn-xs {
  padding: 4px 10px;
  font-size: 11px;
  margin-right: 5px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid var(--color-border);
}

.page-info {
  font-size: 13px;
  color: var(--color-text-muted);
}
</style>
