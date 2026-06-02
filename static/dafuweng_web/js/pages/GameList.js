import { ref, onMounted } from 'vue'
import Api from '../api.js'

export default {
  setup() {
    const games = ref([])
    const loading = ref(false)
    const showCreate = ref(false)
    const newGameName = ref('')
    const newGameMaxPlayers = ref(4)
    const error = ref('')

    async function loadGames() {
      loading.value = true
      try {
        const res = await Api.getGameList()
        const listData = res.data || {}
        games.value = listData.items || listData || []
      } catch (e) {
        error.value = e.message
      } finally {
        loading.value = false
      }
    }

    async function createGame() {
      if (!newGameName.value) return
      try {
        const res = await Api.createGame({ 
          name: newGameName.value, 
          max_rounds: 30,
          max_players: newGameMaxPlayers.value 
        })
        if (res.code === 0 && res.data) {
          const gameId = res.data.id
          showCreate.value = false
          newGameName.value = ''
          window.location.hash = '#/game/' + gameId
        } else {
          error.value = res.msg || '创建失败'
        }
      } catch (e) {
        error.value = e.message
      }
    }

    async function joinGame(gameId) {
      try {
        const res = await Api.joinGame({ game_id: gameId })
        if (res.code === 0) {
          window.location.hash = '#/game/' + gameId
        } else {
          error.value = res.msg || '加入失败'
        }
      } catch (e) {
        error.value = e.message
      }
    }

    function statusText(status) {
      const map = { waiting: '等待中', playing: '进行中', finished: '已结束' }
      return map[status] || status
    }

    function statusClass(status) {
      const map = { waiting: 'status-waiting', playing: 'status-playing', finished: 'status-finished' }
      return map[status] || ''
    }

    onMounted(loadGames)

    return { games, loading, showCreate, newGameName, newGameMaxPlayers, error, createGame, joinGame, statusText, statusClass }
  },
  template: `
    <div class="game-list-page">
      <div class="page-header">
        <h2>🎮 游戏大厅</h2>
        <button class="btn btn-primary" @click="showCreate = true">创建房间</button>
      </div>

      <div v-if="error" class="alert alert-error">{{ error }}</div>

      <div v-if="showCreate" class="modal-overlay" @click.self="showCreate = false">
        <div class="modal">
          <h3>创建新房间</h3>
          <div class="form-group">
            <label>房间名称</label>
            <input v-model="newGameName" type="text" placeholder="请输入房间名称" />
          </div>
          <div class="form-group">
            <label>最大人数</label>
            <select v-model="newGameMaxPlayers">
              <option :value="2">2人</option>
              <option :value="3">3人</option>
              <option :value="4">4人</option>
            </select>
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline" @click="showCreate = false">取消</button>
            <button class="btn btn-primary" @click="createGame">创建</button>
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="games.length === 0" class="empty">暂无游戏房间，快来创建一个吧！</div>
      <div v-else class="game-cards">
        <div v-for="game in games" :key="game.id" class="game-card">
          <div class="game-card-header">
            <h3>{{ game.name }}</h3>
            <span :class="['status-badge', statusClass(game.status)]">{{ statusText(game.status) }}</span>
          </div>
          <div class="game-card-body">
            <p>👥 玩家: {{ game.playerCount || 0 }}/{{ game.maxPlayers }}</p>
            <p>🕐 创建时间: {{ game.createdAt }}</p>
          </div>
          <div class="game-card-footer">
            <button v-if="game.status === 'waiting'" class="btn btn-primary btn-sm" @click="joinGame(game.id)">加入</button>
            <button v-if="game.status === 'playing'" class="btn btn-outline btn-sm" @click="joinGame(game.id)">观战</button>
          </div>
        </div>
      </div>
    </div>
  `
}
