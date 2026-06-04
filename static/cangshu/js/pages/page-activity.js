window.ActivityPage = {
  template: `
    <div class="page activity-page">
      <div class="top-bar">
        <button class="back-btn" @click="navigateTo('lobby')">←</button>
        <span class="top-title">活动中心</span>
        <div class="currency-info">
          <span class="coins">🪙 {{ GameStore.get('coins') }}</span>
        </div>
      </div>

      <div class="activity-content">
        <div class="activity-card daily-card">
          <div class="card-header">
            <span class="card-icon">🎁</span>
            <span class="card-title">每日奖励</span>
          </div>
          <div class="card-body">
            <div class="reward-info">每日登录可领取 🪙 100 金币 + 随机道具 ×1</div>
            <div v-if="dailyClaimed" class="claimed-badge">✅ 今日已领取</div>
            <button
              v-else
              class="claim-btn"
              @click="claimDailyReward"
            >领取奖励</button>
            <div v-if="dailyRewardResult" class="reward-result">
              <span>获得 🪙 {{ dailyRewardResult.coins }} 金币</span>
              <span>获得 {{ getPropIcon(dailyRewardResult.prop) }} {{ getPropName(dailyRewardResult.prop) }} ×1</span>
            </div>
          </div>
        </div>

        <div class="activity-card seasonal-card">
          <div class="card-header">
            <span class="card-icon">🏔️</span>
            <span class="card-title">冬季锦标赛</span>
            <span class="card-badge">限时</span>
          </div>
          <div class="card-body">
            <div class="seasonal-desc">完成3场对战即可获得额外奖励！</div>
            <div class="progress-section">
              <div class="progress-label">进度 {{ seasonalProgress }} / 3</div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: Math.min(seasonalProgress / 3 * 100, 100) + '%' }"></div>
              </div>
            </div>
            <div class="seasonal-reward">奖励：🪙 300 金币 + 💎 5 宝石</div>
            <button
              v-if="seasonalProgress >= 3 && !seasonalClaimed"
              class="claim-btn"
              @click="claimSeasonalReward"
            >领取奖励</button>
            <div v-if="seasonalClaimed" class="claimed-badge">✅ 已领取</div>
          </div>
        </div>

        <div class="section-title">🎯 挑战任务</div>

        <div
          v-for="challenge in challenges"
          :key="challenge.id"
          class="activity-card challenge-card"
        >
          <div class="card-header">
            <span class="card-icon">{{ challenge.icon }}</span>
            <div class="card-title-group">
              <span class="card-title">{{ challenge.name }}</span>
              <span class="card-desc">{{ challenge.desc }}</span>
            </div>
          </div>
          <div class="card-body">
            <div class="progress-section">
              <div class="progress-label">{{ challenge.progressText }}</div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: Math.min(challenge.progressPercent, 100) + '%' }"
                ></div>
              </div>
            </div>
            <div class="challenge-footer">
              <span class="challenge-reward">奖励：🪙 {{ challenge.reward }}</span>
              <button
                v-if="challenge.completed && !challenge.claimed"
                class="claim-btn"
                @click="claimChallenge(challenge.id)"
              >领取</button>
              <span v-if="challenge.claimed" class="claimed-badge">✅ 已领取</span>
            </div>
          </div>
        </div>
      </div>

      <div class="bottom-nav">
        <div class="nav-item" @click="navigateTo('lobby')">
          <span class="nav-icon">🏠</span>
          <span class="nav-label">大厅</span>
        </div>
        <div class="nav-item" @click="navigateTo('shop')">
          <span class="nav-icon">🛒</span>
          <span class="nav-label">商店</span>
        </div>
        <div class="nav-item" @click="navigateTo('dress')">
          <span class="nav-icon">👗</span>
          <span class="nav-label">装扮</span>
        </div>
        <div class="nav-item active" @click="navigateTo('activity')">
          <span class="nav-icon">🎉</span>
          <span class="nav-label">活动</span>
        </div>
        <div class="nav-item" @click="navigateTo('profile')">
          <span class="nav-icon">👤</span>
          <span class="nav-label">我的</span>
        </div>
      </div>
    </div>
  `,

  data: function () {
    var today = new Date().toISOString().slice(0, 10);
    return {
      dailyClaimed: GameStore.get('dailyRewardClaimed') === today,
      dailyRewardResult: null,
      seasonalClaimed: false,
      claimedChallenges: [],
      GameStore: GameStore
    };
  },

  computed: {
    seasonalProgress: function () {
      return GameStore.get('stats').totalGames;
    },

    challenges: function () {
      var stats = GameStore.get('stats');
      var self = this;
      var list = [
        {
          id: 'snowball_master',
          icon: '⛄',
          name: '雪球大师',
          desc: '单局雪球达到60',
          reward: 500,
          current: stats.biggestSnowball,
          target: 60,
          progressText: stats.biggestSnowball + ' / 60',
          progressPercent: Math.min(stats.biggestSnowball / 60 * 100, 100),
          completed: stats.biggestSnowball >= 60,
          claimed: self.claimedChallenges.indexOf('snowball_master') !== -1
        },
        {
          id: 'quick_win',
          icon: '⚡',
          name: '速战速决',
          desc: '在60秒内赢得一局',
          reward: 300,
          current: 0,
          target: 1,
          progressText: '需要在对战中达成',
          progressPercent: 0,
          completed: false,
          claimed: self.claimedChallenges.indexOf('quick_win') !== -1
        },
        {
          id: 'prop_frenzy',
          icon: '🎒',
          name: '道具狂魔',
          desc: '单局使用5个道具',
          reward: 200,
          current: 0,
          target: 5,
          progressText: '需要在对战中达成',
          progressPercent: 0,
          completed: false,
          claimed: self.claimedChallenges.indexOf('prop_frenzy') !== -1
        },
        {
          id: 'undefeated',
          icon: '👑',
          name: '不败传说',
          desc: '连续赢5场',
          reward: 1000,
          current: stats.wins >= 5 ? 5 : 0,
          target: 5,
          progressText: Math.min(stats.wins, 5) + ' / 5',
          progressPercent: Math.min(stats.wins / 5 * 100, 100),
          completed: stats.wins >= 5,
          claimed: self.claimedChallenges.indexOf('undefeated') !== -1
        }
      ];
      return list;
    }
  },

  methods: {
    navigateTo: function (route) {
      GameRouter.navigate(route);
    },

    claimDailyReward: function () {
      var result = GameStore.claimDailyReward();
      if (result) {
        this.dailyClaimed = true;
        this.dailyRewardResult = result;
      }
    },

    getPropName: function (propKey) {
      var def = GameStore.PROP_DEFS[propKey];
      return def ? def.name : propKey;
    },

    getPropIcon: function (propKey) {
      var def = GameStore.PROP_DEFS[propKey];
      return def ? def.icon : '📦';
    },

    checkChallenge: function (challengeId) {
      var stats = GameStore.get('stats');
      if (challengeId === 'snowball_master') return stats.biggestSnowball >= 60;
      if (challengeId === 'undefeated') return stats.wins >= 5;
      return false;
    },

    claimChallenge: function (id) {
      if (this.claimedChallenges.indexOf(id) !== -1) return;
      var rewards = {
        snowball_master: 500,
        quick_win: 300,
        prop_frenzy: 200,
        undefeated: 1000
      };
      var reward = rewards[id] || 0;
      if (reward > 0) {
        GameStore.addCoins(reward);
        this.claimedChallenges.push(id);
      }
    }
  }
};
