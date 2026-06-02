const AdminStatsPage = {
  template: `
    <div class="admin-page">
      <h2>管理后台 - 数据统计</h2>

      <div class="admin-section">
        <h3>对局类型统计</h3>
        <div class="stats-grid">
          <div class="stat-card" v-for="(val, key) in gameTypeStats" :key="key">
            <div class="stat-value">{{ val }}</div>
            <div class="stat-label">{{ key }}</div>
          </div>
        </div>
      </div>

      <div class="admin-section">
        <h3>总体统计</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ overallStats.total_users || 0 }}</div>
            <div class="stat-label">总用户数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ overallStats.total_games || 0 }}</div>
            <div class="stat-label">总对局数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ overallStats.avg_game_duration || 0 }}分钟</div>
            <div class="stat-label">平均对局时长</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ overallStats.red_win_rate || '0%' }}</div>
            <div class="stat-label">红方胜率</div>
          </div>
        </div>
      </div>

      <div class="admin-section">
        <h3>近期趋势</h3>
        <div class="trend-list">
          <div class="trend-item" v-for="item in trends" :key="item.date">
            <span class="trend-date">{{ item.date }}</span>
            <span class="trend-games">对局: {{ item.games || 0 }}</span>
            <span class="trend-users">新用户: {{ item.new_users || 0 }}</span>
          </div>
          <div class="empty-list" v-if="trends.length === 0">暂无数据</div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const gameTypeStats = Vue.reactive({});
    const overallStats = Vue.reactive({});
    const trends = Vue.ref([]);

    async function loadStats() {
      try {
        const res = await XiangqiApi.adminGetStats();
        if (res.code === 0 && res.data) {
          Object.assign(overallStats, res.data.overall || {});
          if (res.data.trends) trends.value = res.data.trends;
        }
      } catch (e) { /* ignore */ }
    }

    async function loadGameTypeStats() {
      try {
        const res = await XiangqiApi.adminGetGameTypeStats();
        if (res.code === 0 && res.data) {
          Object.assign(gameTypeStats, res.data);
        }
      } catch (e) { /* ignore */ }
    }

    Vue.onMounted(() => {
      loadStats();
      loadGameTypeStats();
    });

    return { gameTypeStats, overallStats, trends };
  }
};

window.AdminStatsPage = AdminStatsPage;
