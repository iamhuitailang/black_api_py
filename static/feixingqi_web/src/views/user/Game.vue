<template>
  <div class="game-container">
    <div class="game-header game-card">
      <div class="header-left">
        <el-button @click="goBack"><el-icon><ArrowLeft /></el-icon> 退出游戏</el-button>
        <h2 class="room-name">{{ room?.room_name }}</h2>
      </div>
      <div class="turn-info" v-if="gameState">
        <span v-if="isMyTurn" class="my-turn">🎯 你的回合</span>
        <span v-else>⏳ {{ currentPlayer?.nickname }} 的回合</span>
        <span class="turn-count">第 {{ gameState.turn_count }} 回合</span>
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
              <el-tag v-if="player.has_shield" type="warning" size="small">🛡️ 护盾</el-tag>
            </div>
            <div class="pieces-status">
              <span v-for="piece in player.pieces" :key="piece.id" class="piece-dot" :class="{ home: piece.is_home, finished: piece.is_finished }" :style="{ backgroundColor: player.color }"></span>
            </div>
            <div class="buffs" v-if="player.active_buffs?.length">
              <el-tag v-for="buff in player.active_buffs" :key="buff" size="small" type="warning">{{ buffNames[buff] || buff }}</el-tag>
            </div>
          </div>
        </div>
      </div>

      <div class="board-area game-card">
        <div class="board-wrapper">
          <div class="board">
            <div v-for="i in 52" :key="i" class="track-cell" :class="{ 'safe-zone': isSafeZone(i - 1) }">
              <span class="cell-number">{{ i - 1 }}</span>
            </div>
            <div v-for="player in gameState?.players_state || []" :key="'pieces-' + player.user_id">
              <div v-for="piece in player.pieces" :key="piece.id" class="piece" :class="{ 'in-home': piece.is_home, 'finished': piece.is_finished }" :style="getPieceStyle(player, piece)" @click="selectPiece(piece)">
                <span>{{ piece.id + 1 }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="dice-area" v-if="!gameState?.is_game_over">
          <div class="dice-display" :class="{ rolling: isRolling }">
            <span v-if="gameState?.dice_value">{{ diceValues[gameState.dice_value] || '🎲' }}</span>
            <span v-else>🎲</span>
          </div>
          <el-button v-if="isMyTurn && gameState?.game_phase === 'rolling'" type="primary" size="large" @click="rollDice" :disabled="isRolling" :loading="rolling">
            掷骰子
          </el-button>
          <el-button v-else-if="isMyTurn && gameState?.game_phase === 'moving' && !isRolling" type="success" size="large" disabled>
            请选择要移动的棋子
          </el-button>
          <el-button v-else type="info" size="large" disabled>
            等待其他玩家
          </el-button>
        </div>

        <div class="game-over" v-if="gameState?.is_game_over">
          <h2>🎉 游戏结束</h2>
          <p>{{ winnerPlayer?.nickname }} 获得胜利！</p>
          <el-button type="primary" @click="goBack">返回大厅</el-button>
        </div>
      </div>

      <div class="items-panel game-card">
        <h3>道具背包</h3>
        <div class="items-list">
          <div v-for="item in userItems" :key="item.id" class="item-card" :class="'rarity-' + item.rarity" @click="useItem(item)">
            <span class="item-icon">{{ item.item_icon }}</span>
            <div class="item-info">
              <div class="item-name">{{ item.item_name }}</div>
              <div class="item-desc">{{ item.description }}</div>
            </div>
            <span class="item-count">x{{ item.quantity }}</span>
          </div>
          <div v-if="!userItems?.length" class="empty-items">
            暂无道具
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

    <el-dialog v-model="selectTargetDialog" title="选择目标玩家" width="400px">
      <div class="target-list">
        <div v-for="player in otherPlayers" :key="player.user_id" class="target-item" @click="confirmUseItem(player)">
          <div class="target-avatar" :style="{ backgroundColor: player.color }">{{ player.nickname?.charAt(0) }}</div>
          <span>{{ player.nickname }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { initGame, getGameState, rollDice as rollDiceApi, movePiece, useItem as useItemApi, getUserItems, getRoom } from '@/api'
import { getUser } from '@/utils/storage'

const route = useRoute()
const router = useRouter()
const user = getUser()
const roomId = route.params.id
const room = ref(null)
const gameState = ref(null)
const userItems = ref([])
const messages = ref(['🎮 游戏开始！'])
const isRolling = ref(false)
const rolling = ref(false)
const messageListRef = ref(null)
const selectTargetDialog = ref(false)
const selectedItem = ref(null)

const diceValues = { 1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅' }
const buffNames = { double_dice: '双倍骰子', lucky_six: '幸运符' }

const currentPlayer = computed(() => {
  if (!gameState.value) return null
  return gameState.value.players_state[gameState.value.current_player_index]
})

const isMyTurn = computed(() => {
  return currentPlayer.value?.user_id === user?.id
})

const winnerPlayer = computed(() => {
  if (!gameState.value?.winner_id) return null
  return gameState.value.players_state.find(p => p.user_id === gameState.value.winner_id)
})

const otherPlayers = computed(() => {
  if (!gameState.value) return []
  return gameState.value.players_state.filter(p => p.user_id !== user.id)
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

const loadUserItems = async () => {
  try {
    userItems.value = await getUserItems(user.id)
  } catch (e) {}
}

const initGameData = async () => {
  try {
    await loadRoom()
    const state = await getGameState(roomId)
    if (!state) {
      await initGame(roomId)
    }
    await loadGameState()
    await loadUserItems()
  } catch (e) {}
}

const rollDice = async () => {
  if (!isMyTurn.value || gameState.value.game_phase !== 'rolling') return
  
  isRolling.value = true
  rolling.value = true
  
  try {
    const result = await rollDiceApi(roomId, user.id)
    setTimeout(async () => {
      isRolling.value = false
      rolling.value = false
      addMessage(`你掷出了 ${result.dice_value} 点`)
      await loadGameState()
      
      const player = gameState.value.players_state[gameState.value.current_player_index]
      const movablePieces = player.pieces.filter(p => {
        if (p.is_finished) return false
        if (p.is_home) return result.dice_value === 6
        return true
      })
      
      if (movablePieces.length === 0) {
        addMessage('没有可移动的棋子，跳过回合')
        setTimeout(() => {
          gameState.value.current_player_index = (gameState.value.current_player_index + 1) % gameState.value.players_state.length
          gameState.value.game_phase = 'rolling'
        }, 1000)
      } else if (movablePieces.length === 1) {
        setTimeout(() => selectPiece(movablePieces[0]), 500)
      }
    }, 1000)
  } catch (e) {
    isRolling.value = false
    rolling.value = false
  }
}

const selectPiece = async (piece) => {
  if (!isMyTurn.value || gameState.value.game_phase !== 'moving') return
  if (piece.is_finished) return
  if (piece.is_home && gameState.value.dice_value !== 6) {
    ElMessage.warning('只有掷出6点才能让棋子起飞')
    return
  }
  
  try {
    const result = await movePiece(roomId, user.id, piece.id)
    addMessage(result.message)
    await loadGameState()
    await loadUserItems()
  } catch (e) {}
}

const useItem = async (item) => {
  if (item.quantity <= 0) return
  if (gameState.value.is_game_over) return
  
  selectedItem.value = item
  const effect = JSON.parse(item.effect)
  
  if (effect.type === 'missile') {
    selectTargetDialog.value = true
  } else {
    try {
      await ElMessageBox.confirm(`确定使用 ${item.item_name} 吗？`, '使用道具')
      const result = await useItemApi(roomId, { user_id: user.id, item_id: item.id })
      addMessage(`使用了 ${item.item_name}`)
      await loadGameState()
      await loadUserItems()
    } catch (e) {}
  }
}

const confirmUseItem = async (targetPlayer) => {
  if (!selectedItem.value) return
  try {
    const result = await useItemApi(roomId, { 
      user_id: user.id, 
      item_id: selectedItem.value.id,
      target_user_id: targetPlayer.user_id
    })
    addMessage(`对 ${targetPlayer.nickname} 使用了 ${selectedItem.value.item_name}`)
    selectTargetDialog.value = false
    selectedItem.value = null
    await loadGameState()
    await loadUserItems()
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

const goBack = async () => {
  try {
    await ElMessageBox.confirm('确定要退出游戏吗？', '提示')
    router.push('/')
  } catch (e) {}
}

let pollTimer = null

onMounted(() => {
  initGameData()
  pollTimer = setInterval(() => {
    if (!isMyTurn.value || gameState.value?.is_game_over) {
      loadGameState()
    }
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
.turn-info {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 16px;
}
.my-turn {
  color: #67c23a;
  font-weight: bold;
  animation: pulse 1s infinite;
}
.turn-count {
  color: #999;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
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
.players-panel h3, .items-panel h3, .message-panel h3 {
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
  display: flex;
  align-items: center;
  gap: 6px;
}
.pieces-status {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
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
.buffs {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
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
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  color: #999;
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
  cursor: pointer;
  transition: all 0.3s;
}
.piece:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
}
.piece.in-home {
  cursor: default;
}
.piece.finished {
  cursor: default;
  opacity: 0.7;
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
  transition: transform 0.1s;
}
.dice-display.rolling {
  animation: diceRoll 0.1s infinite;
}
@keyframes diceRoll {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.items-panel {
  width: 280px;
  padding: 20px;
  overflow-y: auto;
}
.items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.item-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}
.item-card:hover {
  transform: translateY(-2px);
  border-color: #667eea;
}
.item-icon {
  font-size: 28px;
}
.item-info {
  flex: 1;
  min-width: 0;
}
.item-name {
  font-weight: bold;
  margin-bottom: 4px;
}
.item-desc {
  font-size: 12px;
  color: #999;
}
.item-count {
  font-weight: bold;
  color: #667eea;
}
.empty-items {
  text-align: center;
  color: #999;
  padding: 40px 0;
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
.target-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.target-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}
.target-item:hover {
  background: #f0f4ff;
}
.target-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}
</style>
