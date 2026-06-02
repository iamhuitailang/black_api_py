const AdminLeaderboardPage = {
  template: `
    <div class="admin-page">
      <h2>管理后台 - 排行榜</h2>
      <div class="admin-toolbar">
        <select v-model="period">
          <option value="total">总榜</option>
          <option value="month">月榜</option>
          <option value="week">周榜</option>
        </select>
        <button class="btn btn-sm btn-primary" @click="loadLeaderboard">刷新</button>
      </div>
      <div class="admin-table">
        <div class="table-header">
          <span class="col-rank">排名</span>
          <span class="col-username">用户名</span>
          <span class="col-nickname">昵称</span>
          <span class="col-score">积分</span>
          <span class="col-win">胜</span>
          <span class="col-lose">负</span>
          <span class="col-draw">和</span>
        </div>
        <div class="table-row" v-for="(item, index) in list" :key="item.user_id || index">
          <span class="col-rank">{{ index + 1 }}</span>
          <span class="col-username">{{ item.username || '-' }}</span>
          <span class="col-nickname">{{ item.nickname || '-' }}</span>
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

    async function loadLeaderboard() {
      try {
        const res = await XiangqiApi.adminGetLeaderboard({ period: period.value });
        if (res.code === 0) list.value = res.data || [];
      } catch (e) { /* ignore */ }
    }

    Vue.onMounted(() => {
      loadLeaderboard();
    });

    return { period, list, loadLeaderboard };
  }
};

window.AdminLeaderboardPage = AdminLeaderboardPage;
