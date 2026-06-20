const TracksView = {
  template: `
    <div>
      <div class="section-header">
        <div>
          <h1 class="page-title">🛤️ 赛道模板</h1>
          <p class="page-subtitle">选择一条赛道开启冒险，或生成全新的随机赛道！</p>
        </div>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button class="btn btn-secondary"
                  :class="{ active: filter === 'all' }"
                  @click="filter = 'all'">全部</button>
          <button class="btn btn-secondary"
                  :class="{ active: filter === 'easy' }"
                  @click="filter = 'easy'">新手级</button>
          <button class="btn btn-secondary"
                  :class="{ active: filter === 'normal' }"
                  @click="filter = 'normal'">标准级</button>
          <button class="btn btn-secondary"
                  :class="{ active: filter === 'hard' }"
                  @click="filter = 'hard'">大师级</button>
          <button class="btn btn-primary" @click="genTrack">✨ 生成新赛道</button>
        </div>
      </div>

      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>加载赛道中...</p>
      </div>

      <div v-else class="track-grid">
        <div v-for="track in filteredTracks" :key="track.id"
             class="track-card"
             @click="$router.push('/race/' + track.id)">
          <div class="track-header">
            <h3>{{ track.name }}</h3>
            <div class="track-stats">
              <span class="track-stat">📏 {{ track.total_length }}m</span>
              <span class="track-stat">🌀 {{ (track.curve_ratio * 100).toFixed(1) }}%弯道</span>
              <span class="difficulty-badge" :class="getDiffClass(track.difficulty)">
                {{ getDiffLabel(track.difficulty) }}
              </span>
            </div>
          </div>
          <div class="track-body">
            <div class="track-visual">
              <div class="track-segments">
                <div v-for="(seg, i) in track.segments" :key="i"
                     class="track-segment"
                     :style="{ width: (seg.length / track.total_length * 100) + '%',
                              background: getSegColor(seg.type) }"
                     :title="getSegTitle(seg)">
                  {{ getSegLabel(seg.type) }}
                </div>
              </div>
            </div>
            <div class="track-actions">
              <button class="btn btn-primary btn-block" @click.stop="$router.push('/race/' + track.id)">
                🏂 开始比赛
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!loading && filteredTracks.length === 0" class="empty-state card">
        <div class="empty-state-icon">❄️</div>
        <p>暂无符合条件的赛道，点击"生成新赛道"创建吧！</p>
      </div>
    </div>
  `,
  setup() {
    const tracks = ref([]);
    const loading = ref(true);
    const filter = ref('all');

    const filteredTracks = computed(() => {
      if (filter.value === 'all') return tracks.value;
      return tracks.value.filter(t => t.difficulty === filter.value);
    });

    const loadTracks = async () => {
      loading.value = true;
      try {
        const res = await IceSledAPI.getTrackList();
        if (res.code === 0 && res.data) {
          tracks.value = res.data.items || [];
        }
      } finally {
        loading.value = false;
      }
    };

    const genTrack = async () => {
      Utils.showToast('正在生成新赛道...');
      try {
        const diff = filter.value === 'all' ? 'normal' : filter.value;
        const res = await IceSledAPI.generateTrack(diff);
        if (res.code === 0) {
          Utils.showToast('赛道生成成功！', 'success');
          await loadTracks();
          if (res.data && res.data.id) {
            setTimeout(() => {
              // highlight the new track
            }, 100);
          }
        }
      } catch (e) {
        Utils.showToast('生成失败', 'error');
      }
    };

    onMounted(loadTracks);

    return {
      tracks, loading, filter, filteredTracks,
      genTrack,
      getDiffLabel: Utils.getDifficultyLabel,
      getDiffClass: Utils.getDifficultyClass,
      getSegColor: Utils.getSegmentColor,
      getSegLabel: Utils.getSegmentLabel,
      getSegTitle(seg) {
        if (seg.type === 'curve') return `弯道(${seg.direction}) 长度${seg.length}m 难度${seg.difficulty}`;
        if (seg.type === 'crack') return `冰裂区 长度${seg.length}m 共${seg.crack_count}处`;
        if (seg.type === 'boost') return `加速坡 长度${seg.length}m +${seg.boost_power}速度`;
        return `直道 长度${seg.length}m`;
      }
    };
  }
};
