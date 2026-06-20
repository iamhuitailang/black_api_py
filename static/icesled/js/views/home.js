const HomeView = {
  template: `
    <div>
      <div v-if="hasSavedRace" class="saved-race-banner" @click="goToSavedRace">
        <span>🎬 发现一场未看完的比赛，点击继续观看 →</span>
      </div>

      <section class="hero">
        <h1>🏂 冰川赛道冰橇竞速</h1>
        <p>驾驶冰橇在极地冰川赛道上高速滑行，躲避裂缝、征服弯道、借助加速坡一飞冲天！挑战3位AI对手，争夺冠军宝座！</p>
        <div class="hero-buttons">
          <button class="btn btn-accent" @click="$router.push('/race')">🚀 立即开始</button>
          <button class="btn" @click="$router.push('/tracks')">🛤️ 浏览赛道</button>
          <button class="btn" @click="$router.push('/history')">📜 比赛记录</button>
        </div>
      </section>

      <h2 class="page-title">🎮 游戏玩法</h2>
      <p class="page-subtitle">掌握规则，方能驰骋冰川！</p>
      <div class="feature-grid">
        <div class="feature-card">
          <div class="feature-icon">🌀</div>
          <h3>弯道挑战</h3>
          <p>在弯道处需要提前转向，否则将撞墙！撞墙损失 <strong>30+10=40速度</strong>。弯道难度越高，减速越明显。</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🕳️</div>
          <h3>冰裂区域</h3>
          <p>经过冰裂区必须跳跃，否则掉入裂缝！掉缝将 <strong>损失3秒</strong> 时间并大幅减速。</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">⚡</div>
          <h3>加速坡道</h3>
          <p>利用加速坡获得 <strong>+20速度</strong>，最高速度可达 150km/h！</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🤖</div>
          <h3>AI 对手</h3>
          <p>与3位不同风格的AI对决：<strong>激进型、稳健型、随机型</strong>，各有所长。</p>
        </div>
      </div>

      <div class="card">
        <div class="card-title">📋 积分规则</div>
        <div class="rules-list">
          <div class="rule-item rule-success">
            🥇 <strong>第1名</strong>：获得 <strong>50分</strong>，全场荣耀！
          </div>
          <div class="rule-item rule-warning">
            🥈 <strong>第2名</strong>：获得 <strong>30分</strong>，实力不俗！
          </div>
          <div class="rule-item">
            🥉 <strong>第3名</strong>：获得 <strong>15分</strong>，继续努力！
          </div>
          <div class="rule-item rule-danger">
            💥 <strong>初始速度</strong> 60 km/h，<strong>最高速度</strong> 150 km/h
          </div>
          <div class="rule-item rule-danger">
            🧱 <strong>撞墙惩罚</strong>：速度立即降低 30 + 额外 10 点
          </div>
          <div class="rule-item rule-danger">
            ⏱️ <strong>掉缝惩罚</strong>：时间损失 3 秒，速度减半
          </div>
        </div>
      </div>

      <div class="card" v-if="stats">
        <div class="card-title">📊 我的战绩</div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ stats.total_races || 0 }}</div>
            <div class="stat-label">总场次</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats.wins || 0 }}</div>
            <div class="stat-label">冠军次数</div>
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
            <div class="stat-label">最佳成绩</div>
          </div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const stats = ref(null);
    const hasSavedRace = ref(false);
    const loadStats = async () => {
      try {
        const res = await IceSledAPI.getPlayerStats(appState.playerName);
        if (res.code === 0) stats.value = res.data;
      } catch (e) {}
    };
    const checkSavedRace = () => {
      try {
        const raw = localStorage.getItem('icesled_race_state');
        if (raw) {
          const state = JSON.parse(raw);
          if (state && state.raceData && Date.now() - (state.timestamp || 0) < 10 * 60 * 1000) {
            hasSavedRace.value = true;
            return;
          }
        }
      } catch (e) {}
      hasSavedRace.value = false;
    };
    const goToSavedRace = () => {
      window.location.hash = '#/race';
    };
    onMounted(() => {
      loadStats();
      checkSavedRace();
      window.addEventListener('storage', checkSavedRace);
    });
    watch(() => appState.playerName, loadStats);
    return {
      stats, hasSavedRace, goToSavedRace,
      appState,
      formatTime: Utils.formatTime,
    };
  }
};
