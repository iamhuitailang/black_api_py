import { ref, onMounted } from 'vue'
import Api from '../api.js'
import Store from '../store.js'

export default {
  setup() {
    const achievements = ref([])
    const myAchievements = ref([])
    const loading = ref(false)

    async function loadAchievements() {
      loading.value = true
      try {
        const [allRes, myRes] = await Promise.all([
          Api.getAchievements(),
          Store.isLoggedIn ? Api.getMyAchievements() : Promise.resolve({ data: [] })
        ])
        achievements.value = allRes.data || []
        myAchievements.value = (myRes.data || []).map(a => a.id || a.achievementId)
      } catch (e) {
        console.error(e)
      } finally {
        loading.value = false
      }
    }

    function isUnlocked(id) {
      return myAchievements.value.includes(id)
    }

    onMounted(loadAchievements)

    return { achievements, myAchievements, loading, isUnlocked }
  },
  template: `
    <div class="achievement-page">
      <h2 class="page-title">🏅 成就系统</h2>
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else class="achievement-grid">
        <div v-for="item in achievements" :key="item.id" :class="['achievement-card', { unlocked: isUnlocked(item.id), locked: !isUnlocked(item.id) }]">
          <div class="achievement-icon">{{ isUnlocked(item.id) ? '🏅' : '🔒' }}</div>
          <h3>{{ item.name }}</h3>
          <p>{{ item.description }}</p>
          <span v-if="isUnlocked(item.id)" class="achievement-status unlocked-text">已解锁</span>
          <span v-else class="achievement-status locked-text">未解锁</span>
        </div>
      </div>
      <div v-if="!loading && achievements.length === 0" class="empty">暂无成就</div>
    </div>
  `
}
