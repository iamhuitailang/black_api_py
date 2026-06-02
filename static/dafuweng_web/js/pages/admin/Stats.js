import { ref, onMounted } from 'vue'
import Api from '../../api.js'

export default {
  setup() {
    const userStats = ref([])
    const gameStats = ref([])
    const activeTab = ref('users')
    const loading = ref(false)

    async function loadStats() {
      loading.value = true
      try {
        if (activeTab.value === 'users') {
          const res = await Api.getUserStats()
          userStats.value = res.data || []
        } else {
          const res = await Api.getGameStats()
          gameStats.value = res.data || []
        }
      } catch (e) {
        console.error(e)
      } finally {
        loading.value = false
      }
    }

    function switchTab(tab) {
      activeTab.value = tab
      loadStats()
    }

    onMounted(loadStats)

    return { userStats, gameStats, activeTab, loading, switchTab }
  },
  template: `
    <div class="admin-page">
      <h2 class="page-title">📈 详细统计</h2>
      <div class="tabs">
        <button :class="['tab', { active: activeTab === 'users' }]" @click="switchTab('users')">用户统计</button>
        <button :class="['tab', { active: activeTab === 'games' }]" @click="switchTab('games')">游戏统计</button>
      </div>

      <div v-if="loading" class="loading">加载中...</div>

      <template v-else-if="activeTab === 'users'">
        <table class="admin-table">
          <thead>
            <tr>
              <th>用户名</th>
              <th>昵称</th>
              <th>金币</th>
              <th>游戏场次</th>
              <th>胜场</th>
              <th>胜率</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in userStats" :key="s.userId || s.id">
              <td>{{ s.username }}</td>
              <td>{{ s.nickname }}</td>
              <td>{{ s.coins }}</td>
              <td>{{ s.totalGames }}</td>
              <td>{{ s.wins }}</td>
              <td>{{ s.totalGames ? Math.round(s.wins / s.totalGames * 100) + '%' : '0%' }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="userStats.length === 0" class="empty">暂无数据</div>
      </template>

      <template v-else>
        <table class="admin-table">
          <thead>
            <tr>
              <th>游戏ID</th>
              <th>房间名</th>
              <th>玩家数</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>结束时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in gameStats" :key="s.id">
              <td>{{ s.id }}</td>
              <td>{{ s.name }}</td>
              <td>{{ s.playerCount }}</td>
              <td>{{ s.status }}</td>
              <td>{{ s.createdAt }}</td>
              <td>{{ s.finishedAt || '-' }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="gameStats.length === 0" class="empty">暂无数据</div>
      </template>
    </div>
  `
}
