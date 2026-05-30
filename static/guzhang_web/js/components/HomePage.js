const HomePage = {
  template: `
    <div class="home-container">
      <div class="home-header">
        <h1 class="home-title">喝彩争夺</h1>
        <div class="user-info">
          <div class="user-avatar">{{ store.user?.nickname?.charAt(0) || 'U' }}</div>
          <span>{{ store.user?.nickname || store.user?.username }}</span>
          <button class="btn-logout" @click="handleLogout">退出</button>
        </div>
      </div>
      
      <div class="home-content">
        <div class="game-card" @click="startGame">
          <h2>🎭 开始对战</h2>
          <p>操控舞台选手，抢夺全场观众喝彩值，成为舞台之王！</p>
          <button class="btn-start">开始游戏</button>
        </div>
        
        <div class="stats-card">
          <h2>📊 我的战绩</h2>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">{{ userStats.total_games || 0 }}</div>
              <div class="stat-label">总场次</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ userStats.total_wins || 0 }}</div>
              <div class="stat-label">胜利场次</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ winRate }}%</div>
              <div class="stat-label">胜率</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ userStats.highest_score || 0 }}</div>
              <div class="stat-label">最高喝彩</div>
            </div>
          </div>
        </div>

        <div class="game-card" @click="goToSettings">
          <h2>⚙️ 账号设置</h2>
          <p>修改密码、查看个人信息</p>
          <button class="btn-start">前往设置</button>
        </div>
      </div>
    </div>
  `,
  setup() {
    const userStats = Vue.ref({
      total_games: 0,
      total_wins: 0,
      highest_score: 0
    });

    const winRate = Vue.ref(0);

    const loadUserInfo = async () => {
      const result = await api.getUserInfo();
      if (result.code === 200) {
        userStats.value = result.data;
        if (result.data.total_games > 0) {
          winRate.value = Math.round((result.data.total_wins / result.data.total_games) * 100);
        }
      }
    };

    const startGame = () => {
      window.location.hash = '#/game';
    };

    const goToSettings = () => {
      window.location.hash = '#/settings';
    };

    const handleLogout = () => {
      store.logout();
      window.location.hash = '#/login';
    };

    Vue.onMounted(() => {
      if (!store.isLoggedIn()) {
        window.location.hash = '#/login';
        return;
      }
      loadUserInfo();
    });

    return {
      store,
      userStats,
      winRate,
      startGame,
      goToSettings,
      handleLogout
    };
  }
};
