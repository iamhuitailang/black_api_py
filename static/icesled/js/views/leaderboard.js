const LeaderboardView = {
  template: `
    <div>
      <div class="section-header">
        <div>
          <h1 class="page-title">🏆 最快记录排行榜</h1>
          <p class="page-subtitle">看看谁是冰川赛道的速度之王！</p>
        </div>
        <button class="btn btn-secondary" @click="loadData">🔄 刷新</button>
      </div>

      <div class="card">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ stats.total_races || 0 }}</div>
            <div class="stat-label">总场次</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats.wins || 0 }}</div>
            <div class="stat-label">冠军</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats.win_rate || 0 }}%</div>
            <div class="stat-label">胜率</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats.total_score || 0 }}</div>
            <div class="stat-label">累计积分</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ formatTime(stats.best_time) }}</div>
            <div class="stat-label">个人最佳</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">🥇 玩家最快记录 TOP {{ limit }}</div>
        <div v-if="loading" class="loading">
          <div class="loading-spinner"></div>
          <p>加载排行榜...</p>
        </div>
        <table v-else-if="leaderboard.length" class="results-table">
          <thead>
            <tr>
              <th style="width:60px;">排名</th>
              <th>选手</th>
              <th>用时</th>
              <th>最终速度</th>
              <th>赛道</th>
              <th>日期</th>
              <th>失误</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in leaderboard" :key="i"
                :class="i < 3 ? 'rank-' + (i + 1) : ''">
              <td>
                <span v-if="i < 3" class="rank-medal" :class="'rank-' + (i+1) + '-medal'">
                  {{ i + 1 }}
                </span>
                <span v-else style="font-weight:700; color:var(--text-light);">#{{ i + 1 }}</span>
              </td>
              <td style="font-weight:700;">
                {{ r.racer_name }}
              </td>
              <td style="font-family:monospace; font-weight:800; color:var(--primary-dark); font-size:15px;">
                ⏱️ {{ formatTime(r.total_time) }}
              </td>
              <td>{{ formatSpeed(r.final_speed) }}</td>
              <td style="font-size:13px;">{{ r.track_name }}</td>
              <td style="font-size:12px; color:var(--text-light);">
                {{ formatShort(r.race_date) }}
              </td>
              <td>
                <div class="event-counts">
                  <span class="event-tag wall" v-if="r.wall_hit_count">🧱{{ r.wall_hit_count }}</span>
                  <span class="event-tag crack" v-if="r.crack_fall_count">🕳️{{ r.crack_fall_count }}</span>
                  <span v-if="!r.wall_hit_count && !r.crack_fall_count"
                        style="font-size:11px; color: var(--success); font-weight:600;">
                    ✅ 完美
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">
          <div class="empty-state-icon">🏁</div>
          <p>暂无记录，快去创造第一名吧！</p>
          <button class="btn btn-primary" @click="$router.push('/race')">立即挑战</button>
        </div>
      </div>
    </div>
  `,
  setup() {
    const loading = ref(true);
    const leaderboard = ref([]);
    const stats = ref({});
    const limit = 20;

    const loadData = async () => {
      loading.value = true;
      try {
        const [lbRes, stRes] = await Promise.all([
          IceSledAPI.getLeaderboard(limit),
          IceSledAPI.getPlayerStats(appState.playerName)
        ]);
        if (lbRes.code === 0 && lbRes.data) {
          leaderboard.value = lbRes.data.items || [];
        }
        if (stRes.code === 0 && stRes.data) {
          stats.value = stRes.data;
        }
      } finally {
        loading.value = false;
      }
    };

    onMounted(loadData);

    return {
      loading, leaderboard, stats, limit,
      loadData,
      formatTime: Utils.formatTime,
      formatSpeed: Utils.formatSpeed,
      formatShort(d) {
        if (!d) return '';
        try {
          const dt = new Date(d);
          return dt.toLocaleString('zh-CN', {
            month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
          });
        } catch { return d; }
      },
    };
  }
};
