import { ref, onMounted, computed } from 'vue'
import Api from '../api.js'

export default {
  setup() {
    const activeTab = ref('coins')
    const coinsRank = ref([])
    const winsRank = ref([])
    const loading = ref(false)

    async function loadRank() {
      loading.value = true
      try {
        if (activeTab.value === 'coins') {
          const res = await Api.getCoinsRank()
          coinsRank.value = res.data || []
        } else {
          const res = await Api.getWinsRank()
          winsRank.value = res.data || []
        }
      } catch (e) {
        console.error(e)
      } finally {
        loading.value = false
      }
    }

    onMounted(loadRank)

    function switchTab(tab) {
      activeTab.value = tab
      loadRank()
    }

    const currentList = computed(() => {
      return activeTab.value === 'coins' ? coinsRank.value : winsRank.value
    })

    return { activeTab, currentList, loading, switchTab }
  },
  template: `
    <div class="rank-page">
      <h2 class="page-title">🏆 排行榜</h2>
      <div class="tabs">
        <button :class="['tab', { active: activeTab === 'coins' }]" @click="switchTab('coins')">💰 金币排行</button>
        <button :class="['tab', { active: activeTab === 'wins' }]" @click="switchTab('wins')">🎖️ 胜场排行</button>
      </div>
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else class="rank-table-wrap">
        <table class="rank-table">
          <thead>
            <tr>
              <th>排名</th>
              <th>玩家</th>
              <th>{{ activeTab === 'coins' ? '金币' : '胜场' }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in currentList" :key="index">
              <td>
                <span v-if="index === 0" class="rank-medal gold">🥇</span>
                <span v-else-if="index === 1" class="rank-medal silver">🥈</span>
                <span v-else-if="index === 2" class="rank-medal bronze">🥉</span>
                <span v-else class="rank-num">{{ index + 1 }}</span>
              </td>
              <td>{{ item.nickname || item.username }}</td>
              <td>{{ activeTab === 'coins' ? item.coins : item.wins }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="currentList.length === 0" class="empty">暂无排行数据</div>
      </div>
    </div>
  `
}
