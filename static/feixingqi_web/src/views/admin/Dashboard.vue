<template>
  <div class="dashboard">
    <h2 class="page-title">📊 数据统计</h2>
    
    <div class="stats-grid">
      <div class="stat-card game-card">
        <div class="stat-icon users">👥</div>
        <div class="stat-info">
          <div class="stat-label">总用户数</div>
          <div class="stat-value">{{ stats?.total_users || 0 }}</div>
        </div>
      </div>
      <div class="stat-card game-card">
        <div class="stat-icon games">🎮</div>
        <div class="stat-info">
          <div class="stat-label">总游戏数</div>
          <div class="stat-value">{{ stats?.total_games || 0 }}</div>
        </div>
      </div>
      <div class="stat-card game-card">
        <div class="stat-icon winrate">📈</div>
        <div class="stat-info">
          <div class="stat-label">平均胜率</div>
          <div class="stat-value">{{ stats?.avg_win_rate || 0 }}%</div>
        </div>
      </div>
      <div class="stat-card game-card">
        <div class="stat-icon score">🏆</div>
        <div class="stat-info">
          <div class="stat-label">最高积分</div>
          <div class="stat-value">{{ stats?.top_score || 0 }}</div>
        </div>
      </div>
    </div>

    <div class="content-grid">
      <div class="rank-section game-card">
        <h3>🏆 排行榜 TOP 10</h3>
        <el-table :data="topRanks" v-loading="loading">
          <el-table-column label="排名" width="80" align="center">
            <template #default="{ $index }">
              <span v-if="$index < 3" class="medal">{{ ['🥇', '🥈', '🥉'][$index] }}</span>
              <span v-else>{{ $index + 1 }}</span>
            </template>
          </el-table-column>
          <el-table-column label="玩家">
            <template #default="{ row }">
              <div class="player-info">
                <div class="avatar">{{ row.nickname?.charAt(0) }}</div>
                <span>{{ row.nickname }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="score" label="积分" width="100" />
          <el-table-column label="胜率" width="120">
            <template #default="{ row }">{{ row.win_rate }}%</template>
          </el-table-column>
        </el-table>
      </div>

      <div class="recent-section game-card">
        <h3>🕐 最近游戏</h3>
        <el-table :data="recentGames" v-loading="loading">
          <el-table-column prop="room_code" label="房间号" width="100" />
          <el-table-column label="玩家数" width="80" align="center">
            <template #default="{ row }">{{ row.player_ids?.length || 0 }}</template>
          </el-table-column>
          <el-table-column label="胜者" width="120">
            <template #default="{ row }">
              <span v-if="row.winner_id">{{ getWinnerName(row.winner_id) }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="时间">
            <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getStatistics, getRankList, getGameRecords } from '@/api'

const stats = ref(null)
const topRanks = ref([])
const recentGames = ref([])
const loading = ref(false)

const loadStats = async () => {
  try {
    stats.value = await getStatistics()
  } catch (e) {}
}

const loadTopRanks = async () => {
  try {
    const data = await getRankList({ page: 1, page_size: 10 })
    topRanks.value = data.list
  } catch (e) {}
}

const loadRecentGames = async () => {
  try {
    const data = await getGameRecords({ page: 1, page_size: 10 })
    recentGames.value = data.list
  } catch (e) {}
}

const getWinnerName = (winnerId) => {
  const player = topRanks.value.find(p => p.user_id === winnerId)
  return player?.nickname || `玩家${winnerId}`
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

onMounted(() => {
  loadStats()
  loadTopRanks()
  loadRecentGames()
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
}
.page-title {
  margin: 0 0 20px 0;
  font-size: 24px;
  color: #333;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
}
.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}
.stat-icon.users { background: linear-gradient(135deg, #667eea, #764ba2); }
.stat-icon.games { background: linear-gradient(135deg, #f093fb, #f5576c); }
.stat-icon.winrate { background: linear-gradient(135deg, #4facfe, #00f2fe); }
.stat-icon.score { background: linear-gradient(135deg, #fa709a, #fee140); }
.stat-info {
  flex: 1;
}
.stat-label {
  font-size: 14px;
  color: #999;
  margin-bottom: 4px;
}
.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}
.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.rank-section, .recent-section {
  padding: 24px;
}
.rank-section h3, .recent-section h3 {
  margin-bottom: 20px;
  color: #333;
}
.medal {
  font-size: 20px;
}
.player-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 12px;
}
</style>
