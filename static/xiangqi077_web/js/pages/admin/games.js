const AdminGamesPage = {
  template: `
    <div class="admin-page">
      <h2>管理后台 - 对局管理</h2>
      <div class="admin-toolbar">
        <select v-model="filter.status">
          <option value="">全部状态</option>
          <option value="playing">进行中</option>
          <option value="finished">已结束</option>
          <option value="draw">和棋</option>
        </select>
        <select v-model="filter.game_type">
          <option value="">全部类型</option>
          <option value="pve">人机对战</option>
          <option value="pvp">在线对战</option>
        </select>
        <button class="btn btn-sm btn-primary" @click="loadGames">筛选</button>
      </div>
      <div class="admin-table">
        <div class="table-header">
          <span class="col-id">ID</span>
          <span class="col-type">类型</span>
          <span class="col-players">红方</span>
          <span class="col-players">黑方</span>
          <span class="col-status">状态</span>
          <span class="col-time">时间</span>
        </div>
        <div class="table-row" v-for="g in games" :key="g.id">
          <span class="col-id">{{ g.id }}</span>
          <span class="col-type">{{ g.game_type === 'pve' ? '人机' : '在线' }}</span>
          <span class="col-players">{{ g.red_player_name || '-' }}</span>
          <span class="col-players">{{ g.black_player_name || '-' }}</span>
          <span class="col-status">
            <span class="badge" :class="getGameBadge(g)">{{ getGameStatus(g) }}</span>
          </span>
          <span class="col-time">{{ formatTime(g.created_at) }}</span>
        </div>
        <div class="empty-list" v-if="games.length === 0">暂无对局数据</div>
      </div>
    </div>
  `,
  setup() {
    const games = Vue.ref([]);
    const filter = Vue.reactive({ status: '', game_type: '' });

    async function loadGames() {
      try {
        const params = {};
        if (filter.status) params.status = filter.status;
        if (filter.game_type) params.game_type = filter.game_type;
        const res = await XiangqiApi.adminGetGames(params);
        if (res.code === 0) games.value = res.data || [];
      } catch (e) { /* ignore */ }
    }

    function getGameStatus(g) {
      if (g.status === 'finished') return '已结束';
      if (g.status === 'draw') return '和棋';
      if (g.status === 'playing') return '进行中';
      return g.status || '等待中';
    }

    function getGameBadge(g) {
      if (g.status === 'finished') return 'badge-info';
      if (g.status === 'draw') return 'badge-warning';
      if (g.status === 'playing') return 'badge-success';
      return '';
    }

    function formatTime(ts) {
      if (!ts) return '';
      const d = new Date(ts);
      return d.getMonth() + 1 + '/' + d.getDate() + ' ' + d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
    }

    Vue.onMounted(() => {
      loadGames();
    });

    return { games, filter, loadGames, getGameStatus, getGameBadge, formatTime };
  }
};

window.AdminGamesPage = AdminGamesPage;
