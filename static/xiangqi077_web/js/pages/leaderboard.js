const LeaderboardPage = {
  template: `
    <div class="leaderboard-page">
      <h2>排行榜</h2>
      <div class="tab-bar">
        <button class="tab-btn" :class="{ active: period === 'total' }" @click="switchPeriod('total')">总榜</button>
        <button class="tab-btn" :class="{ active: period === 'month' }" @click="switchPeriod('month')">月榜</button>
        <button class="tab-btn" :class="{ active: period === 'week' }" @click="switchPeriod('week')">周榜</button>
      </div>
      <div class="leaderboard-table">
        <div class="table-header">
          <span class="col-rank">排名</span>
          <span class="col-name">昵称</span>
          <span class="col-score">积分</span>
          <span class="col-win">胜</span>
          <span class="col-lose">负</span>
          <span class="col-draw">和</span>
        </div>
        <div class="table-row" v-for="(item, index) in list" :key="item.user_id || index">
          <span class="col-rank" :class="'rank-' + (index + 1)">{{ index + 1 }}</span>
          <span class="col-name">{{ item.nickname || item.username || '未知' }}</span>
          <span class="col-score">{{ item.score || 0 }}</span>
          <span class="col-win">{{ item.wins || 0 }}</span>
          <span class="col-lose">{{ item.losses || 0 }}</span>
          <span class="col-draw">{{ item.draws || 0 }}</span>
        </div>
        <div class="empty-list" v-if="list.length === 0">暂无数据</div>
      </div>
    </div>
  `,
  setup() {
    const period = Vue.ref('total');
    const list = Vue.ref([]);

    async function loadList() {
      try {
        const res = await XiangqiApi.getLeaderboard({ period: period.value });
        if (res.code === 0) list.value = res.data || [];
      } catch (e) { /* ignore */ }
    }

    function switchPeriod(p) {
      period.value = p;
      loadList();
    }

    Vue.onMounted(() => {
      loadList();
    });

    return { period, list, switchPeriod };
  }
};

window.LeaderboardPage = LeaderboardPage;
