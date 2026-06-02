const AdminDashboardPage = {
  template: `
    <div class="admin-page">
      <h2>管理后台 - 仪表盘</h2>
      <div class="dashboard-grid">
        <div class="dash-card">
          <div class="dash-value">{{ stats.total_users || 0 }}</div>
          <div class="dash-label">总用户数</div>
        </div>
        <div class="dash-card">
          <div class="dash-value">{{ stats.total_games || 0 }}</div>
          <div class="dash-label">总对局数</div>
        </div>
        <div class="dash-card">
          <div class="dash-value">{{ stats.active_games || 0 }}</div>
          <div class="dash-label">进行中对局</div>
        </div>
        <div class="dash-card">
          <div class="dash-value">{{ stats.today_games || 0 }}</div>
          <div class="dash-label">今日对局</div>
        </div>
        <div class="dash-card">
          <div class="dash-value">{{ stats.online_users || 0 }}</div>
          <div class="dash-label">在线用户</div>
        </div>
        <div class="dash-card">
          <div class="dash-value">{{ stats.today_new_users || 0 }}</div>
          <div class="dash-label">今日新用户</div>
        </div>
      </div>

      <div class="admin-section">
        <h3>最近对局</h3>
        <div class="recent-games">
          <div class="game-item" v-for="g in recentGames" :key="g.id">
            <span>{{ g.red_player_name || '红方' }} VS {{ g.black_player_name || '黑方' }}</span>
            <span>{{ g.status === 'finished' ? '已结束' : '进行中' }}</span>
            <span>{{ formatTime(g.created_at) }}</span>
          </div>
          <div class="empty-list" v-if="recentGames.length === 0">暂无数据</div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const stats = Vue.reactive({
      total_users: 0, total_games: 0, active_games: 0,
      today_games: 0, online_users: 0, today_new_users: 0
    });
    const recentGames = Vue.ref([]);

    async function loadDashboard() {
      try {
        const res = await XiangqiApi.adminGetDashboard();
        if (res.code === 0 && res.data) {
          Object.assign(stats, res.data.stats || {});
        }
      } catch (e) { /* ignore */ }
    }

    async function loadRecentGames() {
      try {
        const res = await XiangqiApi.adminGetRecentGames();
        if (res.code === 0) recentGames.value = res.data || [];
      } catch (e) { /* ignore */ }
    }

    function formatTime(ts) {
      if (!ts) return '';
      const d = new Date(ts);
      return d.getMonth() + 1 + '/' + d.getDate() + ' ' + d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
    }

    Vue.onMounted(() => {
      loadDashboard();
      loadRecentGames();
    });

    return { stats, recentGames, formatTime };
  }
};

window.AdminDashboardPage = AdminDashboardPage;
