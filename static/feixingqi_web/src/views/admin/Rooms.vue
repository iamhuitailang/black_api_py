<template>
  <div class="admin-page">
    <div class="page-header">
      <h2 class="page-title">🏠 房间管理</h2>
      <div class="header-actions">
        <el-select v-model="statusFilter" placeholder="状态筛选" style="width: 140px" clearable @change="loadRooms">
          <el-option label="等待中" value="waiting" />
          <el-option label="游戏中" value="playing" />
          <el-option label="已结束" value="finished" />
        </el-select>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索房间号/名称"
          style="width: 200px"
          clearable
          @keyup.enter="loadRooms"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="loadRooms">
          <el-icon><Refresh /></el-icon> 刷新
        </el-button>
      </div>
    </div>

    <div class="content-card game-card">
      <el-table :data="rooms" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="room_code" label="房间号" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="primary" size="small">{{ row.room_code }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="room_name" label="房间名称" min-width="150" />
        <el-table-column label="房主" width="140">
          <template #default="{ row }">
            <div class="player-cell">
              <el-avatar :size="24" :style="{ background: getAvatarBg(row.creator_name) }">
                {{ row.creator_name?.charAt(0) }}
              </el-avatar>
              <span>{{ row.creator_name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="人数" width="100" align="center">
          <template #default="{ row }">
            <span :class="row.current_players >= row.max_players ? 'full' : ''">
              {{ row.current_players }}/{{ row.max_players }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="模式" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.game_mode === 'item' ? 'warning' : 'info'" size="small">
              {{ row.game_mode === 'item' ? '道具模式' : '经典模式' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="密码" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.has_password" type="warning" size="small">有</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button v-if="row.status === 'playing'" type="success" size="small" @click="viewGame(row)">
              观战
            </el-button>
            <el-button type="danger" size="small" @click="deleteRoom(row)">
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
        @current-change="loadRooms"
        @size-change="handleSizeChange"
        class="pagination"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getRoomList, deleteRoom as deleteRoomApi } from '@/api'

const router = useRouter()
const rooms = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const searchKeyword = ref('')
const statusFilter = ref('')

const loadRooms = async () => {
  loading.value = true
  try {
    const data = await getRoomList({
      page: page.value,
      page_size: pageSize.value,
      keyword: searchKeyword.value,
      status: statusFilter.value
    })
    rooms.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

const handleSizeChange = () => {
  page.value = 1
  loadRooms()
}

const getStatusType = (status) => {
  const types = {
    waiting: 'success',
    playing: 'warning',
    finished: 'info'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    waiting: '等待中',
    playing: '游戏中',
    finished: '已结束'
  }
  return texts[status] || status
}

const getAvatarBg = (name) => {
  const colors = [
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #f093fb, #f5576c)',
    'linear-gradient(135deg, #4facfe, #00f2fe)',
    'linear-gradient(135deg, #fa709a, #fee140)',
    'linear-gradient(135deg, #43e97b, #38f9d7)'
  ]
  const index = (name || '').charCodeAt(0) % colors.length
  return colors[index]
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

const viewGame = (row) => {
  router.push(`/game/${row.id}/spectator`)
}

const deleteRoom = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该房间吗？', '删除确认', {
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消'
    })
    await deleteRoomApi(row.id)
    ElMessage.success('删除成功')
    loadRooms()
  } catch (e) {}
}

onMounted(loadRooms)
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
.player-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.full {
  color: #f56c6c;
  font-weight: bold;
}
.pagination {
  margin-top: 20px;
  justify-content: flex-end;
}
</style>
