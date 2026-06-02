<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">👥 用户管理</h2>

    <div class="card p-6 mb-6">
      <div class="flex gap-4 mb-4">
        <input v-model="searchKeyword" type="text" placeholder="搜索用户..."
               class="input-field flex-1" @keyup.enter="loadUsers">
        <select v-model="filterStatus" class="input-field w-40">
          <option :value="null">全部状态</option>
          <option :value="0">正常</option>
          <option :value="1">已封禁</option>
        </select>
        <button @click="loadUsers" class="btn-secondary">🔍 搜索</button>
      </div>
    </div>

    <div class="card p-6">
      <table class="w-full">
        <thead>
          <tr class="text-left text-white/60 border-b border-white/10">
            <th class="pb-4">ID</th>
            <th class="pb-4">昵称</th>
            <th class="pb-4">手机号</th>
            <th class="pb-4">等级</th>
            <th class="pb-4">金币</th>
            <th class="pb-4">比赛场次</th>
            <th class="pb-4">状态</th>
            <th class="pb-4">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id" class="border-b border-white/5">
            <td class="py-4">{{ user.id }}</td>
            <td class="py-4">{{ user.nickname || '未设置' }}</td>
            <td class="py-4">{{ user.phone }}</td>
            <td class="py-4">Lv.{{ user.level }}</td>
            <td class="py-4 text-yellow-400">{{ user.coins }}</td>
            <td class="py-4">{{ user.total_races || 0 }}</td>
            <td class="py-4">
              <span :class="user.status === 0 ? 'text-green-400' : 'text-red-400'">
                {{ user.status === 0 ? '正常' : '已封禁' }}
              </span>
            </td>
            <td class="py-4">
              <button v-if="user.status === 0"
                      @click="banUser(user.id)"
                      class="text-red-400 hover:text-red-300 mr-3">
                封禁
              </button>
              <button v-else
                      @click="unbanUser(user.id)"
                      class="text-green-400 hover:text-green-300">
                解封
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="mt-6 flex justify-center gap-2">
        <button @click="loadUsers(currentPage - 1)"
                :disabled="currentPage <= 1"
                class="px-4 py-2 bg-white/10 rounded-lg disabled:opacity-50 hover:bg-white/20">
          上一页
        </button>
        <span class="px-4 py-2">第 {{ currentPage }} 页</span>
        <button @click="loadUsers(currentPage + 1)"
                class="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20">
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/utils/api'

const users = ref([])
const searchKeyword = ref('')
const filterStatus = ref(null)
const currentPage = ref(1)

onMounted(async () => {
  await loadUsers(1)
})

async function loadUsers(page) {
  if (page && page < 1) return
  const p = page || currentPage.value
  
  let url = `/saiche/admin/user/list/get?page=${p}&page_size=10`
  if (searchKeyword.value) {
    url += `&keyword=${encodeURIComponent(searchKeyword.value)}`
  }
  if (filterStatus.value !== null) {
    url += `&status=${filterStatus.value}`
  }

  const response = await api.get(url)
  if (response.code === 0) {
    users.value = response.data.items
    currentPage.value = p
  }
}

async function banUser(userId) {
  if (!confirm('确定要封禁该用户吗？')) return
  
  const response = await api.post(`/saiche/admin/user/ban?user_id=${userId}`)
  if (response.code === 0) {
    await loadUsers(currentPage.value)
  } else {
    alert(response.msg)
  }
}

async function unbanUser(userId) {
  const response = await api.post(`/saiche/admin/user/unban?user_id=${userId}`)
  if (response.code === 0) {
    await loadUsers(currentPage.value)
  } else {
    alert(response.msg)
  }
}
</script>
