<template>
  <div class="game-container">
    <div class="game-header game-card">
      <div class="header-left">
        <el-button @click="goBack"><el-icon><ArrowLeft /></el-icon> 返回大厅</el-button>
        <h2 class="room-name">👁️ 观战中 - {{ room?.room_name }}</h2>
      </div>
      <div class="spectator-info">
        <el-tag type="info">观战模式</el-tag>
        <span>观战人数: {{ spectators.length }}</span>
      </div>
    </div>

    <div class="game-main">
      <div class="players-panel game-card">
        <h3>玩家信息</h3>
        <div v-for="(player, index) in gameState?.players_state || []" :key="player.user_id" class="player-item" :class="{ active: index === gameState?.current_player_index, winner: gameState?.winner_id === player.user_id }">
          <div class="player-avatar" :style="{ backgroundColor: player.color }">
            {{ player.nickname?.charAt(0) }}
          </div>
          <div class="player-details">
            <div class="player-name">
              {{ player.nickname }}
              <el-tag v-if="gameState?.winner_id === player.user_id" type="success" size="small">胜利</el-tag>
            </div>
            <div class="pieces-status">
              <span v-for="piece in player.pieces" :key="piece.id" class="piece-dot" :class="{ home: piece.is_home, finished: piece.is_finished }" :style="{ backgroundColor: player.color }"></span>
            </div>
          </div>
        </div>
      </div>

      <div class="board-area game-card">
        <div class="board-wrapper">
          <div class="board">
            <div v-for="i in 52" :key="i" class="track-cell" :class="{ 'safe-zone': isSafeZone(i - 1) }"></div>
            <div v-for="player in gameState?.players_state || []" :key="'pieces-' + player.user_id">
              <div v-for="piece in player.pieces" :key="piece.id" class="piece" :class="{ 'in-home': piece.is_home, 'finished': piece.is_finished }" :style="getPieceStyle(player, piece)">
                <span>{{ piece.id + 1 }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="dice-area" v-if="!gameState?.is_game_over">
          <div class="dice-display">
            <span v-if="gameState?.dice_value">{{ diceValues[gameState.dice_value] || '🎲' }}</span>
            <span v-else>🎲</span>
          </div>
          <div class="turn-info-large">
            <span v-if="currentPlayer">当前回合: {{ currentPlayer.nickname }}</span>
            <span>第 {{ gameState?.turn_count || 0 }} 回合</span>
          </div>
        </div>

        <div class="game-over" v-if="gameState?.is_game_over">
          <h2>🎉 游戏结束</h2>
          <p>{{ winnerPlayer?.nickname }} 获得胜利！</p>
          <el-button type="primary" @click="goBack">返回大厅</el-button>
        </div>
      </div>

      <div class="spectators-panel game-card">
        <h3>观战列表 ({{ spectators.length }})</h3>
        <div class="spectator-list">
          <div v-for="s in spectators" :key="s.id" class="spectator-item">
            <div class="spectator-avatar">{{ s.nickname?.charAt(0) }}</div>
            <span>{{ s.nickname }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="message-panel game-card">
      <h3>游戏消息</h3>
      <div class="message-list" ref="messageListRef">
        <div v-for="(msg, index) in messages" :key="index" class="message-item">
          {{ msg }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getGameState, getRoom, joinSpectator, getRoomSpectators } from '@/api'
import { getUser } from '@/utils/storage'

const route = useRoute()
const router = useRouter()
const user = getUser()
const roomId = route.params.id
const room = ref(null)
const gameState = ref(null)
const spectators = ref([])
const messages = ref(['👁️ 进入观战模式'])
const messageListRef = ref(null)

const diceValues = { 1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅' }

const currentPlayer = computed(() => {
  if (!gameState.value) return null
  return gameState.value.players_state[gameState.value.current_player_index]
})

const winnerPlayer = computed(() => {
  if (!gameState.value?.winner_id) return null
  return gameState.value.players_state.find(p => p.user_id === gameState.value.winner_id)
})

const isSafeZone = (pos) => {
  return pos % 13 === 0 || pos % 13 === 4 || pos % 13 === 8
}

const getPieceStyle = (player, piece) => {
  const playerIndex = gameState.value?.players_state.findIndex(p => p.user_id === player.user_id) || 0
  const baseOffset = playerIndex * 13
  const homePositions = [
    { top: '10px', left: '10px' },
    { top: '10px', right: '10px' },
    { bottom: '10px', right: '10px' },
    { bottom: '10px', left: '10px' }
  ]

  if (piece.is_home) {
    const homePos = homePositions[playerIndex]
    const offset = piece.id * 25
    return {
      ...homePos,
      backgroundColor: player.color,
      transform: `translate(${piece.id % 2 === 0 ? offset : -offset}px, ${piece.id < 2 ? 0 : offset}px)`
    }
  }

  if (piece.is_finished) {
    return {
      top: '50%',
      left: '50%',
      transform: `translate(-50%, -50%) translate(${piece.id * 15 - 22}px, ${piece.id * 15 - 22}px)`,
      backgroundColor: player.color,
      opacity: 0.8
    }
  }

  const trackPos = (piece.position + baseOffset) % 52
  const angle = (trackPos / 52) * 360
  const radius = 180
  const x = Math.cos((angle - 90) * Math.PI / 180) * radius
  const y = Math.sin((angle - 90) * Math.PI / 180) * radius

  return {
    top: `calc(50% + ${y}px - 15px)`,
    left: `calc(50% + ${x}px - 15px)`,
    backgroundColor: player.color,
    zIndex: 10 + piece.position
  }
}

const loadRoom = async () => {
  try {
    room.value = await getRoom(roomId)
  } catch (e) {}
}

const loadGameState = async () => {
  try {
    const state = await getGameState(roomId)
    if (gameState.value && state.last_action !== gameState.value.last_action) {
      if (state.last_action?.type === 'roll') {
        addMessage(`${state.players_state[state.current_player_index]?.nickname} 掷出了 ${state.dice_value} 点`)
      } else if (state.last_action?.type === 'move') {
        const player = state.players_state.find(p => p.user_id === state.last_action.player)
        addMessage(`${player?.nickname} 移动了棋子`)
      }
    }
    gameState.value = state
    if (state.is_game_over && state.winner_id) {
      const winner = state.players_state.find(p => p.user_id === state.winner_id)
      addMessage(`🎉 ${winner?.nickname} 获得了胜利！`)
    }
    scrollToBottom()
  } catch (e) {}
}

const loadSpectators = async () => {
  try {
    spectators.value = await getRoomSpectators(roomId)
  } catch (e) {}
}

const initSpectator = async () => {
  try {
    await joinSpectator(roomId, user.id)
    addMessage(`你已进入观战`)
  } catch (e) {}
}

const addMessage = (msg) => {
  messages.value.push(msg)
  if (messages.value.length > 50) {
    messages.value = messages.value.slice(-50)
  }
}

const scrollToBottom = async () => {
  await nextTick()
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

const goBack = () => router.push('/')

let pollTimer = null

onMounted(() => {
  loadRoom()
  loadGameState()
  loadSpectators()
  initSpectator()
  pollTimer = setInterval(() => {
    loadGameState()
    loadSpectators()
  }, 2000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<style scoped>
.game-container {
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.room-name {
  margin: 0;
  font-size: 20px;
  color: #333;
}
.spectator-info {
  display: flex;
  align-items: center;
  gap: 16px;
  color: #666;
}
.game-main {
  display: flex;
  gap: 20px;
  flex: 1;
  min-height: 0;
}
.players-panel {
  width: 250px;
  padding: 20px;
  overflow-y: auto;
}
.players-panel h3, .spectators-panel h3, .message-panel h3 {
  margin-bottom: 16px;
  color: #333;
}
.player-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  margin-bottom: 12px;
  border-radius: 12px;
  background: #f5f5f5;
  border: 2px solid transparent;
  transition: all 0.3s;
}
.player-item.active {
  border-color: #667eea;
  background: #f0f4ff;
}
.player-item.winner {
  border-color: #67c23a;
  background: #f0f9eb;
}
.player-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}
.player-details {
  flex: 1;
  min-width: 0;
}
.player-name {
  font-weight: bold;
  margin-bottom: 8px;
}
.pieces-status {
  display: flex;
  gap: 6px;
}
.piece-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.8);
}
.piece-dot.home {
  opacity: 0.4;
}
.piece-dot.finished {
  box-shadow: 0 0 8px #67c23a;
}
.board-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  gap: 20px;
}
.board-wrapper {
  width: 450px;
  height: 450px;
  position: relative;
}
.board {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-radius: 20px;
  position: relative;
  box-shadow: inset 0 0 30px rgba(0,0,0,0.1);
}
.track-cell {
  position: absolute;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255,255,255,0.6);
}
.track-cell.safe-zone {
  background: rgba(103, 194, 58, 0.3);
}
.piece {
  position: absolute;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 12px;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.dice-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.dice-display {
  width: 100px;
  height: 100px;
  font-size: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
}
.turn-info-large {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: #666;
}
.spectators-panel {
  width: 250px;
  padding: 20px;
  overflow-y: auto;
}
.spectator-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.spectator-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 8px;
  background: #f5f5f5;
}
.spectator-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}
.message-panel {
  height: 150px;
  padding: 20px;
  display: flex;
  flex-direction: column;
}
.message-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.message-item {
  font-size: 14px;
  color: #666;
  padding: 4px 8px;
  background: #f9f9f9;
  border-radius: 4px;
}
.game-over {
  text-align: center;
  padding: 40px;
}
.game-over h2 {
  font-size: 32px;
  color: #67c23a;
  margin-bottom: 16px;
}
.game-over p {
  font-size: 18px;
  margin-bottom: 24px;
}
</style>
