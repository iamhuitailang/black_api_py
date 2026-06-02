import { ref, onMounted } from 'vue'
import Api from '../../api.js'

export default {
  setup() {
    const stats = ref({ totalUsers: 0, totalGames: 0, activeGames: 0, totalCoins: 0 })
    const loading = ref(true)

    onMounted(async () => {
      try {
        const res = await Api.getDashboardStats()
        stats.value = res.data || stats.value
      } catch (e) {
        console.error(e)
      } finally {
        loading.value = false
      }
    })

    return { stats, loading }
  },
  template: `
    <div class="admin-page">
      <h2 class="page-title">📊 数据概览</h2>
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalUsers }}</div>
            <div class="stat-label">总用户数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🎮</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalGames }}</div>
            <div class="stat-label">总游戏数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🕹️</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.activeGames }}</div>
            <div class="stat-label">进行中</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalCoins }}</div>
            <div class="stat-label">总金币流通</div>
          </div>
        </div>
      </div>
    </div>
  `
}
