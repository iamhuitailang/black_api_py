import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import Api from '../api.js'
import Store from '../store.js'

const PLAYER_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12']

export default {
  setup() {
    const route = useRoute()
    const gameId = computed(() => route.params.id)

    const gameState = ref(null)
    const loading = ref(false)
    const diceValue = ref(0)
    const diceRolling = ref(false)
    const gameLog = ref([])
    const showModal = ref(false)
    const modalContent = ref({})
    const currentUser = ref(Store.state.user)
    let pollTimer = null

    const boardCells = computed(() => {
      if (!gameState.value || !gameState.value.map) return []
      return gameState.value.map
    })

    const currentPlayer = computed(() => {
      if (!gameState.value || !gameState.value.players) return null
      const idx = gameState.value.currentPlayerIndex
      return gameState.value.players[idx] || null
    })

    const myPlayer = computed(() => {
      if (!gameState.value || !gameState.value.players) return null
      const uid = currentUser.value ? currentUser.value.id : null
      return gameState.value.players.find(p => p.userId === uid)
    })

    const isCreator = computed(() => {
      if (!gameState.value) return false
      const uid = currentUser.value ? currentUser.value.id : null
      return gameState.value.creatorId === uid
    })

    const isMyTurn = computed(() => {
      if (!currentPlayer.value || !myPlayer.value) return false
      return currentPlayer.value.userId === myPlayer.value.userId
    })

    const gameStatus = computed(() => gameState.value ? gameState.value.status : '')

    async function loadGameState() {
      try {
        const res = await Api.getGameState({ gameId: parseInt(gameId.value) })
        gameState.value = res.data
        Store.setCurrentGame(res.data)
        if (res.data.lastLog) {
          addLog(res.data.lastLog)
        }
      } catch (e) {
        console.error(e)
      }
    }

    function addLog(msg) {
      if (msg && !gameLog.value.includes(msg)) {
        gameLog.value.push(msg)
        if (gameLog.value.length > 50) gameLog.value.shift()
      }
    }

    function startPolling() {
      stopPolling()
      pollTimer = setInterval(loadGameState, 3000)
    }

    function stopPolling() {
      if (pollTimer) {
        clearInterval(pollTimer)
        pollTimer = null
      }
    }

    async function rollDice() {
      if (!isMyTurn.value || diceRolling.value) return
      diceRolling.value = true
      try {
        const res = await Api.rollDice({ gameId: parseInt(gameId.value) })
        if (res.code !== 0) {
          addLog('掷骰子失败: ' + (res.msg || '未知错误'))
          diceRolling.value = false
          return
        }
        diceValue.value = res.data.dice
        animateDice(res.data.dice)
        await new Promise(r => setTimeout(r, 800))
        await loadGameState()
        if (res.data.event) {
          showModal.value = true
          modalContent.value = { type: 'event', title: '随机事件', message: res.data.event.message || res.data.event }
        }
        if (res.data.landAction) {
          handleLandAction(res.data.landAction)
        }
      } catch (e) {
        addLog('掷骰子失败: ' + e.message)
      } finally {
        diceRolling.value = false
      }
    }

    function animateDice(target) {
      let count = 0
      const timer = setInterval(() => {
        diceValue.value = Math.floor(Math.random() * 6) + 1
        count++
        if (count >= 10) {
          clearInterval(timer)
          diceValue.value = target
        }
      }, 80)
    }

    function handleLandAction(action) {
      if (action.type === 'buy_land') {
        showModal.value = true
        modalContent.value = {
          type: 'buy_land',
          title: '购买地产',
          message: `是否购买 ${action.landName}？价格: ${action.price}`,
          landId: action.landId,
          price: action.price
        }
      } else if (action.type === 'pay_rent') {
        showModal.value = true
        modalContent.value = {
          type: 'pay_rent',
          title: '支付租金',
          message: `你踩到了 ${action.landName}，需支付租金 ${action.rent} 给 ${action.ownerName}`,
          rent: action.rent
        }
      } else if (action.type === 'upgrade') {
        showModal.value = true
        modalContent.value = {
          type: 'upgrade',
          title: '升级地产',
          message: `是否升级 ${action.landName}？升级费: ${action.upgradeCost}`,
          landId: action.landId,
          upgradeCost: action.upgradeCost
        }
      }
    }

    async function buyLand() {
      try {
        const res = await Api.buyLand({ gameId: parseInt(gameId.value), cellId: modalContent.value.landId })
        if (res.code === 0) {
          addLog('购买地产成功')
          showModal.value = false
          await loadGameState()
        } else {
          addLog('购买失败: ' + (res.msg || '未知错误'))
        }
      } catch (e) {
        addLog('购买失败: ' + e.message)
      }
    }

    async function upgradeLand(landId) {
      try {
        const res = await Api.upgradeLand({ gameId: parseInt(gameId.value), cellId: landId })
        if (res.code === 0) {
          addLog('升级成功')
          showModal.value = false
          await loadGameState()
        } else {
          addLog('升级失败: ' + (res.msg || '未知错误'))
        }
      } catch (e) {
        addLog('升级失败: ' + e.message)
      }
    }

    async function sellLand(landId) {
      try {
        const res = await Api.sellLand({ gameId: parseInt(gameId.value), cellId: landId })
        if (res.code === 0) {
          addLog('出售成功')
          await loadGameState()
        } else {
          addLog('出售失败: ' + (res.msg || '未知错误'))
        }
      } catch (e) {
        addLog('出售失败: ' + e.message)
      }
    }

    async function useItem(itemId) {
      try {
        const res = await Api.useItem({ gameId: parseInt(gameId.value), itemId })
        if (res.code === 0) {
          addLog('使用道具成功')
          await loadGameState()
        } else {
          addLog('使用道具失败: ' + (res.msg || '未知错误'))
        }
      } catch (e) {
        addLog('使用道具失败: ' + e.message)
      }
    }

    async function buyItem(itemId) {
      try {
        const res = await Api.buyItem({ gameId: parseInt(gameId.value), itemId })
        if (res.code === 0) {
          addLog('购买道具成功')
          await loadGameState()
        } else {
          addLog('购买道具失败: ' + (res.msg || '未知错误'))
        }
      } catch (e) {
        addLog('购买道具失败: ' + e.message)
      }
    }

    async function nextTurn() {
      try {
        const res = await Api.nextTurn({ gameId: parseInt(gameId.value) })
        if (res.code !== 0) {
          addLog('下一回合失败: ' + (res.msg || '未知错误'))
        }
        await loadGameState()
      } catch (e) {
        addLog('下一回合失败: ' + e.message)
      }
    }

    async function startGame() {
      try {
        const res = await Api.startGame({ gameId: parseInt(gameId.value) })
        if (res.code === 0) {
          addLog('游戏开始！')
          await loadGameState()
        } else {
          addLog('开始游戏失败: ' + (res.msg || '未知错误'))
        }
      } catch (e) {
        addLog('开始游戏失败: ' + e.message)
      }
    }

    function getCellClass(cell) {
      const types = {
        start: 'cell-start',
        land: 'cell-land',
        event: 'cell-event',
        item: 'cell-item',
        tax: 'cell-tax',
        jail: 'cell-jail',
        parking: 'cell-parking'
      }
      return types[cell.type] || ''
    }

    function getOwnerColor(ownerId) {
      if (!gameState.value || !gameState.value.players) return ''
      const idx = gameState.value.players.findIndex(p => p.userId === ownerId)
      return idx >= 0 ? PLAYER_COLORS[idx] : ''
    }

    function getPlayersOnCell(cellIndex) {
      if (!gameState.value || !gameState.value.players) return []
      return gameState.value.players.filter(p => p.position === cellIndex)
    }

    function closeModal() {
      showModal.value = false
      modalContent.value = {}
    }

    onMounted(async () => {
      loading.value = true
      if (Store.isLoggedIn && !Store.state.user) {
        try {
          const res = await Api.getCurrentUser()
          Store.setUser(res.data)
          currentUser.value = res.data
        } catch (e) {
          console.error('Failed to load user:', e)
        }
      }
      currentUser.value = Store.state.user
      await loadGameState()
      loading.value = false
      startPolling()
    })

    onUnmounted(() => {
      stopPolling()
    })

    return {
      gameId, gameState, loading, diceValue, diceRolling, gameLog,
      showModal, modalContent, boardCells, currentPlayer, myPlayer, isMyTurn, isCreator,
      gameStatus, rollDice, buyLand, upgradeLand, sellLand, useItem, buyItem,
      nextTurn, startGame, getCellClass, getOwnerColor,
      getPlayersOnCell, closeModal, PLAYER_COLORS
    }
  },
  template: `
    <div class="game-page">
      <div v-if="loading" class="loading">加载中...</div>
      <template v-else-if="gameState">
        <div class="game-layout">
          <div class="game-board-container">
            <div class="game-board">
              <div
                v-for="(cell, index) in boardCells"
                :key="index"
                :class="['board-cell', getCellClass(cell)]"
                :style="{ '--owner-color': getOwnerColor(cell.ownerId) }"
              >
                <div v-if="cell.ownerId" class="owner-indicator" :style="{ backgroundColor: getOwnerColor(cell.ownerId) }"></div>
                <div class="cell-icon">{{ cell.icon || '🏠' }}</div>
                <div class="cell-name">{{ cell.name }}</div>
                <div v-if="cell.price" class="cell-price">💰{{ cell.price }}</div>
                <div v-if="cell.level" class="cell-level">{{ '⭐'.repeat(cell.level) }}</div>
                <div class="cell-players">
                  <span
                    v-for="p in getPlayersOnCell(index)"
                    :key="p.userId"
                    class="player-token"
                    :style="{ backgroundColor: PLAYER_COLORS[gameState.players.indexOf(p)] }"
                  >{{ (p.nickname || p.username || '?').charAt(0) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="game-sidebar">
            <div class="sidebar-section current-player">
              <h3>🎮 当前回合</h3>
              <div v-if="currentPlayer" class="player-info">
                <span class="player-badge" :style="{ backgroundColor: PLAYER_COLORS[gameState.currentPlayerIndex] }">
                  {{ (currentPlayer.nickname || currentPlayer.username).charAt(0) }}
                </span>
                <span>{{ currentPlayer.nickname || currentPlayer.username }}</span>
                <span class="player-money">💰 {{ currentPlayer.money }}</span>
              </div>
            </div>

            <div class="sidebar-section dice-section">
              <h3>🎲 骰子</h3>
              <div :class="['dice', { rolling: diceRolling }]">
                <span class="dice-value">{{ diceValue || '?' }}</span>
              </div>
              <template v-if="gameStatus === 'waiting'">
                <div class="waiting-info">
                  <p>⏳ 等待玩家加入... ({{ gameState.players.length }}/{{ gameState.maxPlayers }})</p>
                  <p v-if="gameState.players.length < 2" class="waiting-tip">至少需要2名玩家才能开始</p>
                </div>
                <button
                  v-if="isCreator && gameState.players.length >= 2"
                  class="btn btn-primary btn-block"
                  @click="startGame"
                >
                  开始游戏
                </button>
              </template>
              <button
                v-if="isMyTurn && gameStatus === 'playing'"
                class="btn btn-primary btn-block"
                @click="rollDice"
                :disabled="diceRolling"
              >
                {{ diceRolling ? '掷骰中...' : '掷骰子' }}
              </button>
            </div>

            <div v-if="myPlayer" class="sidebar-section my-info">
              <h3>👤 我的信息</h3>
              <div class="my-stats">
                <div class="stat-item"><span>💰 金币</span><span>{{ myPlayer.money }}</span></div>
                <div class="stat-item"><span>🏘️ 地产</span><span>{{ myPlayer.lands ? myPlayer.lands.length : 0 }}</span></div>
                <div class="stat-item"><span>🎒 道具</span><span>{{ myPlayer.items ? myPlayer.items.length : 0 }}</span></div>
              </div>
            </div>

            <div v-if="myPlayer && myPlayer.items && myPlayer.items.length > 0" class="sidebar-section items-section">
              <h3>🎒 我的道具</h3>
              <div class="items-list">
                <div v-for="item in myPlayer.items" :key="item.id" class="item-card" @click="useItem(item.id)">
                  <span class="item-icon">{{ item.icon || '📦' }}</span>
                  <span class="item-name">{{ item.name }}</span>
                </div>
              </div>
            </div>

            <div v-if="myPlayer && myPlayer.lands && myPlayer.lands.length > 0" class="sidebar-section lands-section">
              <h3>🏘️ 我的地产</h3>
              <div class="lands-list">
                <div v-for="land in myPlayer.lands" :key="land.id" class="land-item">
                  <span>{{ land.name }}</span>
                  <div class="land-actions">
                    <button v-if="land.canUpgrade" class="btn btn-sm btn-outline" @click="upgradeLand(land.id)">升级</button>
                    <button class="btn btn-sm btn-danger" @click="sellLand(land.id)">出售</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="sidebar-section players-section">
              <h3>👥 玩家列表</h3>
              <div class="players-list">
                <div v-for="(p, idx) in gameState.players" :key="p.userId" :class="['player-row', { active: idx === gameState.currentPlayerIndex }]">
                  <span class="player-badge" :style="{ backgroundColor: PLAYER_COLORS[idx] }">
                    {{ (p.nickname || p.username).charAt(0) }}
                  </span>
                  <span class="player-name">{{ p.nickname || p.username }}</span>
                  <span class="player-money">💰{{ p.money }}</span>
                </div>
              </div>
            </div>

            <div class="sidebar-section log-section">
              <h3>📜 游戏日志</h3>
              <div class="game-log">
                <div v-for="(log, idx) in gameLog" :key="idx" class="log-item">{{ log }}</div>
                <div v-if="gameLog.length === 0" class="empty-log">暂无日志</div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
          <div class="modal">
            <h3>{{ modalContent.title }}</h3>
            <p>{{ modalContent.message }}</p>
            <div class="modal-actions">
              <button class="btn btn-outline" @click="closeModal">关闭</button>
              <button v-if="modalContent.type === 'buy_land'" class="btn btn-primary" @click="buyLand">购买</button>
              <button v-if="modalContent.type === 'upgrade'" class="btn btn-primary" @click="upgradeLand(modalContent.landId)">升级</button>
            </div>
          </div>
        </div>
      </template>
      <div v-else class="empty">游戏不存在或已结束</div>
    </div>
  `
}
