<template>
  <div class="admin-page">
    <div class="page-header">
      <h2 class="page-title">👥 用户管理</h2>
      <div class="header-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索用户名/昵称"
          style="width: 200px"
          clearable
          @keyup.enter="loadUsers"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="loadUsers">
          <el-icon><Refresh /></el-icon> 刷新
        </el-button>
      </div>
    </div>

    <div class="content-card game-card">
      <el-table :data="users" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column label="头像" width="80" align="center">
          <template #default="{ row }">
            <el-avatar :size="36" :style="{ background: getAvatarBg(row.nickname) }">
              {{ row.nickname?.charAt(0) }}
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户名" width="140" />
        <el-table-column prop="nickname" label="昵称" width="140" />
        <el-table-column label="角色" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : 'info'" size="small">
              {{ row.role === 'admin' ? '管理员' : '用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="积分" width="100" align="center" sortable />
        <el-table-column label="胜率" width="120" align="center">
          <template #default="{ row }">
            <span>{{ getWinRate(row) }}%</span>
          </template>
        </el-table-column>
        <el-table-column label="游戏场次" width="100" align="center">
          <template #default="{ row }">{{ (row.wins || 0) + (row.losses || 0) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="180">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="editUser(row)">
              <el-icon><Edit /></el-icon> 编辑
            </el-button>
            <el-button
              :type="row.status === 'active' ? 'warning' : 'success'"
              size="small"
              @click="toggleStatus(row)"
            >
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
            <el-button type="danger" size="small" @click="deleteUser(row)">
              <el-icon><Delete /></el-icon> 删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next, jumper"
        @current-change="loadUsers"
        @size-change="handleSizeChange"
        class="pagination"
      />
    </div>

    <el-dialog v-model="editDialogVisible" title="编辑用户" width="500px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="用户名">
          <el-input v-model="editForm.username" disabled />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="editForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="editForm.role" style="width: 100%">
            <el-option label="普通用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="积分">
          <el-input-number v-model="editForm.score" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUserList, updateUser, deleteUser as deleteUserApi, updateUserStatus } from '@/api'

const users = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const searchKeyword = ref('')
const editDialogVisible = ref(false)
const saving = ref(false)
const editForm = reactive({
  id: null,
  username: '',
  nickname: '',
  role: 'user',
  score: 0
})

const loadUsers = async () => {
  loading.value = true
  try {
    const data = await getUserList({
      page: page.value,
      page_size: pageSize.value,
      keyword: searchKeyword.value
    })
    users.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

const handleSizeChange = () => {
  page.value = 1
  loadUsers()
}

const getWinRate = (row) => {
  if (!row.total_games) return 0
  return Math.round((row.wins || 0) / row.total_games * 100)
}

const getAvatarBg = (name) => {
  const colors = [
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #f093fb, #f5576c)',
    'linear-gradient(135deg, #4facfe, #00f2fe)',
    'linear-gradient(135deg, #fa709a, #fee140)',
    'linear-gradient(135deg, #43e97b, #38f9d7)',
    'linear-gradient(135deg, #fa709a, #fee140)'
  ]
  const index = (name || '').charCodeAt(0) % colors.length
  return colors[index]
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

const editUser = (row) => {
  editForm.id = row.id
  editForm.username = row.username
  editForm.nickname = row.nickname
  editForm.role = row.role
  editForm.score = row.score || 0
  editDialogVisible.value = true
}

const saveEdit = async () => {
  if (!editForm.nickname) {
    ElMessage.warning('请输入昵称')
    return
  }
  saving.value = true
  try {
    await updateUser(editForm)
    ElMessage.success('更新成功')
    editDialogVisible.value = false
    loadUsers()
  } finally {
    saving.value = false
  }
}

const toggleStatus = async (row) => {
  const newStatus = row.status === 1 ? 0 : 1
  const action = newStatus === 1 ? '启用' : '禁用'
  try {
    await ElMessageBox.confirm(`确定要${action}该用户吗？`, '提示', {
      type: 'warning'
    })
    await updateUserStatus(row.id, newStatus === 1 ? 'active' : 'disabled')
    ElMessage.success(`${action}成功`)
    loadUsers()
  } catch (e) {}
}

const deleteUser = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该用户吗？此操作不可恢复！', '删除确认', {
      type: 'error',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消'
    })
    await deleteUserApi(row.id)
    ElMessage.success('删除成功')
    loadUsers()
  } catch (e) {}
}

onMounted(loadUsers)
</script>

<style scoped>
.admin-page {
  padding: 20px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-title {
  margin: 0;
  font-size: 24px;
  color: #333;
}
.header-actions {
  display: flex;
  gap: 12px;
}
.content-card {
  padding: 24px;
}
.pagination {
  margin-top: 20px;
  justify-content: flex-end;
}
</style>
