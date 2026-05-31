<template>
  <div class="page-container">
    <div class="header game-card">
      <div class="header-left">
        <h1 class="logo">🎮 飞行棋对战</h1>
      </div>
      <div class="header-right">
        <el-button @click="goToRank"><el-icon><Trophy /></el-icon> 排行榜</el-button>
        <el-button @click="goToProfile"><el-icon><User /></el-icon> {{ user.nickname }}</el-button>
        <el-button type="danger" @click="logout"><el-icon><SwitchButton /></el-icon> 退出</el-button>
      </div>
    </div>

    <div class="main-content">
      <div class="actions game-card">
        <el-button type="primary" size="large" @click="handleQuickMatch" :loading="matching">
          <el-icon><Promotion /></el-icon> 快速开始
        </el-button>
        <el-button type="success" size="large" @click="showCreateDialog">
          <el-icon><Plus /></el-icon> 创建房间
        </el-button>
        <el-button type="warning" size="large" @click="showJoinDialog">
          <el-icon><Link /></el-icon> 加入房间
        </el-button>
        <el-button size="large" @click="goToProfile">
          <el-icon><Goods /></el-icon> 道具背包
        </el-button>
      </div>

      <div class="room-list game-card">
        <div class="list-header">
          <h2>房间列表</h2>
          <el-button @click="loadRooms" :loading="loading">
            <el-icon><Refresh /></el-icon> 刷新
          </el-button>
        </div>
        <div v-if="!loading && rooms.length === 0" class="empty-state">
          <div class="empty-icon">🏠</div>
          <h3>暂无房间</h3>
          <p>还没有人创建房间，快来创建第一个房间吧！</p>
          <el-button type="primary" @click="showCreateDialog">
            <el-icon><Plus /></el-icon> 创建房间
          </el-button>
          <el-button type="success" @click="handleQuickMatch" style="margin-left: 12px;">
            <el-icon><Promotion /></el-icon> 快速开始
          </el-button>
        </div>
        <el-table v-else :data="rooms" v-loading="loading">
          <el-table-column prop="room_name" label="房间名称" />
          <el-table-column prop="room_code" label="房间号" />
          <el-table-column label="房主">
            <template #default="{ row }">{{ row.creator_name }}</template>
          </el-table-column>
          <el-table-column label="人数">
            <template #default="{ row }">{{ row.current_players }}/{{ row.max_players }}</template>
          </el-table-column>
          <el-table-column prop="status" label="状态">
            <template #default="{ row }">
              <el-tag :type="row.status === 'waiting' ? 'success' : 'warning'">
                {{ row.status === 'waiting' ? '等待中' : '游戏中' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <el-button v-if="row.status === 'waiting'" type="primary" size="small" @click="joinRoom(row)">
                加入
              </el-button>
              <el-button v-else type="success" size="small" @click="spectateRoom(row)">
                观战
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="loadRooms"
          class="pagination"
        />
      </div>
    </div>

    <el-dialog v-model="createDialogVisible" title="创建房间" width="400px">
      <el-form :model="createForm" label-width="80px">
        <el-form-item label="房间名称">
          <el-input v-model="createForm.room_name" placeholder="请输入房间名称" />
        </el-form-item>
        <el-form-item label="最大人数">
          <el-select v-model="createForm.max_players">
            <el-option label="2人" :value="2" />
            <el-option label="3人" :value="3" />
            <el-option label="4人" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="游戏模式">
          <el-select v-model="createForm.game_mode">
            <el-option label="经典模式" value="classic" />
            <el-option label="道具模式" value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="房间密码">
          <el-input v-model="createForm.password" type="password" placeholder="不设置则为公开房间" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreateRoom" :loading="creating">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="joinDialogVisible" title="加入房间" width="400px">
      <el-form :model="joinForm" label-width="80px">
        <el-form-item label="房间号">
          <el-input v-model="joinForm.room_code" placeholder="请输入6位房间号" maxlength="6" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="joinForm.password" type="password" placeholder="公开房间无需密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="joinDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="joinByCode" :loading="joining">加入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getRoomList, createRoom as createRoomApi, getRoomByCode, joinRoom as joinRoomApi, quickMatch } from '@/api'
import { getUser, removeUser } from '@/utils/storage'

const router = useRouter()
const user = ref(getUser())
const rooms = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const createDialogVisible = ref(false)
const joinDialogVisible = ref(false)
const creating = ref(false)
const joining = ref(false)
const matching = ref(false)
const createForm = reactive({
  room_name: '',
  max_players: 4,
  game_mode: 'classic',
  password: ''
})
const joinForm = reactive({
  room_code: '',
  password: ''
})

const loadRooms = async () => {
  loading.value = true
  try {
    const data = await getRoomList({ page: page.value, page_size: pageSize.value })
    rooms.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

const showCreateDialog = () => {
  createForm.room_name = `${user.value.nickname}的房间`
  createForm.password = ''
  createDialogVisible.value = true
}

const handleQuickMatch = async () => {
  matching.value = true
  try {
    const room = await quickMatch({ user_id: user.value.id })
    if (room.is_new_room) {
      ElMessage.info('未找到可加入的房间，已为您创建新房间')
    } else {
      ElMessage.success('匹配成功，已加入房间')
    }
    router.push(`/room/${room.id}`)
  } finally {
    matching.value = false
  }
}

const handleCreateRoom = async () => {
  if (!createForm.room_name) {
    ElMessage.warning('请输入房间名称')
    return
  }
  creating.value = true
  try {
    const room = await createRoomApi({ ...createForm, creator_id: user.value.id })
    ElMessage.success('房间创建成功')
    createDialogVisible.value = false
    router.push(`/room/${room.id}`)
  } finally {
    creating.value = false
  }
}

const showJoinDialog = () => {
  joinForm.room_code = ''
  joinForm.password = ''
  joinDialogVisible.value = true
}

const joinByCode = async () => {
  if (!joinForm.room_code || joinForm.room_code.length !== 6) {
    ElMessage.warning('请输入6位房间号')
    return
  }
  joining.value = true
  try {
    const room = await getRoomByCode(joinForm.room_code)
    await joinRoomApi(room.id, { user_id: user.value.id, password: joinForm.password })
    ElMessage.success('加入成功')
    joinDialogVisible.value = false
    router.push(`/room/${room.id}`)
  } finally {
    joining.value = false
  }
}

const joinRoom = async (room) => {
  if (room.has_password) {
    try {
      const { value: password } = await ElMessageBox.prompt('请输入房间密码', '加入房间', {
        inputType: 'password',
        inputValidator: val => !!val || '请输入密码'
      })
      await joinRoomApi(room.id, { user_id: user.value.id, password })
      router.push(`/room/${room.id}`)
    } catch (e) {}
  } else {
    await joinRoomApi(room.id, { user_id: user.value.id })
    router.push(`/room/${room.id}`)
  }
}

const spectateRoom = (room) => {
  router.push(`/game/${room.id}/spectator`)
}

const goToRank = () => router.push('/rank')
const goToProfile = () => router.push('/profile')

const logout = () => {
  removeUser()
  router.push('/login')
}

onMounted(loadRooms)
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  margin-bottom: 20px;
}
.logo {
  font-size: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}
.main-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.actions {
  display: flex;
  gap: 16px;
  padding: 20px;
  justify-content: center;
}
.actions .el-button {
  min-width: 150px;
  height: 50px;
  font-size: 16px;
}
.room-list {
  padding: 24px;
}
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.list-header h2 {
  margin: 0;
  color: #333;
}
.pagination {
  margin-top: 20px;
  justify-content: center;
}
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}
.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}
.empty-state h3 {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 18px;
}
.empty-state p {
  margin: 0 0 20px 0;
  font-size: 14px;
}
</style>
