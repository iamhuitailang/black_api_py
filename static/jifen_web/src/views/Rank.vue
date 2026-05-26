<template>
  <div class="rank-container">
    <div class="page-header">
      <div class="header-content">
        <h1>🏆 积分排行榜</h1>
      </div>
    </div>

    <div class="main-content">
      <div class="top-three" v-if="rankList.length >= 3">
        <div class="rank-item second">
          <div class="avatar">🥈</div>
          <div class="info">
            <div class="name">{{ rankList[1]?.nickname }}</div>
            <div class="points">{{ rankList[1]?.total_points }} 积分</div>
          </div>
        </div>
        <div class="rank-item first">
          <div class="crown">👑</div>
          <div class="avatar">🥇</div>
          <div class="info">
            <div class="name">{{ rankList[0]?.nickname }}</div>
            <div class="points">{{ rankList[0]?.total_points }} 积分</div>
          </div>
        </div>
        <div class="rank-item third">
          <div class="avatar">🥉</div>
          <div class="info">
            <div class="name">{{ rankList[2]?.nickname }}</div>
            <div class="points">{{ rankList[2]?.total_points }} 积分</div>
          </div>
        </div>
      </div>

      <div class="rank-list">
        <div 
          v-for="(item, index) in rankList.slice(3)" 
          :key="item.id"
          class="rank-row"
        >
          <span class="rank-num">{{ index + 4 }}</span>
          <span class="rank-name">{{ item.nickname }}</span>
          <span class="rank-points">{{ item.total_points }} 积分</span>
        </div>
        <div v-if="rankList.length === 0" class="empty-state">
          暂无排行数据
        </div>
      </div>

      <div class="my-rank" v-if="myRank && userStore.isLogin">
        <span class="label">我的排名</span>
        <span class="rank-num">第 {{ myRank.rank }} 名</span>
        <span class="points">{{ myRank.total_points }} 积分</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { userApi } from '@/api/user'

const userStore = useUserStore()
const rankList = ref<any[]>([])
const myRank = ref<any>(null)

onMounted(async () => {
  await loadRankList()
  if (userStore.isLogin) {
    await loadMyRank()
  }
})

async function loadRankList() {
  try {
    const res: any = await userApi.getPointsRank(50)
    rankList.value = res.data
  } catch (error) {
    console.error(error)
  }
}

async function loadMyRank() {
  try {
    const res: any = await userApi.getMyRank()
    myRank.value = res.data
  } catch (error) {
    console.error(error)
  }
}
</script>

<style scoped>
.rank-container {
  min-height: 100vh;
}

.page-header {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: white;
  padding: 20px 0;
}

.header-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

.main-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.top-three {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 20px;
  margin-bottom: 30px;
  padding: 30px 0;
}

.rank-item {
  text-align: center;
  padding: 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(255, 140, 0, 0.15);
  width: 140px;
}

.rank-item.first {
  order: 2;
  transform: scale(1.1);
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: white;
}

.rank-item.second {
  order: 1;
}

.rank-item.third {
  order: 3;
}

.crown {
  font-size: 24px;
  margin-bottom: 5px;
}

.avatar {
  font-size: 48px;
  margin-bottom: 10px;
}

.info .name {
  font-weight: 600;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.info .points {
  color: #FF8C00;
  font-size: 14px;
}

.rank-item.first .info .points {
  color: white;
}

.rank-list {
  background: white;
  border-radius: 16px;
  padding: 10px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.rank-row {
  display: flex;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.rank-row:last-child {
  border-bottom: none;
}

.rank-num {
  width: 50px;
  font-weight: 600;
  color: #999;
}

.rank-name {
  flex: 1;
  font-weight: 500;
}

.rank-points {
  color: #FF8C00;
  font-weight: 600;
}

.my-rank {
  margin-top: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #FFF8DC, #FFE4B5);
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.my-rank .label {
  color: #666;
}

.my-rank .rank-num {
  font-size: 20px;
  font-weight: 700;
  color: #FF8C00;
}

.my-rank .points {
  margin-left: auto;
  font-weight: 600;
  color: #FF8C00;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>
