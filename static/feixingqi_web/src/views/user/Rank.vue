<template>
  <div class="page-container">
    <div class="header game-card">
      <div class="header-left">
        <el-button @click="goBack"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
        <h1 class="title">🏆 排行榜</h1>
      </div>
    </div>

    <div class="main-content">
      <div class="my-rank game-card" v-if="myRank">
        <h3>我的排名</h3>
        <div class="my-rank-info">
          <div class="rank-number" :class="'rank-' + myRank.rank">{{ myRank.rank }}</div>
          <div class="rank-avatar">{{ myRank.nickname?.charAt(0) }}</div>
          <div class="rank-info">
            <div class="name">{{ myRank.nickname }}</div>
            <div class="stats">
              <span>积分: <strong>{{ myRank.score }}</strong></span>
              <span>胜率: <strong>{{ myRank.win_rate }}%</strong></span>
              <span>{{ myRank.wins }}胜/{{ myRank.losses }}负</span>
            </div>
          </div>
        </div>
      </div>

      <div class="rank-list game-card">
        <el-table :data="ranks" v-loading="loading">
          <el-table-column label="排名" width="80" align="center">
            <template #default="{ $index }">
              <span :class="'rank-badge rank-' + ($index + 1)">
                <span v-if="$index < 3">{{ ['🥇', '🥈', '🥉'][$index] }}</span>
                <span v-else>{{ $index + 1 }}</span>
              </span>
            </template>
          </el-table-column>
          <el-table-column label="玩家">
            <template #default="{ row }">
              <div class="player-info-cell">
                <div class="avatar">{{ row.nickname?.charAt(0) }}</div>
                <span>{{ row.nickname }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="score" label="积分" width="120" sortable />
          <el-table-column label="胜/负" width="120">
            <template #default="{ row }">{{ row.wins }} / {{ row.losses }}</template>
          </el-table-column>
          <el-table-column label="胜率" width="120">
            <template #default="{ row }">
              <el-progress :percentage="row.win_rate" :show-text="true" />
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="loadRanks"
          class="pagination"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getRankList, getUserRank } from '@/api'
import { getUser } from '@/utils/storage'

const router = useRouter()
const user = getUser()
const ranks = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const myRank = ref(null)

const loadRanks = async () => {
  loading.value = true
  try {
    const data = await getRankList({ page: page.value, page_size: pageSize.value })
    ranks.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

const loadMyRank = async () => {
  try {
    myRank.value = await getUserRank(user.id)
  } catch (e) {}
}

const goBack = () => router.push('/')

onMounted(() => {
  loadRanks()
  loadMyRank()
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
.title {
  margin: 0;
  font-size: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.main-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.my-rank {
  padding: 24px;
}
.my-rank h3 {
  margin-bottom: 16px;
  color: #333;
}
.my-rank-info {
  display: flex;
  align-items: center;
  gap: 20px;
}
.rank-number {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  background: #f0f0f0;
  color: #666;
}
.rank-1 { background: linear-gradient(135deg, #ffd700, #ffaa00); color: white; }
.rank-2 { background: linear-gradient(135deg, #c0c0c0, #a0a0a0); color: white; }
.rank-3 { background: linear-gradient(135deg, #cd7f32, #b8860b); color: white; }
.rank-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
}
.rank-info {
  flex: 1;
}
.rank-info .name {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
}
.rank-info .stats {
  display: flex;
  gap: 20px;
  color: #666;
}
.rank-info .stats strong {
  color: #667eea;
}
.rank-list {
  padding: 24px;
}
.player-info-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.player-info-cell .avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}
.rank-badge {
  display: inline-block;
  width: 32px;
  height: 32px;
  line-height: 32px;
  text-align: center;
  border-radius: 50%;
  background: #f0f0f0;
  font-weight: bold;
}
.pagination {
  margin-top: 20px;
  justify-content: center;
}
</style>
