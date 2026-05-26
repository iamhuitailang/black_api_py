<template>
  <div class="users-admin">
    <div class="toolbar">
      <el-input 
        v-model="searchKeyword" 
        placeholder="搜索用户" 
        style="width: 200px;"
        clearable
        @clear="loadUsers"
        @keyup.enter="loadUsers"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <el-table :data="users" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="nickname" label="昵称" width="120" />
      <el-table-column prop="points" label="积分" width="100" />
      <el-table-column prop="total_points" label="累计积分" width="120" />
      <el-table-column label="角色" width="100">
        <template #default="{ row }">
          <el-tag :type="row.role === 'admin' ? 'danger' : 'primary'">
            {{ row.role === 'admin' ? '管理员' : '普通用户' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'">
            {{ row.status === 'active' ? '正常' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="注册时间" width="160" />
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button 
            size="small" 
            @click="toggleRole(row)"
            :type="row.role === 'admin' ? 'info' : 'warning'"
          >
            {{ row.role === 'admin' ? '设为普通' : '设为管理员' }}
          </el-button>
          <el-button 
            size="small" 
            @click="toggleStatus(row)"
            :type="row.status === 'active' ? 'danger' : 'success'"
          >
            {{ row.status === 'active' ? '禁用' : '启用' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="loadUsers"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { userApi } from '@/api/user'

const users = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchKeyword = ref('')

onMounted(() => {
  loadUsers()
})

async function loadUsers() {
  loading.value = true
  try {
    const res: any = await userApi.getUserList({
      page: page.value,
      page_size: pageSize.value,
      keyword: searchKeyword.value
    })
    users.value = res.data
    total.value = res.total
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

async function toggleRole(user: any) {
  try {
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    await ElMessageBox.confirm(
      `确定要将用户"${user.username}"设为${newRole === 'admin' ? '管理员' : '普通用户'}吗？`,
      '提示',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    await userApi.updateUserRole(user.id, newRole)
    ElMessage.success('操作成功')
    await loadUsers()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

async function toggleStatus(user: any) {
  try {
    const newStatus = user.status === 'active' ? 'disabled' : 'active'
    await ElMessageBox.confirm(
      `确定要${newStatus === 'active' ? '启用' : '禁用'}用户"${user.username}"吗？`,
      '提示',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    await userApi.updateUserStatus(user.id, newStatus)
    ElMessage.success('操作成功')
    await loadUsers()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}
</script>

<style scoped>
.users-admin {
  background: white;
  padding: 20px;
  border-radius: 12px;
}

.toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
