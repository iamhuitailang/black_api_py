const HistoryView = {
  props: ['id'],
  template: `
    <div>
      <div class="section-header">
        <div>
          <h1 class="page-title">📜 比赛历史</h1>
          <p class="page-subtitle">回顾你的每一场冰川竞速冒险！</p>
        </div>
        <button class="btn btn-secondary" @click="loadData">🔄 刷新</button>
      </div>

      <div v-if="detailView" class="card">
        <div class="section-header" style="margin-bottom:16px;">
          <button class="btn btn-secondary" @click="detailView = null; loadData();">
            ← 返回列表
          </button>
          <h2 style="font-size:20px; font-weight:800;">
            🎯 比赛详情 · #{{ detailView.id }}
          </h2>
          <span class="race-info-badge">{{ formatDate(detailView.created_at) }}</span>
        </div>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr));
                    gap:12px; margin-bottom:16px;">
          <div class="stat-card">
            <div class="stat-value" style="font-size:24px;">{{ formatTime(detailView.total_time) }}</div>
            <div class="stat-label">总用时</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="font-size:24px;">🏆 {{ detailView.winner_name }}</div>
            <div class="stat-label">冠军</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="font-size:24px;">🛤️</div>
            <div class="stat-label">{{ detailView.track_name }}</div>
          </div>
        </div>

        <table class="results-table">
          <thead>
            <tr>
              <th style="width:60px;">名次</th>
              <th>选手</th>
              <th>类型</th>
              <th style="width:140px;">用时</th>
              <th style="width:120px;">最终速度</th>
              <th style="width:100px;">积分</th>
              <th>事故统计</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in detailView.racers" :key="r.id"
                :class="'rank-' + r.rank">
              <td>
                <span class="rank-medal" :class="'rank-' + r.rank + '-medal'">
                  {{ r.rank }}
                </span>
              </td>
              <td style="font-weight:700;">{{ r.racer_name }}</td>
              <td>
                <span style="font-size:12px;">
                  {{ getTypeIcon(r.racer_type === 'player' ? 'player' : r.racer_type) }}
                  {{ getTypeLabel(r.racer_type === 'player' ? 'player' : r.racer_type) }}
                </span>
              </td>
              <td style="font-family:monospace; font-weight:700; color:var(--primary-dark);">
                {{ formatTime(r.total_time) }}
              </td>
              <td>{{ formatSpeed(r.final_speed) }}</td>
              <td>
                <span class="score-badge" :class="{ zero: r.score === 0 }">
                  +{{ r.score }}
                </span>
              </td>
              <td>
                <div class="event-counts">
                  <span class="event-tag wall" v-if="r.wall_hit_count">🧱撞×{{ r.wall_hit_count }}</span>
                  <span class="event-tag crack" v-if="r.crack_fall_count">🕳️掉×{{ r.crack_fall_count }}</span>
                  <span class="event-tag boost" v-if="r.boost_count">⚡加×{{ r.boost_count }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <template v-else>
        <div v-if="loading" class="loading card">
          <div class="loading-spinner"></div>
          <p>加载历史记录...</p>
        </div>

        <div v-else-if="history.length === 0" class="empty-state card">
          <div class="empty-state-icon">🎿</div>
          <p>还没有比赛记录呢！</p>
          <button class="btn btn-primary" @click="$router.push('/race')">开始第一场比赛</button>
        </div>

        <div v-else>
          <div class="history-list">
            <div v-for="r in history" :key="r.id"
                 class="history-item"
                 @click="showDetail(r)">
              <div class="history-date">
                <div>{{ formatShort(r.created_at) }}</div>
                <small style="color: var(--text-lighter);">#{{ r.id }}</small>
              </div>
              <div class="history-info">
                <h4>🛤️ {{ r.track_name }}</h4>
                <p>
                  总用时 {{ formatTime(r.total_time) }} ·
                  共 {{ r.racers ? r.racers.length : 4 }} 人参赛
                </p>
              </div>
              <div class="history-winner">
                <span :class="r.winner_type === 'player' ? 'winner-tag-player' : 'winner-tag-ai'">
                  {{ r.winner_type === 'player' ? '🏆 玩家胜' : '🤖 AI胜' }}
                </span>
                <div style="font-size:12px; color: var(--text-light); text-align:right; margin-top:4px;">
                  {{ r.winner_name }}
                </div>
              </div>
            </div>
          </div>

          <div v-if="totalPages > 1" class="pagination">
            <button class="page-btn" :disabled="page === 1" @click="page = 1; loadData();">«</button>
            <button class="page-btn" :disabled="page === 1" @click="page--; loadData();">‹</button>
            <button v-for="p in pageNumbers" :key="p"
                    class="page-btn"
                    :class="{ active: p === page }"
                    @click="page = p; loadData();">
              {{ p }}
            </button>
            <button class="page-btn" :disabled="page === totalPages" @click="page++; loadData();">›</button>
            <button class="page-btn" :disabled="page === totalPages" @click="page = totalPages; loadData();">»</button>
          </div>
        </div>
      </template>
    </div>
  `,
  setup(props) {
    const { id } = props;
    const loading = ref(false);
    const history = ref([]);
    const detailView = ref(null);
    const page = ref(1);
    const pageSize = 15;
    const total = ref(0);

    const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)));
    const pageNumbers = computed(() => {
      const pages = [];
      const tp = totalPages.value;
      const cur = page.value;
      let start = Math.max(1, cur - 2);
      let end = Math.min(tp, start + 4);
      if (end - start < 4) start = Math.max(1, end - 4);
      for (let i = start; i <= end; i++) pages.push(i);
      return pages;
    });

    const loadData = async () => {
      loading.value = true;
      try {
        const res = await IceSledAPI.getHistory(page.value, pageSize);
        if (res.code === 0 && res.data) {
          history.value = res.data.items || [];
          total.value = res.data.total || 0;
        }
      } finally {
        loading.value = false;
      }
    };

    const showDetail = async (r) => {
      try {
        const res = await IceSledAPI.getRaceDetail(r.id);
        if (res.code === 0 && res.data) {
          detailView.value = res.data;
        }
      } catch {}
    };

    onMounted(() => {
      if (id) {
        showDetail({ id });
      } else {
        loadData();
      }
    });

    return {
      loading, history, detailView,
      page, totalPages, pageNumbers, total,
      loadData, showDetail,
      formatTime: Utils.formatTime,
      formatSpeed: Utils.formatSpeed,
      formatDate: Utils.formatDate,
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
      getTypeIcon: Utils.getTypeIcon,
      getTypeLabel: Utils.getTypeLabel,
    };
  }
};
