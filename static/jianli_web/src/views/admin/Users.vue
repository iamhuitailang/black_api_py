<template>
  <div class="users-page">
    <div class="page-header">
      <h2>用户管理</h2>
      <div class="search-bar">
        <el-input
          v-model="keyword"
          placeholder="搜索用户名/昵称"
          style="width: 240px"
          clearable
          @keyup.enter="loadUsers"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="statusFilter" placeholder="状态" style="width: 120px" clearable>
          <el-option :value="0" label="正常" />
          <el-option :value="1" label="禁用" />
        </el-select>
        <el-button type="primary" @click="loadUsers">搜索</el-button>
      </div>
    </div>

    <div class="table-card">
      <el-table :data="userList" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="140" />
        <el-table-column prop="nickname" label="昵称" width="140" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 0 ? 'success' : 'danger'">
              {{ scope.row.status_text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="180">
          <template #default="scope">
            {{ scope.row.created_at?.split('T')[0] }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button
              v-if="scope.row.status === 0"
              size="small"
              type="warning"
              @click="toggleStatus(scope.row.id, 1)"
            >
              禁用
            </el-button>
            <el-button
              v-else
              size="small"
              type="success"
              @click="toggleStatus(scope.row.id, 0)"
            >
              启用
            </el-button>
            <el-button size="small" type="danger" @click="deleteUser(scope.row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next, jumper"
          @current-change="loadUsers"
          @size-change="handleSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { userApi } from '@/api'
import type { User } from '@/types'

const userList = ref<User[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)
const keyword = ref('')
const statusFilter = ref<number | undefined>()

const loadUsers = async () => {
  loading.value = true
  try {
    const params: any = {
      page: page.value,
      page_size: pageSize.value
    }
    if (keyword.value) {
      params.keyword = keyword.value
    }
    if (statusFilter.value !== undefined) {
      params.status = statusFilter.value
    }
    const res = await userApi.getUserList(params)
    userList.value = res.items
    total.value = res.total
  } catch (error) {
    console.error('Load users error:', error)
  } finally {
    loading.value = false
  }
}

const handleSizeChange = () => {
  page.value = 1
  loadUsers()
}

const toggleStatus = async (userId: number, status: number) => {
  const action = status === 0 ? '启用' : '禁用'
  ElMessageBox.confirm(`确定要${action}该用户吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await userApi.updateUserStatus({ user_id: userId, status })
      ElMessage.success(`${action}成功`)
      loadUsers()
    } catch (error) {
      console.error('Toggle status error:', error)
    }
  }).catch(() => {})
}

const deleteUser = async (userId: number) => {
  ElMessageBox.confirm('确定要删除该用户吗？删除后无法恢复。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await userApi.deleteUser({ user_id: userId })
      ElMessage.success('删除成功')
      loadUsers()
    } catch (error) {
      console.error('Delete user error:', error)
    }
  }).catch(() => {})
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.users-page {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 20px;
  color: #333;
  margin: 0;
}

.search-bar {
  display: flex;
  gap: 12px;
}

.table-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
