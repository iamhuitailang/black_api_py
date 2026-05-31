<template>
  <div class="page-container">
    <div class="header game-card">
      <div class="header-left">
        <el-button @click="goBack"><el-icon><ArrowLeft /></el-icon> 返回大厅</el-button>
        <h1 class="room-title">{{ room?.room_name || '加载中...' }}</h1>
      </div>
      <div class="room-code">
        房间号: <el-tag type="success" size="large">{{ room?.room_code }}</el-tag>
        <el-button size="small" @click="copyRoomCode">
          <el-icon><CopyDocument /></el-icon> 复制
        </el-button>
      </div>
    </div>

    <div class="main-content" v-loading="loading">
      <div class="player-section game-card">
        <h2>玩家列表 ({{ room?.current_players }}/{{ room?.max_players }})</h2>
        <div class="player-list">
          <div v-for="player in room?.players" :key="player.id" class="player-card">
            <div class="player-avatar" :style="{ backgroundColor: getPlayerColor(room.players.indexOf(player)) }">
              {{ player.nickname?.charAt(0) }}
            </div>
            <div class="player-info">
              <div class="player-name">{{ player.nickname }}</div>
              <div class="player-role">
                <el-tag v-if="player.is_creator" type="warning" size="small">房主</el-tag>
                <span v-else>玩家</span>
              </div>
            </div>
          </div>
          <div v-for="i in (room?.max_players - room?.current_players)" :key="'empty-' + i" class="player-card empty">
            <div class="player-avatar empty-avatar">?</div>
            <div class="player-info">
              <div class="player-name">等待加入...</div>
            </div>
          </div>
        </div>
      </div>

      <div class="game-settings game-card">
        <h2>游戏设置</h2>
        <div class="settings-row">
          <span>游戏模式：</span>
          <el-tag>{{ room?.game_mode === 'classic' ? '经典模式' : '道具模式' }}</el-tag>
        </div>
        <div class="settings-row">
          <span>人数：</span>
          <el-tag>{{ room?.current_players }}/{{ room?.max_players }}</el-tag>
        </div>
        <div class="settings-row">
          <span>状态：</span>
          <el-tag :type="room?.status === 'waiting' ? 'success' : 'warning'">
            {{ room?.status === 'waiting' ? '等待开始' : '游戏中' }}
          </el-tag>
        </div>
      </div>
    </div>

    <div v-if="room?.status === 'waiting'" class="invite-tip game-card">
      <div class="tip-content">
        <span class="tip-icon">📢</span>
        <div class="tip-text">
          <strong>房间已创建！</strong>
          <p>复制房间号 <el-tag type="primary">{{ room?.room_code }}</el-tag> 分享给好友，或者点击右上角按钮复制房间号</p>
        </div>
      </div>
    </div>

    <div class="actions">
      <el-button v-if="isCreator && room?.status === 'waiting'" type="primary" size="large" :disabled="room?.current_players < 2" @click="startGame" :loading="starting">
        <el-icon><VideoPlay /></el-icon> 开始游戏
      </el-button>
      <el-button v-if="!isCreator" size="large" @click="leaveRoom" :loading="leaving">
        <el-icon><Close /></el-icon> 离开房间
      </el-button>
      <el-button v-if="isCreator" type="danger" size="large" @click="dissolveRoom" :loading="dissolving">
        <el-icon><Delete /></el-icon> 解散房间
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getRoom, leaveRoom as leaveRoomApi, startGame as startGameApi, deleteRoom } from '@/api'
import { getUser } from '@/utils/storage'

const route = useRoute()
const router = useRouter()
const user = getUser()
const room = ref(null)
const loading = ref(false)
const starting = ref(false)
const leaving = ref(false)
const dissolving = ref(false)
const roomId = route.params.id

const isCreator = computed(() => room.value?.creator_id === user?.id)

const playerColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']

const getPlayerColor = (index) => playerColors[index % playerColors.length]

const loadRoom = async () => {
  loading.value = true
  try {
    room.value = await getRoom(roomId)
    if (room.value.status === 'playing') {
      router.push(`/game/${roomId}`)
    }
  } finally {
    loading.value = false
  }
}

let pollTimer = null

const startGame = async () => {
  try {
    starting.value = true
    await startGameApi(roomId, user.id)
    await ElMessageBox.confirm('游戏即将开始！', '提示', { showCancelButton: false })
    router.push(`/game/${roomId}`)
  } finally {
    starting.value = false
  }
}

const leaveRoom = async () => {
  try {
    await ElMessageBox.confirm('确定要离开房间吗？', '提示')
    leaving.value = true
    await leaveRoomApi(roomId, user.id)
    ElMessage.success('已离开房间')
    router.push('/')
  } finally {
    leaving.value = false
  }
}

const dissolveRoom = async () => {
  try {
    await ElMessageBox.confirm('确定要解散房间吗？', '提示', { type: 'warning' })
    dissolving.value = true
    await deleteRoom(roomId)
    ElMessage.success('房间已解散')
    router.push('/')
  } finally {
    dissolving.value = false
  }
}

const goBack = () => router.push('/')

const copyRoomCode = async () => {
  try {
    await navigator.clipboard.writeText(room.value.room_code)
    ElMessage.success('房间号已复制到剪贴板')
  } catch (e) {
    const textarea = document.createElement('textarea')
    textarea.value = room.value.room_code
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    ElMessage.success('房间号已复制')
  }
}

onMounted(() => {
  loadRoom()
  pollTimer = setInterval(loadRoom, 3000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  margin-bottom: 20px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.room-title {
  margin: 0;
  font-size: 20px;
  color: #333;
}
.room-code {
  display: flex;
  align-items: center;
  gap: 8px;
}
.main-content {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}
.player-section {
  flex: 2;
  padding: 24px;
}
.player-section h2 {
  margin-bottom: 20px;
}
.player-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}
.player-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 12px;
  border: 2px solid transparent;
  transition: all 0.3s;
}
.player-card:hover {
  border-color: #667eea;
}
.player-card.empty {
  opacity: 0.5;
}
.player-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  color: white;
}
.empty-avatar {
  background: #ddd;
  color: #999;
}
.player-info {
  flex: 1;
}
.player-name {
  font-weight: bold;
  margin-bottom: 4px;
}
.game-settings {
  flex: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.game-settings h2 {
  margin-bottom: 10px;
}
.settings-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}
.settings-row:last-child {
  border-bottom: none;
}
.actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  padding: 20px;
}
.actions .el-button {
  min-width: 150px;
  height: 50px;
  font-size: 16px;
}
.invite-tip {
  padding: 16px 24px;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
  border: 1px solid #c7d2fe;
}
.tip-content {
  display: flex;
  align-items: center;
  gap: 16px;
}
.tip-icon {
  font-size: 32px;
}
.tip-text strong {
  display: block;
  font-size: 16px;
  color: #3730a3;
  margin-bottom: 4px;
}
.tip-text p {
  margin: 0;
  color: #4338ca;
  font-size: 14px;
}
.tip-text .el-tag {
  margin: 0 4px;
}
</style>
